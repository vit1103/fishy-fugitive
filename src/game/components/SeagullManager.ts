
import Phaser from 'phaser';
import { Seagull } from '../types';

export class SeagullManager {
  private scene: Phaser.Scene;
  private seagulls: Phaser.Physics.Arcade.Group;
  private waterLevel: number;
  private player: Phaser.Physics.Arcade.Sprite;
  private lastSeagullTime: number = 0;
  private seagullInterval: number = 15000; // 15 seconds between seagull appearances
  private activeSeagulls: Seagull[] = [];

  constructor(scene: Phaser.Scene, player: Phaser.Physics.Arcade.Sprite, waterLevel: number) {
    this.scene = scene;
    this.player = player;
    this.waterLevel = waterLevel;
    this.seagulls = this.scene.physics.add.group();
  }

  update(time: number, delta: number) {
    // Spawn new seagulls occasionally
    this.spawnSeagull(time);
    
    // Update existing seagulls
    this.updateSeagulls(delta);
  }

  private spawnSeagull(time: number) {
    if (time > this.lastSeagullTime + this.seagullInterval) {
      this.lastSeagullTime = time;
      
      // Random chance (40%) to spawn a seagull
      if (Math.random() > 0.6) {
        const startX = Phaser.Math.Between(
          this.scene.cameras.main.width * 0.2,
          this.scene.cameras.main.width * 0.8
        );
        
        const startY = Phaser.Math.Between(50, this.waterLevel - 30);
        
        const seagull = this.seagulls.create(startX, startY, 'seagull') as Phaser.Physics.Arcade.Sprite;
        seagull.setScale(0.8);
        seagull.setSize(40, 20);
        seagull.setOffset(20, 20);
        
        // Store as an active seagull with state information
        const newSeagull: Seagull = {
          sprite: seagull,
          state: 'flying',
          initialY: startY
        };
        
        this.activeSeagulls.push(newSeagull);
        
        // Add some horizontal movement
        const direction = Math.random() > 0.5 ? 1 : -1;
        seagull.setVelocityX(direction * 50);
        seagull.setFlipX(direction < 0);
      }
    }
  }

  private updateSeagulls(delta: number) {
    this.activeSeagulls = this.activeSeagulls.filter(seagull => {
      const { sprite, state } = seagull;
      
      // Remove if off-screen or not active
      if (!sprite.active || sprite.x < -50 || sprite.x > this.scene.cameras.main.width + 50) {
        sprite.destroy();
        return false;
      }
      
      // State machine for seagull behavior
      switch (state) {
        case 'flying':
          // Randomly decide to dive
          if (Math.random() < 0.005) {
            seagull.state = 'diving';
            // Target near the player
            seagull.target = {
              x: this.player.x + Phaser.Math.Between(-50, 50),
              y: this.player.y + Phaser.Math.Between(-30, 30)
            };
            
            // Calculate angle and velocity to dive toward target
            const angle = Phaser.Math.Angle.Between(
              sprite.x, sprite.y,
              seagull.target.x, seagull.target.y
            );
            
            const speed = 200;
            sprite.setVelocity(
              Math.cos(angle) * speed,
              Math.sin(angle) * speed
            );
            
            // Flip based on direction
            sprite.setFlipX(Math.cos(angle) < 0);
          }
          break;
          
        case 'diving':
          // Check if reached target or water
          if (sprite.y > this.waterLevel + 100 || 
              (seagull.target && Phaser.Math.Distance.Between(
                sprite.x, sprite.y,
                seagull.target.x, seagull.target.y) < 10)) {
            
            seagull.state = 'returning';
            
            // Head back up
            const returnAngle = Phaser.Math.Angle.Between(
              sprite.x, sprite.y,
              sprite.x, seagull.initialY
            );
            
            const returnSpeed = 150;
            sprite.setVelocity(
              sprite.body.velocity.x * 0.3,  // Keep some horizontal movement
              Math.sin(returnAngle) * returnSpeed
            );
          }
          break;
          
        case 'returning':
          // Once back above water, return to flying
          if (sprite.y <= seagull.initialY) {
            seagull.state = 'flying';
            sprite.y = seagull.initialY;
            
            // Reset to normal flying velocity
            const direction = sprite.flipX ? -1 : 1;
            sprite.setVelocity(direction * 50, 0);
          }
          break;
      }
      
      return true;
    });
  }

  getSeagulls(): Phaser.Physics.Arcade.Group {
    return this.seagulls;
  }
}
