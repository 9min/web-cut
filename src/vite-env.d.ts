/// <reference types="vite/client" />

/** File System Access API 타입 선언 */
interface FileSystemWritableFileStream extends WritableStream {
	write(data: Blob | BufferSource | string): Promise<void>;
	close(): Promise<void>;
}

interface FileSystemFileHandle {
	createWritable(): Promise<FileSystemWritableFileStream>;
}

interface SaveFilePickerOptions {
	suggestedName?: string;
	types?: Array<{
		description: string;
		accept: Record<string, string[]>;
	}>;
}

interface Window {
	showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
}
