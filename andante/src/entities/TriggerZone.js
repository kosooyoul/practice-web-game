/**
 * TriggerZone - Interactive zone that triggers events when activated
 */
import { Entity } from './Entity.js';
import { getRecipe, canCraft, consumeIngredients } from '../config/recipes.js';

// Trigger states
export const TRIGGER_STATE = {
  IDLE: 'idle',           // Waiting for player
  ACTIVE: 'active',       // Player is in zone
  ACTIVATING: 'activating', // Animation playing
  COMPLETED: 'completed', // Already used
};

export class TriggerZone extends Entity {
  _recipeId = null;
  _recipe = null;
  _state = TRIGGER_STATE.IDLE;
  _playerInZone = false;
  
  // Animation state
  _animationProgress = 0;
  _animationDuration = 0;
  
  // Result data (platforms to spawn, etc.)
  _resultData = null;
  
  // Visual
  _pulseTime = 0;
  _hintOpacity = 0;

  /**
   * @param {number} x - Zone X position
   * @param {number} y - Zone Y position (bottom)
   * @param {number} width - Zone width
   * @param {number} height - Zone height
   * @param {string} recipeId - Recipe to use
   * @param {Object} resultData - Data for the result (e.g., platforms to spawn)
   */
  constructor(x, y, width, height, recipeId, resultData = null) {
    super(x, y, width, height, { isStatic: true });
    this._recipeId = recipeId;
    this._recipe = getRecipe(recipeId);
    this._resultData = resultData;
    
    if (!this._recipe) {
      console.warn(`[TriggerZone] Unknown recipe: ${recipeId}`);
    }
  }

  get state() {
    return this._state;
  }

  get recipe() {
    return this._recipe;
  }

  get recipeId() {
    return this._recipeId;
  }

  get resultData() {
    return this._resultData;
  }

  get animationProgress() {
    return this._animationProgress;
  }

  get isCompleted() {
    return this._state === TRIGGER_STATE.COMPLETED;
  }

