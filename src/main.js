import { BootScene } from './scenes/Boot.js';
import { LevelScene } from './scenes/Level.js';
import { MathSignScene } from './scenes/MathSign.js';
import { LevelCompleteScene } from './scenes/LevelComplete.js';
import { TitleScene } from './scenes/Title.js';
import { ProfilesScene } from './scenes/Profiles.js';
import { WorldMapScene } from './scenes/WorldMap.js';
import { BurrowScene } from './scenes/Burrow.js';
import { StickersScene } from './scenes/Stickers.js';
import { PHYS } from './engine/jump.js';

const debug = new URLSearchParams(location.search).has('debug');

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#bfe6ff',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: PHYS.gravity }, tileBias: 32, debug },
  },
  input: { activePointers: 4 },   // several fingers at once (run + jump)
  audio: { noAudio: true },       // all sound is synthesised in src/audio.js
  render: { antialias: true, roundPixels: true },
  scene: [BootScene, TitleScene, ProfilesScene, WorldMapScene, BurrowScene, StickersScene, LevelScene, MathSignScene, LevelCompleteScene],
});

// Pause while the iPad is held in portrait (the "turn sideways" picture is showing).
const portrait = window.matchMedia('(orientation: portrait) and (pointer: coarse)');
const applyOrientation = () => {
  if (portrait.matches) game.loop.sleep();
  else if (!game.loop.running) game.loop.wake();
};
portrait.addEventListener ? portrait.addEventListener('change', applyOrientation) : portrait.addListener(applyOrientation);
game.events.once('ready', applyOrientation);

window.carrotQuest = game; // handy for debugging in the console
