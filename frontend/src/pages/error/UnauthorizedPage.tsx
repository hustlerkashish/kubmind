import { Link } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center p-6 text-center">
      <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
        <Lock className="h-8 w-8" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2 font-mono">403 - Access Restricted</h1>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        Your current role lacks administrative privilege to execute automated remedial actions or modify cluster security credentials.
      </p>
      <Link to="/dashboard">
        <Button variant="primary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
