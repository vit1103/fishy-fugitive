import Phaser from 'phaser';
import { PowerUp, ActivePowerUp } from '../types';
import { POWERUP_DURATION, POWERUP_SPAWN_CHANCE } from '../config';

export class PowerUpManager {
  private scene: Phaser.Scene;
  private powerUps: Phaser.Physics.Arcade.Group;
  private waterLevel: number;
  private gameSpeed: number;
  private activePowerUps: ActivePowerUp[] = [];
  private lastPowerUpTime: number = 0;

  constructor(scene: Phaser.Scene, powerUps: Phaser.Physics.Arcade.Group, waterLevel: number, gameSpeed: number) {
    this.scene = scene;
    this.powerUps = powerUps;
    this.waterLevel = waterLevel;
    this.gameSpeed = gameSpeed;
  }

  update(time: number, delta: number, playerSpeed: number): {
    speedMultiplier: number;
    isInvincible: boolean;
    canEatObstacles: boolean;
  } {
    // Update existing power-up effects
    this.activePowerUps = this.activePowerUps.filter(powerUp => {
      const elapsed = time - powerUp.startTime;
      const remaining = powerUp.duration - elapsed;
      
      if (remaining <= 0) {
        if (powerUp.indicator) powerUp.indicator.destroy();
        return false;
      }
      
      // Update indicator position, if any
      if (powerUp.indicator) {
        const alpha = remaining < 1000 ? (remaining / 1000) : 1;
        powerUp.indicator.setAlpha(alpha);
      }
      
      return true;
    });
    
    // Spawn new power-ups
    if (time > this.lastPowerUpTime + 5000) { // Every 5 seconds check for spawning
      this.lastPowerUpTime = time;
      
      if (Phaser.Math.Between(1, 100) <= POWERUP_SPAWN_CHANCE) {
        this.spawnPowerUp();
      }
    }
    
    // Clean up offscreen power-ups
    this.powerUps.children.each((child: Phaser.GameObjects.GameObject) => {
      const powerUp = child as Phaser.Physics.Arcade.Sprite;
      if (powerUp.x < -50) {
        this.powerUps.remove(powerUp, true, true);
      }
      return true; // Return true to continue iteration
    });
    
    // Calculate current effects
    const speedPowerUp = this.activePowerUps.find(p => p.type === 'speed');
    const invincibilityPowerUp = this.activePowerUps.find(p => p.type === 'invincibility');
    const eatPowerUp = this.activePowerUps.find(p => p.type === 'eat');
    
    return {
      speedMultiplier: speedPowerUp ? 1.5 : 1,
      isInvincible: !!invincibilityPowerUp,
      canEatObstacles: !!eatPowerUp
    };
  }

  spawnPowerUp() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    // Position at the right side of the screen, underwater
    const x = width + 50;
    const y = Phaser.Math.Between(
      this.waterLevel + 50,
      height - 50
    );
    
    const powerUpTypes: ('speed' | 'invincibility' | 'eat')[] = ['speed', 'invincibility', 'eat'];
    const type = powerUpTypes[Phaser.Math.Between(0, powerUpTypes.length - 1)];
    
    const powerUp = this.scene.physics.add.sprite(x, y, 'powerupSpritesheet');
    
    // Set animation based on power-up type
    if (type === 'speed') {
      powerUp.play('powerup_speed');
    } else if (type === 'invincibility') {
      powerUp.play('powerup_invincibility');
    } else {
      powerUp.play('powerup_eat');
    }
    
    this.powerUps.add(powerUp);
    
    powerUp.setData('type', type);
    
    // Move power-up from right to left
    powerUp.setVelocityX(-this.gameSpeed * 0.7);
    
    // Add some subtle up/down movement
    this.scene.tweens.add({
      targets: powerUp,
      y: y + Phaser.Math.Between(-30, 30),
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  handlePowerUpCollision(player: Phaser.Physics.Arcade.Sprite, powerUp: Phaser.Physics.Arcade.Sprite) {
    const powerUpType = powerUp.getData('type') as 'speed' | 'invincibility' | 'eat';
    
    // Remove existing power-up of the same type
    this.activePowerUps = this.activePowerUps.filter(p => {
      if (p.type === powerUpType) {
        if (p.indicator) p.indicator.destroy();
        return false;
      }
      return true;
    });
    
    // Add new power-up effect
    const activePowerUp: ActivePowerUp = {
      type: powerUpType,
      duration: POWERUP_DURATION,
      startTime: this.scene.time.now,
      indicator: this.addPowerUpIndicator(powerUpType)
    };
    
    this.activePowerUps.push(activePowerUp);
    
    // Remove the power-up from the game
    powerUp.destroy();
  }
  
  addPowerUpIndicator(powerUpType: 'speed' | 'invincibility' | 'eat') {
    // Create a small indicator above the player to show active power-up
    const x = 20 + this.activePowerUps.length * 30;
    const y = 20;
    
    const indicator = this.scene.add.sprite(x, y, 'powerupSpritesheet');
    
    // Set frame based on power-up type
    if (powerUpType === 'speed') {
      indicator.play('powerup_speed');
    } else if (powerUpType === 'invincibility') {
      indicator.play('powerup_invincibility');
    } else {
      indicator.play('powerup_eat');
    }
    
    indicator.setScale(0.6);
    indicator.setScrollFactor(0); // Fix to camera
    indicator.setDepth(100); // Ensure it's on top
    
    return indicator;
  }

  setGameSpeed(speed: number) {
    this.gameSpeed = speed;
  }
}
