import { useState, useRef, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:5000";

const EXAMPLES = {
  real: "Data centres are expected to consume twice as much power and water by 2030 as they expand to meet the surge in demand from artificial intelligence, U.N. researchers said on Wednesday. Unless governments heed the rising environmental costs of AI, the rapid rollout could also strain scarce land resources and create mountains of electronic waste, the United Nations University Institute for Water, Environment and Health warned in a report.",
  fake: "A study conducted by the Centers for Disease Control and Prevention (CDC) found that an \"overwhelming majority\" of individuals who contracted coronavirus had worn a mask or face covering, proving that neither are effective at preventing the spread of COVID-19.",
};

const TRANSLATIONS = {
  en: {
    brandSub: "News authenticity detector",
    a11yTitle: "Accessibility tools",
    a11ySub: "Font · color · language · text-to-speech",
    langLabel: "Language / Idioma",
    visionLabel: "Color vision",
    cbNone: "Default",
    cbProtan: "Protanopia (red-blind)",
    cbDeutan: "Deuteranopia (green-blind)",
    cbTritan: "Tritanopia (blue-blind)",
    cbMono: "Monochromacy",
    fontLabel: "Font & size",
    dyslexicBtn: "Dyslexia-friendly font",
    contrastBtn: "High contrast",
    fontSizeLabel: "Text size",
    ttsLabel: "Text-to-speech",
    ttsRead: "Read result aloud",
    ttsHint: "Reads the analysis result & verdict",
    ttsStop: "Stop",
    tryExample: "Try an example:",
    exReal: "Reuters (real)",
    exFake: "Fabricated (fake)",
    textareaLabel: "Paste your news article",
    inputHint: "Works best with 3+ sentences. Press Ctrl+Enter to analyze.",
    words: "words",
    analyze: "Analyze",
    analyzing: "Analyzing…",
    ready: "Ready",
    resultReal: "Likely real",
    resultFake: "Likely fake",
    headingReal: "This article appears authentic",
    headingFake: "This article shows signs of misinformation",
    classifierSub: "ISOT dataset classifier · scikit-learn",
    confidenceLabel: "Classifier confidence",
    kwLabel: "Key influencing words",
    kwTooltip: "Words with the highest TF-IDF weight — these drove the classifier's decision most.",
    disclaimer: "ML prediction only — always verify with primary sources before sharing.",
    suggTitle: "Related verified articles",
    errorTitle: "Analysis failed",
    retry: "Try again",
    back: "Back to results",
    verifiedReal: "verified real",
    articleNote: "From the ISOT dataset, sourced from Reuters.com and verified as real. Only a snippet is shown.",
    ttsNoResult: "No result yet. Analyze an article first.",
    noSuggestions: "No closely related verified articles found for this topic.",
    keywordsInCommon: "keywords in common",
    keyword: "keyword",
    similar: "similar",
  },
  es: {
    brandSub: "Detector de autenticidad de noticias",
    a11yTitle: "Herramientas de accesibilidad",
    a11ySub: "Fuente · color · idioma · lectura en voz alta",
    langLabel: "Language / Idioma",
    visionLabel: "Visión del color",
    cbNone: "Por defecto",
    cbProtan: "Protanopía (ceguera al rojo)",
    cbDeutan: "Deuteranopía (ceguera al verde)",
    cbTritan: "Tritanopía (ceguera al azul)",
    cbMono: "Monocromatismo",
    fontLabel: "Fuente y tamaño",
    dyslexicBtn: "Fuente para dislexia",
    contrastBtn: "Alto contraste",
    fontSizeLabel: "Tamaño de texto",
    ttsLabel: "Texto a voz",
    ttsRead: "Leer resultado en voz alta",
    ttsHint: "Lee el resultado y el veredicto del análisis",
    ttsStop: "Detener",
    tryExample: "Prueba un ejemplo:",
    exReal: "Reuters (real)",
    exFake: "Fabricado (falso)",
    textareaLabel: "Pega tu artículo de noticias",
    inputHint: "Funciona mejor con 3+ oraciones. Presiona Ctrl+Enter para analizar.",
    words: "palabras",
    analyze: "Analizar",
    analyzing: "Analizando…",
    ready: "Listo",
    resultReal: "Probablemente real",
    resultFake: "Probablemente falso",
    headingReal: "Este artículo parece auténtico",
    headingFake: "Este artículo muestra señales de desinformación",
    classifierSub: "Clasificador ISOT · scikit-learn",
    confidenceLabel: "Confianza del clasificador",
    kwLabel: "Palabras clave influyentes",
    kwTooltip: "Palabras con mayor peso TF-IDF — estas impulsaron más la decisión del clasificador.",
    disclaimer: "Solo una predicción de ML — verifica siempre con fuentes primarias antes de compartir.",
    suggTitle: "Artículos verificados relacionados",
    errorTitle: "El análisis falló",
    retry: "Intentar de nuevo",
    back: "Volver a los resultados",
    verifiedReal: "verificado real",
    articleNote: "Del conjunto de datos ISOT, de Reuters.com, verificado como real. Solo se muestra un fragmento.",
    ttsNoResult: "Sin resultado aún. Analiza un artículo primero.",
    noSuggestions: "No se encontraron artículos verificados relacionados para este tema.",
    keywordsInCommon: "palabras clave en común",
    keyword: "palabra clave",
    similar: "similitud",
  },
};

const CB_FILTERS = {
  none: "none",
  protan: "url(#cb-protan)",
  deutan: "url(#cb-deutan)",
  tritan: "url(#cb-tritan)",
  mono: "grayscale(100%) contrast(1.15)",
};

function ColorBlindSVGFilters() {
  return (
    <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
      <defs>
        <filter id="cb-protan">
          <feColorMatrix type="matrix" values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0" />
        </filter>
        <filter id="cb-deutan">
          <feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0" />
        </filter>
        <filter id="cb-tritan">
          <feColorMatrix type="matrix" values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0" />
        </filter>
      </defs>
    </svg>
  );
}

function A11yPanel({ t, lang, setLang, cbMode, setCbMode, dyslexic, toggleDyslexic, hiContrast, toggleHiContrast, fontSize, setFontSize, onTTSRead, ttsPlaying, onTTSStop, hasResult }) {
  const [open, setOpen] = useState(false);
  const CB_OPTIONS = [
    { id: "none", label: t.cbNone, icon: "ti-eye" },
    { id: "protan", label: t.cbProtan, icon: "ti-eye-off" },
    { id: "deutan", label: t.cbDeutan, icon: "ti-eye-off" },
    { id: "tritan", label: t.cbTritan, icon: "ti-eye-off" },
    { id: "mono", label: t.cbMono, icon: "ti-circle-half-2" },
  ];
  return (
    <div className="a11y-panel" role="region" aria-label={t.a11yTitle}>
      <button className="a11y-header" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls="a11y-body">
        <div className="a11y-header-left">
          <i className="ti ti-accessible" aria-hidden="true" />
          <div>
            <div className="a11y-header-title">{t.a11yTitle}</div>
            <div className="a11y-header-sub">{t.a11ySub}</div>
          </div>
        </div>
        <i className={`ti ti-chevron-down a11y-chevron${open ? " open" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="a11y-body" id="a11y-body">

          <div>
            <div className="a11y-section-label">{t.langLabel}</div>
            <div className="lang-toggle" role="group" aria-label={t.langLabel}>
              {["en", "es"].map(l => (
                <button key={l} className={`lang-opt${lang === l ? " active" : ""}`} onClick={() => setLang(l)} aria-pressed={lang === l}>
                  {l === "en" ? "English" : "Español"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="a11y-section-label">{t.visionLabel}</div>
            <div className="a11y-row" role="group" aria-label={t.visionLabel}>
              {CB_OPTIONS.map(opt => (
                <button key={opt.id} className={`a11y-btn${cbMode === opt.id ? " active" : ""}`} onClick={() => setCbMode(opt.id)} aria-pressed={cbMode === opt.id}>
                  <i className={`ti ${opt.icon}`} aria-hidden="true" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="a11y-section-label">{t.fontLabel}</div>
            <div className="a11y-row" style={{ marginBottom: 10 }}>
              <button className={`a11y-btn${dyslexic ? " active" : ""}`} onClick={toggleDyslexic} aria-pressed={dyslexic}>
                <i className="ti ti-letter-a" aria-hidden="true" />
                {t.dyslexicBtn}
              </button>
              <button className={`a11y-btn${hiContrast ? " active" : ""}`} onClick={toggleHiContrast} aria-pressed={hiContrast}>
                <i className="ti ti-contrast" aria-hidden="true" />
                {t.contrastBtn}
              </button>
            </div>
            <div className="fs-row">
              <label htmlFor="fs-slider" style={{ fontSize: 13, color: "var(--ink2)", whiteSpace: "nowrap" }}>{t.fontSizeLabel}</label>
              <input type="range" id="fs-slider" min={13} max={22} step={1} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} aria-label={t.fontSizeLabel} aria-valuenow={fontSize} aria-valuemin={13} aria-valuemax={22} style={{ flex: 1 }} />
              <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 500, color: "var(--acc)", minWidth: 36, textAlign: "right" }} aria-live="polite">{fontSize}px</span>
            </div>
          </div>

          <div>
            <div className="a11y-section-label">{t.ttsLabel}</div>
            <div className="tts-bar">
              {!ttsPlaying ? (
                <button className="tts-btn" onClick={onTTSRead} disabled={!hasResult} aria-label={t.ttsRead}>
                  <i className="ti ti-volume" aria-hidden="true" />
                  {t.ttsRead}
                </button>
              ) : (
                <button className="tts-stop" onClick={onTTSStop} aria-label={t.ttsStop}>
                  <i className="ti ti-player-stop" aria-hidden="true" />
                  {t.ttsStop}
                </button>
              )}
              <span className="tts-label">{t.ttsHint}</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

function ConfidenceBar({ confidence, isFake }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { requestAnimationFrame(() => setWidth(confidence)); }, [confidence]);
  return (
    <div className="r-conf">
      <div className="r-conf-row">
        <span className="r-conf-lbl" id="conf-label">Classifier confidence</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>{confidence}%</span>
      </div>
      <div className="bar-track" role="meter" aria-valuenow={confidence} aria-valuemin={0} aria-valuemax={100} aria-labelledby="conf-label">
        <div className={`bar-fill ${isFake ? "bf-fake" : "bf-real"}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function KeywordPill({ word, score }) {
  const opacity = Math.min(0.4 + score * 8, 1);
  return (
    <span className="kw-pill" style={{ opacity }} title={`Influence: ${score.toFixed(4)}`}>{word}</span>
  );
}

function ResultCard({ result, t }) {
  const isFake = result.verdict === "FAKE";
  const icon = isFake ? "ti-circle-x" : "ti-circle-check";
  return (
    <div className={`result-wrap r-${isFake ? "fake" : "real"}`} role="region" aria-label={isFake ? t.headingFake : t.headingReal}>
      <div className="r-hero">
        <div className={`r-icon ${isFake ? "fake" : "real"}`}>
          <i className={`ti ${icon}`} aria-hidden="true" />
        </div>
        <div>
          <div className={`r-vpill ${isFake ? "fake" : "real"}`}>{result.verdict}</div>
          <div className="r-heading">{isFake ? t.headingFake : t.headingReal}</div>
          <div className="r-sub">{t.classifierSub}</div>
        </div>
      </div>
      <ConfidenceBar confidence={result.confidence} isFake={isFake} />
      {result.top_words?.length > 0 && (
        <div className="kw-sec">
          <div className="kw-lbl-row">
            <span className="kw-lbl">{t.kwLabel}</span>
            <div className="kw-tip-wrap">
              <button className="kw-tip-btn" aria-label={t.kwTooltip} tabIndex={0}>
                <i className="ti ti-help-small" aria-hidden="true" />
              </button>
              <div className="kw-tip-pop" role="tooltip">{t.kwTooltip}</div>
            </div>
          </div>
          <div className="kw-row">
            {result.top_words.map(kw => <KeywordPill key={kw.word} word={kw.word} score={kw.score} />)}
          </div>
        </div>
      )}
      <div className="r-foot">
        <i className="ti ti-info-circle" aria-hidden="true" />
        <span>{t.disclaimer}</span>
      </div>
    </div>
  );
}

function SuggestionsSection({ suggestions, t, onArticleClick }) {
  return (
    <div className="sugg-wrap" role="complementary" aria-label={t.suggTitle}>
      <div className="sugg-head">
        <div className="sugg-head-icon"><i className="ti ti-search" aria-hidden="true" /></div>
        <div>
          <div className="sugg-head-title">{t.suggTitle}</div>
          <div className="sugg-head-sub">{suggestions.framing}</div>
        </div>
      </div>
      <div>
        {suggestions.articles.length === 0 ? (
          <p className="empty">{t.noSuggestions}</p>
        ) : suggestions.articles.map((article, i) => (
          <button key={i} className="sugg-item" onClick={() => onArticleClick(article)} aria-label={article.title}>
            <span className="sugg-num" aria-hidden="true">#{i + 1}</span>
            <div className="sugg-body">
              <div className="sugg-title">{article.title}</div>
              <div className="sugg-snip">{article.snippet.slice(0, 120)}…</div>
              <div className="sugg-tags">
                <span className="sugg-tag">
                  <i className="ti ti-key" aria-hidden="true" />
                  {article.overlap} {article.overlap === 1 ? t.keyword : t.keywordsInCommon}
                </span>
                <span className="sugg-tag">
                  <i className="ti ti-adjustments-horizontal" aria-hidden="true" />
                  {Math.round(article.similarity * 100)}% {t.similar}
                </span>
              </div>
            </div>
            <i className="ti ti-arrow-right sugg-arr" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ArticleView({ article, t, onBack }) {
  const backRef = useRef(null);
  useEffect(() => {
    backRef.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  return (
    <div className="art-view" role="region" aria-label="Article detail">
      <button className="back-btn" ref={backRef} onClick={onBack}>
        <i className="ti ti-arrow-left" aria-hidden="true" />
        {t.back}
      </button>
      <div className="art-card" role="article">
        <div className="art-top">
          <div className="art-badges">
            <span className="real-badge">{t.verifiedReal}</span>
            <span className="sim-lbl">{Math.round(article.similarity * 100)}% {t.similar}</span>
          </div>
          <div className="art-title">{article.title}</div>
          <div className="art-kw">
            <i className="ti ti-key" aria-hidden="true" />
            {article.overlap} {article.overlap === 1 ? t.keyword : t.keywordsInCommon}
          </div>
        </div>
        <div className="art-body">{article.snippet}</div>
        <div className="art-note">
          <i className="ti ti-info-circle" aria-hidden="true" />
          {t.articleNote}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);

  const [lang, setLangState] = useState("en");
  const [cbMode, setCbModeState] = useState("none");
  const [dyslexic, setDyslexic] = useState(false);
  const [hiContrast, setHiContrast] = useState(false);
  const [fontSize, setFontSizeState] = useState(15);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [statusState, setStatusState] = useState("ok");

  const textareaRef = useRef(null);
  const resultRef = useRef(null);
  const t = TRANSLATIONS[lang];

  const setLang = useCallback((l) => {
    setLangState(l);
    document.documentElement.lang = l;
  }, []);

  const setCbMode = useCallback((mode) => {
    setCbModeState(mode);
    const filter = CB_FILTERS[mode] || "none";
    document.body.style.filter = filter;
  }, []);

  const toggleDyslexic = useCallback(() => {
    setDyslexic(d => {
      const next = !d;
      document.body.classList.toggle("dyslexic", next);
      return next;
    });
  }, []);

  const toggleHiContrast = useCallback(() => {
    setHiContrast(h => {
      const next = !h;
      document.body.classList.toggle("hi-contrast", next);
      return next;
    });
  }, []);

  const setFontSize = useCallback((v) => {
    setFontSizeState(v);
    document.documentElement.style.setProperty("--app-fs", v + "px");
  }, []);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const canSubmit = text.trim() && wordCount >= 10;

  const statusText = (() => {
    if (loading) return t.analyzing;
    if (error) return t.errorTitle;
    if (result) return (result.verdict === "FAKE" ? t.resultFake : t.resultReal) + " · " + result.confidence + "%";
    return t.ready;
  })();

  useEffect(() => {
    if (result && resultRef.current && !selectedArticle) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [result, selectedArticle]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setSelectedArticle(null);
    stopTTS();
    try {
      const res = await fetch(`${API_BASE}/predict/article`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server error.");
      setResult(data);
      setStatusState("ok");
    } catch (err) {
      setError(err.message);
      setStatusState("error");
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (type) => {
    setText(EXAMPLES[type]);
    setResult(null);
    setError(null);
    setSelectedArticle(null);
    stopTTS();
    textareaRef.current?.focus();
  };

  const startTTS = () => {
    if (!result) { alert(t.ttsNoResult); return; }
    stopTTS();
    const isFake = result.verdict === "FAKE";
    const script = (isFake ? t.headingFake : t.headingReal) + ". " + t.confidenceLabel + ": " + result.confidence + "%. " + t.disclaimer;
    const utt = new SpeechSynthesisUtterance(script);
    utt.lang = lang === "es" ? "es-ES" : "en-US";
    utt.onend = () => setTtsPlaying(false);
    window.speechSynthesis.speak(utt);
    setTtsPlaying(true);
  };

  const stopTTS = () => {
    window.speechSynthesis.cancel();
    setTtsPlaying(false);
  };

  if (selectedArticle) {
    return (
      <div className="app" style={{ fontSize: "var(--app-fs, 15px)" }}>
        <ColorBlindSVGFilters />
        <Header t={t} statusState={statusState} statusText={statusText} loading={loading} />
        <main className="main">
          <ArticleView article={selectedArticle} t={t} onBack={() => setSelectedArticle(null)} />
        </main>
        <Footer />
        <Styles />
      </div>
    );
  }

  return (
    <div className="app" style={{ fontSize: "var(--app-fs, 15px)" }}>
      <ColorBlindSVGFilters />
      <a className="skip-link" href="#main-input">Skip to article input</a>

      <Header t={t} statusState={statusState} statusText={statusText} loading={loading} />

      <main className="main">
        <A11yPanel
          t={t}
          lang={lang}
          setLang={setLang}
          cbMode={cbMode}
          setCbMode={setCbMode}
          dyslexic={dyslexic}
          toggleDyslexic={toggleDyslexic}
          hiContrast={hiContrast}
          toggleHiContrast={toggleHiContrast}
          fontSize={fontSize}
          setFontSize={setFontSize}
          onTTSRead={startTTS}
          ttsPlaying={ttsPlaying}
          onTTSStop={stopTTS}
          hasResult={!!result}
        />

        <div className="input-card">
          <label htmlFor="main-input" className="sr-only">{t.textareaLabel}</label>
          <textarea
            id="main-input"
            ref={textareaRef}
            className="textarea"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={lang === "es" ? "Pega un artículo de noticias aquí…" : "Paste a news article here…"}
            rows={8}
            spellCheck={false}
            aria-describedby="input-hint wc-count"
            onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && canSubmit) handleSubmit(); }}
          />
          <div className="input-hint-bar" id="input-hint">{t.inputHint}</div>
          <div className="input-mid">
            <span style={{ fontSize: 12, color: "var(--ink3)" }}>{t.tryExample}</span>
            <button className="ex-btn" onClick={() => loadExample("real")}>{t.exReal}</button>
            <button className="ex-btn" onClick={() => loadExample("fake")}>{t.exFake}</button>
          </div>
          <div className="input-footer">
            <span className={`wc${wordCount > 0 && wordCount < 10 ? " warn" : ""}`} id="wc-count" aria-live="polite">
              {wordCount} {t.words}
            </span>
            <button className="analyze-btn" onClick={handleSubmit} disabled={loading || !canSubmit} aria-disabled={loading || !canSubmit}>
              {loading ? <><span className="spin" aria-hidden="true" /> {t.analyzing}</> : <><i className="ti ti-scan" aria-hidden="true" />{t.analyze}</>}
            </button>
          </div>
        </div>

        {error && (
          <div className="err-card" role="alert">
            <div className="err-icon"><i className="ti ti-alert-circle" aria-hidden="true" /></div>
            <div>
              <div className="err-title">{t.errorTitle}</div>
              <div className="err-msg">{error}</div>
              <button className="err-retry" onClick={handleSubmit}>{t.retry}</button>
            </div>
          </div>
        )}

        {result && (
          <div ref={resultRef}>
            <ResultCard result={result} t={t} />
          </div>
        )}

        {result?.suggestions && (
          <SuggestionsSection suggestions={result.suggestions} t={t} onArticleClick={setSelectedArticle} />
        )}
      </main>

      <Footer />
      <Styles />
    </div>
  );
}

function Header({ t, statusState, statusText, loading }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-icon" aria-hidden="true"><i className="ti ti-shield-check" /></div>
        <div>
          <div className="brand-name">VerifyAI</div>
          <div className="brand-sub">{t.brandSub}</div>
        </div>
      </div>
      <div className="status-pill" role="status" aria-live="polite" aria-atomic="true">
        <div className={`sdot${loading ? " loading" : statusState === "error" ? " error" : ""}`} />
        <span>{statusText}</span>
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

function Styles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=OpenDyslexic:wght@400;700&display=swap');
      @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css');

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      :root {
        --ink: #1A1230; --ink2: #3D3660; --ink3: #7B74A8;
        --page: #F5F3FF; --card: #FFFFFF; --card2: #EEEBFF;
        --acc: #4A3AB5; --acc2: #6B5CE7; --acc-light: #EAE8FF; --acc-border: #C4BEFF;
        --red-bg: #FFF0F0; --red-b: #F09595; --red-t: #791F1F; --red-m: #E24B4A;
        --grn-bg: #EDFAE1; --grn-b: #97C459; --grn-t: #27500A; --grn-m: #639922;
        --teal: #0F6E56; --teal-bg: #E1F5EE; --teal-b: #5DCAA5;
        --r: 12px; --rsm: 8px; --rpill: 100px;
        --font: system-ui, sans-serif; --mono: 'JetBrains Mono', monospace;
        --app-fs: 15px;
      }
      body { font-family: var(--font); background: var(--page); color: var(--ink); font-size: var(--app-fs); }
      body.dyslexic * { font-family: 'OpenDyslexic', sans-serif !important; }
      body.hi-contrast {
        --ink: #000000; --ink2: #111111; --ink3: #333333;
        --card: #FFFFFF; --card2: #F0F0F0; --page: #FFFFFF;
        --acc: #1A0D7A; --acc2: #2B1BB0; --acc-light: #E0DDFF; --acc-border: #6B5CE7;
        --red-m: #C00000; --grn-m: #006600;
      }
      .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
      .skip-link { position: absolute; top: -60px; left: 12px; background: var(--acc); color: #fff; padding: 8px 16px; border-radius: var(--rsm); font-size: 14px; font-weight: 500; text-decoration: none; z-index: 99; }
      .skip-link:focus { top: 12px; }
      .app { min-height: 100vh; display: flex; flex-direction: column; background: var(--page); }
      .topbar { background: var(--acc); padding: 16px 22px; display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
      .brand { display: flex; align-items: center; gap: 11px; }
      .brand-icon { width: 36px; height: 36px; background: rgba(255,255,255,0.18); border-radius: var(--rsm); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .brand-icon i { font-size: 20px; color: #fff; }
      .brand-name { font-size: 17px; font-weight: 500; color: #fff; }
      .brand-sub { font-size: 11px; color: rgba(255,255,255,0.65); margin-top: 1px; }
      .status-pill { display: flex; align-items: center; gap: 7px; background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.22); border-radius: var(--rpill); padding: 5px 13px; font-size: 12px; color: rgba(255,255,255,0.92); }
      .sdot { width: 7px; height: 7px; border-radius: 50%; background: #97C459; flex-shrink: 0; }
      .sdot.loading { background: #EF9F27; animation: pulse 1s infinite; }
      .sdot.error { background: #F09595; }
      @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

      .main { max-width: 700px; margin: 0 auto; width: 100%; padding: 24px 18px 60px; display: flex; flex-direction: column; gap: 14px; flex: 1; }

      .a11y-panel { background: var(--card); border: 1.5px solid var(--acc-border); border-radius: var(--r); overflow: hidden; }
      .a11y-header { background: var(--acc-light); padding: 12px 18px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; border: none; width: 100%; text-align: left; font-family: inherit; }
      .a11y-header:focus-visible { outline: 2px solid var(--acc); outline-offset: -2px; }
      .a11y-header-left { display: flex; align-items: center; gap: 9px; }
      .a11y-header-left i { font-size: 18px; color: var(--acc); }
      .a11y-header-title { font-size: 14px; font-weight: 500; color: var(--acc); }
      .a11y-header-sub { font-size: 12px; color: var(--ink3); margin-top: 1px; }
      .a11y-chevron { font-size: 18px; color: var(--acc); transition: transform 0.2s; }
      .a11y-chevron.open { transform: rotate(180deg); }
      .a11y-body { padding: 16px 18px; display: flex; flex-direction: column; gap: 16px; border-top: 1px solid var(--acc-border); }
      .a11y-section-label { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.07em; color: var(--ink3); margin-bottom: 8px; }
      .a11y-row { display: flex; flex-wrap: wrap; gap: 8px; }
      .a11y-btn { display: flex; align-items: center; gap: 7px; background: var(--card2); border: 1.5px solid var(--acc-border); border-radius: var(--rsm); padding: 7px 13px; font-family: inherit; font-size: 13px; color: var(--acc); cursor: pointer; transition: all 0.14s; }
      .a11y-btn i { font-size: 15px; }
      .a11y-btn:hover { background: var(--acc-light); border-color: var(--acc2); }
      .a11y-btn:focus-visible { outline: 2px solid var(--acc); outline-offset: 2px; }
      .a11y-btn.active { background: var(--acc); border-color: var(--acc); color: #fff; }
      .lang-toggle { display: flex; border: 1.5px solid var(--acc-border); border-radius: var(--rsm); overflow: hidden; }
      .lang-opt { flex: 1; padding: 7px 16px; background: transparent; border: none; font-family: inherit; font-size: 13px; color: var(--ink2); cursor: pointer; transition: all 0.14s; }
      .lang-opt:focus-visible { outline: 2px solid var(--acc); outline-offset: -2px; }
      .lang-opt.active { background: var(--acc); color: #fff; font-weight: 500; }
      .lang-opt:not(.active):hover { background: var(--card2); }
      .fs-row { display: flex; align-items: center; gap: 12px; }
      .tts-bar { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: var(--card2); border: 1.5px solid var(--acc-border); border-radius: var(--rsm); }
      .tts-btn { background: var(--acc); border: none; border-radius: var(--rsm); color: #fff; font-family: inherit; font-size: 13px; padding: 7px 14px; cursor: pointer; display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
      .tts-btn:focus-visible { outline: 2px solid var(--acc); outline-offset: 2px; }
      .tts-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .tts-label { font-size: 12px; color: var(--ink3); flex: 1; }
      .tts-stop { background: var(--red-bg); border: 1px solid var(--red-b); border-radius: var(--rsm); color: var(--red-t); font-family: inherit; font-size: 12px; padding: 6px 11px; cursor: pointer; display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
      .tts-stop:focus-visible { outline: 2px solid var(--acc); outline-offset: 2px; }

      .input-card { background: var(--card); border: 1.5px solid var(--acc-border); border-radius: var(--r); overflow: hidden; }
      .input-card:focus-within { border-color: var(--acc2); }
      .textarea { width: 100%; background: transparent; border: none; outline: none; color: var(--ink); font-family: inherit; font-size: inherit; line-height: 1.75; padding: 18px 20px; resize: vertical; min-height: 130px; display: block; }
      .textarea::placeholder { color: var(--ink3); }
      .input-hint-bar { padding: 6px 14px 7px; background: var(--card2); border-top: 1px solid var(--acc-border); font-size: 12px; color: var(--ink3); }
      .input-mid { padding: 9px 14px; background: var(--card2); border-top: 1px solid var(--acc-border); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .ex-btn { background: var(--card); border: 1px solid var(--acc-border); border-radius: var(--rpill); color: var(--acc); font-family: inherit; font-size: 12px; padding: 4px 12px; cursor: pointer; font-weight: 500; transition: all 0.14s; }
      .ex-btn:hover { background: var(--acc-light); }
      .ex-btn:focus-visible { outline: 2px solid var(--acc); outline-offset: 2px; }
      .input-footer { padding: 11px 14px; border-top: 1px solid var(--acc-border); display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      .wc { font-family: var(--mono); font-size: 12px; color: var(--ink3); }
      .wc.warn { color: #854F0B; }
      .analyze-btn { background: var(--acc2); border: none; border-radius: var(--rsm); color: #fff; font-family: inherit; font-size: 14px; font-weight: 500; padding: 9px 20px; cursor: pointer; display: flex; align-items: center; gap: 7px; transition: opacity 0.14s, transform 0.1s; }
      .analyze-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
      .analyze-btn:focus-visible { outline: 2px solid var(--acc); outline-offset: 3px; }
      .analyze-btn:disabled { opacity: 0.35; cursor: not-allowed; }
      .spin { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: rot 0.7s linear infinite; display: inline-block; }
      @keyframes rot { to { transform: rotate(360deg); } }

      .err-card { background: var(--red-bg); border: 1.5px solid var(--red-b); border-radius: var(--r); padding: 15px 18px; display: flex; gap: 11px; animation: up 0.25s ease; }
      .err-icon { width: 34px; height: 34px; background: #F7C1C1; border-radius: var(--rsm); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .err-icon i { font-size: 18px; color: var(--red-t); }
      .err-title { font-size: 14px; font-weight: 500; color: var(--red-t); }
      .err-msg { font-size: 13px; color: var(--red-t); margin-top: 3px; }
      .err-retry { background: transparent; border: 1px solid var(--red-b); border-radius: var(--rsm); color: var(--red-t); font-family: inherit; font-size: 12px; padding: 5px 12px; cursor: pointer; margin-top: 8px; }
      .err-retry:focus-visible { outline: 2px solid var(--acc); outline-offset: 2px; }

      @keyframes up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

      .result-wrap { border-radius: var(--r); border: 1.5px solid; overflow: hidden; animation: up 0.28s ease; }
      .r-fake { background: var(--red-bg); border-color: var(--red-m); }
      .r-real { background: var(--grn-bg); border-color: var(--grn-m); }
      .r-hero { padding: 20px 20px 0; display: flex; align-items: flex-start; gap: 14px; }
      .r-icon { width: 46px; height: 46px; border-radius: var(--rsm); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .r-icon.fake { background: var(--red-m); } .r-icon.real { background: var(--grn-m); }
      .r-icon i { font-size: 24px; color: #fff; }
      .r-vpill { display: inline-block; font-family: var(--mono); font-size: 10px; font-weight: 500; letter-spacing: 0.08em; padding: 3px 10px; border-radius: var(--rpill); border: 1px solid; margin-bottom: 5px; }
      .r-vpill.fake { background: #F7C1C1; border-color: var(--red-m); color: var(--red-t); }
      .r-vpill.real { background: #C0DD97; border-color: var(--grn-m); color: var(--grn-t); }
      .r-heading { font-size: 18px; font-weight: 500; color: var(--ink); line-height: 1.3; }
      .r-sub { font-size: 12px; color: var(--ink3); margin-top: 3px; }
      .r-conf { padding: 15px 20px; }
      .r-conf-row { display: flex; justify-content: space-between; margin-bottom: 7px; }
      .r-conf-lbl { font-size: 13px; color: var(--ink2); }
      .bar-track { height: 9px; background: rgba(0,0,0,0.09); border-radius: 5px; overflow: hidden; }
      .bar-fill { height: 100%; border-radius: 5px; transition: width 0.9s cubic-bezier(0.34,1.56,0.64,1); width: 0; }
      .bf-fake { background: var(--red-m); } .bf-real { background: var(--grn-m); }
      .kw-sec { padding: 0 20px 16px; border-top: 1px solid rgba(0,0,0,0.07); padding-top: 14px; }
      .kw-lbl-row { display: flex; align-items: center; gap: 7px; margin-bottom: 9px; }
      .kw-lbl { font-size: 11px; font-weight: 500; color: var(--ink2); text-transform: uppercase; letter-spacing: 0.07em; }
      .kw-tip-wrap { position: relative; display: inline-block; }
      .kw-tip-btn { background: rgba(0,0,0,0.06); border: none; border-radius: 50%; width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: var(--ink3); }
      .kw-tip-btn:focus-visible { outline: 2px solid var(--acc); outline-offset: 2px; }
      .kw-tip-pop { display: none; position: absolute; top: 24px; left: 0; z-index: 10; background: var(--ink); color: #fff; border-radius: var(--rsm); padding: 10px 12px; font-size: 12px; line-height: 1.5; max-width: 220px; pointer-events: none; }
      .kw-tip-wrap:hover .kw-tip-pop, .kw-tip-wrap:focus-within .kw-tip-pop { display: block; }
      .kw-row { display: flex; flex-wrap: wrap; gap: 7px; }
      .kw-pill { background: rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.1); border-radius: 6px; padding: 5px 11px; font-family: var(--mono); font-size: 12px; color: var(--ink2); cursor: default; }
      .r-foot { padding: 11px 20px; border-top: 1px solid rgba(0,0,0,0.07); background: rgba(0,0,0,0.03); display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--ink3); }
      .r-foot i { font-size: 14px; }

      .sugg-wrap { background: var(--card); border: 1.5px solid var(--acc-border); border-radius: var(--r); overflow: hidden; animation: up 0.3s ease 0.1s both; }
      .sugg-head { background: var(--acc-light); padding: 14px 18px; display: flex; align-items: flex-start; gap: 11px; border-bottom: 1px solid var(--acc-border); }
      .sugg-head-icon { width: 34px; height: 34px; background: var(--acc2); border-radius: var(--rsm); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .sugg-head-icon i { font-size: 18px; color: #fff; }
      .sugg-head-title { font-size: 14px; font-weight: 500; color: var(--acc); }
      .sugg-head-sub { font-size: 12px; color: var(--ink3); margin-top: 2px; }
      .sugg-item { display: flex; align-items: flex-start; gap: 11px; padding: 13px 18px; border-bottom: 1px solid rgba(74,58,181,0.08); background: transparent; border-left: none; border-right: none; border-top: none; width: 100%; text-align: left; cursor: pointer; transition: background 0.12s; font-family: inherit; font-size: inherit; }
      .sugg-item:last-child { border-bottom: none; }
      .sugg-item:hover { background: var(--acc-light); }
      .sugg-item:focus-visible { outline: 2px solid var(--acc); outline-offset: -2px; }
      .sugg-num { font-family: var(--mono); font-size: 11px; color: var(--ink3); flex-shrink: 0; padding-top: 2px; min-width: 20px; }
      .sugg-body { flex: 1; min-width: 0; }
      .sugg-title { font-size: 13px; font-weight: 500; color: var(--ink); margin-bottom: 4px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      .sugg-snip { font-size: 12px; color: var(--ink3); line-height: 1.5; margin-bottom: 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      .sugg-tags { display: flex; gap: 10px; }
      .sugg-tag { font-size: 11px; font-family: var(--mono); color: var(--ink3); display: flex; align-items: center; gap: 3px; }
      .sugg-tag i { font-size: 12px; color: var(--acc2); }
      .sugg-arr { font-size: 18px; color: var(--acc-border); flex-shrink: 0; opacity: 0; transition: opacity 0.14s, transform 0.14s; }
      .sugg-item:hover .sugg-arr, .sugg-item:focus-visible .sugg-arr { opacity: 1; color: var(--acc2); transform: translateX(3px); }
      .empty { padding: 22px; text-align: center; font-size: 13px; color: var(--ink3); }

      .art-view { display: flex; flex-direction: column; gap: 13px; }
      .back-btn { background: var(--card); border: 1.5px solid var(--acc-border); border-radius: var(--rsm); color: var(--acc); font-family: inherit; font-size: 13px; font-weight: 500; padding: 7px 14px; cursor: pointer; display: flex; align-items: center; gap: 6px; align-self: flex-start; }
      .back-btn:hover { background: var(--acc-light); }
      .back-btn:focus-visible { outline: 2px solid var(--acc); outline-offset: 2px; }
      .art-card { background: var(--card); border: 1.5px solid var(--grn-b); border-radius: var(--r); overflow: hidden; }
      .art-top { background: var(--grn-bg); padding: 18px 20px; border-bottom: 1px solid var(--grn-b); }
      .art-badges { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
      .real-badge { background: var(--grn-m); color: #fff; font-family: var(--mono); font-size: 11px; padding: 3px 11px; border-radius: var(--rpill); }
      .sim-lbl { font-size: 12px; font-family: var(--mono); color: var(--grn-t); }
      .art-title { font-size: 19px; font-weight: 500; color: var(--ink); line-height: 1.35; }
      .art-kw { font-size: 12px; color: var(--teal); display: flex; align-items: center; gap: 5px; margin-top: 9px; }
      .art-body { padding: 16px 20px; font-size: 14px; line-height: 1.78; color: var(--ink2); }
      .art-note { padding: 11px 20px; border-top: 1px solid var(--grn-b); background: var(--grn-bg); font-size: 12px; color: var(--grn-t); display: flex; align-items: flex-start; gap: 6px; line-height: 1.5; }
      .art-note i { font-size: 14px; flex-shrink: 0; margin-top: 1px; }

      .footer { text-align: center; padding: 24px; border-top: 1px solid var(--acc-border); font-size: 12px; color: var(--ink3); }

      @media (max-width: 540px) {
        .main { padding: 16px 12px 48px; }
        .r-heading { font-size: 16px; }
        .a11y-row { gap: 6px; }
      }
    `}</style>
  );
}
