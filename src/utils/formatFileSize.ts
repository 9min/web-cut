const UNITS = ["B", "KB", "MB", "GB"] as const;
const THRESHOLD = 1024;

export function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 B";

	let unitIndex = 0;
	let size = bytes;

	while (size >= THRESHOLD && unitIndex < UNITS.length - 1) {
		size /= THRESHOLD;
		unitIndex++;
	}

	const unit = UNITS[unitIndex];
	if (unit === "B") return `${size} B`;
	return `${size.toFixed(1)} ${unit}`;
}
