/** 오디오 피크 캐시 (assetId → Float32Array) */
export const waveformCache = new Map<string, Float32Array>();

/** channelData에서 numBars개의 피크 값을 추출한다 (0~1 정규화) */
export function extractPeaks(channelData: Float32Array, numBars: number): Float32Array {
	const peaks = new Float32Array(numBars);
	const samplesPerBar = Math.floor(channelData.length / numBars);

	if (samplesPerBar === 0) return peaks;

	for (let i = 0; i < numBars; i++) {
		let max = 0;
		const start = i * samplesPerBar;
		const end = Math.min(start + samplesPerBar, channelData.length);

		for (let j = start; j < end; j++) {
			const abs = Math.abs(channelData[j] ?? 0);
			if (abs > max) max = abs;
		}

		peaks[i] = max;
	}

	return peaks;
}

/** Web Audio API로 오디오 URL에서 피크 데이터를 추출한다 */
export async function loadWaveformPeaks(
	assetId: string,
	url: string,
	numBars: number,
): Promise<Float32Array> {
	const cached = waveformCache.get(assetId);
	if (cached) return cached;

	const response = await fetch(url);
	const arrayBuffer = await response.arrayBuffer();
	const audioContext = new AudioContext();

	try {
		const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
		const channelData = audioBuffer.getChannelData(0);
		const peaks = extractPeaks(channelData, numBars);

		waveformCache.set(assetId, peaks);
		return peaks;
	} finally {
		await audioContext.close();
	}
}
