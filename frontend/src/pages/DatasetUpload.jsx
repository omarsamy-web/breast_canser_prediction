import { useEffect, useState } from "react";
import { FaCloudUploadAlt, FaDatabase } from "react-icons/fa";
import { getDatasets, uploadDataset } from "../services/api.js";

export default function DatasetUpload() {
  const [file, setFile] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    try { setDatasets(await getDatasets()); } catch { setDatasets([]); }
  }
  useEffect(() => { load(); }, []);

  async function submit() {
    if (!file) return;
    setLoading(true);
    const data = await uploadDataset(file);
    setActive(data);
    await load();
    setLoading(false);
  }

  const preview = active?.stats?.preview || [];

  return (
    <div className="page-grid">
      <section className="glass rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Dataset Upload</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Drag, drop, preview, clean, and analyze CSV datasets.</p>
          </div>
          <button className="btn-primary" disabled={!file || loading} onClick={submit}>
            <FaCloudUploadAlt /> {loading ? "Uploading..." : "Upload CSV"}
          </button>
        </div>
        <label className="mt-6 grid cursor-pointer place-items-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/60 p-10 text-center dark:border-blue-900 dark:bg-blue-950/20">
          <FaCloudUploadAlt className="mb-3 text-4xl text-medical-blue" />
          <span className="font-semibold">{file?.name || "Drop CSV here or select a file"}</span>
          <input type="file" accept=".csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0])} />
        </label>
      </section>

      <div className="grid gap-5 lg:grid-cols-4">
        {["rows", "columns", "nullValues", "duplicateValues"].map((key) => (
          <div className="glass rounded-xl p-5" key={key}>
            <p className="text-sm capitalize text-slate-500 dark:text-slate-400">{key.replace(/([A-Z])/g, " $1")}</p>
            <p className="mt-2 text-2xl font-bold">{active?.stats?.[key] ?? "0"}</p>
          </div>
        ))}
      </div>

      <section className="glass rounded-xl p-5">
        <h3 className="mb-4 flex items-center gap-2 font-bold"><FaDatabase /> Uploaded Datasets</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500"><tr><th className="p-3">File</th><th>Rows</th><th>Columns</th><th>Nulls</th><th>Uploaded</th></tr></thead>
            <tbody>
              {datasets.map((item) => (
                <tr key={item._id} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="p-3 font-semibold">{item.originalName}</td>
                  <td>{item.stats?.rows}</td><td>{item.stats?.columns}</td><td>{item.stats?.nullValues}</td>
                  <td>{new Date(item.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {preview.length > 0 && (
        <section className="glass rounded-xl p-5">
          <h3 className="mb-4 font-bold">Dataset Preview</h3>
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-xs">
              <thead><tr>{Object.keys(preview[0]).map((key) => <th className="sticky top-0 bg-white p-2 text-left dark:bg-slate-900" key={key}>{key}</th>)}</tr></thead>
              <tbody>{preview.map((row, index) => <tr key={index}>{Object.values(row).map((value, i) => <td className="border-t border-slate-100 p-2 dark:border-slate-800" key={i}>{String(value)}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
