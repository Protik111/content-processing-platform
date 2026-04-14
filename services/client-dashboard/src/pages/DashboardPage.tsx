import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSSE } from '../hooks/useSSE';
import { getJob, getAllJobs, type Job, type JobStatus } from '../api/content';
import UploadCard from '../components/UploadCard';
import JobsTable from '../components/JobsTable';
import JobDrawer from '../components/JobDrawer';
import SSEStatusBanner from '../components/SSEStatusBanner';
import { Zap, LogOut, RefreshCw } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

export default function DashboardPage() {
  const { logout } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // SSE — update job status in real-time
  const handleSSEUpdate = useCallback(({ jobId, status, result, error }: { jobId: string; status: JobStatus; result?: string; error?: string }) => {
    setJobs(prev =>
      prev.map(j => {
        if (j.id === jobId) {
          if (j.status !== 'COMPLETED' && status === 'COMPLETED') {
            toast.success(`Job completed!`, { position: 'bottom-right' });
          } else if (j.status !== 'FAILED' && status === 'FAILED') {
            toast.error(`Job failed!`, { position: 'bottom-right' });
          }
          return { ...j, status, result: result ?? j.result, error: error ?? j.error, updatedAt: new Date().toISOString() };
        }
        return j;
      })
    );
    // Also update drawer if open
    setSelectedJob(prev =>
      prev?.id === jobId ? { ...prev, status, result: result ?? prev.result, error: error ?? prev.error } : prev
    );
  }, []);

  const sseState = useSSE(handleSSEUpdate);

  // When a new job is created, fetch full job and add to list
  const handleJobCreated = useCallback(async (jobId: string) => {
    try {
      const job = await getJob(jobId);
      setJobs(prev => [job, ...prev]);
    } catch {
      // add placeholder
      setJobs(prev => [{
        id: jobId, userId: '', filePath: '', type: 'TEXT_EXTRACTION', status: 'PENDING',
        result: null, error: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }, ...prev]);
    }
  }, []);

  // Load initial jobs
  useEffect(() => {
    getAllJobs().then(setJobs).catch(console.error);
  }, []);

  // Refresh all jobs from API
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const updated = await getAllJobs();
      setJobs(updated);
    } catch (err) {
      console.error('Failed to refresh jobs', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Keep selected job in sync when jobs array updates
  useEffect(() => {
    if (selectedJob) {
      const updated = jobs.find(j => j.id === selectedJob.id);
      if (updated) setSelectedJob(updated);
    }
  }, [jobs]);

  const stats = {
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'PENDING').length,
    processing: jobs.filter(j => j.status === 'PROCESSING').length,
    completed: jobs.filter(j => j.status === 'COMPLETED').length,
    failed: jobs.filter(j => j.status === 'FAILED').length,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)',
        padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 30,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={16} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Content Platform</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SSEStatusBanner state={sseState} />
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, padding: '24px', maxWidth: 1200, width: '100%', margin: '0 auto' }}>
        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total', value: stats.total, color: 'var(--text-primary)' },
            { label: 'Pending', value: stats.pending, color: '#f59e0b' },
            { label: 'Processing', value: stats.processing, color: '#3b82f6' },
            { label: 'Completed', value: stats.completed, color: '#10b981' },
            { label: 'Failed', value: stats.failed, color: '#ef4444' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{s.label}</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Content grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>
          {/* Upload */}
          <div className="animate-fade-in">
            <UploadCard onJobCreated={handleJobCreated} />
          </div>

          {/* Jobs Table */}
          <div className="animate-fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Processing Jobs</h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Click a row to view details</p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
              >
                <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
            <JobsTable jobs={jobs} onSelect={setSelectedJob} />
          </div>
        </div>
      </main>

      {/* Job Drawer */}
      {selectedJob && <JobDrawer job={selectedJob} onClose={() => setSelectedJob(null)} />}

      <Toaster />
    </div>
  );
}
