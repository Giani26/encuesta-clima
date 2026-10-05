"use client";

import { useState } from "react";

type Dim = { id: string; texto: string; promedio: number | null; favorables: number | null; n: number };
type Area = { area: string; total: number; promotores: number; pasivos: number; detractores: number; enps: number };
type Datos = {
  periodo: string; periodos: string[]; minimo: number; suficientes: boolean; total: number;
  enps?: number; promotores?: number; pasivos?: number; detractores?: number;
  distribucion?: number[]; dimensiones?: Dim[]; porArea?: Area[]; respuestasAreasOcultas?: number;
  porLugar?: Area[]; respuestasLugaresOcultas?: number;
  prioridades?: { id: string; titulo: string; n: number; pct: number }[]; totalPrioridades?: number;
  comentarios?: { valora: string[]; mejorar: string[]; otros?: string[] };
};

const color = (n: number) => (n <= 6 ? "var(--detractor)" : n <= 8 ? "var(--pasivo)" : "var(--promotor)");
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

function lecturaEnps(v: number) {
  if (v >= 50) return "Excelente: la mayoría recomendaría trabajar aquí.";
  if (v >= 20) return "Bueno: hay más promotores que detractores.";
  if (v >= 0) return "Aceptable: promotores y detractores están cerca. Hay espacio para mejorar.";
  return "Crítico: hay más detractores que promotores. Conviene actuar pronto.";
}

