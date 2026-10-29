import { md } from '~/documents/sections'
import type { ApiDocsTexts } from '../types'

const texts: ApiDocsTexts = {
  title: '公開API',
  intro: 'CDCat に収録されたアルバム、アーティスト、イベント、エントリー、シリーズの情報を HTTP で取得できます。登録もキーも不要で、カタログデータは CC BY-SA 4.0 で共有しています。',

  labels: {
    tag: '開発者向けドキュメント',
    beta: 'ベータ版',
    beta_note: '正式公開までにフィールドが変わる可能性があります。最新版のドキュメントに従ってください',
    base_url: 'ベース URL',
    copy: 'コピー',
    copied: 'コピーしました',
    copy_url: 'リクエスト URL をコピー',
    copy_json: 'JSON をコピー',
    copy_failed: 'コピーできませんでした。テキストを選択して手動でコピーしてください',
    in_section: 'このセクションのエンドポイントとオブジェクト',
    path_params: 'パスパラメータ',
    query_params: 'クエリパラメータ',
    response: 'レスポンスの data',
    response_model: 'data は {model} です。',
    extends: '{model} のすべてのフィールドに加えて、次のフィールドがあります：',
    statuses: 'ステータスコード',
    example: '例',
    default: 'デフォルト {value}',
    required: '必須',
    optional: '含まれない場合あり',
    see: '値は {name} を参照',
    more_items: 'ほか {n} 件',
    more_model: 'フィールドは {model} を参照',
    model: 'オブジェクト',
    enum: '値の一覧',
    feedback_title: 'フィードバック',
    feedback_text: 'ドキュメントと API の動作が違う、新しいエンドポイントがほしい、問題が起きた、といったときはお気軽にお知らせください。',
    feedback_issue: 'GitHub で issue を作成',
    feedback_email: 'メールを送る',
  },

  common: {
    params: {
      page: 'ページ番号。1 から始まります。',
      per_page: '1 ページあたりの件数。範囲外の場合は 422 を返します。',
      include_pending: '承認待ちの内容（公開済みで、審査を待っているもの）も一覧に含めます。',
      direction: '並び順：`asc` は小さい順、`desc` は大きい順。',
    },
    fields: {
      pagination: 'ページネーション情報。[Pagination](#object-pagination) を参照してください。',
      slug: 'スラッグ（URL 用の別名）。表示専用で、取得には使えません。',
      release_date_precision: '日付の精度。年や月しか分からない場合、日付はその年またはその月の 1 日として記録されます。精度に合わせて表示してください。',
      is_favorited: '現在のユーザーがお気に入りに登録しているかどうか。サイトにログインしているときだけ意味があり、それ以外のリクエストでは常に `false` です。',
      is_pending: '承認待ちかどうか：投稿後すでに公開されていて、審査を待っている状態です。',
      titles: '原題以外の名称：公式の訳名、翻訳、読み、別名など。[Title](#object-title) を参照してください。',
      links: '外部リンク。表示順に並んでいます。[Link](#object-link) を参照してください。',
      share_card_url: '共有カード（1200×630 の JPEG）の URL。まだ生成されていない場合は `null`。',
      version: '現在のバージョン番号。変更のたびに 1 増えます。',
      pending_revision: '審査待ちの投稿。投稿者と審査者だけが見られ、それ以外のユーザーには常に `null` です。',
      created_at: '作成日時（UTC）。',
      updated_at: '最終更新日時（UTC）。閲覧数などの統計が変わったときにも更新されます。',
    },
  },

  sections: {
    'overview': {
      title: '概要',
      lead: '公開API を使うと、ほかのサイトやアプリから CDCat の音楽情報を読み込めます。読み取り専用で、登録もキーも不要です。',
    },
    'usage': {
      title: '利用ルール',
      lead: '出典を明記し、ライセンスに従えば、データは自由に再利用できます。サーバーに負担をかけないよう、リクエストの頻度も控えめにしてください。',
    },
    'conventions': {
      title: '共通の仕様',
      lead: 'すべてのエンドポイントに共通するルールです：レスポンスの形式、ページネーション、パラメータの書き方、名称と日付、承認待ちの内容と統合された内容。',
    },
    'rate-limits': {
      title: 'レート制限',
      lead: 'ログイン不要の読み取りエンドポイントは 1 つのレート制限を共有し、検索には別の制限があります。',
    },
    'errors': {
      title: 'エラー',
      lead: 'エラーのときは、HTTP ステータスコードで問題の種類がわかります。`error.name` は変わらないエラー名なので、判定にはこれを使ってください。',
    },
    'albums': {
      title: 'アルバムとトラック',
      short: 'アルバムとトラック',
      lead: 'アルバムはトラックを収録する発売の単位です。初回限定盤と通常盤は同じアルバムの別エディション（Product）で、アナログ盤などトラックリストが異なる発売は別のアルバムとして登録します。一覧は簡略版の AlbumSimple を返し、詳細にはディスク、トラック、クレジット、エディション、画像も含まれます。',
    },
    'lyrics': {
      title: '歌詞',
      lead: '歌詞はトラックに付きます。原文は各トラックに 1 つまでで、ほかに翻訳と音訳を付けられます。歌詞は権利者に帰属し、CC BY-SA は適用されません。資料としての参照と識別の目的でのみ利用できます。',
    },
    'artists': {
      title: 'アーティスト',
      lead: 'アーティストには、個人、グループ、同人サークル、企業、バーチャルシンガー、キャラクターが含まれます。レコード会社、レーベル、発売元もアーティスト（種類 `company`）で、レーベルを別に扱う仕組みはありません。',
    },
    'events': {
      title: 'イベント',
      lead: 'イベントシリーズ（M3、コミックマーケットなど）の下に各回のイベントがあります。配置図と参加サークルは主催者が公開している資料から取り込み、そのまま保存しています。',
    },
    'entries': {
      title: 'エントリー',
      lead: 'エントリーはアルバムに関連する原作で、アニメ、ゲーム、映画、書籍などです。アルバムはエントリーを通じてシリーズに含まれます。',
    },
    'franchises': {
      title: 'シリーズ',
      lead: 'シリーズは関連するエントリーをまとめるもので、シリーズとサブシリーズの最大 2 階層です。イベントシリーズ（`/event-series`）とは別物です。',
    },
    'search': {
      title: '検索',
      lead: 'アルバム、トラック、アーティスト、エントリー、シリーズをまとめて検索します。簡体字・繁体字・日本の漢字の違い、ひらがなとカタカナ、全角と半角の違いは、そろえてから比較します。',
    },
    'dictionaries': {
      title: '辞書と値の一覧',
      short: '辞書と値の一覧',
      lead: 'API の値はすべて決まった英小文字です。完全な最新の一覧は `/catalog/schema` を正とし、ここでは各値の意味を説明します。',
    },
    'objects': {
      title: 'よく使うオブジェクト',
      lead: '多くのエンドポイントに登場するオブジェクトです。',
    },
    'changes': {
      title: '更新履歴',
      lead: '利用者に影響する変更を、新しい順に載せています。正式公開までは API はベータ版で、フィールドが変わる可能性があります。',
    },
  },

  prose: {
    'overview': md`
      ### ベース URL

      すべてのエンドポイントはこの URL の下にあります。このページのパスでは省略しています：

      \`\`\`
      {{base}}
      \`\`\`

      リクエストは \`GET\` で、JSON を返します。たとえばアルバムを 1 つ取得するには：

      \`\`\`
      GET {{base}}/albums/1287
      \`\`\`

      ### このドキュメントの範囲

      - アルバムとトラック、歌詞、アーティスト、イベント、エントリー、シリーズ、検索、および値の一覧。
      - API はまだベータ版です。正式公開までにフィールドが変わる可能性があります。変更を別途お知らせすることはないので、最新版のドキュメントに従ってください。
      - データを投稿・編集するエンドポイントのドキュメントは、まだ用意できていません。

      ### キーは不要

      これらのエンドポイントはログイン不要で、API キーもありません。ほかのサイトのウェブページから、そのままクロスオリジンで呼び出せます。CORS はすべてのオリジンを許可し、リクエストに Cookie は付きません。
    `,
    'usage': md`
      ### ライセンスの対象外の内容

      歌詞、ジャケット、その他の画像はそれぞれの権利者に帰属し、資料としての参照と識別の目的でのみ利用できます。CC BY-SA は適用されません。レビュー、ディスカッション、記事は投稿者に帰属し、カタログデータには含まれません。このドキュメントでも、それらの API は扱いません。

      ### リクエストのマナー

      - 頻度を抑え、大量のリクエストを同時に送らないでください。具体的な上限は[レート制限](#rate-limits)を参照してください。
      - \`User-Agent\` にアプリ名と連絡先を書いてください。例：\`MyLyricsApp/1.2 (https://example.com; me@example.com)\`。問題が起きたときに、こちらから連絡できます。
      - キャッシュできるものはキャッシュし、同じデータを毎回取得し直さないでください。
      - API ドメインの robots.txt は、検索エンジンに API をインデックスさせないためのものです。このドキュメントに沿って API を呼び出す場合は、その制限を受けません。

      その他の要件は、利用規約の[責任ある利用](/terms#acceptable-use)を参照してください。

      ### フィードバック

      ドキュメントと API の動作が違う、新しいエンドポイントがほしい、問題が起きた、といったときは、GitHub で [issue を作成]({{issues}})するか、{{email}} までメールでお知らせください。
    `,
    'conventions': md`
      ### レスポンスの形式

      成功すると \`success\` が \`true\` になり、内容は \`data\` に入ります。失敗すると \`success\` が \`false\` になり、理由は \`error\` に入ります。[エラー](#errors)を参照してください。

      \`\`\`json
      { "success": true, "data": { … } }
      \`\`\`

      ### ページネーション

      一覧のエンドポイントは \`page\`（1 から始まります）と \`per_page\` でページを分けます。\`data\` には一覧そのものと [Pagination](#object-pagination) が入ります。各エンドポイントのデフォルトの件数と上限はそのパラメータに書いてあり、上限を超えると 422 を返します。

      ### パラメータの書き方

      - 真偽値は \`true\` / \`false\`、または \`1\` / \`0\` と書きます。
      - 配列は \`names[]=a&names[]=b\` と書きます。
      - 並べ替えには \`sort\`（何で並べるか）と \`direction\`（\`asc\` は昇順、\`desc\` は降順）を使います。アルバム一覧の \`sort\` はいくつかの決まった並べ方で、\`direction\` はありません。
      - 認識できないパラメータ値には 422 を返します。黙ってデフォルト値に置き換えることはありません。ドキュメントにないパラメータは無視されます。
      - ID はすべて数値です。\`slug\` は表示専用で、取得には使えません。

      ### 名称と翻訳

      API は言語によって返す内容を変えません。\`title\` や \`name\` は原題、つまりパッケージに印刷されている名前です。ほかの名称は \`titles\` に入っています（[Title](#object-title) を参照）。読者の言語で名前を表示するには、その言語の \`official\`、その言語の \`translation\`、原題の順に使うことをおすすめします。

      一覧のアルバム（AlbumSimple）には \`titles\` がなく、原題しか表示できません。訳名が必要な場合は、アルバムの詳細を取得してください。イベントとイベントシリーズの \`description\` は言語ごとに分かれたオブジェクトです。例：\`{ "ja": "…", "en": "…" }\`。

      ### 日付と時刻

      - 日付は \`YYYY-MM-DD\` 形式です。発売日には \`release_date_precision\` が付きます。年や月しか分からない場合、精度は \`year\` または \`month\` で、日付はその年またはその月の 1 日として記録されます。表示するときは精度に合わせて省略してください。
      - 日時は UTC の ISO 8601 で、小数秒は付きません。例：\`2026-10-30T08:00:00Z\`。
      - イベントの \`start_time\` と \`end_time\` は会場の現地時刻 \`HH:MM\` で、タイムゾーンは付きません。

      ### 画像

      画像のアドレスはすべて完全な URL です。アルバムの画像（[Image](#object-image)）には、原寸の \`url\`、長辺最大 300px の \`thumbnail_url\`、最大 1200px の \`medium_url\` があります。URL は自分で組み立てず、これらをそのまま使ってください。エントリー、シリーズ、イベントの画像はほかのサイトにある場合があります。

      ### 承認待ちの内容

      メンバーが新しく作成したアルバム、アーティスト、エントリー、シリーズは、投稿するとすぐに公開され、同時に審査を待ちます。このとき \`is_pending\` は \`true\` です。この 4 種類の一覧には、デフォルトでは含まれず、\`include_pending=true\` を指定すると表示されます。詳細やその他のエンドポイントは通常どおり返します。審査を通らなかった内容は削除され、その後のリクエストには 404 を返します。

      ### 成人向けコンテンツ

      \`is_adult\` は目印にすぎず、API が代わりに除外することはありません。全年齢向けのアプリでは、ご自身で除外してください。

      ### 統合と削除

      重複したアルバム、トラック、アーティストは統合されます。統合されてなくなった ID をリクエストすると、\`/albums/{id}\`、\`/tracks/{id}\`、\`/artists/{id}\`、\`/artists/{id}/card\` は 301 を返します。\`Location\` は残ったほうを指し、\`data.moved_to\` に種類と新しい ID が入ります。

      \`\`\`json
      { "success": true, "data": { "moved_to": { "resource_type": "album", "id": 1290 } } }
      \`\`\`

      ほかのエンドポイントは、統合または削除された ID に対して 404 を返します。

      ### キャッシュ

      \`/catalog/schema\`、配置図、参加サークル一覧のレスポンスには \`ETag\` が付きます。次のリクエストで \`If-None-Match\` を付けると、内容が変わっていなければ 304 を返すので、ダウンロードし直す必要はありません。
    `,
    'rate-limits': md`
      | リクエスト | 1 分あたりの上限 | カウントの単位 |
      |---|---|---|
      | ログイントークンなし | {{rate_limit}} 回 | IP アドレス。IPv6 は /64 ごとに 1 つとして数えます |
      | 有効なログイントークンあり | {{rate_limit_user}} 回 | アカウント |
      | \`/search\` | 別枠で {{search_limit}} 回 | アカウントまたは IP。上記とは別に数えます |

      すべてのレスポンスに 2 つのヘッダーが付きます。\`X-RateLimit-Limit\` は 1 分あたりの上限、\`X-RateLimit-Remaining\` はこの 1 分間の残り回数です。上限を超えると 429 を返します：

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

      \`details.retry_after\` とレスポンスヘッダーの \`Retry-After\` はどちらも待つべき秒数で、\`X-RateLimit-Reset\` は再試行できる時刻（Unix タイムスタンプ）です。429 を受け取ったら、すぐに再試行せず、\`Retry-After\` 秒待ってから試してください。

      これらのヘッダーはクロスオリジンのリクエストでも読み取れます。上限は今後変わる可能性があるため、コードに固定で書かず、レスポンスヘッダーで判断してください。
    `,
    'errors': md`
      エラーのときに返すオブジェクトです。フィールドは [Error](#object-error) を参照してください：

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

      \`message\` は英語で、デバッグ専用です。今後変わる可能性があります。\`details\` はパラメータのエラーとレート制限の超過のときだけ含まれます。

      | HTTP | \`error.name\` | 発生する場面 |
      |---|---|---|
      | 404 | \`RESOURCE_NOT_FOUND\` | URL は正しいが、内容が存在しないか削除されている |
      | 404 | \`NOT_FOUND\` | URL が正しくない：パスが存在しない、または ID が数値でない |
      | 405 | \`METHOD_NOT_ALLOWED\` | \`GET\` 以外のリクエストメソッドを使った |
      | 422 | \`VALIDATION_FAILED\` | パラメータが不正。\`details\` にパラメータ名ごとの理由が入る |
      | 429 | \`RATE_LIMIT_EXCEEDED\` | リクエストが多すぎる。[レート制限](#rate-limits)を参照 |
      | 500 | \`INTERNAL_ERROR\` | サーバーのエラー。しばらくしてから再試行し、続く場合はお知らせください |

      また、統合されたアルバム、トラック、アーティストは 301 を返し（[統合と削除](#統合と削除)を参照）、\`ETag\` 付きのエンドポイントは 304 を返すことがあります。
    `,
  },

  statuses: {
    'VALIDATION_FAILED': 'パラメータが不正です。`details` にパラメータ名ごとの理由が入ります。',
    'RESOURCE_NOT_FOUND': '内容が存在しないか、削除されています。',
    'RATE_LIMIT_EXCEEDED': 'リクエストが多すぎます。`retry_after` 秒待ってから再試行してください。',
    '301': 'この ID は別の ID に統合されています。`Location` と `data.moved_to` で新しい ID がわかります。',
    '304': '`If-None-Match` が指定されていて、内容が変わっていません。',
  },

  endpoints: {
    'get-albums': {
      title: 'アルバム一覧',
      summary: '条件でアルバムを絞り込み、ページ単位で返します。承認待ちのアルバムはデフォルトでは含まれません。',
      params: {
        'type': 'アルバムの種類。',
        'category': 'アルバムのカテゴリー。例：`doujin`、`game`。',
        'format': 'ディスクのメディア。例：`cd`、`vinyl`。',
        'artist_id': 'このアーティストが参加しているアルバムだけを返します。役割は問いません。',
        'release_event_id': 'この回のイベントで初頒布されたアルバムだけを返します。',
        'year': '発売年。',
        'attributes[key]': '属性で絞り込みます。最大 5 個。例：`attributes[cover_character]=射命丸文`。エントリーなどを指す属性は `entry:12` のように書きます。絞り込めるのは、テキスト、URL、選択肢、参照の各タイプの属性だけです。',
        'sort': '`new` は発売日の新しい順、`trending` は直近 30 日の人気順、`top_rated` は評価ランキング順（1 日 1 回更新）。',
        'search': 'タイトル、その他の名称、品番、バーコード、クレジットを検索します。空白を除いて 2 文字以上（漢字やかなを含む場合は 1 文字でも可）、最大 3 語です。`sort` を指定しない場合は関連度順に並びます。',
      },
      fields: {
        albums: 'このページのアルバム。',
      },
      notes: md`
        ::: tip 一覧には訳名がありません
        AlbumSimple には \`titles\` がなく、原題しか表示できません。読者の言語で訳名を表示するには、[アルバムの詳細](#get-albums-id)を取得してください。
        :::
      `,
    },
    'get-albums-id': {
      title: 'アルバムの詳細',
      summary: '1 つのアルバムのすべての情報：ディスクとトラック、クレジット、エディション、特典、画像、外部リンク、関連エントリー、統計。',
      params: {
        id: 'アルバム ID。',
      },
      notes: md`
        - リクエストごとに閲覧が 1 回記録されます（同じアクセス元からは 1 日 1 回まで）。\`views_count\` は 5 分ごとに更新されます。
        - アーティスト・発売（発売元、レーベル、名義のアーティストなど）も \`credits\` に含まれ、\`category\` は \`release\` です。
      `,
    },
    'get-tracks-id': {
      title: 'トラックの詳細',
      summary: '1 つのトラックと、収録アルバム、同じアルバムのトラックリスト、原曲、このトラックを原曲とするトラック。',
      params: {
        id: 'トラック ID。',
      },
    },
    'get-tracks-id-lyrics': {
      title: 'トラックの歌詞',
      summary: '1 つのトラックのすべての歌詞（原文、翻訳、音訳）の概要です。本文は含みません。ID 順で、ページネーションはありません。',
      params: {
        id: 'トラック ID。',
      },
      fields: {
        lyrics: 'このトラックの歌詞。[LyricSummary](#object-lyric-summary) を参照してください。',
      },
    },
    'get-lyrics-id': {
      title: '歌詞',
      summary: '1 つの歌詞の本文と出典。',
      params: {
        id: '歌詞 ID。',
      },
      notes: md`
        ::: warning 歌詞の権利
        歌詞は権利者に帰属し、CC BY-SA は適用されません。資料としての参照と識別の目的でのみ利用できます。[利用ルール](#usage)を参照してください。
        :::
      `,
    },
    'get-artists': {
      title: 'アーティスト一覧',
      summary: '条件でアーティストを絞り込み、新しく追加された順にページ単位で返します。承認待ちのアーティストはデフォルトでは含まれません。',
      params: {
        type: 'アーティストの種類。',
        search: '名前、その他の名称、スラッグで部分一致検索します。検索時は一致度の高い順に並びます。',
        has_albums: 'アルバムがあるアーティストだけを返します。',
      },
      fields: {
        artists: 'このページのアーティスト。詳細にしかないフィールドは含みません。',
      },
    },
    'get-artists-id': {
      title: 'アーティストの詳細',
      summary: '1 人のアーティストの情報。その他の名称、外部リンク、属性、関連アーティストを含みます。',
      params: {
        id: 'アーティスト ID。',
      },
    },
    'get-artists-id-albums': {
      title: 'アーティストのリリース',
      summary: 'このアーティストがアルバム全体で「アーティスト・発売」の役割（アーティスト、発売元、レーベル、販売元、製造元、企画）を担っているアルバムを、発売日の新しい順に返します。承認待ちのアルバムも含みます。',
      params: {
        id: 'アーティスト ID。',
      },
      fields: {
        albums: 'このページのアルバム。',
      },
    },
    'get-artists-id-tracks': {
      title: 'アーティストの参加作品',
      summary: 'このアーティストが参加しているアルバム：トラック単位のすべての役割と、アルバム全体での「アーティスト・発売」以外の役割が対象です。アルバムごとにまとめ、アルバム全体での役割と参加トラックを並べます。',
      params: {
        id: 'アーティスト ID。',
        role: 'この役割だけに絞ります。例：`composer`。役割の key は [/catalog/schema](#get-catalog-schema) の `credit_roles` を参照してください。',
      },
      fields: {
        'albums': 'このページのアルバム。1 枚ごとに 1 グループです。ページネーションはアルバム単位です。',
        'albums.album': 'アルバム。',
        'albums.roles': 'アルバム全体で担っている役割。',
        'albums.roles.role': '役割の key。',
        'albums.roles.credited_as': 'クレジット名義。アーティスト名と異なる場合だけ含まれます。',
        'albums.roles.detail': '補足。例：担当した楽器。',
        'albums.tracks': '参加しているトラック。ディスクとトラック番号の順に並びます。',
        'albums.tracks.id': 'トラック ID。',
        'albums.tracks.title': '曲名（原題）。',
        'albums.tracks.disc_position': 'ディスク番号。',
        'albums.tracks.track_number': 'トラック番号。',
        'albums.tracks.number_label': '表示用の番号。例：アナログ盤の `A1`。',
        'albums.tracks.roles': 'このトラックで担っている役割。形式は `albums.roles` と同じです。',
        'roles': '役割ごとの参加アルバム数。例：`{ "composer": 4 }`。`role` パラメータの影響を受けません。',
        'all': '参加アルバムの総数。',
      },
    },
    'get-artists-id-card': {
      title: 'アーティストカード',
      summary: '1 人のアーティストの簡単な情報で、ホバーカード向けです。その他の名称は最大 4 個、紹介文は先頭 160 文字までです。',
      params: {
        id: 'アーティスト ID。',
      },
      fields: {
        id: 'アーティスト ID。',
        name: '名前（原語）。',
        type: 'アーティストの種類。',
        image_url: 'アイコン画像。',
        is_active: '現在も活動しているかどうか。個人が亡くなった場合やグループが解散した場合は `false`。',
        bio: '紹介文の冒頭。最大 160 文字をそのまま切り出したもので、Markdown の記号を含むことがあります。',
        albums_count: '参加アルバム数。',
        followers_count: 'このアーティストをフォローしている人数。',
      },
    },
    'get-artists-lookup': {
      title: '名前でアーティストを検索',
      summary: '名前の完全一致でアーティストを探します。一度に最大 100 個で、クレジット表の名前をアーティストに対応付けるのに向いています。比較の前に、全角と半角、大文字と小文字、ひらがなとカタカナ、簡体字・繁体字・日本の漢字の違いをそろえます。',
      params: {
        'names[]': '探す名前。それぞれ最大 200 文字。',
      },
      fields: {
        'matches': '渡した名前ごとにまとめた結果。',
        'matches.<name>': 'この名前と完全に一致するアーティスト。同名のアーティストが複数いることも、1 人もいない（空の配列）こともあります。メインの名前、公式の訳名、翻訳、読み、別名を比較し、略称は比較しません。',
        'matches.<name>.id': 'アーティスト ID。',
        'matches.<name>.name': '名前（原語）。',
        'matches.<name>.type': 'アーティストの種類。',
        'matches.<name>.image_url': 'アイコン画像。',
      },
    },
    'get-event-series': {
      title: 'イベントシリーズ一覧',
      summary: 'すべてのイベントシリーズを名前順に返します。ページネーションはありません。',
      fields: {
        event_series: 'イベントシリーズ。`latest_start_date` を含みます。',
      },
    },
    'get-event-series-id': {
      title: 'イベントシリーズの詳細',
      summary: '1 つのイベントシリーズ。シリーズの各回は [イベント一覧](#get-events) の `series_id` でページ単位で取得します。',
      params: {
        id: 'イベントシリーズ ID。',
      },
    },
    'get-events': {
      title: 'イベント一覧',
      summary: '条件で各回のイベントを絞り込み、ページ単位で返します。デフォルトでは最近のものが先頭です。',
      params: {
        series_id: 'このイベントシリーズのイベントだけを返します。',
        search: '名前とスラッグで検索します。空白を除いて 2〜100 文字、最大 3 語で、すべての語に一致する必要があります。',
        start_from: '開始日がこの日以降（`YYYY-MM-DD`）。',
        start_to: '開始日がこの日以前（`YYYY-MM-DD`）。',
        sort: '`start_date` は開始日順、`released_albums_count` は初頒布アルバム数順。',
      },
      fields: {
        events: 'このページのイベント。詳細にしかないフィールドは含みません。',
      },
    },
    'get-events-id': {
      title: 'イベントの詳細',
      summary: '1 回分のイベント。一覧に加えて、参加サークル数、配置図の有無、共有カードを含みます。',
      params: {
        id: 'イベント ID。',
      },
    },
    'get-events-id-map': {
      title: '会場配置図',
      summary: '1 回分のイベントの会場配置図：ホール、各机の位置、背景の図形です。主催者の配置図を変換したものです。',
      params: {
        id: 'イベント ID。',
      },
      statuses: {
        RESOURCE_NOT_FOUND: 'イベントが存在しないか、この回にはまだ配置図がありません（先にイベントの詳細の `has_map` を確認してください）。',
      },
      notes: md`
        データが大きいため、レスポンスには \`ETag\` と \`Cache-Control: public, max-age=60\` が付きます。繰り返しリクエストするときは \`If-None-Match\` を付けてください。座標の単位は配置図 PDF の pt で、y 軸は下向きです。
      `,
    },
    'get-events-id-booths': {
      title: '参加サークル',
      summary: '1 回分のイベントのすべての参加サークルを、主催者のリストの順に一度に返します。参加サークルは主催者の資料のまま保存しており、1 件に 0 人以上のアーティストを関連付けられます。',
      params: {
        id: 'イベント ID。',
      },
      fields: {
        booths: 'すべての参加サークル。まだ取り込まれていない場合は空の配列。',
      },
      notes: md`
        配置図と同じく \`ETag\` と \`Cache-Control: public, max-age=60\` が付きます。参加サークルのテキストとサークルカットは主催者によるもので、\`is_adult\` は目印にすぎません。
      `,
    },
    'get-entries': {
      title: 'エントリー一覧',
      summary: '条件でエントリーを絞り込み、ページ単位で返します。承認待ちのエントリーはデフォルトでは含まれません。',
      params: {
        type: 'エントリーの種類。',
        format: 'サブタイプ。選べる値は種類によって異なります。[entry_type](#enum-entry-type) を参照してください。',
        platform: 'ゲームのプラットフォーム。完全一致です。例：`Switch`。',
        franchise_id: 'このシリーズ（サブシリーズを含む）に属するエントリーだけを返します。',
        year: '発売年。',
        search: '名前、その他の名称（別名、略称を含む）、スラッグで検索します。`sort` を指定しない場合は関連度順に並びます。',
        sort: '並べ替えの基準。',
      },
      fields: {
        entries: 'このページのエントリー。詳細にしかないフィールドは含みません。',
      },
    },
    'get-entries-id': {
      title: 'エントリーの詳細',
      summary: '1 つのエントリー。外部リンク、関連アルバム、所属するシリーズ、関連エントリーを含みます。',
      params: {
        id: 'エントリー ID。',
      },
    },
    'get-franchises': {
      title: 'シリーズ一覧',
      summary: '条件でシリーズを絞り込み、ページ単位で返します。デフォルトでは最上位のシリーズだけで、検索時はサブシリーズも含みます。承認待ちのシリーズはデフォルトでは含まれません。',
      params: {
        search: '名前、その他の名称、スラッグで検索します。`sort` を指定しない場合は関連度順に並びます。',
        parent_id: 'このシリーズのサブシリーズだけを返します。',
        top_level: '`true` は最上位のシリーズだけ、`false` はすべて。`search` がないときのデフォルトは `true`、`search` があるときは `false` です。`parent_id` を指定した場合は無効です。',
        sort: '並べ替えの基準。エントリー数とアルバム数はサブシリーズを含みます。',
      },
      fields: {
        franchises: 'このページのシリーズ。詳細にしかないフィールドは含みません。',
      },
    },
    'get-franchises-id': {
      title: 'シリーズの詳細',
      summary: '1 つのシリーズ。サブシリーズ（とサブシリーズのエントリー）、直接属するエントリー、シリーズ全体のアルバムを含みます。',
      params: {
        id: 'シリーズ ID。',
      },
    },
    'get-franchises-id-albums': {
      title: 'シリーズのアルバム',
      summary: 'シリーズとそのサブシリーズのすべてのアルバム：エントリー経由で関連するアルバムと、シリーズ全体のアルバムを合わせ、重複を除いてページ単位で返します。発売日順です。',
      params: {
        id: 'シリーズ ID。',
        entry_id: 'このエントリーに関連するアルバムだけに絞ります。',
        relation_type: 'シリーズ内のエントリーとこの関係にあるアルバムだけに絞ります。例：`ost`。指定するとシリーズ全体のアルバムは含まれません。',
        sort: '発売日順のみです。',
      },
      fields: {
        'albums': 'このページのアルバム。',
        'albums.entries': 'このアルバムに関連し、このシリーズに属するエントリー。シリーズ全体のアルバムでは空の配列です。',
        'albums.entries.id': 'エントリー ID。',
        'albums.entries.name': 'エントリー名（原題）。',
        'albums.entries.type': 'エントリーの種類。',
        'albums.entries.relation_type': 'アルバムとエントリーの関係。',
      },
    },
    'get-search': {
      title: '検索',
      summary: 'アルバム、トラック、アーティスト、エントリー、シリーズを検索します。`type` を指定しない場合は種類ごとに上位数件を返し、`type` を指定するとその種類だけを検索してページ単位で返します。',
      params: {
        q: '検索語。空白を除いて 2 文字以上（漢字、かな、ハングルを含む場合は 1 文字でも可）、最大 3 語で、すべての語に一致する必要があります。',
        type: 'この種類だけを検索し、結果をページ単位で返します。',
        include_pending: '承認待ちの内容も検索します。検索ではデフォルトで含まれ、同じスコアなら審査済みのものより後に並びます。',
        limit: '`type` を指定しない場合の、種類ごとの最大件数。',
      },
      fields: {
        'query': '実際に検索に使った語。',
        'query.phrase': '整えた後の検索語。',
        'query.terms': '分割した語。最大 3 個。',
        'groups': '`type` を指定しない場合に返します。種類ごとに 1 グループで、順序は固定（アルバム、トラック、アーティスト、エントリー、シリーズ）です。結果のない種類も含まれます。',
        'groups.type': 'このグループの種類。',
        'groups.total': 'この種類の結果数。最大 1000 まで数えます。',
        'groups.total_is_capped': '結果が 1000 件を超える場合は `true`。',
        'groups.items': 'この種類の上位の結果。',
        'results': '`type` を指定した場合に返します：このページの結果。',
        'total_is_capped': '`type` を指定した場合に返します：結果が 1000 件を超える場合は `true` で、`pagination.total` は最大 1000 です。',
      },
      notes: md`
        検索には専用のレート制限があり、1 分あたり {{search_limit}} 回です。[レート制限](#rate-limits)を参照してください。3 文字以上のラテン文字の語は、多少のスペルミスを許容します。品番は完全一致が必要です。
      `,
    },
    'get-catalog-schema': {
      title: 'カタログ辞書',
      summary: 'API で使うすべての値の一覧と、管理画面で管理しているクレジットの役割、属性の定義、リンクの提供元です。4 言語の名前が付いています。',
      fields: {
        'enums': '値の一覧。キーは名前（例：`album_type`）、値はすべての取りうる値です。',
        'credit_roles': 'クレジットの役割。`credits[].role` はここの `key` です。',
        'credit_roles.key': '役割の key。例：`composer`。',
        'credit_roles.category': '役割の分類。',
        'credit_roles.names': '各言語の名前。例：`{ "ja": "作曲", "en": "Composer" }`。',
        'credit_roles.aliases': 'ほかのサイトでよく使われる表記。ほかのサイトのクレジット表を対応付けるのに使えます。',
        'credit_roles.is_album_role': 'アルバム全体に使えるかどうか。',
        'credit_roles.is_track_role': '個々のトラックに使えるかどうか。',
        'attribute_definitions': '属性の定義：アルバム、トラック、画像、アーティストに付けられる補足情報です。例：「ジャケットのキャラクター」。',
        'attribute_definitions.key': '属性の key。Attribute の `key` にあたります。',
        'attribute_definitions.names': '各言語の名前。',
        'attribute_definitions.description': '各言語の入力の説明。',
        'attribute_definitions.group': 'グループ。例：「東方 Project」。',
        'attribute_definitions.value_type': '値のタイプ。',
        'attribute_definitions.choices': '`choice` タイプの選択肢。',
        'attribute_definitions.reference_types': '`reference` タイプが指せる内容。例：`entry`。',
        'attribute_definitions.applies_to': '付けられるオブジェクト：`album`、`track`、`album_image`、`artist`。',
        'attribute_definitions.is_multiple': '複数の値を入力できるかどうか。',
        'link_providers': 'リンクの提供元。[リンクの提供元一覧](#get-link-providers) と同じです。',
        'aggregates': 'エディター用のデータ構造の説明。データの読み取りには不要です。',
        'limits': '画像アップロードの制限。データの読み取りには不要です。',
      },
    },
    'get-link-providers': {
      title: 'リンクの提供元',
      summary: '外部リンクのすべての提供元（公式サイト、SNS、ストリーミング、ショップ、データベースなど）を表示順に返します。ページネーションはありません。',
      fields: {
        link_providers: 'リンクの提供元。',
      },
    },
  },

  models: {
    AlbumSimple: {
      title: 'アルバム（簡略版）',
      description: '一覧、検索、アーティストやエントリーのページで使う簡略版のアルバム。`titles` がなく、原題しか表示できません。',
      fields: {
        id: 'アルバム ID。ページの URL は `{{site}}/albums/{id}` です。',
        title: '原題。パッケージに印刷されている名前です。',
        type: 'アルバムの種類。',
        categories: 'アルバムのカテゴリー。複数の場合があります。空の配列は作曲家の作品集で、どの作品の企画にも属さないことを表します。',
        release_date: '発売日。',
        catalog_number: '品番。品番のある最初のエディションのものです。範囲の場合もあります。例：`KECH-8059~62`。',
        image_url: 'ジャケット。長辺最大 1200px。',
        disc_count: 'ディスク枚数：最初のエディションのディスクで、特典ディスクは含みません。',
        track_count: 'それらのディスクのトラック数。',
        duration: 'それらのトラックの合計時間（秒）。長さが不明なトラックは含みません。',
        disc_formats: 'それらのディスクのメディア。重複を除いています。',
        is_adult: '成人向けの目印。',
        favorites_count: 'お気に入り数。',
        reviews_count: 'レビュー数。',
        views_count: '閲覧数。5 分ごとに更新されます。',
        byline: 'タイトルの下に表示する 1 行のクレジット表記：発売元がある場合はすべての発売元、ない場合は名義のアーティストです。どちらもない場合は `null`。',
      },
    },
    Album: {
      title: 'アルバム',
      description: 'アルバムの詳細。',
      fields: {
        'description': '紹介文。',
        'banner_url': 'アルバムページのバナー画像。',
        'release_event': '頒布イベント（初頒布のイベント）。',
        'release_event.id': 'イベント ID。',
        'release_event.name': 'イベント名。',
        'release_event.slug': 'イベントのスラッグ。',
        'release_event.main_visual_url': 'イベントのメインビジュアル。',
        'release_event.start_date': 'イベントの開始日。',
        'cover': 'ジャケット画像。原寸と 2 種類のサムネイルの URL があります。',
        'discs': 'ディスク。順番に並び、それぞれのトラックを含みます。',
        'tracklist_languages': 'トラックリストにどの言語の名前があるか、また言語ごとに名前のあるトラックの数。',
        'tracklist_languages.locale': '言語（BCP 47）。',
        'tracklist_languages.kind': '名前の種類：`official`、`translation`、`transliteration` のいずれか。',
        'tracklist_languages.count': 'この言語の名前があるトラックの数。',
        'tracklist_languages.total': 'トラックの総数。',
        'credits': 'アルバム全体のクレジット。「アーティスト・発売」グループ（`category` が `release`）も含みます。',
        'products': 'エディション。例：初回限定盤と通常盤。',
        'bonuses': '特典。例：店舗特典、会場特典。',
        'images': 'アルバムの画像：ジャケット、裏面、ブックレット、盤面など。',
        'attributes': '補足情報。例：ジャケットのキャラクター。',
        'streaming': 'ストリーミングのリンク。ほかのリンクとは別になっています。',
        'entries': '関連エントリー（原作）。',
        'entries.id': 'エントリー ID。',
        'entries.name': 'エントリー名（原題）。',
        'entries.type': 'エントリーの種類。',
        'entries.format': 'エントリーのサブタイプ。',
        'entries.image_url': 'エントリーの画像。',
        'entries.release_date': 'エントリーの発売日。',
        'entries.relation_type': 'アルバムとエントリーの関係。例：サウンドトラック、オープニング。',
        'entries.note': '関係の補足。',
        'entries.franchises': 'エントリーが属するシリーズ。',
        'entries.franchises.id': 'シリーズ ID。',
        'entries.franchises.name': 'シリーズ名（原題）。',
        'entries.franchises.parent_id': '親シリーズの ID。最上位のシリーズでは `null`。',
        'franchises': 'シリーズ全体に直接属するアルバムにだけあります。例：周年記念盤。',
        'franchises.id': 'シリーズ ID。',
        'franchises.name': 'シリーズ名（原題）。',
        'franchises.image_url': 'シリーズの画像。',
        'tracking_stats': 'ユーザーが付けたトラッキングのステータスごとの人数。',
        'tracking_stats.plan_to_listen': '聴きたい。',
        'tracking_stats.completed': '聴いた。',
        'tracking_stats.wishlist': 'ウィッシュリスト。',
        'tracking_stats.owned': '入手済み。',
        'tracking_stats.dropped': '興味なし。',
        'rating': '平均評価。1〜5 で小数点以下 2 桁。誰も評価していない場合は `null`。',
        'rating_count': '評価した人数。',
        'rating_distribution': '1〜5 のそれぞれの評価をした人数。誰も評価していない場合は `null`。',
        'ranking': '評価ランキングの順位。1 日 1 回更新されます。まだ誰も評価していない場合は `null`。',
        'articles': 'このアルバムを紹介する記事。最大 5 件。',
        'articles.id': '記事 ID。',
        'articles.title': '記事のタイトル。',
        'articles.cover_url': '記事のカバー画像。',
        'articles.published_at': '公開日時（UTC）。',
        'contributors': 'このアルバムを編集したユーザー。1 日 1 回更新されます。',
        'contributors.username': 'ユーザー名。',
        'contributors.nickname': 'ニックネーム。',
        'contributors.avatar_url': 'アイコン画像。',
        'user_tracking': '現在のユーザーが付けたトラッキングのステータス。サイトにログインしているときだけ意味があり、それ以外のリクエストでは常に `null` です。',
        'user_tracking.status': 'ステータス：`plan_to_listen`、`completed`、`wishlist`、`owned`、`dropped` のいずれか。',
        'edited_at': '現在のバージョンの編集日時（UTC）。`updated_at` と違い、閲覧数などの変化には影響されません。',
      },
    },
    Disc: {
      title: 'ディスク',
      description: 'アルバムに含まれる 1 枚のディスク：CD、BD、アナログ、配信など。',
      fields: {
        id: 'ディスク ID。',
        position: '何枚目か。1 から始まります。',
        title: 'ディスク名。例：「DISC 2 Instrumental」。ない場合は `null`。',
        format: 'メディア。',
        bonus_id: '特典に付くディスクにだけあり、その特典を指します。',
        tracks: 'このディスクのトラック。トラック番号順です。',
      },
    },
    AlbumTrack: {
      title: 'アルバムのトラック',
      description: 'アルバムの詳細に含まれるトラック。トラック自身のクレジットと原曲を含みます。',
      fields: {
        id: 'トラック ID。',
        disc_number: 'ディスク番号。',
        track_number: 'トラック番号。同じディスク内で一意です。',
        number_label: '表示用の番号。トラック番号と異なる場合だけ含まれます。例：アナログ盤の `A1`。',
        title: '曲名。パッケージに印刷されている名前です。',
        duration: '長さ（秒）。不明な場合は `null`。',
        is_instrumental: 'インストゥルメンタルかどうか。',
        isrc: '国際標準レコーディングコード（ISRC）。',
        favorites_count: 'お気に入り数。',
        has_lyrics: '原文の歌詞があるかどうか。',
        lyrics_count: '歌詞の数。翻訳を含みます。',
        translations_count: 'そのうちの翻訳の数。',
        originals: '原曲：このトラックがどの曲のアレンジ、カバー、リミックスか。',
        credits: 'このトラックのクレジット。',
        attributes: '補足情報。例：BPM。',
      },
    },
    Track: {
      title: 'トラック',
      description: 'トラックの詳細。',
      fields: {
        'id': 'トラック ID。',
        'album_id': '収録アルバムの ID。',
        'disc_id': '収録ディスクの ID。',
        'disc_number': 'ディスク番号。',
        'track_number': 'トラック番号。',
        'number_label': '表示用の番号。例：アナログ盤の `A1`。',
        'title': '曲名（原題）。',
        'duration': '長さ（秒）。不明な場合は `null`。',
        'is_instrumental': 'インストゥルメンタルかどうか。',
        'isrc': '国際標準レコーディングコード（ISRC）。',
        'has_lyrics': '原文の歌詞があるかどうか。',
        'lyrics_count': '歌詞の数。翻訳を含みます。',
        'translations_count': 'そのうちの翻訳の数。',
        'favorites_count': 'お気に入り数。',
        'originals': '原曲。',
        'derived_tracks': 'このトラックを原曲とするトラック。例：このトラックのアレンジやカバー。',
        'derived_tracks.id': 'トラック ID。',
        'derived_tracks.title': '曲名（原題）。',
        'derived_tracks.album': 'そのトラックの収録アルバム。',
        'album': '収録アルバム。',
        'album_tracks': '同じアルバムのすべてのトラック。ディスクとトラック番号の順で、前後のトラックへの移動に使えます。',
        'album_tracks.id': 'トラック ID。',
        'album_tracks.disc_number': 'ディスク番号。',
        'album_tracks.track_number': 'トラック番号。',
        'album_tracks.number_label': '表示用の番号。',
        'album_tracks.title': '曲名（原題）。',
        'album_tracks.duration': '長さ（秒）。',
        'album_tracks.has_lyrics': '原文の歌詞があるかどうか。',
        'credits': 'このトラックのクレジット。',
        'credits.id': 'ID。',
        'credits.role': '役割の key。名前は `/catalog/schema` の `credit_roles` を参照してください。',
        'credits.detail': '補足。例：担当した楽器や役名。',
        'credits.credited_as': 'クレジット名義。アーティスト名と異なる場合だけ含まれます。',
        'credits.artist': 'アーティスト。名義だけが分かっていて、対応するアーティストがまだない場合は `null`。',
        'credits.artist.id': 'アーティスト ID。',
        'credits.artist.name': 'アーティスト名（原語）。',
        'attributes': '補足情報。',
      },
    },
    Credit: {
      title: 'クレジット',
      description: 'あるアーティストがアルバムまたはトラックで担う 1 つの役割。同じ人が複数の役割を担う場合は、役割の数だけあります。',
      fields: {
        'id': 'ID。',
        'role': '役割の key。例：`composer`。名前は `/catalog/schema` の `credit_roles` を参照してください。「アーティスト・発売」グループの 6 つの役割は [release_role](#enum-release-role) を参照してください。',
        'category': '役割の分類。',
        'artist': 'アーティスト。名義だけが分かっていて、対応するアーティストがまだない場合は `null`。',
        'artist.id': 'アーティスト ID。',
        'artist.name': 'アーティスト名（原語）。',
        'artist.image_url': 'アイコン画像。',
        'artist.type': 'アーティストの種類。',
        'credited_as': 'クレジット名義。アルバムに印刷されている名前で、アーティスト名と異なる場合だけ含まれます。',
        'detail': '補足。例：担当した楽器や、声を担当したキャラクター。',
      },
    },
    Product: {
      title: 'エディション',
      description: '購入できる 1 つの形態。例：初回限定盤、通常盤、配信版。それぞれ、含まれるディスクを指定します。',
      fields: {
        id: 'エディション ID。',
        name: 'エディション名。例：「初回限定盤」。',
        edition_type: '通常盤か限定盤か。',
        limited_rule: '限定の方法。限定盤にだけあります。',
        limited_name: '限定盤の名前。',
        medium: 'フィジカルかデジタルか。',
        catalog_number: '品番。',
        barcode: 'バーコード（JAN / EAN / UPC）。',
        release_date: 'このエディションの発売日。`null` の場合はアルバムと同じです。',
        region: '発売地域。ISO 3166-1 の 2 文字のコード。例：`JP`。',
        price: '定価。文字列です。例：`"3300.00"`。',
        currency: '通貨。ISO 4217 のコード。例：`JPY`。',
        is_hires: 'ハイレゾ音源かどうか。',
        is_available: '現在も販売中かどうか。',
        sort_order: '表示順。',
        disc_ids: 'このエディションに含まれるディスクの ID。',
        format_label: '表示用の仕様。例：`2CD+BD`。配信版は `DL`。',
      },
    },
    Bonus: {
      title: '特典',
      description: '店舗特典、会場特典、初回特典など。特典 CD は、`bonus_id` がこの特典を指すディスクです。',
      fields: {
        'id': '特典 ID。',
        'name': '特典名。',
        'type': '特典の種類。',
        'description': '説明。',
        'is_digital': 'デジタル特典かどうか。',
        'shop': '店舗名。例：「とらのあな」。',
        'availability': '入手方法。',
        'note': '条件。例：「購入者全員」「抽選」。',
        'sort_order': '表示順。',
        'event': '会場特典に対応するイベント。',
        'event.id': 'イベント ID。',
        'event.name': 'イベント名。',
        'event.slug': 'イベントのスラッグ。',
        'product_ids': 'どのエディションに付くか。空の配列はすべてのエディションに付くことを表します。',
        'disc_ids': 'この特典に付くディスク。',
      },
    },
    AlbumImage: {
      title: 'アルバムの画像',
      description: 'アルバムでの画像の用途：ジャケット、裏面、ブックレットのページなど。',
      fields: {
        id: 'ID。',
        kind: '画像の種類。',
        label: '補足。例：ブックレットのページ番号「p. 01-02」。',
        caption: '画像の説明。',
        product_id: '特定のエディションにだけ属する場合にあります。',
        bonus_id: '特定の特典にだけ属する場合にあります。',
        disc_id: '特定のディスクにだけ属する場合にあります。',
        sort_order: '表示順。',
        image: '画像ファイル。',
        attributes: '補足情報。例：ジャケットのキャラクター。',
      },
    },
    Original: {
      title: '原曲',
      description: 'トラックがどの曲のアレンジ、カバー、リミックスか：データベース内の別のトラック、またはテキストだけの場合があります。',
      fields: {
        'title': '原曲の曲名。データベース内のトラックを指す場合は、そのトラックの曲名です。',
        'track': '原曲がデータベース内のトラックの場合にだけあり、それ以外は `null`。',
        'track.id': '原曲のトラック ID。',
        'track.album': '原曲の収録アルバム。',
        'track.album.id': 'アルバム ID。',
        'track.album.title': 'アルバム名（原題）。',
      },
    },
    LyricSummary: {
      title: '歌詞（概要）',
      description: '1 つの歌詞の概要。本文は含みません。',
      fields: {
        'id': '歌詞 ID。',
        'track_id': 'トラック ID。',
        'kind': '原文、翻訳、音訳のどれか。',
        'language': '言語（BCP 47）。例：`ja`、`zh-Hans`、`ja-Latn`。',
        'translation_of_id': '翻訳と音訳にだけあります：対応する原文の歌詞 ID で、行ごとに対照できます。',
        'format': '本文の形式。',
        'translator': '訳者のクレジット。',
        'is_ai_generated': '機械翻訳かどうか。',
        'creator': 'この歌詞を最初に投稿したユーザー。アカウントが削除された場合は `null`。',
        'creator.id': 'ユーザー ID。',
        'creator.username': 'ユーザー名。',
        'creator.nickname': 'ニックネーム。',
        'creator.avatar_url': 'アイコン画像。',
      },
    },
    Lyric: {
      title: '歌詞',
      description: '1 つの歌詞の全体。',
      fields: {
        'content': '本文。形式が `lrc` と `srt` の場合はタイムタグ付きです。',
        'source': '出典。例：「歌詞カード」。',
        'track': '対象のトラック。',
        'track.id': 'トラック ID。',
        'track.title': '曲名（原題）。',
        'track.track_number': 'トラック番号。',
        'track.disc_number': 'ディスク番号。',
        'track.album': '収録アルバム。',
      },
    },
    Artist: {
      title: 'アーティスト',
      description: '一覧と詳細の両方で使うオブジェクトです。「含まれない場合あり」と書かれたフィールドは詳細でだけ返します。',
      fields: {
        'id': 'アーティスト ID。ページの URL は `{{site}}/artists/{id}` です。',
        'name': 'メインの名前。通常は原語の名前です。',
        'type': 'アーティストの種類。',
        'is_active': '現在も活動しているかどうか。個人が亡くなった場合やグループが解散した場合は `false`。',
        'bio': '紹介文。Markdown。',
        'image_url': 'アイコン画像。',
        'followers_count': 'このアーティストをフォローしている人数。',
        'albums_count': '参加アルバム数。役割は問いません。',
        'releases_count': '「リリース」の数。[アーティストのリリース](#get-artists-id-albums)を参照してください。',
        'credited_albums_count': '「参加作品」の数。[アーティストの参加作品](#get-artists-id-tracks)を参照してください。',
        'catalog_prefixes': '品番プレフィックス。例：`["LACA"]`。企業と、レーベルを兼ねるサークルにだけあります。',
        'shouts_count': 'アーティストページのひとことの数。',
        'attributes': '補足情報。',
        'relations': '関連アーティスト。このアーティストから見た関係です。',
        'relations.artist': '相手。',
        'relations.artist.id': 'アーティスト ID。',
        'relations.artist.name': '名前（原語）。',
        'relations.artist.image_url': 'アイコン画像。',
        'relations.artist.type': 'アーティストの種類。',
        'relations.relation_type': '関係。例：`has_member` は相手がこのグループのメンバーであることを表します。',
        'relations.note': '補足。',
      },
    },
    EventSeries: {
      title: 'イベントシリーズ',
      description: '例：M3、コミックマーケット。',
      fields: {
        id: 'イベントシリーズ ID。ページの URL は `{{site}}/event-series/{id}` です。',
        name: '名前。',
        slug: 'スラッグ。',
        location: '開催する都市または地域。',
        description: '紹介文。言語ごとに分かれたオブジェクトです。例：`{ "ja": "…", "en": "…" }`。すべての言語があるとは限りません。',
        website: '公式サイト。',
        banner_url: 'バナー画像。',
        visual_orientation: '各回のメインビジュアルの向き：縦長（カタログの表紙）または横長。',
        events_count: '開催回数。',
        latest_start_date: '最新の回の開始日。一覧にだけあります。',
      },
    },
    Event: {
      title: 'イベント',
      description: '1 回分のイベント。「含まれない場合あり」と書かれたフィールドは詳細でだけ返します。',
      fields: {
        'id': 'イベント ID。ページの URL は `{{site}}/events/{id}` です。',
        'event_series_id': '所属するイベントシリーズ。単独で開催されるイベントでは `null`。',
        'series': '所属するイベントシリーズ。',
        'series.id': 'イベントシリーズ ID。',
        'series.name': '名前。',
        'series.slug': 'スラッグ。',
        'series.website': '公式サイト。',
        'series.visual_orientation': 'メインビジュアルの向き。',
        'name': '名前。例：「M3-2026秋」。',
        'slug': 'スラッグ。',
        'start_date': '開始日。',
        'end_date': '終了日。1 日だけの場合は `null`。',
        'start_time': '開場時刻 `HH:MM`。会場の現地時刻です。',
        'end_time': '終了時刻 `HH:MM`。',
        'venue': '会場。',
        'location': '都市または地域。',
        'website_url': 'この回独自のサイト。シリーズの公式サイトは `series.website` にあります。',
        'description': '紹介文。言語ごとに分かれたオブジェクトです。',
        'main_visual_url': 'メインビジュアルまたはカタログの表紙。',
        'main_visual_width': 'メインビジュアルの幅（ピクセル）。',
        'main_visual_height': 'メインビジュアルの高さ（ピクセル）。',
        'key_visuals': 'その他のビジュアル。形式はまだ決まっていないので、依存しないでください。',
        'meta': '取り込み時に書き込まれた補足情報。例：ジャンルコードの名前。形式は変わる可能性があります。',
        'albums_count': '管理画面で手入力された頒布アルバム数で、自動では更新されません。`released_albums_count` を使ってください。',
        'artists_count': '管理画面で手入力された参加サークル数で、自動では更新されません。',
        'released_albums_count': 'この回で初頒布されたアルバムの数。リアルタイムで集計し、承認待ちのアルバムも含みます。',
        'booths_count': '参加サークル数。配置図外での参加も含みます。',
        'has_map': '配置図があるかどうか。',
      },
    },
    EventMap: {
      title: '会場配置図',
      description: '1 回分のイベントの配置図。座標の単位は配置図 PDF の pt で、原点は左上、y 軸は下向きです。',
      fields: {
        'width': '図全体の幅。',
        'height': '図全体の高さ。',
        'background': '壁、柱、エリアなどの背景の図形。描画順に並んでいます。',
        'background.d': 'SVG の path データ。',
        'background.s': '明度。0 は壁、1 は床。',
        'background.e': '`1` の場合は even-odd の塗りつぶし規則を使います。',
        'background.w': '線の幅。ない場合は塗りつぶしだけです。',
        'labels': '会場内のテキストとブロック記号。',
        'labels.text': 'テキスト。',
        'labels.x': '位置の x。',
        'labels.y': '位置の y。',
        'labels.size': '文字サイズ。',
        'labels.rotate': '回転角度（度）。',
        'labels.vertical': '縦書きかどうか。',
        'labels.kind': '`area` の場合はブロック記号（A、あ……）です。',
        'halls': 'ホールとフロア。順番に並んでいます。',
        'halls.id': 'ホール ID。`spaces` の `hall_id` にあたります。',
        'halls.building': '建物。例：「第一展示場」。',
        'halls.floor': 'フロア。例：`2F`。',
        'halls.name': '表示用の名前。',
        'halls.bbox': '図上のホールの範囲 `[x, y, w, h]`。',
        'spaces': '机 1 台につき 1 項目で、配列 `[id, hall_id, area, number, x, y, w, h]` です。参加サークルの `space_id` はここの `id` を指します。',
        'genres': 'ジャンルコードの名前。例：`{ "201": { "label": "オリジナル", "group": "music" } }`。',
      },
    },
    EventBooth: {
      title: '参加サークル',
      description: '主催者のリストにある 1 件の参加情報を、そのまま保存したものです。複数のサークルによる合同参加の場合もあり、名前に読みや説明が含まれることもあります。',
      fields: {
        'id': '参加サークル ID。',
        'space_id': '配置された机。配置図の `spaces` の `id` にあたります。配置図外での参加の場合は `null`。',
        'space_code': 'スペース番号。例：`A-01a`。',
        'area': 'ブロック。例：`A`。',
        'sub': '机のどの部分を使うか：`a`、`b` は半分、`ab` は 1 台全体、`x`、`y`、`z` はミニスペースで 3 分の 1 です。',
        'name': 'サークル名。主催者の表記のままです。',
        'name_kana': '名前の読み。',
        'description': '主催者のリストにある説明。',
        'genre': 'ジャンルコード。名前は配置図の `genres` を参照してください。',
        'keywords': 'キーワード。',
        'links': '主催者のリストにあるリンク。',
        'links.type': 'リンクの種類。例：`website`。',
        'links.url': 'URL。',
        'twitter_handle': 'X（Twitter）のアカウント。小文字で、@ は付きません。',
        'image_url': 'サークルカット。CDCat に保存済みです。',
        'embeds': '埋め込み動画。',
        'embeds.type': '現在は `youtube` だけです。',
        'embeds.id': '動画 ID。',
        'is_adult': '成人向けの目印。API では除外しません。',
        'artists': '関連するアーティスト。複数のことも、いないこともあります。',
        'artists.id': 'アーティスト ID。',
        'artists.name': '名前（原語）。',
        'artists.image_url': 'アイコン画像。',
        'album_ids': 'これらのアーティストがこの回で初頒布したアルバムの ID。',
      },
    },
    Entry: {
      title: 'エントリー',
      description: '一覧と詳細の両方で使うオブジェクトです。「含まれない場合あり」と書かれたフィールドは詳細でだけ返します。',
      fields: {
        'id': 'エントリー ID。ページの URL は `{{site}}/entries/{id}` です。',
        'name': 'メインの名前。通常は原題です。',
        'type': 'エントリーの種類。',
        'format': 'サブタイプ。選べる値は種類によって異なります。[entry_type](#enum-entry-type) を参照してください。',
        'platforms': 'ゲームのプラットフォーム。例：`["Switch", "PC"]`。ゲーム以外では空の配列です。',
        'release_date': '発売日または初放送日。',
        'description': '紹介文。プレーンテキスト。',
        'image_url': '画像。ほかのサイトにある場合があります。',
        'banner_url': 'バナー画像。',
        'albums_count': '関連アルバム数。承認待ちのものも含みます。',
        'albums': '関連アルバム。発売日順です。',
        'albums.relation_type': 'アルバムとエントリーの関係。',
        'albums.note': '関係の補足。',
        'franchises': '所属するシリーズ。',
        'franchises.id': 'シリーズ ID。',
        'franchises.name': 'シリーズ名（原題）。',
        'franchises.image_url': 'シリーズの画像。',
        'franchises.parent': '親シリーズ。最上位のシリーズでは `null`。',
        'franchises.parent.id': '親シリーズの ID。',
        'franchises.parent.name': '親シリーズの名前。',
        'related_entries': '関連エントリー。このエントリーから見た関係です：`sequel` は相手がこのエントリーの続編であることを表します。',
        'related_entries.id': 'エントリー ID。',
        'related_entries.name': '名前（原題）。',
        'related_entries.type': 'エントリーの種類。',
        'related_entries.format': 'サブタイプ。',
        'related_entries.image_url': '画像。',
        'related_entries.release_date': '発売日。',
        'related_entries.relation_type': '関係。',
        'related_entries.note': '補足。',
        'sort_order': 'シリーズの詳細のエントリーにだけあります：シリーズ内での順番。',
      },
    },
    Franchise: {
      title: 'シリーズ',
      description: '一覧と詳細の両方で使うオブジェクトです。「含まれない場合あり」と書かれたフィールドは詳細でだけ返します。統計はすべてサブシリーズを含みます。',
      fields: {
        'id': 'シリーズ ID。ページの URL は `{{site}}/franchises/{id}` です。',
        'name': 'メインの名前。通常は原題です。',
        'parent_id': '親シリーズの ID。最上位のシリーズでは `null`。',
        'description': '紹介文。プレーンテキスト。',
        'image_url': '画像。ほかのサイトにある場合があります。',
        'banner_url': 'バナー画像。',
        'sort_order': '親シリーズ内での順番。',
        'entries_count': 'エントリー数。サブシリーズのエントリーを含み、重複を除いています。',
        'albums_count': 'アルバム数：エントリー経由で関連するものと、シリーズ全体のものを合わせ、重複を除いています。',
        'children_count': 'サブシリーズ数。',
        'parent': '親シリーズ。最上位のシリーズでは `null`。`children` のサブシリーズにはこのフィールドはありません。',
        'parent.id': '親シリーズの ID。',
        'parent.name': '親シリーズの名前。',
        'children': 'サブシリーズ。それぞれの統計、その他の名称、エントリーを含み、外部リンクは含みません。',
        'entries': 'このシリーズに直接属するエントリー。順番と発売日の順に並び、`sort_order` を含みます。',
        'albums': 'シリーズ全体のアルバム。例：周年記念盤。',
        'albums.sort_order': 'シリーズ内での順番。',
      },
    },
    SearchResult: {
      title: '検索結果',
      description: '1 件の検索結果。5 つの種類で共通です。',
      fields: {
        'type': '結果の種類。',
        'id': 'この結果自体の ID。',
        'title': '原題。',
        'image_url': '画像。',
        'meta': 'サブタイトル用の情報で、種類によって異なります：アルバムは `artist_credit`、`catalog_number`、`release_date`、`release_date_precision`、`album_type`、`disc_formats`。トラックは `album_id`、`album_title`、`disc_number`、`track_number`、`duration`。アーティストは `artist_type`。エントリーは `entry_type`、`release_date`。シリーズは `parent`（`{ id, name }` または `null`）。',
        'album': 'アルバムとトラックの結果にだけあります：そのアルバム、またはトラックの収録アルバム。',
        'matched': 'どの名称に一致したか。原題に一致した場合は `null`。',
        'matched.field': '一致したフィールド。',
        'matched.text': '一致したテキスト。',
        'matched.locale': 'この名称の言語。',
      },
    },
    LinkProvider: {
      title: 'リンクの提供元',
      description: '外部リンクのリンク先サイト。例：公式サイト、X、VGMdb。',
      fields: {
        id: '提供元 ID。',
        name: '識別子。例：`x`、`vgmdb`。表示名ではありません。',
        icon_url: 'アイコン。',
        url_pattern: 'URL のワイルドカードパターン。例：`https://x.com/*`。ユーザーが貼り付けたリンクの判別に使えます。ない場合は `null`。',
        category: '分類。',
      },
    },
    Title: {
      title: 'その他の名称',
      description: '原題以外の名称。`official`、`translation`、`transliteration` は言語ごとに 1 つまでで、別名と略称は数に制限がありません。',
      fields: {
        title: '名称。',
        locale: '言語（BCP 47）。例：`ja`、`zh-Hans`、`en`。ローマ字は `ja-Latn`、かなの読みは `ja-Hrkt` です。別名と略称では `null` の場合があります。',
        kind: '名称の種類。',
      },
    },
    Link: {
      title: '外部リンク',
      description: 'ほかのサイトへのリンク。例：公式サイト、SNS アカウント、ストリーミング、データベース。',
      fields: {
        'id': 'リンク ID。',
        'url': 'URL。',
        'external_id': 'そのサイトでの ID。例：Bangumi の `subject/12345`。特定できない場合は `null`。',
        'is_verified': '確認済みかどうか。',
        'provider': 'リンクの提供元。提供元が削除された場合は `null`。',
        'provider.id': '提供元 ID。',
        'provider.name': '識別子。例：`x`。',
        'provider.icon_url': 'アイコン。',
        'provider.category': '分類。',
      },
    },
    Image: {
      title: '画像',
      description: 'CDCat にアップロードされた画像。原寸がサムネイルより小さい場合、サムネイルの URL は原寸の画像と同じです。',
      fields: {
        id: '画像 ID。',
        url: '原寸の画像（WebP）。',
        thumbnail_url: '長辺最大 300px のサムネイル。',
        medium_url: '長辺最大 1200px のサムネイル。',
        width: '原寸の幅（ピクセル）。',
        height: '原寸の高さ（ピクセル）。',
        mime: 'MIME タイプ。例：`image/webp`。',
      },
    },
    Byline: {
      title: 'クレジット表記',
      description: 'タイトルの下に表示する 1 行のクレジット表記。アルバムの保存時に算出されます。',
      fields: {
        'role': '`publisher` の場合はアルバム全体のすべての発売元、`artist` の場合はすべての名義のアーティストです。',
        'artists': '表記されるアーティスト。クレジットの順に並びます。',
        'artists.id': 'アーティスト ID。名義だけで、対応するアーティストがない場合は `null`。',
        'artists.name': 'クレジット名義。名義が別にない場合はアーティスト名です。',
      },
    },
    Attribute: {
      title: '属性',
      description: '管理画面で定義された補足情報。例：ジャケットのキャラクター、BPM。定義は `/catalog/schema` の `attribute_definitions` を参照してください。',
      fields: {
        id: 'ID。',
        key: '属性の key。例：`cover_character`。',
        value: '値。タイプは属性によって異なります：テキスト、URL、選択肢は文字列、整数は数値、小数は文字列、真偽値は `true` / `false`、日付は `{ date, precision }`、参照は `{ type, id }`（例：`{ "type": "entry", "id": 12 }`）です。',
        label: '参照タイプの属性にだけあります：参照先の名前。',
        sort_order: '表示順。',
      },
    },
    Pagination: {
      title: 'ページネーション',
      description: '一覧のエンドポイントのページネーション情報。',
      fields: {
        total: '全体の件数。',
        per_page: '1 ページあたりの件数。',
        current_page: '現在のページ番号。',
        last_page: '最後のページの番号。',
      },
    },
    Error: {
      title: 'エラー',
      description: 'エラーのときに `error` に入るオブジェクト。',
      fields: {
        code: '数値のエラーコード。',
        name: 'エラー名。例：`RESOURCE_NOT_FOUND`。エラーの種類の判定にはこれを使ってください。',
        message: '英語の説明。デバッグ専用で、変わる可能性があります。',
        details: 'パラメータのエラーではパラメータ名ごとの理由、レート制限の超過では `{ retry_after }` です。',
      },
    },
  },

  enums: {
    album_type: {
      title: 'アルバムの種類',
      description: 'アルバムの形態。Spotify の album_type に似ています。',
      values: {
        album: 'アルバム。',
        ep: 'EP、ミニアルバム。',
        single: 'シングル。',
        compilation: 'コンピレーション、ベスト盤。',
        drama: 'ドラマ CD、オーディオドラマの CD。',
        radio: 'ラジオ番組の CD。',
      },
    },
    album_category: {
      title: 'アルバムのカテゴリー',
      description: 'アルバムの音楽がどこから来たものか。複数の場合があります。空の配列は作曲家の作品集で、どの作品の企画にも属さないことを表します。',
      values: {
        game: 'ゲーム音楽。ゲームに関連していても、特定のゲームに対応しないものを含みます。',
        animation: 'アニメ音楽。',
        publication: '漫画、ライトノベルなどの出版物。',
        audio_drama: 'ドラマ CD、オーディオドラマ。',
        tokusatsu: '特撮と人形劇。',
        live_action: '映画、テレビドラマ、舞台。',
        doujin: '同人サークルや個人が自主制作した音楽。オリジナルも二次創作も含みます。',
        event: 'イベントのために作られた音楽。例：展示会、公演、大会のテーマ曲。',
      },
    },
    disc_format: {
      title: 'ディスクのメディア',
      description: 'HQCD、SHM-CD などの派生規格は `cd` として記録します。',
      values: {
        cd: 'CD。',
        sacd: 'SACD。',
        dvd: 'DVD。',
        bd: 'Blu-ray。',
        vinyl: 'アナログレコード。',
        cassette: 'カセットテープ。',
        digital: '配信（デジタル）。',
        other: 'その他。',
      },
    },
    date_precision: {
      title: '日付の精度',
      description: '日付がどの単位まで正確か。',
      values: {
        day: '日まで正確。',
        month: '年月だけが分かっていて、日付はその月の 1 日として記録されます。',
        year: '年だけが分かっていて、日付はその年の 1 月 1 日として記録されます。',
      },
    },
    title_kind: {
      title: '名称の種類',
      description: 'その他の名称（Title）がどのような名称か。',
      values: {
        official: '公式の他言語の名称。例：パッケージ裏面に印刷された英語名。',
        translation: '非公式の翻訳。',
        transliteration: '音訳、ローマ字、かなの読み。',
        alias: '別名、旧名。',
        abbreviation: '略称。',
      },
    },
    artist_type: {
      title: 'アーティストの種類',
      description: 'アーティストが何であるか。',
      values: {
        person: '個人。',
        group: 'グループ、バンド。',
        circle: '同人サークル。',
        company: '企業：レコード会社、レーベル、発売元、制作会社、スタジオ。',
        virtual: 'バーチャルシンガー、VTuber。',
        character: 'キャラクターソングを歌うキャラクター。',
      },
    },
    artist_relation: {
      title: 'アーティストの関係',
      description: '現在のアーティストから見た関係で、双方にそれぞれ 1 つずつ表示されます。',
      values: {
        member_of: '現在のアーティストが相手のメンバー。',
        has_member: '相手が現在のグループのメンバー。',
        voice_of: '現在のアーティストが相手（キャラクター）の声を担当。',
        voiced_by: '相手が現在のキャラクターの声を担当。',
        persona_of: '現在のアーティストが相手の別名義。',
        has_persona: '相手が現在のアーティストの別名義。',
        subunit_of: '現在のアーティストが相手の派生ユニット。',
        has_subunit: '相手が現在のグループの派生ユニット。',
        related: 'その他の関連。',
      },
    },
    credit_role_category: {
      title: '役割の分類',
      description: 'クレジットの役割のグループ。具体的な役割は `/catalog/schema` の `credit_roles` を参照してください。',
      values: {
        release: 'アーティスト・発売：名義のアーティスト、発売元、レーベルなど。[release_role](#enum-release-role) を参照してください。',
        composition: '作曲。',
        lyrics: '作詞。',
        arrangement: '編曲、リミックス。',
        vocals: '歌唱、コーラス、声の出演。',
        performance: '演奏、オーケストラ、指揮。',
        production: 'プロデューサー、ディレクター。',
        engineering: 'レコーディング、ミキシング、マスタリング。',
        artwork: 'イラスト、デザイン、写真。',
        other: 'その他。',
      },
    },
    release_role: {
      title: 'アーティスト・発売',
      description: '「アーティスト・発売」グループの 6 つの役割で、`credits[].role` の一部です。アルバムのクレジット表記（Byline）はここから算出されます。',
      values: {
        artist: 'アーティスト：ジャケットやトラックに名義が記載されたアーティスト。',
        publisher: '発売元。アルバム全体にだけ使います。',
        label: 'レーベル。アルバム全体にだけ使います。',
        distributor: '販売元。アルバム全体にだけ使います。',
        manufacturer: '製造元。アルバム全体にだけ使います。',
        planning: '企画。アルバム全体にだけ使います。',
      },
    },
    edition_type: {
      title: 'エディションの種類',
      description: '通常盤か限定盤か。',
      values: {
        regular: '通常盤。',
        limited: '限定盤。限定の方法は `limited_rule` を参照してください。',
      },
    },
    limited_rule: {
      title: '限定の方法',
      description: '限定盤と特典の入手条件。',
      values: {
        first_press: '初回限定。',
        count: '数量限定。',
        period: '期間限定。',
        shop: '店舗限定。',
        event: '会場限定。',
        region: '地域限定。',
      },
    },
    product_medium: {
      title: 'エディションのメディア',
      description: 'フィジカルかデジタルか。',
      values: {
        physical: 'フィジカル。',
        digital: 'デジタル（配信）。',
      },
    },
    bonus_type: {
      title: '特典の種類',
      description: '特典が何であるか。',
      values: {
        bonus_track: '特典曲。',
        bonus_disc: '特典ディスク。',
        booklet: 'ブックレット。',
        photo_item: '写真、カード類。',
        goods: 'グッズ。',
        digital_content: 'デジタルコンテンツ。',
        serial_code: 'シリアルコード。',
        event_entry: 'イベント応募券。',
        signed_item: 'サイン入りアイテム。',
        other: 'その他。',
      },
    },
    image_kind: {
      title: '画像の種類',
      description: 'アルバムでの画像の用途。VGMdb の分類を参考にしています。',
      values: {
        cover: 'アルバムのジャケット。正方形で、各アルバムにちょうど 1 枚です。',
        front: '表面。',
        back: '裏面。',
        booklet: 'ブックレット。ページ番号は `label` に書きます。',
        disc: '盤面。',
        disc_back: 'ディスクの裏面。',
        obi_front: '帯の表面。',
        obi_back: '帯の裏面。',
        tray: 'トレイ。',
        box: '外箱。',
        sticker: 'ステッカー。',
        bonus_item: '特典のアイテム。',
        illustration: 'イラスト。',
        other: 'その他。',
      },
    },
    lyric_kind: {
      title: '歌詞の種類',
      description: '歌詞が原文、翻訳、音訳のどれか。',
      values: {
        original: '原文。各トラックに 1 つまで。',
        translation: '翻訳。',
        transliteration: '音訳、ローマ字。',
      },
    },
    lyric_format: {
      title: '歌詞の形式',
      description: '歌詞の本文の書き方。',
      values: {
        plain: 'プレーンテキスト。',
        lrc: 'LRC。タイムタグ付き。',
        srt: 'SRT 字幕。タイムタグ付き。',
      },
    },
    entry_type: {
      title: 'エントリーの種類',
      description: 'エントリーがどのような作品か。サブタイプ `format` は種類によって異なります：アニメは `tv`、`movie`、`ova`、`web`、`special`。ゲームは `full`、`dlc`、`expansion`。ドラマは `series`、`special`。書籍は `novel`、`light_novel`、`other`。漫画は `serial`、`oneshot`。舞台は `musical`、`play`。映画とその他にはサブタイプがありません。',
      values: {
        anime: 'アニメ。劇場アニメを含みます。',
        game: 'ゲーム。',
        movie: '実写映画。',
        tv: '実写ドラマ。',
        book: '書籍。',
        manga: '漫画。',
        stage: '舞台、ミュージカル。',
        other: 'その他。',
      },
    },
    entry_relation: {
      title: 'エントリーの関係',
      description: '現在のエントリーから見た関係で、双方にそれぞれ 1 つずつ表示されます。',
      values: {
        sequel: '相手が現在のエントリーの続編。',
        prequel: '相手が現在のエントリーの前作。',
        side_story: '相手が現在のエントリーの外伝。',
        main_story: '相手が現在のエントリーの本編。',
        spin_off: '相手が現在のエントリーのスピンオフ。',
        spin_off_of: '現在のエントリーが相手のスピンオフ。',
        adaptation: '相手が現在のエントリーを原作とする派生作品。',
        source: '相手が現在のエントリーの原作。',
        remake: '相手が現在のエントリーのリメイク。',
        remake_of: '現在のエントリーが相手のリメイク。',
        alternative: '別バージョン。',
        shared_world: '同一の世界観。',
        related: 'その他の関連。',
      },
    },
    entry_album_relation: {
      title: 'アルバムとエントリーの関係',
      description: 'アルバムがあるエントリーにとって何であるか。',
      values: {
        opening: 'オープニングテーマ。',
        ending: 'エンディングテーマ。',
        insert_song: '挿入歌。',
        theme_song: '主題歌。',
        character_song: 'キャラクターソング。',
        image_song: 'イメージソング。',
        ost: 'サウンドトラック。',
        drama: 'ドラマ CD。',
        other: 'その他。',
      },
    },
    attribute_value_type: {
      title: '属性の値のタイプ',
      description: '属性定義の `value_type` で、Attribute の `value` が何になるかを決めます。',
      values: {
        text: 'テキスト。',
        integer: '整数。',
        decimal: '小数。文字列で表します。',
        date: '日付。`{ date, precision }` で表します。',
        url: 'URL。',
        boolean: 'はい / いいえ。',
        choice: '定義の `choices` から 1 つを選びます。',
        reference: 'データベース内の内容を指します。`{ type, id }` で表します。',
      },
    },
    link_category: {
      title: 'リンクの分類',
      description: 'リンクの提供元の分類。ストリーミングのリンクは、アルバムでは別に並びます。',
      values: {
        official: '公式サイト。',
        social: 'SNS。',
        streaming: 'ストリーミング。',
        shop: 'ショップ。',
        database: 'データベース。例：VGMdb、MusicBrainz、Bangumi。',
        other: 'その他。',
      },
    },
  },

  changes: {
    launch: '初公開（ベータ版）。',
  },
}

export default texts
