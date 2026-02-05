import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import type { Session } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { ensureAdminSession } from '@/lib/adminGuard'
import { recordAdminAuditLog } from '@/lib/audit'
import { maskEmail, maskPhone, redactLongText } from '@/lib/redact'
import { LEAD_STATUS_OPTIONS, type LeadWorkflowStatus, type WorkflowActivityDTO } from '@/lib/workflows'
import { logger } from '@/lib/logger'
import { describeMfaFailure, validateMfaToken } from '@/lib/mfa'

const LEAD_DETAIL_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  message: true,
  artworkId: true,
  artistId: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  lastContactedAt: true,
  nextFollowUpAt: true,
  nextFollowUpNote: true,
} as const

const leadStatusValues = LEAD_STATUS_OPTIONS.map((option) => option.value)

const followUpSchema = z.object({
  summary: z.string().min(3).max(400),
  dueAt: z.string().datetime().transform((value) => new Date(value)),
})

const leadWorkflowActionSchema = z.discriminatedUnion('intent', [
  z.object({ intent: z.literal('status'), status: z.enum(leadStatusValues as [LeadWorkflowStatus, ...LeadWorkflowStatus[]]) }),
  z.object({ intent: z.literal('note'), content: z.string().min(3).max(2000) }),
  z.object({ intent: z.literal('follow_up'), ...followUpSchema.shape }),
  z.object({ intent: z.literal('complete_follow_up'), activityId: z.string().min(1), outcome: z.string().max(500).optional() }),
])

type LeadDetailResponse = {
  lead: ReturnType<typeof serializeLead>
  timeline: WorkflowActivityDTO[]
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await ensureAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const includeSensitive = new URL(req.url).searchParams.get('sensitive') === 'full'
  if (includeSensitive) {
    const mfaResult = await validateMfaToken({
      token: req.headers.get('x-admin-mfa-token'),
      userId: session.user.id,
      scope: 'leads.detail',
      consume: false,
    })
    if (!mfaResult.ok) {
      return NextResponse.json({ error: describeMfaFailure(mfaResult.reason) }, { status: 403 })
    }
  }
  const payload = await fetchLeadDetail(params.id, { includeSensitive })
  if (!payload) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  await recordAdminAuditLog({
    action: 'leads.detail.fetch',
    resource: params.id,
    session,
    request: req,
    metadata: {
      sensitiveMode: includeSensitive ? 'full' : 'masked',
    },
  })
  return NextResponse.json(payload)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await ensureAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const leadId = params.id
  const json = await req.json().catch(() => null)
  const parsed = leadWorkflowActionSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const action = parsed.data.intent
  try {
    await ensureLeadExists(leadId)
    if (action === 'status') {
      await prisma.lead.update({
        where: { id: leadId },
        data: buildStatusUpdate(parsed.data.status),
      })
      await logActivity(leadId, 'status', { status: parsed.data.status }, session)
    } else if (action === 'note') {
      const content = parsed.data.content.trim()
      await logActivity(leadId, 'note', { content }, session)
    } else if (action === 'follow_up') {
      const dueAt = parsed.data.dueAt
      await logActivity(
        leadId,
        'follow_up',
        { summary: parsed.data.summary },
        session,
        { dueAt },
      )
      await recomputeLeadFollowUpSnapshot(leadId)
    } else if (action === 'complete_follow_up') {
      const existing = await prisma.workflowActivity.findUnique({ where: { id: parsed.data.activityId } })
      if (!existing || existing.entityType !== 'lead' || existing.entityId !== leadId || existing.activityType !== 'follow_up') {
        return NextResponse.json({ error: 'Follow-up introuvable' }, { status: 404 })
      }
      const payload = mergePayload(existing.payload, parsed.data.outcome)
      await prisma.workflowActivity.update({
        where: { id: existing.id },
        data: {
          payload,
          completedAt: new Date(),
        },
      })
      await recomputeLeadFollowUpSnapshot(leadId)
    }

    await recordAdminAuditLog({
      action: `leads.workflow.${action}`,
      resource: leadId,
      session,
      request: req,
      metadata: { intent: action },
    })
  } catch (error) {
    logger.error({ err: error, leadId, action }, '[leads] workflow action failed')
    await recordAdminAuditLog({
      action: `leads.workflow.${action}`,
      resource: leadId,
      session,
      request: req,
      status: 'error',
      metadata: { intent: action },
    })
    return NextResponse.json({ error: 'Action impossible' }, { status: 500 })
  }

  let includeSensitive = new URL(req.url).searchParams.get('sensitive') === 'full'
  if (includeSensitive) {
    const mfaResult = await validateMfaToken({
      token: req.headers.get('x-admin-mfa-token'),
      userId: session.user.id,
      scope: 'leads.detail',
      consume: false,
    })
    if (!mfaResult.ok) {
      includeSensitive = false
    }
  }
  const payload = await fetchLeadDetail(leadId, { includeSensitive })
  return NextResponse.json(payload)
}

