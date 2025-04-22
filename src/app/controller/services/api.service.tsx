import {ArtifactCharacter, ArtifactResponse} from "@/app/controller/models/artifact.model";

export const getCharacter = async (apiKey: string, name: string): Promise<ArtifactCharacter> => {
  return fetch(`https://api.artifactsmmo.com/characters/${name}`,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    }).then(res => res.json())
    .then(json => {
      if (json.error) {
        throw new Error(json.error);
      }
      return json.data;
    })
    .catch(err => {
      throw err;
    });
}

export const rest = async (apiKey: string, name: string = 'none'): Promise<ArtifactResponse> => {
  return fetch(`https://api.artifactsmmo.com/my/${name}/action/rest`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    })
    .then(res => res.json())
    .then(json => {
      if (json.error) {
        throw new Error(json.error.message, json.error.code);
      }
      return json.data;
    })
    .catch(err => {
      throw err;
    });
}

export const fight = async (apiKey: string, name: string = 'none'): Promise<ArtifactResponse> => {
  return fetch(`https://api.artifactsmmo.com/my/${name}/action/fight`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    })
    .then(res => res.json())
    .then(json => {
      if (json.error) {
        throw new Error(json.error.message, json.error.code);
      }
      return json.data;
    })
    .catch(err => {
      throw err;
    });
}

export const move = async (apiKey: string, name: string = 'none', fx: number = 0, fy: number = 0, dx: number, dy: number): Promise<ArtifactResponse> => {
  return fetch(`https://api.artifactsmmo.com/my/${name}/action/move`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: `{"x":${fx + dx},"y":${fy + dy}}`,
    })
    .then(res => res.json())
    .then(json => {
      if (json.error) {
        throw new Error(json.error.message, json.error.code);
      }
      return json.data;
    })
    .catch(err => {
      throw err;
    });
}
