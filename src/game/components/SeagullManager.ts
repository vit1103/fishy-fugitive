
import Phaser from 'phaser';
import { Seagull } from '../types';

export class SeagullManager {
  private scene: Phaser.Scene;
  private waterLevel: number;
  private seagulls: Seagull[] = [];
  private player: Phaser.Physics.Arcade.Sprite;
  private lastSeagullTime: number = 0;

  constructor(scene: Phaser.Scene, player: Phaser.Physics.Arcade.Sprite, waterLevel: number) {
    this.scene = scene;
    this.player = player;
    this.waterLevel = waterLevel;
    
    // Add initial seagulls
    this.addSeagull();
    
    // Add seagull every 10-15 seconds
    this.scene.time.addEvent({
      delay: Phaser.Math.Between(10000, 15000),
      callback: this.addSeagull,
      callbackScope: this,
      loop: true
    });
  }

  addSeagull() {
    const width = this.scene.cameras.main.width;
    const x = Phaser.Math.Between(0, width);
    const y = Phaser.Math.Between(50, this.waterLevel - 50);
    
    const seagull = this.scene.physics.add.sprite(x, y, 'seagullSpritesheet');
    seagull.play('seagull_fly');
    seagull.setScale(0.8);
    
    // Add to seagulls group for collision detection
    const seagullsGroup = this.scene.seagulls as Phaser.Physics.Arcade.Group;
    seagullsGroup.add(seagull);
    
    this.seagulls.push({
      sprite: seagull,
      state: 'flying',
      initialY: y
    });
  }

  update(time: number, delta: number) {
    const width = this.scene.cameras.main.width;
    
    this.seagulls.forEach((seagull, index) => {
      const { sprite, state } = seagull;
      
      if (!sprite.active) {
        this.seagulls.splice(index, 1);
        return;
      }
      
      if (state === 'flying') {
        // Move horizontally across the screen
        sprite.x += 2 * (delta / 10);
        
        // Add a gentle up/down motion
        sprite.y = seagull.initialY + Math.sin(time / 500 + index) * 10;
        
        // If it flies off-screen, flip direction
        if (sprite.x > width + 50) {
          sprite.x = -50;
          seagull.initialY = Phaser.Math.Between(50, this.waterLevel - 50);
        }
        
        // Randomly decide to dive toward the player (5% chance every second)
        if (time > this.lastSeagullTime + 1000 && Phaser.Math.Between(1, 100) <= 5) {
          this.lastSeagullTime = time;
          
          // Only dive if player is within range
          const distX = Math.abs(sprite.x - this.player.x);
          if (distX < 200) {
            seagull.state = 'diving';
            seagull.target = { 
              x: this.player.x, 
              y: this.player.y
            };
            
            // Change animation to diving
            sprite.play('seagull_dive');
          }
        }
      }
      else if (state === 'diving') {
        const target = seagull.target!;
        
        // Move toward the target position
        const dx = target.x - sprite.x;
        const dy = target.y - sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
          sprite.x += dx * 0.05;
          sprite.y += dy * 0.05;
        }
        
        // If seagull went below water and didn't catch player, return to flying
        if (sprite.y >= this.waterLevel + 100) {
          seagull.state = 'returning';
          seagull.target = { 
            x: sprite.x + Phaser.Math.Between(-100, 100), 
            y: seagull.initialY 
          };
          
          // Change animation back to flying
          sprite.play('seagull_fly');
        }
      }
      else if (state === 'returning') {
        const target = seagull.target!;
        
        // Move back up to flying height
        const dx = target.x - sprite.x;
        const dy = target.y - sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
          sprite.x += dx * 0.03;
          sprite.y += dy * 0.03;
        }
        else {
          seagull.state = 'flying';
          seagull.initialY = sprite.y;
        }
      }
    });
  }
}
