/**
 * BackgroundLayer - Manages and renders background elements with parallax
 */
import { LAYER_DEPTH, BG_TYPES, SKY_PRESETS, getBgType } from '../config/backgroundTypes.js';

/**
 * Seeded random number generator (mulberry32)
 * Same seed always produces same sequence
 */
const createSeededRandom = (seed) => {
  let state = seed;
  return () => {
    state |= 0;
    state = state + 0x6D2B79F5 | 0;
    let t = Math.imul(state ^ state >>> 15, 1 | state);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};

/**
 * Convert string to numeric seed
 */
const stringToSeed = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
};

export class BackgroundLayer {
  _elements = {
    far: [],
    mid: [],
    near: [],
    effects: [],
  };
  _skyPreset = 'day';
  _mapBounds = null;
  _platforms = [];
  _groundY = 100;
  _time = 0;
  _random = Math.random;  // Random function (seeded or not)
  _seamlessX = false;
  _seamlessY = false;
  
  // Growing elements (spawned by triggers)
  _growingElements = [];

  /**
   * Initialize background from map data
   * @param {Object} bgData - Background configuration from map
   * @param {Object} mapBounds - Map boundaries
   * @param {Array} platforms - Platform data for placing elements
   * @param {number} groundY - Ground level Y position
   * @param {string} mapId - Map ID for seeded random
   * @param {boolean} seamlessX - Whether map loops horizontally
   * @param {boolean} seamlessY - Whether map loops vertically
   */
  init(bgData, mapBounds, platforms = [], groundY = 100, mapId = '', seamlessX = false, seamlessY = false) {
    this._mapBounds = mapBounds;
    this._platforms = platforms;
    this._groundY = groundY;
    this._elements = { far: [], mid: [], near: [], effects: [] };
    this._growingElements = [];
    this._time = 0;
    this._seamlessX = seamlessX;
    this._seamlessY = seamlessY;

    // Create seeded random from map ID for consistent backgrounds
    if (mapId) {
      this._random = createSeededRandom(stringToSeed(mapId));
    } else {
      this._random = Math.random;
    }

    if (!bgData) {
      return;
    }

    // Set sky
    this._skyPreset = bgData.sky || 'day';

    // Create elements for each layer
    if (bgData.elements) {
      for (const elemData of bgData.elements) {
        this._createElement(elemData);
      }
    }

    // Auto-generate elements if specified
    if (bgData.autoGenerate) {
      this._autoGenerate(bgData.autoGenerate);
    }
  }

  /**
   * Create a single background element
   */
  _createElement(elemData) {
    const typeData = getBgType(elemData.type);
    if (!typeData) {
      console.warn(`[BackgroundLayer] Unknown type: ${elemData.type}`);
      return;
    }

    const element = {
      type: elemData.type,
      typeData,
      x: elemData.x,
      y: elemData.y,
      scale: elemData.scale || 1,
      // For animated elements
      phase: this._random() * Math.PI * 2,
      baseX: elemData.x,
      baseY: elemData.y,
      // Random color selection for variety
      colorIndex: Math.floor(this._random() * 10),
    };

    const layer = typeData.layer;
    if (this._elements[layer]) {
      this._elements[layer].push(element);
    }
  }

  /**
   * Get all spawn surfaces (ground + platforms)
   * @returns {Array<{minX, maxX, y}>}
   */
  _getSpawnSurfaces() {
    const surfaces = [];
    const minX = this._mapBounds.MIN_X;
    const maxX = this._mapBounds.MAX_X;

    // Add ground as a surface
    surfaces.push({
      minX: minX - 100,
      maxX: maxX + 100,
      y: this._groundY,
      isGround: true,
    });

    // Add platforms as surfaces
    for (const platform of this._platforms) {
      surfaces.push({
        minX: platform.x,
        maxX: platform.x + platform.width,
        y: platform.y - platform.height,  // Top of platform
        isGround: false,
      });
    }

    return surfaces;
  }

