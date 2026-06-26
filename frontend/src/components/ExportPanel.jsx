import { Download, FileText, History as HistoryIcon, FolderOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useConnection } from "../context/ConnectionContext";
import { exportCsvUrl, exportPdfUrl } from "../api/endpoints";

export default function ExportPanel({ range }) {
  const conn = useConnection();
  const csvUrl = exportCsvUrl(conn, range);
  const pdfUrl = exportPdfUrl(conn, range);
  const disabled = conn.mode === "local";

  return (
    <div className="glass p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <FolderOpen size={16} className="text-sky" />
        <h3 className="font-display text-sm text-textPrimary">Export Data</h3>
      </div>

      {disabled && (
        <p className="text-[11px] text-textMuted -mt-1">
          Export and history need Cloud mode (the ESP32 itself doesn't store past
          readings) — switch modes in Settings.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <a
          href={disabled ? undefined : csvUrl}
          aria-disabled={disabled}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition-colors ${
            disabled
              ? "border-line/40 text-textMuted/50 cursor-not-allowed"
              : "border-line/60 text-textPrimary hover:border-sky hover:text-sky"
          }`}
        >
          <Download size={15} /> Download CSV
        </a>

        <a
          href={disabled ? undefined : pdfUrl}
          aria-disabled={disabled}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition-colors ${
            disabled
              ? "border-line/40 text-textMuted/50 cursor-not-allowed"
              : "border-line/60 text-textPrimary hover:border-sky hover:text-sky"
          }`}
        >
          <FileText size={15} /> Generate Report PDF
        </a>

        <Link
          to="/history"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border border-line/60 text-textPrimary hover:border-sky hover:text-sky transition-colors"
        >
          <HistoryIcon size={15} /> View History
        </Link>
      </div>
    </div>
  );
}
