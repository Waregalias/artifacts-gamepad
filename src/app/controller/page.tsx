'use client'

import * as React from "react";
import {useState} from "react";
import {useStore} from "@/app/store";
import {
  ArtifactActionMoveX,
  ArtifactActionMoveY,
  ArtifactCharacter,
  ArtifactResponse
} from "@/app/controller/models/artifact.model";
import Gamepad from "@/app/controller/components/gamepad/Gamepad";
import {getCharacter, move} from "@/app/controller/services/api.service";
import {toast} from "@/components/ui/use-toast";
import {Button} from "@/components/ui/button";
import {Spinner} from "@/components/ui/kibo-ui/spinner";
import {actionManager} from "@/app/controller/components/actions/ActionManager";
import './style.css';

function ControllerPage() {
  const [loadingRefresh, setLoadingRefresh] = useState<boolean>(false)
  const [loadingEvent, setLoadingEvent] = useState<boolean>(false)
  const apiKey = useStore((state: { apiKey: string }) => state.apiKey);
  const currentCharacter = useStore((state: { character: ArtifactCharacter }) => state.character);
  const updateArtifactCharacter = useStore((state: {
    updateArtifactCharacter: { apiKey: string, name: string }
  }) => state.updateArtifactCharacter);


  function refreshCharacter() {
    setLoadingRefresh(true);
    getCharacter(
      apiKey,
      currentCharacter.name,
    ).then((character: ArtifactCharacter) => {
      updateArtifactCharacter(apiKey, character);
      setLoadingRefresh(false);
    }).catch(() => {
      toast({
        title: "Error during refresh character, select character again",
      });
    });
  }

  function handleGamePadEvent(newAction: { [key: string]: boolean }) {
    // Initial check for loadingEvent - good practice
    if (loadingEvent) {
      return;
    }

    const actions = Object.fromEntries(Object.entries(newAction).filter(([, value]) => value));
    const newActions = Object.keys(actions);

    if (newActions.length > 0) {
      newActions.forEach((key: string) => {
        setLoadingEvent(true);
        actionManager(apiKey, currentCharacter, key)
          .then((result: ArtifactCharacter | void) => {
            if (result) {
              updateArtifactCharacter(apiKey, result);
            } else {
              console.log(`Action pour la clé '${key}' terminée, mais pas de mise à jour de personnage reçue.`);
            }
          })
          .catch((error) => {
            console.error(`Erreur pendant l'exécution de l'action pour la clé '${key}':`, error);
          })
          .finally(() => {
            setLoadingEvent(false);
          });
      });
    }
  }


  return (
    <>
      <div className="w-full flex justify-end items-center">
        <span className={"mr-5"}>Your position: x-{currentCharacter.x} ; y-{currentCharacter.y}</span>
        <Button className={"mr-5"} type={"button"} onClick={refreshCharacter}>
          {!loadingRefresh && (<span>Refresh</span>)}
          {loadingRefresh && (<Spinner/>)}
        </Button>
      </div>
      <Gamepad loading={loadingEvent} gamePadEvent={handleGamePadEvent}></Gamepad>
    </>
  )
}

export default ControllerPage
