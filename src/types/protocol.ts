export interface GroundRange {
  von: string;
  bis: string;
}

export interface AnchorRow {
  pos: number; // 1 to 16
  datum: string; // YYYY-MM-DD or DD.MM.YYYY
  nr: string;
  neigung: string; // e.g. "90°"
  totaleLaenge: string; // m
  freieLaenge: string; // m
  lockergestein: string; // m (///)
  fels: string; // m (X)
  bloeckeRanges: GroundRange[]; // von–bis in m (0)
  betonRanges: GroundRange[]; // von–bis in m (=)
  gruppenstunden: string; // h
  kuemix: string; // kg
}

export interface ProtocolHeader {
  firma: string;
  bauteil: string;
  baufuehrer: string;
  bohrgeraet: string;
  injektionspumpe: string;
  bohrmeister: string;
  bohrmeisterUnterschrift?: string; // PNG data URL
  bohrkroneDurchmesser: string;
  tragglied: string;
  bohrzweck: string;
}

export interface Baustelle {
  id: string;
  projekt: string;
  ktr: string;
  firma: string;
  bauteil: string;
  baufuehrer: string;
  bohrgeraet: string;
  injektionspumpe: string;
  bohrmeister: string;
  bohrmeisterUnterschrift?: string; // PNG data URL
  bohrkroneDurchmesser: string;
  tragglied: string;
  bohrzweck: string;
  createdAt: string;
  updatedAt: string;
}

export interface Protocol {
  id: string;
  baustelleId: string;
  nummer: number;
  titel: string;
  header: ProtocolHeader;
  rows: AnchorRow[]; // Always 16 entries
  pdfExportedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProtocolTotals {
  anzahl: number;
  completeRows: number;
  bohrmeter: number;
  freieAnkerlaenge: number;
  lockergestein: number;
  fels: number;
  bloecke: number;
  beton: number;
  gruppenstunden: number;
  injektionsgut: number;
}
