# Auditoría de migración cultural «México vivido»

Fecha: 2026-08-17

Commit auditado: `0c20c720fb4fe6b3a75612f7e7f693ba5c84b93b`

Resultado: **bloqueada antes de cualquier operación remota**

## Límite de seguridad

Esta auditoría autoriza operaciones únicamente contra un deployment de desarrollo identificado de forma inequívoca. No se ejecutó `convex deploy`, ningún script `deploy`/`deploy:dev`, ni ninguna función de migración contra producción.

## Identidad del entorno (valores redactados)

| Fuente | Clave | Estado |
| --- | --- | --- |
| `.env` | `CONVEX_DEPLOYMENT` | Ausente |
| `.env` | `CONVEX_URL` | Ausente |
| `.env` | `EXPO_PUBLIC_CONVEX_URL` | Ausente |
| `.env.local` | — | Archivo ausente |
| Entorno del proceso | `CONVEX_DEPLOYMENT` | Ausente |
| Entorno del proceso | `CONVEX_URL` | Ausente |
| Entorno del proceso | `EXPO_PUBLIC_CONVEX_URL` | Ausente |
| Entorno del proceso | `CONVEX_TEAM` | Ausente |
| Entorno del proceso | `CONVEX_PROJECT` | Ausente |

El `.env` contiene una clave ajena a Convex con valor configurado; su nombre y valor no son necesarios para esta auditoría y no se reproducen aquí. No existe evidencia local suficiente para clasificar el target actual del CLI como desarrollo. Por lo tanto, el target se considera **ambiguo**.

## Verificaciones locales frescas

| Verificación | Resultado | Evidencia resumida |
| --- | --- | --- |
| `npm test` | PASS | Todas las suites terminaron con código 0; catálogo cultural válido con 206 entradas y 8 retiradas |
| `npm run typecheck` | PASS | TypeScript terminó con código 0 y sin diagnósticos |
| Generador `--check` | PASS | 206 entradas; SHA-256 `95580da1138058ad4c547a63338385eb20cd4b848d6daaedcae6a4797539752e` |

Las primeras ejecuciones dentro del sandbox no llegaron a cargar Node por un error de permisos al resolver la ruta del usuario (`EPERM`). Las tres verificaciones se repitieron fuera del sandbox con autorización y los resultados anteriores son los de esas ejecuciones completas.

## Operaciones de migración

| Fase | Estado | Motivo |
| --- | --- | --- |
| Publicación de funciones a desarrollo | No ejecutada | Deployment de desarrollo no identificado inequívocamente |
| `previewMexicoVividoMigration` | No ejecutada | El preflight remoto no es seguro con target ambiguo |
| Backfill de claves normalizadas | No ejecutado | Preview no disponible y target ambiguo |
| Fase B, dry-run por lotes | No ejecutada | Preview/backfill no disponibles |
| Fase B, apply por lotes | No ejecutada | No se permite aplicar sin dry-run limpio |
| Comprobación posterior de idempotencia | No ejecutada | No hubo aplicación |

En consecuencia, no hay conteos remotos de insertados, corregidos, movidos, retirados, sin cambios, conflictos o elementos sin clasificar, ni resúmenes de lotes. Tampoco hubo escrituras remotas.

## Cambios culturales observables

La validación local confirma que el catálogo generado contiene 206 entradas y declara 8 retiradas. La clasificación detallada entre palabras agregadas, corregidas, movidas y retiradas depende del estado real de la base de desarrollo; no puede calcularse responsablemente sin ejecutar el preview contra un deployment de desarrollo confirmado.

Elementos sin resolver:

- Identidad explícita del deployment de desarrollo (`CONVEX_DEPLOYMENT` con prefijo de desarrollo y/o configuración equivalente verificable).
- Autenticación y acceso de red del CLI una vez confirmado el deployment.
- Conteos y muestras del preview remoto.
- Confirmación de cero conflictos y cero elementos no clasificados antes de cualquier aplicación.
- Evidencia de idempotencia posterior a la aplicación.

## Declaración de producción

**Producción no fue consultada, desplegada ni modificada durante esta auditoría.** Para continuar, se debe configurar o proporcionar un deployment inequívocamente de desarrollo y repetir desde la publicación segura de funciones con `npx convex dev --once`; una migración de producción requerirá una autorización explícita separada.
