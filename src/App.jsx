import { useState, useRef } from "react";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Playfair+Display:wght@600;700&display=swap');`;

const C = {
  bg: "#FEF8F3", card: "#FFFFFF", primary: "#C4644A", primaryD: "#A8503A",
  primaryL: "#FAEEE9", accent: "#6B9E81", accentL: "#EAF4EF",
  warn: "#C99A2E", warnL: "#FEF6DC", danger: "#B94040", dangerL: "#FAECEC",
  text: "#1C1C1C", muted: "#888", border: "#EDE3DC", borderL: "#F5EDE8",
};

const SYSTEM = `Eres un asistente especializado en evaluación inicial del desarrollo del lenguaje infantil, trabajando para un consultorio de terapia del lenguaje. Tu función es orientar a padres, maestros y tutores sobre el nivel de desarrollo del lenguaje de un menor.

HITOS DE DESARROLLO DEL LENGUAJE (referencia estándar):
- 12 meses: Primeras palabras ("mamá", "papá"), balbuceo, responde a su nombre
- 15-18 meses: 10-20 palabras, señala objetos, entiende instrucciones simples
- 24 meses: 50+ palabras, combina 2 palabras ("más agua"), 50% inteligible para extraños
- 30 meses: 200+ palabras, frases de 2-3 palabras, hace preguntas simples por entonación
- 36 meses: 900+ palabras, oraciones de 3-4 palabras, 75% inteligible para extraños, pregunta "¿por qué?"
- 48 meses: 1,500+ palabras, oraciones de 4-6 palabras, 100% inteligible para familia, narra eventos, usa pasado y futuro
- 60 meses: 2,000+ palabras, lenguaje similar al adulto, cuenta historias coherentes
- 72 meses: Gramática consolidada, comprende conceptos abstractos, lectoescritura emergente

SEÑALES DE ALERTA:
- Sin palabras a los 15 meses / Sin combinaciones a los 24 meses
- Regresión del lenguaje a cualquier edad / Voz muy nasal o inusual
- No inteligible para extraños después de los 4 años
- Evita la comunicación social / Tartamudeo severo después de los 5 años

SEMÁFORO:
- VERDE: Desarrollo acorde o avanzado. Sin señales de alerta relevantes.
- AMARILLO: Algunas características a monitorear. Seguimiento recomendado en 3-6 meses.
- ROJO: Varias señales de alerta. Se recomienda evaluación profesional pronto.

Para nivel_actual_pct: estima un número entero 0-130 que represente qué porcentaje del nivel esperado para su edad demuestra alcanzar (100 = exactamente lo esperado, 120 = avanzado, 60 = por debajo).

Responde ÚNICAMENTE con JSON válido, sin markdown ni texto adicional:
{"nivel_observado":"descripción (2-3 oraciones)","nivel_esperado":"hitos esperados para la edad (2-3 oraciones)","semaforo":"verde|amarillo|rojo","semaforo_titulo":"título corto","semaforo_descripcion":"explicación empática 2-3 oraciones","nivel_actual_pct":80,"fortalezas":["fortaleza 1","fortaleza 2"],"areas_atencion":["área 1","área 2"],"recomendacion":"párrafo empático con recomendación concreta","siguiente_paso":"acción más importante ahora","nota_limitacion":"nota breve sobre limitaciones de la valoración"}`;

const toBase64 = (blob) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onloadend = () => res(r.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });

const ageMonths = (y, m) => parseInt(y || 0) * 12 + parseInt(m || 0);

const getTip = (months) => {
  if (months < 24) return "Señala objetos conocidos y observa si los nombra. Muéstrale un juguete favorito y espera su reacción.";
  if (months < 36) return "Muéstrale un libro con imágenes coloridas y pídele que cuente qué ve en cada página.";
  if (months < 60) return "Pídele que te cuente qué hizo hoy o que narre su caricatura o cuento favorito.";
  return "Hazle preguntas abiertas: '¿Cómo estuvo tu día?' o '¿Qué harías si tuvieras un súper poder?' Deja que hable.";
};

