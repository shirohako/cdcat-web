import { describe, expect, it } from 'vitest'
import { serverDraftCandidate } from '../../app/utils/serverDrafts'

describe('serverDraftCandidate', () => {
  it('names the candidate of a harvest draft scope, and nothing for other drafts', () => {
    expect(serverDraftCandidate('harvest:135')).toBe(135)
    expect(serverDraftCandidate('album:new:k3x9q2')).toBeNull()
    expect(serverDraftCandidate('album:32')).toBeNull()
    expect(serverDraftCandidate('harvest:135:extra')).toBeNull()
    expect(serverDraftCandidate(null)).toBeNull()
  })
})
