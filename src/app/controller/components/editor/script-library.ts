export type SavedScript = {
  id: string;
  name: string;
  code: string;
};

export const DEFAULT_SCRIPT_CODE = `// Auto-fight loop with rest when low on HP.
// Available: rest, fight, gather, move(x,y), transition, refresh,
//            api(method, route, body), sleep(ms), log(...), character
for (let i = 0; i < 5; i++) {
  if (character.hp < character.max_hp * 0.3) {
    await rest();
  }
  await fight();
  log("fight " + (i + 1) + " done, hp=" + character.hp);
}
`;

let counter = 0;

function fallbackId(): string {
  counter += 1;
  return `script-${counter}`;
}

export function createScript(name: string, code: string = DEFAULT_SCRIPT_CODE, id?: string): SavedScript {
  return {
    id: id ?? fallbackId(),
    name,
    code,
  };
}

export function upsertScript(list: SavedScript[], script: SavedScript): SavedScript[] {
  const exists = list.some((item) => item.id === script.id);
  if (exists) {
    return list.map((item) => (item.id === script.id ? script : item));
  }
  return [...list, script];
}

export function removeScript(list: SavedScript[], id: string): SavedScript[] {
  return list.filter((item) => item.id !== id);
}

export function renameScriptInList(list: SavedScript[], id: string, name: string): SavedScript[] {
  return list.map((item) => (item.id === id ? {...item, name} : item));
}
