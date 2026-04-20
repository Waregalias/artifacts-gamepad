'use client'

import * as React from "react";
import {useCallback, useEffect, useRef, useState} from "react";
import {useStore} from "@/app/store";
import {ArtifactCharacter} from "@/app/controller/models/artifact.model";
import {getCharacter} from "@/app/controller/services/api.service";
import {toast} from "@/components/ui/use-toast";
import {Button} from "@/components/ui/button";
import {actionManager} from "@/app/controller/components/actions/ActionManager";
import ControllerSidebar from "@/app/controller/components/sidebar/ControllerSidebar";
import FloatingControlsPanel from "@/app/controller/components/controls/FloatingControlsPanel";
import CustomRequestModal from "@/app/controller/components/custom/CustomRequestModal";
import {
  availableCustomRoutes,
  HttpMethod,
  routeBodyTemplates,
  routeQueryTemplates
} from "@/app/controller/constants/custom-routes";
import './style.css';

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

type PreparedCustomRequest = {
  finalUrl: string;
  requestInit: RequestInit;
};

type CustomRequestResult = {
  status: number;
  ok: boolean;
  data: unknown;
  cooldownSeconds: number;
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
  const [customLoopRunning, setCustomLoopRunning] = useState(false);
  const [customLoopStopping, setCustomLoopStopping] = useState(false);
  const customLoopStopRef = useRef(false);
  const customLoopAbortRef = useRef<AbortController | null>(null);
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

  function buildCustomRequestFromState(): PreparedCustomRequest | null {
    if (!apiKey || !currentCharacter?.name) {
      toast({
        title: "Please save your API key and character first.",
      });
      return null;
    }

    const route = customRoute.trim();
    if (!route) {
      toast({
        title: "Route is required.",
      });
      return null;
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
      return null;
    }

    return {
      finalUrl,
      requestInit,
    };
  }

  function getCooldownSeconds(data: unknown): number {
    if (!data || typeof data !== 'object') {
      return 0;
    }
    const root = data as {
      data?: {
        cooldown?: {
          remaining_seconds?: number | string;
        };
      };
    };
    const rawValue = root.data?.cooldown?.remaining_seconds;
    if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
      return Math.max(0, rawValue);
    }
    if (typeof rawValue === 'string') {
      const parsed = Number(rawValue);
      if (Number.isFinite(parsed)) {
        return Math.max(0, parsed);
      }
    }
    return 0;
  }

  async function executeCustomRequest(prepared: PreparedCustomRequest, signal?: AbortSignal): Promise<CustomRequestResult> {
    const {finalUrl, requestInit} = prepared;
    const response = await fetch(finalUrl, {...requestInit, signal});
    const json = await response.json().catch(() => ({}));
    const result: CustomRequestResult = {
      status: response.status,
      ok: response.ok,
      data: json,
      cooldownSeconds: getCooldownSeconds(json),
    };
    setCustomResponse(JSON.stringify({
      status: result.status,
      ok: result.ok,
      data: result.data,
      cooldownSeconds: result.cooldownSeconds,
    }, null, 2));
    return result;
  }

  async function sendCustomRequest() {
    const prepared = buildCustomRequestFromState();
    if (!prepared) {
      return;
    }

    setCustomSending(true);
    try {
      const result = await executeCustomRequest(prepared);

      if (!result.ok) {
        toast({
          variant: "destructive",
          title: `Request failed (${result.status})`,
        });
      } else {
        toast({
          title: `Request sent (${result.status})`,
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

  async function sleepWithStop(seconds: number) {
    const delay = Math.max(0, Math.floor(seconds * 1000));
    const start = Date.now();
    while (!customLoopStopRef.current && Date.now() - start < delay) {
      const remaining = delay - (Date.now() - start);
      await new Promise((resolve) => window.setTimeout(resolve, Math.min(250, remaining)));
    }
  }

  async function startCustomLoop() {
    if (customLoopRunning || customSending) {
      return;
    }
    const prepared = buildCustomRequestFromState();
    if (!prepared) {
      return;
    }

    customLoopStopRef.current = false;
    setCustomLoopStopping(false);
    setCustomLoopRunning(true);
    setCustomModalOpen(false);

    toast({
      title: 'Loop started',
    });

    try {
      while (!customLoopStopRef.current) {
        const abortController = new AbortController();
        customLoopAbortRef.current = abortController;
        const result = await executeCustomRequest(prepared, abortController.signal);

        if (!result.ok) {
          toast({
            variant: "destructive",
            title: `Loop stopped on error (${result.status})`,
          });
          break;
        }

        await sleepWithStop(result.cooldownSeconds);
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setCustomResponse(JSON.stringify({
          error: (error as Error).message,
        }, null, 2));
        toast({
          variant: "destructive",
          title: "Loop failed",
        });
      }
    } finally {
      customLoopAbortRef.current = null;
      customLoopStopRef.current = false;
      setCustomLoopRunning(false);
      setCustomLoopStopping(false);
      toast({
        title: 'Loop stopped',
      });
    }
  }

  function stopCustomLoop() {
    if (!customLoopRunning || customLoopStopRef.current) {
      return;
    }
    customLoopStopRef.current = true;
    setCustomLoopStopping(true);
    customLoopAbortRef.current?.abort();
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
      customLoopStopRef.current = true;
      customLoopAbortRef.current?.abort();
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

        <ControllerSidebar
          leftMenuOpen={leftMenuOpen}
          controlMode={controlMode}
          onControlModeChange={setControlMode}
        />

        <FloatingControlsPanel
          controlsRef={controlsRef}
          controlsReady={controlsReady}
          controlsPosition={controlsPosition}
          onStartDrag={startControlsDrag}
          currentCharacter={currentCharacter}
          onRefreshCharacter={refreshCharacter}
          loadingRefresh={loadingRefresh}
          controlMode={controlMode}
          onGamePadEvent={handleGamePadEvent}
          pressedKeys={pressedKeys}
          lastPressedKey={lastPressedKey}
          lastPressedTick={lastPressedTick}
          onVirtualKeyPress={triggerVirtualKey}
          onOpenCustomModal={() => {
            applyRoutePreset(customRoutePreset);
            setCustomModalOpen(true);
          }}
          customLoopRunning={customLoopRunning}
          customLoopStopping={customLoopStopping}
          onStopCustomLoop={stopCustomLoop}
          loadingEvent={loadingEvent}
        />
      </div>

      <CustomRequestModal
        open={customModalOpen}
        onOpenChange={setCustomModalOpen}
        characterName={currentCharacter?.name}
        customRoutePreset={customRoutePreset}
        onRoutePresetChange={applyRoutePreset}
        customMethod={customMethod}
        onMethodChange={setCustomMethod}
        customRoute={customRoute}
        onRouteChange={setCustomRoute}
        customPayload={customPayload}
        onPayloadChange={setCustomPayload}
        customResponse={customResponse}
        customSending={customSending}
        customLoopRunning={customLoopRunning}
        onSend={sendCustomRequest}
        onLoop={startCustomLoop}
      />
    </section>
  )
}

export default ControllerPage
