import { Redis } from "@upstash/redis";

export function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error("Falta configurar la base de datos (UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN).");
  }
  return new Redis({ url, token });
}

export const claveRespuestas = (periodo: string) => `enps:${periodo}:respuestas`;
export const clavePeriodos = "enps:periodos";
