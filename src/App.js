import { useState, useRef, useEffect } from "react";
import "./App.css";

const BINANCE_REF = "https://www.binance.com/activity/referral-entry/CPA?ref=CPA_00SIRBMF1Y&utm_source=electron";

const SYSTEM_PROMPT = `You are CryptoGuide, an expert crypto and Binance assistant for intermediate-level traders. You help with:

- Binance platform features (spot, futures, P2P, launchpad, staking, earn)
- Meme coins and micro-cap token analysis (launchpads like Flap, pump.fun, etc.)
- Trading concepts: market cap, FDV, bonding curves, liquidity, slippage, PnL
- Risk management and position sizing
- Reading charts and indicators (RSI, MACD, volume, support/resistance)
- Token red flags and rug pull detection
- DeFi concepts: DEX, liquidity pools, yield farming
- BSC, Solana, and other chains

You assume the user understands basic crypto (what Bitcoin is, how wallets work) but may not know advanced trading mechanics. Be direct, practical, and honest — especially about risks. Use emojis sparingly but effectively. Never give financial advice, but do give clear, useful analysis.

Keep responses concise and mobile-friendly. Use bullet points for lists. Be conversational.`;

const QUICK_GUIDES = [
  { icon: "📊", label: "Reading Market Cap", prompt: "Explain market cap, FDV, and circulating supply for an intermediate trader. When does it matter?" },
  { icon: "🚩", label: "Rug Pull Red Flags", prompt: "What are the top red flags that a crypto project might be a rug pull or scam?" },
  { icon: "📈", label: "Bonding Curves", prompt: "Explain how bonding curves work on launchpads like Flap. What does progress % mean?" },
  { icon: "💰", label: "Take Profit Strategy", prompt: "What's a good take profit strategy for meme coins with small positions?" },
  { icon: "🔍", label: "How to Audit a Token", prompt: "How do I audit a new token on Binance or BSC? What tools should I use?" },
  { icon: "⚡", label: "Futures vs Spot", prompt: "What's the difference between futures and spot trading on Binance? When should I use each?" },
  { icon: "🧠", label: "Reading RSI & MACD", prompt: "How do I read RSI and MACD on Binance charts? Give me practical examples." },
  { icon: "🌐", label: "BSC vs Solana", prompt: "What's the difference between BSC and Solana for trading meme coins? Pros and cons of each." },
];

const GLOSSARY = [
  { term: "Market Cap", def: "Current price × circulating supply. Shows total value of all coins in circulation." },
  { term: "FDV", def: "Fully Diluted Valuation — price × max supply. What market cap would be if all coins existed." },
  { term: "Bonding Curve", def: "A pricing mechanism on launchpads where price rises as more tokens are bought. Progress % = how close to graduating to a real DEX." },
  { term: "Liquidity", def: "How easily you can buy/sell without moving the price. Low liquidity = high slippage and manipulation risk." },
  { term: "Slippage", def: "The difference between expected price and actual price when trading. Higher on low-liquidity tokens." },
  { term: "PnL", def: "Profit and Loss. Realized PnL = locked in. Unrealized = still on paper." },
  { term: "Rug Pull", def: "When devs drain liquidity and disappear, crashing the token to zero." },
  { term: "BSC", def: "BNB Smart Chain — Binance's blockchain. Lower fees than Ethereum, popular for meme coins." },
  { term: "DEX", def: "Decentralized Exchange (e.g. PancakeSwap). No KYC, trade directly from your wallet." },
  { term: "CEX", def: "Centralized Exchange (e.g. Binance). Requires account/KYC, company holds your funds." },
  { term: "RSI", def: "Relative Strength Index. Above 70 = overbought, below 30 = oversold." },
  { term: "MACD", def: "Moving Average Convergence Divergence. A momentum indicator showing trend changes." },
  { term: "DYOR", def: "Do Your Own Research. Always verify before investing." },
  { term: "FOMO", def: "Fear Of Missing Out. Buying at the top due to hype — a common trap." },
  { term: "P2P", def: "Peer-to-peer trading on Binance. Buy/sell crypto directly with other users using fiat." },
];