  /**
   * Get random position on any surface
   * @param {boolean} includeGround - Include ground in selection
   * @param {boolean} includePlatforms - Include platforms in selection
   * @returns {{x, y}}
   */
  _getRandomSurfacePosition(includeGround = true, includePlatforms = true) {
    const surfaces = this._getSpawnSurfaces().filter((s) => {
      if (s.isGround && !includeGround) return false;
      if (!s.isGround && !includePlatforms) return false;
      return true;
    });

    if (surfaces.length === 0) {
      return { x: 0, y: this._groundY };
    }

    // Weight selection by surface width
    const totalWidth = surfaces.reduce((sum, s) => sum + (s.maxX - s.minX), 0);
    let random = this._random() * totalWidth;

    for (const surface of surfaces) {
      const width = surface.maxX - surface.minX;
      if (random < width) {
        const x = surface.minX + this._random() * width;
        return { x, y: surface.y };
      }
      random -= width;
    }

    // Fallback
    const surface = surfaces[0];
    return { 
      x: surface.minX + this._random() * (surface.maxX - surface.minX), 
      y: surface.y 
    };
  }

  /**
   * Auto-generate background elements
   */
  _autoGenerate(config) {
    const minX = this._mapBounds.MIN_X - 200;
    const maxX = this._mapBounds.MAX_X + 200;
    const groundY = this._groundY;

    // Generate mountains in far layer (behind everything)
    if (config.mountains) {
      const count = config.mountains;
      for (let i = 0; i < count; i++) {
        const x = minX + (maxX - minX) * (i / count) + this._random() * 100 - 50;
        this._createElement({
          type: this._random() > 0.5 ? 'mountain' : 'hill',
          x,
          y: groundY + 50,
          scale: 0.8 + this._random() * 0.5,
        });
      }
    }

    // Generate trees in mid layer (ground only - trees are big)
    if (config.trees) {
      const count = config.trees;
      for (let i = 0; i < count; i++) {
        const x = minX + this._random() * (maxX - minX);
        const treeType = this._random() > 0.3 ? 'tree' : 'tallTree';
        this._createElement({
          type: treeType,
          x,
          y: groundY,
          scale: 0.7 + this._random() * 0.6,
        });
      }
    }

    // Generate bushes (ground only)
    if (config.bushes) {
      const count = config.bushes;
      for (let i = 0; i < count; i++) {
        const x = minX + this._random() * (maxX - minX);
        this._createElement({
          type: 'bush',
          x,
          y: groundY,
          scale: 0.8 + this._random() * 0.4,
        });
      }
    }

    // Generate foreground trees (in front of player) - about 20% of trees
    if (config.trees && config.trees >= 3) {
      const count = Math.floor(config.trees * 0.2);
      for (let i = 0; i < count; i++) {
        const x = minX + this._random() * (maxX - minX);
        this._createElement({
          type: 'fgTree',
          x,
          y: groundY,
          scale: 0.9 + this._random() * 0.3,
        });
      }
    }

    // Generate foreground bushes (in front of player) - about 20% of bushes
    if (config.bushes && config.bushes >= 3) {
      const count = Math.floor(config.bushes * 0.2);
      for (let i = 0; i < count; i++) {
        const x = minX + this._random() * (maxX - minX);
        this._createElement({
          type: 'fgBush',
          x,
          y: groundY,
          scale: 0.9 + this._random() * 0.3,
        });
      }
    }

    // Generate grass (ground + platforms)
    if (config.grass) {
      const count = config.grass;
      for (let i = 0; i < count; i++) {
        const pos = this._getRandomSurfacePosition(true, true);
        const grassType = this._random() > 0.6 ? 'tallGrass' : 'grass';
        this._createElement({
          type: grassType,
          x: pos.x,
          y: pos.y,
          scale: 0.8 + this._random() * 0.4,
        });
      }
    }

    // Generate flowers (ground + platforms)
    if (config.flowers) {
      const count = config.flowers;
      for (let i = 0; i < count; i++) {
        const pos = this._getRandomSurfacePosition(true, true);
        this._createElement({
          type: 'flower',
          x: pos.x,
          y: pos.y,
          scale: 0.8 + this._random() * 0.4,
        });
      }
    }

    // Generate butterflies (above surfaces)
    if (config.butterflies) {
      const count = config.butterflies;
      for (let i = 0; i < count; i++) {
        const pos = this._getRandomSurfacePosition(true, true);
        this._createElement({
          type: 'butterfly',
          x: pos.x,
          y: pos.y - 30 - this._random() * 80,
          scale: 0.8 + this._random() * 0.4,
        });
      }
    }

    // Generate fog (near ground and platforms)
    if (config.fog) {
      const count = config.fog;
      for (let i = 0; i < count; i++) {
        const pos = this._getRandomSurfacePosition(true, true);
        this._createElement({
          type: 'fog',
          x: pos.x,
          y: pos.y - 20 - this._random() * 40,
          scale: 1 + this._random() * 0.5,
        });
      }
    }

    // Generate particles (scattered in air)
    if (config.particles) {
      const count = config.particles;
      for (let i = 0; i < count; i++) {
        const x = minX + this._random() * (maxX - minX);
        const y = groundY - 50 - this._random() * 150;
        this._createElement({
          type: 'particle',
          x,
          y,
          scale: 0.5 + this._random() * 1,
        });
      }
    }
  }

