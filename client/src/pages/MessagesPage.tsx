import { useState, useEffect, useRef } from "react";
import api from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import { Conversation, Message } from "../types";
import { format } from "date-fns";
import "./MessagesPage.css";

export default function MessagesPage() {
  const { user } = useAuth();
  const socket = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load conversations
  useEffect(() => {
    api.get("/messages/conversations").then((res) => {
      setConversations(res.data);
      // If client, auto-select the owner conversation
      if (user?.role === "client" && res.data.length > 0) {
        setActiveChat(res.data[0].user_id);
      }
    });
  }, [user]);

  // Load messages for active chat
  useEffect(() => {
    if (!activeChat) return;
    api.get(`/messages/conversations/${activeChat}`).then((res) => {
      setMessages(res.data);
    });
    // Mark as read
    api.patch(`/messages/read/${activeChat}`);
    socket?.emit("message:read", { senderId: activeChat });
  }, [activeChat]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handleNew = (msg: Message) => {
      if (
        (msg.sender_id === activeChat || msg.receiver_id === activeChat) &&
        (msg.sender_id === user?.id || msg.receiver_id === user?.id)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        // Mark as read if it's from the active chat
        if (msg.sender_id === activeChat) {
          api.patch(`/messages/read/${activeChat}`);
          socket.emit("message:read", { senderId: activeChat });
        }
      }

      // Update conversation list
      setConversations((prev) => {
        const otherId = msg.sender_id === user?.id ? msg.receiver_id : msg.sender_id;
        return prev.map((c) =>
          c.user_id === otherId
            ? { ...c, last_message: msg.content, last_message_at: msg.created_at,
                unread_count: otherId === activeChat ? 0 : c.unread_count + 1 }
            : c
        );
      });
    };

    const handleTyping = (data: { senderId: number; typing: boolean }) => {
      if (data.senderId === activeChat) {
        setTyping(data.typing ? data.senderId : null);
      }
    };

    const handleReadAck = () => {
      setMessages((prev) => prev.map((m) => ({ ...m, is_read: true })));
    };

    socket.on("message:new", handleNew);
    socket.on("typing:indicator", handleTyping);
    socket.on("message:read-ack", handleReadAck);

    return () => {
      socket.off("message:new", handleNew);
      socket.off("typing:indicator", handleTyping);
      socket.off("message:read-ack", handleReadAck);
    };
  }, [socket, activeChat, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !activeChat || !socket) return;
    socket.emit("message:send", { receiverId: activeChat, content: input.trim() });
    setInput("");
    socket.emit("typing:stop", { receiverId: activeChat });
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    if (!socket || !activeChat) return;
    socket.emit("typing:start", { receiverId: activeChat });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("typing:stop", { receiverId: activeChat });
    }, 1500);
  };

  const activeName = conversations.find((c) => c.user_id === activeChat)?.full_name;

  return (
    <div className="messages-page">
      <div className={`messages-layout ${activeChat ? "chat-active" : ""}`}>
        {/* Conversation List */}
        <div className="conversation-list">
          <h2>Messages</h2>
          {conversations.length === 0 ? (
            <p className="empty-state" style={{ padding: "var(--space-4)", fontSize: "var(--font-size-sm)" }}>
              {user?.role === "owner" ? "No conversations yet." : "Send a message to get started."}
            </p>
          ) : (
            conversations.map((c) => (
              <div key={c.user_id}
                className={`convo-item ${activeChat === c.user_id ? "active" : ""}`}
                onClick={() => setActiveChat(c.user_id)}>
                <div className="convo-avatar">{c.full_name.charAt(0).toUpperCase()}</div>
                <div className="convo-details">
                  <div className="convo-name">
                    {c.full_name}
                    {c.unread_count > 0 && <span className="unread-badge">{c.unread_count}</span>}
                  </div>
                  <div className="convo-preview">{c.last_message?.slice(0, 40)}</div>
                </div>
              </div>
            ))
          )}

          {/* For clients who have no conversation yet, show option to message owner */}
          {user?.role === "client" && conversations.length === 0 && (
            <button className="btn btn-primary btn-sm" style={{ margin: "var(--space-4)" }}
              onClick={async () => {
                const res = await api.get("/auth/me");
                // Find owner — send an initial message
                const ownerRes = await api.post("/messages", { receiverId: 1, content: "Hello, I'd like to connect." });
                if (ownerRes.data) {
                  const convRes = await api.get("/messages/conversations");
                  setConversations(convRes.data);
                  if (convRes.data.length > 0) setActiveChat(convRes.data[0].user_id);
                }
              }}>
              Start Conversation
            </button>
          )}
        </div>

        {/* Chat Window */}
        <div className="chat-window">
          {activeChat ? (
            <>
              <div className="chat-header">
                <button className="chat-back-btn" onClick={() => setActiveChat(null)}>&larr;</button>
                <h3>{activeName}</h3>
              </div>
              <div className="chat-messages">
                {messages.map((msg) => (
                  <div key={msg.id} className={`message-bubble ${msg.sender_id === user?.id ? "sent" : "received"}`}>
                    <p>{msg.content}</p>
                    <span className="message-time">
                      {format(new Date(msg.created_at), "h:mm a")}
                      {msg.sender_id === user?.id && msg.is_read && " · Read"}
                    </span>
                  </div>
                ))}
                {typing && <div className="typing-indicator">Typing...</div>}
                <div ref={messagesEndRef} />
              </div>
              <div className="chat-input">
                <input
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="form-input"
                />
                <button onClick={sendMessage} className="btn btn-primary">Send</button>
              </div>
            </>
          ) : (
            <div className="chat-empty">
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
