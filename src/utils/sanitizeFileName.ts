export function sanitizeFileName(name: string): string {
	const sanitized = name
		.replace(/<[^>]*>/g, "") // HTML 태그 제거
		.replace(/[<>:"/\\|?*]/g, "") // 특수문자 제거
		.replace(/\s+/g, " ") // 연속 공백을 하나로
		.trim();

	return sanitized || "unnamed";
}
