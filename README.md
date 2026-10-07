# Synthesizer — After Us

Веб-синтезатор о мире после исчезновения человечества. Четыре голоса: Main Synth, Signal Synth, Bird Synth и Rain Synth. JavaScript, Tone.js и Vite.

## Запуск

Нужен Node.js 22.12 или новее.

```sh
npm ci
npm run dev
```

## Управление

Главный Toggle запускает и останавливает все голоса. Рыжие Switch включают и выключают отдельные голоса. Ползунки регулируют громкость и параметры; крутилки управляются движением вверх/вниз или стрелками клавиатуры. При общей остановке контролы блокируются.

## Сборка и проверка

```sh
npm run build
npm run preview
node --test tests/controls.test.js
```

## Источники

- Птицы: [Bird song early morning long — Rimmer](https://freesound.org/people/Rimmer/sounds/614924/), CC0.
- Дождь: [Gentle Rain Mix (2018) — esh9419 / jmbphilmes](https://freesound.org/people/esh9419/sounds/417616/), CC0.
- Учебная основа аудиоструктуры: [ZakharDay, Tutorial 5](https://github.com/ZakharDay/ADC-GID-26-27/tree/main/tutorial_5).
- Дизайн интерфейса: авторский макет Figma. Шрифт: TT Hoves Pro Educational Expanded Bold, учебная версия.
