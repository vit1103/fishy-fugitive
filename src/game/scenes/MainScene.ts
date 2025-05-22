
import Phaser from 'phaser';
import { 
  GAME_SPEED, 
  DIFFICULTY_INCREASE_INTERVAL, 
  DIFFICULTY_INCREASE_AMOUNT
} from '../config';
import { Background } from '../components/Background';
import { Fishermen } from '../components/Fishermen';
import { ObstacleManager } from '../components/ObstacleManager';
import { HookManager } from '../components/HookManager';
import { Celebrations } from '../components/Celebrations';
import { PowerUpManager } from '../components/PowerUpManager';
import { SeagullManager } from '../components/SeagullManager';
import { PlayerController } from '../components/PlayerController';
import { CollisionHandler } from '../components/CollisionHandler';
import { GameStateManager } from '../components/GameStateManager';
import assetPaths from '../assets';

export class MainScene extends Phaser.Scene {
  private fish!: Phaser.Physics.Arcade.Sprite;
  private hooks!: Phaser.Physics.Arcade.Group;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private powerUps!: Phaser.Physics.Arcade.Group;
  private seagulls!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private gameSpeed: number = GAME_SPEED;
  private lastDifficultyIncrease: number = 0;
  private waterLevel: number = 0;
  private backgroundMusic!: Phaser.Sound.BaseSound;
  
  // Component managers
  private background!: Background;
  private fishermen!: Fishermen;
  private obstacleManager!: ObstacleManager;
  private hookManager!: HookManager;
  private celebrations!: Celebrations;
  private powerUpManager!: PowerUpManager;
  private seagullManager!: SeagullManager;
  private playerController!: PlayerController;
  private collisionHandler!: CollisionHandler;
  private gameStateManager!: GameStateManager;

  constructor() {
    super('MainScene');
  }

  preload() {
    // Load all assets using the paths from the assets file
    Object.entries(assetPaths).forEach(([key, path]) => {
      if (key === 'fishSpritesheet') {
        this.load.spritesheet(key, path as string, { 
          frameWidth: 100, 
          frameHeight: 60 
        });
      } else if (key === 'seagullSpritesheet') {
        this.load.spritesheet(key, path as string, { 
          frameWidth: 80, 
          frameHeight: 60 
        });
      } else if (key === 'powerupSpritesheet') {
        this.load.spritesheet(key, path as string, { 
          frameWidth: 40, 
          frameHeight: 40 
        });
      } else if (key === 'smallFishSpritesheet') {
        this.load.spritesheet(key, path as string, { 
          frameWidth: 40, 
          frameHeight: 20 
        });
      } else if (key === 'backgroundMusic') {
        this.load.audio(key, path as string);
      } else {
        this.load.image(key, path as string);
      }
    });
  }

  create() {
    this.gameSpeed = GAME_SPEED;
    this.lastDifficultyIncrease = 0;
    
    // Play background music
    this.backgroundMusic = this.sound.add('backgroundMusic', {
      volume: 0.5,
      loop: true
    });
    this.backgroundMusic.play();
    
    this.waterLevel = this.cameras.main.height / 2;
    
    // Create animations
    this.createAnimations();
    
    // Initialize game components
    this.background = new Background(this, this.waterLevel, this.gameSpeed);
    this.fishermen = new Fishermen(this, this.waterLevel);
    this.celebrations = new Celebrations(this);

    // Create the player fish
    this.fish = this.physics.add.sprite(100, this.waterLevel + 100, 'fishSpritesheet');
    this.fish.setCollideWorldBounds(true);
    this.fish.setScale(0.7);
    this.fish.setSize(60, 30);
    this.fish.setOffset(30, 15);
    this.fish.play('fish_swim');

    // Create game object groups
    this.hooks = this.physics.add.group();
    this.obstacles = this.physics.add.group();
    this.powerUps = this.physics.add.group();
    this.seagulls = this.physics.add.group();
    
    // Initialize managers
    this.obstacleManager = new ObstacleManager(this, this.obstacles, this.waterLevel, this.gameSpeed);
    this.hookManager = new HookManager(this, this.hooks, this.fishermen, this.waterLevel);
    this.powerUpManager = new PowerUpManager(this, this.powerUps, this.waterLevel, this.gameSpeed);
    this.seagullManager = new SeagullManager(this, this.fish, this.waterLevel);
    
    // Setup input
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Setup physics boundaries
    this.physics.world.setBounds(0, this.waterLevel, this.cameras.main.width, this.cameras.main.height - this.waterLevel);
    
    // Initialize game state manager
    this.gameStateManager = new GameStateManager(this, this.celebrations);
    
    // Initialize player controller
    this.playerController = new PlayerController(this, this.fish, this.cursors, this.waterLevel);
    
    // Initialize collision handler
    this.collisionHandler = new CollisionHandler(
      this,
      this.fish,
      this.hooks,
      this.obstacles,
      this.powerUps,
      this.seagulls,
      this.gameOver.bind(this),
      this.handlePowerUpCollision.bind(this),
      this.playerController.growFish.bind(this.playerController)
    );
  }

