/**
 * Andante Game - Configuration Constants
 */

// Default environment settings
export const ENVIRONMENT = {
  GRAVITY: 1,
};

// Default camera settings
export const CAMERA = {
  SMOOTHING: 0.92, // 0 = instant, 1 = no movement (0.9~0.95 recommended)
  OFFSET_X: 0, // Horizontal offset from target
  OFFSET_Y: -50, // Vertical offset (negative = camera looks above target)
};

/**
 * Boundary behavior types:
 * - 'block': Stop at boundary (can't pass)
 * - 'warp': Wrap to opposite side (instant teleport, camera jumps)
 * - 'seamless': Seamless loop (map repeats infinitely, no visual break)
 * - 'respawn': Respawn player at start position
 * - 'none': No restriction (can go beyond)
 */
export const BOUNDARY_TYPE = {
  BLOCK: 'block',
  WARP: 'warp',
  SEAMLESS: 'seamless',
  RESPAWN: 'respawn',
  NONE: 'none',
};

// Physics defaults
export const PHYSICS = {
  MAX_SPEED_X: 5,
  MOVING_POWER_PER_TICK: 0.02,
  MAX_JUMPING_POWER: 18,
  JUMPING_POWER_PER_TICK: 2.2,
  FLAPPABLE: 10,
  REFLECTION_DECREMENT: 5,
  REFLECTIVITY: 0.2,
  GROUND_RESISTIVITY: 0.18,
  AIR_RESISTIVITY: 0.04,
  GROUND_REFLECTIVITY: 0.08,
  AIR_REFLECTIVITY: 0.15,
};

// Player defaults (sized to match character sprite 30x60)
export const PLAYER = {
  WIDTH: 30,
  HEIGHT: 60,
};

// Input key codes
export const KEY_CODES = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SPACE: 32,
};

// Key names mapping
export const KEY_NAMES = {
  [KEY_CODES.LEFT]: 'left',
  [KEY_CODES.UP]: 'up',
  [KEY_CODES.RIGHT]: 'right',
  [KEY_CODES.DOWN]: 'down',
  [KEY_CODES.SPACE]: 'action',
};
