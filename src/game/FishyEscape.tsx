
import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';
import { GameOverScene } from './scenes/GameOverScene';
import { gameConfig, getLeaderboard, formatTime } from './config';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Trophy, Timer } from 'lucide-react';

const FishyEscape: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<{time: number; date: string}[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Load leaderboard on component mount
    setLeaderboard(getLeaderboard());
  }, []);

  useEffect(() => {
    if (!gameStarted) return;
    
    // Create game instance
    if (containerRef.current && !gameRef.current) {
      const config = {
        ...gameConfig,
        parent: containerRef.current,
        scene: [MainScene, GameOverScene]
      };

      gameRef.current = new Phaser.Game(config);

      // Event listeners
      const handleScoreUpdate = (event: CustomEvent) => {
        setScore(event.detail);
      };

      const handleGameOver = (event: CustomEvent) => {
        const { score, time } = event.detail;
        setGameOver(true);
        setScore(score);
        setTime(time);
        setLeaderboard(getLeaderboard()); // Refresh leaderboard
      };

      // Register event listeners
      window.addEventListener('score-update', handleScoreUpdate as EventListener);
      window.addEventListener('game-over', handleGameOver as EventListener);

      // Cleanup
      return () => {
        window.removeEventListener('score-update', handleScoreUpdate as EventListener);
        window.removeEventListener('game-over', handleGameOver as EventListener);
        if (gameRef.current) {
          gameRef.current.destroy(true);
          gameRef.current = null;
        }
      };
    }
  }, [gameStarted]);

  const handleStartGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setTime(0);
    setShowLeaderboard(false);
  };

  const handleRestartGame = () => {
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setTime(0);
    setShowLeaderboard(false);
  };

  const toggleLeaderboard = () => {
    setShowLeaderboard(prev => !prev);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-ocean-light to-ocean-deep">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <div 
            key={i} 
            className="bubble"
            style={{ 
              '--random': Math.random(),
              animationDelay: `${-Math.random() * 15}s`
            } as React.CSSProperties}
          />
        ))}
        <div className="wave" />
        <div className="wave" style={{ animationDelay: '-10s' }} />
      </div>

      {/* Score display */}
      {gameStarted && !gameOver && (
        <div className="absolute top-4 left-0 right-0 flex justify-center z-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 text-white font-bold text-lg animate-fade-in">
            Score: {score}
          </div>
        </div>
      )}

      {/* Game container */}
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ display: gameStarted ? 'block' : 'none' }}
      />

      {/* Start screen */}
      {!gameStarted && !gameOver && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Card className="w-[90%] max-w-md bg-white/10 backdrop-blur-md border-white/20 shadow-xl animate-scale-up">
            <div className="p-8 text-center">
              <div className="fish-container inline-block">
                <svg width="100" height="60" viewBox="0 0 100 60" className="mx-auto mb-6">
                  <path d="M30 30C30 41.046 36.954 50 45 50C65 50 85 40 95 30C85 20 65 10 45 10C36.954 10 30 18.954 30 30Z" fill="#FF9E2C"/>
                  <path d="M5 30L30 45V15L5 30Z" fill="#FF6B2C"/>
                  <circle cx="75" cy="25" r="5" fill="black"/>
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Fishy Escape</h1>
              <p className="text-white/80 mb-6">Swim through dangerous waters and avoid the fishermen's hooks!</p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-5">
                <Button 
                  onClick={handleStartGame}
                  className="bg-ocean-deep hover:bg-ocean text-white border-none px-8 py-6 text-lg rounded-full transition-all duration-300 hover:scale-105"
                >
                  Start Swimming
                </Button>
                
                <Button 
                  onClick={toggleLeaderboard}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 rounded-full transition-all duration-300 flex items-center gap-2"
                >
                  <Trophy size={18} />
                  Leaderboard
                </Button>
              </div>
              
              {showLeaderboard && (
                <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 animate-fade-in">
                  <h3 className="text-xl font-bold text-white mb-3 flex items-center justify-center gap-2">
                    <Trophy size={18} /> Top Survivors
                  </h3>
                  {leaderboard.length > 0 ? (
                    <div className="space-y-2">
                      {leaderboard.map((entry, index) => (
                        <div key={index} className="flex justify-between text-white border-b border-white/10 pb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{index + 1}.</span>
                            <span>{formatTime(entry.time)}</span>
                          </div>
                          <span className="text-white/70 text-sm">{entry.date}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/70 italic">No records yet. Be the first!</p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Game over screen */}
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Card className="w-[90%] max-w-md bg-white/10 backdrop-blur-md border-white/20 shadow-xl animate-scale-up">
            <div className="p-8 text-center">
              <h1 className="text-3xl font-bold text-white mb-2">Game Over</h1>
              <p className="text-white/80 mb-4">Oops! You got caught.</p>
              
              <div className="flex justify-center gap-8 mb-6">
                <div className="flex flex-col items-center">
                  <p className="text-white/70 flex items-center gap-1 mb-1">
                    <Trophy size={16} /> Score
                  </p>
                  <p className="text-2xl font-bold text-white">{score}</p>
                </div>
                
                <div className="flex flex-col items-center">
                  <p className="text-white/70 flex items-center gap-1 mb-1">
                    <Timer size={16} /> Time
                  </p>
                  <p className="text-2xl font-bold text-white">{formatTime(time)}</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-5">
                <Button 
                  onClick={handleRestartGame}
                  className="bg-ocean-deep hover:bg-ocean text-white border-none px-6 py-2 rounded-full transition-all duration-300 hover:scale-105 flex items-center gap-2"
                >
                  <RefreshCw size={18} />
                  Play Again
                </Button>
                
                <Button 
                  onClick={toggleLeaderboard}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 rounded-full transition-all duration-300 flex items-center gap-2"
                >
                  <Trophy size={18} />
                  Leaderboard
                </Button>
                
                <Button 
                  onClick={() => navigate('/')}
                  variant="ghost"
                  className="text-white hover:bg-white/10 rounded-full transition-all duration-300"
                >
                  Home
                </Button>
              </div>
              
              {showLeaderboard && (
                <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 animate-fade-in">
                  <h3 className="text-xl font-bold text-white mb-3 flex items-center justify-center gap-2">
                    <Trophy size={18} /> Top Survivors
                  </h3>
                  {leaderboard.length > 0 ? (
                    <div className="space-y-2">
                      {leaderboard.map((entry, index) => (
                        <div key={index} className="flex justify-between text-white border-b border-white/10 pb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{index + 1}.</span>
                            <span>{formatTime(entry.time)}</span>
                          </div>
                          <span className="text-white/70 text-sm">{entry.date}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/70 italic">No records yet. Be the first!</p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FishyEscape;
