"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSettingsContext } from "@/contexts/settings-context";
import { Customization } from "@/lib/types";
import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const sampleTraits = [
  "Friendly",
  "Professional",
  "Funny",
  "Sarcastic",
  "Caring",
  "Witty",
  "Gen-Z",
];

export default function CustomizationPage() {
  const { customization, setCustomization } = useSettingsContext();
  const [traitsString, setTraitsString] = useState("");
  const [localCustomization, setLocalCustomization] = useState<Customization>({
    name: "",
    whatYouDo: "",
    traits: [],
    additionalInfo: "",
  });

  const hasChanges =
    JSON.stringify(localCustomization) !== JSON.stringify(customization);

  useEffect(() => {
    setLocalCustomization(customization);
  }, [customization]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="name">What should SpeedChat call you?</Label>
        <Input
          id="name"
          value={localCustomization.name}
          placeholder="Enter your name or nickname"
          onChange={(e) =>
            setLocalCustomization({
              ...localCustomization,
              name: e.target.value,
            })
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="whatYouDo">What do you do?</Label>
        <Input
          id="whatYouDo"
          value={localCustomization.whatYouDo}
          placeholder="Student, Developer, etc."
          onChange={(e) =>
            setLocalCustomization({
              ...localCustomization,
              whatYouDo: e.target.value,
            })
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="traits">What traits should SpeedChat have?</Label>
        <div
          className={cn(
            "flex min-h-9 w-full flex-wrap items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none",
            "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
            "dark:bg-input/30"
          )}
        >
          {localCustomization.traits.map((trait, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium"
            >
              {trait}
              <button
                type="button"
                onClick={() =>
                  setLocalCustomization({
                    ...localCustomization,
                    traits: localCustomization.traits.filter(
                      (_, i) => i !== index
                    ),
                  })
                }
                className="ml-1 rounded-sm opacity-70 hover:opacity-100 focus:opacity-100 focus:outline-none cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <input
            id="traits"
            value={traitsString}
            placeholder={
              localCustomization.traits.length === 0
                ? "Type a trait and press Enter or Tab..."
                : "Add another trait..."
            }
            onChange={(e) => setTraitsString(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (
                (e.key === "Enter" || e.key === "Tab") &&
                traitsString.trim()
              ) {
                e.preventDefault();
                setLocalCustomization({
                  ...localCustomization,
                  traits: [...localCustomization.traits, traitsString.trim()],
                });
                setTraitsString("");
              }
            }}
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-0"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {sampleTraits
            .filter((trait) => !localCustomization.traits.includes(trait))
            .map((trait) => (
              <Button
                key={trait}
                variant="secondary"
                size="sm"
                onClick={() =>
                  setLocalCustomization({
                    ...localCustomization,
                    traits: [...localCustomization.traits, trait],
                  })
                }
              >
                {trait}
                <Plus className="size-4" />
              </Button>
            ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="additionalInfo">
          What else should SpeedChat know about you?
        </Label>
        <Textarea
          id="additionalInfo"
          value={localCustomization.additionalInfo}
          placeholder="Enter any additional information"
          className="min-h-[130px] max-h-[130px] resize-none"
          onChange={(e) =>
            setLocalCustomization({
              ...localCustomization,
              additionalInfo: e.target.value,
            })
          }
        />
      </div>
      <div className="flex justify-end">
        <Button
          disabled={!hasChanges}
          onClick={() => setCustomization(localCustomization)}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}
