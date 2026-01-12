# 📋 CHANGELOG - SUMMA

Historial completo de cambios y versiones de SUMMA.

---

## [23.1.0] - 2026-01-12

## Versión 23.2.1 (2026-01-12)

### 🔧 SIMPLIFICACIÓN

#### Botón de Salida Optimizado

- **Eliminado**: Sistema completo de compartir (WhatsApp, Share API, Bitácora)
- **Mantenido**: Solo botón "Salir" con confirmación simple
- **Modal simplificado**:
  - ⚠️ Advertencia si hay partida activa
  - 🚪 Botón "Confirmar Salida" (rojo)
  - ✕ Botón "Cancelar" (gris)

### 📉 REDUCCIÓN DE CÓDIGO

- **Eliminadas 7 funciones**: shareViaWhatsApp, shareViaGeneric, fallbackShare, generateGameURL, generateShareMessage, downloadBitacora, generateBitacoraText
- **Simplificada confirmExit**: Doble confirmación si hay partida activa
- **HTML más limpio**: -35 líneas (5 botones → 2 botones)
- **JavaScript más ligero**: -140 líneas de código

### ✨ MEJORAS EN UX

- **Flujo más directo**: Menos opciones = decisión más rápida
- **Confirmación inteligente**: 
  - Sin partida activa: Sale directamente sin confirmar
  - Con partida activa: Muestra advertencia + requiere confirmación
- **Feedback visual claro**: Advertencia naranja cuando hay progreso en riesgo

### 🎯 FUNCIONALIDAD FINAL

**Botón "🚪 Salir" en menú:**
1. Detecta si hay partida activa
2. Muestra modal con advertencia (si aplica)
3. Usuario confirma o cancela
4. Si confirma: limpia IndexedDB y recarga app


## Versión 23.2.0 (2026-01-12)

### 🆕 NUEVAS CARACTERÍSTICAS

#### Sistema de Salida Inteligente

- **Botón "Salir" en menú**: Nuevo botón en el Centro de Comando para gestionar la salida de la aplicación
- **Modal de salida con opciones**:
  - ⚠️ **Recordatorio automático**: Si hay una partida activa, muestra advertencia antes de salir
  - 💬 **Compartir por WhatsApp**: Envía el enlace de la partida directamente
  - 📤 **Compartir en otras Apps**: Usa Web Share API nativa (funciona en iOS/Android)
  - 📋 **Descargar Bitácora**: Exporta un archivo TXT con el historial completo
  - 🚪 **Salir sin Compartir**: Opción para salir limpiamente (confirma antes de borrar)

#### Funcionalidades de Compartir

- **Generación automática de mensaje**: Incluye líder actual, meta, jugadas y participantes
- **URL de partida**: Genera enlace único con estado completo codificado
- **Bitácora profesional**: Formato texto con:
  - Tabla de posiciones con medallas 🥇🥈🥉
  - Historial de últimas 20 jugadas
  - Metadatos de la partida
  - Firma del desarrollador

#### Integración con Share API

- **Soporte nativo**: Usa `navigator.share()` cuando está disponible
- **Fallback inteligente**: Copia al portapapeles si Share API no está disponible
- **Compatible con**: WhatsApp, Telegram, Email, Bluetooth, etc.

### 🔧 MEJORAS TÉCNICAS

- **Detección de partida activa**: Verifica si hay puntos o historial antes de salir
- **Limpieza de estado**: Borra IndexedDB al confirmar salida
- **Feedback visual**: Recordatorios con colores y emojis
- **SFX integrado**: Sonidos al abrir modal y ejecutar acciones

### 📱 COMPATIBILIDAD

- ✅ Android (Chrome, Firefox, Edge)
- ✅ iOS (Safari, Chrome)
- ✅ Desktop (todos los navegadores modernos)

## [23.1.2] - 2026-01-12

### 🔄 Actualización Forzada del Service Worker

**Problema resuelto:** Usuarios con versión antigua cacheada veían "PUNTOS VS" en lugar de "SUMMA"

#### Cambios Críticos:

1. **Service Worker simplificado:**
   - Eliminación agresiva de caches antiguos
   - `skipWaiting()` inmediato
   - `clients.claim()` forzado
   - Network-first strategy (sin cache persistente por ahora)

2. **Detección automática de versión:**
   - Comparación de versión en localStorage
   - Limpieza automática de caches viejos
   - Reload automático al detectar nueva versión

3. **Actualización forzada:**
   - No espera confirmación del usuario
   - Recarga automática en 500ms
   - Elimina TODOS los caches al activarse

#### Solución para usuarios:

