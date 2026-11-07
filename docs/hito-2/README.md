# Hito 2: utilidades y validaciones

## Resumen

El Hito 2 reúne utilidades para filtrar, ordenar y buscar datos de Brasaland; convertir monedas; calcular ingresos, desperdicios, tickets y márgenes; comparar países; puntuar y ordenar sucursales; y validar productos, ventas y locaciones. Las pruebas automatizadas de estas utilidades se encuentran en `tests/utils.test.ts`.

## Estructura

- `src/types/models.ts`: modelos y tipos compartidos.
- `src/utils/collections.ts`: filtros y ordenamientos.
- `src/utils/search.ts`: búsquedas por identificador, nombre y capacidad.
- `src/utils/transformations.ts`: conversiones, cálculos, agrupaciones, comparación y scoring.
- `src/utils/validations.ts`: validaciones de productos, ventas y locaciones.
- `tests/utils.test.ts`: pruebas automatizadas con `node:test` y `tsx`.

## Comandos

```sh
npm ci
npm run typecheck
npm test
```

## Decisiones

- Los ingresos diarios se agrupan por fecha UTC; los días operativos del scoring se cuentan como días completos.
- La apertura estimada para el scoring es el 1 de enero del año indicado por la locación, en UTC.
- La conversión de moneda usa una tasa fija de 4000 COP por USD.
- El margen se limita al intervalo 0–100 y se redondea a dos decimales.
- Cuando el ingreso total es cero, los puntajes de ingresos, desperdicio y margen son cero. El componente de eficiencia se calcula por separado según las transacciones y la capacidad.

## Limitaciones

`validateLocation`, `scoreLocationPerformance` y `rankLocationsByPerformance` consultan el reloj cuando se omite su año o fecha opcional. Al proporcionar una referencia explícita, sus cálculos son reproducibles; sin ella, las llamadas no cumplen estrictamente la pureza solicitada.

Este documento describe decisiones y cobertura actuales; no afirma que todos los requisitos del briefing estén completados.

## Panel interactivo

Ejecuta `npm run demo` para servir en un mismo origen la landing (`/`), el formulario (`/application.html`) y el panel (`/demo/`). Para compilar las tres páginas, usa `npm run build:demo`; los archivos quedan en `dist/` y el panel en `dist/demo/`.
