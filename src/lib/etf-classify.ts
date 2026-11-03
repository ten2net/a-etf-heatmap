/**
 * ETF 板块归类：代码段 + 名称关键词规则。
 *
 * 交易所只提供基金代码与简称，没有统一的主题分类，因此这里用一套顺序规则
 * 把沪深两市 ETF 归入 7 大类：
 *   broad        宽基（大盘 / 中小盘 / 双创等）
 *   hangye       行业主题（科技、证券、医药、消费、军工……）
 *   crossborder  跨境（港股、美股、日经、欧洲……）
 *   commodity    商品（黄金、白银、原油、豆粕……）
 *   bond         债券
 *   money        货币
 *   other        其他
 *
 * 规则顺序即优先级：越靠前越具体。名称末尾的基金公司简称会先被剥离，
 * 避免「华安黄金ETF」被当成公司名匹配。
 */

import type { EtfFamilyKey } from "@/lib/market-heatmap";

export type EtfClassification = {
  family: EtfFamilyKey;
  boardName: string;
  subBoardName: string;
};

export const familyBoardNames: Record<EtfFamilyKey, string> = {
  broad: "宽基",
  hangye: "行业",
  crossborder: "跨境",
  commodity: "商品",
  bond: "债券",
  money: "货币",
  other: "其他",
};

const broadRules: Array<{ subBoardName: string; keywords: string[] }> = [
  { subBoardName: "中证A系列", keywords: ["A50", "A100", "A500", "中证A"] },
  { subBoardName: "上证50", keywords: ["上证50", "上50"] },
  { subBoardName: "沪深300", keywords: ["沪深300", "300"] },
  { subBoardName: "中证500", keywords: ["中证500", "500"] },
  { subBoardName: "中证1000", keywords: ["中证1000", "1000"] },
  { subBoardName: "中证2000", keywords: ["中证2000", "2000"] },
  { subBoardName: "创业板", keywords: ["创业板", "创业"] },
  { subBoardName: "科创板", keywords: ["科创"] },
  { subBoardName: "北证", keywords: ["北证", "北交"] },
  { subBoardName: "深证", keywords: ["深证", "深成", "深100", "深红利"] },
  { subBoardName: "上证", keywords: ["上证"] },
  { subBoardName: "红利低波", keywords: ["红利", "低波", "价值", "质量", "股息"] },
  { subBoardName: "成长风格", keywords: ["成长", "动量", "等权"] },
  { subBoardName: "规模指数", keywords: ["超大盘", "治理", "双创", "龙头", "中证全指", "全指", "国证", "综指"] },
];

const industryRules: Array<{ subBoardName: string; keywords: string[] }> = [
  {
    subBoardName: "金融",
    keywords: ["证券", "券商", "银行", "保险", "金融", "非银"],
  },
  {
    subBoardName: "科技",
    keywords: [
      "芯片", "半导体", "集成电路", "科技", "信息技术", "软件", "计算机", "通信", "5G", "云计算", "大数据",
      "人工智能", "AI", "机器人", "数字经济", "信创", "电子", "游戏", "传媒", "网科", "云50",
    ],
  },
  {
    subBoardName: "医药",
    keywords: ["医药", "医疗", "生物", "创新药", "疫苗", "CRO", "医疗器械", "中药", "基因"],
  },
  {
    subBoardName: "消费",
    keywords: ["消费", "白酒", "食品", "饮料", "酒", "农业", "养殖", "畜牧", "家电", "旅游", "零售", "新消费"],
  },
  {
    subBoardName: "新能源",
    keywords: ["新能源", "光伏", "电池", "锂电", "储能", "碳中和", "风电", "氢能", "电力设备", "新能车"],
  },
  {
    subBoardName: "汽车",
    keywords: ["汽车", "车", "智能车"],
  },
  {
    subBoardName: "资源",
    keywords: ["有色", "钢铁", "煤炭", "化工", "材料", "稀土", "稀有", "矿产", "锂"],
  },
  {
    subBoardName: "能源",
    keywords: ["能源", "石油", "油气", "石化", "电力", "核电", "公用事业", "燃气"],
  },
  {
    subBoardName: "军工",
    keywords: ["军工", "国防", "航空航天", "兵装"],
  },
  {
    subBoardName: "基建",
    keywords: ["基建", "建筑", "建材", "工程", "水利", "城投", "土地"],
  },
  {
    subBoardName: "制造",
    keywords: ["制造", "机械", "工业", "高端装备", "装备", "机床"],
  },
  {
    subBoardName: "环保",
    keywords: ["环保", "绿色", "低碳", "ESG"],
  },
  {
    subBoardName: "地产",
    keywords: ["地产", "房地产", "物业"],
  },
  {
    subBoardName: "交通运输",
    keywords: ["交通", "运输", "物流", "港口", "航运", "机场", "航空"],
  },
  {
    subBoardName: "周期",
    keywords: ["周期", "红利低波", "价值100"],
  },
];

