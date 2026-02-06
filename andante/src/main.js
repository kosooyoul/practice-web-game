/**
 * Andante - Main Entry Point
 */
import { Game } from './core/Game.js';
import { StageSelectScene } from './scenes/StageSelectScene.js';

/**
 * Initialize and start the game
 */
const initGame = () => {
  const canvas = document.querySelector('#game-canvas');

  if (!canvas) {
    console.error('[Andante] Canvas element not found');
    return;
  }

  const game = new Game(canvas);
  const stageSelectScene = new StageSelectScene();
  game.setScene(stageSelectScene);

  game.start();

  console.log('[Andante] Game initialized (Stage Select)');
};

// Start game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
