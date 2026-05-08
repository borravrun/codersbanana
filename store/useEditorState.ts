import { create } from "zustand";
import { devtools } from "zustand/middleware";
type EditorState = {
    image: string | null;
    setImage: (image: string | null) => void;
}
const useEditorState = create<EditorState>()(devtools((set) => ({
    image: null,
    setImage: (imageData: string | null) => set({ image: imageData }),
})));

export default useEditorState;