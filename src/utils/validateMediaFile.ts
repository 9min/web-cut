import { ALL_ACCEPTED_TYPES, MAX_FILE_SIZE } from "@/constants/media";
import { formatFileSize } from "@/utils/formatFileSize";

export interface ValidationResult {
	valid: boolean;
	error?: string;
}

export function validateMediaFile(file: File): ValidationResult {
	if (file.size === 0) {
		return { valid: false, error: "빈 파일은 업로드할 수 없습니다." };
	}

	if (file.size > MAX_FILE_SIZE) {
		return {
			valid: false,
			error: `파일 크기가 ${formatFileSize(MAX_FILE_SIZE)}를 초과합니다.`,
		};
	}

	const isAccepted = (ALL_ACCEPTED_TYPES as readonly string[]).includes(file.type);
	if (!isAccepted) {
		return {
			valid: false,
			error: `지원하지 않는 파일 형식입니다: ${file.type || "알 수 없음"}`,
		};
	}

	return { valid: true };
}
