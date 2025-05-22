import Phaser from 'phaser';

export class PlayerController {
  private scene: Phaser.Scene;
  private fish: Phaser.Physics.Arcade.Sprite;
  private speedMultiplier: number = 1;
  private fishSize: number = 0.7;
  private waterLevel: number;

  constructor(scene: Phaser.Scene, fish: Phaser.Physics.Arcade.Sprite, waterLevel: number) {
    this.scene = scene;
    this.fish = fish;
    this.waterLevel = waterLevel;
    
    // Setup input handlers
    this.scene.input.on('pointerdown', this.handlePointerDown, this);
    this.scene.input.on('pointermove', this.handlePointerMove, this);
  }

  update() {
    const baseSpeed = 200 * this.speedMultiplier;
  }

  setSpeedMultiplier(multiplier: number) {
    this.speedMultiplier = multiplier;
  }

  handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (pointer.isDown) {
      this.handlePointerMove(pointer);
    }
  }

  handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (pointer.isDown) {
      if (pointer.y < this.waterLevel) return;
      
      const targetX = pointer.x;
      const targetY = pointer.y;
      
      const dx = targetX - this.fish.x;
      const dy = targetY - this.fish.y;
      
      const angle = Math.atan2(dy, dx);
      const speed = 200 * this.speedMultiplier;
      
      this.fish.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );
      
      if (dx < 0) {
        this.fish.setFlipX(true);
      } else {
        this.fish.setFlipX(false);
      }
    }
  }

  growFish() {
    this.fishSize += 0.1;
    this.fish.setScale(this.fishSize);
    
    // Visual effect for growth
    const growthEffect = this.scene.add.circle(this.fish.x, this.fish.y, 50, 0xffffff, 0.5);
    this.scene.tweens.add({
      targets: growthEffect,
      scale: 2,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        growthEffect.destroy();
      }
    });
  }

  getFish(): Phaser.Physics.Arcade.Sprite {
    return this.fish;
  }

  cleanup() {
    this.scene.input.off('pointerdown', this.handlePointerDown, this);
    this.scene.input.off('pointermove', this.handlePointerMove, this);
  }
}
