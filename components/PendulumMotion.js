class PendulumMotion {
    angle = 0;
    targetAngle = 0;
    minAngle = 0;
    maxAngle = 0;
    angleSpeed = 0;
    angleOffset = 0;
    factor = 0.4;

    constructor(minAngle, maxAngle, angleSpeed, angleOffset) {
        this.minAngle = minAngle || 0;
        this.maxAngle = maxAngle || 0;
        this.angleSpeed = angleSpeed || 0;
        this.angleOffset = angleOffset || 0;
    }

    compute(play, reverse) {
        if (play == false) {
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
                this.targetAngle = -this.maxAngle
                this.angleSpeed = -this.angleSpeed;
            } else if (this.targetAngle >= -this.minAngle) {
                this.targetAngle = -this.minAngle
                this.angleSpeed = -this.angleSpeed;
            }
            this.angle += (this.targetAngle - this.angleOffset - this.angle) * this.factor;
        } else {
            this.targetAngle += this.angleSpeed;
            if (this.targetAngle >= this.maxAngle) {
                this.targetAngle = this.maxAngle
                this.angleSpeed = -this.angleSpeed;
            } else if (this.targetAngle <= this.minAngle) {
                this.targetAngle = this.minAngle
                this.angleSpeed = -this.angleSpeed;
            }
            this.angle += (this.targetAngle + this.angleOffset - this.angle) * this.factor;
        }
    }
}