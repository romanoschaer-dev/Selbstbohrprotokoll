import React, { useState } from 'react';
import {
  Copy,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Calendar,
  ListOrdered,
  Plus,
  Minus,
} from 'lucide-react';
import { AnchorRow, GroundRange } from '../types/protocol';
import {
  formatNumber,
  getRangesTotal,
  getRowGroundSum,
  hasAnyRangeInput,
  hasInvalidRange,
  isRowFilled,
  parseDecimal,
} from '../utils/calculations';

interface AnchorTableProps {
  rows: AnchorRow[];
  onChangeRow: (pos: number, key: keyof AnchorRow, value: string) => void;
  onChangeRanges: (
    pos: number,
    key: 'bloeckeRanges' | 'betonRanges',
    ranges: GroundRange[]
  ) => void;
  onCopyToAllExceptDateAndNr: (sourcePos: number, onlyEmpty: boolean) => void;
  onCopyDateToAll: (sourcePos: number, onlyEmpty: boolean) => void;
  onFillConsecutiveNumbers: (sourcePos: number) => void;
  onClearRow: (pos: number) => void;
  canUndoBulk: boolean;
  onUndoBulk: () => void;
}

interface RangeCellEditorProps {
  pos: number;
  label: string;
  ranges: GroundRange[];
  onChange: (ranges: GroundRange[]) => void;
}

