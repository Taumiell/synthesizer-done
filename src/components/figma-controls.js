import { attachSwitchFlicker } from './switch-flicker.js';
import { createParameterControl } from './parameter.js';
import { formatParameter } from '../music/controls.js';
const asset = (name) => `${import.meta.env.BASE_URL}figma/${name}`;

export function createKitButton(text, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'kit-button';
  button.textContent = text;
  if (onClick) button.addEventListener('click', onClick);
  return button;
}

export function createKitSwitch(label, enabled, onChange, variant = 'switch') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `kit-${variant}`;
  button.setAttribute('role', 'switch');
  button.setAttribute('aria-label', label);
  if (variant === 'switch') {
    button.innerHTML = `<img class="switch-art switch-on" src="${asset('switch-default.svg')}" width="152.018" height="104.209" alt="" /><img class="switch-art switch-light" src="${asset('switch-light.svg')}" width="226" height="179" alt="" /><img class="switch-art switch-off" src="${asset('switch-variant2.svg')}" width="152.018" height="104.209" alt="" />`;
  } else
    button.innerHTML =
      '<span class="toggle-well"><span class="toggle-ball"></span></span>';
  const flicker = variant === 'switch' ? attachSwitchFlicker(button) : null;
  const paint = () => button.setAttribute('aria-checked', String(enabled));
  button.addEventListener('click', () => {
    enabled = !enabled;
    paint();
    onChange(enabled);
  });
  paint();
  return {
    element: button,
    dispose: () => flicker?.dispose(),
    setEnabled(value) {
      enabled = value;
      paint();
    },
  };
}

export function createKitSlider(track, control, onChange) {
  const wrapper = document.createElement('div');
  wrapper.className = 'kit-slider-field';
  const id = `kit-${track.id}-${control.key}`;
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = control.label;
  const housing = document.createElement('div');
  housing.className = 'kit-slider';
  const rail = document.createElement('div');
  rail.className = 'kit-slider-rail';
  const handle = document.createElement('img');
  handle.src = asset('slider-handle.svg');
  handle.width = 25.2983;
  handle.height = 47.5;
  handle.alt = '';
  handle.className = 'kit-slider-handle';
  const input = document.createElement('input');
  Object.assign(input, {
    id,
    type: 'range',
    min: control.min,
    max: control.max,
    step: control.step,
    value: control.value,
  });
  input.setAttribute('aria-label', `${control.label}: ${track.name}`);
  const paint = () => {
    housing.style.setProperty(
      '--value',
      (Number(input.value) - control.min) / (control.max - control.min),
    );
    input.setAttribute('aria-valuetext', formatParameter(control, Number(input.value)));
  };
  input.addEventListener('input', () => {
    paint();
    onChange(track.id, control.key, Number(input.value));
  });
  rail.append(handle, input);
  housing.append(rail);
  wrapper.append(label, housing);
  paint();
  const resize = new ResizeObserver((entries) => {
    // Figma's thumb occupies about half the housing height, including its shadow.
    const height = entries[0].contentRect.height;
    housing.style.setProperty('--handle-scale', (height * 0.48) / 47.5);
  });
  resize.observe(housing);
  return wrapper;
}

export function createKitKnob(track, control, onChange) {
  // Reuse the original drag/keyboard logic and audio callback.
  const wrapper = createParameterControl(track, control, onChange);
  wrapper.classList.add('kit-knob-field');
  const button = wrapper.querySelector('button');
  button.classList.add('kit-knob');
  button.innerHTML = `<span class="kit-knob-rotor"><img class="knob-body" src="${asset('knob-body.svg')}" width="176" height="185.513" alt="" /><img class="knob-marker" src="${asset('knob-marker.svg')}" width="13.4737" height="53.0526" alt="" /><span class="knob-cap"><img class="knob-center" src="${asset('knob-center.svg')}" width="95.786" height="95.953" alt="" /></span></span>`;
  wrapper.append(wrapper.querySelector('label'));
  return wrapper;
}

export function createKitMeter(label) {
  const meter = document.createElement('div');
  meter.className = 'kit-meter';
  meter.setAttribute('role', 'meter');
  meter.setAttribute('aria-label', label);
  meter.setAttribute('aria-valuemin', '0');
  meter.setAttribute('aria-valuemax', '100');
  const bars = document.createElement('div');
  bars.className = 'kit-meter-bars';
  let segments = [];
  meter.append(bars);
  let previous = -1;
  let level = 0;
  const paint = () => {
    const count = Math.round(level * segments.length);
    if (count === previous) return;
    previous = count;
    segments.forEach((segment, index) => segment.classList.toggle('lit', index < count));
    meter.setAttribute('aria-valuenow', String(Math.round(level * 100)));
  };
  const resize = new ResizeObserver((entries) => {
    const { width, height } = entries[0].contentRect;
    // Reference: 4px bars / 4px gaps at 25px bar height in Figma.
    const thickness = 4 * Math.max(0.65, Math.min(1, height / 25));
    const count = Math.max(1, Math.round((width + thickness) / (2 * thickness)));
    bars.style.gap = `${thickness}px`;
    bars.style.gridTemplateColumns = `repeat(${count}, minmax(0, 1fr))`;
    if (count !== segments.length) {
      segments = Array.from({ length: count }, () => document.createElement('span'));
      bars.replaceChildren(...segments);
      previous = -1;
    }
    paint();
  });
  resize.observe(bars);
  return {
    element: meter,
    update(value) {
      level = Math.min(1, Math.sqrt(Math.max(0, value)));
      paint();
    },
  };
}
