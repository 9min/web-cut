import { create } from "zustand";
import { DEFAULT_ZOOM, MAX_ZOOM, MIN_ZOOM } from "@/constants/timeline";

const ZOOM_STEP = 20;

function clampZoom(zoom: number): number {
	return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
}

interface ZoomState {
	zoom: number;
	zoomIn: () => void;
	zoomOut: () => void;
	setZoom: (zoom: number) => void;
}

export const useZoomStore = create<ZoomState>((set) => ({
	zoom: DEFAULT_ZOOM,
	zoomIn: () => set((s) => ({ zoom: clampZoom(s.zoom + ZOOM_STEP) })),
	zoomOut: () => set((s) => ({ zoom: clampZoom(s.zoom - ZOOM_STEP) })),
	setZoom: (zoom) => set({ zoom: clampZoom(zoom) }),
}));
