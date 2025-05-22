// This file maps asset names to their file paths
const assetPaths = {
  fish: 'assets/fish.svg',
  hook: 'assets/hook.svg',
  bubble: 'assets/bubble.svg',
  boat: 'assets/boat.svg',
  fisherman: 'assets/fisherman.svg',
  seabed: 'assets/seabed.svg',
  cloud: 'assets/cloud.svg',
  coral: 'assets/coral.png',
  stone: 'assets/stone.svg',
  plant1: 'assets/plant1.svg',
  plant2: 'assets/plant2.svg',
  plant3: 'assets/plant3.svg',
  plant4: 'assets/plant4.svg',
  plant5: 'assets/plant5.svg',
  smallfish1: 'assets/smallfish1.svg',
  smallfish2: 'assets/smallfish2.svg',
  smallfish3: 'assets/smallfish3.svg',
  wow: 'assets/wow.svg',
  seagull: 'assets/seagull.svg',
  powerupSpeed: 'assets/powerup-speed.svg',
  powerupInvincibility: 'assets/powerup-invincibility.svg',
  powerupEat: 'assets/powerup-eat.svg',
  backgroundMusic: 'assets/background-music.mp3',
  
  // Sprite sheet paths would go here if we create them
  // For now we'll use the SVGs as sprites
};

// Animation configurations for sprites
export const spriteAnimations = {
  fish: {
    key: 'fish_swim',
    frameRate: 8,
    repeat: -1
  },
  smallfish1: {
    key: 'smallfish1_swim',
    frameRate: 8,
    repeat: -1
  },
  smallfish2: {
    key: 'smallfish2_swim',
    frameRate: 8,
    repeat: -1
  },
  smallfish3: {
    key: 'smallfish3_swim',
    frameRate: 8,
    repeat: -1
  },
  bubble: {
    key: 'bubble_float',
    frameRate: 5,
    repeat: -1
  },
  seagull: {
    key: 'seagull_fly',
    frameRate: 8,
    repeat: -1
  }
};

export default assetPaths;
