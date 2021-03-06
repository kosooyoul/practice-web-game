class CharacterObject {
    direction = "right";
    
    // _style = {
    //     skin: "#ffe0d0",
    //     top: "#ffaaaa",
    //     bottom: "#cccc99",
    // };

    _head;
    _body;
    _arm;
    _leg;

    _physics;

    _rotationMotion = {
        angle: 0,
        targetAngle: 0,
        angleSpeed: 0,
        angleSpeedTarget: 0,
        minAngleSpeed: 0.04,
        maxAngleSpeed: 0.16,
        factor: 0.04
    };

    constructor(x, y, width, height, physics) {
        this._head = new PendulumMotion(-0.8 / Math.PI / 2, 0.8 / Math.PI / 2, 0.1 / Math.PI / 2, -1 / Math.PI / 2);
        this._body = new PendulumMotion(-0.8 / Math.PI / 2, 0.8 / Math.PI / 2, 0.1 / Math.PI / 2);
        this._arm = new PendulumMotion(-4 / Math.PI / 2, 4 / Math.PI / 2, 0.4 / Math.PI / 2);
        this._leg = new PendulumMotion(-6 / Math.PI / 2, 6 / Math.PI / 2, 0.6 / Math.PI / 2);

        this._physics = new PhysicsObject(x, y, width, height, physics);
    }

    compute(status) {
        let play = true;
        if (status.joypad["right"]) {
            this.direction = "right";
        } else if (status.joypad["left"]) {
            this.direction = "left";
        } else {
            play = false;
        }

        let reverse = this.direction == "left";
        this._head.compute(play, reverse);
        this._body.compute(play, reverse);
        this._arm.compute(play, reverse);
        this._leg.compute(play, reverse);

        this._physics.move();

        // Rotating effect
        if (this._rotationMotion.angleSpeed < this._rotationMotion.minAngleSpeed + 0.01) {
            this._rotationMotion.angleSpeedTarget = this._rotationMotion.maxAngleSpeed;
        } else if (this._rotationMotion.angleSpeed > this._rotationMotion.maxAngleSpeed - 0.01) {
            this._rotationMotion.angleSpeedTarget = this._rotationMotion.minAngleSpeed;
        }
        this._rotationMotion.angleSpeed += (this._rotationMotion.angleSpeedTarget - this._rotationMotion.angleSpeed) * this._rotationMotion.factor;
        this._rotationMotion.angle += this._rotationMotion.angleSpeed;
        console.log(this._rotationMotion.angleSpeed)
    }

    render(context) {
        context.save();
        context.translate(this._physics.x, this._physics.y - this._physics.height);

        this._renderCollisionBox(context);

        let reverse = this.direction == "left";
        this._renderLeftLeg(context, reverse);
        this._renderLeftArm(context, reverse);
        this._renderRightLeg(context, reverse);
        this._renderBody(context, reverse);
        this._renderHead(context, reverse);
        this._renderRightArm(context, reverse);

        this._renderEffect(context);

        context.restore();
    }

    _renderCollisionBox(context) {
        context.strokeStyle = "red";
        context.strokeRect(0, 0, this._physics.width, this._physics.height);
    }

    _renderLeftLeg(context, reverse) {
        context.save();

        context.translate(15, 42);
        context.rotate(-this._leg.angle);

        context.drawImage(AssetManager.getImage("character/leg"), -5, 0);
        // context.fillStyle = this._style.bottom;
        // context.strokeStyle = "black";
        // context.fillRect(-5, 0, 10, 18);
        // context.strokeRect(-5, 0, 10, 18);

        // context.fillStyle = this._style.skin;
        // context.strokeStyle = "black";
        // context.fillRect(-5, 12, 10, 6);
        // context.strokeRect(-5, 12, 10, 6);

        context.restore();
    }

    _renderLeftArm(context, reverse) {
        context.save();

        context.translate(15, 28);
        context.rotate(this._arm.angle);

        context.drawImage(AssetManager.getImage("character/arm"), -5, -4);
        // context.fillStyle = this._style.top;
        // context.strokeStyle = "black";
        // context.fillRect(-5, -4, 10, 22);
        // context.strokeRect(-5, -4, 10, 22);

        // context.fillStyle = this._style.skin;
        // context.strokeStyle = "black";
        // context.fillRect(-5, 7, 10, 11);
        // context.strokeRect(-5, 7, 10, 11);

        context.restore();
    }

    _renderRightLeg(context, reverse) {
        context.save();

        context.translate(15, 42);
        context.rotate(this._leg.angle);

        context.drawImage(AssetManager.getImage("character/leg"), -5, 0);
        // context.fillStyle = this._style.bottom;
        // context.strokeStyle = "black";
        // context.fillRect(-5, 0, 10, 18);
        // context.strokeRect(-5, 0, 10, 18);

        // context.fillStyle = this._style.skin;
        // context.strokeStyle = "black";
        // context.fillRect(-5, 12, 10, 6);
        // context.strokeRect(-5, 12, 10, 6);

        context.restore();
    }
    
    _renderBody(context, reverse) {
        context.save();

        context.translate(15, 20);
        context.rotate(this._body.angle);

        context.drawImage(AssetManager.getImage("character/body"), -10, 6);
        // context.fillStyle = this._style.top;
        // context.strokeStyle = "black";

        // context.beginPath();
        // context.moveTo(-7, 6);
        // context.lineTo(7, 6);
        // context.lineTo(10, 28);
        // context.lineTo(-10, 28);
        // context.lineTo(-7, 6);
        // context.fill();
        // context.stroke();
        // context.closePath();

        if (reverse) {
            context.scale(-1, 1);
        }
        
        context.drawImage(AssetManager.getImage("props/rabbit-tail"), -16, 16);
        // context.fillStyle = "white";
        // context.strokeStyle = "black";
        // context.beginPath();
        // context.moveTo(-8, 20);
        // context.arc(-12, 20, 4, 0, Math.PI * 2);
        // context.fill();
        // context.stroke();
        // context.closePath();
        
        context.restore();
    }

    _renderHead(context, reverse) {
        context.save();

        context.translate(15, 13);
        context.rotate(this._head.angle);

        context.drawImage(AssetManager.getImage("character/head"), -14, -12);
        // context.fillStyle = this._style.skin;
        // context.strokeStyle = "black";
        // context.fillRect(-14, -12, 28, 24);
        // context.strokeRect(-14, -12, 28, 24);

        if (reverse) {
            context.scale(-1, 1);
        }

        // Eye
        context.drawImage(AssetManager.getImage("character/eye"), 0, -4);
        // context.fillStyle = "white";
        // context.fillRect(4, -4, 6, 8);
        // context.fillStyle = "black";
        // context.fillRect(7, -2, 4, 4);
        // context.strokeRect(4, -4, 6, 8);

        // context.beginPath();
        // context.moveTo(0, -4);
        // context.lineTo(12, -4);
        // context.stroke();
        // context.closePath();
        // context.moveTo(0, -1);
        // context.lineTo(4, -1);
        // context.stroke();
        // context.closePath();

        // Hair
        context.drawImage(AssetManager.getImage("character/hair"), -4, -16);
        // context.beginPath();
        // context.moveTo(0, -12);
        // context.arc(0, -12, 4, Math.PI, Math.PI * 0.5);
        // context.stroke();
        // context.closePath();

        // context.beginPath();
        // context.arc(2, -12, 6, Math.PI, Math.PI * 0.2);
        // context.stroke();
        // context.closePath();

        context.restore();
    }
    
    _renderRightArm(context, reverse) {
        context.save();

        context.translate(15, 28);
        context.rotate(-this._arm.angle);

        context.drawImage(AssetManager.getImage("character/arm"), -5, -4);
        // context.fillStyle = this._style.top;
        // context.strokeStyle = "black";
        // context.fillRect(-5, -4, 10, 22);
        // context.strokeRect(-5, -4, 10, 22);

        // context.fillStyle = this._style.skin;
        // context.strokeStyle = "black";
        // context.fillRect(-5, 7, 10, 11);
        // context.strokeRect(-5, 7, 10, 11);
        
        if (reverse) {
            context.scale(-1, 1);
        }
        
        context.drawImage(AssetManager.getImage("props/lollipop"), 5, 8);
        // context.fillStyle = "#ffc0ff";
        // context.strokeStyle = "black";
        // context.beginPath();
        // context.moveTo(5, 12);
        // context.lineTo(12, 12);
        // context.stroke();
        // context.closePath();

        // context.beginPath();
        // context.arc(16, 12, 4, 0, Math.PI * 2);
        // context.fill();
        // context.stroke();
        // context.closePath();

        context.restore();
    }

    _renderEffect(context) {
        context.save();

        context.translate(15, 28);

        context.rotate(this._rotationMotion.angle);
        context.fillStyle = "rgba(255, 0, 0, 0.8)";
        context.fillRect(50, -10, 5, 10);
        context.fillRect(-55, -10, 5, 10);

        context.rotate(-0.18);
        context.fillStyle = "rgba(255, 0, 0, 0.6)";
        context.fillRect(50, -10, 5, 10);
        context.fillRect(-55, -10, 5, 10);

        context.rotate(-0.18);
        context.fillStyle = "rgba(255, 0, 0, 0.4)";
        context.fillRect(50, -10, 5, 10);
        context.fillRect(-55, -10, 5, 10);

        context.rotate(-0.18);
        context.fillStyle = "rgba(255, 0, 0, 0.2)";
        context.fillRect(50, -10, 5, 10);
        context.fillRect(-55, -10, 5, 10);

        context.restore();
    }
}