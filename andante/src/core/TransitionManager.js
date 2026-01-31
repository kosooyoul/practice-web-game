/**
 * TransitionManager - Handle map transition effects
 */

// Transition types
export const TRANSITION_TYPE = {
  NONE: 'none',           // Instant switch (no transition)
  FADE: 'fade',           // Fade out -> load -> fade in
  SLIDE: 'slide',         // Slide to next map
  SEAMLESS: 'seamless',   // Walk seamlessly between connected maps
  WARP: 'warp',           // Quick flash transition (teleport feel)
};

// Transition directions (for slide/seamless)
export const TRANSITION_DIRECTION = {
  LEFT: 'left',
  RIGHT: 'right',
  UP: 'up',
  DOWN: 'down',
};

// Transition states
const STATE = {
  IDLE: 'idle',
  FADE_OUT: 'fadeOut',
  FADE_IN: 'fadeIn',
  SLIDING: 'sliding',
  SEAMLESS: 'seamless',
};

export class TransitionManager {
  _state = STATE.IDLE;
  _type = TRANSITION_TYPE.NONE;
  _direction = TRANSITION_DIRECTION.RIGHT;
  
  _progress = 0;        // 0 to 1
  _duration = 500;      // milliseconds
  _startTime = 0;

  // Fade settings
  _fadeColor = 'rgba(0, 0, 0, 1)';
  _fadeAlpha = 0;

  // Slide/Seamless settings
  _slideOffset = { x: 0, y: 0 };
  _targetOffset = { x: 0, y: 0 };

  // Callbacks
  _onMidpoint = null;   // Called at transition midpoint (for fade) or when threshold crossed (slide/seamless)
  _onComplete = null;   // Called when transition completes

  // Map references for seamless/slide
  _currentMapBounds = null;
  _nextMapBounds = null;
  _nextMapRenderer = null;

  constructor() {}

  get isActive() {
    return this._state !== STATE.IDLE;
  }

  get state() {
    return this._state;
  }

  get progress() {
    return this._progress;
  }

  get slideOffset() {
    return this._slideOffset;
  }

  /**
   * Start a fade transition
   * @param {Object} options - { duration, color, onMidpoint, onComplete }
   */
  startFade(options = {}) {
    this._type = TRANSITION_TYPE.FADE;
    this._state = STATE.FADE_OUT;
    this._duration = options.duration ?? 500;
    this._fadeColor = options.color ?? 'rgba(0, 0, 0, 1)';
    this._onMidpoint = options.onMidpoint ?? null;
    this._onComplete = options.onComplete ?? null;
    this._progress = 0;
    this._fadeAlpha = 0;
    this._startTime = Date.now();
  }

  /**
   * Start a slide transition
   * @param {Object} options - { direction, duration, currentBounds, nextBounds, onMidpoint, onComplete }
   */
  startSlide(options = {}) {
    this._type = TRANSITION_TYPE.SLIDE;
    this._state = STATE.SLIDING;
    this._direction = options.direction ?? TRANSITION_DIRECTION.RIGHT;
    this._duration = options.duration ?? 800;
    this._currentMapBounds = options.currentBounds;
    this._nextMapBounds = options.nextBounds;
    this._onMidpoint = options.onMidpoint ?? null;
    this._onComplete = options.onComplete ?? null;
    this._progress = 0;
    this._startTime = Date.now();
    this._midpointCalled = false;

    // Calculate target offset based on direction
    this._slideOffset = { x: 0, y: 0 };
    this._targetOffset = this._calculateSlideOffset();
  }

  /**
   * Start a seamless transition
   * @param {Object} options - { direction, currentBounds, nextBounds, onMidpoint, onComplete }
   */
  startSeamless(options = {}) {
    this._type = TRANSITION_TYPE.SEAMLESS;
    this._state = STATE.SEAMLESS;
    this._direction = options.direction ?? TRANSITION_DIRECTION.RIGHT;
    this._currentMapBounds = options.currentBounds;
    this._nextMapBounds = options.nextBounds;
    this._onMidpoint = options.onMidpoint ?? null;
    this._onComplete = options.onComplete ?? null;
    this._midpointCalled = false;

    // For seamless, we track player position relative to boundary
    this._seamlessThreshold = options.threshold ?? 50;
  }

  /**
   * Update transition state
   * @param {number} playerX - Player X position (for seamless)
   * @param {number} playerY - Player Y position (for seamless)
   */
  update(playerX = 0, playerY = 0) {
    if (this._state === STATE.IDLE) {
      return;
    }

    const elapsed = Date.now() - this._startTime;

    switch (this._type) {
      case TRANSITION_TYPE.FADE:
        this._updateFade(elapsed);
        break;

      case TRANSITION_TYPE.SLIDE:
        this._updateSlide(elapsed);
        break;

      case TRANSITION_TYPE.SEAMLESS:
        this._updateSeamless(playerX, playerY);
        break;
    }
  }

  /**
   * Render transition overlay
   * @param {CanvasRenderingContext2D} context
   * @param {Object} boundary - Screen boundary
   */
  render(context, boundary) {
    if (this._state === STATE.IDLE) {
      return;
    }

    if (this._type === TRANSITION_TYPE.FADE) {
      this._renderFade(context, boundary);
    }
  }

