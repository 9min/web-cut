import { create } from "zustand";
import type { MediaAsset } from "@/types/media";

interface MediaState {
	assets: MediaAsset[];
	addAsset: (asset: MediaAsset) => void;
	removeAsset: (id: string) => void;
	updateAsset: (id: string, updates: Partial<MediaAsset>) => void;
	reset: () => void;
}

export const useMediaStore = create<MediaState>((set, get) => ({
	assets: [],

	addAsset: (asset) => set((state) => ({ assets: [...state.assets, asset] })),

	removeAsset: (id) => {
		const asset = get().assets.find((a) => a.id === id);
		if (asset) {
			URL.revokeObjectURL(asset.objectUrl);
			if (asset.thumbnailUrl && asset.thumbnailUrl !== asset.objectUrl) {
				URL.revokeObjectURL(asset.thumbnailUrl);
			}
		}
		set((state) => ({ assets: state.assets.filter((a) => a.id !== id) }));
	},

	updateAsset: (id, updates) =>
		set((state) => ({
			assets: state.assets.map((a) => (a.id === id ? { ...a, ...updates } : a)),
		})),

	reset: () => {
		for (const asset of get().assets) {
			URL.revokeObjectURL(asset.objectUrl);
			if (asset.thumbnailUrl && asset.thumbnailUrl !== asset.objectUrl) {
				URL.revokeObjectURL(asset.thumbnailUrl);
			}
		}
		set({ assets: [] });
	},
}));
