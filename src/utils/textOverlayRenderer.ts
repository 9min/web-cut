import type { Container } from "pixi.js";
import { Text, TextStyle } from "pixi.js";
import { useTimelineStore } from "@/stores/useTimelineStore";
import type { TextOverlay } from "@/types/textOverlay";

/** 드래그 컨텍스트: 텍스트 드래그 시 필요한 정보 */
export interface DragContext {
	trackId: string;
	pw: number;
	ph: number;
}

/** PixiJS Text를 생성하거나 업데이트하여 텍스트 오버레이를 적용 */
export function applyTextOverlay(
	container: Container,
	textRef: React.RefObject<Map<string, Text>>,
	textClipId: string,
	overlay: TextOverlay,
	pw: number,
	ph: number,
	trackId: string,
	dragCtxRef: React.RefObject<Map<string, DragContext>>,
	eventTarget?: Container,
): void {
	const dragTarget = eventTarget ?? container;
	let textObj = textRef.current.get(textClipId);

	if (!textObj) {
		const style = new TextStyle({
			fontSize: overlay.fontSize,
			fill: overlay.fontColor,
		});
		textObj = new Text({ text: overlay.content, style });
		textObj.anchor.set(0.5, 0);
		container.addChild(textObj);
		textRef.current.set(textClipId, textObj);

		// 드래그 인터랙션 등록
		textObj.eventMode = "static";
		textObj.cursor = "grab";

		const textObjRef = textObj;

		const onPointerDown = () => {
			textObjRef.cursor = "grabbing";

			const onPointerMove = (moveEvent: import("pixi.js").FederatedPointerEvent) => {
				const ctx = dragCtxRef.current.get(textClipId);
				if (!ctx) return;
				const local = moveEvent.getLocalPosition(container);
				const newX = Math.round((local.x / ctx.pw) * 100);
				const newY = Math.round((local.y / ctx.ph) * 100);
				const clampedX = Math.max(0, Math.min(100, newX));
				const clampedY = Math.max(0, Math.min(100, newY));
				useTimelineStore.getState().updateTextClipOverlay(ctx.trackId, textClipId, {
					x: clampedX,
					y: clampedY,
				});
			};

			const onPointerUp = () => {
				textObjRef.cursor = "grab";
				dragTarget.off("pointermove", onPointerMove);
				dragTarget.off("pointerup", onPointerUp);
				dragTarget.off("pointerupoutside", onPointerUp);
			};

			dragTarget.on("pointermove", onPointerMove);
			dragTarget.on("pointerup", onPointerUp);
			dragTarget.on("pointerupoutside", onPointerUp);
		};

		textObj.on("pointerdown", onPointerDown);
	} else {
		textObj.text = overlay.content;
		const style = textObj.style as TextStyle;
		style.fontSize = overlay.fontSize;
		style.fill = overlay.fontColor;
	}

	textObj.x = (overlay.x / 100) * pw;
	textObj.y = (overlay.y / 100) * ph;
	textObj.alpha = overlay.opacity / 100;
	textObj.visible = true;

	// 매 프레임 드래그 컨텍스트 업데이트
	dragCtxRef.current.set(textClipId, { trackId, pw, ph });
}

/** 텍스트 오버레이를 제거 */
export function clearTextOverlay(
	_container: Container,
	textRef: React.RefObject<Map<string, Text>>,
	clipId: string,
): void {
	const textObj = textRef.current.get(clipId);
	if (textObj) {
		textObj.visible = false;
	}
}

/** 모든 텍스트 오버레이를 정리 (cleanup용) */
export function destroyAllTextOverlays(textRef: React.RefObject<Map<string, Text>>): void {
	for (const textObj of textRef.current.values()) {
		textObj.destroy(true);
	}
	textRef.current.clear();
}
