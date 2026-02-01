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
import { Item } from '../entities/Item.js';
import { BackgroundLayer } from '../background/BackgroundLayer.js';
import { BOUNDARY_TYPE } from '../config/constants.js';
import { getMap } from '../maps/index.js';

export class GameScene {
  _game = null;
  _camera = null;
  _mapLoader = null;
  _transitionManager = null;
  _physicsWorld = null;
  _backgroundLayer = null;
  _player = null;
  _platforms = [];
  _items = [];
  _lockedJumpAt = null;

  // Player stats
  _cellCount = 0;
  _seedCount = 0;

  // Current map data cache
  _mapBounds = null;
  _groundY = 100;

  // Transition state
  _pendingExit = null;
  _transitionPlayerPos = null;  // Player position at transition start
  _nextMapData = null;
  _nextPlatforms = [];

  constructor() {
    this._camera = new Camera();
    this._mapLoader = new MapLoader();
    this._transitionManager = new TransitionManager();
    this._physicsWorld = new PhysicsWorld();
    this._backgroundLayer = new BackgroundLayer();
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

  get cellCount() {
    return this._cellCount;
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

    // Create items from map data
    this._items = this._createItemsFromMapData(mapData);

    // Check seamless settings
    const seamlessX = this._mapBounds.LEFT === BOUNDARY_TYPE.SEAMLESS || 
                      this._mapBounds.RIGHT === BOUNDARY_TYPE.SEAMLESS;
    const seamlessY = this._mapBounds.TOP === BOUNDARY_TYPE.SEAMLESS || 
                      this._mapBounds.BOTTOM === BOUNDARY_TYPE.SEAMLESS;

    // Initialize background with platforms for surface placement
    // mapId is used as seed for consistent random generation
    this._backgroundLayer.init(
      mapData.background,
      this._mapBounds,
      mapData.platforms || [],
      this._groundY,
      mapData.id,
      seamlessX,
      seamlessY
    );

    // Apply camera settings from map
    const cameraSettings = this._mapLoader.getCameraSettings();
    this._camera.setSmoothing(cameraSettings.smoothing);

    // Configure camera seamless loop (reuse seamlessX/Y from above)
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
   * Create item instances from map data
   * @param {Object} mapData - Full map data
   * @returns {Array<Item>}
   */
  _createItemsFromMapData(mapData) {
    const items = [];

    // Create items from map data (data-driven)
    if (mapData.items) {
      for (const itemData of mapData.items) {
        items.push(new Item(itemData.type, itemData.x, itemData.y));
      }
    }

    // Generate random cells if specified
    if (mapData.cellSpawn) {
      const randomCells = this._generateRandomCells(mapData);
      items.push(...randomCells);
    }

    return items;
  }

  /**
   * Generate random cell positions based on platforms and ground
   * @param {Object} mapData
   * @returns {Array<Item>}
   */
  _generateRandomCells(mapData) {
    const { cellSpawn, platforms, bounds, groundY } = mapData;
    const count = cellSpawn.count || 5;
    const itemType = cellSpawn.type || 'cell';
    const cells = [];

    // Collect spawn areas: platforms + ground segments
    const spawnAreas = [];

    // Add platforms as spawn areas
    for (const platform of platforms) {
      spawnAreas.push({
        minX: platform.x,
        maxX: platform.x + platform.width,
        y: platform.y - platform.height,  // Top of platform
      });
    }

    // Add ground segments between platforms
    const groundSegments = this._findGroundSegments(mapData);
    for (const segment of groundSegments) {
      spawnAreas.push({
        minX: segment.minX,
        maxX: segment.maxX,
        y: groundY,
      });
    }

    // Generate random cells on spawn areas
    const usedPositions = [];
    const minDistance = 50;  // Minimum distance between cells

    for (let i = 0; i < count && spawnAreas.length > 0; i++) {
      // Pick random spawn area
      const areaIndex = Math.floor(Math.random() * spawnAreas.length);
      const area = spawnAreas[areaIndex];

      // Try to find valid position
      let attempts = 0;
      let validPosition = null;

      while (attempts < 10 && !validPosition) {
        const x = area.minX + Math.random() * (area.maxX - area.minX - 24);
        const y = area.y;

        // Check minimum distance from other cells
        const isFarEnough = usedPositions.every(
          (pos) => Math.hypot(pos.x - x, pos.y - y) >= minDistance
        );

        if (isFarEnough) {
          validPosition = { x, y };
        }
        attempts++;
      }

      if (validPosition) {
        cells.push(new Item(itemType, validPosition.x, validPosition.y));
        usedPositions.push(validPosition);
      }
    }

    return cells;
  }

  /**
   * Find ground segments not blocked by platforms
   * @param {Object} mapData
   * @returns {Array<{minX, maxX}>}
   */
  _findGroundSegments(mapData) {
    const { platforms, bounds, groundY } = mapData;
    const segments = [];

    // Get platforms that touch ground level
    const groundPlatforms = platforms
      .filter((p) => p.y >= groundY && p.y - p.height <= groundY)
      .map((p) => ({ minX: p.x, maxX: p.x + p.width }))
      .sort((a, b) => a.minX - b.minX);

    // Find gaps between platforms
    let currentX = bounds.minX;

    for (const platform of groundPlatforms) {
      if (platform.minX > currentX + 50) {
        segments.push({ minX: currentX, maxX: platform.minX });
      }
      currentX = Math.max(currentX, platform.maxX);
    }

    // Add final segment
    if (bounds.maxX > currentX + 50) {
      segments.push({ minX: currentX, maxX: bounds.maxX });
    }

    return segments;
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

    // Create items from map data
    this._items = this._createItemsFromMapData(nextMap);

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

    // Snap previous position to prevent interpolation glitches after teleport
    playerBody.snapPreviousPosition();

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

    // Update items and check collection
    this._updateItems(status);

    // Update background animations (pass deltaTime)
    this._backgroundLayer.update(status.deltaTime);

    // Update camera to follow player (pass deltaTime)
    this._camera.update(status.deltaTime);
  }

  /**
   * Update items and check for collection
   * @param {Object} status
   */
  _updateItems(status) {
    for (const item of this._items) {
      if (item.collected) {
        continue;
      }

      // Update item animation
      item.update(status);

      // Check collision with player
      if (item.checkCollision(this._player)) {
        const effect = item.collect();
        this._applyItemEffect(effect);
      }
    }
  }

  /**
   * Apply item effect to player/game state
   * @param {Object} effect
   */
  _applyItemEffect(effect) {
    switch (effect.type) {
      case 'currency':
        // Handle currency items (cell, seed, etc.)
        if (effect.key === 'cell') {
          this._cellCount += effect.value;
          console.log(`[GameScene] Cell collected! Total: ${this._cellCount}`);
        } else if (effect.key === 'seed') {
          this._seedCount += effect.value;
          console.log(`[GameScene] Seed collected! Total: ${this._seedCount}`);
        }
        // Add more currency types here as needed
        break;
      case 'heal':
        // Future: health restoration
        console.log(`[GameScene] Heal: +${effect.value}`);
        break;
      default:
        console.warn(`[GameScene] Unknown item effect: ${effect.type}`);
    }
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
        // Save player position at slide start
        this._transitionPlayerPos = { x: this._player.x, y: this._player.y };
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
    this._transitionPlayerPos = null;
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

    this._pendingExit = null;
    this._transitionPlayerPos = null;
    this._nextMapData = null;
    this._nextPlatforms = [];

    // Camera snaps to new player position (targetSpawn)
    this._camera.snapToTarget();
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

    // Create items from map data
    this._items = this._createItemsFromMapData(mapData);

    // Check seamless settings
    const seamlessX = this._mapBounds.LEFT === BOUNDARY_TYPE.SEAMLESS || 
                      this._mapBounds.RIGHT === BOUNDARY_TYPE.SEAMLESS;
    const seamlessY = this._mapBounds.TOP === BOUNDARY_TYPE.SEAMLESS || 
                      this._mapBounds.BOTTOM === BOUNDARY_TYPE.SEAMLESS;

    // Initialize background with platforms for surface placement
    // mapId is used as seed for consistent random generation
    this._backgroundLayer.init(
      mapData.background,
      this._mapBounds,
      mapData.platforms || [],
      this._groundY,
      mapData.id,
      seamlessX,
      seamlessY
    );

    // Apply camera settings
    const cameraSettings = this._mapLoader.getCameraSettings();
    this._camera.setSmoothing(cameraSettings.smoothing);
    this._camera.setOffset(cameraSettings.offsetX, cameraSettings.offsetY);

    // Configure seamless loop (reuse seamlessX/Y from above)
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

    // Snap previous position to prevent interpolation glitches after teleport
    playerBody.snapPreviousPosition();

    this._lockedJumpAt = Date.now();
    this._camera.snapToTarget();
  }

  /**
   * Render scene
   * @param {CanvasRenderingContext2D} context
   * @param {Object} status - Game status
   */
  render(context, status) {
    const { boundary } = status;
    const viewport = {
      left: boundary.left,
      right: boundary.right,
      top: boundary.top,
      bottom: boundary.bottom,
    };

    // Render skybox (sky + far layer with parallax) - screen-fixed
    this._backgroundLayer.renderSkybox(context, this._camera, viewport);

    // Save context state before camera transform
    context.save();

    // Check if slide transition is active
    const isSliding = this._transitionManager.isActive && 
                      this._transitionManager.shouldRenderNextMap();

    if (isSliding && this._nextMapData && this._pendingExit) {
      // Slide transition: fixed camera, slide both maps, player stays fixed
      this._camera.applyTransform(context);
      
      const currentOffset = this._transitionManager.getCurrentMapOffset();
      const nextOffset = this._transitionManager.getNextMapOffset();

      // Calculate coordinate transform for next map
      // Use saved player position from slide start for consistency
      const playerPos = this._transitionPlayerPos || { x: this._player.x, y: this._player.y };
      const targetSpawn = this._pendingExit.targetSpawn || { x: 0, y: 0 };
      
      // Account for camera offset difference between maps
      const currentCameraOffset = this._mapLoader.getCameraSettings();
      const nextCameraOffset = this._nextMapData.camera || { offsetX: 0, offsetY: -50 };
      const cameraOffsetDiffX = (nextCameraOffset.offsetX || 0) - (currentCameraOffset.offsetX || 0);
      const cameraOffsetDiffY = (nextCameraOffset.offsetY || -50) - (currentCameraOffset.offsetY || -50);
      
      const mapAlignX = playerPos.x - targetSpawn.x + cameraOffsetDiffX;
      const mapAlignY = playerPos.y - targetSpawn.y + cameraOffsetDiffY;

      // Render current map without player (slides out)
      context.save();
      context.translate(currentOffset.x, currentOffset.y);
      this._renderWorldWithSeamless(context, status, false, false, false);
      context.restore();

      // Render next map (slides in)
      context.save();
      context.translate(nextOffset.x + mapAlignX, nextOffset.y + mapAlignY);
      this._renderNextMap(context, status);
      context.restore();

      // Render player at fixed position (no offset)
      this._player.render(context, status);

      // Render map foreground during slide
      this._backgroundLayer.renderMapForeground(context, status);
    } else {
      // Normal rendering with interpolation for smooth high-FPS
      const interpolation = status.interpolation ?? 1;
      this._camera.applyTransform(context, interpolation);

      // Check for seamless loop
      const seamlessX = this._mapBounds.LEFT === BOUNDARY_TYPE.SEAMLESS || 
                        this._mapBounds.RIGHT === BOUNDARY_TYPE.SEAMLESS;
      const seamlessY = this._mapBounds.TOP === BOUNDARY_TYPE.SEAMLESS || 
                        this._mapBounds.BOTTOM === BOUNDARY_TYPE.SEAMLESS;

      this._renderWorldWithSeamless(context, status, seamlessX, seamlessY);

      // Render map foreground (grass, flowers, effects - after player)
      this._backgroundLayer.renderMapForeground(context, status);
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
   * @param {boolean} renderPlayer - Whether to render player (default: true)
   */
  _renderWorldWithSeamless(context, status, seamlessX, seamlessY, renderPlayer = true) {
    const mapWidth = this._mapBounds.MAX_X - this._mapBounds.MIN_X;
    const mapHeight = this._mapBounds.MAX_Y - this._mapBounds.MIN_Y;

    // Calculate which offsets to render
    const offsetsX = seamlessX ? [-mapWidth, 0, mapWidth] : [0];
    const offsetsY = seamlessY ? [-mapHeight, 0, mapHeight] : [0];

    // Render map background (trees, bushes - behind platforms)
    this._backgroundLayer.renderMapBackground(context, status);

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

        // Render items
        this._items.forEach((item) => item.render(context, status));

        context.restore();
      }
    }

    // Render player (only once, at actual position)
    if (renderPlayer) {
      this._player.render(context, status);

      // Also render player ghost at wrapped positions for seamless visual
      if (seamlessX || seamlessY) {
        this._renderPlayerGhosts(context, status, seamlessX, seamlessY, mapWidth, mapHeight);
      }
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
    // Use interpolated position for smooth ghost rendering
    const alpha = status?.interpolation ?? 1;
    const { x: playerX, y: playerY } = this._player.getInterpolatedPosition(alpha);
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

    // FPS display (from GameLoop)
    const fps = status.fps || 0;
    context.fillStyle = fps < 30 ? '#FF0000' : fps < 50 ? '#FFAA00' : '#00AA00';
    context.fillText(
      `FPS: ${fps}`,
      boundary.left + 10,
      boundary.top + 38
    );

    // Item count display (top right) - with icons
    this._renderItemUI(context, boundary);
  }

  /**
   * Render inventory bar at bottom
   * @param {CanvasRenderingContext2D} context
   * @param {Object} boundary
   */
  _renderItemUI(context, boundary) {
    // Increment animation time for icon effects
    this._uiAnimationTime = (this._uiAnimationTime || 0) + 0.016;

    // Inventory config
    const slotSize = 40;
    const slotGap = 8;
    const slotPadding = 6;
    const cornerRadius = 6;

    // Items to display in inventory
    const items = [
      { type: 'cell', count: this._cellCount, color: '#3C8CDC' },
      { type: 'seed', count: this._seedCount, color: '#8B6914' },
    ];

    // Calculate total width
    const totalWidth = items.length * slotSize + (items.length - 1) * slotGap;
    const startX = -totalWidth / 2;
    const bottomY = boundary.bottom - 60;

    // Draw inventory background bar
    context.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this._roundRect(
      context,
      startX - slotPadding,
      bottomY - slotPadding,
      totalWidth + slotPadding * 2,
      slotSize + slotPadding * 2,
      cornerRadius + 2
    );
    context.fill();

    // Draw each slot
    items.forEach((item, index) => {
      const slotX = startX + index * (slotSize + slotGap);
      const slotY = bottomY;

      // Slot background
      context.fillStyle = 'rgba(255, 255, 255, 0.15)';
      this._roundRect(context, slotX, slotY, slotSize, slotSize, cornerRadius);
      context.fill();

      // Slot border
      context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      context.lineWidth = 1;
      this._roundRect(context, slotX, slotY, slotSize, slotSize, cornerRadius);
      context.stroke();

      // Item icon (centered in slot)
      const iconCenterX = slotX + slotSize / 2;
      const iconCenterY = slotY + slotSize / 2 - 2;
      Item.renderIcon(context, item.type, iconCenterX, iconCenterY, 0.8, this._uiAnimationTime);

      // Count badge (bottom right corner)
      if (item.count > 0) {
        const badgeX = slotX + slotSize - 4;
        const badgeY = slotY + slotSize - 4;

        // Badge background
        context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        context.beginPath();
        context.arc(badgeX, badgeY, 9, 0, Math.PI * 2);
        context.fill();

        // Count text
        context.font = 'bold 11px sans-serif';
        context.fillStyle = '#FFFFFF';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(`${item.count}`, badgeX, badgeY);
      }
    });
  }

  /**
   * Draw rounded rectangle path
   */
  _roundRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
  }

}
