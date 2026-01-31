/**
 * InputManager - Unified input management (keyboard, mouse, touch)
 */
import { Joypad } from './Joypad.js';

export class InputManager {
  _canvas = null;
  _joypad = null;

  _boundHandlers = {};

  constructor(canvas) {
    this._canvas = canvas;
    this._joypad = new Joypad();

    this._setupEventListeners();
  }

  /**
   * Get current input status
   * @returns {Object} Current input status
   */
  getStatus() {
    return this._joypad.getStatus();
  }

  /**
   * Update input manager with current canvas state
   * @param {Canvas} canvas
   */
  update(canvas) {
    this._joypad.setCanvasSize(canvas.width, canvas.height, canvas.scale);
  }

  /**
   * Compute input state
   * @param {Object} status - Game status
   */
  compute(status) {
    this._joypad.compute(status);
  }

  /**
   * Render input UI (joypad)
   * @param {CanvasRenderingContext2D} context
   * @param {Object} status - Game status
   */
  render(context, status) {
    this._joypad.render(context, status);
  }

  /**
   * Destroy and clean up event listeners
   */
  destroy() {
    const canvasElement = this._canvas.element;

    canvasElement.removeEventListener('mousedown', this._boundHandlers.mousedown);
    canvasElement.removeEventListener('mousemove', this._boundHandlers.mousemove);
    canvasElement.removeEventListener('mouseup', this._boundHandlers.mouseup);
    canvasElement.removeEventListener('mouseout', this._boundHandlers.mouseout);
    canvasElement.removeEventListener('mouseleave', this._boundHandlers.mouseleave);
    canvasElement.removeEventListener('touchstart', this._boundHandlers.touchstart);
    canvasElement.removeEventListener('touchmove', this._boundHandlers.touchmove);
    canvasElement.removeEventListener('touchend', this._boundHandlers.touchend);
    document.body.removeEventListener('keydown', this._boundHandlers.keydown);
    document.body.removeEventListener('keyup', this._boundHandlers.keyup);
  }

  /**
   * Setup all event listeners
   */
  _setupEventListeners() {
    const canvasElement = this._canvas.element;

    // Bind handlers to preserve context
    this._boundHandlers = {
      mousedown: (evt) => this._handlePointersDown(evt),
      mousemove: (evt) => this._handlePointersMove(evt),
      mouseup: (evt) => this._handlePointersUp(evt),
      mouseout: (evt) => this._handlePointersUp(evt),
      mouseleave: (evt) => this._handlePointersUp(evt),
      touchstart: (evt) => this._handlePointersDown(evt),
      touchmove: (evt) => this._handlePointersMove(evt),
      touchend: (evt) => this._handlePointersUp(evt),
      keydown: (evt) => this._handleKeyDown(evt),
      keyup: (evt) => this._handleKeyUp(evt),
    };

    // Mouse events
    canvasElement.addEventListener('mousedown', this._boundHandlers.mousedown);
    canvasElement.addEventListener('mousemove', this._boundHandlers.mousemove);
    canvasElement.addEventListener('mouseup', this._boundHandlers.mouseup);
    canvasElement.addEventListener('mouseout', this._boundHandlers.mouseout);
    canvasElement.addEventListener('mouseleave', this._boundHandlers.mouseleave);

    // Touch events
    canvasElement.addEventListener('touchstart', this._boundHandlers.touchstart);
    canvasElement.addEventListener('touchmove', this._boundHandlers.touchmove);
    canvasElement.addEventListener('touchend', this._boundHandlers.touchend);

    // Keyboard events
    document.body.addEventListener('keydown', this._boundHandlers.keydown);
    document.body.addEventListener('keyup', this._boundHandlers.keyup);
  }

  /**
   * Extract pointers from event
   * @param {Event} evt
   * @returns {Array} Array of pointer objects
   */
  _getPointers(evt) {
    const touches = evt.targetTouches ? evt.targetTouches : [evt];
    const pointers = [];

    for (let i = 0; i < touches.length; i++) {
      pointers.push({
        x: touches[i].pageX,
        y: touches[i].pageY,
        id: touches[i].identifier,
      });
    }

    return pointers;
  }

  /**
   * Handle pointer down events
   * @param {Event} evt
   */
  _handlePointersDown(evt) {
    if (evt.type === 'touchstart') {
      evt.preventDefault(); // Prevent double-tap zoom on mobile
    }

    const pointers = this._getPointers(evt);
    this._joypad.handlePointersDown(pointers);
  }

  /**
   * Handle pointer move events
   * @param {Event} evt
   */
  _handlePointersMove(evt) {
    const pointers = this._getPointers(evt);
    this._joypad.handlePointersMove(pointers);
  }

  /**
   * Handle pointer up events
   * @param {Event} evt
   */
  _handlePointersUp(evt) {
    const pointers = this._getPointers(evt);
    this._joypad.handlePointersUp(pointers);
  }

  /**
   * Handle key down events
   * @param {KeyboardEvent} evt
   */
  _handleKeyDown(evt) {
    this._joypad.handleKeyDown(evt.which || evt.keyCode);
  }

  /**
   * Handle key up events
   * @param {KeyboardEvent} evt
   */
  _handleKeyUp(evt) {
    this._joypad.handleKeyUp(evt.which || evt.keyCode);
  }
}
