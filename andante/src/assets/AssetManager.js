/**
 * AssetManager - Handles loading and caching of image assets
 */
import { Assets } from './Assets.js';

export class AssetManager {
  static _images = {};
  static _loadingPromises = {};

  /**
   * Get an image by name (lazy loading)
   * @param {string} name - Asset name
   * @returns {HTMLImageElement} Image element
   */
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

  /**
   * Preload an image and return a promise
   * @param {string} name - Asset name
   * @returns {Promise<HTMLImageElement>} Promise resolving to image
   */
  static preloadImage(name) {
    if (this._images[name]) {
      return Promise.resolve(this._images[name]);
    }

    if (this._loadingPromises[name]) {
      return this._loadingPromises[name];
    }

    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        this._images[name] = image;
        delete this._loadingPromises[name];
        resolve(image);
      };
      image.onerror = (err) => {
        delete this._loadingPromises[name];
        reject(err);
      };
      image.src = Assets.get(name) || name;
    });

    this._loadingPromises[name] = promise;
    return promise;
  }

  /**
   * Preload all registered assets
   * @returns {Promise<void>} Promise resolving when all assets loaded
   */
  static async preloadAll() {
    const names = Assets.getAllNames();
    await Promise.all(names.map((name) => this.preloadImage(name)));
  }

  /**
   * Check if an image is loaded
   * @param {string} name - Asset name
   * @returns {boolean} Whether image is loaded
   */
  static isLoaded(name) {
    return !!this._images[name];
  }

  /**
   * Clear all cached images
   */
  static clear() {
    this._images = {};
    this._loadingPromises = {};
  }
}
