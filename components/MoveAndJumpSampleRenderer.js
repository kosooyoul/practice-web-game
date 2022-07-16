class MoveAndJumpSampleRenderer {
    _environment = {
        loopX: true,
        gravity: 1
    };

    _actorObject = null;
    _boxObjects = [];

    _lockedJumpAt = null;

    constructor() {
        this._actorObject = new PhysicsObject(-20, 100, 40, 40);
        this._boxObjects.push(new PhysicsObject(200, -100, 100, 100));
        this._boxObjects.push(new PhysicsObject(-300, 100, 100, 100));
        this._boxObjects.push(new PhysicsObject(-25, 0, 50, 50));
        this._boxObjects.push(new PhysicsObject(-200, -180, 200, 20));
        this._boxObjects.push(new PhysicsObject(-350, -250, 120, 20));
        this._boxObjects.push(new PhysicsObject(350, 50, 100, 20));
        this._boxObjects.push(new PhysicsObject(260, 10, 100, 20));
    }

    compute(status) {
        this._computeMoving(this._actorObject, status);
        this._computeJumping(this._actorObject, status);
        this._computeGroundCollision(status);
        this._computeBoxCollision(status);
        this._actorObject.move();
    }

    render(context, status) {
        // Ground
        context.strokeStyle = "#000000";
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(status.boundary.left, 100);
        context.lineTo(status.boundary.right, 100);
        context.stroke();
        context.closePath();

        // Text
        context.font = "18px sans-serif";
        context.textAlign = "center";
        context.textBaseline = "top";
        context.fillText("Move and Jump!!", 0, 130);
        context.fillText("You can move by arrow key and touch left side joystick!", 0, 160);
        context.fillText("You can jump by spacebar and touch right side!", 0, 190);

        // Practice objects
        this._renderObject(context, this._actorObject, status);
        this._boxObjects.forEach(wallObject => this._renderObject(context, wallObject, status));
    }

    _renderObject(context, object, _status) {
        context.strokeRect(object.x, object.y - object.height, object.width, object.height);
    }

    _computeMoving(object, status) {
        if (status.joypad["left"]) {
            object.physics.accelerationX = Math.min(object.physics.accelerationX - object.physics.movingPowerPerTick, 0);
        } else if (status.joypad["right"]) {
            object.physics.accelerationX = Math.max(object.physics.accelerationX + object.physics.movingPowerPerTick, 0);
        } else {
            object.physics.accelerationX = 0;
            if (object.physics.jumpedAt) {
                object.physics.speedX += (0 - object.physics.speedX) * object.physics.airResistivity;
            } else {
                object.physics.speedX += (0 - object.physics.speedX) * object.physics.groundResistivity;
            }
        }

        object.physics.speedX = Math.max(Math.min(object.physics.speedX + object.physics.accelerationX, object.physics.maxSpeedX), -object.physics.maxSpeedX);

        let x = object.x + object.physics.speedX;
        if (this._environment.loopX) {
            if (x < status.boundary.left - object.width) {
                x = status.boundary.right;
            } else if (x > status.boundary.right) {
                x = status.boundary.left - object.width;
            }
        }
        object.toX(x);
    }

    _computeJumping(object, status) {
        if (status.joypad["action"]) {
            if (this._lockedJumpAt != null) {
                if (status.joypad["action"] > this._lockedJumpAt) {
                    this._lockedJumpAt = null;
                }
            }

            if (this._lockedJumpAt != null) {
                // do nothing;
            } else if (object.physics.jumpedAt == null) {
                object.physics.flapped = 0;
                object.physics.jumpedAt = Date.now();
                object.physics.leftJumpingPower = object.physics.maxJumpingPower;
                object.physics.speedY = 0;
                object.physics.accelerationY = 0;
            } else if (object.physics.flapped < object.physics.flappable) {
                if (status.joypad["action"] > object.physics.jumpedAt) {
                    object.physics.flapped++;
                    object.physics.jumpedAt = Date.now();
                    object.physics.leftJumpingPower = object.physics.maxJumpingPower;
                    object.physics.accelerationY = 0;
                }
            }
        } else {
            object.physics.leftJumpingPower = 0;
        }

        if (object.physics.leftJumpingPower > 0) {
            object.physics.accelerationY += object.physics.jumpingPowerPerTick;
            object.physics.leftJumpingPower -= object.physics.jumpingPowerPerTick;
        }

        object.physics.speedY = -object.physics.accelerationY;
        object.physics.accelerationY -= this._environment.gravity - object.physics.airResistivity;

        const y = object.y + object.physics.speedY;

        object.toY(y);
    }

    _computeGroundCollision(status) {
        if (this._actorObject.collisionWithGround(100) == "top") {
            this._lockedJumpAt = Date.now();
        };
    }

    _computeBoxCollision(status) {
        this._boxObjects.forEach(wallObject => {
            if (this._actorObject.collisionWithBox(wallObject) == "top") {
                this._lockedJumpAt = Date.now();
            }
        });
    }
}