const RangeCellEditor: React.FC<RangeCellEditorProps> = ({
  pos,
  label,
  ranges,
  onChange,
}) => {
  const total = getRangesTotal(ranges);
  const invalid = hasInvalidRange(ranges);

  const updateRange = (idx: number, field: 'von' | 'bis', val: string) => {
    const next = ranges.map((r, i) => (i === idx ? { ...r, [field]: val } : r));
    onChange(next);
  };

  const addRange = () => {
    onChange([...ranges, { von: '', bis: '' }]);
  };

  const removeRange = (idx: number) => {
    if (ranges.length <= 1) {
      onChange([{ von: '', bis: '' }]);
      return;
    }
    onChange(ranges.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-1">
      {ranges.map((range, idx) => (
        <div key={idx} className="flex items-center gap-1">
          <input
            type="text"
            inputMode="decimal"
            value={range.von}
            onChange={(e) => updateRange(idx, 'von', e.target.value)}
            placeholder="von"
            aria-label={`Anker ${pos} ${label} Bereich ${idx + 1} von Meter`}
            className={`w-12 h-8 px-1 text-xs font-mono tabular-nums text-right bg-white/80 border rounded focus:bg-white focus:outline-none focus:border-blue-700 text-slate-900 placeholder:text-slate-300 ${
              invalid ? 'border-amber-400' : 'border-slate-200 hover:border-slate-300'
            }`}
          />
          <span className="text-slate-400 text-[10px] select-none">–</span>
          <input
            type="text"
            inputMode="decimal"
            value={range.bis}
            onChange={(e) => updateRange(idx, 'bis', e.target.value)}
            placeholder="bis"
            aria-label={`Anker ${pos} ${label} Bereich ${idx + 1} bis Meter`}
            className={`w-12 h-8 px-1 text-xs font-mono tabular-nums text-right bg-white/80 border rounded focus:bg-white focus:outline-none focus:border-blue-700 text-slate-900 placeholder:text-slate-300 ${
              invalid ? 'border-amber-400' : 'border-slate-200 hover:border-slate-300'
            }`}
          />
          {idx === 0 ? (
            <button
              type="button"
              onClick={addRange}
              title={`Weiteren ${label}-Bereich hinzufügen`}
              aria-label={`Weiteren ${label}-Bereich für Anker ${pos} hinzufügen`}
              className="w-6 h-8 flex items-center justify-center text-slate-400 hover:text-blue-800 rounded transition-colors shrink-0"
            >
              <Plus className="w-3 h-3" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => removeRange(idx)}
              title="Bereich entfernen"
              aria-label={`Bereich ${idx + 1} entfernen`}
              className="w-6 h-8 flex items-center justify-center text-slate-400 hover:text-red-700 rounded transition-colors shrink-0"
            >
              <Minus className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
      {total > 0 && (
        <div className="text-[10px] font-mono tabular-nums text-slate-600 text-right pr-6">
          = {formatNumber(total)} m
        </div>
      )}
    </div>
  );
};

export const AnchorTable: React.FC<AnchorTableProps> = ({
  rows,
  onChangeRow,
  onChangeRanges,
  onCopyToAllExceptDateAndNr,
  onCopyDateToAll,
  onFillConsecutiveNumbers,
  onClearRow,
  canUndoBulk,
  onUndoBulk,
}) => {
  const [selectedSourcePos, setSelectedSourcePos] = useState<number>(1);
  const [onlyEmptyTarget, setOnlyEmptyTarget] = useState<boolean>(false);

  const filledCount = rows.filter(isRowFilled).length;
  const sourceRow = rows.find((r) => r.pos === selectedSourcePos) || rows[0];
  const sourceHasCopyableData = Boolean(
    sourceRow.neigung.trim() ||
      parseDecimal(sourceRow.totaleLaenge) > 0 ||
      parseDecimal(sourceRow.freieLaenge) > 0 ||
      parseDecimal(sourceRow.lockergestein) > 0 ||
      parseDecimal(sourceRow.fels) > 0 ||
      hasAnyRangeInput(sourceRow.bloeckeRanges) ||
      hasAnyRangeInput(sourceRow.betonRanges) ||
      parseDecimal(sourceRow.kuemix) > 0
  );

  const hasAnyDate = Boolean(
    sourceRow.datum.trim() || rows.some((r) => r.datum.trim())
  );

  return (
    <section
      aria-label="Ankerprotokoll Einträge (16 Positionen)"
      className="bg-white border border-slate-200 rounded-lg overflow-hidden"
    >
      {/* Table Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-900 whitespace-nowrap">
            Anker-Einträge (1–16)
          </h3>
          <span className="text-slate-300" aria-hidden="true">
            ·
          </span>
          <span className="text-xs font-mono tabular-nums text-slate-600 whitespace-nowrap">
            {filledCount} / 16 erfasst
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <label htmlFor="source-pos-select" className="whitespace-nowrap">
              Vorlage:
            </label>
            <select
              id="source-pos-select"
              value={selectedSourcePos}
              onChange={(e) => setSelectedSourcePos(Number(e.target.value))}
              className="h-9 px-2 text-xs font-mono bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-700"
            >
              {rows.map((r) => (
                <option key={r.pos} value={r.pos}>
                  Pos. {r.pos}
                  {r.nr ? ` (Nr. ${r.nr})` : ''}
                </option>
              ))}
            </select>
          </div>

          <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none px-1.5">
            <input
              type="checkbox"
              checked={onlyEmptyTarget}
              onChange={(e) => setOnlyEmptyTarget(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-300 text-blue-800 focus:ring-blue-700"
            />
            <span className="whitespace-nowrap">Nur leere Zeilen</span>
          </label>

          <button
            type="button"
            disabled={!hasAnyDate}
            onClick={() => onCopyDateToAll(selectedSourcePos, onlyEmptyTarget)}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 disabled:bg-slate-100 disabled:text-slate-400 transition-colors whitespace-nowrap shrink-0"
            title="Übernimmt das Datum der Vorlage-Zeile (oder ersten Zeile mit Datum) für alle Anker."
          >
            <Calendar className="w-3.5 h-3.5" />
            Datum für alle
          </button>

          <button
            type="button"
            onClick={() => onFillConsecutiveNumbers(selectedSourcePos)}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
            title="Nummeriert alle 16 Anker fortlaufend (beginnend bei Startwert von Pos. 1 oder Vorlage-Zeile, Standard 1–16)."
          >
            <ListOrdered className="w-3.5 h-3.5" />
            Nr. fortlaufend
          </button>

          <button
            type="button"
            disabled={!sourceHasCopyableData}
            onClick={() =>
              onCopyToAllExceptDateAndNr(selectedSourcePos, onlyEmptyTarget)
            }
            className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium text-white bg-blue-800 rounded-md hover:bg-blue-900 disabled:bg-slate-300 disabled:text-slate-500 transition-colors whitespace-nowrap shrink-0"
            title="Übernimmt Neigung, Längen, Bodenbeschaffenheit, Gruppenstunden und Kümix von der gewählten Position — Datum und Nr. bleiben unverändert."
          >
            <Copy className="w-3.5 h-3.5" />
            Werte für alle (ohne Datum &amp; Nr.)
          </button>

          {canUndoBulk && (
            <button
              type="button"
              onClick={onUndoBulk}
              className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Rückgängig
            </button>
          )}
        </div>
      </div>

      {/* Responsive Scrollable 16-Row Data Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left min-w-[1220px]">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
              <th className="py-2.5 px-2 text-center w-10 border-r border-slate-200">
                Pos.
              </th>
              <th className="py-2.5 px-2 w-[132px] border-r border-slate-200">
                Datum
              </th>
              <th className="py-2.5 px-2 w-[72px] border-r border-slate-200">
                Nr.
              </th>
              <th className="py-2.5 px-2 w-[72px] border-r border-slate-200">
                Neigung
              </th>
              <th className="py-2.5 px-2 w-[84px] text-right border-r border-slate-200">
                Totale Länge (m)
              </th>
              <th className="py-2.5 px-2 w-[84px] text-right border-r border-slate-200">
                Freie Länge (m)
              </th>
              <th className="py-2.5 px-2 w-[86px] text-right border-r border-slate-200 bg-slate-100/60">
                Lockergest. (m){' '}
                <span className="font-mono text-slate-400">///</span>
              </th>
              <th className="py-2.5 px-2 w-[74px] text-right border-r border-slate-200 bg-slate-100/60">
                Fels (m) <span className="font-mono text-slate-400">X</span>
              </th>
              <th className="py-2.5 px-2 w-[144px] border-r border-slate-200 bg-slate-100/60">
                Blöcke / Findl. (von–bis m){' '}
                <span className="font-mono text-slate-400">0</span>
              </th>
              <th className="py-2.5 px-2 w-[144px] border-r border-slate-200 bg-slate-100/60">
                Beton (von–bis m){' '}
                <span className="font-mono text-slate-400">=</span>
              </th>
              <th className="py-2.5 px-2 w-[72px] text-right border-r border-slate-200">
                Gr.-Std (h)
              </th>
              <th className="py-2.5 px-2 w-[82px] text-right border-r border-slate-200">
                Kümix (kg)
              </th>
              <th className="py-2.5 px-2 w-[84px] text-center">Aktion</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 text-xs">
            {rows.map((row) => {
              const filled = isRowFilled(row);
              const totalM = parseDecimal(row.totaleLaenge);
              const groundSum = getRowGroundSum(row);
              const hasMismatch =
                (totalM > 0 || groundSum > 0) &&
                Math.abs(groundSum - totalM) > 0.01;
              const hasRangeErr =
                hasInvalidRange(row.bloeckeRanges) ||
                hasInvalidRange(row.betonRanges);
              const isSelectedSource = selectedSourcePos === row.pos;

              return (
                <tr
                  key={row.pos}
                  onFocus={() => setSelectedSourcePos(row.pos)}
                  className={`align-top transition-colors ${
                    isSelectedSource
                      ? 'bg-blue-50/40'
                      : row.pos % 2 === 0
                      ? 'bg-slate-50/35 hover:bg-slate-50'
                      : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  {/* Pos */}
                  <td className="py-2.5 px-2 text-center font-mono tabular-nums text-slate-500 border-r border-slate-200">
                    {row.pos}
                  </td>

                  {/* Datum */}
                  <td className="py-1.5 px-1.5 border-r border-slate-200">
                    <input
                      type="date"
                      value={row.datum}
                      onChange={(e) => onChangeRow(row.pos, 'datum', e.target.value)}
                      aria-label={`Anker ${row.pos} Datum`}
                      className="w-full h-8 px-1.5 text-xs font-mono tabular-nums bg-transparent border border-transparent hover:border-slate-300 focus:bg-white focus:border-blue-700 focus:outline-none rounded text-slate-900"
                    />
                  </td>

                  {/* Nr. */}
                  <td className="py-1.5 px-1.5 border-r border-slate-200">
                    <input
                      type="text"
                      value={row.nr}
                      onChange={(e) => onChangeRow(row.pos, 'nr', e.target.value)}
                      placeholder="Nr."
                      aria-label={`Anker ${row.pos} Nummer`}
                      className="w-full h-8 px-2 text-xs font-mono tabular-nums font-semibold bg-transparent border border-transparent hover:border-slate-300 focus:bg-white focus:border-blue-700 focus:outline-none rounded text-slate-900 placeholder:text-slate-300"
                    />
                  </td>

                  {/* Neigung */}
                  <td className="py-1.5 px-1.5 border-r border-slate-200">
                    <input
                      type="text"
                      value={row.neigung}
                      onChange={(e) =>
                        onChangeRow(row.pos, 'neigung', e.target.value)
                      }
                      placeholder="90°"
                      aria-label={`Anker ${row.pos} Neigung`}
                      className="w-full h-8 px-2 text-xs font-mono tabular-nums bg-transparent border border-transparent hover:border-slate-300 focus:bg-white focus:border-blue-700 focus:outline-none rounded text-slate-900 placeholder:text-slate-300"
                    />
                  </td>

                  {/* Totale Länge */}
                  <td className="py-1.5 px-1.5 border-r border-slate-200">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.totaleLaenge}
                      onChange={(e) =>
                        onChangeRow(row.pos, 'totaleLaenge', e.target.value)
                      }
                      placeholder="0.0"
                      aria-label={`Anker ${row.pos} Totale Länge in Metern`}
                      className={`w-full h-8 px-2 text-xs font-mono tabular-nums text-right bg-transparent border border-transparent hover:border-slate-300 focus:bg-white focus:border-blue-700 focus:outline-none rounded text-slate-900 placeholder:text-slate-300 ${
                        hasMismatch ? 'text-amber-700 font-semibold' : ''
                      }`}
                    />
                  </td>

                  {/* Freie Länge */}
                  <td className="py-1.5 px-1.5 border-r border-slate-200">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.freieLaenge}
                      onChange={(e) =>
                        onChangeRow(row.pos, 'freieLaenge', e.target.value)
                      }
                      placeholder="0.0"
                      aria-label={`Anker ${row.pos} Freie Ankerlänge in Metern`}
                      className="w-full h-8 px-2 text-xs font-mono tabular-nums text-right bg-transparent border border-transparent hover:border-slate-300 focus:bg-white focus:border-blue-700 focus:outline-none rounded text-slate-900 placeholder:text-slate-300"
                    />
                  </td>

                  {/* Lockergestein */}
                  <td className="py-1.5 px-1.5 border-r border-slate-200 bg-slate-50/40">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.lockergestein}
                      onChange={(e) =>
                        onChangeRow(row.pos, 'lockergestein', e.target.value)
                      }
                      placeholder="0"
                      aria-label={`Anker ${row.pos} Lockergestein in Metern`}
                      className="w-full h-8 px-2 text-xs font-mono tabular-nums text-right bg-transparent border border-transparent hover:border-slate-300 focus:bg-white focus:border-blue-700 focus:outline-none rounded text-slate-900 placeholder:text-slate-300"
                    />
                  </td>

                  {/* Fels */}
                  <td className="py-1.5 px-1.5 border-r border-slate-200 bg-slate-50/40">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.fels}
                      onChange={(e) => onChangeRow(row.pos, 'fels', e.target.value)}
                      placeholder="0"
                      aria-label={`Anker ${row.pos} Fels in Metern`}
                      className="w-full h-8 px-2 text-xs font-mono tabular-nums text-right bg-transparent border border-transparent hover:border-slate-300 focus:bg-white focus:border-blue-700 focus:outline-none rounded text-slate-900 placeholder:text-slate-300"
                    />
                  </td>

                  {/* Blöcke / Findlinge (von-bis) */}
                  <td className="py-1.5 px-1.5 border-r border-slate-200 bg-slate-50/40">
                    <RangeCellEditor
                      pos={row.pos}
                      label="Findling/Block"
                      ranges={row.bloeckeRanges}
                      onChange={(next) =>
                        onChangeRanges(row.pos, 'bloeckeRanges', next)
                      }
                    />
                  </td>

                  {/* Beton (von-bis) */}
                  <td className="py-1.5 px-1.5 border-r border-slate-200 bg-slate-50/40">
                    <RangeCellEditor
                      pos={row.pos}
                      label="Beton"
                      ranges={row.betonRanges}
                      onChange={(next) =>
                        onChangeRanges(row.pos, 'betonRanges', next)
                      }
                    />
                  </td>

                  {/* Gruppenstunden */}
                  <td className="py-1.5 px-1.5 border-r border-slate-200">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.gruppenstunden}
                      onChange={(e) =>
                        onChangeRow(row.pos, 'gruppenstunden', e.target.value)
                      }
                      placeholder="0"
                      aria-label={`Anker ${row.pos} Gruppenstunden`}
                      className="w-full h-8 px-2 text-xs font-mono tabular-nums text-right bg-transparent border border-transparent hover:border-slate-300 focus:bg-white focus:border-blue-700 focus:outline-none rounded text-slate-900 placeholder:text-slate-300"
                    />
                  </td>

                  {/* Kümix */}
                  <td className="py-1.5 px-1.5 border-r border-slate-200">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.kuemix}
                      onChange={(e) =>
                        onChangeRow(row.pos, 'kuemix', e.target.value)
                      }
                      placeholder="0"
                      aria-label={`Anker ${row.pos} Kümix in kg`}
                      className="w-full h-8 px-2 text-xs font-mono tabular-nums font-medium text-right bg-transparent border border-transparent hover:border-slate-300 focus:bg-white focus:border-blue-700 focus:outline-none rounded text-slate-900 placeholder:text-slate-300"
                    />
                  </td>

                  {/* Actions */}
                  <td className="py-1.5 px-1.5 text-center">
                    <div className="inline-flex items-center justify-center gap-1">
                      {(hasMismatch || hasRangeErr) && (
                        <span
                          className="inline-flex items-center justify-center w-7 h-7 text-amber-700"
                          title={
                            hasRangeErr
                              ? 'Bitte gültigen Von–Bis Bereich angeben (Bis muss grösser als Von sein)'
                              : `Baugrund-Summe (${formatNumber(groundSum)} m) weicht von Totaler Länge (${formatNumber(totalM)} m) ab`
                          }
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {filled && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              onCopyToAllExceptDateAndNr(row.pos, onlyEmptyTarget)
                            }
                            title="Werte dieser Zeile auf alle Anker übernehmen (ausser Datum & Nr.)"
                            aria-label={`Werte von Position ${row.pos} auf alle übernehmen`}
                            className="inline-flex items-center justify-center w-7 h-7 text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onClearRow(row.pos)}
                            title={`Zeile ${row.pos} leeren`}
                            aria-label={`Zeile ${row.pos} leeren`}
                            className="inline-flex items-center justify-center w-7 h-7 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Subtle Table Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-500">
        <span>
          Baugrund: <strong className="font-mono text-slate-700">///</strong> Lockergestein ·{' '}
          <strong className="font-mono text-slate-700">X</strong> Fels ·{' '}
          <strong className="font-mono text-slate-700">0</strong> Blöcke / Findlinge (von–bis m) ·{' '}
          <strong className="font-mono text-slate-700">=</strong> Beton (von–bis m)
        </span>
        {rows.some((r) => {
          const t = parseDecimal(r.totaleLaenge);
          const g = getRowGroundSum(r);
          return (
            ((t > 0 || g > 0) && Math.abs(g - t) > 0.01) ||
            hasInvalidRange(r.bloeckeRanges) ||
            hasInvalidRange(r.betonRanges)
          );
        }) && (
          <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            Bitte markierte Baugrund-Werte bzw. Von–Bis Bereiche prüfen.
          </span>
        )}
      </div>
    </section>
  );
};
