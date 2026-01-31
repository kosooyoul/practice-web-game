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
   * @param {Object} status
   */
  update(status) {
    if (this._collected || !this._typeData) {
      return;
    }

    // Floating animation
    if (this._typeData.render?.float) {
      this._animationTime += 0.05;
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
}
