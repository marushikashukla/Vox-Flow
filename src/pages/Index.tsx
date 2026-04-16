import { useState, useCallback, useRef, useEffect } from "react";
import Vapi from "@vapi-ai/web";
import { MemoryPanel, type KnowledgeDoc } from "@/components/voxflow/MemoryPanel";
import { InteractionPanel } from "@/components/voxflow/InteractionPanel";
import { AgentActivityPanel, type LogEntry } from "@/components/voxflow/AgentActivityPanel";
import { HeaderBar } from "@/components/voxflow/HeaderBar";
import { Ticker } from "@/components/voxflow/Ticker";
import { ParticleBackground } from "@/components/voxflow/ParticleBackground";
import type { MicStatus } from "@/components/voxflow/MicButton";
import type { ChatMessage } from "@/components/voxflow/ChatArea";
import { VAPI_PUBLIC_KEY, VAPI_ASSISTANT_ID } from "@/utils/vapi-config";
import { supabase } from "@/integrations/supabase/client";

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "pre-1",
    role: "user",
    text: "How does our JWT refresh token flow work?",
  },
  {
    id: "pre-2",
    role: "agent",
    text: "Based on the auth-service-docs, the JWT refresh flow uses a rotating refresh token strategy. When an access token expires (15min TTL), the client sends the refresh token to /auth/refresh. The server validates it, issues a new access + refresh pair, and invalidates the old refresh token. This prevents replay attacks.",
    sources: [
      { title: "auth-service-docs.pdf", score: 0.96 },
      { title: "api-reference-v2.md", score: 0.82 },
    ],
  },
  {
    id: "pre-3",
    role: "user",
    text: "What's the rate limit on the payments API?",
  },
  {
    id: "pre-4",
    role: "agent",
    text: "The payments API has tiered rate limits: 100 req/min for standard keys, 500 req/min for premium keys. Burst allowance is 2x for 10-second windows. Rate limit headers (X-RateLimit-Remaining, X-RateLimit-Reset) are included in every response.",
    sources: [{ title: "api-reference-v2.md", score: 0.94 }],
  },
];

type UploadStatus = { status: "idle" | "reading" | "chunking" | "embedding" | "indexing" | "success" | "error"; message?: string };

