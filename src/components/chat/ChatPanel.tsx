'use client';

import { useState } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type Scope = {
  limit?: number;
  clusterIds?: string[];
  articleIds?: string[];
};

function ScopeControls({
  scope,
  setScope,
}: {
  scope: Scope;
  setScope: (s: Scope) => void;
}) {
  return (
    <aside className="w-64 border-r p-3 space-y-4 text-sm">
      <div>
        <label className="block font-semibold">Feed Size</label>
        <select
          value={scope.limit ?? 100}
          onChange={(e) =>
            setScope({ ...scope, limit: Number(e.target.value) })
          }
        >
          <option value={5}>5 articles</option>
          <option value={10}>10 articles</option>
          <option value={25}>25 articles</option>
          <option value={50}>50 articles</option>
          <option value={100}>100 articles</option>
          <option value={200}>200 articles</option>
        </select>
      </div>

      <div>
        <label className="block font-semibold">Cluster IDs</label>
        <select
          multiple
          className="w-full border px-1 h-42"
          onChange={(e) => {
            const selected = Array.from(
              e.target.selectedOptions
            ).map((opt) => opt.value);
            setScope({ ...scope, clusterIds: selected });
          }}
        >
          <option value="cluster_0">cluster_0</option>
          <option value="cluster_1">cluster_1</option>
          <option value="cluster_2">cluster_2</option>
          <option value="cluster_3">cluster_3</option>
          <option value="cluster_4">cluster_4</option>
          <option value="cluster_5">cluster_5</option>
          <option value="cluster_6">cluster_6</option>
          <option value="cluster_7">cluster_7</option>
          <option value="cluster_8">cluster_8</option>
          <option value="cluster_9">cluster_9</option>
        </select>
      </div>
    </aside>
  );
}

function MessageList({
  messages,
  loading,
}: {
  messages: Message[];
  loading: boolean;
}) {
  return (
    <div className="flex-1 overflow-auto p-4 space-y-3">
      {messages.map((m, i) => (
        <div
          key={i}
          className={`p-2 rounded text-black ${
            m.role === 'user'
              ? 'bg-blue-100 self-end'
              : 'bg-gray-100'
          }`}
        >
          <strong>{m.role === 'user' ? 'You' : 'Assistant'}:</strong>
          <div>{m.content}</div>
        </div>
      ))}

      {loading && <div className="text-gray-500">Thinking…</div>}
    </div>
  );
}

function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="border-t p-2 flex gap-2">
      <input
        className="flex-1 border px-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSend();
        }}
        disabled={disabled}
        placeholder="Ask about the data…"
      />
      <button
        onClick={onSend}
        disabled={disabled}
        className="px-3 border rounded"
      >
        Send
      </button>
    </div>
  );
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const [scope, setScope] = useState<Scope>({
    limit: 100,
  });

  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          scope,
        }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Error contacting chat service.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full border rounded">
      <ScopeControls
        scope={scope}
        setScope={setScope}
      />

      <div className="flex flex-col flex-1">
        <MessageList messages={messages} loading={loading} />
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={sendMessage}
          disabled={loading}
        />
      </div>
    </div>
  );
}
