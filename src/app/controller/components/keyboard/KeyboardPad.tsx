'use client'

import './KeyboardPad.css';

interface KeyboardPadProps {
  pressedKeys: string[];
  pulseCode: string;
  pulseTick: number;
  onVirtualKeyPress: (code: string) => void;
  onOpenCustomModal: () => void;
}

const keyLabels: {label: string; code: string}[] = [
  {label: 'Q', code: 'KeyQ'},
  {label: 'T', code: 'KeyT'},
  {label: '↑', code: 'ArrowUp'},
  {label: '←', code: 'ArrowLeft'},
  {label: '↓', code: 'ArrowDown'},
  {label: '→', code: 'ArrowRight'},
  {label: 'E', code: 'KeyE'},
  {label: 'Space', code: 'Space'},
  {label: 'Custom', code: 'CustomAction'},
];

function KeyboardPad({pressedKeys, pulseCode, pulseTick, onVirtualKeyPress, onOpenCustomModal}: KeyboardPadProps) {
  return (
    <div className="keyboard-wrap">
      <div className="keyboard-card">
        <div className="keyboard-grid">
          {keyLabels.map((item) => {
            const isPressed = pressedKeys.includes(item.code);
            const isPulse = pulseCode === item.code;
            const isCustom = item.code === 'CustomAction';
            return (
              <button
                type="button"
                key={isPulse ? `${item.code}-${pulseTick}` : item.code}
                className={`keyboard-key ${isPressed ? 'is-pressed' : ''} ${isPulse ? 'is-pulse' : ''} ${item.code === 'Space' ? 'key-space' : ''} ${isCustom ? 'key-custom' : ''}`}
                onClick={() => (isCustom ? onOpenCustomModal() : onVirtualKeyPress(item.code))}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default KeyboardPad;
