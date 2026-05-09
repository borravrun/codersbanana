import { create } from "zustand";
import { devtools } from "zustand/middleware";
type EditorState = {
    image: string | null;
    prompt: string;
    modelId: string;
    setModelId: (modelId: string) => void;
    setImage: (image: string | null) => void;
    setPrompt: (prompt: string) => void;
    generateEdit: () => Promise<void>;
}
const useEditorState = create<EditorState>()(devtools((set, get) => ({
    image: null,
    prompt: "",
    modelId: "",
    setModelId: (modelId: string) => set({ modelId }),
    setImage: (imageData: string | null) => set({ image: imageData }),
    setPrompt: (prompt: string) => set({ prompt }),
    generateEdit: async () => {
        const { image, prompt, modelId } = get();
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
                body: JSON.stringify({ imageBase64: image, prompt, modelId}),
            });
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            const data = await response.json();
            console.log("Edit generated successfully:", data);
        } catch (error) {
            console.error("Failed to generate edit:", error);
        }
    },
    
})));

export default useEditorState;