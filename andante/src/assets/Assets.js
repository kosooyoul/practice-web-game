/**
 * Assets - Asset path definitions
 * Maps asset names to their file paths
 */
export class Assets {
  static _assets = {
    'character/head': '../../assets/character/head.svg',
    'character/eye': '../../assets/character/eye.svg',
    'character/hair': '../../assets/character/hair.svg',
    'character/arm': '../../assets/character/arm.svg',
    'character/leg': '../../assets/character/leg.svg',
    'character/body': '../../assets/character/body.svg',
    'props/rabbit-tail': '../../assets/props/rabbit-tail.svg',
    'props/lollipop': '../../assets/props/lollipop.svg',
  };

  /**
   * Get asset path by name
   * @param {string} name - Asset name
   * @returns {string|undefined} Asset path
   */
  static get(name) {
    return this._assets[name];
  }

  /**
   * Register a new asset
   * @param {string} name - Asset name
   * @param {string} path - Asset path
   * @returns {string} Registered path
   */
  static register(name, path) {
    this._assets[name] = path;
    return path;
  }

  /**
   * Get all asset names
   * @returns {string[]} Asset names
   */
  static getAllNames() {
    return Object.keys(this._assets);
  }
}
