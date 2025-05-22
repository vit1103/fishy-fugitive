import Phaser from "phaser";

export class ObstacleManager {
  private scene: Phaser.Scene;
  private obstacles: Phaser.Physics.Arcade.Group;
  private obstacleTextures: string[] = [
    "coral",
    "stone",
    "plant1",
    "plant2",
    "plant3",
    "plant4",
    "plant5",
  ];
  private waterLevel: number;
  private nextObstacleTime: number = 0;
  private gameSpeed: number;

  constructor(
    scene: Phaser.Scene,
    obstacles: Phaser.Physics.Arcade.Group,
    waterLevel: number,
    gameSpeed: number
  ) {
    this.scene = scene;
    this.obstacles = obstacles;
    this.waterLevel = waterLevel;
    this.gameSpeed = gameSpeed;
    this.nextObstacleTime =
      this.scene.time.now + Phaser.Math.Between(2000, 4000);
  }

  update(time: number, delta: number) {
    if (time > this.nextObstacleTime) {
      this.spawnObstacle();
      this.nextObstacleTime = time + Phaser.Math.Between(2000, 4000);
    }

    this.obstacles
      .getChildren()
      .forEach((obstacle: Phaser.GameObjects.GameObject) => {
        const obs = obstacle as Phaser.Physics.Arcade.Sprite;
        obs.x -= this.gameSpeed * (delta / 1000);

        if (obs.x < -obs.width) {
          obs.destroy();
        }
      });
  }

  spawnObstacle() {
    const height = this.scene.cameras.main.height;
    const waterDepth = height - this.waterLevel;
    const maxObstacleHeight = waterDepth * 0.25;

    const obstacleType = Phaser.Utils.Array.GetRandom(this.obstacleTextures);

    const x = this.scene.cameras.main.width + 50;
    const y = height - Phaser.Math.Between(20, maxObstacleHeight);

    const obstacle = this.obstacles.create(
      x,
      y,
      obstacleType
    ) as Phaser.Physics.Arcade.Sprite;

    let scale = 0.8;
    if (obstacleType === "coral") {
      scale = Phaser.Math.FloatBetween(0.6, 0.9);
      obstacle.setSize(50, maxObstacleHeight * scale);
      obstacle.setOffset(25, 10);
    } else if (obstacleType === "stone") {
      scale = Phaser.Math.FloatBetween(0.5, 0.8);
      obstacle.setSize(60, maxObstacleHeight * scale);
      obstacle.setOffset(20, 10);
    } else if (
      obstacleType === "plant1" ||
      obstacleType === "plant2" ||
      obstacleType === "plant3" ||
      obstacleType === "plant4" ||
      obstacleType === "plant5"
    ) {
      scale = Phaser.Math.FloatBetween(0.2, 0.5);
      
      // For SVG plants, use a simpler collision body
      const collisionWidth = 20;  // Narrow collision body
      const collisionHeight = 60; // Taller collision body
      
      obstacle.setSize(collisionWidth, collisionHeight);
      obstacle.setOffset((100 - collisionWidth) / 2, 200 - collisionHeight); // Based on SVG viewBox
    }

    obstacle.setScale(scale);
    obstacle.setOrigin(0.5, 1);
    obstacle.setData("type", obstacleType);
    obstacle.setDebug(true, true, 0xff0000);
  }

  setGameSpeed(speed: number) {
    this.gameSpeed = speed;
  }
}
