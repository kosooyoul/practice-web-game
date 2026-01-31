/**
 * Stage 3 - Wide Open Area
 */
import { BOUNDARY_TYPE } from '../config/constants.js';

export const stage3 = {
  id: 'stage3',
  name: 'Canyon Run',
  description: 'A wide area with many paths to explore.',

  // Player spawn point
  spawn: {
    x: -700,
    y: 100,
  },

  // Map boundaries
  bounds: {
    minX: -800,
    maxX: 800,
    minY: -500,
    maxY: 200,
  },

  // Boundary behaviors
  boundary: {
    left: BOUNDARY_TYPE.LOOP,
    right: BOUNDARY_TYPE.LOOP,
    top: BOUNDARY_TYPE.BLOCK,
    bottom: BOUNDARY_TYPE.RESPAWN,
  },

  // Ground level
  groundY: 100,

  // Environment settings
  environment: {
    gravity: 1,
  },

  // Camera settings
  camera: {
    smoothing: 0.92,
    offsetX: 0,
    offsetY: -50,
  },

  // Platform data - Expansive level
  platforms: [
    // Left side structures
    { x: -750, y: 0, width: 100, height: 100 },
    { x: -600, y: -50, width: 80, height: 20 },
    { x: -700, y: -150, width: 120, height: 20 },
    { x: -550, y: -220, width: 80, height: 20 },
    { x: -680, y: -320, width: 100, height: 20 },

    // Center area
    { x: -200, y: 50, width: 100, height: 50 },
    { x: -50, y: 0, width: 100, height: 100 },
    { x: 100, y: 50, width: 100, height: 50 },

    // Center upper platforms
    { x: -150, y: -100, width: 80, height: 20 },
    { x: 0, y: -180, width: 100, height: 20 },
    { x: 150, y: -100, width: 80, height: 20 },

    // Center high platform
    { x: -80, y: -300, width: 160, height: 20 },
    { x: -30, y: -420, width: 60, height: 20 },

    // Right side structures
    { x: 300, y: 0, width: 80, height: 20 },
    { x: 420, y: -70, width: 100, height: 20 },
    { x: 350, y: -160, width: 80, height: 20 },
    { x: 500, y: -230, width: 100, height: 20 },
    { x: 400, y: -330, width: 80, height: 20 },
    { x: 550, y: -400, width: 120, height: 20 },

    // Far right
    { x: 650, y: 50, width: 100, height: 50 },
    { x: 700, y: -100, width: 80, height: 20 },

    // Secret high area
    { x: -400, y: -400, width: 150, height: 20 },
    { x: 250, y: -450, width: 150, height: 20 },
  ],

  // No exits - final stage
  exits: [],
};
