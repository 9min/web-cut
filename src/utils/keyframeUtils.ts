import type { EasingType, KeyframeTrack } from "@/types/keyframe";

/** 이징 함수들 (t: 0~1 → 0~1) */
function applyEasing(t: number, easing: EasingType): number {
	switch (easing) {
		case "ease-in":
			return t * t;
		case "ease-out":
			return 1 - (1 - t) * (1 - t);
		case "ease-in-out":
			return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
		default:
			return t; // linear
	}
}

/** 키프레임 트랙에서 주어진 시간의 보간값을 계산한다 (정렬 + 이진 탐색) */
export function interpolateKeyframes(
	track: KeyframeTrack,
	time: number,
	defaultValue: number,
): number {
	const { keyframes } = track;
	if (keyframes.length === 0) return defaultValue;
	if (keyframes.length === 1) return keyframes[0]?.value ?? defaultValue;

	// 시간순 정렬
	const sorted = [...keyframes].sort((a, b) => a.time - b.time);

	const first = sorted[0];
	const last = sorted[sorted.length - 1];
	if (!first || !last) return defaultValue;

	// 범위 밖
	if (time <= first.time) return first.value;
	if (time >= last.time) return last.value;

	// 이진 탐색으로 구간 찾기
	let lo = 0;
	let hi = sorted.length - 1;
	while (lo < hi - 1) {
		const mid = Math.floor((lo + hi) / 2);
		const midKf = sorted[mid];
		if (!midKf) break;
		if (midKf.time <= time) {
			lo = mid;
		} else {
			hi = mid;
		}
	}

	const kfA = sorted[lo];
	const kfB = sorted[hi];
	if (!kfA || !kfB) return defaultValue;

	const range = kfB.time - kfA.time;
	if (range <= 0) return kfA.value;

	const t = (time - kfA.time) / range;
	const easedT = applyEasing(t, kfA.easing);
	return kfA.value + (kfB.value - kfA.value) * easedT;
}
