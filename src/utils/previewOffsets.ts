import type { Clip } from "@/types/timeline";
import { clipBlockMap } from "@/utils/clipBlockRefs";
import { timeToPixel } from "@/utils/timelineUtils";

/** 삽입 인덱스 기준으로 각 클립의 미리보기 오프셋(px) 계산 (전체 밀착 시뮬레이션) */
export function computePreviewOffsets(
	sortedOtherClips: Clip[],
	dropIndex: number,
	gapDuration: number,
	zoom: number,
): Map<string, number> {
	const offsets = new Map<string, number>();

	// 밀착 배치 시뮬레이션: 모든 클립을 0부터 순차 배치 + dropIndex에 gap 삽입
	let compactedTime = 0;
	for (let i = 0; i < sortedOtherClips.length; i++) {
		if (i === dropIndex) compactedTime += gapDuration;
		const clip = sortedOtherClips[i] as Clip;
		const offsetPx = timeToPixel(compactedTime - clip.startTime, zoom);
		offsets.set(clip.id, offsetPx);
		compactedTime += clip.duration;
	}

	return offsets;
}

/** clipBlockMap에서 DOM 요소를 찾아 translateX 적용 */
export function applyPreviewOffsets(offsets: Map<string, number>): void {
	for (const [clipId, px] of offsets) {
		const el = clipBlockMap.get(clipId);
		if (el) {
			el.style.transform = px === 0 ? "" : `translateX(${px}px)`;
		}
	}
}

/** 모든 클립의 transform 초기화 */
export function clearAllPreviewOffsets(): void {
	for (const el of clipBlockMap.values()) {
		el.style.transform = "";
	}
}
