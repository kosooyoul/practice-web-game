/**
 * Stage 4
 */
import { BOUNDARY_TYPE } from '../config/constants.js';

export const stage4 = {
  id: 'stage4',
  name: 'Stage 4',
  description: 'Stage 4 area.',

  bgm: 'floatinggarden',

  spawn: { x: -20, y: 100 },

  bounds: {
    minX: -400,
    maxX: 400,
    minY: -400,
    maxY: 200,
  },

  boundary: {
    left: BOUNDARY_TYPE.BLOCK,
    right: BOUNDARY_TYPE.BLOCK,
    top: BOUNDARY_TYPE.NONE,
    bottom: BOUNDARY_TYPE.RESPAWN,
  },

  groundY: 100,

  environment: { gravity: 1 },
  camera: { smoothing: 0.92, offsetX: 0, offsetY: -50 },

  background: {
    sky: 'default',
    autoGenerate: { mountains: 3, trees: 6, bushes: 4, grass: 15, flowers: 4, butterflies: 2, particles: 6 },
  },

  platforms: [
    { x: -350, y: 0, width: 100, height: 100 },
    { x: -150, y: -50, width: 80, height: 20 },
    { x: 50, y: -50, width: 80, height: 20 },
    { x: 250, y: 0, width: 100, height: 100 },
  ],

  items: [
    { type: 'cell', x: -150, y: -20 },
    { type: 'cell', x: 50, y: -20 },
  ],

  exits: [],

  // 스테이지 종료 트리거 (진입 시 클리어 후 월드맵 복귀) - 발판 위 공중에만
  stageEndZones: [
    { x: 260, y: -110, width: 80, height: 60 },  // 오른쪽 플랫폼( top -100 ) 위 공중, 겹치지 않음
  ],
};
