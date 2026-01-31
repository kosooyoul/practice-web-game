/**
 * Game - Main game controller
 */
import { Canvas } from './Canvas.js';
import { GameLoop } from './GameLoop.js';
import { InputManager } from '../input/InputManager.js';

export class Game {
  _canvas = null;
  _gameLoop = null;
  _inputManager = null;
  _currentScene = null;

  constructor(canvasElement) {
    this._canvas = new Canvas(canvasElement);
    this._gameLoop = new GameLoop();
    this._inputManager = new InputManager(this._canvas);

    this._setupGameLoop();
  }

  get canvas() {
    return this._canvas;
  }

  get input() {
    return this._inputManager;
  }

  /**
   * Set the current scene
   * @param {Object} scene - Scene object with update and render methods
   */
  setScene(scene) {
    this._currentScene = scene;
    if (scene.setGame) {
      scene.setGame(this);
    }
  }

  /**
   * Start the game
   */
  start() {
    console.log('[Game] Start');
    this._gameLoop.start();
  }

  /**
   * Stop the game
   */
  stop() {
    console.log('[Game] Stop');
    this._gameLoop.stop();
  }

  /**
   * Destroy the game and clean up resources
   */
  destroy() {
    console.log('[Game] Destroy');
    this._gameLoop.stop();
    this._inputManager.destroy();
  }

  /**
   * Setup game loop callbacks
   */
  _setupGameLoop() {
    this._gameLoop.setOnUpdate((tick) => {
      this._update(tick);
    });

    this._gameLoop.setOnRender((tick) => {
      this._render(tick);
    });
  }

  /**
   * Update game state
   * @param {number} tick - Current tick count
   */
  _update(tick) {
    // Update canvas dimensions
    this._canvas.updateDimensions();

    // Update input manager
    this._inputManager.update(this._canvas);

    // Build status object
    const status = {
      tick,
      boundary: this._canvas.boundary,
      input: this._inputManager.getStatus(),
    };

    // Update current scene
    if (this._currentScene && this._currentScene.update) {
      this._currentScene.update(status);
    }

    // Update input (for joypad compute)
    this._inputManager.compute(status);
  }

  /**
   * Render game
   * @param {number} tick - Current tick count
   */
  _render(tick) {
    const context = this._canvas.context;

    // Clear and setup transform
    this._canvas.clear();

    // Build status object
    const status = {
      tick,
      boundary: this._canvas.boundary,
      input: this._inputManager.getStatus(),
    };

    // Render current scene
    if (this._currentScene && this._currentScene.render) {
      this._currentScene.render(context, status);
    }

    // Render input (joypad UI)
    this._inputManager.render(context, status);

    // Restore transform
    this._canvas.restore();
  }
}
