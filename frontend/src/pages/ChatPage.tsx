import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import Button from "../components/Button";
import ResultsChart from "../components/ResultsChart";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function ChatPage() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const [dataset, setDataset] = useState("");
  const [datasets, setDatasets] = useState<any[]>([]);

  const [sql, setSql] = useState("");
  const [rowCount, setRowCount] = useState(0);
  const [results, setResults] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDatasets();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, results]);

  const loadDatasets = async () => {
    try {
      const response = await api.get("/api/datasets");

      setDatasets(response.data);

      if (response.data.length > 0) {
        setDataset(response.data[0].table_name);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;

    if (!dataset) {
      alert("Please select a dataset");
      return;
    }

    const userQuestion = question;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userQuestion,
      },
    ]);

    setQuestion("");
    setLoading(true);

    try {
     const response = await api.post("/api/chat", {
  question: userQuestion,
  dataset,
  history: messages,
});
      setSql(response.data.sql || "");
      setRowCount(response.data.rows?.length || 0);
      setResults(response.data.rows || []);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            response.data.answer ||
            "No answer generated",
        },
      ]);
    } catch (error: any) {
      console.error(error);

      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Something went wrong";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorMessage,
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
         

          <p className="text-slate-500 mt-1">
          <h1> Ask questions about your datasets </h1> 
          </p>
        </div>

        <select
          value={dataset}
          onChange={(e) =>
            setDataset(e.target.value)
          }
          className="border rounded-lg px-4 py-2"
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

      <div className="grid grid-cols-12 gap-6">

        <div className="col-span-3 space-y-6">

          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="text-gray-500">
              Rows Returned
            </h3>

            <p className="text-3xl font-bold mt-2">
              {rowCount}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="text-gray-500 mb-3">
              Generated SQL
            </h3>

            <pre className="text-xs whitespace-pre-wrap">
              {sql || "No query generated"}
            </pre>
          </div>

        </div>

        <div className="col-span-9">

          <div className="bg-white rounded-xl shadow flex flex-col h-[750px]">

            <div className="flex-1 overflow-y-auto p-6 space-y-4">

              {messages.length === 0 && (
                <div className="text-gray-500">
                  Ask a question about your data.
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
                    className={`max-w-2xl px-5 py-3 rounded-2xl ${
                      message.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="bg-slate-100 px-5 py-3 rounded-2xl inline-block">
                  Thinking...
                </div>
              )}

              {results.length > 0 && (
                <>
                  <ResultsChart data={results} />

                  <div className="overflow-auto mt-4">
                    <table className="w-full border text-sm">
                      <thead>
                        <tr>
                          {Object.keys(results[0]).map(
                            (key) => (
                              <th
                                key={key}
                                className="border px-3 py-2 bg-slate-100 text-left"
                              >
                                {key}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>

                      <tbody>
                        {results.map(
                          (row, index) => (
                            <tr key={index}>
                              {Object.values(row).map(
                                (value, i) => (
                                  <td
                                    key={i}
                                    className="border px-3 py-2"
                                  >
                                    {String(value)}
                                  </td>
                                )
                              )}
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t p-4 flex gap-3">

              <input
                value={question}
                onChange={(e) =>
                  setQuestion(e.target.value)
                }
                placeholder="Ask about your dataset..."
                className="flex-1 border rounded-xl px-4 py-3"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAsk();
                  }
                }}
              />

              <Button onClick={handleAsk}>
                Send
              </Button>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default ChatPage;