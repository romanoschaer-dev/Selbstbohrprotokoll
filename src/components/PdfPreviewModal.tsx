import React from 'react';
import { Download, X } from 'lucide-react';
import { Baustelle, Protocol } from '../types/protocol';
import {
  buildGroundSegments,
  computeProtocolTotals,
  formatDateDE,
  formatNumber,
  formatRangesSummary,
  getRangesTotal,
  isRowFilled,
  parseDecimal,
} from '../utils/calculations';

interface PdfPreviewModalProps {
  isOpen: boolean;
  baustelle: Baustelle;
  protocol: Protocol;
  onClose: () => void;
  onDownload: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  baustelle,
  protocol,
  onClose,
  onDownload,
}) => {
  if (!isOpen) return null;

  const totals = computeProtocolTotals(protocol.rows);
  const firma = protocol.header.firma || baustelle.firma || 'Ghelma AG Spezialtiefbau';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-preview-title"
    >
      <div className="w-full max-w-6xl max-h-[92vh] flex flex-col bg-white border border-slate-200 rounded-lg shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 bg-slate-50 border-b border-slate-200 shrink-0">
          <div>
            <h2 id="pdf-preview-title" className="text-base font-semibold text-slate-900">
              PDF-Vorschau (A4 Querformat)
            </h2>
            <p className="text-xs text-slate-500">
              {baustelle.projekt} · KTR {baustelle.ktr} · Protokoll Nr. {protocol.nummer}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-blue-800 rounded-md hover:bg-blue-900 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              PDF herunterladen
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-md transition-colors"
              aria-label="Vorschau schliessen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sheet Container */}
        <div className="flex-1 overflow-auto bg-slate-200/70 p-4 sm:p-6">
          <div className="mx-auto bg-white border border-slate-300 shadow-sm p-6 min-w-[980px] max-w-[1120px] text-slate-900">
            {/* Sheet Title */}
            <div className="flex items-baseline justify-between mb-3">
              <div className="flex items-baseline gap-6">
                <h3 className="text-lg font-bold tracking-tight">Protokoll Selbstbohrend</h3>
                <span className="text-xs text-slate-600">{firma}</span>
              </div>
              <span className="text-xs font-mono font-semibold">
                Protokoll Nr. {protocol.nummer}
              </span>
            </div>

            {/* 3x3 Header */}
            <div className="grid grid-cols-3 border border-slate-700 text-[11px] mb-3.5">
              <div className="border-r border-slate-300 divide-y divide-slate-200">
                <div className="flex px-2 py-1">
                  <span className="w-20 text-slate-500 font-medium">Projekt:</span>
                  <span className="font-semibold truncate">{baustelle.projekt}</span>
                </div>
                <div className="flex px-2 py-1">
                  <span className="w-20 text-slate-500 font-medium">KTR:</span>
                  <span className="font-mono font-semibold">{baustelle.ktr}</span>
                </div>
                <div className="flex px-2 py-1">
                  <span className="w-20 text-slate-500 font-medium">Bauteil:</span>
                  <span className="font-semibold">{protocol.header.bauteil || protocol.header.bohrzweck}</span>
                </div>
              </div>

              <div className="border-r border-slate-300 divide-y divide-slate-200">
                <div className="flex px-2 py-1">
                  <span className="w-28 text-slate-500 font-medium">Bohrgerät:</span>
                  <span className="font-semibold">{protocol.header.bohrgeraet}</span>
                </div>
                <div className="flex px-2 py-1">
                  <span className="w-28 text-slate-500 font-medium">Injektionspumpe:</span>
                  <span className="font-semibold">{protocol.header.injektionspumpe}</span>
                </div>
                <div className="flex px-2 py-1">
                  <span className="w-28 text-slate-500 font-medium">Bohrmeister:</span>
                  <span className="font-semibold">{protocol.header.bohrmeister}</span>
                </div>
              </div>

              <div className="divide-y divide-slate-200">
                <div className="flex px-2 py-1">
                  <span className="w-24 text-slate-500 font-medium">Bohrkrone Ø:</span>
                  <span className="font-mono font-semibold">{protocol.header.bohrkroneDurchmesser}</span>
                </div>
                <div className="flex px-2 py-1">
                  <span className="w-24 text-slate-500 font-medium">Tragglied:</span>
                  <span className="font-mono font-semibold">{protocol.header.tragglied}</span>
                </div>
                <div className="flex px-2 py-1">
                  <span className="w-24 text-slate-500 font-medium">Bohrzweck:</span>
                  <span className="font-semibold">{protocol.header.bohrzweck}</span>
                </div>
              </div>
            </div>

            {/* 16-Row Table */}
            <table className="w-full border-collapse border border-slate-700 text-[10px] mb-4">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-500 text-slate-800">
                  <th className="border-r border-slate-300 py-1 px-1 text-center w-7">Pos</th>
                  <th className="border-r border-slate-300 py-1 px-1 text-center w-20">Datum</th>
                  <th className="border-r border-slate-300 py-1 px-1 text-center w-10">Nr.</th>
                  <th className="border-r border-slate-300 py-1 px-1 text-center w-12">Neigung</th>
                  <th className="border-r border-slate-300 py-1 px-1 text-right w-12">l Tot. (m)</th>
                  <th className="border-r border-slate-300 py-1 px-1 text-right w-12">lf Frei (m)</th>
                  <th className="border-r border-slate-300 py-1 px-1 text-right w-11">Lock. ///</th>
                  <th className="border-r border-slate-300 py-1 px-1 text-right w-10">Fels X</th>
                  <th className="border-r border-slate-300 py-1 px-1 text-right w-16">Blö. 0 (m)</th>
                  <th className="border-r border-slate-300 py-1 px-1 text-right w-16">Bet. = (m)</th>
                  <th className="border-r border-slate-300 p-0 text-center align-bottom w-[440px]">
                    <div className="py-0.5 px-1 text-[10px]">
                      Grobe Beschreibung des Baugrunds (0.50 m – 20.00 m)
                    </div>
                    <div className="grid grid-cols-[repeat(40,minmax(0,1fr))] border-t border-slate-300 bg-slate-50/80">
                      {Array.from({ length: 40 }, (_, i) => (
                        <span
                          key={i}
                          className="border-r last:border-r-0 border-slate-200 py-0.5 text-[7.5px] font-mono font-normal text-slate-600 text-center leading-none"
                        >
                          {i % 2 === 1 ? (i + 1) / 2 : ''}
                        </span>
                      ))}
                    </div>
                  </th>
                  <th className="border-r border-slate-300 py-1 px-1 text-right w-12">Std (h)</th>
                  <th className="py-1 px-1 text-right w-16">Kümix (kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {protocol.rows.map((row) => {
                  const filled = isRowFilled(row);
                  const segs = filled ? buildGroundSegments(row) : [];
                  const bloeckeTotal = getRangesTotal(row.bloeckeRanges);
                  const bloeckeText = formatRangesSummary(row.bloeckeRanges);
                  const betonTotal = getRangesTotal(row.betonRanges);
                  const betonText = formatRangesSummary(row.betonRanges);
                  return (
                    <tr key={row.pos} className={row.pos % 2 === 0 ? 'bg-slate-50/70' : 'bg-white'}>
                      <td className="border-r border-slate-200 py-1 px-1 text-center font-mono text-slate-400">
                        {row.pos}
                      </td>
                      <td className="border-r border-slate-200 py-1 px-1 text-center font-mono">
                        {filled ? formatDateDE(row.datum) : ''}
                      </td>
                      <td className="border-r border-slate-200 py-1 px-1 text-center font-mono font-semibold">
                        {filled ? row.nr : ''}
                      </td>
                      <td className="border-r border-slate-200 py-1 px-1 text-center font-mono">
                        {filled ? row.neigung : ''}
                      </td>
                      <td className="border-r border-slate-200 py-1 px-1 text-right font-mono tabular-nums">
                        {filled && row.totaleLaenge ? formatNumber(parseDecimal(row.totaleLaenge)) : ''}
                      </td>
                      <td className="border-r border-slate-200 py-1 px-1 text-right font-mono tabular-nums">
                        {filled && row.freieLaenge ? formatNumber(parseDecimal(row.freieLaenge)) : ''}
                      </td>
                      <td className="border-r border-slate-200 py-1 px-1 text-right font-mono tabular-nums">
                        {filled && row.lockergestein ? formatNumber(parseDecimal(row.lockergestein)) : ''}
                      </td>
                      <td className="border-r border-slate-200 py-1 px-1 text-right font-mono tabular-nums">
                        {filled && row.fels ? formatNumber(parseDecimal(row.fels)) : ''}
                      </td>
                      <td className="border-r border-slate-200 py-0.5 px-1 text-right font-mono tabular-nums leading-tight">
                        {filled && bloeckeTotal > 0 ? (
                          <div>
                            <div>{formatNumber(bloeckeTotal)} m</div>
                            <div className="text-[8px] text-slate-500">{bloeckeText}</div>
                          </div>
                        ) : filled ? (
                          '0'
                        ) : (
                          ''
                        )}
                      </td>
                      <td className="border-r border-slate-200 py-0.5 px-1 text-right font-mono tabular-nums leading-tight">
                        {filled && betonTotal > 0 ? (
                          <div>
                            <div>{formatNumber(betonTotal)} m</div>
                            <div className="text-[8px] text-slate-500">{betonText}</div>
                          </div>
                        ) : filled ? (
                          '0'
                        ) : (
                          ''
                        )}
                      </td>
                      <td className="border-r border-slate-200 p-0">
                        <div className="grid grid-cols-[repeat(40,minmax(0,1fr))] h-5">
                          {Array.from({ length: 40 }, (_, i) => {
                            const sym = segs[i];
                            return (
                              <span
                                key={i}
                                className={`border-r last:border-r-0 border-slate-100 flex items-center justify-center text-[7px] font-mono font-bold ${
                                  sym === '///'
                                    ? 'bg-slate-100 text-slate-600'
                                    : sym === 'X'
                                    ? 'bg-slate-200 text-slate-900'
                                    : sym === '0'
                                    ? 'bg-amber-100 text-amber-800'
                                    : sym === '='
                                    ? 'bg-blue-100 text-blue-900'
                                    : ''
                                }`}
                              >
                                {sym || ''}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="border-r border-slate-200 py-1 px-1 text-right font-mono tabular-nums">
                        {filled && row.gruppenstunden ? formatNumber(parseDecimal(row.gruppenstunden)) : ''}
                      </td>
                      <td className="py-1 px-1 text-right font-mono tabular-nums font-semibold">
                        {filled && row.kuemix ? formatNumber(parseDecimal(row.kuemix)) : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-12 text-xs mb-4 px-1">
              <div className="flex items-end gap-2">
                <span className="font-semibold">Bauführer:</span>
                <span className="flex-1 border-b border-slate-500 pb-0.5 text-slate-700">
                  {protocol.header.baufuehrer || '\u00A0'}
                </span>
              </div>
              <div className="flex items-end gap-2">
                <span className="font-semibold">Bohrmeister:</span>
                <span className="flex-1 border-b border-slate-500 pb-0.5 text-slate-700 min-h-[34px] flex items-end">
                  {baustelle.bohrmeisterUnterschrift ||
                  protocol.header.bohrmeisterUnterschrift ? (
                    <img
                      src={
                        baustelle.bohrmeisterUnterschrift ||
                        protocol.header.bohrmeisterUnterschrift
                      }
                      alt="Unterschrift Bohrmeister"
                      className="h-8 w-auto max-w-[220px] object-contain"
                    />
                  ) : (
                    protocol.header.bohrmeister || '\u00A0'
                  )}
                </span>
              </div>
            </div>

            {/* Bottom Summary */}
            <div className="grid grid-cols-4 border border-slate-700 bg-slate-50 text-[11px]">
              <div className="border-r border-slate-300 divide-y divide-slate-200">
                <div className="flex justify-between px-2.5 py-1.5">
                  <span className="font-semibold text-slate-700">Anzahl</span>
                  <span className="font-mono font-bold">{formatNumber(totals.anzahl, 0)} St</span>
                </div>
                <div className="flex justify-between px-2.5 py-1.5">
                  <span className="font-semibold text-slate-700">Bohrmeter</span>
                  <span className="font-mono font-bold">{formatNumber(totals.bohrmeter)} m</span>
                </div>
                <div className="flex justify-between px-2.5 py-1.5">
                  <span className="font-semibold text-slate-700">Freie Ankerlänge</span>
                  <span className="font-mono font-bold">{formatNumber(totals.freieAnkerlaenge)} m</span>
                </div>
              </div>

              <div className="border-r border-slate-300 divide-y divide-slate-200">
                <div className="flex justify-between px-2.5 py-1.5">
                  <span className="font-semibold text-slate-700">/// Lockergestein</span>
                  <span className="font-mono font-bold">{formatNumber(totals.lockergestein)} m</span>
                </div>
                <div className="flex justify-between px-2.5 py-1.5 border-b border-slate-200">
                  <span className="font-semibold text-slate-700">X Fels</span>
                  <span className="font-mono font-bold">{formatNumber(totals.fels)} m</span>
                </div>
              </div>

              <div className="border-r border-slate-300 divide-y divide-slate-200">
                <div className="flex justify-between px-2.5 py-1.5">
                  <span className="font-semibold text-slate-700">0 Blöcke / Findlinge</span>
                  <span className="font-mono font-bold">{formatNumber(totals.bloecke)} m</span>
                </div>
                <div className="flex justify-between px-2.5 py-1.5">
                  <span className="font-semibold text-slate-700">= Beton</span>
                  <span className="font-mono font-bold">{formatNumber(totals.beton)} m</span>
                </div>
                <div className="px-2.5 py-1.5 text-[10px] text-slate-500">&nbsp;</div>
              </div>

              <div className="divide-y divide-slate-200">
                <div className="flex justify-between px-2.5 py-1.5">
                  <span className="font-semibold text-slate-700">Gruppenstunden</span>
                  <span className="font-mono font-bold">{formatNumber(totals.gruppenstunden)} h</span>
                </div>
                <div className="flex justify-between px-2.5 py-1.5 border-b border-slate-200">
                  <span className="font-semibold text-slate-700">Injektionsgut (Kümix)</span>
                  <span className="font-mono font-bold">{formatNumber(totals.injektionsgut)} kg</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
