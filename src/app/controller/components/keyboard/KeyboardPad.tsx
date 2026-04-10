'use client'

import './KeyboardPad.css';

interface KeyboardPadProps {
  loading: boolean;
  pressedKeys: string[];
}

const keyLabels: {label: string; code: string}[] = [
  {label: 'W', code: 'KeyW'},
  {label: 'A', code: 'KeyA'},
  {label: 'S', code: 'KeyS'},
  {label: 'D', code: 'KeyD'},
  {label: '↑', code: 'ArrowUp'},
  {label: '←', code: 'ArrowLeft'},
  {label: '↓', code: 'ArrowDown'},
  {label: '→', code: 'ArrowRight'},
  {label: 'E', code: 'KeyE'},
  {label: 'Space', code: 'Space'},
];

function KeyboardPad({loading, pressedKeys}: KeyboardPadProps) {
  return (
    <div className="keyboard-wrap">
      <div className="keyboard-card">
        {loading && <span className="keyboard-loading">Loading...</span>}
        {!loading && (
          <div className="keyboard-grid">
            {keyLabels.map((item) => {
              const isPressed = pressedKeys.includes(item.code);
              return (
                <div
                  key={item.code}
                  className={`keyboard-key ${isPressed ? 'is-pressed' : ''} ${item.code === 'Space' ? 'key-space' : ''}`}
                >
                  {item.label}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default KeyboardPad;
