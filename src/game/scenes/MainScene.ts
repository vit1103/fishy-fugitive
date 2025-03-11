import Phaser from 'phaser';
import { 
  GAME_SPEED, 
  HOOK_SPAWN_MIN, 
  HOOK_SPAWN_MAX, 
  DIFFICULTY_INCREASE_INTERVAL, 
  DIFFICULTY_INCREASE_AMOUNT,
  FISHERMAN_MOVEMENT_SPEED,
  HOOK_PULL_SPEED_MIN,
  HOOK_PULL_SPEED_MAX,
  formatTime
} from '../config';

interface FishermanWithBoat {
  boat: Phaser.GameObjects.Image;
  fisherman: Phaser.GameObjects.Image;
  direction: number;
  targetX?: number;
  ropeGraphics?: Phaser.GameObjects.Graphics;
}

interface Obstacle {
  sprite: Phaser.Physics.Arcade.Sprite;
  type: 'coral' | 'stone' | 'plant';
}

export class MainScene extends Phaser.Scene {
  private fish!: Phaser.Physics.Arcade.Sprite;
  private hooks!: Phaser.Physics.Arcade.Group;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private nextHookTime: number = 0;
  private gameSpeed: number = GAME_SPEED;
  private lastDifficultyIncrease: number = 0;
  private gameActive: boolean = true;
  private waterLevel: number = 0;
  private skyHeight: number = 0;
  private fishermen: FishermanWithBoat[] = [];
  private seabed!: Phaser.GameObjects.TileSprite;
  private waveGraphics!: Phaser.GameObjects.Graphics;
  private clouds: Phaser.GameObjects.Image[] = [];
  private startTime: number = 0;
  private elapsedTime: number = 0;
  private timerText!: Phaser.GameObjects.Text;
  private obstacleTextures: string[] = ['coral', 'stone', 'plant'];
  private nextObstacleTime: number = 0;

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
    this.load.svg('coral', '/src/assets/coral.svg');
    this.load.svg('stone', '/src/assets/stone.svg');
    this.load.svg('plant', '/src/assets/plant.svg');
  }

  create() {
    this.gameActive = true;
    this.score = 0;
    this.gameSpeed = GAME_SPEED;
    this.lastDifficultyIncrease = 0;
    this.startTime = Date.now();
    
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
    
    // Create obstacles group
    this.obstacles = this.physics.add.group();

    // Create the boat and fisherman
    this.createBoatAndFisherman();

    // Setup collisions
    this.physics.add.overlap(
      this.fish, 
      this.hooks, 
      this.handleCollision, 
      undefined, 
      this
    );
    
    this.physics.add.overlap(
      this.fish, 
      this.obstacles, 
      this.handleCollision, 
      undefined, 
      this
    );

    // Setup input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);

    // Setup the world bounds - restrict fish to water area
    this.physics.world.setBounds(0, this.waterLevel, this.cameras.main.width, this.cameras.main.height - this.waterLevel);

    // Create timer text
    this.timerText = this.add.text(this.cameras.main.width - 150, 20, '0:00', {
      fontSize: '24px',
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.timerText.setScrollFactor(0);
    this.timerText.setDepth(100);

    // Update timer
    this.time.addEvent({
      delay: 100,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true
    });

    // Start the game
    this.time.addEvent({
      delay: 100,
      callback: this.updateScore,
      callbackScope: this,
      loop: true
    });

    // Set the initial time for the first obstacle
    this.nextObstacleTime = this.time.now + Phaser.Math.Between(1000, 3000);

    // Dispatch initial score
    window.dispatchEvent(new CustomEvent('score-update', { detail: this.score }));
  }

  updateTimer() {
    if (!this.gameActive) return;
    
    this.elapsedTime = Date.now() - this.startTime;
    this.timerText.setText(formatTime(this.elapsedTime));
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

  createBoatAndFisherman() {
    this.fishermen = [];
    
    // Create multiple boats with fishermen
    for (let i = 0; i < 3; i++) {
      const x = 200 + i * 300;
      const boat = this.add.image(x, this.waterLevel - 20, 'boat');
      const fisherman = this.add.image(x - 20, this.waterLevel - 60, 'fisherman');
      fisherman.setScale(0.8);
      
      // Create rope graphics for this fisherman
      const ropeGraphics = this.add.graphics();
      
      // Store fisherman and boat together with movement properties
      this.fishermen.push({
        boat,
        fisherman,
        direction: Phaser.Math.Between(0, 1) ? 1 : -1,
        ropeGraphics
      });
      
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

  update(time: number, delta: number) {
    if (!this.gameActive) return;

    // Player movement
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

    // Move fishermen
    this.updateFishermen(delta);

    // Spawn hooks
    if (time > this.nextHookTime) {
      this.spawnHook();
      this.nextHookTime = time + Phaser.Math.Between(HOOK_SPAWN_MIN, HOOK_SPAWN_MAX);
    }
    
    // Spawn obstacles
    if (time > this.nextObstacleTime) {
      this.spawnObstacle();
      this.nextObstacleTime = time + Phaser.Math.Between(2000, 4000);
    }

    // Update hook positions and draw ropes
    this.hooks.getChildren().forEach((hook: Phaser.GameObjects.GameObject) => {
      const h = hook as Phaser.Physics.Arcade.Sprite;
      
      // If the hook has a data value for "pulling", process it
      if (h.getData('pulling') === true) {
        h.y -= h.getData('pullSpeed') * (delta / 1000);
        
        // If the hook reaches the water level, destroy it
        if (h.y <= this.waterLevel) {
          h.destroy();
        }
      } else {
        // Move hook with the boat
        const fishermanIndex = h.getData('fishermanIndex');
        if (fishermanIndex !== undefined) {
          const fishermanWithBoat = this.fishermen[fishermanIndex];
          h.x = fishermanWithBoat.boat.x;
        }
      }
      
      // Draw rope from fisherman to hook
      this.drawRope(h);
    });
    
    // Move obstacles
    this.obstacles.getChildren().forEach((obstacle: Phaser.GameObjects.GameObject) => {
      const obs = obstacle as Phaser.Physics.Arcade.Sprite;
      obs.x -= this.gameSpeed * (delta / 1000);
      
      // If obstacle goes off screen, destroy it
      if (obs.x < -obs.width) {
        obs.destroy();
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

  drawRope(hook: Phaser.Physics.Arcade.Sprite) {
    const fishermanIndex = hook.getData('fishermanIndex');
    if (fishermanIndex === undefined) return;
    
    const fishermanWithBoat = this.fishermen[fishermanIndex];
    if (!fishermanWithBoat.ropeGraphics) return;
    
    // Clear previous rope
    fishermanWithBoat.ropeGraphics.clear();
    
    // Draw rope from fisherman to hook
    fishermanWithBoat.ropeGraphics.lineStyle(2, 0x663300, 1);
    fishermanWithBoat.ropeGraphics.beginPath();
    fishermanWithBoat.ropeGraphics.moveTo(fishermanWithBoat.fisherman.x, fishermanWithBoat.fisherman.y + 10);
    
    // Add a slight curve to the rope for realism
    const controlPointX = (fishermanWithBoat.fisherman.x + hook.x) / 2;
    const controlPointY = Math.min(fishermanWithBoat.fisherman.y, hook.y) - 20;
    
    // Draw a simple line instead
    fishermanWithBoat.ropeGraphics.lineTo(hook.x, hook.y - 20);
    fishermanWithBoat.ropeGraphics.stroke();
  }

  updateFishermen(delta: number) {
    const width = this.cameras.main.width;
    
    this.fishermen.forEach((fishermanWithBoat, index) => {
      const { boat, fisherman, direction } = fishermanWithBoat;
      
      // If the fisherman has a target, move towards it
      if (fishermanWithBoat.targetX !== undefined) {
        const diffX = fishermanWithBoat.targetX - boat.x;
        const moveX = Math.sign(diffX) * FISHERMAN_MOVEMENT_SPEED * (delta / 10);
        
        // If we're close enough to the target or have passed it, set a new target
        if (Math.abs(diffX) < 5 || (diffX > 0 && moveX > diffX) || (diffX < 0 && moveX < diffX)) {
          fishermanWithBoat.targetX = undefined;
        } else {
          // Move towards the target
          boat.x += moveX;
          fisherman.x += moveX;
        }
      } else {
        // Sometimes set a random target position or move toward the fish
        if (Phaser.Math.Between(1, 100) <= 2) {
          // 30% chance to move toward the fish, 70% chance to move randomly
          if (Phaser.Math.Between(1, 100) <= 30) {
            fishermanWithBoat.targetX = Phaser.Math.Clamp(this.fish.x, 100, width - 100);
          } else {
            fishermanWithBoat.targetX = Phaser.Math.Between(100, width - 100);
          }
        } else {
          // Move in the current direction
          boat.x += direction * FISHERMAN_MOVEMENT_SPEED * (delta / 10);
          fisherman.x += direction * FISHERMAN_MOVEMENT_SPEED * (delta / 10);
          
          // Change direction if reaching the edge
          if ((direction > 0 && boat.x > width - 100) || (direction < 0 && boat.x < 100)) {
            fishermanWithBoat.direction *= -1;
          }
        }
      }
    });
  }

  spawnHook() {
    // Get a random fisherman to drop the hook from
    const randomIndex = Phaser.Math.Between(0, this.fishermen.length - 1);
    const fishermanWithBoat = this.fishermen[randomIndex];
    
    const x = fishermanWithBoat.boat.x;
    const y = this.waterLevel;
    
    const hook = this.hooks.create(x, y, 'hook') as Phaser.Physics.Arcade.Sprite;
    hook.setScale(0.8);
    hook.setSize(20, 40);
    hook.setOffset(10, 40);
    
    // Store which fisherman is controlling this hook
    hook.setData('fishermanIndex', randomIndex);
    hook.setData('pulling', false);
    
    // Drop the hook downward with a slight swing
    this.tweens.add({
      targets: hook,
      y: this.waterLevel + Phaser.Math.Between(100, 300),
      duration: 1000,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        // After a random time, pull the hook back up
        this.time.delayedCall(Phaser.Math.Between(1000, 3000), () => {
          if (hook.active) {
            hook.setData('pulling', true);
            hook.setData('pullSpeed', Phaser.Math.Between(HOOK_PULL_SPEED_MIN, HOOK_PULL_SPEED_MAX));
          }
        });
      }
    });
  }

  spawnObstacle() {
    const height = this.cameras.main.height;
    const waterDepth = height - this.waterLevel;
    const maxObstacleHeight = waterDepth * 0.25; // 25% of water height
    
    // Choose a random obstacle type
    const obstacleType = Phaser.Utils.Array.GetRandom(this.obstacleTextures);
    
    // Create obstacle at bottom of screen, just off the right edge
    const x = this.cameras.main.width + 50;
    const y = height - Phaser.Math.Between(20, maxObstacleHeight);
    
    const obstacle = this.obstacles.create(x, y, obstacleType) as Phaser.Physics.Arcade.Sprite;
    
    // Adjust scale and physics body based on obstacle type
    let scale = 0.8;
    if (obstacleType === 'coral') {
      scale = Phaser.Math.FloatBetween(0.6, 0.9);
      obstacle.setSize(50, maxObstacleHeight * scale);
      obstacle.setOffset(25, 10);
    } else if (obstacleType === 'stone') {
      scale = Phaser.Math.FloatBetween(0.5, 0.8);
      obstacle.setSize(60, maxObstacleHeight * scale);
      obstacle.setOffset(20, 10);
    } else if (obstacleType === 'plant') {
      scale = Phaser.Math.FloatBetween(0.7, 1);
      obstacle.setSize(40, maxObstacleHeight * scale);
      obstacle.setOffset(30, 5);
    }
    
    obstacle.setScale(scale);
    obstacle.setOrigin(0.5, 1); // Set origin to bottom center
    obstacle.setData('type', obstacleType);
  }

  handleCollision(object1: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile, 
                 object2: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile) {
    if (!this.gameActive) return;
    
    this.gameActive = false;
    
    // Create bubble effect - fixing the particle emitter issue
    const bubbles = this.add.group({
      key: 'bubble',
      repeat: 20,
      setXY: { x: this.fish.x, y: this.fish.y, stepX: 0 }
    });
    
    bubbles.children.iterate((bubble: any) => {
      const dx = Phaser.Math.Between(-100, 100);
      const dy = Phaser.Math.Between(-100, 100);
      const scale = Phaser.Math.FloatBetween(0.2, 0.6);
      
      bubble.setScale(scale);
      this.tweens.add({
        targets: bubble,
        x: bubble.x + dx,
        y: bubble.y + dy,
        alpha: 0,
        scale: 0,
        duration: 1000,
        ease: 'Power2'
      });
      
      return true;
    });
    
    // Hide the fish
    this.fish.setVisible(false);
    
    // Stop all moving objects
    this.hooks.getChildren().forEach((hook: Phaser.GameObjects.GameObject) => {
      const h = hook as Phaser.Physics.Arcade.Sprite;
      h.setVelocity(0);
      h.setData('pulling', false);
    });
    
    // Trigger game over after a short delay
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

