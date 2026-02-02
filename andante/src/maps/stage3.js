/**
 * Stage 3 - Wide Open Area
 */
import { BOUNDARY_TYPE } from '../config/constants.js';
import { TRANSITION_TYPE, TRANSITION_DIRECTION } from '../core/TransitionManager.js';

export const stage3 = {
  id: 'stage3',
  name: 'Canyon Run',
  description: 'A wide area with many paths to explore.',

  // Background music (same as other stages - no fade on transition)
  bgm: 'floatinggarden',

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
    left: BOUNDARY_TYPE.BLOCK,
    right: BOUNDARY_TYPE.BLOCK,
    top: BOUNDARY_TYPE.NONE,
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

  // Background settings - wide sunset canyon
  background: {
    sky: 'sunset',
    autoGenerate: {
      mountains: 6,
      trees: 12,
      bushes: 10,
      grass: 30,
      flowers: 8,
      butterflies: 4,
      particles: 12,
    },
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

    // Warp platform (far right top)
    { x: 720, y: -200, width: 60, height: 20 },
  ],

  // Collectible items - exploration rewards across wide area
  items: [
    // Left side climb path
    { type: 'cell', x: -650, y: -100 },  // Jump from -750,0 to -600,-50
    { type: 'cell', x: -620, y: -200 },  // Between -700,-150 and -550,-220
    { type: 'cell', x: -600, y: -370 },  // Jump to reach from -680,-320

    // Center area - ground level drops
    { type: 'cell', x: -120, y: 0 },     // Drop between -200,50 and -50,0
    { type: 'cell', x: 50, y: 0 },       // Drop from -50,0 center

    // Center climb - vertical rewards
    { type: 'cell', x: -75, y: -150 },   // Jump from -150,-100 platform
    { type: 'cell', x: 80, y: -150 },    // Jump from 150,-100 platform
    { type: 'cell', x: 0, y: -250 },     // Between 0,-180 and -80,-300
    { type: 'cell', x: 0, y: -370 },     // Jump to -30,-420 area

    // Right side path
    { type: 'cell', x: 360, y: -30 },    // Jump from 300,0 to 420,-70
    { type: 'cell', x: 450, y: -130 },   // Between 420,-70 and 350,-160
    { type: 'cell', x: 470, y: -280 },   // Between 500,-230 and 400,-330
    { type: 'cell', x: 500, y: -360 },   // Jump to 550,-400

    // Secret areas - high reward
    { type: 'cell', x: -320, y: -450 },  // Above -400,-400 platform
    { type: 'cell', x: 330, y: -500 },   // Above 250,-450 platform

    // Warp approach (exit: x:720~780, y:-250~-200)
    { type: 'cell', x: 680, y: -250 },   // Before warp zone, not inside

    // Seeds - special collectibles across the canyon
    { type: 'seed', x: -650, y: -370 },  // Left side high climb
    { type: 'seed', x: 0, y: -470 },     // Center top platform
    { type: 'seed', x: 580, y: -450 },   // Right side high area
    { type: 'seed', x: -350, y: -450 },  // Secret area left
  ],

  // Exit to stageLoop via warp
  exits: [
    {
      x: 720,
      y: -250,
      width: 60,
      height: 50,
      targetStage: 'stageLoop',
      transition: TRANSITION_TYPE.WARP,
      direction: TRANSITION_DIRECTION.RIGHT,
      targetSpawn: { x: 0, y: 100 },
    },
  ],
};
