'use client'

import './KeyboardPad.css';

interface KeyboardPadProps {
  pressedKeys: string[];
  pulseCode: string;
  pulseTick: number;
  onVirtualKeyPress: (code: string) => void;
  onOpenCustomModal: () => void;
  customLoopRunning: boolean;
  customLoopStopping: boolean;
  onStopCustomLoop: () => void;
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

function KeyboardPad({
  pressedKeys,
  pulseCode,
  pulseTick,
  onVirtualKeyPress,
  onOpenCustomModal,
  customLoopRunning,
  customLoopStopping,
  onStopCustomLoop,
}: KeyboardPadProps) {
  return (
    <div className="keyboard-wrap">
      <div className="keyboard-card">
        <div className="keyboard-grid">
          {keyLabels.map((item) => {
            const isPressed = pressedKeys.includes(item.code);
            const isPulse = pulseCode === item.code;
            const isCustom = item.code === 'CustomAction';
            const isLoopButton = isCustom && customLoopRunning;
            return (
              <button
                type="button"
                key={isPulse ? `${item.code}-${pulseTick}` : item.code}
                className={`keyboard-key ${isPressed ? 'is-pressed' : ''} ${isPulse ? 'is-pulse' : ''} ${item.code === 'Space' ? 'key-space' : ''} ${isCustom ? 'key-custom' : ''} ${isLoopButton ? 'key-custom-loop' : ''}`}
                onClick={() => {
                  if (isCustom) {
                    if (customLoopRunning) {
                      onStopCustomLoop();
                    } else {
                      onOpenCustomModal();
                    }
                    return;
                  }
                  onVirtualKeyPress(item.code);
                }}
              >
                {isLoopButton
                  ? (
                    <span className="keyboard-loop-content">
                      <span className={`keyboard-loop-loader ${customLoopStopping ? 'is-stopping' : ''}`}/>
                      <span>{customLoopStopping ? 'Stopping...' : 'Stop'}</span>
                    </span>
                  )
                  : item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default KeyboardPad;
