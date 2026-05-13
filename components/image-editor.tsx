import useEditorState from "@/store/useEditorState";
import NextImage from "next/image";
import { useRef, useEffect, useCallback } from "react";
import { Point } from "@/types";


const ImageEditor = () => {
  const { image, selectedTool } = useEditorState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const startPosRef = useRef<Point>(null);
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
      if (!canvasRef.current) return;
      imgRef.current = img;
      canvasRef.current.width = img.naturalWidth;
      canvasRef.current.height = img.naturalHeight;

      // maskRef.current = document.createElement("canvas");
      // if (!maskRef.current) return;
      maskRef.current.width = img.naturalWidth;
      maskRef.current.height = img.naturalHeight;
      const maskCtx = maskRef.current.getContext("2d");
      if (maskCtx) {
        maskCtx.fillStyle = "Black";
        maskCtx.fillRect(0, 0, maskRef.current.width , maskRef.current.height );
      }
      draw();
    }
  }, [image, draw]);

  function startDrawing(e: React.PointerEvent<HTMLCanvasElement>)  {
    if (e.pointerType !== "mouse") return;
    const pos = getPosition(e)
    startPosRef.current = pos;
    if (selectedTool === ToolType.BRUSH || selectedTool === ToolType.ERASER) {
      updateMask(pos, pos);
    };
  }

  function updateMask(start: Point, end: Point) {
    if (!maskRef.current) return;
    const ctx = maskRef.current!.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = 100
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    if (selectedTool === ToolType.ERASER) {
      ctx.strokeStyle = "black"
      ctx.fillStyle = "black"
    } else if (selectedTool === ToolType.BRUSH) {
      ctx.strokeStyle = "white"
      ctx.fillStyle = "white"
    }
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    console.log("calling")
  }

  function getPosition(e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width)
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height)
    return { x, y };
  }
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <canvas
        onPointerDown={startDrawing}
        ref={canvasRef}
        className="max-w-full max-h-full"
      ></canvas>
      <canvas
        ref={maskRef}
        className="max-w-full max-h-full"
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

export enum ToolType {
  MOVE = "MOVE",
  RECTANGLE = "RECTANGLE",
  BRUSH = "BRUSH",
  ERASER = "ERASER",
}