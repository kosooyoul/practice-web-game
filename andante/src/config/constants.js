/**
 * Andante Game - Configuration Constants
 */

// Environment settings
export const ENVIRONMENT = {
  GRAVITY: 1,
  LOOP_X: false, // Disabled for camera system
};

// Camera settings
export const CAMERA = {
  SMOOTHING: 0.92, // 0 = instant, 1 = no movement (0.9~0.95 recommended)
  OFFSET_X: 0, // Horizontal offset from target
  OFFSET_Y: -50, // Vertical offset (negative = camera looks above target)
};

// Map bounds
export const MAP_BOUNDS = {
  MIN_X: -800,
  MAX_X: 800,
  MIN_Y: -500,
  MAX_Y: 200,
};

// Physics defaults
export const PHYSICS = {
  MAX_SPEED_X: 5,
  MOVING_POWER_PER_TICK: 0.02,
  MAX_JUMPING_POWER: 18,
  JUMPING_POWER_PER_TICK: 2.2,
  FLAPPABLE: 1,
  REFLECTION_DECREMENT: 5,
  REFLECTIVITY: 0.2,
  GROUND_RESISTIVITY: 0.18,
  AIR_RESISTIVITY: 0.04,
  GROUND_REFLECTIVITY: 0.08,
  AIR_REFLECTIVITY: 0.15,
};

// Player defaults
export const PLAYER = {
  START_X: -20,
  START_Y: 100,
  WIDTH: 40,
  HEIGHT: 40,
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

// Ground level
export const GROUND_Y = 100;

// Initial platforms (map data)
export const INITIAL_PLATFORMS = [
  // Center area (original)
  { x: 200, y: -100, width: 100, height: 100 },
  { x: -300, y: 100, width: 100, height: 100 },
  { x: -25, y: 0, width: 50, height: 50 },
  { x: -200, y: -180, width: 200, height: 20 },
  { x: -350, y: -250, width: 120, height: 20 },
  { x: 350, y: 50, width: 100, height: 20 },
  { x: 260, y: 10, width: 100, height: 20 },

  // Right side expansion
  { x: 500, y: -50, width: 80, height: 20 },
  { x: 620, y: -120, width: 100, height: 20 },
  { x: 550, y: -200, width: 60, height: 20 },
  { x: 680, y: -280, width: 80, height: 20 },

  // Left side expansion
  { x: -500, y: -100, width: 80, height: 20 },
  { x: -620, y: -180, width: 100, height: 20 },
  { x: -550, y: -280, width: 60, height: 20 },
  { x: -700, y: -350, width: 120, height: 20 },

  // High platforms
  { x: -100, y: -350, width: 200, height: 20 },
  { x: 150, y: -400, width: 100, height: 20 },
];
