
import Phaser from 'phaser';
import { GAME_SPEED, HOOK_SPAWN_MIN, HOOK_SPAWN_MAX, DIFFICULTY_INCREASE_INTERVAL, DIFFICULTY_INCREASE_AMOUNT } from '../config';

export class MainScene extends Phaser.Scene {
  private fish!: Phaser.Physics.Arcade.Sprite;
  private hooks!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private nextHookTime: number = 0;
  private gameSpeed: number = GAME_SPEED;
  private lastDifficultyIncrease: number = 0;
  private gameActive: boolean = true;
  private waterLevel: number = 0;
  private skyHeight: number = 0;
  private boatGroup!: Phaser.GameObjects.Group;
  private seabed!: Phaser.GameObjects.TileSprite;
  private waveGraphics!: Phaser.GameObjects.Graphics;
  private clouds: Phaser.GameObjects.Image[] = [];

  constructor() {
    super('MainScene');
  }

  preload() {
    this.load.svg('fish', '/src/assets/fish.svg');
    this.load.svg('hook', '/src/assets/hook.svg');
    this.load.svg('bubble', '/src/assets/bubble.svg');
    this.load.svg('boat', '/src/assets/boat.svg');
    this.load.svg('fisherman', '/src/assets/fisherman.svg');
    this.load.svg('seabed', '/src/assets/seabed.svg');
    this.load.svg('cloud', '/src/assets/cloud.svg');
  }

  create() {
    this.gameActive = true;
    this.score = 0;
    this.gameSpeed = GAME_SPEED;
    this.lastDifficultyIncrease = 0;
    
    // Set water level to half screen
    this.waterLevel = this.cameras.main.height / 2;
    this.skyHeight = this.waterLevel;

    // Create background
    this.createBackground();

    // Create fish
    this.fish = this.physics.add.sprite(100, this.waterLevel + 100, 'fish');
    this.fish.setCollideWorldBounds(true);
    this.fish.setScale(0.7);
    this.fish.setSize(60, 30);
    this.fish.setOffset(30, 15);

    // Create hooks group
    this.hooks = this.physics.add.group();

    // Create the boat and fisherman
    this.createBoatAndFisherman();

    // Setup collisions
    this.physics.add.overlap(this.fish, this.hooks, this.handleCollision, undefined, this);

    // Setup input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);

    // Setup the world bounds - restrict fish to water area
    this.physics.world.setBounds(0, this.waterLevel, this.cameras.main.width, this.cameras.main.height - this.waterLevel);

    // Start the game
    this.time.addEvent({
      delay: 100,
      callback: this.updateScore,
      callbackScope: this,
      loop: true
    });

    // Dispatch initial score
    window.dispatchEvent(new CustomEvent('score-update', { detail: this.score }));
  }

  createBackground() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Create sky
    const sky = this.add.rectangle(0, 0, width, this.skyHeight, 0x87CEEB);
    sky.setOrigin(0, 0);

    // Add clouds
    for (let i = 0; i < 5; i++) {
      const cloud = this.add.image(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(20, this.skyHeight - 50),
        'cloud'
      );
      cloud.setScale(Phaser.Math.FloatBetween(0.5, 1.2));
      cloud.setAlpha(0.9);
      
      this.clouds.push(cloud);
    }

    // Create water
    const water = this.add.rectangle(0, this.waterLevel, width, height - this.waterLevel, 0x0078D7);
    water.setOrigin(0, 0);

    // Create seabed
    this.seabed = this.add.tileSprite(
      0, 
      height, 
      width, 
      200, 
      'seabed'
    );
    this.seabed.setOrigin(0, 1);

    // Create animated water particles
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(this.waterLevel, height);
      const bubble = this.add.image(x, y, 'bubble');
      bubble.setAlpha(0.3);
      bubble.setScale(Phaser.Math.FloatBetween(0.3, 1));

