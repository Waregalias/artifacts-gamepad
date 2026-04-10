'use client'

import * as React from "react";
import {useEffect, useState} from "react";
import {useStore} from "@/app/store";
import {ArtifactCharacter} from "@/app/controller/models/artifact.model";
import {getCharacter} from "@/app/controller/services/api.service";
import {toast} from "@/components/ui/use-toast";
import {Button} from "@/components/ui/button";
import {Spinner} from "@/components/ui/kibo-ui/spinner";
import {actionManager} from "@/app/controller/components/actions/ActionManager";
import dynamic from "next/dynamic";
import SettingsForm from "@/app/components/SettingsForm";
import './style.css';

const Gamepad = dynamic(() => import("@/app/controller/components/gamepad/Gamepad"), {
  ssr: false,
});

const gamepadLegend = [
  {control: "D-Pad Haut", action: "Déplacement vers le nord (Y - 1)."},
  {control: "D-Pad Bas", action: "Déplacement vers le sud (Y + 1)."},
  {control: "D-Pad Gauche", action: "Déplacement vers l'ouest (X - 1)."},
  {control: "D-Pad Droite", action: "Déplacement vers l'est (X + 1)."},
  {control: "Triangle / Y", action: "Action de repos (`rest`) pour régénérer le personnage."},
  {control: "Rond / B", action: "Action de combat (`fight`) sur la case courante."},
  {control: "Croix / A", action: "Réservé (aucune action API déclenchée actuellement)."},
  {control: "Carré / X", action: "Réservé (aucune action API déclenchée actuellement)."},
  {control: "L1, R1, L2, R2", action: "Connectés à la manette visuelle, sans action métier associée pour l'instant."},
  {control: "Start / Select", action: "Affichés dans la manette, sans binding API aujourd'hui."},
];

function ControllerPage() {
  const [isElectron, setIsElectron] = useState(false);
  const [leftMenuOpen, setLeftMenuOpen] = useState(true);
  const [loadingRefresh, setLoadingRefresh] = useState<boolean>(false)
  const [loadingEvent, setLoadingEvent] = useState<boolean>(false)
  const apiKey = useStore((state: { apiKey: string }) => state.apiKey);
  const currentCharacter = useStore((state: { character: ArtifactCharacter }) => state.character);
  const updateArtifactCharacter = useStore((state: {
    updateArtifactCharacter: { apiKey: string, name: string }
  }) => state.updateArtifactCharacter);

  useEffect(() => {
    setIsElectron(Boolean(window.electronAPI?.isElectron));
  }, []);

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

          <div className="controller-legend">
            <h2>Légende</h2>
            <p>Mapping manette</p>
            <div className="controller-legend-scroll">
              {gamepadLegend.map((item) => (
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
          <Gamepad loading={loadingEvent} gamePadEvent={handleGamePadEvent}/>
        </div>
      </div>
    </section>
  )
}

export default ControllerPage
