import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';

const params = new URLSearchParams(window.location.search);
const token = params.get('token') || '';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 720,
  height: 1280,
  parent: 'app',
  backgroundColor: '#0d0f14',
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [new BootScene(), new GameScene(token)]
};

new Phaser.Game(config);

// UI bindings
const q = document.getElementById('queueBtn')!;
const p = document.getElementById('practiceBtn')!;

q.addEventListener('click', () => {
  // Reload with matchmaking mode
  const url = new URL(window.location.href);
  url.searchParams.delete('practice');
  url.searchParams.delete('mode');
  window.location.href = url.toString();
});

p.addEventListener('click', () => {
  // Reload with practice mode
  const url = new URL(window.location.href);
  url.searchParams.set('practice', 'true');
  window.location.href = url.toString();
});
