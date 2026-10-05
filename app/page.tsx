"use client";

import { useEffect, useState } from "react";
import { AREAS, LUGARES, DIMENSIONES, ESCALA_ACUERDO, PRIORIDADES, MAX_PRIORIDADES } from "@/lib/config";

const EMPRESA = process.env.NEXT_PUBLIC_EMPRESA || "la empresa";
const grupo = (n: number) => (n <= 6 ? "det" : n <= 8 ? "pas" : "pro");
const CARAS = [
  { color: "#e0483a", boca: "M7.5 17.5 Q12 12.5 16.5 17.5" },
  { color: "#f2b616", boca: "M8 15.5 L16 15.5" },
  { color: "#5cb031", boca: "M7.5 13.5 Q12 19.5 16.5 13.5" },
];
const EMOJI_NPS = (n: number) => (n <= 3 ? "😞" : n <= 6 ? "🙁" : n <= 8 ? "🙂" : n === 9 ? "😀" : "🤩");
const TEXTO_NPS = (n: number) =>
  n <= 6 ? "Gracias por la honestidad. Más abajo puedes contarnos qué cambiarías." : n <= 8 ? "¡Bien! ¿Qué haría que fuera un 10?" : "¡Genial! Cuéntanos más abajo qué es lo que más valoras.";

