/**
 * Stage Loop - Seamless Loop Test Stage
 */
import { BOUNDARY_TYPE } from '../config/constants.js';
import { TRANSITION_TYPE, TRANSITION_DIRECTION } from '../core/TransitionManager.js';

export const stageLoop = {
  id: 'stageLoop',
  name: 'Infinite Loop',
  description: 'A seamless looping world - walk forever!',

  // Player spawn point
  spawn: {
    x: 0,
    y: 100,
  },

  // Map boundaries
  bounds: {
    minX: -400,
    maxX: 400,
    minY: -300,
    maxY: 150,
  },

  // Boundary behaviors - seamless on X axis
  boundary: {
    left: BOUNDARY_TYPE.SEAMLESS,
    right: BOUNDARY_TYPE.SEAMLESS,
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

  // Platform data - designed for seamless loop
  platforms: [
    // Ground level platforms (spread across the map)
    { x: -350, y: 50, width: 100, height: 50 },
    { x: -100, y: 50, width: 80, height: 50 },
    { x: 150, y: 50, width: 100, height: 50 },

    // Mid level platforms
    { x: -300, y: -20, width: 80, height: 20 },
    { x: -50, y: -50, width: 100, height: 20 },
    { x: 200, y: -20, width: 80, height: 20 },

    // High platforms
    { x: -200, y: -120, width: 100, height: 20 },
    { x: 100, y: -150, width: 80, height: 20 },
    { x: 300, y: -100, width: 60, height: 20 },

    // Top level - warp platform
    { x: -50, y: -220, width: 100, height: 20 },
  ],

  // Exit to stage1 via warp (from top platform)
  exits: [
    {
      x: -30,
      y: -270,
      width: 60,
      height: 50,
      targetStage: 'stage1',
      transition: TRANSITION_TYPE.WARP,
      direction: TRANSITION_DIRECTION.UP,
      targetSpawn: { x: -20, y: 100 },
    },
  ],
};
