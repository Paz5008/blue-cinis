import React from 'react';
import { ChevronDown, Info } from 'lucide-react';

interface InspectorSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  help?: React.ReactNode | string;
}

const InspectorSection: React.FC<InspectorSectionProps> = ({ title, children, defaultOpen = true, help }) => {
  const [open, setOpen] = React.useState<boolean>(!!defaultOpen);
  const [showHelp, setShowHelp] = React.useState<boolean>(false);

  return (
    <div className="mb-4 border-b border-gray-200 last:border-0 pb-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-2 text-left font-semibold text-slate-900 transition-colors hover:text-indigo-600"
      >
        <span className="text-sm tracking-tight">{title}</span>
        <div className="flex items-center gap-2">
          {help && (
            <div
              role="button"
              tabIndex={0}
              title="Aide"
              aria-label="Aide"
              className={`flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-gray-100 hover:text-slate-900 ${showHelp ? 'bg-gray-100 text-indigo-600' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowHelp((s) => !s);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowHelp((s) => !s);
                }
              }}
            >
              <Info size={14} />
            </div>
          )}
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {open && (
        <div className="mt-2 animate-in slide-in-from-top-2 fade-in duration-200">
          {showHelp && help && (
            <div className="mb-3 rounded-md border border-blue-500/20 bg-blue-500/5 p-3 text-xs leading-relaxed text-[var(--cms-text-secondary)]">
              {help}
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
};

export default InspectorSection;