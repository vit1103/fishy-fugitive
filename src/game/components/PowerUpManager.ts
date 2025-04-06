
import Phaser from 'phaser';
import { PowerUp, ActivePowerUp } from '../types';

export class PowerUpManager {
  private scene: Phaser.Scene;
  private powerUps: Phaser.Physics.Arcade.Group;
  private waterLevel: number;
  private gameSpeed: number;
  private lastPowerUpTime: number = 0;
  private powerUpInterval: number = 10000; // 10 seconds
  private activePowerUps: ActivePowerUp[] = [];
  private statusIndicator: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, powerUps: Phaser.Physics.Arcade.Group, waterLevel: number, gameSpeed: number) {
    this.scene = scene;
    this.powerUps = powerUps;
    this.waterLevel = waterLevel;
    this.gameSpeed = gameSpeed;
    this.statusIndicator = this.scene.add.container(50, 100);
    this.statusIndicator.setDepth(100);
  }

  update(time: number, delta: number, playerSpeed: number): { speedMultiplier: number, isInvincible: boolean } {
    this.movePowerUps(delta);
    this.spawnPowerUp(time);
    return this.updateActivePowerUps(time);
  }

  private movePowerUps(delta: number): void {
    this.powerUps.getChildren().forEach((powerUp: Phaser.GameObjects.GameObject) => {
      const p = powerUp as Phaser.Physics.Arcade.Sprite;
      p.x -= (this.gameSpeed / 100) * delta * 0.06;
      
      // Remove power-ups that are off-screen
      if (p.x < -50) {
        p.destroy();
      }
    });
  }

  private spawnPowerUp(time: number): void {
    if (time > this.lastPowerUpTime + this.powerUpInterval) {
      this.lastPowerUpTime = time;
      
      // Random chance (50%) to spawn a power-up
      if (Math.random() > 0.5) {
        const type = Math.random() > 0.5 ? 'speed' : 'invincibility';
        const textureKey = type === 'speed' ? 'powerupSpeed' : 'powerupInvincibility';
        
        const x = this.scene.cameras.main.width + 50;
        const y = Phaser.Math.Between(
          this.waterLevel + 50,
          this.scene.cameras.main.height - 50
        );
        
        const powerUp = this.powerUps.create(x, y, textureKey) as Phaser.Physics.Arcade.Sprite;
        powerUp.setData('type', type);
        powerUp.setData('active', true);
        powerUp.setScale(0.6);
        
        // Add floating animation
        this.scene.tweens.add({
          targets: powerUp,
          y: y + 20,
          duration: 1500,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1
        });
      }
    }
  }

  private updateActivePowerUps(time: number): { speedMultiplier: number, isInvincible: boolean } {
    let speedMultiplier = 1;
    let isInvincible = false;
    
    // Update the status indicators
    this.statusIndicator.removeAll(true);
    
    // Filter out expired power-ups and check active ones
    this.activePowerUps = this.activePowerUps.filter(powerUp => {
      const isActive = time < powerUp.startTime + powerUp.duration;
      
      if (isActive) {
        if (powerUp.type === 'speed') {
          speedMultiplier = 1.5; // 50% speed boost
        } else if (powerUp.type === 'invincibility') {
          isInvincible = true;
        }
        
        // Add indicator to UI
        const icon = this.scene.add.image(0, 0, powerUp.type === 'speed' ? 'powerupSpeed' : 'powerupInvincibility');
        icon.setScale(0.4);
        
        // Calculate remaining time as percentage
        const remaining = (powerUp.startTime + powerUp.duration - time) / powerUp.duration;
        
        // Add progress circle
        const graphics = this.scene.add.graphics();
        graphics.clear();
        graphics.fillStyle(0x000000, 0.5);
        graphics.fillCircle(0, 0, 22);
        graphics.fillStyle(powerUp.type === 'speed' ? 0x00ff00 : 0xffff00, 0.7);
        graphics.slice(0, 0, 20, 0, Phaser.Math.DegToRad(360 * remaining), true);
        graphics.fillPath();
        
        const container = this.scene.add.container(0, this.activePowerUps.indexOf(powerUp) * 50);
        container.add(graphics);
        container.add(icon);
        
        this.statusIndicator.add(container);
        
        return true;
      }
      
      return false;
    });
    
    return { speedMultiplier, isInvincible };
  }

  handlePowerUpCollision(player: Phaser.Physics.Arcade.Sprite, powerUp: Phaser.Physics.Arcade.Sprite): void {
    const type = powerUp.getData('type') as 'speed' | 'invincibility';
    const isActive = powerUp.getData('active') as boolean;
    
    if (isActive) {
      powerUp.setData('active', false);
      
      // Create short animation effect
      const effect = this.scene.add.image(powerUp.x, powerUp.y, type === 'speed' ? 'powerupSpeed' : 'powerupInvincibility');
      effect.setScale(0.6);
      
      this.scene.tweens.add({
        targets: effect,
        scale: 1.2,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          effect.destroy();
        }
      });
      
      // Add to active power-ups
      this.activePowerUps.push({
        type,
        duration: type === 'speed' ? 5000 : 8000, // Speed: 5s, Invincibility: 8s
        startTime: this.scene.time.now
      });
      
      // Apply visual effect to player
      if (type === 'speed') {
        player.setTint(0x00ffff);
        this.scene.time.delayedCall(5000, () => {
          // Only remove tint if no speed power-up is active
          if (!this.activePowerUps.some(p => p.type === 'speed')) {
            player.clearTint();
          }
        });
      } else if (type === 'invincibility') {
        player.setTint(0xffff00);
        
        // Add pulsing effect
        const pulseAnimation = this.scene.tweens.add({
          targets: player,
          alpha: 0.7,
          duration: 300,
          yoyo: true,
          repeat: -1
        });
        
        this.scene.time.delayedCall(8000, () => {
          pulseAnimation.stop();
          player.setAlpha(1);
          // Only remove tint if no invincibility power-up is active
          if (!this.activePowerUps.some(p => p.type === 'invincibility')) {
            player.clearTint();
          }
        });
      }
      
      // Remove the power-up sprite
      powerUp.destroy();
    }
  }

  setGameSpeed(speed: number): void {
    this.gameSpeed = speed;
  }

  resetPowerUps(): void {
    this.activePowerUps = [];
    this.statusIndicator.removeAll(true);
  }
}
