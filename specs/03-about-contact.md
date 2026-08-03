# SPEC 03 — Página Acerca de y contacto con Resend

> **Estado:** Implementado
> **Depende de:** SPEC 01 — MVP visual de Arcade Vault, SPEC 02 — Homepage landing
> **Fecha:** 2026-08-03
> **Objetivo:** Implementar la página `/about` fiel a `references/templates/home-about/about.jsx`, con envío real de correo vía Resend y link "Acerca de" en la navegación global.

## Alcance

**Dentro:**

- Página `/about` (`app/about/page.tsx`) fiel a `references/templates/home-about/about.jsx`:
  - Hero "ACERCA DE ARCADE VAULT" con misión y 3 highlight cards (corazón, navegador, planta).
  - Divider animado con píxeles parpadeantes.
  - Sección de contacto con formulario (nombre, correo, mensaje) y terminal de éxito al enviar.
  - Animaciones `fade-in`, `reveal` (reutilizar `useReveal` de `components/home/use-reveal.ts`).
- Envío real de correo vía **Resend**:
  - API Route `app/api/contact/route.ts` (POST).
  - Variables de entorno: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`.
  - Remitente de desarrollo: `onboarding@resend.dev` (dominio de prueba de Resend).
  - `replyTo` con el correo que el usuario escribe en el formulario.
  - Validación server-side (campos requeridos, formato email).
  - Honeypot oculto anti-spam (sin dependencias extra).
- Estados del formulario:
  - Vacío/incompleto → shake (como el prototipo).
  - Éxito → terminal verde con nombre del usuario.
  - Error de envío → mensaje de error en estilo terminal (línea `[ERROR] …`, coherente con la estética de la app).
- Estilos de about portados de `references/templates/home-about/styles.css` a `app/arcade-vault.css` (`.about-*`, `.highlight-*`, `.contact-*`, `.terminal-success`, `.term-*`, etc.).
- Componentes en `components/about/`:
  - `highlight-icon.tsx` — iconos pixel del hero.
  - `contact-form.tsx` — formulario con lógica de envío, estados y honeypot.
- Actualizar navegación:
  - Link "Acerca de" → `/about` en navbar desktop y menú móvil.
  - Estado activo `about` en `lib/navigation.ts` cuando `pathname === "/about"`.

**Fuera de alcance (para specs futuros):**

- Dominio verificado en Resend para producción (el spec documenta el cambio de `from` cuando exista).
- Persistencia de mensajes en base de datos.
- Panel de administración de contactos.
- CAPTCHA (reCAPTCHA, hCaptcha, Turnstile).
- Rate limiting por IP.
- Pre-rellenar nombre si el usuario está logueado (auth mock).
- Tests automatizados.
- Internacionalización.

## Modelo de datos

Esta feature no introduce persistencia en base de datos. Los datos viven en variables de entorno, en el payload del formulario y en la respuesta de la API.

### Variables de entorno (`.env.local`)

```env
RESEND_API_KEY=re_xxxxxxxx          # API key de Resend
CONTACT_TO_EMAIL=destino@ejemplo.com # Correo destinatario (lo configura el humano)
```

`CONTACT_FROM_EMAIL` no se expone como variable en esta fase: el remitente queda fijado a `onboarding@resend.dev` para desarrollo. Cuando exista dominio verificado, se documentará el cambio en un spec futuro o como nota en `.env.example`.

### Payload del formulario (cliente → API)

```ts
// POST /api/contact
export interface ContactPayload {
  name: string;      // requerido, trim, máx. 80 chars
  email: string;     // requerido, formato email válido
  message: string;   // requerido, trim, máx. 2000 chars
  website?: string;  // honeypot — debe estar vacío; si tiene valor, la API responde 200 sin enviar
}
```

### Respuesta de la API

```ts
export interface ContactSuccessResponse {
  ok: true;
}

export interface ContactErrorResponse {
  ok: false;
  error: string; // mensaje legible para mostrar en la terminal de error
}
```

### Estado local del formulario (cliente)

```ts
interface ContactFormState {
  name: string;
  email: string;
  message: string;
  website: string; // honeypot, siempre oculto en UI
}

type ContactFormStatus = "idle" | "submitting" | "success" | "error";
```

### Constantes estáticas en `app/data/about.ts`

```ts
export interface AboutHighlight {
  icon: "HEART" | "BROWSER" | "PLANT";
  title: string;
  color: "magenta" | "cyan" | "green";
}

