class AvatarSampleRenderer {
    _environment = {
        loopX: true,
        gravity: 1
    };

    _actorObject = null;

    _lockedJumpAt = null;

    _tick = 0;

    characterStyle = {
        skin: "#ffe0d0",
        top: "#ffaaaa",
        bottom: "#cccc99",
    };

    characterMotion = {
        direction: "right",

        headDisplayAngle: 0,
        headAngle: 0,
        headTargetAngle: 0,
        headAngleOffset: -1 / Math.PI / 2,
        headMinAngle: -0.8 / Math.PI / 2,
        headMaxAngle: 0.8 / Math.PI / 2,
        headSpeedAngle: 0.1 / Math.PI / 2,

        bodyDisplayAngle: 0,
        bodyAngle: 0,
        bodyTargetAngle: 0,
        bodyAngleOffset: 0,
        bodyMinAngle: -0.8 / Math.PI / 2,
        bodyMaxAngle: 0.8 / Math.PI / 2,
        bodySpeedAngle: 0.1 / Math.PI / 2,

        armDisplayAngle: 0,
        armAngle: 0,
        armTargetAngle: 0,
        armAngleOffset: 0,
        armMinAngle: -4 / Math.PI / 2,
        armMaxAngle: 4 / Math.PI / 2,
        armSpeedAngle: 0.4 / Math.PI / 2,
        
        legDisplayAngle: 0,
        legAngle: 0,
        legTargetAngle: 0,
        legAngleOffset: 0,
        legMinAngle: -6 / Math.PI / 2,
        legMaxAngle: 6 / Math.PI / 2,
        legSpeedAngle: 0.6 / Math.PI / 2,
    };

    constructor() {
        this._actorObject = new PhysicsObject(-15, 100, 30, 60);
    }

    compute(status) {
        // this._computeMoving(this._actorObject, status);
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
        context.fillText("Avatar", 0, 130);
        context.fillText("You can move by arrow key and touch left side joystick!", 0, 160);

        // Practice objects
        this._renderObject(context, this._actorObject, status);
    }

