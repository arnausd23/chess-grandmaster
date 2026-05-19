# RPG Overworld Game — Documento de Diseño

> **Motor:** Phaser 3 + Vite + TypeScript  
> **Stack UI:** React (HUD, menús) + Phaser (canvas del juego)  
> **Referencia de mecánicas:** Este documento define el comportamiento canónico del juego. Cualquier cambio en las mecánicas debe actualizarse aquí primero.

---

## 1. Recorrido del Mundo (Overworld)

### 1.1 Estructura del Mapa

El mundo está compuesto por **tilemaps** creados con [Tiled Map Editor](https://www.mapeditor.org/). Cada mapa es un archivo `.tmj` (JSON) con múltiples capas:

```
Capas del mapa (orden de renderizado, abajo → arriba):
├── ground          — Suelo base (hierba, tierra, agua)
├── decoration      — Decoraciones no bloqueantes (flores, sombras)
├── objects         — Objetos bloqueantes (árboles, rocas, edificios)
├── npcs            — Capa de objetos Tiled con posiciones iniciales de NPCs
└── above_player    — Elementos que se renderizan encima del jugador (techos, ramas altas)
```

La capa `objects` define las colisiones mediante la propiedad `collides: true` en los tiles del tileset.

### 1.2 Movimiento del Jugador

| Input | Acción |
|---|---|
| `↑` / `W` | Mover arriba |
| `↓` / `S` | Mover abajo |
| `←` / `A` | Mover izquierda |
| `→` / `D` | Mover derecha |
| `Space` / `Enter` | Interactuar con NPC (cuando está cerca) |

**Comportamiento del movimiento:**
- El personaje se mueve tile a tile (movimiento discreto, no analógico) a una velocidad de `4 tiles/segundo`.
- Durante el movimiento no se puede interactuar ni iniciar otro movimiento simultáneo.
- La cámara sigue al jugador con un leve suavizado (`lerp: 0.1`). Los bordes del mapa detienen la cámara pero no al jugador.
- La animación del sprite cambia según la dirección: `walk_up`, `walk_down`, `walk_left`, `walk_right`. En reposo se muestra el frame idle de la última dirección.

### 1.3 Colisiones

- El jugador no puede atravesar tiles con `collides: true`.
- El jugador no puede atravesar NPCs (tienen un cuerpo físico estático).
- El agua y los obstáculos usan la misma capa de colisión.

### 1.4 Indicador de Interacción

Cuando el jugador está adyacente (1 tile de distancia) a un NPC y mirando hacia él, aparece un icono flotante `[Space]` parpadeante sobre el NPC. Este icono desaparece si el jugador se aleja o gira.

---

## 2. Interacción con NPCs

### 2.1 Detección de Proximidad

Un NPC es interactuable cuando se cumplen **todas** estas condiciones:
1. El jugador está a **≤ 1 tile** de distancia Manhattan del NPC.
2. El jugador está **mirando hacia** el NPC (la dirección del jugador apunta al tile del NPC).
3. No hay combate ni diálogo activo.

### 2.2 Flujo de Diálogo

```
[Jugador pulsa Space cerca de NPC]
        │
        ▼
┌─────────────────────────────────┐
│  Cuadro de diálogo (parte baja) │
│  "Hola, viajero. ¿Te atreves    │
│   a enfrentarte a mí?"          │
│                        [Space ▶] │
└─────────────────────────────────┘
        │ (jugador pulsa Space)
        ▼
┌─────────────────────────────────┐
│  "¡Prepárate para el combate!"  │
│                        [Space ▶] │
└─────────────────────────────────┘
        │ (jugador pulsa Space)
        ▼
  [Transición a BattleScene]
```

**Reglas del diálogo:**
- El movimiento del jugador está **bloqueado** mientras hay diálogo activo.
- El texto aparece carácter a carácter (efecto typewriter, `30ms/carácter`).
- Si se pulsa Space mientras el texto está animándose, se muestra el texto completo instantáneamente.
- Cada NPC tiene una lista de líneas de diálogo pre-combate configurable.

### 2.3 Estado Post-Combate del NPC

Tras resolver un combate, el NPC muestra un **label flotante permanente** sobre su sprite:

| Resultado | Label | Color |
|---|---|---|
| Victoria del jugador | `¡Derrotado!` | Verde (`#4ade80`) |
| Derrota del jugador | `¡Ganaste!` | Rojo (`#f87171`) |

El label persiste mientras el jugador esté en el mapa. Si el jugador sale y vuelve (transición de mapa), el estado se restaura desde el store global del juego.

Un NPC **derrotado**:
- No puede iniciar combate de nuevo (el diálogo cambia a una línea de rendición).
- Sigue siendo un obstáculo físico.
- Mantiene el label `¡Derrotado!` visible.

---

## 3. Sistema de Combate

El combate es **por turnos** con mecánicas inspiradas en Pokémon (Gen 1-2). El jugador y el enemigo actúan alternativamente; la velocidad determina quién va primero.

### 3.1 Transición al Combate

```
[Final del diálogo]
        │
        ▼
Fade to black (0.5s)
        │
        ▼
Aparición del fondo de batalla (slide-in desde arriba, 0.4s)
Aparición del sprite del enemigo (slide-in desde derecha, 0.4s)
Aparición del sprite del jugador (slide-in desde izquierda, 0.4s)
        │
        ▼
Animación de entrada del enemigo: "¡[NombreNPC] quiere combatir!"
        │
        ▼
[Estado: PLAYER_TURN]
```

### 3.2 Estructura de la Pantalla de Combate

```
┌────────────────────────────────────────────────────────┐
│  [Nombre Enemigo]        HP: ████████░░  80/100        │
│                                                        │
│          [Sprite Enemigo]                              │
│                                                        │
│  [Sprite Jugador]                                      │
│                            HP: ██████░░░░  60/100      │
│  [Nombre Jugador]                                      │
├────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐                           │
│  │ Atacar   │  │ Magia    │                           │
│  └──────────┘  └──────────┘                           │
│  ┌──────────┐  ┌──────────┐                           │
│  │ Objeto   │  │ Huir     │                           │
│  └──────────┘  └──────────┘                           │
├────────────────────────────────────────────────────────┤
│  Log: "¡Goblin Guardia ataca! Causó 15 de daño."      │
└────────────────────────────────────────────────────────┘
```

### 3.3 Estadísticas de los Combatientes

Cada combatiente (jugador o NPC) tiene las siguientes estadísticas base:

| Stat | Descripción |
|---|---|
| `hp` / `maxHp` | Puntos de vida actuales y máximos |
| `attack` | Modificador de daño físico |
| `defense` | Reducción de daño físico recibido |
| `speed` | Determina el orden de turno |
| `moves` | Array de hasta 4 movimientos disponibles |

**Fórmula de daño:**
```
daño = Math.max(1, (atacante.attack * movimiento.power) / defensor.defense)
daño = daño * (0.85 + Math.random() * 0.15)  // variación ±15%
daño = Math.round(daño)
```

### 3.4 Movimientos

Cada movimiento tiene:

| Campo | Tipo | Descripción |
|---|---|---|
| `name` | string | Nombre del movimiento |
| `power` | number | Potencia base (0 si no hace daño) |
| `type` | `'physical' \| 'magic' \| 'status'` | Tipo de movimiento |
| `effect` | `StatusEffect \| null` | Efecto de estado opcional |
| `description` | string | Descripción corta |

**Movimientos iniciales del jugador:**
1. **Ataque Normal** — Físico, poder 40. Sin efecto.
2. **Golpe Fuerte** — Físico, poder 80. Sin efecto.
3. **Magia Básica** — Magia, poder 50. Sin efecto.
4. **Curación** — Sin daño. Restaura `30% del maxHp` del jugador.

### 3.5 Flujo de un Turno

```
[PLAYER_TURN]
  Jugador selecciona movimiento
        │
        ▼
Cálculo de velocidades:
  Si jugador.speed >= enemigo.speed → jugador va primero
  Si no → enemigo va primero
        │
        ▼
[Ejecutar acción del que va primero]
  → Animación de ataque (shake/flash del defensor, 0.3s)
  → Reducir HP del defensor
  → Actualizar barra de HP (tween suave)
  → Mostrar mensaje en el log
        │
        ▼
¿Defensor llegó a 0 HP?
  SÍ → [FIN DEL COMBATE]
  NO → [Ejecutar acción del que va segundo]
        │
        ▼
¿Defensor llegó a 0 HP?
  SÍ → [FIN DEL COMBATE]
  NO → [PLAYER_TURN] (siguiente turno)
```

**IA del enemigo:** El enemigo selecciona un movimiento al azar de su lista de movimientos en cada turno (sin estrategia avanzada en la fase inicial).

### 3.6 Acción "Huir"

- El jugador puede intentar huir en su turno.
- **Probabilidad de huida:** `50% + (jugador.speed - enemigo.speed) * 5%`, mínimo 10%, máximo 90%.
- Si la huida falla: el enemigo ataca normalmente ese turno y se muestra `"¡No pudiste huir!"`.
- Si la huida tiene éxito: transición de vuelta al overworld sin resultado (ni victoria ni derrota). El NPC no muestra label.

### 3.7 Fin del Combate

#### Victoria (HP del enemigo llega a 0)
```
Animación: enemigo se desvanece (fade out, 0.5s)
Mensaje: "¡Has ganado el combate!"
Espera: 2s
Fade to black (0.5s)
→ Vuelta a OverworldScene
→ Label "¡Derrotado!" aparece sobre el NPC (color verde)
→ Estado del NPC actualizado a DEFEATED
```

#### Derrota (HP del jugador llega a 0)
```
Animación: jugador se desvanece (fade out, 0.5s)
Mensaje: "¡Has sido derrotado..."
Espera: 2s
Fade to black (0.5s)
→ Vuelta a OverworldScene
→ Jugador reaparece en posición inicial del mapa con HP completo
→ Label "¡Ganaste!" aparece sobre el NPC (color rojo, desde perspectiva del NPC)
→ Estado del NPC actualizado a WON
```

---

## 4. Gestión del Estado Global

El estado del juego se persiste en un objeto `GameState` accesible desde todas las escenas:

```typescript
interface GameState {
  player: {
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    speed: number;
    moves: Move[];
    position: { mapId: string; tileX: number; tileY: number };
    lastDirection: Direction;
  };
  npcs: Record<string, NPCState>;  // key: npcId
  currentMapId: string;
}

interface NPCState {
  id: string;
  battleResult: 'none' | 'player_won' | 'player_lost';
}
```

---

## 5. Arquitectura de Escenas Phaser 3

```
Phaser.Game
├── BootScene       — Carga assets mínimos (loading screen)
├── PreloadScene    — Carga todos los assets (tilemap, sprites, audio)
├── OverworldScene  — Mapa, movimiento del jugador, NPCs, diálogos
│   └── UIScene     — HUD superpuesto (HP del jugador, controles)
└── BattleScene     — Combate por turnos completo
    └── BattleUIScene — Botones de movimientos, log de batalla, barras de HP
```

Las escenas `UIScene` y `BattleUIScene` corren en paralelo sobre la escena principal usando `scene.launch()`, permitiendo que React gestione elementos DOM adicionales si fuera necesario.

---

## 6. Fase Inicial — Scope Mínimo Jugable

Para la primera versión funcional se implementa:

- [ ] **Mapa:** 1 mapa tilemap estático (20×15 tiles), con colisiones básicas
- [ ] **Jugador:** Sprite placeholder, movimiento en 4 direcciones
- [ ] **1 NPC:** Sprite placeholder, posición fija, diálogo pre-combate
- [ ] **Combate:** 4 movimientos para el jugador, 2 para el enemigo, IA aleatoria
- [ ] **Resultado:** Label de victoria/derrota sobre el NPC post-combate
- [ ] **Huida:** Funcional con probabilidad simple

**Fuera de scope inicial:**
- Múltiples mapas / transiciones entre mapas
- Objetos / inventario
- Múltiples NPCs
- Efectos de estado (veneno, parálisis, etc.)
- Sonido / música
- Assets finales pixel art

---

## 7. Convenciones de Assets (para cuando se añadan)

| Asset | Formato | Tamaño tile | Notas |
|---|---|---|---|
| Tileset del mapa | PNG spritesheet | 16×16 px | Exportar desde Tiled |
| Sprite jugador | PNG spritesheet | 16×32 px | 4 dirs × 4 frames de walk + 1 idle |
| Sprite NPC | PNG spritesheet | 16×32 px | Igual que jugador |
| Sprite batalla (frente) | PNG | 96×96 px | Vista frontal del enemigo en batalla |
| Sprite batalla (espalda) | PNG | 96×96 px | Vista trasera del jugador en batalla |
| Fondo de batalla | PNG | 480×270 px | Resolución base del juego |