**Si aún ves "PUNTOS VS" en móvil:**
1. Desinstala la app
2. Abre Chrome
3. Ve a: https://prismalab-arm64.github.io/SUMMA/
4. Reinstala

O simplemente:
- Abre la app → Espera 5 segundos → Se recargará automáticamente

---

## [23.1.1] - 2026-01-12

### 🔗 Actualización de URLs

**Repositorio renombrado exitosamente:** `puntos-vs` → `SUMMA`

#### Cambios:
- ✅ Remote origin actualizado a `SUMMA.git`
- ✅ URLs en README.md actualizadas
- ✅ URLs en CHANGELOG.md actualizadas
- ✅ GitHub Pages ahora en: `https://prismalab-arm64.github.io/SUMMA/`
- ✅ Versión incrementada: 23.1.0 → 23.1.1
- ✅ Cache name: `summa-v23.1.1`

#### Nueva URL oficial:
```
https://prismalab-arm64.github.io/SUMMA/
```

**Nota:** Las URLs antiguas (`/puntos-vs/`) redirigen automáticamente.

---


### 🔧 Parche de Consistencia

**Objetivo:** Eliminar todas las referencias residuales a "PUNTOS VS" y "PRISMA LABS"

#### Cambios Realizados:

- **Módulos JavaScript actualizados:**
  - `js/db.js`: Header → "SUMMA - IndexedDB Persistence Layer v1.0"
  - `js/wakelock.js`: Header → "SUMMA - Robust Wake Lock Manager v1.0"
  - `js/statemachine.js`: Header → "SUMMA - Game State Machine v1.0"
  - Todos incluyen: "Diseñado por Ing. John A. Skinner S."

- **Versiones actualizadas:**
  - `APP_VERSION`: 23.0.0 → 23.1.0
  - `CACHE_NAME`: summa-v23.0.0 → summa-v23.1.0
  - `manifest.json`: version → 23.1.0
  - `README.md`: badge version → 23.1.0

- **Autoría completa:**
  - Todos los módulos ahora llevan la firma del autor
  - Comentarios consistentes en todo el código

#### Archivos Modificados:
- `js/script.js` (header + version)
- `js/db.js` (header)
- `js/wakelock.js` (header)
- `js/statemachine.js` (header)
- `sw.js` (header + cache name + version)
- `manifest.json` (version)
- `README.md` (badge)
- `docs/CHANGELOG.md` (este archivo)

#### Nota sobre URLs:
Las URLs `prismalab-arm64.github.io/puntos-vs/` son correctas porque el repositorio en GitHub aún se llama `puntos-vs`. Para cambiarlo, debes ir a:
```
GitHub → Settings → Repository name → Renombrar a "summa"
```

---

## [23.0.0] - 2026-01-12

### 🎉 Cambios Mayores

- **REBRAND COMPLETO**: PUNTOS VS → **SUMMA**
  - Nuevo nombre en todos los archivos
  - Actualización de manifest.json
  - Cambio de títulos y metadatos

- **AUTORÍA VISIBLE**:
  - Firma del autor en splash screen: "by Ing. John A. Skinner S."
  - Metadata de autor en manifest.json
  - Créditos en documentación

- **SISTEMA DE ACTUALIZACIÓN AUTOMÁTICA**:
  - Detección inteligente de nuevas versiones
  - Toast animado con notificación de update
  - Botón de actualización manual
  - Aplicación sin interrumpir partidas

### ✨ Nuevas Características

- Toast de actualización con:
  - Ícono giratorio 🔄
  - Animación de pulso cyan
  - Botones "Actualizar" y "Cerrar"
  - Responsive para todos los dispositivos

- Versionado en manifest (23.0.0)
- Detección de SW waiting
- Listener de controllerchange

### 🎨 Mejoras Visuales

- Splash screen con autor:
  ```
  SUMMA
  Marcador Universal Profesional
  by Ing. John A. Skinner S.
  © 2026 - Todos los derechos reservados
  ```

