import { ChatPanel } from '@/components/chat/ChatPanel';

export default function ChatPage() {
  return (
    <main className="h-screen p-4">
      <h1 className="text-xl font-semibold mb-4">
        Explore the Data
      </h1>

      <ChatPanel />
    </main>
  );
}
