/**
 * BGMManager - Background Music Manager with fade in/out support
 */

// BGM registry - map bgm ID to file path
const BGM_PATHS = {
  floatinggarden: './rsc/bgm/floatinggarden.mp3',
};

// Default settings
const DEFAULT_VOLUME = 0.5;
const DEFAULT_FADE_DURATION = 500; // milliseconds

export class BGMManager {
  _audio = null;
  _currentBgmId = null;
  _targetVolume = DEFAULT_VOLUME;
  _isFading = false;
  _fadeStartTime = 0;
  _fadeStartVolume = 0;
  _fadeTargetVolume = 0;
  _fadeDuration = DEFAULT_FADE_DURATION;
  _fadeCallback = null;
  _pendingBgmId = null;
  _isInitialized = false;

  constructor() {
    this._audio = new Audio();
    this._audio.loop = true;
    this._audio.volume = 0;
  }

  /**
   * Get current BGM ID
   * @returns {string|null}
   */
  get currentBgmId() {
    return this._currentBgmId;
  }

  /**
   * Check if audio is playing
   * @returns {boolean}
   */
  get isPlaying() {
    return !this._audio.paused;
  }

  /**
   * Check if fading is in progress
   * @returns {boolean}
   */
  get isFading() {
    return this._isFading;
  }

  /**
   * Initialize audio context (must be called after user interaction)
   */
  init() {
    if (this._isInitialized) {
      return;
    }

    // Create AudioContext for better control (if needed later)
    this._isInitialized = true;
    console.log('[BGMManager] Initialized');
  }

  /**
   * Play BGM by ID with optional fade
   * @param {string} bgmId - BGM identifier
   * @param {Object} options - { fadeIn: boolean, fadeDuration: number }
   */
  play(bgmId, options = {}) {
    if (!bgmId) {
      return;
    }

    const fadeIn = options.fadeIn ?? true;
    const fadeDuration = options.fadeDuration ?? DEFAULT_FADE_DURATION;

    // Same BGM already playing - do nothing
    if (this._currentBgmId === bgmId && this.isPlaying) {
      console.log(`[BGMManager] Already playing: ${bgmId}`);
      return;
    }

    // Get BGM path
    const path = BGM_PATHS[bgmId];
    if (!path) {
      console.warn(`[BGMManager] Unknown BGM ID: ${bgmId}`);
      return;
    }

    // Load and play
    this._audio.src = path;
    this._currentBgmId = bgmId;

    if (fadeIn) {
      this._audio.volume = 0;
      this._audio.play().then(() => {
        this._startFade(0, this._targetVolume, fadeDuration);
      }).catch((error) => {
        console.warn('[BGMManager] Play failed (user interaction required):', error.message);
      });
    } else {
      this._audio.volume = this._targetVolume;
      this._audio.play().catch((error) => {
        console.warn('[BGMManager] Play failed (user interaction required):', error.message);
      });
    }

    console.log(`[BGMManager] Playing: ${bgmId}`);
  }

  /**
   * Stop BGM with optional fade out
   * @param {Object} options - { fadeOut: boolean, fadeDuration: number }
   */
  stop(options = {}) {
    if (!this.isPlaying) {
      return;
    }

    const fadeOut = options.fadeOut ?? true;
    const fadeDuration = options.fadeDuration ?? DEFAULT_FADE_DURATION;

    if (fadeOut) {
      this._startFade(this._audio.volume, 0, fadeDuration, () => {
        this._audio.pause();
        this._audio.currentTime = 0;
        this._currentBgmId = null;
      });
    } else {
      this._audio.pause();
      this._audio.currentTime = 0;
      this._currentBgmId = null;
    }

    console.log('[BGMManager] Stopped');
  }

  /**
   * Change to different BGM with crossfade
   * If same BGM, does nothing
   * @param {string} bgmId - New BGM identifier
   * @param {Object} options - { fadeDuration: number }
   */
  changeTo(bgmId, options = {}) {
    if (!bgmId) {
      this.stop(options);
      return;
    }

    // Same BGM - do nothing (no fade)
    if (this._currentBgmId === bgmId) {
      console.log(`[BGMManager] Same BGM, continuing: ${bgmId}`);
      return;
    }

    const fadeDuration = options.fadeDuration ?? DEFAULT_FADE_DURATION;

    // If currently playing, fade out first then play new
    if (this.isPlaying) {
      this._pendingBgmId = bgmId;
      this._startFade(this._audio.volume, 0, fadeDuration, () => {
        this._audio.pause();
        this._currentBgmId = null;
        this.play(this._pendingBgmId, { fadeIn: true, fadeDuration });
        this._pendingBgmId = null;
      });
    } else {
      // Not playing, just start new BGM with fade in
      this.play(bgmId, { fadeIn: true, fadeDuration });
    }
  }

  /**
   * Fade out current BGM (for transition start)
   * @param {number} duration - Fade duration in milliseconds
   * @param {Function} callback - Called when fade completes
   */
  fadeOut(duration = DEFAULT_FADE_DURATION, callback = null) {
    if (!this.isPlaying) {
      if (callback) {
        callback();
      }
      return;
    }

    this._startFade(this._audio.volume, 0, duration, callback);
  }

  /**
   * Fade in current BGM (for transition end)
   * @param {number} duration - Fade duration in milliseconds
   * @param {Function} callback - Called when fade completes
   */
  fadeIn(duration = DEFAULT_FADE_DURATION, callback = null) {
    if (!this.isPlaying) {
      if (callback) {
        callback();
      }
      return;
    }

    this._startFade(this._audio.volume, this._targetVolume, duration, callback);
  }

  /**
   * Set master volume
   * @param {number} volume - Volume level (0-1)
   */
  setVolume(volume) {
    this._targetVolume = Math.max(0, Math.min(1, volume));
    if (!this._isFading) {
      this._audio.volume = this._targetVolume;
    }
  }

  /**
   * Update fade animation (call every frame)
   */
  update() {
    if (!this._isFading) {
      return;
    }

    const elapsed = Date.now() - this._fadeStartTime;
    const progress = Math.min(elapsed / this._fadeDuration, 1);

    // Ease out for smooth fade
    const eased = 1 - Math.pow(1 - progress, 2);

    // Interpolate volume
    this._audio.volume = this._fadeStartVolume + 
      (this._fadeTargetVolume - this._fadeStartVolume) * eased;

    // Check completion
    if (progress >= 1) {
      this._isFading = false;
      this._audio.volume = this._fadeTargetVolume;

      if (this._fadeCallback) {
        const callback = this._fadeCallback;
        this._fadeCallback = null;
        callback();
      }
    }
  }

  /**
   * Start a fade transition
   * @param {number} fromVolume
   * @param {number} toVolume
   * @param {number} duration
   * @param {Function} callback
   */
  _startFade(fromVolume, toVolume, duration, callback = null) {
    this._isFading = true;
    this._fadeStartTime = Date.now();
    this._fadeStartVolume = fromVolume;
    this._fadeTargetVolume = toVolume;
    this._fadeDuration = duration;
    this._fadeCallback = callback;
  }

  /**
   * Destroy and clean up resources
   */
  destroy() {
    this.stop({ fadeOut: false });
    this._audio = null;
    console.log('[BGMManager] Destroyed');
  }
}

// Singleton instance
let _instance = null;

/**
 * Get BGM Manager singleton instance
 * @returns {BGMManager}
 */
export const getBGMManager = () => {
  if (!_instance) {
    _instance = new BGMManager();
  }
  return _instance;
};
