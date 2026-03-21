import { create } from "zustand";
import { DEFAULT_EXPORT_RESOLUTION } from "@/constants/export";
import type { ExportResolution, ExportStatus } from "@/types/export";
import type { ExportFormatSettings, QualityPreset, VideoFormat } from "@/types/exportSettings";

interface ExportState {
	status: ExportStatus;
	progress: number;
	resolution: ExportResolution;
	formatSettings: ExportFormatSettings;
	error: string | null;
	abortController: AbortController | null;
	setStatus: (status: ExportStatus) => void;
	setProgress: (progress: number) => void;
	setResolution: (resolution: ExportResolution) => void;
	setFormat: (format: VideoFormat) => void;
	setQuality: (quality: QualityPreset) => void;
	setError: (error: string) => void;
	cancelExport: () => void;
	reset: () => void;
}

const initialState = {
	status: "idle" as ExportStatus,
	progress: 0,
	resolution: DEFAULT_EXPORT_RESOLUTION,
	formatSettings: { format: "mp4", quality: "medium" } as ExportFormatSettings,
	error: null as string | null,
	abortController: null as AbortController | null,
};

export const useExportStore = create<ExportState>((set, get) => ({
	...initialState,

	setStatus: (status) => set({ status }),
	setProgress: (progress) => set({ progress }),
	setResolution: (resolution) => set({ resolution }),
	setFormat: (format) => set((s) => ({ formatSettings: { ...s.formatSettings, format } })),
	setQuality: (quality) => set((s) => ({ formatSettings: { ...s.formatSettings, quality } })),
	setError: (error) => set({ error, status: "error" }),

	cancelExport: () => {
		const { abortController } = get();
		if (abortController) {
			abortController.abort();
		}
		set({ status: "cancelled", abortController: null });
	},

	reset: () => set(initialState),
}));
