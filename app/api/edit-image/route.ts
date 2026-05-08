import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const {prompt, imageBase64} = await request.json();
    console.log("Received prompt:", prompt);
    console.log("Received image data (base64):", imageBase64);
    return NextResponse.json({ message: "Hello from the edit image API route!" });
}