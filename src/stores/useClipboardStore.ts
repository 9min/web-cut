import { create } from "zustand";
import type { Clip } from "@/types/timeline";
import { generateId } from "@/utils/generateId";

interface ClipboardState {
	items: Clip[];
	copy: (clips: Clip[]) => void;
	paste: (atTime: number) => Clip[];
	clear: () => void;
	hasItems: () => boolean;
}

export const useClipboardStore = create<ClipboardState>((set, get) => ({
	items: [],

	copy: (clips) => {
		// deep clone
		const cloned = JSON.parse(JSON.stringify(clips)) as Clip[];
		set({ items: cloned });
	},

	paste: (atTime) => {
		const { items } = get();
		if (items.length === 0) return [];

		// 최소 startTime을 기준으로 offset 계산
		const sorted = [...items].sort((a, b) => a.startTime - b.startTime);
		const baseTime = sorted[0]?.startTime ?? 0;

		return sorted.map((clip) => ({
			...JSON.parse(JSON.stringify(clip)),
			id: generateId(),
			startTime: atTime + (clip.startTime - baseTime),
		}));
	},

	clear: () => set({ items: [] }),

	hasItems: () => get().items.length > 0,
}));
