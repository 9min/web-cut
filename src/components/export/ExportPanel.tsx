import { Download } from "lucide-react";
import { EXPORT_RESOLUTIONS } from "@/constants/export";
import { useExport } from "@/hooks/useExport";
import { useExportStore } from "@/stores/useExportStore";

export function ExportPanel() {
	const { status, progress, resolution, error, startExport } = useExport();
	const setResolution = useExportStore((s) => s.setResolution);
	const reset = useExportStore((s) => s.reset);

	const isExporting = status === "preparing" || status === "encoding";

	return (
		<div className="flex flex-col gap-3 p-3">
			<h2 className="text-sm font-semibold text-white">내보내기</h2>

			<div className="flex flex-col gap-2">
				<span className="text-xs text-gray-400">해상도</span>
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

			{isExporting && (
				<div className="flex flex-col gap-1">
					<div className="flex justify-between text-xs text-gray-400">
						<span>{status === "preparing" ? "준비 중..." : "인코딩 중..."}</span>
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

			{status === "error" && error && (
				<div className="rounded bg-red-900/30 p-2">
					<p className="text-xs text-red-400">{error}</p>
					<button type="button" onClick={reset} className="mt-1 text-xs text-gray-400 underline">
						닫기
					</button>
				</div>
			)}

			<button
				type="button"
				onClick={startExport}
				disabled={isExporting}
				className="flex items-center justify-center gap-2 rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
			>
				<Download size={14} />
				{isExporting ? "내보내는 중..." : "MP4 내보내기"}
			</button>
		</div>
	);
}
