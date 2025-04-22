import {useEffect, useRef, useState} from 'react';
import {useGamepads} from 'react-gamepads';
import GamepadSvg from "@/app/controller/components/gamepad/Gamepad.svg";
import {controllerToGamePadSVG, Gpad} from "@/app/controller/models/Gamepad.model";
import './Gamepad.css'

interface GamepadProps {
  loading: boolean;
  gamePadEvent: (buttons: { [key: string]: boolean }) => void;
}

/**
 * GamePad View
 * @constructor
 */
function Gamepad({loading, gamePadEvent}: GamepadProps) {
  const [gamepads, setGamepads] = useState<Gpad>({});
  const [currentButtonsClicked, setCurrentButtonsClicked] = useState<{ [key: string]: boolean }>({});
  useGamepads(gamepads => setGamepads(gamepads as unknown as Gpad));
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const gamepadId = Object.keys(gamepads).shift();
    let newButtonsClicked = {};

    if (gamepadId && gamepads && gamepads[gamepadId].buttons && gamepads[gamepadId].buttons.length > 0) {
      gamepads[gamepadId].buttons.forEach((button: { pressed: boolean }, index: number) => {
        const parameter = controllerToGamePadSVG[index] || 'notFound';
        newButtonsClicked = {...newButtonsClicked, [parameter]: button.pressed};
      });
      setCurrentButtonsClicked(newButtonsClicked);
    }
  }, [gamepads]);

  useEffect(() => {
    const pressedButtons = Object.entries(currentButtonsClicked)
      .filter(([, isPressed]) => isPressed)
      .map(([button]) => button);

    if (pressedButtons.length > 0) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        gamePadEvent(currentButtonsClicked);
      }, 200);
    } else {
      gamePadEvent(currentButtonsClicked);
    }
  }, [currentButtonsClicked, gamePadEvent]);

  return (
    <>
      <div className="flex mt-5 justify-center">
        <div className="flex w-90 items-center space-x-4 rounded-md border pt-2 pb-2 p-6">
          {!loading && (
            <GamepadSvg
              {...currentButtonsClicked}
            ></GamepadSvg>
          )}
          {loading && (
            <span>Loading...</span>
          )}
        </div>
      </div>
    </>
  )
}

export default Gamepad
