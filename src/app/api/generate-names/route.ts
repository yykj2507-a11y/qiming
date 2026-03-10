import { NextRequest, NextResponse } from "next/server";

const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY;
const SILICONFLOW_API_URL = process.env.SILICONFLOW_API_URL;
const MODEL_NAME = process.env.MODEL_NAME ?? "Pro/zai-org/GLM-5";

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
  if (!SILICONFLOW_API_KEY || !SILICONFLOW_API_URL) {
    console.error("[GLM-5 API] 缺少环境变量:", {
      hasKey: Boolean(SILICONFLOW_API_KEY),
      hasUrl: Boolean(SILICONFLOW_API_URL),
    });
    return NextResponse.json(
      { error: "Missing SiliconFlow configuration." },
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

  const systemPrompt = `
你是一名中文起名大师与品牌命名专家。

现在你需要根据用户提供的「类别」「关键词」「风格偏好」，为用户生成 5 个候选名字。

严格遵守以下输出规范：
1. 只返回一个 JSON 对象，不能包含任何 Markdown 代码块标签（例如 \`\`\`json、\`\`\`）或额外解释文字。
2. 返回的 JSON 结构必须是：
{
  "names": [
    {
      "name": "名字1",
      "pinyin": "拼音1（使用标准汉语拼音，小写，音节之间用空格分隔）",
      "meaning": "寓意解析1（简洁、自然的中文描述）",
      "source": "简短说明名字的灵感来源，例如：诗词、自然意象、字形结构、品牌调性等"
    },
    ...
  ]
}
3. 一共返回 5 个名字方案。
4. 每个名字都要贴合类别与关键词的语义，风格偏好仅作为参考引导，不是硬性限制。
5. 确保整个返回内容可以被 JSON.parse 直接解析，不出现任何多余字符。
`.trim();

  const userPrompt = `
类别: ${category}
关键词: ${keyword}
风格偏好: ${style ?? "未指定"}
`.trim();

  try {
    const glmRes = await fetch(
      `${SILICONFLOW_API_URL}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SILICONFLOW_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.8,
        }),
      },
    );

    if (!glmRes.ok) {
      const errorText = await glmRes.text();
      console.error("[GLM-5 API] 请求失败:", {
        statusCode: glmRes.status,
        statusText: glmRes.statusText,
        errorBody: errorText,
      });
      return NextResponse.json(
        { error: "GLM-5 API error", detail: errorText },
        { status: 502 },
      );
    }

    const data = (await glmRes.json()) as any;
    const content: string | undefined =
      data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.message;

    if (!content || typeof content !== "string") {
      console.error("[GLM-5 API] 响应内容为空或格式不正确:", data);
      return NextResponse.json(
        { error: "Empty response from GLM-5." },
        { status: 502 },
      );
    }

    // 去掉模型可能返回的 ```json 包裹
    const cleaned = content
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("[GLM-5 API] JSON 解析失败:", {
        raw: content,
        cleaned,
        error: e,
      });
      return NextResponse.json(
        {
          error: "Failed to parse GLM-5 JSON.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    const message = String(error);
    console.error("[GLM-5 API] 未预期错误:", message, error);

    return NextResponse.json(
      { error: "Unexpected server error", detail: message },
      { status: 500 },
    );
  }
}


