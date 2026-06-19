import { useEffect, useState } from "react";
import { api } from "../services/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function ChatPage() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const [dataset, setDataset] = useState("");
  const [datasets, setDatasets] = useState<any[]>([]);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      const response = await api.get("/api/datasets");

      setDatasets(response.data);

      if (response.data.length > 0) {
        setDataset(response.data[0].table_name);
      }
    } catch (error) {
      console.error("Failed to load datasets", error);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: question,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await api.post("/api/chat", {
        question,
        dataset,
      });

      const aiMessage: Message = {
        role: "assistant",
        content:
          response.data.answer || "No answer returned",
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error processing request",
        },
      ]);
    }

    setQuestion("");
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        AI Data Analyst Chat
      </h1>

      <div className="mb-4">
        <label className="block mb-2 font-semibold">
          Select Dataset
        </label>

        <select
          value={dataset}
          onChange={(e) => setDataset(e.target.value)}
          className="border rounded-lg px-4 py-2 bg-white"
        >
          {datasets.map((item) => (
            <option
              key={item.table_name}
              value={item.table_name}
            >
              {item.table_name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow h-[600px] flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-gray-500">
              Ask a question about your dataset.
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-lg px-4 py-3 rounded-xl ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-black"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t p-4 flex gap-3">
          <input
            type="text"
            value={question}
            onChange={(e) =>
              setQuestion(e.target.value)
            }
            placeholder="Ask about your dataset..."
            className="flex-1 border rounded-lg px-4 py-3"
          />

          <button
            onClick={handleAsk}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;