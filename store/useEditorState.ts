import { create } from "zustand";
import { devtools } from "zustand/middleware";
type EditorState = {
  image: string | null;
  prompt: string;
  modelId: string;
  history: string[];
  status: "submitted" | "streaming" | "ready" | "error";
  setStatus: (status: "submitted" | "streaming" | "ready" | "error") => void;
  selectedHistoryIndex: number;
  setModelId: (modelId: string) => void;
  setImage: (image: string | null) => void;
  setPrompt: (prompt: string) => void;
  generateEdit: () => Promise<void>;
  setSelectedHistoryIndex: (index: number) => void;
};
const useEditorState = create<EditorState>()(
  devtools((set, get) => ({
    image: null,
    prompt: "",
    modelId: "",
    history: [],
    status: "ready",
    selectedHistoryIndex: 1,
    setStatus: (status: "submitted" | "streaming" | "ready" | "error") =>
      set({ status }),
    setModelId: (modelId: string) => set({ modelId }),
    setImage: (imageData: string | null) => {
      const { history } = get();

      set({
        image: imageData,
        history: [...history, imageData as string],
        selectedHistoryIndex: history.length + 1,
      });
    },
    setPrompt: (prompt: string) => set({ prompt }),
    generateEdit: async () => {
      const { image, prompt, modelId, history, status } = get();

      if (!image || !prompt) {
        console.error("Image and prompt are required to generate an edit.");
        return;
      }
      try {
        const response = await fetch("/api/edit-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageBase64: image, prompt, modelId }),
        });
        if (!response.ok) {
          set({ status: "error" });
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        set({
          image: data.result,
          history: [...history, data.result as string],
          selectedHistoryIndex: history.length + 1,
          status: "ready",
        });
      } catch (error) {
        console.error("Failed to generate edit:", error);
      }
    },
    setSelectedHistoryIndex: (index: number) => {
      const { history } = get();
      set({
        selectedHistoryIndex: index + 1,
        image: history[index],
      });
    },
  })),
);

export default useEditorState;
