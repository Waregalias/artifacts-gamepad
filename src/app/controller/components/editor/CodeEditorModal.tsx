'use client'

import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import Editor, {type Monaco} from "@monaco-editor/react";
import {Play, Square, Trash2, Plus, Pencil} from "lucide-react";
import {useStore} from "@/store";
import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {ArtifactCharacter} from "@/app/controller/models/artifact.model";
import {createRunState, runScript, type RunState, type ScriptLog} from "./script-runtime";
import {SDK_TYPES} from "./sdk-types";
import "./CodeEditorModal.css";

type ConsoleLine = {level: 'info' | 'result' | 'error'; message: string};

type CodeEditorModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function CodeEditorModal({open, onOpenChange}: CodeEditorModalProps) {
  const scripts = useStore((state) => state.scripts);
  const activeScriptId = useStore((state) => state.activeScriptId);
  const addScript = useStore((state) => state.addScript);
  const updateScriptCode = useStore((state) => state.updateScriptCode);
  const renameScript = useStore((state) => state.renameScript);
  const deleteScript = useStore((state) => state.deleteScript);
  const setActiveScript = useStore((state) => state.setActiveScript);

  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>([]);
  const [running, setRunning] = useState(false);
  const runStateRef = useRef<RunState | null>(null);
  const consoleEndRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeScript = useMemo(
    () => scripts.find((item) => item.id === activeScriptId) ?? scripts[0] ?? null,
    [scripts, activeScriptId],
  );

  useEffect(() => {
    if (open && scripts.length === 0) {
      addScript('Script 1');
    }
  }, [open, scripts.length, addScript]);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({behavior: 'smooth'});
  }, [consoleLines]);

  const appendLine = useCallback((level: ConsoleLine['level'], message: string) => {
    setConsoleLines((prev) => [...prev, {level, message}]);
  }, []);

  const handleBeforeMount = useCallback((monaco: Monaco) => {
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });
    monaco.languages.typescript.javascriptDefaults.addExtraLib(SDK_TYPES, 'sdk-globals.d.ts');
  }, []);

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (!activeScript) {
        return;
      }
      const id = activeScript.id;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        updateScriptCode(id, value ?? '');
      }, 300);
    },
    [activeScript, updateScriptCode],
  );

  const handleRun = useCallback(async () => {
    if (running || !activeScript) {
      return;
    }
    const {apiKey, character} = useStore.getState();
    if (!apiKey || !character?.name) {
      appendLine('error', 'Save your API key and character first.');
      return;
    }
    const state = createRunState();
    runStateRef.current = state;
    setRunning(true);
    const log: ScriptLog = (level, message) => appendLine(level, message);
    try {
      await runScript(activeScript.code, {
        apiKey,
        characterName: character.name,
        getCharacter: () => useStore.getState().character,
        onCharacterUpdate: (next: ArtifactCharacter) =>
          useStore.getState().updateArtifactCharacter(useStore.getState().apiKey, next),
        log,
        state,
      });
      appendLine('result', 'Script finished.');
    } catch (error) {
      appendLine('error', (error as Error).message ?? String(error));
    } finally {
      setRunning(false);
      runStateRef.current = null;
    }
  }, [running, activeScript, appendLine]);

  const handleStop = useCallback(() => {
    if (runStateRef.current) {
      runStateRef.current.aborted = true;
      appendLine('info', 'Stopping…');
    }
  }, [appendLine]);

  const handleRename = useCallback(() => {
    if (!activeScript) {
      return;
    }
    const name = window.prompt('Script name', activeScript.name);
    if (name && name.trim()) {
      renameScript(activeScript.id, name.trim());
    }
  }, [activeScript, renameScript]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="editor-modal">
        <DialogHeader>
          <DialogTitle>Code Editor</DialogTitle>
          <DialogDescription>
            Write JavaScript to control your character. Stop interrupts a running script.
          </DialogDescription>
        </DialogHeader>

        <div className="editor-toolbar">
          <select
            className="editor-script-select"
            value={activeScript?.id ?? ''}
            onChange={(event) => setActiveScript(event.target.value)}
          >
            {scripts.map((script) => (
              <option key={script.id} value={script.id}>
                {script.name}
              </option>
            ))}
          </select>
          <Button type="button" variant="outline" size="icon" onClick={() => addScript()} title="New script">
            <Plus size={16} />
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={handleRename} title="Rename">
            <Pencil size={16} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => activeScript && deleteScript(activeScript.id)}
            title="Delete script"
          >
            <Trash2 size={16} />
          </Button>

          <span className="editor-toolbar-spacer" />

          {!running && (
            <Button type="button" onClick={handleRun} disabled={!activeScript}>
              <Play size={16} /> Run
            </Button>
          )}
          {running && (
            <Button type="button" variant="destructive" onClick={handleStop}>
              <Square size={16} /> Stop
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => setConsoleLines([])}>
            Clear
          </Button>
        </div>

        <div className="editor-monaco">
          <Editor
            height="100%"
            theme="vs-dark"
            language="javascript"
            path={activeScript ? `script-${activeScript.id}.js` : 'script.js'}
            value={activeScript?.code ?? ''}
            beforeMount={handleBeforeMount}
            onChange={handleChange}
            options={{
              minimap: {enabled: false},
              fontSize: 13,
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>

        <div className="editor-console">
          {consoleLines.length === 0 && (
            <div className="editor-console-empty">Console output will appear here.</div>
          )}
          {consoleLines.map((line, index) => (
            <div key={index} className={`editor-console-line is-${line.level}`}>
              {line.message}
            </div>
          ))}
          <div ref={consoleEndRef} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CodeEditorModal;
