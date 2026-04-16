export function Ticker() {
  const items = [
    "JWT refresh flow → 2.1s",
    "API rate limits → 1.8s",
    "Redis cache TTL → 1.4s",
    "Auth scopes query → 2.3s",
    "Microservice retry → 1.6s",
    "Deployment runbook → 1.9s",
    "WebSocket auth → 2.0s",
    "Database indexing → 1.5s",
  ];

  const doubled = [...items, ...items];

  return (
    <div className="fixed top-[52px] left-0 right-0 z-40 overflow-hidden border-b border-border/30"
         style={{ background: "hsl(var(--surface) / 0.8)" }}>
      <div className="animate-ticker flex whitespace-nowrap py-1">
        {doubled.map((item, i) => (
          <span key={i} className="text-[10px] font-mono text-muted-foreground mx-6">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
