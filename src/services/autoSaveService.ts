import { serializeProject } from "@/utils/projectSerializer";

export const AUTO_SAVE_DB_NAME = "webcut-autosave";
export const AUTO_SAVE_STORE_NAME = "project";
const AUTO_SAVE_KEY = "current";

/** IndexedDB를 열고 object store를 생성한다 */
export function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(AUTO_SAVE_DB_NAME, 1);

		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(AUTO_SAVE_STORE_NAME)) {
				db.createObjectStore(AUTO_SAVE_STORE_NAME);
			}
		};

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

/** 프로젝트 데이터를 IndexedDB에 저장한다 */
export async function saveToIndexedDB(data: unknown): Promise<void> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(AUTO_SAVE_STORE_NAME, "readwrite");
		tx.objectStore(AUTO_SAVE_STORE_NAME).put(data, AUTO_SAVE_KEY);
		tx.oncomplete = () => {
			db.close();
			resolve();
		};
		tx.onerror = () => {
			db.close();
			reject(tx.error);
		};
	});
}

/** IndexedDB에서 자동 저장 데이터를 읽는다 */
export async function loadFromIndexedDB(): Promise<unknown | null> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(AUTO_SAVE_STORE_NAME, "readonly");
		const request = tx.objectStore(AUTO_SAVE_STORE_NAME).get(AUTO_SAVE_KEY);
		request.onsuccess = () => {
			db.close();
			resolve(request.result ?? null);
		};
		request.onerror = () => {
			db.close();
			reject(request.error);
		};
	});
}

/** 자동 저장 데이터를 삭제한다 */
export async function clearAutoSave(): Promise<void> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(AUTO_SAVE_STORE_NAME, "readwrite");
		tx.objectStore(AUTO_SAVE_STORE_NAME).delete(AUTO_SAVE_KEY);
		tx.oncomplete = () => {
			db.close();
			resolve();
		};
		tx.onerror = () => {
			db.close();
			reject(tx.error);
		};
	});
}

/** 현재 프로젝트 상태를 자동 저장한다 */
export async function autoSaveProject(): Promise<void> {
	const data = serializeProject();
	await saveToIndexedDB(data);
}
