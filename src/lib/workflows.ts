export const LEAD_STATUS_OPTIONS = [
  { value: 'new', label: 'Nouveau' },
  { value: 'contacted', label: 'Contacté' },
  { value: 'qualified', label: 'Qualifié' },
  { value: 'proposal', label: 'Proposition envoyée' },
  { value: 'won', label: 'Converti' },
  { value: 'lost', label: 'Perdu' },
] as const;

export type LeadWorkflowStatus = (typeof LEAD_STATUS_OPTIONS)[number]['value'];

export function getLeadStatusLabel(value: string) {
  return LEAD_STATUS_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export const ORDER_OPS_STATUS_OPTIONS = [
  { value: 'backoffice_pending', label: 'À classer' },
  { value: 'awaiting_payment', label: 'Attente paiement' },
  { value: 'to_ship', label: 'Préparer expédition' },
  { value: 'processing', label: 'En préparation' },
  { value: 'completed', label: 'Clôturé' },
  { value: 'blocked', label: 'Bloqué' },
] as const;

export type OrderOpsStatus = (typeof ORDER_OPS_STATUS_OPTIONS)[number]['value'];

export function getOrderOpsStatusLabel(value: string) {
  return ORDER_OPS_STATUS_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export const WORKFLOW_ACTIVITY_TYPES = ['status', 'note', 'follow_up', 'follow_up_complete'] as const;
export type WorkflowActivityKind = (typeof WORKFLOW_ACTIVITY_TYPES)[number];

export type WorkflowActivityDTO = {
  id: string;
  activityType: WorkflowActivityKind;
  createdAt: string;
  authorEmail?: string | null;
  authorName?: string | null;
  payload?: Record<string, unknown> | null;
  dueAt?: string | null;
  completedAt?: string | null;
};
