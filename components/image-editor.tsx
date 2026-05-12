import useEditorState from "@/store/useEditorState";
import NextImage from "next/image";
import { useRef, useEffect, useCallback } from "react";

const ImageEditor = () => {
  const { image } = useEditorState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draw = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    if (!image) return;
    const img = new Image();
    img.src = image;
    img.onload = () => {
      canvasRef.current!.width = img.naturalWidth;
      canvasRef.current!.height = img.naturalHeight;
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      ctx.drawImage(img, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
    }
    
  }, [image]);
  useEffect(() => {
    if (!image) return;
    const img = new Image();
    img.src = image;
    img.onload = () => {
      draw();
    }
  }, [image]);
  return (
    <div className="w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="border border-red-500 max-w-full max-h-full"
      ></canvas>
      {/*<Image 
      height={500}
      width={500} 
      src={image} 
      alt="Uploaded" />*/}
    </div>
  );
};

export default ImageEditor;