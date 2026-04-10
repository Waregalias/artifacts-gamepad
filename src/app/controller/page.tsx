'use client'

import * as React from "react";
import {useCallback, useEffect, useState} from "react";
import {ControlMode, useStore} from "@/app/store";
import {ArtifactCharacter} from "@/app/controller/models/artifact.model";
import {getCharacter} from "@/app/controller/services/api.service";
import {toast} from "@/components/ui/use-toast";
import {Button} from "@/components/ui/button";
import {Spinner} from "@/components/ui/kibo-ui/spinner";
import {actionManager} from "@/app/controller/components/actions/ActionManager";
import dynamic from "next/dynamic";
import SettingsForm from "@/app/components/SettingsForm";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import './style.css';

const Gamepad = dynamic(() => import("@/app/controller/components/gamepad/Gamepad"), {
  ssr: false,
});

const KeyboardPad = dynamic(() => import("@/app/controller/components/keyboard/KeyboardPad"), {
  ssr: false,
});

const gamepadLegend = [
  {control: "D-Pad Up", action: "Move north (Y - 1)."},
  {control: "D-Pad Down", action: "Move south (Y + 1)."},
  {control: "D-Pad Left", action: "Move west (X - 1)."},
  {control: "D-Pad Right", action: "Move east (X + 1)."},
  {control: "Y / Triangle", action: "Rest action (`rest`)."},
  {control: "B / Circle", action: "Fight action (`fight`)."},
  {control: "X / Square", action: "Gather action (`gathering`)."},
  {control: "A / Cross", action: "Transition action (`transition`)."},
  {control: "L1, R1, L2, R2", action: "Currently not bound to an API action."},
  {control: "Start / Select", action: "Currently not bound to an API action."},
];

const keyboardLegend = [
  {control: "W / Arrow Up", action: "Move north (Y - 1)."},
  {control: "S / Arrow Down", action: "Move south (Y + 1)."},
  {control: "A / Arrow Left", action: "Move west (X - 1)."},
  {control: "D / Arrow Right", action: "Move east (X + 1)."},
  {control: "E", action: "Rest action (`rest`)."},
  {control: "Space", action: "Fight action (`fight`)."},
  {control: "Q", action: "Gather action (`gathering`)."},
  {control: "T", action: "Transition action (`transition`)."},
];

const keyboardBindings: Record<string, string> = {
  KeyW: 'directionUp',
  ArrowUp: 'directionUp',
  KeyS: 'directionDown',
  ArrowDown: 'directionDown',
  KeyA: 'directionLeft',
  ArrowLeft: 'directionLeft',
  KeyD: 'directionRight',
  ArrowRight: 'directionRight',
  KeyE: 'buttonUp',
  Space: 'buttonRight',
  KeyQ: 'buttonLeft',
  KeyT: 'buttonDown',
};

