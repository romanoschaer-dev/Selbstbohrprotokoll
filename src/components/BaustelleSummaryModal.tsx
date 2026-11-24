import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Baustelle, Protocol } from '../types/protocol';
import {
  computeBaustelleTotals,
  computeProtocolTotals,
  formatDateDE,
  formatNumber,
  formatRangesSummary,
  getRangesTotal,
  isRowFilled,
  parseDecimal,
} from '../utils/calculations';

interface BaustelleSummaryModalProps {
  isOpen: boolean;
  baustelle: Baustelle;
  protocols: Protocol[];
  onClose: () => void;
  onSelectProtocol: (protocolId: string) => void;
}

export const BaustelleSummaryModal: React.FC<BaustelleSummaryModalProps> = ({
  isOpen,
  baustelle,
  protocols,
  onClose,
  onSelectProtocol,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'anchors'>('overview');

  if (!isOpen) return null;

  const sortedProtocols = [...protocols].sort((a, b) => a.nummer - b.nummer);
  const siteTotals = computeBaustelleTotals(sortedProtocols);

  const allAnchors = sortedProtocols.flatMap((prot) =>
    prot.rows
      .filter(isRowFilled)
      .map((row) => ({
        protocolId: prot.id,
        protocolNummer: prot.nummer,
        row,
      }))
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="site-summary-title"
    >
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col bg-white border border-slate-200 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div>
            <h2 id="site-summary-title" className="text-lg font-semibold text-slate-900">
              Baustellen-Zusammenfassung (alle Anker)
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {baustelle.projekt} · <span className="font-mono">KTR {baustelle.ktr}</span> ·{' '}
              {sortedProtocols.length}{' '}
              {sortedProtocols.length === 1 ? 'Protokoll' : 'Protokolle'} ·{' '}
              <span className="text-slate-500">
                Zusatzfenster — fliesst nicht ins PDF ein
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-md transition-colors"
            aria-label="Zusammenfassung schliessen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="px-6 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gesamtübersicht &amp; Protokolle ({sortedProtocols.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('anchors')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'anchors'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Alle erfassten Anker ({allAnchors.length})
            </button>
          </div>

          <span className="text-xs font-mono tabular-nums text-slate-500">
            Total {formatNumber(siteTotals.anzahl, 0)} St · {formatNumber(siteTotals.bohrmeter)} m ·{' '}
            {formatNumber(siteTotals.injektionsgut)} kg Kümix
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Site-wide Totals Grid */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700">
              Gesamtwerte über die ganze Baustelle
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
              <div className="divide-y divide-slate-100">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-slate-600">Anzahl Anker total</span>
                  <span className="text-sm font-mono tabular-nums font-semibold text-slate-900">
                    {formatNumber(siteTotals.anzahl, 0)} St
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-slate-600">Bohrmeter total</span>
                  <span className="text-sm font-mono tabular-nums font-semibold text-slate-900">
                    {formatNumber(siteTotals.bohrmeter)} m
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-slate-600">Freie Ankerlänge total</span>
                  <span className="text-sm font-mono tabular-nums font-semibold text-slate-900">
                    {formatNumber(siteTotals.freieAnkerlaenge)} m
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-xs text-slate-600">
                    <span className="inline-block w-6 font-mono text-slate-400">///</span>
                    Lockergestein
                  </span>
                  <span className="text-sm font-mono tabular-nums font-semibold text-slate-900">
                    {formatNumber(siteTotals.lockergestein)} m
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-xs text-slate-600">
                    <span className="inline-block w-6 font-mono text-slate-400">X</span>
                    Fels
                  </span>
                  <span className="text-sm font-mono tabular-nums font-semibold text-slate-900">
                    {formatNumber(siteTotals.fels)} m
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-xs text-slate-600">
                    <span className="inline-block w-6 font-mono text-slate-400">0</span>
                    Blöcke / Findlinge
                  </span>
                  <span className="text-sm font-mono tabular-nums font-semibold text-slate-900">
                    {formatNumber(siteTotals.bloecke)} m
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-xs text-slate-600">
                    <span className="inline-block w-6 font-mono text-slate-400">=</span>
                    Beton
                  </span>
                  <span className="text-sm font-mono tabular-nums font-semibold text-slate-900">
                    {formatNumber(siteTotals.beton)} m
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-slate-600">Gruppenstunden total</span>
                  <span className="text-sm font-mono tabular-nums font-semibold text-slate-900">
                    {formatNumber(siteTotals.gruppenstunden)} h
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-slate-600">Injektionsgut (Kümix)</span>
                  <span className="text-base font-mono tabular-nums font-bold text-blue-900">
                    {formatNumber(siteTotals.injektionsgut)} kg
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-slate-600">Komplett ausgefüllt</span>
                  <span className="text-sm font-mono tabular-nums font-semibold text-slate-900">
                    {siteTotals.completeRows} / {sortedProtocols.length * 16}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {activeTab === 'overview' ? (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700">
                Aufschlüsselung nach Protokoll
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[820px]">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                      <th className="py-2 px-3">Protokoll</th>
                      <th className="py-2 px-3">Bohrzweck / Bauteil</th>
                      <th className="py-2 px-3">Bohrmeister</th>
                      <th className="py-2 px-3 text-right">Anker</th>
                      <th className="py-2 px-3 text-right">Bohrmeter</th>
                      <th className="py-2 px-3 text-right">Locker (m)</th>
                      <th className="py-2 px-3 text-right">Fels (m)</th>
                      <th className="py-2 px-3 text-right">Blöcke (m)</th>
                      <th className="py-2 px-3 text-right">Beton (m)</th>
                      <th className="py-2 px-3 text-right">Std (h)</th>
                      <th className="py-2 px-3 text-right">Kümix (kg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sortedProtocols.map((prot) => {
                      const t = computeProtocolTotals(prot.rows);
                      return (
                        <tr
                          key={prot.id}
                          onClick={() => {
                            onSelectProtocol(prot.id);
                            onClose();
                          }}
                          className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 px-3 font-semibold text-blue-800 whitespace-nowrap">
                            Protokoll Nr. {prot.nummer}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            {prot.header.bohrzweck}
                            {prot.header.bauteil && prot.header.bauteil !== prot.header.bohrzweck
                              ? ` (${prot.header.bauteil})`
                              : ''}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {prot.header.bohrmeister || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                            {t.anzahl} / 16
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-medium">
                            {formatNumber(t.bohrmeter)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                            {formatNumber(t.lockergestein)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                            {formatNumber(t.fels)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                            {formatNumber(t.bloecke)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                            {formatNumber(t.beton)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                            {formatNumber(t.gruppenstunden)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold">
                            {formatNumber(t.injektionsgut)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700">
                Einzelauflistung aller erfassten Anker
              </div>
              {allAnchors.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Noch keine Anker in dieser Baustelle erfasst.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[920px]">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                        <th className="py-2 px-3">Protokoll</th>
                        <th className="py-2 px-3">Datum</th>
                        <th className="py-2 px-3">Nr.</th>
                        <th className="py-2 px-3">Neigung</th>
                        <th className="py-2 px-3 text-right">Tot. (m)</th>
                        <th className="py-2 px-3 text-right">Frei (m)</th>
                        <th className="py-2 px-3 text-right">Locker (m)</th>
                        <th className="py-2 px-3 text-right">Fels (m)</th>
                        <th className="py-2 px-3 text-right">Blöcke (von–bis)</th>
                        <th className="py-2 px-3 text-right">Beton (von–bis)</th>
                        <th className="py-2 px-3 text-right">Kümix (kg)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {allAnchors.map(({ protocolId, protocolNummer, row }) => {
                        const bloeckeM = getRangesTotal(row.bloeckeRanges);
                        const bloeckeStr = formatRangesSummary(row.bloeckeRanges);
                        const betonM = getRangesTotal(row.betonRanges);
                        const betonStr = formatRangesSummary(row.betonRanges);

                        return (
                          <tr
                            key={`${protocolId}-${row.pos}`}
                            onClick={() => {
                              onSelectProtocol(protocolId);
                              onClose();
                            }}
                            className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                          >
                            <td className="py-2 px-3 font-mono text-blue-800 whitespace-nowrap">
                              P{protocolNummer} · Pos.{row.pos}
                            </td>
                            <td className="py-2 px-3 font-mono tabular-nums">
                              {formatDateDE(row.datum) || '—'}
                            </td>
                            <td className="py-2 px-3 font-mono font-semibold">
                              {row.nr || '—'}
                            </td>
                            <td className="py-2 px-3 font-mono">{row.neigung || '—'}</td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums">
                              {row.totaleLaenge ? formatNumber(parseDecimal(row.totaleLaenge)) : '0'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums">
                              {row.freieLaenge ? formatNumber(parseDecimal(row.freieLaenge)) : '0'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums">
                              {row.lockergestein ? formatNumber(parseDecimal(row.lockergestein)) : '0'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums">
                              {row.fels ? formatNumber(parseDecimal(row.fels)) : '0'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums">
                              {bloeckeM > 0 ? `${formatNumber(bloeckeM)} m (${bloeckeStr})` : '0'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums">
                              {betonM > 0 ? `${formatNumber(betonM)} m (${betonStr})` : '0'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold">
                              {row.kuemix ? formatNumber(parseDecimal(row.kuemix)) : '0'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors"
          >
            Schliessen
          </button>
        </div>
      </div>
    </div>
  );
};
