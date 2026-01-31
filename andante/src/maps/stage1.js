/**
 * Stage 1 - Tutorial / Starting Area
 */
import { BOUNDARY_TYPE } from '../config/constants.js';
import { TRANSITION_TYPE, TRANSITION_DIRECTION } from '../core/TransitionManager.js';

export const stage1 = {
  id: 'stage1',
  name: 'Green Hills',
  description: 'A peaceful starting area to learn the basics.',

  // Player spawn point
  spawn: {
    x: -20,
    y: 100,
  },

  // Map boundaries
  bounds: {
    minX: -400,
    maxX: 600,
    minY: -400,
    maxY: 200,
  },

  // Boundary behaviors
  boundary: {
    left: BOUNDARY_TYPE.BLOCK,
    right: BOUNDARY_TYPE.BLOCK, // Can exit to next stage
    top: BOUNDARY_TYPE.BLOCK,
    bottom: BOUNDARY_TYPE.RESPAWN,
  },

  // Ground level
  groundY: 100,

  // Environment settings (optional overrides)
  environment: {
    gravity: 1,
  },

  // Camera settings (optional overrides)
  camera: {
    smoothing: 0.92,
    offsetX: 0,
    offsetY: -50,
  },

  // Platform data
  platforms: [
    // Starting area
    { x: -300, y: 100, width: 100, height: 100 },
    { x: -25, y: 0, width: 50, height: 50 },

    // Stepping stones
    { x: 100, y: 50, width: 80, height: 20 },
    { x: 220, y: 0, width: 80, height: 20 },
    { x: 340, y: -50, width: 80, height: 20 },

    // Upper path
    { x: -200, y: -100, width: 150, height: 20 },
    { x: 0, y: -150, width: 100, height: 20 },
    { x: 150, y: -200, width: 120, height: 20 },

    // Goal platform (right side)
    { x: 480, y: -100, width: 100, height: 20 },
  ],

  // Stage exit zones
  exits: [
    {
      x: 580,
      y: -100,
      width: 20,
      height: 100,
      targetStage: 'stage2',
      transition: TRANSITION_TYPE.FADE,  // Fade transition to stage2
      direction: TRANSITION_DIRECTION.RIGHT,
      // Player spawn offset in target stage (relative to exit position)
      targetSpawn: { x: -380, y: 100 },
    },
  ],
};
