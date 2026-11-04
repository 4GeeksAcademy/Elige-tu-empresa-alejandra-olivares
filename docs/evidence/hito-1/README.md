# Evidencia del Hito 1 - Brasaland

## Resultados de Lighthouse

| Pagina | Rendimiento | Accesibilidad | Buenas practicas | SEO | Fecha UTC |
| --- | ---: | ---: | ---: | ---: | --- |
| Landing | 95 | 100 | 100 | 100 | 2026-11-04 03:15:44.935 |
| Formulario | 100 | 100 | 100 | 100 | 2026-11-04 03:16:18.775 |

Ambas paginas superan el requisito de rendimiento de 80.

### Condiciones de ejecucion

- Lighthouse CLI 12.8.2, en Linux dentro del Codespace, con Chromium
  Headless 130.0.0.0.
- Auditorias contra `http://127.0.0.1:3000/` y
  `http://127.0.0.1:3000/application.html`, no contra el proxy de Codespaces.
- Sitio servido desde la raiz mediante `http-server`, puerto 3000,
  direccion `0.0.0.0` y cache HTTP desactivada (`-c-1`).
- Perfil movil: viewport 412 x 823, factor de escala 1.75.
- Throttling simulado: RTT 150 ms, ancho de banda 1638.4 Kbps y CPU 4x.
- User agent movil emulado: moto g power (2022), Android 11, Chrome 136.
  Es el user agent configurado por Lighthouse, no la version del navegador anfitrion.
- Flags del navegador: `--headless --no-sandbox --disable-dev-shm-usage --disable-gpu`.
- Almacenamiento reiniciado por Lighthouse; las paginas se midieron por separado.
- Los resultados son mediciones puntuales y pueden variar con el entorno.

Los JSON se copiaron sin modificar de las mediciones conservadas. Los HTML se
generaron desde esos JSON con `ReportGenerator.generateReport(report, 'html')`
de Lighthouse 12.8.2: no se repitieron auditorias ni se cambiaron puntuaciones.
Las capturas de Lighthouse muestran esos HTML reales; sus cuatro puntuaciones
se comprobaron automaticamente contra las categorias de cada JSON.

### Informes y capturas de puntuaciones

- Landing: [JSON](./lighthouse-landing-final.json),
  [HTML](./lighthouse-landing-final.html),
  [captura de puntuaciones](./lighthouse-landing-final.png).
- Formulario: [JSON](./lighthouse-form-final.json),
  [HTML](./lighthouse-form-final.html),
  [captura de puntuaciones](./lighthouse-form-final.png).

## Capturas del sitio

Las ocho capturas originales corresponden a Chromium, con anchos de 375, 768 y
1440 px. Las capturas son de pagina completa; la altura del viewport fue 900 px.

| Vista | Landing | Formulario |
| --- | --- | --- |
| Movil, 375 px | [Captura](./landing-375.png) | [Captura](./form-375.png) |
| Tablet, 768 px | [Captura](./landing-768.png) | [Captura](./form-768.png) |
| Escritorio, 1440 px | [Captura](./landing-1440.png) | [Captura](./form-1440.png) |

- [Formulario con errores](./form-errors-1440.png).
- [Formulario con registro simulado correcto](./form-success-1440.png).
- [Detalle de Nuestras Ubicaciones](./ubicaciones-1440.png): incluye ambos
  paises, ciudades, numero de restaurantes y horarios. Se comprobo el enlace
  de navegacion y su posicion inmediatamente despues de "Lo que nos hace unicos".

## Cambio posterior a las mediciones

Las validaciones se movieron a `validation.js` en la raiz, sin cambiar su
contenido. Se actualizaron el HTML y la compilacion de Tailwind y se volvieron
a comprobar las validaciones en Chromium. Solo se conserva una copia.
Los informes Lighthouse originales son anteriores a este cambio de ruta:
sus referencias a `scripts/validation.js` son evidencia historica y no se
han alterado. Sus puntuaciones no representan una nueva medicion posterior
al movimiento del archivo.

## Revision en Codespaces

- [Landing](https://reimagined-fishstick-69rvgxq4rv9c54w7-3000.app.github.dev/).
- [Formulario](https://reimagined-fishstick-69rvgxq4rv9c54w7-3000.app.github.dev/application.html).

Estos enlaces funcionan mientras el Codespace y el servidor esten activos y el
puerto 3000 este reenviado. Pueden requerir autenticacion y permisos de acceso
al Codespace. No son un despliegue permanente.

Para iniciar el sitio desde la raiz del repositorio:

```bash
npx http-server . -p 3000 -a 0.0.0.0
```

El CSS compilado ya esta incluido. Para regenerar Tailwind tras cambiar clases:

```bash
npm ci
npm run build:css
```
