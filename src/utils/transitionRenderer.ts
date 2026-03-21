import { Graphics, type Sprite } from "pixi.js";

/** fade/dissolve 트랜지션: alpha 블렌딩 */
export function applyFadeTransition(outSprite: Sprite, inSprite: Sprite, progress: number): void {
	outSprite.alpha = 1 - progress;
	inSprite.alpha = progress;
}

/** wipe 트랜지션: Graphics 마스크로 방향별 클리핑 */
export function applyWipeTransition(
	outSprite: Sprite,
	inSprite: Sprite,
	progress: number,
	direction: "left" | "right",
	pw: number,
	ph: number,
): void {
	outSprite.alpha = 1;
	inSprite.alpha = 1;

	// incoming 클립의 마스크 생성
	const inMask = new Graphics();
	if (direction === "left") {
		// 왼쪽에서 오른쪽으로 incoming이 나타남
		inMask.rect(0, 0, pw * progress, ph).fill({ color: 0xffffff });
	} else {
		// 오른쪽에서 왼쪽으로 incoming이 나타남
		const x = pw * (1 - progress);
		inMask.rect(x, 0, pw * progress, ph).fill({ color: 0xffffff });
	}
	inSprite.mask = inMask;

	// outgoing 클립의 마스크 생성
	const outMask = new Graphics();
	if (direction === "left") {
		const x = pw * progress;
		outMask.rect(x, 0, pw * (1 - progress), ph).fill({ color: 0xffffff });
	} else {
		outMask.rect(0, 0, pw * (1 - progress), ph).fill({ color: 0xffffff });
	}
	outSprite.mask = outMask;
}

/** 트랜지션 효과 리셋 */
export function clearTransitionEffects(sprite: Sprite): void {
	sprite.alpha = 1;
	if (sprite.mask) {
		if (sprite.mask instanceof Graphics) {
			sprite.mask.destroy();
		}
		sprite.mask = null;
	}
}
