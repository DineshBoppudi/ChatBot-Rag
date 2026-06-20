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

  const [sql, setSql] = useState("");
  const [rowCount, setRowCount] = useState(0);
  const [results, setResults] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // pick dataset from query param so chat focuses on uploaded dataset
    const params = new URLSearchParams(window.location.search);
    const ds = params.get('dataset');
    if (ds) {
      setDataset(ds);
      // initial assistant prompt to ask guiding questions about the uploaded dataset
      setMessages([
        {
          role: 'assistant',
          content: `Dataset "${ds}" is ready. I can help summarize columns, detect missing values, generate SQL queries, or create charts. What would you like to explore? Suggestions: (1) Summary, (2) Top rows, (3) Missing values, (4) Plot a numeric column.`
        }
      ]);
    } else {
      setMessages([
        { role: 'assistant', content: 'No dataset selected — upload a dataset from the Upload page and open the Dashboard to begin analysis.' }
      ]);
    }

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, results]);

  const handleAsk = async () => {
    if (!question.trim()) return;

    const userQuestion = question.trim();

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userQuestion },
    ]);

    setQuestion("");
    setLoading(true);

    try {
      const response = await api.post("/api/chat", { question: userQuestion, dataset });

      setSql(response.data.sql || "");
      setRowCount(response.data.rows?.length || 0);
      setResults(response.data.rows || []);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.data.answer || "No answer generated" },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong." },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">AI Chat</h1>
          <p className="text-sm text-slate-500 mt-1">Ask questions about your dataset and get SQL + results.</p>
        </div>

        <div className="flex items-center gap-3">
          {dataset ? (
            <div className="text-sm text-slate-600">Dataset: <span className="font-medium">{dataset}</span></div>
          ) : (
            <div className="text-sm text-slate-500">No dataset selected</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left info column */}
        <div className="col-span-3 space-y-6">
          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="text-sm text-gray-500">Rows Returned</h3>
            <p className="text-3xl font-bold mt-2">{rowCount}</p>
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="text-sm text-gray-500">Generated SQL</h3>
            <pre className="text-xs whitespace-pre-wrap overflow-auto text-slate-700 mt-2">{sql || "No query generated yet"}</pre>
          </div>
        </div>

        {/* Main chat column */}
        <div className="col-span-9">
          <div className="bg-white rounded-xl shadow flex flex-col" style={{ minHeight: 560 }}>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-gray-500">No conversation yet — ask a question to get started.</div>
              )}

              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`${message.role === 'user' ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow' : 'bg-slate-50 text-slate-800 border border-slate-100'} max-w-2xl px-5 py-3 rounded-2xl`}> 
                    {message.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 px-5 py-3 rounded-2xl">Thinking...</div>
                </div>
              )}

              <div ref={messagesEndRef} />

              {results && results.length > 0 && <ResultsChart data={results} />}
            </div>

            {results.length > 0 && (
              <div className="border-t p-4 max-h-64 overflow-auto">
                <h3 className="font-semibold mb-3">Query Results</h3>
                <div className="overflow-auto">
                  <table className="w-full text-sm table-fixed border-collapse">
                    <thead>
                      <tr className="bg-slate-100">
                        {Object.keys(results[0]).map((key) => (
                          <th key={key} className="border px-3 py-2 text-left">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((row, rIdx) => (
                        <tr key={rIdx} className={`${rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                          {Object.values(row).map((val, i) => (
                            <td key={i} className="border px-3 py-2">{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="border-t p-4 flex gap-3 items-center">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about your dataset... Use Shift+Enter for newline."
                className="flex-1 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 resize-none h-12"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
              />

              <Button onClick={handleAsk} className="px-6">{loading ? 'Sending...' : 'Send'}</Button>
              <Button variant="secondary" onClick={() => { setMessages([]); setResults([]); setSql(''); }}>Clear</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;