- Estilos del toast:
  - Gradiente 135deg (#1a1a1a → #2a2a2a)
  - Borde cyan con glow
  - Animación updatePulse (2s)
  - Ícono rotando infinitamente

### 🐛 Correcciones

- Fix en Service Worker: versión actualizada a v23.0.0
- Cache name: `summa-v23.0.0`
- Mejora en aplicación de updates

### 📚 Documentación

- README.md completo con:
  - Guía de instalación
  - Cómo usar SUMMA
  - Tecnologías utilizadas
  - Sistema de actualización
  - Solución de problemas
  - Licencia y créditos

- docs/CHANGELOG.md (este archivo)
- docs/USUARIO.md (próximamente)
- docs/DESARROLLO.md (próximamente)

### 🔧 Cambios Técnicos

**Archivos modificados:**
- `index.html`: Título, splash, meta tags
- `manifest.json`: Name, description, version, author
- `sw.js`: CACHE_NAME, APP_VERSION
- `js/script.js`: Init, updateReady, showUpdateNotification, applyUpdate
- `css/style.css`: Estilos de splash-author y update-toast
- `README.md`: Documentación completa

**Líneas añadidas:** ~350  
**Archivos nuevos:** 3 (README.md, docs/CHANGELOG.md, docs/*)

---

## [22.0.0] - 2026-01-11

### 🎉 Refactorización Completa PWA

#### ✨ Nuevas Características

1. **Modal de Confirmación de Puntajes** (`bf4c29b`)
   - Preview de puntaje (actual → nuevo)
   - Botones "Confirmar" y "Corregir"
   - Diseño responsive
   - Animaciones suaves

2. **Splash Screen Animado** (`c839731`)
   - Logo con glow y pulso
   - Título con gradiente animado
   - Barra de progreso
   - Timing inteligente (2.5s)

3. **Cursor Parpadeante en Inputs** (`4235dde`)
   - Cursor tipo terminal en inputs vacíos
   - Aparece solo sin foco
   - Desaparece al escribir
   - CSS puro (0 JS)

#### 🐛 Correcciones Críticas

4. **Fix: Permitir 0 Puntos** (`6d71750`)
   - Resolver bug de bloqueo con 0 puntos
   - Modal especial para 0 puntos (amarillo)
   - Hint: "El turno pasará al siguiente jugador"
   - Registro en historial

5. **Service Worker Funcional** (`ead63bc`)
   - Crear sw.js con cache-first
   - Registro automático
   - Manifest.json mejorado
   - CSP actualizado (worker-src)

#### 📊 Estadísticas

- **Commits:** 5
- **Archivos modificados:** 12
- **Insertions:** 1,116
- **Deletions:** 37

---

## [21.0.0] - 2026-01-10

### ✨ Mejoras Responsive

- Sistema responsive completo
- Media queries para todos los tamaños
- Tipografía fluida con clamp()
- Safe-area para notch/isla dinámica

#### Breakpoints Implementados

- 320px - 374px: Móviles pequeños
- 375px - 479px: Móviles estándar
- 480px - 767px: Móviles grandes
- 768px - 1023px: Tablets
- 1024px+: Desktop

### 🎨 Mejoras Visuales

- Modo oscuro ergonómico (#121212)
- Opción OLED Black (#000000)
- Variables CSS para tematización
- Colores neón optimizados

---

## [20.0.0] - 2025-12-XX

### 🏗️ Arquitectura Base

- Implementación de IndexedDB
- Wake Lock API
- State Machine (FSM)
- Calculadora aritmética
- Historial con undo
- Compartir via QR

---

## [1.0.0] - 2025-XX-XX

### 🎉 Lanzamiento Inicial

- Modo Equipos e Individual
- Puntuación básica
- LocalStorage
- Diseño inicial

---

## 🔮 Próximas Versiones

### [24.0.0] - Planificado

- [ ] Más juegos con FSM (Volleyball, Basketball)
- [ ] Modo multijugador online
- [ ] Estadísticas y gráficos
- [ ] Temas personalizables
- [ ] Exportar partidas a PDF

### [25.0.0] - Futuro

- [ ] Integración con APIs deportivas
- [ ] Streaming de partidas
- [ ] Modo torneo
- [ ] Reconocimiento de voz

---

## 📝 Convenciones de Versionado

SUMMA sigue [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH

MAJOR: Cambios incompatibles (breaking changes)
MINOR: Nuevas funcionalidades compatibles
PATCH: Correcciones de bugs
```

### Ejemplos:

- `23.0.0` → Nueva versión mayor (rebrand)
- `22.1.0` → Añadir feature sin romper compatibilidad
- `22.0.1` → Fix de bug menor

---

## 🏷️ Tags y Tipos de Commits

### Tipos:
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Cambios de formato (CSS, espacios)
- `refactor`: Refactorización de código
- `perf`: Mejoras de rendimiento
- `test`: Añadir o corregir tests
- `chore`: Tareas de mantenimiento

### Formato:
```
tipo(alcance): descripción corta

Descripción larga (opcional)

BREAKING CHANGE: descripción (si aplica)
```

---

<div align="center">

**SUMMA** - Marcador Universal Profesional

*Desarrollado por Ing. John A. Skinner S.*

[⬆️ Volver arriba](#-changelog---summa)

</div>
