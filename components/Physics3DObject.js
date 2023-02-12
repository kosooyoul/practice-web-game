class Physics3DObject {
    x = -20;
    y = 0;
    z = 0;
    width = 40;
    height = 40;

    left;
    right;
    top;
    bottom;

    _to = {
        x: null,
        y: null,
        z: null,
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
        speedZ: 0,
        accelerationX: 0,
        accelerationY: 0,
        accelerationZ: 0,
        maxSpeedX: 5,
        maxSpeedY: 5,
        movingPowerPerTick: 0.02,
        leftJumpingPower: 0,
        maxJumpingPower: 12,
        jumpingPowerPerTick: 2.2,
        jumpedAt: null,
        flapped: 0,
        flappable: 1,
        reflectionDecrement: 5,
        reflectivity: 0.2,
        groundResistivity: 0.18,
        airResistivity: 0.04,
        groundReflectivity: 0.08,
        airReflectivity: 0.15
    };

    constructor(x, y, width, height, physics) {
        this.x = x;
        this.y = y;
        this.z = 0;
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

    toZ(z) {
        this._to.z = z;
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
        this.z = this._to.z == null ? this.z : this._to.z;
        this.width = this._to.width == null ? this.width : this._to.width;
        this.height = this._to.height == null ? this.height : this._to.height;

        this.left = this.x;
        this.right = this.x + this.width;
        this.top = this.y - this.height;
        this.bottom = this.y;

        this._to.x = null;
        this._to.y = null;
        this._to.z = null;
        this._to.width = null;
        this._to.height = null;

        this._to.left = null;
        this._to.right = null;
        this._to.top = null;
        this._to.bottom = null;
    }

    collisionWithGround(top) {
        if (this.z > this._to.z) {
            if (top <= this.z && top > this._to.z) {
                this.toZ(top);
                this.physics.accelerationZ = Math.max((Math.abs(this.physics.accelerationZ) - this.physics.reflectionDecrement) * this.physics.reflectivity, 0);
                this.physics.jumpedAt = null;
                return "top";
            }
        }
        return;
    }

    collisionWithBox(object) {
        if (this._to.left > object.right || this._to.right < object.left) {
            if (this.left <= object.right || this.right >= object.left) {
                if (this.y < this._to.y) {
                    if (this.physics.jumpedAt == null) {
                        this.physics.jumpedAt = Date.now();
                        this.physics.flapped = 0;
                    }
                }
            }
            return;
        }
        if (this._to.top > object.bottom || this._to.bottom < object.top) {
            return;
        }

        if (this.y < this._to.y) {
            if (object.left < this._to.right && object.right > this._to.left) {
                if (object.top >= this.bottom && object.top < this._to.bottom) {
                    this.toY(object.y - object.height);
                    this.physics.accelerationY = Math.max((Math.abs(this.physics.accelerationY) - this.physics.reflectionDecrement) * this.physics.reflectivity, 0);
                    this.physics.jumpedAt = null;

                    return "top";
                }
            }
        }

        if (this.y > this._to.y) {
            if (object.left < this._to.right && object.right > this._to.left) {
                if (object.bottom <= this.top && object.bottom >= this._to.top) {
                    this.toY(object.y + this._to.height);
                    this.physics.accelerationY = -(Math.max(Math.abs(this.physics.accelerationY) - this.physics.reflectionDecrement) * this.physics.reflectivity, 0);
                    this.physics.speedY = -this.physics.speedY * this.physics.reflectivity;
                    this.physics.leftJumpingPower = 0;

                    return "bottom";
                }
            }
        }

        if (this.x < this._to.x) {
            if (object.top < this._to.bottom && object.bottom > this._to.top) {
                if (object.left <= this._to.right && object.right >= this._to.left) {
                    this.toX(object.x - this._to.width);
                    if (this.physics.jumpedAt == null) {
                        this.physics.speedX = -this.physics.speedX * this.physics.groundReflectivity;
                        this.physics.accelerationX = -this.physics.accelerationX * this.physics.groundReflectivity;
                    } else {
                        this.physics.speedX = -this.physics.speedX * this.physics.airReflectivity;
                        this.physics.accelerationX = -this.physics.accelerationX * this.physics.airReflectivity;
                    }
                    return "left";
                }
            }
        }

        if (this.x > this._to.x) {
            if (object.top < this._to.bottom && object.bottom > this._to.top) {
                if (object.right >= this._to.left && object.left <= this._to.right) {
                    this.toX(object.x + object.width);
                    if (this.physics.jumpedAt == null) {
                        this.physics.speedX = -this.physics.speedX * this.physics.groundReflectivity;
                        this.physics.accelerationX = -this.physics.accelerationX * this.physics.groundReflectivity;
                    } else {
                        this.physics.speedX = -this.physics.speedX * this.physics.airReflectivity;
                        this.physics.accelerationX = -this.physics.accelerationX * this.physics.airReflectivity;
                    }
                    return "right";
                }
            }
        }

        return;
    }
}