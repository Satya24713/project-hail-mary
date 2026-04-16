import { useState, useRef, useEffect } from "react";

const LANGUAGES = [
  { code: "japanese", label: "日本語", name: "Japanese", hint: "East Asian · Agglutinative" },
  { code: "arabic", label: "العربية", name: "Arabic", hint: "Semitic · RTL Script" },
  { code: "hindi", label: "हिन्दी", name: "Hindi", hint: "Indo-Aryan · Devanagari" },
  { code: "russian", label: "Русский", name: "Russian", hint: "Slavic · Cyrillic" },
  { code: "mandarin", label: "普通话", name: "Mandarin", hint: "Sino-Tibetan · Tonal" },
  { code: "swahili", label: "Kiswahili", name: "Swahili", hint: "Bantu · Agglutinative" },
];

const SYSTEM_PROMPT = (language) => `You are an alien intelligence. You communicate ONLY in ${language}. You have no knowledge of English or any other language the human knows.

STRICT RULES:
1. NEVER use English. Not a single word.
2. NEVER translate anything, even if directly asked.
3. Respond naturally to the human's messages as if you understand their intent from context and body language, not words.
4. Use simple, repetitive sentences at first. Gradually introduce more complexity as the "conversation" develops.
5. Use emojis occasionally to give non-verbal context clues (like an alien would use gestures).
6. If the human seems to guess a word correctly (they use it in their message), react with enthusiasm in ${language}.
7. Keep responses SHORT — 1-3 sentences max. This is a communication attempt, not a lecture.
8. Be warm, curious, and encouraging in tone — you WANT to communicate.

You are making first contact. Make it feel real.`;

const HINT_PROMPT = (language, conversation, hypothesis) => `The human is learning ${language} by pure deduction, like decoding an alien language. They have NO prior knowledge.

Here is the conversation so far:
${conversation}

The human's hypothesis: "${hypothesis}"

Respond in plain English (this is a meta-hint, outside the game):
- Is this hypothesis correct, partially correct, or wrong?
- Give a 1-sentence linguistic insight that helps without fully spoiling it.
- Keep it under 40 words. Be like a scientist confirming a finding — precise, not verbose.`;

