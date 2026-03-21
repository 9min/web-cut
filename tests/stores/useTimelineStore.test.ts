import { beforeEach, describe, expect, it } from "vitest";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { createTestClip, createTestTextClip, createTestTrack } from "../factories/timelineFactory";

describe("useTimelineStore", () => {
	beforeEach(() => {
		useTimelineStore.getState().reset();
		// 테스트에서는 기본 트랙 없이 시작
		useTimelineStore.setState({ tracks: [] });
	});

	it("reset 후 기본 비디오 트랙이 1개 존재한다", () => {
		useTimelineStore.getState().reset();
		const state = useTimelineStore.getState();
		expect(state.tracks).toHaveLength(1);
		expect(state.tracks[0]?.type).toBe("video");
		expect(state.selectedClipIds.size).toBe(0);
	});

	describe("addTrack", () => {
		it("트랙을 추가한다", () => {
			const track = createTestTrack({ id: "t1" });
			useTimelineStore.getState().addTrack(track);
			expect(useTimelineStore.getState().tracks).toHaveLength(1);
			expect(useTimelineStore.getState().tracks[0]?.id).toBe("t1");
		});

		it("여러 트랙을 추가한다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t2" }));
			expect(useTimelineStore.getState().tracks).toHaveLength(2);
		});
	});

	describe("removeTrack", () => {
		it("트랙을 제거한다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore.getState().removeTrack("t1");
			expect(useTimelineStore.getState().tracks).toHaveLength(0);
		});

		it("존재하지 않는 ID로 제거해도 에러가 발생하지 않는다", () => {
			expect(() => useTimelineStore.getState().removeTrack("non-existent")).not.toThrow();
		});
	});

	describe("addClip", () => {
		it("특정 트랙에 클립을 추가한다", () => {
			const track = createTestTrack({ id: "t1" });
			useTimelineStore.getState().addTrack(track);

			const clip = createTestClip({ id: "c1", trackId: "t1" });
			useTimelineStore.getState().addClip("t1", clip);

			const tracks = useTimelineStore.getState().tracks;
			expect(tracks[0]?.clips).toHaveLength(1);
			expect(tracks[0]?.clips[0]?.id).toBe("c1");
		});

		it("존재하지 않는 트랙에 추가하면 무시한다", () => {
			const clip = createTestClip();
			useTimelineStore.getState().addClip("non-existent", clip);
			expect(useTimelineStore.getState().tracks).toHaveLength(0);
		});
	});

	describe("removeClip", () => {
		it("특정 트랙에서 클립을 제거한다", () => {
			const track = createTestTrack({ id: "t1" });
			useTimelineStore.getState().addTrack(track);
			useTimelineStore.getState().addClip("t1", createTestClip({ id: "c1", trackId: "t1" }));

			useTimelineStore.getState().removeClip("t1", "c1");
			expect(useTimelineStore.getState().tracks[0]?.clips).toHaveLength(0);
		});

		it("선택된 클립을 제거하면 selectedClipId가 null이 된다", () => {
			const track = createTestTrack({ id: "t1" });
			useTimelineStore.getState().addTrack(track);
			useTimelineStore.getState().addClip("t1", createTestClip({ id: "c1", trackId: "t1" }));
			useTimelineStore.getState().selectClip("c1");

			useTimelineStore.getState().removeClip("t1", "c1");
			expect(useTimelineStore.getState().selectedClipIds.size).toBe(0);
		});
	});

	describe("moveClip", () => {
		it("같은 트랙 내에서 클립을 이동한다", () => {
			const track = createTestTrack({ id: "t1" });
			useTimelineStore.getState().addTrack(track);
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "c1", trackId: "t1", startTime: 0 }));

			useTimelineStore.getState().moveClip("t1", "c1", "t1", 5);
			expect(useTimelineStore.getState().tracks[0]?.clips[0]?.startTime).toBe(5);
		});

		it("다른 트랙으로 클립을 이동한다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t2", type: "audio" }));
			useTimelineStore.getState().addClip("t1", createTestClip({ id: "c1", trackId: "t1" }));

			useTimelineStore.getState().moveClip("t1", "c1", "t2", 3);

			expect(useTimelineStore.getState().tracks[0]?.clips).toHaveLength(0);
			expect(useTimelineStore.getState().tracks[1]?.clips).toHaveLength(1);
			expect(useTimelineStore.getState().tracks[1]?.clips[0]?.startTime).toBe(3);
			expect(useTimelineStore.getState().tracks[1]?.clips[0]?.trackId).toBe("t2");
		});
	});

	describe("selectClip", () => {
		it("클립을 선택한다", () => {
			useTimelineStore.getState().selectClip("c1");
			expect(useTimelineStore.getState().selectedClipIds.has("c1")).toBe(true);
		});

		it("null로 선택을 해제한다", () => {
			useTimelineStore.getState().selectClip("c1");
			useTimelineStore.getState().selectClip(null);
			expect(useTimelineStore.getState().selectedClipIds.size).toBe(0);
		});
	});

	describe("splitClip", () => {
		it("클립을 플레이헤드 위치에서 분할한다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore.getState().addClip(
				"t1",
				createTestClip({
					id: "c1",
					trackId: "t1",
					startTime: 0,
					duration: 10,
					inPoint: 0,
					outPoint: 10,
				}),
			);

			useTimelineStore.getState().splitClip("t1", "c1", 5);

			const clips = useTimelineStore.getState().tracks[0]?.clips;
			expect(clips).toHaveLength(2);
			expect(clips?.[0]?.duration).toBe(5);
			expect(clips?.[1]?.startTime).toBe(5);
			expect(clips?.[1]?.duration).toBe(5);
		});

		it("분할 불가능한 위치에서는 무시한다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "c1", trackId: "t1", startTime: 0, duration: 10 }));

			useTimelineStore.getState().splitClip("t1", "c1", 15);
			expect(useTimelineStore.getState().tracks[0]?.clips).toHaveLength(1);
		});
	});

	describe("trimClip", () => {
		it("클립을 트림한다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore.getState().addClip(
				"t1",
				createTestClip({
					id: "c1",
					trackId: "t1",
					startTime: 0,
					duration: 10,
					inPoint: 0,
					outPoint: 10,
				}),
			);

			useTimelineStore.getState().trimClipAction("t1", "c1", 2, 8);

			const clip = useTimelineStore.getState().tracks[0]?.clips[0];
			expect(clip?.startTime).toBe(2);
			expect(clip?.duration).toBe(6);
		});
	});

	describe("removeClipsByAssetId", () => {
		it("특정 에셋을 참조하는 모든 클립을 제거한다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "c1", trackId: "t1", assetId: "a1" }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "c2", trackId: "t1", assetId: "a2" }));

			useTimelineStore.getState().removeClipsByAssetId("a1");

			const clips = useTimelineStore.getState().tracks[0]?.clips;
			expect(clips).toHaveLength(1);
			expect(clips?.[0]?.assetId).toBe("a2");
		});

		it("선택된 클립이 제거되면 selectedClipId를 null로 리셋한다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "c1", trackId: "t1", assetId: "a1" }));
			useTimelineStore.getState().selectClip("c1");

			useTimelineStore.getState().removeClipsByAssetId("a1");

			expect(useTimelineStore.getState().selectedClipIds.size).toBe(0);
		});
	});

	describe("reset", () => {
		it("모든 상태를 초기화한다", () => {
			useTimelineStore.getState().addTrack(createTestTrack());
			useTimelineStore.getState().selectClip("c1");
			useTimelineStore.getState().reset();

			const state = useTimelineStore.getState();
			expect(state.tracks).toHaveLength(1); // 기본 트랙 1개
			expect(state.selectedClipIds.size).toBe(0);
		});
	});

	describe("insertClipAt", () => {
		it("C를 시간 0으로 드래그하면 C(0-5) A(5-10) B(10-15)가 된다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "A", trackId: "t1", startTime: 0, duration: 5 }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "B", trackId: "t1", startTime: 5, duration: 5 }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "C", trackId: "t1", startTime: 10, duration: 5 }));

			useTimelineStore.getState().insertClipAt("t1", "C", "t1", 0);

			const clips = useTimelineStore.getState().tracks[0]?.clips;
			const clipA = clips?.find((c) => c.id === "A");
			const clipB = clips?.find((c) => c.id === "B");
			const clipC = clips?.find((c) => c.id === "C");
			expect(clipC?.startTime).toBe(0);
			expect(clipA?.startTime).toBe(5);
			expect(clipB?.startTime).toBe(10);
		});

		it("B를 시간 0으로 드래그하면 B(0-5) A(5-10) C(10-15)가 된다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "A", trackId: "t1", startTime: 0, duration: 5 }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "B", trackId: "t1", startTime: 5, duration: 5 }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "C", trackId: "t1", startTime: 10, duration: 5 }));

			useTimelineStore.getState().insertClipAt("t1", "B", "t1", 0);

			const clips = useTimelineStore.getState().tracks[0]?.clips;
			const clipA = clips?.find((c) => c.id === "A");
			const clipB = clips?.find((c) => c.id === "B");
			const clipC = clips?.find((c) => c.id === "C");
			expect(clipB?.startTime).toBe(0);
			expect(clipA?.startTime).toBe(5);
			expect(clipC?.startTime).toBe(10);
		});

		it("C를 시간 3으로 드래그하면 인덱스 기반으로 A,C,B 밀착 배치된다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "A", trackId: "t1", startTime: 0, duration: 5 }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "B", trackId: "t1", startTime: 5, duration: 5 }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "C", trackId: "t1", startTime: 10, duration: 5 }));

			useTimelineStore.getState().insertClipAt("t1", "C", "t1", 3);

			const clips = useTimelineStore.getState().tracks[0]?.clips;
			const clipA = clips?.find((c) => c.id === "A");
			const clipB = clips?.find((c) => c.id === "B");
			const clipC = clips?.find((c) => c.id === "C");
			expect(clipA?.startTime).toBe(0);
			expect(clipC?.startTime).toBe(5);
			expect(clipB?.startTime).toBe(10);
		});

		it("빈 공간이 있을 때 겹치는 클립만 밀린다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "A", trackId: "t1", startTime: 0, duration: 5 }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "B", trackId: "t1", startTime: 8, duration: 5 }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "C", trackId: "t1", startTime: 15, duration: 5 }));

			useTimelineStore.getState().insertClipAt("t1", "C", "t1", 5);

			const clips = useTimelineStore.getState().tracks[0]?.clips;
			const clipA = clips?.find((c) => c.id === "A");
			const clipB = clips?.find((c) => c.id === "B");
			const clipC = clips?.find((c) => c.id === "C");
			expect(clipA?.startTime).toBe(0);
			expect(clipC?.startTime).toBe(5);
			expect(clipB?.startTime).toBe(10);
		});

		it("인덱스 기반이므로 빈 공간 없이 밀착 배치된다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "A", trackId: "t1", startTime: 0, duration: 5 }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "B", trackId: "t1", startTime: 20, duration: 5 }));

			useTimelineStore.getState().insertClipAt("t1", "A", "t1", 10);

			const clips = useTimelineStore.getState().tracks[0]?.clips;
			const clipA = clips?.find((c) => c.id === "A");
			const clipB = clips?.find((c) => c.id === "B");
			expect(clipA?.startTime).toBe(0);
			expect(clipB?.startTime).toBe(5);
		});

		it("A,B,C,D에서 D를 B 뒤(5.5)로 드롭하면 빈 공간 없이 밀착된다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "A", trackId: "t1", startTime: 0, duration: 3 }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "B", trackId: "t1", startTime: 3, duration: 3 }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "C", trackId: "t1", startTime: 6, duration: 3 }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "D", trackId: "t1", startTime: 9, duration: 3 }));

			useTimelineStore.getState().insertClipAt("t1", "D", "t1", 5.5);

			const clips = useTimelineStore.getState().tracks[0]?.clips;
			const clipA = clips?.find((c) => c.id === "A");
			const clipB = clips?.find((c) => c.id === "B");
			const clipC = clips?.find((c) => c.id === "C");
			const clipD = clips?.find((c) => c.id === "D");
			expect(clipA?.startTime).toBe(0);
			expect(clipB?.startTime).toBe(3);
			expect(clipD?.startTime).toBe(6);
			expect(clipC?.startTime).toBe(9);
		});

		it("A,B,C,D에서 D를 A 앞(0.5)으로 드롭하면 D가 맨 앞에 밀착된다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "A", trackId: "t1", startTime: 0, duration: 3 }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "B", trackId: "t1", startTime: 3, duration: 3 }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "C", trackId: "t1", startTime: 6, duration: 3 }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "D", trackId: "t1", startTime: 9, duration: 3 }));

			useTimelineStore.getState().insertClipAt("t1", "D", "t1", 0.5);

			const clips = useTimelineStore.getState().tracks[0]?.clips;
			const clipA = clips?.find((c) => c.id === "A");
			const clipB = clips?.find((c) => c.id === "B");
			const clipC = clips?.find((c) => c.id === "C");
			const clipD = clips?.find((c) => c.id === "D");
			expect(clipD?.startTime).toBe(0);
			expect(clipA?.startTime).toBe(3);
			expect(clipB?.startTime).toBe(6);
			expect(clipC?.startTime).toBe(9);
		});

		it("다른 트랙으로 클립을 삽입 이동한다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t2" }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "A", trackId: "t1", startTime: 0, duration: 5 }));
			useTimelineStore
				.getState()
				.addClip("t2", createTestClip({ id: "X", trackId: "t2", startTime: 0, duration: 5 }));

			useTimelineStore.getState().insertClipAt("t1", "A", "t2", 0);

			const t1clips = useTimelineStore.getState().tracks[0]?.clips;
			const t2clips = useTimelineStore.getState().tracks[1]?.clips;
			expect(t1clips).toHaveLength(0);
			expect(t2clips).toHaveLength(2);
			const clipA = t2clips?.find((c) => c.id === "A");
			const clipX = t2clips?.find((c) => c.id === "X");
			expect(clipA?.startTime).toBe(0);
			expect(clipX?.startTime).toBe(5);
		});
	});

	describe("addTransition", () => {
		it("클립에 outTransition을 추가한다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "A", trackId: "t1", startTime: 0, duration: 5 }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "B", trackId: "t1", startTime: 5, duration: 5 }));

			useTimelineStore.getState().addTransition("t1", "A", { type: "fade", duration: 0.5 });

			const clipA = useTimelineStore.getState().tracks[0]?.clips.find((c) => c.id === "A");
			expect(clipA?.outTransition).toEqual({ type: "fade", duration: 0.5 });
		});

		it("다음 클립이 없으면 트랜지션을 추가하지 않는다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "A", trackId: "t1", startTime: 0, duration: 5 }));

			useTimelineStore.getState().addTransition("t1", "A", { type: "fade", duration: 0.5 });

			const clipA = useTimelineStore.getState().tracks[0]?.clips.find((c) => c.id === "A");
			expect(clipA?.outTransition).toBeUndefined();
		});
	});

	describe("removeTransition", () => {
		it("클립의 outTransition을 제거한다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore.getState().addClip(
				"t1",
				createTestClip({
					id: "A",
					trackId: "t1",
					startTime: 0,
					duration: 5,
					outTransition: { type: "fade", duration: 0.5 },
				}),
			);

			useTimelineStore.getState().removeTransition("t1", "A");

			const clipA = useTimelineStore.getState().tracks[0]?.clips.find((c) => c.id === "A");
			expect(clipA?.outTransition).toBeUndefined();
		});
	});

	describe("updateTransition", () => {
		it("트랜지션 타입을 변경한다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore.getState().addClip(
				"t1",
				createTestClip({
					id: "A",
					trackId: "t1",
					startTime: 0,
					duration: 5,
					outTransition: { type: "fade", duration: 0.5 },
				}),
			);

			useTimelineStore.getState().updateTransition("t1", "A", { type: "dissolve" });

			const clipA = useTimelineStore.getState().tracks[0]?.clips.find((c) => c.id === "A");
			expect(clipA?.outTransition?.type).toBe("dissolve");
			expect(clipA?.outTransition?.duration).toBe(0.5);
		});

		it("outTransition이 없는 클립은 무시한다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "A", trackId: "t1", startTime: 0, duration: 5 }));

			useTimelineStore.getState().updateTransition("t1", "A", { type: "dissolve" });

			const clipA = useTimelineStore.getState().tracks[0]?.clips.find((c) => c.id === "A");
			expect(clipA?.outTransition).toBeUndefined();
		});
	});

	describe("removeClip (트랜지션 정합성)", () => {
		it("클립 삭제 시 이전 클립의 outTransition도 제거한다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore.getState().addClip(
				"t1",
				createTestClip({
					id: "A",
					trackId: "t1",
					startTime: 0,
					duration: 5,
					outTransition: { type: "fade", duration: 0.5 },
				}),
			);
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "B", trackId: "t1", startTime: 5, duration: 5 }));

			useTimelineStore.getState().removeClip("t1", "B");

			const clipA = useTimelineStore.getState().tracks[0]?.clips.find((c) => c.id === "A");
			expect(clipA?.outTransition).toBeUndefined();
		});
	});

	describe("splitClip (트랜지션 정합성)", () => {
		it("분할 시 outTransition을 오른쪽 클립에 이전한다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore.getState().addClip(
				"t1",
				createTestClip({
					id: "A",
					trackId: "t1",
					startTime: 0,
					duration: 10,
					inPoint: 0,
					outPoint: 10,
					outTransition: { type: "fade", duration: 0.5 },
				}),
			);
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "B", trackId: "t1", startTime: 10, duration: 5 }));

			useTimelineStore.getState().splitClip("t1", "A", 5);

			const clips = useTimelineStore.getState().tracks[0]?.clips;
			const leftClip = clips?.find((c) => c.startTime === 0 && c.duration === 5);
			expect(leftClip?.outTransition).toBeUndefined();
			const rightClip = clips?.find((c) => c.startTime === 5 && c.duration === 5);
			expect(rightClip?.outTransition).toEqual({ type: "fade", duration: 0.5 });
		});
	});

	describe("updateFilter", () => {
		it("클립에 필터를 부분 업데이트한다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore.getState().addClip("t1", createTestClip({ id: "c1", trackId: "t1" }));

			useTimelineStore.getState().updateFilter("t1", "c1", { brightness: 50 });

			const clip = useTimelineStore.getState().tracks[0]?.clips[0];
			expect(clip?.filter).toEqual({ brightness: 50, contrast: 0, saturation: 0 });
		});

		it("모든 값을 0으로 되돌리면 filter가 undefined가 된다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore.getState().addClip("t1", createTestClip({ id: "c1", trackId: "t1" }));

			useTimelineStore.getState().updateFilter("t1", "c1", { brightness: 50 });
			useTimelineStore.getState().updateFilter("t1", "c1", { brightness: 0 });

			const clip = useTimelineStore.getState().tracks[0]?.clips[0];
			expect(clip?.filter).toBeUndefined();
		});

		it("기존 필터 위에 부분 업데이트한다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore.getState().addClip("t1", createTestClip({ id: "c1", trackId: "t1" }));

			useTimelineStore.getState().updateFilter("t1", "c1", { brightness: 50 });
			useTimelineStore.getState().updateFilter("t1", "c1", { contrast: -30 });

			const clip = useTimelineStore.getState().tracks[0]?.clips[0];
			expect(clip?.filter).toEqual({ brightness: 50, contrast: -30, saturation: 0 });
		});
	});

	describe("resetFilter", () => {
		it("클립의 필터를 초기화한다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore.getState().addClip("t1", createTestClip({ id: "c1", trackId: "t1" }));

			useTimelineStore.getState().updateFilter("t1", "c1", { brightness: 50 });
			useTimelineStore.getState().resetFilter("t1", "c1");

			const clip = useTimelineStore.getState().tracks[0]?.clips[0];
			expect(clip?.filter).toBeUndefined();
		});
	});

	describe("splitClip (필터 정합성)", () => {
		it("분할 시 양쪽 클립에 필터를 복사한다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore.getState().addClip(
				"t1",
				createTestClip({
					id: "A",
					trackId: "t1",
					startTime: 0,
					duration: 10,
					inPoint: 0,
					outPoint: 10,
					filter: { brightness: 30, contrast: -20, saturation: 50 },
				}),
			);

			useTimelineStore.getState().splitClip("t1", "A", 5);

			const clips = useTimelineStore.getState().tracks[0]?.clips;
			const leftClip = clips?.find((c) => c.startTime === 0 && c.duration === 5);
			const rightClip = clips?.find((c) => c.startTime === 5 && c.duration === 5);

			expect(leftClip?.filter).toEqual({ brightness: 30, contrast: -20, saturation: 50 });
			expect(rightClip?.filter).toEqual({ brightness: 30, contrast: -20, saturation: 50 });
		});
	});

	describe("addTextTrack", () => {
		it("텍스트 타입 트랙을 생성한다", () => {
			useTimelineStore.getState().addTextTrack();
			const tracks = useTimelineStore.getState().tracks;
			expect(tracks).toHaveLength(1);
			expect(tracks[0]?.type).toBe("text");
			expect(tracks[0]?.name).toBe("텍스트 1");
			expect(tracks[0]?.textClips).toEqual([]);
		});

		it("텍스트 트랙 번호가 순차적으로 증가한다", () => {
			useTimelineStore.getState().addTextTrack();
			useTimelineStore.getState().addTextTrack();
			const tracks = useTimelineStore.getState().tracks;
			expect(tracks[1]?.name).toBe("텍스트 2");
		});
	});

	describe("addTextClip", () => {
		it("텍스트 트랙에 텍스트 클립을 추가한다", () => {
			useTimelineStore.getState().addTextTrack();
			const trackId = useTimelineStore.getState().tracks[0]?.id as string;
			const textClip = createTestTextClip({ id: "tc1", trackId });

			useTimelineStore.getState().addTextClip(trackId, textClip);

			const track = useTimelineStore.getState().tracks[0];
			expect(track?.textClips).toHaveLength(1);
			expect(track?.textClips[0]?.id).toBe("tc1");
		});
	});

	describe("updateTextClip", () => {
		it("텍스트 클립의 startTime/duration을 수정한다", () => {
			useTimelineStore.getState().addTextTrack();
			const trackId = useTimelineStore.getState().tracks[0]?.id as string;
			useTimelineStore
				.getState()
				.addTextClip(
					trackId,
					createTestTextClip({ id: "tc1", trackId, startTime: 0, duration: 3 }),
				);

			useTimelineStore.getState().updateTextClip(trackId, "tc1", { startTime: 2, duration: 5 });

			const tc = useTimelineStore.getState().tracks[0]?.textClips[0];
			expect(tc?.startTime).toBe(2);
			expect(tc?.duration).toBe(5);
		});
	});

	describe("updateTextClipOverlay", () => {
		it("텍스트 클립의 overlay 속성을 부분 업데이트한다", () => {
			useTimelineStore.getState().addTextTrack();
			const trackId = useTimelineStore.getState().tracks[0]?.id as string;
			useTimelineStore.getState().addTextClip(trackId, createTestTextClip({ id: "tc1", trackId }));

			useTimelineStore.getState().updateTextClipOverlay(trackId, "tc1", { content: "안녕하세요" });

			const tc = useTimelineStore.getState().tracks[0]?.textClips[0];
			expect(tc?.overlay.content).toBe("안녕하세요");
			expect(tc?.overlay.fontSize).toBe(36);
		});

		it("content 업데이트 시 HTML 태그를 제거한다 (XSS 방지)", () => {
			useTimelineStore.getState().addTextTrack();
			const trackId = useTimelineStore.getState().tracks[0]?.id as string;
			useTimelineStore.getState().addTextClip(trackId, createTestTextClip({ id: "tc1", trackId }));

			useTimelineStore
				.getState()
				.updateTextClipOverlay(trackId, "tc1", { content: "<script>alert(1)</script>" });

			const tc = useTimelineStore.getState().tracks[0]?.textClips[0];
			expect(tc?.overlay.content).toBe("alert(1)");
		});
	});

	describe("removeTextClip", () => {
		it("텍스트 클립을 삭제한다", () => {
			useTimelineStore.getState().addTextTrack();
			const trackId = useTimelineStore.getState().tracks[0]?.id as string;
			useTimelineStore.getState().addTextClip(trackId, createTestTextClip({ id: "tc1", trackId }));

			useTimelineStore.getState().removeTextClip(trackId, "tc1");

			expect(useTimelineStore.getState().tracks[0]?.textClips).toHaveLength(0);
		});

		it("선택된 텍스트 클립을 삭제하면 selectedClipId가 null이 된다", () => {
			useTimelineStore.getState().addTextTrack();
			const trackId = useTimelineStore.getState().tracks[0]?.id as string;
			useTimelineStore.getState().addTextClip(trackId, createTestTextClip({ id: "tc1", trackId }));
			useTimelineStore.getState().selectClip("tc1");

			useTimelineStore.getState().removeTextClip(trackId, "tc1");

			expect(useTimelineStore.getState().selectedClipIds.size).toBe(0);
		});
	});

	describe("moveTextClip", () => {
		it("같은 트랙 내에서 텍스트 클립을 이동한다", () => {
			useTimelineStore.getState().addTextTrack();
			const trackId = useTimelineStore.getState().tracks[0]?.id as string;
			useTimelineStore
				.getState()
				.addTextClip(trackId, createTestTextClip({ id: "tc1", trackId, startTime: 0 }));

			useTimelineStore.getState().moveTextClip(trackId, "tc1", trackId, 5);

			expect(useTimelineStore.getState().tracks[0]?.textClips[0]?.startTime).toBe(5);
		});

		it("다른 텍스트 트랙으로 텍스트 클립을 이동한다", () => {
			useTimelineStore.getState().addTextTrack();
			useTimelineStore.getState().addTextTrack();
			const trackId1 = useTimelineStore.getState().tracks[0]?.id as string;
			const trackId2 = useTimelineStore.getState().tracks[1]?.id as string;
			useTimelineStore
				.getState()
				.addTextClip(trackId1, createTestTextClip({ id: "tc1", trackId: trackId1 }));

			useTimelineStore.getState().moveTextClip(trackId1, "tc1", trackId2, 3);

			expect(useTimelineStore.getState().tracks[0]?.textClips).toHaveLength(0);
			expect(useTimelineStore.getState().tracks[1]?.textClips).toHaveLength(1);
			expect(useTimelineStore.getState().tracks[1]?.textClips[0]?.startTime).toBe(3);
		});
	});
});
