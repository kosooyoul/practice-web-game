class AssetManager {
    static _images = {};

    constructor() {
        throw new Error();
    }

    static getImage(name) {
        if (this._images[name]) {
            return this._images[name];
        }

        const image = new Image();
        image.onload = () => {
            this._images[name] = image;
        };
        image.src = Assets.get(name) || name;

        return image;
    }
}