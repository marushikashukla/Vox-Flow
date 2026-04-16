import { useState } from "react";
import { Search, Plus, Settings, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HeaderBarProps {
  onNewConversation: () => void;
  isLive: boolean;
}

export function HeaderBar({ onNewConversation, isLive }: HeaderBarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [similarity, setSimilarity] = useState(0.85);
  const [animSpeed, setAnimSpeed] = useState(1);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="font-mono text-lg font-bold tracking-wider">
            <span className="text-foreground">VOX</span>
            <span className="text-primary" style={{ textShadow: "0 0 15px hsl(var(--cyan) / 0.6)" }}>FLOW</span>
          </h1>
          {isLive && (
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-success">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse-live" />
              LIVE
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 glass rounded-lg px-3 py-1.5">
            <Search size={13} className="text-muted-foreground" />
            <input
              placeholder="Search..."
              className="bg-transparent text-xs font-mono text-foreground placeholder:text-muted-foreground outline-none w-32"
            />
          </div>

          <button
            onClick={onNewConversation}
            className="flex items-center gap-1.5 glass rounded-lg px-3 py-1.5 text-xs font-mono text-primary hover:text-foreground transition-colors cursor-pointer"
          >
            <Plus size={13} />
            New Conv
          </button>

          <button
            onClick={() => setSettingsOpen(true)}
            className="glass rounded-lg p-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setSettingsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card w-96 p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm text-foreground font-bold">Settings</h3>
                <button onClick={() => setSettingsOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                    Similarity Threshold: {similarity.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0.7"
                    max="1"
                    step="0.01"
                    value={similarity}
                    onChange={(e) => setSimilarity(Number(e.target.value))}
                    className="w-full mt-2 accent-primary"
                    style={{ accentColor: "hsl(var(--cyan))" }}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                    Animation Speed: {animSpeed.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={animSpeed}
                    onChange={(e) => setAnimSpeed(Number(e.target.value))}
                    className="w-full mt-2"
                    style={{ accentColor: "hsl(var(--cyan))" }}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                    API Keys
                  </label>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Vapi, Qdrant, and Anthropic keys are configured via environment.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
