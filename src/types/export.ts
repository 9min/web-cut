export type ExportStatus =
	| "idle"
	| "preparing"
	| "writing-files"
	| "encoding"
	| "finalizing"
	| "done"
	| "error"
	| "cancelled";

export interface ExportResolution {
	label: string;
	width: number;
	height: number;
}

export interface ExportSettings {
	resolution: ExportResolution;
}
