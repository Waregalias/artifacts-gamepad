'use client'

import dynamic from "next/dynamic";
import type * as React from "react";
import {ControlMode} from "@/store";
import {ArtifactCharacter} from "@/app/controller/models/artifact.model";
import {Move} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Spinner} from "@/components/ui/kibo-ui/spinner";

const Gamepad = dynamic(() => import("@/app/controller/components/gamepad/Gamepad"), {
  ssr: false,
});

const KeyboardPad = dynamic(() => import("@/app/controller/components/keyboard/KeyboardPad"), {
  ssr: false,
});

type FloatingControlsPanelProps = {
  controlsRef: React.Ref<HTMLDivElement>;
  controlsReady: boolean;
  controlsPosition: {x: number; y: number};
  onStartDrag: (event: React.PointerEvent<HTMLDivElement>) => void;
  currentCharacter: ArtifactCharacter | null;
  onRefreshCharacter: () => void;
  loadingRefresh: boolean;
  controlMode: ControlMode;
  onGamePadEvent: (newAction: { [key: string]: boolean }) => void;
  pressedKeys: string[];
  lastPressedKey: string;
  lastPressedTick: number;
  onVirtualKeyPress: (code: string) => void;
  onOpenCustomModal: () => void;
  customLoopRunning: boolean;
  customLoopStopping: boolean;
  onStopCustomLoop: () => void;
  onOpenEditorModal: () => void;
  loadingEvent: boolean;
};

function FloatingControlsPanel({
  controlsRef,
  controlsReady,
  controlsPosition,
  onStartDrag,
  currentCharacter,
  onRefreshCharacter,
  loadingRefresh,
  controlMode,
  onGamePadEvent,
  pressedKeys,
  lastPressedKey,
  lastPressedTick,
  onVirtualKeyPress,
  onOpenCustomModal,
  customLoopRunning,
  customLoopStopping,
  onStopCustomLoop,
  onOpenEditorModal,
  loadingEvent,
}: FloatingControlsPanelProps) {
  return (
    <div
      ref={controlsRef}
      className="controller-float-controls"
      style={controlsReady ? {left: `${controlsPosition.x}px`, top: `${controlsPosition.y}px`} : undefined}
    >
      <div
        className="controller-controls-drag"
        onPointerDown={onStartDrag}
        role="button"
        aria-label="Drag controls"
        title="Drag controls"
      >
        <Move size={16} aria-hidden="true" />
      </div>
      <div className="controller-status">
        <span>Position: x-{currentCharacter?.x ?? '-'} ; y-{currentCharacter?.y ?? '-'}</span>
        <Button type="button" onClick={onRefreshCharacter}>
          {!loadingRefresh && (<span>Refresh</span>)}
          {loadingRefresh && (<Spinner/>)}
        </Button>
      </div>

      {controlMode === 'gamepad' && (
        <Gamepad gamePadEvent={onGamePadEvent}/>
      )}

      {controlMode === 'keyboard' && (
        <KeyboardPad
          pressedKeys={pressedKeys}
          pulseCode={lastPressedKey}
          pulseTick={lastPressedTick}
          onVirtualKeyPress={onVirtualKeyPress}
          onOpenCustomModal={onOpenCustomModal}
          customLoopRunning={customLoopRunning}
          customLoopStopping={customLoopStopping}
          onStopCustomLoop={onStopCustomLoop}
          onOpenEditorModal={onOpenEditorModal}
        />
      )}

      {loadingEvent && (
        <div className="controller-action-spinner">
          <Spinner/>
        </div>
      )}
    </div>
  );
}

export default FloatingControlsPanel;
