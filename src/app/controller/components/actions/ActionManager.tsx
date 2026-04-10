import {fight, gathering, move, rest, transition} from "@/app/controller/services/api.service";
import {
  ArtifactActionButtonMap,
  ArtifactButtonAction,
  ArtifactActionMoveX,
  ArtifactActionMoveY,
  ArtifactCharacter,
  ArtifactResponse
} from "@/app/controller/models/artifact.model";
import {toast} from "@/components/ui/use-toast";
import * as React from "react";

export function actionManager(apiKey: string, currentCharacter: ArtifactCharacter, key: string = '') {
  return new Promise<ArtifactCharacter | void>((resolve, reject) => {
    const buttonAction = ArtifactActionButtonMap[key as keyof typeof ArtifactActionButtonMap] as ArtifactButtonAction | undefined;
    const isValidMoveXKey = key in ArtifactActionMoveX;
    const isValidMoveYKey = key in ArtifactActionMoveY;

    if (buttonAction) {
      let actionRequest: Promise<ArtifactResponse>;
      let actionLabel = '';

      switch (buttonAction) {
        case 'rest':
          actionRequest = rest(apiKey, currentCharacter.name);
          actionLabel = "rest";
          break;
        case 'fight':
          actionRequest = fight(apiKey, currentCharacter.name);
          actionLabel = "fight";
          break;
        case 'gathering':
          actionRequest = gathering(apiKey, currentCharacter.name);
          actionLabel = "gathering";
          break;
        case 'transition':
          actionRequest = transition(apiKey, currentCharacter.name);
          actionLabel = "transition";
          break;
        default:
          resolve(currentCharacter);
          return;
      }

      actionRequest.then((res: ArtifactResponse) => {
        if (res.character) {
          resolve(res.character);
        } else {
          resolve(currentCharacter);
        }
      }).catch((err: Error) => {
        console.error(`Error while calling ${actionLabel}():`, err);
        toast({
          variant: "destructive",
          title: `Error while running ${actionLabel}`,
          description: (
            <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
              <span className="text-white">{err.message || JSON.stringify(err, null, 2)}</span>
            </pre>
          ),
        });
        reject(err);
      });
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
            resolve(currentCharacter);
          }
        })
        .catch((error: Error) => {
          console.error("Error while calling move():", error);
          toast({
            variant: "destructive",
            title: "Error while moving",
            description: (
              <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
                <span className="text-white">{error.message || JSON.stringify(error, null, 2)}</span>
              </pre>
            ),
          });
          reject(error);
        });
    } else {
      resolve(currentCharacter);
    }
  });
}
