import { useEffect, useState } from "react";
import JSZip from "jszip";
import { PHOTO_STAGES } from "../../data/buildRecord.js";
import { getPhotosForBuild, savePhoto, deletePhoto, PhotoStorageError } from "../../lib/photoStore.js";

export default function PhotoLogPanel({ buildId, onPhotosChange }) {
  const [photos, setPhotos] = useState([]);
  const [stage, setStage] = useState(PHOTO_STAGES[0]);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    if (!buildId) {
      setPhotos([]);
      return;
    }
    const list = await getPhotosForBuild(buildId);
    setPhotos(list);
    onPhotosChange?.(list);
  };

  useEffect(() => {
    load();
  }, [buildId]);

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    setError("");
    if (!file || !/^image\/(jpeg|png)$/i.test(file.type)) return;
    if (!buildId) {
      setError("Open a build before adding photos.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await savePhoto(buildId, { stage, caption, dataUrl: reader.result, name: file.name });
        await load();
        setCaption("");
      } catch (err) {
        setError(
          err instanceof PhotoStorageError
            ? err.message
            : "Could not save photo on this device."
        );
      }
    };
    reader.onerror = () => setError("Could not read that image file.");
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const exportZip = async () => {
    const zip = new JSZip();
    photos.forEach((p, i) => {
      const base64 = p.dataUrl.split(",")[1];
      zip.file(`${p.stage || "other"}-${i + 1}.jpg`, base64, { base64: true });
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `build-${buildId}-photos.zip`;
    a.click();
  };

  return (
    <article className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-white">Build Photo Log</h3>
        {photos.length > 0 && (
          <button type="button" onClick={exportZip} className="rounded-lg border border-slate-600 px-3 py-1 text-xs text-slate-300">
            Export Gallery
          </button>
        )}
      </div>

      {photos.length === 0 && (
        <p className="mt-3 text-sm text-slate-500">Upload JPEG/PNG at each build stage — stored locally for offline bench use.</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <select className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm" value={stage} onChange={(e) => setStage(e.target.value)}>
          {PHOTO_STAGES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <input className="min-w-[140px] flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm" placeholder="Caption" value={caption} onChange={(e) => setCaption(e.target.value)} />
        <label className="cursor-pointer rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">
          Upload
          <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={onUpload} />
        </label>
      </div>

      {error && <p className="mt-2 text-sm text-amber-300">{error}</p>}
      <p className="mt-2 text-[11px] text-slate-500">
        Photos stay on this device/browser (not cloud-synced yet).
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-lg border border-slate-700">
            <img src={p.dataUrl} alt={p.caption || p.stage} className="aspect-video w-full object-cover" />
            <div className="p-2 text-xs text-slate-400">
              <p className="text-cyan-300">{p.stage}</p>
              <p>{p.caption}</p>
              <button type="button" className="mt-1 text-red-400" onClick={async () => { await deletePhoto(p.id); load(); }}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
