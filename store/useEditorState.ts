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
  undo: () => void;
  redo: () => void;
  setStatus: (status: "submitted" | "streaming" | "ready" | "error") => void;
  selectedHistoryIndex: number;
  setModelId: (modelId: string) => void;
  setImage: (image: string | null) => void;
  setFiles: (files: FileUIPart) => void;
  setPrompt: (prompt: string) => void;
  generateEdit: () => Promise<void>;
  setSelectedHistoryIndex: (index: number) => void;
  clearHistory: () => void; 
  setShowHistory: (showHistory: boolean) => void;
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
  })),
);

export default useEditorState;
