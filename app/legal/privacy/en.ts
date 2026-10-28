import { CONTACT_EMAIL, MIN_AGE, NOTICE_DAYS, REQUEST_DAYS } from '../constants'
import { md } from '~/documents/sections'
import type { LegalContent } from '../types'

export default {
  intro: 'This policy explains what information CDCat collects, why, and what choices you have. In short: we collect only what we need to run the site, we show no ads, and we never sell your data.',
  highlights: [
    { icon: 'lucide:ban', title: 'No ads, no selling', text: 'We don\'t show ads, sell your information or use third-party trackers.', to: 'overview' },
    { icon: 'lucide:cookie', title: 'Only essential cookies', text: 'Cookies keep you signed in and remember your settings. That\'s all.', to: 'cookies' },
    { icon: 'lucide:eye', title: 'Some things are public', text: 'Your profile, favorites, tracking lists and posts can be seen by anyone.', to: 'public-info' },
    { icon: 'lucide:sliders-horizontal', title: 'You\'re in control', text: 'Change your data in settings, unsubscribe in one click, or ask us to close your account.', to: 'your-rights' },
  ],
  sections: [
    {
      id: 'overview',
      title: 'Overview',
      summary: 'We collect what CDCat needs to run, nothing for advertising. This policy covers cdcat.net, its API and our emails.',
      body: md`
        CDCat is run by the CDCat team ("we", "us"). This policy applies to the website cdcat.net, its public API and the emails we send, and should be read together with our [Terms of Service](/terms).

        We don't show advertising, we don't sell or rent personal information, and we don't use third-party analytics or tracking tools.
      `,
    },
    {
      id: 'data-we-collect',
      title: 'Information we collect',
      short: 'What we collect',
      summary: 'Your account details, what you add to your profile, what you post, and some technical data such as IP addresses.',
      body: md`
        | Category | What it includes | Required? |
        |---|---|---|
        | Account | Username, nickname, email address, date of birth, password (stored only as a secure hash) | Yes |
        | Profile | Avatar, banner, bio | No |
        | Settings | Region, currency, interface and email language, gender, whether to show adult content, notification and email preferences | No |
        | What you post | Catalog edits and their sources, images, lyrics, reviews and ratings, articles, discussion posts, comments, reports | Only what you post |
        | Your activity | Favorites, tracking lists, likes and reactions, bookmarks, where you are in discussions, event checklists, notifications | Only what you use |
        | Technical | IP address and browser details in server logs, the IP address a discussion post was sent from, when you were last active | Collected automatically |

        We don't collect your real name, phone number, postal address, payment details or precise location.

        When you upload an image, we convert it to WebP and remove embedded metadata such as camera details and GPS location.
      `,
    },
    {
      id: 'how-we-use',
      title: 'How we use information',
      short: 'How we use it',
      summary: 'To run the service, keep it safe and contact you about your account. Never to profile you for ads.',
      body: md`
        | Purpose | Information used |
        |---|---|
        | Running your account and the features you use | Account, profile, settings, what you post, your activity |
        | Showing contributions and who made them | Username, nickname, what you post |
        | Checking that you're old enough to sign up | Date of birth |
        | Preventing spam, abuse and duplicate accounts, and enforcing our terms | IP addresses, reports, account and activity data |
        | Sending account emails: verification codes, password resets, important notices | Email address, email language |
        | Sending optional site updates and newsletters | Email address, email preferences |
        | Counting page views | A short-lived, anonymised identifier (see below) |
        | Meeting legal obligations and answering valid legal requests | What the request lawfully requires |

        Page views are counted without tracking you. So that the same visit isn't counted twice, we briefly keep a one-way hash of your IP address and browser (or your user ID when you're signed in); only the totals are stored.
      `,
    },
    {
      id: 'public-info',
      title: 'What others can see',
      summary: 'Your profile, favorites, tracking lists, posts and edit history are public. Your email, birthday and settings are not.',
      body: md`
        **Public:** your username, nickname, avatar, banner, bio and join date; your favorites and tracking lists; your reviews, ratings, articles, discussion posts and comments; and the catalog edits credited to you in the edit history.

        **Never public:** your email address, date of birth, gender, settings, IP addresses and password.

        ::: warning The edit history stays
        The database keeps a public history of every change and who made it. If you close your account, your edits stay but are credited to a "deleted user".
        :::

        The catalog also holds information about artists, circles and other creators. If it's about you and something is wrong, or you'd like something removed, contact us.
      `,
    },
    {
      id: 'cookies',
      title: 'Cookies and local storage',
      short: 'Cookies',
      summary: 'We only use the cookies the site needs to work. No analytics or advertising cookies.',
      body: md`
        We set these cookies:

        | Cookie | Purpose | Expires |
        |---|---|---|
        | \`auth_token\`, \`auth_user\` | Keep you signed in | After 1 year, or when you sign out |
        | \`appearance_theme\`, \`appearance_hue\` | Remember your light or dark theme and colour | After 1 year |
        | \`i18n_redirected\` | Remember your interface language | After 1 year |

        Our network provider, Cloudflare, may set strictly necessary security cookies that protect the site from abuse.

        Your browser also keeps some things on your device only: drafts of catalog edits (in IndexedDB) and autosaved article drafts. They aren't sent to us until you submit them, and clearing your browser's site data removes them.

        ::: tip No tracking
        We don't use analytics, advertising or social media cookies, so there is no cookie banner to dismiss.
        :::
      `,
    },
    {
      id: 'sharing',
      title: 'Sharing with others',
      short: 'Sharing',
      summary: 'We only share information with the services that help us run CDCat, or when the law requires it. We never sell it.',
      body: md`
        | Who | Why | What they receive |
        |---|---|---|
        | Our hosting provider | Runs our servers and stores our data | The data we store |
        | Cloudflare | Delivers the site securely: DNS, content delivery, protection from attacks | Your IP address and request details |
        | Our email delivery provider | Sends our emails | Your email address and the email itself |
        | Bangumi | When an entry is imported from Bangumi | Only the ID of the item being imported, nothing about you |

        Some pages show images hosted elsewhere, such as avatars linked from other sites. Loading them lets those sites see your IP address. When someone imports an image from a link, our server fetches it, so the other site sees our server, not you.

        We may disclose information when the law or a valid legal process requires it, to protect the safety of our users or the public, or to enforce our terms. If CDCat ever passes to new operators, they will remain bound by this policy, and we'll tell you beforehand.
      `,
    },
    {
      id: 'email',
      title: 'Emails',
      summary: 'Account emails are necessary; site updates and newsletters are optional and easy to turn off.',
      body: md`
        | Type | Examples | Can you turn it off? |
        |---|---|---|
        | Important | Verification codes, password resets, security and policy notices | No, your account needs them |
        | Site updates | New features and changes to CDCat | Yes |
        | Newsletter | Occasional news from the community | Yes |

        Site updates and the newsletter are on by default. Each of those emails has a one-click unsubscribe link, and you can change your choices in your account settings at any time.

        We don't track whether you open our emails or click their links. We keep a record of each email sent (address, subject, delivery status) to look into delivery problems, and we stop sending to addresses that bounce or mark our emails as spam.
      `,
    },
    {
      id: 'security',
      title: 'Security',
      summary: 'We protect your data with standard safeguards, though no system is perfectly secure.',
      body: md`
        - Connections to CDCat are encrypted with HTTPS.
        - Passwords are stored only as bcrypt hashes, never in plain text.
        - Resetting your password signs you out of every device.
        - Uploaded images are stripped of embedded metadata.
        - Only staff who need it can see personal information, and staff actions are logged.

        If you think your account has been compromised, reset your password and contact us. If we learn of a breach affecting your personal information, we'll tell you as the law requires.
      `,
    },
    {
      id: 'your-rights',
      title: 'Your choices and rights',
      short: 'Your rights',
      summary: 'You can see and correct most of your data yourself, and ask us for a copy or to close your account.',
      body: md`
        You can view and change your profile, settings and email preferences at any time in your account settings, and edit much of what you've posted.

        ::: steps Asking for a copy or deletion
        1. Email ${CONTACT_EMAIL} from the address on your account and say what you'd like: a copy of your data, a correction, or closing your account.
        2. We may ask you to confirm the request, to make sure it's really you.
        3. We'll respond within ${REQUEST_DAYS} days.
        :::

        Depending on where you live, you may have further rights, such as objecting to or restricting some processing, or complaining to a data protection authority. You can use them the same way.
      `,
    },
    {
      id: 'children',
      title: 'Children',
      summary: `CDCat isn't for children under ${MIN_AGE}.`,
      body: md`
        You must be at least ${MIN_AGE} to create an account, and we check your date of birth when you sign up. If you're under 18, you need permission from a parent or guardian.

        If we learn that we hold personal information about a child under ${MIN_AGE}, we'll delete it. Parents or guardians who think this has happened can contact us.
      `,
    },
    {
      id: 'international',
      title: 'Processing across borders',
      short: 'Across borders',
      summary: 'Your information may be processed outside the country where you live.',
      body: md`
        CDCat is used around the world. Our servers and service providers, including Cloudflare's global network, may process information in countries other than yours, where data protection laws may differ. We apply the protections in this policy wherever your information is processed.
      `,
    },
    {
      id: 'changes',
      title: 'Changes to this policy',
      summary: 'We\'ll tell you before significant changes take effect.',
      body: md`
        We may update this policy when our practices or the law change. For significant changes we'll give at least ${NOTICE_DAYS} days' notice, through a site announcement or an email. The date at the top shows the current version.
      `,
    },
    {
      id: 'contact',
      title: 'Contact us',
      summary: 'Questions about your privacy? Write to us.',
      body: md`
        For questions about this policy or your personal information, or to make a request, email **${CONTACT_EMAIL}**.

        This policy is available in English, Simplified Chinese, Traditional Chinese and Japanese. If the versions differ, the English version prevails.
      `,
    },
  ],
} satisfies LegalContent
