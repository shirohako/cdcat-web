import { describe, expect, it } from 'vitest'
import { serverDraftCandidate, serverDraftTarget } from '../../app/utils/serverDrafts'

describe('serverDraftCandidate', () => {
  it('names the candidate of a harvest draft scope, and nothing for other drafts', () => {
    expect(serverDraftCandidate('harvest:135')).toBe(135)
    expect(serverDraftCandidate('album:new:k3x9q2')).toBeNull()
    expect(serverDraftCandidate('album:32')).toBeNull()
    expect(serverDraftCandidate('harvest:135:extra')).toBeNull()
    expect(serverDraftCandidate(null)).toBeNull()
  })
})

describe('serverDraftTarget', () => {
  it('keeps candidates shared and lets a member save new items, edits and revisions sent back to CDCat', () => {
    expect(serverDraftTarget('harvest:135')).toEqual({ kind: 'harvest', candidateId: 135 })
    for (const scope of ['album:new:k3x9q2', 'artist:32', 'entry:new:a1', 'franchise:7', 'revision:25']) {
      expect(serverDraftTarget(scope)).toEqual({ kind: 'personal', scope })
    }
    // What the server would refuse stays in this browser only.
    for (const scope of ['lyric:3', 'album:new:K3X9', 'albums:1', 'album:new:', 'revision:x', null, undefined, '']) {
      expect(serverDraftTarget(scope)).toBeNull()
    }
  })
})
