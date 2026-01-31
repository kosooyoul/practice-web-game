/**
 * GameScene - Main game scene with player and platforms
 */
import { Camera } from '../core/Camera.js';
import { MapLoader } from '../core/MapLoader.js';
import { TransitionManager, TRANSITION_TYPE } from '../core/TransitionManager.js';
import { PhysicsWorld } from '../physics/PhysicsWorld.js';
import { detectGroundCollision, detectBoxCollision, CollisionSide } from '../physics/Collision.js';
import { Player } from '../entities/Player.js';
import { Platform } from '../entities/Platform.js';
import { BOUNDARY_TYPE } from '../config/constants.js';
import { getMap } from '../maps/index.js';

export class GameScene {
  _game = null;
  _camera = null;
  _mapLoader = null;
  _transitionManager = null;
  _physicsWorld = null;
  _player = null;
  _platforms = [];
  _lockedJumpAt = null;

  // Current map data cache
  _mapBounds = null;
  _groundY = 100;

  // Transition state
  _pendingExit = null;
  _nextMapData = null;
  _nextPlatforms = [];

  constructor() {
    this._camera = new Camera();
    this._mapLoader = new MapLoader();
    this._transitionManager = new TransitionManager();
    this._physicsWorld = new PhysicsWorld();
    this._player = new Player();
  }

  get camera() {
    return this._camera;
  }

  get mapLoader() {
    return this._mapLoader;
  }

  get currentMapId() {
    return this._mapLoader.currentMapId;
  }

  /**
   * Set game reference
   * @param {Game} game
   */
  setGame(game) {
    this._game = game;

    // Load first stage
    this.loadStage('stage1');

    // Set camera to follow player
    this._camera.setTarget(this._player);
  }

  /**
   * Load a stage by ID
   * @param {string} stageId
   * @returns {boolean} Success
   */
  loadStage(stageId) {
    const mapData = this._mapLoader.loadMap(stageId);

    if (!mapData) {
      console.error(`[GameScene] Failed to load stage: ${stageId}`);
      return false;
    }

    // Cache map data for quick access
    this._mapBounds = this._mapLoader.getMapBounds();
    this._groundY = this._mapLoader.getGroundY();

    // Create platforms from map data
    this._platforms = this._mapLoader.getPlatforms().map(
      (platform) => new Platform(platform.x, platform.y, platform.width, platform.height)
    );

    // Apply camera settings from map
    const cameraSettings = this._mapLoader.getCameraSettings();
    this._camera.setSmoothing(cameraSettings.smoothing);

    // Configure camera seamless loop
    const seamlessX = this._mapBounds.LEFT === BOUNDARY_TYPE.SEAMLESS || 
                      this._mapBounds.RIGHT === BOUNDARY_TYPE.SEAMLESS;
    const seamlessY = this._mapBounds.TOP === BOUNDARY_TYPE.SEAMLESS || 
                      this._mapBounds.BOTTOM === BOUNDARY_TYPE.SEAMLESS;
    const mapWidth = this._mapBounds.MAX_X - this._mapBounds.MIN_X;
    const mapHeight = this._mapBounds.MAX_Y - this._mapBounds.MIN_Y;
    
    this._camera.setSeamlessLoop(seamlessX, seamlessY, mapWidth, mapHeight);
    this._camera.setBounds({
      minX: this._mapBounds.MIN_X,
      maxX: this._mapBounds.MAX_X,
      minY: this._mapBounds.MIN_Y,
      maxY: this._mapBounds.MAX_Y,
    });

    // Spawn player at map spawn point
    this._spawnPlayer();

    console.log(`[GameScene] Stage loaded: ${mapData.name}`);

    return true;
  }

  /**
   * Load the next stage
   * @returns {boolean} Success
   */
  loadNextStage() {
    const nextMap = this._mapLoader.loadNextStage();

    if (!nextMap) {
      console.log('[GameScene] No next stage - game complete!');
      return false;
    }

    // Reload with new map data
    this._mapBounds = this._mapLoader.getMapBounds();
    this._groundY = this._mapLoader.getGroundY();

    this._platforms = this._mapLoader.getPlatforms().map(
      (platform) => new Platform(platform.x, platform.y, platform.width, platform.height)
    );

    const cameraSettings = this._mapLoader.getCameraSettings();
    this._camera.setSmoothing(cameraSettings.smoothing);

    this._spawnPlayer();

    return true;
  }

