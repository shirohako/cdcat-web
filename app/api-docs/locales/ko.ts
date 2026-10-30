import { md } from '~/documents/sections'
import type { ApiDocsTexts } from '../types'

const texts: ApiDocsTexts = {
  title: '공개 API',
  intro: 'CDCat에 등록된 앨범, 아티스트, 행사, 작품, 시리즈 정보를 HTTP로 조회할 수 있습니다. 회원가입이나 키는 필요 없으며, 카탈로그 데이터는 CC BY-SA 4.0 라이선스로 공유합니다.',

  labels: {
    tag: '개발자 문서',
    beta: '베타',
    beta_note: '정식 출시 전까지 필드가 바뀔 수 있으며, 항상 최신 문서를 기준으로 합니다',
    base_url: '기본 URL',
    copy: '복사',
    copied: '복사됨',
    copy_url: '요청 URL 복사',
    copy_json: 'JSON 복사',
    copy_failed: '복사하지 못했습니다. 텍스트를 직접 선택해 복사하세요',
    in_section: '이 섹션의 엔드포인트와 객체',
    path_params: '경로 매개변수',
    query_params: '쿼리 매개변수',
    response: '응답 data',
    response_model: 'data는 {model} 객체입니다.',
    extends: '{model}의 모든 필드에 더해 다음 필드가 있습니다.',
    statuses: '상태 코드',
    example: '예시',
    default: '기본값 {value}',
    required: '필수',
    optional: '없을 수 있음',
    see: '값 목록: {name}',
    more_items: '외 {n}개',
    more_model: '필드 목록: {model}',
    model: '객체',
    enum: '값 목록',
    feedback_title: '피드백',
    feedback_text: '문서와 실제 API가 다르거나, 새 엔드포인트가 필요하거나, 문제가 생기면 알려 주세요.',
    feedback_issue: 'GitHub에 이슈 등록',
    feedback_email: '이메일 보내기',
  },

  common: {
    params: {
      page: '페이지 번호입니다. 1부터 시작합니다.',
      per_page: '페이지당 항목 수입니다. 허용 범위를 벗어나면 422를 반환합니다.',
      include_pending: '검토 중인 콘텐츠(공개되어 검토를 기다리는 콘텐츠)도 함께 조회합니다.',
      direction: '정렬 방향입니다. `asc`는 오름차순, `desc`는 내림차순입니다.',
    },
    fields: {
      pagination: '페이지네이션 정보입니다. [Pagination](#object-pagination)을 참고하세요.',
      slug: 'URL 슬러그입니다. 표시용일 뿐 조회에는 쓸 수 없습니다.',
      release_date_precision: '날짜의 정밀도입니다. 연도나 월만 알려진 경우 날짜는 해당 연도나 월의 1일로 저장되므로, 이 정밀도에 맞춰 표시하세요.',
      is_favorited: '현재 사용자가 좋아요했는지 여부입니다. 사이트에 로그인한 상태에서만 의미가 있으며, 그 밖의 요청에서는 항상 `false`입니다.',
      is_pending: '검토 중인지 여부입니다. 제출 직후 공개되어 검토를 기다리는 상태를 뜻합니다.',
      titles: '원래 이름 외의 이름입니다. 공식 명칭, 번역명, 읽는 법, 별칭 등이 들어 있습니다. [Title](#object-title)을 참고하세요.',
      links: '외부 링크입니다. 표시 순서대로 정렬되어 있습니다. [Link](#object-link)를 참고하세요.',
      share_card_url: '공유 카드(1200×630 JPEG) URL입니다. 아직 생성되지 않았으면 `null`입니다.',
      version: '현재 버전 번호입니다. 수정할 때마다 1씩 올라갑니다.',
      pending_revision: '검토를 기다리는 제출 내용입니다. 제출자와 검토자만 볼 수 있으며, 그 외에는 항상 `null`입니다.',
      created_at: '생성 시각(UTC)입니다.',
      updated_at: '마지막 수정 시각(UTC)입니다. 조회수 같은 통계가 바뀌어도 갱신됩니다.',
    },
  },

  sections: {
    'overview': {
      title: '개요',
      lead: '공개 API를 이용하면 다른 사이트나 앱에서 CDCat의 음악 데이터를 읽어 갈 수 있습니다. 읽기 전용이며 회원가입이나 키가 필요 없습니다.',
    },
    'usage': {
      title: '이용 규칙',
      lead: '출처를 밝히고 라이선스를 지키면 데이터를 자유롭게 재사용할 수 있습니다. 서버에 부담이 가지 않도록 요청 빈도도 적당히 조절해 주세요.',
    },
    'conventions': {
      title: '공통 규칙',
      lead: '모든 엔드포인트에 공통으로 적용되는 규칙입니다. 응답 형식, 페이지네이션, 매개변수 작성법, 이름과 날짜, 검토 중이거나 병합된 콘텐츠의 처리 방식을 설명합니다.',
    },
    'rate-limits': {
      title: '요청 한도',
      lead: '로그인 없이 쓸 수 있는 조회 엔드포인트는 하나의 요청 한도를 함께 쓰고, 검색에는 별도의 한도가 있습니다.',
    },
    'errors': {
      title: '오류',
      lead: '오류가 발생하면 HTTP 상태 코드로 어떤 종류의 문제인지 알 수 있습니다. `error.name`은 바뀌지 않는 오류 이름이므로, 오류를 구분할 때는 이 값을 사용하세요.',
    },
    'albums': {
      title: '앨범과 곡',
      short: '앨범과 곡',
      lead: '앨범은 곡을 수록한 발매 단위입니다. 한정판과 통상판은 같은 앨범의 서로 다른 에디션(Product)이며, LP처럼 수록곡이 다른 발매물은 별도의 앨범으로 등록합니다. 목록은 간략한 AlbumSimple을 반환하고, 상세에는 디스크, 곡, 크레딧, 에디션, 이미지가 더해집니다.',
    },
    'lyrics': {
      title: '가사',
      lead: '가사는 곡에 속합니다. 곡마다 원문 가사는 최대 하나이고, 번역과 음역은 여러 개 둘 수 있습니다. 가사의 권리는 권리자에게 있으며 CC BY-SA가 적용되지 않으므로, 자료 참고와 식별 용도로만 사용할 수 있습니다.',
    },
    'artists': {
      title: '아티스트',
      lead: '아티스트에는 개인, 그룹, 동인 서클, 회사, 가상 가수, 캐릭터가 포함됩니다. 음반사, 레이블, 발매사도 아티스트(유형 `company`)로 등록하며, 레이블을 따로 관리하지 않습니다.',
    },
    'events': {
      title: '행사',
      lead: '행사 시리즈(M3, Comic Market 등) 아래에 회차별 행사가 있습니다. 행사장 배치도와 부스 정보는 주최 측이 공개한 자료를 그대로 저장한 것입니다.',
    },
    'entries': {
      title: '작품',
      lead: '작품은 앨범과 연결된 원작으로, 애니메이션, 게임, 영화, 도서 등이 있습니다. 앨범은 작품을 통해 시리즈에 속합니다.',
    },
    'franchises': {
      title: '시리즈',
      lead: '시리즈는 관련 작품을 묶은 것으로, 시리즈와 하위 시리즈의 최대 2단계로 구성됩니다. 행사 시리즈(`/event-series`)와는 다른 개념입니다.',
    },
    'search': {
      title: '검색',
      lead: '앨범, 곡, 아티스트, 작품, 시리즈를 한 번에 검색합니다. 간체·번체·일본 한자와 가나, 전각·반각 문자는 정규화한 뒤 비교합니다.',
    },
    'dictionaries': {
      title: '사전과 열거형',
      short: '사전과 열거형',
      lead: 'API에서 쓰는 값은 모두 고정된 영어 소문자입니다. 전체 최신 목록은 `/catalog/schema`를 기준으로 하며, 이 섹션에서는 각 값의 의미를 설명합니다.',
    },
    'objects': {
      title: '공통 객체',
      lead: '여러 엔드포인트에서 공통으로 쓰이는 객체입니다.',
    },
    'changes': {
      title: '변경 내역',
      lead: 'API 클라이언트에 영향을 주는 변경 사항입니다. 최신 항목이 위에 있습니다. 정식 출시 전까지 API는 베타 단계이며 필드가 바뀔 수 있습니다.',
    },
  },

  prose: {
    'overview': md`
      ### 기본 URL

      모든 엔드포인트는 다음 주소 아래에 있습니다. 이 페이지에 적힌 경로는 모두 이 주소를 생략한 것입니다.

      \`\`\`
      {{base}}
      \`\`\`

      요청은 \`GET\`으로 보내고, 응답은 JSON으로 받습니다. 예를 들어 앨범 하나를 조회하려면 다음과 같이 요청합니다.

      \`\`\`
      GET {{base}}/albums/1287
      \`\`\`

      ### 이 문서에서 다루는 내용

      - 앨범과 곡, 가사, 아티스트, 행사, 작품, 시리즈, 검색, 그리고 열거형을 다룹니다.
      - API는 아직 베타 단계이므로 정식 출시 전까지 필드가 바뀔 수 있습니다. 변경 사항은 따로 공지하지 않으며, 항상 최신 문서를 기준으로 합니다.
      - 데이터를 제출하거나 수정하는 엔드포인트의 문서는 아직 준비 중입니다.

      ### 키 없이 사용

      이 문서의 엔드포인트는 모두 로그인이 필요 없으며, API 키도 없습니다. 다른 사이트의 웹 페이지에서도 교차 출처 요청으로 바로 호출할 수 있습니다. CORS는 모든 출처를 허용하며, 요청에 쿠키는 포함되지 않습니다.
    `,
    'usage': md`
      ### 라이선스가 적용되지 않는 콘텐츠

      가사, 앨범 커버를 비롯한 이미지의 권리는 각 권리자에게 있으므로 자료 참고와 식별 용도로만 사용할 수 있으며, CC BY-SA가 적용되지 않습니다. 리뷰, 커뮤니티 글, 아티클의 권리는 작성자에게 있습니다. 이들은 카탈로그 데이터가 아니며, 관련 엔드포인트도 이 문서에서 다루지 않습니다.

      ### 요청 시 유의 사항

      - 요청 빈도를 적당히 유지하고, 한꺼번에 많은 요청을 보내지 마세요. 구체적인 한도는 [요청 한도](#rate-limits)를 참고하세요.
      - 문제가 생겼을 때 연락드릴 수 있도록 \`User-Agent\`에 앱 이름과 연락처를 적어 주세요. 예: \`MyLyricsApp/1.2 (https://example.com; me@example.com)\`
      - 캐시할 수 있는 데이터는 캐시하세요. 같은 데이터를 매번 다시 요청할 필요는 없습니다.
      - API 도메인의 robots.txt는 검색 엔진이 API를 색인하지 않도록 하기 위한 것입니다. 이 문서에 따라 API를 호출하는 것은 robots.txt의 제한을 받지 않습니다.

      그 밖의 사항은 이용약관의 [올바른 서비스 이용](/terms#acceptable-use)을 참고하세요.

      ### 피드백

      문서와 실제 API가 다르거나, 새 엔드포인트가 필요하거나, 문제가 생기면 GitHub에 [이슈를 등록]({{issues}})하거나 {{email}}로 메일을 보내 주세요.
    `,
    'conventions': md`
      ### 응답 형식

      성공하면 \`success\`가 \`true\`이고 내용은 \`data\`에 담깁니다. 실패하면 \`success\`가 \`false\`이고 원인은 \`error\`에 담깁니다. 자세한 내용은 [오류](#errors)를 참고하세요.

      \`\`\`json
      { "success": true, "data": { … } }
      \`\`\`

      ### 페이지네이션

      목록 엔드포인트는 \`page\`(1부터 시작)와 \`per_page\`로 페이지를 나눕니다. \`data\`에는 목록과 함께 [Pagination](#object-pagination) 정보가 들어 있습니다. 엔드포인트별 기본 페이지 크기와 최댓값은 각 매개변수 설명에 있으며, 최댓값을 넘으면 422를 반환합니다.

      ### 매개변수 작성법

      - 불리언 값은 \`true\` / \`false\` 또는 \`1\` / \`0\`으로 씁니다.
      - 배열은 \`names[]=a&names[]=b\` 형식으로 씁니다.
      - 정렬은 \`sort\`(정렬 기준)와 \`direction\`(\`asc\` 오름차순, \`desc\` 내림차순)으로 지정합니다. 단, 앨범 목록의 \`sort\`는 미리 정해진 몇 가지 정렬 방식 중 하나를 고르는 것이라 \`direction\`이 없습니다.
      - 알 수 없는 매개변수 값을 보내면 422를 반환하며, 임의로 기본값으로 대체하지 않습니다. 문서에 없는 매개변수는 무시합니다.
      - ID는 항상 숫자입니다. \`slug\`는 표시용일 뿐 조회에는 쓸 수 없습니다.

      ### 이름과 번역

      API는 언어에 따라 다른 내용을 반환하지 않습니다. \`title\` 또는 \`name\`은 음반에 인쇄된 원래 이름이고, 다른 이름은 \`titles\`에 들어 있습니다([Title](#object-title) 참고). 독자의 언어로 이름을 표시하려면 해당 언어의 \`official\`, 해당 언어의 \`translation\`, 원래 이름 순으로 찾아 쓰는 것을 권장합니다.

      목록에 나오는 앨범(AlbumSimple)에는 \`titles\`가 없어 원래 이름만 표시할 수 있습니다. 번역명이 필요하면 앨범 상세를 요청하세요. 행사와 행사 시리즈의 \`description\`은 \`{ "ja": "…", "en": "…" }\`처럼 언어별로 나뉜 객체입니다.

      ### 날짜와 시간

      - 날짜는 \`YYYY-MM-DD\` 형식입니다. 발매일에는 \`release_date_precision\`이 함께 옵니다. 연도나 월만 알려진 경우 정밀도는 \`year\` 또는 \`month\`이고, 날짜는 해당 연도나 월의 1일로 저장됩니다. 표시할 때는 알 수 없는 부분을 빼 주세요.
      - 시각은 UTC 기준 ISO 8601 형식이며, 소수점 이하 초는 없습니다. 예: \`2026-10-30T08:00:00Z\`
      - 행사의 \`start_time\`과 \`end_time\`은 행사장 현지 시각으로, 시간대 없이 \`HH:MM\` 형식입니다.

      ### 이미지

      이미지 주소는 항상 전체 URL입니다. 앨범 이미지([Image](#object-image))에는 원본 \`url\`, 긴 변이 최대 300px인 \`thumbnail_url\`, 최대 1200px인 \`medium_url\`이 함께 제공됩니다. URL을 직접 조합하지 말고 이 주소를 그대로 사용하세요. 작품, 시리즈, 행사 이미지는 다른 사이트에 있을 수도 있습니다.

      ### 검토 중인 콘텐츠

      회원이 새로 등록한 앨범, 아티스트, 작품, 시리즈는 제출하는 즉시 공개되고, 동시에 검토를 기다립니다. 이 동안에는 \`is_pending\` 값이 \`true\`입니다. 이 네 종류의 목록에서는 기본적으로 검토 중인 항목이 빠지며, \`include_pending=true\`를 지정해야 포함됩니다. 상세 조회를 비롯한 다른 엔드포인트는 평소처럼 반환합니다. 검토를 통과하지 못한 콘텐츠는 삭제되며, 이후 요청하면 404를 받습니다.

      ### 성인 콘텐츠

      \`is_adult\`는 표시용 플래그일 뿐이며, API가 대신 걸러 주지 않습니다. 전체 이용가 앱이라면 직접 걸러 주세요.

      ### 병합과 삭제

      중복된 앨범, 곡, 아티스트는 병합됩니다. 병합되어 사라진 ID로 \`/albums/{id}\`, \`/tracks/{id}\`, \`/artists/{id}\`, \`/artists/{id}/card\`를 요청하면 301을 반환합니다. \`Location\`은 남은 쪽을 가리키고, \`data.moved_to\`에는 그 유형과 새 ID가 들어 있습니다.

      \`\`\`json
      { "success": true, "data": { "moved_to": { "resource_type": "album", "id": 1290 } } }
      \`\`\`

      다른 엔드포인트는 병합되거나 삭제된 ID에 대해 404를 반환합니다.

      ### 캐싱

      \`/catalog/schema\`, 행사장 배치도, 부스 목록의 응답에는 \`ETag\`가 붙습니다. 다음 요청 때 이 값을 \`If-None-Match\`에 담아 보내면, 내용이 바뀌지 않았을 때 304를 반환하므로 다시 내려받지 않아도 됩니다.
    `,
    'rate-limits': md`
      | 요청 | 분당 한도 | 집계 기준 |
      |---|---|---|
      | 로그인 토큰 없음 | {{rate_limit}}회 | IP 주소. IPv6는 /64 대역을 하나로 계산 |
      | 유효한 로그인 토큰 있음 | {{rate_limit_user}}회 | 계정 |
      | \`/search\` | 별도로 {{search_limit}}회 | 계정 또는 IP. 위 한도와 따로 집계 |

      모든 응답에는 두 가지 헤더가 붙습니다. \`X-RateLimit-Limit\`은 분당 한도, \`X-RateLimit-Remaining\`은 이번 1분 동안 남은 요청 수입니다. 한도를 넘으면 429를 반환합니다.

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

      \`details.retry_after\`와 \`Retry-After\` 헤더는 모두 기다려야 할 시간(초)이고, \`X-RateLimit-Reset\`은 다시 요청할 수 있는 시각(Unix 타임스탬프)입니다. 429를 받으면 바로 재시도하지 말고 \`Retry-After\`초만큼 기다린 뒤 다시 시도하세요.

      교차 출처 요청에서도 이 헤더를 읽을 수 있습니다. 한도는 나중에 바뀔 수 있으므로, 코드에 값을 고정하지 말고 응답 헤더를 기준으로 판단하세요.
    `,
    'errors': md`
      오류가 발생하면 다음과 같은 객체를 반환합니다. 필드는 [Error](#object-error)를 참고하세요.

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

      \`message\`는 디버깅용 영어 메시지이며 바뀔 수 있습니다. \`details\`는 매개변수가 잘못되었거나 요청 한도를 넘었을 때만 포함됩니다.

      | HTTP | \`error.name\` | 발생 상황 |
      |---|---|---|
      | 404 | \`RESOURCE_NOT_FOUND\` | 주소는 맞지만 콘텐츠가 없거나 삭제됨 |
      | 404 | \`NOT_FOUND\` | 주소가 잘못됨: 경로가 없거나 ID가 숫자가 아님 |
      | 405 | \`METHOD_NOT_ALLOWED\` | \`GET\` 이외의 요청 메서드를 사용함 |
      | 422 | \`VALIDATION_FAILED\` | 매개변수가 잘못됨. \`details\`에 매개변수 이름별로 원인이 나옴 |
      | 429 | \`RATE_LIMIT_EXCEEDED\` | 요청이 너무 많음. [요청 한도](#rate-limits) 참고 |
      | 500 | \`INTERNAL_ERROR\` | 서버 오류. 잠시 후 다시 시도하고, 계속 발생하면 알려 주세요 |

      이 밖에 병합된 앨범, 곡, 아티스트는 301을 반환하며([병합과 삭제](#병합과-삭제) 참고), \`ETag\`를 지원하는 엔드포인트는 304를 반환할 수 있습니다.
    `,
  },

  statuses: {
    'VALIDATION_FAILED': '매개변수가 잘못되었습니다. `details`에 매개변수 이름별로 원인이 나옵니다.',
    'RESOURCE_NOT_FOUND': '콘텐츠가 없거나 삭제되었습니다.',
    'RATE_LIMIT_EXCEEDED': '요청이 너무 많습니다. `retry_after`초 후에 다시 시도하세요.',
    '301': '이 ID는 다른 항목에 병합되었습니다. 새 ID는 `Location`과 `data.moved_to`에서 확인할 수 있습니다.',
    '304': '`If-None-Match`를 보냈고 내용이 바뀌지 않았습니다.',
  },

  endpoints: {
    'get-albums': {
      title: '앨범 목록',
      summary: '조건에 맞는 앨범을 페이지 단위로 반환합니다. 검토 중인 앨범은 기본적으로 목록에서 제외됩니다.',
      params: {
        'type': '앨범 유형',
        'category': '앨범 분류입니다. 예: `doujin`, `game`',
        'format': '매체 형식입니다. 예: `cd`, `vinyl`',
        'artist_id': '이 아티스트가 참여한 앨범만 조회합니다. 역할은 상관없습니다.',
        'release_event_id': '이 행사에서 처음 발매된 앨범만 조회합니다.',
        'year': '발매 연도',
        'attributes[key]': '속성으로 필터링합니다. 최대 5개까지 지정할 수 있습니다. 예: `attributes[cover_character]=射命丸文`. 작품 등 다른 콘텐츠를 가리키는 속성은 `entry:12`처럼 씁니다. 텍스트, URL, 선택, 참조 유형의 속성만 필터링할 수 있습니다.',
        'sort': '`new`는 발매일 최신순, `trending`은 최근 30일 인기순, `top_rated`는 평점 순위순(하루 한 번 갱신)입니다.',
        'search': '제목, 다른 이름, 품번, 바코드, 크레딧 표기를 검색합니다. 공백을 뺀 2자 이상(한자나 가나가 있으면 1자 이상), 최대 3단어까지 입력할 수 있습니다. `sort`를 지정하지 않으면 관련도순으로 정렬합니다.',
      },
      fields: {
        albums: '이 페이지의 앨범',
      },
      notes: md`
        ::: tip 목록에는 번역명이 없습니다
        AlbumSimple에는 \`titles\`가 없어 원래 이름만 표시할 수 있습니다. 독자의 언어로 번역명을 표시하려면 [앨범 상세](#get-albums-id)를 요청하세요.
        :::
      `,
    },
    'get-albums-id': {
      title: '앨범 상세',
      summary: '앨범 하나의 모든 정보를 반환합니다. 디스크와 곡, 크레딧, 에디션, 특전, 이미지, 외부 링크, 연결된 작품, 통계가 포함됩니다.',
      params: {
        id: '앨범 ID',
      },
      notes: md`
        - 요청할 때마다 조회수가 1 올라가며(같은 출처는 하루 한 번만), \`views_count\`는 5분마다 갱신됩니다.
        - 아티스트 표기와 발매 역할(발매사, 레이블, 아티스트 등)도 \`credits\`에 들어 있으며, \`category\` 값은 \`release\`입니다.
      `,
    },
    'get-tracks-id': {
      title: '곡 상세',
      summary: '곡 하나를 반환합니다. 수록 앨범, 그 앨범의 수록곡, 원곡, 이 곡을 편곡한 곡이 함께 포함됩니다.',
      params: {
        id: '곡 ID',
      },
    },
    'get-tracks-id-lyrics': {
      title: '곡 가사 목록',
      summary: '곡의 모든 가사(원문, 번역, 음역)를 본문 없이 요약 정보로 반환합니다. ID순으로 정렬하며, 페이지네이션은 없습니다.',
      params: {
        id: '곡 ID',
      },
      fields: {
        lyrics: '이 곡의 가사입니다. [LyricSummary](#object-lyric-summary)를 참고하세요.',
      },
    },
    'get-lyrics-id': {
      title: '가사 상세',
      summary: '가사 하나의 본문과 출처를 반환합니다.',
      params: {
        id: '가사 ID',
      },
      notes: md`
        ::: warning 가사의 권리
        가사의 권리는 권리자에게 있으며 CC BY-SA가 적용되지 않으므로, 자료 참고와 식별 용도로만 사용할 수 있습니다. [이용 규칙](#usage)을 참고하세요.
        :::
      `,
    },
    'get-artists': {
      title: '아티스트 목록',
      summary: '조건에 맞는 아티스트를 최근 등록순으로, 페이지 단위로 반환합니다. 검토 중인 아티스트는 기본적으로 목록에서 제외됩니다.',
      params: {
        type: '아티스트 유형',
        search: '이름, 다른 이름, 슬러그를 검색합니다. 일부만 일치해도 됩니다. 검색할 때는 일치도순으로 정렬합니다.',
        has_albums: '앨범이 있는 아티스트만 조회합니다.',
      },
      fields: {
        artists: '이 페이지의 아티스트입니다. 상세에만 있는 필드는 빠집니다.',
      },
    },
    'get-artists-id': {
      title: '아티스트 상세',
      summary: '아티스트 한 명의 정보를 반환합니다. 다른 이름, 외부 링크, 속성, 관련 아티스트가 함께 포함됩니다.',
      params: {
        id: '아티스트 ID',
      },
    },
    'get-artists-id-albums': {
      title: '아티스트 발매 앨범',
      summary: '이 아티스트가 앨범 전체에 대해 ‘아티스트 표기와 발매’ 역할(아티스트, 발매사, 레이블, 유통사, 제조사, 기획)을 맡은 앨범을 발매일 최신순으로 반환합니다. 검토 중인 앨범도 포함합니다.',
      params: {
        id: '아티스트 ID',
      },
      fields: {
        albums: '이 페이지의 앨범',
      },
    },
    'get-artists-id-tracks': {
      title: '아티스트 참여곡',
      summary: '이 아티스트가 참여한 앨범을 반환합니다. 곡에 대한 모든 역할과, ‘아티스트 표기와 발매’ 이외의 앨범 전체 역할이 대상입니다. 앨범별로 묶어 앨범 전체 역할과 참여한 곡을 나열합니다.',
      params: {
        id: '아티스트 ID',
        role: '이 역할만 조회합니다. 예: `composer`. 역할 키는 [/catalog/schema](#get-catalog-schema)의 `credit_roles`에 있습니다.',
      },
      fields: {
        'albums': '이 페이지의 앨범으로, 앨범마다 한 그룹입니다. 페이지네이션도 앨범 수 기준입니다.',
        'albums.album': '앨범',
        'albums.roles': '앨범 전체에 대해 맡은 역할',
        'albums.roles.role': '역할 키',
        'albums.roles.credited_as': '크레딧 표기 이름입니다. 아티스트 이름과 다를 때만 있습니다.',
        'albums.roles.detail': '구체적인 악기 등 추가 설명',
        'albums.tracks': '참여한 곡입니다. 디스크 번호와 트랙 번호순으로 정렬합니다.',
        'albums.tracks.id': '곡 ID',
        'albums.tracks.title': '곡 제목(원제)',
        'albums.tracks.disc_position': '디스크 번호',
        'albums.tracks.track_number': '트랙 번호',
        'albums.tracks.number_label': '표시용 번호입니다. 예: LP의 `A1`',
        'albums.tracks.roles': '이 곡에서 맡은 역할입니다. 형식은 `albums.roles`와 같습니다.',
        'roles': '역할별 참여 앨범 수입니다. 예: `{ "composer": 4 }`. `role` 매개변수의 영향을 받지 않습니다.',
        'all': '참여한 앨범 총수',
      },
    },
    'get-artists-id-card': {
      title: '아티스트 카드',
      summary: '아티스트 한 명의 간단한 프로필로, 호버 카드에 쓰기 좋습니다. 다른 이름은 최대 4개, 소개는 앞부분 160자까지 포함합니다.',
      params: {
        id: '아티스트 ID',
      },
      fields: {
        id: '아티스트 ID',
        name: '이름(원어)',
        type: '아티스트 유형',
        image_url: '프로필 사진',
        is_active: '활동 중인지 여부입니다. 개인이 세상을 떠났거나 그룹이 해체하면 `false`입니다.',
        bio: '소개의 앞부분입니다. 최대 160자를 그대로 자른 것이라 Markdown 문법이 섞여 있을 수 있습니다.',
        albums_count: '참여한 앨범 수',
        followers_count: '이 아티스트를 좋아요한 사람 수',
      },
    },
    'get-artists-lookup': {
      title: '이름으로 아티스트 찾기',
      summary: '정확한 이름으로 아티스트를 찾습니다. 한 번에 최대 100개까지 조회할 수 있어, 크레딧 목록의 이름을 아티스트와 연결할 때 유용합니다. 전각·반각, 대소문자, 가나, 간체·번체·일본 한자는 정규화한 뒤 비교합니다.',
      params: {
        'names[]': '찾을 이름입니다. 각각 최대 200자입니다.',
      },
      fields: {
        'matches': '전달한 이름별로 묶은 결과',
        'matches.<name>': '이 이름과 정확히 일치하는 아티스트입니다. 동명이인이 여러 명 있을 수도, 하나도 없을 수도(빈 배열) 있습니다. 대표 이름, 공식 명칭, 번역명, 읽는 법, 별칭을 비교하며, 약칭은 비교하지 않습니다.',
        'matches.<name>.id': '아티스트 ID',
        'matches.<name>.name': '이름(원어)',
        'matches.<name>.type': '아티스트 유형',
        'matches.<name>.image_url': '프로필 사진',
      },
    },
    'get-event-series': {
      title: '행사 시리즈 목록',
      summary: '모든 행사 시리즈를 이름순으로 반환합니다. 페이지네이션은 없습니다.',
      fields: {
        event_series: '행사 시리즈입니다. `latest_start_date`가 포함됩니다.',
      },
    },
    'get-event-series-id': {
      title: '행사 시리즈 상세',
      summary: '행사 시리즈 하나를 반환합니다. 시리즈에 속한 회차별 행사는 [행사 목록](#get-events)에 `series_id`를 지정해 페이지 단위로 가져오세요.',
      params: {
        id: '행사 시리즈 ID',
      },
    },
    'get-events': {
      title: '행사 목록',
      summary: '조건에 맞는 행사를 페이지 단위로 반환합니다. 기본적으로 최근 행사가 먼저 나옵니다.',
      params: {
        series_id: '이 행사 시리즈에 속한 행사만 조회합니다.',
        search: '이름과 슬러그를 검색합니다. 공백을 뺀 2~100자, 최대 3단어까지 입력할 수 있으며, 모든 단어가 일치해야 합니다.',
        start_from: '이 날짜(`YYYY-MM-DD`) 이후에 시작하는 행사만 조회합니다(당일 포함).',
        start_to: '이 날짜(`YYYY-MM-DD`) 이전에 시작하는 행사만 조회합니다(당일 포함).',
        sort: '`start_date`는 시작일순, `released_albums_count`는 그 행사에서 처음 발매된 앨범 수순입니다.',
      },
      fields: {
        events: '이 페이지의 행사입니다. 상세에만 있는 필드는 빠집니다.',
      },
    },
    'get-events-id': {
      title: '행사 상세',
      summary: '행사 하나를 반환합니다. 목록에 있는 정보에 더해 부스 수, 행사장 배치도 유무, 공유 카드가 포함됩니다.',
      params: {
        id: '행사 ID',
      },
    },
    'get-events-id-map': {
      title: '행사장 배치도',
      summary: '행사장 평면도를 반환합니다. 주최 측 평면도를 변환한 것으로, 홀, 각 부스 자리의 위치, 배경 도형이 들어 있습니다.',
      params: {
        id: '행사 ID',
      },
      statuses: {
        RESOURCE_NOT_FOUND: '행사가 없거나, 이 행사에 아직 배치도가 없습니다. 먼저 행사 상세의 `has_map`을 확인하세요.',
      },
      notes: md`
        데이터가 꽤 크기 때문에 응답에 \`ETag\`와 \`Cache-Control: public, max-age=60\`이 붙습니다. 다시 요청할 때는 \`If-None-Match\`를 보내 주세요. 좌표 단위는 평면도 PDF의 pt이며, y축은 아래쪽 방향입니다.
      `,
    },
    'get-events-id-booths': {
      title: '부스 목록',
      summary: '행사의 모든 부스를 주최 측 목록 순서대로 한 번에 반환합니다. 부스는 주최 측 자료를 그대로 저장하며, 부스 하나에 아티스트를 0명 이상 연결할 수 있습니다.',
      params: {
        id: '행사 ID',
      },
      fields: {
        booths: '모든 부스입니다. 아직 가져오지 않았으면 빈 배열입니다.',
      },
      notes: md`
        행사장 배치도와 마찬가지로 응답에 \`ETag\`와 \`Cache-Control: public, max-age=60\`이 붙습니다. 부스의 텍스트와 서클 컷은 주최 측에서 제공한 것이며, \`is_adult\`는 표시용 플래그일 뿐입니다.
      `,
    },
    'get-entries': {
      title: '작품 목록',
      summary: '조건에 맞는 작품을 페이지 단위로 반환합니다. 검토 중인 작품은 기본적으로 목록에서 제외됩니다.',
      params: {
        type: '작품 유형',
        format: '세부 유형입니다. 가능한 값은 유형에 따라 다르며, [entry_type](#enum-entry-type)을 참고하세요.',
        platform: '게임 플랫폼입니다. 정확히 일치해야 합니다. 예: `Switch`',
        franchise_id: '이 시리즈(하위 시리즈 포함)에 속한 작품만 조회합니다.',
        year: '발매 연도',
        search: '이름, 다른 이름(별칭, 약칭 포함), 슬러그를 검색합니다. `sort`를 지정하지 않으면 관련도순으로 정렬합니다.',
        sort: '정렬 기준',
      },
      fields: {
        entries: '이 페이지의 작품입니다. 상세에만 있는 필드는 빠집니다.',
      },
    },
    'get-entries-id': {
      title: '작품 상세',
      summary: '작품 하나를 반환합니다. 외부 링크, 연결된 앨범, 소속 시리즈, 관련 작품이 함께 포함됩니다.',
      params: {
        id: '작품 ID',
      },
    },
    'get-franchises': {
      title: '시리즈 목록',
      summary: '조건에 맞는 시리즈를 페이지 단위로 반환합니다. 기본적으로 최상위 시리즈만 나오며, 검색할 때는 하위 시리즈도 포함합니다. 검토 중인 시리즈는 기본적으로 목록에서 제외됩니다.',
      params: {
        search: '이름, 다른 이름, 슬러그를 검색합니다. `sort`를 지정하지 않으면 관련도순으로 정렬합니다.',
        parent_id: '이 시리즈의 하위 시리즈만 조회합니다.',
        top_level: '`true`이면 최상위 시리즈만, `false`이면 전체를 조회합니다. 기본값은 `search`가 없으면 `true`, 있으면 `false`입니다. `parent_id`를 지정하면 적용되지 않습니다.',
        sort: '정렬 기준입니다. 작품 수와 앨범 수에는 하위 시리즈도 포함됩니다.',
      },
      fields: {
        franchises: '이 페이지의 시리즈입니다. 상세에만 있는 필드는 빠집니다.',
      },
    },
    'get-franchises-id': {
      title: '시리즈 상세',
      summary: '시리즈 하나를 반환합니다. 하위 시리즈(와 그 작품), 이 시리즈에 바로 속한 작품, 시리즈 전체에 해당하는 앨범이 함께 포함됩니다.',
      params: {
        id: '시리즈 ID',
      },
    },
    'get-franchises-id-albums': {
      title: '시리즈 앨범 목록',
      summary: '시리즈와 그 하위 시리즈에 속한 모든 앨범을 반환합니다. 작품을 통해 연결된 앨범과 시리즈 전체에 해당하는 앨범을 중복 없이 합쳐, 발매일순으로 페이지 단위로 반환합니다.',
      params: {
        id: '시리즈 ID',
        entry_id: '이 작품에 연결된 앨범만 조회합니다.',
        relation_type: '시리즈 내 작품과 이 관계로 연결된 앨범만 조회합니다. 예: `ost`. 지정하면 시리즈 전체에 해당하는 앨범은 제외됩니다.',
        sort: '발매일순만 지원합니다.',
      },
      fields: {
        'albums': '이 페이지의 앨범',
        'albums.entries': '앨범이 연결된, 이 시리즈에 속한 작품입니다. 시리즈 전체에 해당하는 앨범이면 빈 배열입니다.',
        'albums.entries.id': '작품 ID',
        'albums.entries.name': '작품 이름(원제)',
        'albums.entries.type': '작품 유형',
        'albums.entries.relation_type': '앨범과 작품의 관계',
      },
    },
    'get-search': {
      title: '검색',
      summary: '앨범, 곡, 아티스트, 작품, 시리즈를 검색합니다. `type`을 지정하지 않으면 종류별로 상위 몇 개를 반환하고, 지정하면 해당 종류만 검색해 페이지 단위로 반환합니다.',
      params: {
        q: '검색어입니다. 공백을 뺀 2자 이상(한자, 가나, 한글이 있으면 1자 이상), 최대 3단어까지 입력할 수 있으며, 모든 단어가 일치해야 합니다.',
        type: '이 종류만 검색합니다. 결과는 페이지 단위로 나뉩니다.',
        include_pending: '검토 중인 콘텐츠도 검색합니다. 검색은 기본적으로 이를 포함하며, 점수가 같으면 검토를 마친 콘텐츠 뒤에 둡니다.',
        limit: '`type`을 지정하지 않았을 때 종류별로 반환할 최대 결과 수',
      },
      fields: {
        'query': '실제로 검색에 사용한 검색어',
        'query.phrase': '정리한 검색어',
        'query.terms': '나눈 단어(최대 3개)',
        'groups': '`type`이 없을 때 반환합니다. 종류마다 한 그룹이며, 순서는 앨범, 곡, 아티스트, 작품, 시리즈로 고정입니다. 결과가 없는 종류도 포함합니다.',
        'groups.type': '이 그룹의 종류',
        'groups.total': '이 종류의 결과 수입니다. 최대 1000까지만 셉니다.',
        'groups.total_is_capped': '결과가 1000개를 넘으면 `true`입니다.',
        'groups.items': '이 종류의 상위 결과',
        'results': '`type`이 있을 때 반환합니다. 이 페이지의 결과입니다.',
        'total_is_capped': '`type`이 있을 때 반환합니다. 결과가 1000개를 넘으면 `true`이며, `pagination.total`은 최대 1000입니다.',
      },
      notes: md`
        검색에는 분당 {{search_limit}}회의 별도 요청 한도가 있습니다. [요청 한도](#rate-limits)를 참고하세요. 3글자 이상의 라틴 문자 단어는 약간의 오타를 허용하지만, 품번은 정확히 일치해야 합니다.
      `,
    },
    'get-catalog-schema': {
      title: '카탈로그 스키마',
      summary: 'API에서 쓰는 모든 열거형과, 운영진이 관리하는 크레딧 역할, 속성 정의, 링크 제공처를 4개 언어 이름과 함께 반환합니다.',
      fields: {
        'enums': '열거형입니다. 키는 열거형 이름(예: `album_type`)이고, 값은 가능한 모든 값입니다.',
        'credit_roles': '크레딧 역할입니다. `credits[].role`은 여기 있는 `key` 중 하나입니다.',
        'credit_roles.key': '역할 키입니다. 예: `composer`',
        'credit_roles.category': '역할 분류',
        'credit_roles.names': '언어별 이름입니다. 예: `{ "ja": "作曲", "en": "Composer" }`',
        'credit_roles.aliases': '다른 사이트에서 흔히 쓰는 표기입니다. 다른 사이트의 크레딧 목록을 매핑할 때 유용합니다.',
        'credit_roles.is_album_role': '앨범 전체에 쓸 수 있는지 여부',
        'credit_roles.is_track_role': '개별 곡에 쓸 수 있는지 여부',
        'attribute_definitions': '속성 정의입니다. 속성은 앨범, 곡, 이미지, 아티스트에 붙일 수 있는 추가 정보로, ‘커버 캐릭터’ 같은 것이 있습니다.',
        'attribute_definitions.key': '속성 키로, Attribute의 `key`에 해당합니다.',
        'attribute_definitions.names': '언어별 이름',
        'attribute_definitions.description': '언어별 입력 안내',
        'attribute_definitions.group': '그룹입니다. 예: ‘동방 프로젝트’',
        'attribute_definitions.value_type': '값 유형',
        'attribute_definitions.choices': '`choice` 유형에서 고를 수 있는 값',
        'attribute_definitions.reference_types': '`reference` 유형이 가리킬 수 있는 대상입니다. 예: `entry`',
        'attribute_definitions.applies_to': '붙일 수 있는 대상: `album`, `track`, `album_image`, `artist`',
        'attribute_definitions.is_multiple': '값을 여러 개 가질 수 있는지 여부',
        'link_providers': '링크 제공처입니다. [링크 제공처 목록](#get-link-providers)과 같습니다.',
        'aggregates': '편집기용 데이터 구조 설명입니다. 데이터를 읽을 때는 필요 없습니다.',
        'limits': '이미지 업로드 제한입니다. 데이터를 읽을 때는 필요 없습니다.',
      },
    },
    'get-link-providers': {
      title: '링크 제공처 목록',
      summary: '외부 링크의 모든 제공처(공식 사이트, SNS, 스트리밍, 쇼핑몰, 데이터베이스 등)를 표시 순서대로 반환합니다. 페이지네이션은 없습니다.',
      fields: {
        link_providers: '링크 제공처',
      },
    },
  },
  models: {
    AlbumSimple: {
      title: '앨범(간략)',
      description: '목록, 검색, 아티스트 페이지와 작품 페이지에서 쓰는 간략한 앨범 정보입니다. `titles`가 없어 원제만 표시할 수 있습니다.',
      fields: {
        id: '앨범 ID. 웹 페이지 주소는 `{{site}}/albums/{id}`입니다.',
        title: '원제. 음반에 인쇄된 그대로의 제목입니다.',
        type: '앨범 유형',
        categories: '앨범 분류. 여러 개일 수 있습니다. 빈 배열이면 특정 작품에 속하지 않는 작곡가 작품집입니다.',
        release_date: '발매일',
        catalog_number: '품번. 품번이 있는 첫 번째 에디션의 값을 씁니다. `KECH-8059~62`처럼 범위일 수도 있습니다.',
        image_url: '커버 이미지. 긴 변 기준 최대 1200px입니다.',
        disc_count: '디스크 수. 첫 번째 에디션에 든 디스크만 세며, 특전 디스크는 제외합니다.',
        track_count: '그 디스크들에 수록된 곡 수',
        duration: '그 곡들의 총 재생 시간(초). 길이를 모르는 곡은 빠집니다.',
        disc_formats: '그 디스크들의 포맷(중복 제거)',
        is_adult: '성인용 콘텐츠 여부',
        favorites_count: '좋아요 수',
        reviews_count: '리뷰 수',
        views_count: '조회수. 5분마다 갱신됩니다.',
        byline: '제목 아래에 보이는 아티스트 표기. 발매사가 있으면 모든 발매사, 없으면 표기된 아티스트이고, 둘 다 없으면 `null`입니다.',
      },
    },
    Album: {
      title: '앨범',
      description: '앨범 상세 정보입니다.',
      fields: {
        'description': '소개',
        'banner_url': '앨범 페이지의 배너 이미지',
        'release_event': '발매 행사',
        'release_event.id': '행사 ID',
        'release_event.name': '행사 이름',
        'release_event.slug': '행사 슬러그',
        'release_event.main_visual_url': '행사 메인 비주얼',
        'release_event.start_date': '행사 시작일',
        'cover': '커버 이미지. 원본과 썸네일 두 종류의 주소가 들어 있습니다.',
        'discs': '디스크 목록. 순서대로 정렬되며, 디스크마다 수록곡이 들어 있습니다.',
        'tracklist_languages': '수록곡 이름이 있는 언어와, 언어별로 이름이 있는 곡 수',
        'tracklist_languages.locale': '언어(BCP 47)',
        'tracklist_languages.kind': '이름 종류: `official`, `translation`, `transliteration` 중 하나',
        'tracklist_languages.count': '이 언어로 된 이름이 있는 곡 수',
        'tracklist_languages.total': '전체 곡 수',
        'credits': '앨범 전체의 크레딧. ‘아티스트 표기와 발매’ 그룹(`category`가 `release`)도 포함합니다.',
        'products': '에디션 목록(예: 초회한정판, 통상판)',
        'bonuses': '특전 목록(예: 매장 특전, 행사장 특전)',
        'images': '앨범 이미지: 커버, 뒷면, 부클릿, 디스크 등',
        'attributes': '추가 정보(예: 커버 캐릭터)',
        'streaming': '스트리밍 링크. 다른 링크와 따로 제공합니다.',
        'entries': '연결된 작품(원작)',
        'entries.id': '작품 ID',
        'entries.name': '작품 이름(원어)',
        'entries.type': '작품 유형',
        'entries.format': '작품의 세부 유형',
        'entries.image_url': '작품 이미지',
        'entries.release_date': '작품 발매일',
        'entries.relation_type': '앨범과 작품의 관계(예: OST, 오프닝)',
        'entries.note': '관계에 대한 메모',
        'entries.franchises': '작품이 속한 시리즈',
        'entries.franchises.id': '시리즈 ID',
        'entries.franchises.name': '시리즈 이름(원어)',
        'entries.franchises.parent_id': '상위 시리즈 ID. 최상위 시리즈면 `null`입니다.',
        'franchises': '시리즈 전체에 직접 속한 앨범에만 있습니다(예: 주년 기념 컴필레이션).',
        'franchises.id': '시리즈 ID',
        'franchises.name': '시리즈 이름(원어)',
        'franchises.image_url': '시리즈 이미지',
        'tracking_stats': '기록 상태별 사용자 수',
        'tracking_stats.plan_to_listen': '들을 예정',
        'tracking_stats.completed': '감상 완료',
        'tracking_stats.wishlist': '위시리스트',
        'tracking_stats.owned': '소장 중',
        'tracking_stats.dropped': '관심 없음',
        'rating': '평균 평점. 1~5 사이 값이며 소수점 둘째 자리까지 나옵니다. 아무도 평가하지 않았으면 `null`입니다.',
        'rating_count': '평가한 사람 수',
        'rating_distribution': '1~5점 각각을 준 사람 수. 아무도 평가하지 않았으면 `null`입니다.',
        'ranking': '평점 순위. 하루에 한 번 갱신되며, 아직 아무도 평가하지 않았으면 `null`입니다.',
        'articles': '이 앨범을 다룬 아티클(최대 5개)',
        'articles.id': '아티클 ID',
        'articles.title': '아티클 제목',
        'articles.cover_url': '아티클 커버 이미지',
        'articles.published_at': '발행 시각(UTC)',
        'contributors': '이 앨범을 편집한 사용자. 하루에 한 번 갱신됩니다.',
        'contributors.username': '아이디',
        'contributors.nickname': '닉네임',
        'contributors.avatar_url': '프로필 사진',
        'user_tracking': '현재 사용자가 표시한 기록 상태. 사이트에 로그인한 상태에서만 의미가 있고, 그 밖의 요청에서는 항상 `null`입니다.',
        'user_tracking.status': '상태: `plan_to_listen`, `completed`, `wishlist`, `owned`, `dropped` 중 하나',
        'edited_at': '현재 버전이 편집된 시각(UTC). `updated_at`과 달리 조회수 같은 변화에는 영향을 받지 않습니다.',
      },
    },
    Disc: {
      title: '디스크',
      description: '앨범에 든 디스크 한 장입니다. CD, BD, LP, 디지털 등이 있습니다.',
      fields: {
        id: '디스크 ID',
        position: '디스크 번호. 1부터 시작합니다.',
        title: '디스크 제목(예: ‘DISC 2 Instrumental’). 없으면 `null`입니다.',
        format: '포맷',
        bonus_id: '특전으로 딸린 디스크에만 있으며, 해당 특전을 가리킵니다.',
        tracks: '이 디스크의 수록곡. 트랙 번호순입니다.',
      },
    },
    AlbumTrack: {
      title: '앨범 수록곡',
      description: '앨범 상세 정보에 들어 있는 곡입니다. 곡별 크레딧과 원곡이 함께 들어 있습니다.',
      fields: {
        id: '곡 ID',
        disc_number: '디스크 번호',
        track_number: '트랙 번호. 같은 디스크 안에서 겹치지 않습니다.',
        number_label: '화면 표시용 번호. LP의 `A1`처럼 트랙 번호와 다를 때만 있습니다.',
        title: '곡 제목. 음반에 인쇄된 그대로의 제목입니다.',
        duration: '재생 시간(초). 모르면 `null`입니다.',
        is_instrumental: '인스트루멘털 여부',
        isrc: '국제 표준 녹음 코드(ISRC)',
        favorites_count: '좋아요 수',
        has_lyrics: '원문 가사 유무',
        lyrics_count: '가사 수(번역 포함)',
        translations_count: '그중 번역 가사 수',
        originals: '원곡. 이 곡이 편곡, 커버, 리믹스한 대상 곡입니다.',
        credits: '이 곡의 크레딧',
        attributes: '추가 정보(예: BPM)',
      },
    },
    Track: {
      title: '곡',
      description: '곡 상세 정보입니다.',
      fields: {
        'id': '곡 ID',
        'album_id': '수록 앨범 ID',
        'disc_id': '수록 디스크 ID',
        'disc_number': '디스크 번호',
        'track_number': '트랙 번호',
        'number_label': '화면 표시용 번호(예: LP의 `A1`)',
        'title': '곡 제목(원어)',
        'duration': '재생 시간(초). 모르면 `null`입니다.',
        'is_instrumental': '인스트루멘털 여부',
        'isrc': '국제 표준 녹음 코드(ISRC)',
        'has_lyrics': '원문 가사 유무',
        'lyrics_count': '가사 수(번역 포함)',
        'translations_count': '그중 번역 가사 수',
        'favorites_count': '좋아요 수',
        'originals': '원곡',
        'derived_tracks': '이 곡을 원곡으로 하는 곡(예: 이 곡의 편곡, 커버)',
        'derived_tracks.id': '곡 ID',
        'derived_tracks.title': '곡 제목(원어)',
        'derived_tracks.album': '그 곡의 수록 앨범',
        'album': '수록 앨범',
        'album_tracks': '같은 앨범의 모든 곡. 디스크와 트랙 번호순이며, 이전 곡·다음 곡 링크를 만들 때 쓸 수 있습니다.',
        'album_tracks.id': '곡 ID',
        'album_tracks.disc_number': '디스크 번호',
        'album_tracks.track_number': '트랙 번호',
        'album_tracks.number_label': '화면 표시용 번호',
        'album_tracks.title': '곡 제목(원어)',
        'album_tracks.duration': '재생 시간(초)',
        'album_tracks.has_lyrics': '원문 가사 유무',
        'credits': '이 곡의 크레딧',
        'credits.id': 'ID',
        'credits.role': '역할 키. 역할 이름은 `/catalog/schema`의 `credit_roles`에 있습니다.',
        'credits.detail': '보충 설명(예: 구체적인 악기, 캐릭터 이름)',
        'credits.credited_as': '표기명. 아티스트 이름과 다를 때만 있습니다.',
        'credits.artist': '아티스트. 표기명만 알고 아직 연결된 아티스트가 없으면 `null`입니다.',
        'credits.artist.id': '아티스트 ID',
        'credits.artist.name': '아티스트 이름(원어)',
        'attributes': '추가 정보',
      },
    },
    Credit: {
      title: '크레딧',
      description: '앨범이나 곡에서 아티스트가 맡은 역할 하나입니다. 한 아티스트가 역할을 여러 개 맡으면 크레딧도 역할마다 하나씩 생깁니다.',
      fields: {
        'id': 'ID',
        'role': '역할 키(예: `composer`). 역할 이름은 `/catalog/schema`의 `credit_roles`에 있습니다. ‘아티스트 표기와 발매’ 그룹의 역할 6개는 [release_role](#enum-release-role)을 참고하세요.',
        'category': '역할 분류',
        'artist': '아티스트. 표기명만 알고 아직 연결된 아티스트가 없으면 `null`입니다.',
        'artist.id': '아티스트 ID',
        'artist.name': '아티스트 이름(원어)',
        'artist.image_url': '프로필 사진',
        'artist.type': '아티스트 유형',
        'credited_as': '표기명. 앨범에 인쇄된 이름으로, 아티스트 이름과 다를 때만 있습니다.',
        'detail': '보충 설명(예: 구체적인 악기, 연기한 캐릭터)',
      },
    },
    Product: {
      title: '에디션',
      description: '초회한정판, 통상판, 다운로드판처럼 따로 구매할 수 있는 판 하나입니다. 에디션마다 포함된 디스크가 지정되어 있습니다.',
      fields: {
        id: '에디션 ID',
        name: '에디션 이름(예: ‘初回限定盤’)',
        edition_type: '통상판 또는 한정판',
        limited_rule: '한정 방식. 한정판에만 있습니다.',
        limited_name: '한정판 이름',
        medium: '실물 음반 또는 디지털',
        catalog_number: '품번',
        barcode: '바코드(JAN / EAN / UPC)',
        release_date: '이 에디션의 발매일. `null`이면 앨범 발매일과 같습니다.',
        region: '발매 지역. ISO 3166-1 두 글자 코드입니다(예: `JP`).',
        price: '정가. 문자열입니다(예: `"3300.00"`).',
        currency: '통화. ISO 4217 코드입니다(예: `JPY`).',
        is_hires: '하이레조 음원 여부',
        is_available: '판매 중 여부',
        sort_order: '표시 순서',
        disc_ids: '이 에디션에 포함된 디스크 ID',
        format_label: '화면 표시용 구성(예: `2CD+BD`). 다운로드판은 `DL`입니다.',
      },
    },
    Bonus: {
      title: '특전',
      description: '매장 특전, 행사장 특전, 초회 특전 등입니다. 특전 CD는 `bonus_id`로 이 특전을 가리키는 디스크로 표현합니다.',
      fields: {
        'id': '특전 ID',
        'name': '특전 이름',
        'type': '특전 유형',
        'description': '설명',
        'is_digital': '디지털 특전 여부',
        'shop': '매장 이름(예: ‘とらのあな’)',
        'availability': '받는 방법',
        'note': '조건(예: ‘購入者全員’, ‘抽選’)',
        'sort_order': '표시 순서',
        'event': '행사장 특전이 해당하는 행사',
        'event.id': '행사 ID',
        'event.name': '행사 이름',
        'event.slug': '행사 슬러그',
        'product_ids': '이 특전이 딸린 에디션. 빈 배열이면 모든 에디션에 딸려 있습니다.',
        'disc_ids': '이 특전에 딸린 디스크',
      },
    },
    AlbumImage: {
      title: '앨범 이미지',
      description: '이미지가 앨범에서 어떤 용도로 쓰이는지 나타냅니다. 커버, 뒷면, 부클릿의 한 페이지 등이 있습니다.',
      fields: {
        id: 'ID',
        kind: '이미지 종류',
        label: '보충 설명(예: 부클릿 페이지 ‘p. 01-02’)',
        caption: '이미지 설명',
        product_id: '특정 에디션에만 해당할 때만 있습니다.',
        bonus_id: '특정 특전에만 해당할 때만 있습니다.',
        disc_id: '특정 디스크에만 해당할 때만 있습니다.',
        sort_order: '표시 순서',
        image: '이미지 파일',
        attributes: '추가 정보(예: 커버 캐릭터)',
      },
    },
    Original: {
      title: '원곡',
      description: '곡이 편곡, 커버, 리믹스한 대상입니다. CDCat에 등록된 다른 곡일 수도 있고, 텍스트 한 줄일 수도 있습니다.',
      fields: {
        'title': '원곡 제목. CDCat에 등록된 곡을 가리키면 그 곡의 제목입니다.',
        'track': '원곡이 CDCat에 등록된 곡일 때만 있으며, 그렇지 않으면 `null`입니다.',
        'track.id': '원곡의 곡 ID',
        'track.album': '원곡의 수록 앨범',
        'track.album.id': '앨범 ID',
        'track.album.title': '앨범 제목(원어)',
      },
    },
    LyricSummary: {
      title: '가사(요약)',
      description: '가사 하나의 요약 정보입니다. 본문은 들어 있지 않습니다.',
      fields: {
        'id': '가사 ID',
        'track_id': '곡 ID',
        'kind': '원문, 번역, 음역 중 하나',
        'language': '언어(BCP 47). 예: `ja`, `zh-Hans`, `ja-Latn`',
        'translation_of_id': '번역과 음역에만 있습니다. 대응하는 원문 가사의 ID로, 줄 단위로 대조할 때 씁니다.',
        'format': '본문 형식',
        'translator': '번역자 표기명',
        'is_ai_generated': '기계 번역 여부',
        'creator': '이 가사를 처음 제출한 사용자. 계정이 삭제되면 `null`입니다.',
        'creator.id': '사용자 ID',
        'creator.username': '아이디',
        'creator.nickname': '닉네임',
        'creator.avatar_url': '프로필 사진',
      },
    },
    Lyric: {
      title: '가사',
      description: '가사 하나의 전체 내용입니다.',
      fields: {
        'content': '본문. 형식이 `lrc`나 `srt`면 타임코드가 들어 있습니다.',
        'source': '출처(예: ‘歌詞カード’)',
        'track': '해당 곡',
        'track.id': '곡 ID',
        'track.title': '곡 제목(원어)',
        'track.track_number': '트랙 번호',
        'track.disc_number': '디스크 번호',
        'track.album': '수록 앨범',
      },
    },
    Artist: {
      title: '아티스트',
      description: '목록과 상세 조회에 모두 쓰는 객체입니다. 항상 있지는 않다고 표시된 필드는 상세 조회에서만 반환됩니다.',
      fields: {
        'id': '아티스트 ID. 웹 페이지 주소는 `{{site}}/artists/{id}`입니다.',
        'name': '대표 이름. 보통 원어 이름입니다.',
        'type': '아티스트 유형',
        'is_active': '활동 중 여부. 개인이 세상을 떠났거나 그룹이 해체했으면 `false`입니다.',
        'bio': '소개(Markdown)',
        'image_url': '프로필 사진',
        'followers_count': '이 아티스트에 좋아요를 누른 사람 수',
        'albums_count': '참여한 앨범 수. 역할은 따지지 않습니다.',
        'releases_count': '‘발매 앨범’ 수. [아티스트 발매 앨범 목록](#get-artists-id-albums)을 참고하세요.',
        'credited_albums_count': '‘크레딧’에 잡히는 앨범 수. [아티스트 참여곡 목록](#get-artists-id-tracks)을 참고하세요.',
        'catalog_prefixes': '품번 접두어(예: `["LACA"]`). 회사, 그리고 레이블을 겸하는 서클에만 있습니다.',
        'shouts_count': '아티스트 페이지에 남긴 한마디 수',
        'attributes': '추가 정보',
        'relations': '관련 아티스트. 이 아티스트를 기준으로 관계를 나타냅니다.',
        'relations.artist': '상대 아티스트',
        'relations.artist.id': '아티스트 ID',
        'relations.artist.name': '이름(원어)',
        'relations.artist.image_url': '프로필 사진',
        'relations.artist.type': '아티스트 유형',
        'relations.relation_type': '관계. 예를 들어 `has_member`는 상대 아티스트가 이 그룹의 멤버라는 뜻입니다.',
        'relations.note': '메모',
      },
    },
    EventSeries: {
      title: '행사 시리즈',
      description: 'M3, 코믹마켓 같은 행사 시리즈입니다.',
      fields: {
        id: '행사 시리즈 ID. 웹 페이지 주소는 `{{site}}/event-series/{id}`입니다.',
        name: '이름',
        slug: '슬러그',
        location: '개최 도시 또는 지역',
        description: '소개. 언어별로 나뉜 객체입니다(예: `{ "ja": "…", "en": "…" }`). 모든 언어가 다 있지는 않습니다.',
        website: '공식 사이트',
        banner_url: '배너 이미지',
        visual_orientation: '각 회차 메인 비주얼의 방향: 세로(카탈로그 표지) 또는 가로',
        events_count: '개최 횟수',
        latest_start_date: '가장 최근 회차의 시작일. 목록에만 있습니다.',
      },
    },
    Event: {
      title: '행사',
      description: '행사 한 회차입니다. 항상 있지는 않다고 표시된 필드는 상세 조회에서만 반환됩니다.',
      fields: {
        'id': '행사 ID. 웹 페이지 주소는 `{{site}}/events/{id}`입니다.',
        'event_series_id': '소속 행사 시리즈. 단독 행사면 `null`입니다.',
        'series': '소속 행사 시리즈',
        'series.id': '행사 시리즈 ID',
        'series.name': '이름',
        'series.slug': '슬러그',
        'series.website': '공식 사이트',
        'series.visual_orientation': '메인 비주얼의 방향',
        'name': '이름(예: ‘M3-2026秋’)',
        'slug': '슬러그',
        'start_date': '시작일',
        'end_date': '종료일. 하루짜리 행사면 `null`입니다.',
        'start_time': '개장 시각 `HH:MM`(행사장 현지 시각)',
        'end_time': '폐장 시각 `HH:MM`',
        'venue': '행사장',
        'location': '도시 또는 지역',
        'website_url': '이 회차 전용 사이트. 시리즈 공식 사이트는 `series.website`에 있습니다.',
        'description': '소개. 언어별로 나뉜 객체입니다.',
        'main_visual_url': '메인 비주얼 또는 카탈로그 표지',
        'main_visual_width': '메인 비주얼 너비(픽셀)',
        'main_visual_height': '메인 비주얼 높이(픽셀)',
        'key_visuals': '그 밖의 비주얼. 형식이 아직 정해지지 않았으니 의존하지 마세요.',
        'meta': '가져오기 때 기록된 추가 데이터(예: 부스 장르 코드의 이름). 형식이 바뀔 수 있습니다.',
        'albums_count': '발매 앨범 수. 운영진이 직접 입력하는 값이라 자동으로 갱신되지 않으니 `released_albums_count`를 쓰세요.',
        'artists_count': '참가 서클 수. 운영진이 직접 입력하는 값이라 자동으로 갱신되지 않습니다.',
        'released_albums_count': '이 회차에서 처음 발매된 앨범 수. 실시간으로 집계하며, 검토 중인 앨범도 포함합니다.',
        'booths_count': '부스 수. 행사장 밖에서 참가하는 부스도 포함합니다.',
        'has_map': '행사장 지도 유무',
      },
    },
    EventMap: {
      title: '행사장 지도',
      description: '행사 회차의 배치도입니다. 좌표 단위는 배치도 PDF의 pt이며, 원점은 왼쪽 위이고 y축은 아래쪽으로 증가합니다.',
      fields: {
        'width': '지도 전체 너비',
        'height': '지도 전체 높이',
        'background': '벽, 기둥, 구역 같은 배경 도형. 그리는 순서대로 정렬됩니다.',
        'background.d': 'SVG path 데이터',
        'background.s': '명도. 0은 벽, 1은 바닥입니다.',
        'background.e': '`1`이면 even-odd 채우기 규칙을 씁니다.',
        'background.w': '선 두께. 없으면 채우기만 합니다.',
        'labels': '행사장 안의 텍스트와 블록 문자',
        'labels.text': '텍스트',
        'labels.x': '위치의 x 좌표',
        'labels.y': '위치의 y 좌표',
        'labels.size': '글자 크기',
        'labels.rotate': '회전 각도(도)',
        'labels.vertical': '세로쓰기 여부',
        'labels.kind': '`area`면 블록 문자(A, あ…)입니다.',
        'halls': '홀과 층. 순서대로 정렬됩니다.',
        'halls.id': '홀 ID. `spaces`의 `hall_id`에 해당합니다.',
        'halls.building': '건물(예: ‘第一展示場’)',
        'halls.floor': '층(예: `2F`)',
        'halls.name': '화면 표시용 이름',
        'halls.bbox': '지도에서 홀이 차지하는 범위 `[x, y, w, h]`',
        'spaces': '부스 자리(테이블)마다 항목 하나로, `[id, hall_id, area, number, x, y, w, h]` 형태의 배열입니다. 부스의 `space_id`가 여기의 `id`를 가리킵니다.',
        'genres': '부스 장르 코드의 이름(예: `{ "201": { "label": "オリジナル", "group": "music" } }`)',
      },
    },
    EventBooth: {
      title: '부스',
      description: '주최 측 참가 목록의 항목 하나를 그대로 저장한 것입니다. 부스 하나를 서클 여럿이 함께 운영할 수도 있고, 이름에 읽는 법이나 메모가 붙어 있을 수도 있습니다.',
      fields: {
        'id': '부스 ID',
        'space_id': '부스가 있는 자리. 행사장 지도 `spaces`의 `id`에 해당하며, 행사장 밖에서 참가하는 부스는 `null`입니다.',
        'space_code': '부스 번호(예: `A-01a`)',
        'area': '블록(예: `A`)',
        'sub': '테이블의 어느 부분을 쓰는지: `a`, `b`는 절반, `ab`는 테이블 전체, `x`, `y`, `z`는 미니 부스용 3분의 1입니다.',
        'name': '부스 이름. 주최 측 표기 그대로입니다.',
        'name_kana': '이름 읽는 법',
        'description': '주최 측 목록에 적힌 설명',
        'genre': '장르 코드. 이름은 행사장 지도의 `genres`에 있습니다.',
        'keywords': '키워드',
        'links': '주최 측 목록에 적힌 링크',
        'links.type': '링크 종류(예: `website`)',
        'links.url': '주소',
        'twitter_handle': 'X(Twitter) 계정. 소문자이며 @는 붙지 않습니다.',
        'image_url': '서클 컷. CDCat에 저장해 둔 이미지입니다.',
        'embeds': '삽입된 동영상',
        'embeds.type': '현재는 `youtube`만 있습니다.',
        'embeds.id': '동영상 ID',
        'is_adult': '성인용 콘텐츠 여부. API에서 걸러 내지 않습니다.',
        'artists': '연결된 아티스트. 여럿일 수도, 없을 수도 있습니다.',
        'artists.id': '아티스트 ID',
        'artists.name': '이름(원어)',
        'artists.image_url': '프로필 사진',
        'album_ids': '이 아티스트들이 이 회차에서 처음 발매한 앨범 ID',
      },
    },
    Entry: {
      title: '작품',
      description: '목록과 상세 조회에 모두 쓰는 객체입니다. 항상 있지는 않다고 표시된 필드는 상세 조회에서만 반환됩니다.',
      fields: {
        'id': '작품 ID. 웹 페이지 주소는 `{{site}}/entries/{id}`입니다.',
        'name': '대표 이름. 보통 원어 이름입니다.',
        'type': '작품 유형',
        'format': '세부 유형. 가능한 값은 유형마다 다르며, [entry_type](#enum-entry-type)을 참고하세요.',
        'platforms': '게임 플랫폼(예: `["Switch", "PC"]`). 게임이 아니면 빈 배열입니다.',
        'release_date': '발매일 또는 첫 방영일',
        'description': '소개(일반 텍스트)',
        'image_url': '이미지. 다른 사이트에 있는 이미지일 수 있습니다.',
        'banner_url': '배너 이미지',
        'albums_count': '연결된 앨범 수(검토 중인 앨범 포함)',
        'albums': '연결된 앨범. 발매일순입니다.',
        'albums.relation_type': '앨범과 작품의 관계',
        'albums.note': '관계에 대한 메모',
        'franchises': '작품이 속한 시리즈',
        'franchises.id': '시리즈 ID',
        'franchises.name': '시리즈 이름(원어)',
        'franchises.image_url': '시리즈 이미지',
        'franchises.parent': '상위 시리즈. 최상위 시리즈면 `null`입니다.',
        'franchises.parent.id': '상위 시리즈 ID',
        'franchises.parent.name': '상위 시리즈 이름',
        'related_entries': '관련 작품. 이 작품을 기준으로 관계를 나타냅니다. 예를 들어 `sequel`은 상대 작품이 이 작품의 후속작이라는 뜻입니다.',
        'related_entries.id': '작품 ID',
        'related_entries.name': '이름(원어)',
        'related_entries.type': '작품 유형',
        'related_entries.format': '세부 유형',
        'related_entries.image_url': '이미지',
        'related_entries.release_date': '발매일',
        'related_entries.relation_type': '관계',
        'related_entries.note': '메모',
        'sort_order': '시리즈 상세 정보의 작품에만 있습니다. 시리즈 안에서의 순서입니다.',
      },
    },
    Franchise: {
      title: '시리즈',
      description: '목록과 상세 조회에 모두 쓰는 객체입니다. 항상 있지는 않다고 표시된 필드는 상세 조회에서만 반환됩니다. 모든 집계에는 하위 시리즈가 포함됩니다.',
      fields: {
        'id': '시리즈 ID. 웹 페이지 주소는 `{{site}}/franchises/{id}`입니다.',
        'name': '대표 이름. 보통 원어 이름입니다.',
        'parent_id': '상위 시리즈 ID. 최상위 시리즈면 `null`입니다.',
        'description': '소개(일반 텍스트)',
        'image_url': '이미지. 다른 사이트에 있는 이미지일 수 있습니다.',
        'banner_url': '배너 이미지',
        'sort_order': '상위 시리즈 안에서의 순서',
        'entries_count': '작품 수. 하위 시리즈의 작품도 포함하며, 중복은 제거합니다.',
        'albums_count': '앨범 수. 작품을 통해 연결된 앨범과 시리즈 전체에 속한 앨범을 합치고, 중복은 제거합니다.',
        'children_count': '하위 시리즈 수',
        'parent': '상위 시리즈. 최상위 시리즈면 `null`입니다. `children`에 들어 있는 하위 시리즈에는 이 필드가 없습니다.',
        'parent.id': '상위 시리즈 ID',
        'parent.name': '상위 시리즈 이름',
        'children': '하위 시리즈. 각각의 집계, 다른 이름, 작품이 들어 있지만 외부 링크는 없습니다.',
        'entries': '이 시리즈에 직접 속한 작품. 순서와 발매일순으로 정렬되며, `sort_order`가 함께 들어 있습니다.',
        'albums': '시리즈 전체에 속한 앨범(예: 주년 기념 컴필레이션)',
        'albums.sort_order': '시리즈 안에서의 순서',
      },
    },
    SearchResult: {
      title: '검색 결과',
      description: '검색 결과 하나입니다. 다섯 종류 모두 같은 형태를 씁니다.',
      fields: {
        'type': '결과 종류',
        'id': '결과 자체의 ID',
        'title': '원어 이름',
        'image_url': '이미지',
        'meta': '부제목에 쓸 데이터. 종류마다 다릅니다. 앨범은 `artist_credit`, `catalog_number`, `release_date`, `release_date_precision`, `album_type`, `disc_formats`, 곡은 `album_id`, `album_title`, `disc_number`, `track_number`, `duration`, 아티스트는 `artist_type`, 작품은 `entry_type`, `release_date`, 시리즈는 `parent`(`{ id, name }` 또는 `null`)가 있습니다.',
        'album': '앨범과 곡 결과에만 있습니다. 앨범 자체 또는 곡의 수록 앨범입니다.',
        'matched': '어떤 이름이 일치했는지. 원어 이름이 일치했으면 `null`입니다.',
        'matched.field': '일치한 필드',
        'matched.text': '일치한 텍스트',
        'matched.locale': '그 이름의 언어',
      },
    },
    LinkProvider: {
      title: '링크 제공처',
      description: '외부 링크가 가리키는 사이트입니다. 공식 사이트, X, VGMdb 등이 있습니다.',
      fields: {
        id: '제공처 ID',
        name: '식별자(예: `x`, `vgmdb`). 화면 표시용 이름이 아닙니다.',
        icon_url: '아이콘',
        url_pattern: 'URL 와일드카드 패턴(예: `https://x.com/*`). 사용자가 붙여 넣은 링크를 알아볼 때 쓸 수 있으며, 없으면 `null`입니다.',
        category: '분류',
      },
    },
    Title: {
      title: '다른 이름',
      description: '원어 이름 외의 이름입니다. `official`, `translation`, `transliteration`은 언어마다 하나까지, 별칭과 약칭은 개수 제한 없이 둘 수 있습니다.',
      fields: {
        title: '이름',
        locale: '언어(BCP 47). 예: `ja`, `zh-Hans`, `en`. 로마자 표기는 `ja-Latn`, 가나 표기는 `ja-Hrkt`입니다. 별칭과 약칭은 `null`일 수 있습니다.',
        kind: '이름 종류',
      },
    },
    Link: {
      title: '외부 링크',
      description: '다른 사이트로 연결되는 링크입니다. 공식 사이트, SNS 계정, 스트리밍 서비스, 데이터베이스 등이 있습니다.',
      fields: {
        'id': '링크 ID',
        'url': '주소',
        'external_id': '해당 사이트에서의 ID(예: Bangumi의 `subject/12345`). 알아낼 수 없으면 `null`입니다.',
        'is_verified': '확인 완료 여부',
        'provider': '링크 제공처. 제공처가 삭제되었으면 `null`입니다.',
        'provider.id': '제공처 ID',
        'provider.name': '식별자(예: `x`)',
        'provider.icon_url': '아이콘',
        'provider.category': '분류',
      },
    },
    Image: {
      title: '이미지',
      description: 'CDCat에 업로드된 이미지입니다. 원본이 썸네일보다 작으면 썸네일 주소는 원본 주소와 같습니다.',
      fields: {
        id: '이미지 ID',
        url: '원본(WebP)',
        thumbnail_url: '썸네일. 긴 변 기준 최대 300px입니다.',
        medium_url: '썸네일. 긴 변 기준 최대 1200px입니다.',
        width: '원본 너비(픽셀)',
        height: '원본 높이(픽셀)',
        mime: 'MIME 타입(예: `image/webp`)',
      },
    },
    Byline: {
      title: '아티스트 표기',
      description: '제목 아래에 보이는 아티스트 표기입니다. 앨범을 저장할 때 계산해 둡니다.',
      fields: {
        'role': '`publisher`면 앨범 전체의 모든 발매사, `artist`면 표기된 모든 아티스트입니다.',
        'artists': '표기된 아티스트. 크레딧 순서를 따릅니다.',
        'artists.id': '아티스트 ID. 표기명만 있고 연결된 아티스트가 없으면 `null`입니다.',
        'artists.name': '표기명. 따로 표기명이 없으면 아티스트 이름입니다.',
      },
    },
    Attribute: {
      title: '속성',
      description: '운영진이 정의한 추가 정보입니다. 커버 캐릭터, BPM 등이 있습니다. 정의는 `/catalog/schema`의 `attribute_definitions`에 있습니다.',
      fields: {
        id: 'ID',
        key: '속성 키(예: `cover_character`)',
        value: '값. 타입은 속성마다 다릅니다. 텍스트, URL, 선택지는 문자열, 정수는 숫자, 소수는 문자열, 불리언은 `true` / `false`, 날짜는 `{ date, precision }`, 참조는 `{ type, id }`(예: `{ "type": "entry", "id": 12 }`)입니다.',
        label: '참조 속성에만 있습니다. 가리키는 콘텐츠의 이름입니다.',
        sort_order: '표시 순서',
      },
    },
    Pagination: {
      title: '페이지네이션',
      description: '목록 엔드포인트의 페이지 정보입니다.',
      fields: {
        total: '전체 항목 수',
        per_page: '페이지당 항목 수',
        current_page: '현재 페이지 번호',
        last_page: '마지막 페이지 번호',
      },
    },
    Error: {
      title: '오류',
      description: '오류가 났을 때 `error`에 들어 있는 객체입니다.',
      fields: {
        code: '숫자 오류 코드',
        name: '오류 이름(예: `RESOURCE_NOT_FOUND`). 오류 종류는 이 값으로 구분하세요.',
        message: '영어로 된 설명. 디버깅용이며 바뀔 수 있습니다.',
        details: '파라미터가 잘못되었으면 파라미터 이름별 사유가, 요청 한도를 넘었으면 `{ retry_after }`가 들어 있습니다.',
      },
    },
  },

  enums: {
    album_type: {
      title: '앨범 유형',
      description: '앨범의 형태입니다. Spotify의 album_type과 비슷합니다.',
      values: {
        album: '앨범',
        ep: 'EP 또는 미니 앨범',
        single: '싱글',
        compilation: '컴필레이션 또는 베스트 앨범',
        drama: '드라마 CD 또는 오디오 드라마',
        radio: '라디오 방송 CD',
      },
    },
    album_category: {
      title: '앨범 분류',
      description: '앨범 음악의 출처입니다. 여러 개일 수 있습니다. 빈 배열이면 특정 작품에 속하지 않는 작곡가 작품집입니다.',
      values: {
        game: '게임 음악. 특정 게임이 아니라 게임 전반과 관련된 음악도 포함합니다.',
        animation: '애니메이션 음악',
        publication: '만화, 라이트 노벨 등 출판물',
        audio_drama: '오디오 드라마',
        tokusatsu: '특촬물과 인형극',
        live_action: '영화, 드라마, 무대',
        doujin: '동인 서클이나 개인이 자체 제작한 음악. 오리지널과 2차 창작 모두 포함합니다.',
        event: '행사를 위해 만든 음악(예: 컨벤션, 공연, 대회의 주제가)',
      },
    },
    disc_format: {
      title: '디스크 포맷',
      description: 'HQCD, SHM-CD 같은 파생 규격은 `cd`로 기록합니다.',
      values: {
        cd: 'CD',
        sacd: 'SACD',
        dvd: 'DVD',
        bd: '블루레이',
        vinyl: 'LP',
        cassette: '카세트테이프',
        digital: '디지털(다운로드 또는 스트리밍)',
        other: '기타',
      },
    },
    date_precision: {
      title: '날짜 정밀도',
      description: '날짜가 어느 단위까지 정확한지 나타냅니다.',
      values: {
        day: '일 단위까지 정확함',
        month: '연월만 알려진 경우입니다. 날짜는 그달 1일로 기록합니다.',
        year: '연도만 알려진 경우입니다. 날짜는 그해 1월 1일로 기록합니다.',
      },
    },
    title_kind: {
      title: '이름 종류',
      description: '다른 이름(Title)이 어떤 성격의 이름인지 나타냅니다.',
      values: {
        official: '다른 언어로 된 공식 명칭(예: 음반 뒷면에 인쇄된 영어 제목)',
        translation: '비공식 번역명',
        transliteration: '음역, 로마자 표기, 가나 표기',
        alias: '별칭 또는 예전 이름',
        abbreviation: '약칭',
      },
    },
    artist_type: {
      title: '아티스트 유형',
      description: '아티스트가 어떤 주체인지 나타냅니다.',
      values: {
        person: '개인',
        group: '그룹 또는 밴드',
        circle: '동인 서클',
        company: '회사: 음반사, 레이블, 발매사, 제작사, 스튜디오',
        virtual: '버추얼 싱어 또는 VTuber',
        character: '캐릭터 송을 부르는 캐릭터',
      },
    },
    artist_relation: {
      title: '아티스트 관계',
      description: '현재 아티스트를 기준으로 나타내며, 양쪽에서 각각 짝이 되는 값 하나씩을 보게 됩니다.',
      values: {
        member_of: '현재 아티스트가 상대 아티스트의 멤버입니다.',
        has_member: '상대 아티스트가 현재 그룹의 멤버입니다.',
        voice_of: '현재 아티스트가 상대(캐릭터)의 목소리를 맡았습니다.',
        voiced_by: '상대 아티스트가 현재 캐릭터의 목소리를 맡았습니다.',
        persona_of: '현재 아티스트가 상대 아티스트의 다른 명의입니다.',
        has_persona: '상대 아티스트가 현재 아티스트의 다른 명의입니다.',
        subunit_of: '현재 아티스트가 상대 그룹의 서브 유닛입니다.',
        has_subunit: '상대 아티스트가 현재 그룹의 서브 유닛입니다.',
        related: '그 밖의 관계',
      },
    },
    credit_role_category: {
      title: '역할 분류',
      description: '크레딧 역할을 묶은 분류입니다. 개별 역할은 `/catalog/schema`의 `credit_roles`에 있습니다.',
      values: {
        release: '아티스트 표기와 발매: 아티스트, 발매사, 레이블 등. [release_role](#enum-release-role)을 참고하세요.',
        composition: '작곡',
        lyrics: '작사',
        arrangement: '편곡, 리믹스',
        vocals: '보컬, 코러스, 성우',
        performance: '연주, 오케스트라, 지휘',
        production: '프로듀싱, 디렉팅',
        engineering: '녹음, 믹싱, 마스터링',
        artwork: '일러스트, 디자인, 사진',
        other: '기타',
      },
    },
    release_role: {
      title: '아티스트 표기와 발매',
      description: '‘아티스트 표기와 발매’ 그룹의 역할 6개로, `credits[].role` 값의 일부입니다. 앨범의 아티스트 표기(Byline)는 이 역할들로 계산합니다.',
      values: {
        artist: '아티스트: 커버나 곡에 표기된 아티스트',
        publisher: '발매사(発売元). 앨범 전체에만 씁니다.',
        label: '레이블(レーベル). 앨범 전체에만 씁니다.',
        distributor: '유통사(販売元). 앨범 전체에만 씁니다.',
        manufacturer: '제조사(製造元). 앨범 전체에만 씁니다.',
        planning: '기획(企画). 앨범 전체에만 씁니다.',
      },
    },
    edition_type: {
      title: '에디션 유형',
      description: '통상판인지 한정판인지 나타냅니다.',
      values: {
        regular: '통상판',
        limited: '한정판. 한정 방식은 `limited_rule`에 있습니다.',
      },
    },
    limited_rule: {
      title: '한정 방식',
      description: '한정판이나 특전을 얻는 조건입니다.',
      values: {
        first_press: '초회 한정',
        count: '수량 한정',
        period: '기간 한정',
        shop: '매장 한정',
        event: '행사장 한정',
        region: '지역 한정',
      },
    },
    product_medium: {
      title: '에디션 매체',
      description: '실물 음반인지 디지털인지 나타냅니다.',
      values: {
        physical: '실물 음반',
        digital: '디지털(다운로드 또는 스트리밍)',
      },
    },
    bonus_type: {
      title: '특전 유형',
      description: '특전이 무엇인지 나타냅니다.',
      values: {
        bonus_track: '보너스 트랙',
        bonus_disc: '특전 디스크',
        booklet: '부클릿',
        photo_item: '사진, 카드류',
        goods: '굿즈',
        digital_content: '디지털 콘텐츠',
        serial_code: '시리얼 코드',
        event_entry: '이벤트 응모권',
        signed_item: '사인 굿즈',
        other: '기타',
      },
    },
    image_kind: {
      title: '이미지 종류',
      description: '이미지가 앨범에서 쓰이는 용도입니다. VGMdb의 분류를 참고했습니다.',
      values: {
        cover: '앨범 커버. 정사각형이며 앨범마다 정확히 하나입니다.',
        front: '앞면',
        back: '뒷면',
        booklet: '부클릿. 페이지 번호는 `label`에 적습니다.',
        disc: '디스크 면',
        disc_back: '디스크 뒷면',
        obi_front: '띠지 앞면',
        obi_back: '띠지 뒷면',
        tray: '트레이',
        box: '박스',
        sticker: '스티커',
        bonus_item: '특전 상품',
        illustration: '일러스트',
        other: '기타',
      },
    },
    lyric_kind: {
      title: '가사 종류',
      description: '가사가 원문인지, 번역인지, 음역인지 나타냅니다.',
      values: {
        original: '원문. 곡마다 하나까지 있습니다.',
        translation: '번역',
        transliteration: '음역 또는 로마자 표기',
      },
    },
    lyric_format: {
      title: '가사 형식',
      description: '가사 본문을 적는 형식입니다.',
      values: {
        plain: '일반 텍스트',
        lrc: 'LRC(타임코드 포함)',
        srt: 'SRT 자막(타임코드 포함)',
      },
    },
    entry_type: {
      title: '작품 유형',
      description: '작품이 어떤 종류인지 나타냅니다. 세부 유형 `format`은 유형마다 다릅니다. 애니메이션은 `tv`, `movie`, `ova`, `web`, `special`, 게임은 `full`, `dlc`, `expansion`, 드라마는 `series`, `special`, 도서는 `novel`, `light_novel`, `other`, 만화는 `serial`, `oneshot`, 무대는 `musical`, `play`이고, 영화와 기타는 세부 유형이 없습니다.',
      values: {
        anime: '애니메이션(극장판 애니메이션 포함)',
        game: '게임',
        movie: '실사 영화',
        tv: '실사 드라마',
        book: '도서',
        manga: '만화',
        stage: '연극 또는 뮤지컬',
        other: '기타',
      },
    },
    entry_relation: {
      title: '작품 관계',
      description: '현재 작품을 기준으로 나타내며, 양쪽에서 각각 짝이 되는 값 하나씩을 보게 됩니다.',
      values: {
        sequel: '상대 작품이 현재 작품의 후속작입니다.',
        prequel: '상대 작품이 현재 작품의 전작입니다.',
        side_story: '상대 작품이 현재 작품의 외전입니다.',
        main_story: '상대 작품이 현재 작품의 본편입니다.',
        spin_off: '상대 작품이 현재 작품의 스핀오프입니다.',
        spin_off_of: '현재 작품이 상대 작품의 스핀오프입니다.',
        adaptation: '상대 작품이 현재 작품을 각색한 작품입니다.',
        source: '상대 작품이 현재 작품의 원작입니다.',
        remake: '상대 작품이 현재 작품의 리메이크입니다.',
        remake_of: '현재 작품이 상대 작품의 리메이크입니다.',
        alternative: '다른 버전',
        shared_world: '같은 세계관',
        related: '그 밖의 관계',
      },
    },
    entry_album_relation: {
      title: '앨범과 작품의 관계',
      description: '앨범이 해당 작품에서 어떤 위치인지 나타냅니다.',
      values: {
        opening: '오프닝',
        ending: '엔딩',
        insert_song: '삽입곡',
        theme_song: '주제가',
        character_song: '캐릭터 송',
        image_song: '이미지 송',
        ost: 'OST',
        drama: '드라마',
        other: '기타',
      },
    },
    attribute_value_type: {
      title: '속성 값 타입',
      description: '속성 정의의 `value_type`입니다. Attribute의 `value`가 어떤 형태인지 결정합니다.',
      values: {
        text: '텍스트',
        integer: '정수',
        decimal: '소수. 문자열로 나타냅니다.',
        date: '날짜. `{ date, precision }` 형태입니다.',
        url: 'URL',
        boolean: '예 또는 아니요',
        choice: '정의된 `choices` 중 하나',
        reference: 'CDCat에 등록된 콘텐츠를 가리킵니다. `{ type, id }` 형태입니다.',
      },
    },
    link_category: {
      title: '링크 분류',
      description: '링크 제공처의 분류입니다. 앨범에서는 스트리밍 링크를 따로 제공합니다.',
      values: {
        official: '공식 사이트',
        social: 'SNS',
        streaming: '스트리밍',
        shop: '쇼핑몰',
        database: '데이터베이스(예: VGMdb, MusicBrainz, Bangumi)',
        other: '기타',
      },
    },
  },

  changes: {
    launch: '첫 공개(베타)',
  },
}

export default texts