function ControllerPage() {
  const [isElectron, setIsElectron] = useState(false);
  const [leftMenuOpen, setLeftMenuOpen] = useState(true);
  const [pressedKeys, setPressedKeys] = useState<string[]>([]);
  const [lastPressedKey, setLastPressedKey] = useState<string>('');
  const [lastPressedTick, setLastPressedTick] = useState<number>(0);
  const [loadingRefresh, setLoadingRefresh] = useState<boolean>(false)
  const [loadingEvent, setLoadingEvent] = useState<boolean>(false)
  const apiKey = useStore((state) => state.apiKey);
  const currentCharacter = useStore((state) => state.character);
  const controlMode = useStore((state) => state.controlMode);
  const setControlMode = useStore((state) => state.setControlMode);
  const updateArtifactCharacter = useStore((state) => state.updateArtifactCharacter);

  useEffect(() => {
    setIsElectron(Boolean(window.electronAPI?.isElectron));
  }, []);

  const runAction = useCallback((key: string) => {
    if (loadingEvent || !apiKey || !currentCharacter?.name) {
      return;
    }

    setLoadingEvent(true);
    actionManager(apiKey, currentCharacter, key)
      .then((result: ArtifactCharacter | void) => {
        if (result) {
          updateArtifactCharacter(apiKey, result);
        }
      })
      .catch((error) => {
        console.error(`Error while executing '${key}' action:`, error);
      })
      .finally(() => {
        setLoadingEvent(false);
      });
  }, [apiKey, currentCharacter, loadingEvent, updateArtifactCharacter]);

  function refreshCharacter() {
    if (!apiKey || !currentCharacter?.name) {
      toast({
        title: "Please save your API key and character first.",
      });
      return;
    }

    setLoadingRefresh(true);
    getCharacter(
      apiKey,
      currentCharacter?.name,
    ).then((character: ArtifactCharacter) => {
      updateArtifactCharacter(apiKey, character);
      setLoadingRefresh(false);
    }).catch(() => {
      toast({
        title: "Error while refreshing character. Please select it again.",
      });
    }).finally(() => {
      setLoadingRefresh(false);
    });
  }

  function handleGamePadEvent(newAction: { [key: string]: boolean }) {
    if (controlMode !== 'gamepad') {
      return;
    }

    const actions = Object.fromEntries(Object.entries(newAction).filter(([, value]) => value));
    const newActions = Object.keys(actions);

    if (newActions.length > 0) {
      runAction(newActions[0]);
    }
  }

  useEffect(() => {
    if (controlMode !== 'keyboard') {
      setPressedKeys([]);
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const mappedAction = keyboardBindings[event.code];
      if (!mappedAction || event.repeat) {
        return;
      }
      event.preventDefault();
      setPressedKeys((prev) => (prev.includes(event.code) ? prev : [...prev, event.code]));
      setLastPressedKey(event.code);
      setLastPressedTick(Date.now());
      runAction(mappedAction);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (!keyboardBindings[event.code]) {
        return;
      }
      setPressedKeys((prev) => prev.filter((key) => key !== event.code));
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [controlMode, runAction]);

  return (
    <section className="controller-shell">
      <div className="controller-stage">
        {isElectron && (
          <webview
            className="controller-game-webview"
            src="https://play.artifactsmmo.com/"
            partition="persist:artifacts-mmo"
            allowpopups="true"
            webpreferences="contextIsolation=yes"
          />
        )}
        {!isElectron && (
          <iframe
            className="controller-game-iframe"
            src="https://play.artifactsmmo.com/"
            title="Artifacts MMO"
            loading="lazy"
            allow="fullscreen; clipboard-read; clipboard-write"
          />
        )}

        <div className="controller-menu-toggle">
          <Button type="button" onClick={() => setLeftMenuOpen((prev) => !prev)}>
            {leftMenuOpen ? 'Hide' : 'Display'} menu
          </Button>
        </div>

        <aside className={`controller-float-panel ${leftMenuOpen ? 'is-open' : 'is-closed'}`}>
          <header className="controller-header">
            <p className="controller-subtitle">Artifacts MMO</p>
            <h1>Gamepad Hub</h1>
          </header>

          <div className="controller-input-mode">
            <h2>Input Mode</h2>
            <Select value={controlMode} onValueChange={(value) => setControlMode(value as ControlMode)}>
              <SelectTrigger className="controller-mode-select">
                <SelectValue/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gamepad">Gamepad</SelectItem>
                <SelectItem value="keyboard">Keyboard / Mouse</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="controller-legend">
            <h2>Controls Legend</h2>
            <p>{controlMode === 'gamepad' ? 'Gamepad mapping' : 'Keyboard mapping'}</p>
            <div className="controller-legend-scroll">
              {(controlMode === 'gamepad' ? gamepadLegend : keyboardLegend).map((item) => (
                <article key={item.control} className="legend-item">
                  <h3>{item.control}</h3>
                  <p>{item.action}</p>
                </article>
              ))}
            </div>
          </div>

          <SettingsForm/>
        </aside>

        <div className="controller-float-controls">
          <div className="controller-status">
            <span>Position: x-{currentCharacter?.x ?? '-'} ; y-{currentCharacter?.y ?? '-'}</span>
            <Button type={"button"} onClick={refreshCharacter}>
              {!loadingRefresh && (<span>Refresh</span>)}
              {loadingRefresh && (<Spinner/>)}
            </Button>
          </div>
          {controlMode === 'gamepad' && (
            <Gamepad gamePadEvent={handleGamePadEvent}/>
          )}
          {controlMode === 'keyboard' && (
            <KeyboardPad
              pressedKeys={pressedKeys}
              pulseCode={lastPressedKey}
              pulseTick={lastPressedTick}
            />
          )}
          {loadingEvent && (
            <div className="controller-action-spinner">
              <Spinner/>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default ControllerPage
