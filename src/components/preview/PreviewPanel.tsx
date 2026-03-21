import { Maximize, Minimize } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { usePixiApp } from "@/hooks/usePixiApp";
import { usePreviewRenderer } from "@/hooks/usePreviewRenderer";
import { usePlaybackStore } from "@/stores/usePlaybackStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { formatDuration } from "@/utils/formatDuration";

export function PreviewPanel() {
	const panelRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const tracks = useTimelineStore((s) => s.tracks);
	const currentTime = usePlaybackStore((s) => s.currentTime);
	const width = useProjectStore((s) => s.width);
	const height = useProjectStore((s) => s.height);
	const hasClips = tracks.some((t) => t.clips.length > 0);
	const [isFullscreen, setIsFullscreen] = useState(false);

	const { app, ready } = usePixiApp(containerRef);
	usePreviewRenderer(app, ready);

	const toggleFullscreen = useCallback(async () => {
		if (!panelRef.current) return;

		try {
			if (document.fullscreenElement) {
				await document.exitFullscreen();
				setIsFullscreen(false);
			} else {
				await panelRef.current.requestFullscreen();
				setIsFullscreen(true);
			}
		} catch {
			// Fullscreen API 미지원
		}
	}, []);

	return (
		<div
			ref={panelRef}
			data-testid="preview-panel"
			className="flex h-full min-h-0 flex-col bg-black"
		>
			<div ref={containerRef} className="relative min-h-0 flex-1">
				{!hasClips && (
					<div className="absolute inset-0 flex items-center justify-center">
						<p className="text-sm text-gray-500">
							미디어를 타임라인에 배치하면 프리뷰가 표시됩니다
						</p>
					</div>
				)}
			</div>
			<div className="flex shrink-0 items-center justify-between border-t border-gray-800 px-3 py-1">
				<span className="font-mono text-xs text-gray-400">{formatDuration(currentTime)}</span>
				<div className="flex items-center gap-2">
					<span className="text-xs text-gray-600">
						{width}x{height}
					</span>
					<button
						type="button"
						onClick={toggleFullscreen}
						className="flex items-center justify-center rounded p-0.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300"
						aria-label={isFullscreen ? "전체 화면 종료" : "전체 화면"}
						title={isFullscreen ? "전체 화면 종료" : "전체 화면"}
					>
						{isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
					</button>
				</div>
			</div>
		</div>
	);
}
