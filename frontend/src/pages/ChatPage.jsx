import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../state/auth";
import { classifyError, retryWithBackoff, ERROR_TYPES } from "../utils/errorClassifier";
import { showSuccess, showError, showWarning, showInfo } from "../utils/toast";

// ── Thinking Animation Component ──
function ThinkingIndicator() {
  return (
    <div className="bubbleRow assistant">
      <div className="bubble thinkingBubble">
        <span className="thinkingLabel">Thinking</span>
        <div className="thinkingDots">
          <span className="thinkingDot" />
          <span className="thinkingDot" />
          <span className="thinkingDot" />
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get("id");

  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! Ask me anything." }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [error, setError] = useState(null);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [typingIndex, setTypingIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const sendLockRef = useRef(false);
  const convCreationLockRef = useRef(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = newHeight + "px";
    }
  }, [input]);

  // Load conversation from URL
  useEffect(() => {
    if (conversationId && user) {
      loadConversation(Number(conversationId));
    }
  }, [conversationId, user]);

  // Reset state when reset param is present
  useEffect(() => {
    const resetParam = searchParams.get("reset");
    if (resetParam === "true") {
      setMessages([{ role: "assistant", content: "Hi! Ask me anything." }]);
      setInput("");
      setCurrentConvId(null);
      setError(null);
      setIsQuotaExceeded(false);
      setTypingIndex(0);
      setIsTyping(false);
    }
  }, [searchParams]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending, typingIndex]);

  // Typing effect
  useEffect(() => {
    if (!isTyping) return;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "assistant") {
      setIsTyping(false);
      return;
    }

    const fullText = lastMessage.content;
    const speed = 15;

    if (typingIndex < fullText.length) {
      const timer = setTimeout(() => {
        setTypingIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
    }
  }, [isTyping, typingIndex, messages]);

  async function loadConversation(id) {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/conversations/${id}`);
      setCurrentConvId(id);
      setMessages(data.conversation.messages || [
        { role: "assistant", content: "Hi! Ask me anything." }
      ]);
    } catch (err) {
      console.error("Failed to load conversation:", err);
      setMessages([{ role: "assistant", content: "Failed to load conversation. Starting new chat..." }]);
    } finally {
      setLoading(false);
    }
  }

  async function createConversationLocked(title = "New Conversation") {
    if (convCreationLockRef.current) {
      let attempts = 0;
      while (!currentConvId && attempts < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }
      return currentConvId;
    }

    convCreationLockRef.current = true;
    try {
      const { data } = await api.post("/conversations", { title });
      const newConvId = data.conversation.id;
      setCurrentConvId(newConvId);
      return newConvId;
    } finally {
      convCreationLockRef.current = false;
    }
  }

  async function send() {
    const text = input.trim();

    if (!text || sendLockRef.current || sending) return;
    if (isQuotaExceeded) return;

    sendLockRef.current = true;

    try {
      setInput("");
      setError(null);
      setMessages((m) => [...m, { role: "user", content: text }]);
      setSending(true);

      let convId = currentConvId;

      if (user && !convId) {
        if (isQuotaExceeded) {
          setMessages((m) => m.slice(0, -1));
          showWarning("Daily quota exceeded. Please try again tomorrow.");
          setError({ type: ERROR_TYPES.QUOTA_EXCEEDED, message: "🚫 Daily quota exceeded. Please try again tomorrow.", retryable: false });
          return;
        }

        try {
          const newConvId = await createConversationLocked(text.substring(0, 50));
          if (!newConvId) throw new Error("Failed to create conversation");
          convId = newConvId;
        } catch (err) {
          const classified = classifyError(err);
          if (classified.type === ERROR_TYPES.QUOTA_EXCEEDED) {
            setIsQuotaExceeded(true);
            showWarning("Daily quota exceeded. Please try again tomorrow.");
          } else {
            showError(classified.message);
          }
          setError(classified);
          setMessages((m) => m.slice(0, -1));
          return;
        }
      }

      let data;

      try {
        if (user && convId) {
          try {
            const response = await api.post(`/conversations/${convId}/messages`, { message: text });
            data = response.data;
          } catch (err) {
            const classified = classifyError(err);

            if (classified.type === ERROR_TYPES.QUOTA_EXCEEDED) {
              setIsQuotaExceeded(true);
              showWarning("Daily quota exceeded. Please try again tomorrow.");
              setError(classified);
              setMessages((m) => [...m, { role: "system", content: "🚫 Daily quota exceeded. Please try again tomorrow.", isSystemMessage: true }]);
              return;
            }

            if (!classified.retryable) {
              setError(classified);
              setMessages((m) => [...m, { role: "assistant", content: classified.message, isError: true }]);
              return;
            }

            setError(classified);
            try {
              const response = await retryWithBackoff(
                () => api.post(`/conversations/${convId}/messages`, { message: text }),
                3,
                1000
              );
              data = response.data;
              setError(null);
            } catch (retryErr) {
              const retryClassified = classifyError(retryErr);
              if (retryClassified.type === ERROR_TYPES.QUOTA_EXCEEDED) {
                setIsQuotaExceeded(true);
                showWarning("Daily quota exceeded. Please try again tomorrow.");
                setError(retryClassified);
                setMessages((m) => [...m, { role: "system", content: "🚫 Daily quota exceeded. Please try again tomorrow.", isSystemMessage: true }]);
                return;
              }
              setError(retryClassified);
              setMessages((m) => [...m, { role: "assistant", content: retryClassified.message, isError: true }]);
              return;
            }
          }
        } else {
          const res = await api.post("/chat", { message: text });
          data = { messages: [{ role: "assistant", content: res.data.chat.response }] };
        }

        if (data.messages) {
          const assistantMessages = data.messages.filter((m) => m.role === "assistant");
          setMessages((m) => [...m, ...assistantMessages]);
          setTypingIndex(0);
          setIsTyping(true);
        }
      } catch (err) {
        const classified = classifyError(err);
        setError(classified);
        setMessages((m) => [...m, { role: "assistant", content: classified.message, isError: true }]);
      }
    } finally {
      sendLockRef.current = false;
      setSending(false);
    }
  }

  function createConversation() {
    setCurrentConvId(null);
    setMessages([{ role: "assistant", content: "Hi! Ask me anything." }]);
    setError(null);
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="chatPage">
      <div className="chatHeader">
        <div>
          <div className="chatTitle">Chat</div>
          <div className="chatHint">Enter to send, Shift+Enter for new line.</div>
        </div>
        {user && (
          <button className="btn btnGhost" onClick={createConversation}>
            New Chat
          </button>
        )}
      </div>

      {loading ? <div className="muted">Loading conversation...</div> : null}
      {error ? (
        <div className={`error ${error.type}`}>
          {error.message}
          {error.retryable && !sending && (
            <div style={{ marginTop: "8px", fontSize: "12px" }}>
              <button
                className="btn btnGhost"
                style={{ fontSize: "12px", padding: "4px 8px" }}
                onClick={() => send()}
              >
                Retry
              </button>
            </div>
          )}
        </div>
      ) : null}

      <div className="chatThread">
        {messages.map((m, idx) => {
          if (m.role === "system" && m.isSystemMessage) {
            return (
              <div key={idx} className="systemMessage">
                {m.content}
              </div>
            );
          }

          const isLastMessage = idx === messages.length - 1;
          const showTypingEffect = isTyping && isLastMessage && m.role === "assistant";
          const displayedText = showTypingEffect ? m.content.slice(0, typingIndex) : m.content;
          const showCursor = showTypingEffect && typingIndex < m.content.length;

          return (
            <div
              key={idx}
              className={`bubbleRow ${m.role === "user" ? "user" : "assistant"} ${m.isError ? "error" : ""}`}
            >
              <div className={`bubble ${m.isError ? "error" : ""}`}>
                {displayedText}
                {showCursor && <span className="typingCursor">|</span>}
              </div>
            </div>
          );
        })}

        {/* ── Thinking Animation (replaces old "Thinking..." text) ── */}
        {sending && <ThinkingIndicator />}

        <div ref={bottomRef} />
      </div>

      <div className="chatInput">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyDown={onKeyDown}
          placeholder={isQuotaExceeded ? "Daily quota exceeded" : "Ask me anything..."}
          disabled={sending || loading || isQuotaExceeded}
        />
        <button
          className="btn btnPrimary"
          onClick={send}
          disabled={sending || loading || !input.trim() || isQuotaExceeded || sendLockRef.current}
        >
          {sending ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
