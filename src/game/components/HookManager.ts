
import Phaser from 'phaser';
import { Fishermen } from './Fishermen';
import { 
  HOOK_SPAWN_MIN, 
  HOOK_SPAWN_MAX,
  HOOK_PULL_SPEED_MIN,
  HOOK_PULL_SPEED_MAX
} from '../config';

export class HookManager {
  private scene: Phaser.Scene;
  private hooks: Phaser.Physics.Arcade.Group;
  private fishermen: Fishermen;
  private waterLevel: number;
  private nextHookTime: number = 0;

  constructor(scene: Phaser.Scene, hooks: Phaser.Physics.Arcade.Group, fishermen: Fishermen, waterLevel: number) {
    this.scene = scene;
    this.hooks = hooks;
    this.fishermen = fishermen;
    this.waterLevel = waterLevel;
  }

  update(time: number, delta: number) {
    if (time > this.nextHookTime) {
      this.spawnHook();
      this.nextHookTime = time + Phaser.Math.Between(HOOK_SPAWN_MIN, HOOK_SPAWN_MAX);
    }

    this.hooks.getChildren().forEach((hook: Phaser.GameObjects.GameObject) => {
      const h = hook as Phaser.Physics.Arcade.Sprite;
      
      if (h.getData('pulling') === true) {
        h.y -= h.getData('pullSpeed') * (delta / 1000);
        
        if (h.y <= this.waterLevel) {
          h.destroy();
        }
      } else {
        const fishermanIndex = h.getData('fishermanIndex');
        if (fishermanIndex !== undefined) {
          const fishermanWithBoat = this.fishermen.fishermen[fishermanIndex];
          h.x = fishermanWithBoat.boat.x;
        }
      }
      
      this.fishermen.drawRope(h);
    });
  }

  spawnHook() {
    const randomIndex = Phaser.Math.Between(0, this.fishermen.fishermen.length - 1);
    const fishermanWithBoat = this.fishermen.fishermen[randomIndex];
    
    const x = fishermanWithBoat.boat.x;
    const y = this.waterLevel;
    
    const hook = this.hooks.create(x, y, 'hook') as Phaser.Physics.Arcade.Sprite;
    hook.setScale(0.8);
    hook.setSize(20, 40);
    hook.setOffset(10, 40);
    
    hook.setData('fishermanIndex', randomIndex);
    hook.setData('pulling', false);
    
    this.scene.tweens.add({
      targets: hook,
      y: this.waterLevel + Phaser.Math.Between(100, 300),
      duration: 1000,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(Phaser.Math.Between(1000, 3000), () => {
          if (hook.active) {
            hook.setData('pulling', true);
            hook.setData('pullSpeed', Phaser.Math.Between(HOOK_PULL_SPEED_MIN, HOOK_PULL_SPEED_MAX));
          }
        });
      }
    });
  }
}
