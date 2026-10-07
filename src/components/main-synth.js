import { trackControls } from '../music/controls.js';
import {
  createKitButton,
  createKitSwitch,
  createKitSlider,
  createKitKnob,
  createKitMeter,
} from './figma-controls.js';

export function createMainSynth(definition, onLevel, onMute, onParameter) {
  const names = {
    piano: 'Main Synth',
    drone: 'Signal Synth',
    birds: 'Bird Synth',
    rain: 'Rain Synth',
  };
  const track = { ...definition, name: names[definition.id] };
  const controls = Object.fromEntries(
    trackControls[definition.id].map((control) => [control.key, control]),
  );
  const panel = document.createElement('article');
  panel.className = 'main-synth main-muted';
  panel.dataset.track = definition.id;
  const header = document.createElement('div');
  header.className = 'main-synth-header';
  const title = document.createElement('h2');
  title.textContent = track.name;
  const applyPower = (enabled) => {
    panel.classList.toggle('main-muted', !enabled);
    onMute(definition.id, !enabled);
  };
  const power = createKitSwitch(`${track.name} power`, false, applyPower);
  header.append(title, power.element);

  const source = document.createElement('div');
  source.className = 'main-source';
  const left = document.createElement('div');
  left.className = 'main-source-left';
  const volume = createKitSlider(
    track,
    {
      key: 'volume',
      label: 'Volume',
      min: 0,
      max: 100,
      step: 1,
      value: definition.level,
    },
    (id, key, value) => onLevel(id, value),
  );
  volume.classList.add('main-volume');
  const meter = createKitMeter(`${track.name} level`);
  volume.append(meter.element);
  const wave = document.createElement('fieldset');
  wave.className = 'main-wave';
  const legend = document.createElement('legend');
  legend.textContent = 'Wave type';
  const options = document.createElement('div');
  options.className = 'main-wave-buttons';
  const buttons = [];
  for (const option of controls.waveform?.options ?? []) {
    const button = createKitButton(option.label, () => {
      onParameter(definition.id, 'waveform', option.value);
      buttons.forEach((entry) =>
        entry.button.setAttribute('aria-pressed', String(entry.value === option.value)),
      );
    });
    button.setAttribute('aria-pressed', String(option.value === controls.waveform.value));
    buttons.push({ button, value: option.value });
    options.append(button);
  }
  wave.append(legend, options);
  left.append(volume);
  if (controls.waveform) left.append(wave);
  const right = document.createElement('div');
  right.className = 'main-envelope';
  for (const control of Object.values(controls).filter(
    (control) => control.type === 'range' && control.key !== 'cutoff',
  ))
    right.append(createKitSlider(track, control, onParameter));
  source.append(left);
  if (right.childElementCount) source.append(right);
  else source.classList.add('sample-source');
  const separator = document.createElement('div');
  separator.className = 'main-separator';
  const effects = document.createElement('div');
  effects.className = 'main-effects';
  const cutoff = createKitSlider(track, controls.cutoff, onParameter);
  const knobs = document.createElement('div');
  knobs.className = 'main-knobs';
  for (const control of Object.values(controls).filter(
    (control) => control.type === 'knob',
  ))
    knobs.append(createKitKnob(track, control, onParameter));
  effects.append(cutoff, knobs);
  panel.append(header, source, separator, effects);
  // Scale original vector layers without changing their native geometry.
  const resize = new ResizeObserver((entries) => {
    const width = entries[0].contentRect.width;
    panel.style.setProperty(
      '--knob-scale',
      Math.max(0.48165, Math.min(0.883, width / 692)),
    );
    panel.style.setProperty('--switch-scale', Math.max(0.52, Math.min(0.8, width / 850)));
  });
  resize.observe(panel);
  return {
    element: panel,
    dispose: () => power.dispose(),
    updateMeter: (value) => meter.update(value),
    setPower(enabled) {
      power.setEnabled(enabled);
      applyPower(enabled);
    },
  };
}
