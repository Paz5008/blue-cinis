import type { AdminExportJob } from '@prisma/client'

export type AdminExportJobDTO = {
  id: string
  type: string
  status: string
  createdAt: string
  updatedAt: string
  readyAt: string | null
  fileName?: string | null
  errorMessage?: string | null
  downloadUrl?: string | null
}

export function serializeExportJob(job: AdminExportJob): AdminExportJobDTO {
  return {
    id: job.id,
    type: job.type,
    status: job.status,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    readyAt: job.readyAt ? job.readyAt.toISOString() : null,
    fileName: job.fileName ?? undefined,
    errorMessage: job.errorMessage ?? undefined,
    downloadUrl: job.status === 'ready' ? `/api/admin/exports/${job.id}/download` : undefined,
  }
}