export default function AlienDecoder() {
  const [phase, setPhase] = useState("select"); // select | decode
  const [selectedLang, setSelectedLang] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [decoded, setDecoded] = useState({}); // { word: meaning }
  const [hypothesis, setHypothesis] = useState("");
  const [hintResult, setHintResult] = useState(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [newEntry, setNewEntry] = useState({ word: "", meaning: "" });
  const [signalStrength, setSignalStrength] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setSignalStrength(Object.keys(decoded).length);
  }, [decoded]);

  const startSession = async (lang) => {
    setSelectedLang(lang);
    setPhase("decode");
    setLoading(true);
    setMessages([]);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: SYSTEM_PROMPT(lang.name),
        messages: [{ role: "user", content: "Hello? Is anyone there?" }],
      }),
    });
    const data = await response.json();
    const text = data.content?.find(b => b.type === "text")?.text || "...";
    setMessages([
      { role: "alien", content: "Hello? Is anyone there?", isHuman: true },
      { role: "alien", content: text, isHuman: false },
    ]);
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user", content: userMsg, isHuman: true }];
    setMessages(newMessages);
    setLoading(true);

    const apiMessages = newMessages.map(m => ({
      role: m.isHuman ? "user" : "assistant",
      content: m.content,
    }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: SYSTEM_PROMPT(selectedLang.name),
        messages: apiMessages,
      }),
    });
    const data = await response.json();
    const text = data.content?.find(b => b.type === "text")?.text || "...";
    setMessages(prev => [...prev, { role: "alien", content: text, isHuman: false }]);
    setLoading(false);
  };

  const checkHypothesis = async () => {
    if (!hypothesis.trim() || hintLoading) return;
    setHintLoading(true);
    setHintResult(null);
    const convo = messages.map(m => `${m.isHuman ? "YOU" : "ALIEN"}: ${m.content}`).join("\n");
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: HINT_PROMPT(selectedLang.name, convo, hypothesis) }],
      }),
    });
    const data = await response.json();
    const text = data.content?.find(b => b.type === "text")?.text || "";
    setHintResult(text);
    setHintLoading(false);
  };

  const addToCodex = () => {
    if (!newEntry.word.trim() || !newEntry.meaning.trim()) return;
    setDecoded(prev => ({ ...prev, [newEntry.word]: newEntry.meaning }));
    setNewEntry({ word: "", meaning: "" });
  };

  const removeFromCodex = (word) => {
    setDecoded(prev => {
      const next = { ...prev };
      delete next[word];
      return next;
    });
  };

  // ── SELECT PHASE ──────────────────────────────────────────────
  if (phase === "select") {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#020408",
        color: "#e2f0ff",
        fontFamily: "'Courier New', monospace",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Star field */}
        <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          {Array.from({ length: 80 }).map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              width: Math.random() > 0.9 ? "2px" : "1px",
              height: Math.random() > 0.9 ? "2px" : "1px",
              background: "#7eb8ff",
              borderRadius: "50%",
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.7 + 0.1,
              animation: `twinkle ${2 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`,
            }} />
          ))}
        </div>

        <style>{`
          @keyframes twinkle { 0%,100%{opacity:.1} 50%{opacity:.8} }
          @keyframes pulse { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.05);opacity:1} }
          @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
          @keyframes glow { 0%,100%{text-shadow:0 0 8px #3a9fff} 50%{text-shadow:0 0 20px #3a9fff,0 0 40px #1a6fdf} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          .lang-card:hover { background: rgba(58,159,255,0.12) !important; border-color: #3a9fff !important; transform: translateY(-2px); }
          .lang-card { transition: all 0.2s ease; cursor: pointer; }
          .send-btn:hover { background: rgba(58,159,255,0.25) !important; }
          .send-btn { transition: all 0.15s; cursor: pointer; }
          .codex-remove:hover { color: #ff6b6b !important; }
        `}</style>

        {/* Scanline effect */}
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 10,
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
        }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: "600px", animation: "fadeUp 0.8s ease" }}>
          <div style={{ fontSize: "0.7rem", letterSpacing: "0.3em", color: "#3a9fff", marginBottom: "1rem", animation: "glow 3s ease-in-out infinite" }}>
            ◈ PROJECT HAIL MARY · LANGUAGE PROTOCOL ◈
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: "900", margin: "0 0 0.5rem", letterSpacing: "-0.02em", lineHeight: 1 }}>
            FIRST<br /><span style={{ color: "#3a9fff" }}>CONTACT</span>
          </h1>
          <p style={{ color: "#7a9cc0", fontSize: "0.85rem", letterSpacing: "0.05em", marginBottom: "3rem", lineHeight: 1.8 }}>
            No dictionary. No translator. No shortcuts.<br />
            Decode a new language the way Ryland Grace decoded Rocky.<br />
            <span style={{ color: "#3a9fff" }}>Pure pattern recognition.</span>
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem", marginBottom: "2rem" }}>
            {LANGUAGES.map(lang => (
              <div key={lang.code} className="lang-card" onClick={() => startSession(lang)} style={{
                background: "rgba(58,159,255,0.05)",
                border: "1px solid rgba(58,159,255,0.2)",
                borderRadius: "8px",
                padding: "1.25rem",
                textAlign: "left",
              }}>
                <div style={{ fontSize: "1.5rem", marginBottom: "0.4rem" }}>{lang.label}</div>
                <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "#c8e0ff" }}>{lang.name}</div>
                <div style={{ fontSize: "0.65rem", color: "#4a7aaa", letterSpacing: "0.08em", marginTop: "0.2rem" }}>{lang.hint}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: "0.65rem", color: "#2a4a6a", letterSpacing: "0.15em" }}>
            SELECT SIGNAL SOURCE TO BEGIN TRANSMISSION
          </div>
        </div>
      </div>
    );
  }

  // ── DECODE PHASE ─────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: "#020408",
      color: "#e2f0ff",
      fontFamily: "'Courier New', monospace",
      display: "grid",
      gridTemplateColumns: "1fr 300px",
      gridTemplateRows: "auto 1fr auto",
      height: "100vh",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes twinkle { 0%,100%{opacity:.1} 50%{opacity:.8} }
        @keyframes glow { 0%,100%{text-shadow:0 0 8px #3a9fff} 50%{text-shadow:0 0 20px #3a9fff} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .msg-alien { animation: fadeIn 0.3s ease; }
        .send-btn:hover { background: rgba(58,159,255,0.3) !important; }
        .check-btn:hover { background: rgba(100,200,100,0.2) !important; }
        .add-btn:hover { background: rgba(58,159,255,0.2) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(58,159,255,0.3); border-radius: 2px; }
      `}</style>

      {/* HEADER */}
      <div style={{
        gridColumn: "1 / -1",
        borderBottom: "1px solid rgba(58,159,255,0.15)",
        padding: "0.75rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(2,4,8,0.9)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button onClick={() => { setPhase("select"); setMessages([]); setDecoded({}); }} style={{
            background: "none", border: "1px solid rgba(58,159,255,0.2)", color: "#3a9fff",
            padding: "0.25rem 0.75rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.7rem", letterSpacing: "0.1em",
          }}>← ABORT</button>
          <div>
            <span style={{ fontSize: "0.65rem", color: "#3a9fff", letterSpacing: "0.2em" }}>SIGNAL SOURCE · </span>
            <span style={{ fontSize: "0.9rem", fontWeight: "700" }}>{selectedLang?.label} {selectedLang?.name}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.65rem", color: "#4a7aaa", letterSpacing: "0.1em" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#3a9fff", animation: "blink 1.5s ease-in-out infinite" }} />
          LIVE TRANSMISSION
        </div>
      </div>

      {/* CHAT */}
      <div style={{ overflow: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {messages.map((msg, i) => (
          <div key={i} className={!msg.isHuman ? "msg-alien" : ""} style={{
            display: "flex",
            flexDirection: msg.isHuman ? "row-reverse" : "row",
            gap: "0.75rem",
            alignItems: "flex-start",
          }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0, marginTop: "2px",
              background: msg.isHuman ? "rgba(58,159,255,0.15)" : "rgba(100,255,150,0.1)",
              border: `1px solid ${msg.isHuman ? "rgba(58,159,255,0.4)" : "rgba(100,255,150,0.3)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.6rem", color: msg.isHuman ? "#3a9fff" : "#64ff96",
            }}>
              {msg.isHuman ? "YOU" : "👽"}
            </div>
            <div style={{
              maxWidth: "70%",
              background: msg.isHuman ? "rgba(58,159,255,0.08)" : "rgba(100,255,150,0.06)",
              border: `1px solid ${msg.isHuman ? "rgba(58,159,255,0.15)" : "rgba(100,255,150,0.12)"}`,
              borderRadius: msg.isHuman ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
              padding: "0.75rem 1rem",
              fontSize: msg.isHuman ? "0.85rem" : "1rem",
              lineHeight: "1.7",
              color: msg.isHuman ? "#7ab0e0" : "#d0ffd0",
              letterSpacing: !msg.isHuman ? "0.03em" : "normal",
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: "rgba(100,255,150,0.1)", border: "1px solid rgba(100,255,150,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem",
            }}>👽</div>
            <div style={{ display: "flex", gap: "4px", padding: "0.75rem" }}>
              {[0, 1, 2].map(j => (
                <div key={j} style={{
                  width: "6px", height: "6px", borderRadius: "50%", background: "#64ff96",
                  animation: `blink 1s ease-in-out ${j * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* SIDEBAR */}
      <div style={{
        borderLeft: "1px solid rgba(58,159,255,0.12)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "rgba(0,0,0,0.3)",
      }}>
        {/* Signal strength */}
        <div style={{ padding: "1rem", borderBottom: "1px solid rgba(58,159,255,0.1)" }}>
          <div style={{ fontSize: "0.6rem", letterSpacing: "0.2em", color: "#3a9fff", marginBottom: "0.5rem" }}>DECODED SIGNAL</div>
          <div style={{ display: "flex", gap: "3px" }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{
                flex: 1, height: "8px", borderRadius: "2px",
                background: i < signalStrength ? "#3a9fff" : "rgba(58,159,255,0.1)",
                transition: "background 0.3s",
              }} />
            ))}
          </div>
          <div style={{ fontSize: "0.65rem", color: "#4a7aaa", marginTop: "0.35rem" }}>
            {signalStrength} word{signalStrength !== 1 ? "s" : ""} decoded
          </div>
        </div>

        {/* Hypothesis checker */}
        <div style={{ padding: "1rem", borderBottom: "1px solid rgba(58,159,255,0.1)" }}>
          <div style={{ fontSize: "0.6rem", letterSpacing: "0.2em", color: "#3a9fff", marginBottom: "0.75rem" }}>HYPOTHESIS SCANNER</div>
          <textarea
            value={hypothesis}
            onChange={e => { setHypothesis(e.target.value); setHintResult(null); }}
            placeholder={`e.g. "watashi means I"`}
            rows={2}
            style={{
              width: "100%", background: "rgba(58,159,255,0.05)", border: "1px solid rgba(58,159,255,0.2)",
              color: "#c8e0ff", padding: "0.5rem", borderRadius: "4px", fontSize: "0.75rem",
              resize: "none", fontFamily: "inherit", boxSizing: "border-box",
            }}
          />
          <button className="check-btn" onClick={checkHypothesis} disabled={hintLoading} style={{
            marginTop: "0.5rem", width: "100%", padding: "0.4rem",
            background: "rgba(100,200,100,0.1)", border: "1px solid rgba(100,200,100,0.2)",
            color: "#64c864", borderRadius: "4px", cursor: "pointer", fontSize: "0.7rem",
            letterSpacing: "0.1em",
          }}>
            {hintLoading ? "SCANNING..." : "◈ RUN SCAN"}
          </button>
          {hintResult && (
            <div style={{
              marginTop: "0.6rem", padding: "0.6rem", background: "rgba(100,200,100,0.05)",
              border: "1px solid rgba(100,200,100,0.15)", borderRadius: "4px",
              fontSize: "0.72rem", color: "#90d890", lineHeight: "1.6",
            }}>
              {hintResult}
            </div>
          )}
        </div>

        {/* Codex */}
        <div style={{ flex: 1, overflow: "auto", padding: "1rem" }}>
          <div style={{ fontSize: "0.6rem", letterSpacing: "0.2em", color: "#3a9fff", marginBottom: "0.75rem" }}>CODEX</div>
          <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.75rem" }}>
            <input value={newEntry.word} onChange={e => setNewEntry(p => ({ ...p, word: e.target.value }))}
              placeholder="word" style={{
                flex: 1, background: "rgba(58,159,255,0.05)", border: "1px solid rgba(58,159,255,0.2)",
                color: "#c8e0ff", padding: "0.35rem 0.5rem", borderRadius: "4px", fontSize: "0.7rem", fontFamily: "inherit",
              }} />
            <input value={newEntry.meaning} onChange={e => setNewEntry(p => ({ ...p, meaning: e.target.value }))}
              placeholder="= ?" style={{
                flex: 1, background: "rgba(58,159,255,0.05)", border: "1px solid rgba(58,159,255,0.2)",
                color: "#c8e0ff", padding: "0.35rem 0.5rem", borderRadius: "4px", fontSize: "0.7rem", fontFamily: "inherit",
              }} onKeyDown={e => e.key === "Enter" && addToCodex()} />
            <button className="add-btn" onClick={addToCodex} style={{
              background: "rgba(58,159,255,0.1)", border: "1px solid rgba(58,159,255,0.25)",
              color: "#3a9fff", width: "28px", borderRadius: "4px", cursor: "pointer", fontSize: "1rem",
            }}>+</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {Object.entries(decoded).map(([word, meaning]) => (
              <div key={word} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.35rem 0.5rem", background: "rgba(58,159,255,0.05)",
                border: "1px solid rgba(58,159,255,0.12)", borderRadius: "4px",
              }}>
                <span style={{ fontSize: "0.85rem", color: "#c8e0ff" }}>{word}</span>
                <span style={{ fontSize: "0.65rem", color: "#4a7aaa", margin: "0 0.4rem" }}>→</span>
                <span style={{ fontSize: "0.75rem", color: "#7ab0e0", flex: 1 }}>{meaning}</span>
                <button className="codex-remove" onClick={() => removeFromCodex(word)} style={{
                  background: "none", border: "none", color: "#2a4a6a", cursor: "pointer", fontSize: "0.75rem",
                }}>✕</button>
              </div>
            ))}
            {Object.keys(decoded).length === 0 && (
              <div style={{ fontSize: "0.65rem", color: "#2a4a6a", fontStyle: "italic", textAlign: "center", padding: "1rem 0" }}>
                Your decoded words appear here
              </div>
            )}
          </div>
        </div>
      </div>

      {/* INPUT */}
      <div style={{
        gridColumn: "1 / 2",
        borderTop: "1px solid rgba(58,159,255,0.12)",
        padding: "1rem 1.5rem",
        display: "flex",
        gap: "0.75rem",
        background: "rgba(2,4,8,0.95)",
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Transmit a message (try gestures, pointing, counting...)"
          style={{
            flex: 1, background: "rgba(58,159,255,0.05)", border: "1px solid rgba(58,159,255,0.2)",
            color: "#e2f0ff", padding: "0.6rem 1rem", borderRadius: "6px", fontSize: "0.85rem",
            fontFamily: "inherit", outline: "none",
          }}
        />
        <button className="send-btn" onClick={sendMessage} disabled={loading} style={{
          background: "rgba(58,159,255,0.12)", border: "1px solid rgba(58,159,255,0.3)",
          color: "#3a9fff", padding: "0.6rem 1.2rem", borderRadius: "6px",
          cursor: "pointer", fontSize: "0.75rem", letterSpacing: "0.1em",
        }}>
          SEND ›
        </button>
      </div>
    </div>
  );
}