  createAnimations() {
    // Fish swimming animation
    this.anims.create({
      key: 'fish_swim',
      frames: this.anims.generateFrameNumbers('fishSpritesheet', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
    
    // Seagull flying animation
    this.anims.create({
      key: 'seagull_fly',
      frames: this.anims.generateFrameNumbers('seagullSpritesheet', { start: 0, end: 1 }),
      frameRate: 8,
      repeat: -1
    });
    
    // Seagull diving animation
    this.anims.create({
      key: 'seagull_dive',
      frames: this.anims.generateFrameNumbers('seagullSpritesheet', { start: 2, end: 3 }),
      frameRate: 8,
      repeat: -1
    });
    
    // Small fish animations
    this.anims.create({
      key: 'small_fish_swim',
      frames: this.anims.generateFrameNumbers('smallFishSpritesheet', { start: 0, end: 2 }),
      frameRate: 6,
      repeat: -1
    });
    
    // Power-up animations
    this.anims.create({
      key: 'powerup_speed',
      frames: this.anims.generateFrameNumbers('powerupSpritesheet', { start: 0, end: 1 }),
      frameRate: 5,
      repeat: -1
    });
    
    this.anims.create({
      key: 'powerup_invincibility',
      frames: this.anims.generateFrameNumbers('powerupSpritesheet', { start: 2, end: 3 }),
      frameRate: 5,
      repeat: -1
    });
    
    this.anims.create({
      key: 'powerup_eat',
      frames: this.anims.generateFrameNumbers('powerupSpritesheet', { start: 4, end: 5 }),
      frameRate: 5,
      repeat: -1
    });
  }

  update(time: number, delta: number) {
    if (!this.gameStateManager.isGameActive()) return;

    // Update power-ups first to get current effects
    const powerUpEffects = this.powerUpManager.update(time, delta, this.fish.body.velocity.length());
    this.playerController.setSpeedMultiplier(powerUpEffects.speedMultiplier);
    this.collisionHandler.setInvincible(powerUpEffects.isInvincible);
    this.collisionHandler.setCanEatObstacles(powerUpEffects.canEatObstacles);

    // Update player movement
    this.playerController.update();

    // Update all game components
    this.background.update(delta);
    this.fishermen.update(delta, this.fish.x);
    this.obstacleManager.update(time, delta);
    this.hookManager.update(time, delta);
    this.seagullManager.update(time, delta);

    // Increase difficulty over time
    if (time > this.lastDifficultyIncrease + DIFFICULTY_INCREASE_INTERVAL) {
      this.gameSpeed += DIFFICULTY_INCREASE_AMOUNT;
      this.background.setGameSpeed(this.gameSpeed);
      this.obstacleManager.setGameSpeed(this.gameSpeed);
      this.powerUpManager.setGameSpeed(this.gameSpeed);
      this.lastDifficultyIncrease = time;
    }
  }

  handlePowerUpCollision(player: Phaser.Physics.Arcade.Sprite, powerUp: Phaser.Physics.Arcade.Sprite) {
    if (!this.gameStateManager.isGameActive()) return;
    
    this.powerUpManager.handlePowerUpCollision(player, powerUp);
  }
  
  gameOver() {
    this.gameStateManager.setGameActive(false);
    
    // Stop the background music
    this.backgroundMusic.stop();
    
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
          score: this.gameStateManager.getScore(), 
          time: this.gameStateManager.getElapsedTime() 
        } 
      }));
      this.scene.start('GameOverScene', { 
        score: this.gameStateManager.getScore(), 
        time: this.gameStateManager.getElapsedTime() 
      });
    });
  }
}
