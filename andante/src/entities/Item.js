/**
 * Item - Data-driven collectible item
 */
import { Entity } from './Entity.js';
import { getItemType } from '../config/itemTypes.js';

export class Item extends Entity {
  _collected = false;
  _type = 'item';
  _typeData = null;
  _animationTime = 0;
  _floatOffset = 0;

  /**
   * @param {string} type - Item type key from ITEM_TYPES
   * @param {number} x
   * @param {number} y
   */
  constructor(type, x, y) {
    const typeData = getItemType(type);
    
    if (!typeData) {
      console.warn(`[Item] Unknown item type: ${type}`);
      super(x, y, 20, 20, { isStatic: true });
      this._type = type;
      return;
    }

    super(x, y, typeData.width, typeData.height, { isStatic: true });
    this._type = type;
    this._typeData = typeData;
    
    // Random start phase for variety
    this._animationTime = Math.random() * Math.PI * 2;
  }

  get type() {
    return this._type;
  }

  get collected() {
    return this._collected;
  }

  /**
   * Check if player overlaps with this item
   * @param {Entity} player
   * @returns {boolean}
   */
  checkCollision(player) {
    if (this._collected) {
      return false;
    }

    const itemBounds = {
      left: this.x,
      right: this.x + this.width,
      top: this.y - this.height,
      bottom: this.y,
    };

    const playerBounds = {
      left: player.x,
      right: player.x + player.width,
      top: player.y - player.height,
      bottom: player.y,
    };

    return (
      itemBounds.left < playerBounds.right &&
      itemBounds.right > playerBounds.left &&
      itemBounds.top < playerBounds.bottom &&
      itemBounds.bottom > playerBounds.top
    );
  }

  /**
   * Collect this item
   * @returns {Object} Item effect data
   */
  collect() {
    this._collected = true;
    return this._typeData?.effect || { type: 'unknown', value: 0 };
  }

  /**
   * Update animation
   * @param {Object} status - includes deltaTime
   */
  update(status) {
    if (this._collected || !this._typeData) {
      return;
    }

    // Floating animation (deltaTime-based, normalized to 60fps)
    if (this._typeData.render?.float) {
      const deltaTime = status?.deltaTime ?? (1/60);
      this._animationTime += 0.05 * deltaTime * 60;
      this._floatOffset = Math.sin(this._animationTime) * 3;
    }
  }

  /**
   * Render item based on type data
   * @param {CanvasRenderingContext2D} context
   * @param {Object} status
   */
  render(context, status) {
    if (this._collected) {
      return;
    }

    if (!this._typeData) {
      // Fallback for unknown types
      context.fillStyle = '#888888';
      context.fillRect(this.x, this.y - this.height, this.width, this.height);
      return;
    }

    const { render } = this._typeData;
    const centerX = this.x + this.width / 2;
    const centerY = this.y - this.height / 2 + this._floatOffset;

    switch (render.shape) {
      case 'circle':
        this._renderCircle(context, centerX, centerY, render);
        break;
      case 'hexagon':
        this._renderHexagon(context, centerX, centerY, render);
        break;
      case 'potatoSeed':
        this._renderPotatoSeed(context, centerX, centerY, render);
        break;
      case 'diamond':
        this._renderDiamond(context, centerX, centerY, render);
        break;
      case 'heart':
        this._renderHeart(context, centerX, centerY, render);
        break;
      default:
        this._renderCircle(context, centerX, centerY, render);
    }
  }

  /**
   * Render circle shape
   */
  _renderCircle(context, centerX, centerY, render) {
    const radius = this.width / 2 - 2;
    const { colors } = render;

    // Outer glow
    if (render.glow) {
      context.beginPath();
      context.arc(centerX, centerY, radius + 4, 0, Math.PI * 2);
      context.fillStyle = colors.glow;
      context.fill();
    }

    // Main circle with gradient
    const gradient = context.createRadialGradient(
      centerX - 3, centerY - 3, 0,
      centerX, centerY, radius
    );
    gradient.addColorStop(0, colors.highlight);
    gradient.addColorStop(0.7, colors.primary);
    gradient.addColorStop(1, colors.secondary);

    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.fillStyle = gradient;
    context.fill();

    // Inner highlight
    context.beginPath();
    context.arc(centerX - 2, centerY - 2, radius * 0.4, 0, Math.PI * 2);
    context.fillStyle = 'rgba(255, 255, 255, 0.6)';
    context.fill();

    // Border
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.strokeStyle = colors.secondary;
    context.lineWidth = 1.5;
    context.stroke();
  }

