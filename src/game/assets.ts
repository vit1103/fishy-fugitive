
// This file maps asset names to their file paths
const assetPaths = {
  fish: 'src/assets/fish.svg',
  hook: 'src/assets/hook.svg',
  bubble: 'src/assets/bubble.svg',
  boat: 'src/assets/boat.svg',
  fisherman: 'src/assets/fisherman.svg',
  seabed: 'src/assets/seabed.svg',
  cloud: 'src/assets/cloud.svg',
  coral: 'src/assets/coral.png',
  stone: 'src/assets/stone.svg',
  plant1: 'src/assets/plant1.png',
  plant2: 'src/assets/plant2.png',
  plant3: 'src/assets/plant3.png',
  plant4: 'src/assets/plant4.png',
  plant5: 'src/assets/plant5.png',
  smallfish1: 'src/assets/smallfish1.svg',
  smallfish2: 'src/assets/smallfish2.svg',
  smallfish3: 'src/assets/smallfish3.svg',
  wow: 'src/assets/wow.svg',
  seagull: 'src/assets/seagull.svg',
  powerupSpeed: 'src/assets/powerup-speed.svg',
  powerupInvincibility: 'src/assets/powerup-invincibility.svg',
  powerupEat: 'src/assets/powerup-eat.svg',
  backgroundMusic: 'src/assets/background-music.mp3',
  
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
