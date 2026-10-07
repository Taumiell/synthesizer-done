import './style.css';
import './figma.css';
import { createKitSwitch } from './components/figma-controls.js';
import { createMainSynth } from './components/main-synth.js';
import { SoundWorld } from './audio/engine.js';
import { trackDefinitions } from './music/composition.js';
import { initialParameters } from './music/controls.js';

let world;
let busy = false;
let animation;
const events = new AbortController();
const settings = Object.fromEntries(
  trackDefinitions.map((track) => [
    track.id,
    { level: track.level, muted: true, parameters: initialParameters(track.id) },
  ]),
);
const tracksContainer = document.querySelector('#tracks');
tracksContainer.replaceChildren();
const cards = [...trackDefinitions]
  .sort(
    (a, b) =>
      ['piano', 'drone', 'birds', 'rain'].indexOf(a.id) -
      ['piano', 'drone', 'birds', 'rain'].indexOf(b.id),
  )
  .map((definition) => {
    const card = createMainSynth(
      definition,
      (id, level) => {
        settings[id].level = level;
        world?.setLevel(id, level);
      },
      (id, muted) => {
        settings[id].muted = muted;
        world?.setMuted(id, muted);
      },
      (id, key, value) => {
        settings[id].parameters[key] = value;
        world?.setParameter(id, key, value);
      },
    );
    tracksContainer.append(card.element);
    return { ...card, id: definition.id };
  });

const master = createKitSwitch(
  'Synthesizer power',
  false,
  (enabled) => {
    if (enabled) startPlayback();
    else stopPlayback();
  },
  'toggle',
);
master.element.id = 'master-power';
document.querySelector('main > header').append(master.element);
let restartTimer;

function renderPlayback() {
  const playing = Boolean(world?.playing);
  master.setEnabled(playing);
  master.element.disabled = busy;
  document.body.classList.toggle('is-playing', playing);
  document.body.classList.toggle('is-loading', busy);
  for (const card of cards) {
    const locked = !playing || busy;
    card.element.inert = locked;
    card.element.querySelectorAll('button,input,select').forEach((control) => {
      control.disabled = locked;
    });
  }
}

async function startPlayback() {
  if (busy || world?.playing) {
    renderPlayback();
    return;
  }
  busy = true;
  renderPlayback();
  try {
    world ??= new SoundWorld();
    cards.forEach((card) => card.setPower(true));
    for (const [id, setting] of Object.entries(settings)) {
      world.setLevel(id, setting.level, true);
      world.setMuted(id, setting.muted);
      for (const [key, value] of Object.entries(setting.parameters))
        world.setParameter(id, key, value);
    }
    await world.start();
  } catch (error) {
    console.error('Audio initialization failed:', error);
    world?.dispose();
    world = undefined;
    cards.forEach((card) => card.setPower(false));
  } finally {
    busy = false;
    renderPlayback();
  }
}

function stopPlayback() {
  if (busy || !world?.playing) {
    renderPlayback();
    return;
  }
  world.stop();
  cards.forEach((card) => card.setPower(false));
  // Keep both entry points from scheduling Start before the audio fade ends.
  busy = true;
  renderPlayback();
  restartTimer = setTimeout(() => {
    busy = false;
    renderPlayback();
  }, 160);
}
renderPlayback();

function draw() {
  const levels = world?.getLevels() ?? {};
  cards.forEach((card) => card.updateMeter(levels[card.id] ?? 0));
  animation = requestAnimationFrame(draw);
}
draw();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    events.abort();
    clearTimeout(restartTimer);
    cancelAnimationFrame(animation);
    world?.dispose();
  });
}
window.addEventListener(
  'pagehide',
  () => {
    world?.stop();
  },
  { signal: events.signal },
);