    _renderObject(context, object, status) {
        context.strokeStyle = "red";
        context.strokeRect(object.x, object.y - object.height, object.width, object.height);

        this._tick++;

        if (status.joypad["right"]) {
            this.characterMotion.direction = "right";

            this.characterMotion.headTargetAngle += this.characterMotion.headSpeedAngle;
            if (this.characterMotion.headTargetAngle >= this.characterMotion.headMaxAngle) {
                this.characterMotion.headTargetAngle = this.characterMotion.headMaxAngle
                this.characterMotion.headSpeedAngle = -this.characterMotion.headSpeedAngle;
            } else if (this.characterMotion.headTargetAngle <= this.characterMotion.headMinAngle) {
                this.characterMotion.headTargetAngle = this.characterMotion.headMinAngle
                this.characterMotion.headSpeedAngle = -this.characterMotion.headSpeedAngle;
            }

            this.characterMotion.bodyTargetAngle += this.characterMotion.bodySpeedAngle;
            if (this.characterMotion.bodyTargetAngle >= this.characterMotion.bodyMaxAngle) {
                this.characterMotion.bodyTargetAngle = this.characterMotion.bodyMaxAngle
                this.characterMotion.bodySpeedAngle = -this.characterMotion.bodySpeedAngle;
            } else if (this.characterMotion.bodyTargetAngle <= this.characterMotion.bodyMinAngle) {
                this.characterMotion.bodyTargetAngle = this.characterMotion.bodyMinAngle
                this.characterMotion.bodySpeedAngle = -this.characterMotion.bodySpeedAngle;
            }

            this.characterMotion.armTargetAngle += this.characterMotion.armSpeedAngle;
            if (this.characterMotion.armTargetAngle >= this.characterMotion.armMaxAngle) {
                this.characterMotion.armTargetAngle = this.characterMotion.armMaxAngle
                this.characterMotion.armSpeedAngle = -this.characterMotion.armSpeedAngle;
            } else if (this.characterMotion.armTargetAngle <= this.characterMotion.armMinAngle) {
                this.characterMotion.armTargetAngle = this.characterMotion.armMinAngle
                this.characterMotion.armSpeedAngle = -this.characterMotion.armSpeedAngle;
            }

            this.characterMotion.legTargetAngle += this.characterMotion.legSpeedAngle;
            if (this.characterMotion.legTargetAngle >= this.characterMotion.legMaxAngle) {
                this.characterMotion.legTargetAngle = this.characterMotion.legMaxAngle
                this.characterMotion.legSpeedAngle = -this.characterMotion.legSpeedAngle;
            } else if (this.characterMotion.legTargetAngle <= this.characterMotion.legMinAngle) {
                this.characterMotion.legTargetAngle = this.characterMotion.legMinAngle
                this.characterMotion.legSpeedAngle = -this.characterMotion.legSpeedAngle;
            }
            this.characterMotion.headAngle += (this.characterMotion.headTargetAngle - this.characterMotion.headAngle) * 0.4;
            this.characterMotion.bodyAngle += (this.characterMotion.bodyTargetAngle - this.characterMotion.bodyAngle) * 0.4;
            this.characterMotion.armAngle += (this.characterMotion.armTargetAngle - this.characterMotion.armAngle) * 0.4;
            this.characterMotion.legAngle += (this.characterMotion.legTargetAngle - this.characterMotion.legAngle) * 0.4;
            this.characterMotion.headDisplayAngle = this.characterMotion.headAngle + this.characterMotion.headAngleOffset;
            this.characterMotion.bodyDisplayAngle = this.characterMotion.bodyAngle + this.characterMotion.bodyAngleOffset;
            this.characterMotion.armDisplayAngle = this.characterMotion.armAngle + this.characterMotion.armAngleOffset;
            this.characterMotion.legDisplayAngle = this.characterMotion.legAngle + this.characterMotion.legAngleOffset;
        } else if (status.joypad["left"]) {
            this.characterMotion.direction = "left";

            this.characterMotion.headTargetAngle -= this.characterMotion.headSpeedAngle;
            if (this.characterMotion.headTargetAngle <= -this.characterMotion.headMaxAngle) {
                this.characterMotion.headTargetAngle = -this.characterMotion.headMaxAngle
                this.characterMotion.headSpeedAngle = -this.characterMotion.headSpeedAngle;
            } else if (this.characterMotion.headTargetAngle >= -this.characterMotion.headMinAngle) {
                this.characterMotion.headTargetAngle = -this.characterMotion.headMinAngle
                this.characterMotion.headSpeedAngle = -this.characterMotion.headSpeedAngle;
            }

            this.characterMotion.bodyTargetAngle -= this.characterMotion.bodySpeedAngle;
            if (this.characterMotion.bodyTargetAngle <= -this.characterMotion.bodyMaxAngle) {
                this.characterMotion.bodyTargetAngle = -this.characterMotion.bodyMaxAngle
                this.characterMotion.bodySpeedAngle = -this.characterMotion.bodySpeedAngle;
            } else if (this.characterMotion.bodyTargetAngle >= -this.characterMotion.bodyMinAngle) {
                this.characterMotion.bodyTargetAngle = -this.characterMotion.bodyMinAngle
                this.characterMotion.bodySpeedAngle = -this.characterMotion.bodySpeedAngle;
            }

            this.characterMotion.armTargetAngle -= this.characterMotion.armSpeedAngle;
            if (this.characterMotion.armTargetAngle <= -this.characterMotion.armMaxAngle) {
                this.characterMotion.armTargetAngle = -this.characterMotion.armMaxAngle
                this.characterMotion.armSpeedAngle = -this.characterMotion.armSpeedAngle;
            } else if (this.characterMotion.armTargetAngle >= -this.characterMotion.armMinAngle) {
                this.characterMotion.armTargetAngle = -this.characterMotion.armMinAngle
                this.characterMotion.armSpeedAngle = -this.characterMotion.armSpeedAngle;
            }

            this.characterMotion.legTargetAngle -= this.characterMotion.legSpeedAngle;
            if (this.characterMotion.legTargetAngle <= -this.characterMotion.legMaxAngle) {
                this.characterMotion.legTargetAngle = -this.characterMotion.legMaxAngle
                this.characterMotion.legSpeedAngle = -this.characterMotion.legSpeedAngle;
            } else if (this.characterMotion.legTargetAngle >= -this.characterMotion.legMinAngle) {
                this.characterMotion.legTargetAngle = -this.characterMotion.legMinAngle
                this.characterMotion.legSpeedAngle = -this.characterMotion.legSpeedAngle;
            }
            this.characterMotion.headAngle += (this.characterMotion.headTargetAngle - this.characterMotion.headAngle) * 0.4;
            this.characterMotion.bodyAngle += (this.characterMotion.bodyTargetAngle - this.characterMotion.bodyAngle) * 0.4;
            this.characterMotion.armAngle += (this.characterMotion.armTargetAngle - this.characterMotion.armAngle) * 0.4;
            this.characterMotion.legAngle += (this.characterMotion.legTargetAngle - this.characterMotion.legAngle) * 0.4;
            this.characterMotion.headDisplayAngle = this.characterMotion.headAngle - this.characterMotion.headAngleOffset;
            this.characterMotion.bodyDisplayAngle = this.characterMotion.bodyAngle + this.characterMotion.bodyAngleOffset;
            this.characterMotion.armDisplayAngle = this.characterMotion.armAngle - this.characterMotion.armAngleOffset;
            this.characterMotion.legDisplayAngle = this.characterMotion.legAngle - this.characterMotion.legAngleOffset;
        } else {
            this.characterMotion.headTargetAngle = 0;
            this.characterMotion.bodyTargetAngle = 0;
            this.characterMotion.armTargetAngle = 0;
            this.characterMotion.legTargetAngle = 0;
            this.characterMotion.headAngle += (this.characterMotion.headTargetAngle - this.characterMotion.headAngle) * 0.4;
            this.characterMotion.bodyAngle += (this.characterMotion.bodyTargetAngle - this.characterMotion.bodyAngle) * 0.4;
            this.characterMotion.armAngle += (this.characterMotion.armTargetAngle - this.characterMotion.armAngle) * 0.4;
            this.characterMotion.legAngle += (this.characterMotion.legTargetAngle - this.characterMotion.legAngle) * 0.4;

            if (this.characterMotion.direction == "right") {
                this.characterMotion.headDisplayAngle = this.characterMotion.headAngle + this.characterMotion.headAngleOffset;
                this.characterMotion.bodyDisplayAngle = this.characterMotion.bodyAngle + this.characterMotion.bodyAngleOffset;
                this.characterMotion.armDisplayAngle = this.characterMotion.armAngle + this.characterMotion.armAngleOffset;
                this.characterMotion.legDisplayAngle = this.characterMotion.legAngle + this.characterMotion.legAngleOffset;
            } else if (this.characterMotion.direction == "left") {
                this.characterMotion.headDisplayAngle = this.characterMotion.headAngle - this.characterMotion.headAngleOffset;
                this.characterMotion.bodyDisplayAngle = this.characterMotion.bodyAngle - this.characterMotion.bodyAngleOffset;
                this.characterMotion.armDisplayAngle = this.characterMotion.armAngle - this.characterMotion.armAngleOffset;
                this.characterMotion.legDisplayAngle = this.characterMotion.legAngle - this.characterMotion.legAngleOffset;
            }
        }

        context.fillStyle = "white";
        context.strokeStyle = "black";

        context.save();
        context.translate(object.x + 15, object.y - object.height + 42);
        context.rotate(-this.characterMotion.legDisplayAngle);
        context.fillStyle = this.characterStyle.bottom;
        context.fillRect(-6, 0, 12, 18);
        context.strokeRect(-6, 0, 12, 18);
        context.fillStyle = this.characterStyle.skin;
        context.fillRect(-6, 12, 12, 6);
        context.strokeRect(-6, 12, 12, 6);
        context.restore();

        context.save();
        context.translate(object.x + 15, object.y - object.height + 28);
        context.rotate(this.characterMotion.armDisplayAngle);
        context.fillStyle = this.characterStyle.top;
        context.fillRect(-5, -4, 10, 22);
        context.strokeRect(-5, -4, 10, 22);
        context.fillStyle = this.characterStyle.skin;
        context.fillRect(-5, 7, 10, 11);
        context.strokeRect(-5, 7, 10, 11);
        context.restore();

        context.save();
        context.translate(object.x + 15, object.y - object.height + 20);
        context.rotate(this.characterMotion.bodyDisplayAngle);
        context.fillStyle = this.characterStyle.top;
        context.fillRect(-7, 6, 14, 16);
        context.strokeRect(-7, 6, 14, 16);
        context.restore();

        context.save();
        context.translate(object.x + 15, object.y - object.height + 42);
        context.rotate(this.characterMotion.legDisplayAngle);
        context.fillStyle = this.characterStyle.bottom;
        context.fillRect(-6, 0, 12, 18);
        context.strokeRect(-6, 0, 12, 18);
        context.fillStyle = this.characterStyle.skin;
        context.fillRect(-6, 12, 12, 6);
        context.strokeRect(-6, 12, 12, 6);
        context.restore();

        context.save();
        context.translate(object.x + 15, object.y - object.height + 13);
        context.rotate(this.characterMotion.headDisplayAngle);
        context.fillStyle = this.characterStyle.skin;
        context.fillRect(-14, -12, 28, 24);
        context.strokeRect(-14, -12, 28, 24);
        context.restore();

        context.save();
        context.translate(object.x + 15, object.y - object.height + 28);
        context.rotate(-this.characterMotion.armDisplayAngle);
        context.fillStyle = this.characterStyle.top;
        context.fillRect(-5, -4, 10, 22);
        context.strokeRect(-5, -4, 10, 22);
        context.fillStyle = this.characterStyle.skin;
        context.fillRect(-5, 7, 10, 11);
        context.strokeRect(-5, 7, 10, 11);
        context.restore();
        
    }
}