class PhysicsObject {
    x = -20;
    y = 0;
    width = 40;
    height = 40;

    left;
    right;
    top;
    bottom;

    _to = {
        x: null,
        y: null,
        width: null,
        height: null,
        left: null,
        right: null,
        top: null,
        bottom: null
    };

    physics = {
        speedX: 0,
        speedY: 0,
        accelerationX: 0,
        accelerationY: 0,
        maxSpeedX: 8,
        movingPowerPerTick: 0.02,
        leftJumpingPower: 0,
        maxJumpingPower: 18,
        jumpingPowerPerTick: 2.2,
        jumpedAt: null,
        flapped: 0,
        flappable: 1,
        reflectionDecrement: 5,
        reflectivity: 0.2,
        groundResistivity: 0.16,
        airResistivity: 0.04,
        groundReflectivity: 0.08,
        airReflectivity: 0.15
    };

    constructor(x, y, width, height, physics) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.left = x;
        this.right = x + width;
        this.top = y - height;
        this.bottom = y;

        Object.assign(this.physics, physics);
    }

    toX(x) {
        this._to.x = x;
        this._to.y = this._to.y == null ? this.y : this._to.y;
        this._to.width = this._to.width == null ? this.width : this._to.width;
        this._to.height = this._to.height == null ? this.height : this._to.height;

        this._to.left = this._to.x;
        this._to.right = this._to.x + this._to.width;
        this._to.top = this._to.y - this._to.height;
        this._to.bottom = this._to.y;
    }

    toY(y) {
        this._to.x = this._to.x == null ? this.x : this._to.x;
        this._to.y = y;
        this._to.width = this._to.width == null ? this.width : this._to.width;
        this._to.height = this._to.height == null ? this.height : this._to.height;

        this._to.left = this._to.x;
        this._to.right = this._to.x + this._to.width;
        this._to.top = this._to.y - this._to.height;
        this._to.bottom = this._to.y;
    }

    toXY(x, y) {
        this._to.x = x;
        this._to.y = y;
        this._to.width = this._to.width == null ? this.width : this._to.width;
        this._to.height = this._to.height == null ? this.height : this._to.height;

        this._to.left = this._to.x;
        this._to.right = this._to.x + this._to.width;
        this._to.top = this._to.y - this._to.height;
        this._to.bottom = this._to.y;
    }

    move() {
        this.x = this._to.x == null ? this.x : this._to.x;
        this.y = this._to.y == null ? this.y : this._to.y;
        this.width = this._to.width == null ? this.width : this._to.width;
        this.height = this._to.height == null ? this.height : this._to.height;

        this.left = this.x;
        this.right = this.x + this.width;
        this.top = this.y - this.height;
        this.bottom = this.y;

        this._to.x = null;
        this._to.y = null;
        this._to.width = null;
        this._to.height = null;

        this._to.left = null;
        this._to.right = null;
        this._to.top = null;
        this._to.bottom = null;
    }

    collisionWithGround(top) {
        if (this.y < this._to.y) {
            if (top < this._to.bottom) {
                this._to.y = top;
                this.physics.accelerationY = Math.max((Math.abs(this.physics.accelerationY) - this.physics.reflectionDecrement) * this.physics.reflectivity, 0);
                this.physics.jumpedAt = null;
            }
        }
    }

    collisionWithBox(object) {
        if (this.y < this._to.y) {
            if (object.top >= this.bottom && object.top < this._to.bottom) {
                if (object.left < this._to.right && object.right > this._to.left) {
                    this._to.y = object.y - object.height;
                    this.physics.accelerationY = Math.max((Math.abs(this.physics.accelerationY) - this.physics.reflectionDecrement) * this.physics.reflectivity, 0);
                    this.physics.jumpedAt = null;

                    return;
                } else {
                    // Fall
                    if (this.physics.jumpedAt == null) {
                        this.physics.jumpedAt = Date.now();
                    }
                }
            }
        }

        if (this.y > this._to.y) {
            if (object.bottom < this.top && object.bottom > this._to.top) {
                if (object.left < this._to.right && object.right > this._to.left) {
                    this._to.y = object.y + this._to.height;
                    this.physics.accelerationY = -(Math.max(Math.abs(this.physics.accelerationY) - this.physics.reflectionDecrement) * this.physics.reflectivity, 0);
                    this.physics.speedY = -this.physics.speedY * this.physics.reflectivity;
                    this.physics.leftJumpingPower = 0;

                    return;
                }
            }
        }

        if (this.x < this._to.x) {
            if (object.left < this._to.right && object.right > this._to.left && object.top < this._to.bottom && object.bottom > this._to.top) {
                this._to.x = object.x - this._to.width;
                if (this.physics.jumpedAt == null) {
                    this.physics.speedX = -this.physics.speedX * this.physics.groundReflectivity;
                    this.physics.accelerationX = -this.physics.accelerationX * this.physics.groundReflectivity;
                } else {
                    this.physics.speedX = -this.physics.speedX * this.physics.airReflectivity;
                    this.physics.accelerationX = -this.physics.accelerationX * this.physics.airReflectivity;
                }
                return;
            }
        }

        if (this.x > this._to.x) {
            if (object.right > this._to.left && object.left < this._to.right && object.top < this._to.bottom && object.bottom > this._to.top) {
                this._to.x = object.x + object.width;
                if (this.physics.jumpedAt == null) {
                    this.physics.speedX = -this.physics.speedX * this.physics.groundReflectivity;
                    this.physics.accelerationX = -this.physics.accelerationX * this.physics.groundReflectivity;
                } else {
                    this.physics.speedX = -this.physics.speedX * this.physics.airReflectivity;
                    this.physics.accelerationX = -this.physics.accelerationX * this.physics.airReflectivity;
                }
                return;
            }
        }
    }
}