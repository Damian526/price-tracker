import type { TrackerStatus } from '@price-tracker/shared'

type BadgeColor = 'success' | 'error' | 'warning'

// Single source of truth for how a tracker status is coloured in the UI
export const trackerStatusColor = (status?: TrackerStatus): BadgeColor => {
  if (status === 'ok') return 'success'
  if (status === 'failed') return 'error'
  return 'warning'
}
