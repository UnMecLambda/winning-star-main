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

/** Nettoyage propre (scènes, timers, sockets…) */
function cleanupPong() {
  try {
    // détruire les scènes si elles exposent destroy()
    game.scene.getScenes(true).forEach((s: any) => {
      if (typeof s.destroy === 'function') s.destroy();
      else if (s.scene?.key) game.scene.stop(s.scene.key);
    });
    // optionnel: tuer complètement le jeu pour éviter toute recréation
    // (décommente si utile) :
    // game.destroy(true);
  } catch { /* ignore */ }
}
window.addEventListener('beforeunload', cleanupPong);
window.addEventListener('pagehide', cleanupPong);
window.addEventListener('pong:cleanup', cleanupPong);

/** Bind UI (Find Match / Training / Home) — une seule fois */
const BOUND_FLAG = '__pong_ui_bound__';
if (!(window as any)[BOUND_FLAG]) {
  (window as any)[BOUND_FLAG] = true;

  const queueBtn = document.getElementById('queueBtn');
  const practiceBtn = document.getElementById('practiceBtn');
  const homeBtn = document.getElementById('homeBtn');

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

  homeBtn?.addEventListener('click', () => {
    if (!confirm('Quitter la partie et revenir à l’accueil ?')) return;

    // 1) nettoyer phaser/sockets
    cleanupPong();

    // 2) rediriger le top window (utile si le jeu est dans un iframe)
    const target = new URL('/play', window.location.origin).toString();
    try {
      if (window.top) (window.top as Window).location.assign(target);
      else window.location.assign(target);
    } catch {
      window.location.assign(target);
    }
  });
}
