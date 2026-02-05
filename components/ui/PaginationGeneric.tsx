import Link from 'next/link';

const baseClasses =
  "inline-flex items-center justify-center rounded-md border border-[color:var(--surface-border-soft)] px-4 py-2 text-sm font-medium text-[color:var(--color-text-heading)] transition hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]";

interface Props {
  currentPage: number;
  totalPages: number;
  makeHref: (page: number) => string;
}

export default function PaginationGeneric({ currentPage, totalPages, makeHref }: Props) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center space-x-4 mt-8">
      {currentPage > 1 && (
        <Link href={makeHref(currentPage - 1)} className={baseClasses}>
          Précédent
        </Link>
      )}
      <span className="text-gray-700 dark:text-gray-300">
        {currentPage} / {totalPages}
      </span>
      {currentPage < totalPages && (
        <Link href={makeHref(currentPage + 1)} className={baseClasses}>
          Suivant
        </Link>
      )}
    </div>
  );
}
