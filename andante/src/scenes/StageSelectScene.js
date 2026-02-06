/**
 * StageSelectScene - 월드맵에서 캐릭터가 이동하며 스테이지 선택 (마이오월드 스타일)
 */
import { GameScene } from './GameScene.js';
import {
  WORLD_MAP_NODES,
  WORLD_MAP_EDGES,
  WORLD_MAP_START_NODE_ID,
  getNodeById,
  getWalkableNeighbors,
} from '../config/worldMap.js';

const STORAGE_KEY = 'andante_cleared_nodes';
const CHAR_MOVE_SPEED = 2.2;  // 0~1 진행 per second
const MOVE_COOLDOWN = 0.08;

export class StageSelectScene {
  _game = null;
  _clearedNodeIds = new Set();
  _charNodeId = WORLD_MAP_START_NODE_ID;
  _charTargetNodeId = null;
  _charMoveProgress = 0;
  _charX = 0.12;
  _charY = 0.5;
  _moveCooldown = 0;
  _enteredNodeId = null;

  constructor() {
    this._loadClearedNodes();
    const start = getNodeById(WORLD_MAP_START_NODE_ID);
    if (start) {
      this._charX = start.x;
      this._charY = start.y;
    }
  }

  setGame(game) {
    this._game = game;
  }

  get clearedNodeIds() {
    return this._clearedNodeIds;
  }

  /**
   * 스테이지 클리어 시 호출 (진입했던 노드 id)
   */
  markCleared(nodeId) {
    this._clearedNodeIds.add(nodeId);
    this._saveClearedNodes();
  }

