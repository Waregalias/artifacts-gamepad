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
  const savedApiKey = useStore((state) => state.apiKey);
  const savedCharacter = useStore((state) => state.character);
  const saveSettings = useStore((state) => state.saveSettings);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      apiKey: savedApiKey,
      name: savedCharacter?.name ?? '',
    },
  });

  const [characters, setCharacters] = useState<ArtifactCharacter[]>(
    savedCharacter?.name ? [savedCharacter] : []
  );

  React.useEffect(() => {
    form.reset({
      apiKey: savedApiKey,
      name: savedCharacter?.name ?? '',
    });
  }, [savedApiKey, savedCharacter, form]);

  async function loadCharacters() {
    const apiKey = form.getValues('apiKey');
    setCharacters(await getCharacters(apiKey));
  }

  function onSubmit(data: z.infer<typeof FormSchema>) {
    saveSettings(
      data.apiKey,
      characters.find((character) => character.name === data.name) ?? savedCharacter ?? null,
    );
    toast({
      title: "API key and character saved locally.",
    });
  }

  return (
    <div className="controller-settings">
      <h2>Settings</h2>
      <p>Set your API key and character.</p>
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
                  <FormDescription>This is your private API key.</FormDescription>
                  <FormMessage/>
                </FormItem>
              )}
            />
            <Button className="controller-btn-load" type={"button"} onClick={loadCharacters}>Load</Button>
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

          <Button className="controller-btn-save" type={"submit"}>Save</Button>
        </form>
      </Form>
    </div>
  );
}

export default SettingsForm;
