// ─── Edita aquí las preguntas, lugares y áreas de tu empresa ───

// ¿Dónde trabajas? ("Prefiero no decirlo" se agrega solo al final)
export const LUGARES = [
  "Rikos Llúria",
  "Rikos Badal",
  "Rikos Can Vidalet",
  "Rikos Meridiana",
  "Rikos Poble Sec",
  "Rikos Santa Coloma",
  "Rikos 4 Caminos",
  "Rikos Cornellà",
  "Rikos Salamanca",
  "Rikos Glòries",
  "Rikos Icària",
  "Ceviche 103",
  "La Turuleca",
  "Chifa Cholo Chang",
  "Nikkei 103",
  "Carmela",
  "Cholito Sagrera",
  "Cholito Hospitalet",
  "Cholito Sagrada",
  "Cholito Poble Sec",
  "La Rotonda",
  "Producción plancha y salsas",
  "Obrador",
  "Mantenimiento",
  "Oficinas",
];

// ¿En qué área trabajas?
export const AREAS = ["Sala", "Cocina", "Oficina"];

export const DIMENSIONES = [
  { id: "ambiente", texto: "Me siento cómodo/a y respetado/a en mi equipo" },
  { id: "liderazgo", texto: "Mi jefatura directa me apoya y me da retroalimentación útil" },
  { id: "comunicacion", texto: "La comunicación dentro de la empresa es clara y oportuna" },
  { id: "reconocimiento", texto: "Siento que mi trabajo es reconocido" },
  { id: "carga", texto: "Mi carga de trabajo es razonable" },
  { id: "equilibrio", texto: "Puedo equilibrar mi trabajo con mi vida personal" },
  { id: "desarrollo", texto: "Tengo oportunidades para aprender y crecer aquí" },
] as const;

export const ESCALA_ACUERDO = ["En desacuerdo", "Neutral", "De acuerdo"];

// Pregunta obligatoria: elegir hasta MAX_PRIORIDADES opciones
export const MAX_PRIORIDADES = 3;
export const PRIORIDADES = [
  { id: "comunicacion", titulo: "Comunicación", detalle: "Recibir información clara y a tiempo." },
  { id: "formacion", titulo: "Formación y desarrollo", detalle: "Aprender, mejorar en mi trabajo y tener oportunidades de crecer." },
  { id: "claridad", titulo: "Claridad de funciones y expectativas", detalle: "Saber qué se espera de mí y cuáles son mis responsabilidades." },
  { id: "organizacion", titulo: "Organización del trabajo y horarios", detalle: "Tener una mejor planificación de turnos, tareas y equipo." },
  { id: "carga", titulo: "Carga de trabajo y dotación de personal", detalle: "Contar con suficiente apoyo para realizar bien el trabajo." },
  { id: "liderazgo", titulo: "Liderazgo y relación con mi responsable", detalle: "Recibir apoyo, orientación, feedback y buen trato." },
  { id: "equipo", titulo: "Trabajo en equipo y ambiente laboral", detalle: "Mejorar la colaboración, respeto y relación entre compañeros." },
  { id: "reconocimiento", titulo: "Reconocimiento y motivación", detalle: "Sentir que el esfuerzo y el buen trabajo son valorados." },
  { id: "herramientas", titulo: "Herramientas, equipos y condiciones de trabajo", detalle: "Contar con lo necesario para hacer bien mi trabajo." },
  { id: "uniformes", titulo: "Uniformes y comodidad en el puesto de trabajo", detalle: "" },
  { id: "cultura", titulo: "Cultura y forma de trabajar de la empresa", detalle: "Sentir mayor identificación con nuestros valores y manera de trabajar." },
  { id: "otro", titulo: "Otro", detalle: "" },
] as const;

export type DimensionId = (typeof DIMENSIONES)[number]["id"];
export type PrioridadId = (typeof PRIORIDADES)[number]["id"];

export type Respuesta = {
  lugar?: string | null;
  nps: number; // 0-10
  area: string | null;
  dimensiones: Partial<Record<DimensionId, number>>; // 1-3
  prioridades?: PrioridadId[];
  otro?: string;
  valora: string;
  mejorar: string;
};

export const periodoActual = () => process.env.PERIODO || "general";
export const minRespuestas = () => Math.max(3, Number(process.env.MIN_RESPUESTAS) || 5);