  /**
   * Check if player is overlapping this zone
   * @param {Entity} player
   * @returns {boolean}
   */
  checkPlayerInZone(player) {
    if (this._state === TRIGGER_STATE.COMPLETED) {
      return false;
    }

    const zoneBounds = {
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

    const inZone = (
      zoneBounds.left < playerBounds.right &&
      zoneBounds.right > playerBounds.left &&
      zoneBounds.top < playerBounds.bottom &&
      zoneBounds.bottom > playerBounds.top
    );

    // Update state based on player position
    if (inZone && !this._playerInZone) {
      this._playerInZone = true;
      if (this._state === TRIGGER_STATE.IDLE) {
        this._state = TRIGGER_STATE.ACTIVE;
      }
    } else if (!inZone && this._playerInZone) {
      this._playerInZone = false;
      if (this._state === TRIGGER_STATE.ACTIVE) {
        this._state = TRIGGER_STATE.IDLE;
      }
    }

    return inZone;
  }

  /**
   * Check if can activate with current inventory
   * @param {Object} inventory
   * @returns {boolean}
   */
  canActivate(inventory) {
    if (this._state !== TRIGGER_STATE.ACTIVE || !this._recipe) {
      return false;
    }
    return canCraft(this._recipe, inventory);
  }

  /**
   * Activate the trigger (consume items and start animation)
   * @param {Object} inventory - Will be mutated
   * @returns {boolean} Success
   */
  activate(inventory) {
    if (!this.canActivate(inventory)) {
      return false;
    }

    // Consume ingredients
    if (!consumeIngredients(this._recipe, inventory)) {
      return false;
    }

    // Start activation animation
    this._state = TRIGGER_STATE.ACTIVATING;
    this._animationProgress = 0;
    this._animationDuration = this._recipe.result?.duration || 1000;

    return true;
  }

  /**
   * Update trigger state
   * @param {Object} status
   */
  update(status) {
    const deltaTime = status?.deltaTime ?? (1/60);

    // Update pulse animation
    this._pulseTime += deltaTime * 60;

    // Update hint opacity (fade in/out)
    if (this._state === TRIGGER_STATE.ACTIVE) {
      this._hintOpacity = Math.min(this._hintOpacity + deltaTime * 3, 1);
    } else {
      this._hintOpacity = Math.max(this._hintOpacity - deltaTime * 3, 0);
    }

    // Update activation animation
    if (this._state === TRIGGER_STATE.ACTIVATING) {
      const progressDelta = (deltaTime * 1000) / this._animationDuration;
      this._animationProgress = Math.min(this._animationProgress + progressDelta, 1);

      if (this._animationProgress >= 1) {
        this._state = TRIGGER_STATE.COMPLETED;
      }
    }
  }

  /**
   * Render trigger zone
   * @param {CanvasRenderingContext2D} context
   * @param {Object} status
   */
  render(context, status) {
    if (this._state === TRIGGER_STATE.COMPLETED) {
      return; // Don't render completed triggers
    }

    const x = this.x;
    const y = this.y - this.height;
    const w = this.width;
    const h = this.height;
    const centerX = x + w / 2;
    const centerY = y + h / 2;

    // Pulsing effect
    const pulse = Math.sin(this._pulseTime * 0.05) * 0.2 + 0.8;

    // Base zone indicator
    context.save();

    if (this._state === TRIGGER_STATE.ACTIVATING) {
      // Activating - bright glow
      const glow = this._animationProgress;
      context.fillStyle = `rgba(100, 200, 100, ${0.3 + glow * 0.4})`;
      context.strokeStyle = `rgba(50, 150, 50, ${0.8 + glow * 0.2})`;
    } else if (this._state === TRIGGER_STATE.ACTIVE) {
      // Active - highlighted
      context.fillStyle = `rgba(100, 200, 100, ${0.2 * pulse})`;
      context.strokeStyle = `rgba(50, 150, 50, ${0.6 * pulse})`;
    } else {
      // Idle - subtle
      context.fillStyle = `rgba(100, 150, 100, ${0.1 * pulse})`;
      context.strokeStyle = `rgba(50, 100, 50, ${0.3 * pulse})`;
    }

    context.lineWidth = 2;
    context.setLineDash([5, 5]);
    context.fillRect(x, y, w, h);
    context.strokeRect(x, y, w, h);
    context.setLineDash([]);

    // Draw icon in center (seed + sparkle)
    this._renderIcon(context, centerX, centerY, pulse);

    context.restore();
  }

  /**
   * Render trigger icon
   */
  _renderIcon(context, cx, cy, pulse) {
    const size = 16 * pulse;

    // Sparkle/magic circle
    context.strokeStyle = `rgba(150, 200, 100, ${0.5 * pulse})`;
    context.lineWidth = 2;
    context.beginPath();
    context.arc(cx, cy, size + 4, 0, Math.PI * 2);
    context.stroke();

    // Inner seed shape
    context.fillStyle = `rgba(180, 140, 100, ${0.8 * pulse})`;
    context.beginPath();
    context.ellipse(cx, cy, size * 0.6, size * 0.8, 0, 0, Math.PI * 2);
    context.fill();

    // Small sprout
    context.strokeStyle = `rgba(100, 180, 80, ${0.9 * pulse})`;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(cx, cy - size * 0.5);
    context.quadraticCurveTo(cx + 4, cy - size, cx + 2, cy - size * 1.2);
    context.stroke();
  }

  /**
   * Render UI hint when player is in zone
   * @param {CanvasRenderingContext2D} context
   * @param {Object} inventory
   * @param {Object} screenPos - { x, y } screen position for hint
   */
  renderHint(context, inventory, screenPos) {
    if (this._hintOpacity <= 0 || !this._recipe) {
      return;
    }

    context.save();
    context.globalAlpha = this._hintOpacity;

    const padding = 10;
    const lineHeight = 20;
    const boxWidth = 180;
    const boxHeight = 60 + this._recipe.ingredients.length * lineHeight;
    const boxX = screenPos.x - boxWidth / 2;
    const boxY = screenPos.y - boxHeight - 20;

    // Background
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.strokeStyle = 'rgba(100, 200, 100, 0.8)';
    context.lineWidth = 2;
    this._roundRect(context, boxX, boxY, boxWidth, boxHeight, 8);
    context.fill();
    context.stroke();

    // Title
    context.fillStyle = '#FFFFFF';
    context.font = 'bold 14px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'top';
    context.fillText(this._recipe.name, screenPos.x, boxY + padding);

    // Ingredients
    context.font = '12px sans-serif';
    context.textAlign = 'left';
    let y = boxY + padding + 24;

    for (const ingredient of this._recipe.ingredients) {
      const have = inventory[ingredient.type] || 0;
      const need = ingredient.count;
      const enough = have >= need;

      context.fillStyle = enough ? '#88FF88' : '#FF8888';
      context.fillText(
        `${ingredient.type}: ${have}/${need}`,
        boxX + padding,
        y
      );
      y += lineHeight;
    }

    // Action hint
    const canActivate = canCraft(this._recipe, inventory);
    context.fillStyle = canActivate ? '#88FF88' : '#AAAAAA';
    context.textAlign = 'center';
    context.fillText(
      canActivate ? '[E / B버튼] 활성화' : '재료 부족',
      screenPos.x,
      boxY + boxHeight - padding - 12
    );

    context.restore();
  }

  /**
   * Draw rounded rectangle
   */
  _roundRect(context, x, y, w, h, r) {
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + w - r, y);
    context.quadraticCurveTo(x + w, y, x + w, y + r);
    context.lineTo(x + w, y + h - r);
    context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    context.lineTo(x + r, y + h);
    context.quadraticCurveTo(x, y + h, x, y + h - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
  }
}
