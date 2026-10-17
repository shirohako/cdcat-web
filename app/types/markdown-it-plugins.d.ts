// markdown-it 15 ships its own typings but these plugins have none, so they are
// declared here against its ESM types.
declare module 'markdown-it-container' {
  import type { Env, MarkdownIt, MarkdownItOptions, Renderer, Token } from 'markdown-it'

  interface ContainerOptions {
    marker?: string
    validate?(params: string): boolean
    render?(tokens: Token[], idx: number, options: MarkdownItOptions, env: Env, self: Renderer): string
  }

  const container: (md: MarkdownIt, name: string, options?: ContainerOptions) => void
  export default container
}

declare module 'markdown-it-mark' {
  import type { MarkdownIt } from 'markdown-it'

  const mark: (md: MarkdownIt) => void
  export default mark
}

declare module 'markdown-it-task-lists' {
  import type { MarkdownIt } from 'markdown-it'

  interface TaskListOptions {
    enabled?: boolean
    label?: boolean
    labelAfter?: boolean
  }

  const taskLists: (md: MarkdownIt, options?: TaskListOptions) => void
  export default taskLists
}
