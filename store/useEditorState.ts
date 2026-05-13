import { ToolType } from "@/components/image-editor";
import { FileUIPart } from "ai";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
type EditorState = {
  image: string | null;
  files: FileUIPart[];
  prompt: string;
  modelId: string;
  history: string[];
  showHistory: boolean;
  status: "submitted" | "streaming" | "ready" | "error";
  selectedTool: ToolType,
  undo: () => void;
  redo: () => void;
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
};

const useEditorState = create<EditorState>()(
  devtools((set, get) => ({
    image: null,
    files: [],
    prompt: "",
    modelId: "",
    history: [],
    showHistory: false,
    status: "ready",
    selectedHistoryIndex: 0,
    selectedTool: ToolType.MOVE,
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
      const { image, prompt, modelId, history, files } = get();

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
          body: JSON.stringify({ imageBase64: image, prompt, modelId, files: files.map(f => f.url) }),
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
  })),
);

export default useEditorState;