  /**
   * Update animated elements
   * @param {number} deltaTime - Delta time in seconds
   */
  update(deltaTime = 1/60) {
    // Accumulate time in seconds, normalized to 60fps equivalent
    this._time += deltaTime * 60;

    // Update effects layer animations
    for (const elem of this._elements.effects) {
      if (elem.typeData.movement) {
        const { type, rangeX, rangeY, speed } = elem.typeData.movement;
        
        switch (type) {
          case 'flutter':
            elem.x = elem.baseX + Math.sin(this._time * speed + elem.phase) * (rangeX || 50);
            elem.y = elem.baseY + Math.cos(this._time * speed * 1.3 + elem.phase) * (rangeY || 30);
            break;
          case 'drift':
            elem.x = elem.baseX + this._time * speed;
            // Wrap around
            const mapWidth = this._mapBounds.MAX_X - this._mapBounds.MIN_X + 400;
            if (elem.x > this._mapBounds.MAX_X + 200) {
              elem.x = this._mapBounds.MIN_X - 200;
              elem.baseX = elem.x - this._time * speed;
            }
            break;
          case 'float':
            elem.y = elem.baseY + Math.sin(this._time * 0.02 + elem.phase) * 10;
            break;
        }
      }
    }

    // Update growing elements
    for (let i = this._growingElements.length - 1; i >= 0; i--) {
      const elem = this._growingElements[i];
      
      // Grow animation (0 -> 1 over duration)
      elem.growProgress = Math.min(elem.growProgress + deltaTime / elem.growDuration, 1);
      
      // Update current scale based on growth
      elem.currentScale = elem.growProgress;
      
      // When fully grown, move to regular elements
      if (elem.growProgress >= 1) {
        elem.growing = false;
        this._growingElements.splice(i, 1);
        // Element stays in its layer for normal rendering
      }
    }
  }

  /**
   * Add a growing background element (triggered by game events)
   * @param {string} type - Element type (e.g., 'potatoVine')
   * @param {number} x - X position
   * @param {number} y - Y position (base/ground)
   * @param {Object} options - { scale, growDuration }
   */
  addGrowingElement(type, x, y, options = {}) {
    const typeData = getBgType(type);
    if (!typeData) {
      console.warn(`[BackgroundLayer] Unknown type: ${type}`);
      return;
    }

    const elem = {
      type,
      typeData,
      x,
      y,
      baseX: x,
      baseY: y,
      scale: options.scale || 1,
      phase: Math.random() * Math.PI * 2,
      // Growing properties
      growing: true,
      growProgress: 0,
      growDuration: options.growDuration || 2,  // seconds
      currentScale: 0,
      targetHeight: options.height || typeData.height,
    };

    // Add to layer
    const layer = typeData.layer || 'mid';
    this._elements[layer].push(elem);
    this._growingElements.push(elem);

    console.log(`[BackgroundLayer] Added growing ${type} at (${x}, ${y})`);
  }

  /**
   * Render skybox (sky + far layer) - screen-fixed with parallax
   * Call BEFORE camera transform
   * @param {CanvasRenderingContext2D} context
   * @param {Object} camera - Camera object for parallax
   * @param {Object} viewport - Viewport boundaries
   * @param {number} interpolation - Interpolation factor for smooth rendering (0-1)
   */
  renderSkybox(context, camera, viewport, interpolation = 1) {
    // Get interpolated camera position for smooth rendering
    const { x: cameraX, y: cameraY } = camera.getInterpolatedPosition(interpolation);

    // Calculate horizon line position on screen
    const horizonWorldY = this._groundY;
    const horizonScreenY = horizonWorldY - cameraY;

    // Render sky gradient (above horizon)
    this._renderSky(context, viewport, horizonScreenY);

    // Render ground background (below horizon)
    this._renderGroundBackground(context, viewport, horizonScreenY);

    // Render far layer with parallax (mountains, hills) at horizon
    this._renderLayerParallax(context, 'far', cameraX, viewport, LAYER_DEPTH.FAR, horizonScreenY);
  }

