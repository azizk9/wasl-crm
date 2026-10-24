import { useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, FileUp, LoaderCircle, Upload, X } from 'lucide-react';
import { ErrorBox, Modal, StatusBadge } from '../components/UI';
import { CUSTOMER_STATUSES, SOURCES } from '../lib/constants';
import {
  autoDetectMapping, downloadCSV, CSV_FIELDS, CSV_FIELD_LABELS,
  mapRow, parseCSV, validateRow, type ParsedRow,
} from '../lib/csv';
import type { Customer } from '../types/models';

type Phase = 'upload' | 'mapping' | 'preview' | 'done';

export function ImportModal({
  existingCustomers,
  onImport,
  onClose,
}: {
  existingCustomers: Customer[];
  onImport: (rows: { name: string; phone: string; email: string; source: string; status: string }[]) => Promise<{ inserted: number; skipped: number }>;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('upload');
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, number>>({ name: -1, phone: -1, email: -1, source: -1, status: -1 });
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [skipInvalid, setSkipInvalid] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const existingPhones = useMemo(() => new Set(existingCustomers.map(c => c.phone.replace(/\D/g, '')).filter(Boolean)), [existingCustomers]);
  const existingEmails = useMemo(() => new Set(existingCustomers.map(c => c.email.toLowerCase()).filter(Boolean)), [existingCustomers]);

  const parsedRows: ParsedRow[] = useMemo(() => {
    if (phase !== 'preview' && phase !== 'done') return [];
    return rawRows.map((cols, i) => {
      const mapped = mapRow(cols, mapping as Record<keyof typeof mapping, number>);
      return validateRow(mapped, existingPhones, existingEmails, i + 2);
    });
  }, [phase, rawRows, mapping, existingPhones, existingEmails]);

  const validCount = parsedRows.filter(r => r.valid && (!r.duplicate || !skipDuplicates)).length;
  const invalidCount = parsedRows.filter(r => !r.valid).length;
  const duplicateCount = parsedRows.filter(r => r.duplicate).length;

  const handleFile = (file: File) => {
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? '');
        const rows = parseCSV(text);
        if (rows.length < 2) { setError('الملف لا يحتوي على بيانات كافية. تأكد من وجود صف رؤوس وصف بيانات واحد على الأقل.'); return; }
        const hdr = rows[0].map(h => h.trim());
        const data = rows.slice(1);
        setHeaders(hdr);
        setRawRows(data);
        setMapping(autoDetectMapping(hdr));
        setFileName(file.name);
        setPhase('mapping');
      } catch {
        setError('تعذر قراءة الملف. تأكد أنه بصيغة CSV صحيح.');
      }
    };
    reader.onerror = () => setError('تعذر قراءة الملف.');
    reader.readAsText(file, 'UTF-8');
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const startPreview = () => {
    if (mapping.name < 0) { setError('يجب تعيين عمود الاسم على الأقل.'); return; }
    setError('');
    setPhase('preview');
  };

  const doImport = async () => {
    setImporting(true);
    setError('');
    try {
      const toImport = parsedRows
        .filter(r => {
          if (!r.valid) return !skipInvalid ? false : false;
          if (r.duplicate && skipDuplicates) return false;
          return true;
        })
        .map(r => ({
          name: r.normalized.name,
          phone: r.normalized.phone,
          email: r.normalized.email,
          source: r.normalized.source,
          status: r.normalized.status,
        }));
      if (!toImport.length) { setError('لا توجد سجلات صالحة للاستيراد بعد تطبيق الفلاتر.'); setImporting(false); return; }
      const res = await onImport(toImport);
      setResult(res);
      setPhase('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الاستيراد.');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    downloadCSV('wasl-customers-template.csv', '\uFEFFالاسم,الهاتف,البريد الإلكتروني,المصدر,الحالة\nأحمد محمد,+963999888777,ahmed@example.com,إنستغرام,جديد\n');
  };

  const reset = () => { setPhase('upload'); setRawRows([]); setHeaders([]); setFileName(''); setError(''); setResult(null); if (fileRef.current) fileRef.current.value = ''; };

  return (
    <Modal title="استيراد عملاء من CSV" subtitle="ارفع ملف CSV لاستيراد بيانات عملائك بالعربية أو الإنجليزية" wide onClose={onClose}>
      {error && <ErrorBox message={error} />}

      {phase === 'upload' && (
        <div className="import-upload-zone"
          onDragOver={e => e.preventDefault()}
          onDrop={onDrop}
        >
          <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" className="import-file-input" id="csv-file-input"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <label htmlFor="csv-file-input" className="import-drop-label">
            <Upload size={36} />
            <h3>اسحب ملف CSV هنا أو اضغط للاختيار</h3>
            <p className="muted">يدعم العربية والإنجليزية · الأعمدة: الاسم، الهاتف، البريد، المصدر، الحالة</p>
          </label>
          <button className="btn btn-ghost btn-small" onClick={downloadTemplate}>
            <FileUp size={15} /> تحميل قالب فارغ
          </button>
        </div>
      )}

      {phase === 'mapping' && (
        <div className="import-mapping">
          <div className="import-file-info">
            <CheckCircle2 size={18} style={{ color: '#20ae79' }} />
            <span>تم قراءة <b>{rawRows.length}</b> صف من <b>{fileName}</b></span>
          </div>
          <p className="muted" style={{ margin: '16px 0 10px' }}>حدد عمود الملف الذي يتوافق مع كل حقل. تم الكشف التلقائي — عدّله إن لزم.</p>
          <div className="mapping-grid">
            {CSV_FIELDS.map(field => {
              const idx = mapping[field];
              return (
                <div className="mapping-row" key={field}>
                  <label className="mapping-label">{CSV_FIELD_LABELS[field]}{field === 'name' && <b className="required"> *</b>}</label>
                  <select className="filter-select mapping-select" value={idx}
                    onChange={e => setMapping(m => ({ ...m, [field]: Number(e.target.value) }))}>
                    <option value={-1}>— تجاهل —</option>
                    {headers.map((h, i) => <option key={i} value={i}>{h || `العمود ${i + 1}`}</option>)}
                  </select>
                  {idx >= 0 ? <span className="mapping-preview">{rawRows[0]?.[idx] || '—'}</span> : <span className="muted">—</span>}
                </div>
              );
            })}
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={reset}><X size={16} /> إلغاء</button>
            <button className="btn btn-primary" onClick={startPreview}><ArrowLeft size={16} /> معاينة وتحقق</button>
          </div>
        </div>
      )}

      {phase === 'preview' && (
        <div className="import-preview">
          <div className="preview-summary">
            <div className="preview-stat preview-stat-ok"><strong>{validCount}</strong><span>صالح للاستيراد</span></div>
            <div className="preview-stat preview-stat-warn"><strong>{duplicateCount}</strong><span>مكرر</span></div>
            <div className="preview-stat preview-stat-err"><strong>{invalidCount}</strong><span>غير صالح</span></div>
          </div>
          <div className="preview-options">
            <label className="checkbox-label">
              <input type="checkbox" checked={skipDuplicates} onChange={e => setSkipDuplicates(e.target.checked)} />
              تخطي السجلات المكررة (الهاتف أو البريد موجود)
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={skipInvalid} onChange={e => setSkipInvalid(e.target.checked)} />
              تخطي السجلات غير الصالحة (اسم ناقص)
            </label>
          </div>
          <div className="preview-table-wrap">
            <table className="data-table preview-table">
              <thead><tr><th>#</th><th>الاسم</th><th>الهاتف</th><th>البريد</th><th>المصدر</th><th>الحالة</th><th>النتيجة</th></tr></thead>
              <tbody>
                {parsedRows.slice(0, 50).map(r => (
                  <tr key={r.rowIndex} className={r.duplicate ? 'preview-row-dup' : !r.valid ? 'preview-row-err' : 'preview-row-ok'}>
                    <td className="muted">{r.rowIndex}</td>
                    <td>{r.normalized.name || <span className="muted">—</span>}</td>
                    <td dir="ltr">{r.normalized.phone || <span className="muted">—</span>}</td>
                    <td dir="ltr">{r.normalized.email || <span className="muted">—</span>}</td>
                    <td>{SOURCES[r.normalized.source]}</td>
                    <td>{CUSTOMER_STATUSES[r.normalized.status]}</td>
                    <td>
                      {r.duplicate ? <StatusBadge text="مكرر" variant="orange" />
                        : !r.valid ? <StatusBadge text={r.issues[0] ?? 'خطأ'} variant="red" />
                        : <StatusBadge text="صالح" variant="green" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedRows.length > 50 && <p className="muted" style={{ textAlign: 'center', padding: '10px' }}>عرض أول 50 صف من {parsedRows.length} صف</p>}
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setPhase('mapping')} disabled={importing}><X size={16} /> رجوع</button>
            <button className="btn btn-primary" onClick={doImport} disabled={importing || validCount === 0}>
              {importing ? <LoaderCircle size={17} className="spin" /> : <CheckCircle2 size={17} />}
              {importing ? 'جارٍ الاستيراد...' : `استيراد ${validCount} عميل`}
            </button>
          </div>
        </div>
      )}

      {phase === 'done' && result && (
        <div className="import-done">
          <CheckCircle2 size={48} style={{ color: '#20ae79', marginBottom: 12 }} />
          <h3>اكتمل الاستيراد</h3>
          <p className="muted">تم استيراد <b>{result.inserted}</b> عميل بنجاح{result.skipped > 0 ? ` وتخطّي ${result.skipped} سجل` : ''}.</p>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={reset}><Upload size={16} /> استيراد ملف آخر</button>
            <button className="btn btn-primary" onClick={onClose}><CheckCircle2 size={17} /> تم</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
