class MoveAndJumpRenderer {
    _environment = {
        loopX: true,
        gravity: 1
    };

    _actorObject = null;
    _boxObjects = [];

    constructor() {
        this._actorObject = new PhysicsObject(-20, 0, 40, 40);
        this._boxObjects.push(new PhysicsObject(200, -200, 100, 100));
        this._boxObjects.push(new PhysicsObject(-300, 0, 100, 100));
        this._boxObjects.push(new PhysicsObject(-25, -100, 50, 50));
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
        context.moveTo(status.boundary.left, 0);
        context.lineTo(status.boundary.right, 0);
        context.stroke();
        context.closePath();

        // Text
        context.font = "18px sans-serif";
        context.textAlign = "center";
        context.textBaseline = "top";
        context.fillText("Move and Jump!!", 0, 30);
        context.fillText("You can move by arrow key and touch left side joystick!", 0, 60);
        context.fillText("You can jump by spacebar and touch right side!", 0, 90);

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
            if (object.physics.jumpedAt == null) {
                object.physics.flapped = 0;
                object.physics.jumpedAt = Date.now();
                object.physics.leftJumpingPower = object.physics.maxJumpingPower;
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
        object.physics.accelerationY -= this._environment.gravity;

        const y = object.y + object.physics.speedY;

        object.toY(y);
    }

    _computeGroundCollision(_status) {
        this._actorObject.collisionWithGround(0);
    }

    _computeBoxCollision(_status) {
        this._boxObjects.forEach(wallObject => this._actorObject.collisionWithBox(wallObject));
    }
}