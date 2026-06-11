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
    cbNone: "Default", cbTritan: "Tritanopia (blue-blind)", cbMono: "Monochromacy",
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
    errorTitle: "Analysis failed", retry: "Try again",
    ttsNoResult: "No result yet. Analyze an article first.",
    outputPlaceholderTitle: "Your result will appear here",
    outputPlaceholderSub: "Paste an article on the left and click Analyze.",
  },
  es: {
    brandSub: "Detector de autenticidad de noticias",
    a11yTitle: "Herramientas de accesibilidad",
    a11ySub: "Fuente · color · idioma · lectura en voz alta",
    langLabel: "Language / Idioma", visionLabel: "Visión del color",
    cbNone: "Por defecto", cbTritan: "Tritanopía (azul)", cbMono: "Monocromatismo",
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
    errorTitle: "El análisis falló", retry: "Intentar de nuevo",
    ttsNoResult: "Sin resultado. Analiza un artículo primero.",
    outputPlaceholderTitle: "Tu resultado aparecerá aquí",
    outputPlaceholderSub: "Pega un artículo a la izquierda y presiona Analizar.",
  },
};

const CB_FILTERS = {
  none: "none",
  tritan: "url(#cb-tritan)",
  mono: "grayscale(100%) contrast(1.15)",
};

function useHeadLinks() {
  useEffect(() => {
    const id = "google-fonts-inter";
    if (document.getElementById(id)) return;
    const el = document.createElement("link");
    el.id = id; el.rel = "stylesheet";
    el.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";
    document.head.appendChild(el);
  }, []);
}

// ── Inline SVG Icons ──────────────────────────────────────────────────────────
const ICONS = {
  shield:      ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"],
  brain:       ["M9.5 2a2.5 2.5 0 0 1 0 5H9a7 7 0 0 0-7 7 3 3 0 0 0 3 3h1","M14.5 2a2.5 2.5 0 0 0 0 5H15a7 7 0 0 1 7 7 3 3 0 0 1-3 3h-1","M9 17.5a3.5 3.5 0 0 0 6 0"],
  chartBar:    ["M3 3v18h18","M7 16v-5","M11 16V9","M15 16v-3","M19 16V6"],
  news:        ["M4 4h16v16H4z","M4 9h16","M9 9v11"],
  accessible:  ["M12 3a1 1 0 1 0 2 0 1 1 0 0 0-2 0","M6 8l6 1 6-1","M12 9v4l3 3","M9 13l-2 4"],
  user:        ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2","M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"],
  lock:        ["M5 11V7a7 7 0 0 1 14 0v4","M3 11h18v11H3z","M12 15v3"],
  eye:         ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z","M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"],
  eyeOff:      ["M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94","M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19","M1 1l22 22","M10.59 10.59a3 3 0 0 0 4.24 4.24"],
  login:       ["M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4","M10 17l5-5-5-5","M15 12H3"],
  userPlus:    ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2","M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0","M19 8v6","M22 11h-6"],
  alertCircle: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z","M12 8v4","M12 16h.01"],
  sun:         ["M12 1v2","M12 21v2","M4.22 4.22l1.42 1.42","M18.36 18.36l1.42 1.42","M1 12h2","M21 12h2","M4.22 19.78l1.42-1.42","M18.36 5.64l1.42-1.42","M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0z"],
  moon:        ["M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"],
  logout:      ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4","M16 17l5-5-5-5","M21 12H9"],
  fileText:    ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z","M14 2v6h6","M16 13H8","M16 17H8","M10 9H8"],
  link:        ["M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71","M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"],
  scan:        ["M3 7V5a2 2 0 0 1 2-2h2","M17 3h2a2 2 0 0 1 2 2v2","M21 17v2a2 2 0 0 1-2 2h-2","M7 21H5a2 2 0 0 1-2-2v-2","M8 12h8","M12 8v8"],
  circleCheck: ["M22 11.08V12a10 10 0 1 1-5.93-9.14","M22 4 12 14.01l-3-3"],
  circleX:     ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z","M15 9l-6 6","M9 9l6 6"],
  infoCircle:  ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z","M12 16v-4","M12 8h.01"],
  letterA:     ["M4 20L12 4l8 16","M6 14h12"],
  contrast:    ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z","M12 2v20"],
  volume:      ["M11 5L6 9H2v6h4l5 4V5z","M19.07 4.93a10 10 0 0 1 0 14.14","M15.54 8.46a5 5 0 0 1 0 7.07"],
  playerStop:  ["M5 5h14v14H5z"],
  chevronDown: ["M6 9l6 6 6-6"],
  mail:        ["M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z","M22 6l-10 7L2 6"],
  helpSmall:   ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z","M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3","M12 17h.01"],
};

