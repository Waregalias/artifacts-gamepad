export const SDK_TYPES = `
declare interface Character {
  name: string;
  hp: number;
  max_hp: number;
  level: number;
  x: number;
  y: number;
  gold: number;
  [key: string]: any;
}
/** Rest to recover HP. Waits for cooldown automatically. */
declare function rest(): Promise<any>;
/** Fight the monster on the current tile. */
declare function fight(): Promise<any>;
/** Gather a resource on the current tile. */
declare function gather(): Promise<any>;
/** Use a map transition on the current tile. */
declare function transition(): Promise<any>;
/** Move the character to absolute coordinates (x, y). */
declare function move(x: number, y: number): Promise<any>;
/** Reload the character state from the server. */
declare function refresh(): Promise<Character>;
/** Raw API call against /my/{character}. Route starting with /my/ is used as-is. */
declare function api(method: string, route: string, body?: any): Promise<any>;
/** Pause execution; interruptible by Stop. */
declare function sleep(ms: number): Promise<void>;
/** Print to the editor console. */
declare function log(...parts: any[]): void;
/** Live snapshot of the current character. */
declare const character: Character;
`;
