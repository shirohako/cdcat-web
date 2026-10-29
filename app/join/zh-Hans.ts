import type { JoinContent } from './types'

const content: JoinContent = {
  eyebrow: '加入 CDCat',
  title: [{ em: '你', shift: 40 }, '可以让 CDCat 变得', { em: '更好', shift: 200 }],
  lead: 'CDCat 是由音乐爱好者维护的非营利音乐数据库。下面这些岗位正在募集，懂外语、会画画，或者收了一柜子 CD，都有能出力的地方。',
  stats: { roles: '{count} 个岗位募集中', groups: '{count} 个领域', spare: '业余时间参与' },
  badge: { role: 'CDCAT · STAFF', name: '就差你了' },
  groups: [
    {
      id: 'catalog',
      name: '资料',
      desc: '收录与核对',
      shift: 30,
      roles: [
        { name: '情报高手', icon: 'lucide:search-check', desc: '审核用户新建的专辑，补充尚未收录的专辑资料，核实并更正用户反馈的错误。' },
        { name: '歌词', icon: 'lucide:file-music', desc: '把歌词本或流媒体上的歌词录入站内，和曲目一一对应。' },
        { name: '收藏家', icon: 'lucide:disc-3', desc: '手边有不少 CD，也有扫描设备，愿意把歌词本等实体资料扫描上传。' },
      ],
    },
    {
      id: 'language',
      name: '语言',
      desc: '翻译与校对',
      shift: -110,
      roles: [
        { name: '翻译', icon: 'lucide:languages', desc: '熟练掌握日语，翻译歌词，以及歌词本里的解说、制作人员名单等内容。' },
        { name: '校对', icon: 'lucide:spell-check', desc: '有一定翻译经验，母语功底扎实，外语达到商务沟通水平，为译文的准确和通顺把关。' },
        { name: '界面翻译', icon: 'lucide:globe', desc: '把网站界面翻译成你擅长的语言，并跟进新功能的文案。' },
      ],
    },
    {
      id: 'creative',
      name: '创作',
      desc: '内容与视觉',
      shift: 50,
      roles: [
        { name: '编辑', icon: 'lucide:pen-line', desc: '表达能力好、母语水平高，撰写音乐相关的专栏文章和乐评。' },
        { name: '视频', icon: 'lucide:clapperboard', desc: '了解视频制作，能剪辑专辑介绍、站点宣传或使用教程等视频。' },
        { name: '美术', icon: 'lucide:palette', desc: '会画画，为网站绘制插画素材：用户默认头像和横幅、站点 Logo，以及各页面的配图。' },
      ],
    },
    {
      id: 'product',
      name: '产品',
      desc: '设计、产品与测试',
      shift: 150,
      roles: [
        { name: '设计', icon: 'lucide:layout-template', desc: '为网站的视觉风格、排版、图标、过渡动画和交互逻辑提供指导和建议。' },
        { name: '产品', icon: 'lucide:lightbulb', desc: '收集用户的意见和反馈，把大家需要的新功能整理成提案。' },
        { name: '测试', icon: 'lucide:bug', desc: '抢先试用新功能，发现问题并整理成能复现的反馈。' },
      ],
    },
    {
      id: 'community',
      name: '社区',
      desc: '交流与推广',
      shift: 90,
      roles: [
        { name: '社区管理', icon: 'lucide:shield-check', desc: '维护讨论区和交流群的秩序，处理举报，让交流保持友好。' },
        { name: '推广', icon: 'lucide:megaphone', desc: '在社交平台发布 CDCat 的动态，让更多喜欢音乐的人知道这里。' },
      ],
    },
  ],
  admin: {
    pass: 'ALL ACCESS',
    eyebrow: 'ADMINISTRATOR · CDCAT STAFF',
    name: '管理员',
    tag: '长期',
    requirements: ['胜任上面任意一项工作', '能长期投入，和大家一起把 CDCat 做好', '乐于交流，有事愿意和大家商量'],
  },
  join: {
    title: '怎样加入',
    desc: '不需要简历',
    steps: [
      { title: '挑一个岗位', desc: '看看哪件事是你擅长或想试试的，多选也可以。' },
      { title: '加入交流群', desc: '在 Telegram 群或 QQ 群里找管理员。' },
      { title: '介绍一下自己', desc: '说说你会什么，平时喜欢听什么音乐。' },
      { title: '从一件小事开始', desc: '先接一个小任务，熟悉之后再慢慢多做。' },
    ],
  },
}

export default content
