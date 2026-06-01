import { openDB } from "idb";

const DB_NAME = "rodstack-photos";
const STORE = "photos";

async function db() {
  return openDB(DB_NAME, 1, {
    upgrade(database) {
      database.createObjectStore(STORE, { keyPath: "id" });
    },
  });
}

export async function savePhotoBlob({ buildId, stage, caption, blob }) {
  const id = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const reader = new FileReader();
  const dataUrl = await new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  const record = { id, buildId, stage, caption, dataUrl, createdAt: new Date().toISOString() };
  const database = await db();
  await database.put(STORE, record);
  return record;
}

export async function listPhotosForBuild(buildId) {
  const database = await db();
  const all = await database.getAll(STORE);
  return all.filter((p) => p.buildId === buildId);
}

export async function deletePhoto(id) {
  const database = await db();
  await database.delete(STORE, id);
}

export const getPhotosForBuild = listPhotosForBuild;

export async function savePhoto(buildId, { stage, caption, dataUrl, name }) {
  const id = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const record = { id, buildId, stage, caption, dataUrl, name, createdAt: new Date().toISOString() };
  const database = await db();
  await database.put(STORE, record);
  return record;
}
