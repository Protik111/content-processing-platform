import type { SSEConnectionState } from '../hooks/useSSE';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

export default function SSEStatusBanner({ state }: { state: SSEConnectionState }) {
  const config = {
    connected:    { icon: <Wifi size={14} />,    label: 'Live updates active',    bg: 'rgba(16,185,129,0.1)',  color: '#10b981', border: 'rgba(16,185,129,0.2)' },
    disconnected: { icon: <WifiOff size={14} />, label: 'Reconnecting…',          bg: 'rgba(239,68,68,0.1)',   color: '#ef4444', border: 'rgba(239,68,68,0.2)'  },
    connecting:   { icon: <Loader2 size={14} className="animate-spin" />, label: 'Connecting…', bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
  }[state];

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 12px', borderRadius: 999,
      background: config.bg, color: config.color,
      border: `1px solid ${config.border}`,
      fontSize: 12, fontWeight: 500,
    }}>
      {config.icon}
      {config.label}
    </div>
  );
}
