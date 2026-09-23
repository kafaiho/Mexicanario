# Diseño: optimización de rendimiento de la aplicación

**Fecha:** 2026-09-06

## Objetivo

Reducir el trabajo de arranque, las suscripciones reactivas innecesarias, la carga de audio y el renderizado fuera de pantalla sin cambiar contenido, dificultad, recompensas ni navegación.

## Enfoque aprobado

Se aplicará una optimización incremental y de bajo riesgo. Primero se eliminará trabajo que ocurre sin aportar nada visible; después se reducirán lecturas repetidas y listas costosas. Las migraciones mayores de datos, como rankings materializados por país, se mantendrán fuera de esta pasada hasta poder desplegarlas y medirlas de manera aislada.

## Diseño técnico

- El arranque ya no ejecutará reparaciones de base de datos. Las reparaciones seguirán siendo parte de los comandos administrativos de despliegue.
- Los modales con consultas o efectos se montarán solo mientras estén abiertos.
- El gestor de audio cargará el menú y los efectos esenciales primero; los demás sonidos se cargarán por grupo cuando se soliciten.
- El temporizador de la ruleta conservará en memoria la fecha ya leída y no consultará `AsyncStorage` cada segundo.
- `seasonPass` tendrá un índice por usuario para evitar filtrar toda la tabla en cada consulta de tienda.
- Las listas de ranking usarán virtualización donde la estructura actual permita hacerlo sin cambiar la interfaz.
- Las optimizaciones de Convex conservarán exactamente el orden cultural y regional de niveles.

## Manejo de errores

El audio continuará fallando silenciosamente cuando un recurso no esté disponible. Los modales conservarán sus estados locales mientras estén abiertos y se reiniciarán al cerrarse. Las consultas seguirán usando `"skip"` cuando no exista usuario.

## Verificación

- Pruebas de contrato que confirmen que no hay reparación automática en el arranque, que la tienda cerrada no se monta y que el temporizador no relee almacenamiento.
- Pruebas unitarias para cualquier helper nuevo de carga progresiva.
- `npm test` y `npm run typecheck` al finalizar.
- Inspección del diff para asegurar que no se mezclaron cambios ajenos.
