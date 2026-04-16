import { motion } from "framer-motion";
import { Mic } from "lucide-react";

export type MicStatus = "idle" | "listening" | "processing" | "speaking";

const STATUS_LABELS: Record<MicStatus, string> = {
  idle: "Click to speak",
  listening: "Listening...",
  processing: "Thinking...",
  speaking: "Speaking...",
};

interface MicButtonProps {
  status: MicStatus;
  onToggle: () => void;
}

export function MicButton({ status, onToggle }: MicButtonProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex items-center justify-center">
        {/* Wave rings for listening */}
        {status === "listening" && (
          <>
            {[0, 0.5, 1].map((delay) => (
              <motion.div
                key={delay}
                className="absolute rounded-full border-2 border-success/40"
                style={{ width: 120, height: 120 }}
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 1.5, delay, repeat: Infinity, ease: "easeOut" }}
              />
            ))}
          </>
        )}

        {/* Spin ring for processing */}
        {status === "processing" && (
          <div
            className="absolute rounded-full border-2 border-transparent animate-mic-spin"
            style={{
              width: 136,
              height: 136,
              borderTopColor: "hsl(var(--purple-accent))",
              borderRightColor: "hsl(var(--purple-accent))",
            }}
          />
        )}

        {/* Speaking ring */}
        {status === "speaking" && (
          <motion.div
            className="absolute rounded-full border-2 border-purple"
            style={{ width: 132, height: 132 }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}

        {/* Waveform bars for listening */}
        {status === "listening" && (
          <div className="absolute flex items-center gap-1" style={{ bottom: -30 }}>
            {[0.3, 0.5, 0.8, 1, 0.7, 0.4, 0.6].map((h, i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full bg-success"
                animate={{ height: [4, h * 24, 4] }}
                transition={{ duration: 0.5, delay: i * 0.08, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </div>
        )}

        {/* Main button */}
        <button
          onClick={onToggle}
          className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
            status === "idle"
              ? "bg-surface-raised animate-mic-pulse glow-cyan"
              : status === "listening"
                ? "bg-success/20"
                : status === "processing"
                  ? "bg-purple/20"
                  : "bg-purple/20 glow-purple"
          }`}
          style={{
            border: `2px solid ${
              status === "idle"
                ? "hsl(var(--cyan))"
                : status === "listening"
                  ? "hsl(var(--success))"
                  : "hsl(var(--purple-accent))"
            }`,
          }}
        >
          <Mic
            size={40}
            className={
              status === "idle"
                ? "text-primary"
                : status === "listening"
                  ? "text-success"
                  : "text-secondary"
            }
          />
        </button>
      </div>

      {/* Status text */}
      <motion.p
        key={status}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`font-mono text-sm tracking-wide mt-6 ${
          status === "idle"
            ? "text-primary"
            : status === "listening"
              ? "text-success"
              : "text-secondary"
        }`}
      >
        {STATUS_LABELS[status]}
      </motion.p>
    </div>
  );
}
