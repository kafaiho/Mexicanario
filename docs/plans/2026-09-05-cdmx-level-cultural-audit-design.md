# Auditoría cultural de niveles de CDMX

## Objetivo

Hacer que el apartado de Ciudad de México muestre únicamente niveles vinculados de forma explícita con la ciudad y corregir el caso heredado en el que `bato` aparece con una pista equivalente a `cuate`.

## Diagnóstico

El catálogo editorial activo vive en `shared/mexicoVividoCatalogSource.js`. En él, `cuate` significa amigo o compañero cercano y está marcado como voz de todo México. `Bato` no forma parte del catálogo activo, pero sí existe en semillas antiguas con significados y regiones inconsistentes. Las cuentas nuevas usan el orden cultural v2 y ocultan palabras retiradas; algunas cuentas antiguas conservan el orden v1 para no perder su posición y todavía pueden recibir esos registros.

El apartado CDMX se construye con `placeId: "cdmx"`. Sus entradas activas son vecindad, sonidero, carpa, pesero, chilango, tlacoyo, lucha libre, Xochimilco, chilangoísmo, chinampa y ajolote. Todas tienen una relación defendible con la ciudad, aunque el catálogo necesita una prueba explícita para evitar que futuros datos heredados entren a ese grupo.

## Decisiones

- Mantener `cuate` como palabra mexicana general con la definición “Amigo o compañero cercano, en registro coloquial”.
- Retirar `bato` y `bato loco` del catálogo editorial nuevo, ya que no forman parte del recorrido aprobado.
- Para las cuentas con orden v1, conservar la posición del nivel pero corregir `bato` a “Muchacho u hombre, en lenguaje popular” y asignarlo al noroeste/occidente, nunca a CDMX ni como sinónimo directo de `cuate`.
- Validar que el grupo CDMX se derive exclusivamente de `placeId: "cdmx"`; los registros legados solo podrán aparecer en su grupo legado separado.
- Conservar el sistema actual de dificultad: valor editorial 1–3 más ondas deterministas de descanso, dificultad esperada y sorpresa. No se reorganizarán niveles por una aleatoriedad pura que pueda producir saltos injustos.
- Mantener los iconos actuales cuando representan claramente el concepto y verificar que todas las entradas CDMX tengan icono no vacío.

## Seguridad de migración

La corrección se incorporará a la migración idempotente del catálogo. El modo v2 retirará los términos descartados. El modo v1 recibirá una presentación corregida en el mismo registro y posición, por lo que el número de nivel y el progreso del usuario no cambiarán.

## Verificación

Se añadirán pruebas que fallen con el estado actual y demuestren que:

- `bato` y `bato loco` están declarados como retirados;
- la compatibilidad v1 usa una definición y región correctas para `bato`;
- ningún término retirado aparece como nivel activo de CDMX;
- todas las entradas de CDMX tienen pista, ejemplo, icono y dificultad válida;
- el generador Convex permanece sincronizado con la fuente canónica;
- la suite completa continúa pasando.

