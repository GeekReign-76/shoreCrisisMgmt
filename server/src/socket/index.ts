import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { sendPushNotification } from "../services/push.js";
import { sendEmail } from "../services/email.js";

interface AuthUser {
  userId: number;
  email: string;
  role: string;
}

// Track connected sockets per user
const connectedUsers = new Map<number, Set<string>>();

export function isUserOnline(userId: number): boolean {
  const sockets = connectedUsers.get(userId);
  return !!sockets && sockets.size > 0;
}

export function setupSocket(io: Server) {
  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = (socket as any).user as AuthUser;
    const room = `user:${user.userId}`;
    socket.join(room);

    // Track connection
    if (!connectedUsers.has(user.userId)) {
      connectedUsers.set(user.userId, new Set());
    }
    connectedUsers.get(user.userId)!.add(socket.id);

    console.log(`User ${user.userId} connected (${connectedUsers.get(user.userId)!.size} sockets)`);

    // Handle sending a message
    socket.on("message:send", async (data: { receiverId: number; content: string }) => {
      try {
        const result = await pool.query(
          `INSERT INTO messages (sender_id, receiver_id, content)
           VALUES ($1, $2, $3) RETURNING *`,
          [user.userId, data.receiverId, data.content]
        );

        const message = result.rows[0];
        const senderResult = await pool.query("SELECT full_name FROM users WHERE id = $1", [user.userId]);
        message.sender_name = senderResult.rows[0].full_name;

        // Send to receiver
        io.to(`user:${data.receiverId}`).emit("message:new", message);
        // Echo back to sender
        io.to(`user:${user.userId}`).emit("message:new", message);

        // If receiver is offline, send push notification
        if (!isUserOnline(data.receiverId)) {
          sendPushNotification(
            data.receiverId,
            "New Message",
            `${senderResult.rows[0].full_name}: ${data.content.slice(0, 100)}`,
            "/messages"
          );

          // Also send email
          const receiverResult = await pool.query("SELECT email FROM users WHERE id = $1", [data.receiverId]);
          if (receiverResult.rows.length > 0) {
            sendEmail(
              receiverResult.rows[0].email,
              "New Message",
              `<p>You have a new message from <strong>${senderResult.rows[0].full_name}</strong>:</p>
               <p style="background: white; padding: 10px; border-radius: 8px;">${data.content}</p>
               <p><a href="${process.env.CLIENT_URL}/messages" style="color: #3A7CB8;">View in app</a></p>`
            );
          }
        }
      } catch (err) {
        console.error("Socket message:send error:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Mark messages as read
    socket.on("message:read", async (data: { senderId: number }) => {
      try {
        await pool.query(
          "UPDATE messages SET is_read = TRUE WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE",
          [data.senderId, user.userId]
        );
        io.to(`user:${data.senderId}`).emit("message:read-ack", { readerId: user.userId });
      } catch (err) {
        console.error("Socket message:read error:", err);
      }
    });

    // Typing indicators
    socket.on("typing:start", (data: { receiverId: number }) => {
      io.to(`user:${data.receiverId}`).emit("typing:indicator", { senderId: user.userId, typing: true });
    });

    socket.on("typing:stop", (data: { receiverId: number }) => {
      io.to(`user:${data.receiverId}`).emit("typing:indicator", { senderId: user.userId, typing: false });
    });

    // Disconnect
    socket.on("disconnect", () => {
      const sockets = connectedUsers.get(user.userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          connectedUsers.delete(user.userId);
        }
      }
      console.log(`User ${user.userId} disconnected`);
    });
  });
}
