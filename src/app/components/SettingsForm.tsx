'use client'

import {useState} from "react";
import * as React from "react";
import {Controller, useForm} from "react-hook-form";
import Image from "next/image";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {useStore} from "@/app/store";
import {Button} from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {toast} from "@/components/ui/use-toast";
import {getCharacters} from "@/app/settings/services/api.service";
import {ArtifactCharacter} from "@/app/controller/models/artifact.model";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

const FormSchema = z.object({
  apiKey: z.string(),
  name: z.string(),
});

function SettingsForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      apiKey: useStore((state: { apiKey: string }) => state.apiKey),
      name: useStore((state: { character: ArtifactCharacter }) => state.character.name),
    },
  });

  const initialName = useStore((state: { character: ArtifactCharacter }) => state.character.name);
  const initialSkin = useStore((state: { character: ArtifactCharacter }) => state.character.skin);
  const [characters, setCharacters] = useState<ArtifactCharacter[]>([
    {name: initialName, skin: initialSkin},
  ]);

  const updateArtifactCharacter = useStore((state: {
    updateArtifactCharacter: (apiKey: string, character: ArtifactCharacter | undefined) => void
  }) => state.updateArtifactCharacter);

  async function loadCharacters() {
    const apiKey = form.getValues('apiKey');
    setCharacters(await getCharacters(apiKey));
  }

  function onSubmit(data: z.infer<typeof FormSchema>) {
    updateArtifactCharacter(
      data.apiKey,
      characters.find((character) => character.name === data.name),
    );
    toast({
      title: "Token and character locally saved. Let's play !",
    });
  }

  return (
    <div className="controller-settings">
      <h2>Settings</h2>
      <p>Configure ta clé API puis choisis ton personnage.</p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="controller-settings-form">
          <div className="controller-settings-api-row">
            <FormField
              control={form.control}
              name="apiKey"
              render={({field}) => (
                <FormItem className="controller-settings-api-input">
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input placeholder="eyJ0fXAi0i..." {...field} />
                  </FormControl>
                  <FormDescription>This is your private API Key.</FormDescription>
                  <FormMessage/>
                </FormItem>
              )}
            />
            <Button type={"button"} onClick={loadCharacters}>Load</Button>
          </div>

          <FormField
            control={form.control}
            name="name"
            render={() => (
              <FormItem>
                <FormLabel>Character</FormLabel>
                <FormControl>
                  <Controller
                    control={form.control}
                    name="name"
                    render={({field}) => (
                      <Select
                        disabled={characters?.[0]?.name === undefined}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a character"/>
                        </SelectTrigger>
                        <SelectContent>
                          {characters
                            .filter((character) => character.name)
                            .map((character, index) => (
                              <SelectItem key={character.account || character.name || index} value={character.name ?? ''}>
                                <div className="flex items-center">
                                  <Image
                                    src={`/images/skins/${character.skin}.png`}
                                    alt={`${character.name}'s skin`}
                                    width={16}
                                    height={16}
                                    className="mr-3"
                                    style={{width: 'auto', height: 'auto'}}
                                    priority
                                  />
                                  {character.name}
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormControl>
                <FormMessage/>
              </FormItem>
            )}
          />

          <Button type={"submit"}>Save</Button>
        </form>
      </Form>
    </div>
  );
}

export default SettingsForm;