  /**
   * Spawn player at map spawn point
   */
  _spawnPlayer() {
    const spawn = this._mapLoader.getSpawnPosition();
    const playerBody = this._player.body;

    playerBody.x = spawn.x;
    playerBody.y = spawn.y;
    playerBody._updateBoundingBox();
    playerBody._clearPendingMove();  // Clear any pending movement

    // Reset physics
    playerBody.physics.speedX = 0;
    playerBody.physics.speedY = 0;
    playerBody.physics.accelerationX = 0;
    playerBody.physics.accelerationY = 0;
    playerBody.physics.jumpedAt = null;
    playerBody.physics.flapped = 0;
    playerBody.physics.leftJumpingPower = 0;

    this._lockedJumpAt = Date.now();

    // Snap camera to new player position
    this._camera.snapToTarget();
  }

  /**
   * Update scene
   * @param {Object} status - Game status {tick, boundary, input}
   */
  update(status) {
    // Update transition if active
    if (this._transitionManager.isActive) {
      const state = this._transitionManager.state;
      
      this._transitionManager.update(this._player.x, this._player.y);
      
      // During transitions, don't update game logic or camera
      // fade: Camera is snapped via snapToTarget()
      // slide: Camera stays fixed while maps slide
      if (state === 'fadeOut' || state === 'fadeHold' || state === 'fadeIn' || state === 'sliding') {
        return;
      }
    }

    const { input } = status;
    const playerBody = this._player.body;

    // Update character animation
    this._player.updateAnimation(input);

    // Apply horizontal movement
    this._physicsWorld.applyHorizontalMovement(playerBody, input, this._mapBounds);

    // Apply vertical movement (jumping/falling)
    const verticalResult = this._physicsWorld.applyVerticalMovement(
      playerBody,
      input,
      this._lockedJumpAt,
      this._mapBounds
    );
    this._lockedJumpAt = verticalResult.lockedJumpAt;

    // Check ground collision
    this._handleGroundCollision();

    // Check platform collisions
    this._handlePlatformCollisions();

    // Apply movement
    playerBody.applyMove();

    // Check if player needs respawn based on boundary settings
    const respawnCheck = this._physicsWorld.checkBoundaryRespawn(playerBody, this._mapBounds);
    if (respawnCheck.needsRespawn) {
      this._spawnPlayer();
    }

    // Check if player entered exit zone (only if no transition active)
    if (!this._transitionManager.isActive) {
      this._checkExitZone();
    }

    // Update camera to follow player
    this._camera.update();
  }

  /**
   * Check if player is in an exit zone
   */
  _checkExitZone() {
    const playerBody = this._player.body;
    const exits = this._mapLoader.getExits();

    for (const exit of exits) {
      // Check AABB collision
      if (
        playerBody.x < exit.x + exit.width &&
        playerBody.x + playerBody.width > exit.x &&
        playerBody.y - playerBody.height < exit.y + exit.height &&
        playerBody.y > exit.y
      ) {
        this._startTransition(exit);
        return;
      }
    }
  }

  /**
   * Start a transition to another stage
   * @param {Object} exit - Exit zone data
   */
  _startTransition(exit) {
    const transitionType = exit.transition || TRANSITION_TYPE.NONE;
    this._pendingExit = exit;

    switch (transitionType) {
      case TRANSITION_TYPE.FADE:
        this._transitionManager.startFade({
          duration: 600,
          onMidpoint: () => this._onTransitionMidpoint(),
          onComplete: () => this._onTransitionComplete(),
        });
        break;

      case TRANSITION_TYPE.SLIDE:
        // Pre-load next map for rendering during slide
        this._preloadNextMap(exit.targetStage);
        this._transitionManager.startSlide({
          direction: exit.direction,
          duration: 1000,
          currentBounds: this._mapBounds,
          // Slide: load map at complete (not midpoint) to keep current map visible
          onMidpoint: null,
          onComplete: () => this._onSlideComplete(),
        });
        break;

      case TRANSITION_TYPE.SEAMLESS:
        // Pre-load next map for seamless rendering
        this._preloadNextMap(exit.targetStage);
        this._transitionManager.startSeamless({
          direction: exit.direction,
          currentBounds: this._mapBounds,
          threshold: 30,
          onMidpoint: () => this._onTransitionMidpoint(),
          onComplete: () => this._onTransitionComplete(),
        });
        break;

      case TRANSITION_TYPE.WARP:
        // Warp transition - instant with visual feedback (flash)
        this._transitionManager.startFade({
          duration: 200,  // Quick flash
          onMidpoint: () => this._onTransitionMidpoint(),
          onComplete: () => this._onTransitionComplete(),
        });
        break;

      case TRANSITION_TYPE.NONE:
      default:
        // Instant transition
        this._loadStageWithSpawn(exit.targetStage, exit.targetSpawn);
        break;
    }
  }

