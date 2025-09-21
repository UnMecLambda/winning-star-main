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

const game = new Phaser.Game(config);

// --- Nettoyage quand on quitte la page (déclenché par vraie navigation /home)
function cleanupPong() {
  try {
    // Notifie la scène si elle écoute un événement custom
    window.dispatchEvent(new Event('pong:cleanup'));
    // Stop/destroy toutes les scènes actives
    game.scene.getScenes(true).forEach((s: any) => {
      if (typeof s.destroy === 'function') s.destroy();
      else if (s.scene?.key) game.scene.stop(s.scene.key);
    });
  } catch { /* ignore */ }
}
window.addEventListener('beforeunload', cleanupPong);

// ---- UI bindings (évite les doubles bindings en HMR)
const BOUND_FLAG = '__pong_ui_bound__';
if (!(window as any)[BOUND_FLAG]) {
  (window as any)[BOUND_FLAG] = true;

  const queueBtn = document.getElementById('queueBtn');
  const practiceBtn = document.getElementById('practiceBtn');

  queueBtn?.addEventListener('click', () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('practice');
    url.searchParams.delete('mode');
    window.location.href = url.toString();
  });

  practiceBtn?.addEventListener('click', () => {
    const url = new URL(window.location.href);
    url.searchParams.set('practice', 'true');
    window.location.href = url.toString();
  });
}