  /**
   * Get the render offset for current map (for slide/seamless)
   * @returns {{ x: number, y: number }}
   */
  getCurrentMapOffset() {
    if (this._type === TRANSITION_TYPE.SLIDE && this._state === STATE.SLIDING) {
      return { x: -this._slideOffset.x, y: -this._slideOffset.y };
    }
    return { x: 0, y: 0 };
  }

  /**
   * Get the render offset for next map (for slide/seamless)
   * @returns {{ x: number, y: number }}
   */
  getNextMapOffset() {
    if (this._type === TRANSITION_TYPE.SLIDE && this._state === STATE.SLIDING) {
      const target = this._targetOffset;
      return {
        x: target.x - this._slideOffset.x,
        y: target.y - this._slideOffset.y,
      };
    }
    return { x: 0, y: 0 };
  }

  /**
   * Check if we should render the next map
   * @returns {boolean}
   */
  shouldRenderNextMap() {
    return (this._type === TRANSITION_TYPE.SLIDE && this._state === STATE.SLIDING) ||
           (this._type === TRANSITION_TYPE.SEAMLESS && this._state === STATE.SEAMLESS);
  }

  /**
   * Cancel current transition
   */
  cancel() {
    this._state = STATE.IDLE;
    this._progress = 0;
    this._fadeAlpha = 0;
    this._slideOffset = { x: 0, y: 0 };
  }

  // Private methods

  _updateFade(elapsed) {
    const halfDuration = this._duration / 2;

    if (this._state === STATE.FADE_OUT) {
      this._progress = Math.min(elapsed / halfDuration, 1);
      this._fadeAlpha = this._progress;

      if (this._progress >= 1) {
        // Reached midpoint - trigger map load
        if (this._onMidpoint) {
          this._onMidpoint();
        }
        this._state = STATE.FADE_IN;
        this._startTime = Date.now();
      }
    } else if (this._state === STATE.FADE_IN) {
      this._progress = Math.min(elapsed / halfDuration, 1);
      this._fadeAlpha = 1 - this._progress;

      if (this._progress >= 1) {
        // Transition complete
        this._state = STATE.IDLE;
        if (this._onComplete) {
          this._onComplete();
        }
      }
    }
  }

  _updateSlide(elapsed) {
    this._progress = Math.min(elapsed / this._duration, 1);
    
    // Ease out cubic for smooth deceleration
    const eased = 1 - Math.pow(1 - this._progress, 3);
    
    this._slideOffset = {
      x: this._targetOffset.x * eased,
      y: this._targetOffset.y * eased,
    };

    // Trigger midpoint at 50%
    if (!this._midpointCalled && this._progress >= 0.5) {
      this._midpointCalled = true;
      if (this._onMidpoint) {
        this._onMidpoint();
      }
    }

    if (this._progress >= 1) {
      this._state = STATE.IDLE;
      this._slideOffset = { x: 0, y: 0 };
      if (this._onComplete) {
        this._onComplete();
      }
    }
  }

  _updateSeamless(playerX, playerY) {
    if (!this._currentMapBounds) {
      return;
    }

    // Check if player has crossed the threshold into the new map
    let crossed = false;

    switch (this._direction) {
      case TRANSITION_DIRECTION.RIGHT:
        crossed = playerX > this._currentMapBounds.MAX_X - this._seamlessThreshold;
        break;
      case TRANSITION_DIRECTION.LEFT:
        crossed = playerX < this._currentMapBounds.MIN_X + this._seamlessThreshold;
        break;
      case TRANSITION_DIRECTION.UP:
        crossed = playerY - 40 < this._currentMapBounds.MIN_Y + this._seamlessThreshold;
        break;
      case TRANSITION_DIRECTION.DOWN:
        crossed = playerY > this._currentMapBounds.MAX_Y - this._seamlessThreshold;
        break;
    }

    if (crossed && !this._midpointCalled) {
      this._midpointCalled = true;
      if (this._onMidpoint) {
        this._onMidpoint();
      }
      // For seamless, complete immediately after midpoint
      this._state = STATE.IDLE;
      if (this._onComplete) {
        this._onComplete();
      }
    }
  }

  _renderFade(context, boundary) {
    if (this._fadeAlpha <= 0) {
      return;
    }

    context.fillStyle = `rgba(0, 0, 0, ${this._fadeAlpha})`;
    context.fillRect(
      boundary.left,
      boundary.top,
      boundary.right - boundary.left,
      boundary.bottom - boundary.top
    );
  }

  _calculateSlideOffset() {
    if (!this._currentMapBounds) {
      return { x: 0, y: 0 };
    }

    const width = this._currentMapBounds.MAX_X - this._currentMapBounds.MIN_X;
    const height = this._currentMapBounds.MAX_Y - this._currentMapBounds.MIN_Y;

    switch (this._direction) {
      case TRANSITION_DIRECTION.RIGHT:
        return { x: width, y: 0 };
      case TRANSITION_DIRECTION.LEFT:
        return { x: -width, y: 0 };
      case TRANSITION_DIRECTION.UP:
        return { x: 0, y: -height };
      case TRANSITION_DIRECTION.DOWN:
        return { x: 0, y: height };
      default:
        return { x: 0, y: 0 };
    }
  }
}
