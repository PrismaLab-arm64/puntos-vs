# 📋 CHANGELOG - SUMMA

Historial completo de cambios y versiones de SUMMA.

---

## [23.1.0] - 2026-01-12

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
