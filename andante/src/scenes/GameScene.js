/**
 * GameScene - Main game scene with player and platforms
 */
import { Camera } from '../core/Camera.js';
import { MapLoader } from '../core/MapLoader.js';
import { PhysicsWorld } from '../physics/PhysicsWorld.js';
import { detectGroundCollision, detectBoxCollision, CollisionSide } from '../physics/Collision.js';
import { Player } from '../entities/Player.js';
import { Platform } from '../entities/Platform.js';

export class GameScene {
  _game = null;
  _camera = null;
  _mapLoader = null;
  _physicsWorld = null;
  _player = null;
  _platforms = [];
  _lockedJumpAt = null;

  // Current map data cache
  _mapBounds = null;
  _groundY = 100;

  constructor() {
    this._camera = new Camera();
    this._mapLoader = new MapLoader();
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

    // Reset physics
    playerBody.physics.speedX = 0;
    playerBody.physics.speedY = 0;
    playerBody.physics.accelerationX = 0;
    playerBody.physics.accelerationY = 0;
    playerBody.physics.jumpedAt = null;
    playerBody.physics.flapped = 0;
    playerBody.physics.leftJumpingPower = 0;

    this._lockedJumpAt = Date.now();
  }

  /**
   * Update scene
   * @param {Object} status - Game status {tick, boundary, input}
   */
  update(status) {
    const { input } = status;
    const playerBody = this._player.body;

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

    // Check if player entered exit zone
    this._checkExitZone();

    // Update camera to follow player
    this._camera.update();
  }

  /**
   * Check if player is in an exit zone
   */
  _checkExitZone() {
    const playerBody = this._player.body;
    const exitCheck = this._mapLoader.checkExitZone(
      playerBody.x,
      playerBody.y,
      playerBody.width,
      playerBody.height
    );

    if (exitCheck.inExit && exitCheck.targetStage) {
      this.loadStage(exitCheck.targetStage);
    }
  }

  /**
   * Render scene
   * @param {CanvasRenderingContext2D} context
   * @param {Object} status - Game status
   */
  render(context, status) {
    // Save context state before camera transform
    context.save();

    // Apply camera transform
    this._camera.applyTransform(context);

    // Render world elements (affected by camera)
    this._renderGround(context, status);
    this._renderExitZones(context);
    this._player.render(context, status);
    this._platforms.forEach((platform) => platform.render(context, status));

    // Restore context state (remove camera transform)
    context.restore();

    // Render UI elements (not affected by camera)
    this._renderUI(context, status);
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

    this._platforms.forEach((platform) => {
      const collision = detectBoxCollision(playerBody, platform.body);

      switch (collision) {
        case CollisionSide.TOP:
          playerBody.handleBoxTopLanding(platform.body);
          this._lockedJumpAt = Date.now();
          break;

        case CollisionSide.BOTTOM:
          playerBody.handleBoxBottomHit(platform.body);
          break;

        case CollisionSide.LEFT:
          playerBody.handleBoxLeftHit(platform.body);
          break;

        case CollisionSide.RIGHT:
          playerBody.handleBoxRightHit(platform.body);
          break;

        case 'fall':
          playerBody.handleFall();
          break;

        default:
          break;
      }
    });
  }

  /**
   * Render ground line (world space)
   * @param {CanvasRenderingContext2D} context
   * @param {Object} _status
   */
  _renderGround(context, _status) {
    context.strokeStyle = '#000000';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(this._mapBounds.MIN_X, this._groundY);
    context.lineTo(this._mapBounds.MAX_X, this._groundY);
    context.stroke();
    context.closePath();

    // Render map boundary markers (optional visual guide)
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
