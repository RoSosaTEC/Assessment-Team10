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
    cbNone: "Default", cbProtan: "Protanopia (red-blind)", cbDeutan: "Deuteranopia (green-blind)", cbTritan: "Tritanopia (blue-blind)", cbMono: "Monochromacy",
    fontLabel: "Font & size", dyslexicBtn: "Dyslexia-friendly font", contrastBtn: "High contrast", fontSizeLabel: "Text size",
    ttsLabel: "Text-to-speech", ttsRead: "Read result aloud", ttsHint: "Reads the analysis result & verdict", ttsStop: "Stop",
    tryExample: "Try an example:", exReal: "Reuters (real)", exFake: "Fabricated (fake)",
    textareaLabel: "Paste your news article",
    inputHint: "Works best with 3+ sentences. Press Ctrl+Enter to analyze.",
    words: "words", analyze: "Analyze", analyzing: "Analyzing…", ready: "Ready",
    resultReal: "Likely real", resultFake: "Likely fake",
    headingReal: "This article appears authentic", headingFake: "This article shows signs of misinformation",
    classifierSub: "ISOT dataset classifier · scikit-learn", confidenceLabel: "Classifier confidence",
    kwLabel: "Key influencing words", kwTooltip: "Words with the highest TF-IDF weight — these drove the classifier's decision most.",
    disclaimer: "ML prediction only — always verify with primary sources before sharing.",
    suggTitle: "Related verified articles", errorTitle: "Analysis failed", retry: "Try again",
    back: "Back to results", verifiedReal: "verified real",
    articleNote: "From the ISOT dataset, sourced from Reuters.com and verified as real. Only a snippet is shown.",
    ttsNoResult: "No result yet. Analyze an article first.",
    noSuggestions: "No closely related verified articles found for this topic.",
    keywordsInCommon: "keywords in common", keyword: "keyword", similar: "similar",
    outputPlaceholderTitle: "Your result will appear here",
    outputPlaceholderSub: "Paste an article on the left and click Analyze.",
  },
  es: {
    brandSub: "Detector de autenticidad de noticias",
    a11yTitle: "Herramientas de accesibilidad",
    a11ySub: "Fuente · color · idioma · lectura en voz alta",
    langLabel: "Language / Idioma", visionLabel: "Visión del color",
    cbNone: "Por defecto", cbProtan: "Protanopía (rojo)", cbDeutan: "Deuteranopía (verde)", cbTritan: "Tritanopía (azul)", cbMono: "Monocromatismo",
    fontLabel: "Fuente y tamaño", dyslexicBtn: "Fuente para dislexia", contrastBtn: "Alto contraste", fontSizeLabel: "Tamaño de texto",
    ttsLabel: "Texto a voz", ttsRead: "Leer resultado", ttsHint: "Lee el resultado y veredicto", ttsStop: "Detener",
    tryExample: "Prueba un ejemplo:", exReal: "Reuters (real)", exFake: "Fabricado (falso)",
    textareaLabel: "Pega tu artículo de noticias",
    inputHint: "Funciona mejor con 3+ oraciones. Presiona Ctrl+Enter para analizar.",
    words: "palabras", analyze: "Analizar", analyzing: "Analizando…", ready: "Listo",
    resultReal: "Probablemente real", resultFake: "Probablemente falso",
    headingReal: "Este artículo parece auténtico", headingFake: "Este artículo muestra señales de desinformación",
    classifierSub: "Clasificador ISOT · scikit-learn", confidenceLabel: "Confianza del clasificador",
    kwLabel: "Palabras clave influyentes", kwTooltip: "Palabras con mayor peso TF-IDF en la decisión del clasificador.",
    disclaimer: "Solo predicción ML — verifica siempre con fuentes primarias.",
    suggTitle: "Artículos verificados relacionados", errorTitle: "El análisis falló", retry: "Intentar de nuevo",
    back: "Volver", verifiedReal: "verificado real",
    articleNote: "Del conjunto ISOT, de Reuters.com. Solo se muestra un fragmento.",
    ttsNoResult: "Sin resultado. Analiza un artículo primero.",
    noSuggestions: "No se encontraron artículos relacionados.",
    keywordsInCommon: "palabras clave en común", keyword: "palabra clave", similar: "similitud",
    outputPlaceholderTitle: "Tu resultado aparecerá aquí",
    outputPlaceholderSub: "Pega un artículo a la izquierda y presiona Analizar.",
  },
};

const CB_FILTERS = {
  none: "none",
  protan: "url(#cb-protan)",
  deutan: "url(#cb-deutan)",
  tritan: "url(#cb-tritan)",
  mono: "grayscale(100%) contrast(1.15)",
};

