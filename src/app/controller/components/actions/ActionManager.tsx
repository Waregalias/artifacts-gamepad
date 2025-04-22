import {fight, rest, move} from "@/app/controller/services/api.service";
import {
  ArtifactActionButton,
  ArtifactActionMoveX,
  ArtifactActionMoveY,
  ArtifactCharacter,
  ArtifactResponse
} from "@/app/controller/models/artifact.model";
import {toast} from "@/components/ui/use-toast";
import * as React from "react";

export function actionManager(apiKey: string, currentCharacter: ArtifactCharacter, key: string = '') {
  return new Promise<ArtifactCharacter | void>((resolve, reject) => {
    const isValidButtonTop = key in ArtifactActionButton;
    const isValidButtonRight = key in ArtifactActionButton;
    const isValidMoveXKey = key in ArtifactActionMoveX;
    const isValidMoveYKey = key in ArtifactActionMoveY;

    if (isValidButtonTop) {
      rest(apiKey, currentCharacter.name)
        .then((res: ArtifactResponse) => {
          if (res.character) {
            resolve(res.character);
          } else {
            console.warn("La réponse de l'API 'rest' ne contenait pas de données de personnage.");
            resolve(currentCharacter);
          }
        })
        .catch((err: Error) => {
          console.error("Erreur pendant l'appel à rest():", err);
          toast({
            variant: "destructive",
            title: "Erreur lors du repos",
            description: (
              <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
                <span className="text-white">{err.message || JSON.stringify(err, null, 2)}</span>
              </pre>
            ),
          });
          reject(err);
        })
    } else if (isValidButtonRight) {
      fight(apiKey, currentCharacter.name)
        .then((res: ArtifactResponse) => {
          if (res.character) {
            resolve(res.character);
          } else {
            console.warn("La réponse de l'API 'move' ne contenait pas de données de personnage.");
            resolve(currentCharacter);
          }
        })
        .catch((err: Error) => {
          console.error("Erreur pendant l'appel à fight():", err);
          toast({
            variant: "destructive",
            title: "Erreur lors du combat",
            description: (
              <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
                <span className="text-white">{err.message || JSON.stringify(err, null, 2)}</span>
              </pre>
            ),
          });
          reject(err);
        })
    } else if (isValidMoveXKey || isValidMoveYKey) {
      const deltaX = isValidMoveXKey
        ? ArtifactActionMoveX[key as keyof typeof ArtifactActionMoveX]
        : 0;

      const deltaY = isValidMoveYKey
        ? ArtifactActionMoveY[key as keyof typeof ArtifactActionMoveY]
        : 0;

      move(
        apiKey,
        currentCharacter.name,
        currentCharacter.x,
        currentCharacter.y,
        deltaX,
        deltaY
      )
        .then((res: ArtifactResponse) => {
          if (res.character) {
            resolve(res.character);
          } else {
            console.warn("La réponse de l'API 'move' ne contenait pas de données de personnage.");
            resolve(currentCharacter);
          }
        })
        .catch((error: Error) => {
          console.error("Erreur pendant l'appel à move():", error);
          toast({
            variant: "destructive",
            title: "Erreur lors du déplacement",
            description: (
              <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
                <span className="text-white">{error.message || JSON.stringify(error, null, 2)}</span>
              </pre>
            ),
          });
          reject(error);
        });
    } else {
      console.log(`La clé '${key}' n'est pas une action de mouvement valide.`);
      resolve(currentCharacter);
    }
  });
}
