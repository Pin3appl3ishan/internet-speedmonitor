"""Collector service for Internet Speed Monitor
Runs periodic speed tests using multiple providers (Fast.com, Speedtest.net)
and stores results in PostgreSQL via SQLAlchemy.
"""

from __future__ import annotations
import asyncio
import json
import logging
import os
import signal
import sys
import time
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional

import httpx
import speedtest  # type: ignore
from dateutil import tz
from dotenv import load_dotenv
from sqlalchemy import Column, DateTime, Float, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# ---------------------------------------------------------------------------
# Config / Logging
# ---------------------------------------------------------------------------
load_dotenv()
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("collector")

# Use SQLite database (same as backend)
DB_URL = os.getenv("DB_URL", "sqlite:///../backend/database.sqlite")
INTERVAL_MINUTES = int(os.getenv("INTERVAL_MINUTES", "10"))

# ---------------------------------------------------------------------------
# Database setup
# ---------------------------------------------------------------------------
Base = declarative_base()
engine = create_engine(DB_URL, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, future=True)

class SpeedTestORM(Base):
    __tablename__ = "speed_tests"
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    provider = Column(String(32), nullable=False, index=True)
    server = Column(String(128))
    download_mbps = Column(Float)
    upload_mbps = Column(Float)
    latency_ms = Column(Float)
    raw_json = Column(String)
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)

Base.metadata.create_all(engine)

# ---------------------------------------------------------------------------
# Domain models
# ---------------------------------------------------------------------------
class Provider(str, Enum):
    FAST_COM = "fast.com"
    SPEEDTEST = "speedtest.net"

@dataclass
class SpeedResult:
    timestamp: datetime
    provider: Provider
    server: str
    download_mbps: float
    upload_mbps: float
    latency_ms: float
    raw_json: str
    error: Optional[str] = None

# ---------------------------------------------------------------------------
# Provider runners
# ---------------------------------------------------------------------------
class SpeedProviderError(Exception):
    pass

class FastComRunner:
    """Uses unofficial fast.com endpoints (no upload/latency)"""

    ENDPOINT = "https://api.fast.com/netflix/speedtest/v2"

    async def run(self) -> SpeedResult:
        async with httpx.AsyncClient(timeout=60) as client:
            try:
                cfg = (await client.get(self.ENDPOINT)).json()
                url = cfg["targets"][0]["url"]
                start = time.perf_counter()
                resp = await client.get(url)
                duration = time.perf_counter() - start
                size_mb = len(resp.content) / 1_048_576  # bytes -> MB
                download = (size_mb * 8) / duration  # Mbps
                result = SpeedResult(
                    timestamp=datetime.now(tz.UTC),
                    provider=Provider.FAST_COM,
                    server="fast.com",
                    download_mbps=round(download, 2),
                    upload_mbps=0.0,
                    latency_ms=0.0,
                    raw_json=json.dumps({"size_mb": size_mb, "duration_s": duration}),
                )
                return result
            except Exception as exc:
                raise SpeedProviderError(f"Fast.com failed: {exc}") from exc

class SpeedtestCLIRunner:
    """Runs speedtest-cli in blocking executor"""

    def _blocking(self) -> SpeedResult:
        st = speedtest.Speedtest()
        st.get_best_server()
        st.download()
        st.upload()
        data = st.results.dict()
        return SpeedResult(
            timestamp=datetime.now(tz.UTC),
            provider=Provider.SPEEDTEST,
            server=data["server"]["name"],
            download_mbps=round(data["download"] / 1_000_000, 2),
            upload_mbps=round(data["upload"] / 1_000_000, 2),
            latency_ms=data["ping"],
            raw_json=json.dumps(data),
        )

    async def run(self) -> SpeedResult:
        loop = asyncio.get_running_loop()
        try:
            return await loop.run_in_executor(None, self._blocking)
        except Exception as exc:
            raise SpeedProviderError(f"speedtest.net failed: {exc}") from exc

# ---------------------------------------------------------------------------
# Persistence & orchestration
# ---------------------------------------------------------------------------
class Repository:
    def __init__(self):
        self.session = SessionLocal()

    def save(self, res: SpeedResult):
        orm = SpeedTestORM(
            timestamp=res.timestamp,
            provider=res.provider.value,
            server=res.server,
            download_mbps=res.download_mbps,
            upload_mbps=res.upload_mbps,
            latency_ms=res.latency_ms,
            raw_json=res.raw_json,
        )
        self.session.add(orm)
        self.session.commit()

    def close(self):
        self.session.close()

class Collector:
    def __init__(self, interval_minutes: int = INTERVAL_MINUTES):
        self.interval = interval_minutes * 60
        self.repo = Repository()
        self.runners = [FastComRunner(), SpeedtestCLIRunner()]
        self.running = True

    async def _run_once(self):
        tasks = [runner.run() for runner in self.runners]
        for task in asyncio.as_completed(tasks):
            try:
                res = await task
                logger.info(
                    f"{res.provider} -> {res.download_mbps}↓ {res.upload_mbps}↑ {res.latency_ms}ms"
                )
                self.repo.save(res)
            except SpeedProviderError as err:
                logger.warning(str(err))

    async def serve(self):
        logger.info("Collector started")
        while self.running:
            start = time.perf_counter()
            await self._run_once()
            elapsed = time.perf_counter() - start
            await asyncio.sleep(max(0, self.interval - elapsed))
        self.repo.close()
        logger.info("Collector stopped")

    def stop(self):
        self.running = False

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
async def main():
    collector = Collector()

    def _graceful(*_):
        logger.info("Signal received, stopping...")
        collector.stop()

    signal.signal(signal.SIGINT, _graceful)
    signal.signal(signal.SIGTERM, _graceful)
    
    await collector.serve()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
