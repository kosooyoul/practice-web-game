# Web Game Practice
* Practice to make web game

### Practices
* Move & Jump
  * See https://game.auoi.net/move-and-jump
  * Move left: left arrow key, touch left side and move left
  * Move right: right arrow key, touch left side and move right
  * Jump/Flap: spacebar, touch right side

* Avatar
  * See https://game.auoi.net/avatar
  * Render actor character

* Fall 3D
  * See https://game.auoi.net/fall-3d
  * Fall 3d space
  * Render with THREE.js

* Move 3D
  * See https://game.auoi.net/move-3d
  * Move left: left arrow key, touch left side and move left
  * Move right: right arrow key, touch left side and move right
  * Move up: up arrow key, touch left side and move up
  * Move down: down arrow key, touch left side and move down

* Andante
  * See https://game.auoi.net/andante
  * 2D 플랫폼 게임
  * Pure JavaScript (ES6 Modules) + HTML5 Canvas로 구현

  **조작법:**
  * Move left: left arrow key, touch left side
  * Move right: right arrow key, touch right side  
  * Jump/Flap: spacebar, touch right side

  **주요 기능:**
  * 다중 스테이지 시스템 (stage1, stage2, stage3, stageLoop)
  * 스테이지 전환 효과 (fade, slide, seamless, warp)
  * 물리 엔진 (중력, 점프, 반사, 공중 플랩)
  * 카메라 시스템 (스무딩, 타겟 추적, seamless loop)
  * 다양한 경계 동작 (block, warp, seamless, respawn)

  **구조:**
  * `core/`: 게임 핵심 (Game, GameLoop, Canvas, Camera, MapLoader, TransitionManager)
  * `entities/`: 엔티티 (Player, Platform, Entity)
  * `physics/`: 물리 엔진 (PhysicsWorld, PhysicsBody, Collision)
  * `input/`: 입력 처리 (InputManager, Joypad)
  * `scenes/`: 씬 관리 (GameScene)
  * `maps/`: 맵 데이터 (stage1~3, stageLoop)
  * `config/`: 설정 상수
