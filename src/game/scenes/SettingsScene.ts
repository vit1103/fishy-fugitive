// scenes/SettingsScene.ts
import Phaser from 'phaser';

export class SettingsScene extends Phaser.Scene {
  private musicToggle!: Phaser.GameObjects.Rectangle;
  private toggleText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create() {
    const musicOn = localStorage.getItem('music') !== 'off';

    this.add.rectangle(400, 300, 400, 250, 0x000000, 0.8).setOrigin(0.5);
    this.add.text(400, 200, 'Settings', {
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Toggle switch background
    this.musicToggle = this.add.rectangle(400, 270, 100, 40, musicOn ? 0x00ff88 : 0x888888)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Toggle text
    this.toggleText = this.add.text(400, 270, musicOn ? 'ON' : 'OFF', {
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.musicToggle.on('pointerdown', () => {
      const isOn = localStorage.getItem('music') !== 'off';
      const newState = isOn ? 'off' : 'on';
      localStorage.setItem('music', newState);

      this.musicToggle.setFillStyle(newState === 'on' ? 0x00ff88 : 0x888888);
      this.toggleText.setText(newState.toUpperCase());
      this.events.emit('music-toggle', newState);
    });

    // Close settings with ESC
    this.input.keyboard?.once('keydown-ESC', () => {
      this.scene.stop();
      this.scene.resume('MainScene');
    });
  }
}