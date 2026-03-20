import { create } from "zustand";
import {
	DEFAULT_FPS,
	DEFAULT_HEIGHT,
	DEFAULT_PROJECT_NAME,
	DEFAULT_WIDTH,
} from "@/constants/project";

interface ProjectState {
	name: string;
	width: number;
	height: number;
	fps: number;
	setName: (name: string) => void;
	setResolution: (width: number, height: number) => void;
	setFps: (fps: number) => void;
	reset: () => void;
}

const initialState = {
	name: DEFAULT_PROJECT_NAME,
	width: DEFAULT_WIDTH,
	height: DEFAULT_HEIGHT,
	fps: DEFAULT_FPS,
};

export const useProjectStore = create<ProjectState>((set) => ({
	...initialState,
	setName: (name) => set({ name }),
	setResolution: (width, height) => set({ width, height }),
	setFps: (fps) => set({ fps }),
	reset: () => set(initialState),
}));
