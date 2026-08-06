import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Mic, Sparkles } from "lucide-react";
import PropertyCard from "./PropertyCard";
import { normalizeProperty } from "../utils/normalizeProperty";

// Chat assistant backend is the FastAPI service on localhost:8000
const API_BASE = "https://kbs-fastapi.onrender.com";

const SpeechRecognitionAPI =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "agent",
      text:
        "Hey! I'm Sema, your property assistant. Tell me what you're looking for — " +
        "budget, area, bedrooms, anything that matters — and I'll search for you. " +
        "You can also tap the mic and speak.",
      results: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const sessionIdRef = useRef(null);
  const recognitionRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (!SpeechRecognitionAPI) return;
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) text += event.results[i][0].transcript;
      setInput(text);
      if (event.results[event.results.length - 1].isFinal) {
        sendMessage(text);
      }
    };
    recognitionRef.current = recognition;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text.replace(/\n/g, ". "));
    utter.rate = 1.03;
    window.speechSynthesis.speak(utter);
  }

  async function sendMessage(rawText) {
    const text = (rawText ?? input).trim();
    if (!text || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text, results: [] }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: sessionIdRef.current }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      sessionIdRef.current = data.session_id;
      const normalizedResults = (data.results || []).map(normalizeProperty);
      setMessages((prev) => [
        ...prev,
        { role: "agent", text: data.reply, results: normalizedResults },
      ]);
      speak(data.reply);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: `Couldn't reach the backend (${err.message}). Is 'uvicorn api:app --port 8000' running?`,
          results: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function toggleMic() {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  }

  return (
    <>
      {/* Floating launcher button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition"
        aria-label="Open Sema assistant"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-5 z-50 w-[92vw] max-w-sm h-[70vh] max-h-[600px] flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white">
            <MessageCircle className="w-5 h-5" />
            <span className="font-semibold">Sema · Property Assistant</span>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50 dark:bg-gray-900">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm border border-gray-200 dark:border-gray-600"
                  }`}
                >
                  {msg.text}
                  {msg.results.length > 0 && (
                    <div className="mt-3 space-y-3">
                      {msg.results.map((property) => (
                        <div key={property.id} className="scale-[0.97] origin-top-left">
                          <PropertyCard property={property} onViewDetails={() => {}} />
                          {property.matchPercentage !== undefined && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {Math.round(property.matchPercentage)}% fit
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="flex items-center gap-2 p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Tell Sema what you're looking for…"
              className="flex-1 px-3 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {SpeechRecognitionAPI && (
              <button
                onClick={toggleMic}
                className={`p-2 rounded-full transition ${
                  listening
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
                aria-label="Speak"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => sendMessage()}
              disabled={loading}
              className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition"
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}