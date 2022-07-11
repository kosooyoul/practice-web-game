class SingleAction4DirectionsJoypad {
    _width = 0;
    _height = 0;
    _scale = 1;
    _scaledHalfWidth = 0;
    _scaledHalfHeight = 0;

    _downedCursor;
    _movingCursor;
    _actionedCursor;

    _keyStatus = {};

    constructor() {

    }

    getStatus() {
        return this._keyStatus;
    }

    setCanvasSize(width, height, scale) {
        this._width = width;
        this._height = height;
        this._scale = scale || 1;
        this._scaledHalfWidth = width / 2 / this._scale;
        this._scaledHalfHeight = height / 2 / this._scale;
    }

    onPointersDown(pointers) {
        pointers.forEach(pointer => {
            var cursorX = pointer.x - this._scaledHalfWidth;
            var cursorY = pointer.y - this._scaledHalfHeight;

            if (cursorX < 0) {
                // Left side -> joystick
                if (this._downedCursor == null) {
                    this._downedCursor = { x: cursorX, y: cursorY, id: pointer.id };
                    this._movingCursor = { x: cursorX, y: cursorY, id: pointer.id };
                }
            } else {
                // Right side -> action
                if (this._actionedCursor == null) {
                    this._actionedCursor = { x: cursorX, y: cursorY, id: pointer.id };
                    this._keyStatus["action"] = Date.now();
                }
            }
        });
    }

    onPointersMove(pointers) {
        if (this._downedCursor == null) {
            return;
        }

        pointers.forEach(pointer => {
            if (pointer.id != this._downedCursor.id) {
                return;
            }

            var cursorX = pointer.x - this._scaledHalfWidth;
            var cursorY = pointer.y - this._scaledHalfHeight;
            this._movingCursor = { x: cursorX, y: cursorY };

            if (Math.abs(this._downedCursor.x - this._movingCursor.x) > Math.abs(this._downedCursor.y - this._movingCursor.y)) {
                if (this._downedCursor.x < this._movingCursor.x) {
                    if (this._keyStatus["right"] == null) {
                        this._keyStatus["right"] = Date.now();
                        delete this._keyStatus["left"];
                        delete this._keyStatus["up"];
                        delete this._keyStatus["down"];
                    }
                } else if (this._downedCursor.x > this._movingCursor.x) {
                    if (this._keyStatus["left"] == null) {
                        this._keyStatus["left"] = Date.now();
                        delete this._keyStatus["right"];
                        delete this._keyStatus["up"];
                        delete this._keyStatus["down"];
                    }
                }
            } else {
                if (this._downedCursor.y < this._movingCursor.y) {
                    if (this._keyStatus["down"] == null) {
                        this._keyStatus["down"] = Date.now();
                        delete this._keyStatus["left"];
                        delete this._keyStatus["right"];
                        delete this._keyStatus["up"];
                    }
                } else if (this._downedCursor.y > this._movingCursor.y) {
                    if (this._keyStatus["up"] == null) {
                        this._keyStatus["up"] = Date.now();
                        delete this._keyStatus["left"];
                        delete this._keyStatus["right"];
                        delete this._keyStatus["down"];
                    }
                }
            }
        });
    }

    onPointersUp(pointers) {
        if (this._downedCursor) {
            const downedPointer = pointers.find(pointer => pointer.id == this._downedCursor.id)
            if (downedPointer == null || downedPointer.id == null) {
                delete this._keyStatus["left"];
                delete this._keyStatus["right"];
                delete this._keyStatus["up"];
                delete this._keyStatus["down"];
                this._downedCursor = null;
                this._movingCursor = null;
                this._moving = false;
            }
        }

        if (this._actionedCursor) {
            const actionedPointer = pointers.find(pointer => pointer.id == this._actionedCursor.id)
            if (actionedPointer == null || actionedPointer.id == null) {
                delete this._keyStatus["action"];
                this._actionedCursor = null;
            }
        }
    }

    onKeyDown(keyCode) {
        const keyName = this._keyCodeToName(keyCode);
        if (this._keyStatus[keyName] != null) {
            return
        }

        if (keyName) {
            this._keyStatus[keyName] = Date.now();
        }
    }

    onKeyUp(keyCode) {
        const keyName = this._keyCodeToName(keyCode);
        delete this._keyStatus[keyName];
    }

    compute(_status) {

    }

    render(context, _status) {
        if (this._downedCursor) {
            this._renderJoystickLeft(context, !!this._keyStatus["left"]);
            this._renderJoystickRight(context, !!this._keyStatus["right"]);
            this._renderJoystickUp(context, !!this._keyStatus["up"]);
            this._renderJoystickDown(context, !!this._keyStatus["down"]);
        }

        if (this._movingCursor) {
            this._renderJoystickCursor(context);
        }
    }

    _keyCodeToName(keyCode) {
        switch (keyCode) {
            case 37: return "left";
            case 38: return "up";
            case 39: return "right";
            case 40: return "down";
            case 32: return "action";
        }
        return "";
    }

    _renderJoystickLeft(context, highlight) {
        context.beginPath();
        context.fillStyle = highlight ? "rgba(127, 0, 127, 0.2)" : "rgba(127, 127, 127, 0.2)";
        context.strokeStyle = "rgba(220, 220, 220, 0.4)";
        context.moveTo(this._downedCursor.x - 28.28, this._downedCursor.y + 28.28);
        context.arc(this._downedCursor.x, this._downedCursor.y, 30, Math.PI * 0.75, Math.PI * 1.25);
        context.lineTo(this._downedCursor.x - 28.28, this._downedCursor.y - 28.28);
        context.arc(this._downedCursor.x, this._downedCursor.y, 40, Math.PI * 1.25, Math.PI * 0.75, true);
        context.fill();
        context.stroke();
    }


    _renderJoystickRight(context, highlight) {
        context.beginPath();
        context.fillStyle = highlight ? "rgba(127, 0, 127, 0.2)" : "rgba(127, 127, 127, 0.2)";
        context.strokeStyle = "rgba(220, 220, 220, 0.4)";
        context.moveTo(this._downedCursor.x + 28.28, this._downedCursor.y - 28.28);
        context.arc(this._downedCursor.x, this._downedCursor.y, 30, Math.PI * 1.75, Math.PI * 2.25);
        context.lineTo(this._downedCursor.x + 28.28, this._downedCursor.y + 28.28);
        context.arc(this._downedCursor.x, this._downedCursor.y, 40, Math.PI * 2.25, Math.PI * 1.75, true);
        context.fill();
        context.stroke();
    }

    _renderJoystickUp(context, highlight) {
        context.beginPath();
        context.fillStyle = highlight ? "rgba(127, 0, 127, 0.2)" : "rgba(127, 127, 127, 0.2)";
        context.strokeStyle = "rgba(220, 220, 220, 0.4)";
        context.moveTo(this._downedCursor.x - 28.28, this._downedCursor.y - 28.28);
        context.arc(this._downedCursor.x, this._downedCursor.y, 30, Math.PI * 1.25, Math.PI * 1.75);
        context.lineTo(this._downedCursor.x + 28.28, this._downedCursor.y - 28.28);
        context.arc(this._downedCursor.x, this._downedCursor.y, 40, Math.PI * 1.75, Math.PI * 1.25, true);
        context.fill();
        context.stroke();
    }

    _renderJoystickDown(context, highlight) {
        context.beginPath();
        context.fillStyle = highlight ? "rgba(127, 0, 127, 0.2)" : "rgba(127, 127, 127, 0.2)";
        context.strokeStyle = "rgba(220, 220, 220, 0.4)";
        context.moveTo(this._downedCursor.x + 28.28, this._downedCursor.y + 28.28);
        context.arc(this._downedCursor.x, this._downedCursor.y, 30, Math.PI * 0.25, Math.PI * 0.75);
        context.lineTo(this._downedCursor.x - 28.28, this._downedCursor.y + 28.28);
        context.arc(this._downedCursor.x, this._downedCursor.y, 40, Math.PI * 0.75, Math.PI * 0.25, true);
        context.fill();
        context.stroke();
    }

    _renderJoystickCursor(context) {
        context.beginPath();
        context.fillStyle = "rgba(127, 127, 127, 0.2)";
        context.strokeStyle = "rgba(220, 220, 220, 0.4)";
        context.arc(this._movingCursor.x, this._movingCursor.y, 20, 0, Math.PI * 2);
        context.fill();
        context.stroke();
    }
}