// ─── Semáforo visual ───────────────────────────────────────────────────────
const SemaforoVisual = ({ active }) => {
  const lights = [
    { key: "rojo",     on: "#E05050", off: "#2E1010", glow: "#FF7070" },
    { key: "amarillo", on: "#D4A020", off: "#2E2508", glow: "#FFD566" },
    { key: "verde",    on: "#3DAA6A", off: "#0A2515", glow: "#5FE09A" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{
        background: "linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)",
        borderRadius: 16, padding: "12px 10px", display: "flex",
        flexDirection: "column", gap: 10, border: "3px solid #404040",
        boxShadow: "0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        position: "relative",
      }}>
        <div style={{ position: "absolute", top: 7, left: 7, width: 6, height: 6, borderRadius: "50%", background: "#555" }} />
        <div style={{ position: "absolute", top: 7, right: 7, width: 6, height: 6, borderRadius: "50%", background: "#555" }} />
        <div style={{ position: "absolute", bottom: 7, left: 7, width: 6, height: 6, borderRadius: "50%", background: "#555" }} />
        <div style={{ position: "absolute", bottom: 7, right: 7, width: 6, height: 6, borderRadius: "50%", background: "#555" }} />
        {lights.map((l) => {
          const on = active === l.key;
          return (
            <div key={l.key} style={{
              width: 46, height: 46, borderRadius: "50%",
              background: on ? l.on : l.off,
              border: `2px solid ${on ? l.on : "#333"}`,
              boxShadow: on
                ? `0 0 14px 5px ${l.glow}66, 0 0 28px 8px ${l.glow}33, inset 0 1px 4px rgba(255,255,255,0.25)`
                : "inset 0 2px 6px rgba(0,0,0,0.6)",
              transition: "all 0.5s ease",
              position: "relative",
            }}>
              {on && <div style={{ position: "absolute", top: 8, left: 8, width: 12, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.3)", transform: "rotate(-30deg)" }} />}
            </div>
          );
        })}
      </div>
      <div style={{ width: 6, height: 16, background: "#555" }} />
      <div style={{ width: 40, height: 5, background: "#555", borderRadius: "0 0 4px 4px" }} />
    </div>
  );
};

// ─── Barra de nivel ────────────────────────────────────────────────────────
const BarraNivel = ({ actualPct, semaforo, nombre }) => {
  const clamped  = Math.min(Math.max(actualPct || 50, 0), 130);
  const barWidth = Math.min(clamped, 100);
  const barColor = semaforo === "verde" ? "#3DAA6A" : semaforo === "amarillo" ? "#C99A2E" : "#B94040";
  const bgColor  = semaforo === "verde" ? C.accentL : semaforo === "amarillo" ? C.warnL : C.dangerL;
  const statusLabel =
    clamped >= 110 ? "¡Por encima de lo esperado para su edad!" :
    clamped >= 90  ? "Muy cerca del nivel esperado" :
    clamped >= 70  ? "En proceso de alcanzar el nivel esperado" :
                     "Por debajo del nivel esperado para su edad";

  return (
    <div style={{ background: bgColor, border: `1px solid ${barColor}33`, borderRadius: 16, padding: "1.1rem 1.25rem", marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Nivel de desarrollo</span>
        <span style={{ fontSize: 15, fontWeight: 800, color: barColor }}>{Math.round(clamped)}% del nivel esperado</span>
      </div>

      {/* Barra principal */}
      <div style={{ position: "relative", marginBottom: 8 }}>
        <div style={{ height: 18, background: "rgba(0,0,0,0.09)", borderRadius: 12, overflow: "visible", position: "relative" }}>
          <div style={{
            height: "100%", width: `${barWidth}%`, background: barColor, borderRadius: 12,
            transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)", position: "relative",
            minWidth: barWidth > 0 ? 18 : 0,
          }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(255,255,255,0.08) 0%,rgba(255,255,255,0.22) 100%)", borderRadius: 12 }} />
          </div>
          {/* Marcador 100% */}
          <div style={{
            position: "absolute", top: -5, left: "calc(100% - 1.5px)",
            width: 3, height: 28, background: "#1C1C1C", borderRadius: 2, opacity: 0.25,
          }} />
        </div>
      </div>

      {/* Leyenda */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: barColor }} />
          <span style={{ fontSize: 12, color: barColor, fontWeight: 700 }}>{nombre || "Nivel observado"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 3, height: 14, background: "#1C1C1C", opacity: 0.25, borderRadius: 2 }} />
          <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Nivel esperado (100%)</span>
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: 13, color: barColor, fontWeight: 700 }}>{statusLabel}</div>
    </div>
  );
};

