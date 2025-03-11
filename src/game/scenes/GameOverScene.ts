
import Phaser from 'phaser';
import { saveToLeaderboard } from '../config';

export class GameOverScene extends Phaser.Scene {
  private score: number = 0;
  private time: number = 0;

  constructor() {
    super('GameOverScene');
  }

  init(data: { score: number, time: number }) {
    this.score = data.score;
    this.time = data.time;
    
    // Save to leaderboard
    saveToLeaderboard(this.time);
  }

  create() {
    // This scene is mostly managed by React, so we just need to handle the data
    window.dispatchEvent(new CustomEvent('game-over', { 
      detail: { 
        score: this.score, 
        time: this.time 
      } 
    }));
  }
}