export const ABOUT_HIGHLIGHTS: AboutHighlight[];
export const ABOUT_MISSION: string; // texto de misión del prototipo
```

Re-export desde `app/data/index.ts`.

## Plan de implementación

1. **Dependencia y entorno** — Instalar `resend`. Crear `.env.example` con `RESEND_API_KEY` y `CONTACT_TO_EMAIL` documentados. Verificar que el proyecto compila sin errores.

2. **Datos estáticos de about** — Crear `app/data/about.ts` con `ABOUT_MISSION` y `ABOUT_HIGHLIGHTS` (textos del prototipo). Re-exportar desde `app/data/index.ts`.

3. **Estilos de about** — Auditar `references/templates/home-about/styles.css` y portar a `app/arcade-vault.css` las clases de about que falten (`.about`, `.about-hero`, `.highlight-row`, `.about-divider`, `.about-contact`, `.contact-form`, `.terminal-success`, `.term-*`, animación `shake`, etc.). Verificar visualmente que no hay conflictos con estilos existentes.

4. **Componentes de about** — Crear en `components/about/`:
   - `highlight-icon.tsx` — iconos pixel (HEART, BROWSER, PLANT).
   - `contact-form.tsx` — formulario con honeypot, estados (idle/submitting/success/error), shake en validación client-side, terminal de éxito y terminal de error.

5. **API Route de contacto** — Crear `app/api/contact/route.ts`:
   - Validar payload (campos requeridos, email, longitudes).
   - Rechazar silenciosamente si honeypot tiene valor (responder `{ ok: true }` sin enviar).
   - Enviar correo con Resend: `from: onboarding@resend.dev`, `to: CONTACT_TO_EMAIL`, `replyTo: email del usuario`, asunto y cuerpo con nombre/mensaje.
   - Responder `{ ok: true }` o `{ ok: false, error: "..." }`.
   - Probar con `curl` o formulario local.

6. **Página `/about`** — Crear `app/about/page.tsx` como Client Component: hero, highlights, divider, sección contacto con `ContactForm`. Reutilizar `useReveal` de `components/home/use-reveal.ts`.

7. **Actualizar navegación** — Modificar `lib/navigation.ts` (añadir `about: boolean`), `components/nav.tsx` (link "Acerca de" en desktop y móvil, estado activo en `/about`).

8. **Smoke test manual** — Recorrer `/about` (scroll, animaciones reveal, envío exitoso con Resend dev, validación vacía con shake, error simulado sin API key). Verificar navbar en desktop y móvil (≤ 840px). Sin errores en consola ni de TypeScript/ESLint.

## Criterios de aceptación

### Página `/about`
- [ ] El hero muestra kicker "▸ ACERCA DE", título "ACERCA DE ARCADE VAULT" y el texto de misión del prototipo.
- [ ] Se muestran 3 highlight cards (corazón/magenta, navegador/cyan, planta/green) con iconos pixel.
- [ ] El divider animado con píxeles parpadeantes es visible entre hero y contacto.
- [ ] La sección "CONTÁCTANOS" muestra intro, tips (24-48H, sugerencias, sin spam) y el formulario.
- [ ] Las secciones con clase `.reveal` animan al entrar en viewport.

### Formulario de contacto
- [ ] Enviar con campos vacíos provoca animación `shake` y no llama a la API.
- [ ] Enviar con datos válidos muestra la terminal de éxito con el nombre del usuario en mayúsculas.
- [ ] "ENVIAR OTRO MENSAJE" resetea el formulario y vuelve al estado inicial.
- [ ] Si la API falla, se muestra mensaje de error en estilo terminal (línea `[ERROR] …`), sin terminal de éxito.
- [ ] El campo honeypot existe en el DOM pero está oculto (`display: none` o `aria-hidden` + fuera de flujo visual).
- [ ] Si el honeypot tiene valor, la API responde éxito pero no envía correo (verificable en logs de Resend).

### Envío de correo (Resend)
- [ ] Con `RESEND_API_KEY` y `CONTACT_TO_EMAIL` configurados, un envío exitoso llega al buzón destino.
- [ ] El correo recibido incluye nombre, email y mensaje del formulario.
- [ ] El correo tiene `replyTo` con el email que el usuario escribió.
- [ ] El remitente es `onboarding@resend.dev` (desarrollo).

### Navegación
- [ ] La navbar muestra link "Acerca de" → `/about` en desktop y menú móvil.
- [ ] "Acerca de" está activo solo en `/about`.
- [ ] Los demás links (Inicio, Biblioteca, Salón) siguen funcionando sin cambios.

### Visual y técnico
- [ ] Fidelidad visual alta respecto a `references/templates/home-about/about.jsx`.
- [ ] Sin errores en consola al navegar `/about` y enviar el formulario.
- [ ] Sin errores de TypeScript ni ESLint en archivos nuevos o modificados.
- [ ] `.env.example` documenta `RESEND_API_KEY` y `CONTACT_TO_EMAIL`.

### Fuera de alcance (verificar que NO existe)
- [ ] No hay persistencia de mensajes en base de datos.
- [ ] No hay CAPTCHA ni rate limiting por IP.
- [ ] No se pre-rellena el nombre con el usuario logueado.

## Decisiones

- **Sí:** Resend para envío de correo. API simple, SDK oficial para Node/Next.js, plan gratuito suficiente para desarrollo.
- **No:** Nodemailer + SMTP propio. Más configuración (host, puerto, credenciales) sin beneficio en esta fase.
- **Sí:** `onboarding@resend.dev` como remitente en desarrollo. No requiere dominio verificado; suficiente para testear el flujo completo.
- **No:** Esperar a tener dominio verificado para implementar. Bloquearía el spec sin necesidad; el cambio de `from` es trivial cuando llegue producción.
- **Sí:** `CONTACT_TO_EMAIL` como variable de entorno. El humano pega el destinatario real sin tocar código.
- **No:** Email destinatario hardcodeado. Inflexible entre entornos (dev/staging/prod).
- **Sí:** `replyTo` con el email del formulario. Permite responder directamente al jugador sin copiar/pegar.
- **Sí:** Honeypot oculto (`website`) anti-spam. Cero dependencias, cero fricción UX; filtra bots básicos.
- **No:** reCAPTCHA / hCaptcha / Turnstile. Añade dependencia externa y fricción visual; va en spec futuro si el spam se vuelve problema.
- **No:** Rate limiting por IP en este spec. Requiere store (Redis, KV) o lógica in-memory frágil; honeypot + validación son suficientes por ahora.
- **Sí:** Error en estilo terminal (línea `[ERROR] …`). Coherente con la estética arcade de la app y con la terminal de éxito del prototipo.
- **No:** Toast genérico para errores. Rompe la inmersión visual del formulario.
- **Sí:** API Route (`app/api/contact/route.ts`) para el envío. Mantiene la API key en servidor; el cliente solo llama `fetch("/api/contact")`.
- **No:** Enviar desde el cliente directamente a Resend. Expondría `RESEND_API_KEY` en el bundle.
- **Sí:** Reutilizar `useReveal` de `components/home/`. Ya existe y hace lo mismo que el prototipo.
- **No:** Duplicar el hook en `components/about/`.
- **Sí:** Datos estáticos (misión, highlights) en `app/data/about.ts`. Consistente con `home.ts` y `games.ts`.
- **No:** Hardcodear textos dentro de `page.tsx`. Dificulta mantenimiento y reutilización.
- **No:** Pre-rellenar nombre con usuario logueado. El auth es mock y el prototipo no lo contempla; añade complejidad sin valor inmediato.
- **Sí:** Honeypot que responde `{ ok: true }` silenciosamente si tiene valor. No revela al bot que fue detectado.
- **No:** Devolver 400 explícito en honeypot. Daría pistas a scrapers sobre el campo trampa.

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| `onboarding@resend.dev` solo permite enviar al email de la cuenta Resend en plan gratuito | Documentar en `.env.example` que en dev el destinatario debe ser el email registrado en Resend; en producción se cambia `from` a dominio verificado. |
| `RESEND_API_KEY` ausente o inválida en runtime | La API route devuelve `{ ok: false, error: "..." }` con mensaje claro; el formulario muestra terminal de error sin crashear. |
| Estilos de about desincronizados respecto a la referencia | Paso 3 del plan: auditoría explícita contra `references/templates/home-about/styles.css`; no portar clases de home que ya existen. |
| Honeypot insuficiente ante bots avanzados | Aceptado para MVP; CAPTCHA o rate limiting van en spec futuro si el spam se vuelve problema real. |
| API key expuesta accidentalmente en el cliente | La key solo se lee en `app/api/contact/route.ts` (server); nunca importar `resend` en Client Components. |
| Navbar con 4 links + auth apretada en tablet | La referencia ya contempla links ocultos ≤ 840px con menú hamburguesa; reutilizar breakpoints existentes. |

## Lo que NO está en este spec

- Dominio verificado en Resend para producción (cambio de `from` cuando exista).
- Persistencia de mensajes en base de datos.
- Panel de administración de contactos.
- CAPTCHA (reCAPTCHA, hCaptcha, Turnstile).
- Rate limiting por IP.
- Pre-rellenar nombre con usuario logueado.
- Tests automatizados.
- Internacionalización.

Cada uno de estos, si llega, va en su propio spec.
