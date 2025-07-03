import { NextRequest, NextResponse } from "next/server";
import {
  experimental_generateImage as generateImage,
  type ImageModel,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createVertex } from "@ai-sdk/google-vertex/edge";
import { createFal } from "@ai-sdk/fal";
import type { APIKeys, Models, Providers } from "@/lib/types";
import { AVAILABLE_MODELS } from "@/lib/models";
import { uploadBase64Image } from "@/lib/uploadthing";

type DimensionFormat = "size" | "aspectRatio";

export async function POST(request: NextRequest) {
  try {
    const { model, apiKeys, prompt } = await request.json();

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
      prompt,
      ...(dimensionFormat === "size"
        ? { size: "1024x1024" }
        : { aspectRatio: "1:1" }),
    });

    const imageUrl = await uploadBase64Image(image.base64);
    console.log(imageUrl);

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate image. Please try again." },
      { status: 500 }
    );
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
