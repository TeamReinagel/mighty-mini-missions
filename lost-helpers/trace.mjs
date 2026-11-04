// Finger tracing for the path shop and the desk. A lift is fine. Leaving the path is a miss.

function pointOn(svg, event) {
  const rect = svg.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 120;
  return { x, y };
}

function nearest(path, x, y) {
  const length = path.getTotalLength();
  let best = Infinity;
  let at = 0;
  const steps = Math.max(40, Math.floor(length / 2));
  for (let i = 0; i <= steps; i += 1) {
    const p = path.getPointAtLength((i / steps) * length);
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < best) {
      best = d;
      at = i / steps;
    }
  }
  return { dist: best, progress: at };
}

export function runTrace(ui, { paths, missLine }) {
  return new Promise((resolve) => {
    let clean = true;
    let stroke = 0;
    const host = document.createElement("div");
    host.className = "trace-host";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 100 120");
    svg.classList.add("trace-pad");
    svg.innerHTML = `
      <line x1="12" y1="10" x2="88" y2="10" stroke="#c9b8a0" stroke-width="1.5"/>
      <line x1="12" y1="50" x2="88" y2="50" stroke="#c9b8a0" stroke-width="1.5" stroke-dasharray="3 3"/>
      <line x1="12" y1="90" x2="88" y2="90" stroke="#c9b8a0" stroke-width="1.5"/>
    `;
    host.append(svg);
    ui.scene.append(host);

    const guide = document.createElementNS("http://www.w3.org/2000/svg", "path");
    guide.setAttribute("fill", "none");
    guide.setAttribute("stroke", "#9bb7d4");
    guide.setAttribute("stroke-width", "7");
    guide.setAttribute("stroke-linecap", "round");
    guide.setAttribute("stroke-linejoin", "round");
    svg.append(guide);

    const ink = document.createElementNS("http://www.w3.org/2000/svg", "path");
    ink.setAttribute("fill", "none");
    ink.setAttribute("stroke", "#2b5f9e");
    ink.setAttribute("stroke-width", "5");
    ink.setAttribute("stroke-linecap", "round");
    ink.setAttribute("stroke-linejoin", "round");
    svg.append(ink);

    const start = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    start.setAttribute("r", "5");
    start.setAttribute("fill", "#3cb371");
    start.setAttribute("stroke", "#1f6b3f");
    start.setAttribute("stroke-width", "1.5");
    svg.append(start);

    let drawing = false;
    let progress = 0;
    let inkD = "";

    const showStroke = () => {
      const entry = paths[stroke];
      guide.setAttribute("d", entry.d);
      ink.setAttribute("d", "");
      inkD = "";
      progress = 0;
      const first = guide.getPointAtLength(0);
      start.setAttribute("cx", String(first.x));
      start.setAttribute("cy", String(first.y));
      start.style.display = "";
      ui.speak(entry.cue || missLine);
    };

    const finishStroke = () => {
      stroke += 1;
      if (stroke >= paths.length) {
        svg.replaceWith(svg.cloneNode(true));
        resolve(clean);
        return;
      }
      showStroke();
    };

    const onDown = (event) => {
      event.preventDefault();
      const { x, y } = pointOn(svg, event);
      const near = nearest(guide, x, y);
      if (near.dist > 14 || near.progress > 0.18) {
        clean = false;
        ui.speak(missLine);
        return;
      }
      drawing = true;
      progress = near.progress;
      start.style.display = "none";
      inkD = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      ink.setAttribute("d", inkD);
      svg.setPointerCapture(event.pointerId);
    };

    const onMove = (event) => {
      if (!drawing) return;
      event.preventDefault();
      const { x, y } = pointOn(svg, event);
      const near = nearest(guide, x, y);
      if (near.dist > 12) {
        clean = false;
        drawing = false;
        ui.speak(missLine);
        ink.setAttribute("d", "");
        start.style.display = "";
        progress = 0;
        return;
      }
      if (near.progress + 0.08 < progress) return;
      progress = Math.max(progress, near.progress);
      inkD += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      ink.setAttribute("d", inkD);
      if (progress > 0.88) {
        drawing = false;
        finishStroke();
      }
    };

    const onUp = () => {
      drawing = false;
    };

    svg.addEventListener("pointerdown", onDown);
    svg.addEventListener("pointermove", onMove);
    svg.addEventListener("pointerup", onUp);
    svg.addEventListener("pointercancel", onUp);
    showStroke();
  });
}