  /**
   * Render hexagon shape (cell-like)
   */
  _renderHexagon(context, centerX, centerY, render) {
    const radius = this.width / 2 - 2;
    const { colors } = render;

    // Draw hexagon path
    const drawHexagon = (r) => {
      context.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        if (i === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.closePath();
    };

    // Main fill (flat, no gradient)
    drawHexagon(radius);
    context.fillStyle = colors.fill;
    context.fill();

    // Border
    context.strokeStyle = colors.stroke;
    context.lineWidth = 1.5;
    context.stroke();

    // Sparkling edges
    this._renderHexagonSparkles(context, centerX, centerY, radius);
  }

  /**
   * Render potato seed with wrapping vines
   */
  _renderPotatoSeed(context, centerX, centerY, render) {
    const { colors } = render;
    const w = this.width;
    const h = this.height;
    const r = Math.min(w, h) * 0.38;

    // Draw vines wrapping around (back layer)
    this._renderWrappingVine(context, centerX, centerY, r, colors, 0, true);
    this._renderWrappingVine(context, centerX, centerY, r, colors, 2, true);

    // Draw potato body
    this._renderPotatoBody(context, centerX, centerY, w, h, colors);

    // Draw vines wrapping around (front layer)
    this._renderWrappingVine(context, centerX, centerY, r, colors, 1, false);
    this._renderWrappingVine(context, centerX, centerY, r, colors, 3, false);
  }

  /**
   * Render potato body
   */
  _renderPotatoBody(context, centerX, centerY, w, h, colors) {
    const r = Math.min(w, h) * 0.28;

    // Potato shape
    context.beginPath();
    context.ellipse(centerX, centerY, r * 1.1, r * 0.9, 0.1, 0, Math.PI * 2);
    context.closePath();

    // Gradient fill
    const gradient = context.createRadialGradient(
      centerX - r * 0.3, centerY - r * 0.3, 0,
      centerX, centerY, r * 1.1
    );
    gradient.addColorStop(0, 'rgba(230, 200, 160, 1)');
    gradient.addColorStop(0.5, colors.body);
    gradient.addColorStop(1, colors.bodyDark);
    context.fillStyle = gradient;
    context.fill();

    // Outline
    context.strokeStyle = colors.bodyDark;
    context.lineWidth = 1;
    context.stroke();

    // Highlight
    context.beginPath();
    context.ellipse(centerX - r * 0.35, centerY - r * 0.3, r * 0.25, r * 0.15, -0.5, 0, Math.PI * 2);
    context.fillStyle = 'rgba(255, 255, 255, 0.4)';
    context.fill();

    // Eyes
    context.beginPath();
    context.arc(centerX - r * 0.3, centerY + r * 0.1, 1.5, 0, Math.PI * 2);
    context.arc(centerX + r * 0.2, centerY - r * 0.2, 1.5, 0, Math.PI * 2);
    context.fillStyle = 'rgba(100, 70, 50, 0.5)';
    context.fill();
  }

  /**
   * Render a single vine that wraps around the potato
   */
  _renderWrappingVine(context, centerX, centerY, radius, colors, index, behind) {
    context.lineCap = 'round';

    // Each vine starts from different angle and wraps partially around
    const startAngles = [
      Math.PI * 0.1,   // top-right
      Math.PI * 0.6,   // bottom-right  
      Math.PI * 1.1,   // bottom-left
      Math.PI * 1.6,   // top-left
    ];
    const wrapAmount = [0.45, 0.5, 0.45, 0.4]; // How far each vine wraps (in PI)
    const outerRadius = [1.35, 1.4, 1.3, 1.35]; // How far out each vine goes

    const startAngle = startAngles[index];
    const wrap = wrapAmount[index];
    const outerR = radius * outerRadius[index];

    // Draw arc that goes out and wraps around
    context.beginPath();
    
    // Start from potato surface
    const startX = centerX + Math.cos(startAngle) * radius * 0.9;
    const startY = centerY + Math.sin(startAngle) * radius * 0.9;
    context.moveTo(startX, startY);

    // Go outward then wrap around
    const midAngle = startAngle + wrap * Math.PI * 0.5;
    const endAngle = startAngle + wrap * Math.PI;
    
    const midX = centerX + Math.cos(midAngle) * outerR;
    const midY = centerY + Math.sin(midAngle) * outerR;
    
    const endX = centerX + Math.cos(endAngle) * radius * 0.85;
    const endY = centerY + Math.sin(endAngle) * radius * 0.85;

    // Control points
    const cp1X = centerX + Math.cos(startAngle + wrap * Math.PI * 0.2) * outerR * 0.95;
    const cp1Y = centerY + Math.sin(startAngle + wrap * Math.PI * 0.2) * outerR * 0.95;
    const cp2X = centerX + Math.cos(startAngle + wrap * Math.PI * 0.8) * outerR * 0.9;
    const cp2Y = centerY + Math.sin(startAngle + wrap * Math.PI * 0.8) * outerR * 0.9;

    context.quadraticCurveTo(cp1X, cp1Y, midX, midY);
    context.quadraticCurveTo(cp2X, cp2Y, endX, endY);

    context.strokeStyle = colors.roots;
    context.lineWidth = 2;
    context.stroke();

    // Sparkle effect on vine (like cell edges)
    const sparkleOrder = [0, 2, 1, 3]; // Order of sparkling
    const sparkleIndex = sparkleOrder.indexOf(index);
    const phase = this._animationTime * 2.5 + (sparkleIndex * Math.PI / 2);
    const brightness = (Math.sin(phase) + 1) / 2;

    if (brightness > 0.3) {
      const alpha = (brightness - 0.3) / 0.7;
      
      // Sparkle along the vine
      context.beginPath();
      context.moveTo(startX, startY);
      context.quadraticCurveTo(cp1X, cp1Y, midX, midY);
      context.quadraticCurveTo(cp2X, cp2Y, endX, endY);
      context.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
      context.lineWidth = 2;
      context.stroke();
    }

    // Small sprout tip at end
    context.beginPath();
    context.arc(endX, endY, 2.5, 0, Math.PI * 2);
    context.fillStyle = colors.sprout;
    context.fill();
  }

  /**
   * Render sparkling effect on hexagon edges
   */
  _renderHexagonSparkles(context, centerX, centerY, radius) {
    // Get hexagon vertices
    const vertices = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      vertices.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    }

    // Edge order: 2,4,1,5,6,3 (1-indexed) -> [1,3,0,4,5,2] (0-indexed)
    const edgeOrder = [1, 3, 0, 4, 5, 2];

    for (let i = 0; i < 6; i++) {
      const edgeIndex = edgeOrder[i];
      const startVertex = vertices[edgeIndex];
      const endVertex = vertices[(edgeIndex + 1) % 6];

      // Each edge has different phase based on order
      const phase = this._animationTime * 2.5 + (i * Math.PI / 3);
      const brightness = (Math.sin(phase) + 1) / 2; // 0 to 1

      if (brightness > 0.3) {
        const alpha = (brightness - 0.3) / 0.7; // Normalize to 0-1

        // Draw sparkling edge
        context.beginPath();
        context.moveTo(startVertex.x, startVertex.y);
        context.lineTo(endVertex.x, endVertex.y);
        context.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
        context.lineWidth = 2;
        context.lineCap = 'round';
        context.stroke();
      }
    }
  }

