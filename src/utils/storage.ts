import { AnchorRow, Baustelle, GroundRange, Protocol } from '../types/protocol';
import { createEmptyRange, createEmptyRows, parseDecimal } from './calculations';

const BAUSTELLEN_KEY = 'ankerprotokoll_baustellen_v1';
const PROTOCOLS_KEY = 'ankerprotokoll_protokolle_v1';

interface LegacyAnchorRow extends Partial<AnchorRow> {
  bloecke?: string;
  beton?: string;
}

function migrateRow(raw: LegacyAnchorRow, fallbackPos: number): AnchorRow {
  let bloeckeRanges: GroundRange[] =
    Array.isArray(raw.bloeckeRanges) && raw.bloeckeRanges.length > 0
      ? raw.bloeckeRanges.map((r) => ({ von: r?.von ?? '', bis: r?.bis ?? '' }))
      : [createEmptyRange()];

  if (
    (!raw.bloeckeRanges || raw.bloeckeRanges.length === 0) &&
    raw.bloecke &&
    parseDecimal(raw.bloecke) > 0
  ) {
    bloeckeRanges = [{ von: '0', bis: String(parseDecimal(raw.bloecke)) }];
  }

  let betonRanges: GroundRange[] =
    Array.isArray(raw.betonRanges) && raw.betonRanges.length > 0
      ? raw.betonRanges.map((r) => ({ von: r?.von ?? '', bis: r?.bis ?? '' }))
      : [createEmptyRange()];

  if (
    (!raw.betonRanges || raw.betonRanges.length === 0) &&
    raw.beton &&
    parseDecimal(raw.beton) > 0
  ) {
    betonRanges = [{ von: '0', bis: String(parseDecimal(raw.beton)) }];
  }

  return {
    pos: raw.pos ?? fallbackPos,
    datum: raw.datum ?? '',
    nr: raw.nr ?? '',
    neigung: raw.neigung ?? '',
    totaleLaenge: raw.totaleLaenge ?? '',
    freieLaenge: raw.freieLaenge ?? '',
    lockergestein: raw.lockergestein ?? '',
    fels: raw.fels ?? '',
    bloeckeRanges,
    betonRanges,
    gruppenstunden: raw.gruppenstunden ?? '',
    kuemix: raw.kuemix ?? '',
  };
}

export function createSeedData(): { baustellen: Baustelle[]; protocols: Protocol[] } {
  const now = new Date().toISOString();
  const baustelleId = 'bs-wartenberggraben-51449';

  const seedBaustelle: Baustelle = {
    id: baustelleId,
    projekt: 'Inst. Wartenberggrabenbrücke, Lütschental',
    ktr: '51449',
    firma: 'Ghelma AG Spezialtiefbau',
    bauteil: 'Kranpfähle',
    baufuehrer: '',
    bohrgeraet: 'BB7000',
    injektionspumpe: 'Mungg',
    bohrmeister: 'Cruz Pinto Victor',
    bohrkroneDurchmesser: '90 mm',
    tragglied: 'R51/15',
    bohrzweck: 'Kranpfähle',
    createdAt: now,
    updatedAt: now,
  };

  const rows = createEmptyRows();
  rows[0] = {
    pos: 1,
    datum: '2026-05-11',
    nr: '1',
    neigung: '90°',
    totaleLaenge: '9.0',
    freieLaenge: '0',
    lockergestein: '9.0',
    fels: '0',
    bloeckeRanges: [createEmptyRange()],
    betonRanges: [createEmptyRange()],
    gruppenstunden: '0',
    kuemix: '300',
  };
  rows[1] = {
    pos: 2,
    datum: '2026-05-11',
    nr: '2',
    neigung: '90°',
    totaleLaenge: '9.0',
    freieLaenge: '0',
    lockergestein: '9.0',
    fels: '0',
    bloeckeRanges: [createEmptyRange()],
    betonRanges: [createEmptyRange()],
    gruppenstunden: '0',
    kuemix: '300',
  };

  const seedProtocol: Protocol = {
    id: 'pr-wartenberggraben-1',
    baustelleId,
    nummer: 1,
    titel: 'Kranpfähle',
    header: {
      firma: seedBaustelle.firma,
      bauteil: seedBaustelle.bauteil,
      baufuehrer: seedBaustelle.baufuehrer,
      bohrgeraet: seedBaustelle.bohrgeraet,
      injektionspumpe: seedBaustelle.injektionspumpe,
      bohrmeister: seedBaustelle.bohrmeister,
      bohrkroneDurchmesser: seedBaustelle.bohrkroneDurchmesser,
      tragglied: seedBaustelle.tragglied,
      bohrzweck: seedBaustelle.bohrzweck,
    },
    rows,
    createdAt: now,
    updatedAt: now,
  };

  return {
    baustellen: [seedBaustelle],
    protocols: [seedProtocol],
  };
}

export function loadWorkspaceData(): { baustellen: Baustelle[]; protocols: Protocol[] } {
  try {
    const rawBaustellen = localStorage.getItem(BAUSTELLEN_KEY);
    const rawProtocols = localStorage.getItem(PROTOCOLS_KEY);

    if (!rawBaustellen && !rawProtocols) {
      const seed = createSeedData();
      saveWorkspaceData(seed.baustellen, seed.protocols);
      return seed;
    }

    const baustellen: Baustelle[] = rawBaustellen ? JSON.parse(rawBaustellen) : [];
    const parsedProtocols: Protocol[] = rawProtocols ? JSON.parse(rawProtocols) : [];
    const protocols = parsedProtocols.map((p) => ({
      ...p,
      rows: Array.from({ length: 16 }, (_, idx) =>
        migrateRow((p.rows?.[idx] as LegacyAnchorRow) ?? {}, idx + 1)
      ),
    }));

    return { baustellen, protocols };
  } catch {
    return createSeedData();
  }
}

export function saveWorkspaceData(baustellen: Baustelle[], protocols: Protocol[]): void {
  try {
    localStorage.setItem(BAUSTELLEN_KEY, JSON.stringify(baustellen));
    localStorage.setItem(PROTOCOLS_KEY, JSON.stringify(protocols));
  } catch {
    // Storage quota exceeded or unavailable
  }
}

export function downloadLocalBackup(baustellen: Baustelle[], protocols: Protocol[]): void {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    baustellen,
    protocols,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const datePart = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `ankerprotokoll_lokal_backup_${datePart}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseLocalBackup(
  jsonText: string
): { baustellen: Baustelle[]; protocols: Protocol[] } | null {
  try {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed?.baustellen) || !Array.isArray(parsed?.protocols)) {
      return null;
    }
    const protocols: Protocol[] = parsed.protocols.map((p: Protocol) => ({
      ...p,
      rows: Array.from({ length: 16 }, (_, idx) =>
        migrateRow((p.rows?.[idx] as LegacyAnchorRow) ?? {}, idx + 1)
      ),
    }));
    return {
      baustellen: parsed.baustellen,
      protocols,
    };
  } catch {
    return null;
  }
}
