import React, { useEffect, useRef, useState } from "react";
import { Send, MessageCircle, Search, X } from "lucide-react";
import { Trash2 } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { useChat } from "./ChatContext.jsx";

const API_URL = import.meta.env.VITE_BACKEND_URL || "";
const DEFAULT_AVATAR =
  "https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg";

const getImage = (path) => {
  if (!path) return DEFAULT_AVATAR;
  if (typeof path !== "string") return DEFAULT_AVATAR;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `${API_URL}${path}`;
  return `${API_URL}/${path}`.replace(/([^:]\/)\/+/g, "$1");
};

export default function Chat() {
  const { socket, setUnreadChats } = useChat();

  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingConvos, setLoadingConvos] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);

  const textareaRef = useRef(null);

  const messagesRef = useRef(null);
  const token = localStorage.getItem("token");

  let currentUser = null;
  try {
    currentUser = token ? jwtDecode(token) : null;
  } catch { }

  // ------------------------------
  // Refs for stable socket handlers
  // ------------------------------
  const selectedChatRef = useRef(selectedChat);
  const currentUserRef = useRef(currentUser);

  useEffect(() => {
    document.title = "Chat - Gatherly";
  }, []);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    const hasUnread = conversations.some(c => c.unread_count > 0);
    setUnreadChats(hasUnread ? 1 : 0);
  }, [conversations]);


  // Auto scroll
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, selectedChat]);

  // =====================================================
  // Socket: Receive message (fixed with optimistic replace)
  // =====================================================
  const handleReceiveMessage = (msg) => {
    msg.created_at = msg.created_at || new Date().toISOString();

    const isOpen =
      selectedChatRef.current &&
      Number(selectedChatRef.current.id) === Number(msg.conversation_id);

    // Update conversation list

    setConversations((prev) => {
      const updated = prev.map((c) => {
        if (Number(c.id) === Number(msg.conversation_id)) {
          const isOpen =
            selectedChatRef.current &&
            Number(selectedChatRef.current.id) === Number(c.id);

          return {
            ...c,
            last_message: msg.text || msg.content,
            updated_at: msg.created_at,
            unread_count: isOpen ? 0 : (c.unread_count || 0) + 1,
          };
        }
        return c;
      });

      // If conversation wasn’t in list (new)
      if (!updated.some((c) => Number(c.id) === Number(msg.conversation_id))) {
        updated.unshift({
          id: msg.conversation_id,
          other_id: msg.sender_id,
          other_name: msg.sender_name,
          other_username: msg.sender_username,
          other_profile_photo: msg.sender_avatar,
          last_message: msg.text || msg.content,
          updated_at: msg.created_at,
          unread_count: 1,
        });
      }

      updated.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

      return updated;
    });


    // If message belongs to open chat → add/replace
    if (isOpen) {
      setMessages((prev) => {
        // replace optimistic
        if (msg.tempId) {
          return prev.map((m) =>
            m.tempId === msg.tempId
              ? { ...msg } // replace temp with real
              : m
          );
        }

        // avoid duplicates
        if (prev.some((m) => m.id === msg.id)) return prev;

        return [...prev, msg];
      });
    }
  };

  // =====================================================
  // Socket ping → refresh conversations (unread handled globally)
  // =====================================================
  const handleChatPing = () => {
    // fetchConversations();
  };

  // Attach socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("chat:ping", handleChatPing);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("chat:ping", handleChatPing);
    };
  }, [socket]);

  // ===========================
  // Load conversations
  // ===========================
  useEffect(() => {
    fetchConversations();
  }, []);

  async function fetchConversations() {
    if (!token) return;
    setLoadingConvos(true);
    try {
      const res = await fetch(`${API_URL}/api/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      // const data = await apiFetch(`${API_URL}/api/conversations`);

      if (Array.isArray(data)) {
        data.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        setConversations(data);
      }
    } catch { }
    setLoadingConvos(false);
  }

  // ===========================
  // Load messages
  // ===========================
  async function fetchMessages(convoId) {
    if (!token) return;

    setLoadingMessages(true);

    // ⭐ Join socket room BEFORE fetching, to avoid race
    if (socket) socket.emit("joinRoom", String(convoId));

    try {
      const res = await fetch(`${API_URL}/api/messages/${convoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      // const data = await apiFetch(`${API_URL}/api/messages/${convoId}`);

      setMessages(Array.isArray(data) ? data : []);
    } catch {
      setMessages([]);
    }

    setLoadingMessages(false);
  }

  // ===========================
  // Select conversation
  // ===========================


  function selectChat(c) {
    setSelectedChat(c);
    selectedChatRef.current = c;

    // Load messages
    fetchMessages(c.id);

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === c.id
          ? { ...conv, unread_count: 0 }
          : conv
      )
    );
  }

  // ===========================
  // Search users
  // ===========================
  async function handleSearchChange(e) {
    const val = e.target.value;
    setSearch(val);
    setSearchResults([]);

    if (!val.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/search?query=${encodeURIComponent(val)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (Array.isArray(data)) setSearchResults(data);
    } catch { }
  }

  // ===========================
  // Start conversation
  // ===========================
  async function startConversation(otherUserId) {
    try {
      const res = await fetch(`${API_URL}/api/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otherUserId }),
      });
      const data = await res.json();

      if (!data?.id) return;

      // Insert or update conversation
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === data.id);
        if (exists) return prev;
        return [data, ...prev];
      });

      setSearch("");
      setSearchResults([]);
      selectChat(data);
    } catch { }
  }

  // ===========================
  // Send message
  // ===========================
  function sendMessage(e) {
    e.preventDefault();
    if (!msgInput.trim() || !selectedChat) return;

    const tempId = Date.now();

    // emit to server
    socket?.emit("sendMessage", {
      conversationId: selectedChat.id,
      senderId: currentUserRef.current.id,
      text: msgInput.trim(),
      tempId,
    });

    // optimistic
    const optimisticMsg = {
      id: null,
      tempId,
      conversation_id: selectedChat.id,
      sender_id: currentUserRef.current.id,
      text: msgInput.trim(),
      created_at: new Date().toISOString(),
      sender_avatar: currentUserRef.current.profile_photo || null,
      sender_username: currentUserRef.current.username,
      sender_name: currentUserRef.current.name,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setMsgInput("");
  }


  function openDeleteModal(convoId) {
    setChatToDelete(convoId);
    setShowDeletePopup(true);
  }


  async function confirmDeleteChat() {
    if (!chatToDelete) return;

    try {
      const res = await fetch(`${API_URL}/api/conversations/${chatToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data?.success) {
        setConversations(prev => prev.filter(c => c.id !== chatToDelete));

        if (selectedChat?.id === chatToDelete) {
          setSelectedChat(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error("Delete chat error:", err);
    }

    setShowDeletePopup(false);
    setChatToDelete(null);
  }


  function ConfirmModal({ open, onCancel, onConfirm }) {
    if (!open) return null;

    return (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center 
                 bg-black/60 backdrop-blur-md animate-fadeIn"
      >
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl
                   w-[90%] max-w-md p-6 animate-scaleIn"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Delete Conversation?
          </h2>

          <p className="text-gray-500 dark:text-gray-300 mt-2 text-sm leading-relaxed">
            This chat will be permanently deleted for you.
            This action cannot be undone.
          </p>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700
                       hover:bg-gray-300 dark:hover:bg-gray-600
                       text-gray-800 dark:text-gray-200 transition-all"
            >
              Cancel
            </button>

            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600
                       text-white font-medium shadow-lg transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 md:left-64 md:right-64 px-4 py-6 overflow-hidden z-10">
      <div className="max-w-7xl mx-auto h-full flex">
        <div className="flex w-full h-full bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 overflow-hidden">

          {/* SIDEBAR */}
          <div className="hidden md:flex md:w-1/3 flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">

            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h2 className="text-lg font-semibold">Messages</h2>
            </div>

            {/* Search */}

            {/* SEARCH INPUT */}
            <div className="p-3 flex-shrink-0 relative">
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-full relative">

                <Search size={18} className="text-gray-500 dark:text-gray-300" />

                <input
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Search users..."
                  className="bg-transparent outline-none ml-2 flex-1 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-500"
                />

                {/* CLEAR BUTTON ✖ */}
                {search && (
                  <button
                    onClick={() => handleSearchChange({ target: { value: "" } })}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 transition"
                  >
                    <X></X>
                  </button>
                )}

              </div>

              {/* SEARCH DROPDOWN */}
              {search && (
                <div className="relative mt-2">
                  <div
                    className="
                    absolute left-0 right-0 
                    bg-white dark:bg-gray-800 
                    border border-gray-300 dark:border-gray-700 
                    rounded-xl shadow-xl z-20 
                    max-h-72 overflow-y-auto
                    animate-[fadeIn_0.15s_ease-out]
                  "
                  >
                    {/* NO RESULTS */}
                    {searchResults.length === 0 ? (
                      <div className="p-6 text-center">
                        <div className="text-gray-600 dark:text-gray-200 text-sm">
                          No users found
                        </div>
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-300">
                          Try searching a different username.
                        </div>
                      </div>
                    ) : (
                      searchResults.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => startConversation(u.id)}
                          className="
                          flex items-center gap-3 p-3 cursor-pointer
                          hover:bg-gray-100 dark:hover:bg-gray-700
                          transition-all duration-150
                          border-b last:border-b-0 border-gray-100 dark:border-gray-700
                        "
                        >
                          <img
                            src={getImage(u.profile_photo)}
                            className="
                            w-10 h-10 rounded-full object-cover
                            ring-1 ring-gray-300 dark:ring-gray-600
                          "
                          />

                          <div className="min-w-0">
                            <div className="font-semibold truncate text-gray-900 dark:text-gray-100">
                              {u.name || u.username}
                            </div>
                            <div className="text-xs text-gray-500 truncate">@{u.username}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>


            {/* </div> */}

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600">
              {loadingConvos ? (
                // LOADING STATE
                <div className="p-6 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="w-5 h-5 border-2 border-purple-500 dark:border-pruple-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <div className="text-center text-gray-600 dark:text-gray-300">Loading chats...</div>
                </div>
              ) : conversations.length === 0 ? (
                // EMPTY STATE
                <div className="p-6 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                  <MessageCircle size={32} className="mb-2 opacity-60" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">No chats yet</div>

                </div>
              )
                : (
                  conversations.map((c) => (
                    <div
                      key={`convo-${c.id}`}
                      onClick={() => selectChat(c)}
                      className={`relative flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition ${selectedChat?.id === c.id ? "bg-gray-100 dark:bg-gray-700" : ""
                        }`}
                    >
                      <img
                        src={getImage(c.other_profile_photo)}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{c.other_name}</div>
                        <div className="text-xs text-gray-500 truncate">@{c.other_username}</div>
                      </div>

                      {(c.unread_count || 0) > 0 && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                  ))
                )}
            </div>
          </div>

          {/* CHAT WINDOW */}
          <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-900 overflow-hidden">

            {selectedChat ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="flex items-center gap-3">
                    <img
                      src={getImage(selectedChat.other_profile_photo)}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                    />
                    <div className="flex flex-col">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {selectedChat.other_name}
                      </div>
                      <div className="text-sm text-gray-500">@{selectedChat.other_username}</div>
                    </div>
                  </div>


                  <button onClick={() => openDeleteModal(selectedChat.id)} className="text-red-500">
                    <Trash2 size={22} />
                  </button>

                </div>

                {showDeletePopup && (
                  <div
                    className="
                    fixed inset-0 z-[9999]
                    bg-black/40 backdrop-blur-[2px]
                    flex items-center justify-center
                    animate-fadeIn
                  "
                  >
                    <div
                      className="
                      w-[92%] max-w-md p-6 rounded-2xl shadow-2xl
                      bg-white dark:bg-gray-700
                      border border-gray-200 dark:border-gray-700
                      animate-scaleIn
                    "
                    >


                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Delete this chat?
                      </h2>

                      <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                        All messages in this chat will be removed forever.
                      </p>

                      <div className="flex justify-end gap-4">

                        {/* Cancel */}
                        <button
                          onClick={() => setShowDeletePopup(false)}
                          className="
                          px-5 py-2 rounded-lg font-medium
                          bg-gray-100 hover:bg-gray-200
                          dark:bg-gray-700 dark:hover:bg-gray-600
                          text-gray-800 dark:text-gray-200
                          transition-all
                        "
                        >
                          Cancel
                        </button>

                        {/* Delete */}
                        <button
                          onClick={confirmDeleteChat}
                          className="
                          px-5 py-2 rounded-lg font-semibold
                          text-white shadow-lg
                          bg-gradient-to-r from-red-500 to-pink-600
                          hover:from-red-600 hover:to-pink-700
                          transition-all
                        "
                        >
                          Delete
                        </button>
                      </div>

                    </div>
                  </div>
                )}



                {/* Messages */}
                <div
                  ref={messagesRef}
                  className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-700"
                >
                  {loadingMessages ? (
                    <div className="text-center text-gray-500 dark:text-gray-300">Loading...</div>
                  ) : messages.length > 0 ? (
                    messages.map((m, i) => {
                      const isOwn = currentUser && Number(m.sender_id) === Number(currentUser.id);
                      const key = m.id ?? m.tempId ?? `fallback-${i}`;

                      const formattedTime = new Date(m.created_at).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      });

                      return (
                        <div key={key} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>


                          <div
                            className={`p-3 rounded-2xl max-w-[70%] text-sm ${isOwn
                              ? "bg-blue-500 text-white rounded-br-none"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none"
                              }`}
                          >
                            <p className="break-words whitespace-pre-wrap">
                              {m.text}
                            </p>
                          </div>


                          <span className="text-xs mt-1 text-gray-500">
                            {formattedTime}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-gray-500 h-full flex items-center justify-center dark:text-gray-300">
                      No messages yet.
                    </div>
                  )}
                </div>

                {/* Input */}


                <form
                  onSubmit={(e) => {
                    sendMessage(e);

                    // 🔥 Reset textarea height after sending
                    if (textareaRef.current) {
                      textareaRef.current.style.height = "40px";
                    }
                  }}
                  className="p-3 flex items-center gap-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                >
                  <textarea
                    ref={textareaRef}
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    onInput={(e) => {
                      e.target.style.height = "40px"; // reset first
                      e.target.style.height = e.target.scrollHeight + "px"; // then expand
                    }}
                    placeholder="Type a message..."
                    rows={1}
                    className="
                    flex-1 bg-gray-100 dark:bg-gray-700 px-4 py-2
                    rounded-full outline-none text-sm
                    text-gray-800 dark:text-gray-100
                    placeholder-gray-400 dark:placeholder-gray-500
                    resize-none overflow-hidden
                    break-words whitespace-pre-wrap
                    max-h-32
                  "
                  />

                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition"
                  >
                    <Send size={18} />
                  </button>
                </form>

              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <MessageCircle size={48} className="mb-4" />
                <p>Select a conversation to start chatting.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}