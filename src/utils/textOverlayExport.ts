import { TEXT_MAX_LENGTH } from "@/constants/textOverlay";
import type { TextOverlay } from "@/types/textOverlay";
import { escapeForDrawtext, sanitizeTextInput } from "@/utils/textSanitizer";

/** FFmpeg drawtext 필터 문자열 생성. content가 빈 문자열이면 null 반환 */
export function buildDrawtextFilter(
	overlay: TextOverlay,
	_width: number,
	_height: number,
	startTime?: number,
	endTime?: number,
): string | null {
	const sanitized = sanitizeTextInput(overlay.content, TEXT_MAX_LENGTH);
	if (sanitized === "") return null;

	const escaped = escapeForDrawtext(sanitized);
	const xPercent = (overlay.x / 100).toFixed(2);
	const yPercent = (overlay.y / 100).toFixed(2);
	const alpha = (overlay.opacity / 100).toFixed(2);

	const xExpr = `x=(w*${xPercent}-tw/2)`;
	const yExpr = `y=(h*${yPercent})`;

	let filter = `drawtext=text='${escaped}':fontsize=${overlay.fontSize}:fontcolor=${overlay.fontColor}@${alpha}:${xExpr}:${yExpr}`;

	if (startTime !== undefined && endTime !== undefined) {
		filter += `:enable='between(t,${startTime.toFixed(3)},${endTime.toFixed(3)})'`;
	}

	return filter;
}
