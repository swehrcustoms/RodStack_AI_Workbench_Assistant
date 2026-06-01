import { useEffect, useRef, useState } from "react";
import { buildGuideRows, computeNetComponentWeight } from "../../data/seededBlueprint.js";
import { useRodStackData } from "../../context/RodStackDataContext.jsx";
import { getPhotosForBuild } from "../../lib/photoStore.js";

export default function BuildSheetModal({ build, onClose }) {
  const printRef = useRef(null);
  const { data } = useRodStackData();
  const profile = data.profile || {};
  const rows = buildGuideRows(build.guideTrain?.spacingArray || []);
  const net = computeNetComponentWeight(build);
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    getPhotosForBuild(build.id).then(setPhotos).catch(() => setPhotos([]));
  }, [build.id]);

  useEffect(() => {
    const style = document.createElement("style");
    style.id = "build-sheet-print";
    style.textContent = `
      @media print {
        body * { visibility: hidden; }
        #build-sheet-print-root, #build-sheet-print-root * { visibility: visible; }
        #build-sheet-print-root { position: absolute; left: 0; top: 0; width: 100%; background: white; color: black; }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  const downloadPdf = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      await import("jspdf-autotable");
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(build.buildName || build.name, 14, 18);
      doc.setFontSize(10);
      doc.text(`SKU: ${build.sku}  |  ${new Date().toLocaleDateString()}`, 14, 26);
      let y = 34;
      const line = (label, val) => {
        doc.text(`${label}: ${val}`, 14, y);
        y += 6;
      };
      line("Blank", `${build.blankArchitecture?.blankMaterial} ${build.blankArchitecture?.length}`);
      line("Action/Power", `${build.blankArchitecture?.action} / ${build.blankArchitecture?.power}`);
      line("Customer", build.customerName || "—");
      line("Builder", profile.builderName || build.builderName || "—");
      line("Net component wt", net != null ? `${net} oz` : "—");
      doc.autoTable({
        startY: y + 4,
        head: [["Guide", "From Tip", "Delta"]],
        body: rows.map((r) => [r.label, `${r.distance}"`, r.delta == null ? "—" : `${r.delta}"`]),
      });
      doc.save(`${build.sku}-build-sheet.pdf`);
    } catch {
      window.print();
    }
  };

  const SheetBody = () => (
    <div className="space-y-4 text-sm text-slate-900">
      <header className="border-b border-slate-300 pb-3">
        {profile.logoDataUrl && <img src={profile.logoDataUrl} alt="" className="mb-2 h-10" />}
        <h1 className="text-xl font-bold">{build.buildName || build.name}</h1>
        <p className="text-xs text-slate-600">SKU {build.sku} · {build.technique}</p>
        <p className="text-xs">Customer: {build.customerName || "—"} · Builder: {profile.builderName || build.builderName || "—"}</p>
        <p className="text-xs">Date: {new Date().toLocaleDateString()}</p>
      </header>
      <section>
        <h2 className="font-semibold uppercase text-xs tracking-wide">Blank</h2>
        <p>
          {build.blankArchitecture?.manufacturer || "—"} · {build.blankArchitecture?.model || build.blankArchitecture?.blankMaterial} · {build.blankArchitecture?.length}
        </p>
        <p>{build.blankArchitecture?.action} / {build.blankArchitecture?.power}</p>
        <p>Line: {build.blankArchitecture?.lineWindow} · Lure: {build.blankArchitecture?.lureWindow}</p>
      </section>
      <section>
        <h2 className="font-semibold uppercase text-xs tracking-wide">Guide Train</h2>
        <table className="mt-1 w-full border-collapse text-xs">
          <thead>
            <tr className="border-b">
              <th className="py-1 text-left">Guide</th>
              <th className="text-left">From Tip</th>
              <th className="text-left">Interval</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-slate-200">
                <td className="py-1">{r.label}</td>
                <td>{r.distance}"</td>
                <td>{r.delta == null ? "—" : `${r.delta}"`}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-1 text-xs">Stripper to reel: {build.guideTrain?.stripperDistanceToReel}" · {build.guideTrain?.frameMaterial} / {build.guideTrain?.ringMaterial}</p>
      </section>
      <section>
        <h2 className="font-semibold uppercase text-xs tracking-wide">Handle Assembly</h2>
        <p>{build.handleAssembly?.gripStyle}</p>
        <p>Rear: {build.handleAssembly?.rearGripMaterial} ({build.handleAssembly?.rearGripLength}")</p>
        <p>Fore: {build.handleAssembly?.foreGripMaterial} ({build.handleAssembly?.foreGripLength}")</p>
        <p>Seat: {build.handleAssembly?.reelSeatModel} · {build.handleAssembly?.hoodConfig}</p>
        <p>Arbors: {build.handleAssembly?.arborMaterial}</p>
      </section>
      <section>
        <h2 className="font-semibold uppercase text-xs tracking-wide">Thread & Finish</h2>
        <p>Primary: {build.threadColors?.primary || "—"} · Trim: {build.threadColors?.trim || "—"} · Inlay: {build.threadColors?.inlay || "—"}</p>
        <p>Finish: {build.finish?.type || "—"} · Coats: {build.finish?.coatCount ?? "—"}</p>
        <p>Net component weight: {net != null ? `${net} oz` : "—"}</p>
      </section>
      {build.orderNotes && (
        <section>
          <h2 className="font-semibold uppercase text-xs tracking-wide">Order Notes</h2>
          <p>{build.orderNotes}</p>
        </section>
      )}
      {photos.length > 0 && (
        <section>
          <h2 className="font-semibold uppercase text-xs tracking-wide">Build Photos</h2>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {photos.slice(0, 6).map((p) => (
              <div key={p.id}>
                <img src={p.dataUrl} alt={p.caption || p.stage} className="h-16 w-full object-cover rounded" />
                <p className="text-[9px] text-slate-600">{p.stage}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl border border-slate-600 bg-white shadow-xl">
        <div className="sticky top-0 flex justify-end gap-2 border-b border-slate-200 bg-slate-100 p-3">
          <button type="button" onClick={() => window.print()} className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-white">
            Print
          </button>
          <button type="button" onClick={downloadPdf} className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs text-white">
            Download PDF
          </button>
          <button type="button" onClick={onClose} className="rounded-lg border px-3 py-1.5 text-xs">
            Close
          </button>
        </div>
        <div id="build-sheet-print-root" ref={printRef} className="p-6">
          <SheetBody />
        </div>
      </div>
    </div>
  );
}
