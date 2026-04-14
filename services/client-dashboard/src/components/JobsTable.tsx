import type { Job } from '../api/content';
import JobStatusBadge from './JobStatusBadge';
import { ChevronRight, Inbox } from 'lucide-react';

interface Props {
  jobs: Job[];
  onSelect: (job: Job) => void;
}

export default function JobsTable({ jobs, onSelect }: Props) {
  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const shortId = (id: string) => id.slice(0, 8) + '…';

  if (jobs.length === 0) {
    return (
      <div style={{ padding: '64px 24px', textAlign: 'center' }}>
        <Inbox size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, fontWeight: 500 }}>No jobs yet</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Upload a file to get started</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Job ID', 'Type', 'Status', 'Created', ''].map(h => (
              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {jobs.map(job => (
            <tr
              key={job.id}
              onClick={() => onSelect(job)}
              style={{ borderBottom: '1px solid rgba(42,58,85,0.5)', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 13, color: 'var(--accent)' }}>
                {shortId(job.id)}
              </td>
              <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {job.type.replace('_', ' ')}
              </td>
              <td style={{ padding: '14px 16px' }}>
                <JobStatusBadge status={job.status} />
              </td>
              <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {formatDate(job.createdAt)}
              </td>
              <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                <ChevronRight size={16} color="var(--text-muted)" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
