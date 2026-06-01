const QUEUE_KEY = "rodstack.sync.queue.v1";

export function loadSyncQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSyncQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueueSyncOp(op) {
  const queue = loadSyncQueue();
  queue.push({ ...op, id: `sync-${Date.now()}`, queuedAt: new Date().toISOString() });
  saveSyncQueue(queue);
}

export function clearSyncQueue() {
  saveSyncQueue([]);
}
