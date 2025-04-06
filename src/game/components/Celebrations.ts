
import Phaser from 'phaser';

export class Celebrations {
  private scene: Phaser.Scene;
  private reachedMilestones: Set<number> = new Set();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  showMilestoneCelebration(milestone: number) {
    const x = this.scene.cameras.main.width / 2;
    const y = this.scene.cameras.main.height / 3;
    
    // Create the "Wow" image
    const wow = this.scene.add.image(x, y, 'wow');
    wow.setDepth(100);
    wow.setScale(0);
    
    // Add milestone text
    const text = this.scene.add.text(x, y + 40, `${milestone} POINTS!`, {
      fontSize: '28px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5,
      align: 'center'
    });
    text.setOrigin(0.5);
    text.setDepth(100);
    text.setAlpha(0);
    
    // Animate the "Wow" image
    this.scene.tweens.add({
      targets: wow,
      scale: 1.2,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: wow,
          scale: 1,
          duration: 300,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: 2
        });
      }
    });
    
    // Animate the text
    this.scene.tweens.add({
      targets: text,
      alpha: 1,
      y: y + 35,
      duration: 500,
      ease: 'Back.easeOut',
      delay: 200
    });
    
    // Fade out both elements after a delay
    this.scene.time.delayedCall(2000, () => {
      this.scene.tweens.add({
        targets: [wow, text],
        alpha: 0,
        y: '-=30',
        duration: 500,
        ease: 'Back.easeIn',
        onComplete: () => {
          wow.destroy();
          text.destroy();
        }
      });
    });
  }

  checkMilestone(score: number) {
    // Check for milestones
    const milestones = [100, 300, 500, 1000];
    for (const milestone of milestones) {
      if (score === milestone && !this.reachedMilestones.has(milestone)) {
        this.reachedMilestones.add(milestone);
        this.showMilestoneCelebration(milestone);
      }
    }
  }

  resetMilestones() {
    this.reachedMilestones.clear();
  }
}
