class AvatarSampleRenderer {
    _environment = {
        loopX: true,
        gravity: 1
    };

    _actorObject = null;

    _lockedJumpAt = null;

    _tick = 0;

    characterMotion = {
        headAngle: 0,
        headAngleOffset: -1 / Math.PI / 2,
        headMinAngle: -0.8 / Math.PI / 2,
        headMaxAngle: 0.8 / Math.PI / 2,
        headSpeedAngle: 0.1 / Math.PI / 2,

        armAngle: 0,
        armAngleOffset: 0,
        armMinAngle: -4 / Math.PI / 2,
        armMaxAngle: 4 / Math.PI / 2,
        armSpeedAngle: 0.4 / Math.PI / 2,
        
        legAngle: 0,
        legAngleOffset: 0,
        legMinAngle: -6 / Math.PI / 2,
        legMaxAngle: 6 / Math.PI / 2,
        legSpeedAngle: 0.6 / Math.PI / 2,
    }

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

        // Practice objects
        this._renderObject(context, this._actorObject, status);
    }

    _renderObject(context, object, _status) {
        context.strokeStyle = "red";
        context.strokeRect(object.x, object.y - object.height, object.width, object.height);

        this._tick++;

        this.characterMotion.headAngle += this.characterMotion.headSpeedAngle;
        if (this.characterMotion.headAngle >= this.characterMotion.headMaxAngle) {
            this.characterMotion.headAngle = this.characterMotion.headMaxAngle
            this.characterMotion.headSpeedAngle = -this.characterMotion.headSpeedAngle;
        } else if (this.characterMotion.headAngle <= this.characterMotion.headMinAngle) {
            this.characterMotion.headAngle = this.characterMotion.headMinAngle
            this.characterMotion.headSpeedAngle = -this.characterMotion.headSpeedAngle;
        }

        this.characterMotion.armAngle += this.characterMotion.armSpeedAngle;
        if (this.characterMotion.armAngle >= this.characterMotion.armMaxAngle) {
            this.characterMotion.armAngle = this.characterMotion.armMaxAngle
            this.characterMotion.armSpeedAngle = -this.characterMotion.armSpeedAngle;
        } else if (this.characterMotion.armAngle <= this.characterMotion.armMinAngle) {
            this.characterMotion.armAngle = this.characterMotion.armMinAngle
            this.characterMotion.armSpeedAngle = -this.characterMotion.armSpeedAngle;
        }

        this.characterMotion.legAngle += this.characterMotion.legSpeedAngle;
        if (this.characterMotion.legAngle >= this.characterMotion.legMaxAngle) {
            this.characterMotion.legAngle = this.characterMotion.legMaxAngle
            this.characterMotion.legSpeedAngle = -this.characterMotion.legSpeedAngle;
        } else if (this.characterMotion.legAngle <= this.characterMotion.legMinAngle) {
            this.characterMotion.legAngle = this.characterMotion.legMinAngle
            this.characterMotion.legSpeedAngle = -this.characterMotion.legSpeedAngle;
        }

        context.fillStyle = "white";
        context.strokeStyle = "black";

        context.save();
        context.translate(object.x + 15, object.y - object.height + 42);
        context.rotate(-this.characterMotion.legAngle + this.characterMotion.legAngleOffset);
        context.fillRect(-6, 0, 12, 18);
        context.strokeRect(-6, 0, 12, 18);
        context.fillRect(-6, 12, 12, 6);
        context.strokeRect(-6, 12, 12, 6);
        context.restore();

        context.save();
        context.translate(object.x + 15, object.y - object.height + 28);
        context.rotate(this.characterMotion.armAngle + this.characterMotion.armAngleOffset);
        context.fillRect(-5, -4, 10, 22);
        context.strokeRect(-5, -4, 10, 22);
        context.fillRect(-5, 7, 10, 11);
        context.strokeRect(-5, 7, 10, 11);
        context.restore();

        context.save();
        context.translate(object.x + 15, object.y - object.height + 20);
        context.rotate(this.characterMotion.headAngle);
        context.fillRect(-7, 6, 14, 16);
        context.strokeRect(-7, 6, 14, 16);
        context.restore();

        context.save();
        context.translate(object.x + 15, object.y - object.height + 42);
        context.rotate(this.characterMotion.legAngle + this.characterMotion.legAngleOffset);
        context.fillRect(-6, 0, 12, 18);
        context.strokeRect(-6, 0, 12, 18);
        context.fillRect(-6, 12, 12, 6);
        context.strokeRect(-6, 12, 12, 6);
        context.restore();

        context.save();
        context.translate(object.x + 15, object.y - object.height + 13);
        context.rotate(this.characterMotion.headAngle + this.characterMotion.headAngleOffset);
        context.fillRect(-15, -12, 30, 24);
        context.strokeRect(-15, -12, 30, 24);
        context.restore();

        context.save();
        context.translate(object.x + 15, object.y - object.height + 28);
        context.rotate(-this.characterMotion.armAngle + this.characterMotion.armAngleOffset);
        context.fillRect(-5, -4, 10, 22);
        context.strokeRect(-5, -4, 10, 22);
        context.fillRect(-5, 7, 10, 11);
        context.strokeRect(-5, 7, 10, 11);
        context.restore();
        
    }
}