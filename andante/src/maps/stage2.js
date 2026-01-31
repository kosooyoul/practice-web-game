/**
 * Stage 2 - Vertical Challenge
 */
import { BOUNDARY_TYPE } from '../config/constants.js';

export const stage2 = {
  id: 'stage2',
  name: 'Sky Tower',
  description: 'Climb the tower to reach the top!',

  // Player spawn point
  spawn: {
    x: -150,
    y: 100,
  },

  // Map boundaries
  bounds: {
    minX: -300,
    maxX: 300,
    minY: -800,
    maxY: 200,
  },

  // Boundary behaviors
  boundary: {
    left: BOUNDARY_TYPE.BLOCK,
    right: BOUNDARY_TYPE.BLOCK,
    top: BOUNDARY_TYPE.NONE, // Can exit to next stage
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
    smoothing: 0.9,
    offsetX: 0,
    offsetY: -80, // Look more upward
  },

  // Platform data - Vertical tower
  platforms: [
    // Base platforms
    { x: -200, y: 100, width: 80, height: 80 },
    { x: 100, y: 100, width: 80, height: 80 },

    // Level 1
    { x: -100, y: 0, width: 200, height: 20 },

    // Level 2
    { x: -200, y: -100, width: 100, height: 20 },
    { x: 100, y: -100, width: 100, height: 20 },

    // Level 3
    { x: -50, y: -200, width: 100, height: 20 },

    // Level 4
    { x: -200, y: -300, width: 80, height: 20 },
    { x: 120, y: -300, width: 80, height: 20 },

    // Level 5
    { x: -80, y: -400, width: 160, height: 20 },

    // Level 6
    { x: -180, y: -500, width: 60, height: 20 },
    { x: 120, y: -500, width: 60, height: 20 },

    // Level 7
    { x: -30, y: -600, width: 60, height: 20 },

    // Top platform (goal)
    { x: -100, y: -750, width: 200, height: 30 },
  ],

  // Stage exit zones
  exits: [
    {
      x: -100,
      y: -800,
      width: 200,
      height: 50,
      targetStage: 'stage3',
    },
  ],
};
