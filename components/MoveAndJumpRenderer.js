class MoveAndJumpRenderer {
    _environment = {
        loopX: true,
        gravity: 1
    };

    _actorObject;
    _object;

    constructor() {
        this._actorObject = new PhysicsObject(-20, 0, 40, 40);
    }

    compute(status) {
        this._computeMoving(this._actorObject, status);
        this._computeJumping(this._actorObject, status);
        this._computeCollision(this._actorObject, status);
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

        object.x += object.physics.speedX;
        if (this._environment.loopX) {
            if (object.x < status.boundary.left - object.width) {
                object.x = status.boundary.right;
            } else if (object.x > status.boundary.right) {
                object.x = status.boundary.left - object.width;
            }
        }
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
        object.physics.accelerationY = object.physics.accelerationY - this._environment.gravity;
    }

    _computeCollision(object, _status) {
        // Check ground collision
        object.y += object.physics.speedY;
        if (object.y > 0) {
            object.y = 0;
            object.physics.accelerationY = Math.max((Math.abs(object.physics.accelerationY) - object.physics.reflectionDecrement) * object.physics.reflectivity, 0);
            object.physics.jumpedAt = null;
        }
    }
}