// Injects the OpenDyslexic @font-face declaration directly into <head>
// so the browser registers the font before any override tries to use it.
// The font files are served by your app's /public/fonts/ folder.
// Place OpenDyslexic-Regular.otf and OpenDyslexic-Bold.otf there.
// Fallback: if files aren't present yet, the CSS font-stack will still
// visibly change (Arial Rounded → more readable than the default).
function useDyslexicFontFace() {
  useEffect(() => {
    const id = "opendyslexic-face";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    // Primary: load from your own /public/fonts/ (static, offline, reliable)
    // The browser will only fetch these when the font is actually used.
    style.textContent = `
      @font-face {
        font-family: 'OpenDyslexic';
        src: url('/fonts/OpenDyslexic-Regular.otf') format('opentype');
        font-weight: 400;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'OpenDyslexic';
        src: url('/fonts/OpenDyslexic-Bold.otf') format('opentype');
        font-weight: 700;
        font-style: normal;
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
  }, []);
}

function ColorBlindSVGFilters() {
  return (
    <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
      <defs>
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
              <input type="range" id="fs-slider" min={13} max={22} step={1} value={fontSize}
                onChange={e => setFontSize(Number(e.target.value))}
                aria-label={t.fontSizeLabel} aria-valuenow={fontSize} aria-valuemin={13} aria-valuemax={22}
                style={{ flex: 1 }} />
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
  useEffect(() => { const id = requestAnimationFrame(() => setWidth(confidence)); return () => cancelAnimationFrame(id); }, [confidence]);
  return (
    <div className="r-conf">
      <div className="r-conf-row">
        <span className="r-conf-lbl">Classifier confidence</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>{confidence}%</span>
      </div>
      <div className="bar-track" role="meter" aria-valuenow={confidence} aria-valuemin={0} aria-valuemax={100} aria-label={`Confidence: ${confidence}%`}>
        <div className={`bar-fill ${isFake ? "bf-fake" : "bf-real"}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function KeywordPill({ word, score }) {
  const opacity = Math.min(0.4 + score * 8, 1);
  return <span className="kw-pill" style={{ opacity }} title={`Influence: ${score.toFixed(4)}`}>{word}</span>;
}

function ResultCard({ result, t }) {
  const isFake = result.verdict === "FAKE";
  return (
    <div className={`result-wrap r-${isFake ? "fake" : "real"}`} role="region" aria-label={isFake ? t.headingFake : t.headingReal}>
      <div className="r-hero">
        <div className={`r-icon ${isFake ? "fake" : "real"}`}>
          <i className={`ti ${isFake ? "ti-circle-x" : "ti-circle-check"}`} aria-hidden="true" />
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

function MiniBar({ value, max, color }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth((value / max) * 100));
    return () => cancelAnimationFrame(id);
  }, [value, max]);
  return (
    <div style={{ height: 8, background: "rgba(0,0,0,0.08)", borderRadius: 4, overflow: "hidden", marginTop: 6 }}>
      <div style={{ height: "100%", width: `${width}%`, background: color, borderRadius: 4, transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)" }} />
    </div>
  );
}

function AnalysisDashboard({ result }) {
  if (!result?.analysis) return null;
  const { sentiment, readability, stats } = result.analysis;
  const isFake = result.verdict === "FAKE";
  const accent = isFake ? "var(--red-m)" : "var(--grn-m)";

  // Normalize reading ease 0-100 (already 0-100 from textstat)
  const easeVal  = Math.max(0, Math.min(100, readability.reading_ease));
  // Grade level typically 1-16, cap at 16
  const gradeVal = Math.max(0, Math.min(16, readability.grade_level));
  // Subjectivity already 0-1
  const subjVal  = Math.round(sentiment.subjectivity * 100);
  // Polarity -1 to 1, map to 0-100
  const polarVal = Math.round((sentiment.polarity + 1) / 2 * 100);

  const metrics = [
    {
      label: "Reading ease",
      value: `${easeVal.toFixed(0)} / 100`,
      bar: easeVal,
      max: 100,
      color: easeVal < 40 ? "#f59e0b" : "var(--grn-m)",
      hint: "Higher = easier to read. Fake news tends to score lower.",
    },
    {
      label: "Grade level",
      value: `Grade ${gradeVal}`,
      bar: gradeVal,
      max: 16,
      color: gradeVal < 8 ? "#f59e0b" : "var(--acc2)",
      hint: "US school grade equivalent. Fake news often uses simpler language.",
    },
    {
      label: "Subjectivity",
      value: `${subjVal}% opinionated`,
      bar: subjVal,
      max: 100,
      color: subjVal > 60 ? "#ef4444" : "var(--acc2)",
      hint: "Higher = more opinionated language. Real journalism scores lower.",
    },
    {
      label: "Tone",
      value: sentiment.polarity_label,
      bar: polarVal,
      max: 100,
      color: sentiment.polarity < -0.2 ? "#ef4444" : sentiment.polarity > 0.2 ? "var(--grn-m)" : "var(--acc2)",
      hint: "Emotional tone of the article.",
    },
  ];

  return (
    <div style={{ background: "var(--card)", border: "2px solid var(--acc-border)", borderRadius: "var(--r)", overflow: "hidden", marginBottom: 16, animation: "up 0.3s ease 0.05s both" }}>
      {/* Header */}
      <div style={{ background: "var(--acc-light)", padding: "16px 20px", borderBottom: "1px solid var(--acc-border)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 38, height: 38, background: "var(--acc2)", borderRadius: "var(--rsm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <i className="ti ti-chart-bar" style={{ fontSize: 20, color: "#fff" }} />
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, fontFamily: "var(--f)", color: "var(--acc)" }}>Article Analysis</div>
          <div style={{ fontSize: 13, fontFamily: "var(--f)", color: "var(--ink3)", marginTop: 2 }}>Linguistic and readability metrics</div>
        </div>
      </div>

      <div style={{ padding: "18px 20px" }}>
        {/* Metric bars grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          {metrics.map(m => (
            <div key={m.label} style={{ background: "var(--bg)", border: "1px solid var(--acc-border)", borderRadius: "var(--rsm)", padding: "14px 16px" }} title={m.hint}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 12, fontFamily: "var(--f)", color: "var(--ink3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{m.label}</span>
                <span style={{ fontSize: 13, fontFamily: "var(--mono)", fontWeight: 600, color: "var(--ink)" }}>{m.value}</span>
              </div>
              <MiniBar value={m.bar} max={m.max} color={m.color} />
            </div>
          ))}
        </div>

        {/* Surface stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Words", value: stats.word_count },
            { label: "Sentences", value: stats.sentence_count },
            { label: "! marks", value: stats.exclamation_count, warn: stats.exclamation_count > 2 },
            { label: "ALL CAPS", value: stats.caps_words, warn: stats.caps_words > 3 },
          ].map(s => (
            <div key={s.label} style={{ background: s.warn ? "rgba(239,68,68,0.07)" : "var(--bg)", border: `1px solid ${s.warn ? "rgba(239,68,68,0.25)" : "var(--acc-border)"}`, borderRadius: "var(--rsm)", padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--mono)", color: s.warn ? "#ef4444" : "var(--ink)" }}>{s.value}</div>
              <div style={{ fontSize: 11, fontFamily: "var(--f)", color: "var(--ink3)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Top words bars */}
        {result.top_words?.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontFamily: "var(--f)", color: "var(--ink3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 12 }}>Top influencing words</div>
            {result.top_words.map((w, i) => {
              const pct = Math.min(w.score * 100 * 3, 100); // scale for visibility
              return (
                <div key={w.word} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontFamily: "var(--mono)", color: "var(--ink2)", fontWeight: 600 }}>{w.word}</span>
                    <span style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--ink3)" }}>{(w.score * 100).toFixed(2)}%</span>
                  </div>
                  <div style={{ height: 8, background: "rgba(0,0,0,0.08)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: accent, borderRadius: 4, transition: `width ${0.6 + i * 0.1}s cubic-bezier(0.34,1.56,0.64,1)` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function RelatedArticlesSection({ related }) {
  if (!related?.articles?.length) return null;
  const isFakeFraming = related.framing.includes("verified");

  return (
    <div style={{ background: "var(--card)", border: "2px solid var(--acc-border)", borderRadius: "var(--r)", overflow: "hidden", marginBottom: 16, animation: "up 0.3s ease 0.1s both" }}>
      {/* Header */}
      <div style={{ background: "var(--acc-light)", padding: "16px 20px", borderBottom: "1px solid var(--acc-border)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 38, height: 38, background: isFakeFraming ? "#ef4444" : "var(--acc2)", borderRadius: "var(--rsm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <i className={`ti ${isFakeFraming ? "ti-shield-check" : "ti-news"}`} style={{ fontSize: 20, color: "#fff" }} />
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, fontFamily: "var(--f)", color: "var(--acc)" }}>
            {isFakeFraming ? "Verified Sources" : "Related Sources"}
          </div>
          <div style={{ fontSize: 13, fontFamily: "var(--f)", color: "var(--ink3)", marginTop: 2 }}>{related.framing}</div>
        </div>
      </div>

      {/* Articles */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {related.articles.map((article, i) => (
          <div key={i} style={{ padding: "18px 20px", borderBottom: i < related.articles.length - 1 ? "1px solid var(--acc-border)" : "none" }}>
            {/* Title + source */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
              <a href={article.url} target="_blank" rel="noreferrer"
                style={{ fontSize: 15, fontWeight: 600, fontFamily: "var(--f)", color: "var(--acc)", textDecoration: "none", lineHeight: 1.4, flex: 1 }}
                onMouseOver={e => e.target.style.textDecoration = "underline"}
                onMouseOut={e => e.target.style.textDecoration = "none"}
              >
                {article.title}
              </a>
              <span style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--ink3)", whiteSpace: "nowrap", marginTop: 2 }}>{article.source}</span>
            </div>

            {/* Published date */}
            {article.published_at && (
              <div style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--ink3)", marginBottom: 10 }}>
                {new Date(article.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </div>
            )}

            {/* Relevant excerpt */}
            {article.excerpt && (
              <div style={{ background: "var(--bg)", border: "1px solid var(--acc-border)", borderRadius: "var(--rsm)", padding: "12px 14px", marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontFamily: "var(--f)", color: "var(--ink3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 6 }}>Relevant excerpt</div>
                <div style={{ fontSize: 14, fontFamily: "var(--f)", color: "var(--ink2)", lineHeight: 1.6, fontStyle: "italic" }}>"{article.excerpt}"</div>
              </div>
            )}

            {/* APA citation */}
            <div style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "var(--rsm)", padding: "10px 14px" }}>
              <div style={{ fontSize: 11, fontFamily: "var(--f)", color: "var(--ink3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 5 }}>APA Citation</div>
              <div style={{ fontSize: 13, fontFamily: '"Times New Roman", Georgia, serif', color: "var(--ink2)", lineHeight: 1.7 }}>{article.citation}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArticleView({ article, t, onBack }) {
  const backRef = useRef(null);
  useEffect(() => { backRef.current?.focus(); window.scrollTo({ top: 0, behavior: "smooth" }); }, []);
  return (
    <div className="art-view" role="region" aria-label="Article detail">
      <button className="back-btn" ref={backRef} onClick={onBack}>
        <i className="ti ti-arrow-left" aria-hidden="true" />{t.back}
      </button>
      <div className="art-card" role="article">
        <div className="art-top">
          <div className="art-badges">
            <span className="real-badge">{t.verifiedReal}</span>
            <span className="sim-lbl">{Math.round(article.similarity * 100)}% {t.similar}</span>
          </div>
          <div className="art-title">{article.title}</div>
          <div className="art-kw"><i className="ti ti-key" aria-hidden="true" />{article.overlap} {article.overlap === 1 ? t.keyword : t.keywordsInCommon}</div>
        </div>
        <div className="art-body">{article.snippet}</div>
        <div className="art-note"><i className="ti ti-info-circle" aria-hidden="true" />{t.articleNote}</div>
      </div>
    </div>
  );
}

function OutputPlaceholder({ t }) {
  return (
    <div className="output-placeholder">
      <div className="output-placeholder-title">{t.outputPlaceholderTitle}</div>
      <div className="output-placeholder-sub">{t.outputPlaceholderSub}</div>
    </div>
  );
}

export default function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [inputMode, setInputMode] = useState("text"); 

  const [lang, setLangState] = useState("en");
  const [cbMode, setCbModeState] = useState("none");
  const [dyslexic, setDyslexic] = useState(false);
  const [hiContrast, setHiContrast] = useState(false);
  const [fontSize, setFontSizeState] = useState(15);
  const [ttsPlaying, setTtsPlaying] = useState(false);

  const textareaRef = useRef(null);
  const t = TRANSLATIONS[lang];

  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");

  // Register the @font-face in <head> once on mount
  useDyslexicFontFace();

  // When dyslexic toggle changes, inject or remove the override style in <head>
  useEffect(() => {
    const overrideId = "dyslexic-override";
    let el = document.getElementById(overrideId);
    if (dyslexic) {
      if (!el) {
        el = document.createElement("style");
        el.id = overrideId;
        document.head.appendChild(el);
      }
      el.textContent = `
        *, *::before, *::after,
        input, textarea, button, select, label, p, span, div, h1, h2, h3, h4, h5, h6, a, li {
          font-family: 'OpenDyslexic', 'OpenDyslexicAlta', sans-serif !important;
          letter-spacing: 0.07em !important;
          word-spacing: 0.15em !important;
          line-height: 1.9 !important;
        }
      `;
    } else {
      if (el) el.remove();
    }
  }, [dyslexic]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: user, password }),
      });

      const data = await res.json();

      if(!res.ok) {
        throw new Error(data.error || "Login failed");
      }
      localStorage.setItem("token", data.token);
      setToken(data.token);
    } catch (err) {
      alert(err.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  const setLang = useCallback((l) => {
    setLangState(l);
    document.documentElement.lang = l;
  }, []);

  const setCbMode = useCallback((mode) => {
    setCbModeState(mode);
    document.body.style.filter = CB_FILTERS[mode] || "none";
  }, []);

  const toggleDyslexic = useCallback(() => setDyslexic(d => !d), []);

  const toggleHiContrast = useCallback(() => {
    setHiContrast(h => {
      document.body.classList.toggle("hi-contrast", !h);
      return !h;
    });
  }, []);

  const setFontSize = useCallback((v) => {
    setFontSizeState(v);
    document.documentElement.style.setProperty("--app-fs", v + "px");
  }, []);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const canSubmit =
  inputMode === "url"
    ? text.trim().length > 0
    : text.trim() && wordCount >= 10;

  const statusText = loading ? t.analyzing
    : error ? t.errorTitle
    : result ? (result.verdict === "FAKE" ? t.resultFake : t.resultReal) + " · " + result.confidence + "%"
    : t.ready;
  const statusState = loading ? "loading" : error ? "error" : "ok";

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setSelectedArticle(null);
    stopTTS();
    try {
      const endpoint =
        inputMode === "url"
          ? "/predict/url"
          : "/predict/article";

        const payload =
          inputMode === "url"
            ? { url: text }
            : { text };
        
        const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Server error");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
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

  const stopTTS = () => { window.speechSynthesis.cancel(); setTtsPlaying(false); };

  if (!token) {
    return (
      <div style={{minheight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "#f5f3ff"}}>
        <form onSubmit={handleLogin} style = {{ background: "f5f3ff", padding: 30, borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", width: "100%", maxWidth: 400 }}>
          <h2>Login Page</h2>
          <input type="text" placeholder="Username"  value={user} onChange={(e) => setUser(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit">
            Login
            </button>
        </form>
      </div>
    );
  }

  if (selectedArticle) {
    return (
      <div className="app-shell">
  
        <ColorBlindSVGFilters />
        <Styles />
        <header className="topbar">
          <button className="logout-btn" onClick={logout}>
            Logout
            </button>
          <div className="brand">
            <div className="brand-icon" aria-hidden="true"><i className="ti ti-shield-check" /></div>
            <div><div className="brand-name">VerifyAI</div><div className="brand-sub">{t.brandSub}</div></div>
          </div>
        </header>
        <main className="main-single">
          <ArticleView article={selectedArticle} t={t} onBack={() => setSelectedArticle(null)} />
        </main>
        {result && (
          <div
            style={{
              maxWidth: "1400px",
              margin: "0 auto",
              padding: "0 32px 24px"
            }}
          >
            <TopWordsSection result={result} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app-shell">

      <ColorBlindSVGFilters />
      <Styles />
      <a className="skip-link" href="#main-input">Skip to article input</a>

      <header className="topbar">
        <div className="brand">
          <div className="brand-icon" aria-hidden="true"><i className="ti ti-shield-check" /></div>
          <div><div className="brand-name">VerifyAI</div><div className="brand-sub">{t.brandSub}</div></div>
        </div>
      </header>

      <div className="a11y-wrapper">
        <A11yPanel
          t={t} lang={lang} setLang={setLang}
          cbMode={cbMode} setCbMode={setCbMode}
          dyslexic={dyslexic} toggleDyslexic={toggleDyslexic}
          hiContrast={hiContrast} toggleHiContrast={toggleHiContrast}
          fontSize={fontSize} setFontSize={setFontSize}
          onTTSRead={startTTS} ttsPlaying={ttsPlaying} onTTSStop={stopTTS}
          hasResult={!!result}
        />
      </div>

      <main className="two-col">
        {/* LEFT: Input */}
        <section className="col-left" aria-label={t.textareaLabel}>
          <div className="input-card">
            <label htmlFor="main-input" className="sr-only">{t.textareaLabel}</label>
            <div
            style={{
              display: "flex",
              gap: "10px",
              padding: "16px",
              borderBottom: "1px solid var(--acc-border)"
            }}
          >
            <button
              type="button"
              className="ex-btn"
              onClick={() => setInputMode("text")}
            >
              Paste Text
            </button>

            <button
              type="button"
              className="ex-btn"
              onClick={() => setInputMode("url")}
            >
              URL
            </button>
          </div>
            <textarea
              id="main-input"
              ref={textareaRef}
              className="textarea"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={
                inputMode === "url"
                  ? "Paste article URL..."
                  : "Paste article text..."
              }
              rows={10}
              spellCheck={false}
              aria-describedby="input-hint wc-count"
              onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && canSubmit) handleSubmit(); }}
            />
            <div className="input-hint-bar" id="input-hint">{t.inputHint}</div>
            <div className="input-mid">
              <span className="examples-label">{t.tryExample}</span>
              <button className="ex-btn" onClick={() => loadExample("real")}>{t.exReal}</button>
              <button className="ex-btn" onClick={() => loadExample("fake")}>{t.exFake}</button>
            </div>
            <div className="input-footer">
              <span className={`wc${wordCount > 0 && wordCount < 10 ? " warn" : ""}`} id="wc-count" aria-live="polite">
                {wordCount} {t.words}
              </span>
              <button className="analyze-btn" onClick={handleSubmit} disabled={loading || !canSubmit} aria-disabled={loading || !canSubmit}>
                {loading
                  ? <><span className="spin" aria-hidden="true" />{t.analyzing}</>
                  : <><i className="ti ti-scan" aria-hidden="true" />{t.analyze}</>}
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT: Output */}
        <section className="col-right" aria-label="Analysis output" aria-live="polite">
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

          {loading && !result && !error && (
            <div className="output-placeholder">
              <span className="spin-lg" aria-hidden="true" />
              <div className="output-placeholder-title">{t.analyzing}</div>
            </div>
          )}

          {!loading && !result && !error && <OutputPlaceholder t={t} />}
          {result && <ResultCard result={result} t={t} />}
        </section>
      </main>

      {result && (
        <div style={{ maxWidth: 1400, margin: "0 auto", width: "100%", padding: "0 32px 60px", display: "flex", flexDirection: "column", gap: 16 }}>
          <AnalysisDashboard result={result} />
          {result.related_articles && <RelatedArticlesSection related={result.related_articles} />}
        </div>
      )}

    </div>
  );
}

function Styles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
      @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css');

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      :root {
        --ink: #1A1230; --ink2: #3D3660; --ink3: #7B74A8;
        --page: #F5F3FF; --card: #FFFFFF; --card2: #EEEBFF;
        --acc: #4A3AB5; --acc2: #6B5CE7; --acc-light: #EAE8FF; --acc-border: #C4BEFF;
        --red-bg: #FFF0F0; --red-b: #F09595; --red-t: #791F1F; --red-m: #E24B4A;
        --grn-bg: #EDFAE1; --grn-b: #97C459; --grn-t: #27500A; --grn-m: #639922;
        --teal: #0F6E56;
        --r: 16px; --rsm: 10px; --rpill: 100px;
        --f: 'Inter', system-ui, sans-serif;
        --mono: 'JetBrains Mono', 'Fira Code', monospace;
        --app-fs: 17px;
      }

      body { font-family: var(--f); background: var(--page); color: var(--ink); font-size: var(--app-fs); line-height: 1.6; }
      body.hi-contrast {
        --ink: #000; --ink2: #111; --ink3: #333;
        --card: #fff; --card2: #f0f0f0; --page: #fff;
        --acc: #1A0D7A; --acc2: #2B1BB0; --acc-light: #E0DDFF; --acc-border: #6B5CE7;
        --red-m: #C00000; --grn-m: #006600;
      }

      .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
      .skip-link { position: absolute; top: -60px; left: 14px; background: var(--acc); color: #fff; padding: 10px 20px; border-radius: var(--rsm); font-size: 16px; font-weight: 600; text-decoration: none; z-index: 100; }
      .skip-link:focus { top: 14px; }

      .app-shell { min-height: 100vh; display: flex; flex-direction: column; background: var(--page); }

      /* ── Topbar ── */
      .topbar { background: var(--acc); padding: 20px 32px; display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
      .brand { display: flex; align-items: center; gap: 16px; }
      .brand-icon { width: 54px; height: 54px; background: rgba(255,255,255,0.2); border-radius: var(--rsm); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .brand-icon i { font-size: 30px; color: #fff; }
      .brand-name { font-size: 28px; font-weight: 700; color: #fff; letter-spacing: -0.02em; font-family: var(--f); }
      .brand-sub { font-size: 14px; color: rgba(255,255,255,0.7); margin-top: 2px; font-weight: 400; font-family: var(--f); }

      /* ── A11y panel ── */
      .a11y-wrapper { max-width: 1400px; margin: 0 auto; width: 100%; padding: 20px 32px 0; }
      .a11y-panel { background: var(--card); border: 2px solid var(--acc-border); border-radius: var(--r); overflow: hidden; }
      .a11y-header { background: var(--acc-light); padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; border: none; width: 100%; text-align: left; font-family: var(--f); }
      .a11y-header:focus-visible { outline: 2px solid var(--acc); outline-offset: -2px; }
      .a11y-header-left { display: flex; align-items: center; gap: 12px; }
      .a11y-header-left i { font-size: 22px; color: var(--acc); }
      .a11y-header-title { font-size: 16px; font-weight: 600; color: var(--acc); font-family: var(--f); }
      .a11y-header-sub { font-size: 13px; color: var(--ink3); margin-top: 2px; font-family: var(--f); }
      .a11y-chevron { font-size: 22px; color: var(--acc); transition: transform 0.2s; }
      .a11y-chevron.open { transform: rotate(180deg); }
      .a11y-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 18px; border-top: 2px solid var(--acc-border); }
      .a11y-section-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink3); margin-bottom: 9px; font-family: var(--f); }
      .a11y-row { display: flex; flex-wrap: wrap; gap: 9px; }
      .a11y-btn { display: flex; align-items: center; gap: 8px; background: var(--card2); border: 2px solid var(--acc-border); border-radius: var(--rsm); padding: 9px 16px; font-size: 15px; font-family: var(--f); color: var(--acc); cursor: pointer; transition: all 0.14s; font-weight: 500; }
      .a11y-btn i { font-size: 18px; }
      .a11y-btn:hover { background: var(--acc-light); border-color: var(--acc2); }
      .a11y-btn:focus-visible { outline: 2px solid var(--acc); outline-offset: 2px; }
      .a11y-btn.active { background: var(--acc); border-color: var(--acc); color: #fff; }
      .lang-toggle { display: flex; border: 2px solid var(--acc-border); border-radius: var(--rsm); overflow: hidden; width: fit-content; }
      .lang-opt { padding: 9px 26px; background: transparent; border: none; font-size: 15px; font-family: var(--f); color: var(--ink2); cursor: pointer; transition: all 0.14s; font-weight: 500; }
      .lang-opt:focus-visible { outline: 2px solid var(--acc); outline-offset: -2px; }
      .lang-opt.active { background: var(--acc); color: #fff; font-weight: 600; }
      .lang-opt:not(.active):hover { background: var(--card2); }
      .fs-row { display: flex; align-items: center; gap: 14px; }
      .fs-row label { font-size: 15px; font-family: var(--f); color: var(--ink2); white-space: nowrap; font-weight: 500; }
      .tts-bar { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: var(--card2); border: 2px solid var(--acc-border); border-radius: var(--rsm); }
      .tts-btn { background: var(--acc); border: none; border-radius: var(--rsm); color: #fff; font-size: 15px; font-family: var(--f); padding: 9px 18px; cursor: pointer; display: flex; align-items: center; gap: 8px; flex-shrink: 0; font-weight: 500; }
      .tts-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .tts-btn:focus-visible { outline: 2px solid var(--acc); outline-offset: 2px; }
      .tts-label { font-size: 14px; font-family: var(--f); color: var(--ink3); flex: 1; }
      .tts-stop { background: var(--red-bg); border: 2px solid var(--red-b); border-radius: var(--rsm); color: var(--red-t); font-size: 14px; font-family: var(--f); padding: 7px 14px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 500; }
      .tts-stop:focus-visible { outline: 2px solid var(--acc); outline-offset: 2px; }

      /* ── Two-column layout ── */
      .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; max-width: 1400px; margin: 0 auto; width: 100%; padding: 24px 32px 60px; align-items: start; }
      .col-right { min-width: 0; display: flex; flex-direction: column; gap: 16px; }
      .main-single { max-width: 800px; margin: 0 auto; width: 100%; padding: 28px 32px 60px; }

      /* ── Input card ── */
      .input-card { background: var(--card); border: 2px solid var(--acc-border); border-radius: var(--r); overflow: hidden; }
      .input-card:focus-within { border-color: var(--acc2); }
      .textarea { width: 100%; background: transparent; border: none; outline: none; color: var(--ink); font-family: var(--f); font-size: var(--app-fs); line-height: 1.75; padding: 22px 24px; resize: vertical; min-height: 320px; display: block; }
      .textarea::placeholder { color: var(--ink3); }
      .input-hint-bar { padding: 9px 18px; background: var(--card2); border-top: 1px solid var(--acc-border); font-size: 14px; font-family: var(--f); color: var(--ink3); }
      .input-mid { padding: 10px 18px; background: var(--card2); border-top: 1px solid var(--acc-border); display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
      .examples-label { font-size: 14px; font-family: var(--f); color: var(--ink3); font-weight: 500; }
      .ex-btn { background: var(--card); border: 1.5px solid var(--acc-border); border-radius: var(--rpill); color: var(--acc); font-family: var(--f); font-size: 13px; padding: 5px 14px; cursor: pointer; font-weight: 600; transition: all 0.14s; }
      .ex-btn:hover { background: var(--acc-light); }
      .ex-btn:focus-visible { outline: 2px solid var(--acc); outline-offset: 2px; }
      .input-footer { padding: 13px 18px; border-top: 1px solid var(--acc-border); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .wc { font-family: var(--mono); font-size: 14px; color: var(--ink3); }
      .wc.warn { color: #854F0B; }
      .analyze-btn { background: var(--acc2); border: none; border-radius: var(--rsm); color: #fff; font-family: var(--f); font-size: 17px; font-weight: 700; padding: 13px 30px; cursor: pointer; display: flex; align-items: center; gap: 9px; transition: opacity 0.14s, transform 0.1s; }
      .analyze-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
      .analyze-btn:focus-visible { outline: 2px solid var(--acc); outline-offset: 3px; }
      .analyze-btn:disabled { opacity: 0.35; cursor: not-allowed; }
      .spin { width: 16px; height: 16px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: rot 0.7s linear infinite; display: inline-block; }
      .spin-lg { width: 36px; height: 36px; border: 3px solid var(--acc-border); border-top-color: var(--acc); border-radius: 50%; animation: rot 0.8s linear infinite; display: block; margin: 0 auto 16px; }
      @keyframes rot { to { transform: rotate(360deg); } }

      /* ── Output placeholder ── */
      .output-placeholder { border: 2px dashed var(--acc-border); border-radius: var(--r); padding: 56px 32px; text-align: center; background: var(--card); display: flex; flex-direction: column; align-items: center; gap: 12px; }
      .output-placeholder-title { font-size: 20px; font-weight: 600; color: var(--ink2); font-family: var(--f); }
      .output-placeholder-sub { font-size: 16px; font-family: var(--f); color: var(--ink3); }

      /* ── Error card ── */
      .err-card { background: var(--red-bg); border: 2px solid var(--red-b); border-radius: var(--r); padding: 18px 20px; display: flex; gap: 14px; animation: up 0.25s ease; margin-bottom: 16px; }
      .err-icon { width: 42px; height: 42px; background: #F7C1C1; border-radius: var(--rsm); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .err-icon i { font-size: 22px; color: var(--red-t); }
      .err-title { font-size: 17px; font-weight: 600; color: var(--red-t); font-family: var(--f); }
      .err-msg { font-size: 15px; font-family: var(--f); color: var(--red-t); margin-top: 4px; }
      .err-retry { background: transparent; border: 1.5px solid var(--red-b); border-radius: var(--rsm); color: var(--red-t); font-family: var(--f); font-size: 14px; padding: 6px 14px; cursor: pointer; margin-top: 9px; font-weight: 500; }
      .err-retry:focus-visible { outline: 2px solid var(--acc); outline-offset: 2px; }

      @keyframes up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

      /* ── Result card ── */
      .result-wrap { border-radius: var(--r); border: 2px solid; overflow: hidden; animation: up 0.28s ease; margin-bottom: 16px; }
      .r-fake { background: var(--red-bg); border-color: var(--red-m); }
      .r-real { background: var(--grn-bg); border-color: var(--grn-m); }
      .r-hero { padding: 24px 24px 0; display: flex; align-items: flex-start; gap: 18px; }
      .r-icon { width: 58px; height: 58px; border-radius: var(--rsm); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .r-icon.fake { background: var(--red-m); } .r-icon.real { background: var(--grn-m); }
      .r-icon i { font-size: 32px; color: #fff; }
      .r-heading { font-size: 22px; font-weight: 700; font-family: var(--f); color: var(--ink); line-height: 1.3; }
      .r-sub { font-size: 13px; font-family: var(--f); color: var(--ink3); margin-top: 4px; }
      .r-conf { padding: 18px 24px; }
      .r-conf-row { display: flex; justify-content: space-between; margin-bottom: 10px; align-items: center; }
      .r-conf-lbl { font-size: 15px; font-family: var(--f); font-weight: 500; color: var(--ink2); }
      .r-conf-val { font-family: var(--mono); font-size: 20px; font-weight: 600; color: var(--ink); }
      .bar-track { height: 12px; background: rgba(0,0,0,0.09); border-radius: 6px; overflow: hidden; }
      .bar-fill { height: 100%; border-radius: 6px; transition: width 0.9s cubic-bezier(0.34,1.56,0.64,1); width: 0; }
      .bf-fake { background: var(--red-m); } .bf-real { background: var(--grn-m); }
      .kw-sec { padding: 0 24px 20px; border-top: 1px solid rgba(0,0,0,0.07); padding-top: 18px; }
      .kw-lbl-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
      .kw-lbl { font-size: 13px; font-weight: 600; font-family: var(--f); color: var(--ink2); text-transform: uppercase; letter-spacing: 0.07em; }
      .kw-tip-wrap { position: relative; display: inline-block; }
      .kw-tip-btn { background: rgba(0,0,0,0.06); border: none; border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: var(--ink3); }
      .kw-tip-btn:focus-visible { outline: 2px solid var(--acc); outline-offset: 2px; }
      .kw-tip-pop { display: none; position: absolute; top: 26px; left: 0; z-index: 20; background: var(--ink); color: #fff; border-radius: var(--rsm); padding: 11px 14px; font-size: 13px; font-family: var(--f); line-height: 1.5; max-width: 240px; pointer-events: none; }
      .kw-tip-wrap:hover .kw-tip-pop, .kw-tip-wrap:focus-within .kw-tip-pop { display: block; }
      .kw-row { display: flex; flex-wrap: wrap; gap: 8px; }
      .kw-pill { background: rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.1); border-radius: 7px; padding: 6px 13px; font-family: var(--mono); font-size: 13px; color: var(--ink2); cursor: default; }
      .r-foot { padding: 14px 24px; border-top: 1px solid rgba(0,0,0,0.07); background: rgba(0,0,0,0.03); display: flex; align-items: center; gap: 8px; font-size: 13px; font-family: var(--f); color: var(--ink3); }
      .r-foot i { font-size: 16px; }

      /* ── Suggestions ── */
      .sugg-wrap { background: var(--card); border: 2px solid var(--acc-border); border-radius: var(--r); overflow: hidden; animation: up 0.3s ease 0.1s both; }
      .sugg-head { background: var(--acc-light); padding: 16px 20px; display: flex; align-items: flex-start; gap: 14px; border-bottom: 1px solid var(--acc-border); }
      .sugg-head-icon { width: 42px; height: 42px; background: var(--acc2); border-radius: var(--rsm); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .sugg-head-icon i { font-size: 22px; color: #fff; }
      .sugg-head-title { font-size: 17px; font-weight: 600; font-family: var(--f); color: var(--acc); }
      .sugg-head-sub { font-size: 13px; font-family: var(--f); color: var(--ink3); margin-top: 3px; }
      .sugg-item { display: flex; align-items: flex-start; gap: 13px; padding: 16px 20px; border-bottom: 1px solid rgba(74,58,181,0.08); background: transparent; border-left: none; border-right: none; border-top: none; width: 100%; text-align: left; cursor: pointer; transition: background 0.12s; font-family: var(--f); }
      .sugg-item:last-child { border-bottom: none; }
      .sugg-item:hover { background: var(--acc-light); }
      .sugg-item:focus-visible { outline: 2px solid var(--acc); outline-offset: -2px; }
      .sugg-num { font-family: var(--mono); font-size: 13px; color: var(--ink3); flex-shrink: 0; padding-top: 2px; min-width: 24px; }
      .sugg-body { flex: 1; min-width: 0; }
      .sugg-title { font-size: 15px; font-weight: 600; font-family: var(--f); color: var(--ink); margin-bottom: 5px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      .sugg-snip { font-size: 14px; font-family: var(--f); color: var(--ink3); line-height: 1.55; margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      .sugg-tags { display: flex; gap: 12px; }
      .sugg-tag { font-size: 12px; font-family: var(--mono); color: var(--ink3); display: flex; align-items: center; gap: 4px; }
      .sugg-tag i { font-size: 14px; color: var(--acc2); }
      .sugg-arr { font-size: 20px; color: var(--acc-border); flex-shrink: 0; opacity: 0; transition: opacity 0.14s, transform 0.14s; }
      .sugg-item:hover .sugg-arr, .sugg-item:focus-visible .sugg-arr { opacity: 1; color: var(--acc2); transform: translateX(3px); }
      .empty { padding: 24px; text-align: center; font-size: 15px; font-family: var(--f); color: var(--ink3); }

      /* ── Article view ── */
      .art-view { display: flex; flex-direction: column; gap: 16px; }
      .back-btn { background: var(--card); border: 2px solid var(--acc-border); border-radius: var(--rsm); color: var(--acc); font-family: var(--f); font-size: 15px; font-weight: 600; padding: 10px 18px; cursor: pointer; display: flex; align-items: center; gap: 8px; align-self: flex-start; }
      .back-btn:hover { background: var(--acc-light); }
      .back-btn:focus-visible { outline: 2px solid var(--acc); outline-offset: 2px; }
      .art-card { background: var(--card); border: 2px solid var(--grn-b); border-radius: var(--r); overflow: hidden; }
      .art-top { background: var(--grn-bg); padding: 22px 24px; border-bottom: 1px solid var(--grn-b); }
      .art-badges { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
      .real-badge { background: var(--grn-m); color: #fff; font-family: var(--mono); font-size: 12px; padding: 4px 13px; border-radius: var(--rpill); font-weight: 600; }
      .sim-lbl { font-size: 14px; font-family: var(--mono); color: var(--grn-t); }
      .art-title { font-size: 22px; font-weight: 700; font-family: var(--f); color: var(--ink); line-height: 1.35; }
      .art-kw { font-size: 14px; font-family: var(--f); color: var(--teal); display: flex; align-items: center; gap: 6px; margin-top: 10px; font-weight: 500; }
      .art-body { padding: 20px 24px; font-size: 16px; font-family: var(--f); line-height: 1.78; color: var(--ink2); }
      .art-note { padding: 14px 24px; border-top: 1px solid var(--grn-b); background: var(--grn-bg); font-size: 13px; font-family: var(--f); color: var(--grn-t); display: flex; align-items: flex-start; gap: 8px; line-height: 1.5; }
      .art-note i { font-size: 16px; flex-shrink: 0; margin-top: 1px; }

      /* ── Responsive ── */
      @media (max-width: 900px) {
        .two-col { grid-template-columns: 1fr; padding: 16px 20px 60px; }
        .a11y-wrapper { padding: 14px 20px 0; }
        .topbar { padding: 16px 20px; }
        .brand-name { font-size: 22px; }
        .brand-icon { width: 44px; height: 44px; }
        .brand-icon i { font-size: 24px; }
      }
    `}</style>
  );
}