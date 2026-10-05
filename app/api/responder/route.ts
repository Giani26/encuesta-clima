import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AREAS, LUGARES, DIMENSIONES, ESCALA_ACUERDO, PRIORIDADES, MAX_PRIORIDADES, periodoActual, type Respuesta, type PrioridadId } from "@/lib/config";
import { getRedis, claveRespuestas, clavePeriodos } from "@/lib/redis";

// Importante para el anonimato: aquí NO se guarda IP, navegador, correo ni fecha exacta.
// Solo se guardan las respuestas y el periodo de la encuesta.

const limpiarTexto = (v: unknown) =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, 1000) : "";

export async function POST(req: NextRequest) {
  const periodo = periodoActual();
  const cookieName = `enps_${periodo.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const store = await cookies();

  if (store.get(cookieName)) {
    return NextResponse.json(
      { error: "Ya respondiste la encuesta de este periodo desde este dispositivo." },
      { status: 409 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Formato de respuesta inválido." }, { status: 400 });
  }

  const nps = Number(body?.nps);
  if (!Number.isInteger(nps) || nps < 0 || nps > 10) {
    return NextResponse.json({ error: "Elige un número del 0 al 10 en la primera pregunta." }, { status: 400 });
  }

  const dimensiones: Respuesta["dimensiones"] = {};
  for (const d of DIMENSIONES) {
    const v = Number(body?.dimensiones?.[d.id]);
    if (Number.isInteger(v) && v >= 1 && v <= ESCALA_ACUERDO.length) dimensiones[d.id] = v;
  }

  const area = AREAS.includes(body?.area) ? (body.area as string) : null;
  const lugar = LUGARES.includes(body?.lugar) ? (body.lugar as string) : null;

  const idsValidos = PRIORIDADES.map((p) => p.id as string);
  const prioridades = Array.isArray(body?.prioridades)
    ? ([...new Set(body.prioridades)].filter((x) => typeof x === "string" && idsValidos.includes(x)) as PrioridadId[])
    : [];
  if (prioridades.length < 1 || prioridades.length > MAX_PRIORIDADES) {
    return NextResponse.json({ error: `Elige entre 1 y ${MAX_PRIORIDADES} aspectos en los que deberíamos enfocarnos.` }, { status: 400 });
  }
  const otro = prioridades.includes("otro") ? limpiarTexto(body?.otro).slice(0, 200) : "";
  if (prioridades.includes("otro") && !otro) {
    return NextResponse.json({ error: "Escribe cuál es el otro aspecto que elegiste." }, { status: 400 });
  }

  const respuesta: Respuesta = {
    lugar,
    nps,
    area,
    dimensiones,
    prioridades,
    otro,
    valora: limpiarTexto(body?.valora),
    mejorar: limpiarTexto(body?.mejorar),
  };

  try {
    const redis = getRedis();
    await redis.rpush(claveRespuestas(periodo), JSON.stringify(respuesta));
    await redis.sadd(clavePeriodos, periodo);
  } catch (e) {
    return NextResponse.json({ error: "No se pudo guardar la respuesta. Intenta de nuevo en unos minutos." }, { status: 500 });
  }

  // Marca el dispositivo para evitar respuestas duplicadas en el mismo periodo.
  // La cookie solo dice "ya respondió"; no está vinculada a la respuesta.
  store.set(cookieName, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 120,
    path: "/",
  });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const periodo = periodoActual();
  const store = await cookies();
  const yaRespondio = !!store.get(`enps_${periodo.replace(/[^a-zA-Z0-9_-]/g, "")}`);
  return NextResponse.json({ periodo, yaRespondio });
}
