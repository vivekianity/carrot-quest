// Hoppy's animations, shared by every scene that shows her (Title, World Map, Level).
export function createHoppyAnims(A) {
  if (A.exists('hoppy-idle')) return;
  const f = (...names) => names.map((frame) => ({ key: 'hoppy', frame }));
  const idle = [];
  for (let i = 0; i < 14; i++) idle.push('idle0');
  idle.push('idle1', 'idle0', 'idle0', 'idle3', 'idle3', 'idle0');
  for (let i = 0; i < 10; i++) idle.push('idle0');
  idle.push('idle2', 'idle2', 'idle0', 'idle1');
  A.create({ key: 'hoppy-idle', frames: f(...idle), frameRate: 10, repeat: -1 });
  A.create({ key: 'hoppy-run', frames: f('run0', 'run1', 'run2', 'run3'), frameRate: 13, repeat: -1 });
  A.create({ key: 'hoppy-flap', frames: f('flap0', 'flap1'), frameRate: 14, repeat: -1 });
  A.create({ key: 'hoppy-jump', frames: f('jump'), frameRate: 1 });
  A.create({ key: 'hoppy-fall', frames: f('fall'), frameRate: 1 });
  A.create({ key: 'hoppy-land', frames: f('land'), frameRate: 1 });
  A.create({ key: 'hoppy-float', frames: f('float'), frameRate: 1 });
  // Thinking: mostly still, with a chin-tap, a blink and a wondering look now and then.
  A.create({ key: 'hoppy-think', frames: f('think', 'think', 'think1', 'think', 'think1', 'think', 'think', 'think2', 'think', 'think', 'think3', 'think3', 'think'), frameRate: 4, repeat: -1 });
  // Happy dance: lean, step, lean the other way, step.
  A.create({ key: 'hoppy-dance', frames: f('dance0', 'dance1', 'dance2', 'dance3'), frameRate: 7, repeat: -1 });
  A.create({ key: 'hoppy-cheer', frames: f('flap0', 'flap1'), frameRate: 9, repeat: -1 });
  A.create({ key: 'hoppy-munch', frames: f('munch0', 'munch1'), frameRate: 7, repeat: -1 });
  A.create({ key: 'hoppy-spin', frames: f('spin0', 'spin1', 'spin2', 'spin3'), frameRate: 16, repeat: -1 });
}
