// Each powered switch has its own irregular, short interruptions of the steady light.
export function attachSwitchFlicker(button) {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const phase = Math.random() * 1100;
  let timer;
  let running = false;
  const eligible = () =>
    button.getAttribute('aria-checked') === 'true' &&
    !button.disabled &&
    !document.hidden &&
    !motion.matches;
  const later = (callback, delay) => {
    timer = setTimeout(callback, delay);
  };
  const pause = () => {
    clearTimeout(timer);
    running = false;
    button.classList.remove('switch-flicker-off');
  };
  const schedule = () => {
    later(
      () => burst(4),
      2800 + phase + Math.random() * 2600,
    );
  };
  function burst(remaining) {
    if (!eligible()) {
      pause();
      return;
    }
    button.classList.add('switch-flicker-off');
    later(
      () => {
        button.classList.remove('switch-flicker-off');
        if (remaining > 1) later(() => burst(remaining - 1), 70 + Math.random() * 85);
        else schedule();
      },
      35 + Math.random() * 45,
    );
  }
  const sync = () => {
    if (!eligible()) pause();
    else if (!running) {
      running = true;
      schedule();
    }
  };
  const observer = new MutationObserver(sync);
  observer.observe(button, {
    attributes: true,
    attributeFilter: ['aria-checked', 'disabled'],
  });
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  return {
    dispose() {
      pause();
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      motion.removeEventListener('change', sync);
    },
  };
}
