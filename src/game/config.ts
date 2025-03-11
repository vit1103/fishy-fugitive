
import Phaser from 'phaser';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#87CEEB',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  pixelArt: false
};

export const GAME_SPEED = 200;
export const HOOK_SPAWN_MIN = 1000;
export const HOOK_SPAWN_MAX = 3000;
export const DIFFICULTY_INCREASE_INTERVAL = 5000;
export const DIFFICULTY_INCREASE_AMOUNT = 10;
export const FISHERMAN_MOVEMENT_SPEED = 1.5;
export const HOOK_PULL_SPEED_MIN = 80;
export const HOOK_PULL_SPEED_MAX = 150;
export const LEADERBOARD_SIZE = 5;

// Helper to get/save leaderboard from localStorage
export const getLeaderboard = (): { time: number; date: string }[] => {
  const saved = localStorage.getItem('fishy-leaderboard');
  return saved ? JSON.parse(saved) : [];
};

export const saveToLeaderboard = (time: number): void => {
  const leaderboard = getLeaderboard();
  leaderboard.push({
    time,
    date: new Date().toLocaleDateString()
  });
  
  // Sort by highest time (descending) and limit size
  leaderboard.sort((a, b) => b.time - a.time);
  if (leaderboard.length > LEADERBOARD_SIZE) {
    leaderboard.length = LEADERBOARD_SIZE;
  }
  
  localStorage.setItem('fishy-leaderboard', JSON.stringify(leaderboard));
};

export const formatTime = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};
