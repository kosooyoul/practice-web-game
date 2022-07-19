class Assets {
    constructor() {
        throw new Error();
    }

    static _assets = {
        "rectangle": "../assets/rectangle.svg",
        "character/head": "../assets/character/head.svg",
        "character/eye": "../assets/character/eye.svg",
        "character/hair": "../assets/character/hair.svg",
        "character/arm": "../assets/character/arm.svg",
        "character/leg": "../assets/character/leg.svg",
        "character/body": "../assets/character/body.svg",
        "props/rabbit-tail": "../assets/props/rabbit-tail.svg",
        "props/lollipop": "../assets/props/lollipop.svg",
    };

    static get(name) {
        return this._assets[name];
    }

    static register(name, path) {
        return this._assets[name] = path;
    }
}