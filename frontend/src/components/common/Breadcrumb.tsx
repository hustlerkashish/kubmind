import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="flex items-center space-x-2 text-xs text-slate-400">
      <Link to="/" className="flex items-center gap-1 hover:text-slate-200 transition-colors">
        <Home className="h-3.5 w-3.5" />
        <span>Cluster Home</span>
      </Link>

      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const formattedName = value.charAt(0).toUpperCase() + value.slice(1);

        return (
          <React.Fragment key={to}>
            <ChevronRight className="h-3 w-3 text-slate-600" />
            {isLast ? (
              <span className="font-medium text-slate-200 capitalize">{formattedName}</span>
            ) : (
              <Link to={to} className="hover:text-slate-200 transition-colors capitalize">
                {formattedName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
