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
      this.load.image(key, path);
    });
    
    // Load background music
    //this.load.audio('background-music', '/src/assets/background-music.mp3');
  }

  create() {
    this.gameSpeed = GAME_SPEED;
    this.lastDifficultyIncrease = 0;
    
    // Play background music
    // this.backgroundMusic = this.sound.add('background-music', {
    //   volume: 0.5,
    //   loop: true
    // });
    // this.backgroundMusic.play();
    
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
    this.powerUps = this.physics.add.group();
    this.seagulls = this.physics.add.group();
    
    // Initialize managers
    this.obstacleManager = new ObstacleManager(this, this.obstacles, this.waterLevel, this.gameSpeed);
    this.hookManager = new HookManager(this, this.hooks, this.fishermen, this.waterLevel);
    this.powerUpManager = new PowerUpManager(this, this.powerUps, this.waterLevel, this.gameSpeed);
    this.seagullManager = new SeagullManager(this, this.fish, this.waterLevel);
    
    // Setup input
    // this.cursors = this.input.keyboard.createCursorKeys();
    
    // Setup physics boundaries
    this.physics.world.setBounds(0, this.waterLevel, this.cameras.main.width, this.cameras.main.height - this.waterLevel);
    
    // Initialize game state manager
    this.gameStateManager = new GameStateManager(this, this.celebrations);
    
    // Initialize player controller
    this.playerController = new PlayerController(this, this.fish, this.waterLevel);
    
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
    //this.backgroundMusic.stop();
    
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
