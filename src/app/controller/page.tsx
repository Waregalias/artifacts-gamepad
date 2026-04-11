'use client'

import * as React from "react";
import {useCallback, useEffect, useRef, useState} from "react";
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
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
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
  {control: "Arrow Up", action: "Move north (Y - 1)."},
  {control: "Arrow Down", action: "Move south (Y + 1)."},
  {control: "Arrow Left", action: "Move west (X - 1)."},
  {control: "Arrow Right", action: "Move east (X + 1)."},
  {control: "E", action: "Rest action (`rest`)."},
  {control: "Space", action: "Fight action (`fight`)."},
  {control: "Q", action: "Gather action (`gathering`)."},
  {control: "T", action: "Transition action (`transition`)."},
];

const keyboardBindings: Record<string, string> = {
  ArrowUp: 'directionUp',
  ArrowDown: 'directionDown',
  ArrowLeft: 'directionLeft',
  ArrowRight: 'directionRight',
  KeyE: 'buttonUp',
  Space: 'buttonRight',
  KeyQ: 'buttonLeft',
  KeyT: 'buttonDown',
};

function ControllerPage() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<HTMLDivElement | null>(null);
  const dragCleanupRef = useRef<(() => void) | null>(null);
  const draggingRef = useRef<{offsetX: number; offsetY: number}>({offsetX: 0, offsetY: 0});
  const [isElectron, setIsElectron] = useState(false);
  const [leftMenuOpen, setLeftMenuOpen] = useState(true);
  const [controlsPosition, setControlsPosition] = useState({x: 0, y: 0});
  const [controlsReady, setControlsReady] = useState(false);
  const [pressedKeys, setPressedKeys] = useState<string[]>([]);
  const [lastPressedKey, setLastPressedKey] = useState<string>('');
  const [lastPressedTick, setLastPressedTick] = useState<number>(0);
  const [loadingRefresh, setLoadingRefresh] = useState<boolean>(false)
  const [loadingEvent, setLoadingEvent] = useState<boolean>(false)
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customMethod, setCustomMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('POST');
  const [customRoute, setCustomRoute] = useState('/action/unequip');
  const [customPayload, setCustomPayload] = useState('');
  const [customSending, setCustomSending] = useState(false);
  const [customResponse, setCustomResponse] = useState('');
  const apiKey = useStore((state) => state.apiKey);
  const currentCharacter = useStore((state) => state.character);
  const controlMode = useStore((state) => state.controlMode);
  const setControlMode = useStore((state) => state.setControlMode);
  const updateArtifactCharacter = useStore((state) => state.updateArtifactCharacter);

  useEffect(() => {
    setIsElectron(Boolean(window.electronAPI?.isElectron));
  }, []);

  const clampControlsPosition = useCallback((x: number, y: number) => {
    const stage = stageRef.current;
    const controls = controlsRef.current;
    if (!stage || !controls) {
      return {x, y};
    }

    const margin = 10;
    const maxX = Math.max(margin, stage.clientWidth - controls.offsetWidth - margin);
    const maxY = Math.max(margin, stage.clientHeight - controls.offsetHeight - margin);

    return {
      x: Math.min(Math.max(x, margin), maxX),
      y: Math.min(Math.max(y, margin), maxY),
    };
  }, []);

  const setDefaultControlsPosition = useCallback(() => {
    if (window.matchMedia("(max-width: 920px)").matches) {
      setControlsReady(false);
      return;
    }

    const stage = stageRef.current;
    const controls = controlsRef.current;
    if (!stage || !controls) {
      return;
    }

    const topOffset = 16;
    const nextX = stage.clientWidth * 0.4 - (controls.offsetWidth / 2);
    const nextY = topOffset;
    setControlsPosition(clampControlsPosition(nextX, nextY));
    setControlsReady(true);
  }, [clampControlsPosition]);

  useEffect(() => {
    const timer = window.setTimeout(setDefaultControlsPosition, 30);

    const onResize = () => {
      if (window.matchMedia("(max-width: 920px)").matches) {
        setControlsReady(false);
        return;
      }

      setControlsReady(true);
      setControlsPosition((prev) => clampControlsPosition(prev.x, prev.y));
      if (!controlsReady) {
        setDefaultControlsPosition();
      }
    };

    window.addEventListener('resize', onResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, [clampControlsPosition, controlsReady, setDefaultControlsPosition]);

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

    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }
      const tagName = target.tagName.toLowerCase();
      return (
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        target.isContentEditable
      );
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || isEditableTarget(event.target)) {
        return;
      }
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
      if (isEditableTarget(event.target)) {
        return;
      }
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

  function triggerVirtualKey(code: string) {
    const mappedAction = keyboardBindings[code];
    if (!mappedAction || controlMode !== 'keyboard') {
      return;
    }

    setPressedKeys((prev) => (prev.includes(code) ? prev : [...prev, code]));
    setLastPressedKey(code);
    setLastPressedTick(Date.now());
    runAction(mappedAction);
    setTimeout(() => {
      setPressedKeys((prev) => prev.filter((key) => key !== code));
    }, 140);
  }

  function startControlsDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (window.matchMedia("(max-width: 920px)").matches) {
      return;
    }

    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    event.preventDefault();
    const stageRect = stage.getBoundingClientRect();
    const pointerX = event.clientX - stageRect.left;
    const pointerY = event.clientY - stageRect.top;
    draggingRef.current = {
      offsetX: pointerX - controlsPosition.x,
      offsetY: pointerY - controlsPosition.y,
    };

    const onMove = (moveEvent: PointerEvent) => {
      const activeStage = stageRef.current;
      if (!activeStage) {
        return;
      }
      const activeRect = activeStage.getBoundingClientRect();
      const x = moveEvent.clientX - activeRect.left - draggingRef.current.offsetX;
      const y = moveEvent.clientY - activeRect.top - draggingRef.current.offsetY;
      setControlsPosition(clampControlsPosition(x, y));
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      dragCleanupRef.current = null;
    };

    dragCleanupRef.current = onUp;
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  async function sendCustomRequest() {
    if (!apiKey || !currentCharacter?.name) {
      toast({
        title: "Please save your API key and character first.",
      });
      return;
    }

    const route = customRoute.trim();
    if (!route) {
      toast({
        title: "Route is required.",
      });
      return;
    }

    const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
    const baseUrl = `https://api.artifactsmmo.com/my/${currentCharacter.name}${normalizedRoute}`;
    const isReadMode = customMethod === 'GET' || customMethod === 'DELETE';
    let finalUrl = baseUrl;
    const requestInit: RequestInit = {
      method: customMethod,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    };

    try {
      if (customPayload.trim()) {
        if (isReadMode) {
          const parsed = JSON.parse(customPayload) as Record<string, string | number | boolean>;
          const search = new URLSearchParams();
          Object.entries(parsed).forEach(([key, value]) => {
            search.set(key, String(value));
          });
          const queryString = search.toString();
          if (queryString) {
            finalUrl = `${baseUrl}?${queryString}`;
          }
        } else {
          requestInit.headers = {
            ...requestInit.headers,
            'Content-Type': 'application/json',
          };
          requestInit.body = JSON.stringify(JSON.parse(customPayload));
        }
      }
    } catch {
      toast({
        title: `${isReadMode ? 'Params' : 'Body'} must be valid JSON.`,
      });
      return;
    }

    setCustomSending(true);
    try {
      const response = await fetch(finalUrl, requestInit);
      const json = await response.json().catch(() => ({}));
      setCustomResponse(JSON.stringify({
        status: response.status,
        ok: response.ok,
        data: json,
      }, null, 2));

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: `Request failed (${response.status})`,
        });
      } else {
        toast({
          title: `Request sent (${response.status})`,
        });
      }
    } catch (error) {
      setCustomResponse(JSON.stringify({
        error: (error as Error).message,
      }, null, 2));
      toast({
        variant: "destructive",
        title: "Request failed",
      });
    } finally {
      setCustomSending(false);
    }
  }

  useEffect(() => {
    return () => {
      dragCleanupRef.current?.();
    };
  }, []);

  return (
    <section className="controller-shell">
      <div ref={stageRef} className="controller-stage">
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

        <div
          ref={controlsRef}
          className="controller-float-controls"
          style={controlsReady ? {left: `${controlsPosition.x}px`, top: `${controlsPosition.y}px`} : undefined}
        >
          <div className="controller-controls-drag" onPointerDown={startControlsDrag}>
            Drag controls
          </div>
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
              onVirtualKeyPress={triggerVirtualKey}
              onOpenCustomModal={() => setCustomModalOpen(true)}
            />
          )}
          {loadingEvent && (
            <div className="controller-action-spinner">
              <Spinner/>
            </div>
          )}
        </div>
      </div>

      <Dialog open={customModalOpen} onOpenChange={setCustomModalOpen}>
        <DialogContent className="controller-custom-modal">
          <DialogHeader>
            <DialogTitle>Custom API Request</DialogTitle>
            <DialogDescription>
              Base URL: `https://api.artifactsmmo.com/my/{currentCharacter?.name || 'CHARACTER_NAME'}`
            </DialogDescription>
          </DialogHeader>

          <div className="controller-custom-grid">
            <div>
              <label className="controller-custom-label">Method</label>
              <Select value={customMethod} onValueChange={(value) => setCustomMethod(value as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')}>
                <SelectTrigger>
                  <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="controller-custom-label">Route (after character name)</label>
              <Input
                value={customRoute}
                onChange={(event) => setCustomRoute(event.target.value)}
                placeholder="/action/unequip"
              />
            </div>

            <div>
              <label className="controller-custom-label">{customMethod === 'GET' || customMethod === 'DELETE' ? 'Params (JSON)' : 'Body (JSON)'}</label>
              <Textarea
                value={customPayload}
                onChange={(event) => setCustomPayload(event.target.value)}
                placeholder={customMethod === 'GET' || customMethod === 'DELETE'
                  ? '{"slot":"weapon_slot"}'
                  : '{"slot":"weapon_slot"}'}
                className="controller-custom-textarea"
              />
            </div>

            <div>
              <label className="controller-custom-label">Response</label>
              <Textarea
                value={customResponse}
                readOnly
                className="controller-custom-textarea controller-custom-response"
                placeholder="Response will appear here"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" onClick={sendCustomRequest} disabled={customSending}>
              {!customSending && 'Send'}
              {customSending && <Spinner/>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export default ControllerPage
