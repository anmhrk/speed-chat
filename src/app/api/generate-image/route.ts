import { NextRequest, NextResponse } from "next/server";
import {
  experimental_generateImage as generateImage,
  NoImageGeneratedError,
  type ImageModel,
  createIdGenerator,
  Attachment,
  type Message,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createVertex } from "@ai-sdk/google-vertex/edge";
import { createFal } from "@ai-sdk/fal";
import type { APIKeys, Models, Providers, ImageRequest } from "@/lib/types";
import { AVAILABLE_MODELS } from "@/lib/models";
import { uploadBase64Image } from "@/lib/uploadthing";
import { getUser } from "@/lib/auth/get-user";
import { saveMessages } from "@/lib/db/actions";

type DimensionFormat = "size" | "aspectRatio";

export async function POST(request: NextRequest) {
  try {
    const {
      model,
      apiKeys,
      messages,
      chatId,
      temporaryChat,
      prompt,
    }: ImageRequest = await request.json();

    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const modelConfig = AVAILABLE_MODELS.find((m) => m.id === model);
    const provider = modelConfig?.providerId;

    let dimensionFormat: DimensionFormat;

    if (provider === "openai") {
      dimensionFormat = "size";
    } else {
      dimensionFormat = "aspectRatio";
    }

    const { image } = await generateImage({
      model: buildModel(model, apiKeys, provider!),
      prompt: prompt,
      ...(dimensionFormat === "size"
        ? { size: "1024x1024" }
        : { aspectRatio: "1:1" }),
    });

    const imageUrl = await uploadBase64Image(image.base64);

    if (imageUrl) {
      const messageId = createIdGenerator({
        prefix: "msg",
        size: 16,
      })();

      const attachment: Attachment = {
        name: `image-${messageId}.png`,
        contentType: "image/png",
        url: imageUrl,
      };

      const response = {
        id: messageId,
        role: "assistant",
        content: "",
        createdAt: new Date(),
        experimental_attachments: [attachment],
      } as Message;

      if (temporaryChat) {
        return NextResponse.json({ assistantMessage: response });
      }

      const messageIds = messages.map((m) => m.id);
      const latestUserMessage = messages[messages.length - 1];
      const newMessages = [latestUserMessage, response];
      await saveMessages(chatId, messageIds, newMessages);

      return NextResponse.json({ assistantMessage: response });
    } else {
      return NextResponse.json(
        { error: "Failed to upload image." },
        { status: 500 }
      );
    }
  } catch (error) {
    if (NoImageGeneratedError.isInstance(error)) {
      console.error("NoImageGeneratedError");
      console.error("Cause:", error.cause);
      console.error("Responses:", error.responses);
      return NextResponse.json(
        { error: "Failed to generate image. Please try again." },
        { status: 500 }
      );
    } else {
      console.error(error);
      return NextResponse.json(
        { error: "An unexpected error occurred. Please try again." },
        { status: 500 }
      );
    }
  }
}

function buildModel(
  model: Models,
  apiKeys: APIKeys,
  provider: Providers
): ImageModel {
  if (provider === "openai") {
    const openai = createOpenAI({
      apiKey: apiKeys.openai,
    });
    return openai.image(model);
  } else if (provider === "vertex") {
    const vertex = createVertex({
      googleCredentials: {
        clientEmail: apiKeys.vertex.clientEmail,
        privateKey: apiKeys.vertex.privateKey,
      },
    });
    return vertex.image(model);
  } else if (provider === "falai") {
    const fal = createFal({
      apiKey: apiKeys.falai,
    });
    return fal.image(model);
  }

  throw new Error("Invalid model");
}
