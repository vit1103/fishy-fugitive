
import Phaser from 'phaser';

export interface FishermanWithBoat {
  boat: Phaser.GameObjects.Image;
  fisherman: Phaser.GameObjects.Image;
  direction: number;
  targetX?: number;
  ropeGraphics?: Phaser.GameObjects.Graphics;
}

export interface Obstacle {
  sprite: Phaser.Physics.Arcade.Sprite;
  type: 'coral' | 'stone' | 'plant';
}

export interface BackgroundFish {
  sprite: Phaser.GameObjects.Image;
  speed: number;
  depthLevel: number;
}

export interface PowerUp {
  sprite: Phaser.Physics.Arcade.Sprite;
  type: 'speed' | 'invincibility' | 'eat';
  active: boolean;
}

export interface ActivePowerUp {
  type: 'speed' | 'invincibility' | 'eat';
  duration: number;
  startTime: number;
  indicator?: Phaser.GameObjects.Image;
}

export interface Seagull {
  sprite: Phaser.Physics.Arcade.Sprite;
  state: 'flying' | 'diving' | 'returning';
  target?: { x: number, y: number };
  initialY: number;
}