const TIPS = [
  { icon: "🎯", title: "Position Sizing", body: "Never put more than 1-5% of your portfolio into a single meme coin. Treat micro-caps as lottery tickets." },
  { icon: "💸", title: "Take Profit in Stages", body: "At 2x, sell 25-50% to recover your initial. Let the rest ride for free. Removes emotional pressure." },
  { icon: "🔍", title: "Check Token Age", body: "Tokens under 7 days old are extremely high risk. Most die within 30 days on launchpads." },
  { icon: "🚩", title: "Red Flags to Watch", body: "Anonymous devs + no code audit + huge dev wallet + copy-pasted narrative = likely rug." },
  { icon: "📊", title: "Volume vs Market Cap", body: "If daily volume is higher than market cap, be cautious — it may be wash trading or a pump scheme." },
  { icon: "⛽", title: "Gas & Fees", body: "On BSC, keep BNB in your wallet for gas. On Solana, keep SOL. Always account for fees in your PnL." },
  { icon: "🧘", title: "Emotional Discipline", body: "Set your exit targets before you enter. Don't move your stop loss down. Stick to the plan." },
  { icon: "📅", title: "Narrative Timing", body: "Meme coins tied to events (holidays, news) peak ON the event. Buy early or not at all." },
];

async function askGemini(messages, apiKey) {
  const contents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { maxOutputTokens: 1000 }
      }),
    }
  );
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
}

