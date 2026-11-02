import type { EventImportRun } from '~/types/eventImport'

/** Labels and badge colours of an event import's status and kind, for the admin's 导入 tab. */
export const eventImportStatusLabels: Record<EventImportRun['status'], string> = {
  collecting: '等其余分卷', queued: '排队中', running: '检查中', ready: '待确认', applying: '应用中', applied: '已应用', failed: '失败',
}

export const eventImportStatusClass = (status: EventImportRun['status']) => ({
  collecting: 'bg-slate-100 text-slate-600', queued: 'bg-slate-100 text-slate-600', running: 'bg-sky-100 text-sky-700', ready: 'bg-amber-100 text-amber-800',
  applying: 'bg-sky-100 text-sky-700', applied: 'bg-emerald-100 text-emerald-700', failed: 'bg-red-100 text-red-700',
})[status]

export const eventImportKindLabels: Record<EventImportRun['kind'], string> = { map: '平面图', booths: '摊位', combined: '平面图和摊位（旧格式）' }
