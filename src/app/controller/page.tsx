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

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

type CustomRoutePreset = {
  key: string;
  method: HttpMethod;
  apiPath: string;
};

const availableCustomRoutes: CustomRoutePreset[] = [
  {key: 'GET /my/characters', method: 'GET', apiPath: '/my/characters'},
  {key: 'GET /my/details', method: 'GET', apiPath: '/my/details'},
  {key: 'GET /my/bank', method: 'GET', apiPath: '/my/bank'},
  {key: 'GET /my/bank/items', method: 'GET', apiPath: '/my/bank/items'},
  {key: 'GET /my/grandexchange/orders', method: 'GET', apiPath: '/my/grandexchange/orders'},
  {key: 'GET /my/grandexchange/history', method: 'GET', apiPath: '/my/grandexchange/history'},
  {key: 'GET /my/pending-items', method: 'GET', apiPath: '/my/pending-items'},
  {key: 'GET /my/logs', method: 'GET', apiPath: '/my/logs'},
  {key: 'GET /my/logs/{name}', method: 'GET', apiPath: '/my/logs/{name}'},
  {key: 'POST /my/change_password', method: 'POST', apiPath: '/my/change_password'},
  {key: 'POST /my/{name}/action/bank/buy_expansion', method: 'POST', apiPath: '/my/{name}/action/bank/buy_expansion'},
  {key: 'POST /my/{name}/action/bank/deposit/gold', method: 'POST', apiPath: '/my/{name}/action/bank/deposit/gold'},
  {key: 'POST /my/{name}/action/bank/deposit/item', method: 'POST', apiPath: '/my/{name}/action/bank/deposit/item'},
  {key: 'POST /my/{name}/action/bank/withdraw/gold', method: 'POST', apiPath: '/my/{name}/action/bank/withdraw/gold'},
  {key: 'POST /my/{name}/action/bank/withdraw/item', method: 'POST', apiPath: '/my/{name}/action/bank/withdraw/item'},
  {key: 'POST /my/{name}/action/change_skin', method: 'POST', apiPath: '/my/{name}/action/change_skin'},
  {key: 'POST /my/{name}/action/claim_item/{id}', method: 'POST', apiPath: '/my/{name}/action/claim_item/{id}'},
  {key: 'POST /my/{name}/action/crafting', method: 'POST', apiPath: '/my/{name}/action/crafting'},
  {key: 'POST /my/{name}/action/delete', method: 'POST', apiPath: '/my/{name}/action/delete'},
  {key: 'POST /my/{name}/action/equip', method: 'POST', apiPath: '/my/{name}/action/equip'},
  {key: 'POST /my/{name}/action/fight', method: 'POST', apiPath: '/my/{name}/action/fight'},
  {key: 'POST /my/{name}/action/gathering', method: 'POST', apiPath: '/my/{name}/action/gathering'},
  {key: 'POST /my/{name}/action/give/gold', method: 'POST', apiPath: '/my/{name}/action/give/gold'},
  {key: 'POST /my/{name}/action/give/item', method: 'POST', apiPath: '/my/{name}/action/give/item'},
  {key: 'POST /my/{name}/action/grandexchange/buy', method: 'POST', apiPath: '/my/{name}/action/grandexchange/buy'},
  {key: 'POST /my/{name}/action/grandexchange/cancel', method: 'POST', apiPath: '/my/{name}/action/grandexchange/cancel'},
  {key: 'POST /my/{name}/action/grandexchange/create-buy-order', method: 'POST', apiPath: '/my/{name}/action/grandexchange/create-buy-order'},
  {key: 'POST /my/{name}/action/grandexchange/create-sell-order', method: 'POST', apiPath: '/my/{name}/action/grandexchange/create-sell-order'},
  {key: 'POST /my/{name}/action/grandexchange/fill', method: 'POST', apiPath: '/my/{name}/action/grandexchange/fill'},
  {key: 'POST /my/{name}/action/move', method: 'POST', apiPath: '/my/{name}/action/move'},
  {key: 'POST /my/{name}/action/npc/buy', method: 'POST', apiPath: '/my/{name}/action/npc/buy'},
  {key: 'POST /my/{name}/action/npc/sell', method: 'POST', apiPath: '/my/{name}/action/npc/sell'},
  {key: 'POST /my/{name}/action/recycling', method: 'POST', apiPath: '/my/{name}/action/recycling'},
  {key: 'POST /my/{name}/action/rest', method: 'POST', apiPath: '/my/{name}/action/rest'},
  {key: 'POST /my/{name}/action/task/cancel', method: 'POST', apiPath: '/my/{name}/action/task/cancel'},
  {key: 'POST /my/{name}/action/task/complete', method: 'POST', apiPath: '/my/{name}/action/task/complete'},
  {key: 'POST /my/{name}/action/task/exchange', method: 'POST', apiPath: '/my/{name}/action/task/exchange'},
  {key: 'POST /my/{name}/action/task/new', method: 'POST', apiPath: '/my/{name}/action/task/new'},
  {key: 'POST /my/{name}/action/task/trade', method: 'POST', apiPath: '/my/{name}/action/task/trade'},
  {key: 'POST /my/{name}/action/transition', method: 'POST', apiPath: '/my/{name}/action/transition'},
  {key: 'POST /my/{name}/action/unequip', method: 'POST', apiPath: '/my/{name}/action/unequip'},
  {key: 'POST /my/{name}/action/use', method: 'POST', apiPath: '/my/{name}/action/use'},
];