function BinanceBanner() {
  return (
    <a href={BINANCE_REF} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
      <div style={{
        margin: "8px 16px",
        background: "linear-gradient(135deg, #1a1500, #2a2000)",
        border: "1px solid #f0b90b55",
        borderRadius: 14,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: "linear-gradient(135deg, #f0b90b, #e57c00)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, fontWeight: "bold", color: "#0a0a0f",
        }}>B</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#f0b90b", fontSize: 13, fontWeight: 700 }}>Start Trading on Binance</div>
          <div style={{ color: "#888", fontSize: 11, marginTop: 2 }}>Sign up & get a welcome bonus 🎁</div>
        </div>
        <div style={{ color: "#f0b90b", fontSize: 16 }}>→</div>
      </div>
    </a>
  );
}

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("gemini_key") || "");
  const [keyInput, setKeyInput] = useState("");
  const [keySet, setKeySet] = useState(() => !!localStorage.getItem("gemini_key"));
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hey! I'm CryptoGuide 🔥 Your Binance & crypto assistant for intermediate traders.\n\nAsk me anything — token analysis, Binance features, trading strategy, red flags, you name it.\n\nOr tap a quick guide below to get started.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [glossarySearch, setGlossarySearch] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function saveKey() {
    if (!keyInput.trim()) return;
    localStorage.setItem("gemini_key", keyInput.trim());
    setApiKey(keyInput.trim());
    setKeySet(true);
  }

  function resetKey() {
    localStorage.removeItem("gemini_key");
    setApiKey("");
    setKeySet(false);
    setKeyInput("");
  }

  async function sendMessage(text) {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const reply = await askGemini(newMessages, apiKey);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ Error: ${e.message}. Click ⚙ Key to update your API key.` }]);
    }
    setLoading(false);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  }

  const filteredGlossary = GLOSSARY.filter(g =>
    g.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
    g.def.toLowerCase().includes(glossarySearch.toLowerCase())
  );

  if (!keySet) {
    return (
      <div className="app" style={{ justifyContent: "center", alignItems: "center", padding: 32 }}>
        <div className="logo-icon" style={{ width: 56, height: 56, fontSize: 28, borderRadius: 16, margin: "0 auto 16px" }}>₿</div>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div className="logo-name" style={{ fontSize: 22, marginBottom: 6 }}>CryptoGuide</div>
          <div style={{ color: "#888", fontSize: 13 }}>Paste your free Gemini API key to get started</div>
        </div>
        <div style={{ width: "100%", maxWidth: 340 }}>
          <div style={{ color: "#f0b90b", fontSize: 12, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Gemini API Key</div>
          <input
            className="search-input"
            placeholder="Paste your key here..."
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            type="password"
            style={{ marginBottom: 12 }}
          />
          <button onClick={saveKey} style={{
            width: "100%", padding: "12px", borderRadius: 12, border: "none",
            background: keyInput.trim() ? "#f0b90b" : "#1e1e2e",
            color: keyInput.trim() ? "#0a0a0f" : "#555",
            fontSize: 14, fontFamily: "inherit", fontWeight: 700, cursor: "pointer", marginBottom: 16,
          }}>Start Using CryptoGuide →</button>
          <div style={{ color: "#555", fontSize: 11, textAlign: "center", lineHeight: 1.6 }}>
            Get your free key at<br />
            <span style={{ color: "#f0b90b" }}>aistudio.google.com</span> → Get API Key
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 24, width: "100%", maxWidth: 480 }}>
          <BinanceBanner />
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <div className="header-top">
          <div className="logo">
            <div className="logo-icon">₿</div>
            <div>
              <div className="logo-name">CryptoGuide</div>
              <div className="logo-sub">Binance & Crypto Assistant</div>
            </div>
          </div>
          <button onClick={resetKey} style={{
            background: "#1a1a2e", border: "1px solid #2a2a3e", borderRadius: 8,
            color: "#888", fontSize: 11, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit"
          }}>⚙ Key</button>
        </div>
        <div className="tabs">
          {["chat", "guides", "glossary", "tips"].map(tab => (
            <button key={tab} className={`tab ${activeTab === tab ? "tab-active" : ""}`} onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}
        </div>
      </div>

      {/* Binance Banner */}
      <BinanceBanner />

      {/* Chat */}
      {activeTab === "chat" && (
        <>
          <div className="messages">
            {messages.map((msg, i) => (
              <div key={i} className={`msg-row ${msg.role === "user" ? "msg-user" : "msg-bot"}`}>
                {msg.role === "assistant" && <div className="bot-avatar">₿</div>}
                <div className={`bubble ${msg.role === "user" ? "bubble-user" : "bubble-bot"}`}>{msg.content}</div>
              </div>
            ))}
            {loading && (
              <div className="msg-row msg-bot">
                <div className="bot-avatar">₿</div>
                <div className="bubble bubble-bot typing"><span /><span /><span /></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="input-bar">
            <textarea
              value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Ask about a coin, Binance feature, strategy..." rows={1} className="input"
            />
            <button className={`send-btn ${input.trim() && !loading ? "send-active" : ""}`}
              onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>↑</button>
          </div>
        </>
      )}

      {/* Guides */}
      {activeTab === "guides" && (
        <div className="scroll-area">
          <div className="section-label">Quick Guides — tap to ask</div>
          <div className="card-list">
            {QUICK_GUIDES.map((g, i) => (
              <button key={i} className="guide-card" onClick={() => { setActiveTab("chat"); setTimeout(() => sendMessage(g.prompt), 150); }}>
                <span className="card-icon">{g.icon}</span>
                <div>
                  <div className="card-title">{g.label}</div>
                  <div className="card-sub">Tap to ask CryptoGuide →</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Glossary */}
      {activeTab === "glossary" && (
        <div className="scroll-area">
          <div className="section-label">Crypto Glossary</div>
          <input className="search-input" placeholder="Search terms..." value={glossarySearch} onChange={e => setGlossarySearch(e.target.value)} />
          <div className="card-list">
            {filteredGlossary.map((g, i) => (
              <div key={i} className="gloss-card">
                <div className="gloss-term">{g.term}</div>
                <div className="gloss-def">{g.def}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      {activeTab === "tips" && (
        <div className="scroll-area">
          <div className="section-label">Intermediate Trading Tips</div>
          <div className="card-list">
            {TIPS.map((t, i) => (
              <div key={i} className="tip-card">
                <span className="card-icon">{t.icon}</span>
                <div>
                  <div className="card-title">{t.title}</div>
                  <div className="tip-body">{t.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
