import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const ChatContext = createContext();

const API_URL = import.meta.env.VITE_BACKEND_URL;

export function ChatProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [unreadChats, setUnreadChats] = useState(0);
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  // ---------------------- TOKEN SYNC ----------------------
  useEffect(() => {
    const originalSetItem = localStorage.setItem;

    localStorage.setItem = function (key, value) {
      originalSetItem.apply(this, arguments);
      if (key === "token") {
        setToken(value);
      }
    };

    return () => {
      localStorage.setItem = originalSetItem;
    };
  }, []);

  useEffect(() => {
    function handleStorage(e) {
      if (e.key === "token") {
        setToken(e.newValue);
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // ---------------------- SOCKET SETUP ----------------------
  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    if (socket) return;

    const newSocket = io(API_URL, {
      transports: ["websocket"],
      auth: { token },
    });

    newSocket.on("connect", async () => {
      console.log("⚡ Socket connected");

      // REGISTER USER
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        if (decoded?.id) newSocket.emit("registerUser", decoded.id);
      } catch (err) {
        console.error("JWT decode failed:", err);
      }

      // ⭐ JOIN ALL CHAT ROOMS ON CONNECT (IMPORTANT FIX)
      try {
        const res = await fetch(`${API_URL}/api/conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const convos = await res.json();

        if (Array.isArray(convos)) {
          convos.forEach((c) => {
            newSocket.emit("joinRoom", String(c.id));
          });
          // console.log("Joined rooms:", convos.map((c) => c.id));
        }
      } catch (err) {
        console.error("Failed to join rooms:", err);
      }
    });

    newSocket.on("disconnect", () => {
      console.log("🔴 Socket disconnected");
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [token]);

  // ---------------------- GLOBAL UNREAD FETCH ----------------------
  async function refreshUnread() {
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const data = await res.json();
      if (!Array.isArray(data)) return;

      const hasUnread = data.some((c) => (c.unread_count || 0) > 0);
      setUnreadChats(hasUnread ? 1 : 0);
    } catch (err) {
      console.error("Unread check failed:", err);
    }
  }

  // Run once on mount
  useEffect(() => {
    refreshUnread();
  }, [token]);

  // ---------------------- SOCKET → FORCE UNREAD REFRESH ----------------------
  useEffect(() => {
    if (!socket) return;

    const handler = () => {
      refreshUnread();
    };

    socket.on("chat:ping", handler);

    return () => socket.off("chat:ping", handler);
  }, [socket]);

  // ⭐ IMPORTANT: REMOVED POLLING every 2 seconds — NO LONGER NEEDED

  // ---------------------- TOKEN EXPIRY AUTO LOGOUT ----------------------
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        const expiry = decoded.exp * 1000;
        const now = Date.now();

        if (now >= expiry) {
          alert("Your session has expired. Redirecting to login...");
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      } catch (err) {
        console.error("Token decode error:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [token]);

  return (
    <ChatContext.Provider
      value={{
        socket,
        unreadChats,
        setUnreadChats,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
