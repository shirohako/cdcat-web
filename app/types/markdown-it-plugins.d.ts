// @types/markdown-it-container imports markdown-it with `require`, which under
// the Bundler resolution here yields the CJS typings and no longer matches the
// ESM `MarkdownIt` the renderer is built from. This declaration uses the ESM ones.
declare module 'markdown-it-container' {
  import type MarkdownIt from 'markdown-it'
  import type Token from 'markdown-it/lib/token.mjs'

  interface ContainerOptions {
    marker?: string
    validate?(params: string): boolean
    render?(tokens: Token[], idx: number): string
  }

  const container: (md: MarkdownIt, name: string, options?: ContainerOptions) => void
  export default container
}

declare module 'markdown-it-mark' {
  import type MarkdownIt from 'markdown-it'

  const mark: (md: MarkdownIt) => void
  export default mark
}

declare module 'markdown-it-task-lists' {
  import type MarkdownIt from 'markdown-it'

  interface TaskListOptions {
    enabled?: boolean
    label?: boolean
    labelAfter?: boolean
  }

  const taskLists: (md: MarkdownIt, options?: TaskListOptions) => void
  export default taskLists
}
