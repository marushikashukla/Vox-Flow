import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Send, Copy, Check } from "lucide-react";

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  isLoading?: boolean;
  sources?: { title: string; score: number }[];
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "300ms" }} />
      <span className="ml-2 text-[10px] font-mono text-muted-foreground">Thinking...</span>
    </div>
  );
}

function SourcesBadge({ sources }: { sources: { title: string; score: number }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        Sources Used ({sources.length})
      </button>
      {open && (
        <div className="mt-1 space-y-1 pl-4">
          {sources.map((s, i) => (
            <div key={i} className="text-[10px] font-mono text-muted-foreground flex items-center gap-2">
              <span className="text-primary">{s.score.toFixed(2)}</span>
              <span>{s.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground cursor-pointer ml-2">
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

export function ChatArea({ messages, onSend }: { messages: ChatMessage[]; onSend: (text: string) => void }) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground font-mono text-sm opacity-50">Press the mic or type below...</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} group`}
          >
            <div
              className={`max-w-[80%] glass-card px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "border-primary/30"
                  : "border-secondary/30"
              }`}
            >
              {msg.isLoading ? (
                <TypingIndicator />
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <CopyButton text={msg.text} />
                  </div>
                  {msg.sources && msg.sources.length > 0 && <SourcesBadge sources={msg.sources} />}
                </>
              )}
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="px-6 pb-4 pt-2">
        <div className="flex items-center gap-2 glass rounded-xl px-4 py-2.5 focus-within:border-primary/40 transition-colors">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="or type your question..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-mono"
          />
          <button type="submit" className="text-primary hover:text-foreground transition-colors cursor-pointer">
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
