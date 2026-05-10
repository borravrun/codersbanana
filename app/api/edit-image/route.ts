import { NextResponse } from "next/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateImage } from "ai";

const client = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export async function POST(request: Request) {
    const {prompt, imageBase64, modelId} = await request.json();
    const { image: generatedImage } = await generateImage({
        model: client.imageModel(modelId),
        prompt: {
            text: prompt,
            images: [imageBase64],
        },
        
    })
    
    return NextResponse.json({ result: `data:image/png;base64,${generatedImage.base64}` });
}