const routeQueryTemplates: Record<string, string> = {
  '/my/bank/items': 'item_code=wooden_sword&page=1&size=20',
  '/my/grandexchange/orders': 'code=wooden_sword&type=buy&page=1&size=20',
  '/my/grandexchange/history': 'id=order_id&code=wooden_sword&page=1&size=20',
  '/my/pending-items': 'page=1&size=20',
  '/my/logs': 'page=1&size=20',
  '/my/logs/{name}': 'page=1&size=20',
};

const routeBodyTemplates: Record<string, string> = {
  '/my/change_password': JSON.stringify({current_password: 'current_password', new_password: 'new_password'}, null, 2),
  '/my/{name}/action/move': JSON.stringify({x: 1, y: 1}, null, 2),
  '/my/{name}/action/equip': JSON.stringify({code: 'wooden_sword', slot: 'weapon_slot', quantity: 1}, null, 2),
  '/my/{name}/action/unequip': JSON.stringify({slot: 'weapon_slot', quantity: 1}, null, 2),
  '/my/{name}/action/use': JSON.stringify({code: 'small_health_potion', quantity: 1}, null, 2),
  '/my/{name}/action/fight': JSON.stringify({participants: []}, null, 2),
  '/my/{name}/action/crafting': JSON.stringify({code: 'copper_bar', quantity: 1}, null, 2),
  '/my/{name}/action/bank/deposit/gold': JSON.stringify({quantity: 100}, null, 2),
  '/my/{name}/action/bank/deposit/item': JSON.stringify({code: 'copper_ore', quantity: 1}, null, 2),
  '/my/{name}/action/bank/withdraw/item': JSON.stringify({code: 'copper_ore', quantity: 1}, null, 2),
  '/my/{name}/action/bank/withdraw/gold': JSON.stringify({quantity: 100}, null, 2),
  '/my/{name}/action/npc/buy': JSON.stringify({code: 'small_health_potion', quantity: 1}, null, 2),
  '/my/{name}/action/npc/sell': JSON.stringify({code: 'small_health_potion', quantity: 1}, null, 2),
  '/my/{name}/action/recycling': JSON.stringify({code: 'copper_sword', quantity: 1}, null, 2),
  '/my/{name}/action/grandexchange/buy': JSON.stringify({id: 'order_id', quantity: 1}, null, 2),
  '/my/{name}/action/grandexchange/create-sell-order': JSON.stringify({code: 'copper_ore', quantity: 10, price: 5}, null, 2),
  '/my/{name}/action/grandexchange/cancel': JSON.stringify({id: 'order_id'}, null, 2),
  '/my/{name}/action/grandexchange/create-buy-order': JSON.stringify({code: 'copper_ore', quantity: 10, price: 5}, null, 2),
  '/my/{name}/action/grandexchange/fill': JSON.stringify({id: 'order_id', quantity: 1}, null, 2),
  '/my/{name}/action/task/trade': JSON.stringify({code: 'task_token', quantity: 1}, null, 2),
  '/my/{name}/action/give/gold': JSON.stringify({character: 'target_character', quantity: 1}, null, 2),
  '/my/{name}/action/give/item': JSON.stringify({character: 'target_character', items: [{code: 'copper_ore', quantity: 1}]}, null, 2),
  '/my/{name}/action/delete': JSON.stringify({code: 'copper_ore', quantity: 1}, null, 2),
  '/my/{name}/action/change_skin': JSON.stringify({skin: 'men1'}, null, 2),
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
  const [customMethod, setCustomMethod] = useState<HttpMethod>('POST');
  const [customRoutePreset, setCustomRoutePreset] = useState('POST /my/{name}/action/unequip');
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
    const baseUrl = normalizedRoute.startsWith('/my/')
      ? `https://api.artifactsmmo.com${normalizedRoute}`
      : `https://api.artifactsmmo.com/my/${currentCharacter.name}${normalizedRoute}`;
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
            finalUrl = baseUrl.includes('?') ? `${baseUrl}&${queryString}` : `${baseUrl}?${queryString}`;
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

  function applyRoutePreset(presetKey: string) {
    setCustomRoutePreset(presetKey);
    const selectedRoute = availableCustomRoutes.find((item) => item.key === presetKey);
    if (!selectedRoute) {
      return;
    }

    setCustomMethod(selectedRoute.method);

    let routeInput = selectedRoute.apiPath;
    if (routeInput.startsWith('/my/{name}')) {
      routeInput = routeInput.replace('/my/{name}', '');
    }
    if (routeInput.includes('{id}')) {
      routeInput = routeInput.replace('{id}', '1');
    }
    if (routeInput.includes('{name}')) {
      routeInput = routeInput.replace('{name}', currentCharacter?.name || 'character_name');
    }

    if (selectedRoute.method === 'GET' || selectedRoute.method === 'DELETE') {
      const queryTemplate = routeQueryTemplates[selectedRoute.apiPath];
      setCustomRoute(queryTemplate ? `${routeInput}?${queryTemplate}` : routeInput);
      setCustomPayload('');
      return;
    }

    setCustomRoute(routeInput);
    setCustomPayload(routeBodyTemplates[selectedRoute.apiPath] || '');
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
              onOpenCustomModal={() => {
                applyRoutePreset(customRoutePreset);
                setCustomModalOpen(true);
              }}
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
              Character base: `https://api.artifactsmmo.com/my/{currentCharacter?.name || 'CHARACTER_NAME'}` (you can also use full `/my/...` routes).
            </DialogDescription>
          </DialogHeader>

          <div className="controller-custom-grid">
            <div>
              <label className="controller-custom-label">Route Presets</label>
              <Select value={customRoutePreset} onValueChange={applyRoutePreset}>
                <SelectTrigger>
                  <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                  {availableCustomRoutes.map((item) => (
                    <SelectItem key={item.key} value={item.key}>
                      {item.key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="controller-custom-label">Method</label>
              <Select value={customMethod} onValueChange={(value) => setCustomMethod(value as HttpMethod)}>
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
              <label className="controller-custom-label">Route</label>
              <Input
                value={customRoute}
                onChange={(event) => setCustomRoute(event.target.value)}
                placeholder="/action/unequip or /my/bank/items?page=1&size=20"
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
