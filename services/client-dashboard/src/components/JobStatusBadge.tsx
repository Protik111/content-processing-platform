import type { JobStatus } from '../api/content';

const CONFIG: Record<JobStatus, { label: string; bg: string; color: string; dot: string }> = {
  PENDING:    { label: 'Pending',    bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', dot: '#f59e0b' },
  PROCESSING: { label: 'Processing', bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6', dot: '#3b82f6' },
  COMPLETED:  { label: 'Completed',  bg: 'rgba(16,185,129,0.12)', color: '#10b981', dot: '#10b981' },
  FAILED:     { label: 'Failed',     bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', dot: '#ef4444' },
};

export default function JobStatusBadge({ status }: { status: JobStatus }) {
  const cfg = CONFIG[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 999,
      background: cfg.bg, color: cfg.color,
      fontSize: 12, fontWeight: 600,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', background: cfg.dot,
        boxShadow: status === 'PROCESSING' ? `0 0 0 3px ${cfg.bg}` : 'none',
        animation: status === 'PROCESSING' ? 'pulse-glow 1.5s ease-in-out infinite' : 'none',
      }} />
      {cfg.label}
    </span>
  );
}
