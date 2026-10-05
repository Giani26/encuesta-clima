# Encuesta anónima de clima laboral (eNPS)

App en Next.js lista para publicar en Vercel. Los trabajadores responden sin iniciar sesión y la empresa ve los resultados agregados en `/resultados` con contraseña.

## Qué incluye

- **Pregunta eNPS (0–10):** “¿Qué tan probable es que recomiendes la empresa como lugar para trabajar?”. eNPS = % promotores (9–10) − % detractores (0–6).
- **7 temas de ambiente laboral** (escala de acuerdo 1–5): respeto en el equipo, liderazgo, comunicación, reconocimiento, carga de trabajo, equilibrio vida–trabajo y desarrollo.
- **Área opcional** y **dos preguntas abiertas** (qué valoran / qué mejorar).
- **Panel de resultados**: eNPS, distribución 0–10, temas ordenados de peor a mejor, eNPS por área y comentarios.

## Cómo se protege el anonimato

- No hay login. No se guarda nombre, correo, IP, navegador ni hora de respuesta: solo las respuestas y el periodo.
- No se muestra ningún resultado hasta tener un mínimo de respuestas (`MIN_RESPUESTAS`, por defecto 5).
- Las áreas con menos respuestas que el mínimo no se desglosan.
- Los comentarios se muestran en orden aleatorio y separados del área.
- Una cookie evita que el mismo dispositivo responda dos veces en un periodo. Solo indica “ya respondió” y no está vinculada a la respuesta.

> Límite honesto: sin login, alguien decidido podría responder dos veces desde otro navegador. Es el costo de no identificar a nadie. Además, Vercel registra datos técnicos de las visitas en sus propios logs; la app no los guarda ni los relaciona con las respuestas.

## Publicarlo en Vercel (paso a paso)

1. **Sube el proyecto a GitHub** (un repositorio nuevo, puede ser privado).
2. En [vercel.com](https://vercel.com) → **Add New → Project** → importa el repositorio. Framework: Next.js (se detecta solo).
3. **Crea la base de datos:** en el proyecto, ve a **Storage → Create Database → Upstash (Redis)** (plan gratis) y conéctala al proyecto. Esto crea automáticamente las variables de conexión.
4. En **Settings → Environment Variables** agrega:
   - `ADMIN_PASSWORD` → una contraseña larga para ver resultados.
   - `PERIODO` → por ejemplo `2026-Q4`.
   - `NEXT_PUBLIC_EMPRESA` → el nombre de tu empresa (opcional).
   - `MIN_RESPUESTAS` → por ejemplo `5` (opcional).
5. **Redeploy** para que tome las variables.
6. Comparte el link principal (`https://tu-proyecto.vercel.app`) con los trabajadores. Los resultados están en `/resultados`.

## Abrir una nueva ronda

Cambia `PERIODO` (ej. `2027-Q1`) y vuelve a publicar. Cada periodo guarda sus respuestas por separado, todos pueden volver a responder y en `/resultados` puedes elegir el periodo para comparar.

## Personalizar

Las preguntas y las áreas están en `lib/config.ts`. Los colores y tipografías, en `app/globals.css`.

## Probar en tu computador

```bash
npm install
cp .env.example .env.local   # completa las variables de Upstash
npm run dev
```
