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
   * Render trigger zone - Rotting potato that revives
   * COMPLETED 시에도 정화된 모습(revival=1)을 계속 보여줌.
   * @param {CanvasRenderingContext2D} context
   * @param {Object} status
   */
  render(context, status) {
    const x = this.x;
    const y = this.y;  // Ground level
    const w = this.width;
    const centerX = x + w / 2;

    // Calculate revival progress (0 = dead, 1 = alive)
    let revivalProgress = 0;
    if (this._state === TRIGGER_STATE.ACTIVE) {
      revivalProgress = 0.2;  // Slight hint of life when player near
    } else if (this._state === TRIGGER_STATE.ACTIVATING) {
      revivalProgress = 0.2 + this._animationProgress * 0.8;
    } else if (this._state === TRIGGER_STATE.COMPLETED) {
      revivalProgress = 1;  // 완료 후에는 정화된 모습을 계속 표시
    }

    context.save();

    // Draw the rotting/reviving potato (no size pulsing)
    this._renderRottingPotato(context, centerX, y, revivalProgress);

    context.restore();
  }

  /**
   * Render a rotting potato that can revive
   */
  _renderRottingPotato(context, cx, groundY, revival) {
    const size = 22;  // Smaller potato
    const time = this._pulseTime;
    
    // Color interpolation based on revival
    // Dead: gray-brown, moldy  ->  Alive: healthy golden
    const deadColor = { r: 90, g: 75, b: 60 };    // Rotting gray-brown
    const aliveColor = { r: 220, g: 190, b: 130 }; // Healthy golden
    const deadSpot = { r: 60, g: 50, b: 40 };     // Mold spots
    const aliveSpot = { r: 180, g: 150, b: 100 };  // Healthy spots

    const lerp = (a, b, t) => a + (b - a) * t;
    const r = Math.round(lerp(deadColor.r, aliveColor.r, revival));
    const g = Math.round(lerp(deadColor.g, aliveColor.g, revival));
    const b = Math.round(lerp(deadColor.b, aliveColor.b, revival));
    const sr = Math.round(lerp(deadSpot.r, aliveSpot.r, revival));
    const sg = Math.round(lerp(deadSpot.g, aliveSpot.g, revival));
    const sb = Math.round(lerp(deadSpot.b, aliveSpot.b, revival));

    const potatoY = groundY - size * 0.4;

    // === ROTTING EFFECTS (fade as revival increases) ===
    const rotEffect = 1 - revival;  // 1 when dead, 0 when alive

    // Toxic aura/miasma (dark purple-green glow)
    // if (rotEffect > 0.2) {
    //   this._renderToxicAura(context, cx, potatoY, size, rotEffect, time);
    // }

    // Stink waves
    if (rotEffect > 0.3) {
      this._renderStinkWaves(context, cx, potatoY, size, rotEffect, time);
    }

    // === PURIFICATION EFFECTS (appear as revival increases) ===
    if (revival > 0.2) {
      this._renderPurificationAura(context, cx, potatoY, size, revival, time);
    }

    // Shadow
    context.fillStyle = 'rgba(0, 0, 0, 0.2)';
    context.beginPath();
    context.ellipse(cx, groundY, size * 0.8, size * 0.2, 0, 0, Math.PI * 2);
    context.fill();

    // Main potato body (lumpy shape)
    context.fillStyle = `rgb(${r}, ${g}, ${b})`;
    context.beginPath();
    // Create lumpy potato shape
    context.moveTo(cx - size, potatoY);
    context.bezierCurveTo(
      cx - size * 0.9, potatoY - size * 0.6,
      cx - size * 0.3, potatoY - size * 0.8,
      cx, potatoY - size * 0.7
    );
    context.bezierCurveTo(
      cx + size * 0.4, potatoY - size * 0.9,
      cx + size * 0.9, potatoY - size * 0.5,
      cx + size, potatoY
    );
    context.bezierCurveTo(
      cx + size * 0.8, potatoY + size * 0.5,
      cx + size * 0.3, potatoY + size * 0.6,
      cx, potatoY + size * 0.5
    );
    context.bezierCurveTo(
      cx - size * 0.4, potatoY + size * 0.6,
      cx - size * 0.9, potatoY + size * 0.4,
      cx - size, potatoY
    );
    context.fill();

    // Spots/eyes (mold when dead, normal eyes when alive)
    context.fillStyle = `rgb(${sr}, ${sg}, ${sb})`;
    const spots = [
      { x: -0.3, y: -0.2, s: 0.15 },
      { x: 0.2, y: -0.3, s: 0.12 },
      { x: 0.4, y: 0.1, s: 0.1 },
      { x: -0.5, y: 0.15, s: 0.08 },
      { x: 0, y: 0.2, s: 0.1 },
    ];
    
    for (const spot of spots) {
      context.beginPath();
      context.arc(
        cx + spot.x * size,
        potatoY + spot.y * size,
        size * spot.s * (1 - revival * 0.3),  // Spots shrink as it revives
        0, Math.PI * 2
      );
      context.fill();
    }

    // Wrinkles when dead (fade as it revives)
    if (revival < 0.8) {
      const wrinkleAlpha = (1 - revival) * 0.4;
      context.strokeStyle = `rgba(50, 40, 30, ${wrinkleAlpha})`;
      context.lineWidth = 1;
      
      // Wrinkle lines
      context.beginPath();
      context.moveTo(cx - size * 0.6, potatoY - size * 0.1);
      context.quadraticCurveTo(cx - size * 0.3, potatoY, cx - size * 0.5, potatoY + size * 0.2);
      context.stroke();
      
      context.beginPath();
      context.moveTo(cx + size * 0.4, potatoY - size * 0.3);
      context.quadraticCurveTo(cx + size * 0.5, potatoY - size * 0.1, cx + size * 0.3, potatoY + size * 0.1);
      context.stroke();
    }

    // Flies buzzing around (fade as it revives)
    if (rotEffect > 0.4) {
      this._renderFlies(context, cx, potatoY, size, rotEffect, time);
    }

    // Wilted sprout (grows stronger as it revives)
    this._renderPotatoSprout(context, cx - size * 0.1, potatoY - size * 0.7, size, revival);

    // Glow effect when active/activating
    if (revival > 0.1) {
      const glowAlpha = revival * 0.3;
      const gradient = context.createRadialGradient(cx, potatoY, 0, cx, potatoY, size * 1.5);
      gradient.addColorStop(0, `rgba(150, 255, 100, ${glowAlpha})`);
      gradient.addColorStop(1, 'rgba(150, 255, 100, 0)');
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(cx, potatoY, size * 1.5, 0, Math.PI * 2);
      context.fill();
    }

    // Sparkles when reviving
    if (revival > 0.3) {
      this._renderSparkles(context, cx, potatoY, size, revival, this._pulseTime);
    }
  }

  /**
   * Render potato sprout (wilted when dead, blooming when alive)
   */
  _renderPotatoSprout(context, x, y, size, revival) {
    const time = this._pulseTime;
    
    // Sprout properties based on revival
    const sproutHeight = size * (0.5 + revival * 1.5);  // Grows taller
    const sproutDroop = (1 - revival) * 0.6;  // How much it droops
    
    // Color transitions: brown -> green -> vibrant green
    const stemGreen = Math.min(255, 80 + revival * 150);
    const stemColor = revival < 0.3
      ? `rgb(${100 - revival * 50}, ${70 + revival * 60}, ${50})`  // Brown-ish when dead
      : `rgb(${60 + revival * 30}, ${stemGreen}, ${50 + revival * 30})`;  // Green when alive

    const sway = Math.sin(time * 0.025) * (revival * 4);

    // Main stem
    context.strokeStyle = stemColor;
    context.lineCap = 'round';
    context.lineWidth = 2 + revival * 2;

    context.beginPath();
    context.moveTo(x, y);
    context.quadraticCurveTo(
      x + sway + sproutDroop * 12,
      y - sproutHeight * 0.5 + sproutDroop * 8,
      x + sway * 1.2 + sproutDroop * 15,
      y - sproutHeight + sproutDroop * 10
    );
    context.stroke();

    // Growing leaves along stem
    if (revival > 0.25) {
      const leafColor = `rgb(${70 + revival * 40}, ${130 + revival * 80}, ${50 + revival * 30})`;
      this._renderSproutLeaves(context, x, y, sproutHeight, sway, revival, leafColor, time);
    }

    // Flower bud / blooming flower at top
    if (revival > 0.5) {
      const topX = x + sway * 1.2 + sproutDroop * 15;
      const topY = y - sproutHeight + sproutDroop * 10;
      this._renderSproutFlower(context, topX, topY, size, revival, time);
    }
  }

  /**
   * Render leaves along the sprout (교차: 줄기 따라 좌→우→좌→우 번갈아)
   */
  _renderSproutLeaves(context, x, y, height, sway, revival, color, time) {
    const pairCount = Math.min(2, Math.floor(revival * 3));  // 최대 2쌍
    const totalLeaves = pairCount * 2;  // 총 잎 개수

    for (let i = 0; i < totalLeaves; i++) {
      const t = (i + 1) / (totalLeaves + 1);  // 줄기 위 위치 (아래→위)
      const leafY = y - height * t;
      const leafX = x + sway * t;
      const leafSize = 6 + revival * 8 * (1 - t * 0.3);
      const leafSway = Math.sin(time * 0.02 + i) * 2 * revival;
      const isLeft = i % 2 === 0;  // 짝수: 왼쪽, 홀수: 오른쪽 → 교차

      context.fillStyle = color;

      if (isLeft) {
        context.save();
        context.translate(leafX - leafSize * 0.5 + leafSway, leafY);
        context.rotate(-0.4 - revival * 0.2);
        context.beginPath();
        context.moveTo(0, 0);
        context.bezierCurveTo(-leafSize * 0.6, -leafSize * 0.3, -leafSize, 0, -leafSize * 0.5, leafSize * 0.4);
        context.bezierCurveTo(0, leafSize * 0.2, 0, 0, 0, 0);
        context.fill();
        context.restore();
      } else {
        context.save();
        context.translate(leafX + leafSize * 0.5 - leafSway, leafY);
        context.rotate(0.4 + revival * 0.2);
        context.beginPath();
        context.moveTo(0, 0);
        context.bezierCurveTo(leafSize * 0.6, -leafSize * 0.3, leafSize, 0, leafSize * 0.5, leafSize * 0.4);
        context.bezierCurveTo(0, leafSize * 0.2, 0, 0, 0, 0);
        context.fill();
        context.restore();
      }
    }
  }

  /**
   * Render flower at top of sprout (bud -> bloom)
   */
  _renderSproutFlower(context, x, y, size, revival, time) {
    const bloomProgress = (revival - 0.5) * 2;  // 0-1 for blooming
    const flowerSize = size * 0.4 * (0.3 + bloomProgress * 0.7);
    const petalCount = 5;
    const petalOpen = bloomProgress * 0.8;  // How open petals are
    
    // Gentle sway
    const sway = Math.sin(time * 0.02) * 2 * bloomProgress;
    
    context.save();
    context.translate(x + sway, y);
    
    // Petals
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2 - Math.PI / 2;
      const petalAngle = angle + Math.sin(time * 0.015 + i) * 0.1;
      
      // Petal color: pink/white gradient
      const hue = 340 + i * 5;  // Slight color variation
      const saturation = 60 + bloomProgress * 30;
      const lightness = 75 + bloomProgress * 15;
      
      context.save();
      context.rotate(petalAngle);
      context.translate(0, -flowerSize * petalOpen);
      
      // Petal shape
      context.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      context.beginPath();
      context.ellipse(0, -flowerSize * 0.3, flowerSize * 0.4, flowerSize * 0.6, 0, 0, Math.PI * 2);
      context.fill();
      
      // Petal highlight
      context.fillStyle = `hsla(${hue}, ${saturation - 20}%, ${lightness + 10}%, 0.5)`;
      context.beginPath();
      context.ellipse(0, -flowerSize * 0.4, flowerSize * 0.2, flowerSize * 0.3, 0, 0, Math.PI * 2);
      context.fill();
      
      context.restore();
    }
    
    // Flower center (yellow)
    const centerSize = flowerSize * (0.3 + bloomProgress * 0.3);
    const centerGradient = context.createRadialGradient(0, 0, 0, 0, 0, centerSize);
    centerGradient.addColorStop(0, '#FFE566');
    centerGradient.addColorStop(0.7, '#FFCC00');
    centerGradient.addColorStop(1, '#E6A800');
    
    context.fillStyle = centerGradient;
    context.beginPath();
    context.arc(0, 0, centerSize, 0, Math.PI * 2);
    context.fill();
    
    // Pollen dots
    if (bloomProgress > 0.5) {
      context.fillStyle = '#CC8800';
      for (let i = 0; i < 5; i++) {
        const dotAngle = (i / 5) * Math.PI * 2 + time * 0.01;
        const dotDist = centerSize * 0.5;
        context.beginPath();
        context.arc(
          Math.cos(dotAngle) * dotDist,
          Math.sin(dotAngle) * dotDist,
          1.5, 0, Math.PI * 2
        );
        context.fill();
      }
    }
    
    context.restore();
  }

  /**
   * Render magic sparkles during revival
   */
  _renderSparkles(context, cx, cy, size, revival, time) {
    const sparkleCount = Math.floor(revival * 8);
    
    for (let i = 0; i < sparkleCount; i++) {
      const angle = (i / sparkleCount) * Math.PI * 2 + time * 0.015;
      const dist = size * (0.6 + Math.sin(time * 0.04 + i) * 0.3);
      const twinkle = (Math.sin(time * 0.15 + i * 3) + 1) * 0.5;  // Twinkling effect
      const sparkleSize = (2 + revival * 2) * twinkle;
      
      const sx = cx + Math.cos(angle) * dist;
      const sy = cy + Math.sin(angle) * dist * 0.5 - size * 0.5;
      
      if (sparkleSize < 0.5) continue;  // Skip dim sparkles
      
      // Star shape sparkle
      context.save();
      context.translate(sx, sy);
      context.rotate(time * 0.02 + i);
      
      // Sparkle glow
      const gradient = context.createRadialGradient(0, 0, 0, 0, 0, sparkleSize * 3);
      gradient.addColorStop(0, `rgba(255, 255, 220, ${revival * twinkle * 0.9})`);
      gradient.addColorStop(0.3, `rgba(255, 240, 180, ${revival * twinkle * 0.5})`);
      gradient.addColorStop(1, 'rgba(255, 220, 150, 0)');
      
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(0, 0, sparkleSize * 3, 0, Math.PI * 2);
      context.fill();
      
      // Cross sparkle rays
      context.strokeStyle = `rgba(255, 255, 255, ${revival * twinkle})`;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(-sparkleSize * 1.5, 0);
      context.lineTo(sparkleSize * 1.5, 0);
      context.moveTo(0, -sparkleSize * 1.5);
      context.lineTo(0, sparkleSize * 1.5);
      context.stroke();
      
      // Bright core
      context.fillStyle = `rgba(255, 255, 255, ${revival * twinkle})`;
      context.beginPath();
      context.arc(0, 0, sparkleSize * 0.3, 0, Math.PI * 2);
      context.fill();
      
      context.restore();
    }
  }

  /**
   * Render toxic aura around rotting potato
   */
  _renderToxicAura(context, cx, cy, size, rotEffect, time) {
    const auraSize = size * 1.5;
    const pulse = Math.sin(time * 0.02) * 0.1 + 0.9;
    
    // Outer toxic glow (purple-green)
    const gradient = context.createRadialGradient(cx, cy, size * 0.3, cx, cy, auraSize * pulse);
    gradient.addColorStop(0, `rgba(80, 60, 90, ${rotEffect * 0.25})`);
    gradient.addColorStop(0.5, `rgba(60, 80, 50, ${rotEffect * 0.15})`);
    gradient.addColorStop(1, 'rgba(50, 70, 40, 0)');
    
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(cx, cy, auraSize * pulse, 0, Math.PI * 2);
    context.fill();
  }

  /**
   * Render beautiful purification aura during revival
   */
  _renderPurificationAura(context, cx, cy, size, revival, time) {
    const intensity = revival;
    const auraSize = size * (1.5 + revival * 1.5);
    
    // Golden-white holy glow
    const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, auraSize);
    gradient.addColorStop(0, `rgba(255, 250, 200, ${intensity * 0.4})`);
    gradient.addColorStop(0.3, `rgba(255, 220, 150, ${intensity * 0.25})`);
    gradient.addColorStop(0.6, `rgba(200, 255, 180, ${intensity * 0.15})`);
    gradient.addColorStop(1, 'rgba(150, 255, 150, 0)');
    
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(cx, cy, auraSize, 0, Math.PI * 2);
    context.fill();

    // Rising light particles
    this._renderRisingLightParticles(context, cx, cy, size, revival, time);

    // Swirling magic circles
    if (revival > 0.4) {
      this._renderMagicCircles(context, cx, cy, size, revival, time);
    }

    // Petal shower effect
    if (revival > 0.6) {
      this._renderPetalShower(context, cx, cy, size, revival, time);
    }
  }

  /**
   * Render rising light particles during purification
   */
  _renderRisingLightParticles(context, cx, cy, size, revival, time) {
    const particleCount = Math.floor(revival * 12);
    
    for (let i = 0; i < particleCount; i++) {
      // Each particle rises in a cycle
      const cycle = (time * 0.02 + i * 0.7) % 4;
      const progress = cycle / 4;
      
      // Spiral upward motion
      const angle = i * 0.8 + progress * Math.PI;
      const radius = size * (0.5 + progress * 0.8) * (1 - progress * 0.3);
      const riseY = -progress * size * 3;
      
      const px = cx + Math.cos(angle) * radius;
      const py = cy + riseY + Math.sin(progress * Math.PI) * 5;
      
      const alpha = (1 - progress) * revival * 0.8;
      const particleSize = (2 + revival * 3) * (1 - progress * 0.5);
      
      // Particle glow
      const gradient = context.createRadialGradient(px, py, 0, px, py, particleSize * 2);
      gradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(255, 220, 150, ${alpha * 0.5})`);
      gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
      
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(px, py, particleSize * 2, 0, Math.PI * 2);
      context.fill();
      
      // Bright core
      context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      context.beginPath();
      context.arc(px, py, particleSize * 0.4, 0, Math.PI * 2);
      context.fill();
    }
  }

  /**
   * Render swirling magic circles
   */
  _renderMagicCircles(context, cx, cy, size, revival, time) {
    const circleAlpha = (revival - 0.4) * 1.5;
    
    // Rotating outer ring
    context.save();
    context.translate(cx, cy);
    context.rotate(time * 0.01);
    
    context.strokeStyle = `rgba(255, 220, 150, ${circleAlpha * 0.4})`;
    context.lineWidth = 1.5;
    context.setLineDash([4, 4]);
    context.beginPath();
    context.arc(0, 0, size * 1.8, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
    
    // Inner counter-rotating ring
    context.rotate(-time * 0.02);
    context.strokeStyle = `rgba(200, 255, 180, ${circleAlpha * 0.3})`;
    context.beginPath();
    context.arc(0, 0, size * 1.3, 0, Math.PI * 2);
    context.stroke();
    
    // Small decorative dots on the ring
    const dotCount = 6;
    for (let i = 0; i < dotCount; i++) {
      const dotAngle = (i / dotCount) * Math.PI * 2;
      const dotX = Math.cos(dotAngle) * size * 1.8;
      const dotY = Math.sin(dotAngle) * size * 1.8;
      
      context.fillStyle = `rgba(255, 255, 200, ${circleAlpha * 0.6})`;
      context.beginPath();
      context.arc(dotX, dotY, 2, 0, Math.PI * 2);
      context.fill();
    }
    
    context.restore();
  }

  /**
   * Render falling flower petals during purification
   */
  _renderPetalShower(context, cx, cy, size, revival, time) {
    const petalCount = Math.floor((revival - 0.6) * 15);
    
    for (let i = 0; i < petalCount; i++) {
      // Each petal falls in a cycle
      const cycle = (time * 0.015 + i * 0.5) % 5;
      const progress = cycle / 5;
      
      // Floating descent with drift
      const startX = cx + (i % 3 - 1) * size * 1.5;
      const drift = Math.sin(progress * Math.PI * 2 + i) * size * 0.8;
      const fallY = -size * 2 + progress * size * 4;
      
      const px = startX + drift;
      const py = cy + fallY;
      
      // Skip if too far
      if (py > cy + size * 1.5 || py < cy - size * 3) continue;
      
      const alpha = Math.sin(progress * Math.PI) * revival * 0.7;
      const petalSize = 4 + Math.sin(i) * 2;
      const rotation = progress * Math.PI * 3 + i;
      
      // Draw petal
      context.save();
      context.translate(px, py);
      context.rotate(rotation);
      
      // Petal colors (pink/white variations)
      const hue = 340 + (i % 5) * 8;
      context.fillStyle = `hsla(${hue}, 70%, 85%, ${alpha})`;
      
      context.beginPath();
      context.ellipse(0, 0, petalSize, petalSize * 0.5, 0, 0, Math.PI * 2);
      context.fill();
      
      context.restore();
    }
  }

  /**
   * Render stink waves rising from potato
   */
  _renderStinkWaves(context, cx, cy, size, rotEffect, time) {
    const waveCount = 3;
    
    for (let i = 0; i < waveCount; i++) {
      // Each wave at different phase
      const phase = (time * 0.03 + i * 2) % 6;  // 0-6 cycle
      const progress = phase / 6;  // 0-1
      
      if (progress > 0.9) continue;  // Skip near end of cycle
      
      const waveY = cy - size * 0.5 - progress * size * 1.5;
      const waveWidth = size * (0.3 + progress * 0.4);
      const alpha = rotEffect * (1 - progress) * 0.4;
      
      // Wavy stink line
      context.strokeStyle = `rgba(100, 120, 70, ${alpha})`;
      context.lineWidth = 2;
      context.lineCap = 'round';
      
      context.beginPath();
      const startX = cx - waveWidth;
      context.moveTo(startX, waveY);
      
      // Create wavy path
      for (let j = 0; j <= 4; j++) {
        const t = j / 4;
        const wx = startX + t * waveWidth * 2;
        const wy = waveY + Math.sin(t * Math.PI * 2 + time * 0.05) * 4;
        context.lineTo(wx, wy);
      }
      context.stroke();
    }
  }

  /**
   * Render flies buzzing around rotting potato
   */
  _renderFlies(context, cx, cy, size, rotEffect, time) {
    const flyCount = Math.floor(rotEffect * 4);  // Up to 4 flies
    
    for (let i = 0; i < flyCount; i++) {
      // Each fly has unique orbit
      const orbitSpeed = 0.04 + i * 0.01;
      const orbitSize = size * (0.8 + i * 0.3);
      const verticalOffset = Math.sin(time * 0.07 + i * 1.5) * size * 0.3;
      
      // Figure-8 / erratic movement
      const angle = time * orbitSpeed + i * (Math.PI * 2 / flyCount);
      const wobble = Math.sin(time * 0.15 + i * 2) * 0.3;
      
      const fx = cx + Math.cos(angle) * orbitSize * (1 + wobble);
      const fy = cy + Math.sin(angle * 2) * orbitSize * 0.4 + verticalOffset - size * 0.5;
      
      // Fly body
      context.fillStyle = `rgba(30, 30, 30, ${rotEffect * 0.9})`;
      context.beginPath();
      context.ellipse(fx, fy, 3, 2, angle, 0, Math.PI * 2);
      context.fill();
      
      // Fly wings (flapping)
      const wingFlap = Math.sin(time * 0.5 + i) * 0.5;
      context.fillStyle = `rgba(150, 150, 150, ${rotEffect * 0.5})`;
      
      // Left wing
      context.beginPath();
      context.ellipse(fx - 2, fy - 1, 2.5, 1.5, -0.5 + wingFlap, 0, Math.PI * 2);
      context.fill();
      
      // Right wing
      context.beginPath();
      context.ellipse(fx + 2, fy - 1, 2.5, 1.5, 0.5 - wingFlap, 0, Math.PI * 2);
      context.fill();
    }
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
