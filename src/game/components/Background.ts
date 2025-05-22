
import Phaser from 'phaser';
import { BackgroundFish } from '../types';

export class Background {
  private scene: Phaser.Scene;
  private waterLevel: number;
  private skyHeight: number;
  private waveGraphics: Phaser.GameObjects.Graphics;
  private clouds: Phaser.GameObjects.Image[] = [];
  private seabed: Phaser.GameObjects.TileSprite;
  private backgroundFishes: BackgroundFish[] = [];
  private gameSpeed: number;

  constructor(scene: Phaser.Scene, waterLevel: number, gameSpeed: number) {
    this.scene = scene;
    this.waterLevel = waterLevel;
    this.skyHeight = waterLevel;
    this.gameSpeed = gameSpeed;
    this.createBackground();
    this.createBackgroundFishes();
  }

  private createBackground() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    const sky = this.scene.add.rectangle(0, 0, width, this.skyHeight, 0x87CEEB);
    sky.setOrigin(0, 0);

    for (let i = 0; i < 5; i++) {
      const cloud = this.scene.add.image(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(20, this.skyHeight - 50),
        'cloud'
      );
      cloud.setScale(Phaser.Math.FloatBetween(0.5, 1.2));
      cloud.setAlpha(0.9);
      
      this.clouds.push(cloud);
    }

    const water = this.scene.add.rectangle(0, this.waterLevel, width, height - this.waterLevel, 0x0078D7);
    water.setOrigin(0, 0);

    this.seabed = this.scene.add.tileSprite(
      0, 
      height, 
      width, 
      200, 
      'seabed'
    );
    this.seabed.setOrigin(0, 1);

    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(this.waterLevel, height);
      const bubble = this.scene.add.image(x, y, 'bubble');
      bubble.setAlpha(0.3);
      bubble.setScale(Phaser.Math.FloatBetween(0.3, 1));

      this.scene.tweens.add({
        targets: bubble,
        y: `-=${Phaser.Math.Between(100, 200)}`,
        x: `+=${Phaser.Math.Between(-50, 50)}`,
        alpha: 0,
        duration: Phaser.Math.Between(3000, 8000),
        ease: 'Linear',
        onComplete: () => {
          bubble.y = height + 20;
          bubble.x = Phaser.Math.Between(0, width);
          bubble.alpha = 0.3;
        },
        repeat: -1
      });
    }

    this.waveGraphics = this.scene.add.graphics();
    this.scene.time.addEvent({
      delay: 100,
      callback: this.drawWaves,
      callbackScope: this,
      loop: true
    });
  }

  private createBackgroundFishes() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    // Create 20 background fish with various types, positions, and speeds
    for (let i = 0; i < 20; i++) {
      const depthLevel = Phaser.Math.FloatBetween(0.2, 0.8); // Used for y-position and scaling
      const y = this.waterLevel + (height - this.waterLevel) * depthLevel;
      const x = Phaser.Math.Between(0, width);
      const direction = Phaser.Math.Between(0, 1) ? 1 : -1;
      const speed = Phaser.Math.FloatBetween(0.5, 1.5) * this.gameSpeed * 0.3;
      
      // Create sprite instead of image to support animation
      const fishSprite = this.scene.add.sprite(x, y, 'smallFishSpritesheet');
      
      // Play the swimming animation
      fishSprite.play('small_fish_swim');
      
      fishSprite.setScale(0.5 + (1 - depthLevel) * 0.5); // Smaller scale for deeper fish
      fishSprite.setAlpha(0.3 + depthLevel * 0.7); // More transparent for deeper fish
      fishSprite.setFlipX(direction < 0);
      fishSprite.setDepth(depthLevel * 10);
      
      this.backgroundFishes.push({
        sprite: fishSprite,
        speed: speed * direction,
        depthLevel: depthLevel
      });
    }
  }

  drawWaves() {
    this.waveGraphics.clear();
    const width = this.scene.cameras.main.width;
    
    this.waveGraphics.fillStyle(0x0067BE, 0.3);
    this.waveGraphics.fillRect(0, this.waterLevel - 10, width, 20);
    
    this.waveGraphics.fillStyle(0x0056A0, 0.2);
    
    this.waveGraphics.beginPath();
    const time = this.scene.time.now / 1000;
    let x = 0;
    const waveHeight = 8;
    const frequency = 20;
    
    this.waveGraphics.moveTo(0, this.waterLevel + 5);
    while (x < width) {
      const y = this.waterLevel + Math.sin((x + time) / frequency) * waveHeight;
      this.waveGraphics.lineTo(x, y);
      x += 10;
    }
    this.waveGraphics.lineTo(width, this.waterLevel + 15);
    this.waveGraphics.lineTo(0, this.waterLevel + 15);
    this.waveGraphics.closePath();
    this.waveGraphics.fill();
  }

  update(delta: number) {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    // Update clouds
    this.clouds.forEach(cloud => {
      cloud.x -= (this.gameSpeed * 0.2) * (delta / 1000);
      if (cloud.x < -cloud.width) {
        cloud.x = width + cloud.width;
        cloud.y = Phaser.Math.Between(20, this.skyHeight - 50);
      }
    });

    // Update seabed
    this.seabed.tilePositionX += this.gameSpeed * 0.1 * (delta / 1000);

    // Update background fish
    this.backgroundFishes.forEach(fish => {
      fish.sprite.x += fish.speed * (delta / 1000);
      
      // If fish moves out of the screen, wrap it around to the other side
      if (fish.speed > 0 && fish.sprite.x > width + fish.sprite.width) {
        fish.sprite.x = -fish.sprite.width;
        fish.sprite.y = this.waterLevel + (height - this.waterLevel) * fish.depthLevel;
      } else if (fish.speed < 0 && fish.sprite.x < -fish.sprite.width) {
        fish.sprite.x = width + fish.sprite.width;
        fish.sprite.y = this.waterLevel + (height - this.waterLevel) * fish.depthLevel;
      }
    });
  }

  setGameSpeed(speed: number) {
    this.gameSpeed = speed;
  }
}
