
import Phaser from 'phaser';

export class CollisionHandler {
  private scene: Phaser.Scene;
  private fish: Phaser.Physics.Arcade.Sprite;
  private hooks: Phaser.Physics.Arcade.Group;
  private obstacles: Phaser.Physics.Arcade.Group;
  private powerUps: Phaser.Physics.Arcade.Group;
  private seagulls: Phaser.Physics.Arcade.Group;
  private gameOverCallback: () => void;
  private powerUpCallback: (player: Phaser.Physics.Arcade.Sprite, powerUp: Phaser.Physics.Arcade.Sprite) => void;
  
  private isInvincible: boolean = false;
  private canEatObstacles: boolean = false;
  private coralsEaten: number = 0;
  private onCoralEaten: () => void;

  constructor(
    scene: Phaser.Scene, 
    fish: Phaser.Physics.Arcade.Sprite,
    hooks: Phaser.Physics.Arcade.Group,
    obstacles: Phaser.Physics.Arcade.Group,
    powerUps: Phaser.Physics.Arcade.Group,
    seagulls: Phaser.Physics.Arcade.Group,
    gameOverCallback: () => void,
    powerUpCallback: (player: Phaser.Physics.Arcade.Sprite, powerUp: Phaser.Physics.Arcade.Sprite) => void,
    onCoralEaten: () => void
  ) {
    this.scene = scene;
    this.fish = fish;
    this.hooks = hooks;
    this.obstacles = obstacles;
    this.powerUps = powerUps;
    this.seagulls = seagulls;
    this.gameOverCallback = gameOverCallback;
    this.powerUpCallback = powerUpCallback;
    this.onCoralEaten = onCoralEaten;
    
    this.setupCollisions();
  }

  private setupCollisions() {
    this.scene.physics.add.overlap(
      this.fish, 
      this.hooks, 
      this.handleHookCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, 
      undefined, 
      this
    );
    
    this.scene.physics.add.overlap(
      this.fish, 
      this.obstacles, 
      this.handleObstacleCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined, 
      this
    );
    
    this.scene.physics.add.overlap(
      this.fish, 
      this.powerUps, 
      this.handlePowerUpCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined, 
      this
    );
    
    this.scene.physics.add.overlap(
      this.fish, 
      this.seagulls, 
      this.handleSeagullCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined, 
      this
    );
  }

  handleHookCollision(object1: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile, 
                     object2: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile) {
    if (this.isInvincible) return;
    
    this.gameOverCallback();
  }
  
  handleObstacleCollision(object1: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile, 
                         object2: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile) {
    if (this.isInvincible) return;
    
    const obstacle = object2 as Phaser.Physics.Arcade.Sprite;
    
    if (this.canEatObstacles) {
      // Eat the obstacle!
      const chomp = this.scene.add.image(obstacle.x, obstacle.y, 'bubble');
      chomp.setScale(0.5);
      
      this.scene.tweens.add({
        targets: chomp,
        scale: { from: 0.5, to: 1 },
        alpha: { from: 1, to: 0 },
        duration: 500,
        onComplete: () => {
          chomp.destroy();
        }
      });
      
      // Track corals eaten (only count if it's a coral)
      if (obstacle.getData('type') === 'coral') {
        this.coralsEaten++;
        
        // Check if fish should grow
        if (this.coralsEaten >= 5) {
          this.coralsEaten = 0;
          this.onCoralEaten();
        }
      }
      
      // Remove the obstacle
      obstacle.destroy();
    } else {
      // Normal collision behavior
      this.gameOverCallback();
    }
  }
  
  handleSeagullCollision(object1: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile, 
                         object2: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile) {
    if (this.isInvincible) return;
    
    // Game over when hitting a seagull
    this.gameOverCallback();
  }

  handlePowerUpCollision(player: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile, 
                        powerUp: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile) {
    this.powerUpCallback(
      player as Phaser.Physics.Arcade.Sprite, 
      powerUp as Phaser.Physics.Arcade.Sprite
    );
  }

  setInvincible(isInvincible: boolean) {
    this.isInvincible = isInvincible;
  }

  setCanEatObstacles(canEat: boolean) {
    this.canEatObstacles = canEat;
  }
}
