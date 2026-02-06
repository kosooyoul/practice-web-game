/**
 * Map Data Index - Export all stage maps
 */
import { stage1 } from './stage1.js';
import { stage2 } from './stage2.js';
import { stage3 } from './stage3.js';
import { stage4 } from './stage4.js';
import { stageLoop } from './stageLoop.js';

// Map registry by ID
export const MAPS = {
  stage1,
  stage2,
  stage3,
  stage4,
  stageLoop,
};

// Stage order for progression
export const STAGE_ORDER = ['stage1', 'stage2', 'stage3', 'stage4', 'stageLoop'];

// Special stages (not in main progression)
export const SPECIAL_STAGES = ['stageLoop'];

// Get map by ID
export const getMap = (mapId) => {
  return MAPS[mapId] || null;
};

// Get next stage ID
export const getNextStageId = (currentMapId) => {
  const currentIndex = STAGE_ORDER.indexOf(currentMapId);
  if (currentIndex === -1 || currentIndex >= STAGE_ORDER.length - 1) {
    return null;
  }
  return STAGE_ORDER[currentIndex + 1];
};

// Get previous stage ID
export const getPrevStageId = (currentMapId) => {
  const currentIndex = STAGE_ORDER.indexOf(currentMapId);
  if (currentIndex <= 0) {
    return null;
  }
  return STAGE_ORDER[currentIndex - 1];
};