async function ensureLeadExists(leadId: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true } })
  if (!lead) {
    throw new Error('Lead not found')
  }
}

function buildStatusUpdate(status: LeadWorkflowStatus): Prisma.LeadUpdateInput {
  const data: Prisma.LeadUpdateInput = { status }
  if (status !== 'new') {
    data.lastContactedAt = new Date()
  }
  if (status === 'won' || status === 'lost') {
    data.nextFollowUpAt = null
    data.nextFollowUpNote = null
  }
  return data
}

async function logActivity(
  entityId: string,
  activityType: 'status' | 'note' | 'follow_up',
  payload: Record<string, unknown>,
  session: Session,
  options?: { dueAt?: Date },
) {
  const author = resolveAuthor(session)
  await prisma.workflowActivity.create({
    data: {
      entityType: 'lead',
      entityId,
      activityType,
      payload: payload as Prisma.JsonObject,
      dueAt: options?.dueAt,
      authorId: author.authorId,
      authorEmail: author.authorEmail,
      authorName: author.authorName,
    },
  })
}

async function recomputeLeadFollowUpSnapshot(leadId: string) {
  const next = await prisma.workflowActivity.findFirst({
    where: {
      entityType: 'lead',
      entityId: leadId,
      activityType: 'follow_up',
      completedAt: null,
    },
    orderBy: [{ dueAt: 'asc' }],
  })
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      nextFollowUpAt: next?.dueAt ?? null,
      nextFollowUpNote: extractSummary(next?.payload) ?? null,
    },
  })
}

function extractSummary(payload: Prisma.JsonValue | null | undefined) {
  if (!payload || typeof payload !== 'object') return null
  const summary = (payload as Record<string, unknown>).summary
  return typeof summary === 'string' ? summary : null
}

function mergePayload(payload: Prisma.JsonValue | null, outcome?: string) {
  const base: Record<string, unknown> = payload && typeof payload === 'object' ? { ...(payload as Record<string, unknown>) } : {}
  if (outcome?.trim()) {
    base.outcome = outcome.trim()
  }
  base.status = 'done'
  return base as Prisma.JsonObject
}

function resolveAuthor(session: Session) {
  const authorId = typeof session.user?.id === 'string' ? session.user.id : null
  return {
    authorId,
    authorEmail: session.user?.email ?? null,
    authorName: session.user?.name ?? null,
  }
}

async function fetchLeadDetail(id: string, options: { includeSensitive: boolean }): Promise<LeadDetailResponse | null> {
  const lead = await prisma.lead.findUnique({ where: { id }, select: LEAD_DETAIL_SELECT })
  if (!lead) return null
  const timeline = await prisma.workflowActivity.findMany({
    where: { entityType: 'lead', entityId: id },
    orderBy: { createdAt: 'desc' },
    take: 40,
  })
  return {
    lead: serializeLead(lead, options.includeSensitive),
    timeline: timeline.map(serializeActivity),
  }
}

function serializeLead(lead: Prisma.LeadGetPayload<{ select: typeof LEAD_DETAIL_SELECT }>, includeSensitive: boolean) {
  return {
    ...lead,
    email: includeSensitive ? lead.email : maskEmail(lead.email),
    phone: includeSensitive ? lead.phone : maskPhone(lead.phone),
    message: includeSensitive ? lead.message : redactLongText(lead.message),
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
    lastContactedAt: lead.lastContactedAt ? lead.lastContactedAt.toISOString() : null,
    nextFollowUpAt: lead.nextFollowUpAt ? lead.nextFollowUpAt.toISOString() : null,
  }
}

function serializeActivity(entry: Prisma.WorkflowActivityGetPayload<{
  select: {
    id: true
    activityType: true
    payload: true
    dueAt: true
    completedAt: true
    createdAt: true
    authorEmail: true
    authorName: true
  }
}>): WorkflowActivityDTO {
  return {
    id: entry.id,
    activityType: entry.activityType as WorkflowActivityDTO['activityType'],
    payload: (entry.payload as Record<string, unknown> | null) ?? null,
    createdAt: entry.createdAt.toISOString(),
    dueAt: entry.dueAt ? entry.dueAt.toISOString() : null,
    completedAt: entry.completedAt ? entry.completedAt.toISOString() : null,
    authorEmail: entry.authorEmail,
    authorName: entry.authorName,
  }
}