  /**
   * Render map background (mid layer) - map-fixed
   * Call AFTER camera transform
   * @param {CanvasRenderingContext2D} context
   * @param {Object} status
   */
  renderMapBackground(context, status) {
    // Mid layer elements are fixed to map coordinates
    this._renderLayerFixed(context, 'mid');
  }

  /**
   * Render map foreground (near + effects) - map-fixed
   * Call AFTER camera transform, after player
   * @param {CanvasRenderingContext2D} context
   * @param {Object} status
   */
  renderMapForeground(context, status) {
    // Near layer and effects are fixed to map coordinates
    this._renderLayerFixed(context, 'near');
    this._renderLayerFixed(context, 'effects');
  }

  // Legacy methods for compatibility
  render(context, camera, viewport) {
    this.renderSkybox(context, camera, viewport);
  }

  renderForeground(context, camera, viewport) {
    // This is now called inside camera transform in GameScene
  }

  /**
   * Render sky gradient (above horizon)
   */
  _renderSky(context, viewport, horizonY) {
    const preset = SKY_PRESETS[this._skyPreset] || SKY_PRESETS.day;
    const { left, right, top, bottom } = viewport;

    // Sky only renders above horizon (or slightly below for gradient)
    const skyBottom = Math.min(horizonY + 50, bottom);
    const skyHeight = skyBottom - top;

    if (skyHeight <= 0) return;

    // Create gradient from top to horizon
    const gradient = context.createLinearGradient(0, top, 0, skyBottom);
    const colors = preset.gradient;
    colors.forEach((color, i) => {
      gradient.addColorStop(i / (colors.length - 1), color);
    });

    context.fillStyle = gradient;
    context.fillRect(left, top, right - left, skyHeight);

    // Stars for night (only above horizon)
    if (preset.stars) {
      context.fillStyle = 'white';
      for (let i = 0; i < 50; i++) {
        const starX = left + Math.sin(i * 127.1) * (right - left) / 2 + (right - left) / 2;
        const starY = top + Math.cos(i * 311.7) * (horizonY - top) * 0.7 + 30;
        if (starY < horizonY) {
          const size = 1 + (i % 3);
          context.beginPath();
          context.arc(starX, starY, size, 0, Math.PI * 2);
          context.fill();
        }
      }
    }
  }

  /**
   * Render ground background (below horizon)
   */
  _renderGroundBackground(context, viewport, horizonY) {
    const preset = SKY_PRESETS[this._skyPreset] || SKY_PRESETS.day;
    const { left, right, top, bottom } = viewport;

    // Ground colors based on sky preset
    const groundColors = preset.ground || {
      top: '#8B7355',      // Dirt brown
      middle: '#6B5344',   // Darker dirt
      bottom: '#4A3728',   // Deep earth
    };

    const groundTop = Math.max(horizonY, top);
    const groundHeight = bottom - groundTop;

    if (groundHeight <= 0) return;

    // Create gradient for underground
    const gradient = context.createLinearGradient(0, groundTop, 0, bottom);
    gradient.addColorStop(0, groundColors.top);
    gradient.addColorStop(0.4, groundColors.middle);
    gradient.addColorStop(1, groundColors.bottom);

    context.fillStyle = gradient;
    context.fillRect(left, groundTop, right - left, groundHeight);
  }

  /**
   * Render a layer with parallax effect (screen-relative)
   * Used for far background that moves slower than camera
   * @param {number} cameraX - Interpolated camera X position
   */
  _renderLayerParallax(context, layerName, cameraX, viewport, depth, horizonY) {
    const elements = this._elements[layerName];
    if (!elements || elements.length === 0) return;

    const { left, right, top, bottom } = viewport;
    const viewWidth = right - left;

    // Calculate offsets for seamless rendering in parallax
    const mapWidth = this._mapBounds.MAX_X - this._mapBounds.MIN_X;
    const offsetsX = this._seamlessX ? [-mapWidth, 0, mapWidth] : [0];

    for (const offsetX of offsetsX) {
      for (const elem of elements) {
        // Calculate screen X with parallax (horizontal movement)
        // Apply offset before parallax calculation
        const screenX = (elem.x + offsetX - cameraX) * (1 - depth) + left + viewWidth / 2;

        // Y position anchored to horizon
        const screenY = horizonY;

        // Culling
        if (screenX < left - 400 || screenX > right + 400) continue;

        this._renderElement(context, elem, screenX, screenY);
      }
    }
  }

