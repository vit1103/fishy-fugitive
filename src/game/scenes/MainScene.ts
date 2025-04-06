import Phaser from 'phaser';
import { 
  GAME_SPEED, 
  DIFFICULTY_INCREASE_INTERVAL, 
  DIFFICULTY_INCREASE_AMOUNT,
  formatTime
} from '../config';
import { Background } from '../components/Background';
import { Fishermen } from '../components/Fishermen';
import { ObstacleManager } from '../components/ObstacleManager';
import { HookManager } from '../components/HookManager';
import { Celebrations } from '../components/Celebrations';
import assetPaths from '../assets';

export class MainScene extends Phaser.Scene {
  private fish!: Phaser.Physics.Arcade.Sprite;
  private hooks!: Phaser.Physics.Arcade.Group;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private gameSpeed: number = GAME_SPEED;
  private lastDifficultyIncrease: number = 0;
  private gameActive: boolean = true;
  private waterLevel: number = 0;
  private timerText!: Phaser.GameObjects.Text;
  private startTime: number = 0;
  private elapsedTime: number = 0;
  
  // Component managers
  private background!: Background;
  private fishermen!: Fishermen;
  private obstacleManager!: ObstacleManager;
  private hookManager!: HookManager;
  private celebrations!: Celebrations;

  constructor() {
    super('MainScene');
  }

  preload() {
    // Load all assets using the paths from the assets file
    Object.entries(assetPaths).forEach(([key, path]) => {
      this.load.image(key, path);
    });
  }

  create() {
    this.gameActive = true;
    this.score = 0;
    this.gameSpeed = GAME_SPEED;
    this.lastDifficultyIncrease = 0;
    this.startTime = Date.now();
    
    this.waterLevel = this.cameras.main.height / 2;
    
    // Initialize game components
    this.background = new Background(this, this.waterLevel, this.gameSpeed);
    this.fishermen = new Fishermen(this, this.waterLevel);
    this.celebrations = new Celebrations(this);

    // Create the player fish
    this.fish = this.physics.add.sprite(100, this.waterLevel + 100, 'fish');
    this.fish.setCollideWorldBounds(true);
    this.fish.setScale(0.7);
    this.fish.setSize(60, 30);
    this.fish.setOffset(30, 15);

    // Create game object groups
    this.hooks = this.physics.add.group();
    this.obstacles = this.physics.add.group();
    
    // Initialize obstacles and hooks managers
    this.obstacleManager = new ObstacleManager(this, this.obstacles, this.waterLevel, this.gameSpeed);
    this.hookManager = new HookManager(this, this.hooks, this.fishermen, this.waterLevel);

    // Setup collision detection
    this.physics.add.overlap(
      this.fish, 
      this.hooks, 
      this.handleCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, 
      undefined, 
      this
    );
    
    this.physics.add.overlap(
      this.fish, 
      this.obstacles, 
      this.handleCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined, 
      this
    );

    // Setup input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);

    // Set physics boundaries
    this.physics.world.setBounds(0, this.waterLevel, this.cameras.main.width, this.cameras.main.height - this.waterLevel);

    // Create UI
    this.timerText = this.add.text(this.cameras.main.width - 150, 20, '0:00', {
      fontSize: '24px',
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.timerText.setScrollFactor(0);
    this.timerText.setDepth(100);

    // Setup timers
    this.time.addEvent({
      delay: 100,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true
    });

    this.time.addEvent({
      delay: 100,
      callback: this.updateScore,
      callbackScope: this,
      loop: true
    });

    window.dispatchEvent(new CustomEvent('score-update', { detail: this.score }));
  }

  updateTimer() {
    if (!this.gameActive) return;
    
    this.elapsedTime = Date.now() - this.startTime;
    this.timerText.setText(formatTime(this.elapsedTime));
  }

  update(time: number, delta: number) {
    if (!this.gameActive) return;

    // Handle player fish movement
    if (this.cursors.left.isDown) {
      this.fish.setVelocityX(-200);
      this.fish.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.fish.setVelocityX(200);
      this.fish.setFlipX(false);
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

    // Update all game components
    this.background.update(delta);
    this.fishermen.update(delta, this.fish.x);
    this.obstacleManager.update(time, delta);
    this.hookManager.update(time, delta);

    // Increase difficulty over time
    if (time > this.lastDifficultyIncrease + DIFFICULTY_INCREASE_INTERVAL) {
      this.gameSpeed += DIFFICULTY_INCREASE_AMOUNT;
      this.background.setGameSpeed(this.gameSpeed);
      this.obstacleManager.setGameSpeed(this.gameSpeed);
      this.lastDifficultyIncrease = time;
    }
  }

  handleCollision(object1: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile, 
                 object2: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile) {
    if (!this.gameActive) return;
    
    this.gameActive = false;
    
    const bubbles = this.add.group({
      key: 'bubble',
      repeat: 20,
      setXY: { x: this.fish.x, y: this.fish.y, stepX: 0 }
    });
    
    bubbles.getChildren().forEach((bubble: Phaser.GameObjects.GameObject) => {
      const b = bubble as Phaser.GameObjects.Image;
      const dx = Phaser.Math.Between(-100, 100);
      const dy = Phaser.Math.Between(-100, 100);
      const scale = Phaser.Math.FloatBetween(0.2, 0.6);
      
      b.setScale(scale);
      this.tweens.add({
        targets: b,
        x: b.x + dx,
        y: b.y + dy,
        alpha: 0,
        scale: 0,
        duration: 1000,
        ease: 'Power2'
      });
    });
    
    this.fish.setVisible(false);
    
    this.hooks.getChildren().forEach((hook: Phaser.GameObjects.GameObject) => {
      const h = hook as Phaser.Physics.Arcade.Sprite;
      h.setVelocity(0, 0);
      h.setData('pulling', false);
    });
    
    this.time.delayedCall(1000, () => {
      window.dispatchEvent(new CustomEvent('game-over', { 
        detail: { 
          score: this.score, 
          time: this.elapsedTime 
        } 
      }));
      this.scene.start('GameOverScene', { 
        score: this.score, 
        time: this.elapsedTime 
      });
    });
  }

  updateScore() {
    if (!this.gameActive) return;
    
    this.score += 1;
    window.dispatchEvent(new CustomEvent('score-update', { detail: this.score }));
    
    // Check for milestones
    this.celebrations.checkMilestone(this.score);
  }

  handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (pointer.isDown && this.gameActive) {
      this.handlePointerMove(pointer);
    }
  }

  handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (pointer.isDown && this.gameActive) {
      if (pointer.y < this.waterLevel) return;
      
      const targetX = pointer.x;
      const targetY = pointer.y;
      
      const dx = targetX - this.fish.x;
      const dy = targetY - this.fish.y;
      
      const angle = Math.atan2(dy, dx);
      const speed = 200;
      
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
}
