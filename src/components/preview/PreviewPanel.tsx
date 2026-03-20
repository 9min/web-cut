import { useRef } from "react";
import { usePixiApp } from "@/hooks/usePixiApp";
import { usePreviewRenderer } from "@/hooks/usePreviewRenderer";
import { usePlaybackStore } from "@/stores/usePlaybackStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { formatDuration } from "@/utils/formatDuration";

export function PreviewPanel() {
	const containerRef = useRef<HTMLDivElement>(null);
	const tracks = useTimelineStore((s) => s.tracks);
	const currentTime = usePlaybackStore((s) => s.currentTime);
	const width = useProjectStore((s) => s.width);
	const height = useProjectStore((s) => s.height);
	const hasClips = tracks.some((t) => t.clips.length > 0);

	const { app, ready } = usePixiApp(containerRef);
	usePreviewRenderer(app, ready);

	return (
		<div data-testid="preview-panel" className="flex h-full flex-col bg-black">
			<div ref={containerRef} className="relative flex-1">
				{!hasClips && (
					<div className="absolute inset-0 flex items-center justify-center">
						<p className="text-sm text-gray-500">
							미디어를 타임라인에 배치하면 프리뷰가 표시됩니다
						</p>
					</div>
				)}
			</div>
			<div className="flex items-center justify-between border-t border-gray-800 px-3 py-1">
				<span className="font-mono text-xs text-gray-400">{formatDuration(currentTime)}</span>
				<span className="text-xs text-gray-600">
					{width}x{height}
				</span>
			</div>
		</div>
	);
}