  /**
   * Pre-load next map for slide/seamless transitions
   * @param {string} stageId
   */
  _preloadNextMap(stageId) {
    this._nextMapData = getMap(stageId);
    if (this._nextMapData) {
      this._nextPlatforms = this._nextMapData.platforms.map(
        (platform) => new Platform(platform.x, platform.y, platform.width, platform.height)
      );
    }
  }

  /**
   * Called at transition midpoint
   */
  _onTransitionMidpoint() {
    if (!this._pendingExit) {
      return;
    }

    // Load the new stage
    this._loadStageWithSpawn(this._pendingExit.targetStage, this._pendingExit.targetSpawn);
  }

  /**
   * Called when transition completes
   */
  _onTransitionComplete() {
    this._pendingExit = null;
    this._nextMapData = null;
    this._nextPlatforms = [];

    // Ensure camera is properly positioned after transition
    this._camera.snapToTarget();
  }

  /**
   * Called when slide transition completes
   * Loads the new map at completion (not midpoint) to keep current map visible during slide
   */
  _onSlideComplete() {
    if (this._pendingExit) {
      this._loadStageWithSpawn(this._pendingExit.targetStage, this._pendingExit.targetSpawn);
    }
    this._onTransitionComplete();
  }

  /**
   * Load stage with custom spawn position
   * @param {string} stageId
   * @param {Object} customSpawn - Optional custom spawn position
   */
  _loadStageWithSpawn(stageId, customSpawn = null) {
    const mapData = this._mapLoader.loadMap(stageId);

    if (!mapData) {
      console.error(`[GameScene] Failed to load stage: ${stageId}`);
      return false;
    }

    // Cache map data
    this._mapBounds = this._mapLoader.getMapBounds();
    this._groundY = this._mapLoader.getGroundY();

    // Create platforms
    this._platforms = this._mapLoader.getPlatforms().map(
      (platform) => new Platform(platform.x, platform.y, platform.width, platform.height)
    );

    // Apply camera settings
    const cameraSettings = this._mapLoader.getCameraSettings();
    this._camera.setSmoothing(cameraSettings.smoothing);

    // Configure seamless loop
    const seamlessX = this._mapBounds.LEFT === BOUNDARY_TYPE.SEAMLESS || 
                      this._mapBounds.RIGHT === BOUNDARY_TYPE.SEAMLESS;
    const seamlessY = this._mapBounds.TOP === BOUNDARY_TYPE.SEAMLESS || 
                      this._mapBounds.BOTTOM === BOUNDARY_TYPE.SEAMLESS;
    const mapWidth = this._mapBounds.MAX_X - this._mapBounds.MIN_X;
    const mapHeight = this._mapBounds.MAX_Y - this._mapBounds.MIN_Y;
    
    this._camera.setSeamlessLoop(seamlessX, seamlessY, mapWidth, mapHeight);
    this._camera.setBounds({
      minX: this._mapBounds.MIN_X,
      maxX: this._mapBounds.MAX_X,
      minY: this._mapBounds.MIN_Y,
      maxY: this._mapBounds.MAX_Y,
    });

    // Spawn player
    if (customSpawn) {
      this._spawnPlayerAt(customSpawn.x, customSpawn.y);
    } else {
      this._spawnPlayer();
    }

    console.log(`[GameScene] Stage loaded: ${mapData.name}`);
    return true;
  }

