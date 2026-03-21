/** HTML 태그 제거, 제어 문자 제거, 길이 제한 (XSS 방지) */
export function sanitizeTextInput(input: string, maxLength: number): string {
	const noTags = input.replace(/<[^>]*>/g, "");
	// 제어 문자 제거 (줄바꿈, 탭 제외)
	// biome-ignore lint/suspicious/noControlCharactersInRegex: 제어 문자 제거가 목적
	const noControl = noTags.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
	return noControl.slice(0, maxLength);
}

/** FFmpeg drawtext 특수문자 이스케이프 */
export function escapeForDrawtext(text: string): string {
	return text
		.replace(/\\/g, "\\\\")
		.replace(/:/g, "\\:")
		.replace(/'/g, "\\'")
		.replace(/\[/g, "\\[")
		.replace(/]/g, "\\]")
		.replace(/;/g, "\\;");
}

/** #RRGGBB 형식 검증 */
export function isValidHexColor(color: string): boolean {
	return /^#[0-9a-fA-F]{6}$/.test(color);
}
