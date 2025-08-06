import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import YAML from "yamljs";
import swaggerUi from "swagger-ui-express";
import pinoHttp from "pino-http";
import pinoPretty from "pino-pretty";
import { StatusCodes } from "http-status-codes";
import { fileURLToPath } from "url";

import routes from "./routes/index.js";
import { connectDB } from "./config/database.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Logging
const stream = pinoPretty({
  colorize: true,
  translateTime: "SYS:standard",
  ignore: "pid,hostname,reqId,responseTime",
});

app.use(
  pinoHttp({
    level: process.env.LOG_LEVEL || "info",
    stream: process.env.NODE_ENV === "development" ? stream : undefined,
  })
);

// Body parser
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Swagger documentation
if (process.env.NODE_ENV !== "production") {
  const swaggerDocument = YAML.load(
    path.join(__dirname, "../docs/swagger.yaml")
  );
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(StatusCodes.OK).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use("/api", routes);

// 404 handler
app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    status: "error",
    message: "Not found",
  });
});

// Error handler
app.use(errorHandler);

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 3001;
    const server = app.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT} in ${
          process.env.NODE_ENV || "development"
        } mode`
      );
    });

    return server;
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

// Start the server
if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;
