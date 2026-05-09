import { create } from "zustand";
import { devtools } from "zustand/middleware";

type Model = {
    id: string,
    name: string,
    chef: string,
    chefSlug: string,
  }

type Models = {
    models: Model[];
    chefs: string[];
    status: "idle" | "loading" | "error";
    getimageGenerationModels: () => Promise<void>
}

const useModels = create<Models>()(devtools((set) => ({
    models: [],
    chefs: [],
    status: "idle",
    getimageGenerationModels: async () => {
        try {
            set({ status: "loading" });
            const response = await fetch("/api/models");
            if (!response.ok) {
                throw new Error(`Error fetching models: ${response.statusText}`);
            }
            const models = await response.json();
            const chefs = [...new Set(models.map((model: Model) => model.chef))] as string[];
            set({ chefs: chefs, models: models, status: "idle" });
        } catch (error) {
            console.error("Failed to fetch models:", error);
            set({ status: "error" });
        }  
    }
})));

export default useModels;

