/**
 * MapLoader - Load and manage map data
 */
import { getMap, getNextStageId, STAGE_ORDER } from '../maps/index.js';
import { BOUNDARY_TYPE } from '../config/constants.js';

// Default values for optional map properties
const DEFAULT_ENVIRONMENT = {
  gravity: 1,
};

const DEFAULT_CAMERA = {
  smoothing: 0.92,
  offsetX: 0,
  offsetY: -50,
};

const DEFAULT_BOUNDARY = {
  left: BOUNDARY_TYPE.BLOCK,
  right: BOUNDARY_TYPE.BLOCK,
  top: BOUNDARY_TYPE.BLOCK,
  bottom: BOUNDARY_TYPE.RESPAWN,
};

export class MapLoader {
  _currentMap = null;
  _currentMapId = null;

  constructor() {}

  get currentMap() {
    return this._currentMap;
  }

  get currentMapId() {
    return this._currentMapId;
  }

  /**
   * Load a map by ID
   * @param {string} mapId - Map ID to load
   * @returns {Object|null} Loaded map data or null if not found
   */
  loadMap(mapId) {
    const mapData = getMap(mapId);

    if (!mapData) {
      console.error(`[MapLoader] Map not found: ${mapId}`);
      return null;
    }

    // Apply defaults for optional properties
    this._currentMap = {
      ...mapData,
      environment: { ...DEFAULT_ENVIRONMENT, ...mapData.environment },
      camera: { ...DEFAULT_CAMERA, ...mapData.camera },
      boundary: { ...DEFAULT_BOUNDARY, ...mapData.boundary },
      platforms: mapData.platforms || [],
      exits: mapData.exits || [],
      stageEndZones: mapData.stageEndZones || [],
    };

    this._currentMapId = mapId;

    console.log(`[MapLoader] Loaded map: ${mapData.name} (${mapId})`);

    return this._currentMap;
  }

  /**
   * Load the first stage
   * @returns {Object|null} Loaded map data
   */
  loadFirstStage() {
    const firstStageId = STAGE_ORDER[0];
    return this.loadMap(firstStageId);
  }

  /**
   * Load the next stage
   * @returns {Object|null} Loaded map data or null if no next stage
   */
  loadNextStage() {
    const nextStageId = getNextStageId(this._currentMapId);

    if (!nextStageId) {
      console.log('[MapLoader] No next stage available');
      return null;
    }

    return this.loadMap(nextStageId);
  }

  /**
   * Get map bounds in the format expected by physics system
   * @returns {Object} Map bounds with boundary types
   */
  getMapBounds() {
    if (!this._currentMap) {
      return null;
    }

    return {
      MIN_X: this._currentMap.bounds.minX,
      MAX_X: this._currentMap.bounds.maxX,
      MIN_Y: this._currentMap.bounds.minY,
      MAX_Y: this._currentMap.bounds.maxY,
      LEFT: this._currentMap.boundary.left,
      RIGHT: this._currentMap.boundary.right,
      TOP: this._currentMap.boundary.top,
      BOTTOM: this._currentMap.boundary.bottom,
    };
  }

  /**
   * Get player spawn position
   * @returns {{ x: number, y: number }}
   */
  getSpawnPosition() {
    if (!this._currentMap) {
      return { x: 0, y: 100 };
    }

    return { ...this._currentMap.spawn };
  }

  /**
   * Get ground Y level
   * @returns {number}
   */
  getGroundY() {
    return this._currentMap?.groundY ?? 100;
  }

  /**
   * Get platform data
   * @returns {Array}
   */
  getPlatforms() {
    return this._currentMap?.platforms ?? [];
  }

  /**
   * Get exit zones (맵 이동 워프)
   * @returns {Array}
   */
  getExits() {
    return this._currentMap?.exits ?? [];
  }

  /**
   * Get stage end zones (스테이지 종료 → 월드맵 복귀 트리거)
   * @returns {Array} [{ x, y, width, height }, ...]
   */
  getStageEndZones() {
    return this._currentMap?.stageEndZones ?? [];
  }

  /**
   * Get environment settings
   * @returns {Object}
   */
  getEnvironment() {
    return this._currentMap?.environment ?? DEFAULT_ENVIRONMENT;
  }

  /**
   * Get camera settings
   * @returns {Object}
   */
  getCameraSettings() {
    return this._currentMap?.camera ?? DEFAULT_CAMERA;
  }

  /**
   * Check if a position is in an exit zone
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @returns {{ inExit: boolean, targetStage: string|null }}
   */
  checkExitZone(x, y, width, height) {
    const exits = this.getExits();

    for (const exit of exits) {
      // Check AABB collision
      if (
        x < exit.x + exit.width &&
        x + width > exit.x &&
        y - height < exit.y + exit.height &&
        y > exit.y
      ) {
        return { inExit: true, targetStage: exit.targetStage };
      }
    }

    return { inExit: false, targetStage: null };
  }
}
