import type { Job } from '../api/content';
import { X, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import JobStatusBadge from './JobStatusBadge';

interface Props {
  job: Job;
  onClose: () => void;
}

export default function JobDrawer({ job, onClose }: Props) {
  const formatDate = (d: string) => new Date(d).toLocaleString();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40, backdropFilter: 'blur(3px)' }}
      />
      {/* Drawer */}
      <div className="animate-slide-in" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 480,
        background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)',
        zIndex: 50, overflowY: 'auto', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Job Details</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>
              {job.id}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6 }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, flex: 1 }}>
          {/* Meta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            <MetaCard label="Status" value={<JobStatusBadge status={job.status} />} />
            <MetaCard label="Type" value={<span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>{job.type.replace('_', ' ')}</span>} />
            <MetaCard label="Created" value={<span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(job.createdAt)}</span>} />
            <MetaCard label="Updated" value={<span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(job.updatedAt)}</span>} />
          </div>

          {/* File Path */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
              <FileText size={13} /> File Path
            </label>
            <div style={{ padding: '10px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {job.filePath}
            </div>
          </div>

          {/* Result */}
          {job.result && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                <CheckCircle size={13} color="#10b981" /> Result
              </label>
              <div style={{ padding: '14px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 320, overflowY: 'auto' }}>
                {job.result}
              </div>
            </div>
          )}

          {/* Error */}
          {job.error && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                <AlertCircle size={13} color="#ef4444" /> Error
              </label>
              <div style={{ padding: '14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 13, color: '#ef4444', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {job.error}
              </div>
            </div>
          )}

          {/* Pending/Processing state */}
          {!job.result && !job.error && (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <Clock size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                {job.status === 'PROCESSING' ? 'Processing in progress…' : 'Waiting in queue…'}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>Results will appear here via live update</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function MetaCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ padding: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }}>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      {value}
    </div>
  );
}
