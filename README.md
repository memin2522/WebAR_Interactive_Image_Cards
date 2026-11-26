# WebAR Interactive Image Cards

Aplicación web de realidad aumentada que reconoce **tarjetas impresas** con la
cámara del teléfono y muestra sobre cada una un **objeto 3D interactivo** con
un **panel de información**. No necesita compilación: es HTML, CSS y módulos
de JavaScript.

Versión 1.0.0 · Semillero de investigación Gamedev · 2026

## Qué hace

1. **Iniciar cámara AR** pide permiso de cámara y empieza a buscar tarjetas
   (varias a la vez).
2. Al detectar una tarjeta:
   - aparece un panel 3D con el título y los datos de la tarjeta, que siempre
     mira a la cámara;
   - durante 3 s se ve un modelo esqueleto (wireframe) que pulsa, y luego se
     desvanece en 0,6 s;
   - carga el modelo completo, con efecto de vapor.
3. El botón de acción ("COMER") pasa al siguiente modelo de la tarjeta, con
   sonido y partículas. Después del último modelo, el objeto desaparece y el
   botón dice "REINICIAR".
4. Al perder la tarjeta se limpia todo. **Pausar cámara AR** detiene la cámara.
5. Opcional: cada detección se registra en una API externa (compatible con
   *Interaction Register API*).

El contenido incluido son 8 tarjetas de platos con cultivos urbanos y sus 24
modelos 3D (esqueleto, completo y a medio comer).

## Requisitos

- Navegador móvil con cámara (Chrome en Android o Safari en iOS).
- **HTTPS** o `localhost`: sin eso, el navegador no da acceso a la cámara.
- Internet: Three.js 0.160.0 y MindAR 1.2.5 se cargan desde CDN.
- Las tarjetas impresas que corresponden a `assets/targets/targets.mind`.

## Ejecución con Docker

```bash
cp .env.example .env
docker compose up --build -d
curl http://localhost:8000/health     # OK
```

Abre `http://localhost:8000`. Para probar desde el teléfono, publica el
contenedor detrás de HTTPS (proxy inverso o túnel) o despliega la carpeta en
un hosting estático con HTTPS.

## Ejecución sin Docker

Cualquier servidor estático en la raíz del repositorio (no funciona con
`file://`):

```bash
npm start                 # usa "serve" en http://localhost:8000
# o bien: python3 -m http.server 8000
```

Sin Docker, la configuración se edita en `js/config/env.js`.

## Configuración

| Variable (`.env`) | Por defecto | Descripción |
|---|---|---|
| `WEB_PORT` | `8000` | Puerto publicado |
| `REGISTER_API_URL` | (vacío: no registra) | Endpoint de registro, p. ej. `http://localhost:3000/api/register` |
| `REGISTER_INTERACTIVE_ID` | `interactive-image-cards` | Valor del campo `interactive` (el despliegue original usaba `comedor-ar`) |

El contenedor genera `js/config/env.js` con estos valores al arrancar.
Textos, tiempos, escalas y rotaciones están en `js/config/config.js`.

## Agregar o cambiar tarjetas

1. Compila las imágenes de las tarjetas en un único `.mind` con el compilador
   de MindAR. El orden de las imágenes define `targetIndex`.
2. Copia el archivo a `assets/targets/targets.mind`.
3. Pon los modelos `.glb` en `assets/models/<Nombre>/`: un esqueleto y uno o
   más modelos.
4. Agrega una entrada en `js/config/targetInfo.js`:

| Campo | Descripción |
|---|---|
| `targetIndex` | Posición de la imagen en el `.mind` |
| `title` | Título del panel; también se envía como `target` en el registro |
| `statusLabel` | Nombre corto para los mensajes de estado |
| `skeletonPath` | Modelo esqueleto que se muestra 3 s |
| `models` | Modelos que recorre el botón de acción, en orden |
| `scale` | Escala (opcional, por defecto 1) |
| `usesIdentityRotation` | `true` para no aplicar la rotación por defecto (opcional) |
| `stats` | Lista de `{ label, value }` para el panel (caben unos 3) |

## Pruebas

```bash
npm test     # 19 pruebas: registro, ciclo del botón, contenido y archivos, env.sh
```

Las pruebas no necesitan dependencias, solo Node.js 20+. La experiencia AR
completa se prueba en un teléfono real.

## Estructura

```
index.html              Interfaz (HUD y pantallas de estado)
js/main.js              Ciclo AR, carga de modelos, panel, efectos
js/register.js          Registro de interacciones
js/model-cycle.js       Ciclo de modelos del botón de acción
js/config/config.js     Textos, tiempos, íconos, rotaciones, registro
js/config/targetInfo.js Contenido de cada tarjeta
js/config/env.js        Configuración en tiempo de ejecución
styles/main.css         Estilos
assets/                 Modelos 3D, targets, íconos, sonido, texturas
docker/                 nginx (con /health) y generación de env.js
tests/                  Pruebas (node:test)
```

## Avisos

- El registro se envía cada vez que se detecta una tarjeta, no una vez por
  sesión, e incluye el userAgent del navegador.
- Los errores de red del registro solo aparecen en la consola.
- El panel usa la fuente por defecto: la fuente declarada (`Rajdhani`) no se
  carga.
