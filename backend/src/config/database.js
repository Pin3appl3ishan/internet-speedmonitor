import { Sequelize } from "sequelize";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration - automatically switches between SQLite (dev) and PostgreSQL (prod)
const createSequelizeInstance = () => {
  if (process.env.NODE_ENV === "production" && process.env.DB_URL) {
    // PostgreSQL configuration for production
    return new Sequelize(process.env.DB_URL, {
      dialect: "postgres",
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      define: {
        timestamps: true,
        underscored: true,
      },
    });
  } else {
    // SQLite configuration for development
    return new Sequelize({
      dialect: "sqlite",
      storage: path.join(__dirname, "../../database.sqlite"),
      logging: process.env.NODE_ENV === "development" ? console.log : false,
      define: {
        timestamps: true,
        underscored: true,
      },
    });
  }
};

const sequelize = createSequelizeInstance();

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(
      `${
        process.env.NODE_ENV === "production" ? "PostgreSQL" : "SQLite"
      } connection has been established successfully.`
    );

    // Sync all models
    await sequelize.sync({ alter: process.env.NODE_ENV === "development" });
    console.log("Database synced");

    return sequelize;
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    throw error;
  }
};

export default sequelize;
