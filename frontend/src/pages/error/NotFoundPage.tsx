import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center p-6 text-center">
      <div className="h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2 font-mono">404 - Namespace Not Found</h1>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        The telemetry resource or cluster dashboard page you requested does not exist or has been relocated.
      </p>
      <Link to="/dashboard">
        <Button variant="primary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Return to Command Center
        </Button>
      </Link>
    </div>
  );
}
