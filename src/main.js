import './style.css';
import './figma.css';
import { createKitSwitch } from './components/figma-controls.js';
import { createMainSynth } from './components/main-synth.js';
import { SoundWorld } from './audio/engine.js';
import { trackDefinitions } from './music/composition.js';
import { initialParameters } from './music/controls.js';

let world;
let busy = false;
let activationPending = false;
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
  'Start synthesizer',
  false,
  (enabled) => {
    if (enabled) startPlayback();
  },
  'toggle',
);
master.element.id = 'master-power';
document.querySelector('main > header').append(master.element);

function renderPlayback() {
  const playing = Boolean(world?.playing);
  master.setEnabled(playing || activationPending);
  master.element.disabled = busy;
  master.element.setAttribute(
    'aria-label',
    busy ? 'Loading synthesizer' : 'Start synthesizer',
  );
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
  const title = document.querySelector('main > header h1');
  const titleStart = title.getBoundingClientRect();
  activationPending = true;
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
    await enterSynthesizer(title, titleStart);
  } catch (error) {
    console.error('Audio initialization failed:', error);
    world?.dispose();
    world = undefined;
    activationPending = false;
    cards.forEach((card) => card.setPower(false));
  } finally {
    busy = false;
    renderPlayback();
  }
}

async function enterSynthesizer(title, titleStart) {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toggleAnimation = master.element.animate(
    [{ opacity: 1 }, { opacity: 0 }],
    { duration: reduceMotion ? 0 : 520, easing: 'ease-in-out', fill: 'forwards' },
  );
  await toggleAnimation.finished;
  master.element.hidden = true;
  master.element.remove();

  document.body.classList.add('is-entering');
  document.body.classList.remove('is-intro');

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const titleEnd = title.getBoundingClientRect();
  const duration = reduceMotion ? 0 : 1400;
  const titleAnimation = title.animate(
    [
      {
        transformOrigin: 'top left',
        transform: `translate(${titleStart.left - titleEnd.left}px, ${titleStart.top - titleEnd.top}px) scale(${titleStart.width / titleEnd.width}, ${titleStart.height / titleEnd.height})`,
      },
      { transformOrigin: 'top left', transform: 'translate(0, 0) scale(1, 1)' },
    ],
    { duration, easing: 'cubic-bezier(0.42, 0, 0.28, 1)' },
  );
  await titleAnimation.finished;
  document.body.classList.remove('is-entering');
  document.body.classList.add('is-ready');
  activationPending = false;

  if (!reduceMotion) await new Promise((resolve) => setTimeout(resolve, 420));
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
    cards.forEach((card) => card.dispose());
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
