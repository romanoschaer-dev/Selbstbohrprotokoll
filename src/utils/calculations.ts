import {
  AnchorRow,
  GroundRange,
  Protocol,
  ProtocolTotals,
} from '../types/protocol';

export function parseDecimal(value: string | number | undefined): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? value : 0;
  }
  if (!value) return 0;
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function formatNumber(value: number, maxDecimals = 2): string {
  if (!Number.isFinite(value)) return '0';
  const rounded =
    Math.round(value * Math.pow(10, maxDecimals)) / Math.pow(10, maxDecimals);
  return Number.isInteger(rounded)
    ? rounded.toString()
    : rounded.toFixed(maxDecimals).replace(/\.?0+$/, '');
}

export function formatDateDE(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    return `${isoMatch[3]}.${isoMatch[2]}.${isoMatch[1]}`;
  }
  return trimmed;
}

export function createEmptyRange(): GroundRange {
  return { von: '', bis: '' };
}

export function createEmptyRow(pos: number): AnchorRow {
  return {
    pos,
    datum: '',
    nr: '',
    neigung: '',
    totaleLaenge: '',
    freieLaenge: '',
    lockergestein: '',
    fels: '',
    bloeckeRanges: [createEmptyRange()],
    betonRanges: [createEmptyRange()],
    gruppenstunden: '',
    kuemix: '',
  };
}

export function createEmptyRows(): AnchorRow[] {
  return Array.from({ length: 16 }, (_, idx) => createEmptyRow(idx + 1));
}

export function getRangeLength(range: GroundRange): number {
  if (range.von.trim() === '' || range.bis.trim() === '') return 0;
  const von = parseDecimal(range.von);
  const bis = parseDecimal(range.bis);
  return bis > von ? bis - von : 0;
}

export function getRangesTotal(ranges: GroundRange[] | undefined): number {
  if (!ranges || ranges.length === 0) return 0;
  return ranges.reduce((sum, r) => sum + getRangeLength(r), 0);
}

export function hasAnyRangeInput(ranges: GroundRange[] | undefined): boolean {
  if (!ranges) return false;
  return ranges.some((r) => r.von.trim() !== '' || r.bis.trim() !== '');
}

export function hasInvalidRange(ranges: GroundRange[] | undefined): boolean {
  if (!ranges) return false;
  return ranges.some((r) => {
    const hasVon = r.von.trim() !== '';
    const hasBis = r.bis.trim() !== '';
    if (!hasVon && !hasBis) return false;
    if (hasVon !== hasBis) return true;
    return parseDecimal(r.bis) <= parseDecimal(r.von);
  });
}

export function formatRangesSummary(ranges: GroundRange[] | undefined): string {
  if (!ranges || ranges.length === 0) return '';
  const valid = ranges
    .filter((r) => r.von.trim() !== '' && r.bis.trim() !== '' && parseDecimal(r.bis) > parseDecimal(r.von))
    .map((r) => `${formatNumber(parseDecimal(r.von))}–${formatNumber(parseDecimal(r.bis))}`);
  return valid.join(', ');
}

export function cloneRanges(ranges: GroundRange[]): GroundRange[] {
  if (!ranges || ranges.length === 0) return [createEmptyRange()];
  return ranges.map((r) => ({ von: r.von, bis: r.bis }));
}

export function isRowFilled(row: AnchorRow): boolean {
  return Boolean(
    row.datum.trim() ||
      row.nr.trim() ||
      row.neigung.trim() ||
      parseDecimal(row.totaleLaenge) > 0 ||
      parseDecimal(row.freieLaenge) > 0 ||
      parseDecimal(row.lockergestein) > 0 ||
      parseDecimal(row.fels) > 0 ||
      hasAnyRangeInput(row.bloeckeRanges) ||
      hasAnyRangeInput(row.betonRanges) ||
      parseDecimal(row.gruppenstunden) > 0 ||
      parseDecimal(row.kuemix) > 0
  );
}

export function isRowComplete(row: AnchorRow): boolean {
  const hasGround =
    row.lockergestein.trim() !== '' ||
    row.fels.trim() !== '' ||
    getRangesTotal(row.bloeckeRanges) > 0 ||
    getRangesTotal(row.betonRanges) > 0;

  return Boolean(
    row.datum.trim() &&
      row.nr.trim() &&
      row.neigung.trim() &&
      parseDecimal(row.totaleLaenge) > 0 &&
      hasGround &&
      row.kuemix.trim() !== ''
  );
}

export function getRowGroundSum(row: AnchorRow): number {
  return (
    parseDecimal(row.lockergestein) +
    parseDecimal(row.fels) +
    getRangesTotal(row.bloeckeRanges) +
    getRangesTotal(row.betonRanges)
  );
}

