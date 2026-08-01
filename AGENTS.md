# Arcade Vault — Guía para el agente

Este archivo es la memoria persistente del proyecto. Cursor lo lee al inicio de cada sesión. `CLAUDE.md` importa este archivo para compatibilidad con Claude Code.

## Qué es este proyecto

**Arcade Vault** es una plataforma web para jugar online y competir por la mayor cantidad de puntos. Está en fase inicial: scaffold de Next.js con la página por defecto, sin juegos ni lógica de negocio todavía.

## Stack técnico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Lenguaje | TypeScript (strict) |
| Lint | ESLint con `eslint-config-next` |
| Fuentes | Geist Sans / Geist Mono (next/font) |

## Comandos

```bash
npm run dev      # Servidor de desarrollo (http://localhost:3000)
npm run build    # Build de producción
npm run start    # Servir build de producción
npm run lint     # ESLint
```

No hay suite de tests configurada todavía.

## Estructura del proyecto

```
app/
  layout.tsx     # Layout raíz (fuentes, metadata, body)
  page.tsx       # Página principal (home)
  globals.css    # Tailwind + variables CSS
public/          # Assets estáticos
specs/           # Specs de diseño (spec-driven development)
.cursor/rules/   # Reglas de Cursor (@spec, @spec-impl, etc.)
```

Alias de importación: `@/*` apunta a la raíz del proyecto.

## Convenciones de código

- Componentes funcionales con TypeScript.
- Estilos con Tailwind CSS (clases utilitarias, sin CSS modules).
- App Router de Next.js: páginas en `app/`, no `pages/`.
- Preferir Server Components; usar `"use client"` solo cuando haga falta interactividad.
- Mantener cambios mínimos y enfocados; no refactorizar código no relacionado.

## Next.js — advertencia importante

Esta versión de Next.js tiene cambios respecto a versiones anteriores. Antes de escribir código, consulta la guía en `node_modules/next/dist/docs/` y respeta los avisos de deprecación.

## Flujo spec-driven

Este proyecto usa **Spec Driven Design** con las skills de [fernando-skills](https://github.com/Klerith/fernando-skills).

### Ciclo de trabajo

1. **`@spec`** — Diseña un spec haciendo preguntas clarificadoras. Guarda en `specs/NN-slug.md` con estado `Borrador`.
2. **Revisión humana** — El humano relee el spec fuera del chat y cambia el estado a `Aprobado` manualmente.
3. **`@spec-impl`** — Valida que el estado sea `Aprobado`, crea la rama `spec-NN-slug` y implementa paso a paso con pausas para revisar diffs.

### Estados de un spec

| Estado | Significado |
|--------|-------------|
| `Borrador` | Generado por `@spec`, pendiente de revisión humana |
| `En revisión` | El humano está iterando |
| `Aprobado` | Listo para implementar (`@spec-impl` solo funciona con este estado) |
| `Implementado` | Código listo y criterios de aceptación verificados |
| `Obsoleto` | Reemplazado por otro spec |

**Cambiar el estado a `Aprobado` es un acto deliberado del humano.** El agente nunca aprueba su propio trabajo.

### Cuándo usar specs

- Sí: features que tocan más de 2 archivos, decisiones costosas de revertir, trabajo de varias sesiones.
- No: bug fixes puntuales, refactors mecánicos, experimentos exploratorios.

Ver `specs/README.md` para la plantilla y convenciones de formato.

## Reglas de Cursor

Invocar con `@` en el chat:

| Regla | Uso |
|-------|-----|
| `@spec` | Diseñar un spec antes de escribir código |
| `@spec-impl` | Implementar un spec aprobado |