const crossBorderRules: Array<{ subBoardName: string; keywords: string[] }> = [
  { subBoardName: "港股", keywords: ["港股", "恒生", "恒指", "H股", "港科技", "香港"] },
  { subBoardName: "美股", keywords: ["纳指", "纳斯达克", "标普", "美国", "美股", "道琼斯"] },
  { subBoardName: "日韩", keywords: ["日经", "日本", "东证", "韩国", "中韩"] },
  { subBoardName: "东南亚", keywords: ["东南亚", "越南", "印度", "沙特", "亚太"] },
  { subBoardName: "欧洲", keywords: ["德国", "法国", "英国", "欧洲"] },
  { subBoardName: "全球", keywords: ["全球", "QDII", "海外", "国际"] },
];

const commodityRules: Array<{ subBoardName: string; keywords: string[] }> = [
  { subBoardName: "贵金属", keywords: ["黄金", "白银", "金ETF", "有色期货"] },
  { subBoardName: "能源化工", keywords: ["原油", "石油", "能源化工", "化工"] },
  { subBoardName: "农产品", keywords: ["豆粕", "农产品", "大豆", "玉米"] },
  { subBoardName: "商品", keywords: ["商品"] },
];

const bondKeywords = ["债", "国债", "政金债", "信用债", "短融", "可转债", "转债", "城投债", "金融债"];
const moneyKeywords = ["货币", "添益", "日利", "现金", "快线", "保证金", "日日", "添利", "现金添利"];

const fundCompanySuffixes = [
  "华泰柏瑞", "易方达", "华夏", "南方", "嘉实", "广发", "富国", "天弘", "博时", "招商", "华安",
  "国泰", "华宝", "汇添富", "银华", "工银", "建信", "国联安", "平安", "鹏华", "中欧", "万家",
  "大成", "景顺长城", "华商", "华富", "浦银安盛", "永赢", "国投瑞银", "兴全", "兴业", "方正富邦",
  "中银", "国金", "申万菱信", "泰康", "国寿安保", "东财", "西部利得", "华福", "华润元大", "汇安",
  "汇丰晋信", "长盛", "新华", "方正", "诺安", "融通", "中航", "中信保诚", "太平", "浦银", "万家",
  "东方红", "红土创新", "财通", "德邦", "国海富兰克林", "嘉合", "前海开源", "金鹰", "九泰",
  "凯石", "明亚", "摩根", "中金", "中信建投", "海富通", "光大保德信", "长城", "安信", "宝盈",
  "北信瑞丰", "长信", "天治", "泰达宏利", "宏利", "创金合信", "中加", "民生加银", "鑫元",
  "恒生前海", "路博迈", "贝莱德", "施罗德", "富达", "联博", "安联", "瑞银", "南方东英", "易方达香港",
];

function stripCompanySuffix(name: string): string {
  let core = name.trim();
  for (const suffix of fundCompanySuffixes) {
    if (core.length > suffix.length && core.endsWith(suffix)) {
      core = core.slice(0, -suffix.length);
      break;
    }
  }
  return core;
}

function matchRules(
  text: string,
  rules: Array<{ subBoardName: string; keywords: string[] }>
): string | null {
  for (const rule of rules) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return rule.subBoardName;
    }
  }
  return null;
}

/** 判断是否为货币 ETF（代码段 511/1590 后接货币规则兜底）。 */
export function isMoneyEtf(code: string, name: string): boolean {
  if (moneyKeywords.some((keyword) => name.includes(keyword))) {
    return true;
  }
  // 5118xx/5119xx 绝大多数是场内货币基金，名称不含关键词时按代码段兜底。
  return /^511(8|9)/.test(code.slice(0, 6));
}

/** 判断是否为债券 ETF。 */
export function isBondEtf(name: string): boolean {
  return bondKeywords.some((keyword) => name.includes(keyword));
}

export function classifyEtf(code: string, name: string): EtfClassification {
  const core = stripCompanySuffix(name);
  const upper = core.toUpperCase();

  if (isMoneyEtf(code, core)) {
    return { family: "money", boardName: familyBoardNames.money, subBoardName: "货币" };
  }

  if (isBondEtf(core)) {
    const subBoardName = /转债/.test(core) ? "可转债" : /国债|政金债/.test(core) ? "利率债" : "信用债";
    return { family: "bond", boardName: familyBoardNames.bond, subBoardName };
  }

  const commodity = matchRules(upper, commodityRules);
  if (commodity) {
    return { family: "commodity", boardName: familyBoardNames.commodity, subBoardName: commodity };
  }

  const crossBorder = matchRules(upper, crossBorderRules);
  if (crossBorder) {
    return { family: "crossborder", boardName: familyBoardNames.crossborder, subBoardName: crossBorder };
  }

  const broad = matchRules(upper, broadRules);
  if (broad) {
    return { family: "broad", boardName: familyBoardNames.broad, subBoardName: broad };
  }

  const industry = matchRules(upper, industryRules);
  if (industry) {
    return { family: "hangye", boardName: familyBoardNames.hangye, subBoardName: industry };
  }

  return { family: "other", boardName: familyBoardNames.other, subBoardName: "其他" };
}
