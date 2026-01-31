/**
 * GameLoop - Game loop management with fixed timestep
 */
export class GameLoop {
  _running = false;
  _tick = 0;
  _onUpdate = null;
  _onRender = null;

  constructor() {}

  get tick() {
    return this._tick;
  }

  get isRunning() {
    return this._running;
  }

  /**
   * Set update callback (called every frame for game logic)
   * @param {Function} callback
   */
  setOnUpdate(callback) {
    this._onUpdate = callback;
  }

  /**
   * Set render callback (called every frame for rendering)
   * @param {Function} callback
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

    console.log('[GameLoop] Start');
    this._running = true;
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
   * Main loop using requestAnimationFrame
   */
  _loop() {
    if (!this._running) {
      return;
    }

    window.requestAnimationFrame(() => {
      this._tick++;

      if (this._onUpdate) {
        this._onUpdate(this._tick);
      }

      if (this._onRender) {
        this._onRender(this._tick);
      }

      if (this._running) {
        this._loop();
      }
    });
  }
}
