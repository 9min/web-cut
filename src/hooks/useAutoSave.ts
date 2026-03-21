import { useEffect, useRef } from "react";
import { autoSaveProject } from "@/services/autoSaveService";
import { useTimelineStore } from "@/stores/useTimelineStore";

const AUTO_SAVE_INTERVAL = 30_000; // 30초

/** 30초 주기로 타임라인 변경이 있으면 IndexedDB에 자동 저장한다 */
export function useAutoSave(): void {
	const lastSnapshotRef = useRef<string>("");

	useEffect(() => {
		const intervalId = setInterval(() => {
			const currentSnapshot = JSON.stringify(useTimelineStore.getState().tracks);

			// 이전 스냅샷과 동일하면 저장하지 않음
			if (currentSnapshot === lastSnapshotRef.current) {
				return;
			}

			lastSnapshotRef.current = currentSnapshot;
			autoSaveProject().catch(() => {
				// 자동 저장 실패는 무시 (사용자 경험에 영향 없음)
			});
		}, AUTO_SAVE_INTERVAL);

		return () => clearInterval(intervalId);
	}, []);
}
