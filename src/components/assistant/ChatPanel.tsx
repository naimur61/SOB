import { useState } from "react";
import { askAssistant } from "../../assistant/gemini";

type Message = {
  from: "you" | "assistant" | "error";
  text: string;
};

function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);

  const add = (message: Message) => setMessages((current) => [...current, message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = question.trim();
    if (!text) return;

    add({ from: "you", text });
    setQuestion("");
    setPending(true);
    try {
      add({ from: "assistant", text: await askAssistant(text) });
    } catch (err) {
      add({ from: "error", text: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="chat">
      <h2>Sales assistant</h2>

      <ul aria-live="polite">
        {messages.map((message, index) => (
          <li key={index} className={message.from}>
            {message.text}
          </li>
        ))}
        {pending && <li className="muted">Thinking...</li>}
      </ul>

      <form onSubmit={handleSubmit}>
        <input
          aria-label="Your question"
          placeholder="How many orders do we have?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button type="submit" className="primary" disabled={pending}>
          Ask
        </button>
      </form>
    </section>
  );
}

export default ChatPanel;