  _loadClearedNodes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        this._clearedNodeIds = new Set(Array.isArray(arr) ? arr : []);
      }
    } catch (e) {
      console.warn('[StageSelect] Failed to load cleared nodes', e);
    }
  }

  _saveClearedNodes() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...this._clearedNodeIds]));
    } catch (e) {
      console.warn('[StageSelect] Failed to save cleared nodes', e);
    }
  }

  _getScreenPos(ratioX, ratioY, boundary) {
    const w = boundary.right - boundary.left;
    const h = boundary.bottom - boundary.top;
    return {
      x: boundary.left + ratioX * w,
      y: boundary.top + ratioY * h,
    };
  }

  _getNodeScreenPos(node, boundary) {
    return this._getScreenPos(node.x, node.y, boundary);
  }

  update(status) {
    const { boundary, input, deltaTime = 1 / 60 } = status;
    const dt = deltaTime;

    // 이동 중: 캐릭터 보간
    if (this._charTargetNodeId) {
      this._charMoveProgress = Math.min(this._charMoveProgress + dt * CHAR_MOVE_SPEED, 1);
      const from = getNodeById(this._charNodeId);
      const to = getNodeById(this._charTargetNodeId);
      if (from && to) {
        const t = this._easeInOut(this._charMoveProgress);
        this._charX = from.x + (to.x - from.x) * t;
        this._charY = from.y + (to.y - from.y) * t;
      }
      if (this._charMoveProgress >= 1) {
        this._charNodeId = this._charTargetNodeId;
        this._charTargetNodeId = null;
        this._charMoveProgress = 0;
      }
      return;
    }

    if (this._moveCooldown > 0) {
      this._moveCooldown -= dt;
      return;
    }

    const currentNode = getNodeById(this._charNodeId);
    if (!currentNode) return;

    const neighbors = getWalkableNeighbors(this._charNodeId, this._clearedNodeIds);
    if (neighbors.length === 0) {
      if (input['interact'] || input['action']) this._tryEnterStage(currentNode);
      return;
    }

    // 방향에 맞는 이웃 선택 (화면 비율 좌표 기준)
    let targetNeighbor = null;
    const dx = input['right'] ? 1 : input['left'] ? -1 : 0;
    const dy = input['down'] ? 1 : input['up'] ? -1 : 0;
    if (dx !== 0 || dy !== 0) {
      let best = null;
      let bestScore = -Infinity;
      for (const { node } of neighbors) {
        const nx = node.x - currentNode.x;
        const ny = node.y - currentNode.y;
        const score = (dx !== 0 ? nx * dx : 0) + (dy !== 0 ? ny * dy : 0);
        if (score > 0 && score > bestScore) {
          bestScore = score;
          best = node;
        }
      }
      if (best) targetNeighbor = best;
    }

    if (targetNeighbor) {
      this._charTargetNodeId = targetNeighbor.id;
      this._charMoveProgress = 0;
      this._moveCooldown = MOVE_COOLDOWN;
      return;
    }

    if (input['interact'] || input['action']) {
      this._tryEnterStage(currentNode);
    }
  }

  _easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  _tryEnterStage(node) {
    if (!node.stageId || !this._game) return;
    this._enteredNodeId = node.id;
    this._enterStage(node.stageId);
  }

  _enterStage(stageId) {
    const self = this;
    this._game.setOnStageEnd((currentMapId) => {
      self.markCleared(currentMapId);
      self._game.setScene(self);
    });
    this._game.setScene(new GameScene(stageId));
  }

  render(context, status) {
    const { boundary } = status;
    const w = boundary.right - boundary.left;
    const h = boundary.bottom - boundary.top;

    // 흰 배경 (직접 꾸미기용)
    context.fillStyle = '#FFFFFF';
    context.fillRect(boundary.left, boundary.top, w, h);

    // 경로 (한 줄)
    context.strokeStyle = 'rgba(60, 80, 50, 0.5)';
    context.lineWidth = 14;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    for (const edge of WORLD_MAP_EDGES) {
      const na = getNodeById(edge.a);
      const nb = getNodeById(edge.b);
      if (!na || !nb) continue;
      const pa = this._getNodeScreenPos(na, boundary);
      const pb = this._getNodeScreenPos(nb, boundary);
      const walkable = !edge.requireCleared || this._clearedNodeIds.has(edge.requireCleared);
      context.strokeStyle = walkable ? 'rgba(60, 80, 50, 0.6)' : 'rgba(80, 80, 80, 0.35)';
      context.lineWidth = walkable ? 14 : 10;
      context.beginPath();
      context.moveTo(pa.x, pa.y);
      context.lineTo(pb.x, pb.y);
      context.stroke();
    }

    // 노드
    for (const node of WORLD_MAP_NODES) {
      const pos = this._getNodeScreenPos(node, boundary);
      const cleared = this._clearedNodeIds.has(node.id);
      const isStart = node.id === WORLD_MAP_START_NODE_ID;
      const hasStage = !!node.stageId;
      const selected = this._charNodeId === node.id && !this._charTargetNodeId;
      this._drawNode(context, pos.x, pos.y, node, cleared, isStart, hasStage, selected);
    }

    // 캐릭터
    const charPos = this._getScreenPos(this._charX, this._charY, boundary);
    this._drawCharacter(context, charPos.x, charPos.y);

    // 안내
    context.fillStyle = 'rgba(0, 0, 0, 0.75)';
    context.font = '14px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('방향키: 이동  ·  A(점프) / B(E): 스테이지 입장', boundary.left + w / 2, boundary.bottom - 24);
  }

  _drawNode(context, x, y, node, cleared, isStart, hasStage, selected) {
    const radius = isStart ? 20 : hasStage ? 26 : 18;

    if (selected && hasStage) {
      context.strokeStyle = '#FFD700';
      context.lineWidth = 4;
      context.beginPath();
      context.arc(x, y, radius + 5, 0, Math.PI * 2);
      context.stroke();
    }

    if (isStart) {
      context.fillStyle = '#FFF8E1';
      context.strokeStyle = '#FFC107';
    } else if (hasStage) {
      const g = context.createRadialGradient(x - 6, y - 6, 0, x, y, radius);
      g.addColorStop(0, cleared ? '#C8E6C9' : '#A5D6A7');
      g.addColorStop(1, cleared ? '#81C784' : '#66BB6A');
      context.fillStyle = g;
      context.strokeStyle = 'rgba(0,0,0,0.2)';
    } else {
      context.fillStyle = '#E0E0E0';
      context.strokeStyle = 'rgba(0,0,0,0.15)';
    }
    context.lineWidth = 2;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    if (cleared && hasStage) {
      context.fillStyle = '#1B5E20';
      context.font = 'bold 20px sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('✓', x, y);
    }

    if (node.name) {
      context.fillStyle = hasStage ? '#333' : '#666';
      context.font = isStart ? '10px sans-serif' : '11px sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'top';
      context.fillText(node.name, x, y + radius + 4);
    }
  }

  _drawCharacter(context, x, y) {
    context.save();
    context.translate(x, y);

    // 몸 (둥근 캐릭터)
    const bodyGrad = context.createRadialGradient(-4, -6, 0, 0, 0, 16);
    bodyGrad.addColorStop(0, '#FFE0B2');
    bodyGrad.addColorStop(0.7, '#FFCC80');
    bodyGrad.addColorStop(1, '#FFB74D');
    context.fillStyle = bodyGrad;
    context.beginPath();
    context.arc(0, 0, 14, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = 'rgba(0,0,0,0.2)';
    context.lineWidth = 1.5;
    context.stroke();

    // 머리
    context.fillStyle = '#FFE0B2';
    context.beginPath();
    context.arc(0, -12, 8, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // 눈
    context.fillStyle = '#333';
    context.beginPath();
    context.arc(-3, -13, 1.5, 0, Math.PI * 2);
    context.arc(3, -13, 1.5, 0, Math.PI * 2);
    context.fill();

    context.restore();
  }
}
