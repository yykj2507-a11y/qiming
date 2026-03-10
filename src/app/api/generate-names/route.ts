import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

type Category =
  | "宝宝"
  | "宠物"
  | "品牌"
  | "网名"
  | "中译名"
  | (string & {});

interface GenerateNamesBody {
  category: Category;
  keyword: string;
  style?: string;
}

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY in environment variables." },
      { status: 500 },
    );
  }

  let body: GenerateNamesBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { category, keyword, style } = body;

  if (!keyword || !category) {
    return NextResponse.json(
      { error: "Both `category` and `keyword` are required." },
      { status: 400 },
    );
  }

  const prompt = `
你是一名中文起名专家，请根据用户提供的“类别”、“关键词”和可选的“风格偏好”，生成 5 个合适的名字方案。

要求：
- 只返回 JSON，不要任何多余说明或 Markdown 代码块。
- JSON 结构必须是：
{
  "names": [
    { "name": "名字1", "pinyin": "拼音1", "meaning": "寓意解析1" },
    ...
  ]
}
- 一共返回 5 个名字，注意多样性和可读性。
- 名字需要尽量贴合类别和关键词的语义，风格偏好仅作为参考，不是硬性限制。

用户输入：
- 类别: ${category}
- 关键词: ${keyword}
- 风格偏好: ${style ?? "未指定"}
  `.trim();

  try {
    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      },
    );

    if (!geminiRes.ok) {
      const error = await geminiRes.text();
      return NextResponse.json(
        { error: "Gemini API error", detail: error },
        { status: 502 },
      );
    }

    const data = (await geminiRes.json()) as any;

    const text: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json(
        { error: "Empty response from Gemini." },
        { status: 502 },
      );
    }

    // 去掉可能的 ```json 包裹
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      return NextResponse.json(
        {
          error: "Failed to parse Gemini JSON.",
          raw: text,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    const message = String(error);

    // 本地开发环境下，如果网络无法访问 Gemini，则返回一些示例数据，方便你调试前端。
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({
        error: "Development fallback: Gemini fetch failed.",
        detail: message,
        names: [
          {
            name: "语澄",
            pinyin: "yǔ chéng",
            meaning: "语带温润，澄如清水，寓意言行温和澄澈、心境通透明亮。",
          },
          {
            name: "星阔",
            pinyin: "xīng kuò",
            meaning:
              "取星空辽阔之象，寓意视野开阔、志向高远、胸怀天地。",
          },
          {
            name: "辰远",
            pinyin: "chén yuǎn",
            meaning:
              "辰为时光星辰，远为远见与远方，象征脚踏实地、向光而行。",
          },
          {
            name: "栖墨",
            pinyin: "qī mò",
            meaning:
              "栖寓意安居，墨带文雅书卷之气，整体气质宁静而富有内涵。",
          },
          {
            name: "澜一",
            pinyin: "lán yī",
            meaning:
              "澜象征不凡气势，一寓意初心与专注，代表内心丰沛而不张扬。",
          },
        ],
      });
    }

    return NextResponse.json(
      { error: "Unexpected server error", detail: message },
      { status: 500 },
    );
  }
}

