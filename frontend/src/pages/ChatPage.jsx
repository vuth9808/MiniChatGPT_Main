import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../state/auth";
import { classifyError, retryWithBackoff, ERROR_TYPES } from "../utils/errorClassifier";
import { showSuccess, showError, showWarning, showInfo } from "../utils/toast";

export default function ChatPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get("id"); // Load conversation from URL param
  
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! Ask me anything."
    }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [error, setError] = useState(null); // Error state for proper error display
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false); // Track if quota is exceeded
  const [typingIndex, setTypingIndex] = useState(0); // For typing effect
  const [isTyping, setIsTyping] = useState(false); // Track if currently typing

  // Locks to prevent race conditions
  const sendLockRef = useRef(false); // Prevents multiple simultaneous send() calls
  const convCreationLockRef = useRef(false); // Prevents multiple conversation creation calls
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = newHeight + "px";
    }
  }, [input]);

  // Load conversation from URL if exists
  useEffect(() => {
    if (conversationId && user) {
      loadConversation(Number(conversationId));
    }
  }, [conversationId, user]);

  // Reset state when reset param is present
  useEffect(() => {
    const resetParam = searchParams.get("reset");
    if (resetParam === "true") {
      setMessages([
        {
          role: "assistant",
          content: "Hi! Ask me anything."
        }
      ]);
      setInput("");
      setCurrentConvId(null);
      setError(null);
      setIsQuotaExceeded(false);
      setTypingIndex(0);
      setIsTyping(false);
    }
  }, [searchParams]);

  // Smooth scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending, typingIndex]);

  // Typing effect for assistant messages
  useEffect(() => {
    if (!isTyping) return;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "assistant") {
      setIsTyping(false);
      return;
    }

    const fullText = lastMessage.content;
    const speed = 15; // milliseconds per character

    if (typingIndex < fullText.length) {
      const timer = setTimeout(() => {
        setTypingIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
    }
  }, [isTyping, typingIndex, messages]);

  // Load existing conversation
  async function loadConversation(id) {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/conversations/${id}`);
      setCurrentConvId(id);
      setMessages(data.conversation.messages || [
        {
          role: "assistant",
          content: "Hi! Ask me anything."
        }
      ]);
    } catch (err) {
      console.error("Failed to load conversation:", err);
      setMessages([
        {
          role: "assistant",
          content: "Failed to load conversation. Starting new chat..."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Create a new conversation with a lock to prevent race conditions
   * CRITICAL: This returns the conversation ID synchronously after creation
   */
  async function createConversationLocked(title = "New Conversation") {
    // Check if already creating
    if (convCreationLockRef.current) {
      console.warn("[CONVERSATION] Creation already in progress, waiting...");
      // Wait for creation to complete by checking if currentConvId is set
      let attempts = 0;
      while (!currentConvId && attempts < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }
      return currentConvId;
    }

    // Acquire lock
    convCreationLockRef.current = true;

    try {
      console.log("[CONVERSATION] Creating new conversation...");
      const { data } = await api.post("/conversations", { title });
      const newConvId = data.conversation.id;
      setCurrentConvId(newConvId);
      console.log("[CONVERSATION] Created:", newConvId);
      return newConvId;
    } finally {
      // Release lock
      convCreationLockRef.current = false;
    }
  }

  /**
   * Send message with STRICT locking and quota handling
   * ChatGPT-like behavior: one request at a time, respects quota limits
   */
  async function send() {
    const text = input.trim();

    // Guard 1: Don't send if empty, already sending, or lock is active
    if (!text || sendLockRef.current || sending) {
      console.warn("[SEND] Blocked - empty text, lock active, or already sending");
      return;
    }

    // Guard 2: CRITICAL - Don't send if quota already exceeded
    // This prevents any API call when quota is exhausted
    if (isQuotaExceeded) {
      console.warn("[SEND] Blocked - quota exceeded");
      return;
    }

    // Acquire send lock - this is SYNCHRONOUS
    sendLockRef.current = true;

    try {
      // Immediately clear input and add user message to UI
      setInput("");
      setError(null);
      setMessages((m) => [...m, { role: "user", content: text }]);
      setSending(true);

      let convId = currentConvId;

      // If no conversation yet, create one (with lock)
      // But ONLY if not quota exceeded (prevent empty conversations)
      if (user && !convId) {
        if (isQuotaExceeded) {
          console.warn("[SEND] Cannot create conversation - quota already exceeded");
          setMessages((m) => m.slice(0, -1));
          showWarning("Daily quota exceeded. Please try again tomorrow.");
          setError({
            type: ERROR_TYPES.QUOTA_EXCEEDED,
            message: "🚫 Daily quota exceeded. Please try again tomorrow.",
            retryable: false
          });
          return;
        }

        console.log("[SEND] No conversation, creating one...");
        try {
          const newConvId = await createConversationLocked(text.substring(0, 50));
          if (!newConvId) {
            throw new Error("Failed to create conversation");
          }
          convId = newConvId;
        } catch (err) {
          const classified = classifyError(err);
          
          // If conversation creation failed due to quota, set quota state
          if (classified.type === ERROR_TYPES.QUOTA_EXCEEDED) {
            setIsQuotaExceeded(true);
            showWarning("Daily quota exceeded. Please try again tomorrow.");
          } else {
            showError(classified.message);
          }
          
          setError(classified);

          // Remove the user message we just added since create failed
          setMessages((m) => m.slice(0, -1));
          return;
        }
      }

      // Now send the message
      let data;

      try {
        if (user && convId) {
          // Authenticated: send to conversation with retry
          // CRITICAL: Try once first to check for quota exceeded
          try {
            const response = await api.post(`/conversations/${convId}/messages`, { message: text });
            data = response.data;
          } catch (err) {
            const classified = classifyError(err);
            
            // CRITICAL: Check for quota exceeded IMMEDIATELY
            // Do NOT retry, just fail and set quota state
            if (classified.type === ERROR_TYPES.QUOTA_EXCEEDED) {
              console.error("[SEND] QUOTA EXCEEDED - stopping all requests");
              setIsQuotaExceeded(true);
              showWarning("Daily quota exceeded. Please try again tomorrow.");
              setError(classified);
              
              // Add system message to chat
              setMessages((m) => [
                ...m,
                {
                  role: "system",
                  content: "🚫 Daily quota exceeded. Please try again tomorrow.",
                  isSystemMessage: true
                }
              ]);
              return;
            }

            // For other errors, check if retryable
            if (!classified.retryable) {
              // Non-retryable (auth, not found, etc.)
              setError(classified);
              setMessages((m) => [
                ...m,
                {
                  role: "assistant",
                  content: classified.message,
                  isError: true
                }
              ]);
              return;
            }

            // For retryable errors (rate limit, server error), use retry logic
            console.log(`[SEND] Error is retryable: ${classified.type}. Using exponential backoff...`);
            setError(classified);
            
            // Use retry with backoff
            try {
              const response = await retryWithBackoff(
                () => api.post(`/conversations/${convId}/messages`, { message: text }),
                3, // max retries
                1000 // initial delay
              );
              data = response.data;
              // Success! Clear error
              setError(null);
            } catch (retryErr) {
              const retryClassified = classifyError(retryErr);
              console.error("[SEND] Retry failed:", retryClassified);
              
              // Check again if quota error occurred during retry
              if (retryClassified.type === ERROR_TYPES.QUOTA_EXCEEDED) {
                console.error("[SEND] Quota exceeded after retries");
                setIsQuotaExceeded(true);
                showWarning("Daily quota exceeded. Please try again tomorrow.");
                setError(retryClassified);
                
                setMessages((m) => [
                  ...m,
                  {
                    role: "system",
                    content: "🚫 Daily quota exceeded. Please try again tomorrow.",
                    isSystemMessage: true
                  }
                ]);
                return;
              }

              // Other error after retries - show error message
              setError(retryClassified);
              setMessages((m) => [
                ...m,
                {
                  role: "assistant",
                  content: retryClassified.message,
                  isError: true
                }
              ]);
              return;
            }
          }
        } else {
          // Guest mode: single request, no retry on rate limit
          const res = await api.post("/chat", { message: text });
          data = {
            messages: [
              { role: "assistant", content: res.data.chat.response }
            ]
          };
        }

        // Extract and add only assistant message (user message already added)
        if (data.messages) {
          const assistantMessages = data.messages.filter(
            (m) => m.role === "assistant"
          );
          setMessages((m) => [...m, ...assistantMessages]);
          // Start typing effect for the new message
          setTypingIndex(0);
          setIsTyping(true);
        }
      } catch (err) {
        const classified = classifyError(err);
        console.error("[SEND] Unhandled error:", classified);

        // Final fallback - add error message to UI
        setError(classified);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: classified.message,
            isError: true
          }
        ]);
      }
    } finally {
      // Always release lock and clear sending state
      sendLockRef.current = false;
      setSending(false);
    }
  }

  // Create new conversation - reset UI only
  function createConversation() {
    setCurrentConvId(null);
    setMessages([
      {
        role: "assistant",
        content: "Hi! Ask me anything."
      }
    ]);
    setError(null);
  }

  function onKeyDown(e) {
    // Only send if Enter is pressed and Shift is not held
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
          // System messages (quota exceeded, errors) displayed differently
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
              className={`bubbleRow ${m.role === "user" ? "user" : "assistant"} ${
                m.isError ? "error" : ""
              }`}
            >
              <div className={`bubble ${m.isError ? "error" : ""}`}>
                {displayedText}
                {showCursor && <span className="typingCursor">|</span>}
              </div>
            </div>
          );
        })}
        {sending && (
          <div className="bubbleRow assistant">
            <div className="bubble muted">Thinking...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chatInput">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyDown={onKeyDown}
          placeholder={
            isQuotaExceeded
              ? "Daily quota exceeded"
              : "Ask me anything..."
          }
          disabled={sending || loading || isQuotaExceeded}
        />
        <button
          className="btn btnPrimary"
          onClick={send}
          disabled={
            sending ||
            loading ||
            !input.trim() ||
            isQuotaExceeded ||
            sendLockRef.current
          }
        >
          {sending ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

