import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Baustelle } from '../types/protocol';
import { SignaturePad } from './SignaturePad';

export interface BaustelleFormValues {
  projekt: string;
  ktr: string;
  firma: string;
  bauteil: string;
  baufuehrer: string;
  bohrgeraet: string;
  injektionspumpe: string;
  bohrmeister: string;
  bohrmeisterUnterschrift: string;
  bohrkroneDurchmesser: string;
  tragglied: string;
  bohrzweck: string;
}

interface BaustelleModalProps {
  isOpen: boolean;
  editingBaustelle: Baustelle | null;
  onClose: () => void;
  onSave: (values: BaustelleFormValues) => void;
}

const emptyForm: BaustelleFormValues = {
  projekt: '',
  ktr: '',
  firma: 'Ghelma AG Spezialtiefbau',
  bauteil: '',
  baufuehrer: '',
  bohrgeraet: '',
  injektionspumpe: '',
  bohrmeister: '',
  bohrmeisterUnterschrift: '',
  bohrkroneDurchmesser: '',
  tragglied: '',
  bohrzweck: '',
};

export const BaustelleModal: React.FC<BaustelleModalProps> = ({
  isOpen,
  editingBaustelle,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<BaustelleFormValues>(emptyForm);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    if (editingBaustelle) {
      setForm({
        projekt: editingBaustelle.projekt,
        ktr: editingBaustelle.ktr,
        firma: editingBaustelle.firma || 'Ghelma AG Spezialtiefbau',
        bauteil: editingBaustelle.bauteil || '',
        baufuehrer: editingBaustelle.baufuehrer || '',
        bohrgeraet: editingBaustelle.bohrgeraet,
        injektionspumpe: editingBaustelle.injektionspumpe,
        bohrmeister: editingBaustelle.bohrmeister,
        bohrmeisterUnterschrift: editingBaustelle.bohrmeisterUnterschrift || '',
        bohrkroneDurchmesser: editingBaustelle.bohrkroneDurchmesser,
        tragglied: editingBaustelle.tragglied,
        bohrzweck: editingBaustelle.bohrzweck,
      });
    } else {
      setForm(emptyForm);
    }
    setError('');
  }, [isOpen, editingBaustelle]);

  if (!isOpen) return null;

  const updateField = (key: keyof BaustelleFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const required: Array<[keyof BaustelleFormValues, string]> = [
      ['projekt', 'Projektname'],
      ['ktr', 'KTR-Nummer'],
      ['bohrgeraet', 'Bohrgerät'],
      ['injektionspumpe', 'Injektionspumpe'],
      ['bohrmeister', 'Bohrmeister'],
      ['bohrkroneDurchmesser', 'Bohrkronendurchmesser'],
      ['tragglied', 'Tragglied'],
      ['bohrzweck', 'Bohrzweck'],
    ];

    const missing = required
      .filter(([key]) => !form[key].trim())
      .map(([, label]) => label);

    if (missing.length > 0) {
      setError(`Bitte alle Pflichtfelder ausfüllen: ${missing.join(', ')}`);
      return;
    }

    onSave({
      ...form,
      projekt: form.projekt.trim(),
      ktr: form.ktr.trim(),
      firma: form.firma.trim() || 'Ghelma AG Spezialtiefbau',
      bauteil: form.bauteil.trim() || form.bohrzweck.trim(),
      baufuehrer: form.baufuehrer.trim(),
      bohrgeraet: form.bohrgeraet.trim(),
      injektionspumpe: form.injektionspumpe.trim(),
      bohrmeister: form.bohrmeister.trim(),
      bohrmeisterUnterschrift: form.bohrmeisterUnterschrift,
      bohrkroneDurchmesser: form.bohrkroneDurchmesser.trim(),
      tragglied: form.tragglied.trim(),
      bohrzweck: form.bohrzweck.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="baustelle-modal-title"
    >
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 id="baustelle-modal-title" className="text-lg font-semibold text-slate-900">
              {editingBaustelle ? 'Baustelle bearbeiten' : 'Neue Baustelle erfassen'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Stammdaten werden automatisch für neue Protokolle dieser Baustelle übernommen.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors focus-visible:outline-2 focus-visible:outline-blue-700"
            aria-label="Dialog schliessen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="px-3.5 py-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Projektname <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={form.projekt}
                onChange={(e) => updateField('projekt', e.target.value)}
                placeholder="z.B. Inst. Wartenberggrabenbrücke, Lütschental"
                className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                KTR-Nummer <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={form.ktr}
                onChange={(e) => updateField('ktr', e.target.value)}
                placeholder="z.B. 51449"
                className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Bohrgerät <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={form.bohrgeraet}
                onChange={(e) => updateField('bohrgeraet', e.target.value)}
                placeholder="z.B. BB7000"
                className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Injektionspumpe <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={form.injektionspumpe}
                onChange={(e) => updateField('injektionspumpe', e.target.value)}
                placeholder="z.B. Mungg"
                className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Bohrmeister <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={form.bohrmeister}
                onChange={(e) => updateField('bohrmeister', e.target.value)}
                placeholder="z.B. Cruz Pinto Victor"
                className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Bohrkronendurchmesser (Ø) <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={form.bohrkroneDurchmesser}
                onChange={(e) => updateField('bohrkroneDurchmesser', e.target.value)}
                placeholder="z.B. 90 mm"
                className="w-full h-10 px-3 text-sm font-mono bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Tragglied <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={form.tragglied}
                onChange={(e) => updateField('tragglied', e.target.value)}
                placeholder="z.B. R51/15"
                className="w-full h-10 px-3 text-sm font-mono bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Bohrzweck <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={form.bohrzweck}
                onChange={(e) => updateField('bohrzweck', e.target.value)}
                placeholder="z.B. Kranpfähle"
                className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Bauteil (optional)
              </label>
              <input
                type="text"
                value={form.bauteil}
                onChange={(e) => updateField('bauteil', e.target.value)}
                placeholder="Standard: wie Bohrzweck"
                className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Bauführer (optional)
              </label>
              <input
                type="text"
                value={form.baufuehrer}
                onChange={(e) => updateField('baufuehrer', e.target.value)}
                placeholder="Name Bauführer"
                className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Unternehmen
              </label>
              <input
                type="text"
                value={form.firma}
                onChange={(e) => updateField('firma', e.target.value)}
                placeholder="Ghelma AG Spezialtiefbau"
                className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <SignaturePad
              value={form.bohrmeisterUnterschrift}
              onChange={(dataUrl) => updateField('bohrmeisterUnterschrift', dataUrl)}
              label="Unterschrift Bohrmeister (von Hand erstellen)"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-800 rounded-md hover:bg-blue-900 transition-colors whitespace-nowrap shrink-0"
            >
              {editingBaustelle ? 'Änderungen speichern' : 'Baustelle erfassen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
