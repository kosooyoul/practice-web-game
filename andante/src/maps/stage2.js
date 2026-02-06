/**
 * Stage 2 - Vertical Challenge
 */
import { BOUNDARY_TYPE } from '../config/constants.js';
import { TRANSITION_TYPE, TRANSITION_DIRECTION } from '../core/TransitionManager.js';

export const stage2 = {
  id: 'stage2',
  name: 'Sky Tower',
  description: 'Climb the tower to reach the top!',

  // Background music (same as stage1 - no fade on transition)
  bgm: 'floatinggarden',

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

  // Background settings - high altitude tower in clouds
  background: {
    sky: 'cloudy',
    autoGenerate: {
      mountains: 4,
      fog: 6,
      particles: 20,
    },
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

  // Collectible items - vertical tower climb rewards
  items: [
    // Level 1 - jump up from base
    { type: 'cell', x: 0, y: -50 },    // Midair above center platform

    // Level 2 - jump between left/right
    { type: 'cell', x: -50, y: -150 }, // Jump from -200,-100 to right
    { type: 'cell', x: 50, y: -150 },  // Jump from 100,-100 to left

    // Level 3 - risky drop from level 4
    { type: 'cell', x: -150, y: -250 }, // Fall from -200,-300 to collect

    // Level 4 - jump between sides
    { type: 'cell', x: 20, y: -350 },   // Midair between -200,-300 and 120,-300

    // Level 5 - above platform
    { type: 'cell', x: 0, y: -450 },    // Jump from -80,-400 platform

    // Level 6 - precision jumps
    { type: 'cell', x: -30, y: -550 },  // Between -180,-500 and 120,-500

    // Level 7 - before top
    { type: 'cell', x: 0, y: -650 },    // Jump from -30,-600 upward

    // Top reward - beside exit zone (exit: x:-100~100, y:-800~-750)
    { type: 'cell', x: -150, y: -800 }, // Left of exit, high jump

    // Seeds - special collectibles at key climbing points
    { type: 'seed', x: -150, y: -150 }, // Level 2 left platform
    { type: 'seed', x: 0, y: -350 },    // Mid tower challenge
    { type: 'seed', x: 50, y: -800 },   // Top reward
  ],

  // Trigger zones - interactive areas for item combinations
  triggers: [
    {
      // Potato vine growth - a giant vine growing up the tower
      x: -80,           // Position (on Level 3 platform)
      y: -200,
      width: 60,
      height: 80,
      recipe: 'growVine',
      result: {
        scale: 2.0,
        height: 350,
      },
    },
  ],

  // Stage exit zones (맵 이동 워프)
  exits: [
    {
      x: -100,
      y: -800,
      width: 200,
      height: 50,
      targetStage: 'stage3',
      transition: TRANSITION_TYPE.SLIDE,  // Slide transition to stage3
      direction: TRANSITION_DIRECTION.UP,
      targetSpawn: { x: -700, y: 100 },
    },
  ],

  // 스테이지 종료 트리거 (진입 시 클리어 후 월드맵 복귀) - 발판 위 공중에만
  stageEndZones: [
    { x: -80, y: -750, width: 160, height: 50 },  // 최상단 골 플랫폼( top -780 ) 위 공중
  ],
};