  /**
   * Spawn player at specific position
   * @param {number} x
   * @param {number} y
   */
  _spawnPlayerAt(x, y) {
    const playerBody = this._player.body;

    playerBody.x = x;
    playerBody.y = y;
    playerBody._updateBoundingBox();
    playerBody._clearPendingMove();  // Clear any pending movement

    // Reset physics
    playerBody.physics.speedX = 0;
    playerBody.physics.speedY = 0;
    playerBody.physics.accelerationX = 0;
    playerBody.physics.accelerationY = 0;
    playerBody.physics.jumpedAt = null;
    playerBody.physics.flapped = 0;
    playerBody.physics.leftJumpingPower = 0;

    this._lockedJumpAt = Date.now();
    this._camera.snapToTarget();
  }

  /**
   * Render scene
   * @param {CanvasRenderingContext2D} context
   * @param {Object} status - Game status
   */
  render(context, status) {
    // Save context state before camera transform
    context.save();

    // Check if slide transition is active
    const isSliding = this._transitionManager.isActive && 
                      this._transitionManager.shouldRenderNextMap();

    if (isSliding && this._nextMapData) {
      // Slide transition: fixed camera, slide current map out
      this._camera.applyTransform(context);
      
      const currentOffset = this._transitionManager.getCurrentMapOffset();

      // Render current map (slides out)
      context.save();
      context.translate(currentOffset.x, currentOffset.y);
      this._renderWorldWithSeamless(context, status, false, false);
      context.restore();

      // TODO: Render next map (slides in) - temporarily disabled for testing
      // const nextOffset = this._transitionManager.getNextMapOffset();
      // context.save();
      // context.translate(nextOffset.x, nextOffset.y);
      // this._renderNextMap(context, status);
      // context.restore();
    } else {
      // Normal rendering
      this._camera.applyTransform(context);

      // Check for seamless loop
      const seamlessX = this._mapBounds.LEFT === BOUNDARY_TYPE.SEAMLESS || 
                        this._mapBounds.RIGHT === BOUNDARY_TYPE.SEAMLESS;
      const seamlessY = this._mapBounds.TOP === BOUNDARY_TYPE.SEAMLESS || 
                        this._mapBounds.BOTTOM === BOUNDARY_TYPE.SEAMLESS;

      this._renderWorldWithSeamless(context, status, seamlessX, seamlessY);
    }

    // Restore context state (remove camera transform)
    context.restore();

    // Render UI elements (not affected by camera)
    this._renderUI(context, status);

    // Render transition overlay (fade effect)
    this._transitionManager.render(context, status.boundary);
  }

  /**
   * Render the next map during slide transition
   * @param {CanvasRenderingContext2D} context
   * @param {Object} status
   */
  _renderNextMap(context, status) {

    // Render next map ground
    const nextBounds = this._nextMapData.bounds;
    const nextGroundY = this._nextMapData.groundY;

    context.strokeStyle = '#000000';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(nextBounds.minX, nextGroundY);
    context.lineTo(nextBounds.maxX, nextGroundY);
    context.stroke();
    context.closePath();

    // Render next map boundary
    context.strokeStyle = '#cccccc';
    context.setLineDash([5, 5]);
    context.strokeRect(
      nextBounds.minX,
      nextBounds.minY,
      nextBounds.maxX - nextBounds.minX,
      nextBounds.maxY - nextBounds.minY
    );
    context.setLineDash([]);

    // Render next map platforms
    this._nextPlatforms.forEach((platform) => platform.render(context, status));
  }

  /**
   * Render world elements with seamless loop support
   * @param {CanvasRenderingContext2D} context
   * @param {Object} status
   * @param {boolean} seamlessX
   * @param {boolean} seamlessY
   */
  _renderWorldWithSeamless(context, status, seamlessX, seamlessY) {
    const mapWidth = this._mapBounds.MAX_X - this._mapBounds.MIN_X;
    const mapHeight = this._mapBounds.MAX_Y - this._mapBounds.MIN_Y;

    // Calculate which offsets to render
    const offsetsX = seamlessX ? [-mapWidth, 0, mapWidth] : [0];
    const offsetsY = seamlessY ? [-mapHeight, 0, mapHeight] : [0];

    // Render all offset combinations
    for (const offsetX of offsetsX) {
      for (const offsetY of offsetsY) {
        context.save();
        context.translate(offsetX, offsetY);

        // Render ground
        this._renderGround(context, status, !seamlessX);
        
        // Render exit zones (only in main area)
        if (offsetX === 0 && offsetY === 0) {
          this._renderExitZones(context);
        }

        // Render platforms
        this._platforms.forEach((platform) => platform.render(context, status));

        context.restore();
      }
    }

    // Render player (only once, at actual position)
    this._player.render(context, status);

    // Also render player ghost at wrapped positions for seamless visual
    if (seamlessX || seamlessY) {
      this._renderPlayerGhosts(context, status, seamlessX, seamlessY, mapWidth, mapHeight);
    }
  }