function VoxFlowDashboard() {
  const [micStatus, setMicStatus] = useState<MicStatus>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: "boot-1", source: "vapi", text: "Voice agent initialized" },
    { id: "boot-2", source: "qdrant", text: "Connected to collection: voxflow_knowledge" },
    { id: "boot-3", source: "claude", text: "Model ready: claude-sonnet-4-20250514" },
    { id: "boot-4", source: "qdrant", text: "1,247 vectors loaded" },
    { id: "boot-5", source: "vapi", text: "Deepgram nova-2 transcriber ready" },
    { id: "boot-6", source: "embed", text: "Local embeddings engine ready" },
  ]);
  const [uploadedDocs, setUploadedDocs] = useState<KnowledgeDoc[]>([]);
  const [uploadState, setUploadState] = useState<UploadStatus>({ status: "idle" });
  const [vectorCount, setVectorCount] = useState(1247);
  const [queryCount, setQueryCount] = useState(23);

  const logCounter = useRef(10);
  const vapiRef = useRef<Vapi | null>(null);
  const callActiveRef = useRef(false);

  const addLog = useCallback((source: LogEntry["source"], text: string) => {
    const id = `log-${logCounter.current++}`;
    setLogs((prev) => [...prev, { id, source, text }]);
  }, []);

  const addUserMessage = useCallback((text: string) => {
    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: "user", text }]);
  }, []);

  const addAgentMessage = useCallback((text: string) => {
    setMessages((prev) => [...prev, { id: `agent-${Date.now()}`, role: "agent", text }]);
  }, []);

  // ── File upload handler: real ingestion pipeline ──
  const handleFileUpload = useCallback(async (file: File) => {
    const validTypes = [".pdf", ".txt", ".md"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!validTypes.includes(ext)) {
      setUploadState({ status: "error", message: "Only PDF, TXT, MD files supported" });
      setTimeout(() => setUploadState({ status: "idle" }), 3000);
      return;
    }

    try {
      setUploadState({ status: "reading" });
      addLog("embed", `Reading file: ${file.name}`);

      // Small delay for UI feedback
      await new Promise((r) => setTimeout(r, 300));
      setUploadState({ status: "chunking" });
      addLog("embed", "Chunking text...");

      await new Promise((r) => setTimeout(r, 300));
      setUploadState({ status: "embedding" });
      addLog("embed", "Generating embeddings...");

      await new Promise((r) => setTimeout(r, 200));
      setUploadState({ status: "indexing" });
      addLog("qdrant", "Upserting vectors to Qdrant...");

      // Call the edge function with FormData
      const formData = new FormData();
      formData.append("file", file);

      const { data, error } = await supabase.functions.invoke("voxflow-ingest", {
        body: formData,
      });

      if (error) throw new Error(error.message || "Ingestion failed");
      if (data?.error) throw new Error(data.error);

      const chunks = data.chunks || 0;
      const vectors = data.vectors || 0;

      setUploadState({
        status: "success",
        message: `✓ ${file.name} — ${chunks} chunks, ${vectors} vectors indexed`,
      });
      addLog("qdrant", `✓ ${file.name}: ${vectors} vectors indexed`);
      addLog("embed", "File processed — searchable in knowledge base");

      // Update knowledge base sidebar
      setUploadedDocs((prev) => [
        ...prev,
        { name: file.name, chunks, timestamp: new Date().toISOString() },
      ]);
      setVectorCount((prev) => prev + vectors);

      // Reset upload state after showing success
      setTimeout(() => setUploadState({ status: "idle" }), 4000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Upload error:", e);
      setUploadState({ status: "error", message: msg });
      addLog("embed", `❌ Upload failed: ${msg}`);
      setTimeout(() => setUploadState({ status: "idle" }), 5000);
    }
  }, [addLog]);

  const handleDeleteDoc = useCallback((name: string) => {
    setUploadedDocs((prev) => prev.filter((d) => d.name !== name));
    addLog("qdrant", `Removed ${name} from local knowledge base`);
  }, [addLog]);

  const handleTranscriptChain = useCallback(async (transcript: string) => {
    addUserMessage(transcript);
    addLog("vapi", `Transcription: "${transcript.slice(0, 60)}..."`);

    const loadingId = `loading-${Date.now()}`;
    setMessages((prev) => [...prev, { id: loadingId, role: "agent", text: "", isLoading: true }]);

    try {
      addLog("embed", "Generating embedding...");
      addLog("qdrant", "Searching knowledge base...");
      addLog("claude", "Generating response...");

      const { data, error } = await supabase.functions.invoke("voxflow-chain", {
        body: { transcript },
      });

      if (error) throw new Error(error.message || "Edge function error");

      // Handle error responses from edge function
      if (data?.error) {
        setMessages((prev) => prev.filter((m) => m.id !== loadingId));
        addAgentMessage(`⚠️ ${data.message || data.error}`);
        addLog("vapi", `❌ ${data.message || data.error}`);
        return;
      }

      addLog("embed", `Embedding generated (${data.embeddingDims} dims)`);
      addLog("qdrant", `Top match: ${data.topScore}`);
      setQueryCount((prev) => prev + 1);

      setMessages((prev) => prev.filter((m) => m.id !== loadingId));
      addAgentMessage(data.response);
      addLog("claude", "Response sent");
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      console.error("Chain error:", e);
      addLog("vapi", `❌ Error: ${errorMsg}`);
      setMessages((prev) => prev.filter((m) => m.id !== loadingId));
      addAgentMessage("Error in search/AI pipeline—check console and API keys.");
    }
  }, [addLog, addUserMessage, addAgentMessage]);

  // ── Vapi setup ──
  useEffect(() => {
    const vapi = new Vapi(VAPI_PUBLIC_KEY);
    vapiRef.current = vapi;

    vapi.on("speech-start", () => {
      setMicStatus("listening");
      addLog("vapi", "User speaking...");
    });

    vapi.on("speech-end", () => {
      setMicStatus("processing");
      addLog("vapi", "Processing speech...");
    });

    vapi.on("message", (msg: Record<string, unknown>) => {
      if (msg.type === "transcript") {
        const transcript = msg as {
          type: string;
          role: string;
          transcript: string;
          transcriptType: string;
        };
        if (transcript.transcriptType === "final") {
          if (transcript.role === "user") {
            handleTranscriptChain(transcript.transcript);
          } else if (transcript.role === "assistant") {
            setMicStatus("speaking");
            addLog("vapi", "Speaking response...");
            setMessages((prev) => [
              ...prev,
              { id: `agent-${Date.now()}`, role: "agent", text: transcript.transcript },
            ]);
          }
        }
      }
      if (msg.type === "function-call") {
        addLog("claude", `Function call: ${(msg as Record<string, unknown>).functionCall || "unknown"}`);
      }
    });

    vapi.on("call-start", () => {
      callActiveRef.current = true;
      setMicStatus("listening");
      addLog("vapi", "Call started — listening...");
    });

    vapi.on("call-end", () => {
      callActiveRef.current = false;
      setMicStatus("idle");
      addLog("vapi", "Call ended");

      // Add call summary to chat
      const now = new Date().toLocaleTimeString();
      setMessages((prev) => {
        // Find last user + agent messages for summary
        const lastUser = [...prev].reverse().find((m) => m.role === "user");
        const lastAgent = [...prev].reverse().find((m) => m.role === "agent");
        return [
          ...prev,
          {
            id: `summary-${Date.now()}`,
            role: "agent" as const,
            text: `📞 Call ended at ${now}.\n${lastUser ? `Last query: "${lastUser.text.slice(0, 80)}..."` : ""}\n${lastAgent ? `Last response: "${lastAgent.text.slice(0, 100)}..."` : ""}\nStatus: completed`,
          },
        ];
      });
    });

    vapi.on("error", (err: unknown) => {
      console.error("Vapi error:", err);
      addLog("vapi", `Error: ${err instanceof Error ? err.message : String(err)}`);
      setMicStatus("idle");
    });

    return () => {
      vapi.stop();
    };
  }, [addLog, handleTranscriptChain]);

  const handleMicToggle = useCallback(() => {
    const vapi = vapiRef.current;
    if (!vapi) return;
    if (!callActiveRef.current) {
      addLog("vapi", "Starting voice session...");
      vapi.start(VAPI_ASSISTANT_ID);
    } else {
      vapi.stop();
      addLog("vapi", "Session stopped");
    }
  }, [addLog]);

  const handleSendMessage = useCallback(
    (text: string) => {
      handleTranscriptChain(text);
      const vapi = vapiRef.current;
      if (vapi && callActiveRef.current) {
        vapi.send({ type: "add-message", message: { role: "user", content: text } });
      }
    },
    [handleTranscriptChain],
  );

  const handleNewConversation = useCallback(() => {
    setMessages([]);
    addLog("vapi", "New conversation started");
  }, [addLog]);

  // Spacebar toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        handleMicToggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleMicToggle]);

  return (
    <div className="h-screen w-screen overflow-hidden relative"
         style={{ background: "linear-gradient(135deg, hsl(230 60% 6%), hsl(240 50% 12% / 0.5), hsl(190 50% 10% / 0.2))" }}>
      <ParticleBackground />
      <div className="grid-overlay" />
      <HeaderBar onNewConversation={handleNewConversation} isLive={callActiveRef.current || micStatus !== "idle"} />
      <Ticker />
      <div className="flex h-full pt-[76px] p-4 gap-4 relative z-10">
        <MemoryPanel
          uploadedDocs={uploadedDocs}
          onUploadFile={handleFileUpload}
          onDeleteDoc={handleDeleteDoc}
          uploadState={uploadState}
        />
        <InteractionPanel
          micStatus={micStatus}
          onMicToggle={handleMicToggle}
          messages={messages}
          onSendMessage={handleSendMessage}
        />
        <AgentActivityPanel
          logs={logs}
          stats={{ vectors: vectorCount, queries: queryCount, avgTime: "1.2s" }}
        />
      </div>
    </div>
  );
}

export default VoxFlowDashboard;
