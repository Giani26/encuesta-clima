import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { DIMENSIONES, ESCALA_ACUERDO, PRIORIDADES, periodoActual, minRespuestas, type Respuesta } from "@/lib/config";
import { getRedis, claveRespuestas, clavePeriodos } from "@/lib/redis";

function claveCorrecta(intento: string) {
  const real = process.env.ADMIN_PASSWORD || "";
  if (!real) return false;
  const a = Buffer.from(intento);
  const b = Buffer.from(real);
  return a.length === b.length && timingSafeEqual(a, b);
}

function barajar<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function resumir(lista: Respuesta[]) {
  const total = lista.length;
  const promotores = lista.filter((r) => r.nps >= 9).length;
  const detractores = lista.filter((r) => r.nps <= 6).length;
  const pasivos = total - promotores - detractores;
  const enps = total ? Math.round(((promotores - detractores) / total) * 100) : 0;
  return { total, promotores, pasivos, detractores, enps };
}

function promediosDimensiones(lista: Respuesta[]) {
  return DIMENSIONES.map((d) => {
    const valores = lista.map((r) => r.dimensiones?.[d.id]).filter((v): v is number => typeof v === "number");
    const promedio = valores.length ? valores.reduce((s, v) => s + v, 0) / valores.length : null;
    const favorables = valores.length ? valores.filter((v) => v === ESCALA_ACUERDO.length).length / valores.length : null;
    return { id: d.id, texto: d.texto, promedio, favorables, n: valores.length };
  });
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  if (!claveCorrecta(String(body?.password ?? ""))) {
    await new Promise((r) => setTimeout(r, 800)); // frena intentos por fuerza bruta
    return NextResponse.json({ error: "La contraseña no es correcta." }, { status: 401 });
  }

  const minimo = minRespuestas();
  try {
    const redis = getRedis();
    const periodos = ((await redis.smembers(clavePeriodos)) as string[]).sort().reverse();
    const periodo =
      typeof body?.periodo === "string" && periodos.includes(body.periodo) ? body.periodo : periodoActual();

    const crudas = await redis.lrange(claveRespuestas(periodo), 0, -1);
    const lista: Respuesta[] = crudas.map((x: unknown) => (typeof x === "string" ? JSON.parse(x) : x) as Respuesta);

    const general = resumir(lista);
    if (general.total < minimo) {
      return NextResponse.json({
        periodo,
        periodos: periodos.length ? periodos : [periodo],
        minimo,
        suficientes: false,
        total: general.total,
      });
    }

    const distribucion = Array.from({ length: 11 }, (_, n) => lista.filter((r) => r.nps === n).length);

    // Desgloses: solo se muestran grupos con suficientes respuestas; el resto se agrupa
    const desglosar = (clave: (r: Respuesta) => string | null | undefined, sinDato: string) => {
      const mapa = new Map<string, Respuesta[]>();
      for (const r of lista) {
        const k = clave(r) || sinDato;
        mapa.set(k, [...(mapa.get(k) ?? []), r]);
      }
      let ocultas = 0;
      const filas = [...mapa.entries()]
        .filter(([, rs]) => {
          if (rs.length >= minimo) return true;
          ocultas += rs.length;
          return false;
        })
        .map(([nombre, rs]) => ({ area: nombre, ...resumir(rs) }))
        .sort((a, b) => b.total - a.total);
      return { filas, ocultas };
    };
    const areas = desglosar((r) => r.area, "Prefiero no decirlo");
    const lugares = desglosar((r) => r.lugar, "Prefiero no decirlo");

    // Prioridades: % de personas que eligió cada aspecto
    const conPrioridades = lista.filter((r) => Array.isArray(r.prioridades) && r.prioridades.length);
    const prioridades = PRIORIDADES.map((p) => {
      const n = conPrioridades.filter((r) => r.prioridades!.includes(p.id)).length;
      return { id: p.id, titulo: p.titulo, n, pct: conPrioridades.length ? n / conPrioridades.length : 0 };
    }).sort((a, b) => b.n - a.n);

    // Comentarios desordenados y sin área, para que no se puedan asociar a nadie
    const valora = barajar(lista.map((r) => r.valora).filter(Boolean));
    const mejorar = barajar(lista.map((r) => r.mejorar).filter(Boolean));
    const otros = barajar(lista.map((r) => r.otro || "").filter(Boolean));

    return NextResponse.json({
      periodo,
      periodos,
      minimo,
      suficientes: true,
      ...general,
      distribucion,
      dimensiones: promediosDimensiones(lista),
      porArea: areas.filas,
      respuestasAreasOcultas: areas.ocultas,
      porLugar: lugares.filas,
      respuestasLugaresOcultas: lugares.ocultas,
      prioridades,
      totalPrioridades: conPrioridades.length,
      comentarios: { valora, mejorar, otros },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "No se pudieron cargar los resultados." }, { status: 500 });
  }
}
