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
  _onStageEnd = null;

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
   * 스테이지 종료 트리거 시 콜백 (월드맵 복귀용, StageSelect 진입 시 설정)
   * @param {Function} callback - (currentMapId) => void
   */
  setOnStageEnd(callback) {
    this._onStageEnd = callback;
  }

  /**
   * GameScene에서 스테이지 종료 존 진입 시 호출 → 월드맵 복귀
   * @param {string} currentMapId
   */
  notifyStageEnd(currentMapId) {
    if (this._onStageEnd) {
      this._onStageEnd(currentMapId);
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
   * Get current FPS from game loop
   */
  get fps() {
    return this._gameLoop.fps;
  }

  /**
   * Setup game loop callbacks
   */
  _setupGameLoop() {
    this._gameLoop.setOnUpdate((tick, deltaTime) => {
      this._update(tick, deltaTime);
    });

    this._gameLoop.setOnRender((tick, interpolation, deltaTime) => {
      this._render(tick, interpolation, deltaTime);
    });
  }

  /**
   * Update game state (called at fixed timestep)
   * @param {number} tick - Current tick count
   * @param {number} deltaTime - Delta time in seconds (fixed)
   */
  _update(tick, deltaTime) {
    // Update canvas dimensions
    this._canvas.updateDimensions();

    // Update input manager
    this._inputManager.update(this._canvas);

    // Build status object
    const status = {
      tick,
      deltaTime,
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
   * Render game (called every frame)
   * @param {number} tick - Current tick count
   * @param {number} interpolation - Interpolation factor (0-1)
   * @param {number} deltaTime - Frame delta time in seconds
   */
  _render(tick, interpolation, deltaTime) {
    const context = this._canvas.context;

    // Clear and setup transform
    this._canvas.clear();

    // Build status object
    const status = {
      tick,
      interpolation,
      deltaTime,
      fps: this._gameLoop.fps,
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
