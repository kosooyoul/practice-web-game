class DefaultWebGLRenderer {
    _environment = {
        loopX: true,
        loopY: true,
        gravity: -1
    };

    _actorObject = null;
    _boxObjects = [];

    _lockedJumpAt = null;

    // ThreeJS Components
    _scene = null;
    _camera = null;

    constructor(canvas) {
        this._actorObject = new Physics3DObject(-20, 100, 40, 40);
    }

    initializeScene(context, width, height, scale) {
        this._scene = new THREE.Scene();
        this._camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this._camera.rotateX(Math.PI * -0.20);
        this._camera.position.y = 200;
        this._camera.position.z = 200;

        const sphere = new THREE.Group();

        const directionalLight1 = new THREE.DirectionalLight(0xffff00, 0.4);
        directionalLight1.position.x = 100;
        directionalLight1.position.y = 100;
        directionalLight1.position.z = 1;
        this._scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0x00ffff, 0.4);
        directionalLight2.position.x = -100;
        directionalLight2.position.y = 100;
        directionalLight2.position.z = 1;
        this._scene.add(directionalLight2);

        const directionalLight3 = new THREE.DirectionalLight(0xff00ff, 0.4);
        directionalLight3.position.x = 100;
        directionalLight3.position.y = 100;
        directionalLight3.position.z = 100;
        this._scene.add(directionalLight3);

        this.createGround(sphere, 0)
        this._scene.add(sphere);

        this._actorMesh = this.createBlock(sphere, 0, 0, 20, 20);

        this._actorMesh.add(this._camera)
    }

    compute(status) {
        this._computeMoving(this._actorObject, status);
        this._computeJumping(this._actorObject, status);
        this._computeGroundCollision(status);
        //this._computeBoxCollision(status);
        this._actorObject.move();

        this._actorMesh.position.x = this._actorObject.x;
        this._actorMesh.position.z = this._actorObject.y;
        this._actorMesh.position.y = this._actorObject.z;
    }

    render(context, status) {
        context.render(this._scene, this._camera);
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
        if (status.joypad["up"]) {
            object.physics.accelerationY = Math.min(object.physics.accelerationY - object.physics.movingPowerPerTick, 0);
        } else if (status.joypad["down"]) {
            object.physics.accelerationY = Math.max(object.physics.accelerationY + object.physics.movingPowerPerTick, 0);
        } else {
            object.physics.accelerationY = 0;
            if (object.physics.jumpedAt) {
                object.physics.speedY += (0 - object.physics.speedY) * object.physics.airResistivity;
            } else {
                object.physics.speedY += (0 - object.physics.speedY) * object.physics.groundResistivity;
            }
        }

        object.physics.speedX = Math.max(Math.min(object.physics.speedX + object.physics.accelerationX, object.physics.maxSpeedX), -object.physics.maxSpeedX);
        object.physics.speedY = Math.max(Math.min(object.physics.speedY + object.physics.accelerationY, object.physics.maxSpeedY), -object.physics.maxSpeedY);

        let x = object.x + object.physics.speedX;
        if (this._environment.loopX) {
            if (x < status.boundary.left - object.width) {
                x = status.boundary.right;
            } else if (x > status.boundary.right) {
                x = status.boundary.left - object.width;
            }
        }

        let y = object.y + object.physics.speedY;
        if (this._environment.loopY) {
            if (y < status.boundary.top - object.height) {
                y = status.boundary.bottom;
            } else if (y > status.boundary.bottom) {
                y = status.boundary.top - object.height;
            }
        }

        object.toXY(x, y);
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
                object.physics.speedZ = 0;
                object.physics.accelerationZ = 0;
            } else if (object.physics.flapped < object.physics.flappable) {
                if (status.joypad["action"] > object.physics.jumpedAt) {
                    object.physics.flapped++;
                    object.physics.jumpedAt = Date.now();
                    object.physics.leftJumpingPower = object.physics.maxJumpingPower;
                    object.physics.accelerationZ = 0;
                }
            }
        } else {
            object.physics.leftJumpingPower = 0;
        }

        if (object.physics.leftJumpingPower > 0) {
            object.physics.accelerationZ += object.physics.jumpingPowerPerTick;
            object.physics.leftJumpingPower -= object.physics.jumpingPowerPerTick;
        }

        object.physics.speedZ = object.physics.accelerationZ;
        object.physics.accelerationZ += this._environment.gravity - object.physics.airResistivity;

        const z = object.z + object.physics.speedZ;
        object.toZ(z);
    }

    _computeGroundCollision(status) {
        if (this._actorObject.collisionWithGround(0) == "top") {
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