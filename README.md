# SUMMA ⚡

<div align="center">

![Version](https://img.shields.io/badge/version-23.1.1-blue.svg)
![PWA](https://img.shields.io/badge/PWA-Ready-green.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)

**Marcador Universal Profesional**

*Diseñado y desarrollado por **Ing. John A. Skinner S.***

[🌐 Ver Demo](https://prismalab-arm64.github.io/SUMMA/) | [📱 Instalar PWA](#instalación) | [📖 Documentación](#documentación)

</div>

---

## 🎯 ¿Qué es SUMMA?

**SUMMA** es una Progressive Web App (PWA) profesional diseñada para registrar y gestionar puntuaciones en tiempo real de más de **100 disciplinas deportivas**. Desarrollada con tecnologías web modernas, ofrece una experiencia nativa multiplataforma sin necesidad de instalación desde tiendas de aplicaciones.

### ✨ Características Principales

- 🎮 **Múltiples Modos de Juego**
  - Modo Equipos (Teams)
  - Modo Individual (Free For All)
  - Modo Cooperativo
  
- 📊 **Marcadores Inteligentes**
  - Sistema de puntuación lineal
  - Máquina de estados para juegos específicos (Tenis, Volleyball, etc.)
  - Confirmación de puntajes para evitar errores
  
- 💾 **Persistencia Avanzada**
  - IndexedDB para almacenamiento local
  - Guardado automático transaccional
  - Recuperación de partidas interrumpidas
  
- 🔒 **Always-On**
  - Wake Lock API para mantener pantalla activa
  - Recuperación automática al volver a la app
  - Indicadores visuales de estado
  
- 📱 **100% Offline**
  - Service Worker con cache-first strategy
  - Funciona sin conexión a internet
  - Sincronización automática cuando hay conexión
  
- 🔄 **Actualizaciones Automáticas**
  - Detección inteligente de nuevas versiones
  - Notificación in-app con toast animado
  - Aplicación sin interrumpir partidas en curso

---

## 🚀 Instalación

### Opción 1: Instalación PWA (Recomendada)

#### **Android / Chrome**
1. Abre https://prismalab-arm64.github.io/SUMMA/
2. Toca el botón **"⬇️ INSTALAR APLICACIÓN"**
3. Confirma en el diálogo del navegador
4. ¡Listo! Encontrarás el ícono en tu pantalla de inicio

#### **iOS / Safari**
1. Abre https://prismalab-arm64.github.io/SUMMA/
2. Toca el botón de **Compartir** (cuadrado con flecha)
3. Selecciona **"Agregar a pantalla de inicio"**
4. Confirma el nombre y toca **"Agregar"**

#### **Windows / macOS (Chrome/Edge)**
1. Abre https://prismalab-arm64.github.io/SUMMA/
2. Haz clic en el ícono **⊕** en la barra de dirección
3. O busca **"Instalar SUMMA"** en el menú del navegador
4. Confirma la instalación

### Opción 2: Uso directo en navegador

Simplemente abre la URL en cualquier navegador moderno:
```
https://prismalab-arm64.github.io/SUMMA/
```

---

## 📖 Cómo Usar SUMMA

### 1️⃣ **Configuración Inicial**

Al abrir la app por primera vez:

1. **Selecciona el modo:**
   - **EQUIPOS**: Para juegos de equipos (2-4 equipos)
   - **INDIVIDUAL**: Para competencias individuales

2. **Agrega participantes:**
   - Toca **"+ AGREGAR RIVAL"**
   - Ingresa el nombre del equipo/jugador
   - (Opcional) Añade miembros del equipo

3. **Define la meta:**
   - Ingresa los puntos objetivo (ej: 1000)
   - Toca **"INICIAR PARTIDA"**

### 2️⃣ **Durante el Juego**

- **Registrar puntos:**
  1. Digita el puntaje en la calculadora
  2. Toca **"OK"**
  3. Confirma en el modal emergente
  4. El turno avanza automáticamente

- **Pasar turno sin anotar:**
  1. Sin digitar nada, toca **"OK"**
  2. Confirma el puntaje de **0 PTS**
  3. El turno pasa al siguiente

- **Deshacer último puntaje:**
  1. Abre el menú ☰
  2. Toca **"DESHACER ÚLTIMO"**

### 3️⃣ **Finalizar Partida**

Cuando un equipo alcanza la meta:
- Se muestra la **pantalla de victoria** 🎉
- Opciones disponibles:
  - **REVANCHA (TODOS)**: Nueva partida con mismos equipos
  - **FINAL (TOP 1 vs TOP 2)**: Enfrentamiento final
  - **SALIR / NUEVA**: Volver al inicio

---

## 🛠️ Tecnologías Utilizadas

### **Frontend**
- HTML5 con semántica avanzada
- CSS3 con variables nativas y animaciones GPU
- Vanilla JavaScript (ES6+)

### **APIs Web Nativas**
- **Service Worker API**: Cache y modo offline
- **Wake Lock API**: Pantalla siempre activa
- **IndexedDB API**: Persistencia local
- **Web App Manifest**: Instalabilidad PWA
- **Vibration API**: Feedback táctil
- **Web Audio API**: Efectos de sonido

### **Arquitectura**
- Patrón de diseño: State Machine (FSM)
- Persistencia: Transaccional con IndexedDB
- Eventos: Event-driven architecture
- Modularización: Separación de responsabilidades

---

## 📊 Estructura del Proyecto

```
summa/
├── index.html              # Punto de entrada
├── manifest.json           # Configuración PWA
├── sw.js                   # Service Worker v23.0
├── icon.png                # Ícono de la app (192x192 y 512x512)
├── css/
│   └── style.css           # Estilos globales y responsive
├── js/
│   ├── script.js           # Motor principal de la app
│   ├── db.js               # Capa de persistencia IndexedDB
│   ├── wakelock.js         # Gestión de Wake Lock
│   └── statemachine.js     # Máquinas de estado para juegos
└── docs/
    ├── USUARIO.md          # Guía de usuario detallada
    ├── DESARROLLO.md       # Guía técnica para desarrolladores
    └── CHANGELOG.md        # Historial de cambios
```

---

## 🔄 Sistema de Actualización

SUMMA incluye un sistema de actualización automática:

### **Cómo Funciona**

1. Al abrir la app, el Service Worker verifica si hay nuevas versiones
2. Si detecta cambios, descarga la actualización en segundo plano
3. Muestra una notificación elegante en la parte superior:
   ```
   🔄 Nueva versión disponible
   v23.0.0 lista para instalar
   [Actualizar] [✕]
   ```
4. Al tocar **"Actualizar"**, aplica los cambios sin perder datos
5. La app se recarga con la nueva versión

### **Notas Importantes**

- ✅ Las actualizaciones NO interrumpen partidas en curso
- ✅ Todos los datos se preservan automáticamente
- ✅ Puedes posponer la actualización cerrando la notificación
- ✅ Al cerrar y volver a abrir, se aplicará la actualización pendiente

---

## 🎨 Personalización

### **Modo OLED Black (Opcional)**

Para dispositivos con pantalla OLED, puedes activar el modo negro puro:

```javascript
// En la consola del navegador o en configuración
document.body.classList.add('oled-mode');
```

Esto cambia el fondo de `#121212` (gris ergonómico) a `#000000` (negro puro) para mayor ahorro de energía.

---

## 🐛 Solución de Problemas

### **La app no se instala**

- **Chrome/Edge**: Verifica que estés en HTTPS
- **iOS Safari**: La instalación es manual (Compartir → Agregar a inicio)
- **Navegador antiguo**: Actualiza a la última versión

### **No aparece el botón de instalar**

- Ya instalaste la app previamente
- El navegador no soporta PWA
- Intenta abrir la URL en modo incógnito y luego normal

### **La pantalla se apaga durante el juego**

- El navegador no soporta Wake Lock API
- Deniega permisos en configuración del sistema
- Batería muy baja (< 15%) - el sistema libera el bloqueo automáticamente

### **Perdí mi partida al cerrar la app**

- Revisa si aparece el prompt de **"¿Continuar partida anterior?"**
- Si cerraste sin guardar: verifica en el menú si hay opción de **"Recuperar partida"**
- En casos extremos: los datos se guardan en IndexedDB del navegador

### **La actualización no se aplica**

1. Cierra todas las pestañas/ventanas de SUMMA
2. Vuelve a abrir la app
3. Si persiste: Borra el cache del navegador para SUMMA
4. Recarga con Ctrl+Shift+R (Windows) o Cmd+Shift+R (Mac)

---

## 🔒 Privacidad y Datos

- ✅ **100% Local**: Todos los datos se guardan en tu dispositivo
- ✅ **Sin Servidores**: No enviamos información a ningún servidor
- ✅ **Sin Tracking**: No usamos analytics ni cookies de terceros
- ✅ **Código Abierto**: Puedes revisar todo el código fuente

---

## 📝 Changelog

### **v23.0.0** (2026-01-12)

#### 🎉 Cambios Mayores
- **Rebrand completo**: PUNTOS VS → SUMMA
- Sistema de actualización automática con notificaciones
- Firma del autor en splash screen

#### ✨ Nuevas Características
- Toast de actualización con animación
- Versión en manifest.json
- Detección inteligente de updates

#### 🐛 Correcciones
- Mejora en la aplicación de actualizaciones del SW
- Optimización de cache

---

### **v22.0.0** (2026-01-11)

#### 🎉 Refactorización Completa
- Modal de confirmación de puntajes
- Splash screen animado profesional
- Cursor parpadeante en inputs vacíos
- Fix: permitir 0 puntos y pasar turno
- Service Worker funcional y completo

---

Ver [CHANGELOG.md](docs/CHANGELOG.md) completo para historial detallado.

---

## 👨‍💻 Autor

<div align="center">

**Ing. John A. Skinner S.**

Ingeniero de Software especializado en PWAs y desarrollo móvil

📧 Contacto: [Email del autor]  
🔗 LinkedIn: [Perfil del autor]  
🌐 Portfolio: [Web del autor]

</div>

---

## 📄 Licencia

© 2026 **Ing. John A. Skinner S.** - Todos los derechos reservados.

Este software es de **uso propietario**. No se permite la redistribución, modificación o uso comercial sin autorización explícita del autor.

---

## 🙏 Agradecimientos

- **Prisma Labs** - Por el soporte inicial del proyecto
- **Comunidad de desarrolladores web** - Por las APIs y estándares abiertos
- **Usuarios beta** - Por sus valiosos comentarios y sugerencias

---

## 📚 Documentación Adicional

- [📖 Guía de Usuario Completa](docs/USUARIO.md)
- [👨‍💻 Guía Técnica para Desarrolladores](docs/DESARROLLO.md)
- [📋 Historial de Cambios](docs/CHANGELOG.md)

---

## 🌟 ¿Te gusta SUMMA?

Si encuentras útil esta aplicación:

- ⭐ Dale una estrella en GitHub
- 🐛 Reporta bugs o sugiere mejoras en Issues
- 📢 Compártela con amigos y colegas
- 💬 Deja tu feedback

---

<div align="center">

**SUMMA** - Marcador Universal Profesional

*Desarrollado con ❤️ usando tecnologías web modernas*

[⬆️ Volver arriba](#summa-)

</div>
