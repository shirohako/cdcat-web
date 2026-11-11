import type { EditorHelpEntry } from './types'

/** The album editor's field help. Facts follow /docs/editor (app/guides/editor); ids are used by <EditorHelp id="…">. */
const help: Record<string, EditorHelpEntry> = {
  // ── 基本信息
  'album.cover': {
    text: '专辑的正面封面，最好是正方形，短边至少 500 像素。比例只差一点时会自动从中间裁好；差得多会先问你：裁成正方形，还是保留原比例（最长 2:1）。只有实物封面本来就不是正方形时（DVD 盒、卡带等）才保留，这样的封面只在专辑页按原比例显示，其他地方都裁成正方形。',
    where: '专辑列表、卡片和专辑页顶部。',
  },
  'album.title': {
    text: '按专辑封面上印的原文填写。',
    dont: ['不要加「初回限定盘」这样的版本说明，版本在「版本」里填'],
    where: '专辑页、列表和搜索结果。专辑页在界面语言有官方名称或翻译时先显示它，这个标题显示在下面；列表和搜索结果只显示这个标题。',
  },
  'album.release_date': {
    text: '按年-月-日的顺序填，年写 4 位，月和日写 2 位。',
    rows: [
      ['2026-10-25', '年-月-日，知道具体哪一天'],
      ['2026-10', '年-月，只知道月份'],
      ['2026', '年，只知道年份'],
    ],
    where: '专辑页标题下面的日期标签。按发售时间排序和按年份筛选也用它。',
  },
  'album.release_event': {
    text: '在 M3、Comic Market 等活动首发时，搜索并选上那一届。不是活动首发就留空。',
    examples: ['M3-2026 Autumn', 'C107'],
    where: '专辑页标题下面的活动标签，点开是这场活动的所有专辑。活动页也会列出这张专辑。',
  },
  'album.catalog_number': {
    text: '第一个版本的品番，通常印在侧标或背面。有好几个版本时，到「版本」里分别填。\n离开输入框时会自动整理写法。',
    rows: [
      ['KICA-1234', '一张碟'],
      ['KICA-1234~5', '连号的多张碟'],
      ['ABC-1 / ABC-3', '不连号时用 / 分开'],
    ],
    where: '专辑页标题下面的品番标签、发行卡片和列表，也可以用来搜索。',
  },
  'album.barcode': {
    text: '第一个版本的 JAN 或 EAN 条码，只填数字。有好几个版本时，到「版本」里分别填。',
    examples: ['4988003123456'],
    where: '页面上不显示，用来搜索和新建时查重。',
  },
  'album.categories': {
    text: '音乐出自哪里，可以多选。艺术家自己的原创专辑留空。关联了条目以后，这里会出现建议。',
    where: '专辑页标题上方的标签。专辑列表也可以按类别筛选。',
  },
  'album.description': {
    text: '这张专辑的背景和说明，比如企划缘由、收录情况。按纯文本显示，换行和空格都保留，网址会自动变成链接。',
    where: '专辑页的「简介」卡片。',
  },
  'album.slug': {
    text: '可选，只能用小写字母、数字和连字符。',
    examples: ['my-album-2024'],
    where: '目前专辑页的地址用的是数字编号，这一项暂时不显示在任何地方。',
  },
  'album.is_adult': {
    text: '成人向的专辑打开这一项。',
    where: '专辑页照常显示，同时告诉搜索引擎这是成人内容。',
  },

  // ── 碟片与曲目
  'disc': {
    rows: [
      ['介质', '这张碟的载体。HQCD、SHM-CD 等都算 CD'],
      ['碟片标题', '碟上印了标题才填，如「DISC 2 Instrumental」'],
    ],
    where: '曲目表里每张碟的标题栏。版本的形态（如 CD+BD）也由介质算出来。',
    mock: { page: 'track', mark: 'disc_format' },
  },
  'track.number': {
    text: '在这张碟上的顺序，从 1 开始，每张碟分别计数，同一张碟上不能重复。',
    where: '曲目表每行开头。',
    mock: { page: 'track', mark: 'number' },
  },
  'track.title': {
    text: '按实物上印的原文填写。在标题里按回车，会跳到下一首。其他语言的曲名在「专辑标题和曲目翻译」里填。',
    dont: ['漏了一首时，不要把后面的曲目逐个改成下一首的曲名，用「插入曲目」补上'],
    where: '曲目表和曲目页。',
    mock: { page: 'track', mark: 'title' },
  },
  'track.duration': {
    text: '只记到秒，不足一秒的部分直接舍去，不四舍五入：3:58.90 记作 3:58。',
    rows: [
      ['3:45', '3 分 45 秒'],
      ['1:02:03', '超过一小时'],
      ['345', '只打数字，读成 3:45'],
    ],
    where: '曲目表每行右侧。碟片和专辑的总时长由它加起来。',
    mock: { page: 'track', mark: 'duration' },
  },
  'track.instrumental': {
    text: '没有人声演唱的曲目勾选这一项，比如伴奏和 BGM。',
    where: '曲目表里标上「纯音乐」，这首曲目不显示歌词按钮。',
    mock: { page: 'track', mark: 'instrumental' },
  },
  'track.number_label': {
    text: '实物上印的编号和曲号不同时才填，比如黑胶的 A 面、B 面。',
    examples: ['A1', 'B2'],
    where: '曲目表和曲目页显示这个编号，代替曲号。',
    mock: { page: 'track', mark: 'number' },
  },
  'track.isrc': {
    text: '国际标准录音代码，12 位，不带连字符。知道才填。',
    examples: ['JPXX01234567'],
    where: '曲目表的完整显示和曲目页。',
  },
  'track.move': {
    text: '有好几张碟时，把这首曲目移到另一张碟。',
  },
  'track.originals': {
    text: '改编、翻唱、混音和组曲依据的曲子，组曲可以加好几首。',
    rows: [
      ['库里有', '搜索曲目并选上'],
      ['库里没有', '直接使用输入的文字，如「亡き王女の為のセプテット（東方紅魔郷）」'],
    ],
    where: '曲目表和曲目页。选库里的曲目时，原曲的曲目页也会列出这首改编。',
    mock: { page: 'track', mark: 'original' },
  },
  'track.attributes': {
    text: '管理员定义的补充信息，比如 BPM。选好项目后，按它的提示填写。',
    where: '曲目表的完整显示和曲目页。',
  },

  // ── 参与创作的人
  'person.credited_as': {
    text: '实物上印的名字和艺术家的名字不同时才填，相同就留空。',
    rows: [
      ['Yuki Kajiura', '库里叫 梶浦由記：选 梶浦由記，这里填 Yuki Kajiura'],
      ['リコ(CV:富田美憂)', '选声优 富田美憂，这里照印的写'],
    ],
    where: '页面上显示这个名字，链接仍然指向艺术家。',
    mock: { page: 'track', mark: 'credit' },
  },
  'person.detail': {
    text: '给读者看的补充说明，想写什么都可以。实物上印的职务写在「具体职务」里，不写在这里。',
    examples: ['5弦', '仅限定盘收录'],
    where: '人名旁的 i 图标，悬停或点按时显示。',
    mock: { page: 'track', mark: 'detail' },
  },
  'person.role_label': {
    text: '实物上印的职务比角色字典细时填。角色选最接近的一个，这里照印刷的写。',
    rows: [
      ['Logo Design', '角色选「设计」'],
      ['Flute', '乐器没有专属角色时，角色选「演奏」'],
      ['Crossfade Video', '字典里没有合适的角色时，角色选「其他」'],
    ],
    where: '页面上用这段文字代替角色名，所有语言都显示原文。',
    mock: { page: 'track', mark: 'role_label' },
  },
  'person.join_phrase': {
    text: '两位艺术家之间印着 meets、vs 这类词，又想保留时填。两人都还是艺术家，只是页面上连成一个标签。',
    dont: ['普通的并列署名不用填，两位分开显示就好', 'feat. 不写在这里，后面的人角色选 Featuring'],
    where: '曲目表和曲目页的艺术家一行。人员列表和艺术家页不显示。',
  },
  'person.parent': {
    text: '这位 Featuring 跟着同一首曲目里的哪一位。默认是排在它前面的那位。',
    rows: [
      ['Gardens feat. moon jelly', 'moon jelly 的角色选 Featuring，所属选 Gardens'],
      ['Xeno feat. eili', 'eili 的角色选 Featuring，所属选 Xeno'],
    ],
    where: '曲目表里，这两个名字连在一起显示。',
  },
  'person.link_artist': {
    text: '现在只记了署名。这个人库里有的话，搜索并选上，名字就能点开到艺术家页。',
  },
  'artist.type': {
    text: '选这位艺术家的身份。库里没有的人新建时才要选，选好才能提交。',
    examples: ['个人', '团体', '同人社团'],
    where: '艺术家页，以及艺术家列表的筛选。',
  },

  // ── 版本
  'edition.name': {
    text: '实物或商店上的叫法。只有一个版本时可以不填。',
    examples: ['初回限定盤', '通常盤', '配信版'],
    where: '专辑页「发行」卡片。没填时，第一个版本显示版本类型（如「通常版」），其他版本显示 Release #编号。',
    mock: { page: 'edition', mark: 'name' },
  },
  'edition.type': {
    text: '通常盘还是限定盘。选限定盘后，可以再填限定方式和限定名称。',
    where: '「发行」卡片的版本类型一栏，显示「通常版」或「限定版」。',
    mock: { page: 'edition', mark: 'type' },
  },
  'edition.medium': {
    text: '实体还是数字内容。配信版和 CD 内容相同时，同样勾选 Disc 1，只把载体设为数字内容。',
    where: '「发行」卡片的载体一栏，显示「实体版」或「数字版」。',
    mock: { page: 'edition', mark: 'medium' },
  },
  'edition.limited_rule': {
    text: '这张限定盘怎么限定：初回、数量、期间、店铺、活动或地区。',
    where: '「发行」卡片版本名下面的标签，如「初回限定」。',
    mock: { page: 'edition', mark: 'limited' },
  },
  'edition.limited_name': {
    text: '限定盘自己的叫法，比如是哪家店的限定。',
    examples: ['Animate 限定'],
    where: '「发行」卡片，版本名下面。',
  },
  'edition.catalog_number': {
    text: '这个版本的品番，离开输入框时会自动整理写法。',
    rows: [
      ['KICA-1234', '一张碟'],
      ['KICA-1234~5', '连号的多张碟'],
      ['ABC-1 / ABC-3', '不连号时用 / 分开'],
    ],
    where: '「发行」卡片，版本名下面。排在最前面且填了品番的版本，品番还显示在专辑页标题下面和列表上。',
    mock: { page: 'edition', mark: 'catalog' },
  },
  'edition.barcode': {
    text: '这个版本的 JAN 或 EAN 条码，只填数字。',
    examples: ['4988003123456'],
    where: '页面上不显示，用来搜索和新建时查重。',
  },
  'edition.release_date': {
    text: '和专辑的发行日期不同时才填，比如再版或晚一些的配信。写法和专辑的日期一样，按年-月-日的顺序填。',
    examples: ['2026-10-25', '2026-10', '2026'],
    where: '「发行」卡片版本名下面的标签。',
    mock: { page: 'edition', mark: 'date' },
  },
  'edition.region': {
    text: '这个版本在哪个地区发行。',
    where: '「发行」卡片版本名下面的标签，显示旗帜和英文地区名。',
    mock: { page: 'edition', mark: 'region' },
  },
  'edition.discs': {
    text: '勾选这个版本包含的碟，形态（如 CD+BD）会自动算出来。每张普通的碟至少要被一个版本勾选。',
    dont: ['特典碟不属于任何版本，不能勾选'],
    where: '「发行」卡片版本名下面的标签：实体版显示 CD+BD 这样的形态，碟不止一张时还有 Disc 1–2。',
    mock: { page: 'edition', mark: 'discs' },
  },
  'edition.hires': {
    text: '高解析度音源勾选这一项。',
    where: '「发行」卡片版本名下面的 Hi-Res 标签。',
    mock: { page: 'edition', mark: 'hires' },
  },
  'edition.available': {
    text: '已经停售的版本关掉这一项。',
    where: '关掉后，「发行」卡片版本名下面标上「绝版」。',
    mock: { page: 'edition', mark: 'sold_out' },
  },
  'edition.prices': {
    text: '一个版本可以有好几个价格，点下面的类型添加：定价、会场价、通贩价或其他。',
    rows: [
      ['金额', '只填数字，如 3300'],
      ['货币', '三个字母的代码，如 JPY、CNY、USD'],
      ['税', '印的是含税价还是税前价，不知道就不选'],
      ['备注', '在哪里卖的这个价，如 C107、メロンブックス'],
    ],
    where: '「发行」卡片的价格一栏。排在最前的价格显示在行内，有好几个时点开能看到全部；没填时显示「暂无价格」。',
    mock: { page: 'edition', mark: 'price' },
  },
  'edition.note': {
    text: '这个版本和其他版本不一样的地方，可以写几行。',
    examples: ['2024 年再版，封面与初版不同'],
    where: '「发行」卡片，这个版本的下面单独一行，占满宽度。',
    mock: { page: 'edition', mark: 'note' },
  },

  // ── 特典
  'bonus.name': {
    text: '特典的名称，照店铺或官方的写法填。',
    examples: ['とらのあな特典 B2タペストリー'],
    where: '专辑页「发行与特典」卡片的特典表。',
  },
  'bonus.type': {
    text: '特典是什么东西：特典曲、特典碟、小册子、照片、周边、数字内容、序列号、活动参加券、签名或其他。',
    where: '特典行的类型一栏。',
  },
  'bonus.shop': {
    text: '送这个特典的店。',
    examples: ['Animate', 'とらのあな', 'メロンブックス'],
    where: '特典名下面的标签。',
  },
  'bonus.availability': {
    text: '怎样才能拿到：初回、数量、期间、店铺、活动或地区限定。',
    where: '特典名下面的标签。',
  },
  'bonus.event': {
    text: '会场特典是哪一届活动送的，搜索并选上。',
    examples: ['M3-2026 Autumn'],
    where: '特典名下面的标签，点开是这场活动的所有专辑。',
  },
  'bonus.is_digital': {
    text: '下载或序列号形式的特典勾选这一项。',
    where: '特典名下面的 DL 标签。',
  },
  'bonus.editions': {
    text: '只有某些版本才送时，勾选那些版本。所有版本都送就一个都不勾。',
    where: '特典名下面的标签，一个都不勾时不显示，表示所有版本都有。',
  },
  'bonus.discs': {
    text: '特典是一张 CD 时，在这里新建特典碟，或者把已有的碟改成特典碟。新建的碟要到「碟片与曲目」里填曲目，那里带粉色的「特典」标记。',
    where: '特典名下面的 Disc 标签，点一下跳到曲目表里那张碟。',
  },
  'bonus.description': {
    text: '这个特典是什么样的：尺寸、内容、收录曲。',
    examples: ['272mm×242mm、OPP 袋入り'],
    where: '特典下面单独一行，占满宽度。',
  },
  'bonus.note': {
    text: '获得条件。',
    examples: ['購入者全員', '抽選'],
    where: '特典下面单独一行，说明下面的小字。',
  },

  // ── 图片
  'image.banner': {
    text: '专辑页顶部的横条，可以不传。建议比例 4:1 左右，重要的内容放在中间，多出来的部分会居中裁掉。',
    where: '专辑页顶部。没有横幅时用封面模糊后代替。',
  },
  'image.gallery': {
    text: '正面、背面、歌词本、碟面等实物图。上传后逐张检查：',
    rows: [
      ['类别', '按文件名猜测，猜错了在这里改'],
      ['标签', '补充位置，如歌词本的页码「p. 01-02」、碟面的「Disc 2」'],
      ['属于', '整张专辑，或者只属于某个版本、某个特典、某张碟'],
      ['说明', '可选的说明文字'],
    ],
    where: '专辑页的图片卡片和看图窗口。',
  },

  // ── 链接与关联
  'entry.entry': {
    text: '这张专辑所属的游戏、动画等作品，搜索并选上。库里没有的话，先新建条目。',
    where: '专辑页「简介」卡片的关联条目。条目页也会列出这张专辑。',
  },
  'entry.relation': {
    text: '这张专辑和作品是什么关系，比如原声带、主题曲、角色歌。',
    where: '专辑页关联条目后面的小字。',
  },
  'entry.note': {
    text: '需要补充说明时才填，比如这首主题曲用在哪一季。',
    where: '目前页面上不显示，只留在资料里。',
  },
  'link.url': {
    text: '粘贴完整的网址，以 http:// 或 https:// 开头。网站会自动识别。',
    examples: ['https://example.bandcamp.com/album/atlas'],
    where: '页面的链接卡片，流媒体的链接单独显示成按钮。',
  },
  'link.provider': {
    text: '这条链接属于哪个网站，根据网址自动识别，识别错了可以手动改。列表里没有的网站留空。',
    where: '链接卡片上显示的网站名和颜色。',
  },
  'link.label': {
    text: '可以不填。同一网站有几条链接时用来区分。',
    examples: ['官方 MV', '试听 XFD'],
    where: '网站名后面，如「YouTube · 官方 MV」。',
  },
  'attribute.key': {
    text: '要补充哪一项信息。项目由管理员定义，选好后下面会有它的说明。',
  },
  'attribute.value': {
    text: '按上面项目的说明填写，不确定就不要填。',
    where: '专辑、曲目或图片的信息里，显示成「项目名 值」。',
  },

  // ── 专辑标题和曲目翻译
  'translate.names': {
    text: '左边是原名，右边填这种语言的名称。不知道的行留空。',
    rows: [
      ['官方名称', '印在实物、官网或官方商店上的'],
      ['翻译', '自己或社区翻译的'],
      ['读法', '原名的罗马字或假名读法'],
    ],
    dont: ['机器翻译的名称不要填成官方名称'],
    where: '界面是这种语言时，专辑页先显示官方名称，再显示翻译；列表不显示译名。所有名称都能被搜到。',
  },

  // ── 检查并提交
  'submit.summary': {
    text: '改了什么、为什么改，审核的人先看这里。新建时写一句来源或背景也可以。',
    examples: ['补充 Disc 2 的曲目时长'],
    where: '修订历史和审核页。',
  },
  'submit.sources': {
    text: '每行一个链接或出处，审核的人能更快核对。',
    examples: ['歌词本', 'https://vgmdb.net/album/1234'],
    where: '修订历史和审核页。',
  },
  'submit.server_draft': {
    text: '草稿平时只自动保存在这个浏览器。点「保存到 CDCat」把这一份存到你的账号，换设备也能打开继续；之后的修改要再点一次才会存上去。',
    rows: [
      ['谁能看到', '只有你自己'],
      ['数量', '最多 10 份，每份不超过 2 MB'],
      ['保留', '最后一次保存后 30 天删除，只在这份草稿里用到的图片一起删除'],
      ['提交后', '自动删除'],
    ],
    where: '「我的编辑记录」顶部的草稿列表；用草稿 MCP 的 AI 也能读写它。',
  },
}

export default help
