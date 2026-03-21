import {
	type Application,
	Assets,
	ColorMatrixFilter,
	Container,
	Graphics,
	Sprite,
	type Text,
	Texture,
	VideoSource,
} from "pixi.js";
import { useEffect, useRef } from "react";
import { TRANSFORM_DEFAULTS } from "@/constants/transform";
import { useMediaStore } from "@/stores/useMediaStore";
import { usePlaybackStore } from "@/stores/usePlaybackStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { applyClipFilter, clearClipFilter } from "@/utils/filterRenderer";
import {
	getVisibleAudioClipsAtTime,
	getVisibleClipsAtTime,
	getVisibleTextClipsAtTime,
	type VisibleClip,
} from "@/utils/previewUtils";
import {
	applyTextOverlay,
	clearTextOverlay,
	type DragContext,
	destroyAllTextOverlays,
} from "@/utils/textOverlayRenderer";
import {
	applyFadeTransition,
	applyWipeTransition,
	clearTransitionEffects,
} from "@/utils/transitionRenderer";

interface SpriteEntry {
	sprite: Sprite;
	video: HTMLVideoElement | null;
	colorFilter: ColorMatrixFilter;
}

export function usePreviewRenderer(
	appRef: React.RefObject<Application | null>,
	ready: boolean,
): void {
	const entriesRef = useRef<Map<string, SpriteEntry>>(new Map());
	const audioEntriesRef = useRef<Map<string, HTMLAudioElement>>(new Map());
	const textEntriesRef = useRef<Map<string, Text>>(new Map());
	const dragCtxRef = useRef<Map<string, DragContext>>(new Map());
	const loadingRef = useRef<Set<string>>(new Set());
	const stageContainerRef = useRef<Container | null>(null);
	const textContainerRef = useRef<Container | null>(null);
	const bgRef = useRef<Graphics | null>(null);

	useEffect(() => {
		if (!ready || !appRef.current) return;

		appRef.current.stage.eventMode = "static";

		const container = new Container();
		container.eventMode = "static";
		stageContainerRef.current = container;
		appRef.current.stage.addChild(container);

		const textContainer = new Container();
		textContainer.eventMode = "static";
		textContainerRef.current = textContainer;
		appRef.current.stage.addChild(textContainer);

		return () => {
			for (const entry of entriesRef.current.values()) {
				entry.sprite.destroy(true);
				if (entry.video) {
					entry.video.pause();
					entry.video.src = "";
				}
			}
			entriesRef.current.clear();
			for (const audio of audioEntriesRef.current.values()) {
				audio.pause();
				audio.src = "";
			}
			audioEntriesRef.current.clear();
			destroyAllTextOverlays(textEntriesRef);
			dragCtxRef.current.clear();
			loadingRef.current.clear();

			if (textContainerRef.current) {
				textContainerRef.current.destroy({ children: true });
				textContainerRef.current = null;
			}
			if (stageContainerRef.current) {
				stageContainerRef.current.destroy({ children: true });
				stageContainerRef.current = null;
			}
			bgRef.current = null;
		};
	}, [appRef, ready]);

	useEffect(() => {
		if (!ready || !appRef.current) return;

		const app = appRef.current;
		let rafId = 0;

		const tick = () => {
			rafId = requestAnimationFrame(tick);

			const container = stageContainerRef.current;
			if (!container) return;

			const tracks = useTimelineStore.getState().tracks;
			const currentTime = usePlaybackStore.getState().currentTime;
			const { width: pw, height: ph } = useProjectStore.getState();
			const visible = getVisibleClipsAtTime(tracks, currentTime);

			const scale = Math.min(app.screen.width / pw, app.screen.height / ph);
			container.x = (app.screen.width - pw * scale) / 2;
			container.y = (app.screen.height - ph * scale) / 2;
			container.scale.set(scale);

			// 텍스트 컨테이너도 동일한 위치/스케일 적용
			const textContainer = textContainerRef.current;
			if (textContainer) {
				textContainer.x = container.x;
				textContainer.y = container.y;
				textContainer.scale.set(scale);
			}

			if (!bgRef.current) {
				bgRef.current = new Graphics();
				container.addChild(bgRef.current);
			}
			bgRef.current.clear();
			bgRef.current.rect(0, 0, pw, ph).fill({ color: 0x000000 });

			const activeIds = new Set<string>();

			for (const vc of visible) {
				activeIds.add(vc.clip.id);

				const entry = entriesRef.current.get(vc.clip.id);
				if (!entry) {
					ensureLoaded(vc.clip.id, vc.clip.assetId, container);
					continue;
				}

				entry.sprite.visible = true;
				fitSprite(entry.sprite, pw, ph);

				// 트랜스폼 적용
				if (vc.clip.transform) {
					const t = vc.clip.transform;
					const def = TRANSFORM_DEFAULTS;
					// 위치 오프셋 (50이 중앙)
					entry.sprite.x += ((t.x - def.x) / 100) * pw;
					entry.sprite.y += ((t.y - def.y) / 100) * ph;
					// 스케일
					entry.sprite.width *= t.scaleX;
					entry.sprite.height *= t.scaleY;
					// 회전
					if (t.rotation !== 0) {
						entry.sprite.anchor.set(0.5);
						entry.sprite.x += entry.sprite.width / (2 * t.scaleX);
						entry.sprite.y += entry.sprite.height / (2 * t.scaleY);
						entry.sprite.rotation = (t.rotation * Math.PI) / 180;
					}
				} else {
					entry.sprite.anchor.set(0);
					entry.sprite.rotation = 0;
				}

				clearTransitionEffects(entry.sprite);

				// 필터 적용
				if (vc.clip.filter) {
					applyClipFilter(entry.sprite, entry.colorFilter, vc.clip.filter);
				} else {
					clearClipFilter(entry.sprite, entry.colorFilter);
				}

				if (entry.video) {
					syncVideo(entry.video, vc.localTime);
					entry.video.muted = !!vc.muted;
				}
			}

			// 독립 텍스트 클립 렌더링 (텍스트 전용 컨테이너에 렌더링하여 항상 영상 위에 표시)
			const visibleTextClips = getVisibleTextClipsAtTime(tracks, currentTime);
			const activeTextIds = new Set<string>();
			const tc = textContainerRef.current ?? container;

			for (const vtc of visibleTextClips) {
				activeTextIds.add(vtc.textClip.id);
				if (vtc.textClip.overlay.content) {
					applyTextOverlay(
						tc,
						textEntriesRef,
						vtc.textClip.id,
						vtc.textClip.overlay,
						pw,
						ph,
						vtc.trackId,
						dragCtxRef,
						app.stage,
					);
				} else {
					clearTextOverlay(tc, textEntriesRef, vtc.textClip.id);
				}
			}

			// 비활성 텍스트 클립 숨김
			for (const [id] of textEntriesRef.current) {
				if (!activeTextIds.has(id)) {
					clearTextOverlay(tc, textEntriesRef, id);
				}
			}

			// 오디오 클립 동기화
			const visibleAudio = getVisibleAudioClipsAtTime(tracks, currentTime);
			const activeAudioIds = new Set<string>();

			for (const va of visibleAudio) {
				activeAudioIds.add(va.clip.id);
				const audioKey = va.clip.id;

				if (!audioEntriesRef.current.has(audioKey) && !loadingRef.current.has(audioKey)) {
					loadingRef.current.add(audioKey);
					const asset = useMediaStore.getState().assets.find((a) => a.id === va.clip.assetId);
					if (asset) {
						const audio = document.createElement("audio");
						audio.src = asset.objectUrl;
						audio.preload = "auto";
						audio.addEventListener(
							"loadeddata",
							() => {
								audioEntriesRef.current.set(audioKey, audio);
								loadingRef.current.delete(audioKey);
							},
							{ once: true },
						);
						audio.addEventListener(
							"error",
							() => {
								loadingRef.current.delete(audioKey);
							},
							{ once: true },
						);
						audio.load();
					} else {
						loadingRef.current.delete(audioKey);
					}
				}

				const audio = audioEntriesRef.current.get(audioKey);
				if (audio) {
					audio.volume = va.clip.volume ?? 1.0;
					syncAudio(audio, va.localTime);
				}
			}

			// 비활성 오디오 멈춤
			for (const [id, audio] of audioEntriesRef.current) {
				if (!activeAudioIds.has(id) && !audio.paused) {
					audio.pause();
				}
			}

			// 트랜지션 효과 적용
			applyTransitions(visible, pw, ph);

			for (const [id, entry] of entriesRef.current) {
				if (!activeIds.has(id)) {
					entry.sprite.visible = false;
					clearTransitionEffects(entry.sprite);
					if (entry.video && !entry.video.paused) entry.video.pause();
				}
			}
		};

		const ensureLoaded = (clipId: string, assetId: string, container: Container) => {
			if (loadingRef.current.has(clipId)) return;
			loadingRef.current.add(clipId);

			const asset = useMediaStore.getState().assets.find((a) => a.id === assetId);
			if (!asset) {
				loadingRef.current.delete(clipId);
				return;
			}

			if (asset.type === "video") {
				const video = document.createElement("video");
				video.src = asset.objectUrl;
				video.playsInline = true;
				video.muted = false;
				video.preload = "auto";

				video.addEventListener(
					"loadeddata",
					() => {
						if (!stageContainerRef.current) return;

						const source = new VideoSource({
							resource: video,
							autoPlay: false,
							width: video.videoWidth,
							height: video.videoHeight,
						});
						const texture = new Texture({ source });
						const sprite = new Sprite(texture);
						const colorFilter = new ColorMatrixFilter();
						container.addChild(sprite);

						entriesRef.current.set(clipId, { sprite, video, colorFilter });
						loadingRef.current.delete(clipId);
					},
					{ once: true },
				);

				video.addEventListener(
					"error",
					() => {
						loadingRef.current.delete(clipId);
					},
					{ once: true },
				);

				video.load();
				return;
			}

			if (asset.type === "image") {
				Assets.load<Texture>(asset.objectUrl)
					.then((texture) => {
						if (!stageContainerRef.current) return;

						const sprite = new Sprite(texture);
						const colorFilter = new ColorMatrixFilter();
						container.addChild(sprite);

						entriesRef.current.set(clipId, { sprite, video: null, colorFilter });
						loadingRef.current.delete(clipId);
					})
					.catch(() => {
						loadingRef.current.delete(clipId);
					});
				return;
			}

			loadingRef.current.delete(clipId);
		};

		const syncVideo = (video: HTMLVideoElement, targetTime: number) => {
			const { isPlaying: playing, speed } = usePlaybackStore.getState();

			// 배속에 비례하여 seek 임계값을 확대 (빠를수록 드리프트 허용 범위 증가)
			const seekThreshold = 0.15 * Math.max(1, speed);

			// 비디오 playbackRate를 스토어 배속과 동기화
			if (video.playbackRate !== speed) {
				video.playbackRate = speed;
			}

			if (Math.abs(video.currentTime - targetTime) > seekThreshold) {
				video.currentTime = targetTime;
			}

			if (playing && video.paused) {
				video.play().catch(() => {});
			} else if (!playing && !video.paused) {
				video.pause();
			}
		};

		const syncAudio = (audio: HTMLAudioElement, targetTime: number) => {
			const { isPlaying: playing, speed } = usePlaybackStore.getState();

			const seekThreshold = 0.15 * Math.max(1, speed);

			if (audio.playbackRate !== speed) {
				audio.playbackRate = speed;
			}

			if (Math.abs(audio.currentTime - targetTime) > seekThreshold) {
				audio.currentTime = targetTime;
			}

			if (playing && audio.paused) {
				audio.play().catch(() => {});
			} else if (!playing && !audio.paused) {
				audio.pause();
			}
		};

		const applyTransitions = (visibleClips: VisibleClip[], pw: number, ph: number) => {
			const outgoing = visibleClips.find((v) => v.isOutgoing);
			const incoming = visibleClips.find(
				(v) => v.transitionProgress !== undefined && !v.isOutgoing,
			);

			if (!outgoing || !incoming || outgoing.transitionProgress === undefined) return;

			const outEntry = entriesRef.current.get(outgoing.clip.id);
			const inEntry = entriesRef.current.get(incoming.clip.id);
			if (!outEntry || !inEntry) return;

			const progress = outgoing.transitionProgress;
			const type = outgoing.transitionType;

			switch (type) {
				case "fade":
				case "dissolve":
					applyFadeTransition(outEntry.sprite, inEntry.sprite, progress);
					break;
				case "wipe-left":
					applyWipeTransition(outEntry.sprite, inEntry.sprite, progress, "left", pw, ph);
					break;
				case "wipe-right":
					applyWipeTransition(outEntry.sprite, inEntry.sprite, progress, "right", pw, ph);
					break;
			}
		};

		const fitSprite = (sprite: Sprite, pw: number, ph: number) => {
			const tw = sprite.texture.width;
			const th = sprite.texture.height;
			if (tw === 0 || th === 0) return;
			const s = Math.min(pw / tw, ph / th);
			sprite.width = tw * s;
			sprite.height = th * s;
			sprite.x = (pw - sprite.width) / 2;
			sprite.y = (ph - sprite.height) / 2;
		};

		rafId = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(rafId);
	}, [appRef, ready]);
}
