export type ExportStatus = "idle" | "preparing" | "encoding" | "done" | "error";

export interface ExportResolution {
	label: string;
	width: number;
	height: number;
}

export interface ExportSettings {
	resolution: ExportResolution;
}
