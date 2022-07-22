class WebGLCanvasView {
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
        this._renderer.setClearColor(0xF9F9F9, 1);

        this._scene = new THREE.Scene();
        this._camera = new THREE.PerspectiveCamera(60, this._canvas.clientWidth / this._canvas.clientHeight, 0.1, 1000);

        const sphere = new THREE.Group();
        sphere.add(this.getSphere());

        this._scene.add(sphere);

        // Autoplay
        this.play();
    }

    getSphere() {
        var geometry = new THREE.SphereGeometry(100, 40, 40, 0, Math.PI * 2, 0, Math.PI * 2);
        var material = new THREE.MeshBasicMaterial({ color: 0xffa0a0, wireframe: true, side: THREE.DoubleSide });
        return new THREE.Mesh(geometry, material);
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