import { useState } from "react";
import { useForm } from "react-hook-form";
import { askAssistant } from "./gemini";

type Message = {
  from: "you" | "assistant" | "error";
  text: string;
};

type FormValues = { question: string };

function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { question: "" } });

  const add = (message: Message) => setMessages((current) => [...current, message]);

  const onSubmit = async ({ question }: FormValues) => {
    const text = question.trim();
    add({ from: "you", text });
    setValue("question", "");
    try {
      add({ from: "assistant", text: await askAssistant(text) });
    } catch (err) {
      add({ from: "error", text: err instanceof Error ? err.message : "Something went wrong" });
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
        {isSubmitting && <li className="muted">Thinking...</li>}
      </ul>

      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          aria-label="Your question"
          placeholder="How many orders do we have?"
          {...register("question", {
            validate: (value) => value.trim() !== "" || "Type a question first.",
          })}
        />
        <button type="submit" className="primary" disabled={isSubmitting}>
          Ask
        </button>
      </form>
      {errors.question && <p role="alert">{errors.question.message}</p>}
    </section>
  );
}

export default ChatPanel;