function Cara({ nivel }: { nivel: number }) {
  const c = CARAS[nivel];
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill={c.color} />
      <circle cx="12" cy="12" r="11" fill="none" stroke="rgba(0,0,0,.18)" strokeWidth="1" />
      <ellipse cx="8.6" cy="9.4" rx="1.3" ry="1.7" fill="#1f1f1f" />
      <ellipse cx="15.4" cy="9.4" rx="1.3" ry="1.7" fill="#1f1f1f" />
      <path d={c.boca} stroke="#1f1f1f" strokeWidth="1.7" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Logo() {
  return (
    <div className="logo-caja">
      <img src="/logo.png" alt={EMPRESA} onError={(e) => ((e.currentTarget.parentElement as HTMLElement).style.display = "none")} />
    </div>
  );
}

export default function Encuesta() {
  const [estado, setEstado] = useState<"cargando" | "abierta" | "enviando" | "enviada" | "repetida">("cargando");
  const [nps, setNps] = useState<number | null>(null);
  const [dims, setDims] = useState<Record<string, number>>({});
  const [area, setArea] = useState("");
  const [lugar, setLugar] = useState("");
  const [prioridades, setPrioridades] = useState<string[]>([]);
  const [otro, setOtro] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [valora, setValora] = useState("");
  const [mejorar, setMejorar] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/responder")
      .then((r) => r.json())
      .then((d) => {
        setPeriodo(d.periodo);
        let marcado = false;
        try { marcado = localStorage.getItem(`enps_respondido_${d.periodo}`) === "1"; } catch {}
        setEstado(d.yaRespondio || marcado ? "repetida" : "abierta");
      })
      .catch(() => setEstado("abierta"));
  }, []);

  const totalPreguntas = 3 + DIMENSIONES.length;
  const respondidas = (lugar ? 1 : 0) + (nps !== null ? 1 : 0) + Object.keys(dims).length + (prioridades.length ? 1 : 0);

  function alternarPrioridad(id: string) {
    setPrioridades((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= MAX_PRIORIDADES ? prev : [...prev, id]
    );
  }

  function irA(id: string, mensaje: string) {
    setError(mensaje);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  const avance = Math.round((respondidas / totalPreguntas) * 100);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (nps === null) return irA("p-nps", "Elige un número del 0 al 10 en la pregunta de recomendación.");
    if (!prioridades.length) return irA("p-prioridades", `Elige al menos 1 aspecto (máximo ${MAX_PRIORIDADES}) en los que deberíamos enfocarnos.`);
    if (prioridades.includes("otro") && !otro.trim()) return irA("p-prioridades", "Escribe cuál es el otro aspecto que elegiste.");
    setError("");
    setEstado("enviando");
    try {
      const r = await fetch("/api/responder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lugar: lugar && lugar !== "-" ? lugar : null, nps, dimensiones: dims, area: area || null, prioridades, otro, valora, mejorar }),
      });
      const d = await r.json();
      if (r.status === 409) {
        try { localStorage.setItem(`enps_respondido_${periodo}`, "1"); } catch {}
        return setEstado("repetida");
      }
      if (!r.ok) throw new Error(d.error);
      try { localStorage.setItem(`enps_respondido_${periodo}`, "1"); } catch {}
      setEstado("enviada");
      window.scrollTo({ top: 0 });
    } catch (err: any) {
      setError(err?.message || "No se pudo enviar. Revisa tu conexión e intenta de nuevo.");
      setEstado("abierta");
    }
  }

  if (estado === "enviada" || estado === "repetida") {
    return (
      <main className="pagina">
        <header className="intro final">
          <Logo />
          <div className="check" aria-hidden="true">{estado === "enviada" ? "🎉" : "👋"}</div>
          <h1>{estado === "enviada" ? "¡Gracias por responder!" : "Ya respondiste esta encuesta"}</h1>
          <p>
            {estado === "enviada"
              ? "Tu respuesta se guardó sin tu nombre ni datos de tu dispositivo. Los resultados se revisan siempre en conjunto, nunca de forma individual."
              : "Solo se puede responder una vez por periodo desde cada dispositivo. Cuando abramos la próxima ronda podrás volver a participar."}
          </p>
        </header>
      </main>
    );
  }

  return (
    <>
      <div className="progreso" role="progressbar" aria-valuenow={avance} aria-valuemin={0} aria-valuemax={100} aria-label="Avance de la encuesta">
        <span style={{ width: `${avance}%` }} />
      </div>
      <main className="pagina">
        <header className="intro">
          <Logo />
          <h1>¿Cómo es trabajar en {EMPRESA}?</h1>
          <p>Toma unos 3 minutos. Es 100% anónima: no pedimos nombre ni correo, y los resultados solo se ven en conjunto.</p>
        </header>

        <form onSubmit={enviar} noValidate>
              <section className="tarjeta" id="p-lugar">
                <label className="enunciado" htmlFor="lugar">¿Dónde trabajas?</label>
                <select id="lugar" className="selector" value={lugar} onChange={(e) => setLugar(e.target.value)}>
                  <option value="">Elige dónde trabajas</option>
                  {LUGARES.map((l) => <option key={l} value={l}>{l}</option>)}
                  <option value="-">Prefiero no decirlo</option>
                </select>
              </section>

              <section className="tarjeta">
                <label className="enunciado" htmlFor="area">¿En qué área trabajas? <span className="opcional">Opcional</span></label>
                <select id="area" className="selector" value={area} onChange={(e) => setArea(e.target.value)}>
                  <option value="">Elige tu área</option>
                  {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </section>

              <section className="tarjeta" id="p-nps">
                <h2 className="enunciado" id="t-nps">
                  Del 0 al 10, ¿recomendarías {EMPRESA} como lugar para trabajar a un amigo o familiar?
                </h2>
                <div className={`escala-nps ${nps !== null ? "elegido" : ""}`} role="radiogroup" aria-labelledby="t-nps">
                  {Array.from({ length: 11 }, (_, n) => (
                    <div key={n} className={grupo(n)}>
                      <input type="radio" name="nps" id={`nps-${n}`} value={n} checked={nps === n} onChange={() => setNps(n)} />
                      <label htmlFor={`nps-${n}`}>{n}</label>
                    </div>
                  ))}
                </div>
                <div className="extremos" aria-hidden="true"><span>Nada probable</span><span>Muy probable</span></div>
                {nps !== null && (
                  <p key={nps} className={`eco eco-${grupo(nps)}`}>
                    <span className="eco-emoji" aria-hidden="true">{EMOJI_NPS(nps)}</span>
                    {TEXTO_NPS(nps)}
                  </p>
                )}
              </section>

              <section className="tarjeta">
                <h2 className="enunciado">Elige la carita que mejor te represente</h2>
                <div className="leyenda-caras" aria-hidden="true">
                  <span><span className="mini"><Cara nivel={0} /></span>En desacuerdo</span>
                  <span><span className="mini"><Cara nivel={1} /></span>Neutral</span>
                  <span><span className="mini"><Cara nivel={2} /></span>De acuerdo</span>
                </div>
                {DIMENSIONES.map((d) => (
                  <div className="dimension" key={d.id}>
                    <p className="frase" id={`t-${d.id}`}>{d.texto}</p>
                    <div className={`caras ${dims[d.id] ? "elegido" : ""}`} role="radiogroup" aria-labelledby={`t-${d.id}`}>
                      {ESCALA_ACUERDO.map((etq, i) => (
                        <div key={i}>
                          <input
                            type="radio" name={d.id} id={`${d.id}-${i + 1}`} value={i + 1}
                            checked={dims[d.id] === i + 1}
                            onChange={() => setDims({ ...dims, [d.id]: i + 1 })}
                          />
                          <label htmlFor={`${d.id}-${i + 1}`} title={etq}>
                            <Cara nivel={i} />
                            <span className="sr-only">{etq}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                    <p className="etiqueta-elegida" aria-live="polite">{dims[d.id] ? ESCALA_ACUERDO[dims[d.id] - 1] : "\u00a0"}</p>
                  </div>
                ))}
              </section>

              <section className="tarjeta" id="p-prioridades">
                <h2 className="enunciado" id="t-prio">
                  ¿En cuáles de estos aspectos crees que deberíamos enfocarnos primero para ayudarte a trabajar mejor y sentirte más a gusto en la empresa?
                </h2>
                <p className="contador-prio" aria-live="polite">
                  Elige hasta {MAX_PRIORIDADES} · <strong>{prioridades.length} de {MAX_PRIORIDADES}</strong>
                </p>
                <div className="prioridades" role="group" aria-labelledby="t-prio">
                  {PRIORIDADES.map((p) => {
                    const elegida = prioridades.includes(p.id);
                    const bloqueada = !elegida && prioridades.length >= MAX_PRIORIDADES;
                    return (
                      <button type="button" key={p.id} aria-pressed={elegida} disabled={bloqueada}
                        className={elegida ? "prio on" : "prio"} onClick={() => alternarPrioridad(p.id)}>
                        <span className="prio-marca" aria-hidden="true">{elegida ? prioridades.indexOf(p.id) + 1 : ""}</span>
                        <span className="prio-texto">
                          <strong>{p.titulo}</strong>
                          {p.detalle && <span>{p.detalle}</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {prioridades.includes("otro") && (
                  <input className="campo-otro" type="text" maxLength={200} autoFocus aria-label="¿Cuál otro aspecto?"
                    placeholder="¿Cuál? Escríbelo aquí" value={otro} onChange={(e) => setOtro(e.target.value)} />
                )}
              </section>

              <section className="tarjeta">
                <label className="enunciado" htmlFor="valora">¿Qué es lo que más valoras de trabajar aquí? <span className="opcional">Opcional</span></label>
                <textarea id="valora" maxLength={1000} value={valora} onChange={(e) => setValora(e.target.value)} placeholder="El buen ambiente en la cocina" />
                <label className="enunciado segundo" htmlFor="mejorar">¿Qué debería mejorar la empresa? <span className="opcional">Opcional</span></label>
                <textarea id="mejorar" maxLength={1000} value={mejorar} onChange={(e) => setMejorar(e.target.value)} placeholder="Avisar con más tiempo los cambios de turno en sala" />
                <p className="ayuda">Evita nombres propios o detalles que puedan identificarte a ti o a otras personas.</p>
              </section>

              {error && <p className="error" role="alert">{error}</p>}
              <button className="boton enviar" type="submit" disabled={estado !== "abierta"}>
                {estado === "enviando" ? "Enviando…" : "Enviar respuesta anónima"}
              </button>
              <p className="nota">La encuesta no guarda tu nombre, correo, IP ni la hora en que respondes.</p>
        </form>
      </main>
    </>
  );
}
