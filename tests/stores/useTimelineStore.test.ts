import { beforeEach, describe, expect, it } from "vitest";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { createTestClip, createTestTrack } from "../factories/timelineFactory";

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
		expect(state.selectedClipId).toBeNull();
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
			expect(useTimelineStore.getState().selectedClipId).toBeNull();
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
			expect(useTimelineStore.getState().selectedClipId).toBe("c1");
		});

		it("null로 선택을 해제한다", () => {
			useTimelineStore.getState().selectClip("c1");
			useTimelineStore.getState().selectClip(null);
			expect(useTimelineStore.getState().selectedClipId).toBeNull();
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

			expect(useTimelineStore.getState().selectedClipId).toBeNull();
		});
	});

	describe("reset", () => {
		it("모든 상태를 초기화한다", () => {
			useTimelineStore.getState().addTrack(createTestTrack());
			useTimelineStore.getState().selectClip("c1");
			useTimelineStore.getState().reset();

			const state = useTimelineStore.getState();
			expect(state.tracks).toHaveLength(1); // 기본 트랙 1개
			expect(state.selectedClipId).toBeNull();
		});
	});

	describe("insertClipAt", () => {
		it("C를 시간 0으로 드래그하면 C(0-5) A(5-10) B(10-15)가 된다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			// A(0-5) B(5-10) C(10-15)
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

			// dropTime=3, A midpoint=2.5 → 3>2.5 → index 1, B midpoint=7.5 → 3<7.5 → index 1
			// 결과: A(0-5), C(5-10), B(10-15)
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
			// A(0-5) _빈(5-8)_ B(8-13)
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "A", trackId: "t1", startTime: 0, duration: 5 }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "B", trackId: "t1", startTime: 8, duration: 5 }));
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "C", trackId: "t1", startTime: 15, duration: 5 }));

			// C를 5로 드래그 → C(5-10), B(8-13)와 겹침 → B(10-15)
			useTimelineStore.getState().insertClipAt("t1", "C", "t1", 5);

			const clips = useTimelineStore.getState().tracks[0]?.clips;
			const clipA = clips?.find((c) => c.id === "A");
			const clipB = clips?.find((c) => c.id === "B");
			const clipC = clips?.find((c) => c.id === "C");
			expect(clipA?.startTime).toBe(0); // A는 안 밀림
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

			// A를 10으로 이동 → otherClips=[B(20-25)], dropTime=10
			// B midpoint=22.5, 10<22.5 → index 0
			// 결과: A(0-5), B(5-10)
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

			// D를 5.5로 드롭 → otherClips=[A(0-3),B(3-6),C(6-9)]
			// A midpoint=1.5, B midpoint=4.5, C midpoint=7.5
			// 5.5 > 4.5, 5.5 < 7.5 → index 2
			// 결과: A(0-3), B(3-6), D(6-9), C(9-12)
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

			// D를 0.5로 드롭 → otherClips=[A(0-3),B(3-6),C(6-9)]
			// A midpoint=1.5, 0.5 < 1.5 → index 0
			// 결과: D(0-3), A(3-6), B(6-9), C(9-12)
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

			// A를 t2의 시간 0으로 삽입 → A(0-5), X(5-10)
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
			// 왼쪽 클립은 outTransition 없음
			const leftClip = clips?.find((c) => c.startTime === 0 && c.duration === 5);
			expect(leftClip?.outTransition).toBeUndefined();
			// 오른쪽 클립이 outTransition을 가짐
			const rightClip = clips?.find((c) => c.startTime === 5 && c.duration === 5);
			expect(rightClip?.outTransition).toEqual({ type: "fade", duration: 0.5 });
		});
	});
});
