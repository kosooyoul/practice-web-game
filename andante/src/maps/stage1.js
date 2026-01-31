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

  // Collectible items - placed for gameplay flow
  items: [
    // Starting area - easy cells on ground
    { type: 'cell', x: -100, y: 100 },

    // Jump from ground to first block - midair reward
    { type: 'cell', x: -25, y: -50 },

    // Stepping stones path - jump between platforms
    { type: 'cell', x: 160, y: 0 },   // Between 100,50 and 220,0
    { type: 'cell', x: 280, y: -50 }, // Between 220,0 and 340,-50

    // Fall from stepping stone - drop to collect
    { type: 'cell', x: 380, y: 20 },  // Below and right of 340,-50

    // Upper path - requires jumping up
    { type: 'cell', x: -130, y: -150 }, // Jump from -200,-100 upward
    { type: 'cell', x: 75, y: -200 },   // Between 0,-150 and 150,-200

    // Goal approach - jump to reach
    { type: 'cell', x: 430, y: -150 },  // Jump before goal platform
    { type: 'cell', x: 530, y: -150 },  // Above goal, jump to get
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
      // Player spawn in target stage (within stage2 bounds: -300 ~ 300)
      targetSpawn: { x: -290, y: 100 },
    },
  ],
};
