/** File System Access API 래퍼 서비스 — 미지원 브라우저에서는 a.click() 폴백 */

export interface FilePickerAcceptType {
	description: string;
	accept: Record<string, string[]>;
}

/** 프로젝트 파일 타입 */
export const PROJECT_ACCEPT_TYPES: FilePickerAcceptType[] = [
	{ description: "WebCut 프로젝트", accept: { "application/json": [".webcut.json"] } },
];

/** MP4 동영상 타입 */
export const MP4_ACCEPT_TYPES: FilePickerAcceptType[] = [
	{ description: "MP4 동영상", accept: { "video/mp4": [".mp4"] } },
];

/** WebM 동영상 타입 */
export const WEBM_ACCEPT_TYPES: FilePickerAcceptType[] = [
	{ description: "WebM 동영상", accept: { "video/webm": [".webm"] } },
];

/** showSaveFilePicker 지원 여부를 반환한다 */
export function supportsFilePicker(): boolean {
	return typeof window.showSaveFilePicker === "function";
}

/** a 태그 클릭을 이용한 폴백 다운로드 */
export function fallbackDownload(blob: Blob, fileName: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = fileName;
	a.click();
	// 브라우저가 다운로드를 시작할 시간을 확보한 후 URL 해제
	setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** showSaveFilePicker를 호출하여 파일을 저장한다. 사용자 취소 시 false 반환 */
export async function saveFileWithPicker(
	blob: Blob,
	suggestedName: string,
	accept: FilePickerAcceptType[],
): Promise<boolean> {
	try {
		const handle = await window.showSaveFilePicker({
			suggestedName,
			types: accept,
		});
		const writable = await handle.createWritable();
		await writable.write(blob);
		await writable.close();
		return true;
	} catch (err) {
		if (err instanceof DOMException && err.name === "AbortError") {
			return false;
		}
		throw err;
	}
}

/** 파일 저장 — File System Access API 지원 시 피커, 미지원 시 폴백 */
export async function saveFile(
	blob: Blob,
	suggestedName: string,
	accept: FilePickerAcceptType[],
): Promise<boolean> {
	if (supportsFilePicker()) {
		return saveFileWithPicker(blob, suggestedName, accept);
	}
	fallbackDownload(blob, suggestedName);
	return true;
}