  /**
   * Render player ghosts at wrapped positions for seamless visual
   * @param {CanvasRenderingContext2D} context
   * @param {Object} status
   * @param {boolean} seamlessX
   * @param {boolean} seamlessY
   * @param {number} mapWidth
   * @param {number} mapHeight
   */
  _renderPlayerGhosts(context, status, seamlessX, seamlessY, mapWidth, mapHeight) {
    const playerX = this._player.x;
    const playerY = this._player.y;
    const edgeThreshold = 100; // How close to edge to show ghost

    // Check if player is near edge and render ghosts
    if (seamlessX) {
      const distToLeft = playerX - this._mapBounds.MIN_X;
      const distToRight = this._mapBounds.MAX_X - (playerX + this._player.width);

      if (distToLeft < edgeThreshold) {
        // Near left edge - show ghost on right
        context.save();
        context.translate(mapWidth, 0);
        this._player.render(context, status);
        context.restore();
      }
      if (distToRight < edgeThreshold) {
        // Near right edge - show ghost on left
        context.save();
        context.translate(-mapWidth, 0);
        this._player.render(context, status);
        context.restore();
      }
    }

    if (seamlessY) {
      const distToTop = (playerY - this._player.height) - this._mapBounds.MIN_Y;
      const distToBottom = this._mapBounds.MAX_Y - playerY;

      if (distToTop < edgeThreshold) {
        // Near top edge - show ghost on bottom
        context.save();
        context.translate(0, mapHeight);
        this._player.render(context, status);
        context.restore();
      }
      if (distToBottom < edgeThreshold) {
        // Near bottom edge - show ghost on top
        context.save();
        context.translate(0, -mapHeight);
        this._player.render(context, status);
        context.restore();
      }
    }
  }

  /**
   * Handle ground collision for player
   */
  _handleGroundCollision() {
    const playerBody = this._player.body;
    const collision = detectGroundCollision(playerBody, this._groundY);

    if (collision === CollisionSide.TOP) {
      playerBody.handleGroundLanding(this._groundY);
      this._lockedJumpAt = Date.now();
    }
  }

  /**
   * Handle platform collisions for player
   */
  _handlePlatformCollisions() {
    const playerBody = this._player.body;
    
    // Check for seamless loop
    const seamlessX = this._mapBounds.LEFT === BOUNDARY_TYPE.SEAMLESS || 
                      this._mapBounds.RIGHT === BOUNDARY_TYPE.SEAMLESS;
    const seamlessY = this._mapBounds.TOP === BOUNDARY_TYPE.SEAMLESS || 
                      this._mapBounds.BOTTOM === BOUNDARY_TYPE.SEAMLESS;

    const mapWidth = this._mapBounds.MAX_X - this._mapBounds.MIN_X;
    const mapHeight = this._mapBounds.MAX_Y - this._mapBounds.MIN_Y;

    this._platforms.forEach((platform) => {
      // Check collision with original platform
      this._checkAndHandlePlatformCollision(playerBody, platform.body);

      // For seamless loop, also check wrapped platform positions
      if (seamlessX) {
        // Create virtual platforms at wrapped positions
        this._checkAndHandlePlatformCollision(playerBody, platform.body, -mapWidth, 0);
        this._checkAndHandlePlatformCollision(playerBody, platform.body, mapWidth, 0);
      }

      if (seamlessY) {
        this._checkAndHandlePlatformCollision(playerBody, platform.body, 0, -mapHeight);
        this._checkAndHandlePlatformCollision(playerBody, platform.body, 0, mapHeight);
      }

      if (seamlessX && seamlessY) {
        // Diagonal wraps
        this._checkAndHandlePlatformCollision(playerBody, platform.body, -mapWidth, -mapHeight);
        this._checkAndHandlePlatformCollision(playerBody, platform.body, mapWidth, -mapHeight);
        this._checkAndHandlePlatformCollision(playerBody, platform.body, -mapWidth, mapHeight);
        this._checkAndHandlePlatformCollision(playerBody, platform.body, mapWidth, mapHeight);
      }
    });
  }

