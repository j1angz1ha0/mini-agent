/* 皮肤格式定义 + 内置皮肤。
 *
 * 一套「皮肤」= 外观(svg) + 人设(persona) + 固定反应(reactions)。
 *  - svg:       宠物长相
 *  - persona:   发给大模型的角色设定，决定它的说话风格（换皮肤=换人格）
 *  - reactions: 零成本的固定反应（单击说什么、打招呼说什么），不消耗 LLM
 *
 * 以后「上传图片 AI 生成皮肤」「社区分享」生成/下载的，就是这样一个对象。
 */

const SKINS = [
  {
    id: "cat",
    name: "橘猫",
    emoji: "🐱",
    persona:
      "你是一只慵懒可爱的橘猫，说话简短、软萌，句尾经常加“喵~”。偶尔会卖萌或表现得有点高冷。",
    reactions: {
      greeting: "喵~ 主人好呀！",
      click: ["喵~", "喵呜？", "在摸鱼…喵", "想我了喵？"],
    },
    svg: `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="100" cy="185" rx="55" ry="10" fill="rgba(0,0,0,0.12)" />
        <ellipse cx="100" cy="125" rx="62" ry="58" fill="#ffd66b" />
        <polygon points="55,80 45,30 90,62" fill="#ffd66b" />
        <polygon points="145,80 155,30 110,62" fill="#ffd66b" />
        <polygon points="58,72 52,45 80,62" fill="#ff9ec4" />
        <polygon points="142,72 148,45 120,62" fill="#ff9ec4" />
        <ellipse cx="100" cy="115" rx="50" ry="46" fill="#ffe49a" />
        <ellipse cx="80" cy="108" rx="8" ry="11" fill="#3a3a3a" />
        <ellipse cx="120" cy="108" rx="8" ry="11" fill="#3a3a3a" />
        <circle cx="83" cy="104" r="3" fill="#fff" />
        <circle cx="123" cy="104" r="3" fill="#fff" />
        <ellipse cx="68" cy="128" rx="9" ry="6" fill="#ff9ec4" opacity="0.7" />
        <ellipse cx="132" cy="128" rx="9" ry="6" fill="#ff9ec4" opacity="0.7" />
        <path d="M96 122 q4 5 8 0" stroke="#3a3a3a" stroke-width="2" fill="none" stroke-linecap="round" />
        <line x1="40" y1="115" x2="65" y2="118" stroke="#caa64a" stroke-width="2" />
        <line x1="40" y1="125" x2="65" y2="125" stroke="#caa64a" stroke-width="2" />
        <line x1="160" y1="115" x2="135" y2="118" stroke="#caa64a" stroke-width="2" />
        <line x1="160" y1="125" x2="135" y2="125" stroke="#caa64a" stroke-width="2" />
      </svg>`,
  },

  {
    id: "dog",
    name: "小狗",
    emoji: "🐶",
    persona:
      "你是一只热情活泼、忠诚的小狗，说话充满活力和正能量，句尾经常加“汪！”。你很黏人，喜欢鼓励主人。",
    reactions: {
      greeting: "汪汪！主人你回来啦！",
      click: ["汪！", "汪汪~", "陪我玩嘛！汪", "最喜欢主人了汪！"],
    },
    svg: `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="100" cy="185" rx="55" ry="10" fill="rgba(0,0,0,0.12)" />
        <!-- 耳朵（下垂） -->
        <ellipse cx="52" cy="120" rx="20" ry="38" fill="#a4744f" />
        <ellipse cx="148" cy="120" rx="20" ry="38" fill="#a4744f" />
        <!-- 头 -->
        <ellipse cx="100" cy="118" rx="58" ry="54" fill="#c8956a" />
        <ellipse cx="100" cy="118" rx="48" ry="45" fill="#e0b48a" />
        <!-- 眼睛 -->
        <ellipse cx="80" cy="105" rx="8" ry="10" fill="#3a3a3a" />
        <ellipse cx="120" cy="105" rx="8" ry="10" fill="#3a3a3a" />
        <circle cx="83" cy="101" r="3" fill="#fff" />
        <circle cx="123" cy="101" r="3" fill="#fff" />
        <!-- 口鼻 -->
        <ellipse cx="100" cy="135" rx="24" ry="18" fill="#f0d9bf" />
        <ellipse cx="100" cy="126" rx="9" ry="6" fill="#3a3a3a" />
        <path d="M100 132 v8 M100 140 q-8 5 -14 1 M100 140 q8 5 14 1" stroke="#3a3a3a" stroke-width="2" fill="none" stroke-linecap="round" />
      </svg>`,
  },

  {
    id: "robot",
    name: "机器人",
    emoji: "🤖",
    persona:
      "你是一个理性、严谨的 AI 机器人助手，说话简洁、有条理，偶尔使用“滴——”“指令已接收”等机械化表达。语气专业但不冷漠。",
    reactions: {
      greeting: "系统启动完成。等待指令。",
      click: ["滴——", "指令已接收。", "正在待命。", "需要我做什么？"],
    },
    svg: `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="100" cy="188" rx="50" ry="9" fill="rgba(0,0,0,0.12)" />
        <!-- 天线 -->
        <line x1="100" y1="55" x2="100" y2="30" stroke="#7c8aa0" stroke-width="4" />
        <circle cx="100" cy="26" r="7" fill="#ff6b6b" />
        <!-- 头部 -->
        <rect x="48" y="55" width="104" height="92" rx="20" fill="#aebfd4" />
        <rect x="58" y="68" width="84" height="56" rx="12" fill="#2b3a4a" />
        <!-- 眼睛 -->
        <circle cx="82" cy="92" r="9" fill="#4be0ff" />
        <circle cx="118" cy="92" r="9" fill="#4be0ff" />
        <!-- 嘴（指示灯条） -->
        <rect x="78" y="108" width="44" height="6" rx="3" fill="#4be0ff" opacity="0.8" />
        <!-- 耳朵螺丝 -->
        <circle cx="48" cy="100" r="7" fill="#7c8aa0" />
        <circle cx="152" cy="100" r="7" fill="#7c8aa0" />
      </svg>`,
  },
];

const DEFAULT_SKIN_ID = "cat";

function getSkinById(id) {
  return SKINS.find((s) => s.id === id) || SKINS[0];
}
