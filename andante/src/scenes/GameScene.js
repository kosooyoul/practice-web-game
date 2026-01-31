/**
 * GameScene - Main game scene with player and platforms
 */
import { Camera } from '../core/Camera.js';
import { PhysicsWorld } from '../physics/PhysicsWorld.js';
import { detectGroundCollision, detectBoxCollision, CollisionSide } from '../physics/Collision.js';
import { Player } from '../entities/Player.js';
import { Platform } from '../entities/Platform.js';
import { GROUND_Y, INITIAL_PLATFORMS, MAP_BOUNDS } from '../config/constants.js';

export class GameScene {
  _game = null;
  _camera = null;
  _physicsWorld = null;
  _player = null;
  _platforms = [];
  _lockedJumpAt = null;

  constructor() {
    this._camera = new Camera();
    this._physicsWorld = new PhysicsWorld();
    this._player = new Player();
    this._platforms = INITIAL_PLATFORMS.map(
      (platform) => new Platform(platform.x, platform.y, platform.width, platform.height)
    );
  }

  get camera() {
    return this._camera;
  }

  /**
   * Set game reference
   * @param {Game} game
   */
  setGame(game) {
    this._game = game;

    // Set camera to follow player
    this._camera.setTarget(this._player);
  }

  /**
   * Update scene
   * @param {Object} status - Game status {tick, boundary, input}
   */
  update(status) {
    const { input } = status;
    const playerBody = this._player.body;

    // Use map bounds instead of screen boundary for movement
    const mapBoundary = {
      left: MAP_BOUNDS.MIN_X,
      right: MAP_BOUNDS.MAX_X,
      top: MAP_BOUNDS.MIN_Y,
      bottom: MAP_BOUNDS.MAX_Y,
    };

    // Apply horizontal movement
    this._physicsWorld.applyHorizontalMovement(playerBody, input, mapBoundary);

    // Apply vertical movement (jumping/falling)
    this._lockedJumpAt = this._physicsWorld.applyVerticalMovement(playerBody, input, this._lockedJumpAt);

    // Check ground collision
    this._handleGroundCollision();

    // Check platform collisions
    this._handlePlatformCollisions();

    // Apply movement
    playerBody.applyMove();

    // Update camera to follow player
    this._camera.update();
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
    const collision = detectGroundCollision(playerBody, GROUND_Y);

    if (collision === CollisionSide.TOP) {
      playerBody.handleGroundLanding(GROUND_Y);
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
    context.moveTo(MAP_BOUNDS.MIN_X, GROUND_Y);
    context.lineTo(MAP_BOUNDS.MAX_X, GROUND_Y);
    context.stroke();
    context.closePath();

    // Render map boundary markers (optional visual guide)
    context.strokeStyle = '#cccccc';
    context.setLineDash([5, 5]);
    context.strokeRect(
      MAP_BOUNDS.MIN_X,
      MAP_BOUNDS.MIN_Y,
      MAP_BOUNDS.MAX_X - MAP_BOUNDS.MIN_X,
      MAP_BOUNDS.MAX_Y - MAP_BOUNDS.MIN_Y
    );
    context.setLineDash([]);
  }

  /**
   * Render UI elements (screen space, not affected by camera)
   * @param {CanvasRenderingContext2D} context
   * @param {Object} status
   */
  _renderUI(context, status) {
    const { boundary } = status;

    // Title and instructions (top center)
    context.font = '18px sans-serif';
    context.fillStyle = '#000000';
    context.textAlign = 'center';
    context.textBaseline = 'top';
    context.fillText('Andante', 0, boundary.top + 20);

    // Controls hint (bottom center)
    context.font = '14px sans-serif';
    context.fillStyle = '#666666';
    context.fillText('Arrow Keys / Touch to Move | Space / Touch Right to Jump', 0, boundary.bottom - 30);

    // Camera position debug (top left)
    context.font = '12px monospace';
    context.fillStyle = '#999999';
    context.textAlign = 'left';
    context.fillText(
      `Camera: (${Math.round(this._camera.x)}, ${Math.round(this._camera.y)})`,
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