  /**
   * Render diamond shape
   */
  _renderDiamond(context, centerX, centerY, render) {
    const halfW = this.width / 2 - 2;
    const halfH = this.height / 2 - 2;
    const { colors } = render;

    // Outer glow
    if (render.glow) {
      context.beginPath();
      context.moveTo(centerX, centerY - halfH - 4);
      context.lineTo(centerX + halfW + 4, centerY);
      context.lineTo(centerX, centerY + halfH + 4);
      context.lineTo(centerX - halfW - 4, centerY);
      context.closePath();
      context.fillStyle = colors.glow;
      context.fill();
    }

    // Main diamond
    context.beginPath();
    context.moveTo(centerX, centerY - halfH);
    context.lineTo(centerX + halfW, centerY);
    context.lineTo(centerX, centerY + halfH);
    context.lineTo(centerX - halfW, centerY);
    context.closePath();

    const gradient = context.createLinearGradient(
      centerX - halfW, centerY - halfH,
      centerX + halfW, centerY + halfH
    );
    gradient.addColorStop(0, colors.highlight);
    gradient.addColorStop(0.5, colors.primary);
    gradient.addColorStop(1, colors.secondary);
    context.fillStyle = gradient;
    context.fill();

    // Border
    context.strokeStyle = colors.secondary;
    context.lineWidth = 1.5;
    context.stroke();

    // Highlight
    context.beginPath();
    context.moveTo(centerX, centerY - halfH + 3);
    context.lineTo(centerX - halfW + 5, centerY);
    context.lineTo(centerX, centerY - 2);
    context.closePath();
    context.fillStyle = 'rgba(255, 255, 255, 0.4)';
    context.fill();
  }

