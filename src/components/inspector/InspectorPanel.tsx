import { DEFAULT_CLIP_FILTER } from "@/constants/filter";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { FilterPanel } from "./FilterPanel";
import { TextOverlayPanel } from "./TextOverlayPanel";

export function InspectorPanel() {
	const { tracks, selectedClipId } = useTimelineStore();

	if (!selectedClipId) {
		return (
			<div className="flex h-full items-center justify-center p-4">
				<p className="text-center text-xs text-gray-500">
					클립을 선택하면 속성을 편집할 수 있습니다
				</p>
			</div>
		);
	}

	// 일반 클립에서 찾기
	for (const track of tracks) {
		const clip = track.clips.find((c) => c.id === selectedClipId);
		if (clip) {
			return (
				<div className="h-full overflow-y-auto p-3">
					<div className="mb-3 truncate text-sm font-medium text-gray-200">{clip.name}</div>
					<FilterPanel
						trackId={track.id}
						clipId={clip.id}
						filter={clip.filter ?? DEFAULT_CLIP_FILTER}
					/>
				</div>
			);
		}
	}

	// 텍스트 클립에서 찾기
	for (const track of tracks) {
		const textClip = track.textClips.find((tc) => tc.id === selectedClipId);
		if (textClip) {
			return (
				<div className="h-full overflow-y-auto p-3">
					<div className="mb-3 truncate text-sm font-medium text-gray-200">{textClip.name}</div>
					<TextOverlayPanel
						trackId={track.id}
						textClipId={textClip.id}
						overlay={textClip.overlay}
						startTime={textClip.startTime}
						duration={textClip.duration}
					/>
				</div>
			);
		}
	}

	return (
		<div className="flex h-full items-center justify-center p-4">
			<p className="text-center text-xs text-gray-500">클립을 찾을 수 없습니다</p>
		</div>
	);
}
