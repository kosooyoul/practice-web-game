class WebGLCanvasView {

    _y = 2000;
    _speedY = 0;
    _maxSpeedY = 8;
    _gravity = 0.005;
    _groundReflectivity = 0.6;

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
        this._camera.rotateX(Math.PI * -0.5);
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

        for (let i = 0; i < 2000; i++) {
            let left = Math.random() * 200 - 100;
            let right = Math.random() * 200 - 100;
            let top = Math.random() * 2000 + 10;
            let length = Math.random() * 10 + 1;
            this.createBlock(sphere, left, right, top, length);
        }

        this.createGround(sphere, 0)
        this._scene.add(sphere);

        // Autoplay
        this.play();
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
        this._renderer.setSize(this._canvas.clientWidth, this._canvas.clientHeight, false);
        this._camera.aspect = this._canvas.clientWidth / this._canvas.clientHeight;

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
        this._camera.rotateZ(Math.PI * -0.001);
        this._camera.updateProjectionMatrix();
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
}