  /**
   * Render heart shape
   */
  _renderHeart(context, centerX, centerY, render) {
    const size = this.width / 2 - 2;
    const { colors } = render;

    const drawHeart = (scale) => {
      context.beginPath();
      const topY = centerY - size * scale * 0.3;
      context.moveTo(centerX, centerY + size * scale * 0.7);
      context.bezierCurveTo(
        centerX - size * scale * 1.2, centerY,
        centerX - size * scale * 1.2, topY - size * scale * 0.5,
        centerX, topY
      );
      context.bezierCurveTo(
        centerX + size * scale * 1.2, topY - size * scale * 0.5,
        centerX + size * scale * 1.2, centerY,
        centerX, centerY + size * scale * 0.7
      );
      context.closePath();
    };

    // Outer glow
    if (render.glow) {
      drawHeart(1.3);
      context.fillStyle = colors.glow;
      context.fill();
    }

    // Main heart
    drawHeart(1);
    const gradient = context.createRadialGradient(
      centerX - 2, centerY - 2, 0,
      centerX, centerY, size
    );
    gradient.addColorStop(0, colors.highlight);
    gradient.addColorStop(0.6, colors.primary);
    gradient.addColorStop(1, colors.secondary);
    context.fillStyle = gradient;
    context.fill();

    // Border
    context.strokeStyle = colors.secondary;
    context.lineWidth = 1.5;
    context.stroke();
  }

  // Cache for UI icon instances
  static _iconCache = {};

  /**
   * Static method to render item icon for UI
   * Uses actual Item instance to ensure identical rendering
   * @param {CanvasRenderingContext2D} context
   * @param {string} type - Item type key
   * @param {number} x - Center X position
   * @param {number} y - Center Y position
   * @param {number} scale - Scale factor (default 1.0)
   * @param {number} animationTime - Animation time for effects (optional)
   */
  static renderIcon(context, type, x, y, scale = 1.0, animationTime = 0) {
    // Get or create cached item instance
    if (!Item._iconCache[type]) {
      Item._iconCache[type] = new Item(type, 0, 0);
    }

    const item = Item._iconCache[type];
    if (!item._typeData) {
      return;
    }

    // Update animation time
    item._animationTime = animationTime;

    context.save();

    // Translate to center position (item renders from bottom-left, so adjust)
    const centerX = x - (item.width / 2) * scale;
    const centerY = y + (item.height / 2) * scale;

    context.translate(centerX, centerY);
    context.scale(scale, scale);

    // Render using the actual item render method (without collected check)
    const { render } = item._typeData;
    const itemCenterX = item.width / 2;
    const itemCenterY = -item.height / 2;

    switch (render.shape) {
      case 'circle':
        item._renderCircle(context, itemCenterX, itemCenterY, render);
        break;
      case 'hexagon':
        item._renderHexagon(context, itemCenterX, itemCenterY, render);
        break;
      case 'potatoSeed':
        item._renderPotatoSeed(context, itemCenterX, itemCenterY, render);
        break;
      case 'diamond':
        item._renderDiamond(context, itemCenterX, itemCenterY, render);
        break;
      case 'heart':
        item._renderHeart(context, itemCenterX, itemCenterY, render);
        break;
      default:
        item._renderCircle(context, itemCenterX, itemCenterY, render);
    }

    context.restore();
  }
}
