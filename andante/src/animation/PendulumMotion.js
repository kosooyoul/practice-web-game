/**
 * PendulumMotion - Pendulum animation for character parts
 * Used for smooth walking/idle animations of limbs
 */
export class PendulumMotion {
  angle = 0;
  targetAngle = 0;
  minAngle = 0;
  maxAngle = 0;
  angleSpeed = 0;
  angleOffset = 0;
  factor = 0.4;

  /**
   * @param {number} minAngle - Minimum swing angle
   * @param {number} maxAngle - Maximum swing angle
   * @param {number} angleSpeed - Speed of angle change per tick
   * @param {number} angleOffset - Base angle offset (for idle pose)
   */
  constructor(minAngle = 0, maxAngle = 0, angleSpeed = 0, angleOffset = 0) {
    this.minAngle = minAngle;
    this.maxAngle = maxAngle;
    this.angleSpeed = angleSpeed;
    this.angleOffset = angleOffset;
  }

  /**
   * Update pendulum animation
   * @param {boolean} play - Whether animation is active (moving)
   * @param {boolean} reverse - Whether direction is reversed (left)
   */
  compute(play, reverse) {
    if (!play) {
      this.targetAngle = 0;
      if (reverse) {
        this.angle += (this.targetAngle - this.angleOffset - this.angle) * this.factor;
      } else {
        this.angle += (this.targetAngle + this.angleOffset - this.angle) * this.factor;
      }
      return;
    }

    if (reverse) {
      this.targetAngle -= this.angleSpeed;
      if (this.targetAngle <= -this.maxAngle) {
        this.targetAngle = -this.maxAngle;
        this.angleSpeed = -this.angleSpeed;
      } else if (this.targetAngle >= -this.minAngle) {
        this.targetAngle = -this.minAngle;
        this.angleSpeed = -this.angleSpeed;
      }
      this.angle += (this.targetAngle - this.angleOffset - this.angle) * this.factor;
    } else {
      this.targetAngle += this.angleSpeed;
      if (this.targetAngle >= this.maxAngle) {
        this.targetAngle = this.maxAngle;
        this.angleSpeed = -this.angleSpeed;
      } else if (this.targetAngle <= this.minAngle) {
        this.targetAngle = this.minAngle;
        this.angleSpeed = -this.angleSpeed;
      }
      this.angle += (this.targetAngle + this.angleOffset - this.angle) * this.factor;
    }
  }

  /**
   * Reset animation state
   */
  reset() {
    this.angle = 0;
    this.targetAngle = 0;
  }
}
