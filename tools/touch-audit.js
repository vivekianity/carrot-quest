// Browser helper (inject after the game has booted): lists every tappable object in the running
// scenes with its hit-area size in design pixels (1280×720). TA.audit() → [{ scene, what, w, h }].
window.TA = {
  audit(minGame = 100, minMenu = 80) {
    const out = [];
    for (const sc of window.carrotQuest.scene.getScenes(true)) {
      for (const go of sc.children.list.concat(...sc.children.list.filter((c) => c.list).map((c) => c.list))) {
        if (!go.input || !go.input.enabled || !go.visible) continue;
        const ha = go.input.hitArea;
        let w = ha.width ?? ha.radius * 2, h = ha.height ?? ha.radius * 2;
        const m = go.getWorldTransformMatrix ? go.getWorldTransformMatrix() : null;
        const sx = m ? Math.hypot(m.a, m.b) : go.scaleX, sy = m ? Math.hypot(m.c, m.d) : go.scaleY;
        w = Math.round(w * sx); h = Math.round(h * sy);
        const what = go.texture && go.texture.key !== '__DEFAULT' ? go.texture.key : go.type;
        out.push({ scene: sc.scene.key, what, w, h, min: Math.min(w, h) });
      }
    }
    return out;
  },
};
'touch audit ok';
