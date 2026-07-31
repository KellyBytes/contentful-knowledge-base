const STYLES = {
  Beginner: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Intermediate: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Advanced: 'bg-rose-50 text-rose-700 ring-rose-600/20',
};

const DifficultyBadge = ({ level }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring1 ring-inset ${STYLES[level] ?? 'bg-slate-50 text-slate-600 ring-slate-500/20'} `}
  >
    {level ?? 'Unrated'}
  </span>
);

export default DifficultyBadge;
