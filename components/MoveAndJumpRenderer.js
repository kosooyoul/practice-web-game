class MoveAndJumpRenderer {
    _environment = {
        loopX: true,
        gravity: 1
    };

    _testObject = {
        x: -20,
        y: 0,
        width: 40,
        height: 40
    };

    _physics = {
        speedX: 0,
        speedY: 0,
        accelerationX: 0,
        accelerationY: 0,
        maxSpeedX: 10,
        movingPowerPerTick: 0.03,
        leftJumpingPower: 0,
        maxJumpingPower: 18,
        jumpingPowerPerTick: 3,
        jumpedAt: null,
        flapped: 0,
        flappable: 1,
        reflectionDecrement: 5,
        reflectivity: 0.4,
        groundResistivity: 0.14,
        airResistivity: 0.01
    };

    constructor() {

    }

    compute(status) {
        this._computeMoving(status);
        this._computeJumping(status);
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
        context.strokeRect(this._testObject.x, this._testObject.y - this._testObject.height, this._testObject.width, this._testObject.height);
    }

    _computeMoving(status) {
        if (status.joypad["left"]) {
            this._physics.accelerationX = Math.min(this._physics.accelerationX - this._physics.movingPowerPerTick, 0);
        } else if (status.joypad["right"]) {
            this._physics.accelerationX = Math.max(this._physics.accelerationX + this._physics.movingPowerPerTick, 0);
        } else {
            this._physics.accelerationX = 0;
            if (this._physics.jumpedAt) {
                this._physics.speedX += (0 - this._physics.speedX) * this._physics.airResistivity;
            } else {
                this._physics.speedX += (0 - this._physics.speedX) * this._physics.groundResistivity;
            }
        }

        this._physics.speedX = Math.max(Math.min(this._physics.speedX + this._physics.accelerationX, this._physics.maxSpeedX), -this._physics.maxSpeedX);

        this._testObject.x += this._physics.speedX;
        if (this._environment.loopX) {
            if (this._testObject.x < status.boundary.left - this._testObject.width) {
                this._testObject.x = status.boundary.right;
            } else if (this._testObject.x > status.boundary.right) {
                this._testObject.x = status.boundary.left - this._testObject.width;
            }
        }
    }

    _computeJumping(status) {
        if (status.joypad["action"]) {
            if (this._physics.jumpedAt == null) {
                this._physics.flapped = 0;
                this._physics.jumpedAt = Date.now();
                this._physics.leftJumpingPower = this._physics.maxJumpingPower;
                this._physics.accelerationY = 0;
            } else if (this._physics.flapped < this._physics.flappable) {
                if (status.joypad["action"] > this._physics.jumpedAt) {
                    this._physics.flapped++;
                    this._physics.jumpedAt = Date.now();
                    this._physics.leftJumpingPower = this._physics.maxJumpingPower;
                    this._physics.accelerationY = 0;
                }
            }
        } else {
            this._physics.leftJumpingPower = 0;
        }

        if (this._physics.leftJumpingPower > 0) {
            this._physics.accelerationY += this._physics.jumpingPowerPerTick;
            this._physics.leftJumpingPower -= this._physics.jumpingPowerPerTick;
        }

        this._physics.speedY = -this._physics.accelerationY;
        this._physics.accelerationY = this._physics.accelerationY - this._environment.gravity;

        // Check ground
        this._testObject.y += this._physics.speedY;
        if (this._testObject.y > 0) {
            this._testObject.y = 0;
            this._physics.accelerationY = Math.max((Math.abs(this._physics.accelerationY) - this._physics.reflectionDecrement) * this._physics.reflectivity, 0);
            this._physics.jumpedAt = null;
        }
    }
}