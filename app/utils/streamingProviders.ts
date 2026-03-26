export interface StreamingProvider {
  icon: string
  color: string  // hover 时的品牌色（hex）
}

const streamingProviderMap: Record<string, StreamingProvider> = {
  default: { icon: 'cdcat:default-music-logo', color: '#6b7280' },
  spotify: { icon: 'cdcat:spotify', color: '#1aa34a' },
  apple_music: { icon: 'cdcat:apple-music', color: '#fc3c44' },
  netease_music: { icon: 'cdcat:netease-music', color: '#fc3c44' },
  // 更多平台待补充
}

export function getStreamingProvider(providerName: string): StreamingProvider {
  const key = providerName?.toLowerCase().replace(/[^a-z0-9]/g, '_') ?? ''
  return streamingProviderMap[key] ?? streamingProviderMap.default!
}
