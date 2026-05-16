import { ToolType } from "@/lib/constants";
import { FileUIPart } from "ai";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
type EditorState = {
  image: string | null;
  mask: string | null;
  files: FileUIPart[];
  prompt: string;
  modelId: string;
  history: string[];
  showHistory: boolean;
  status: "submitted" | "streaming" | "ready" | "error";
  selectedTool: ToolType,
  brushSize: number;
  undo: () => void;
  redo: () => void;
  setMask: (mask: string) => void;
  setStatus: (status: "submitted" | "streaming" | "ready" | "error") => void;
  selectedHistoryIndex: number;
  setModelId: (modelId: string) => void;
  setImage: (image: string | null) => void;
  setFiles: (files: FileUIPart) => void;
  setPrompt: (prompt: string) => void;
  generateEdit: () => Promise<void>;
  applyFilter: (prompt: string) => void;
  applyAspectRatio: (aspectRatio: string) => void;
  setSelectedHistoryIndex: (index: number) => void;
  clearHistory: () => void; 
  setShowHistory: (showHistory: boolean) => void;
  setSelectedTool: (tool: ToolType) => void;
  setBrushSize: (size: number) => void;
};

const useEditorState = create<EditorState>()(
  devtools((set, get) => ({
    image: null,
    mask: null,
    files: [],
    prompt: "",
    modelId: "",
    history: [],
    showHistory: false,
    status: "ready",
    selectedHistoryIndex: 0,
    selectedTool: ToolType.MOVE,
    brushSize: 10,
    setMask: (mask: string) => {
         set({ mask });
       },
    setImage: (imageData: string | null) => {
      const { history } = get();
      set({
        image: imageData,
        history: [...history, imageData as string],
        selectedHistoryIndex: history.length,
      });
    },
    setFiles: (files: FileUIPart[]) => set({ files }),
    setPrompt: (prompt: string) => set({ prompt }),
    setModelId: (modelId: string) => set({ modelId }),
    setStatus: (status: "submitted" | "streaming" | "ready" | "error") => set({ status }),
    generateEdit: async () => {
      const { image, prompt, modelId, history, files, mask } = get();
      const finalPrompt = `
          TASK: Professional Image In-painting / Generative Fill.
          ROLE: Expert Photo Retoucher.
      
          INPUT DATA EXPLANATION:
          - You have received a primary image and a corresponding mask image.
          - The mask defines the precise editing region.
          - WHITE pixels in the mask indicate the area where you must apply the user's instruction.
          - BLACK pixels in the mask must remain exactly as they are in the original image.
      
          USER GOAL:
          "${prompt}"
      
          EXECUTION GUIDELINES (CRITICAL):
          1. IF REMOVING/ERASING: If the user asks to "remove", "erase", or "delete" an object, you MUST perform "Background Reconstruction". Analyze the surrounding background (wall, floor, nature) and seamlessly extend it over the masked area to hide the object.
          2. IF CHANGING/REPLACING: If the user asks to add or change something, generate the new object strictly within the white mask, matching the scene's lighting and perspective.
          3. SEAMLESS INTEGRATION: The new content generated inside the white masked area must perfectly match the surrounding environment's perspective, lighting direction, shadows, and color grading.
          4. TEXTURE MATCHING: Replicate the exact film grain, noise level, and sharpness of the original photo to prevent a "pasted-on" look. The transition at the mask boundary must be invisible.
          5. STRICT ISOLATION: Do not modify any pixels outside the designated white masked area under any circumstances`
      
      if (!image || !prompt) {
        console.error("Image and prompt are required to generate an edit.");
        set({ status: "error" });
        return;
      }
      try {
        const response = await fetch("/api/edit-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageBase64: image, prompt: finalPrompt, modelId, files: files.map(f => f.url), mask: mask }),
        });
        if (!response.ok) {
          set({ status: "error" });
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
       
        set({
          image: data.result,
          history: [...history, data.result as string],
          selectedHistoryIndex: history.length,
          status: "ready",
        });
      } catch (error) {
        console.error("Failed to generate edit:", error);
      }
    },
    setSelectedHistoryIndex: (index: number) => {
      const { history } = get();
      set({
        selectedHistoryIndex: index,
        image: history[index],
      });
    },
    undo: () => {
      const { history, selectedHistoryIndex } = get();
      if (selectedHistoryIndex > 0) {
        const newIndex = selectedHistoryIndex - 1;
        set({
          selectedHistoryIndex: newIndex,
          image: history[newIndex],
        });
      }
    },
    redo: () => {
      const { history, selectedHistoryIndex } = get();
      if (selectedHistoryIndex < history.length - 1) {
        const newIndex = selectedHistoryIndex + 1;
        set({
          selectedHistoryIndex: newIndex,
          image: history[newIndex],
        });
      }
    },
    clearHistory: () => {
      const { history, selectedHistoryIndex } = get();
      const newHistory = history.filter((_, index) => index == selectedHistoryIndex);
      console.log(newHistory);
      set({
        history: newHistory,
        selectedHistoryIndex: 0,
        image: newHistory[0],
      });
    },
    setShowHistory: (showHistory: boolean) => {
      set({ showHistory });
    },
    applyFilter: async (prompt: string) => {
      const { image, modelId, files, history } = get();
      
      const finalPrompt = `${prompt} 
        Technical Contstraints: 
        1. STRICTLY PRESERVE COMPOSITION: Do not change the subject pose, the camera angle, or the placement of objects
        2. OUTPUT FORMAT: This is style transfer. Keep the underlying structure unchanged and identical to the original image, maintain the same aspect ratio, only adjust the style.
        `;

      if (!image || !finalPrompt) {
        console.error("Image and prompt are required to generate an edit.");
        set({ status: "error" });
        return;
      }
      try {
        
        const response = await fetch("/api/edit-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageBase64: image, finalPrompt, modelId, files: files.map(f => f.url) }),
        });
        if (!response.ok) {
          set({ status: "error" });
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
       
        set({
          image: data.result,
          history: [...history, data.result as string],
          selectedHistoryIndex: history.length,
          status: "ready",
        });
      } catch (error) {
        console.error("Failed to generate edit:", error);
      }
      
    },
    applyAspectRatio: async (aspectRatio: string) => {
      const { image, modelId, history } = get();
      
      const prompt = `
        Outpaint and expand The original image content should remain perfectly preserved and unchanged.
        Extend the canvas to a ${aspectRatio} aspect ratio by seamlessly generating new content on both sides.
        Match the existing lighting, color grading, and visual style exactly.
        The new areas should blend imperceptibly with the original — same lighting direction, color temperature, depth of field, texture, and atmosphere.
        Do not alter the original image. Keep all subjects, horizon lines, and perspective consistent. --ar ${aspectRatio}
      `;

      if (!image || !prompt) {
        console.error("Image and prompt are required to generate an edit.");
        set({ status: "error" });
        return;
      }
      try {
        
        const response = await fetch("/api/edit-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageBase64: image, prompt, modelId, aspectRatio, files: [] }),
        });
        if (!response.ok) {
          set({ status: "error" });
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
       
        set({
          image: data.result,
          history: [...history, data.result as string],
          selectedHistoryIndex: history.length,
          status: "ready",
        });
      } catch (error) {
        console.error("Failed to generate edit:", error);
      }
      
    },
    setSelectedTool: (tool: ToolType) => set({ selectedTool: tool }),
    setBrushSize: (size: number) => set({ brushSize: size }),
  })),
);

export default useEditorState;
