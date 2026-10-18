const units = ['B', 'KB', 'MB', 'GB', 'TB']

/** A byte count for people: 1.4 MB, 820 KB. */
export const formatBytes = (bytes: number) => {
  let value = Math.max(0, bytes)
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${new Intl.NumberFormat('zh-CN', { maximumFractionDigits: unit && value < 10 ? 1 : 0 }).format(value)} ${units[unit]}`
}
