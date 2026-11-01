import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  if (!message) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-5 z-[60] flex justify-center px-4">
      <div
        key={message}
        role="status"
        aria-live="polite"
        className="animate-fade-in-up flex items-center gap-2 rounded-3xl border border-emerald-100 bg-white/95 px-4 py-2.5 text-sm font-medium text-emerald-700 shadow-[0_8px_30px_rgba(16,185,129,0.18)] backdrop-blur-xl"
      >
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        {message}
      </div>
    </div>
  );
}
