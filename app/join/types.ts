/**
 * The text of /join (人员募集). Written in Simplified Chinese first; other languages show it until they are translated.
 * `shift` turns a group's colour away from the theme hue, in degrees (see .accent in assets/css/ui.css).
 */
export interface JoinRole {
  name: string
  /** A second name under the first, e.g. what a joke name means */
  sub?: string
  icon: string
  desc: string
}

export interface JoinContent {
  eyebrow: string
  /** The title: plain text and highlighted phrases, each highlight in its own colour (`shift`, as for the groups) */
  title: (string | { em: string, shift: number })[]
  lead: string
  /** The chips under the lead; {count} is filled in from the groups. */
  stats: { roles: string, groups: string, spare: string }
  /** The staff pass beside the hero */
  badge: { role: string, name: string }
  groups: { id: string, name: string, desc: string, shift: number, roles: JoinRole[] }[]
  /** 管理员, an all-access pass: `pass` runs down its foil strip. */
  admin: { pass: string, eyebrow: string, name: string, tag: string, requirements: string[] }
  join: { title: string, desc: string, steps: { title: string, desc: string }[] }
}
