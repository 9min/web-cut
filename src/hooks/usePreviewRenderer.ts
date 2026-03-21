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
import { useMediaStore } from "@/stores/useMediaStore";
import { usePlaybackStore } from "@/stores/usePlaybackStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { applyClipFilter, clearClipFilter } from "@/utils/filterRenderer";
import {
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
	const textEntriesRef = useRef<Map<string, Text>>(new Map());
	const dragCtxRef = useRef<Map<string, DragContext>>(new Map());
	const loadingRef = useRef<Set<string>>(new Set());
	const stageContainerRef = useRef<Container | null>(null);
	const bgRef = useRef<Graphics | null>(null);

	useEffect(() => {
		if (!ready || !appRef.current) return;

		appRef.current.stage.eventMode = "static";

		const container = new Container();
		container.eventMode = "static";
		stageContainerRef.current = container;
		appRef.current.stage.addChild(container);

		return () => {
			for (const entry of entriesRef.current.values()) {
				entry.sprite.destroy(true);
				if (entry.video) {
					entry.video.pause();
					entry.video.src = "";
				}
			}
			entriesRef.current.clear();
			destroyAllTextOverlays(textEntriesRef);
			dragCtxRef.current.clear();
			loadingRef.current.clear();

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
				clearTransitionEffects(entry.sprite);

				// 필터 적용
				if (vc.clip.filter) {
					applyClipFilter(entry.sprite, entry.colorFilter, vc.clip.filter);
				} else {
					clearClipFilter(entry.sprite, entry.colorFilter);
				}

				if (entry.video) {
					syncVideo(entry.video, vc.localTime);
				}
			}

			// 독립 텍스트 클립 렌더링
			const visibleTextClips = getVisibleTextClipsAtTime(tracks, currentTime);
			const activeTextIds = new Set<string>();

			for (const vtc of visibleTextClips) {
				activeTextIds.add(vtc.textClip.id);
				if (vtc.textClip.overlay.content) {
					applyTextOverlay(
						container,
						textEntriesRef,
						vtc.textClip.id,
						vtc.textClip.overlay,
						pw,
						ph,
						vtc.trackId,
						dragCtxRef,
					);
				} else {
					clearTextOverlay(container, textEntriesRef, vtc.textClip.id);
				}
			}

			// 비활성 텍스트 클립 숨김
			for (const [id] of textEntriesRef.current) {
				if (!activeTextIds.has(id)) {
					clearTextOverlay(container, textEntriesRef, id);
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
			if (Math.abs(video.currentTime - targetTime) > 0.15) {
				video.currentTime = targetTime;
			}
			const playing = usePlaybackStore.getState().isPlaying;
			if (playing && video.paused) {
				video.play().catch(() => {});
			} else if (!playing && !video.paused) {
				video.pause();
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
