import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const SpeedTest = sequelize.define(
  "SpeedTest",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["speedtest.net"]],
      },
    },
    server: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    download_mbps: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    upload_mbps: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    latency_ms: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    raw_json: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    tableName: "speed_tests",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["timestamp"],
      },
      {
        fields: ["provider"],
      },
    ],
  }
);

export default SpeedTest;
