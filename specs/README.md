# Specs — Arcade Vault

Cada spec captura las decisiones de diseño de una feature. Forman el log de decisiones del proyecto.

## Convención de nombres

```
specs/NN-slug.md
```

- `NN` = número secuencial de dos dígitos (`01`, `02`, …)
- `slug` = descripción corta en kebab-case (`mvp-arkanoid`, `highscores`)

### Game Jam (`@game-jam`)

Los specs generados por `@game-jam` viven en una subcarpeta por sesión:

```
specs/game-jam/{folder-slug}/
  README.md              # índice de la sesión (tema, variantes, recomendación)
  {variant-a-slug}.md    # spec completo — variante A
  {variant-b-slug}.md    # spec completo — variante B
```

- `{folder-slug}` = nombre de la carpeta jam (evoca el tema, kebab-case)
- Cada variante es un **spec completo** (misma profundidad que `07-tetris.md`), con título `# JAM — …` y sin número `NN`
- Mínimo **2 variantes** por sesión, con gameplay distinto sobre el mismo tema

**Promoción a specs principales:** cuando el humano elige una variante:

1. Listar `specs/` para el siguiente `NN` (p. ej. `10`)
2. Copiar el archivo elegido a `specs/NN-{slug}.md`
3. Actualizar el header: `# SPEC NN — {Título} en Arcade Vault`
4. Cambiar `Estado` a `Aprobado` manualmente
5. Ejecutar `@spec-impl NN-{slug}`

Memoria de sesiones: [`references/game-jam/sessions-log.md`](../references/game-jam/sessions-log.md)

## Estados válidos

`Borrador` → `En revisión` → `Aprobado` → `Implementado` · `Obsoleto`

El agente solo implementa specs en estado `Aprobado`. La transición a `Aprobado` la hace el humano.

## Configuración

`specs/.spec-config.yml` controla el comportamiento de `@spec-impl`:

```yaml
AutoCreateBranch: true   # crea rama spec-NN-slug automáticamente
```

## Plantilla de spec

```markdown
# SPEC NN — Título corto y descriptivo

> **Estado:** Borrador
> **Depende de:** SPEC 01 (o "ninguna")
> **Fecha:** YYYY-MM-DD
> **Objetivo:** Una sola frase. Si necesitas dos, la feature es demasiado grande.

## Alcance

**Dentro:**

- Cosa concreta uno.
- Cosa concreta dos.

**Fuera de alcance (para specs futuros):**

- Algo que se mencionó pero se pospone.

## Modelo de datos

Estructuras concretas con nombres reales. Si no hay datos nuevos, decirlo explícitamente.

## Plan de implementación

1. Paso que deja el sistema funcional.
2. Siguiente paso verificable.
3. ...

## Criterios de aceptación

- [ ] Verificable con sí/no.
- [ ] Otra condición concreta.

## Decisiones

- **Sí:** decisión tomada y por qué.
- **No:** alternativa descartada y por qué.

## Riesgos (opcional)

| Riesgo | Mitigación |
|--------|------------|
| ... | ... |

## Lo que NO está en este spec

- Refuerzo explícito de lo que queda fuera.
```