  /**
   * Check and handle collision with a platform (with optional offset for seamless)
   * @param {PhysicsBody} playerBody
   * @param {PhysicsBody} platformBody
   * @param {number} offsetX
   * @param {number} offsetY
   */
  _checkAndHandlePlatformCollision(playerBody, platformBody, offsetX = 0, offsetY = 0) {
    // Create a virtual platform body with offset
    const virtualPlatform = {
      x: platformBody.x + offsetX,
      y: platformBody.y + offsetY,
      width: platformBody.width,
      height: platformBody.height,
      left: platformBody.left + offsetX,
      right: platformBody.right + offsetX,
      top: platformBody.top + offsetY,
      bottom: platformBody.bottom + offsetY,
    };

    const collision = detectBoxCollision(playerBody, virtualPlatform);

    switch (collision) {
      case CollisionSide.TOP:
        playerBody.handleBoxTopLanding(virtualPlatform);
        this._lockedJumpAt = Date.now();
        break;

      case CollisionSide.BOTTOM:
        playerBody.handleBoxBottomHit(virtualPlatform);
        break;

      case CollisionSide.LEFT:
        playerBody.handleBoxLeftHit(virtualPlatform);
        break;

      case CollisionSide.RIGHT:
        playerBody.handleBoxRightHit(virtualPlatform);
        break;

      case 'fall':
        playerBody.handleFall();
        break;

      default:
        break;
    }
  }

  /**
   * Render ground line (world space)
   * @param {CanvasRenderingContext2D} context
   * @param {Object} _status
   * @param {boolean} showBoundary - Whether to show boundary markers
   */
  _renderGround(context, _status, showBoundary = true) {
    context.strokeStyle = '#000000';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(this._mapBounds.MIN_X, this._groundY);
    context.lineTo(this._mapBounds.MAX_X, this._groundY);
    context.stroke();
    context.closePath();

    // Render map boundary markers (only if not seamless)
    if (showBoundary) {
      context.strokeStyle = '#cccccc';
      context.setLineDash([5, 5]);
      context.strokeRect(
        this._mapBounds.MIN_X,
        this._mapBounds.MIN_Y,
        this._mapBounds.MAX_X - this._mapBounds.MIN_X,
        this._mapBounds.MAX_Y - this._mapBounds.MIN_Y
      );
      context.setLineDash([]);
    }
  }

  /**
   * Render exit zones (world space)
   * @param {CanvasRenderingContext2D} context
   */
  _renderExitZones(context) {
    const exits = this._mapLoader.getExits();

    context.fillStyle = 'rgba(0, 200, 100, 0.3)';
    context.strokeStyle = 'rgba(0, 150, 75, 0.8)';
    context.lineWidth = 2;

    exits.forEach((exit) => {
      context.fillRect(exit.x, exit.y, exit.width, exit.height);
      context.strokeRect(exit.x, exit.y, exit.width, exit.height);
    });
  }

  /**
   * Render UI elements (screen space, not affected by camera)
   * @param {CanvasRenderingContext2D} context
   * @param {Object} status
   */
  _renderUI(context, status) {
    const { boundary } = status;
    const currentMap = this._mapLoader.currentMap;

    // Stage name (top center)
    context.font = '18px sans-serif';
    context.fillStyle = '#000000';
    context.textAlign = 'center';
    context.textBaseline = 'top';
    context.fillText(currentMap?.name || 'Andante', 0, boundary.top + 20);

    // Stage description (below name)
    if (currentMap?.description) {
      context.font = '12px sans-serif';
      context.fillStyle = '#666666';
      context.fillText(currentMap.description, 0, boundary.top + 42);
    }

    // Controls hint (bottom center)
    context.font = '14px sans-serif';
    context.fillStyle = '#666666';
    context.fillText('Arrow Keys / Touch to Move | Space / Touch Right to Jump', 0, boundary.bottom - 30);

    // Debug info (top left)
    context.font = '12px monospace';
    context.fillStyle = '#999999';
    context.textAlign = 'left';
    context.fillText(
      `Stage: ${this._mapLoader.currentMapId}`,
      boundary.left + 10,
      boundary.top + 10
    );
    context.fillText(
      `Player: (${Math.round(this._player.x)}, ${Math.round(this._player.y)})`,
      boundary.left + 10,
      boundary.top + 24
    );
  }
}
