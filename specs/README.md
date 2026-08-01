# Specs — Arcade Vault

Cada spec captura las decisiones de diseño de una feature. Forman el log de decisiones del proyecto.

## Convención de nombres

```
specs/NN-slug.md
```

- `NN` = número secuencial de dos dígitos (`01`, `02`, …)
- `slug` = descripción corta en kebab-case (`mvp-arkanoid`, `highscores`)

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
