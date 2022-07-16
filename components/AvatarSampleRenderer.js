class AvatarSampleRenderer {
    _environment = {
        loopX: true,
        gravity: 1
    };

    _characterObject = null;

    _lockedJumpAt = null;

    constructor() {
        this._characterObject = new CharacterObject(-15, 100, 30, 60);
    }

    compute(status) {
        this._characterObject.compute(status);
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
        this._characterObject.render(context);
    }
}