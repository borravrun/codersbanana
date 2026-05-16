import { NextResponse } from "next/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateImage } from "ai";

const client = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export async function POST(request: Request) {
    const {prompt, imageBase64, modelId, files, aspectRatio, mask} = await request.json();
    const { image: generatedImage } = await generateImage({
        model: client.imageModel(modelId),
        prompt: {
            text: prompt,
            images: files.length > 0 ? [imageBase64, mask, ...files] : [imageBase64, mask],          
      },
      aspectRatio: aspectRatio,
        
    })
    
    return NextResponse.json({ result: `data:image/png;base64,${generatedImage.base64}` });
}