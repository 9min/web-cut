interface IndexableClip {
	id: string;
	startTime: number;
	duration: number;
}

/** 시간 기반 클립 인덱스 (이진 탐색 O(log n + k)) */
export class ClipTimeIndex<T extends IndexableClip> {
	private sorted: T[];

	constructor(clips: T[]) {
		this.sorted = [...clips].sort((a, b) => a.startTime - b.startTime);
	}

	/** 주어진 시간에 활성화된 클립들을 반환한다 */
	getClipsAtTime(time: number): T[] {
		const results: T[] = [];
		const { sorted } = this;

		// 이진 탐색: startTime <= time인 마지막 위치 찾기
		let lo = 0;
		let hi = sorted.length - 1;

		while (lo <= hi) {
			const mid = Math.floor((lo + hi) / 2);
			const clip = sorted[mid];
			if (!clip) break;
			if (clip.startTime <= time) {
				lo = mid + 1;
			} else {
				hi = mid - 1;
			}
		}

		// hi+1은 startTime > time인 첫 위치
		// hi부터 역순으로 탐색 (startTime <= time인 클립들)
		for (let i = hi; i >= 0; i--) {
			const clip = sorted[i];
			if (!clip) continue;
			const endTime = clip.startTime + clip.duration;
			if (endTime > time) {
				results.push(clip);
			}
		}

		return results.reverse();
	}
}
