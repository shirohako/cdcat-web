import type { EditorHelpEntry } from './types'

/** The album editor's field help. Facts follow /docs/editor (app/guides/editor); ids are used by <EditorHelp id="…">. */
const help: Record<string, EditorHelpEntry> = {
  // ── Basic info
  'album.cover': {
    text: '專輯的正面封面，必須是正方形，短邊至少 500 像素。比例只差一點時會自動從中間裁好，差得多會開啟裁切框。',
    where: '專輯列表、卡片和專輯頁頂端。',
  },
  'album.title': {
    text: '依專輯封面上印的原文填寫。',
    dont: ['不要加「初回限定盤」這樣的版本說明，版本在「版本」裡填'],
    where: '專輯頁、列表和搜尋結果。專輯頁在介面語言有官方名稱或翻譯時先顯示它，這個標題顯示在下面；列表和搜尋結果只顯示這個標題。',
  },
  'album.release_date': {
    text: '依年-月-日的順序填，年寫 4 位，月和日寫 2 位。',
    rows: [
      ['2026-10-25', '年-月-日，知道具體哪一天'],
      ['2026-10', '年-月，只知道月份'],
      ['2026', '年，只知道年份'],
    ],
    where: '專輯頁標題下面的日期標籤。依發售時間排序和依年份篩選也用它。',
  },
  'album.release_event': {
    text: '在 M3、Comic Market 等活動首發時，搜尋並選上那一屆。不是活動首發就留空。',
    examples: ['M3-2026 Autumn', 'C107'],
    where: '專輯頁標題下面的活動標籤，點開是這場活動的所有專輯。活動頁也會列出這張專輯。',
  },
  'album.catalog_number': {
    text: '第一個版本的品番，通常印在側標或背面。有好幾個版本時，到「版本」裡分別填。\n離開輸入框時會自動整理寫法。',
    rows: [
      ['KICA-1234', '一張碟'],
      ['KICA-1234~5', '連號的多張碟'],
      ['ABC-1 / ABC-3', '不連號時用 / 分開'],
    ],
    where: '專輯頁標題下面的品番標籤、發行卡片和列表，也可以用來搜尋。',
  },
  'album.barcode': {
    text: '第一個版本的 JAN 或 EAN 條碼，只填數字。有好幾個版本時，到「版本」裡分別填。',
    examples: ['4988003123456'],
    where: '頁面上不顯示，用來搜尋和新建時查重。',
  },
  'album.categories': {
    text: '音樂出自哪裡，可以多選。藝術家自己的原創專輯留空。關聯了條目以後，這裡會出現建議。',
    where: '專輯頁標題上方的標籤。專輯列表也可以依類別篩選。',
  },
  'album.description': {
    text: '這張專輯的背景和說明，例如企劃緣由、收錄情況。以純文字顯示，換行和空格都會保留，網址會自動變成連結。',
    where: '專輯頁的「簡介」卡片。',
  },
  'album.slug': {
    text: '選填，只能用小寫字母、數字和連字號。',
    examples: ['my-album-2024'],
    where: '目前專輯頁的網址用的是數字編號，這一項暫時不顯示在任何地方。',
  },
  'album.is_adult': {
    text: '成人向的專輯開啟這一項。',
    where: '專輯頁照常顯示，同時告訴搜尋引擎這是成人內容。',
  },

  // ── Discs and tracks
  'disc': {
    rows: [
      ['格式', '這張碟的載體。HQCD、SHM-CD 等都算 CD'],
      ['碟片標題', '碟上印了標題才填，如「DISC 2 Instrumental」'],
    ],
    where: '曲目表裡每張碟的標題列。版本的形態（如 CD+BD）也由格式算出來。',
    mock: { page: 'track', mark: 'disc_format' },
  },
  'track.number': {
    text: '在這張碟上的順序，從 1 開始，每張碟分別計數，同一張碟上不能重複。',
    where: '曲目表每行開頭。',
    mock: { page: 'track', mark: 'number' },
  },
  'track.title': {
    text: '依實物上印的原文填寫。在標題裡按 Enter，會跳到下一首。其他語言的曲名在「專輯標題和曲目翻譯」裡填。',
    where: '曲目表和曲目頁。',
    mock: { page: 'track', mark: 'title' },
  },
  'track.duration': {
    text: '只記到秒，不足一秒的部分直接捨去，不四捨五入：3:58.90 記作 3:58。',
    rows: [
      ['3:45', '3 分 45 秒'],
      ['1:02:03', '超過一小時'],
      ['345', '只打數字，讀成 3:45'],
    ],
    where: '曲目表每行右側。碟片和專輯的總時長由它加起來。',
    mock: { page: 'track', mark: 'duration' },
  },
  'track.instrumental': {
    text: '沒有人聲演唱的曲目勾選這一項，例如伴奏和 BGM。',
    where: '曲目表裡標上「純音樂」，這首曲目不顯示歌詞按鈕。',
    mock: { page: 'track', mark: 'instrumental' },
  },
  'track.number_label': {
    text: '實物上印的編號和曲號不同時才填，例如黑膠的 A 面、B 面。',
    examples: ['A1', 'B2'],
    where: '曲目表和曲目頁顯示這個編號，代替曲號。',
    mock: { page: 'track', mark: 'number' },
  },
  'track.isrc': {
    text: '國際標準錄音代碼，12 位，不帶連字號。知道才填。',
    examples: ['JPXX01234567'],
    where: '曲目表的完整顯示和曲目頁。',
  },
  'track.move': {
    text: '有好幾張碟時，把這首曲目移到另一張碟。',
  },
  'track.originals': {
    text: '改編、翻唱、混音和組曲依據的曲子，組曲可以加好幾首。',
    rows: [
      ['資料庫裡有', '搜尋曲目並選上'],
      ['資料庫裡沒有', '直接使用輸入的文字，如「亡き王女の為のセプテット（東方紅魔郷）」'],
    ],
    where: '曲目表和曲目頁。選資料庫裡的曲目時，原曲的曲目頁也會列出這首改編。',
    mock: { page: 'track', mark: 'original' },
  },
  'track.attributes': {
    text: '管理員定義的補充資訊，例如 BPM。選好項目後，依它的提示填寫。',
    where: '曲目表的完整顯示和曲目頁。',
  },

  // ── People on the album
  'person.credited_as': {
    text: '實物上印的名字和藝術家的名字不同時才填，相同就留空。',
    rows: [
      ['Yuki Kajiura', '資料庫裡叫 梶浦由記：選 梶浦由記，這裡填 Yuki Kajiura'],
      ['リコ(CV:富田美憂)', '選聲優 富田美憂，這裡照印的寫'],
    ],
    where: '頁面上顯示這個名字，連結仍然指向藝術家。',
    mock: { page: 'track', mark: 'credit' },
  },
  'person.detail': {
    text: '給讀者看的補充說明，想寫什麼都可以。實物上印的職務寫在「具體職務」裡，不寫在這裡。',
    examples: ['5弦', '僅限定盤收錄'],
    where: '人名旁的 i 圖示，懸停或點按時顯示。',
    mock: { page: 'track', mark: 'detail' },
  },
  'person.role_label': {
    text: '實物上印的職務比角色字典細時填。角色選最接近的一個，這裡照印刷的寫。',
    rows: [
      ['Logo Design', '角色選「設計」'],
      ['Flute', '樂器沒有專屬角色時，角色選「演奏」'],
      ['Crossfade Video', '字典裡沒有合適的角色時，角色選「其他」'],
    ],
    where: '頁面上用這段文字代替角色名，所有語言都顯示原文。',
    mock: { page: 'track', mark: 'role_label' },
  },
  'person.join_phrase': {
    text: '兩位藝術家之間印著 meets、vs 這類詞，又想保留時填。兩人都還是藝術家，只是頁面上連成一個標籤。',
    dont: ['一般的並列署名不用填，兩位分開顯示就好', 'feat. 不寫在這裡，後面的人角色選 Featuring'],
    where: '曲目表和曲目頁的藝術家一行。人員列表和藝術家頁不顯示。',
  },
  'person.parent': {
    text: '這位 Featuring 跟著同一首曲目裡的哪一位。預設是排在它前面的那位。',
    rows: [
      ['Gardens feat. moon jelly', 'moon jelly 的角色選 Featuring，所屬選 Gardens'],
      ['Xeno feat. eili', 'eili 的角色選 Featuring，所屬選 Xeno'],
    ],
    where: '曲目表裡，這兩個名字連在一起顯示。',
  },
  'person.link_artist': {
    text: '現在只記了署名。這個人資料庫裡有的話，搜尋並選上，名字就能點開到藝術家頁。',
  },
  'artist.type': {
    text: '選這位藝術家的身分。資料庫裡沒有的人新建時才要選，選好才能提交。',
    examples: ['個人', '團體', '同人社團'],
    where: '藝術家頁，以及藝術家列表的篩選。',
  },

  // ── Editions
  'edition.name': {
    text: '實物或商店上的叫法。只有一個版本時可以不填。',
    examples: ['初回限定盤', '通常盤', '配信版'],
    where: '專輯頁「發行」卡片。沒填時，第一個版本顯示版本類型（如「通常版」），其他版本顯示 Release #編號。',
    mock: { page: 'edition', mark: 'name' },
  },
  'edition.type': {
    text: '通常盤還是限定盤。選限定盤後，可以再填限定方式和限定名稱。',
    where: '「發行」卡片的版本類型一欄，顯示「通常版」或「限定版」。',
    mock: { page: 'edition', mark: 'type' },
  },
  'edition.medium': {
    text: '實體還是數位內容。配信版和 CD 內容相同時，同樣勾選 Disc 1，只把載體設為數位內容。',
    where: '「發行」卡片的載體一欄，顯示「實體版」或「數位版」。',
    mock: { page: 'edition', mark: 'medium' },
  },
  'edition.limited_rule': {
    text: '這張限定盤怎麼限定：初回、數量、期間、店鋪、會場或地區。',
    where: '「發行」卡片版本名下面的標籤，如「首批限定」。',
    mock: { page: 'edition', mark: 'limited' },
  },
  'edition.limited_name': {
    text: '限定盤自己的叫法，例如是哪家店的限定。',
    examples: ['Animate 限定'],
    where: '「發行」卡片，版本名下面。',
  },
  'edition.catalog_number': {
    text: '這個版本的品番，離開輸入框時會自動整理寫法。',
    rows: [
      ['KICA-1234', '一張碟'],
      ['KICA-1234~5', '連號的多張碟'],
      ['ABC-1 / ABC-3', '不連號時用 / 分開'],
    ],
    where: '「發行」卡片，版本名下面。排在最前面且填了品番的版本，品番還顯示在專輯頁標題下面和列表上。',
    mock: { page: 'edition', mark: 'catalog' },
  },
  'edition.barcode': {
    text: '這個版本的 JAN 或 EAN 條碼，只填數字。',
    examples: ['4988003123456'],
    where: '頁面上不顯示，用來搜尋和新建時查重。',
  },
  'edition.release_date': {
    text: '和專輯的發行日期不同時才填，例如再版或晚一些的配信。寫法和專輯的日期一樣，依年-月-日的順序填。',
    examples: ['2026-10-25', '2026-10', '2026'],
    where: '「發行」卡片版本名下面的標籤。',
    mock: { page: 'edition', mark: 'date' },
  },
  'edition.region': {
    text: '這個版本在哪個地區發行。',
    where: '「發行」卡片版本名下面的標籤，顯示旗幟和英文地區名。',
    mock: { page: 'edition', mark: 'region' },
  },
  'edition.discs': {
    text: '勾選這個版本包含的碟，形態（如 CD+BD）會自動算出來。每張普通的碟至少要被一個版本勾選。',
    dont: ['特典碟不屬於任何版本，不能勾選'],
    where: '「發行」卡片版本名下面的標籤：實體版顯示 CD+BD 這樣的形態，碟不止一張時還有 Disc 1–2。',
    mock: { page: 'edition', mark: 'discs' },
  },
  'edition.hires': {
    text: '高解析度音源勾選這一項。',
    where: '「發行」卡片版本名下面的 Hi-Res 標籤。',
    mock: { page: 'edition', mark: 'hires' },
  },
  'edition.available': {
    text: '已經停售的版本關掉這一項。',
    where: '關掉後，「發行」卡片版本名下面標上「已絕版」。',
    mock: { page: 'edition', mark: 'sold_out' },
  },
  'edition.prices': {
    text: '一個版本可以有好幾個價格，點下面的類型新增：定價、會場價、通販價或其他價格。',
    rows: [
      ['金額', '只填數字，如 3300'],
      ['貨幣', '三個字母的代碼，如 JPY、CNY、USD'],
      ['稅', '印的是含稅價還是未稅價，不知道就不選'],
      ['備註', '在哪裡賣的這個價，如 C107、メロンブックス'],
    ],
    where: '「發行」卡片的價格一欄。排在最前的價格顯示在行內，有好幾個時點開能看到全部；沒填時顯示「暫無價格」。',
    mock: { page: 'edition', mark: 'price' },
  },
  'edition.note': {
    text: '這個版本和其他版本不一樣的地方，可以寫幾行。',
    examples: ['2024 年再版，封面與初版不同'],
    where: '「發行」卡片，這個版本的下面單獨一行，佔滿寬度。',
    mock: { page: 'edition', mark: 'note' },
  },

  // ── Bonuses
  'bonus.name': {
    text: '特典的名稱，照店鋪或官方的寫法填。',
    examples: ['とらのあな特典 B2タペストリー'],
    where: '專輯頁「發行與特典」卡片的特典表。',
  },
  'bonus.type': {
    text: '特典是什麼東西：特典曲、特典碟、小冊子、照片、周邊、數位內容、序號、活動參加券、簽名或其他。',
    where: '特典行的類型一欄。',
  },
  'bonus.shop': {
    text: '送這個特典的店。',
    examples: ['Animate', 'とらのあな', 'メロンブックス'],
    where: '特典名下面的標籤。',
  },
  'bonus.availability': {
    text: '怎樣才能拿到：初回、數量、期間、店鋪、會場或地區限定。',
    where: '特典名下面的標籤。',
  },
  'bonus.event': {
    text: '會場特典是哪一屆活動送的，搜尋並選上。',
    examples: ['M3-2026 Autumn'],
    where: '特典名下面的標籤，點開是這場活動的所有專輯。',
  },
  'bonus.is_digital': {
    text: '下載或序號形式的特典勾選這一項。',
    where: '特典名下面的 DL 標籤。',
  },
  'bonus.editions': {
    text: '只有某些版本才送時，勾選那些版本。所有版本都送就一個都不勾。',
    where: '特典名下面的標籤，一個都不勾時不顯示，表示所有版本都有。',
  },
  'bonus.discs': {
    text: '特典是一張 CD 時，在這裡新建特典碟，或者把已有的碟改成特典碟。新建的碟要到「碟片與曲目」裡填曲目，那裡帶粉色的「特典」標記。',
    where: '特典名下面的 Disc 標籤，點一下跳到曲目表裡那張碟。',
  },
  'bonus.description': {
    text: '這個特典是什麼樣的：尺寸、內容、收錄曲。',
    examples: ['272mm×242mm、OPP 袋入り'],
    where: '特典下面單獨一行，佔滿寬度。',
  },
  'bonus.note': {
    text: '取得條件。',
    examples: ['購入者全員', '抽選'],
    where: '特典下面單獨一行，說明下面的小字。',
  },

  // ── Images
  'image.banner': {
    text: '專輯頁頂端的橫條，可以不傳。建議比例 4:1 左右，重要的內容放在中間，多出來的部分會居中裁掉。',
    where: '專輯頁頂端。沒有橫幅時用封面模糊後代替。',
  },
  'image.gallery': {
    text: '正面、背面、歌詞本、碟面等實物圖。上傳後逐張檢查：',
    rows: [
      ['類別', '依檔名猜測，猜錯了在這裡改'],
      ['標籤', '補充位置，如歌詞本的頁碼「p. 01-02」、碟面的「Disc 2」'],
      ['屬於', '整張專輯，或者只屬於某個版本、某個特典、某張碟'],
      ['說明', '選填的說明文字'],
    ],
    where: '專輯頁的圖片卡片和看圖視窗。',
  },

  // ── Links and relations
  'entry.entry': {
    text: '這張專輯所屬的遊戲、動畫等作品，搜尋並選上。資料庫裡沒有的話，先新建條目。',
    where: '專輯頁「簡介」卡片的關聯條目。條目頁也會列出這張專輯。',
  },
  'entry.relation': {
    text: '這張專輯和作品是什麼關係，例如原聲帶、主題曲、角色歌。',
    where: '專輯頁關聯條目後面的小字。',
  },
  'entry.note': {
    text: '需要補充說明時才填，例如這首主題曲用在哪一季。',
    where: '目前頁面上不顯示，只留在資料裡。',
  },
  'link.url': {
    text: '貼上完整的網址，以 http:// 或 https:// 開頭。網站會自動識別。',
    examples: ['https://example.bandcamp.com/album/atlas'],
    where: '頁面的連結卡片，串流的連結單獨顯示成按鈕。',
  },
  'link.provider': {
    text: '這個連結屬於哪個網站，根據網址自動識別，識別錯了可以手動改。列表裡沒有的網站留空。',
    where: '連結卡片上顯示的網站名和顏色。',
  },
  'link.label': {
    text: '可以不填。同一網站有幾個連結時用來區分。',
    examples: ['官方 MV', '試聽 XFD'],
    where: '網站名後面，如「YouTube · 官方 MV」。',
  },
  'attribute.key': {
    text: '要補充哪一項資訊。項目由管理員定義，選好後下面會有它的說明。',
  },
  'attribute.value': {
    text: '依上面項目的說明填寫，不確定就不要填。',
    where: '專輯、曲目或圖片的資訊裡，顯示成「項目名 值」。',
  },

  // ── Album title and track translations
  'translate.names': {
    text: '左邊是原名，右邊填這種語言的名稱。不知道的行留空。',
    rows: [
      ['官方名稱', '印在實物、官網或官方商店上的'],
      ['翻譯', '自己或社群翻譯的'],
      ['讀法', '原名的羅馬字或假名讀法'],
    ],
    dont: ['機器翻譯的名稱不要填成官方名稱'],
    where: '介面是這種語言時，專輯頁先顯示官方名稱，再顯示翻譯；列表不顯示譯名。所有名稱都能被搜到。',
  },

  // ── Review and submit
  'submit.summary': {
    text: '改了什麼、為什麼改，審核的人先看這裡。新建時寫一句來源或背景也可以。',
    examples: ['補充 Disc 2 的曲目時長'],
    where: '版本歷史和審核頁。',
  },
  'submit.sources': {
    text: '每行一個連結或出處，審核的人能更快核對。',
    examples: ['歌詞本', 'https://vgmdb.net/album/1234'],
    where: '版本歷史和審核頁。',
  },
}

export default help