function Desglose({ titulo, filas, ocultas, minimo }: { titulo: string; filas: Area[]; ocultas: number; minimo: number }) {
  return (
    <section className="bloque">
      <h2>{titulo}</h2>
      {filas.length ? (
        <div className="tabla-scroll">
          <table>
            <thead><tr><th>Grupo</th><th className="num">Respuestas</th><th className="num">Promotores</th><th className="num">Detractores</th><th className="num">eNPS</th></tr></thead>
            <tbody>
              {filas.map((a) => (
                <tr key={a.area}>
                  <td>{a.area}</td>
                  <td className="num">{a.total}</td>
                  <td className="num">{pct(a.promotores, a.total)}%</td>
                  <td className="num">{pct(a.detractores, a.total)}%</td>
                  <td className="num"><strong>{a.enps > 0 ? "+" : ""}{a.enps}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p>Ningún grupo tiene todavía {minimo} respuestas o más.</p>}
      {ocultas > 0 && (
        <p className="nota">{ocultas} respuestas pertenecen a grupos con menos de {minimo} respuestas y no se desglosan para proteger el anonimato.</p>
      )}
    </section>
  );
}

export default function Resultados() {
  const [password, setPassword] = useState("");
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function cargar(periodo?: string) {
    setCargando(true);
    setError("");
    try {
      const r = await fetch("/api/resultados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, periodo }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setDatos(d);
    } catch (e: any) {
      setError(e?.message || "No se pudieron cargar los resultados.");
    } finally {
      setCargando(false);
    }
  }

  if (!datos) {
    return (
      <main className="pagina">
        <div className="intro">
          <div className="logo-caja">
            <img src="/logo.png" alt="Logo" onError={(e) => ((e.currentTarget.parentElement as HTMLElement).style.display = "none")} />
          </div>
          <h1>Resultados de clima laboral</h1>
          <p>Ingresa la contraseña de administración para ver los resultados agregados.</p>
        </div>
        <form className="login" onSubmit={(e) => { e.preventDefault(); cargar(); }}>
          <label htmlFor="pw">Contraseña</label>
          <input id="pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="error" role="alert">{error}</p>}
          <button className="boton" disabled={!password || cargando}>{cargando ? "Cargando…" : "Ver resultados"}</button>
        </form>
      </main>
    );
  }

  const selector = (
    <div className="barra-sup">
      <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)" }}>Clima laboral · {datos.periodo}</h1>
      <div style={{ display: "flex", gap: 10 }}>
        {datos.periodos.length > 1 && (
          <select aria-label="Periodo" value={datos.periodo} onChange={(e) => cargar(e.target.value)}>
            {datos.periodos.map((p) => <option key={p}>{p}</option>)}
          </select>
        )}
        <button className="boton secundario" onClick={() => cargar(datos.periodo)} disabled={cargando}>Actualizar</button>
      </div>
    </div>
  );

  if (!datos.suficientes) {
    return (
      <main className="pagina ancha">
        {selector}
        <section className="bloque">
          <h2>Aún no hay suficientes respuestas</h2>
          <p>
            Hay {datos.total} de {datos.minimo} respuestas necesarias. Para proteger el anonimato, los resultados se muestran
            cuando se alcanza el mínimo.
          </p>
        </section>
      </main>
    );
  }

  const { total, promotores = 0, pasivos = 0, detractores = 0, enps = 0 } = datos;
  const maxDist = Math.max(1, ...(datos.distribucion ?? []));

  return (
    <main className="pagina ancha">
      {selector}

      <section className="bloque">
        <div className="cabecera-enps">
          <div>
            <div className="cifra" style={{ color: enps >= 20 ? "var(--promotor)" : enps >= 0 ? "var(--pasivo)" : "var(--detractor)" }}>
              {enps > 0 ? "+" : ""}{enps}
            </div>
            <p className="cifra-pie">eNPS · {total} respuestas</p>
          </div>
          <div>
            <p style={{ marginBottom: 14 }}>{lecturaEnps(enps)}</p>
            <div className="reparto" role="img" aria-label={`Promotores ${pct(promotores, total)}%, pasivos ${pct(pasivos, total)}%, detractores ${pct(detractores, total)}%`}>
              <span style={{ width: `${pct(detractores, total)}%`, background: "var(--detractor)" }} />
              <span style={{ width: `${pct(pasivos, total)}%`, background: "var(--pasivo)" }} />
              <span style={{ width: `${pct(promotores, total)}%`, background: "var(--promotor)" }} />
            </div>
            <div className="leyenda">
              <span><i style={{ background: "var(--detractor)" }} />Detractores (0–6): {pct(detractores, total)}%</span>
              <span><i style={{ background: "var(--pasivo)" }} />Pasivos (7–8): {pct(pasivos, total)}%</span>
              <span><i style={{ background: "var(--promotor)" }} />Promotores (9–10): {pct(promotores, total)}%</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bloque">
        <h2>Distribución de notas</h2>
        <div className="histograma">
          {datos.distribucion!.map((v, n) => (
            <div key={n}>
              <span>{v}</span>
              <span className="b" style={{ height: `${(v / maxDist) * 120}px`, background: color(n) }} />
              <strong style={{ color: "var(--tinta)" }}>{n}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="bloque">
        <h2>Ambiente laboral por tema</h2>
        <p className="ayuda" style={{ margin: "-6px 0 12px" }}>Porcentaje que eligió la carita verde (“De acuerdo”).</p>
        {datos.dimensiones!
          .slice()
          .sort((a, b) => (a.favorables ?? 0) - (b.favorables ?? 0))
          .map((d) => (
            <div className="fila-dim" key={d.id}>
              <span>{d.texto}</span>
              <div className="pista" title={d.promedio ? `Promedio ${d.promedio.toFixed(1)} de 3` : "Sin respuestas"}>
                <span style={{ width: `${Math.round((d.favorables ?? 0) * 100)}%` }} />
              </div>
              <strong>{d.favorables === null ? "—" : `${Math.round(d.favorables * 100)}%`}</strong>
            </div>
          ))}
        <p className="nota">Ordenado de menor a mayor: los primeros temas son los que más conviene trabajar.</p>
      </section>

      {(datos.prioridades?.length ?? 0) > 0 && (
        <section className="bloque">
          <h2>¿Dónde enfocarnos primero?</h2>
          <p className="ayuda" style={{ margin: "-6px 0 12px" }}>
            Porcentaje de personas que eligió cada aspecto entre sus 3 prioridades ({datos.totalPrioridades} respuestas).
          </p>
          {datos.prioridades!.map((p, i) => (
            <div className="fila-dim" key={p.id}>
              <span>{i < 3 && p.n > 0 ? <strong style={{ textAlign: "left" }}>{p.titulo}</strong> : p.titulo}</span>
              <div className="pista"><span style={{ width: `${Math.round(p.pct * 100)}%`, background: i < 3 && p.n > 0 ? "var(--aji)" : undefined }} /></div>
              <strong>{Math.round(p.pct * 100)}%</strong>
            </div>
          ))}
        </section>
      )}

      <Desglose titulo="Por lugar de trabajo" filas={datos.porLugar ?? []} ocultas={datos.respuestasLugaresOcultas ?? 0} minimo={datos.minimo} />
      <Desglose titulo="Por área" filas={datos.porArea ?? []} ocultas={datos.respuestasAreasOcultas ?? 0} minimo={datos.minimo} />

      <section className="bloque">
        <h2>Comentarios</h2>
        <p className="ayuda" style={{ margin: "-6px 0 16px" }}>Se muestran en orden aleatorio y sin área para que no se puedan asociar a nadie.</p>
        <div className="comentarios">
          <div>
            <h3 style={{ fontSize: "1.05rem", marginBottom: 12 }}>Lo que más valoran ({datos.comentarios!.valora.length})</h3>
            <ul>{datos.comentarios!.valora.map((c, i) => <li key={i}>{c}</li>)}</ul>
          </div>
          <div>
            <h3 style={{ fontSize: "1.05rem", marginBottom: 12 }}>Lo que debería mejorar ({datos.comentarios!.mejorar.length})</h3>
            <ul>{datos.comentarios!.mejorar.map((c, i) => <li key={i}>{c}</li>)}</ul>
          </div>
          {(datos.comentarios!.otros?.length ?? 0) > 0 && (
            <div>
              <h3 style={{ fontSize: "1.05rem", marginBottom: 12 }}>Otros aspectos a priorizar ({datos.comentarios!.otros!.length})</h3>
              <ul>{datos.comentarios!.otros!.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
