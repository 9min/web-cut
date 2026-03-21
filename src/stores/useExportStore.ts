import { create } from "zustand";
import { DEFAULT_EXPORT_RESOLUTION } from "@/constants/export";
import type { ExportResolution, ExportStatus } from "@/types/export";

interface ExportState {
	status: ExportStatus;
	progress: number;
	resolution: ExportResolution;
	error: string | null;
	setStatus: (status: ExportStatus) => void;
	setProgress: (progress: number) => void;
	setResolution: (resolution: ExportResolution) => void;
	setError: (error: string) => void;
	reset: () => void;
}

const initialState = {
	status: "idle" as ExportStatus,
	progress: 0,
	resolution: DEFAULT_EXPORT_RESOLUTION,
	error: null as string | null,
};

export const useExportStore = create<ExportState>((set) => ({
	...initialState,

	setStatus: (status) => set({ status }),
	setProgress: (progress) => set({ progress }),
	setResolution: (resolution) => set({ resolution }),
	setError: (error) => set({ error, status: "error" }),
	reset: () => set(initialState),
}));
