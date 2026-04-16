import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, FileText, Upload, CheckCircle, Search, AlertCircle, Loader2, X } from "lucide-react";

export interface KnowledgeDoc {
  name: string;
  chunks?: number;
  timestamp?: string;
}

interface PastQuery {
  id: string;
  text: string;
  timestamp: string;
  score: number;
}

const MOCK_QUERIES: PastQuery[] = [
  { id: "1", text: "How does our JWT refresh token flow work?", timestamp: "2 min ago", score: 0.96 },
  { id: "2", text: "What's the rate limit on the payments API?", timestamp: "1 hr ago", score: 0.94 },
  { id: "3", text: "Explain the microservice retry policy", timestamp: "yesterday", score: 0.91 },
  { id: "4", text: "How to configure Redis cache TTL?", timestamp: "2 days ago", score: 0.88 },
  { id: "5", text: "What auth scopes does the admin role have?", timestamp: "3 days ago", score: 0.85 },
];

const DEFAULT_KB: KnowledgeDoc[] = [
  { name: "auth-service-docs.pdf" },
  { name: "api-reference-v2.md" },
  { name: "deployment-runbook.txt" },
];

interface MemoryPanelProps {
  uploadedDocs?: KnowledgeDoc[];
  onUploadFile?: (file: File) => Promise<void>;
  onDeleteDoc?: (name: string) => void;
  uploadState?: { status: "idle" | "reading" | "chunking" | "embedding" | "indexing" | "success" | "error"; message?: string };
}

export function MemoryPanel({ uploadedDocs = [], onUploadFile, onDeleteDoc, uploadState }: MemoryPanelProps) {
  const [filter, setFilter] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalDocs = DEFAULT_KB.length + uploadedDocs.length;

  const filtered = MOCK_QUERIES.filter((q) =>
    q.text.toLowerCase().includes(filter.toLowerCase())
  );

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadFile) return;
    await onUploadFile(file);
    // Reset input so same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isUploading = uploadState && uploadState.status !== "idle" && uploadState.status !== "success" && uploadState.status !== "error";

  const stageLabel = uploadState?.status === "reading" ? "Reading file..."
    : uploadState?.status === "chunking" ? "Chunking text..."
    : uploadState?.status === "embedding" ? "Generating embeddings..."
    : uploadState?.status === "indexing" ? "Indexing in Qdrant..."
    : uploadState?.status === "success" ? uploadState.message || "✓ Indexed"
    : uploadState?.status === "error" ? uploadState.message || "❌ Upload failed"
    : "";

  return (
    <div className="w-72 h-full glass border-r border-border/50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-border/50">
        <h2 className="font-mono text-xs tracking-[0.2em] uppercase text-primary font-bold glow-cyan"
            style={{ textShadow: "0 0 10px hsl(var(--cyan) / 0.5)" }}>
          Memory Store
        </h2>
      </div>

      {/* Search filter */}
      <div className="px-3 pt-3">
        <div className="flex items-center gap-2 glass rounded-lg px-3 py-1.5">
          <Search size={12} className="text-muted-foreground" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search memories..."
            className="flex-1 bg-transparent text-[11px] font-mono text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
      </div>

      {/* Past Queries */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-2">
        {filtered.map((q, i) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="glass-card p-3 cursor-pointer"
          >
            <div className="flex items-start gap-2">
              <Activity size={14} className="text-primary mt-0.5 shrink-0 opacity-60" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-foreground leading-snug line-clamp-2">{q.text}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground">{q.timestamp}</span>
                  <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    {q.score.toFixed(2)} match 🟢
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Knowledge Base */}
      <div className="border-t border-border/50 px-4 py-3">
        <h3 className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-2 font-bold">
          Knowledge Base ({totalDocs})
        </h3>
        <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin">
          {DEFAULT_KB.map((doc) => (
            <div key={doc.name} className="flex items-center gap-2 text-xs text-foreground/80 hover:text-foreground transition-colors cursor-pointer">
              <FileText size={12} className="text-secondary shrink-0" />
              <span className="truncate font-mono text-[11px]">{doc.name}</span>
            </div>
          ))}
          {uploadedDocs.map((doc) => (
            <div key={doc.name} className="group flex items-center gap-2 text-xs text-foreground/80 hover:text-foreground transition-colors cursor-pointer">
              <FileText size={12} className="text-primary shrink-0" />
              <span className="truncate font-mono text-[11px]">{doc.name}</span>
              {doc.chunks && (
                <span className="text-[9px] font-mono text-primary/70 shrink-0">
                  {doc.chunks}ch
                </span>
              )}
              {onDeleteDoc && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteDoc(doc.name); }}
                  className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0 cursor-pointer"
                  title={`Remove ${doc.name}`}
                >
                  <X size={11} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upload */}
      <div className="border-t border-border/50 px-4 py-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md"
          className="hidden"
          onChange={handleFileChange}
        />
        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="progress"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, hsl(var(--cyan)), hsl(var(--purple-accent)))" }}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 4, ease: "easeInOut" }}
                />
              </div>
              <p className="text-[10px] font-mono text-primary flex items-center gap-1">
                <Loader2 size={10} className="animate-spin" />
                {stageLabel}
              </p>
            </motion.div>
          ) : uploadState?.status === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-1"
            >
              <p className="text-[10px] font-mono text-green-400 flex items-center gap-1">
                <CheckCircle size={10} />
                {stageLabel}
              </p>
            </motion.div>
          ) : uploadState?.status === "error" ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-1"
            >
              <p className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                <AlertCircle size={10} />
                {stageLabel}
              </p>
            </motion.div>
          ) : (
            <motion.button
              key="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleUploadClick}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-primary/30 text-primary text-xs font-mono hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer"
            >
              <Upload size={13} />
              + Upload Doc
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
