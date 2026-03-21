import { create } from "zustand";
import type { EditMode } from "@/types/editMode";

interface EditModeState {
	mode: EditMode;
	setMode: (mode: EditMode) => void;
}

export const useEditModeStore = create<EditModeState>((set) => ({
	mode: "select",
	setMode: (mode) => set({ mode }),
}));
