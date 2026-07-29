import { openDB } from "idb";

const DB_NAME = "rodstack-photos";
const STORE = "photos";

export class PhotoStorageError extends Error {
  constructor(message, code = "storage_error") {
    super(message);
    this.name = "PhotoStorageError";
    this.code = code;
  }
}

async function db() {
  return openDB(DB_NAME, 1, {
    upgrade(database) {
      database.createObjectStore(STORE, { keyPath: "id" });
    },
  });
}

function isQuotaError(err) {
  const name = err?.name || "";
  const message = String(err?.message || err || "");
  return (
    name === "QuotaExceededError" ||
    name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    /quota/i.test(message)
  );
}

async function putRecord(record) {
  try {
    const database = await db();
    await database.put(STORE, record);
    return record;
  } catch (err) {
    if (isQuotaError(err)) {
      throw new PhotoStorageError(
        "Device photo storage is full. Delete older build photos or free disk space, then try again.",
        "quota_exceeded"
      );
    }
    throw new PhotoStorageError(
      "Could not save photo on this device. Photos stay on this browser only.",
      "storage_error"
    );
  }
}

export async function savePhotoBlob({ buildId, stage, caption, blob }) {
  const id = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const reader = new FileReader();
  const dataUrl = await new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new PhotoStorageError("Could not read photo file", "read_error"));
    reader.readAsDataURL(blob);
  });
  const record = { id, buildId, stage, caption, dataUrl, createdAt: new Date().toISOString() };
  return putRecord(record);
}

export async function listPhotosForBuild(buildId) {
  try {
    const database = await db();
    const all = await database.getAll(STORE);
    return all.filter((p) => p.buildId === buildId);
  } catch {
    return [];
  }
}

export async function deletePhoto(id) {
  try {
    const database = await db();
    await database.delete(STORE, id);
  } catch {
    /* non-fatal */
  }
}

export const getPhotosForBuild = listPhotosForBuild;

export async function savePhoto(buildId, { stage, caption, dataUrl, name }) {
  const id = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const record = { id, buildId, stage, caption, dataUrl, name, createdAt: new Date().toISOString() };
  return putRecord(record);
}
