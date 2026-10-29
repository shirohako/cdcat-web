import { md } from '~/documents/sections'
import type { ApiDocsTexts } from '../types'

const texts: ApiDocsTexts = {
  title: '开放接口',
  intro: '用 HTTP 读取 CDCat 收录的专辑、艺术家、活动、条目和系列资料。不需要注册，也不需要密钥；资料库数据以 CC BY-SA 4.0 共享。',

  labels: {
    tag: '开发者文档',
    beta: '测试版',
    beta_note: '正式上线前字段可能调整，以最新版本的文档为准',
    base_url: '基础地址',
    copy: '复制',
    copied: '已复制',
    copy_url: '复制请求地址',
    copy_json: '复制 JSON',
    copy_failed: '无法复制，请手动选择文字复制',
    in_section: '本节的接口和对象',
    path_params: '路径参数',
    query_params: '查询参数',
    response: '返回的 data',
    response_model: 'data 是一个 {model}。',
    extends: '包含 {model} 的全部字段，另外还有：',
    statuses: '状态码',
    example: '示例',
    default: '默认 {value}',
    required: '必填',
    optional: '有时不出现',
    see: '取值见 {name}',
    more_items: '另 {n} 项',
    more_model: '字段见 {model}',
    model: '对象',
    enum: '取值表',
    feedback_title: '反馈',
    feedback_text: '发现文档和接口对不上、想要新的接口，或者遇到了问题，欢迎告诉我们。',
    feedback_issue: '在 GitHub 提 issue',
    feedback_email: '写信',
  },

  common: {
    params: {
      page: '页码，从 1 开始。',
      per_page: '每页条数。超出范围返回 422。',
      include_pending: '也列出审核中的内容（已上线、等待审核）。',
      direction: '排列方向：`asc` 从小到大，`desc` 从大到小。',
    },
    fields: {
      pagination: '分页信息，见 [Pagination](#object-pagination)。',
      slug: '地址别名，只用于展示，不能用来查找。',
      release_date_precision: '日期的精度。只知道年份或月份时，日期记为当年或当月的 1 号，请按精度显示。',
      is_favorited: '当前用户是否收藏了它。只在网站登录时有意义，其他请求总是 `false`。',
      is_pending: '是否审核中：提交后已经上线，正在等待审核。',
      titles: '原名以外的其他名称：官方译名、翻译、读音、别名等，见 [Title](#object-title)。',
      links: '外部链接，已按顺序排好，见 [Link](#object-link)。',
      share_card_url: '分享卡片（1200×630 的 JPEG）的地址；还没生成时为 `null`。',
      version: '当前版本号，每次修改后加一。',
      pending_revision: '等待审核的那次提交。只有提交人和审核者看得到，其他人总是 `null`。',
      created_at: '创建时间（UTC）。',
      updated_at: '最后更新时间（UTC）。浏览数之类的统计变化也会更新它。',
    },
  },

  sections: {
    'overview': {
      title: '概览',
      lead: '开放接口让其他网站和应用读取 CDCat 的音乐资料。接口只读，不需要注册或密钥。',
    },
    'usage': {
      title: '使用规则',
      lead: '资料可以自由复用，只要署名并遵守授权协议。也请控制请求频率，不要给服务器添负担。',
    },
    'conventions': {
      title: '通用约定',
      lead: '每个接口都遵守的规则：响应格式、分页、参数写法、名称和日期，以及审核中和被合并的内容。',
    },
    'rate-limits': {
      title: '频率限制',
      lead: '不需要登录的读取接口共用一个频率限制，搜索另有自己的限制。',
    },
    'errors': {
      title: '错误',
      lead: '出错时，HTTP 状态码说明是哪一类问题。`error.name` 是稳定的错误名，请用它来判断。',
    },
    'albums': {
      title: '专辑与曲目',
      short: '专辑与曲目',
      lead: '专辑是收录曲目的发行单位。限定盘和通常盘是同一张专辑的不同版本（Product）；黑胶等曲目表不同的发行另建一张专辑。列表返回精简的 AlbumSimple，详情还带碟片、曲目、制作人员、版本和图片。',
    },
    'lyrics': {
      title: '歌词',
      lead: '歌词挂在曲目上：每个曲目最多一份原文，另外可以有翻译和音译。歌词归权利人所有，不适用 CC BY-SA，只能作资料参考和辨识之用。',
    },
    'artists': {
      title: '艺术家',
      lead: '艺术家包括个人、团体、同人社团、公司、虚拟歌手和角色。唱片公司、厂牌和发行商也是艺术家（类型 `company`），没有单独的厂牌。',
    },
    'events': {
      title: '活动',
      lead: '活动系列（如 M3、Comic Market）下面是每一届活动。会场图和摊位来自主办方公开的资料，按原样保存。',
    },
    'entries': {
      title: '条目',
      lead: '条目是专辑关联的原作，比如动画、游戏、电影和书籍。专辑通过条目归入系列。',
    },
    'franchises': {
      title: '系列',
      lead: '系列把相关的条目组织在一起，最多两层：系列和子系列。它和活动系列（`/event-series`）是两回事。',
    },
    'search': {
      title: '搜索',
      lead: '一次搜索专辑、曲目、艺术家、条目和系列。简体、繁体和日文汉字，以及假名、全角和半角，都会先统一再比较。',
    },
    'dictionaries': {
      title: '字典与取值表',
      short: '字典与取值表',
      lead: '接口里的取值都是固定的英文小写。完整、最新的列表以 `/catalog/schema` 为准，这里说明各个值的含义。',
    },
    'objects': {
      title: '常用对象',
      lead: '在很多接口里都会出现的对象。',
    },
    'changes': {
      title: '更新记录',
      lead: '对调用方有影响的变化，最新的在前。正式上线前接口还在测试阶段，字段可能调整。',
    },
  },

  prose: {
    'overview': md`
      ### 基础地址

      所有接口都在这个地址下面，本页写的路径都省略了它：

      \`\`\`
      {{base}}
      \`\`\`

      请求用 \`GET\`，返回 JSON。例如读取一张专辑：

      \`\`\`
      GET {{base}}/albums/1287
      \`\`\`

      ### 这份文档包括什么

      - 专辑与曲目、歌词、艺术家、活动、条目、系列和搜索，以及取值表。
      - 接口还在测试阶段：正式上线前字段可能调整。变化后不再另外通知，以最新版本的文档为准。
      - 提交和修改资料的接口文档目前还未完成。

      ### 不需要密钥

      这些接口都不需要登录，也没有 API 密钥。其他网站的网页可以直接跨域调用：CORS 允许任何来源，请求不带 Cookie。
    `,
    'usage': md`
      ### 不在授权范围内的内容

      歌词、封面和其他图片归各自的权利人所有，只能作资料参考和辨识之用，CC BY-SA 不适用于它们。评价、讨论和文章归作者所有，不属于资料库数据，这份文档也不介绍它们的接口。

      ### 请求礼仪

      - 控制频率，不要同时发出大量请求。具体的上限见[频率限制](#rate-limits)。
      - 在 \`User-Agent\` 里写明你的应用名称和联系方式，例如 \`MyLyricsApp/1.2 (https://example.com; me@example.com)\`，出了问题我们能找到你。
      - 能缓存的就缓存，同一份资料不需要每次都重新请求。
      - API 域名的 robots.txt 是为了不让搜索引擎收录接口。按本文档调用接口，不受它限制。

      其他要求见用户协议的[合理使用服务](/terms#acceptable-use)。

      ### 反馈

      发现文档和接口对不上、想要新的接口，或者遇到了问题，可以在 GitHub 上[提 issue]({{issues}})，或者写信到 {{email}}。
    `,
    'conventions': md`
      ### 响应格式

      成功时 \`success\` 为 \`true\`，内容放在 \`data\` 里；失败时 \`success\` 为 \`false\`，原因放在 \`error\` 里，见[错误](#errors)。

      \`\`\`json
      { "success": true, "data": { … } }
      \`\`\`

      ### 分页

      列表接口用 \`page\`（从 1 开始）和 \`per_page\` 分页，\`data\` 里有列表本身和 [Pagination](#object-pagination)。每个接口的默认条数和上限写在它的参数里，超出上限会返回 422。

      ### 参数写法

      - 布尔值写 \`true\` / \`false\`，也可以写 \`1\` / \`0\`。
      - 数组写成 \`names[]=a&names[]=b\`。
      - 排序用 \`sort\`（按什么排）和 \`direction\`（\`asc\` 升序，\`desc\` 降序）。专辑列表的 \`sort\` 是几种固定的排法，没有 \`direction\`。
      - 不认识的参数值返回 422，不会悄悄换成默认值。文档里没写的参数会被忽略。
      - ID 都是数字。\`slug\` 只用于展示，不能用来查找。

      ### 名称与翻译

      接口不按语言返回不同的内容。\`title\` 或 \`name\` 是原名，即包装上印的名字；其他名称在 \`titles\` 里，见 [Title](#object-title)。要按读者的语言显示名称，建议依次取：该语言的 \`official\`、该语言的 \`translation\`、原名。

      列表里的专辑（AlbumSimple）没有 \`titles\`，只能显示原名；需要译名时，请求专辑详情。活动和活动系列的 \`description\` 是按语言分开的对象，例如 \`{ "ja": "…", "en": "…" }\`。

      ### 日期与时间

      - 日期写成 \`YYYY-MM-DD\`。发行日期带 \`release_date_precision\`：只知道年份或月份时，精度是 \`year\` 或 \`month\`，日期记为当年或当月的 1 号。显示时请按精度省略。
      - 时间是 UTC 的 ISO 8601，不带小数秒，例如 \`2026-10-30T08:00:00Z\`。
      - 活动的 \`start_time\` 和 \`end_time\` 是会场当地的时间 \`HH:MM\`，不带时区。

      ### 图片

      图片地址都是完整的 URL。专辑的图片（[Image](#object-image)）同时给出原图 \`url\`、长边最多 300px 的 \`thumbnail_url\` 和最多 1200px 的 \`medium_url\`。请直接用这些地址，不要自己拼。条目、系列和活动的图片可能放在其他网站上。

      ### 审核中的内容

      成员新建的专辑、艺术家、条目和系列，提交后立即上线，同时等待审核，这时 \`is_pending\` 为 \`true\`。这四种内容的列表默认不包括它们，传 \`include_pending=true\` 才会列出；详情和其他接口照常返回。没有通过审核的内容会被删除，之后再请求会得到 404。

      ### 成人内容

      \`is_adult\` 只是标记，接口不会替你过滤。如果你的应用面向所有年龄，请自己过滤。

      ### 合并与删除

      重复的专辑、曲目和艺术家会被合并。请求被合并掉的 ID 时，\`/albums/{id}\`、\`/tracks/{id}\`、\`/artists/{id}\` 和 \`/artists/{id}/card\` 返回 301：\`Location\` 指向保留下来的那一个，\`data.moved_to\` 写明类型和新的 ID。

      \`\`\`json
      { "success": true, "data": { "moved_to": { "resource_type": "album", "id": 1290 } } }
      \`\`\`

      其他接口遇到被合并或删除的 ID，返回 404。

      ### 缓存

      \`/catalog/schema\`、会场图和摊位列表的响应带 \`ETag\`。下次请求时带上 \`If-None-Match\`，内容没变就返回 304，不用再下载一遍。
    `,
    'rate-limits': md`
      | 请求 | 每分钟上限 | 按什么计数 |
      |---|---|---|
      | 不带登录令牌 | {{rate_limit}} 次 | IP 地址；IPv6 按 /64 网段算一个 |
      | 带有效的登录令牌 | {{rate_limit_user}} 次 | 账号 |
      | \`/search\` | 另有 {{search_limit}} 次 | 账号或 IP，和上面分开计数 |

      每个响应都带两个头：\`X-RateLimit-Limit\` 是每分钟的上限，\`X-RateLimit-Remaining\` 是这一分钟还剩多少次。超过上限时返回 429：

      \`\`\`json
      {
        "success": false,
        "error": {
          "code": 50000,
          "name": "RATE_LIMIT_EXCEEDED",
          "message": "Too Many Attempts.",
          "details": { "retry_after": 42 }
        }
      }
      \`\`\`

      \`details.retry_after\` 和响应头 \`Retry-After\` 都是需要等待的秒数，\`X-RateLimit-Reset\` 是可以重试的时刻（Unix 时间戳）。收到 429 后，请等 \`Retry-After\` 秒再试，不要马上重试。

      跨域请求也能读到这些头。上限以后可能调整，请按响应头判断，不要写死在代码里。
    `,
    'errors': md`
      出错时返回的对象，字段见 [Error](#object-error)：

      \`\`\`json
      {
        "success": false,
        "error": {
          "code": 40000,
          "name": "VALIDATION_FAILED",
          "message": "The given data failed validation",
          "details": { "per_page": ["The per page field must not be greater than 100."] }
        }
      }
      \`\`\`

      \`message\` 是英文，只用于调试，以后可能改变。\`details\` 只在参数错误和超过频率限制时出现。

      | HTTP | \`error.name\` | 什么时候 |
      |---|---|---|
      | 404 | \`RESOURCE_NOT_FOUND\` | 地址没错，但内容不存在或已被删除 |
      | 404 | \`NOT_FOUND\` | 地址不对：路径不存在，或者 ID 不是数字 |
      | 405 | \`METHOD_NOT_ALLOWED\` | 用了 \`GET\` 以外的请求方法 |
      | 422 | \`VALIDATION_FAILED\` | 参数不合法，\`details\` 按参数名列出原因 |
      | 429 | \`RATE_LIMIT_EXCEEDED\` | 请求太频繁，见[频率限制](#rate-limits) |
      | 500 | \`INTERNAL_ERROR\` | 服务器出错。请稍后重试，一直出错请告诉我们 |

      另外，被合并的专辑、曲目和艺术家返回 301（见[合并与删除](#合并与删除)），带 \`ETag\` 的接口可能返回 304。
    `,
  },

  statuses: {
    'VALIDATION_FAILED': '参数不合法，`details` 按参数名列出原因。',
    'RESOURCE_NOT_FOUND': '内容不存在或已被删除。',
    'RATE_LIMIT_EXCEEDED': '请求太频繁，等 `retry_after` 秒后再试。',
    '301': '这个 ID 已经合并到另一个，`Location` 和 `data.moved_to` 给出新的 ID。',
    '304': '带了 `If-None-Match`，内容没有变化。',
  },

  endpoints: {
    'get-albums': {
      title: '专辑列表',
      summary: '按条件筛选专辑，分页返回。审核中的专辑默认不在列表里。',
      params: {
        'type': '专辑类型。',
        'category': '专辑类别，比如 `doujin`、`game`。',
        'format': '碟片介质，比如 `cd`、`vinyl`。',
        'artist_id': '只列出这位艺术家参与的专辑，担任什么角色都算。',
        'release_event_id': '只列出在这一届活动首发的专辑。',
        'year': '发行年份。',
        'attributes[key]': '按属性筛选，最多 5 个，例如 `attributes[cover_character]=射命丸文`。指向条目等内容的属性写成 `entry:12`。只能筛选文字、网址、选项和引用类型的属性。',
        'sort': '`new` 按发行日期从新到旧，`trending` 按最近 30 天的热度，`top_rated` 按评分排名（每天更新一次）。',
        'search': '搜索标题、其他名称、品番、条码和署名。去掉空格后至少 2 个字符，含汉字或假名时 1 个就够，最多 3 个词。没传 `sort` 时按相关度排序。',
      },
      fields: {
        albums: '这一页的专辑。',
      },
      notes: md`
        ::: tip 列表里没有译名
        AlbumSimple 没有 \`titles\`，只能显示原名。要按读者的语言显示译名，请求[专辑详情](#get-albums-id)。
        :::
      `,
    },
    'get-albums-id': {
      title: '专辑详情',
      summary: '一张专辑的全部资料：碟片和曲目、制作人员、发行版本、特典、图片、外部链接、关联的条目和统计。',
      params: {
        id: '专辑 ID。',
      },
      notes: md`
        - 每次请求会记一次浏览（同一来源每天只记一次），\`views_count\` 每 5 分钟更新。
        - 署名与发行（发行、厂牌、署名艺术家等）也在 \`credits\` 里，\`category\` 为 \`release\`。
      `,
    },
    'get-tracks-id': {
      title: '曲目详情',
      summary: '一个曲目，带它所在的专辑、同一张专辑的曲目表、原曲和改编自它的曲目。',
      params: {
        id: '曲目 ID。',
      },
    },
    'get-tracks-id-lyrics': {
      title: '曲目的歌词',
      summary: '一个曲目的全部歌词（原文、翻译、音译），只有概要，不含正文。按 ID 排序，不分页。',
      params: {
        id: '曲目 ID。',
      },
      fields: {
        lyrics: '这个曲目的歌词，见 [LyricSummary](#object-lyric-summary)。',
      },
    },
    'get-lyrics-id': {
      title: '歌词',
      summary: '一份歌词的正文和来源。',
      params: {
        id: '歌词 ID。',
      },
      notes: md`
        ::: warning 歌词的权利
        歌词归权利人所有，不适用 CC BY-SA，只能作资料参考和辨识之用，见[使用规则](#usage)。
        :::
      `,
    },
    'get-artists': {
      title: '艺术家列表',
      summary: '按条件筛选艺术家，分页返回，新加入的在前。审核中的艺术家默认不在列表里。',
      params: {
        type: '艺术家类型。',
        search: '按名称、其他名称和地址别名搜索，包含即可。搜索时按匹配程度排序。',
        has_albums: '只列出有专辑的艺术家。',
      },
      fields: {
        artists: '这一页的艺术家，不含详情才有的字段。',
      },
    },
    'get-artists-id': {
      title: '艺术家详情',
      summary: '一位艺术家的资料，带其他名称、外部链接、属性和相关的艺术家。',
      params: {
        id: '艺术家 ID。',
      },
    },
    'get-artists-id-albums': {
      title: '艺术家发行的专辑',
      summary: '这位艺术家在整张专辑上担任「署名与发行」角色（署名艺术家、发行、厂牌、经销、制造、企划）的专辑，按发行日期从新到旧。包括审核中的专辑。',
      params: {
        id: '艺术家 ID。',
      },
      fields: {
        albums: '这一页的专辑。',
      },
    },
    'get-artists-id-tracks': {
      title: '艺术家参与的曲目',
      summary: '这位艺术家参与的专辑：曲目上的任何角色，以及整张专辑上「署名与发行」以外的角色。按专辑分组，列出整张专辑上的角色和参与的曲目。',
      params: {
        id: '艺术家 ID。',
        role: '只看这个角色，例如 `composer`。角色的 key 见 [/catalog/schema](#get-catalog-schema) 的 `credit_roles`。',
      },
      fields: {
        'albums': '这一页的专辑，每张一组。分页按专辑计算。',
        'albums.album': '专辑。',
        'albums.roles': '在整张专辑上担任的角色。',
        'albums.roles.role': '角色的 key。',
        'albums.roles.credited_as': '署名，和艺术家名不同时才有。',
        'albums.roles.detail': '补充说明，例如具体的乐器。',
        'albums.tracks': '参与的曲目，按碟片和曲号排序。',
        'albums.tracks.id': '曲目 ID。',
        'albums.tracks.title': '曲名（原名）。',
        'albums.tracks.disc_position': '第几张碟。',
        'albums.tracks.track_number': '曲号。',
        'albums.tracks.number_label': '显示用的编号，例如黑胶的 `A1`。',
        'albums.tracks.roles': '在这个曲目上担任的角色，格式同 `albums.roles`。',
        'roles': '每个角色参与过的专辑数，例如 `{ "composer": 4 }`。不受 `role` 参数影响。',
        'all': '参与过的专辑总数。',
      },
    },
    'get-artists-id-card': {
      title: '艺术家卡片',
      summary: '一位艺术家的简要资料，适合做悬浮卡片：最多 4 个其他名称，简介截取前 160 个字。',
      params: {
        id: '艺术家 ID。',
      },
      fields: {
        id: '艺术家 ID。',
        name: '名称（原名）。',
        type: '艺术家类型。',
        image_url: '头像。',
        is_active: '是否仍在活动；个人去世、团体解散后为 `false`。',
        bio: '简介的开头，最多 160 个字，原样截取，可能带 Markdown 记号。',
        albums_count: '参与的专辑数。',
        followers_count: '收藏这位艺术家的人数。',
      },
    },
    'get-artists-lookup': {
      title: '按名称查找艺术家',
      summary: '用名字精确查找艺术家，一次最多 100 个，适合把制作人员表里的名字对应到艺术家。比较前会统一全角半角、大小写、假名和简繁日汉字。',
      params: {
        'names[]': '要查找的名字，每个最多 200 个字符。',
      },
      fields: {
        'matches': '按你传入的名字分组的结果。',
        'matches.<name>': '和这个名字完全一致的艺术家，可能有几位同名的，也可能没有（空数组）。比较主名称、官方译名、翻译、读音和别名，不比较简称。',
        'matches.<name>.id': '艺术家 ID。',
        'matches.<name>.name': '名称（原名）。',
        'matches.<name>.type': '艺术家类型。',
        'matches.<name>.image_url': '头像。',
      },
    },
    'get-event-series': {
      title: '活动系列列表',
      summary: '全部活动系列，按名称排序，不分页。',
      fields: {
        event_series: '活动系列，带 `latest_start_date`。',
      },
    },
    'get-event-series-id': {
      title: '活动系列详情',
      summary: '一个活动系列。系列下的各届活动用 [活动列表](#get-events) 的 `series_id` 分页获取。',
      params: {
        id: '活动系列 ID。',
      },
    },
    'get-events': {
      title: '活动列表',
      summary: '按条件筛选各届活动，分页返回，默认最近的在前。',
      params: {
        series_id: '只列出这个活动系列的活动。',
        search: '按名称和地址别名搜索：去掉空格后 2 到 100 个字符，最多 3 个词，每个词都要匹配。',
        start_from: '开始日期不早于这一天（`YYYY-MM-DD`）。',
        start_to: '开始日期不晚于这一天（`YYYY-MM-DD`）。',
        sort: '`start_date` 按开始日期，`released_albums_count` 按首发专辑数。',
      },
      fields: {
        events: '这一页的活动，不含详情才有的字段。',
      },
    },
    'get-events-id': {
      title: '活动详情',
      summary: '一届活动，比列表多出摊位数、有没有会场图和分享卡片。',
      params: {
        id: '活动 ID。',
      },
    },
    'get-events-id-map': {
      title: '会场图',
      summary: '一届活动的会场平面图：展馆、每张桌子的位置和背景的形状，由主办方的平面图转换而来。',
      params: {
        id: '活动 ID。',
      },
      statuses: {
        RESOURCE_NOT_FOUND: '活动不存在，或者这一届还没有会场图（先看活动详情的 `has_map`）。',
      },
      notes: md`
        数据比较大，响应带 \`ETag\` 和 \`Cache-Control: public, max-age=60\`，请带 \`If-None-Match\` 重复请求。坐标的单位是平面图 PDF 的 pt，y 轴向下。
      `,
    },
    'get-events-id-booths': {
      title: '摊位',
      summary: '一届活动的全部摊位，按主办方列表的顺序，一次全部返回。摊位按主办方的资料原样保存，一个摊位可以关联零到多位艺术家。',
      params: {
        id: '活动 ID。',
      },
      fields: {
        booths: '全部摊位；还没有导入时为空数组。',
      },
      notes: md`
        和会场图一样带 \`ETag\` 和 \`Cache-Control: public, max-age=60\`。摊位里的文字和 cut 图来自主办方，\`is_adult\` 只是标记。
      `,
    },
    'get-entries': {
      title: '条目列表',
      summary: '按条件筛选条目，分页返回。审核中的条目默认不在列表里。',
      params: {
        type: '条目类型。',
        format: '子类型，可选的值随类型不同，见 [entry_type](#enum-entry-type)。',
        platform: '游戏平台，完全一致才算，例如 `Switch`。',
        franchise_id: '只列出属于这个系列（包括它的子系列）的条目。',
        year: '发行年份。',
        search: '按名称、其他名称（包括别名、简称）和地址别名搜索。没传 `sort` 时按相关度排序。',
        sort: '排序依据。',
      },
      fields: {
        entries: '这一页的条目，不含详情才有的字段。',
      },
    },
    'get-entries-id': {
      title: '条目详情',
      summary: '一个条目，带外部链接、关联的专辑、所属的系列和相关的条目。',
      params: {
        id: '条目 ID。',
      },
    },
    'get-franchises': {
      title: '系列列表',
      summary: '按条件筛选系列，分页返回。默认只列顶层系列；搜索时包括子系列。审核中的系列默认不在列表里。',
      params: {
        search: '按名称、其他名称和地址别名搜索。没传 `sort` 时按相关度排序。',
        parent_id: '只列出这个系列的子系列。',
        top_level: '`true` 只列顶层系列，`false` 列出全部。没有 `search` 时默认 `true`，有 `search` 时默认 `false`；传了 `parent_id` 时不起作用。',
        sort: '排序依据。条目数和专辑数包括子系列。',
      },
      fields: {
        franchises: '这一页的系列，不含详情才有的字段。',
      },
    },
    'get-franchises-id': {
      title: '系列详情',
      summary: '一个系列，带它的子系列（以及子系列的条目）、直接属于它的条目，和属于整个系列的专辑。',
      params: {
        id: '系列 ID。',
      },
    },
    'get-franchises-id-albums': {
      title: '系列的专辑',
      summary: '系列和它的子系列下的全部专辑：经条目关联的专辑，加上属于整个系列的专辑，去掉重复后分页，按发行日期排序。',
      params: {
        id: '系列 ID。',
        entry_id: '只看关联到这个条目的专辑。',
        relation_type: '只看和系列里的条目是这种关系的专辑，例如 `ost`。传了它就不包括属于整个系列的专辑。',
        sort: '只能按发行日期。',
      },
      fields: {
        'albums': '这一页的专辑。',
        'albums.entries': '这张专辑关联的、属于这个系列的条目；属于整个系列的专辑为空数组。',
        'albums.entries.id': '条目 ID。',
        'albums.entries.name': '条目名称（原名）。',
        'albums.entries.type': '条目类型。',
        'albums.entries.relation_type': '专辑和条目的关系。',
      },
    },
    'get-search': {
      title: '搜索',
      summary: '在专辑、曲目、艺术家、条目和系列里搜索。不传 `type` 时每类返回前几条；传了 `type` 就只搜这一类，分页返回。',
      params: {
        q: '搜索词。去掉空格后至少 2 个字符，含汉字、假名或谚文时 1 个就够，最多 3 个词，每个词都要匹配。',
        type: '只搜这一类，结果分页。',
        include_pending: '也搜索审核中的内容。搜索默认包括它们，同分时排在已审核的后面。',
        limit: '不传 `type` 时，每类最多返回几条。',
      },
      fields: {
        'query': '实际用来搜索的词。',
        'query.phrase': '整理后的搜索词。',
        'query.terms': '拆出来的词，最多 3 个。',
        'groups': '不传 `type` 时返回：每类一组，顺序固定（专辑、曲目、艺术家、条目、系列），没有结果的类型也在。',
        'groups.type': '这一组的类型。',
        'groups.total': '这一类的结果数，最多数到 1000。',
        'groups.total_is_capped': '结果超过 1000 条时为 `true`。',
        'groups.items': '这一类的前几条结果。',
        'results': '传了 `type` 时返回：这一页的结果。',
        'total_is_capped': '传了 `type` 时返回：结果超过 1000 条时为 `true`，`pagination.total` 最多 1000。',
      },
      notes: md`
        搜索有自己的频率限制，每分钟 {{search_limit}} 次，见[频率限制](#rate-limits)。拉丁字母 3 个以上的词允许少量拼写错误；品番要完全一致。
      `,
    },
    'get-catalog-schema': {
      title: '目录字典',
      summary: '接口用到的全部取值表，以及后台维护的制作人员角色、属性定义和链接提供方，带四种语言的名称。',
      fields: {
        'enums': '取值表，键是名称（如 `album_type`），值是全部取值。',
        'credit_roles': '制作人员的角色，`credits[].role` 是这里的 `key`。',
        'credit_roles.key': '角色的 key，例如 `composer`。',
        'credit_roles.category': '角色的分类。',
        'credit_roles.names': '各语言的名称，例如 `{ "ja": "作曲", "en": "Composer" }`。',
        'credit_roles.aliases': '外站的常见写法，可以用来把其他网站的人员表对应过来。',
        'credit_roles.is_album_role': '能不能用于整张专辑。',
        'credit_roles.is_track_role': '能不能用于单个曲目。',
        'attribute_definitions': '属性的定义：专辑、曲目、图片和艺术家可以带的附加信息，例如「封面角色」。',
        'attribute_definitions.key': '属性的 key，即 Attribute 的 `key`。',
        'attribute_definitions.names': '各语言的名称。',
        'attribute_definitions.description': '各语言的填写说明。',
        'attribute_definitions.group': '分组，例如「东方 Project」。',
        'attribute_definitions.value_type': '值的类型。',
        'attribute_definitions.choices': '`choice` 类型的可选值。',
        'attribute_definitions.reference_types': '`reference` 类型能指向哪些内容，例如 `entry`。',
        'attribute_definitions.applies_to': '能挂在哪些对象上：`album`、`track`、`album_image`、`artist`。',
        'attribute_definitions.is_multiple': '能不能填多个值。',
        'link_providers': '链接提供方，和 [链接提供方列表](#get-link-providers) 相同。',
        'aggregates': '编辑器用的数据结构说明，读取资料用不到。',
        'limits': '上传图片的限制，读取资料用不到。',
      },
    },
    'get-link-providers': {
      title: '链接提供方',
      summary: '外部链接的全部提供方（官网、社交网站、流媒体、商店、数据库等），按显示顺序，不分页。',
      fields: {
        link_providers: '链接提供方。',
      },
    },
  },

  models: {
    AlbumSimple: {
      title: '专辑（精简）',
      description: '列表、搜索、艺术家和条目页面里用的精简专辑。没有 `titles`，只能显示原名。',
      fields: {
        id: '专辑 ID。网页地址是 `{{site}}/albums/{id}`。',
        title: '原名，即包装上印的名字。',
        type: '专辑类型。',
        categories: '专辑类别，可以有几个；空数组表示作曲家作品集，不属于任何作品企划。',
        release_date: '发行日期。',
        catalog_number: '品番，取第一个有品番的版本；可以是范围，例如 `KECH-8059~62`。',
        image_url: '封面，长边最多 1200px。',
        disc_count: '碟数：第一个版本里的碟片，不含特典碟。',
        track_count: '这些碟片上的曲目数。',
        duration: '这些曲目的总时长（秒），不知道时长的曲目不算。',
        disc_formats: '这些碟片的介质，去掉重复。',
        is_adult: '成人向标记。',
        favorites_count: '收藏数。',
        reviews_count: '评价数。',
        views_count: '浏览数，每 5 分钟更新一次。',
        byline: '标题下面那一行署名：有发行方时是全部发行方，否则是署名艺术家；都没有时为 `null`。',
      },
    },
    Album: {
      title: '专辑',
      description: '专辑详情。',
      fields: {
        'description': '简介。',
        'banner_url': '专辑页的横幅图。',
        'release_event': '首发活动。',
        'release_event.id': '活动 ID。',
        'release_event.name': '活动名称。',
        'release_event.slug': '活动的地址别名。',
        'release_event.main_visual_url': '活动的主视觉。',
        'release_event.start_date': '活动开始的日期。',
        'cover': '封面图片，有原图和两种缩略图的地址。',
        'discs': '碟片，按顺序排列，每张带它的曲目。',
        'tracklist_languages': '曲目表有哪些语言的名称，以及每种语言有名称的曲目数。',
        'tracklist_languages.locale': '语言（BCP 47）。',
        'tracklist_languages.kind': '名称的种类：`official`、`translation` 或 `transliteration`。',
        'tracklist_languages.count': '这种语言有名称的曲目数。',
        'tracklist_languages.total': '曲目总数。',
        'credits': '整张专辑的制作人员，包括「署名与发行」组（`category` 为 `release`）。',
        'products': '发行版本，例如初回限定盘和通常盘。',
        'bonuses': '特典，例如店铺特典和会场特典。',
        'images': '专辑图片：封面、背面、歌词本、碟面等。',
        'attributes': '附加信息，例如封面角色。',
        'streaming': '流媒体链接，和其他链接分开。',
        'entries': '关联的条目（原作）。',
        'entries.id': '条目 ID。',
        'entries.name': '条目名称（原名）。',
        'entries.type': '条目类型。',
        'entries.format': '条目的子类型。',
        'entries.image_url': '条目的图片。',
        'entries.release_date': '条目的发行日期。',
        'entries.relation_type': '专辑和条目的关系，例如原声、片头曲。',
        'entries.note': '关系的补充说明。',
        'entries.franchises': '条目所属的系列。',
        'entries.franchises.id': '系列 ID。',
        'entries.franchises.name': '系列名称（原名）。',
        'entries.franchises.parent_id': '父系列 ID，顶层系列为 `null`。',
        'franchises': '直接属于整个系列的专辑才有，例如周年合集。',
        'franchises.id': '系列 ID。',
        'franchises.name': '系列名称（原名）。',
        'franchises.image_url': '系列的图片。',
        'tracking_stats': '用户标记的收听状态人数。',
        'tracking_stats.plan_to_listen': '想听。',
        'tracking_stats.completed': '听过。',
        'tracking_stats.wishlist': '想要。',
        'tracking_stats.owned': '已入手。',
        'tracking_stats.dropped': '不感兴趣。',
        'rating': '平均评分，1 到 5，两位小数；没有人评分时为 `null`。',
        'rating_count': '评分人数。',
        'rating_distribution': '1 到 5 分各有多少人，没有人评分时为 `null`。',
        'ranking': '评分排名，每天更新一次；还没有人评分时为 `null`。',
        'articles': '介绍这张专辑的文章，最多 5 篇。',
        'articles.id': '文章 ID。',
        'articles.title': '文章标题。',
        'articles.cover_url': '文章的封面图。',
        'articles.published_at': '发表时间（UTC）。',
        'contributors': '编辑过这张专辑的用户，每天更新一次。',
        'contributors.username': '用户名。',
        'contributors.nickname': '昵称。',
        'contributors.avatar_url': '头像。',
        'user_tracking': '当前用户标记的收听状态。只在网站登录时有意义，其他请求总是 `null`。',
        'user_tracking.status': '状态：`plan_to_listen`、`completed`、`wishlist`、`owned` 或 `dropped`。',
        'edited_at': '当前版本的修改时间（UTC）。和 `updated_at` 不同，浏览数之类的变化不影响它。',
      },
    },
    Disc: {
      title: '碟片',
      description: '专辑里的一张碟：CD、BD、黑胶或配信等。',
      fields: {
        id: '碟片 ID。',
        position: '第几张，从 1 开始。',
        title: '碟名，例如「DISC 2 Instrumental」；没有时为 `null`。',
        format: '介质。',
        bonus_id: '特典附带的碟片才有，指向那个特典。',
        tracks: '这张碟上的曲目，按曲号排列。',
      },
    },
    AlbumTrack: {
      title: '专辑里的曲目',
      description: '专辑详情里的曲目，带它自己的制作人员和原曲。',
      fields: {
        id: '曲目 ID。',
        disc_number: '第几张碟。',
        track_number: '曲号，在同一张碟里唯一。',
        number_label: '显示用的编号，和曲号不同时才有，例如黑胶的 `A1`。',
        title: '曲名，即包装上印的名字。',
        duration: '时长（秒），不知道时为 `null`。',
        is_instrumental: '是否是纯音乐。',
        isrc: '国际标准录音代码。',
        favorites_count: '收藏数。',
        has_lyrics: '是否有原文歌词。',
        lyrics_count: '歌词的份数，包括翻译。',
        translations_count: '其中翻译的份数。',
        originals: '原曲：这个曲目改编、翻唱或混音自哪首曲子。',
        credits: '这个曲目的制作人员。',
        attributes: '附加信息，例如 BPM。',
      },
    },
    Track: {
      title: '曲目',
      description: '曲目详情。',
      fields: {
        'id': '曲目 ID。',
        'album_id': '所在专辑的 ID。',
        'disc_id': '所在碟片的 ID。',
        'disc_number': '第几张碟。',
        'track_number': '曲号。',
        'number_label': '显示用的编号，例如黑胶的 `A1`。',
        'title': '曲名（原名）。',
        'duration': '时长（秒），不知道时为 `null`。',
        'is_instrumental': '是否是纯音乐。',
        'isrc': '国际标准录音代码。',
        'has_lyrics': '是否有原文歌词。',
        'lyrics_count': '歌词的份数，包括翻译。',
        'translations_count': '其中翻译的份数。',
        'favorites_count': '收藏数。',
        'originals': '原曲。',
        'derived_tracks': '把这个曲目当作原曲的曲目，例如它的改编和翻唱。',
        'derived_tracks.id': '曲目 ID。',
        'derived_tracks.title': '曲名（原名）。',
        'derived_tracks.album': '那个曲目所在的专辑。',
        'album': '所在的专辑。',
        'album_tracks': '同一张专辑的全部曲目，按碟片和曲号排序，方便做上一首、下一首。',
        'album_tracks.id': '曲目 ID。',
        'album_tracks.disc_number': '第几张碟。',
        'album_tracks.track_number': '曲号。',
        'album_tracks.number_label': '显示用的编号。',
        'album_tracks.title': '曲名（原名）。',
        'album_tracks.duration': '时长（秒）。',
        'album_tracks.has_lyrics': '是否有原文歌词。',
        'credits': '这个曲目的制作人员。',
        'credits.id': 'ID。',
        'credits.role': '角色的 key，名称见 `/catalog/schema` 的 `credit_roles`。',
        'credits.detail': '补充说明，例如具体的乐器或角色名。',
        'credits.credited_as': '署名，和艺术家名不同时才有。',
        'credits.artist': '艺术家；只知道署名、还没有对应的艺术家时为 `null`。',
        'credits.artist.id': '艺术家 ID。',
        'credits.artist.name': '艺术家名称（原名）。',
        'attributes': '附加信息。',
      },
    },
    Credit: {
      title: '制作人员',
      description: '某位艺术家在专辑或曲目上的一个角色。同一个人担任几个角色就有几条。',
      fields: {
        'id': 'ID。',
        'role': '角色的 key，例如 `composer`；名称见 `/catalog/schema` 的 `credit_roles`。「署名与发行」组的 6 个角色见 [release_role](#enum-release-role)。',
        'category': '角色的分类。',
        'artist': '艺术家；只知道署名、还没有对应的艺术家时为 `null`。',
        'artist.id': '艺术家 ID。',
        'artist.name': '艺术家名称（原名）。',
        'artist.image_url': '头像。',
        'artist.type': '艺术家类型。',
        'credited_as': '署名，即专辑上印的名字；和艺术家名不同时才有。',
        'detail': '补充说明，例如具体的乐器或配音的角色。',
      },
    },
    Product: {
      title: '发行版本',
      description: '能买到的一个版本，例如初回限定盘、通常盘、配信版，各自勾选包含哪些碟片。',
      fields: {
        id: '版本 ID。',
        name: '版本名，例如「初回限定盤」。',
        edition_type: '通常版还是限定版。',
        limited_rule: '限定的方式，只有限定版才有。',
        limited_name: '限定版的名称。',
        medium: '实体还是数字版。',
        catalog_number: '品番。',
        barcode: '条码（JAN / EAN / UPC）。',
        release_date: '这个版本的发行日期；为 `null` 时和专辑相同。',
        region: '发行地区，ISO 3166-1 的两位代码，例如 `JP`。',
        price: '定价，写成字符串，例如 `"3300.00"`。',
        currency: '货币，ISO 4217 代码，例如 `JPY`。',
        is_hires: '是否是高解析度音源。',
        is_available: '是否仍在销售。',
        sort_order: '显示顺序。',
        disc_ids: '这个版本包含的碟片 ID。',
        format_label: '显示用的规格，例如 `2CD+BD`，配信版是 `DL`。',
      },
    },
    Bonus: {
      title: '特典',
      description: '店铺特典、会场特典、初回特典等。特典 CD 是 `bonus_id` 指向这个特典的碟片。',
      fields: {
        'id': '特典 ID。',
        'name': '特典名称。',
        'type': '特典的类型。',
        'description': '说明。',
        'is_digital': '是否是电子特典。',
        'shop': '店铺名，例如「とらのあな」。',
        'availability': '获得方式。',
        'note': '条件，例如「購入者全員」「抽選」。',
        'sort_order': '显示顺序。',
        'event': '会场特典对应的活动。',
        'event.id': '活动 ID。',
        'event.name': '活动名称。',
        'event.slug': '活动的地址别名。',
        'product_ids': '跟哪些版本送；空数组表示所有版本都送。',
        'disc_ids': '这个特典附带的碟片。',
      },
    },
    AlbumImage: {
      title: '专辑图片',
      description: '一张图片在专辑里的用途：封面、背面、歌词本的某一页等。',
      fields: {
        id: 'ID。',
        kind: '图片的类别。',
        label: '补充说明，例如歌词本的页码「p. 01-02」。',
        caption: '图片说明。',
        product_id: '只属于某个版本时才有。',
        bonus_id: '只属于某个特典时才有。',
        disc_id: '只属于某张碟时才有。',
        sort_order: '显示顺序。',
        image: '图片文件。',
        attributes: '附加信息，例如封面角色。',
      },
    },
    Original: {
      title: '原曲',
      description: '曲目改编、翻唱或混音自哪首曲子：库里的另一个曲目，或者只有一段文字。',
      fields: {
        'title': '原曲的曲名。指向库里的曲目时是那个曲目的曲名。',
        'track': '原曲是库里的曲目时才有，否则为 `null`。',
        'track.id': '原曲的曲目 ID。',
        'track.album': '原曲所在的专辑。',
        'track.album.id': '专辑 ID。',
        'track.album.title': '专辑名（原名）。',
      },
    },
    LyricSummary: {
      title: '歌词（概要）',
      description: '一份歌词的概要，不含正文。',
      fields: {
        'id': '歌词 ID。',
        'track_id': '曲目 ID。',
        'kind': '原文、翻译还是音译。',
        'language': '语言（BCP 47），例如 `ja`、`zh-Hans`、`ja-Latn`。',
        'translation_of_id': '翻译和音译才有：对应的原文歌词 ID，可以逐行对照。',
        'format': '正文的格式。',
        'translator': '译者的署名。',
        'is_ai_generated': '是否是机器翻译。',
        'creator': '最早提交这份歌词的用户；账号删除后为 `null`。',
        'creator.id': '用户 ID。',
        'creator.username': '用户名。',
        'creator.nickname': '昵称。',
        'creator.avatar_url': '头像。',
      },
    },
    Lyric: {
      title: '歌词',
      description: '一份完整的歌词。',
      fields: {
        'content': '正文。格式为 `lrc` 和 `srt` 时带时间轴。',
        'source': '来源，例如「歌詞カード」。',
        'track': '所在的曲目。',
        'track.id': '曲目 ID。',
        'track.title': '曲名（原名）。',
        'track.track_number': '曲号。',
        'track.disc_number': '第几张碟。',
        'track.album': '所在的专辑。',
      },
    },
    Artist: {
      title: '艺术家',
      description: '列表和详情都用这个对象。标着「有时不出现」的字段只在详情里返回。',
      fields: {
        'id': '艺术家 ID。网页地址是 `{{site}}/artists/{id}`。',
        'name': '主名称，一般是原名。',
        'type': '艺术家类型。',
        'is_active': '是否仍在活动；个人去世、团体解散后为 `false`。',
        'bio': '简介，Markdown。',
        'image_url': '头像。',
        'followers_count': '收藏这位艺术家的人数。',
        'albums_count': '参与的专辑数，担任什么角色都算。',
        'releases_count': '「发行的专辑」的数量，见[艺术家发行的专辑](#get-artists-id-albums)。',
        'credited_albums_count': '「参与的专辑」的数量，见[艺术家参与的曲目](#get-artists-id-tracks)。',
        'catalog_prefixes': '品番前缀，例如 `["LACA"]`；公司和兼做厂牌的社团才有。',
        'shouts_count': '艺术家页上的留言数。',
        'attributes': '附加信息。',
        'relations': '相关的艺术家，从这位艺术家的角度描述。',
        'relations.artist': '对方。',
        'relations.artist.id': '艺术家 ID。',
        'relations.artist.name': '名称（原名）。',
        'relations.artist.image_url': '头像。',
        'relations.artist.type': '艺术家类型。',
        'relations.relation_type': '关系，例如 `has_member` 表示对方是这个团体的成员。',
        'relations.note': '补充说明。',
      },
    },
    EventSeries: {
      title: '活动系列',
      description: '例如 M3、Comic Market。',
      fields: {
        id: '活动系列 ID。网页地址是 `{{site}}/event-series/{id}`。',
        name: '名称。',
        slug: '地址别名。',
        location: '举办的城市或地区。',
        description: '介绍，按语言分开的对象，例如 `{ "ja": "…", "en": "…" }`；不一定每种语言都有。',
        website: '官网。',
        banner_url: '横幅图。',
        visual_orientation: '各届主视觉的方向：竖版（场刊封面）或横版。',
        events_count: '有多少届。',
        latest_start_date: '最近一届的开始日期。只在列表里有。',
      },
    },
    Event: {
      title: '活动',
      description: '一届活动。标着「有时不出现」的字段只在详情里返回。',
      fields: {
        'id': '活动 ID。网页地址是 `{{site}}/events/{id}`。',
        'event_series_id': '所属的活动系列；独立举办的活动为 `null`。',
        'series': '所属的活动系列。',
        'series.id': '活动系列 ID。',
        'series.name': '名称。',
        'series.slug': '地址别名。',
        'series.website': '官网。',
        'series.visual_orientation': '主视觉的方向。',
        'name': '名称，例如「M3-2026秋」。',
        'slug': '地址别名。',
        'start_date': '开始日期。',
        'end_date': '结束日期；只有一天时为 `null`。',
        'start_time': '开场时间 `HH:MM`，会场当地时间。',
        'end_time': '结束时间 `HH:MM`。',
        'venue': '会场。',
        'location': '城市或地区。',
        'website_url': '这一届自己的网站；系列的官网在 `series.website`。',
        'description': '介绍，按语言分开的对象。',
        'main_visual_url': '主视觉或场刊封面。',
        'main_visual_width': '主视觉的宽（像素）。',
        'main_visual_height': '主视觉的高（像素）。',
        'key_visuals': '其他视觉图，格式还没有确定，请不要依赖它。',
        'meta': '导入时写入的附加信息，例如摊位类别代码的名称；格式可能改变。',
        'albums_count': '后台手填的发布专辑数，不自动更新；请用 `released_albums_count`。',
        'artists_count': '后台手填的参展社团数，不自动更新。',
        'released_albums_count': '在这一届首发的专辑数，实时统计，包括审核中的专辑。',
        'booths_count': '摊位数，包括场外参加的。',
        'has_map': '是否有会场图。',
      },
    },
    EventMap: {
      title: '会场图',
      description: '一届活动的平面图。坐标的单位是平面图 PDF 的 pt，原点在左上角，y 轴向下。',
      fields: {
        'width': '整张图的宽。',
        'height': '整张图的高。',
        'background': '墙、柱子、区域等背景形状，按绘制顺序排列。',
        'background.d': 'SVG 的 path 数据。',
        'background.s': '明度，0 是墙，1 是地面。',
        'background.e': '为 `1` 时用 even-odd 填充规则。',
        'background.w': '描边宽度；没有时只填充。',
        'labels': '会场里的文字和区块字母。',
        'labels.text': '文字。',
        'labels.x': '位置的 x。',
        'labels.y': '位置的 y。',
        'labels.size': '字号。',
        'labels.rotate': '旋转角度（度）。',
        'labels.vertical': '是否竖排。',
        'labels.kind': '为 `area` 时是区块字母（A、あ……）。',
        'halls': '展馆和楼层，按顺序排列。',
        'halls.id': '展馆 ID，即 `spaces` 里的 `hall_id`。',
        'halls.building': '建筑，例如「第一展示場」。',
        'halls.floor': '楼层，例如 `2F`。',
        'halls.name': '显示用的名称。',
        'halls.bbox': '展馆在图上的范围 `[x, y, w, h]`。',
        'spaces': '一张桌子一项，写成数组 `[id, hall_id, area, number, x, y, w, h]`。摊位的 `space_id` 指向这里的 `id`。',
        'genres': '摊位类别代码的名称，例如 `{ "201": { "label": "オリジナル", "group": "music" } }`。',
      },
    },
    EventBooth: {
      title: '摊位',
      description: '主办方列表里的一条参展信息，按原样保存：一个摊位可能是几个社团合办，名字里也可能带着读音或说明。',
      fields: {
        'id': '摊位 ID。',
        'space_id': '所在的桌子，即会场图 `spaces` 里的 `id`；场外参加的摊位为 `null`。',
        'space_code': '摊位号，例如 `A-01a`。',
        'area': '区块，例如 `A`。',
        'sub': '占桌子的哪一部分：`a`、`b` 是半张，`ab` 是整张，`x`、`y`、`z` 是迷你摊位的三分之一。',
        'name': '摊位名，按主办方的原样。',
        'name_kana': '名称的读音。',
        'description': '主办方列表里的说明。',
        'genre': '类别代码，名称见会场图的 `genres`。',
        'keywords': '关键词。',
        'links': '主办方列表里的链接。',
        'links.type': '链接的种类，例如 `website`。',
        'links.url': '地址。',
        'twitter_handle': 'X（Twitter）账号，小写，不带 @。',
        'image_url': 'cut 图，已经保存到本站。',
        'embeds': '嵌入的视频。',
        'embeds.type': '目前只有 `youtube`。',
        'embeds.id': '视频 ID。',
        'is_adult': '成人向标记，接口不过滤。',
        'artists': '关联的艺术家，可以有几位，也可以没有。',
        'artists.id': '艺术家 ID。',
        'artists.name': '名称（原名）。',
        'artists.image_url': '头像。',
        'album_ids': '这些艺术家在这一届首发的专辑 ID。',
      },
    },
    Entry: {
      title: '条目',
      description: '列表和详情都用这个对象。标着「有时不出现」的字段只在详情里返回。',
      fields: {
        'id': '条目 ID。网页地址是 `{{site}}/entries/{id}`。',
        'name': '主名称，一般是原名。',
        'type': '条目类型。',
        'format': '子类型，可选的值随类型不同，见 [entry_type](#enum-entry-type)。',
        'platforms': '游戏平台，例如 `["Switch", "PC"]`；不是游戏时为空数组。',
        'release_date': '发行或首播日期。',
        'description': '简介，纯文本。',
        'image_url': '图片，可能放在其他网站上。',
        'banner_url': '横幅图。',
        'albums_count': '关联的专辑数，包括审核中的。',
        'albums': '关联的专辑，按发行日期排序。',
        'albums.relation_type': '专辑和条目的关系。',
        'albums.note': '关系的补充说明。',
        'franchises': '所属的系列。',
        'franchises.id': '系列 ID。',
        'franchises.name': '系列名称（原名）。',
        'franchises.image_url': '系列的图片。',
        'franchises.parent': '父系列；顶层系列为 `null`。',
        'franchises.parent.id': '父系列 ID。',
        'franchises.parent.name': '父系列名称。',
        'related_entries': '相关的条目，从这个条目的角度描述：`sequel` 表示对方是它的续作。',
        'related_entries.id': '条目 ID。',
        'related_entries.name': '名称（原名）。',
        'related_entries.type': '条目类型。',
        'related_entries.format': '子类型。',
        'related_entries.image_url': '图片。',
        'related_entries.release_date': '发行日期。',
        'related_entries.relation_type': '关系。',
        'related_entries.note': '补充说明。',
        'sort_order': '只在系列详情的条目里有：在系列里的顺序。',
      },
    },
    Franchise: {
      title: '系列',
      description: '列表和详情都用这个对象。标着「有时不出现」的字段只在详情里返回。统计都包括子系列。',
      fields: {
        'id': '系列 ID。网页地址是 `{{site}}/franchises/{id}`。',
        'name': '主名称，一般是原名。',
        'parent_id': '父系列 ID；顶层系列为 `null`。',
        'description': '简介，纯文本。',
        'image_url': '图片，可能放在其他网站上。',
        'banner_url': '横幅图。',
        'sort_order': '在父系列里的顺序。',
        'entries_count': '条目数，包括子系列的，去掉重复。',
        'albums_count': '专辑数：经条目关联的，加上属于整个系列的，去掉重复。',
        'children_count': '子系列数。',
        'parent': '父系列；顶层系列为 `null`。`children` 里的子系列没有这个字段。',
        'parent.id': '父系列 ID。',
        'parent.name': '父系列名称。',
        'children': '子系列，带各自的统计、其他名称和条目，没有外部链接。',
        'entries': '直接属于这个系列的条目，按顺序和发行日期排列，带 `sort_order`。',
        'albums': '属于整个系列的专辑，例如周年合集。',
        'albums.sort_order': '在系列里的顺序。',
      },
    },
    SearchResult: {
      title: '搜索结果',
      description: '一条搜索结果，五种类型共用。',
      fields: {
        'type': '结果的类型。',
        'id': '这条结果本身的 ID。',
        'title': '原名。',
        'image_url': '图片。',
        'meta': '副标题用的信息，按类型不同：专辑有 `artist_credit`、`catalog_number`、`release_date`、`release_date_precision`、`album_type`、`disc_formats`；曲目有 `album_id`、`album_title`、`disc_number`、`track_number`、`duration`；艺术家有 `artist_type`；条目有 `entry_type`、`release_date`；系列有 `parent`（`{ id, name }` 或 `null`）。',
        'album': '专辑和曲目的结果才有：专辑或曲目所在的专辑。',
        'matched': '匹配到的是哪个名称；匹配的是原名时为 `null`。',
        'matched.field': '匹配到的字段。',
        'matched.text': '匹配到的文字。',
        'matched.locale': '这个名称的语言。',
      },
    },
    LinkProvider: {
      title: '链接提供方',
      description: '外部链接来自的网站，例如官网、X、VGMdb。',
      fields: {
        id: '提供方 ID。',
        name: '标识，例如 `x`、`vgmdb`，不是显示名称。',
        icon_url: '图标。',
        url_pattern: '网址的通配模板，例如 `https://x.com/*`，可以用来识别用户粘贴的链接；没有时为 `null`。',
        category: '分类。',
      },
    },
    Title: {
      title: '其他名称',
      description: '原名以外的名称。`official`、`translation`、`transliteration` 每种语言最多一个，别名和简称不限。',
      fields: {
        title: '名称。',
        locale: '语言（BCP 47），例如 `ja`、`zh-Hans`、`en`；罗马字是 `ja-Latn`，假名读音是 `ja-Hrkt`。别名和简称可能为 `null`。',
        kind: '名称的种类。',
      },
    },
    Link: {
      title: '外部链接',
      description: '指向其他网站的链接，例如官网、社交账号、流媒体和数据库。',
      fields: {
        'id': '链接 ID。',
        'url': '地址。',
        'external_id': '在那个网站上的 ID，例如 Bangumi 的 `subject/12345`；对不上时为 `null`。',
        'is_verified': '是否已经核实。',
        'provider': '链接提供方；提供方被删除时为 `null`。',
        'provider.id': '提供方 ID。',
        'provider.name': '标识，例如 `x`。',
        'provider.icon_url': '图标。',
        'provider.category': '分类。',
      },
    },
    Image: {
      title: '图片',
      description: '上传到本站的图片。原图比缩略图还小时，缩略图的地址就是原图。',
      fields: {
        id: '图片 ID。',
        url: '原图（WebP）。',
        thumbnail_url: '长边最多 300px 的缩略图。',
        medium_url: '长边最多 1200px 的缩略图。',
        width: '原图的宽（像素）。',
        height: '原图的高（像素）。',
        mime: 'MIME 类型，例如 `image/webp`。',
      },
    },
    Byline: {
      title: '署名',
      description: '标题下面那一行署名，保存专辑时算好。',
      fields: {
        'role': '`publisher` 时是整张专辑的全部发行方，`artist` 时是全部署名艺术家。',
        'artists': '署名的艺术家，按制作人员的顺序。',
        'artists.id': '艺术家 ID；只有署名、没有对应的艺术家时为 `null`。',
        'artists.name': '署名；没有单独的署名时是艺术家名。',
      },
    },
    Attribute: {
      title: '属性',
      description: '后台定义的附加信息，例如封面角色、BPM。定义见 `/catalog/schema` 的 `attribute_definitions`。',
      fields: {
        id: 'ID。',
        key: '属性的 key，例如 `cover_character`。',
        value: '值，类型随属性不同：文字、网址和选项是字符串；整数是数字；小数是字符串；布尔值是 `true` / `false`；日期是 `{ date, precision }`；引用是 `{ type, id }`，例如 `{ "type": "entry", "id": 12 }`。',
        label: '引用类型的属性才有：所指内容的名称。',
        sort_order: '显示顺序。',
      },
    },
    Pagination: {
      title: '分页',
      description: '列表接口的分页信息。',
      fields: {
        total: '一共多少条。',
        per_page: '每页多少条。',
        current_page: '当前是第几页。',
        last_page: '最后一页的页码。',
      },
    },
    Error: {
      title: '错误',
      description: '出错时 `error` 里的对象。',
      fields: {
        code: '数字错误码。',
        name: '错误名，例如 `RESOURCE_NOT_FOUND`。请用它来判断错误类型。',
        message: '英文说明，只用于调试，可能改变。',
        details: '参数错误时按参数名列出原因；超过频率限制时是 `{ retry_after }`。',
      },
    },
  },

  enums: {
    album_type: {
      title: '专辑类型',
      description: '专辑的形态，和 Spotify 的 album_type 类似。',
      values: {
        album: '专辑。',
        ep: 'EP、迷你专辑。',
        single: '单曲。',
        compilation: '合辑、精选集。',
        drama: '广播剧、有声剧 CD。',
        radio: '广播节目的 CD。',
      },
    },
    album_category: {
      title: '专辑类别',
      description: '专辑的音乐来自哪里，可以有几个。空数组表示作曲家作品集，不属于任何作品企划。',
      values: {
        game: '游戏音乐，包括和游戏有关但不对应具体游戏的。',
        animation: '动画音乐。',
        publication: '漫画、轻小说等出版物。',
        audio_drama: '广播剧、有声剧。',
        tokusatsu: '特摄和人偶剧。',
        live_action: '电影、电视剧、舞台剧。',
        doujin: '同人社团或个人自主创作的音乐，原创和二次创作都算。',
        event: '为活动制作的音乐，例如展会、演出和比赛的主题曲。',
      },
    },
    disc_format: {
      title: '碟片介质',
      description: 'HQCD、SHM-CD 这类细分记为 `cd`。',
      values: {
        cd: 'CD。',
        sacd: 'SACD。',
        dvd: 'DVD。',
        bd: '蓝光。',
        vinyl: '黑胶。',
        cassette: '磁带。',
        digital: '配信（数字版）。',
        other: '其他。',
      },
    },
    date_precision: {
      title: '日期精度',
      description: '日期精确到哪一级。',
      values: {
        day: '精确到日。',
        month: '只知道年月，日期记为当月 1 号。',
        year: '只知道年份，日期记为当年 1 月 1 日。',
      },
    },
    title_kind: {
      title: '名称的种类',
      description: '其他名称（Title）是什么样的名称。',
      values: {
        official: '官方的其他语言名称，例如包装背面印的英文名。',
        translation: '非官方的翻译。',
        transliteration: '音译、罗马字、假名读音。',
        alias: '别名、旧名。',
        abbreviation: '简称。',
      },
    },
    artist_type: {
      title: '艺术家类型',
      description: '艺术家是什么。',
      values: {
        person: '个人。',
        group: '团体、乐队。',
        circle: '同人社团。',
        company: '公司：唱片公司、厂牌、发行商、制作公司、工作室。',
        virtual: '虚拟歌手、VTuber。',
        character: '演唱角色歌的角色。',
      },
    },
    artist_relation: {
      title: '艺术家关系',
      description: '从当前这位艺术家的角度描述，两边各看到一种。',
      values: {
        member_of: '当前艺术家是对方的成员。',
        has_member: '对方是当前团体的成员。',
        voice_of: '当前艺术家为对方（角色）配音。',
        voiced_by: '对方为当前角色配音。',
        persona_of: '当前是对方的另一个名义。',
        has_persona: '对方是当前艺术家的另一个名义。',
        subunit_of: '当前是对方的小分队。',
        has_subunit: '对方是当前团体的小分队。',
        related: '其他相关。',
      },
    },
    credit_role_category: {
      title: '角色分类',
      description: '制作人员角色的分组。具体的角色见 `/catalog/schema` 的 `credit_roles`。',
      values: {
        release: '署名与发行：署名艺术家、发行、厂牌等，见 [release_role](#enum-release-role)。',
        composition: '作曲。',
        lyrics: '作词。',
        arrangement: '编曲、混音改编。',
        vocals: '演唱、和声、配音。',
        performance: '演奏、乐团、指挥。',
        production: '制作人、监督。',
        engineering: '录音、混音、母带。',
        artwork: '插画、设计、摄影。',
        other: '其他。',
      },
    },
    release_role: {
      title: '署名与发行',
      description: '「署名与发行」组的 6 个角色，是 `credits[].role` 的一部分。专辑的署名（Byline）从这里算出。',
      values: {
        artist: '署名艺术家：封面或曲目上署名的艺术家。',
        publisher: '发行（発売元），只用于整张专辑。',
        label: '厂牌（レーベル），只用于整张专辑。',
        distributor: '经销（販売元），只用于整张专辑。',
        manufacturer: '制造（製造元），只用于整张专辑。',
        planning: '企划（企画），只用于整张专辑。',
      },
    },
    edition_type: {
      title: '版本类型',
      description: '通常版还是限定版。',
      values: {
        regular: '通常版。',
        limited: '限定版，限定方式见 `limited_rule`。',
      },
    },
    limited_rule: {
      title: '限定方式',
      description: '限定版和特典的获得条件。',
      values: {
        first_press: '初回限定。',
        count: '数量限定。',
        period: '期间限定。',
        shop: '店铺限定。',
        event: '会场限定。',
        region: '地区限定。',
      },
    },
    product_medium: {
      title: '版本的形态',
      description: '实体还是数字版。',
      values: {
        physical: '实体。',
        digital: '数字版（配信）。',
      },
    },
    bonus_type: {
      title: '特典类型',
      description: '特典是什么。',
      values: {
        bonus_track: '附赠曲目。',
        bonus_disc: '特典碟。',
        booklet: '小册子。',
        photo_item: '照片、卡片类。',
        goods: '周边商品。',
        digital_content: '电子内容。',
        serial_code: '序列号。',
        event_entry: '活动报名券。',
        signed_item: '签名物品。',
        other: '其他。',
      },
    },
    image_kind: {
      title: '图片类别',
      description: '图片在专辑里的用途，参考 VGMdb 的分类。',
      values: {
        cover: '专辑封面，正方形，每张专辑恰好一张。',
        front: '正面。',
        back: '背面。',
        booklet: '歌词本，页码写在 `label` 里。',
        disc: '碟面。',
        disc_back: '碟背。',
        obi_front: '侧标正面。',
        obi_back: '侧标背面。',
        tray: '托盘。',
        box: '外盒。',
        sticker: '贴纸。',
        bonus_item: '特典物品。',
        illustration: '插画。',
        other: '其他。',
      },
    },
    lyric_kind: {
      title: '歌词种类',
      description: '一份歌词是原文、翻译还是音译。',
      values: {
        original: '原文，每个曲目最多一份。',
        translation: '翻译。',
        transliteration: '音译、罗马字。',
      },
    },
    lyric_format: {
      title: '歌词格式',
      description: '歌词正文的写法。',
      values: {
        plain: '纯文本。',
        lrc: 'LRC，带时间轴。',
        srt: 'SRT 字幕，带时间轴。',
      },
    },
    entry_type: {
      title: '条目类型',
      description: '条目是什么作品。子类型 `format` 随类型不同：动画是 `tv`、`movie`、`ova`、`web`、`special`；游戏是 `full`、`dlc`、`expansion`；剧集是 `series`、`special`；书籍是 `novel`、`light_novel`、`other`；漫画是 `serial`、`oneshot`；舞台是 `musical`、`play`；电影和其他没有子类型。',
      values: {
        anime: '动画，包括动画电影。',
        game: '游戏。',
        movie: '真人电影。',
        tv: '真人剧集。',
        book: '书籍。',
        manga: '漫画。',
        stage: '舞台剧、音乐剧。',
        other: '其他。',
      },
    },
    entry_relation: {
      title: '条目关系',
      description: '从当前条目的角度描述，两边各看到一种。',
      values: {
        sequel: '对方是当前条目的续作。',
        prequel: '对方是当前条目的前作。',
        side_story: '对方是当前条目的外传。',
        main_story: '对方是当前条目的本篇。',
        spin_off: '对方是当前条目的衍生作品。',
        spin_off_of: '当前条目衍生自对方。',
        adaptation: '对方改编自当前条目。',
        source: '对方是当前条目的原作。',
        remake: '对方是当前条目的重制版。',
        remake_of: '当前条目是对方的重制版。',
        alternative: '另一个版本。',
        shared_world: '同一个世界观。',
        related: '其他相关。',
      },
    },
    entry_album_relation: {
      title: '专辑和条目的关系',
      description: '一张专辑对某个条目来说是什么。',
      values: {
        opening: '片头曲。',
        ending: '片尾曲。',
        insert_song: '插曲。',
        theme_song: '主题曲。',
        character_song: '角色歌。',
        image_song: '印象曲。',
        ost: '原声。',
        drama: '广播剧。',
        other: '其他。',
      },
    },
    attribute_value_type: {
      title: '属性值的类型',
      description: '属性定义的 `value_type`，决定 Attribute 的 `value` 是什么。',
      values: {
        text: '文字。',
        integer: '整数。',
        decimal: '小数，写成字符串。',
        date: '日期，写成 `{ date, precision }`。',
        url: '网址。',
        boolean: '是或否。',
        choice: '从定义的 `choices` 里选一个。',
        reference: '指向库里的内容，写成 `{ type, id }`。',
      },
    },
    link_category: {
      title: '链接分类',
      description: '链接提供方的分类，流媒体链接在专辑里单独列出。',
      values: {
        official: '官网。',
        social: '社交网站。',
        streaming: '流媒体。',
        shop: '商店。',
        database: '资料库，例如 VGMdb、MusicBrainz、Bangumi。',
        other: '其他。',
      },
    },
  },

  changes: {
    launch: '首次公开，测试版。',
  },
}

export default texts
