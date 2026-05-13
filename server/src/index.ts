import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { Server } from "socket.io";

import logger from "./config/logger.js";
import { requestLogger } from "./middleware/requestLogger.js";
import authRoutes from "./routes/auth.js";
import availabilityRoutes from "./routes/availability.js";
import appointmentRoutes from "./routes/appointments.js";
import messageRoutes from "./routes/messages.js";
import notificationRoutes from "./routes/notifications.js";
import contactRoutes from "./routes/contact.js";
import profileRoutes from "./routes/profiles.js";
import reportRoutes from "./routes/reports.js";
import rateRoutes from "./routes/rates.js";
import adminRoutes from "./routes/admin.js";
import { setupSocket } from "./socket/index.js";
import { seedOwner } from "./db/seed.js";
import { runMigrations } from "./db/migrate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/rates", rateRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Socket.io
setupSocket(io);

// Make io accessible to routes
app.set("io", io);

const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  try {
    await runMigrations();
    logger.info("Migrations complete");
    await seedOwner();
  } catch (err) {
    logger.error(err, "Startup initialization failed");
  }
});

export { io };
