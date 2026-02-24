'use client';

interface ConnectionStatusProps {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const statusConfig = {
    disconnected: { 
      color: 'bg-slate-400', 
      text: 'Disconnected', 
      pulse: false,
      textColor: 'text-slate-600'
    },
    connecting: { 
      color: 'bg-yellow-400', 
      text: 'Connecting...', 
      pulse: true,
      textColor: 'text-yellow-600'
    },
    connected: { 
      color: 'bg-green-500', 
      text: 'Connected', 
      pulse: true,
      textColor: 'text-green-600'
    },
    error: { 
      color: 'bg-red-500', 
      text: 'Error', 
      pulse: false,
      textColor: 'text-red-600'
    }
  };
  
  const config = statusConfig[status];
  
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`} />
      <span className={`text-sm font-medium ${config.textColor}`}>{config.text}</span>
    </div>
  );
}
