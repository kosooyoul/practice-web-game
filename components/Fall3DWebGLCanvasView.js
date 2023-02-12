class Fall3DWebGLCanvasView {
    _y = 4100;
    _speedY = 0;
    _maxSpeedY = 8;
    _gravity = 0.005;
    _groundReflectivity = 0.6;

    _width = 0;
    _height = 0;
    _scale = 1;
    _scaledHalfWidth = 0;
    _scaledHalfHeight = 0;
    _boundary = {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
    };

    _tick = 0;

    _joypad;

    constructor(canvas) {
        console.log("initialize");

        if (!window.WebGLRenderingContext) {
            throw new Error('WebGLRenderingContext is undefined.');
        }

        this._canvas = canvas;

        this._renderer = new THREE.WebGLRenderer({
            canvas: this._canvas,
            antialias: false
        });
        this._context = this._renderer.getContext();

        this._renderer.setSize(this._canvas.clientWidth, this._canvas.clientHeight, false);
        this._renderer.setClearColor(0x000000, 1);

        this._scene = new THREE.Scene();
        this._camera = new THREE.PerspectiveCamera(60, this._canvas.clientWidth / this._canvas.clientHeight, 0.1, 1000);
        // this._camera.rotateX(Math.PI * -0.5);
        this._camera.position.y = this._y;

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

        for (let i = 0; i < 1000; i++) {
            let left = Math.random() * 200 - 100;
            let right = Math.random() * 200 - 100;
            let top = Math.random() * 4000 + 10;
            let length = Math.random() * 10 + 1;
            this.createBlock(sphere, left, right, top, length);
        }

        this.createGround(sphere, 0)
        this._scene.add(sphere);

        // Autoplay
        this.play();

        canvas.addEventListener("mousedown", (evt) => this._onPointersDown(evt));
        canvas.addEventListener("mousemove", (evt) => this._onPointersMove(evt));
        canvas.addEventListener("mouseup", (evt) => this._onPointersUp(evt));
        canvas.addEventListener("mouseout", (evt) => this._onPointersUp(evt));
        canvas.addEventListener("mouseleave", (evt) => this._onPointersUp(evt));
        canvas.addEventListener("touchstart", (evt) => this._onPointersDown(evt));
        canvas.addEventListener("touchmove", (evt) => this._onPointersMove(evt));
        canvas.addEventListener("touchend", (evt) => this._onPointersUp(evt));
        document.body.addEventListener("keydown", (evt) => this._onKeyDown(evt));
        document.body.addEventListener("keyup", (evt) => this._onKeyUp(evt));
    }

    setJoypad(joypad) {
        this._joypad = joypad;
    }

    getSphere() {
        var geometry = new THREE.SphereGeometry(100, 40, 40, 0, Math.PI * 2, 0, Math.PI * 2);
        var material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, side: THREE.DoubleSide });
        return new THREE.Mesh(geometry, material);
    }

    createBlock(parent, x, y, z, length) {
        const geometry = new THREE.BoxGeometry(0.5, length, 0.5);
        const material = new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.translateX(x);
        mesh.translateZ(y);
        mesh.translateY(z);
        parent.add(mesh);
    }

    createGround(parent, z) {
        const geometry = new THREE.BoxGeometry(100, 1, 100);
        const material = new THREE.MeshPhongMaterial({ color: 0x999999 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.translateY(z);
        parent.add(mesh);
    }

    _requestLoop(context) {
        window.requestAnimationFrame(() => {
            this._compute();

            this._render(context);

            if (this._playing) {
                this._requestLoop(context);
            }
        });
    }

    _compute() {
        this._tick++;

        this._renderer.setSize(this._canvas.clientWidth, this._canvas.clientHeight, false);
        this._camera.aspect = this._canvas.clientWidth / this._canvas.clientHeight;
        this._camera.updateProjectionMatrix();

        this._width = this._canvas.width;
        this._height = this._canvas.height;
        this._scaledHalfWidth = this._width / 2 / this._scale;
        this._scaledHalfHeight = this._height / 2 / this._scale;
        this._boundary = {
            left: -this._width / 2 / this._scale,
            right: this._width / 2 / this._scale,
            top: -this._height / 2 / this._scale,
            bottom: this._height / 2 / this._scale
        };

        this._joypad && this._joypad.setCanvasSize(this._canvas.width, this._canvas.height, this._scale);

        const status = {
            joypad: this._joypad && this._joypad.getStatus(),
            boundary: this._boundary,
            tick: this._tick
        };

        this._joypad && this._joypad.compute(status);

        // Custom
        this._speedY += this._gravity;
        if (this._speedY > this._maxSpeedY) {
            this._speedY = this._maxSpeedY;
        }
        this._y -= this._speedY;
        if (this._y < 1) {
            this._y = 1;
            this._speedY = -this._speedY * this._groundReflectivity;
        }

        this._camera.position.y = this._y;
        if (status.joypad["left"]) {
            this._camera.rotation.z += (Math.PI * -0.01);
        } else if (status.joypad["right"]) {
            this._camera.rotation.z += (Math.PI * 0.01);
        }
        this._camera.rotation.x = Math.PI * -0.5;
    }

    _render(_context) {
        this._renderer.render(this._scene, this._camera);
    }

    play() {
        console.log("play");

        if (this._playing) return;
        this._playing = true;
        this._requestLoop(this._context);
    }

    stop() {
        console.log("stop");

        if (!this._playing) return;
        this._playing = false;
    }

    destroy() {
        console.log("destroy");

        this._playing = false;

        // Destroy All Objects
    }

    _getPointers(evt) {
        var touches = evt.targetTouches ? evt.targetTouches : [evt];
        const pointers = [];
        for (var i = 0; i < touches.length; i++) {
            pointers.push({
                x: touches[i].pageX,
                y: touches[i].pageY,
                id: touches[i].identifier
            });
        }
        return pointers;
    }

    _onPointersDown(evt) {
        if (evt.type == "touchstart") {
            evt.preventDefault(); // for Mobile
        }

        var pointers = this._getPointers(evt);

        if (this._joypad) {
            this._joypad.onPointersDown(pointers);
        }
    }

    _onPointersMove(evt) {
        var pointers = this._getPointers(evt);

        if (this._joypad) {
            this._joypad.onPointersMove(pointers);
        }
    }

    _onPointersUp(evt) {
        var pointers = this._getPointers(evt);

        if (this._joypad) {
            this._joypad.onPointersUp(pointers);
        }
    }

    _onKeyDown(evt) {
        if (this._joypad) {
            this._joypad.onKeyDown(evt.which);
        }
    }

    _onKeyUp(evt) {
        if (this._joypad) {
            this._joypad.onKeyUp(evt.which);
        }
    }
}