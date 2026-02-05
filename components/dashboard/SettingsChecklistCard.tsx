import { CheckCircle2, ChevronDown, Circle } from "lucide-react";

type ChecklistItem = {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  targetId: string;
  actionLabel?: string;
};

type Props = {
  headline?: string;
  items: ChecklistItem[];
  progress: number;
  completedCount: number;
  totalCount: number;
};

export default function SettingsChecklistCard({
  headline = "Prochaines étapes",
  items,
  progress,
  completedCount,
  totalCount,
}: Props) {
  const sortedItems = [...items].sort((a, b) => Number(a.completed) - Number(b.completed));
  const safeProgress = Math.min(100, Math.max(0, progress));

  return (
    <details className="group rounded-xl border border-white/10 bg-white/5 shadow-sm backdrop-blur-sm" open>
      <summary className="flex cursor-pointer items-center justify-between gap-3 px-6 py-4 text-left [&::-webkit-details-marker]:hidden">
        <div>
          <p className="text-base font-serif text-white">{headline}</p>
          <p className="text-xs text-white/50">
            {completedCount} / {totalCount} actions terminées
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5 px-2 text-xs font-semibold text-white/70">
            {safeProgress}%
          </div>
          <ChevronDown className="h-4 w-4 text-white/40 transition group-open:rotate-180" aria-hidden="true" />
        </div>
      </summary>
      <div className="px-6 pb-6 pt-2">
        <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all shadow-[0_0_10px_rgba(52,211,153,0.5)]"
            style={{ width: `${safeProgress}%` }}
          />
        </div>
        <ul className="space-y-3 text-sm">
          {sortedItems.map((item) => {
            const Icon = item.completed ? CheckCircle2 : Circle;
            const iconClass = item.completed ? "text-emerald-400" : "text-white/20";
            return (
              <li
                key={item.id}
                className={`flex flex-col gap-1 rounded-lg border px-4 py-3 bg-white/5 transition-colors ${item.completed
                    ? "border-emerald-500/20 shadow-[0_0_15px_-5px_rgba(52,211,153,0.1)]"
                    : "border-white/5 hover:border-white/10"
                  }`}
              >
                <div className="flex items-start gap-4">
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`} aria-hidden="true" />
                  <div className="flex-1">
                    <p className={`font-medium transition-colors ${item.completed ? 'text-white' : 'text-white/80'}`}>{item.label}</p>
                    <p className="text-xs text-white/40 leading-relaxed mt-0.5">{item.description}</p>
                  </div>
                  {!item.completed && (
                    <a
                      href={`#${item.targetId}`}
                      className="text-xs font-medium text-white/60 hover:text-white underline decoration-white/30 hover:decoration-white transition-all"
                    >
                      {item.actionLabel || "Voir"}
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}
