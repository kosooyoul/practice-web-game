/**
 * Andante - Main Entry Point
 */
import { Game } from './core/Game.js';
import { GameScene } from './scenes/GameScene.js';

/**
 * Initialize and start the game
 */
const initGame = () => {
  const canvas = document.querySelector('#game-canvas');

  if (!canvas) {
    console.error('[Andante] Canvas element not found');
    return;
  }

  // Create game instance
  const game = new Game(canvas);

  // Create and set game scene
  const gameScene = new GameScene();
  game.setScene(gameScene);

  // Start the game
  game.start();

  console.log('[Andante] Game initialized');
};

// Start game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
