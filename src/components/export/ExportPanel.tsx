import { Download, X } from "lucide-react";
import { EXPORT_RESOLUTIONS, SPEED_HINTS } from "@/constants/export";
import { useExport } from "@/hooks/useExport";
import { useExportStore } from "@/stores/useExportStore";
import type { ExportStatus } from "@/types/export";
import {
	FORMAT_LABELS,
	QUALITY_LABELS,
	type QualityPreset,
	type VideoFormat,
} from "@/types/exportSettings";

const STATUS_LABELS: Record<string, string> = {
	preparing: "준비 중...",
	"writing-files": "파일 쓰는 중...",
	encoding: "인코딩 중...",
	finalizing: "마무리 중...",
};

const FORMATS: VideoFormat[] = ["mp4", "webm"];
const QUALITIES: QualityPreset[] = ["high", "medium", "low"];

function getStatusLabel(status: ExportStatus): string {
	return STATUS_LABELS[status] ?? "";
}

export function ExportPanel() {
	const { status, progress, resolution, error, startExport, cancelExport } = useExport();
	const setResolution = useExportStore((s) => s.setResolution);
	const formatSettings = useExportStore((s) => s.formatSettings);
	const setFormat = useExportStore((s) => s.setFormat);
	const setQuality = useExportStore((s) => s.setQuality);
	const reset = useExportStore((s) => s.reset);

	const isExporting =
		status === "preparing" ||
		status === "writing-files" ||
		status === "encoding" ||
		status === "finalizing";

	return (
		<div className="flex flex-col gap-3 p-3">
			<h2 className="text-sm font-semibold text-white">내보내기</h2>

			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between">
					<span className="text-xs text-gray-400">해상도</span>
					{SPEED_HINTS[resolution.label] && (
						<span className="text-xs text-gray-500">속도: {SPEED_HINTS[resolution.label]}</span>
					)}
				</div>
				<div className="flex gap-1">
					{EXPORT_RESOLUTIONS.map((res) => (
						<button
							key={res.label}
							type="button"
							onClick={() => setResolution(res)}
							disabled={isExporting}
							className={`rounded px-2 py-1 text-xs ${
								resolution.label === res.label
									? "bg-blue-600 text-white"
									: "bg-gray-700 text-gray-300 hover:bg-gray-600"
							} disabled:opacity-50`}
						>
							{res.label}
						</button>
					))}
				</div>
			</div>

			<div className="flex flex-col gap-2">
				<span className="text-xs text-gray-400">포맷</span>
				<div className="flex gap-1">
					{FORMATS.map((f) => (
						<button
							key={f}
							type="button"
							onClick={() => setFormat(f)}
							disabled={isExporting}
							className={`rounded px-2 py-1 text-xs ${
								formatSettings.format === f
									? "bg-blue-600 text-white"
									: "bg-gray-700 text-gray-300 hover:bg-gray-600"
							} disabled:opacity-50`}
						>
							{FORMAT_LABELS[f]}
						</button>
					))}
				</div>
			</div>

			<div className="flex flex-col gap-2">
				<span className="text-xs text-gray-400">품질</span>
				<div className="flex gap-1">
					{QUALITIES.map((q) => (
						<button
							key={q}
							type="button"
							onClick={() => setQuality(q)}
							disabled={isExporting}
							className={`rounded px-2 py-1 text-xs ${
								formatSettings.quality === q
									? "bg-blue-600 text-white"
									: "bg-gray-700 text-gray-300 hover:bg-gray-600"
							} disabled:opacity-50`}
						>
							{QUALITY_LABELS[q]}
						</button>
					))}
				</div>
			</div>

			{isExporting && (
				<div className="flex flex-col gap-1">
					<div className="flex justify-between text-xs text-gray-400">
						<span>{getStatusLabel(status)}</span>
						<span>{progress}%</span>
					</div>
					<div className="h-1.5 overflow-hidden rounded-full bg-gray-700">
						<div
							className="h-full rounded-full bg-blue-500 transition-all"
							style={{ width: `${progress}%` }}
						/>
					</div>
				</div>
			)}

			{status === "done" && (
				<div className="rounded bg-green-900/30 p-2">
					<p className="text-xs text-green-400">내보내기 완료! 파일이 다운로드되었습니다.</p>
					<button type="button" onClick={reset} className="mt-1 text-xs text-gray-400 underline">
						닫기
					</button>
				</div>
			)}

			{status === "cancelled" && (
				<div className="rounded bg-yellow-900/30 p-2">
					<p className="text-xs text-yellow-400">내보내기가 취소되었습니다.</p>
					<button type="button" onClick={reset} className="mt-1 text-xs text-gray-400 underline">
						닫기
					</button>
				</div>
			)}

			{status === "error" && error && (
				<div className="rounded bg-red-900/30 p-2">
					<p className="text-xs text-red-400">{error}</p>
					<button type="button" onClick={reset} className="mt-1 text-xs text-gray-400 underline">
						닫기
					</button>
				</div>
			)}

			{isExporting ? (
				<button
					type="button"
					onClick={cancelExport}
					className="flex items-center justify-center gap-2 rounded bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-500"
				>
					<X size={14} />
					내보내기 취소
				</button>
			) : (
				<button
					type="button"
					onClick={startExport}
					disabled={isExporting}
					className="flex items-center justify-center gap-2 rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
				>
					<Download size={14} />
					{FORMAT_LABELS[formatSettings.format]} 내보내기
				</button>
			)}
		</div>
	);
}