function Icon({ name, size = 18, style, className }) {
  const paths = ICONS[name];
  if (!paths) return null;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      style={style} className={className} aria-hidden="true">
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

function useDyslexicFontFace() {
  useEffect(() => {
    const id = "opendyslexic-face";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @font-face {
        font-family: 'OpenDyslexic';
        src: url('/fonts/OpenDyslexic-Regular.otf') format('opentype');
        font-weight: 400; font-style: normal; font-display: swap;
      }
      @font-face {
        font-family: 'OpenDyslexic';
        src: url('/fonts/OpenDyslexic-Bold.otf') format('opentype');
        font-weight: 700; font-style: normal; font-display: swap;
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

// ── Dark Mode Toggle Button ───────────────────────────────────────────────────

function DarkModeToggle({ dark, onToggle }) {
  return (
    <button
      className="dm-toggle"
      onClick={onToggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark}
      title={dark ? "Light mode" : "Dark mode"}
    >
      <span className="dm-track">
        <span className="dm-thumb">
          <Icon name={dark ? "moon" : "sun"} size={11} />
        </span>
      </span>
      <span className="dm-label">{dark ? "Dark" : "Light"}</span>
    </button>
  );
}

// ── Login Page ────────────────────────────────────────────────────────────────

function LoginPage({ onLogin, dark, onToggleDark, onShowRegister }) {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  useHeadLinks();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user.trim() || !password.trim()) {
      setError("Please enter your username and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("token", data.token);
      onLogin(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <ColorBlindSVGFilters />
      <LoginStyles />

      <div className="login-dm-wrap">
        <DarkModeToggle dark={dark} onToggle={onToggleDark} />
      </div>

      {/* Left panel — branding */}
      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-icon">
            <Icon name="shield" size={24} />
          </div>
          <div className="login-brand-name">VerifyAI</div>
          <div className="login-brand-sub">Research Assistant</div>
        </div>

        <div className="login-features">
          {[
            { svgIcon: "brain", text: "ML-powered authenticity scoring" },
            { svgIcon: "chartBar", text: "Deep linguistic analysis dashboard" },
            { svgIcon: "news", text: "Related sources via NewsAPI" },
            { svgIcon: "accessible", text: "Full accessibility suite built in" },
          ].map(f => (
            <div className="login-feature" key={f.text}>
              <div className="login-feature-icon"><Icon name={f.svgIcon} size={20} style={{ color: "rgba(255,255,255,0.9)" }} /></div>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        <div className="login-footer-note">
          Trained on the ISOT dataset · 44,900 articles
        </div>
      </div>

      {/* Right panel — form */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <h1 className="login-title">Welcome back</h1>
            <p className="login-subtitle">Sign in to your VerifyAI account</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {error && (
              <div className="login-error" role="alert">
                <Icon name="alertCircle" size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="login-field">
              <label htmlFor="login-user" className="login-label">Username</label>
              <div className="login-input-wrap">
                <Icon name="user" size={18} className="login-input-icon-svg" />
                <input
                  id="login-user"
                  type="text"
                  className="login-input"
                  placeholder="Enter your username"
                  value={user}
                  onChange={e => setUser(e.target.value)}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="login-pass" className="login-label">Password</label>
              <div className="login-input-wrap">
                <Icon name="lock" size={18} className="login-input-icon-svg" />
                <input
                  id="login-pass"
                  type={showPass ? "text" : "password"}
                  className="login-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-eye"
                  onClick={() => setShowPass(s => !s)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  <Icon name={showPass ? "eyeOff" : "eye"} size={18} />
                </button>
              </div>
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? (
                <><span className="spin" aria-hidden="true" /> Signing in…</>
              ) : (
                <><Icon name="login" size={18} /> Sign in</>
              )}
            </button>

            <div className="login-divider"><span>or continue with</span></div>

            <button
              type="button"
              className="login-google"
              onClick={() => alert("Google Auth coming soon!")}
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>
          </form>

          <p className="login-register">
            Don't have an account?{" "}
            <button
              type="button"
              className="login-register-link"
              onClick={() => onShowRegister()}
            >
              <Icon name="userPlus" size={16} /> Request access
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Register Page ─────────────────────────────────────────────────────────────

function RegisterPage({ onRegister, dark, onToggleDark, onShowLogin }) {
  const [user, setUser] = useState("");
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [strength, setStrength] = useState(0);

  useHeadLinks();

  const calcStrength = (val) => {
    let s = 0;
    if (val.length >= 8) s++;
    if (/[A-Z]/.test(val)) s++;
    if (/[0-9]/.test(val)) s++;
    if (/[^A-Za-z0-9]/.test(val)) s++;
    return s;
  };

  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["", "#E24B4A", "#F59E0B", "#639922", "#639922"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user.trim() || !mail.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, email: mail, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      // Auto-login
      const loginRes = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password }),
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) throw new Error(loginData.error || "Login failed");

      localStorage.setItem("token", loginData.token);
      onRegister(loginData.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <ColorBlindSVGFilters />
      <LoginStyles />

      <div className="login-dm-wrap">
        <DarkModeToggle dark={dark} onToggle={onToggleDark} />
      </div>

      {/* Left panel — steps */}
      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-icon">
            <Icon name="shield" size={24} />
          </div>
          <div className="login-brand-name">VerifyAI</div>
          <div className="login-brand-sub">Research Assistant</div>
        </div>

        <div className="login-features">
          <div className="reg-steps-eyebrow">Get started in 3 steps</div>
          {[
            { num: "1", label: "Create your account", sub: "Just a username, email & password", active: true },
            { num: "2", label: "Paste any article", sub: "Text or URL — we handle both" },
            { num: "3", label: "Get your verdict instantly", sub: "ML score + linguistic analysis" },
          ].map(s => (
            <div className="login-feature" key={s.num}>
              <div className="login-feature-icon reg-step-num" style={s.active ? { background: "rgba(255,255,255,0.9)" } : {}}>
                <span style={{ fontSize: 13, fontWeight: 700, color: s.active ? "var(--acc)" : "rgba(255,255,255,0.9)", lineHeight: 1 }}>{s.num}</span>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: s.active ? "#fff" : "rgba(255,255,255,0.75)" }}>{s.label}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="login-footer-note">Trained on the ISOT dataset · 44,900 articles</div>
      </div>

      {/* Right panel — form */}
      <div className="login-right">
        <div className="login-card" style={{ maxWidth: 460 }}>
          <div className="login-card-header">
            <h1 className="login-title">Create an account</h1>
            <p className="login-subtitle">Sign up for your VerifyAI account — it's free</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {error && (
              <div className="login-error" role="alert">
                <Icon name="alertCircle" size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Username + Email row */}
            <div className="reg-two-col">
              <div className="login-field">
                <label htmlFor="reg-user" className="login-label">Username</label>
                <div className="login-input-wrap">
                  <Icon name="user" size={18} className="login-input-icon-svg" />
                  <input
                    id="reg-user"
                    type="text"
                    className="login-input"
                    placeholder="e.g. jsmith"
                    value={user}
                    onChange={e => setUser(e.target.value)}
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>
              <div className="login-field">
                <label htmlFor="reg-mail" className="login-label">Email</label>
                <div className="login-input-wrap">
                  <Icon name="mail" size={18} className="login-input-icon-svg" />
                  <input
                    id="reg-mail"
                    type="email"
                    className="login-input"
                    placeholder="you@email.com"
                    value={mail}
                    onChange={e => setMail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="login-field">
              <label htmlFor="reg-pass" className="login-label">Password</label>
              <div className="login-input-wrap">
                <Icon name="lock" size={18} className="login-input-icon-svg" />
                <input
                  id="reg-pass"
                  type={showPass ? "text" : "password"}
                  className="login-input"
                  placeholder="Create a password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    setStrength(calcStrength(e.target.value));
                  }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="login-eye"
                  onClick={() => setShowPass(s => !s)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  <Icon name={showPass ? "eyeOff" : "eye"} size={18} />
                </button>
              </div>

              {/* Strength meter */}
              {password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: i <= strength ? strengthColors[strength] : "var(--acc-border)",
                        transition: "background 0.2s",
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 12, color: "var(--ink3)" }}>{strengthLabels[strength]}</span>
                </div>
              )}

              <span style={{ fontSize: 12, color: "var(--ink3)", display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                <Icon name="infoCircle" size={14} />
                Minimum 8 characters
              </span>
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? (
                <><span className="spin" aria-hidden="true" /> Creating account…</>
              ) : (
                <><Icon name="userPlus" size={16} /> Create account</>
              )}
            </button>

            <div className="login-divider"><span>or continue with</span></div>

            <button
              type="button"
              className="login-google"
              onClick={() => alert("Google Auth coming soon!")}
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>
          </form>

          <p style={{ fontSize: 13, color: "var(--ink3)", textAlign: "center", lineHeight: 1.6, marginTop: 12 }}>
            By creating an account you agree to our{" "}
            <a href="#" style={{ color: "var(--acc2)", fontWeight: 500, textDecoration: "none" }}>Terms of Service</a>
            {" "}and{" "}
            <a href="#" style={{ color: "var(--acc2)", fontWeight: 500, textDecoration: "none" }}>Privacy Policy</a>
          </p>

          <p className="login-register">
            Already have an account?{" "}
            <button
              type="button"
              className="login-register-link"
              onClick={() => onShowLogin()}
            >
              Sign in instead
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Accessibility Panel ───────────────────────────────────────────────────────

function A11yPanel({ t, lang, setLang, cbMode, setCbMode, dyslexic, toggleDyslexic, hiContrast, toggleHiContrast, fontSize, setFontSize, onTTSRead, ttsPlaying, onTTSStop, hasResult }) {
  const [open, setOpen] = useState(false);
  const CB_OPTIONS = [
    { id: "none", label: t.cbNone, svgIcon: "eye" },
    { id: "tritan", label: t.cbTritan, svgIcon: "eyeOff" },
    { id: "mono", label: t.cbMono, svgIcon: "contrast" },
  ];
  return (
    <div className="a11y-panel" role="region" aria-label={t.a11yTitle}>
      <button className="a11y-header" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls="a11y-body">
        <div className="a11y-header-left">
          <Icon name="accessible" size={20} />
          <div>
            <div className="a11y-header-title">{t.a11yTitle}</div>
            <div className="a11y-header-sub">{t.a11ySub}</div>
          </div>
        </div>
        <Icon name="chevronDown" size={18} className={`a11y-chevron${open ? " open" : ""}`} />
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
                  <Icon name={opt.svgIcon} size={18} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="a11y-section-label">{t.fontLabel}</div>
            <div className="a11y-row" style={{ marginBottom: 10 }}>
              <button className={`a11y-btn${dyslexic ? " active" : ""}`} onClick={toggleDyslexic} aria-pressed={dyslexic}>
                <Icon name="letterA" size={18} />{t.dyslexicBtn}
              </button>
              <button className={`a11y-btn${hiContrast ? " active" : ""}`} onClick={toggleHiContrast} aria-pressed={hiContrast}>
                <Icon name="contrast" size={18} />{t.contrastBtn}
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
                  <Icon name="volume" size={18} />{t.ttsRead}
                </button>
              ) : (
                <button className="tts-stop" onClick={onTTSStop} aria-label={t.ttsStop}>
                  <Icon name="playerStop" size={18} />{t.ttsStop}
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

// ── Result Components ─────────────────────────────────────────────────────────

function ConfidenceBar({ confidence, isFake }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { const id = requestAnimationFrame(() => setWidth(confidence)); return () => cancelAnimationFrame(id); }, [confidence]);
  return (
    <div className="r-conf">
      <div className="r-conf-row">
        <span className="r-conf-lbl">Classifier confidence</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 600, color: "var(--ink)" }}>{confidence}%</span>
      </div>
      <div className="bar-track" role="meter" aria-valuenow={confidence} aria-valuemin={0} aria-valuemax={100} aria-label={`Confidence: ${confidence}%`}>
        <div className={`bar-fill ${isFake ? "bf-fake" : "bf-real"}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function ResultCard({ result, t }) {
  const isFake = result.verdict === "FAKE";
  return (
    <div className={`result-wrap r-${isFake ? "fake" : "real"}`} role="region" aria-label={isFake ? t.headingFake : t.headingReal}>
      <div className="r-hero">
        <div className={`r-icon ${isFake ? "fake" : "real"}`}>
          <Icon name={isFake ? "circleX" : "circleCheck"} size={32} style={{ color: "#fff" }} />
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
                <Icon name="helpSmall" size={18} />
              </button>
              <div className="kw-tip-pop" role="tooltip">{t.kwTooltip}</div>
            </div>
          </div>
          <div className="kw-row">
            {result.top_words.map(kw => (
              <span key={kw.word} className="kw-pill" style={{ opacity: Math.min(0.4 + kw.score * 8, 1) }} title={`Influence: ${kw.score.toFixed(4)}`}>{kw.word}</span>
            ))}
          </div>
        </div>
      )}
      <div className="r-foot">
        <Icon name="infoCircle" size={16} />
        <span>{t.disclaimer}</span>
      </div>
    </div>
  );
}

// ── Dashboard Components ──────────────────────────────────────────────────────

function MiniBar({ value, max, color }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth((value / max) * 100));
    return () => cancelAnimationFrame(id);
  }, [value, max]);
  return (
    <div style={{ height: 8, background: "rgba(128,128,128,0.15)", borderRadius: 4, overflow: "hidden", marginTop: 6 }}>
      <div style={{ height: "100%", width: `${width}%`, background: color, borderRadius: 4, transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)" }} />
    </div>
  );
}

function AnalysisDashboard({ result }) {
  if (!result?.analysis) return null;
  const { sentiment, readability, stats } = result.analysis;
  const isFake = result.verdict === "FAKE";
  const accent = isFake ? "var(--red-m)" : "var(--grn-m)";
  const easeVal = Math.max(0, Math.min(100, readability.reading_ease));
  const gradeVal = Math.max(0, Math.min(16, readability.grade_level));
  const subjVal = Math.round(sentiment.subjectivity * 100);
  const polarVal = Math.round((sentiment.polarity + 1) / 2 * 100);
  const metrics = [
    { label: "Reading ease", value: `${easeVal.toFixed(0)} / 100`, bar: easeVal, max: 100, color: easeVal < 40 ? "#f59e0b" : "var(--grn-m)", hint: "Higher = easier to read. Fake news tends to score lower." },
    { label: "Grade level", value: `Grade ${gradeVal}`, bar: gradeVal, max: 16, color: gradeVal < 8 ? "#f59e0b" : "var(--acc2)", hint: "US school grade equivalent." },
    { label: "Subjectivity", value: `${subjVal}% opinionated`, bar: subjVal, max: 100, color: subjVal > 60 ? "#ef4444" : "var(--acc2)", hint: "Higher = more opinionated language." },
    { label: "Tone", value: sentiment.polarity_label, bar: polarVal, max: 100, color: sentiment.polarity < -0.2 ? "#ef4444" : sentiment.polarity > 0.2 ? "var(--grn-m)" : "var(--acc2)", hint: "Emotional tone of the article." },
  ];
  return (
    <div style={{ background: "var(--card)", border: "2px solid var(--acc-border)", borderRadius: "var(--r)", overflow: "hidden", marginBottom: 16, animation: "up 0.3s ease 0.05s both" }}>
      <div style={{ background: "var(--acc-light)", padding: "16px 20px", borderBottom: "1px solid var(--acc-border)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, background: "var(--acc2)", borderRadius: "var(--rsm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="chartBar" size={22} style={{ color: "#fff" }} />
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, fontFamily: "var(--f)", color: "var(--acc)" }}>Article Analysis</div>
          <div style={{ fontSize: 13, fontFamily: "var(--f)", color: "var(--ink3)", marginTop: 2 }}>Linguistic and readability metrics</div>
        </div>
      </div>
      <div style={{ padding: "20px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
          {metrics.map(m => (
            <div key={m.label} style={{ background: "var(--card2)", border: "1px solid var(--acc-border)", borderRadius: "var(--rsm)", padding: "14px 16px" }} title={m.hint}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 11, fontFamily: "var(--f)", color: "var(--ink3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{m.label}</span>
                <span style={{ fontSize: 13, fontFamily: "var(--mono)", fontWeight: 600, color: "var(--ink)" }}>{m.value}</span>
              </div>
              <MiniBar value={m.bar} max={m.max} color={m.color} />
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Words", value: stats.word_count },
            { label: "Sentences", value: stats.sentence_count },
            { label: "! marks", value: stats.exclamation_count, warn: stats.exclamation_count > 2 },
            { label: "ALL CAPS", value: stats.caps_words, warn: stats.caps_words > 3 },
          ].map(s => (
            <div key={s.label} style={{ background: s.warn ? "var(--red-bg)" : "var(--card2)", border: `1px solid ${s.warn ? "var(--red-b)" : "var(--acc-border)"}`, borderRadius: "var(--rsm)", padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--mono)", color: s.warn ? "var(--red-m)" : "var(--ink)" }}>{s.value}</div>
              <div style={{ fontSize: 11, fontFamily: "var(--f)", color: "var(--ink3)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
            </div>
          ))}
        </div>
        {result.top_words?.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontFamily: "var(--f)", color: "var(--ink3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 12 }}>Top influencing words</div>
            {result.top_words.map((w, i) => {
              const pct = Math.min(w.score * 100 * 3, 100);
              return (
                <div key={w.word} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontFamily: "var(--mono)", color: "var(--ink2)", fontWeight: 600 }}>{w.word}</span>
                    <span style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--ink3)" }}>{(w.score * 100).toFixed(2)}%</span>
                  </div>
                  <div style={{ height: 8, background: "rgba(128,128,128,0.15)", borderRadius: 4, overflow: "hidden" }}>
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
      <div style={{ background: "var(--acc-light)", padding: "16px 20px", borderBottom: "1px solid var(--acc-border)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, background: isFakeFraming ? "#ef4444" : "var(--acc2)", borderRadius: "var(--rsm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name={isFakeFraming ? "shield" : "news"} size={22} style={{ color: "#fff" }} />
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, fontFamily: "var(--f)", color: "var(--acc)" }}>{isFakeFraming ? "Verified Sources" : "Related Sources"}</div>
          <div style={{ fontSize: 13, fontFamily: "var(--f)", color: "var(--ink3)", marginTop: 2 }}>{related.framing}</div>
        </div>
      </div>
      <div>
        {related.articles.map((article, i) => (
          <div key={i} style={{ padding: "18px 20px", borderBottom: i < related.articles.length - 1 ? "1px solid var(--acc-border)" : "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
              <a href={article.url} target="_blank" rel="noreferrer"
                style={{ fontSize: 15, fontWeight: 600, fontFamily: "var(--f)", color: "var(--acc)", textDecoration: "none", lineHeight: 1.4, flex: 1 }}
                onMouseOver={e => e.target.style.textDecoration = "underline"}
                onMouseOut={e => e.target.style.textDecoration = "none"}
              >{article.title}</a>
              <span style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--ink3)", whiteSpace: "nowrap", marginTop: 2 }}>{article.source}</span>
            </div>
            {article.published_at && (
              <div style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--ink3)", marginBottom: 10 }}>
                {new Date(article.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </div>
            )}
            {article.excerpt && (
              <div style={{ background: "var(--card2)", border: "1px solid var(--acc-border)", borderRadius: "var(--rsm)", padding: "12px 14px", marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontFamily: "var(--f)", color: "var(--ink3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 6 }}>Relevant excerpt</div>
                <div style={{ fontSize: 14, fontFamily: "var(--f)", color: "var(--ink2)", lineHeight: 1.6, fontStyle: "italic" }}>"{article.excerpt}"</div>
              </div>
            )}
            <div style={{ background: "var(--card2)", border: "1px solid var(--acc-border)", borderRadius: "var(--rsm)", padding: "10px 14px" }}>
              <div style={{ fontSize: 11, fontFamily: "var(--f)", color: "var(--ink3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 5 }}>APA Citation</div>
              <div style={{ fontSize: 13, fontFamily: '"Times New Roman", Georgia, serif', color: "var(--ink2)", lineHeight: 1.7 }}>{article.citation}</div>
            </div>
          </div>
        ))}
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

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inputMode, setInputMode] = useState("text");
  const [authMode, setAuthMode] = useState("login");

  const [lang, setLangState] = useState("en");
  const [cbMode, setCbModeState] = useState("none");
  const [dyslexic, setDyslexic] = useState(false);
  const [hiContrast, setHiContrast] = useState(false);
  const [fontSize, setFontSizeState] = useState(17);
  const [ttsPlaying, setTtsPlaying] = useState(false);

  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("verifyai-dark");
    if (saved !== null) return saved === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("verifyai-dark", String(dark));
  }, [dark]);

  const toggleDark = useCallback(() => setDark(d => !d), []);

  const textareaRef = useRef(null);
  const t = TRANSLATIONS[lang];

  useHeadLinks();
  useDyslexicFontFace();

  useEffect(() => {
    const overrideId = "dyslexic-override";
    let el = document.getElementById(overrideId);
    if (dyslexic) {
      if (!el) { el = document.createElement("style"); el.id = overrideId; document.head.appendChild(el); }
      el.textContent = `
        *, *::before, *::after, input, textarea, button, select, label, p, span, div, h1, h2, h3, h4, h5, h6, a, li {
          font-family: 'OpenDyslexic', 'OpenDyslexicAlta', sans-serif !important;
          letter-spacing: 0.07em !important; word-spacing: 0.15em !important; line-height: 1.9 !important;
        }`;
    } else { if (el) el.remove(); }
  }, [dyslexic]);

  const handleLogin = (newToken) => setToken(newToken);
  const logout = () => { localStorage.removeItem("token"); setToken(null); setAuthMode("login"); };

  const setLang = useCallback((l) => { setLangState(l); document.documentElement.lang = l; }, []);
  const setCbMode = useCallback((mode) => { setCbModeState(mode); document.body.style.filter = CB_FILTERS[mode] || "none"; }, []);
  const toggleDyslexic = useCallback(() => setDyslexic(d => !d), []);
  const toggleHiContrast = useCallback(() => { setHiContrast(h => { document.body.classList.toggle("hi-contrast", !h); return !h; }); }, []);
  const setFontSize = useCallback((v) => { setFontSizeState(v); document.documentElement.style.setProperty("--app-fs", v + "px"); }, []);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const canSubmit = inputMode === "url" ? text.trim().length > 0 : text.trim() && wordCount >= 10;

  const stopTTS = () => { window.speechSynthesis.cancel(); setTtsPlaying(false); };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true); setResult(null); setError(null); stopTTS();
    try {
      const endpoint = inputMode === "url" ? "/predict/url" : "/predict/article";
      const payload = inputMode === "url" ? { url: text } : { text };
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
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

  const loadExample = (type) => {
    setText(EXAMPLES[type]); setResult(null); setError(null); setInputMode("text"); stopTTS();
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

  if (!token) {
    return authMode === "login" ? (
      <LoginPage
        onLogin={handleLogin}
        dark={dark}
        onToggleDark={toggleDark}
        onShowRegister={() => setAuthMode("register")}
      />
    ) : (
      <RegisterPage
        dark={dark}
        onToggleDark={toggleDark}
        onRegister={handleLogin}
        onShowLogin={() => setAuthMode("login")}
      />
    );
  }

  return (
    <div className="app-shell">
      <ColorBlindSVGFilters />
      <Styles />
      <a className="skip-link" href="#main-input">Skip to article input</a>

      <header className="topbar">
        <div className="brand">
          <div className="brand-icon" aria-hidden="true"><Icon name="shield" size={24} /></div>
          <div>
            <div className="brand-name">VerifyAI</div>
            <div className="brand-sub">{t.brandSub}</div>
          </div>
        </div>
        <div className="topbar-actions">
          <DarkModeToggle dark={dark} onToggle={toggleDark} />
          <button className="logout-btn" onClick={logout} aria-label="Logout">
            <Icon name="logout" size={18} />
            Logout
          </button>
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

            <div className="mode-tabs">
              <button className={`mode-tab${inputMode === "text" ? " active" : ""}`} onClick={() => setInputMode("text")}>
                <Icon name="fileText" size={16} />Paste Text
              </button>
              <button className={`mode-tab${inputMode === "url" ? " active" : ""}`} onClick={() => setInputMode("url")}>
                <Icon name="link" size={16} />URL
              </button>
            </div>

            <textarea
              id="main-input"
              ref={textareaRef}
              className="textarea"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={inputMode === "url" ? "Paste article URL here…" : "Paste article text here…"}
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
                {loading ? <><span className="spin" aria-hidden="true" />{t.analyzing}</> : <><Icon name="scan" size={18} />{t.analyze}</>}
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT: Result */}
        <section className="col-right" aria-label="Analysis output" aria-live="polite">
          {error && (
            <div className="err-card" role="alert">
              <div className="err-icon"><Icon name="alertCircle" size={22} /></div>
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

// ── Styles ────────────────────────────────────────────────────────────────────

function LoginStyles() {
  return (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      :root {
        --ink: #1A1230; --ink2: #3D3660; --ink3: #7B74A8;
        --page: #F5F3FF; --card: #FFFFFF; --card2: #EEEBFF;
        --acc: #4A3AB5; --acc2: #6B5CE7; --acc-light: #EAE8FF; --acc-border: #C4BEFF;
        --red-bg: #FFF0F0; --red-b: #F09595; --red-t: #791F1F; --red-m: #E24B4A;
        --r: 16px; --rsm: 10px; --rpill: 100px;
        --f: 'Inter', system-ui, sans-serif;
        --mono: 'JetBrains Mono', 'Fira Code', monospace;
      }

      .dark {
        --ink: #E8E4FF; --ink2: #C4BEFF; --ink3: #9890C8;
        --page: #0F0D1A; --card: #1A1730; --card2: #231E3D;
        --acc: #8B7FF0; --acc2: #7B6CE7; --acc-light: #1E1A38; --acc-border: #3D3660;
        --red-bg: #2A1010; --red-b: #7A3030; --red-t: #F09595; --red-m: #E24B4A;
      }

      body { font-family: var(--f); background: var(--page); color: var(--ink); margin: 0; transition: background 0.25s, color 0.25s; }

      .dm-toggle {
        display: flex; align-items: center; gap: 8px;
        background: none; border: none; cursor: pointer;
        padding: 4px; border-radius: 100px;
        color: rgba(255,255,255,0.85);
        font-family: var(--f); font-size: 13px; font-weight: 600;
        transition: color 0.15s;
      }
      .dm-toggle:hover { color: #fff; }
      .dm-toggle:focus-visible { outline: 2px solid rgba(255,255,255,0.6); outline-offset: 2px; }
      .dm-track {
        width: 44px; height: 24px;
        background: rgba(255,255,255,0.18);
        border: 1.5px solid rgba(255,255,255,0.3);
        border-radius: 100px; position: relative;
        transition: background 0.25s, border-color 0.25s; flex-shrink: 0;
      }
      .dm-toggle[aria-pressed="true"] .dm-track { background: rgba(255,255,255,0.28); border-color: rgba(255,255,255,0.5); }
      .dm-thumb {
        position: absolute; top: 2px; left: 2px;
        width: 18px; height: 18px; background: rgba(255,255,255,0.9); border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
      }
      .dm-toggle[aria-pressed="true"] .dm-thumb { transform: translateX(20px); }
      .dm-thumb svg { color: var(--acc); }
      .dm-label { font-size: 13px; font-weight: 600; }

      .login-dm-wrap {
        position: fixed; top: 20px; right: 24px; z-index: 100;
        background: rgba(74,58,181,0.85); backdrop-filter: blur(8px);
        border: 1.5px solid rgba(255,255,255,0.2); border-radius: 100px;
        padding: 6px 14px 6px 8px;
      }
      .dark .login-dm-wrap { background: rgba(30,26,56,0.9); border-color: rgba(255,255,255,0.12); }

      .login-shell { min-height: 100dvh; display: grid; grid-template-columns: 1fr 1fr; }

      .login-left {
        background: var(--acc); display: flex; flex-direction: column; justify-content: center;
        padding: 60px 56px; position: relative; overflow: hidden;
      }
      .login-left::before {
        content: ''; position: absolute; top: -120px; right: -120px;
        width: 400px; height: 400px; border-radius: 50%; background: rgba(255,255,255,0.06);
      }
      .login-left::after {
        content: ''; position: absolute; bottom: -80px; left: -80px;
        width: 280px; height: 280px; border-radius: 50%; background: rgba(255,255,255,0.04);
      }

      .login-brand { margin-bottom: 56px; position: relative; z-index: 1; }
      .login-brand-icon {
        width: 72px; height: 72px; background: rgba(255,255,255,0.18);
        border-radius: 18px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;
      }
      .login-brand-icon svg { color: #fff; }
      .login-brand-name { font-size: 42px; font-weight: 700; color: #fff; letter-spacing: -0.03em; line-height: 1; }
      .login-brand-sub { font-size: 16px; color: rgba(255,255,255,0.65); margin-top: 8px; font-weight: 400; }

      .login-features { display: flex; flex-direction: column; gap: 20px; margin-bottom: 56px; position: relative; z-index: 1; }
      .login-feature { display: flex; align-items: center; gap: 16px; }
      .login-feature-icon {
        width: 40px; height: 40px; flex-shrink: 0;
        background: rgba(255,255,255,0.14); border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
      }
      .login-feature-icon svg { color: rgba(255,255,255,0.9); }
      .login-feature span { font-size: 16px; color: rgba(255,255,255,0.85); font-weight: 400; }
      .login-footer-note { font-size: 13px; color: rgba(255,255,255,0.4); position: relative; z-index: 1; }

      /* Register-specific left panel pieces */
      .reg-steps-eyebrow {
        font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.45);
        text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;
      }
      .reg-step-num { border-radius: 50% !important; }

      /* Register two-col input row */
      .reg-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

      .login-right {
        display: flex; align-items: center; justify-content: center;
        padding: 60px 40px; background: var(--page); transition: background 0.25s;
      }
      .login-card { width: 100%; max-width: 420px; }
      .login-card-header { margin-bottom: 32px; }
      .login-title { font-size: 32px; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; margin-bottom: 8px; }
      .login-subtitle { font-size: 16px; color: var(--ink3); font-weight: 400; }

      .login-form { display: flex; flex-direction: column; gap: 20px; margin-bottom: 20px; }

      .login-error {
        display: flex; align-items: center; gap: 10px;
        background: var(--red-bg); border: 1.5px solid var(--red-b);
        border-radius: var(--rsm); padding: 12px 16px; font-size: 14px; color: var(--red-t);
      }
      .login-error svg { flex-shrink: 0; }

      .login-field { display: flex; flex-direction: column; gap: 7px; }
      .login-label { font-size: 14px; font-weight: 600; color: var(--ink2); }
      .login-input-wrap { position: relative; }
      .login-input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 18px; color: var(--ink3); pointer-events: none; }
      .login-input-icon-svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--ink3); pointer-events: none; }
      .login-input {
        width: 100%; padding: 13px 14px 13px 44px; font-size: 15px; font-family: var(--f);
        color: var(--ink); background: var(--card); border: 2px solid var(--acc-border);
        border-radius: var(--rsm); outline: none; transition: border-color 0.15s, background 0.25s, color 0.25s;
      }
      .login-input:focus { border-color: var(--acc2); }
      .login-input::placeholder { color: var(--ink3); }
      .login-eye {
        position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
        background: none; border: none; cursor: pointer; padding: 4px;
        color: var(--ink3); font-size: 18px; display: flex; align-items: center;
      }
      .login-eye:hover { color: var(--acc); }

      .login-submit {
        width: 100%; background: var(--acc2); border: none; border-radius: var(--rsm);
        color: #fff; font-family: var(--f); font-size: 16px; font-weight: 700;
        padding: 14px 20px; cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: 9px;
        transition: opacity 0.14s, transform 0.1s; margin-top: 4px;
      }
      .login-submit:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
      .login-submit:disabled { opacity: 0.45; cursor: not-allowed; }
      .spin { width: 16px; height: 16px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: rot 0.7s linear infinite; display: inline-block; }
      @keyframes rot { to { transform: rotate(360deg); } }

      .login-divider { display: flex; align-items: center; gap: 12px; color: var(--ink3); font-size: 13px; }
      .login-divider::before, .login-divider::after { content: ''; flex: 1; height: 1px; background: var(--acc-border); }

      .login-google {
        width: 100%; background: var(--card); border: 2px solid var(--acc-border);
        border-radius: var(--rsm); color: var(--ink); font-family: var(--f);
        font-size: 15px; font-weight: 500; padding: 12px 20px; cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.14s;
      }
      .login-google:hover { background: var(--acc-light); border-color: var(--acc2); }

      .login-register { text-align: center; font-size: 14px; color: var(--ink3); margin-top: 20px; }
      .login-register-link {
        background: none; border: none; cursor: pointer;
        color: var(--acc2); font-family: var(--f); font-size: 14px; font-weight: 600;
        text-decoration: underline; padding: 0;
        display: inline-flex; align-items: center; gap: 5px; vertical-align: middle;
      }
      .login-register-link i { font-size: 16px; text-decoration: none; }
      .login-register-link:hover { color: var(--acc); }

      @media (max-width: 768px) {
        .login-shell { grid-template-columns: 1fr; }
        .login-left { display: none; }
        .login-right { padding: 40px 24px; }
        .reg-two-col { grid-template-columns: 1fr; }
      }
    `}</style>
  );
}

function Styles() {
  return (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      :root {
        --ink: #1A1230; --ink2: #3D3660; --ink3: #7B74A8;
        --page: #F5F3FF; --card: #FFFFFF; --card2: #EEEBFF;
        --acc: #4A3AB5; --acc2: #6B5CE7; --acc-light: #EAE8FF; --acc-border: #C4BEFF;
        --red-bg: #FFF0F0; --red-b: #F09595; --red-t: #791F1F; --red-m: #E24B4A;
        --grn-bg: #EDFAE1; --grn-b: #97C459; --grn-t: #27500A; --grn-m: #639922;
        --r: 16px; --rsm: 10px; --rpill: 100px;
        --f: 'Inter', system-ui, sans-serif;
        --mono: 'JetBrains Mono', 'Fira Code', monospace;
        --app-fs: 17px;
      }

      .dark {
        --ink: #E8E4FF; --ink2: #C4BEFF; --ink3: #9890C8;
        --page: #0F0D1A; --card: #1A1730; --card2: #231E3D;
        --acc: #9B8FFF; --acc2: #7B6CE7; --acc-light: #1E1A38; --acc-border: #3D3660;
        --red-bg: #2A1010; --red-b: #7A3030; --red-t: #F09595; --red-m: #E24B4A;
        --grn-bg: #0D1F08; --grn-b: #3B6D11; --grn-t: #C0DD97; --grn-m: #7BBF3A;
      }

      body {
        font-family: var(--f); background: var(--page); color: var(--ink);
        font-size: var(--app-fs); line-height: 1.6; transition: background 0.25s, color 0.25s;
      }
      body.hi-contrast {
        --ink: #000; --ink2: #111; --ink3: #333;
        --card: #fff; --card2: #f0f0f0; --page: #fff;
        --acc: #1A0D7A; --acc2: #2B1BB0; --acc-light: #E0DDFF; --acc-border: #6B5CE7;
        --red-m: #C00000; --grn-m: #006600;
      }
      .dark body.hi-contrast {
        --ink: #fff; --ink2: #eee; --ink3: #bbb;
        --card: #000; --card2: #111; --page: #000;
        --acc: #B0A0FF; --acc2: #9080F0; --acc-light: #1A1640; --acc-border: #5040B0;
      }

      .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
      .skip-link { position: absolute; top: -60px; left: 14px; background: var(--acc); color: #fff; padding: 10px 20px; border-radius: var(--rsm); font-size: 16px; font-weight: 600; text-decoration: none; z-index: 100; }
      .skip-link:focus { top: 14px; }
      .app-shell { min-height: 100vh; display: flex; flex-direction: column; background: var(--page); }

      .topbar { background: var(--acc); padding: 20px 32px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
      .dark .topbar { background: #16122E; border-bottom: 1px solid var(--acc-border); }
      .brand { display: flex; align-items: center; gap: 16px; }
      .brand-icon { width: 54px; height: 54px; background: rgba(255,255,255,0.2); border-radius: var(--rsm); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .brand-icon svg { color: #fff; }
      .brand-name { font-size: 28px; font-weight: 700; color: #fff; letter-spacing: -0.02em; font-family: var(--f); }
      .brand-sub { font-size: 14px; color: rgba(255,255,255,0.7); margin-top: 2px; font-weight: 400; font-family: var(--f); }
      .topbar-actions { display: flex; align-items: center; gap: 12px; }

      .dm-toggle {
        display: flex; align-items: center; gap: 8px; background: none; border: none; cursor: pointer;
        padding: 4px; border-radius: 100px; color: rgba(255,255,255,0.85);
        font-family: var(--f); font-size: 13px; font-weight: 600; transition: color 0.15s;
      }
      .dm-toggle:hover { color: #fff; }
      .dm-toggle:focus-visible { outline: 2px solid rgba(255,255,255,0.6); outline-offset: 2px; border-radius: 100px; }
      .dm-track {
        width: 44px; height: 24px; background: rgba(255,255,255,0.15);
        border: 1.5px solid rgba(255,255,255,0.3); border-radius: 100px; position: relative;
        transition: background 0.25s, border-color 0.25s; flex-shrink: 0;
      }
      .dm-toggle[aria-pressed="true"] .dm-track { background: rgba(255,255,255,0.28); border-color: rgba(255,255,255,0.55); }
      .dm-thumb {
        position: absolute; top: 2px; left: 2px; width: 18px; height: 18px;
        background: rgba(255,255,255,0.95); border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
      }
      .dm-toggle[aria-pressed="true"] .dm-thumb { transform: translateX(20px); }
      .dm-thumb svg { color: var(--acc); }
      .dm-label { font-size: 13px; font-weight: 600; }

      .login-dm-wrap {
        position: fixed; top: 20px; right: 24px; z-index: 100;
        background: rgba(74,58,181,0.85); backdrop-filter: blur(8px);
        border: 1.5px solid rgba(255,255,255,0.2); border-radius: 100px; padding: 6px 14px 6px 8px;
      }
      .dark .login-dm-wrap { background: rgba(22,18,46,0.92); }

      .logout-btn { background: rgba(255,255,255,0.12); border: 1.5px solid rgba(255,255,255,0.25); border-radius: var(--rsm); color: rgba(255,255,255,0.9); font-family: var(--f); font-size: 14px; font-weight: 500; padding: 9px 18px; cursor: pointer; display: flex; align-items: center; gap: 7px; transition: all 0.14s; }
      .logout-btn i { font-size: 16px; }
      .logout-btn:hover { background: rgba(255,255,255,0.22); }
      .logout-btn:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

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
      .tts-bar { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: var(--card2); border: 2px solid var(--acc-border); border-radius: var(--rsm); }
      .tts-btn { background: var(--acc); border: none; border-radius: var(--rsm); color: #fff; font-size: 15px; font-family: var(--f); padding: 9px 18px; cursor: pointer; display: flex; align-items: center; gap: 8px; flex-shrink: 0; font-weight: 500; }
      .tts-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .tts-btn:focus-visible { outline: 2px solid var(--acc); outline-offset: 2px; }
      .tts-label { font-size: 14px; font-family: var(--f); color: var(--ink3); flex: 1; }
      .tts-stop { background: var(--red-bg); border: 2px solid var(--red-b); border-radius: var(--rsm); color: var(--red-t); font-size: 14px; font-family: var(--f); padding: 7px 14px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 500; }

      .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; max-width: 1400px; margin: 0 auto; width: 100%; padding: 24px 32px 16px; align-items: start; }
      .col-left { min-width: 0; }
      .col-right { min-width: 0; display: flex; flex-direction: column; gap: 16px; }

      .mode-tabs { display: flex; border-bottom: 1px solid var(--acc-border); background: var(--card2); }
      .mode-tab { flex: 1; padding: 12px 16px; background: transparent; border: none; font-family: var(--f); font-size: 14px; font-weight: 500; color: var(--ink3); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px; border-bottom: 2px solid transparent; transition: all 0.14s; margin-bottom: -1px; }
      .mode-tab svg { flex-shrink: 0; }
      .mode-tab:hover { color: var(--acc); background: var(--acc-light); }
      .mode-tab.active { color: var(--acc); border-bottom-color: var(--acc2); background: var(--card); font-weight: 600; }
      .mode-tab:focus-visible { outline: 2px solid var(--acc); outline-offset: -2px; }

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
      .dark .wc.warn { color: #FAC775; }
      .analyze-btn { background: var(--acc2); border: none; border-radius: var(--rsm); color: #fff; font-family: var(--f); font-size: 17px; font-weight: 700; padding: 13px 30px; cursor: pointer; display: flex; align-items: center; gap: 9px; transition: opacity 0.14s, transform 0.1s; }
      .analyze-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
      .analyze-btn:focus-visible { outline: 2px solid var(--acc); outline-offset: 3px; }
      .analyze-btn:disabled { opacity: 0.35; cursor: not-allowed; }
      .spin { width: 16px; height: 16px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: rot 0.7s linear infinite; display: inline-block; }
      .spin-lg { width: 36px; height: 36px; border: 3px solid var(--acc-border); border-top-color: var(--acc); border-radius: 50%; animation: rot 0.8s linear infinite; display: block; margin: 0 auto 16px; }
      @keyframes rot { to { transform: rotate(360deg); } }
      @keyframes up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

      .output-placeholder { border: 2px dashed var(--acc-border); border-radius: var(--r); padding: 56px 32px; text-align: center; background: var(--card); display: flex; flex-direction: column; align-items: center; gap: 12px; }
      .output-placeholder-title { font-size: 20px; font-weight: 600; color: var(--ink2); font-family: var(--f); }
      .output-placeholder-sub { font-size: 16px; font-family: var(--f); color: var(--ink3); }

      .err-card { background: var(--red-bg); border: 2px solid var(--red-b); border-radius: var(--r); padding: 18px 20px; display: flex; gap: 14px; animation: up 0.25s ease; }
      .err-icon { width: 42px; height: 42px; background: var(--red-bg); border: 1px solid var(--red-b); border-radius: var(--rsm); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .err-icon svg { color: var(--red-t); }
      .err-title { font-size: 17px; font-weight: 600; color: var(--red-t); font-family: var(--f); }
      .err-msg { font-size: 15px; font-family: var(--f); color: var(--red-t); margin-top: 4px; }
      .err-retry { background: transparent; border: 1.5px solid var(--red-b); border-radius: var(--rsm); color: var(--red-t); font-family: var(--f); font-size: 14px; padding: 6px 14px; cursor: pointer; margin-top: 9px; font-weight: 500; }

      .result-wrap { border-radius: var(--r); border: 2px solid; overflow: hidden; animation: up 0.28s ease; }
      .r-fake { background: var(--red-bg); border-color: var(--red-m); }
      .r-real { background: var(--grn-bg); border-color: var(--grn-m); }
      .r-hero { padding: 24px 24px 0; display: flex; align-items: flex-start; gap: 18px; }
      .r-icon { width: 58px; height: 58px; border-radius: var(--rsm); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .r-icon.fake { background: var(--red-m); } .r-icon.real { background: var(--grn-m); }
      .r-icon svg { color: #fff; }
      .r-vpill { display: inline-block; font-family: var(--mono); font-size: 10px; font-weight: 700; letter-spacing: 0.08em; padding: 2px 9px; border-radius: var(--rpill); border: 1px solid; margin-bottom: 5px; }
      .r-vpill.fake { background: var(--red-bg); border-color: var(--red-m); color: var(--red-t); }
      .r-vpill.real { background: var(--grn-bg); border-color: var(--grn-m); color: var(--grn-t); }
      .r-heading { font-size: 20px; font-weight: 700; font-family: var(--f); color: var(--ink); line-height: 1.3; }
      .r-sub { font-size: 13px; font-family: var(--f); color: var(--ink3); margin-top: 4px; }
      .r-conf { padding: 18px 24px; }
      .r-conf-row { display: flex; justify-content: space-between; margin-bottom: 10px; align-items: center; }
      .r-conf-lbl { font-size: 15px; font-family: var(--f); font-weight: 500; color: var(--ink2); }
      .bar-track { height: 12px; background: rgba(128,128,128,0.15); border-radius: 6px; overflow: hidden; }
      .bar-fill { height: 100%; border-radius: 6px; transition: width 0.9s cubic-bezier(0.34,1.56,0.64,1); width: 0; }
      .bf-fake { background: var(--red-m); } .bf-real { background: var(--grn-m); }
      .kw-sec { padding: 0 24px 20px; border-top: 1px solid rgba(128,128,128,0.12); padding-top: 18px; }
      .kw-lbl-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
      .kw-lbl { font-size: 12px; font-weight: 600; font-family: var(--f); color: var(--ink2); text-transform: uppercase; letter-spacing: 0.07em; }
      .kw-tip-wrap { position: relative; display: inline-block; }
      .kw-tip-btn { background: rgba(128,128,128,0.12); border: none; border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: var(--ink3); }
      .kw-tip-btn:focus-visible { outline: 2px solid var(--acc); outline-offset: 2px; }
      .kw-tip-pop { display: none; position: absolute; top: 26px; left: 0; z-index: 20; background: var(--ink); color: var(--page); border-radius: var(--rsm); padding: 11px 14px; font-size: 13px; font-family: var(--f); line-height: 1.5; max-width: 240px; pointer-events: none; }
      .kw-tip-wrap:hover .kw-tip-pop, .kw-tip-wrap:focus-within .kw-tip-pop { display: block; }
      .kw-row { display: flex; flex-wrap: wrap; gap: 8px; }
      .kw-pill { background: rgba(128,128,128,0.1); border: 1px solid rgba(128,128,128,0.18); border-radius: 7px; padding: 6px 13px; font-family: var(--mono); font-size: 13px; color: var(--ink2); cursor: default; }
      .r-foot { padding: 14px 24px; border-top: 1px solid rgba(128,128,128,0.1); background: rgba(128,128,128,0.04); display: flex; align-items: center; gap: 8px; font-size: 13px; font-family: var(--f); color: var(--ink3); }
      .r-foot svg { flex-shrink: 0; }

      @media (max-width: 900px) {
        .two-col { grid-template-columns: 1fr; padding: 16px 20px 16px; }
        .a11y-wrapper { padding: 14px 20px 0; }
        .topbar { padding: 16px 20px; }
        .brand-name { font-size: 22px; }
        .brand-icon { width: 44px; height: 44px; }
        .brand-icon svg { color: #fff; }
        .dm-label { display: none; }
      }
    `}</style>
  );
}