      this.tweens.add({
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

    // Create wave graphics
    this.waveGraphics = this.add.graphics();
    this.time.addEvent({
      delay: 100,
      callback: this.drawWaves,
      callbackScope: this,
      loop: true
    });
  }

  createBoatAndFisherman() {
    this.boatGroup = this.add.group();
    
    // Create multiple boats
    for (let i = 0; i < 3; i++) {
      const x = 200 + i * 300;
      const boat = this.add.image(x, this.waterLevel - 20, 'boat');
      const fisherman = this.add.image(x - 20, this.waterLevel - 60, 'fisherman');
      fisherman.setScale(0.8);
      
      // Group them together
      this.boatGroup.add(boat);
      this.boatGroup.add(fisherman);
      
      // Add slight bobbing animation to boats
      this.tweens.add({
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

  drawWaves() {
    if (!this.gameActive) return;
    
    this.waveGraphics.clear();
    const width = this.cameras.main.width;
    
    this.waveGraphics.fillStyle(0x0067BE, 0.3);
    this.waveGraphics.fillRect(0, this.waterLevel - 10, width, 20);
    
    this.waveGraphics.fillStyle(0x0056A0, 0.2);
    
    // Draw animated wave at water level
    this.waveGraphics.beginPath();
    const time = this.time.now / 1000;
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

  update(time: number, delta: number) {
    if (!this.gameActive) return;

    // Player movement
    if (this.cursors.left.isDown) {
      this.fish.setVelocityX(-200);
    } else if (this.cursors.right.isDown) {
      this.fish.setVelocityX(200);
    } else {
      this.fish.setVelocityX(0);
    }

    if (this.cursors.up.isDown) {
      this.fish.setVelocityY(-200);
    } else if (this.cursors.down.isDown) {
      this.fish.setVelocityY(200);
    } else {
      this.fish.setVelocityY(0);
    }

    // Spawn hooks
    if (time > this.nextHookTime) {
      this.spawnHook();
      this.nextHookTime = time + Phaser.Math.Between(HOOK_SPAWN_MIN, HOOK_SPAWN_MAX);
    }

    // Update hook positions
    this.hooks.getChildren().forEach((hook: Phaser.GameObjects.GameObject) => {
      const h = hook as Phaser.Physics.Arcade.Sprite;
      h.x -= this.gameSpeed * (delta / 1000);
      
      // Remove hooks that have gone off screen
      if (h.x < -h.width) {
        h.destroy();
      }
    });

    // Move clouds
    this.clouds.forEach(cloud => {
      cloud.x -= (this.gameSpeed * 0.2) * (delta / 1000);
      if (cloud.x < -cloud.width) {
        cloud.x = this.cameras.main.width + cloud.width;
        cloud.y = Phaser.Math.Between(20, this.skyHeight - 50);
      }
    });

    // Move seabed
    this.seabed.tilePositionX += this.gameSpeed * 0.1 * (delta / 1000);

    // Increase difficulty over time
    if (time > this.lastDifficultyIncrease + DIFFICULTY_INCREASE_INTERVAL) {
      this.gameSpeed += DIFFICULTY_INCREASE_AMOUNT;
      this.lastDifficultyIncrease = time;
    }
  }

  spawnHook() {
    // Get a random boat to drop the hook from
    const boats = this.boatGroup.getChildren().filter(child => child.texture.key === 'boat');
    
    if (boats.length === 0) return;
    
    const randomIndex = Phaser.Math.Between(0, boats.length - 1);
    const boat = boats[randomIndex] as Phaser.GameObjects.Image;
    
    const x = boat.x;
    const y = this.waterLevel;
    
    const hook = this.hooks.create(x, y, 'hook') as Phaser.Physics.Arcade.Sprite;
    hook.setScale(0.8);
    hook.setSize(20, 40);
    hook.setOffset(10, 40);
    
    // Drop the hook downward with a slight swing
    this.tweens.add({
      targets: hook,
      y: this.waterLevel + Phaser.Math.Between(100, 300),
      duration: 1000,
      ease: 'Bounce.easeOut'
    });
  }

  handleCollision() {
    if (!this.gameActive) return;
    
    this.gameActive = false;
    
    // Create explosion effect
    const particles = this.add.particles(0, 0, 'bubble', {
      speed: 100,
      scale: { start: 0.2, end: 0 },
      blendMode: 'ADD',
      lifespan: 1000
    });
    
    particles.createEmitter({
      x: this.fish.x,
      y: this.fish.y,
      quantity: 20
    });
    
    // Hide the fish
    this.fish.setVisible(false);
    
    // Stop all moving objects
    this.hooks.getChildren().forEach((hook: Phaser.GameObjects.GameObject) => {
      const h = hook as Phaser.Physics.Arcade.Sprite;
      h.setVelocity(0);
    });
    
    // Trigger game over after a short delay
    this.time.delayedCall(1000, () => {
      window.dispatchEvent(new CustomEvent('game-over', { detail: this.score }));
      this.scene.start('GameOverScene', { score: this.score });
    });
  }

  updateScore() {
    if (!this.gameActive) return;
    
    this.score += 1;
    window.dispatchEvent(new CustomEvent('score-update', { detail: this.score }));
  }

  handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (pointer.isDown && this.gameActive) {
      this.handlePointerMove(pointer);
    }
  }

  handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (pointer.isDown && this.gameActive) {
      // Only respond to touches below the water level
      if (pointer.y < this.waterLevel) return;
      
      const targetX = pointer.x;
      const targetY = pointer.y;
      
      const dx = targetX - this.fish.x;
      const dy = targetY - this.fish.y;
      
      // Calculate angle and set fish velocity accordingly
      const angle = Math.atan2(dy, dx);
      const speed = 200;
      
      this.fish.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );
      
      // Flip the fish based on movement direction
      if (dx < 0) {
        this.fish.setFlipX(true);
      } else {
        this.fish.setFlipX(false);
      }
    }
  }
}
