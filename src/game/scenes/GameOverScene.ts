
import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  private score: number = 0;

  constructor() {
    super('GameOverScene');
  }

  init(data: { score: number }) {
    this.score = data.score;
  }

  create() {
    // This scene is mostly managed by React, so we just need to handle the data
    window.dispatchEvent(new CustomEvent('game-over', { detail: this.score }));
  }
}
