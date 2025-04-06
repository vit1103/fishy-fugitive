
import Phaser from 'phaser';
import { formatTime } from '../config';

export class GameStateManager {
  private scene: Phaser.Scene;
  private score: number = 0;
  private startTime: number = 0;
  private elapsedTime: number = 0;
  private gameActive: boolean = true;
  private timerText: Phaser.GameObjects.Text;
  private celebrations: any;
  private scoreUpdateCallback: (score: number) => void;
  
  constructor(scene: Phaser.Scene, celebrations: any) {
    this.scene = scene;
    this.celebrations = celebrations;
    this.startTime = Date.now();
    
    // Create UI elements
    this.timerText = this.scene.add.text(
      this.scene.cameras.main.width - 150, 
      20, 
      '0:00', 
      {
        fontSize: '24px',
        color: '#FFFFFF',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }
    );
    this.timerText.setScrollFactor(0);
    this.timerText.setDepth(100);
    
    // Setup score update callback
    this.scoreUpdateCallback = (score: number) => {
      window.dispatchEvent(new CustomEvent('score-update', { detail: score }));
    };
    
    // Setup timer update
    this.scene.time.addEvent({
      delay: 100,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true
    });
    
    // Setup score update
    this.scene.time.addEvent({
      delay: 100,
      callback: this.updateScore,
      callbackScope: this,
      loop: true
    });
  }
  
  updateTimer() {
    if (!this.gameActive) return;
    
    this.elapsedTime = Date.now() - this.startTime;
    this.timerText.setText(formatTime(this.elapsedTime));
  }
  
  updateScore() {
    if (!this.gameActive) return;
    
    this.score += 1;
    this.scoreUpdateCallback(this.score);
    
    // Check for milestones
    this.celebrations.checkMilestone(this.score);
  }
  
  getScore(): number {
    return this.score;
  }
  
  getElapsedTime(): number {
    return this.elapsedTime;
  }
  
  setGameActive(active: boolean) {
    this.gameActive = active;
  }
  
  isGameActive(): boolean {
    return this.gameActive;
  }
  
  addScoreBonus(bonus: number) {
    this.score += bonus;
    this.scoreUpdateCallback(this.score);
  }
}
