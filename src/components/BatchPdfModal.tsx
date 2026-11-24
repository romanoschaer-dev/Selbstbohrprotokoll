import React, { useEffect, useState } from 'react';
import { CheckCircle2, Download, FileText, X } from 'lucide-react';
import { Baustelle, Protocol } from '../types/protocol';
import { computeProtocolTotals, formatNumber } from '../utils/calculations';

interface BatchPdfModalProps {
  isOpen: boolean;
  baustelle: Baustelle;
  protocols: Protocol[];
  onClose: () => void;
  onExportSelected: (protocolIds: string[]) => void;
}

function formatExportedTimestamp(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const BatchPdfModal: React.FC<BatchPdfModalProps> = ({
  isOpen,
  baustelle,
  protocols,
  onClose,
  onExportSelected,
}) => {
  const sorted = [...protocols].sort((a, b) => a.nummer - b.nummer);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const unexported = sorted
      .filter((p) => !p.pdfExportedAt)
      .map((p) => p.id);
    setSelectedIds(
      unexported.length > 0 ? unexported : sorted.map((p) => p.id)
    );
  }, [isOpen, baustelle.id]);

  if (!isOpen) return null;

  const toggleId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedIds(sorted.map((p) => p.id));
  const selectUnexported = () =>
    setSelectedIds(sorted.filter((p) => !p.pdfExportedAt).map((p) => p.id));
  const selectNone = () => setSelectedIds([]);

  const handleConfirm = () => {
    if (selectedIds.length === 0) return;
    onExportSelected(selectedIds);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-pdf-title"
    >
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div>
            <h2 id="batch-pdf-title" className="text-lg font-semibold text-slate-900">
              Protokolle zusammen als PDF generieren
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {baustelle.projekt} · <span className="font-mono">KTR {baustelle.ktr}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-md transition-colors"
            aria-label="Dialog schliessen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-600">
              Wählen Sie die Protokolle aus, die in eine gemeinsame PDF-Datei zusammengefasst werden sollen:
            </span>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={selectAll}
                className="text-blue-800 hover:underline font-medium"
              >
                Alle
              </button>
              <button
                type="button"
                onClick={selectUnexported}
                className="text-blue-800 hover:underline font-medium"
              >
                Nur nicht geladene
              </button>
              <button
                type="button"
                onClick={selectNone}
                className="text-slate-500 hover:underline"
              >
                Keine
              </button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 overflow-hidden">
            {sorted.map((prot) => {
              const checked = selectedIds.includes(prot.id);
              const totals = computeProtocolTotals(prot.rows);
              const exportedLabel = formatExportedTimestamp(prot.pdfExportedAt);

              return (
                <label
                  key={prot.id}
                  className={`flex items-center justify-between gap-4 px-4 py-3 cursor-pointer transition-colors ${
                    checked ? 'bg-blue-50/40' : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleId(prot.id)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-800 focus:ring-blue-700 shrink-0"
                    />
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <span>Protokoll Nr. {prot.nummer}</span>
                        <span className="text-slate-300" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-xs font-normal text-slate-600 truncate">
                          {prot.header.bohrzweck}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                        <span className="font-mono tabular-nums">
                          {totals.anzahl} / 16 erfasst
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {formatNumber(totals.bohrmeter)} m
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Bohrmeister: {prot.header.bohrmeister || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {prot.pdfExportedAt ? (
                      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>PDF geladen</span>
                        {exportedLabel && (
                          <span className="text-[11px] font-normal text-slate-500 hidden sm:inline">
                            ({exportedLabel})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Noch nicht geladen</span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
          <span className="text-xs font-mono tabular-nums text-slate-600">
            {selectedIds.length} von {sorted.length} ausgewählt
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={handleConfirm}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-800 rounded-md hover:bg-blue-900 disabled:bg-slate-300 disabled:text-slate-500 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" />
              Sammel-PDF erstellen ({selectedIds.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
