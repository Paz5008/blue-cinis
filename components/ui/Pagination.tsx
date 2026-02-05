"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import CTA from '@/components/shared/CTA';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const searchParams = useSearchParams();
  const buildHref = (page: number) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('page', String(page));
    const query = params.toString();
    return query ? `/galerie?${query}` : '/galerie';
  };

  return (
    <div className="flex justify-center items-center space-x-4 mt-8">
      {currentPage > 1 && (
        <CTA href={buildHref(currentPage - 1)} variant="secondary" size="md">Précédent</CTA>
      )}
      <span className="text-gray-700 dark:text-gray-300">
        {currentPage} / {totalPages}
      </span>
      {currentPage < totalPages && (
        <CTA href={buildHref(currentPage + 1)} variant="secondary" size="md">Suivant</CTA>
      )}
    </div>
  );
}
