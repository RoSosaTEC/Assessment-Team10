import { useState, useRef, useEffect } from "react";

const API_BASE = "http://localhost:5000";

const EXAMPLES = [
  {
    label: "Reuters (Real)",
    text: "Data centres are expected to consume twice as much power and water by 2030 as they expand to meet the surge in demand from artificial intelligence, U.N. researchers said on Wednesday. Unless governments heed the rising environmental costs of AI, the rapid rollout could also strain scarce land resources and create mountains of electronic waste, the United Nations University Institute for Water, Environment and Health warned in a report.",
  },
  {
    label: "Fabricated (Fake)",
    text: "A study conducted by the Centers for Disease Control and Prevention (CDC) found that an “overwhelming majority” of individuals who contracted coronavirus had worn a mask or face covering, proving that neither are effective at preventing the spread of COVID-19.",
  },
];

function ConfidenceBar({ confidence, verdict }) {
  const isFake = verdict === "FAKE";
  const color = isFake ? "#ef4444" : "#22c55e";
  return (
    <div className="confidence-bar-wrap">
      <div className="confidence-label-row">
        <span className="verdict-badge" style={{ background: color }}>{verdict}</span>
        <span className="confidence-pct">{confidence}% confidence</span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${confidence}%`, background: color }} />
      </div>
    </div>
  );
}

function KeywordPill({ word, score }) {
  const opacity = 0.35 + score * 8;
  return (
    <span className="kw-pill" style={{ opacity: Math.min(opacity, 1) }} title={`TF-IDF score: ${score}`}>
      {word}
    </span>
  );
}

function ArticleView({ article, onBack }) {
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, []);
  return (
    <div className="article-view">
      <button className="back-btn" onClick={onBack}>← Back to results</button>
      <div className="article-view-card">
        <div className="article-view-badge">
          <span className="av-tag">✅ REAL</span>
          <span className="av-sim">{Math.round(article.similarity * 100)}% topic similarity</span>
        </div>
        <h2 className="article-view-title">{article.title}</h2>
        <div className="article-view-overlap">
          {article.overlap} keyword{article.overlap !== 1 ? "s" : ""} in common with your article
        </div>
        <div className="article-view-body">{article.snippet}</div>
        <div className="article-view-note">
          This article is from the ISOT dataset, sourced from Reuters.com and verified as real news.
          Only a snippet is shown — consult the original source for the full article.
        </div>
      </div>
    </div>
  );
}

function SuggestionCard({ article, index, onClick }) {
  return (
    <button className="suggestion-card" onClick={() => onClick(article)}>
      <div className="suggestion-card-inner">
        <div className="suggestion-index">#{index + 1}</div>
        <div className="suggestion-body">
          <div className="suggestion-title">{article.title}</div>
          <div className="suggestion-snippet">{article.snippet.slice(0, 120)}…</div>
          <div className="suggestion-meta">
            <span className="suggestion-overlap">{article.overlap} keywords in common</span>
            <span className="suggestion-sim">{Math.round(article.similarity * 100)}% similar</span>
          </div>
        </div>
        <div className="suggestion-arrow">→</div>
      </div>
    </button>
  );
}

function SuggestionsSection({ suggestions, onArticleClick }) {
  const isFake = suggestions.framing.includes("verified");
  return (
    <div className={`suggestions-wrap ${isFake ? "suggestions-fake" : "suggestions-real"}`}>
      <div className="suggestions-header">
        <span className="suggestions-icon">{isFake ? "🔍" : "📰"}</span>
        <div>
          <div className="suggestions-title">{isFake ? "Related verified articles" : "More on this topic"}</div>
          <div className="suggestions-framing">{suggestions.framing}</div>
        </div>
      </div>
      <div className="suggestions-list">
        {suggestions.articles.length === 0 ? (
          <div className="suggestions-empty">No closely related articles found in the dataset for this input.</div>
        ) : (
          suggestions.articles.map((article, i) => (
            <SuggestionCard key={i} article={article} index={i} onClick={onArticleClick} />
          ))
        )}
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo-mark">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 10h10M9 14h7M9 18h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M21 19l-2-2" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <h1 className="site-title">VerifyAI</h1>
          <p className="site-sub">News article authenticity detector</p>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <p>Powered by scikit-learn · ISOT Dataset · Built with Flask + React</p>
    </footer>
  );
}

export default function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const textareaRef = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => {
    if (result && resultRef.current && !selectedArticle) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [result, selectedArticle]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setSelectedArticle(null);
    try {
      const res = await fetch(`${API_BASE}/predict/article`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server error");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (example) => {
    setText(example.text);
    setResult(null);
    setError(null);
    setSelectedArticle(null);
    textareaRef.current?.focus();
  };

  const isFake = result && result.verdict === "FAKE";

  if (selectedArticle) {
    return (
      <div className="app">
        <Header />
        <main className="main">
          <ArticleView article={selectedArticle} onBack={() => setSelectedArticle(null)} />
        </main>
        <Footer />
        <Styles />
      </div>
    );
  }

  return (
    <div className="app">
      <Header />
      <main className="main">
        <div className="info-banner">
          <strong>Trained on the ISOT dataset</strong> — ~44,900 real and fake news articles.
          Paste any news article body text below. Works best with 3+ sentences.
        </div>

        <div className="input-card">
          <textarea
            ref={textareaRef}
            className="textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste a news article here…"
            rows={10}
          />
          <div className="examples-row">
            <span className="examples-label">Try an example:</span>
            {EXAMPLES.map((ex) => (
              <button key={ex.label} className="example-btn" onClick={() => loadExample(ex)}>
                {ex.label}
              </button>
            ))}
          </div>
          <div className="input-footer">
            <span className="char-count">
              {text.trim().split(/\s+/).filter(Boolean).length} words
            </span>
            <button className="submit-btn" onClick={handleSubmit} disabled={loading || !text.trim()}>
              {loading ? (<><span className="spinner" /> Analyzing…</>) : "Analyze →"}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-card"><span>⚠️</span> {error}</div>
        )}

        {result && (
          <div ref={resultRef} className={`result-card ${isFake ? "result-fake" : "result-real"}`}>
            <div className="result-header">
              <span className="result-icon">{isFake ? "🚨" : "✅"}</span>
              <div>
                <div className="result-title">{isFake ? "Likely Fake News" : "Likely Real News"}</div>
                <div className="result-sub">Based on ISOT article classifier</div>
              </div>
            </div>
            <ConfidenceBar confidence={result.confidence} verdict={result.verdict} />
            {result.top_words?.length > 0 && (
              <div className="keywords-section">
                <div className="keywords-title">
                  Top influencing words
                  <span className="keywords-hint"> — TF-IDF features that drove this prediction</span>
                </div>
                <div className="kw-row">
                  {result.top_words.map((kw) => (
                    <KeywordPill key={kw.word} word={kw.word} score={kw.score} />
                  ))}
                </div>
              </div>
            )}
            <div className="result-disclaimer">
              This is an ML prediction, not a verified fact-check. Always consult primary sources.
            </div>
          </div>
        )}

        {result?.suggestions && (
          <SuggestionsSection
            suggestions={result.suggestions}
            onArticleClick={setSelectedArticle}
          />
        )}
      </main>
      <Footer />
      <Styles />
    </div>
  );
}

function Styles() {
  return (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      :root {
        --bg: #0d0f14; --surface: #13161e; --surface2: #1a1e29;
        --border: #252a38; --border-hover: #3a4158;
        --text: #e8eaf2; --text-muted: #6b7492; --text-dim: #9099b8;
        --accent: #5b7fff; --accent-glow: rgba(91,127,255,0.18);
        --red: #ef4444; --red-bg: rgba(239,68,68,0.08); --red-border: rgba(239,68,68,0.25);
        --green: #22c55e; --green-bg: rgba(34,197,94,0.08); --green-border: rgba(34,197,94,0.25);
        --teal: #14b8a6; --teal-bg: rgba(20,184,166,0.08); --teal-border: rgba(20,184,166,0.25);
        --radius: 12px;
        --font-head: 'DM Serif Display', Georgia, serif;
        --font-body: 'DM Sans', system-ui, sans-serif;
        --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
      }
      body { background: var(--bg); color: var(--text); font-family: var(--font-body); }
      .app { min-height: 100vh; display: flex; flex-direction: column; }

      .header { border-bottom: 1px solid var(--border); background: rgba(13,15,20,0.85); backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 10; }
      .header-inner { max-width: 760px; margin: 0 auto; padding: 18px 24px; display: flex; align-items: center; gap: 14px; }
      .logo-mark { color: var(--accent); flex-shrink: 0; }
      .site-title { font-family: var(--font-head); font-size: 1.35rem; letter-spacing: -0.01em; }
      .site-sub { font-size: 0.72rem; color: var(--text-muted); letter-spacing: 0.08em; text-transform: uppercase; margin-top: 1px; }

      .main { max-width: 760px; margin: 0 auto; padding: 40px 24px 80px; display: flex; flex-direction: column; gap: 20px; flex: 1; }

      .info-banner { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px 16px; font-size: 0.84rem; color: var(--text-dim); line-height: 1.5; }
      .info-banner strong { color: var(--text); }

      .input-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
      .textarea { width: 100%; background: transparent; border: none; outline: none; color: var(--text); font-family: var(--font-body); font-size: 0.95rem; line-height: 1.7; padding: 20px; resize: vertical; min-height: 120px; }
      .textarea::placeholder { color: var(--text-muted); }
      .examples-row { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-top: 1px solid var(--border); flex-wrap: wrap; }
      .examples-label { font-size: 0.78rem; color: var(--text-muted); }
      .example-btn { background: none; border: 1px solid var(--border); border-radius: 20px; color: var(--text-dim); font-family: var(--font-body); font-size: 0.78rem; padding: 4px 12px; cursor: pointer; transition: all 0.15s; }
      .example-btn:hover { border-color: var(--accent); color: var(--accent); }
      .input-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-top: 1px solid var(--border); }
      .char-count { font-size: 0.78rem; color: var(--text-muted); font-family: var(--font-mono); }
      .submit-btn { background: var(--accent); border: none; border-radius: 8px; color: #fff; font-family: var(--font-body); font-size: 0.9rem; font-weight: 600; padding: 10px 22px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: opacity 0.15s, transform 0.15s; letter-spacing: 0.01em; }
      .submit-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
      .submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }
      .spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }

      .error-card { background: var(--red-bg); border: 1px solid var(--red-border); border-radius: var(--radius); color: var(--red); padding: 14px 18px; font-size: 0.9rem; display: flex; gap: 10px; align-items: center; }

      .result-card { border-radius: var(--radius); padding: 24px; border: 1px solid; animation: fadeUp 0.3s ease; }
      @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .result-fake { background: var(--red-bg); border-color: var(--red-border); }
      .result-real { background: var(--green-bg); border-color: var(--green-border); }
      .result-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 20px; }
      .result-icon { font-size: 1.8rem; line-height: 1; }
      .result-title { font-family: var(--font-head); font-size: 1.4rem; line-height: 1.2; }
      .result-sub { font-size: 0.8rem; color: var(--text-muted); margin-top: 3px; }

      .confidence-bar-wrap { margin-bottom: 22px; }
      .confidence-label-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
      .verdict-badge { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.1em; color: #fff; padding: 3px 10px; border-radius: 4px; font-family: var(--font-mono); }
      .confidence-pct { font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-dim); }
      .bar-track { height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; }
      .bar-fill { height: 100%; border-radius: 3px; transition: width 0.6s cubic-bezier(0.34,1.56,0.64,1); }

      .keywords-section { border-top: 1px solid rgba(255,255,255,0.06); padding-top: 18px; margin-bottom: 18px; }
      .keywords-title { font-size: 0.8rem; font-weight: 600; color: var(--text-dim); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.06em; }
      .keywords-hint { font-weight: 400; text-transform: none; letter-spacing: 0; color: var(--text-muted); }
      .kw-row { display: flex; flex-wrap: wrap; gap: 8px; }
      .kw-pill { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 5px 12px; font-family: var(--font-mono); font-size: 0.82rem; color: var(--text); }
      .result-disclaimer { font-size: 0.75rem; color: var(--text-muted); border-top: 1px solid rgba(255,255,255,0.05); padding-top: 14px; }

      .suggestions-wrap { border-radius: var(--radius); border: 1px solid; overflow: hidden; animation: fadeUp 0.35s ease 0.1s both; }
      .suggestions-fake { border-color: var(--teal-border); background: var(--teal-bg); }
      .suggestions-real { border-color: var(--border); background: var(--surface); }
      .suggestions-header { display: flex; align-items: flex-start; gap: 12px; padding: 18px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); }
      .suggestions-icon { font-size: 1.4rem; line-height: 1; flex-shrink: 0; margin-top: 2px; }
      .suggestions-title { font-size: 0.9rem; font-weight: 600; color: var(--text); margin-bottom: 3px; }
      .suggestions-framing { font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; }
      .suggestions-list { display: flex; flex-direction: column; }
      .suggestions-empty { padding: 20px; font-size: 0.85rem; color: var(--text-muted); text-align: center; }

      .suggestion-card { background: none; border: none; border-bottom: 1px solid rgba(255,255,255,0.04); width: 100%; text-align: left; cursor: pointer; padding: 0; transition: background 0.15s; }
      .suggestion-card:last-child { border-bottom: none; }
      .suggestion-card:hover { background: rgba(255,255,255,0.04); }
      .suggestion-card:hover .suggestion-arrow { opacity: 1; transform: translateX(3px); }
      .suggestion-card-inner { display: flex; align-items: flex-start; gap: 14px; padding: 16px 20px; }
      .suggestion-index { font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); flex-shrink: 0; padding-top: 2px; min-width: 22px; }
      .suggestion-body { flex: 1; min-width: 0; }
      .suggestion-title { font-size: 0.9rem; font-weight: 600; color: var(--text); margin-bottom: 5px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      .suggestion-snippet { font-size: 0.8rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      .suggestion-meta { display: flex; gap: 14px; }
      .suggestion-overlap, .suggestion-sim { font-size: 0.74rem; font-family: var(--font-mono); color: var(--text-muted); }
      .suggestion-overlap::before { content: "🔑 "; }
      .suggestion-sim::before { content: "≈ "; }
      .suggestion-arrow { font-size: 1rem; color: var(--text-muted); flex-shrink: 0; opacity: 0; transition: opacity 0.15s, transform 0.15s; padding-top: 2px; }

      .article-view { display: flex; flex-direction: column; gap: 16px; }
      .back-btn { background: none; border: 1px solid var(--border); border-radius: 8px; color: var(--text-dim); font-family: var(--font-body); font-size: 0.85rem; padding: 8px 16px; cursor: pointer; align-self: flex-start; transition: all 0.15s; }
      .back-btn:hover { border-color: var(--accent); color: var(--accent); }
      .article-view-card { background: var(--surface); border: 1px solid var(--green-border); border-radius: var(--radius); padding: 28px; display: flex; flex-direction: column; gap: 16px; }
      .article-view-badge { display: flex; align-items: center; gap: 12px; }
      .av-tag { background: var(--green-bg); border: 1px solid var(--green-border); color: var(--green); font-family: var(--font-mono); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; padding: 3px 10px; border-radius: 4px; }
      .av-sim { font-size: 0.8rem; color: var(--text-muted); font-family: var(--font-mono); }
      .article-view-title { font-family: var(--font-head); font-size: 1.5rem; line-height: 1.3; color: var(--text); }
      .article-view-overlap { font-size: 0.8rem; color: var(--teal); font-family: var(--font-mono); }
      .article-view-body { font-size: 0.95rem; line-height: 1.75; color: var(--text-dim); border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px; }
      .article-view-note { font-size: 0.75rem; color: var(--text-muted); border-top: 1px solid rgba(255,255,255,0.05); padding-top: 14px; line-height: 1.5; }

      .footer { text-align: center; padding: 24px; border-top: 1px solid var(--border); font-size: 0.75rem; color: var(--text-muted); }

      @media (max-width: 540px) {
        .main { padding: 24px 16px 60px; }
        .result-title { font-size: 1.15rem; }
        .suggestion-card-inner { padding: 14px 16px; }
      }
    `}</style>
  );
}
