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
import { User, MessageSquare, Save, Brain } from "lucide-react";

export const Route = createFileRoute("/settings/customization")({
  component: RouteComponent,
});

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
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: keyof CustomizationSettings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement customization settings saving
      // This would typically save to backend or local storage
      localStorage.setItem("speedchat_customization", JSON.stringify(settings));

      // Show success feedback
      alert("Customization settings saved successfully!");
    } catch (error) {
      alert("Failed to save customization settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Load existing settings on component mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("speedchat_customization");
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error("Failed to load saved customization settings:", error);
    }
  }, []);

  return (
    <SettingsWrapper>
      <div className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Personal Information</span>
            </CardTitle>
            <CardDescription>
              Help Speed Chat understand who you are and what you do
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="What should Speed Chat call you?"
                value={settings.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
              <p className="text-muted-foreground text-sm">
                This helps personalize the conversation and responses
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="what-you-do">What do you do?</Label>
              <Textarea
                id="what-you-do"
                placeholder="e.g., I'm a software engineer at a startup, I work on React and Node.js applications..."
                value={settings.whatYouDo}
                onChange={(e) => handleChange("whatYouDo", e.target.value)}
                rows={3}
              />
              <p className="text-muted-foreground text-sm">
                Describe your profession, interests, or current projects
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Chat Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Chat Preferences</span>
            </CardTitle>
            <CardDescription>
              Customize how Speed Chat responds to you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="how-to-respond">
                How should Speed Chat respond to you?
              </Label>
              <Textarea
                id="how-to-respond"
                placeholder="e.g., Be concise and technical, use examples, explain like I'm a beginner, be creative and fun..."
                value={settings.howToRespond}
                onChange={(e) => handleChange("howToRespond", e.target.value)}
                rows={4}
              />
              <p className="text-muted-foreground text-sm">
                Specify the tone, style, and approach you prefer for responses
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional-info">
                Anything else Speed Chat should know about you?
              </Label>
              <Textarea
                id="additional-info"
                placeholder="e.g., I prefer TypeScript over JavaScript, I'm learning machine learning, I work remotely..."
                value={settings.additionalInfo}
                onChange={(e) => handleChange("additionalInfo", e.target.value)}
                rows={4}
              />
              <p className="text-muted-foreground text-sm">
                Any additional context that would help provide better responses
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI Behavior */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>Response Style</span>
            </CardTitle>
            <CardDescription>
              Fine-tune how the AI assistant behaves in conversations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">Current Settings Preview:</h4>
                  <div className="bg-muted space-y-1 rounded-lg p-3">
                    <p>
                      <strong>Name:</strong> {settings.name || "Not set"}
                    </p>
                    <p>
                      <strong>Role:</strong>{" "}
                      {settings.whatYouDo
                        ? settings.whatYouDo.slice(0, 50) + "..."
                        : "Not specified"}
                    </p>
                    <p>
                      <strong>Style:</strong>{" "}
                      {settings.howToRespond
                        ? settings.howToRespond.slice(0, 50) + "..."
                        : "Default"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Tips for better responses:</h4>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Be specific about your experience level</li>
                    <li>• Mention preferred programming languages</li>
                    <li>• Specify if you want code examples</li>
                    <li>• Include your learning goals</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? "Saving..." : "Save Customization"}</span>
          </Button>
        </div>
      </div>
    </SettingsWrapper>
  );
}
