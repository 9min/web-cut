import { create } from "zustand";

interface UIState {
	showShortcutHelp: boolean;
	toggleShortcutHelp: () => void;
}

export const useUIStore = create<UIState>((set) => ({
	showShortcutHelp: false,
	toggleShortcutHelp: () => set((s) => ({ showShortcutHelp: !s.showShortcutHelp })),
}));
