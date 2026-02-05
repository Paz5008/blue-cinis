export type RuntimeAlertSeverity = 'warning' | 'critical'

export type RuntimeAlert = {
  key: string
  reason: string
  severity: RuntimeAlertSeverity
  occurrences: number
  lastTriggeredAt: string
}

type RuntimeAlertRecord = RuntimeAlert & { lastTriggeredAtMs: number }

declare global {
  var __runtimeAlertsStore: Map<string, RuntimeAlertRecord> | undefined
}

function getStore() {
  const globalRef = globalThis as typeof globalThis & { __runtimeAlertsStore?: Map<string, RuntimeAlertRecord> }
  if (!globalRef.__runtimeAlertsStore) {
    globalRef.__runtimeAlertsStore = new Map()
  }
  return globalRef.__runtimeAlertsStore
}

export function markRuntimeAlert(key: string, reason: string, severity: RuntimeAlertSeverity = 'warning') {
  if (!key) return
  const store = getStore()
  const now = Date.now()
  const existing = store.get(key)
  const occurrences = existing ? existing.occurrences + 1 : 1
  store.set(key, {
    key,
    reason,
    severity,
    occurrences,
    lastTriggeredAt: new Date(now).toISOString(),
    lastTriggeredAtMs: now,
  })
}

export function clearRuntimeAlert(key: string) {
  if (!key) return
  getStore().delete(key)
}

export function listRuntimeAlerts(): RuntimeAlert[] {
  const snapshots = Array.from(getStore().values())
  return snapshots
    .sort((a, b) => b.lastTriggeredAtMs - a.lastTriggeredAtMs)
    .map(({ lastTriggeredAtMs: _ignoredLastTriggeredAtMs, ...rest }) => rest)
}

export function hasCriticalRuntimeAlerts(): boolean {
  return listRuntimeAlerts().some((alert) => alert.severity === 'critical')
}
