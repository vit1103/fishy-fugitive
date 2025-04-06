
import Phaser from 'phaser';
import { FishermanWithBoat } from '../types';
import { FISHERMAN_MOVEMENT_SPEED } from '../config';

export class Fishermen {
  private scene: Phaser.Scene;
  private waterLevel: number;
  fishermen: FishermanWithBoat[] = [];

  constructor(scene: Phaser.Scene, waterLevel: number) {
    this.scene = scene;
    this.waterLevel = waterLevel;
    this.createBoatAndFisherman();
  }

  createBoatAndFisherman() {
    this.fishermen = [];
    
    for (let i = 0; i < 3; i++) {
      const x = 200 + i * 300;
      const boat = this.scene.add.image(x, this.waterLevel - 20, 'boat');
      const fisherman = this.scene.add.image(x - 20, this.waterLevel - 60, 'fisherman');
      fisherman.setScale(0.8);
      
      const ropeGraphics = this.scene.add.graphics();
      
      this.fishermen.push({
        boat,
        fisherman,
        direction: Phaser.Math.Between(0, 1) ? 1 : -1,
        ropeGraphics
      });
      
      this.scene.tweens.add({
        targets: [boat, fisherman],
        y: '+=10',
        duration: 1500,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        delay: i * 200
      });
    }
  }

  update(delta: number, fishX: number) {
    const width = this.scene.cameras.main.width;
    
    this.fishermen.forEach((fishermanWithBoat, index) => {
      const { boat, fisherman, direction } = fishermanWithBoat;
      
      if (fishermanWithBoat.targetX !== undefined) {
        const diffX = fishermanWithBoat.targetX - boat.x;
        const moveX = Math.sign(diffX) * FISHERMAN_MOVEMENT_SPEED * (delta / 10);
        
        if (Math.abs(diffX) < 5 || (diffX > 0 && moveX > diffX) || (diffX < 0 && moveX < diffX)) {
          fishermanWithBoat.targetX = undefined;
        } else {
          boat.x += moveX;
          fisherman.x += moveX;
        }
      } else {
        if (Phaser.Math.Between(1, 100) <= 2) {
          if (Phaser.Math.Between(1, 100) <= 30) {
            fishermanWithBoat.targetX = Phaser.Math.Clamp(fishX, 100, width - 100);
          } else {
            fishermanWithBoat.targetX = Phaser.Math.Between(100, width - 100);
          }
        } else {
          boat.x += direction * FISHERMAN_MOVEMENT_SPEED * (delta / 10);
          fisherman.x += direction * FISHERMAN_MOVEMENT_SPEED * (delta / 10);
          
          if ((direction > 0 && boat.x > width - 100) || (direction < 0 && boat.x < 100)) {
            fishermanWithBoat.direction *= -1;
          }
        }
      }
    });
  }

  drawRope(hook: Phaser.Physics.Arcade.Sprite) {
    const fishermanIndex = hook.getData('fishermanIndex');
    if (fishermanIndex === undefined) return;
    
    const fishermanWithBoat = this.fishermen[fishermanIndex];
    if (!fishermanWithBoat.ropeGraphics) return;
    
    fishermanWithBoat.ropeGraphics.clear();
    
    fishermanWithBoat.ropeGraphics.lineStyle(2, 0x663300, 1);
    fishermanWithBoat.ropeGraphics.beginPath();
    fishermanWithBoat.ropeGraphics.moveTo(fishermanWithBoat.fisherman.x, fishermanWithBoat.fisherman.y + 10);
    
    const controlPointX = (fishermanWithBoat.fisherman.x + hook.x) / 2;
    const controlPointY = Math.min(fishermanWithBoat.fisherman.y, hook.y) - 20;
    
    fishermanWithBoat.ropeGraphics.lineTo(hook.x, hook.y - 20);
    fishermanWithBoat.ropeGraphics.stroke();
  }
}
