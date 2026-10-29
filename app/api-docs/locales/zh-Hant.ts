import { md } from '~/documents/sections'
import type { ApiDocsTexts } from '../types'

const texts: ApiDocsTexts = {
  title: '開放介面',
  intro: '透過 HTTP 讀取 CDCat 收錄的專輯、藝術家、活動、條目和系列資料。不需要註冊，也不需要金鑰；資料庫資料以 CC BY-SA 4.0 分享。',

  labels: {
    tag: '開發者文件',
    beta: '測試版',
    beta_note: '正式上線前欄位可能調整，以最新版本的文件為準',
    base_url: '基礎網址',
    copy: '複製',
    copied: '已複製',
    copy_url: '複製請求網址',
    copy_json: '複製 JSON',
    copy_failed: '無法複製，請手動選取文字複製',
    in_section: '本節的介面和物件',
    path_params: '路徑參數',
    query_params: '查詢參數',
    response: '回傳的 data',
    response_model: 'data 是一個 {model}。',
    extends: '包含 {model} 的全部欄位，另外還有：',
    statuses: '狀態碼',
    example: '範例',
    default: '預設 {value}',
    required: '必填',
    optional: '有時不出現',
    see: '取值見 {name}',
    more_items: '另 {n} 項',
    more_model: '欄位見 {model}',
    model: '物件',
    enum: '取值表',
    feedback_title: '意見回饋',
    feedback_text: '發現文件和介面對不上、想要新的介面，或者遇到了問題，歡迎告訴我們。',
    feedback_issue: '在 GitHub 開 issue',
    feedback_email: '寫信',
  },

  common: {
    params: {
      page: '頁碼，從 1 開始。',
      per_page: '每頁筆數。超出範圍回傳 422。',
      include_pending: '也列出審核中的內容（已上線、等待審核）。',
      direction: '排列方向：`asc` 從小到大，`desc` 從大到小。',
    },
    fields: {
      pagination: '分頁資訊，見 [Pagination](#object-pagination)。',
      slug: '網址別名，只用於顯示，不能用來查詢。',
      release_date_precision: '日期的精度。只知道年份或月份時，日期記為當年或當月的 1 號，請依精度顯示。',
      is_favorited: '目前的使用者是否收藏了它。只在網站登入時有意義，其他請求一律為 `false`。',
      is_pending: '是否審核中：提交後已經上線，正在等待審核。',
      titles: '原名以外的其他名稱：官方譯名、翻譯、讀音、別名等，見 [Title](#object-title)。',
      links: '外部連結，已依順序排好，見 [Link](#object-link)。',
      share_card_url: '分享卡片（1200×630 的 JPEG）的網址；還沒產生時為 `null`。',
      version: '目前的版本號，每次修改後加一。',
      pending_revision: '等待審核的那次提交。只有提交者和審核者看得到，其他人一律為 `null`。',
      created_at: '建立時間（UTC）。',
      updated_at: '最後更新時間（UTC）。瀏覽數之類的統計變化也會更新它。',
    },
  },

  sections: {
    'overview': {
      title: '概覽',
      lead: '開放介面讓其他網站和應用程式讀取 CDCat 的音樂資料。介面唯讀，不需要註冊或金鑰。',
    },
    'usage': {
      title: '使用規則',
      lead: '資料可以自由再利用，只要標示出處並遵守授權條款。也請控制請求頻率，不要給伺服器增加負擔。',
    },
    'conventions': {
      title: '通用約定',
      lead: '每個介面都遵守的規則：回應格式、分頁、參數寫法、名稱和日期，以及審核中和被合併的內容。',
    },
    'rate-limits': {
      title: '速率限制',
      lead: '不需要登入的讀取介面共用一個速率限制，搜尋另有自己的限制。',
    },
    'errors': {
      title: '錯誤',
      lead: '出錯時，HTTP 狀態碼說明是哪一類問題。`error.name` 是穩定的錯誤名稱，請用它來判斷。',
    },
    'albums': {
      title: '專輯與曲目',
      short: '專輯與曲目',
      lead: '專輯是收錄曲目的發行單位。限定盤和通常盤是同一張專輯的不同版本（Product）；黑膠等曲目表不同的發行另建一張專輯。列表回傳精簡的 AlbumSimple，詳情還附帶碟片、曲目、製作人員、版本和圖片。',
    },
    'lyrics': {
      title: '歌詞',
      lead: '歌詞掛在曲目上：每個曲目最多一份原文，另外可以有翻譯和音譯。歌詞歸權利人所有，不適用 CC BY-SA，只能作為資料參考和辨識之用。',
    },
    'artists': {
      title: '藝術家',
      lead: '藝術家包括個人、團體、同人社團、公司、虛擬歌手和角色。唱片公司、廠牌和發行商也是藝術家（類型 `company`），沒有另外的廠牌。',
    },
    'events': {
      title: '活動',
      lead: '活動系列（如 M3、Comic Market）底下是每一屆活動。會場圖和攤位來自主辦單位公開的資料，依原樣保存。',
    },
    'entries': {
      title: '條目',
      lead: '條目是專輯關聯的原作，例如動畫、遊戲、電影和書籍。專輯透過條目歸入系列。',
    },
    'franchises': {
      title: '系列',
      lead: '系列把相關的條目組織在一起，最多兩層：系列和子系列。它和活動系列（`/event-series`）是兩回事。',
    },
    'search': {
      title: '搜尋',
      lead: '一次搜尋專輯、曲目、藝術家、條目和系列。簡體、繁體和日文漢字，以及假名、全形和半形，都會先統一再比對。',
    },
    'dictionaries': {
      title: '字典與取值表',
      short: '字典與取值表',
      lead: '介面裡的取值都是固定的英文小寫。完整、最新的列表以 `/catalog/schema` 為準，這裡說明各個值的意思。',
    },
    'objects': {
      title: '常用物件',
      lead: '在很多介面裡都會出現的物件。',
    },
    'changes': {
      title: '更新紀錄',
      lead: '對呼叫端有影響的變化，最新的在前。正式上線前介面還在測試階段，欄位可能調整。',
    },
  },

  prose: {
    'overview': md`
      ### 基礎網址

      所有介面都在這個網址底下，本頁寫的路徑都省略了它：

      \`\`\`
      {{base}}
      \`\`\`

      請求用 \`GET\`，回傳 JSON。例如讀取一張專輯：

      \`\`\`
      GET {{base}}/albums/1287
      \`\`\`

      ### 這份文件包括什麼

      - 專輯與曲目、歌詞、藝術家、活動、條目、系列和搜尋，以及取值表。
      - 介面還在測試階段：正式上線前欄位可能調整。變更後不再另行通知，以最新版本的文件為準。
      - 提交和修改資料的介面文件目前還沒完成。

      ### 不需要金鑰

      這些介面都不需要登入，也沒有 API 金鑰。其他網站的網頁可以直接跨來源呼叫：CORS 允許任何來源，請求不帶 Cookie。
    `,
    'usage': md`
      ### 不在授權範圍內的內容

      歌詞、封面和其他圖片歸各自的權利人所有，只能作為資料參考和辨識之用，CC BY-SA 不適用於它們。評價、討論和文章歸作者所有，不屬於資料庫資料，這份文件也不介紹它們的介面。

      ### 請求禮儀

      - 控制頻率，不要同時送出大量請求。具體的上限見[速率限制](#rate-limits)。
      - 在 \`User-Agent\` 裡寫明你的應用程式名稱和聯絡方式，例如 \`MyLyricsApp/1.2 (https://example.com; me@example.com)\`，出了問題我們才找得到你。
      - 能快取的就快取，同一份資料不需要每次都重新請求。
      - API 網域的 robots.txt 是為了不讓搜尋引擎收錄介面。依本文件呼叫介面，不受它限制。

      其他要求見服務條款的[合理使用服務](/terms#acceptable-use)。

      ### 意見回饋

      發現文件和介面對不上、想要新的介面，或者遇到了問題，可以在 GitHub 上[開 issue]({{issues}})，或者寫信到 {{email}}。
    `,
    'conventions': md`
      ### 回應格式

      成功時 \`success\` 為 \`true\`，內容放在 \`data\` 裡；失敗時 \`success\` 為 \`false\`，原因放在 \`error\` 裡，見[錯誤](#errors)。

      \`\`\`json
      { "success": true, "data": { … } }
      \`\`\`

      ### 分頁

      列表介面用 \`page\`（從 1 開始）和 \`per_page\` 分頁，\`data\` 裡有列表本身和 [Pagination](#object-pagination)。每個介面的預設筆數和上限寫在它的參數裡，超出上限會回傳 422。

      ### 參數寫法

      - 布林值寫 \`true\` / \`false\`，也可以寫 \`1\` / \`0\`。
      - 陣列寫成 \`names[]=a&names[]=b\`。
      - 排序用 \`sort\`（依什麼排）和 \`direction\`（\`asc\` 遞增，\`desc\` 遞減）。專輯列表的 \`sort\` 是幾種固定的排法，沒有 \`direction\`。
      - 無法辨識的參數值回傳 422，不會悄悄換成預設值。文件裡沒寫的參數會被忽略。
      - ID 都是數字。\`slug\` 只用於顯示，不能用來查詢。

      ### 名稱與翻譯

      介面不會依語言回傳不同的內容。\`title\` 或 \`name\` 是原名，也就是包裝上印的名字；其他名稱在 \`titles\` 裡，見 [Title](#object-title)。要依讀者的語言顯示名稱，建議依序取：該語言的 \`official\`、該語言的 \`translation\`、原名。

      列表裡的專輯（AlbumSimple）沒有 \`titles\`，只能顯示原名；需要譯名時，請求專輯詳情。活動和活動系列的 \`description\` 是依語言分開的物件，例如 \`{ "ja": "…", "en": "…" }\`。

      ### 日期與時間

      - 日期寫成 \`YYYY-MM-DD\`。發行日期附帶 \`release_date_precision\`：只知道年份或月份時，精度是 \`year\` 或 \`month\`，日期記為當年或當月的 1 號。顯示時請依精度省略。
      - 時間是 UTC 的 ISO 8601，不帶小數秒，例如 \`2026-10-30T08:00:00Z\`。
      - 活動的 \`start_time\` 和 \`end_time\` 是會場當地的時間 \`HH:MM\`，不帶時區。

      ### 圖片

      圖片網址都是完整的 URL。專輯的圖片（[Image](#object-image)）同時提供原圖 \`url\`、長邊最多 300px 的 \`thumbnail_url\` 和最多 1200px 的 \`medium_url\`。請直接使用這些網址，不要自己組合。條目、系列和活動的圖片可能放在其他網站上。

      ### 審核中的內容

      成員新建的專輯、藝術家、條目和系列，提交後立即上線，同時等待審核，這時 \`is_pending\` 為 \`true\`。這四種內容的列表預設不包括它們，傳入 \`include_pending=true\` 才會列出；詳情和其他介面照常回傳。沒有通過審核的內容會被刪除，之後再請求會得到 404。

      ### 成人內容

      \`is_adult\` 只是標記，介面不會替你過濾。如果你的應用程式面向所有年齡層，請自行過濾。

      ### 合併與刪除

      重複的專輯、曲目和藝術家會被合併。請求被合併掉的 ID 時，\`/albums/{id}\`、\`/tracks/{id}\`、\`/artists/{id}\` 和 \`/artists/{id}/card\` 回傳 301：\`Location\` 指向保留下來的那一個，\`data.moved_to\` 寫明類型和新的 ID。

      \`\`\`json
      { "success": true, "data": { "moved_to": { "resource_type": "album", "id": 1290 } } }
      \`\`\`

      其他介面遇到被合併或刪除的 ID，回傳 404。

      ### 快取

      \`/catalog/schema\`、會場圖和攤位列表的回應帶有 \`ETag\`。下次請求時帶上 \`If-None-Match\`，內容沒變就回傳 304，不用再下載一次。
    `,
    'rate-limits': md`
      | 請求 | 每分鐘上限 | 依什麼計數 |
      |---|---|---|
      | 不帶登入權杖 | {{rate_limit}} 次 | IP 位址；IPv6 以 /64 網段算一個 |
      | 帶有效的登入權杖 | {{rate_limit_user}} 次 | 帳號 |
      | \`/search\` | 另有 {{search_limit}} 次 | 帳號或 IP，和上面分開計數 |

      每個回應都帶兩個標頭：\`X-RateLimit-Limit\` 是每分鐘的上限，\`X-RateLimit-Remaining\` 是這一分鐘還剩多少次。超過上限時回傳 429：

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

      \`details.retry_after\` 和回應標頭 \`Retry-After\` 都是需要等待的秒數，\`X-RateLimit-Reset\` 是可以重試的時間點（Unix 時間戳記）。收到 429 後，請等 \`Retry-After\` 秒再試，不要馬上重試。

      跨來源請求也能讀到這些標頭。上限以後可能調整，請依回應標頭判斷，不要寫死在程式碼裡。
    `,
    'errors': md`
      出錯時回傳的物件，欄位見 [Error](#object-error)：

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

      \`message\` 是英文，只用於除錯，以後可能改變。\`details\` 只在參數錯誤和超過速率限制時出現。

      | HTTP | \`error.name\` | 什麼時候 |
      |---|---|---|
      | 404 | \`RESOURCE_NOT_FOUND\` | 網址沒錯，但內容不存在或已被刪除 |
      | 404 | \`NOT_FOUND\` | 網址不對：路徑不存在，或者 ID 不是數字 |
      | 405 | \`METHOD_NOT_ALLOWED\` | 用了 \`GET\` 以外的請求方法 |
      | 422 | \`VALIDATION_FAILED\` | 參數不合法，\`details\` 依參數名稱列出原因 |
      | 429 | \`RATE_LIMIT_EXCEEDED\` | 請求太頻繁，見[速率限制](#rate-limits) |
      | 500 | \`INTERNAL_ERROR\` | 伺服器出錯。請稍後再試，持續出錯請告訴我們 |

      另外，被合併的專輯、曲目和藝術家回傳 301（見[合併與刪除](#合併與刪除)），帶有 \`ETag\` 的介面可能回傳 304。
    `,
  },

  statuses: {
    'VALIDATION_FAILED': '參數不合法，`details` 依參數名稱列出原因。',
    'RESOURCE_NOT_FOUND': '內容不存在或已被刪除。',
    'RATE_LIMIT_EXCEEDED': '請求太頻繁，等 `retry_after` 秒後再試。',
    '301': '這個 ID 已經合併到另一個，`Location` 和 `data.moved_to` 提供新的 ID。',
    '304': '帶了 `If-None-Match`，內容沒有變化。',
  },

  endpoints: {
    'get-albums': {
      title: '專輯列表',
      summary: '依條件篩選專輯，分頁回傳。審核中的專輯預設不在列表裡。',
      params: {
        'type': '專輯類型。',
        'category': '專輯類別，例如 `doujin`、`game`。',
        'format': '碟片媒介，例如 `cd`、`vinyl`。',
        'artist_id': '只列出這位藝術家參與的專輯，擔任什麼角色都算。',
        'release_event_id': '只列出在這一屆活動首發的專輯。',
        'year': '發行年份。',
        'attributes[key]': '依屬性篩選，最多 5 個，例如 `attributes[cover_character]=射命丸文`。指向條目等內容的屬性寫成 `entry:12`。只能篩選文字、網址、選項和參照類型的屬性。',
        'sort': '`new` 依發行日期從新到舊，`trending` 依最近 30 天的熱度，`top_rated` 依評分排名（每天更新一次）。',
        'search': '搜尋標題、其他名稱、品番、條碼和署名。去掉空格後至少 2 個字元，含漢字或假名時 1 個就夠，最多 3 個詞。沒傳 `sort` 時依相關度排序。',
      },
      fields: {
        albums: '這一頁的專輯。',
      },
      notes: md`
        ::: tip 列表裡沒有譯名
        AlbumSimple 沒有 \`titles\`，只能顯示原名。要依讀者的語言顯示譯名，請求[專輯詳情](#get-albums-id)。
        :::
      `,
    },
    'get-albums-id': {
      title: '專輯詳情',
      summary: '一張專輯的全部資料：碟片和曲目、製作人員、發行版本、特典、圖片、外部連結、關聯的條目和統計。',
      params: {
        id: '專輯 ID。',
      },
      notes: md`
        - 每次請求會記一次瀏覽（同一來源每天只記一次），\`views_count\` 每 5 分鐘更新。
        - 署名與發行（發行、廠牌、署名藝術家等）也在 \`credits\` 裡，\`category\` 為 \`release\`。
      `,
    },
    'get-tracks-id': {
      title: '曲目詳情',
      summary: '一個曲目，附帶它所在的專輯、同一張專輯的曲目表、原曲和改編自它的曲目。',
      params: {
        id: '曲目 ID。',
      },
    },
    'get-tracks-id-lyrics': {
      title: '曲目的歌詞',
      summary: '一個曲目的全部歌詞（原文、翻譯、音譯），只有概要，不含正文。依 ID 排序，不分頁。',
      params: {
        id: '曲目 ID。',
      },
      fields: {
        lyrics: '這個曲目的歌詞，見 [LyricSummary](#object-lyric-summary)。',
      },
    },
    'get-lyrics-id': {
      title: '歌詞',
      summary: '一份歌詞的正文和來源。',
      params: {
        id: '歌詞 ID。',
      },
      notes: md`
        ::: warning 歌詞的權利
        歌詞歸權利人所有，不適用 CC BY-SA，只能作為資料參考和辨識之用，見[使用規則](#usage)。
        :::
      `,
    },
    'get-artists': {
      title: '藝術家列表',
      summary: '依條件篩選藝術家，分頁回傳，新加入的在前。審核中的藝術家預設不在列表裡。',
      params: {
        type: '藝術家類型。',
        search: '依名稱、其他名稱和網址別名搜尋，包含即可。搜尋時依符合程度排序。',
        has_albums: '只列出有專輯的藝術家。',
      },
      fields: {
        artists: '這一頁的藝術家，不含詳情才有的欄位。',
      },
    },
    'get-artists-id': {
      title: '藝術家詳情',
      summary: '一位藝術家的資料，附帶其他名稱、外部連結、屬性和相關的藝術家。',
      params: {
        id: '藝術家 ID。',
      },
    },
    'get-artists-id-albums': {
      title: '藝術家發行的專輯',
      summary: '這位藝術家在整張專輯上擔任「署名與發行」角色（署名藝術家、發行、廠牌、經銷、製造、企劃）的專輯，依發行日期從新到舊。包括審核中的專輯。',
      params: {
        id: '藝術家 ID。',
      },
      fields: {
        albums: '這一頁的專輯。',
      },
    },
    'get-artists-id-tracks': {
      title: '藝術家參與的曲目',
      summary: '這位藝術家參與的專輯：曲目上的任何角色，以及整張專輯上「署名與發行」以外的角色。依專輯分組，列出整張專輯上的角色和參與的曲目。',
      params: {
        id: '藝術家 ID。',
        role: '只看這個角色，例如 `composer`。角色的 key 見 [/catalog/schema](#get-catalog-schema) 的 `credit_roles`。',
      },
      fields: {
        'albums': '這一頁的專輯，每張一組。分頁以專輯計算。',
        'albums.album': '專輯。',
        'albums.roles': '在整張專輯上擔任的角色。',
        'albums.roles.role': '角色的 key。',
        'albums.roles.credited_as': '署名，和藝術家名稱不同時才有。',
        'albums.roles.detail': '補充說明，例如具體的樂器。',
        'albums.tracks': '參與的曲目，依碟片和曲號排序。',
        'albums.tracks.id': '曲目 ID。',
        'albums.tracks.title': '曲名（原名）。',
        'albums.tracks.disc_position': '第幾張碟。',
        'albums.tracks.track_number': '曲號。',
        'albums.tracks.number_label': '顯示用的編號，例如黑膠的 `A1`。',
        'albums.tracks.roles': '在這個曲目上擔任的角色，格式同 `albums.roles`。',
        'roles': '每個角色參與過的專輯數，例如 `{ "composer": 4 }`。不受 `role` 參數影響。',
        'all': '參與過的專輯總數。',
      },
    },
    'get-artists-id-card': {
      title: '藝術家卡片',
      summary: '一位藝術家的簡要資料，適合做成懸停卡片：最多 4 個其他名稱，簡介擷取前 160 個字。',
      params: {
        id: '藝術家 ID。',
      },
      fields: {
        id: '藝術家 ID。',
        name: '名稱（原名）。',
        type: '藝術家類型。',
        image_url: '大頭貼。',
        is_active: '是否仍在活動；個人過世、團體解散後為 `false`。',
        bio: '簡介的開頭，最多 160 個字，原樣擷取，可能帶有 Markdown 標記。',
        albums_count: '參與的專輯數。',
        followers_count: '收藏這位藝術家的人數。',
      },
    },
    'get-artists-lookup': {
      title: '依名稱查詢藝術家',
      summary: '用名字精確查詢藝術家，一次最多 100 個，適合把製作人員表裡的名字對應到藝術家。比對前會統一全形半形、大小寫、假名和簡繁日漢字。',
      params: {
        'names[]': '要查詢的名字，每個最多 200 個字元。',
      },
      fields: {
        'matches': '依你傳入的名字分組的結果。',
        'matches.<name>': '和這個名字完全一致的藝術家，可能有好幾位同名的，也可能沒有（空陣列）。比對主名稱、官方譯名、翻譯、讀音和別名，不比對簡稱。',
        'matches.<name>.id': '藝術家 ID。',
        'matches.<name>.name': '名稱（原名）。',
        'matches.<name>.type': '藝術家類型。',
        'matches.<name>.image_url': '大頭貼。',
      },
    },
    'get-event-series': {
      title: '活動系列列表',
      summary: '全部活動系列，依名稱排序，不分頁。',
      fields: {
        event_series: '活動系列，附帶 `latest_start_date`。',
      },
    },
    'get-event-series-id': {
      title: '活動系列詳情',
      summary: '一個活動系列。系列底下的各屆活動用 [活動列表](#get-events) 的 `series_id` 分頁取得。',
      params: {
        id: '活動系列 ID。',
      },
    },
    'get-events': {
      title: '活動列表',
      summary: '依條件篩選各屆活動，分頁回傳，預設最近的在前。',
      params: {
        series_id: '只列出這個活動系列的活動。',
        search: '依名稱和網址別名搜尋：去掉空格後 2 到 100 個字元，最多 3 個詞，每個詞都要符合。',
        start_from: '開始日期不早於這一天（`YYYY-MM-DD`）。',
        start_to: '開始日期不晚於這一天（`YYYY-MM-DD`）。',
        sort: '`start_date` 依開始日期，`released_albums_count` 依首發專輯數。',
      },
      fields: {
        events: '這一頁的活動，不含詳情才有的欄位。',
      },
    },
    'get-events-id': {
      title: '活動詳情',
      summary: '一屆活動，比列表多出攤位數、有沒有會場圖和分享卡片。',
      params: {
        id: '活動 ID。',
      },
    },
    'get-events-id-map': {
      title: '會場圖',
      summary: '一屆活動的會場平面圖：展館、每張桌子的位置和背景的形狀，由主辦單位的平面圖轉換而來。',
      params: {
        id: '活動 ID。',
      },
      statuses: {
        RESOURCE_NOT_FOUND: '活動不存在，或者這一屆還沒有會場圖（先看活動詳情的 `has_map`）。',
      },
      notes: md`
        資料量比較大，回應帶有 \`ETag\` 和 \`Cache-Control: public, max-age=60\`，重複請求時請帶上 \`If-None-Match\`。座標的單位是平面圖 PDF 的 pt，y 軸向下。
      `,
    },
    'get-events-id-booths': {
      title: '攤位',
      summary: '一屆活動的全部攤位，依主辦單位列表的順序，一次全部回傳。攤位依主辦單位的資料原樣保存，一個攤位可以關聯零到多位藝術家。',
      params: {
        id: '活動 ID。',
      },
      fields: {
        booths: '全部攤位；還沒有匯入時為空陣列。',
      },
      notes: md`
        和會場圖一樣帶有 \`ETag\` 和 \`Cache-Control: public, max-age=60\`。攤位裡的文字和 cut 圖來自主辦單位，\`is_adult\` 只是標記。
      `,
    },
    'get-entries': {
      title: '條目列表',
      summary: '依條件篩選條目，分頁回傳。審核中的條目預設不在列表裡。',
      params: {
        type: '條目類型。',
        format: '子類型，可用的值隨類型不同，見 [entry_type](#enum-entry-type)。',
        platform: '遊戲平台，完全一致才算，例如 `Switch`。',
        franchise_id: '只列出屬於這個系列（包括它的子系列）的條目。',
        year: '發行年份。',
        search: '依名稱、其他名稱（包括別名、簡稱）和網址別名搜尋。沒傳 `sort` 時依相關度排序。',
        sort: '排序依據。',
      },
      fields: {
        entries: '這一頁的條目，不含詳情才有的欄位。',
      },
    },
    'get-entries-id': {
      title: '條目詳情',
      summary: '一個條目，附帶外部連結、關聯的專輯、所屬的系列和相關的條目。',
      params: {
        id: '條目 ID。',
      },
    },
    'get-franchises': {
      title: '系列列表',
      summary: '依條件篩選系列，分頁回傳。預設只列頂層系列；搜尋時包括子系列。審核中的系列預設不在列表裡。',
      params: {
        search: '依名稱、其他名稱和網址別名搜尋。沒傳 `sort` 時依相關度排序。',
        parent_id: '只列出這個系列的子系列。',
        top_level: '`true` 只列頂層系列，`false` 列出全部。沒有 `search` 時預設 `true`，有 `search` 時預設 `false`；傳了 `parent_id` 時不起作用。',
        sort: '排序依據。條目數和專輯數包括子系列。',
      },
      fields: {
        franchises: '這一頁的系列，不含詳情才有的欄位。',
      },
    },
    'get-franchises-id': {
      title: '系列詳情',
      summary: '一個系列，附帶它的子系列（以及子系列的條目）、直接屬於它的條目，和屬於整個系列的專輯。',
      params: {
        id: '系列 ID。',
      },
    },
    'get-franchises-id-albums': {
      title: '系列的專輯',
      summary: '系列和它的子系列底下的全部專輯：經由條目關聯的專輯，加上屬於整個系列的專輯，去除重複後分頁，依發行日期排序。',
      params: {
        id: '系列 ID。',
        entry_id: '只看關聯到這個條目的專輯。',
        relation_type: '只看和系列裡的條目是這種關係的專輯，例如 `ost`。傳了它就不包括屬於整個系列的專輯。',
        sort: '只能依發行日期。',
      },
      fields: {
        'albums': '這一頁的專輯。',
        'albums.entries': '這張專輯關聯的、屬於這個系列的條目；屬於整個系列的專輯為空陣列。',
        'albums.entries.id': '條目 ID。',
        'albums.entries.name': '條目名稱（原名）。',
        'albums.entries.type': '條目類型。',
        'albums.entries.relation_type': '專輯和條目的關係。',
      },
    },
    'get-search': {
      title: '搜尋',
      summary: '在專輯、曲目、藝術家、條目和系列裡搜尋。不傳 `type` 時每類回傳前幾筆；傳了 `type` 就只搜這一類，分頁回傳。',
      params: {
        q: '搜尋詞。去掉空格後至少 2 個字元，含漢字、假名或諺文時 1 個就夠，最多 3 個詞，每個詞都要符合。',
        type: '只搜這一類，結果分頁。',
        include_pending: '也搜尋審核中的內容。搜尋預設包括它們，同分時排在已審核的後面。',
        limit: '不傳 `type` 時，每類最多回傳幾筆。',
      },
      fields: {
        'query': '實際用來搜尋的詞。',
        'query.phrase': '整理後的搜尋詞。',
        'query.terms': '拆出來的詞，最多 3 個。',
        'groups': '不傳 `type` 時回傳：每類一組，順序固定（專輯、曲目、藝術家、條目、系列），沒有結果的類型也在。',
        'groups.type': '這一組的類型。',
        'groups.total': '這一類的結果數，最多數到 1000。',
        'groups.total_is_capped': '結果超過 1000 筆時為 `true`。',
        'groups.items': '這一類的前幾筆結果。',
        'results': '傳了 `type` 時回傳：這一頁的結果。',
        'total_is_capped': '傳了 `type` 時回傳：結果超過 1000 筆時為 `true`，`pagination.total` 最多 1000。',
      },
      notes: md`
        搜尋有自己的速率限制，每分鐘 {{search_limit}} 次，見[速率限制](#rate-limits)。3 個以上拉丁字母的詞允許少量拼字錯誤；品番要完全一致。
      `,
    },
    'get-catalog-schema': {
      title: '目錄字典',
      summary: '介面用到的全部取值表，以及後台維護的製作人員角色、屬性定義和連結提供者，附帶四種語言的名稱。',
      fields: {
        'enums': '取值表，鍵是名稱（如 `album_type`），值是全部取值。',
        'credit_roles': '製作人員的角色，`credits[].role` 是這裡的 `key`。',
        'credit_roles.key': '角色的 key，例如 `composer`。',
        'credit_roles.category': '角色的分類。',
        'credit_roles.names': '各語言的名稱，例如 `{ "ja": "作曲", "en": "Composer" }`。',
        'credit_roles.aliases': '外站的常見寫法，可以用來把其他網站的人員表對應過來。',
        'credit_roles.is_album_role': '能不能用於整張專輯。',
        'credit_roles.is_track_role': '能不能用於單一曲目。',
        'attribute_definitions': '屬性的定義：專輯、曲目、圖片和藝術家可以附帶的額外資訊，例如「封面角色」。',
        'attribute_definitions.key': '屬性的 key，也就是 Attribute 的 `key`。',
        'attribute_definitions.names': '各語言的名稱。',
        'attribute_definitions.description': '各語言的填寫說明。',
        'attribute_definitions.group': '分組，例如「東方 Project」。',
        'attribute_definitions.value_type': '值的類型。',
        'attribute_definitions.choices': '`choice` 類型的可選值。',
        'attribute_definitions.reference_types': '`reference` 類型能指向哪些內容，例如 `entry`。',
        'attribute_definitions.applies_to': '能掛在哪些物件上：`album`、`track`、`album_image`、`artist`。',
        'attribute_definitions.is_multiple': '能不能填多個值。',
        'link_providers': '連結提供者，和 [連結提供者列表](#get-link-providers) 相同。',
        'aggregates': '編輯器用的資料結構說明，讀取資料用不到。',
        'limits': '上傳圖片的限制，讀取資料用不到。',
      },
    },
    'get-link-providers': {
      title: '連結提供者',
      summary: '外部連結的全部提供者（官網、社群網站、串流、商店、資料庫等），依顯示順序，不分頁。',
      fields: {
        link_providers: '連結提供者。',
      },
    },
  },

  models: {
    AlbumSimple: {
      title: '專輯（精簡）',
      description: '列表、搜尋、藝術家和條目頁面裡用的精簡專輯。沒有 `titles`，只能顯示原名。',
      fields: {
        id: '專輯 ID。網頁網址是 `{{site}}/albums/{id}`。',
        title: '原名，也就是包裝上印的名字。',
        type: '專輯類型。',
        categories: '專輯類別，可以有好幾個；空陣列表示作曲家作品集，不屬於任何作品企劃。',
        release_date: '發行日期。',
        catalog_number: '品番，取第一個有品番的版本；可以是範圍，例如 `KECH-8059~62`。',
        image_url: '封面，長邊最多 1200px。',
        disc_count: '碟數：第一個版本裡的碟片，不含特典碟。',
        track_count: '這些碟片上的曲目數。',
        duration: '這些曲目的總長度（秒），不知道長度的曲目不算。',
        disc_formats: '這些碟片的媒介，去除重複。',
        is_adult: '成人向標記。',
        favorites_count: '收藏數。',
        reviews_count: '評價數。',
        views_count: '瀏覽數，每 5 分鐘更新一次。',
        byline: '標題下面那一行署名：有發行方時是全部發行方，否則是署名藝術家；都沒有時為 `null`。',
      },
    },
    Album: {
      title: '專輯',
      description: '專輯詳情。',
      fields: {
        'description': '簡介。',
        'banner_url': '專輯頁的橫幅圖。',
        'release_event': '首發活動。',
        'release_event.id': '活動 ID。',
        'release_event.name': '活動名稱。',
        'release_event.slug': '活動的網址別名。',
        'release_event.main_visual_url': '活動的主視覺。',
        'release_event.start_date': '活動開始的日期。',
        'cover': '封面圖片，有原圖和兩種縮圖的網址。',
        'discs': '碟片，依順序排列，每張附帶它的曲目。',
        'tracklist_languages': '曲目表有哪些語言的名稱，以及每種語言有名稱的曲目數。',
        'tracklist_languages.locale': '語言（BCP 47）。',
        'tracklist_languages.kind': '名稱的種類：`official`、`translation` 或 `transliteration`。',
        'tracklist_languages.count': '這種語言有名稱的曲目數。',
        'tracklist_languages.total': '曲目總數。',
        'credits': '整張專輯的製作人員，包括「署名與發行」組（`category` 為 `release`）。',
        'products': '發行版本，例如初回限定盤和通常盤。',
        'bonuses': '特典，例如店鋪特典和會場特典。',
        'images': '專輯圖片：封面、背面、歌詞本、碟面等。',
        'attributes': '額外資訊，例如封面角色。',
        'streaming': '串流連結，和其他連結分開。',
        'entries': '關聯的條目（原作）。',
        'entries.id': '條目 ID。',
        'entries.name': '條目名稱（原名）。',
        'entries.type': '條目類型。',
        'entries.format': '條目的子類型。',
        'entries.image_url': '條目的圖片。',
        'entries.release_date': '條目的發行日期。',
        'entries.relation_type': '專輯和條目的關係，例如原聲、片頭曲。',
        'entries.note': '關係的補充說明。',
        'entries.franchises': '條目所屬的系列。',
        'entries.franchises.id': '系列 ID。',
        'entries.franchises.name': '系列名稱（原名）。',
        'entries.franchises.parent_id': '上層系列 ID，頂層系列為 `null`。',
        'franchises': '直接屬於整個系列的專輯才有，例如週年合輯。',
        'franchises.id': '系列 ID。',
        'franchises.name': '系列名稱（原名）。',
        'franchises.image_url': '系列的圖片。',
        'tracking_stats': '使用者標記的收聽狀態人數。',
        'tracking_stats.plan_to_listen': '想聽。',
        'tracking_stats.completed': '聽過。',
        'tracking_stats.wishlist': '想要。',
        'tracking_stats.owned': '已入手。',
        'tracking_stats.dropped': '不感興趣。',
        'rating': '平均評分，1 到 5，兩位小數；沒有人評分時為 `null`。',
        'rating_count': '評分人數。',
        'rating_distribution': '1 到 5 分各有多少人，沒有人評分時為 `null`。',
        'ranking': '評分排名，每天更新一次；還沒有人評分時為 `null`。',
        'articles': '介紹這張專輯的文章，最多 5 篇。',
        'articles.id': '文章 ID。',
        'articles.title': '文章標題。',
        'articles.cover_url': '文章的封面圖。',
        'articles.published_at': '發表時間（UTC）。',
        'contributors': '編輯過這張專輯的使用者，每天更新一次。',
        'contributors.username': '使用者名稱。',
        'contributors.nickname': '暱稱。',
        'contributors.avatar_url': '大頭貼。',
        'user_tracking': '目前的使用者標記的收聽狀態。只在網站登入時有意義，其他請求一律為 `null`。',
        'user_tracking.status': '狀態：`plan_to_listen`、`completed`、`wishlist`、`owned` 或 `dropped`。',
        'edited_at': '目前版本的修改時間（UTC）。和 `updated_at` 不同，瀏覽數之類的變化不影響它。',
      },
    },
    Disc: {
      title: '碟片',
      description: '專輯裡的一張碟：CD、BD、黑膠或配信等。',
      fields: {
        id: '碟片 ID。',
        position: '第幾張，從 1 開始。',
        title: '碟名，例如「DISC 2 Instrumental」；沒有時為 `null`。',
        format: '媒介。',
        bonus_id: '特典附帶的碟片才有，指向那個特典。',
        tracks: '這張碟上的曲目，依曲號排列。',
      },
    },
    AlbumTrack: {
      title: '專輯裡的曲目',
      description: '專輯詳情裡的曲目，附帶它自己的製作人員和原曲。',
      fields: {
        id: '曲目 ID。',
        disc_number: '第幾張碟。',
        track_number: '曲號，在同一張碟裡唯一。',
        number_label: '顯示用的編號，和曲號不同時才有，例如黑膠的 `A1`。',
        title: '曲名，也就是包裝上印的名字。',
        duration: '長度（秒），不知道時為 `null`。',
        is_instrumental: '是否為純音樂。',
        isrc: '國際標準錄音錄影資料代碼。',
        favorites_count: '收藏數。',
        has_lyrics: '是否有原文歌詞。',
        lyrics_count: '歌詞的份數，包括翻譯。',
        translations_count: '其中翻譯的份數。',
        originals: '原曲：這個曲目改編、翻唱或混音自哪首曲子。',
        credits: '這個曲目的製作人員。',
        attributes: '額外資訊，例如 BPM。',
      },
    },
    Track: {
      title: '曲目',
      description: '曲目詳情。',
      fields: {
        'id': '曲目 ID。',
        'album_id': '所在專輯的 ID。',
        'disc_id': '所在碟片的 ID。',
        'disc_number': '第幾張碟。',
        'track_number': '曲號。',
        'number_label': '顯示用的編號，例如黑膠的 `A1`。',
        'title': '曲名（原名）。',
        'duration': '長度（秒），不知道時為 `null`。',
        'is_instrumental': '是否為純音樂。',
        'isrc': '國際標準錄音錄影資料代碼。',
        'has_lyrics': '是否有原文歌詞。',
        'lyrics_count': '歌詞的份數，包括翻譯。',
        'translations_count': '其中翻譯的份數。',
        'favorites_count': '收藏數。',
        'originals': '原曲。',
        'derived_tracks': '把這個曲目當作原曲的曲目，例如它的改編和翻唱。',
        'derived_tracks.id': '曲目 ID。',
        'derived_tracks.title': '曲名（原名）。',
        'derived_tracks.album': '那個曲目所在的專輯。',
        'album': '所在的專輯。',
        'album_tracks': '同一張專輯的全部曲目，依碟片和曲號排序，方便做上一首、下一首。',
        'album_tracks.id': '曲目 ID。',
        'album_tracks.disc_number': '第幾張碟。',
        'album_tracks.track_number': '曲號。',
        'album_tracks.number_label': '顯示用的編號。',
        'album_tracks.title': '曲名（原名）。',
        'album_tracks.duration': '長度（秒）。',
        'album_tracks.has_lyrics': '是否有原文歌詞。',
        'credits': '這個曲目的製作人員。',
        'credits.id': 'ID。',
        'credits.role': '角色的 key，名稱見 `/catalog/schema` 的 `credit_roles`。',
        'credits.detail': '補充說明，例如具體的樂器或角色名稱。',
        'credits.credited_as': '署名，和藝術家名稱不同時才有。',
        'credits.artist': '藝術家；只知道署名、還沒有對應的藝術家時為 `null`。',
        'credits.artist.id': '藝術家 ID。',
        'credits.artist.name': '藝術家名稱（原名）。',
        'attributes': '額外資訊。',
      },
    },
    Credit: {
      title: '製作人員',
      description: '某位藝術家在專輯或曲目上的一個角色。同一個人擔任幾個角色就有幾筆。',
      fields: {
        'id': 'ID。',
        'role': '角色的 key，例如 `composer`；名稱見 `/catalog/schema` 的 `credit_roles`。「署名與發行」組的 6 個角色見 [release_role](#enum-release-role)。',
        'category': '角色的分類。',
        'artist': '藝術家；只知道署名、還沒有對應的藝術家時為 `null`。',
        'artist.id': '藝術家 ID。',
        'artist.name': '藝術家名稱（原名）。',
        'artist.image_url': '大頭貼。',
        'artist.type': '藝術家類型。',
        'credited_as': '署名，也就是專輯上印的名字；和藝術家名稱不同時才有。',
        'detail': '補充說明，例如具體的樂器或配音的角色。',
      },
    },
    Product: {
      title: '發行版本',
      description: '買得到的一個版本，例如初回限定盤、通常盤、配信版，各自勾選包含哪些碟片。',
      fields: {
        id: '版本 ID。',
        name: '版本名稱，例如「初回限定盤」。',
        edition_type: '通常版還是限定版。',
        limited_rule: '限定的方式，只有限定版才有。',
        limited_name: '限定版的名稱。',
        medium: '實體還是數位版。',
        catalog_number: '品番。',
        barcode: '條碼（JAN / EAN / UPC）。',
        release_date: '這個版本的發行日期；為 `null` 時和專輯相同。',
        region: '發行地區，ISO 3166-1 的兩位代碼，例如 `JP`。',
        price: '定價，寫成字串，例如 `"3300.00"`。',
        currency: '貨幣，ISO 4217 代碼，例如 `JPY`。',
        is_hires: '是否為高解析度音源。',
        is_available: '是否仍在販售。',
        sort_order: '顯示順序。',
        disc_ids: '這個版本包含的碟片 ID。',
        format_label: '顯示用的規格，例如 `2CD+BD`，配信版是 `DL`。',
      },
    },
    Bonus: {
      title: '特典',
      description: '店鋪特典、會場特典、初回特典等。特典 CD 是 `bonus_id` 指向這個特典的碟片。',
      fields: {
        'id': '特典 ID。',
        'name': '特典名稱。',
        'type': '特典的類型。',
        'description': '說明。',
        'is_digital': '是否為數位特典。',
        'shop': '店鋪名稱，例如「とらのあな」。',
        'availability': '取得方式。',
        'note': '條件，例如「購入者全員」「抽選」。',
        'sort_order': '顯示順序。',
        'event': '會場特典對應的活動。',
        'event.id': '活動 ID。',
        'event.name': '活動名稱。',
        'event.slug': '活動的網址別名。',
        'product_ids': '隨哪些版本附贈；空陣列表示所有版本都有。',
        'disc_ids': '這個特典附帶的碟片。',
      },
    },
    AlbumImage: {
      title: '專輯圖片',
      description: '一張圖片在專輯裡的用途：封面、背面、歌詞本的某一頁等。',
      fields: {
        id: 'ID。',
        kind: '圖片的類別。',
        label: '補充說明，例如歌詞本的頁碼「p. 01-02」。',
        caption: '圖片說明。',
        product_id: '只屬於某個版本時才有。',
        bonus_id: '只屬於某個特典時才有。',
        disc_id: '只屬於某張碟時才有。',
        sort_order: '顯示順序。',
        image: '圖片檔案。',
        attributes: '額外資訊，例如封面角色。',
      },
    },
    Original: {
      title: '原曲',
      description: '曲目改編、翻唱或混音自哪首曲子：資料庫裡的另一個曲目，或者只有一段文字。',
      fields: {
        'title': '原曲的曲名。指向資料庫裡的曲目時是那個曲目的曲名。',
        'track': '原曲是資料庫裡的曲目時才有，否則為 `null`。',
        'track.id': '原曲的曲目 ID。',
        'track.album': '原曲所在的專輯。',
        'track.album.id': '專輯 ID。',
        'track.album.title': '專輯名稱（原名）。',
      },
    },
    LyricSummary: {
      title: '歌詞（概要）',
      description: '一份歌詞的概要，不含正文。',
      fields: {
        'id': '歌詞 ID。',
        'track_id': '曲目 ID。',
        'kind': '原文、翻譯還是音譯。',
        'language': '語言（BCP 47），例如 `ja`、`zh-Hans`、`ja-Latn`。',
        'translation_of_id': '翻譯和音譯才有：對應的原文歌詞 ID，可以逐行對照。',
        'format': '正文的格式。',
        'translator': '譯者的署名。',
        'is_ai_generated': '是否為機器翻譯。',
        'creator': '最早提交這份歌詞的使用者；帳號刪除後為 `null`。',
        'creator.id': '使用者 ID。',
        'creator.username': '使用者名稱。',
        'creator.nickname': '暱稱。',
        'creator.avatar_url': '大頭貼。',
      },
    },
    Lyric: {
      title: '歌詞',
      description: '一份完整的歌詞。',
      fields: {
        'content': '正文。格式為 `lrc` 和 `srt` 時附帶時間軸。',
        'source': '來源，例如「歌詞カード」。',
        'track': '所在的曲目。',
        'track.id': '曲目 ID。',
        'track.title': '曲名（原名）。',
        'track.track_number': '曲號。',
        'track.disc_number': '第幾張碟。',
        'track.album': '所在的專輯。',
      },
    },
    Artist: {
      title: '藝術家',
      description: '列表和詳情都用這個物件。標著「有時不出現」的欄位只在詳情裡回傳。',
      fields: {
        'id': '藝術家 ID。網頁網址是 `{{site}}/artists/{id}`。',
        'name': '主名稱，一般是原名。',
        'type': '藝術家類型。',
        'is_active': '是否仍在活動；個人過世、團體解散後為 `false`。',
        'bio': '簡介，Markdown。',
        'image_url': '大頭貼。',
        'followers_count': '收藏這位藝術家的人數。',
        'albums_count': '參與的專輯數，擔任什麼角色都算。',
        'releases_count': '「發行的專輯」的數量，見[藝術家發行的專輯](#get-artists-id-albums)。',
        'credited_albums_count': '「參與的專輯」的數量，見[藝術家參與的曲目](#get-artists-id-tracks)。',
        'catalog_prefixes': '品番前綴，例如 `["LACA"]`；公司和兼做廠牌的社團才有。',
        'shouts_count': '藝術家頁上的留言數。',
        'attributes': '額外資訊。',
        'relations': '相關的藝術家，從這位藝術家的角度描述。',
        'relations.artist': '對方。',
        'relations.artist.id': '藝術家 ID。',
        'relations.artist.name': '名稱（原名）。',
        'relations.artist.image_url': '大頭貼。',
        'relations.artist.type': '藝術家類型。',
        'relations.relation_type': '關係，例如 `has_member` 表示對方是這個團體的成員。',
        'relations.note': '補充說明。',
      },
    },
    EventSeries: {
      title: '活動系列',
      description: '例如 M3、Comic Market。',
      fields: {
        id: '活動系列 ID。網頁網址是 `{{site}}/event-series/{id}`。',
        name: '名稱。',
        slug: '網址別名。',
        location: '舉辦的城市或地區。',
        description: '介紹，依語言分開的物件，例如 `{ "ja": "…", "en": "…" }`；不一定每種語言都有。',
        website: '官網。',
        banner_url: '橫幅圖。',
        visual_orientation: '各屆主視覺的方向：直式（場刊封面）或橫式。',
        events_count: '有多少屆。',
        latest_start_date: '最近一屆的開始日期。只在列表裡有。',
      },
    },
    Event: {
      title: '活動',
      description: '一屆活動。標著「有時不出現」的欄位只在詳情裡回傳。',
      fields: {
        'id': '活動 ID。網頁網址是 `{{site}}/events/{id}`。',
        'event_series_id': '所屬的活動系列；獨立舉辦的活動為 `null`。',
        'series': '所屬的活動系列。',
        'series.id': '活動系列 ID。',
        'series.name': '名稱。',
        'series.slug': '網址別名。',
        'series.website': '官網。',
        'series.visual_orientation': '主視覺的方向。',
        'name': '名稱，例如「M3-2026秋」。',
        'slug': '網址別名。',
        'start_date': '開始日期。',
        'end_date': '結束日期；只有一天時為 `null`。',
        'start_time': '開場時間 `HH:MM`，會場當地時間。',
        'end_time': '結束時間 `HH:MM`。',
        'venue': '會場。',
        'location': '城市或地區。',
        'website_url': '這一屆自己的網站；系列的官網在 `series.website`。',
        'description': '介紹，依語言分開的物件。',
        'main_visual_url': '主視覺或場刊封面。',
        'main_visual_width': '主視覺的寬（像素）。',
        'main_visual_height': '主視覺的高（像素）。',
        'key_visuals': '其他視覺圖，格式還沒有確定，請不要依賴它。',
        'meta': '匯入時寫入的額外資訊，例如攤位類別代碼的名稱；格式可能改變。',
        'albums_count': '後台手動填寫的發布專輯數，不會自動更新；請用 `released_albums_count`。',
        'artists_count': '後台手動填寫的參展社團數，不會自動更新。',
        'released_albums_count': '在這一屆首發的專輯數，即時統計，包括審核中的專輯。',
        'booths_count': '攤位數，包括場外參加的。',
        'has_map': '是否有會場圖。',
      },
    },
    EventMap: {
      title: '會場圖',
      description: '一屆活動的平面圖。座標的單位是平面圖 PDF 的 pt，原點在左上角，y 軸向下。',
      fields: {
        'width': '整張圖的寬。',
        'height': '整張圖的高。',
        'background': '牆、柱子、區域等背景形狀，依繪製順序排列。',
        'background.d': 'SVG 的 path 資料。',
        'background.s': '明度，0 是牆，1 是地面。',
        'background.e': '為 `1` 時使用 even-odd 填色規則。',
        'background.w': '描邊寬度；沒有時只填色。',
        'labels': '會場裡的文字和區塊字母。',
        'labels.text': '文字。',
        'labels.x': '位置的 x。',
        'labels.y': '位置的 y。',
        'labels.size': '字級。',
        'labels.rotate': '旋轉角度（度）。',
        'labels.vertical': '是否直排。',
        'labels.kind': '為 `area` 時是區塊字母（A、あ……）。',
        'halls': '展館和樓層，依順序排列。',
        'halls.id': '展館 ID，也就是 `spaces` 裡的 `hall_id`。',
        'halls.building': '建築，例如「第一展示場」。',
        'halls.floor': '樓層，例如 `2F`。',
        'halls.name': '顯示用的名稱。',
        'halls.bbox': '展館在圖上的範圍 `[x, y, w, h]`。',
        'spaces': '一張桌子一項，寫成陣列 `[id, hall_id, area, number, x, y, w, h]`。攤位的 `space_id` 指向這裡的 `id`。',
        'genres': '攤位類別代碼的名稱，例如 `{ "201": { "label": "オリジナル", "group": "music" } }`。',
      },
    },
    EventBooth: {
      title: '攤位',
      description: '主辦單位列表裡的一筆參展資訊，依原樣保存：一個攤位可能是幾個社團合辦，名字裡也可能帶著讀音或說明。',
      fields: {
        'id': '攤位 ID。',
        'space_id': '所在的桌子，也就是會場圖 `spaces` 裡的 `id`；場外參加的攤位為 `null`。',
        'space_code': '攤位號，例如 `A-01a`。',
        'area': '區塊，例如 `A`。',
        'sub': '占桌子的哪一部分：`a`、`b` 是半張，`ab` 是整張，`x`、`y`、`z` 是迷你攤位的三分之一。',
        'name': '攤位名稱，依主辦單位的原樣。',
        'name_kana': '名稱的讀音。',
        'description': '主辦單位列表裡的說明。',
        'genre': '類別代碼，名稱見會場圖的 `genres`。',
        'keywords': '關鍵字。',
        'links': '主辦單位列表裡的連結。',
        'links.type': '連結的種類，例如 `website`。',
        'links.url': '網址。',
        'twitter_handle': 'X（Twitter）帳號，小寫，不帶 @。',
        'image_url': 'cut 圖，已經保存到本站。',
        'embeds': '嵌入的影片。',
        'embeds.type': '目前只有 `youtube`。',
        'embeds.id': '影片 ID。',
        'is_adult': '成人向標記，介面不過濾。',
        'artists': '關聯的藝術家，可以有好幾位，也可以沒有。',
        'artists.id': '藝術家 ID。',
        'artists.name': '名稱（原名）。',
        'artists.image_url': '大頭貼。',
        'album_ids': '這些藝術家在這一屆首發的專輯 ID。',
      },
    },
    Entry: {
      title: '條目',
      description: '列表和詳情都用這個物件。標著「有時不出現」的欄位只在詳情裡回傳。',
      fields: {
        'id': '條目 ID。網頁網址是 `{{site}}/entries/{id}`。',
        'name': '主名稱，一般是原名。',
        'type': '條目類型。',
        'format': '子類型，可用的值隨類型不同，見 [entry_type](#enum-entry-type)。',
        'platforms': '遊戲平台，例如 `["Switch", "PC"]`；不是遊戲時為空陣列。',
        'release_date': '發行或首播日期。',
        'description': '簡介，純文字。',
        'image_url': '圖片，可能放在其他網站上。',
        'banner_url': '橫幅圖。',
        'albums_count': '關聯的專輯數，包括審核中的。',
        'albums': '關聯的專輯，依發行日期排序。',
        'albums.relation_type': '專輯和條目的關係。',
        'albums.note': '關係的補充說明。',
        'franchises': '所屬的系列。',
        'franchises.id': '系列 ID。',
        'franchises.name': '系列名稱（原名）。',
        'franchises.image_url': '系列的圖片。',
        'franchises.parent': '上層系列；頂層系列為 `null`。',
        'franchises.parent.id': '上層系列 ID。',
        'franchises.parent.name': '上層系列名稱。',
        'related_entries': '相關的條目，從這個條目的角度描述：`sequel` 表示對方是它的續作。',
        'related_entries.id': '條目 ID。',
        'related_entries.name': '名稱（原名）。',
        'related_entries.type': '條目類型。',
        'related_entries.format': '子類型。',
        'related_entries.image_url': '圖片。',
        'related_entries.release_date': '發行日期。',
        'related_entries.relation_type': '關係。',
        'related_entries.note': '補充說明。',
        'sort_order': '只在系列詳情的條目裡有：在系列裡的順序。',
      },
    },
    Franchise: {
      title: '系列',
      description: '列表和詳情都用這個物件。標著「有時不出現」的欄位只在詳情裡回傳。統計都包括子系列。',
      fields: {
        'id': '系列 ID。網頁網址是 `{{site}}/franchises/{id}`。',
        'name': '主名稱，一般是原名。',
        'parent_id': '上層系列 ID；頂層系列為 `null`。',
        'description': '簡介，純文字。',
        'image_url': '圖片，可能放在其他網站上。',
        'banner_url': '橫幅圖。',
        'sort_order': '在上層系列裡的順序。',
        'entries_count': '條目數，包括子系列的，去除重複。',
        'albums_count': '專輯數：經由條目關聯的，加上屬於整個系列的，去除重複。',
        'children_count': '子系列數。',
        'parent': '上層系列；頂層系列為 `null`。`children` 裡的子系列沒有這個欄位。',
        'parent.id': '上層系列 ID。',
        'parent.name': '上層系列名稱。',
        'children': '子系列，附帶各自的統計、其他名稱和條目，沒有外部連結。',
        'entries': '直接屬於這個系列的條目，依順序和發行日期排列，附帶 `sort_order`。',
        'albums': '屬於整個系列的專輯，例如週年合輯。',
        'albums.sort_order': '在系列裡的順序。',
      },
    },
    SearchResult: {
      title: '搜尋結果',
      description: '一筆搜尋結果，五種類型共用。',
      fields: {
        'type': '結果的類型。',
        'id': '這筆結果本身的 ID。',
        'title': '原名。',
        'image_url': '圖片。',
        'meta': '副標題用的資訊，依類型不同：專輯有 `artist_credit`、`catalog_number`、`release_date`、`release_date_precision`、`album_type`、`disc_formats`；曲目有 `album_id`、`album_title`、`disc_number`、`track_number`、`duration`；藝術家有 `artist_type`；條目有 `entry_type`、`release_date`；系列有 `parent`（`{ id, name }` 或 `null`）。',
        'album': '專輯和曲目的結果才有：專輯或曲目所在的專輯。',
        'matched': '符合的是哪個名稱；符合的是原名時為 `null`。',
        'matched.field': '符合的欄位。',
        'matched.text': '符合的文字。',
        'matched.locale': '這個名稱的語言。',
      },
    },
    LinkProvider: {
      title: '連結提供者',
      description: '外部連結來自的網站，例如官網、X、VGMdb。',
      fields: {
        id: '提供者 ID。',
        name: '識別碼，例如 `x`、`vgmdb`，不是顯示名稱。',
        icon_url: '圖示。',
        url_pattern: '網址的萬用字元範本，例如 `https://x.com/*`，可以用來辨識使用者貼上的連結；沒有時為 `null`。',
        category: '分類。',
      },
    },
    Title: {
      title: '其他名稱',
      description: '原名以外的名稱。`official`、`translation`、`transliteration` 每種語言最多一個，別名和簡稱不限。',
      fields: {
        title: '名稱。',
        locale: '語言（BCP 47），例如 `ja`、`zh-Hans`、`en`；羅馬字是 `ja-Latn`，假名讀音是 `ja-Hrkt`。別名和簡稱可能為 `null`。',
        kind: '名稱的種類。',
      },
    },
    Link: {
      title: '外部連結',
      description: '指向其他網站的連結，例如官網、社群帳號、串流和資料庫。',
      fields: {
        'id': '連結 ID。',
        'url': '網址。',
        'external_id': '在那個網站上的 ID，例如 Bangumi 的 `subject/12345`；對不上時為 `null`。',
        'is_verified': '是否已經查證。',
        'provider': '連結提供者；提供者被刪除時為 `null`。',
        'provider.id': '提供者 ID。',
        'provider.name': '識別碼，例如 `x`。',
        'provider.icon_url': '圖示。',
        'provider.category': '分類。',
      },
    },
    Image: {
      title: '圖片',
      description: '上傳到本站的圖片。原圖比縮圖還小時，縮圖的網址就是原圖。',
      fields: {
        id: '圖片 ID。',
        url: '原圖（WebP）。',
        thumbnail_url: '長邊最多 300px 的縮圖。',
        medium_url: '長邊最多 1200px 的縮圖。',
        width: '原圖的寬（像素）。',
        height: '原圖的高（像素）。',
        mime: 'MIME 類型，例如 `image/webp`。',
      },
    },
    Byline: {
      title: '署名',
      description: '標題下面那一行署名，儲存專輯時計算好。',
      fields: {
        'role': '`publisher` 時是整張專輯的全部發行方，`artist` 時是全部署名藝術家。',
        'artists': '署名的藝術家，依製作人員的順序。',
        'artists.id': '藝術家 ID；只有署名、沒有對應的藝術家時為 `null`。',
        'artists.name': '署名；沒有另外的署名時是藝術家名稱。',
      },
    },
    Attribute: {
      title: '屬性',
      description: '後台定義的額外資訊，例如封面角色、BPM。定義見 `/catalog/schema` 的 `attribute_definitions`。',
      fields: {
        id: 'ID。',
        key: '屬性的 key，例如 `cover_character`。',
        value: '值，類型隨屬性不同：文字、網址和選項是字串；整數是數字；小數是字串；布林值是 `true` / `false`；日期是 `{ date, precision }`；參照是 `{ type, id }`，例如 `{ "type": "entry", "id": 12 }`。',
        label: '參照類型的屬性才有：所指內容的名稱。',
        sort_order: '顯示順序。',
      },
    },
    Pagination: {
      title: '分頁',
      description: '列表介面的分頁資訊。',
      fields: {
        total: '總共多少筆。',
        per_page: '每頁多少筆。',
        current_page: '目前是第幾頁。',
        last_page: '最後一頁的頁碼。',
      },
    },
    Error: {
      title: '錯誤',
      description: '出錯時 `error` 裡的物件。',
      fields: {
        code: '數字錯誤碼。',
        name: '錯誤名稱，例如 `RESOURCE_NOT_FOUND`。請用它來判斷錯誤類型。',
        message: '英文說明，只用於除錯，可能改變。',
        details: '參數錯誤時依參數名稱列出原因；超過速率限制時是 `{ retry_after }`。',
      },
    },
  },

  enums: {
    album_type: {
      title: '專輯類型',
      description: '專輯的形態，和 Spotify 的 album_type 類似。',
      values: {
        album: '專輯。',
        ep: 'EP、迷你專輯。',
        single: '單曲。',
        compilation: '合輯、精選輯。',
        drama: '廣播劇、有聲劇 CD。',
        radio: '廣播節目的 CD。',
      },
    },
    album_category: {
      title: '專輯類別',
      description: '專輯的音樂來自哪裡，可以有好幾個。空陣列表示作曲家作品集，不屬於任何作品企劃。',
      values: {
        game: '遊戲音樂，包括和遊戲有關但不對應具體遊戲的。',
        animation: '動畫音樂。',
        publication: '漫畫、輕小說等出版物。',
        audio_drama: '廣播劇、有聲劇。',
        tokusatsu: '特攝和人偶劇。',
        live_action: '電影、電視劇、舞台劇。',
        doujin: '同人社團或個人自主創作的音樂，原創和二次創作都算。',
        event: '為活動製作的音樂，例如展會、演出和比賽的主題曲。',
      },
    },
    disc_format: {
      title: '碟片媒介',
      description: 'HQCD、SHM-CD 這類細分記為 `cd`。',
      values: {
        cd: 'CD。',
        sacd: 'SACD。',
        dvd: 'DVD。',
        bd: '藍光。',
        vinyl: '黑膠。',
        cassette: '卡帶。',
        digital: '配信（數位版）。',
        other: '其他。',
      },
    },
    date_precision: {
      title: '日期精度',
      description: '日期精確到哪一級。',
      values: {
        day: '精確到日。',
        month: '只知道年月，日期記為當月 1 號。',
        year: '只知道年份，日期記為當年 1 月 1 日。',
      },
    },
    title_kind: {
      title: '名稱的種類',
      description: '其他名稱（Title）是什麼樣的名稱。',
      values: {
        official: '官方的其他語言名稱，例如包裝背面印的英文名稱。',
        translation: '非官方的翻譯。',
        transliteration: '音譯、羅馬字、假名讀音。',
        alias: '別名、舊名。',
        abbreviation: '簡稱。',
      },
    },
    artist_type: {
      title: '藝術家類型',
      description: '藝術家是什麼。',
      values: {
        person: '個人。',
        group: '團體、樂團。',
        circle: '同人社團。',
        company: '公司：唱片公司、廠牌、發行商、製作公司、工作室。',
        virtual: '虛擬歌手、VTuber。',
        character: '演唱角色歌的角色。',
      },
    },
    artist_relation: {
      title: '藝術家關係',
      description: '從目前這位藝術家的角度描述，兩邊各看到一種。',
      values: {
        member_of: '目前的藝術家是對方的成員。',
        has_member: '對方是目前團體的成員。',
        voice_of: '目前的藝術家為對方（角色）配音。',
        voiced_by: '對方為目前的角色配音。',
        persona_of: '目前的藝術家是對方的另一個名義。',
        has_persona: '對方是目前藝術家的另一個名義。',
        subunit_of: '目前的團體是對方的小組合。',
        has_subunit: '對方是目前團體的小組合。',
        related: '其他相關。',
      },
    },
    credit_role_category: {
      title: '角色分類',
      description: '製作人員角色的分組。具體的角色見 `/catalog/schema` 的 `credit_roles`。',
      values: {
        release: '署名與發行：署名藝術家、發行、廠牌等，見 [release_role](#enum-release-role)。',
        composition: '作曲。',
        lyrics: '作詞。',
        arrangement: '編曲、混音改編。',
        vocals: '演唱、和聲、配音。',
        performance: '演奏、樂團、指揮。',
        production: '製作人、監督。',
        engineering: '錄音、混音、母帶。',
        artwork: '插畫、設計、攝影。',
        other: '其他。',
      },
    },
    release_role: {
      title: '署名與發行',
      description: '「署名與發行」組的 6 個角色，是 `credits[].role` 的一部分。專輯的署名（Byline）由這裡計算而來。',
      values: {
        artist: '署名藝術家：封面或曲目上署名的藝術家。',
        publisher: '發行（発売元），只用於整張專輯。',
        label: '廠牌（レーベル），只用於整張專輯。',
        distributor: '經銷（販売元），只用於整張專輯。',
        manufacturer: '製造（製造元），只用於整張專輯。',
        planning: '企劃（企画），只用於整張專輯。',
      },
    },
    edition_type: {
      title: '版本類型',
      description: '通常版還是限定版。',
      values: {
        regular: '通常版。',
        limited: '限定版，限定方式見 `limited_rule`。',
      },
    },
    limited_rule: {
      title: '限定方式',
      description: '限定版和特典的取得條件。',
      values: {
        first_press: '初回限定。',
        count: '數量限定。',
        period: '期間限定。',
        shop: '店鋪限定。',
        event: '會場限定。',
        region: '地區限定。',
      },
    },
    product_medium: {
      title: '版本的形態',
      description: '實體還是數位版。',
      values: {
        physical: '實體。',
        digital: '數位版（配信）。',
      },
    },
    bonus_type: {
      title: '特典類型',
      description: '特典是什麼。',
      values: {
        bonus_track: '附贈曲目。',
        bonus_disc: '特典碟。',
        booklet: '小冊子。',
        photo_item: '照片、卡片類。',
        goods: '周邊商品。',
        digital_content: '數位內容。',
        serial_code: '序號。',
        event_entry: '活動參加券。',
        signed_item: '簽名物品。',
        other: '其他。',
      },
    },
    image_kind: {
      title: '圖片類別',
      description: '圖片在專輯裡的用途，參考 VGMdb 的分類。',
      values: {
        cover: '專輯封面，正方形，每張專輯恰好一張。',
        front: '正面。',
        back: '背面。',
        booklet: '歌詞本，頁碼寫在 `label` 裡。',
        disc: '碟面。',
        disc_back: '碟背。',
        obi_front: '側標正面。',
        obi_back: '側標背面。',
        tray: '托盤。',
        box: '外盒。',
        sticker: '貼紙。',
        bonus_item: '特典物品。',
        illustration: '插圖。',
        other: '其他。',
      },
    },
    lyric_kind: {
      title: '歌詞種類',
      description: '一份歌詞是原文、翻譯還是音譯。',
      values: {
        original: '原文，每個曲目最多一份。',
        translation: '翻譯。',
        transliteration: '音譯、羅馬字。',
      },
    },
    lyric_format: {
      title: '歌詞格式',
      description: '歌詞正文的寫法。',
      values: {
        plain: '純文字。',
        lrc: 'LRC，附帶時間軸。',
        srt: 'SRT 字幕，附帶時間軸。',
      },
    },
    entry_type: {
      title: '條目類型',
      description: '條目是什麼作品。子類型 `format` 隨類型不同：動畫是 `tv`、`movie`、`ova`、`web`、`special`；遊戲是 `full`、`dlc`、`expansion`；影集是 `series`、`special`；書籍是 `novel`、`light_novel`、`other`；漫畫是 `serial`、`oneshot`；舞台是 `musical`、`play`；電影和其他沒有子類型。',
      values: {
        anime: '動畫，包括動畫電影。',
        game: '遊戲。',
        movie: '真人電影。',
        tv: '真人影集。',
        book: '書籍。',
        manga: '漫畫。',
        stage: '舞台劇、音樂劇。',
        other: '其他。',
      },
    },
    entry_relation: {
      title: '條目關係',
      description: '從目前條目的角度描述，兩邊各看到一種。',
      values: {
        sequel: '對方是目前條目的續作。',
        prequel: '對方是目前條目的前作。',
        side_story: '對方是目前條目的外傳。',
        main_story: '對方是目前條目的本篇。',
        spin_off: '對方是目前條目的衍生作品。',
        spin_off_of: '目前條目衍生自對方。',
        adaptation: '對方改編自目前條目。',
        source: '對方是目前條目的原作。',
        remake: '對方是目前條目的重製版。',
        remake_of: '目前條目是對方的重製版。',
        alternative: '另一個版本。',
        shared_world: '同一個世界觀。',
        related: '其他相關。',
      },
    },
    entry_album_relation: {
      title: '專輯和條目的關係',
      description: '一張專輯對某個條目來說是什麼。',
      values: {
        opening: '片頭曲。',
        ending: '片尾曲。',
        insert_song: '插曲。',
        theme_song: '主題曲。',
        character_song: '角色歌。',
        image_song: '印象曲。',
        ost: '原聲。',
        drama: '廣播劇。',
        other: '其他。',
      },
    },
    attribute_value_type: {
      title: '屬性值的類型',
      description: '屬性定義的 `value_type`，決定 Attribute 的 `value` 是什麼。',
      values: {
        text: '文字。',
        integer: '整數。',
        decimal: '小數，寫成字串。',
        date: '日期，寫成 `{ date, precision }`。',
        url: '網址。',
        boolean: '是或否。',
        choice: '從定義的 `choices` 裡選一個。',
        reference: '指向資料庫裡的內容，寫成 `{ type, id }`。',
      },
    },
    link_category: {
      title: '連結分類',
      description: '連結提供者的分類，串流連結在專輯裡另外列出。',
      values: {
        official: '官網。',
        social: '社群網站。',
        streaming: '串流。',
        shop: '商店。',
        database: '資料庫，例如 VGMdb、MusicBrainz、Bangumi。',
        other: '其他。',
      },
    },
  },

  changes: {
    launch: '首次公開，測試版。',
  },
}

export default texts
