
import Phaser from 'phaser';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#87CEEB',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  pixelArt: false
};

export const GAME_SPEED = 200;
export const HOOK_SPAWN_MIN = 1000;
export const HOOK_SPAWN_MAX = 3000;
export const DIFFICULTY_INCREASE_INTERVAL = 5000;
export const DIFFICULTY_INCREASE_AMOUNT = 10;