const semColors = {
  verde:    { bg: C.accentL, border: "#3DAA6A", text: "#2A6B44" },
  amarillo: { bg: C.warnL,   border: C.warn,    text: "#7A5A10" },
  rojo:     { bg: C.dangerL, border: C.danger,  text: "#7A2020" },
};

export default function ValoraLenguaje() {
  const [step, setStep]                 = useState(0);
  const [childName, setChildName]       = useState("");
  const [ageYears, setAgeYears]         = useState("");
  const [ageMonthsVal, setAgeMonthsVal] = useState("0");
  const [concern, setConcern]           = useState("");
  const [recording, setRecording]       = useState(false);
  const [recTime, setRecTime]           = useState(0);
  const [audioBlob, setAudioBlob]       = useState(null);
  const [fallback, setFallback]         = useState(false);
  const [fallbackText, setFallbackText] = useState("");
  const [results, setResults]           = useState(null);
  const [apiErr, setApiErr]             = useState(null);

  const mrRef     = useRef(null);
  const chunksRef = useRef([]);
  const timerRef  = useRef(null);

  const totalMonths = ageMonths(ageYears, ageMonthsVal);
  const hasAge      = ageYears !== "" && totalMonths >= 6;
  const canAnalyze  = (audioBlob && !fallback) || (fallback && fallbackText.trim().length > 15);

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        setAudioBlob(new Blob(chunksRef.current, { type: "audio/webm" }));
        stream.getTracks().forEach((t) => t.stop());
      };
      mrRef.current = mr;
      mr.start(100);
      setRecording(true); setRecTime(0); setAudioBlob(null);
      timerRef.current = setInterval(() => {
        setRecTime((t) => { if (t >= 60) { stopRec(); return 60; } return t + 1; });
      }, 1000);
    } catch { setFallback(true); }
  };

  const stopRec = () => {
    if (mrRef.current?.state !== "inactive") mrRef.current?.stop();
    clearInterval(timerRef.current);
    setRecording(false);
  };

  const analyze = async () => {
    setStep(4);
    setApiErr(null);
    const yrs  = Math.floor(totalMonths / 12);
    const mos  = totalMonths % 12;
    const name = childName || "el menor";
    try {
      let content;
      if (audioBlob && !fallback) {
        const b64 = await toBase64(audioBlob);
        content = [
          { type: "audio", source: { type: "base64", media_type: "audio/webm", data: b64 } },
          { type: "text", text: `${name} tiene ${yrs} año(s) y ${mos} mes(es).${concern ? ` Preocupación: ${concern}` : ""} Responde SOLO con el JSON.` },
        ];
      } else {
        content = `Muestra de lenguaje de ${name} (${yrs} año(s) y ${mos} mes(es)):\n"${fallbackText}"\n${concern ? `Preocupación: ${concern}` : ""}\n\nResponde SOLO con el JSON solicitado.`;
      }
      const res  = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          system: SYSTEM,
          messages: [{ role: "user", content }],
        }),
      });
      const data = await res.json();
      const raw  = data.content?.find((b) => b.type === "text")?.text || "";
      setResults(JSON.parse(raw.replace(/```json|```/g, "").trim()));
      setStep(5);
    } catch {
      setApiErr("Error al conectar. Verifica tu conexión e intenta de nuevo.");
      setStep(3);
    }
  };

  const reset = () => {
    setStep(0); setChildName(""); setAgeYears(""); setAgeMonthsVal("0");
    setConcern(""); setRecording(false); setRecTime(0); setAudioBlob(null);
    setFallback(false); setFallbackText(""); setResults(null); setApiErr(null);
  };

  const btn = (variant = "primary", extra = {}) => ({
    background: variant === "primary" ? C.primary : "transparent",
    color: variant === "primary" ? "#fff" : C.muted,
    border: variant === "ghost" ? `1.5px solid ${C.border}` : "none",
    borderRadius: 12, padding: "0.75rem 1.5rem", fontSize: 15,
    fontFamily: "'Nunito', sans-serif", fontWeight: 700, cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: 8, ...extra,
  });
  const inp = (extra = {}) => ({
    width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 10,
    padding: "0.65rem 0.9rem", fontSize: 15, fontFamily: "'Nunito', sans-serif",
    color: C.text, background: "#fff", boxSizing: "border-box", outline: "none", ...extra,
  });
  const lbl = { display: "block", fontSize: 13, fontWeight: 700, color: C.muted, marginBottom: 6, letterSpacing: 0.3, textTransform: "uppercase" };
  const tag = { background: C.primaryL, color: C.primary, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 };

  const Dots = () => (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 28 }}>
      {[1, 2, 3].map((s) => (
        <div key={s} style={{ width: s === step ? 24 : 8, height: 8, borderRadius: 4, background: s < step ? C.accent : s === step ? C.primary : C.borderL, transition: "all 0.3s" }} />
      ))}
    </div>
  );

  const wrap = (children) => (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <style>{FONTS}</style>
      {children}
    </div>
  );

  const card = (children, extra = {}) => (
    <div style={{ background: C.card, borderRadius: 24, padding: "2rem", maxWidth: 520, width: "100%", boxShadow: "0 4px 40px rgba(196,100,74,0.10)", border: `1px solid ${C.borderL}`, ...extra }}>
      {children}
    </div>
  );

  // ── Step 0 ─────────────────────────────────────────────────────────────────
  if (step === 0) return wrap(card(
    <>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.primaryL, margin: "0 auto 1.25rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🗣️</div>
        <div style={{ ...tag, display: "inline-block", marginBottom: 12 }}>Valoración inicial gratuita</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: C.text, margin: "0 0 0.75rem", lineHeight: 1.3 }}>
          ¿Cómo está el lenguaje<br />de tu hij@?
        </h1>
        <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.7, margin: "0 0 1.5rem" }}>
          Recibe en minutos una orientación sobre el nivel de desarrollo del lenguaje de tu hijo/a y si podría beneficiarse de terapia.
        </p>
      </div>
      <div style={{ background: C.bg, borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
        {[["🎙️", "Graba 1 minuto de habla natural"], ["📊", "Comparamos con hitos para su edad"], ["🚦", "Resultado en semáforo fácil de leer"]].map(([ic, txt]) => (
          <div key={txt} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", fontSize: 14, color: C.text }}>
            <span style={{ fontSize: 18 }}>{ic}</span> {txt}
          </div>
        ))}
      </div>
      <button onClick={() => setStep(1)} style={{ ...btn("primary", { width: "100%", justifyContent: "center", fontSize: 16, padding: "0.9rem" }) }}>
        Comenzar valoración →
      </button>
      <p style={{ color: C.muted, fontSize: 12, marginTop: 14, lineHeight: 1.6, textAlign: "center" }}>
        Esta valoración NO reemplaza el diagnóstico clínico. Es orientación inicial.
      </p>
    </>
  ));

  // ── Step 1 ─────────────────────────────────────────────────────────────────
  if (step === 1) return wrap(card(
    <>
      <Dots />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: C.text, margin: "0 0 0.5rem" }}>Datos del menor</h2>
      <p style={{ color: C.muted, fontSize: 14, margin: "0 0 1.75rem", lineHeight: 1.6 }}>La edad es el dato más importante para la valoración.</p>
      <div style={{ marginBottom: 20 }}>
        <label style={lbl}>Nombre (opcional)</label>
        <input style={inp()} placeholder="Nombre del menor" value={childName} onChange={(e) => setChildName(e.target.value)} />
      </div>
      <label style={lbl}>Edad del menor *</label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        <div>
          <input style={inp({ textAlign: "center" })} type="number" min="0" max="12" placeholder="0" value={ageYears} onChange={(e) => setAgeYears(e.target.value)} />
          <div style={{ fontSize: 12, color: C.muted, textAlign: "center", marginTop: 4 }}>años</div>
        </div>
        <div>
          <select style={inp({ textAlign: "center", cursor: "pointer" })} value={ageMonthsVal} onChange={(e) => setAgeMonthsVal(e.target.value)}>
            {Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{i} meses</option>)}
          </select>
        </div>
      </div>
      {hasAge && (
        <div style={{ background: C.primaryL, borderRadius: 10, padding: "0.75rem 1rem", marginBottom: 20, fontSize: 14, color: C.primary, fontWeight: 600 }}>
          📌 {Math.floor(totalMonths / 12)} año(s) y {totalMonths % 12} mes(es) — {totalMonths} meses en total
        </div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setStep(0)} style={btn("ghost")}>← Atrás</button>
        <button onClick={() => setStep(2)} disabled={!hasAge} style={{ ...btn("primary", { flex: 1, justifyContent: "center", opacity: hasAge ? 1 : 0.4 }) }}>Continuar →</button>
      </div>
    </>
  ));

  // ── Step 2 ─────────────────────────────────────────────────────────────────
  if (step === 2) return wrap(card(
    <>
      <Dots />
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: C.text, margin: "0 0 0.5rem" }}>¿Cuál es tu preocupación?</h2>
      <p style={{ color: C.muted, fontSize: 14, margin: "0 0 1.5rem", lineHeight: 1.6 }}>Esto ayuda a contextualizar el análisis. (Opcional)</p>
      <div style={{ marginBottom: 16 }}>
        {["Habla poco para su edad", "No le entendemos bien", "Pronuncia mal muchas palabras", "Le cuesta expresarse", "No habla todavía", "Otra preocupación"].map((opt) => (
          <button key={opt} onClick={() => setConcern(concern === opt ? "" : opt)} style={{
            display: "inline-block", margin: "0 6px 8px 0", padding: "6px 14px", borderRadius: 20,
            border: `1.5px solid ${concern === opt ? C.primary : C.border}`,
            background: concern === opt ? C.primaryL : "#fff",
            color: concern === opt ? C.primary : C.muted, fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Nunito', sans-serif",
          }}>{opt}</button>
        ))}
      </div>
      <textarea style={{ ...inp({ height: 90, resize: "vertical", fontSize: 14 }), marginBottom: 20 }} placeholder="O escribe tu preocupación aquí..." value={concern} onChange={(e) => setConcern(e.target.value)} />
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setStep(1)} style={btn("ghost")}>← Atrás</button>
        <button onClick={() => setStep(3)} style={{ ...btn("primary", { flex: 1, justifyContent: "center" }) }}>Continuar →</button>
      </div>
    </>
  ));

  // ── Step 3 ─────────────────────────────────────────────────────────────────
  if (step === 3) return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <style>{FONTS + `
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.07)} }
        @keyframes ripple { 0%{transform:scale(1);opacity:0.5} 100%{transform:scale(2.1);opacity:0} }
      `}</style>
      {card(
        <>
          <Dots />
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: C.text, margin: "0 0 0.5rem" }}>
            {fallback ? "Describe el lenguaje" : "Graba al menor"}
          </h2>
          <p style={{ color: C.muted, fontSize: 14, margin: "0 0 1.5rem", lineHeight: 1.6 }}>
            {fallback ? "Escribe una muestra de lo que dice tu hijo/a o describe cómo se comunica." : "Graba entre 30 segundos y 1 minuto de habla natural. Mientras más natural, mejor."}
          </p>
          {!fallback ? (
            <>
              <div style={{ background: C.bg, borderRadius: 12, padding: "0.9rem 1rem", marginBottom: 20, fontSize: 13.5, color: C.primary, lineHeight: 1.6 }}>
                <strong>💡 Sugerencia:</strong> {getTip(totalMonths)}
              </div>
              <div style={{ textAlign: "center", margin: "1.25rem 0 1rem" }}>
                <div style={{ position: "relative", display: "inline-block" }}>
                  {recording && <div style={{ position: "absolute", inset: -10, borderRadius: "50%", border: `3px solid ${C.danger}`, animation: "ripple 1.2s ease-out infinite", pointerEvents: "none" }} />}
                  <button onClick={recording ? stopRec : startRec} style={{
                    width: 86, height: 86, borderRadius: "50%", border: "none",
                    background: recording ? C.danger : C.primary, color: "#fff", fontSize: 30,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    animation: recording ? "pulse 1.5s ease-in-out infinite" : "none",
                    boxShadow: `0 4px 20px ${recording ? "rgba(185,64,64,0.35)" : "rgba(196,100,74,0.30)"}`,
                  }}>
                    {recording ? "⏹" : "🎙️"}
                  </button>
                </div>
                <div style={{ marginTop: 12 }}>
                  {recording ? (
                    <div style={{ color: C.danger, fontWeight: 700, fontSize: 15 }}>
                      ● Grabando... {recTime}s / 60s
                      <div style={{ height: 4, background: C.borderL, borderRadius: 4, maxWidth: 150, margin: "6px auto 0" }}>
                        <div style={{ height: "100%", background: C.danger, borderRadius: 4, width: `${(recTime / 60) * 100}%`, transition: "width 1s" }} />
                      </div>
                    </div>
                  ) : audioBlob
                    ? <div style={{ color: C.accent, fontWeight: 700, fontSize: 14 }}>✓ Audio listo — {recTime}s grabados</div>
                    : <div style={{ color: C.muted, fontSize: 14 }}>Toca el micrófono para comenzar</div>
                  }
                </div>
              </div>
              {apiErr && <div style={{ background: C.dangerL, border: `1px solid ${C.danger}`, borderRadius: 10, padding: "0.75rem 1rem", fontSize: 14, color: C.danger, marginBottom: 12 }}>{apiErr}</div>}
              <button onClick={() => setFallback(true)} style={{ display: "block", margin: "0 auto 16px", background: "none", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", textDecoration: "underline", fontFamily: "'Nunito', sans-serif" }}>
                No puedo grabar — ingresar texto en su lugar
              </button>
            </>
          ) : (
            <>
              <textarea style={{ ...inp({ height: 130, resize: "vertical", fontSize: 14, marginBottom: 8 }) }}
                placeholder={`Ejemplo: "${childName || "El niño"} dice frases como 'dame agua', 'quiero jugar'. Le cuesta pronunciar R y S..."`}
                value={fallbackText} onChange={(e) => setFallbackText(e.target.value)} />
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>Incluye ejemplos concretos. Más detalle = mejor análisis.</p>
              <button onClick={() => setFallback(false)} style={{ background: "none", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", textDecoration: "underline", fontFamily: "'Nunito', sans-serif", marginBottom: 14, display: "block" }}>
                ← Volver a grabar audio
              </button>
            </>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep(2)} style={btn("ghost")}>← Atrás</button>
            <button onClick={analyze} disabled={!canAnalyze} style={{ ...btn("primary", { flex: 1, justifyContent: "center", opacity: canAnalyze ? 1 : 0.4 }) }}>
              Analizar ahora →
            </button>
          </div>
        </>
      )}
    </div>
  );

  // ── Step 4 ─────────────────────────────────────────────────────────────────
  if (step === 4) return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <style>{FONTS + `@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ background: C.card, borderRadius: 24, padding: "2.5rem 2rem", maxWidth: 420, width: "100%", textAlign: "center", boxShadow: "0 4px 40px rgba(196,100,74,0.10)", border: `1px solid ${C.borderL}` }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", border: `4px solid ${C.borderL}`, borderTopColor: C.primary, animation: "spin 0.9s linear infinite", margin: "0 auto 1.5rem" }} />
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: C.text, margin: "0 0 0.75rem" }}>Analizando muestra...</h2>
        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7, margin: 0 }}>Comparando con hitos esperados para la edad de {childName || "tu hij@"}.</p>
        {["Procesando audio...", "Identificando patrones...", "Comparando hitos de desarrollo...", "Generando recomendaciones..."].map((msg, i) => (
          <div key={i} style={{ fontSize: 13, color: C.accent, marginTop: 7, animation: `fadeUp 0.5s ease ${i * 0.55}s both` }}>{msg}</div>
        ))}
      </div>
    </div>
  );

  // ── Step 5: Results ────────────────────────────────────────────────────────
  if (step === 5 && results) {
    const sem = semColors[results.semaforo] || semColors.amarillo;
    const pct = typeof results.nivel_actual_pct === "number" ? results.nivel_actual_pct : 70;

    const semLevels = [
      { key: "rojo",     color: "#B94040", bg: C.dangerL, label: "Requiere apoyo pronto" },
      { key: "amarillo", color: "#C99A2E", bg: C.warnL,   label: "Monitorear y dar seguimiento" },
      { key: "verde",    color: "#3DAA6A", bg: C.accentL, label: "Desarrollo acorde a su edad" },
    ];

    return (
      <div style={{ fontFamily: "'Nunito', sans-serif", background: C.bg, minHeight: "100vh", padding: "1.5rem 1.5rem 2.5rem", display: "flex", justifyContent: "center" }}>
        <style>{FONTS}</style>
        <div style={{ maxWidth: 580, width: "100%" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ ...tag, display: "inline-block", marginBottom: 8 }}>
              {childName ? `Valoración de ${childName}` : "Resultado de valoración"}
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: C.text, margin: 0 }}>Reporte de desarrollo del lenguaje</h2>
          </div>

          {/* ── SEMÁFORO VISUAL ── */}
          <div style={{ background: C.card, border: `1.5px solid ${sem.border}33`, borderRadius: 20, padding: "1.4rem", marginBottom: 14, display: "flex", gap: 20, alignItems: "center" }}>
            {/* Semáforo gráfico */}
            <div style={{ flexShrink: 0 }}>
              <SemaforoVisual active={results.semaforo} />
            </div>
            {/* Niveles + descripción */}
            <div style={{ flex: 1 }}>
              {semLevels.map((lv) => {
                const isActive = results.semaforo === lv.key;
                return (
                  <div key={lv.key} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "7px 12px", borderRadius: 10, marginBottom: 6,
                    background: isActive ? lv.bg : "transparent",
                    border: `1.5px solid ${isActive ? lv.color : C.borderL}`,
                    transition: "all 0.3s",
                  }}>
                    <div style={{ width: 13, height: 13, borderRadius: "50%", background: isActive ? lv.color : "#ddd", flexShrink: 0, boxShadow: isActive ? `0 0 6px ${lv.color}88` : "none" }} />
                    <span style={{ fontSize: 13.5, fontWeight: isActive ? 800 : 500, color: isActive ? lv.color : C.muted, flex: 1 }}>{lv.label}</span>
                    {isActive && <span style={{ fontSize: 11, fontWeight: 700, color: lv.color, background: "#fff", borderRadius: 6, padding: "2px 8px", border: `1px solid ${lv.color}`, whiteSpace: "nowrap" }}>
                      ← {childName ? childName : "Aquí"}
                    </span>}
                  </div>
                );
              })}
              <p style={{ fontSize: 13, color: C.muted, margin: "10px 0 0", lineHeight: 1.65, fontStyle: "italic" }}>
                {results.semaforo_descripcion}
              </p>
            </div>
          </div>

          {/* ── BARRA DE NIVEL ── */}
          <BarraNivel actualPct={pct} semaforo={results.semaforo} nombre={childName || "Nivel observado"} />

          {/* Comparativo texto */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            {[["Lo que observamos", results.nivel_observado], ["Esperado para su edad", results.nivel_esperado]].map(([title, text]) => (
              <div key={title} style={{ background: C.card, border: `1px solid ${C.borderL}`, borderRadius: 14, padding: "1rem" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>{title}</div>
                <p style={{ fontSize: 13.5, color: C.text, margin: 0, lineHeight: 1.65 }}>{text}</p>
              </div>
            ))}
          </div>

          {/* Fortalezas y áreas */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div style={{ background: C.accentL, border: `1px solid ${C.accent}`, borderRadius: 14, padding: "1rem" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#2A6B44", marginBottom: 10 }}>✅ Fortalezas</div>
              {results.fortalezas?.map((f, i) => (
                <div key={i} style={{ fontSize: 13, color: "#2A6B44", marginBottom: 6, paddingLeft: 8, borderLeft: `2px solid ${C.accent}` }}>{f}</div>
              ))}
            </div>
            <div style={{ background: results.areas_atencion?.length ? C.warnL : C.accentL, border: `1px solid ${results.areas_atencion?.length ? C.warn : C.accent}`, borderRadius: 14, padding: "1rem" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: results.areas_atencion?.length ? "#7A5A10" : "#2A6B44", marginBottom: 10 }}>👀 Áreas a observar</div>
              {results.areas_atencion?.length
                ? results.areas_atencion.map((a, i) => <div key={i} style={{ fontSize: 13, color: "#7A5A10", marginBottom: 6, paddingLeft: 8, borderLeft: `2px solid ${C.warn}` }}>{a}</div>)
                : <div style={{ fontSize: 13, color: "#2A6B44" }}>Sin áreas de alerta identificadas</div>}
            </div>
          </div>

          {/* Recomendación */}
          <div style={{ background: C.card, border: `1px solid ${C.borderL}`, borderRadius: 16, padding: "1.25rem", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Recomendación</div>
            <p style={{ fontSize: 14, color: C.text, margin: "0 0 12px", lineHeight: 1.7 }}>{results.recomendacion}</p>
            <div style={{ background: C.primaryL, borderRadius: 10, padding: "0.75rem 1rem", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 18 }}>👉</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.primary, letterSpacing: 0.5 }}>SIGUIENTE PASO</div>
                <div style={{ fontSize: 13.5, color: C.primary, fontWeight: 600, marginTop: 2 }}>{results.siguiente_paso}</div>
              </div>
            </div>
          </div>

          {/* ── CTA ── */}
          <div style={{ background: C.primary, borderRadius: 18, padding: "1.5rem", textAlign: "center", marginBottom: 12 }}>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginBottom: 4 }}>¿Quieres una evaluación completa?</div>
            <div style={{ color: "#fff", fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 600, marginBottom: 14, lineHeight: 1.4 }}>
              Nuestro equipo está listo para acompañarte
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="tel:9997435736" style={{
                background: "#fff", color: C.primary, borderRadius: 10,
                padding: "0.65rem 1.3rem", fontWeight: 800, fontSize: 15,
                textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7,
                fontFamily: "'Nunito', sans-serif",
              }}>
                📞 999 743 5736
              </a>
              <a href="https://sinaptica.agenditapp.com" target="_blank" rel="noopener noreferrer" style={{
                background: "rgba(255,255,255,0.15)", color: "#fff",
                border: "1.5px solid rgba(255,255,255,0.45)", borderRadius: 10,
                padding: "0.65rem 1.3rem", fontWeight: 700, fontSize: 14,
                textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7,
                fontFamily: "'Nunito', sans-serif",
              }}>
                📅 Agendar cita en línea
              </a>
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{ background: C.bg, border: `1px dashed ${C.border}`, borderRadius: 12, padding: "0.85rem 1rem", marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.65 }}>
              <strong>⚠️ Nota importante:</strong> {results.nota_limitacion}
            </p>
          </div>

          <button onClick={reset} style={{ ...btn("ghost", { width: "100%", justifyContent: "center", fontSize: 15 }) }}>
            ↺ Hacer otra valoración
          </button>
        </div>
      </div>
    );
  }

  return null;
}
