import { CONTACT_EMAIL, DATA_LICENSE, MIN_AGE, NOTICE_DAYS, REQUEST_DAYS } from '../constants'
import { md } from '~/documents/sections'
import type { LegalContent } from '../types'

export default {
  intro: 'These terms set out the rules for using CDCat: what you can expect from us, what we expect from you, and how the things you contribute may be used. Each section starts with a short summary in plain words.',
  highlights: [
    { icon: 'lucide:heart-handshake', title: 'Free and non-profit', text: 'CDCat is run by volunteers, shows no ads and costs nothing to use.', to: 'service' },
    { icon: 'lucide:book-open', title: 'Open data', text: `Catalog data you contribute is shared under ${DATA_LICENSE.name}, so anyone can reuse it with credit.`, to: 'content-license' },
    { icon: 'lucide:shield-check', title: 'Respect people and rights', text: 'No harassment, no piracy, nothing you have no right to share.', to: 'community' },
    { icon: 'lucide:mail', title: 'Always reachable', text: 'Questions, appeals, copyright notices or closing your account: just write to us.', to: 'contact' },
  ],
  sections: [
    {
      id: 'acceptance',
      title: 'About these terms',
      summary: 'By using CDCat you agree to these terms. If a translation differs, the English version applies.',
      body: md`
        CDCat ("we", "us") is a community-edited music database at cdcat.net, run by the CDCat team. These Terms of Service ("terms") apply to the website, its public API and the emails we send (together, the "service").

        By creating an account or using the service, you agree to these terms and to our [Privacy Policy](/privacy), which explains how we handle personal information. If you don't agree, please don't use the service.

        These terms are available in English, Simplified Chinese, Traditional Chinese and Japanese. If the versions differ, the English version prevails.
      `,
    },
    {
      id: 'service',
      title: 'The service',
      summary: 'CDCat is free, non-profit and built by its community. We do our best, but we can\'t promise it will always be available or complete.',
      body: md`
        CDCat collects information about music releases (albums, tracks, artists, labels, events and the works they belong to), with a focus on doujin and Japanese music. Most of it is written and checked by members of the community.

        The service is free to use and shows no advertising. It is run by volunteers on a non-profit basis.

        We may add, change or remove features, and we may pause the service for maintenance or other reasons, sometimes without notice. We'll try to give notice of changes that significantly affect you.
      `,
    },
    {
      id: 'eligibility',
      title: 'Who can use CDCat',
      summary: `You need to be at least ${MIN_AGE} to create an account. If you're under 18, ask a parent or guardian first.`,
      body: md`
        You must be at least ${MIN_AGE} years old to create an account. We ask for your date of birth when you sign up so we can check this; it is never shown on your profile.

        If you're under 18, or under the age of majority where you live, you need permission from a parent or legal guardian to use the service, and they should read these terms with you.

        ::: info Accounts under the age limit
        If we learn that an account belongs to someone under ${MIN_AGE}, we'll disable it and delete its personal information.
        :::
      `,
    },
    {
      id: 'account',
      title: 'Your account',
      summary: 'Keep your details accurate and your password safe. You\'re responsible for what happens under your account.',
      body: md`
        Please give accurate information when you sign up and keep your email address up to date. We use it to verify your account and to reach you about important matters.

        Keep your password to yourself. You stay signed in on a device until you sign out or reset your password, and resetting it signs you out everywhere. If you think someone else has access to your account, reset your password and let us know.

        You're responsible for activity on your account. Usernames and nicknames must not impersonate other people, organisations or staff, and must not be offensive; we may change names that break these rules.

        Don't create several accounts to get around restrictions, to manipulate reviews or reports, or to mislead others.
      `,
    },
    {
      id: 'contributions',
      title: 'Contributing',
      summary: 'Anyone with an account can add and edit information. Edits are reviewed, and the full history is public.',
      body: md`
        With an account you can add and edit catalog entries, upload images, add lyrics, write reviews and articles, and take part in discussions.

        ::: steps How an edit goes live
        1. **Submit**: you add or change an entry, ideally with a source.
        2. **Review**: a contributor or moderator approves it, asks for changes or rejects it. New entries are visible right away, marked as pending.
        3. **Publish**: approved changes become part of the database, with your name in the edit history.
        4. **Improve**: anyone can improve it later, and earlier versions can be restored.
        :::

        Please be accurate. Say where your information comes from (an official site, the booklet, a store page) and only submit material you have the right to submit. Don't add information you know to be false, and don't use the service to promote your own work in misleading ways.

        Reviewers may edit, merge, roll back or remove contributions to keep the database accurate and consistent.
      `,
    },
    {
      id: 'content-license',
      title: 'Content and licensing',
      short: 'Licensing',
      summary: `Catalog data is shared under ${DATA_LICENSE.name}. Your reviews, posts and articles stay yours. Lyrics and cover art belong to their rights holders.`,
      body: md`
        Different kinds of content are licensed differently:

        | Content | Who owns it | How it may be used |
        |---|---|---|
        | Catalog data: titles, track lists, credits, release details and other entry information | The contributors | Under [${DATA_LICENSE.name}](${DATA_LICENSE.url}): anyone may reuse it, commercially too, as long as they credit CDCat and share alike |
        | Articles | The author | Under the licence the author chose for each article (CC BY-NC-SA 4.0 by default); reposts must link to the original |
        | Reviews, discussion posts, comments and profiles | The author | You keep your rights and give CDCat the licence below; anyone else needs your permission |
        | Lyrics, cover art and other images | Their rights holders | Shown for reference and identification; not covered by CDCat's licences |

        **Catalog contributions.** By submitting catalog data you release it under ${DATA_LICENSE.name} and confirm that you're allowed to. Every change is credited to the account that made it in the public edit history, which is how attribution works on CDCat.

        **Your licence to us.** For content you post that isn't released under a licence of your choice, you keep your rights and grant CDCat a worldwide, non-exclusive, royalty-free licence to host, store, display, reproduce, adapt (for example to format it or make previews) and distribute it as part of the service. The licence lasts while the content is on the service, and for copies kept in backups and in the public edit history.

        CDCat's name, logo and site design are not covered by these licences.
      `,
    },
    {
      id: 'community',
      title: 'Community rules',
      summary: 'Be respectful, stay within the law, and don\'t share pirated music.',
      body: md`
        Don't post, or link to, anything that:

        - is illegal, or encourages illegal activity;
        - infringes copyright or other rights, including links to unauthorised downloads or streams of music;
        - harasses, threatens or demeans people, or attacks them for who they are;
        - reveals someone's private information without their consent;
        - is sexual content involving minors, or sexual content showing real people without their consent;
        - is spam, advertising unrelated to the music, or malware.

        Hide spoilers with the spoiler syntax, and mark adult releases as such.
      `,
    },
    {
      id: 'acceptable-use',
      title: 'Using the service responsibly',
      short: 'Responsible use',
      summary: 'Don\'t break, overload or game the service. Reuse our data freely, but follow its licence.',
      body: md`
        When using the service, don't:

        - get around restrictions, rate limits or access controls, or access accounts that aren't yours;
        - create accounts automatically or in bulk;
        - send automated requests at a pace that burdens the service: crawl gently, follow robots.txt and identify your client;
        - make automated edits without permission from the CDCat team;
        - interfere with how the service runs or how it is secured.

        If you find a security problem, please report it privately to ${CONTACT_EMAIL} rather than testing it on the live site.

        If you reuse CDCat data, credit CDCat with a link to the page it came from and share what you build from it under ${DATA_LICENSE.name}. Please don't present copies of CDCat as an official CDCat service.
      `,
    },
    {
      id: 'moderation',
      title: 'Moderation',
      summary: 'We may hide content and restrict accounts that break the rules. You can always ask us to look at a decision again.',
      body: md`
        To keep the service healthy, we use these measures:

        | Measure | When it applies | What happens |
        |---|---|---|
        | Keyword filter | Content containing blocked words | The post is refused, or published and flagged for review |
        | Reports | Anyone can report content that breaks these terms | Moderators review it; content reported by several established members may be hidden until then |
        | Hiding or locking | Content that breaks the rules | The content is hidden or locked, with the reason given |
        | Restrictions | Repeated or serious violations in one part of the site | You can't post there for 1, 3, 7 or 30 days, or permanently |
        | Suspension | Severe or repeated violations, spam | The account is disabled |

        Moderators act in good faith but can get things wrong. If you think a decision was a mistake, email ${CONTACT_EMAIL} with a link to the content and your reasons, and we'll take another look.
      `,
    },
    {
      id: 'copyright',
      title: 'Copyright complaints',
      summary: 'If something on CDCat infringes your rights, tell us and we\'ll deal with it quickly.',
      body: md`
        We respect the rights of artists, labels and other rights holders. If you believe something on CDCat infringes your copyright or other rights, send a notice to ${CONTACT_EMAIL} that includes:

        1. your name and contact details, and whom you represent, if anyone;
        2. the work you believe is infringed;
        3. the address (URL) of each page showing the content;
        4. a statement that you believe in good faith that the use is not authorised by the rights holder, its agent or the law;
        5. a statement that the information in your notice is accurate and that you are the rights holder or authorised to act for them.

        We'll review the notice and, where appropriate, remove or disable the content. For lyrics, we can remove the text from every earlier version as well. We'll let the person who posted it know.

        If your content was removed and you believe that was a mistake, reply with an explanation and we'll reconsider. We disable the accounts of people who repeatedly infringe others' rights.
      `,
    },
    {
      id: 'termination',
      title: 'Closing your account',
      short: 'Closing an account',
      summary: 'You can ask us to close your account at any time. We may also suspend accounts that break these terms.',
      body: md`
        To close your account, email ${CONTACT_EMAIL} from the address on your account. We'll handle it within ${REQUEST_DAYS} days: we disable the account and delete your personal information, such as your email address, date of birth and profile.

        Your public contributions (catalog edits, reviews, posts and articles) stay on the service so the database and conversations remain whole, but they will be shown as coming from a "deleted user". If you also want particular posts removed, say so in your request.

        We may suspend or close accounts that seriously or repeatedly break these terms, or when the law requires us to. These terms keep applying to what you did while your account was open.
      `,
    },
    {
      id: 'disclaimer',
      title: 'Disclaimers and liability',
      short: 'Disclaimers',
      summary: 'The data is written by volunteers and may contain mistakes. Check official sources before relying on it.',
      body: md`
        The service is provided "as is" and "as available". The information on CDCat comes from the community and may be incomplete, out of date or wrong. Check official sources before relying on it, for example before buying something.

        CDCat links to stores, official sites and other services that we don't control. We are not responsible for their content, products or practices.

        To the extent the law allows, CDCat and its volunteers are not liable for indirect or consequential losses, or for losses caused by content that users or third parties post. Nothing in these terms limits liability that the law does not allow to be limited.
      `,
    },
    {
      id: 'changes',
      title: 'Changes to these terms',
      summary: 'We\'ll tell you before significant changes take effect.',
      body: md`
        We may update these terms, for example when we add features or the law changes. For significant changes we'll give at least ${NOTICE_DAYS} days' notice, through a site announcement or an email, before they take effect. The date at the top shows when the terms last changed.

        If you keep using the service after a change takes effect, you accept the updated terms. If you don't agree, you can close your account.
      `,
    },
    {
      id: 'contact',
      title: 'Disputes and contact',
      summary: 'Questions or problems? Write to us; we\'d rather sort things out together.',
      body: md`
        We run the service in line with the laws that apply to it. If a disagreement comes up, please contact us first and we'll try to resolve it informally.

        If any part of these terms turns out to be unenforceable, the rest still applies. If we don't enforce a part of these terms straight away, we haven't given up the right to.

        You can reach the CDCat team at **${CONTACT_EMAIL}**.
      `,
    },
  ],
} satisfies LegalContent
