import { useState, useRef, type FormEvent } from 'react';
import { uploadContent, type JobType } from '../api/content';
import { Upload, FileText, Loader2, CheckCircle } from 'lucide-react';

interface Props {
  onJobCreated: (jobId: string) => void;
}

export default function UploadCard({ onJobCreated }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<JobType>('TEXT_EXTRACTION');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      const { jobId } = await uploadContent(file, type);
      onJobCreated(jobId);
      setSuccess(true);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Upload size={18} color="var(--accent)" /> Upload Content
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? 'var(--accent)' : file ? '#10b981' : 'var(--border)'}`,
            borderRadius: 12, padding: '32px 16px', textAlign: 'center', cursor: 'pointer',
            background: dragOver ? 'var(--accent-glow)' : file ? 'rgba(16,185,129,0.05)' : 'var(--bg-surface)',
            transition: 'all 0.2s', marginBottom: 16,
          }}
        >
          <input ref={inputRef} type="file" accept=".txt,.md,.csv,.json" hidden onChange={e => setFile(e.target.files?.[0] || null)} />
          {file ? (
            <>
              <FileText size={32} color="#10b981" style={{ margin: '0 auto 8px' }} />
              <p style={{ color: '#10b981', fontWeight: 500, fontSize: 13 }}>{file.name}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </>
          ) : (
            <>
              <Upload size={32} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Drop file or click to browse</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>.txt, .md, .csv, .json</p>
            </>
          )}
        </div>

        {/* Type selector */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
            Processing Type
          </label>
          <select
            value={type}
            onChange={e => setType(e.target.value as JobType)}
            style={{
              width: '100%', padding: '10px 12px',
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="TEXT_EXTRACTION">Text Extraction</option>
            <option value="SUMMARY">Summary</option>
          </select>
        </div>

        {error && <p style={{ marginBottom: 12, fontSize: 13, color: '#ef4444' }}>{error}</p>}

        <button
          type="submit"
          disabled={!file || loading}
          style={{
            width: '100%', padding: '11px', borderRadius: 10, border: 'none',
            cursor: !file || loading ? 'not-allowed' : 'pointer',
            background: !file || loading ? 'var(--bg-hover)' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
            color: '#fff', fontWeight: 600, fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s', boxShadow: !file || loading ? 'none' : '0 4px 16px rgba(59,130,246,0.3)',
          }}
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Uploading…</>
          ) : success ? (
            <><CheckCircle size={16} /> Job Created!</>
          ) : (
            <><Upload size={16} /> Upload & Process</>
          )}
        </button>
      </form>
    </div>
  );
}
