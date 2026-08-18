# Auditoría de migración cultural «México vivido»

Fecha: 2026-08-17

Resultado: **migración y verificación completadas únicamente en desarrollo**

## Límite de seguridad

Las operaciones se ejecutaron contra el deployment de desarrollo `vivid-dachshund-63`, creado por el CLI de Convex al iniciar esta validación. No se ejecutó `convex deploy`, no se consultó producción y no se modificaron datos de producción.

## Verificación previa

- Suite local completa: aprobada.
- TypeScript de la aplicación y de Convex: aprobado.
- Catálogo generado: 206 entradas; SHA-256 `95580da1138058ad4c547a63338385eb20cd4b848d6daaedcae6a4797539752e`.
- Primer preview remoto: 70 correcciones, 136 altas, 1 retiro editorial, 7 sin cambios, 0 conflictos y 1,180 registros activos fuera del catálogo curado.

## Tratamiento del legado

Los 1,180 registros fuera del catálogo se marcaron como retirados sin borrarlos. Antes del retiro se guardaron palabra, región y dificultad históricas cuando estaban presentes, para que los usuarios v1 conserven su recorrido. La simulación y la aplicación coincidieron exactamente:

| Resultado | Simulación | Aplicación |
| --- | ---: | ---: |
| Registros legados retirados | 1,180 | 1,180 |
| Registros conocidos preservados | 71 | 71 |
| Páginas procesadas | 26 | 26 |

La segunda simulación produjo 0 retiros y 0 escrituras; reconoció 1,180 registros ya retirados.

## Migración del catálogo

Se normalizaron las claves de 1,251 registros en 7 lotes. Después se ejecutó la migración editorial en 5 lotes:

| Operación | Simulación | Aplicación |
| --- | ---: | ---: |
| Corregidas | 70 | 70 |
| Agregadas | 136 | 136 |
| Retiradas editorialmente | 1 | 1 |
| Sin cambios | 7 | 7 |
| Conflictos | 0 | 0 |
| Reparaciones de niveles huérfanos | 0 | 0 |

Cada palabra nueva creó también su nivel v2 dentro de la misma transacción. No se eliminaron documentos.

## Comprobación posterior

La segunda pasada completa del catálogo arrojó 214 operaciones sin cambios, 0 correcciones, 0 altas, 0 retiros, 0 conflictos y 0 escrituras. El preview global final informó:

- `unclassified`: 0
- `conflicts`: 0
- `patched`: 0
- `inserted`: 0
- `retired`: 0
- `unchanged`: 214
- `retiredUnclassified`: 1,180

La auditoría cultural paginada final recorrió 1,387 registros físicos: 206 activos auditados, 206 válidos, 0 inválidos, 0 incidencias y 1,181 retirados omitidos del catálogo activo.

## Declaración de producción

**Producción no fue consultada, desplegada ni modificada.** Cualquier publicación o migración de producción requiere una autorización explícita independiente y debe repetir preview, simulación, aplicación por lotes e idempotencia.
