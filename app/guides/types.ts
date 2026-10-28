import type { DocSectionLink } from '~/documents/sections'

/** The guides the about page's 使用说明 links to: /help/design and /help/editor. */
export type GuideKind = 'design' | 'editor'
/** The languages a guide is written in so far; readers of the others get the first. */
export type GuideLocale = 'zh-Hans'

/** The pictures a section can show above its text, drawn by components/guide/figure/*. */
export type GuideFigureName =
  // 了解 CDCat 的设计
  | 'relation-map'
  | 'album-anatomy'
  | 'artist-kinds'
  | 'event-editions'
  | 'entry-links'
  | 'series-tree'
  | 'vinyl-sides'
  | 'forum-thread'
  | 'article-card'
  | 'names-history'
  // 提交新专辑与更正错误
  | 'submit-flow'
  | 'editor-shell'
  | 'basic-form'
  | 'names-dialog'
  | 'tracklist'
  | 'credits'
  | 'credits-by-track'
  | 'credits-paste'
  | 'editions'
  | 'bonuses'
  | 'images'
  | 'relations'
  | 'translate'
  | 'submit-panel'
  | 'review-states'
  | 'conflict'

export interface GuideFigure {
  name: GuideFigureName
  /**
   * The figure's own words (captions, notes), in the guide's language, by the keys the figure reads. Field labels in
   * the editor mock-ups come from the site's messages instead, so they read as the real editor does.
   */
  text?: Record<string, string>
}

export interface GuideSection extends DocSectionLink {
  /** A sentence or two under the heading: what the section answers. */
  lead: string
  /** Shown between the lead and the text. */
  figure?: GuideFigure
  /**
   * Markdown, rendered by RichContent: tables, ::: callouts and ::: steps welcome, headings no bigger than ###. Or
   * pieces of it with figures in between, for a section that shows several things one after another.
   */
  body: string | Array<string | GuideFigure>
}

/** What a language file provides. */
export interface GuideContent {
  intro: string
  sections: GuideSection[]
}

export interface GuideDoc extends GuideContent {
  /** The language the text is in, which may not be the reader's. */
  locale: GuideLocale
  /** YYYY-MM-DD: when the text last changed. */
  updated: string
}
