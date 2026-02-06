/**
 * World Map - 스테이지 한 줄 배치 (직접 꾸미기용, 흰 배경)
 * 좌표: 화면 비율 0~1
 */

import { STAGE_ORDER } from '../maps/index.js';

/** 노드: id, x, y(비율), name, stageId */
export const WORLD_MAP_NODES = [
  { id: 'start', x: 0.2, y: 0.5, name: '시작' },
  { id: 'stage1', x: 0.4, y: 0.5, name: 'Stage 1', stageId: STAGE_ORDER[0] },
  { id: 'stage2', x: 0.6, y: 0.5, name: 'Stage 2', stageId: STAGE_ORDER[1] },
  { id: 'stage3', x: 0.6, y: 0.2, name: 'Stage 3', stageId: STAGE_ORDER[2] },
  { id: 'stage4', x: 0.6, y: 0.7, name: 'Stage 4', stageId: STAGE_ORDER[3] },
  { id: 'stageLoop', x: 0.8, y: 0.7, name: 'Stage Loop', stageId: STAGE_ORDER[4] },
];

/** 간선: 한 줄 순서대로, requireCleared 시 클리어 후 이동 가능 */
export const WORLD_MAP_EDGES = [
  { a: 'start', b: 'stage1' },
  { a: 'stage1', b: 'stage2', requireCleared: 'stage1' },
  { a: 'stage2', b: 'stage3', requireCleared: 'stage2' },
  { a: 'stage2', b: 'stage4', requireCleared: 'stage2' },
  { a: 'stage4', b: 'stageLoop', requireCleared: 'stage4' },
];

export const WORLD_MAP_START_NODE_ID = 'start';

export const getNodeById = (id) => WORLD_MAP_NODES.find((n) => n.id === id);

export const getWalkableNeighbors = (nodeId, clearedNodeIds) => {
  const list = [];
  for (const edge of WORLD_MAP_EDGES) {
    const other = edge.a === nodeId ? edge.b : edge.b === nodeId ? edge.a : null;
    if (!other) continue;
    if (edge.requireCleared && !clearedNodeIds.has(edge.requireCleared)) continue;
    const node = getNodeById(other);
    if (node) list.push({ node, edge });
  }
  return list;
};
