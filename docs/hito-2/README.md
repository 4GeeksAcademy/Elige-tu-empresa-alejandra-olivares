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

## Entradas inválidas

`validateMenuItem`, `validateSaleTransaction` y `validateLocation` reciben `unknown`, comprueban la estructura antes de leer campos y acumulan errores descriptivos sin lanzar excepciones por datos incompletos. Las demás utilidades rechazan argumentos que no respetan el contrato de tipo y colecciones con elementos nulos o mal formados mediante un `Error` descriptivo. Los arrays vacíos y las búsquedas sin coincidencias conservan sus resultados habituales (`[]`, `0`, `null` o `-1`, según la operación).

## Referencias explícitas y pureza

`validateLocation` requiere `currentYear`, y `scoreLocationPerformance` y `rankLocationsByPerformance` requieren `referenceDate`. Estos parámetros de referencia extienden las firmas descritas en el briefing para que las funciones no consulten el reloj y produzcan resultados reproducibles con los mismos argumentos. Las firmas no son idénticas a las originales del briefing.

El panel y las pruebas pasan referencias explícitas. Los datos de demostración conservan una fecha fija, evitando depender del día en que se ejecuta la aplicación.

Este documento describe decisiones y cobertura actuales; no afirma que todos los requisitos del briefing estén completados.

## Panel interactivo

Ejecuta `npm run demo` para servir en un mismo origen la landing (`/`), el formulario (`/application.html`) y el panel (`/demo/`). Para compilar las tres páginas, usa `npm run build:demo`; los archivos quedan en `dist/` y el panel en `dist/demo/`.
