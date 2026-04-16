import { MicButton, type MicStatus } from "./MicButton";
import { ChatArea, type ChatMessage } from "./ChatArea";

interface InteractionPanelProps {
  micStatus: MicStatus;
  onMicToggle: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export function InteractionPanel({ micStatus, onMicToggle, messages, onSendMessage }: InteractionPanelProps) {
  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      {/* Mic area */}
      <div className="py-10 flex justify-center">
        <MicButton status={micStatus} onToggle={onMicToggle} />
      </div>

      {/* Chat */}
      <ChatArea messages={messages} onSend={onSendMessage} />
    </div>
  );
}
