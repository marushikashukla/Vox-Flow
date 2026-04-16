import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export interface LogEntry {
  id: string;
  source: "vapi" | "qdrant" | "claude" | "embed";
  text: string;
}

const SOURCE_COLORS: Record<string, string> = {
  vapi: "bg-primary",
  qdrant: "bg-blue-400",
  claude: "bg-secondary",
  embed: "bg-yellow-400",
};

const SOURCE_LABELS: Record<string, string> = {
  vapi: "🟢 VAPI",
  qdrant: "🔵 QDRANT",
  claude: "🟣 CLAUDE",
  embed: "🟡 EMBED",
};

interface AgentActivityPanelProps {
  logs: LogEntry[];
  stats: { vectors: number; queries: number; avgTime: string };
}

export function AgentActivityPanel({ logs, stats }: AgentActivityPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-80 h-full glass border-l border-border/50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-border/50">
        <h2 className="font-mono text-xs tracking-[0.2em] uppercase text-secondary font-bold"
            style={{ textShadow: "0 0 10px hsl(var(--purple-accent) / 0.5)" }}>
          Agent Activity
        </h2>
      </div>

      {/* Logs */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-1.5">
        {logs.map((log, i) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.3 }}
            className="flex items-start gap-2 text-[11px] font-mono leading-snug"
          >
            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${SOURCE_COLORS[log.source]}`} />
            <span>
              <span className="text-muted-foreground">[{SOURCE_LABELS[log.source]}]</span>{" "}
              <span className="text-foreground/80">{log.text}</span>
            </span>
          </motion.div>
        ))}
      </div>

      {/* Stats */}
      <div className="border-t border-border/50 px-4 py-3">
        {/* Sparkline-style bars */}
        <div className="flex items-end gap-0.5 mb-3 h-6">
          {[3, 5, 4, 7, 6, 8, 5, 9, 7, 6, 8, 10, 7, 5, 8, 6, 9, 7, 8, 6].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${h * 10}%`,
                background: i % 3 === 0 ? "hsl(var(--cyan) / 0.6)" : "hsl(var(--purple-accent) / 0.4)",
              }}
            />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground font-mono uppercase">Vectors</p>
            <p className="text-sm font-mono text-primary font-bold">{stats.vectors.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground font-mono uppercase">Queries</p>
            <p className="text-sm font-mono text-primary font-bold">{stats.queries}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground font-mono uppercase">Avg Time</p>
            <p className="text-sm font-mono text-primary font-bold">{stats.avgTime}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
