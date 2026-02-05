import { prisma } from '@/lib/prisma'
import { requireAdminSessionOrRedirect } from '@/lib/adminGuard'
import { serializeExportJob } from '@/lib/adminExports'
import {
  CACHE_REVALIDATION_SCRIPTS,
  collectRevalidationTargets,
  listCacheTagGroups,
} from '@/lib/cacheTags'
import TechOpsClient from './_components/TechOpsClient'
import { listRuntimeAlerts } from '@/lib/runtimeAlerts'

function serializeScripts() {
  return CACHE_REVALIDATION_SCRIPTS.map((script) => {
    const targets = collectRevalidationTargets(script)
    return {
      id: script.id,
      label: script.label,
      description: script.description,
      tags: targets.tags,
      paths: targets.paths,
    }
  })
}

export default async function AdminTechPage() {
  await requireAdminSessionOrRedirect('/admin/tech')
  const [leadJobs, orderJobs] = await Promise.all([
    prisma.adminExportJob.findMany({
      where: { type: 'leads_csv' },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.adminExportJob.findMany({
      where: { type: 'orders_csv' },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ])

  const runtimeAlerts = listRuntimeAlerts()

  return (
    <section className="space-y-8 p-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Administration technique</p>
        <h1 className="text-3xl font-semibold text-slate-900">Maintenance & exploitation</h1>
        <p className="text-sm text-slate-500">
          Relancez les caches critiques, surveillez les exports lourds et retrouvez les procédures d’exploitation en un seul endroit.
        </p>
      </div>
      <TechOpsClient
        scripts={serializeScripts()}
        cacheGroups={listCacheTagGroups()}
        jobs={{
          leads: leadJobs.map(serializeExportJob),
          orders: orderJobs.map(serializeExportJob),
        }}
        docsPath="docs/admin-tech.md"
        runtimeAlerts={runtimeAlerts}
      />
    </section>
  )
}
