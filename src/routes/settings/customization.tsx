import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SettingsWrapper } from "@/components/SettingsWrapper";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { getLocalStorage, setLocalStorage } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/settings/customization")({
  component: RouteComponent,
});

const LOCAL_STORAGE_KEY = "customization";

type CustomizationSettings = {
  name: string;
  whatYouDo: string;
  howToRespond: string;
  additionalInfo: string;
};

function RouteComponent() {
  const [settings, setSettings] = useState<CustomizationSettings>({
    name: "",
    whatYouDo: "",
    howToRespond: "",
    additionalInfo: "",
  });
  const [originalSettings, setOriginalSettings] =
    useState<CustomizationSettings>({
      name: "",
      whatYouDo: "",
      howToRespond: "",
      additionalInfo: "",
    });

  const hasChanges =
    JSON.stringify(settings) !== JSON.stringify(originalSettings);

  const handleChange = (field: keyof CustomizationSettings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setLocalStorage(LOCAL_STORAGE_KEY, JSON.stringify(settings));
      setOriginalSettings({ ...settings });
      toast.success("Customization settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save customization settings. Please try again.");
    }
  };

  useEffect(() => {
    try {
      const savedSettings = getLocalStorage(LOCAL_STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        setOriginalSettings(parsed);
      }
    } catch (error) {
      console.error("Failed to load saved customization settings.");
    }
  }, []);

  return (
    <SettingsWrapper>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5" />
              <span>Customization</span>
            </CardTitle>
            <CardDescription>
              Customize how Speed Chat responds to you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={settings.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="what-you-do">What do you do?</Label>
              <Input
                id="what-you-do"
                placeholder="Engineer, student, etc."
                value={settings.whatYouDo}
                onChange={(e) => handleChange("whatYouDo", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="how-to-respond">
                How should Speed Chat respond to you?
              </Label>
              <Textarea
                id="how-to-respond"
                placeholder="Explain concepts in an easy manner and use examples"
                value={settings.howToRespond}
                onChange={(e) => handleChange("howToRespond", e.target.value)}
                className="max-h-[150px] min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional-info">
                Anything else Speed Chat should know about you?
              </Label>
              <Textarea
                id="additional-info"
                placeholder="Interests, values, or preferences to keep in mind"
                value={settings.additionalInfo}
                onChange={(e) => handleChange("additionalInfo", e.target.value)}
                className="max-h-[150px] min-h-[100px] resize-none"
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={!hasChanges}
                className="flex w-full md:w-auto"
              >
                <span>Save Customization</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsWrapper>
  );
}
