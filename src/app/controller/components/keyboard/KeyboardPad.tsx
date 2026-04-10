'use client'

import './KeyboardPad.css';

interface KeyboardPadProps {
  pressedKeys: string[];
  pulseCode: string;
  pulseTick: number;
}

const keyLabels: {label: string; code: string}[] = [
  {label: 'W', code: 'KeyW'},
  {label: 'A', code: 'KeyA'},
  {label: 'S', code: 'KeyS'},
  {label: 'D', code: 'KeyD'},
  {label: 'Q', code: 'KeyQ'},
  {label: 'T', code: 'KeyT'},
  {label: '↑', code: 'ArrowUp'},
  {label: '←', code: 'ArrowLeft'},
  {label: '↓', code: 'ArrowDown'},
  {label: '→', code: 'ArrowRight'},
  {label: 'E', code: 'KeyE'},
  {label: 'Space', code: 'Space'},
];

function KeyboardPad({pressedKeys, pulseCode, pulseTick}: KeyboardPadProps) {
  return (
    <div className="keyboard-wrap">
      <div className="keyboard-card">
        <div className="keyboard-grid">
          {keyLabels.map((item) => {
            const isPressed = pressedKeys.includes(item.code);
            const isPulse = pulseCode === item.code;
            return (
              <div
                key={isPulse ? `${item.code}-${pulseTick}` : item.code}
                className={`keyboard-key ${isPressed ? 'is-pressed' : ''} ${isPulse ? 'is-pulse' : ''} ${item.code === 'Space' ? 'key-space' : ''}`}
              >
                {item.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default KeyboardPad;