  /**
   * Render a layer fixed to map coordinates
   * Used for decorations that should scroll with the map
   */
  _renderLayerFixed(context, layerName) {
    const elements = this._elements[layerName];
    if (!elements || elements.length === 0) return;

    // Calculate offsets for seamless rendering
    const mapWidth = this._mapBounds.MAX_X - this._mapBounds.MIN_X;
    const mapHeight = this._mapBounds.MAX_Y - this._mapBounds.MIN_Y;
    const offsetsX = this._seamlessX ? [-mapWidth, 0, mapWidth] : [0];
    const offsetsY = this._seamlessY ? [-mapHeight, 0, mapHeight] : [0];

    for (const offsetX of offsetsX) {
      for (const offsetY of offsetsY) {
        for (const elem of elements) {
          // Elements are rendered at their map coordinates + offset
          // Camera transform is already applied by GameScene
          this._renderElement(context, elem, elem.x + offsetX, elem.y + offsetY);
        }
      }
    }
  }

  /**
   * Render a single element
   */
  _renderElement(context, elem, x, y) {
    const { typeData, scale } = elem;

    // For growing elements, apply growth scale
    const growScale = elem.growing ? elem.currentScale : 1;
    const finalScale = scale * growScale;

    // Skip if not visible yet
    if (finalScale <= 0.01) return;

    context.save();
    context.translate(x, y);
    context.scale(finalScale, finalScale);

    switch (typeData.render) {
      case 'mountain':
        this._drawMountain(context, typeData, elem);
        break;
      case 'hill':
        this._drawHill(context, typeData, elem);
        break;
      case 'tree':
        this._drawTree(context, typeData, elem);
        break;
      case 'tallTree':
        this._drawTallTree(context, typeData, elem);
        break;
      case 'simpleTree':
        this._drawSimpleTree(context, typeData, elem);
        break;
      case 'bush':
        this._drawBush(context, typeData, elem);
        break;
      case 'rock':
      case 'smallRock':
        this._drawRock(context, typeData, elem);
        break;
      case 'grass':
        this._drawGrass(context, typeData, elem, false);
        break;
      case 'tallGrass':
        this._drawGrass(context, typeData, elem, true);
        break;
      case 'flower':
        this._drawFlower(context, typeData, elem);
        break;
      case 'butterfly':
        this._drawButterfly(context, typeData, elem);
        break;
      case 'fog':
        this._drawFog(context, typeData, elem);
        break;
      case 'particle':
        this._drawParticle(context, typeData, elem);
        break;
      case 'potatoVine':
        this._drawPotatoVine(context, typeData, elem);
        break;
    }

    context.restore();
  }

  // === Drawing Methods ===

  _drawMountain(context, typeData, elem) {
    const { width, height, colors } = typeData;
    
    // Main mountain shape
    context.beginPath();
    context.moveTo(-width / 2, 0);
    context.lineTo(-width / 6, -height * 0.7);
    context.lineTo(0, -height);
    context.lineTo(width / 5, -height * 0.6);
    context.lineTo(width / 2, 0);
    context.closePath();

    const gradient = context.createLinearGradient(0, -height, 0, 0);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.6, colors[1]);
    gradient.addColorStop(1, colors[2]);
    context.fillStyle = gradient;
    context.fill();

