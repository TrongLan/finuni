import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { apiSendChatMessage } from "../api/mockApi.js";
import { IconChat, IconClose, IconSend } from "./icons.jsx";

export default function ChatWidget({ profile, currentSpreadSheet, onSpreadsheetUpdate, onBeforeSend }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I'm your financial assistant. Please provide your profile information in the sidebar, and then you can ask me questions about making your financial plan.",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || typing) return;
    if (onBeforeSend && !onBeforeSend()) return;
    const nextHistory = [...messages, { role: "user", text }];
    setMessages(nextHistory);
    setInput("");
    setTyping(true);
    try {
      const response = await apiSendChatMessage(nextHistory, profile, currentSpreadSheet);
      onSpreadsheetUpdate(response.spreadsheet);
      setMessages((prev) => [...prev, { role: "assistant", text: response.reply }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      setMessages((prev) => [...prev, { role: "assistant", text: `Request failed: ${message}` }]);
    } finally {
      setTyping(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      <button className={"chat-bubble" + (open ? " hidden" : "")} onClick={() => setOpen(true)} title="Open chat with AI assistant">
        <IconChat />
      </button>

      <div className={"chat-panel" + (open ? " open" : "")}>
        <div className="chat-header">
          <div className="chat-header-title">
            <div className="chat-avatar">AI</div>
            <div>
              <div className="chat-title-text">Financial Assistant</div>
              <div className="chat-title-sub">Support you with your financial planning</div>
            </div>
          </div>
          <button className="chat-close" onClick={() => setOpen(false)}>
            <IconClose />
          </button>
        </div>

        <div className="chat-messages" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={"msg " + m.role}>
              {m.role === "assistant" ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ node, ...props }) => (
                      <a {...props} target="_blank" rel="noopener noreferrer" />
                    ),
                    table: ({ node, ...props }) => (
                      <div className="markdown-table-wrap">
                        <table {...props} />
                      </div>
                    ),
                  }}
                >
                  {m.text}
                </ReactMarkdown>
              ) : (
                m.text
              )}
            </div>
          ))}
          {typing && (
            <div className="typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
        </div>

        <div className="chat-input-row">
          <textarea
            className="chat-textarea"
            rows={1}
            placeholder="Type your message here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button className="chat-send" onClick={send} disabled={!input.trim() || typing}>
            <IconSend />
          </button>
        </div>
      </div>
    </>
  );
}
