
import Phaser from 'phaser';
import { saveToLeaderboard } from '../config';

export class GameOverScene extends Phaser.Scene {
  private score: number = 0;
  private elapsedTime: number = 0;

  constructor() {
    super('GameOverScene');
  }

  init(data: { score: number, time: number }) {
    this.score = data.score;
    this.elapsedTime = data.time;
    
    // Save to leaderboard
    saveToLeaderboard(this.elapsedTime);
  }

  create() {
    // This scene is mostly managed by React, so we just need to handle the data
    window.dispatchEvent(new CustomEvent('game-over', { 
      detail: { 
        score: this.score, 
        time: this.elapsedTime 
      } 
    }));
  }
}
