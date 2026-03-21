import { useMediaStore } from "@/stores/useMediaStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useTimelineStore } from "@/stores/useTimelineStore";
import type { MediaType } from "@/types/media";
import type { Track } from "@/types/timeline";

interface MediaRef {
	id: string;
	originalName: string;
	type: MediaType;
	mimeType: string;
	size: number;
}

interface ProjectData {
	version: string;
	project: { name: string; width: number; height: number; fps: number };
	timeline: { tracks: Track[] };
	mediaRefs: MediaRef[];
	savedAt: number;
}

/** 3개 스토어 상태를 ProjectData로 직렬화한다 (objectUrl 제외) */
export function serializeProject(): ProjectData {
	const { name, width, height, fps } = useProjectStore.getState();
	const { tracks } = useTimelineStore.getState();
	const { assets } = useMediaStore.getState();

	const mediaRefs: MediaRef[] = assets.map((a) => ({
		id: a.id,
		originalName: a.originalName,
		type: a.type,
		mimeType: a.mimeType,
		size: a.size,
	}));

	return {
		version: "1.0",
		project: { name, width, height, fps },
		timeline: { tracks },
		mediaRefs,
		savedAt: Date.now(),
	};
}

/** JSON 파싱 + 검증 후 스토어를 복원한다 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: 검증 + 스토어 복원을 단일 함수로 처리
export function deserializeProject(json: string): void {
	let data: unknown;
	try {
		data = JSON.parse(json);
	} catch {
		throw new Error("잘못된 JSON 형식입니다.");
	}

	if (!data || typeof data !== "object") {
		throw new Error("잘못된 프로젝트 데이터입니다.");
	}

	const d = data as Record<string, unknown>;

	if (!d.version || typeof d.version !== "string") {
		throw new Error("버전 정보가 없습니다.");
	}

	if (!d.project || typeof d.project !== "object") {
		throw new Error("프로젝트 설정이 없습니다.");
	}

	if (!d.timeline || typeof d.timeline !== "object") {
		throw new Error("타임라인 데이터가 없습니다.");
	}

	const project = d.project as Record<string, unknown>;
	const timeline = d.timeline as Record<string, unknown>;

	if (!project.name || !Array.isArray(timeline.tracks)) {
		throw new Error("필수 필드가 누락되었습니다.");
	}

	// 스토어 복원
	const projectStore = useProjectStore.getState();
	projectStore.setName(project.name as string);
	if (typeof project.width === "number" && typeof project.height === "number") {
		projectStore.setResolution(project.width, project.height);
	}
	if (typeof project.fps === "number") {
		projectStore.setFps(project.fps);
	}

	// 타임라인 복원: reset 후 트랙 추가
	const timelineStore = useTimelineStore.getState();
	timelineStore.reset();

	// 기본 트랙 제거 후 저장된 트랙으로 교체
	const tracks = timeline.tracks as Track[];
	// reset 후 기본 트랙이 있으므로, 먼저 기본 트랙을 제거
	const defaultTrack = timelineStore.tracks[0];
	if (defaultTrack) {
		timelineStore.removeTrack(defaultTrack.id);
	}
	for (const track of tracks) {
		timelineStore.addTrack(track);
	}
}

/** Blob으로 변환 후 a.click() 다운로드 */
export function downloadProjectFile(data: ProjectData): void {
	const json = JSON.stringify(data, null, 2);
	const blob = new Blob([json], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `${data.project.name || "project"}.webcut.json`;
	a.click();
	URL.revokeObjectURL(url);
}
