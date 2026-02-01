/**
 * GameLoop - Game loop management with fixed timestep
 * 
 * Uses a fixed timestep for physics/logic updates to ensure consistent
 * behavior regardless of frame rate. Rendering happens as fast as possible
 * with interpolation for smooth visuals.
 * 
 * 30fps: 2 physics updates per render
 * 60fps: 1 physics update per render
 * 120fps: 1 physics update per 2 renders (with interpolation)
 */
import { TIMING } from '../config/constants.js';

export class GameLoop {
  _running = false;
  _tick = 0;
  _onUpdate = null;
  _onRender = null;
  
  // Fixed timestep timing
  _lastTime = 0;
  _accumulator = 0;
  _frameTime = 0;
  _interpolation = 0;  // 0-1 value for rendering interpolation

  // Performance tracking
  _fps = 0;
  _frameCount = 0;
  _fpsLastTime = 0;

  constructor() {}

  get tick() {
    return this._tick;
  }

  get isRunning() {
    return this._running;
  }

  get fps() {
    return this._fps;
  }

  /**
   * Get interpolation factor for smooth rendering
   * @returns {number} 0-1 value representing time between physics updates
   */
  get interpolation() {
    return this._interpolation;
  }

  /**
   * Get delta time in seconds for animations (capped to fixed timestep)
   * @returns {number} Delta time in seconds
   */
  get deltaTime() {
    return TIMING.FIXED_TIMESTEP / 1000;
  }

  /**
   * Set update callback (called at fixed timestep for game logic/physics)
   * @param {Function} callback - (tick, deltaTime) => void
   */
  setOnUpdate(callback) {
    this._onUpdate = callback;
  }

  /**
   * Set render callback (called every frame for rendering)
   * @param {Function} callback - (tick, interpolation, deltaTime) => void
   */
  setOnRender(callback) {
    this._onRender = callback;
  }

  /**
   * Start the game loop
   */
  start() {
    if (this._running) {
      return;
    }

    console.log('[GameLoop] Start (Fixed Timestep)');
    this._running = true;
    this._lastTime = performance.now();
    this._fpsLastTime = this._lastTime;
    this._accumulator = 0;
    this._loop();
  }

  /**
   * Stop the game loop
   */
  stop() {
    if (!this._running) {
      return;
    }

    console.log('[GameLoop] Stop');
    this._running = false;
  }

  /**
   * Main loop using requestAnimationFrame with fixed timestep
   */
  _loop() {
    if (!this._running) {
      return;
    }

    window.requestAnimationFrame((currentTime) => {
      // Calculate frame time
      let frameTime = currentTime - this._lastTime;
      this._lastTime = currentTime;

      // Cap frame time to prevent spiral of death
      if (frameTime > TIMING.MAX_DELTA) {
        frameTime = TIMING.MAX_DELTA;
      }

      this._frameTime = frameTime;
      this._accumulator += frameTime;

      // Update FPS counter
      this._frameCount++;
      if (currentTime - this._fpsLastTime >= 1000) {
        this._fps = this._frameCount;
        this._frameCount = 0;
        this._fpsLastTime = currentTime;
      }

      // Fixed timestep updates
      let updateCount = 0;
      while (this._accumulator >= TIMING.FIXED_TIMESTEP && updateCount < TIMING.MAX_UPDATES_PER_FRAME) {
        this._tick++;

        if (this._onUpdate) {
          this._onUpdate(this._tick, TIMING.FIXED_TIMESTEP / 1000);
        }

        this._accumulator -= TIMING.FIXED_TIMESTEP;
        updateCount++;
      }

      // Calculate interpolation factor for smooth rendering
      this._interpolation = this._accumulator / TIMING.FIXED_TIMESTEP;

      // Render
      if (this._onRender) {
        this._onRender(this._tick, this._interpolation, frameTime / 1000);
      }

      if (this._running) {
        this._loop();
      }
    });
  }
}