export function computeProtocolTotals(rows: AnchorRow[]): ProtocolTotals {
  let anzahl = 0;
  let completeRows = 0;
  let bohrmeter = 0;
  let freieAnkerlaenge = 0;
  let lockergestein = 0;
  let fels = 0;
  let bloecke = 0;
  let beton = 0;
  let gruppenstunden = 0;
  let injektionsgut = 0;

  for (const row of rows) {
    if (isRowFilled(row)) {
      anzahl += 1;
    }
    if (isRowComplete(row)) {
      completeRows += 1;
    }
    bohrmeter += parseDecimal(row.totaleLaenge);
    freieAnkerlaenge += parseDecimal(row.freieLaenge);
    lockergestein += parseDecimal(row.lockergestein);
    fels += parseDecimal(row.fels);
    bloecke += getRangesTotal(row.bloeckeRanges);
    beton += getRangesTotal(row.betonRanges);
    gruppenstunden += parseDecimal(row.gruppenstunden);
    injektionsgut += parseDecimal(row.kuemix);
  }

  return {
    anzahl,
    completeRows,
    bohrmeter,
    freieAnkerlaenge,
    lockergestein,
    fels,
    bloecke,
    beton,
    gruppenstunden,
    injektionsgut,
  };
}

export function computeBaustelleTotals(siteProtocols: Protocol[]): ProtocolTotals {
  return siteProtocols.reduce<ProtocolTotals>(
    (acc, prot) => {
      const t = computeProtocolTotals(prot.rows);
      return {
        anzahl: acc.anzahl + t.anzahl,
        completeRows: acc.completeRows + t.completeRows,
        bohrmeter: acc.bohrmeter + t.bohrmeter,
        freieAnkerlaenge: acc.freieAnkerlaenge + t.freieAnkerlaenge,
        lockergestein: acc.lockergestein + t.lockergestein,
        fels: acc.fels + t.fels,
        bloecke: acc.bloecke + t.bloecke,
        beton: acc.beton + t.beton,
        gruppenstunden: acc.gruppenstunden + t.gruppenstunden,
        injektionsgut: acc.injektionsgut + t.injektionsgut,
      };
    },
    {
      anzahl: 0,
      completeRows: 0,
      bohrmeter: 0,
      freieAnkerlaenge: 0,
      lockergestein: 0,
      fels: 0,
      bloecke: 0,
      beton: 0,
      gruppenstunden: 0,
      injektionsgut: 0,
    }
  );
}

export function incrementAnchorNumber(baseNr: string, offset: number): string {
  const trimmed = baseNr.trim();
  if (!trimmed) {
    return String(1 + offset);
  }
  const match = /^(.*?)(\d+)$/.exec(trimmed);
  if (!match) {
    return `${trimmed}-${offset + 1}`;
  }
  const prefix = match[1];
  const digits = match[2];
  const nextVal = Number(digits) + offset;
  const padded = String(nextVal).padStart(digits.length, '0');
  return `${prefix}${padded}`;
}

export type GroundSymbol = '///' | 'X' | '0' | '=';

/**
 * Generates up to 40 segments of 0.50m steps (0.50m to 20.00m)
 * Places Beton (=) and Blöcke/Findlinge (0) at their exact von-bis depth positions,
 * then fills remaining borehole depth steps with Lockergestein (///) and Fels (X).
 */
export function buildGroundSegments(row: AnchorRow): Array<GroundSymbol | undefined> {
  const totalSteps = Math.min(
    40,
    Math.max(
      Math.round(parseDecimal(row.totaleLaenge) / 0.5),
      Math.round(getRowGroundSum(row) / 0.5)
    )
  );
  const segments: Array<GroundSymbol | undefined> = Array.from(
    { length: totalSteps },
    () => undefined
  );

  const markRange = (ranges: GroundRange[] | undefined, symbol: GroundSymbol) => {
    if (!ranges) return;
    for (const r of ranges) {
      if (r.von.trim() === '' || r.bis.trim() === '') continue;
      const von = parseDecimal(r.von);
      const bis = parseDecimal(r.bis);
      if (bis <= von) continue;
      for (let i = 0; i < 40; i += 1) {
        const stepStart = i * 0.5;
        const stepEnd = (i + 1) * 0.5;
        const overlap = Math.min(stepEnd, bis) - Math.max(stepStart, von);
        if (overlap >= 0.25) {
          if (i >= segments.length) {
            while (segments.length <= i) segments.push(undefined);
          }
          segments[i] = symbol;
        }
      }
    }
  };

  // Mark Blöcke first, then Beton (if both specified)
  markRange(row.bloeckeRanges, '0');
  markRange(row.betonRanges, '=');

  // Fill remaining empty slots with Lockergestein (///) then Fels (X)
  let lockerRemaining = Math.round(parseDecimal(row.lockergestein) / 0.5);
  let felsRemaining = Math.round(parseDecimal(row.fels) / 0.5);

  for (let i = 0; i < segments.length; i += 1) {
    if (segments[i] !== undefined) continue;
    if (lockerRemaining > 0) {
      segments[i] = '///';
      lockerRemaining -= 1;
    } else if (felsRemaining > 0) {
      segments[i] = 'X';
      felsRemaining -= 1;
    }
  }

  return segments.slice(0, 40);
}
