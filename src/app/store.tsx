import {create} from 'zustand'
import {persist} from "zustand/middleware";
import {ArtifactCharacter} from "@/app/controller/models/artifact.model";

export type ControlMode = 'gamepad' | 'keyboard';

type StoreState = {
  apiKey: string;
  character: ArtifactCharacter | null;
  controlMode: ControlMode;
  saveSettings: (apiKey: string, character: ArtifactCharacter | null) => void;
  setControlMode: (mode: ControlMode) => void;
  updateArtifactCharacter: (apiKey: string, character: ArtifactCharacter | null) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      apiKey: '',
      character: null,
      controlMode: 'gamepad',
      saveSettings: (apiKey: string, character: ArtifactCharacter | null) => set({apiKey, character}),
      setControlMode: (mode: ControlMode) => set({controlMode: mode}),
      updateArtifactCharacter: (apiKey: string, character: ArtifactCharacter | null) => set({apiKey, character}),
    }),
    {
      name: 'store',
      partialize: (state: StoreState) => ({
        apiKey: state.apiKey,
        character: state.character,
        controlMode: state.controlMode,
      }),
    }
  )
);