    // Snow cap
    context.beginPath();
    context.moveTo(-width / 8, -height * 0.8);
    context.lineTo(0, -height);
    context.lineTo(width / 10, -height * 0.75);
    context.closePath();
    context.fillStyle = 'rgba(255,255,255,0.7)';
    context.fill();
  }

  _drawHill(context, typeData, elem) {
    const { width, height, colors } = typeData;
    
    context.beginPath();
    context.moveTo(-width / 2, 0);
    context.quadraticCurveTo(-width / 4, -height, 0, -height * 0.9);
    context.quadraticCurveTo(width / 4, -height * 0.8, width / 2, 0);
    context.closePath();

    const gradient = context.createLinearGradient(0, -height, 0, 0);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.5, colors[1]);
    gradient.addColorStop(1, colors[2]);
    context.fillStyle = gradient;
    context.fill();
  }

  _drawTree(context, typeData, elem) {
    const { width, height, colors } = typeData;
    const trunkWidth = width * 0.2;
    const trunkHeight = height * 0.35;

    // Trunk
    context.fillStyle = colors.trunk;
    context.fillRect(-trunkWidth / 2, -trunkHeight, trunkWidth, trunkHeight);

    // Leaves (layered circles)
    const leafColors = colors.leaves;
    const leafRadius = width * 0.45;
    
    context.fillStyle = leafColors[2];
    context.beginPath();
    context.arc(0, -height * 0.55, leafRadius, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = leafColors[1];
    context.beginPath();
    context.arc(-leafRadius * 0.4, -height * 0.65, leafRadius * 0.8, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = leafColors[0];
    context.beginPath();
    context.arc(leafRadius * 0.3, -height * 0.7, leafRadius * 0.7, 0, Math.PI * 2);
    context.fill();
  }

  _drawTallTree(context, typeData, elem) {
    const { width, height, colors } = typeData;
    const trunkWidth = width * 0.15;

    // Trunk
    context.fillStyle = colors.trunk;
    context.fillRect(-trunkWidth / 2, -height * 0.4, trunkWidth, height * 0.4);

    // Conical leaves
    const leafColors = colors.leaves;
    
    for (let i = 0; i < 3; i++) {
      const y = -height * (0.4 + i * 0.2);
      const layerWidth = width * (0.5 - i * 0.1);
      const layerHeight = height * 0.3;

      context.beginPath();
      context.moveTo(0, y - layerHeight);
      context.lineTo(-layerWidth / 2, y);
      context.lineTo(layerWidth / 2, y);
      context.closePath();
      context.fillStyle = leafColors[Math.min(i, leafColors.length - 1)];
      context.fill();
    }
  }

  _drawSimpleTree(context, typeData, elem) {
    const { width, height, colors } = typeData;
    
    // Simple silhouette tree
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(-width * 0.1, -height * 0.3);
    context.lineTo(-width * 0.4, -height * 0.5);
    context.lineTo(-width * 0.2, -height * 0.7);
    context.lineTo(0, -height);
    context.lineTo(width * 0.15, -height * 0.75);
    context.lineTo(width * 0.35, -height * 0.55);
    context.lineTo(width * 0.1, -height * 0.35);
    context.closePath();
    context.fillStyle = colors[0];
    context.fill();
  }

  _drawBush(context, typeData, elem) {
    const { width, height, colors } = typeData;
    
    // Multiple overlapping circles
    const positions = [
      { x: -width * 0.25, y: -height * 0.4, r: height * 0.5 },
      { x: width * 0.2, y: -height * 0.35, r: height * 0.45 },
      { x: 0, y: -height * 0.5, r: height * 0.55 },
    ];

    positions.forEach((pos, i) => {
      context.beginPath();
      context.arc(pos.x, pos.y, pos.r, 0, Math.PI * 2);
      context.fillStyle = colors[i % colors.length];
      context.fill();
    });
  }

  _drawRock(context, typeData, elem) {
    const { width, height, colors } = typeData;
    
    context.beginPath();
    context.moveTo(-width * 0.4, 0);
    context.lineTo(-width * 0.45, -height * 0.4);
    context.lineTo(-width * 0.2, -height * 0.9);
    context.lineTo(width * 0.15, -height);
    context.lineTo(width * 0.4, -height * 0.5);
    context.lineTo(width * 0.35, 0);
    context.closePath();

    context.fillStyle = colors[0];
    context.fill();

    // Highlight
    context.beginPath();
    context.moveTo(-width * 0.3, -height * 0.3);
    context.lineTo(-width * 0.15, -height * 0.7);
    context.lineTo(width * 0.05, -height * 0.5);
    context.closePath();
    context.fillStyle = colors[1] || 'rgba(255,255,255,0.2)';
    context.fill();
  }

  _drawGrass(context, typeData, elem, tall) {
    const { width, height, colors } = typeData;
    const bladeCount = tall ? 5 : 7;
    // Gentle sway: slower speed (0.015) and smaller amplitude (1.5px)
    const sway = Math.sin(this._time * 0.015 + elem.phase) * 1.5;

    for (let i = 0; i < bladeCount; i++) {
      // Use seeded offset based on element phase for consistency
      const offset = Math.sin(elem.phase * (i + 1) * 7.3) * 2;
      const x = -width / 2 + (width / bladeCount) * i + offset;
      const h = height * (0.7 + Math.sin(elem.phase * (i + 1) * 3.7) * 0.2);
      const tipX = x + sway * (h / height);

      context.beginPath();
      context.moveTo(x - 2, 0);
      context.quadraticCurveTo(x, -h * 0.5, tipX, -h);
      context.quadraticCurveTo(x, -h * 0.5, x + 2, 0);
      context.closePath();
      context.fillStyle = colors[i % colors.length];
      context.fill();
    }
  }

  _drawFlower(context, typeData, elem) {
    const { width, height, colors } = typeData;
    // Gentle sway for flowers
    const sway = Math.sin(this._time * 0.012 + elem.phase) * 1;

    // Stem
    context.beginPath();
    context.moveTo(0, 0);
    context.quadraticCurveTo(sway, -height * 0.5, sway * 0.5, -height + 5);
    context.strokeStyle = colors.stem;
    context.lineWidth = 2;
    context.stroke();

    // Petals
    const petalColor = colors.petals[elem.colorIndex % colors.petals.length];
    const centerX = sway * 0.5;
    const centerY = -height + 3;
    const petalSize = 4;

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const px = centerX + Math.cos(angle) * petalSize;
      const py = centerY + Math.sin(angle) * petalSize;
      
      context.beginPath();
      context.arc(px, py, 3, 0, Math.PI * 2);
      context.fillStyle = petalColor;
      context.fill();
    }

    // Center
    context.beginPath();
    context.arc(centerX, centerY, 2, 0, Math.PI * 2);
    context.fillStyle = '#FFD700';
    context.fill();
  }

  _drawButterfly(context, typeData, elem) {
    const { colors } = typeData;
    const wingFlap = Math.sin(this._time * 0.3 + elem.phase) * 0.5 + 0.5;
    const color = colors[elem.colorIndex % colors.length];

    // Wings
    context.save();
    context.scale(1, wingFlap);
    
    // Left wing
    context.beginPath();
    context.ellipse(-5, 0, 6, 4, -0.3, 0, Math.PI * 2);
    context.fillStyle = color;
    context.fill();

    // Right wing
    context.beginPath();
    context.ellipse(5, 0, 6, 4, 0.3, 0, Math.PI * 2);
    context.fill();

    context.restore();

    // Body
    context.beginPath();
    context.ellipse(0, 0, 2, 5, 0, 0, Math.PI * 2);
    context.fillStyle = '#333';
    context.fill();
  }

  _drawFog(context, typeData, elem) {
    const { width, height, colors } = typeData;
    const pulse = Math.sin(this._time * 0.01 + elem.phase) * 0.2 + 0.8;

    const gradient = context.createRadialGradient(0, 0, 0, 0, 0, width / 2);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);

    context.globalAlpha = pulse * 0.6;
    context.beginPath();
    context.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
    context.fillStyle = gradient;
    context.fill();
    context.globalAlpha = 1;
  }

  /**
   * Draw potato vine (growing from ground upward)
   */
  _drawPotatoVine(context, typeData, elem) {
    const { width, height, colors } = typeData;
    const sway = Math.sin(this._time * 0.015 + elem.phase) * 3;

    // Main stem (grows from ground upward)
    const stemPoints = this._generateVineStem(height, sway, elem.phase);
    
    // Draw main stem
    context.beginPath();
    context.moveTo(stemPoints[0].x, stemPoints[0].y);
    for (let i = 1; i < stemPoints.length; i++) {
      const p = stemPoints[i];
      context.lineTo(p.x, p.y);
    }
    context.strokeStyle = colors.stem;
    context.lineWidth = 6;
    context.lineCap = 'round';
    context.stroke();

    // Inner stem highlight
    context.beginPath();
    context.moveTo(stemPoints[0].x - 1, stemPoints[0].y);
    for (let i = 1; i < stemPoints.length; i++) {
      const p = stemPoints[i];
      context.lineTo(p.x - 1, p.y);
    }
    context.strokeStyle = colors.stemDark;
    context.lineWidth = 3;
    context.stroke();

    // Draw leaves along the stem
    for (let i = 2; i < stemPoints.length - 1; i += 2) {
      const p = stemPoints[i];
      const side = (i % 4 === 0) ? 1 : -1;
      this._drawPotatoLeaf(context, p.x, p.y, side, colors, elem.phase + i);
    }

    // Draw potatoes at base
    this._drawPotatoes(context, 0, 0, colors, elem.phase);

    // Draw flowers at top
    if (stemPoints.length > 3) {
      const top = stemPoints[stemPoints.length - 1];
      this._drawPotatoFlowers(context, top.x, top.y, colors, elem.phase);
    }
  }

  /**
   * Generate vine stem points with natural curve
   */
  _generateVineStem(height, sway, phase) {
    const points = [];
    const segments = 8;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = -height * t;
      // Natural wave pattern
      const x = Math.sin(t * Math.PI * 2 + phase) * 15 * t + sway * t;
      points.push({ x, y });
    }
    
    return points;
  }

  /**
   * Draw a potato leaf
   */
  _drawPotatoLeaf(context, x, y, side, colors, phase) {
    const leafSize = 20 + Math.sin(phase) * 5;
    const leafAngle = side * 0.4 + Math.sin(this._time * 0.02 + phase) * 0.1;
    
    context.save();
    context.translate(x, y);
    context.rotate(leafAngle);

    // Leaf shape (heart-like potato leaf)
    context.beginPath();
    context.moveTo(0, 0);
    context.bezierCurveTo(
      side * leafSize * 0.5, -leafSize * 0.3,
      side * leafSize, -leafSize * 0.2,
      side * leafSize * 0.8, leafSize * 0.3
    );
    context.bezierCurveTo(
      side * leafSize * 0.4, leafSize * 0.5,
      0, leafSize * 0.3,
      0, 0
    );
    context.fillStyle = colors.leaf;
    context.fill();

    // Leaf vein
    context.beginPath();
    context.moveTo(0, 0);
    context.quadraticCurveTo(side * leafSize * 0.3, 0, side * leafSize * 0.5, leafSize * 0.1);
    context.strokeStyle = colors.leafDark;
    context.lineWidth = 1;
    context.stroke();

    context.restore();
  }

  /**
   * Draw potatoes at vine base
   */
  _drawPotatoes(context, x, y, colors, phase) {
    const potatoes = [
      { ox: -15, oy: 5, size: 18 },
      { ox: 10, oy: 8, size: 14 },
      { ox: -5, oy: 15, size: 12 },
    ];

    for (const p of potatoes) {
      // Potato shape (irregular ellipse)
      context.beginPath();
      context.ellipse(
        x + p.ox, y + p.oy,
        p.size, p.size * 0.7,
        Math.sin(phase + p.ox) * 0.3, 0, Math.PI * 2
      );
      context.fillStyle = colors.potato;
      context.fill();

      // Potato spots/eyes
      context.beginPath();
      context.arc(x + p.ox - 3, y + p.oy - 2, 2, 0, Math.PI * 2);
      context.arc(x + p.ox + 4, y + p.oy + 1, 1.5, 0, Math.PI * 2);
      context.fillStyle = colors.potatoDark;
      context.fill();
    }
  }

  /**
   * Draw small flowers at vine top
   */
  _drawPotatoFlowers(context, x, y, colors, phase) {
    const flowers = [
      { ox: 0, oy: -5 },
      { ox: -8, oy: 3 },
      { ox: 8, oy: 0 },
    ];

    for (const f of flowers) {
      const fx = x + f.ox;
      const fy = y + f.oy;
      
      // Petals
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 + phase;
        const px = fx + Math.cos(angle) * 5;
        const py = fy + Math.sin(angle) * 5;
        
        context.beginPath();
        context.ellipse(px, py, 4, 3, angle, 0, Math.PI * 2);
        context.fillStyle = colors.flower;
        context.fill();
      }
      
      // Center
      context.beginPath();
      context.arc(fx, fy, 3, 0, Math.PI * 2);
      context.fillStyle = '#FFE135';
      context.fill();
    }
  }

  _drawParticle(context, typeData, elem) {
    const { width, colors } = typeData;
    const pulse = Math.sin(this._time * 0.05 + elem.phase) * 0.3 + 0.7;

    context.globalAlpha = pulse;
    context.beginPath();
    context.arc(0, 0, width / 2, 0, Math.PI * 2);
    context.fillStyle = colors[elem.colorIndex % colors.length];
    context.fill();
    context.globalAlpha = 1;
  }
}
