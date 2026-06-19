import {create} from 'zustand'
import {persist} from "zustand/middleware";
import {ArtifactCharacter} from "@/app/controller/models/artifact.model";
import {
  SavedScript,
  createScript,
  upsertScript,
  removeScript,
  renameScriptInList,
  DEFAULT_SCRIPT_CODE,
} from "@/app/controller/components/editor/script-library";

export type ControlMode = 'gamepad' | 'keyboard';

type StoreState = {
  apiKey: string;
  character: ArtifactCharacter | null;
  controlMode: ControlMode;
  scripts: SavedScript[];
  activeScriptId: string | null;
  saveSettings: (apiKey: string, character: ArtifactCharacter | null) => void;
  setControlMode: (mode: ControlMode) => void;
  updateArtifactCharacter: (apiKey: string, character: ArtifactCharacter | null) => void;
  addScript: (name?: string) => string;
  updateScriptCode: (id: string, code: string) => void;
  renameScript: (id: string, name: string) => void;
  deleteScript: (id: string) => void;
  setActiveScript: (id: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      apiKey: '',
      character: null,
      controlMode: 'gamepad',
      scripts: [],
      activeScriptId: null,
      saveSettings: (apiKey: string, character: ArtifactCharacter | null) => set({apiKey, character}),
      setControlMode: (mode: ControlMode) => set({controlMode: mode}),
      updateArtifactCharacter: (apiKey: string, character: ArtifactCharacter | null) => set({apiKey, character}),
      addScript: (name?: string) => {
        const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `script-${Date.now()}`;
        const script = createScript(name ?? `Script ${get().scripts.length + 1}`, DEFAULT_SCRIPT_CODE, id);
        set({scripts: upsertScript(get().scripts, script), activeScriptId: id});
        return id;
      },
      updateScriptCode: (id: string, code: string) => {
        const existing = get().scripts.find((item) => item.id === id);
        if (!existing) {
          return;
        }
        set({scripts: upsertScript(get().scripts, {...existing, code})});
      },
      renameScript: (id: string, name: string) =>
        set({scripts: renameScriptInList(get().scripts, id, name)}),
      deleteScript: (id: string) => {
        const remaining = removeScript(get().scripts, id);
        set({
          scripts: remaining,
          activeScriptId: get().activeScriptId === id ? (remaining[0]?.id ?? null) : get().activeScriptId,
        });
      },
      setActiveScript: (id: string) => set({activeScriptId: id}),
    }),
    {
      name: 'store',
      partialize: (state: StoreState) => ({
        apiKey: state.apiKey,
        character: state.character,
        controlMode: state.controlMode,
        scripts: state.scripts,
        activeScriptId: state.activeScriptId,
      }),
    }
  )
);
