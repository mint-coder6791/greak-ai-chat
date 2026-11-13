import type { ModelCall, ToolCall, ToolDefinition } from '@/types';
import { errorMessage } from '@/lib/errors';
import { importGiphyStickers, MAX_GIPHY_IMPORT } from '@/lib/giphy';

const BASE_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: '查询某个城市当前天气以及未来三天的预报。需要实时天气时调用。',
      parameters: {
        type: 'object',
        properties: { city: { type: 'string', description: '城市名称，例如 北京、Tokyo' } },
        required: ['city'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: '联网搜索最新信息，适用于新闻、时效性问题或你不确定的事实。',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: '搜索关键词' } },
        required: ['query'],
      },
    },
  },
];

const SEARCH_STICKERS_TOOL: ToolDefinition = {
  type: 'function',
  function: {
    name: 'search_stickers',
    description: `从 GIPHY 搜索表情包并自动收藏到你的表情包库，最多 ${MAX_GIPHY_IMPORT} 张。想收集某种情绪或梗的表情包时调用，收藏后可用 [STICKER: 标签名] 发送。`,
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '英文搜索关键词，例如 angry cat' },
        limit: { type: 'integer', description: `收藏数量，1 到 ${MAX_GIPHY_IMPORT}`, minimum: 1, maximum: MAX_GIPHY_IMPORT },
      },
      required: ['query'],
    },
  },
};

export function buildAgentTools(giphyEnabled: boolean): ToolDefinition[] {
  return giphyEnabled ? [...BASE_TOOLS, SEARCH_STICKERS_TOOL] : BASE_TOOLS;
}

export interface ToolContext {
  callModel: ModelCall;
  signal: AbortSignal;
  giphyApiKey: string;
  onStickersChanged: () => void;
}

const WEATHER_CODES: Record<number, string> = {
  0: '晴',
  1: '大部晴朗',
  2: '多云',
  3: '阴',
  45: '雾',
  48: '雾凇',
  51: '小毛毛雨',
  53: '毛毛雨',
  55: '大毛毛雨',
  61: '小雨',
  63: '中雨',
  65: '大雨',
  71: '小雪',
  73: '中雪',
  75: '大雪',
  80: '阵雨',
  81: '中阵雨',
  82: '强阵雨',
  95: '雷暴',
  96: '雷暴伴冰雹',
  99: '强雷暴伴冰雹',
};

interface GeocodeResponse {
  results?: { name: string; country?: string; latitude: number; longitude: number }[];
}

interface ForecastResponse {
  current?: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
}

function describeWeather(code: number): string {
  return WEATHER_CODES[code] ?? '未知';
}

async function getJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('天气服务暂时不可用');
  return (await res.json()) as T;
}

async function getWeather(city: string, signal: AbortSignal): Promise<string> {
  const name = city.trim();
  if (!name) return '缺少城市名称';
  const geo = await getJson<GeocodeResponse>(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=zh&format=json`,
    signal,
  );
  const place = geo.results?.[0];
  if (!place) return `没有找到城市「${name}」`;

  const forecast = await getJson<ForecastResponse>(
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
      '&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
      '&timezone=auto&forecast_days=3',
    signal,
  );
  if (!forecast.current || !forecast.daily) return '天气数据暂时不可用';

  const { current, daily } = forecast;
  return JSON.stringify({
    城市: place.country ? `${place.name}，${place.country}` : place.name,
    当前: {
      天气: describeWeather(current.weather_code),
      气温: `${current.temperature_2m}℃`,
      体感温度: `${current.apparent_temperature}℃`,
      湿度: `${current.relative_humidity_2m}%`,
      风速: `${current.wind_speed_10m} km/h`,
    },
    未来三天: daily.time.map((date, i) => ({
      日期: date,
      天气: describeWeather(daily.weather_code[i]),
      最低温: `${daily.temperature_2m_min[i]}℃`,
      最高温: `${daily.temperature_2m_max[i]}℃`,
      降水概率: `${daily.precipitation_probability_max[i]}%`,
    })),
  });
}

async function searchWeb(query: string, callModel: ModelCall, signal: AbortSignal): Promise<string> {
  const q = query.trim();
  if (!q) return '缺少搜索关键词';
  return callModel({
    messages: [
      {
        role: 'system',
        content: '你是联网搜索助手。请基于搜索结果，用简明的中文列出与查询最相关的事实要点，并注明信息来源或发布时间。',
      },
      { role: 'user', content: q },
    ],
    signal,
    enableSearch: true,
  });
}

async function searchStickers(args: Record<string, unknown>, ctx: ToolContext): Promise<string> {
  const query = String(args.query ?? '').trim();
  if (!query) return '缺少搜索关键词';
  const labels = await importGiphyStickers({
    apiKey: ctx.giphyApiKey,
    query,
    limit: Number(args.limit ?? MAX_GIPHY_IMPORT),
    signal: ctx.signal,
  });
  ctx.onStickersChanged();
  return `已收藏 ${labels.length} 张表情包，可用标签：${labels.join('、')}`;
}

export async function executeTool(call: ToolCall, ctx: ToolContext): Promise<string> {
  const { callModel, signal } = ctx;
  let args: Record<string, unknown>;
  try {
    args = JSON.parse(call.function.arguments || '{}') as Record<string, unknown>;
  } catch {
    return '工具参数格式错误';
  }
  try {
    switch (call.function.name) {
      case 'get_weather':
        return await getWeather(String(args.city ?? ''), signal);
      case 'web_search':
        return await searchWeb(String(args.query ?? ''), callModel, signal);
      case 'search_stickers':
        return await searchStickers(args, ctx);
      default:
        return `未知工具：${call.function.name}`;
    }
  } catch (err) {
    return `工具调用失败：${errorMessage(err)}`;
  }
}
