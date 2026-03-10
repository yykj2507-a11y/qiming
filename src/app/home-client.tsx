"use client";

import { FormEvent, useState } from "react";

const categories = {
  宝宝: {
    pill: "宝宝起名 · 音形义平衡",
    description:
      "为新生宝宝定制兼顾音律、寓意与书写美感的名字，贴合家庭期望与孩子八字格局。",
    fieldLabel: "宝宝姓氏",
    placeholder: "例如：李 / 王 / 陈",
    styles: ["诗意文雅", "简约大气", "国风古韵", "清新自然", "大气稳重"],
    heroImage:
      "https://images.unsplash.com/photo-1524778479211-169ee8c02614?auto=format&fit=crop&w=1600&q=80",
  },
  宠物: {
    pill: "宠物起名 · 性格取向",
    description:
      "根据宠物的品种与性格特点，生成有趣又朗朗上口的昵称，让陪伴更有记忆点。",
    fieldLabel: "宠物昵称关键词",
    placeholder: "例如：团子 / 可可 / 布丁",
    styles: ["可爱软萌", "活泼元气", "酷帅有型", "搞怪有趣", "温柔治愈"],
    heroImage:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1600&q=80",
  },
  品牌: {
    pill: "品牌命名 · 形象定位",
    description:
      "结合品牌调性与目标人群，生成有辨识度、便于传播的中文品牌名称方案。",
    fieldLabel: "品牌核心词",
    placeholder: "例如：家居 / 科技 / 美妆",
    styles: ["简约大气", "高级质感", "年轻潮流", "国风古韵", "国际时尚"],
    heroImage:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80",
  },
  网名: {
    pill: "网名灵感 · 个性表达",
    description:
      "按照你的风格偏好与兴趣标签，打造独一无二又不过时的网名灵感库。",
    fieldLabel: "网名风格关键词",
    placeholder: "例如：山海 / 星辰 / 文艺",
    styles: ["文艺清冷", "治愈温柔", "中二中性", "游戏电竞", "朋克潮流"],
    heroImage:
      "https://images.unsplash.com/photo-1510771463146-e89e6e86560e?auto=format&fit=crop&w=1600&q=80",
  },
  中译名: {
    pill: "中译名 · 国际友好",
    description:
      "为英文名或外文名匹配气质相近的中文译名，兼顾读音相近与文化意象。",
    fieldLabel: "原始外文名",
    placeholder: "例如：Oliver / Emma / Luca",
    styles: ["音译优先", "意象优先", "商务正式", "文艺气质", "简洁易记"],
    heroImage:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80",
  },
} as const;

type CategoryKey = keyof typeof categories;

interface NameSuggestion {
  name: string;
  pinyin: string;
  meaning: string;
}

export default function HomePageClient() {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("宝宝");
  const [keyword, setKeyword] = useState("");
  const [style, setStyle] = useState("");
  const [names, setNames] = useState<NameSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = categories[activeCategory];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!keyword.trim()) {
      setError("请输入关键词或姓氏，再生成名字。");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate-names", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: activeCategory,
          keyword: keyword.trim(),
          style: style || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "生成失败，请稍后重试。");
      }

      const data = (await res.json()) as { names?: NameSuggestion[] };
      if (!data.names || !Array.isArray(data.names)) {
        throw new Error("返回数据格式异常。");
      }

      setNames(data.names);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "生成失败，请稍后重试。",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {/* 顶部导航 */}
      <header className="bg-slate-900 text-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500 text-sm font-semibold tracking-tight">
              AI
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-slate-200">
                AI 名匠
              </span>
              <span className="text-xs text-slate-400">
                易缘起名 · Name Studio
              </span>
            </div>
          </div>

          {/* 导航链接 */}
          <div className="hidden items-center gap-6 text-sm font-medium sm:flex">
            {(Object.keys(categories) as CategoryKey[]).map((key) => {
              const isActive = key === activeCategory;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveCategory(key)}
                  className={`pb-1 transition ${
                    isActive
                      ? "border-b-2 border-violet-400 text-violet-200"
                      : "text-slate-200/80 hover:text-violet-300"
                  }`}
                >
                  {key}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* 主内容 */}
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {/* Hero 区域 */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-md lg:p-8">
          {/* 背景图片 + 遮罩 */}
          <div
            className="pointer-events-none absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${current.heroImage})`,
            }}
          />
          <div className="pointer-events-none absolute inset-0 -z-10 bg-white/65 backdrop-blur-[1px]" />

          <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl space-y-5">
              <p className="inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
                {current.pill}
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                赋予每个名字<span className="text-violet-600">灵魂</span>
              </h1>

              <p className="text-sm text-slate-600 sm:text-base">
                {current.description}
              </p>

              {/* 表单 */}
              <form
                onSubmit={handleSubmit}
                className="mt-4 grid w-full gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_auto] sm:items-end sm:gap-4"
              >
                {/* 姓氏 / 关键词输入 */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="keyword"
                    className="text-xs font-medium text-slate-600"
                  >
                    {current.fieldLabel}
                  </label>
                  <input
                    id="keyword"
                    type="text"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder={current.placeholder}
                    className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none ring-violet-500 transition placeholder:text-slate-400 focus:bg-white focus:border-violet-400 focus:ring-2"
                  />
                </div>

                {/* 风格选择 */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="style"
                    className="text-xs font-medium text-slate-600"
                  >
                    风格偏好
                  </label>
                  <select
                    id="style"
                    className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none ring-violet-500 transition focus:bg-white focus:border-violet-400 focus:ring-2"
                    value={style}
                    onChange={(event) => setStyle(event.target.value)}
                  >
                    <option value="" disabled>
                      选择一个命名风格
                    </option>
                    {current.styles.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 按钮 */}
                <div className="flex w-full sm:w-auto">
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 sm:h-11 sm:w-auto"
                  >
                    {loading ? "生成中..." : "生成名字"}
                  </button>
                </div>
              </form>

              {error && (
                <p className="text-xs text-rose-500">
                  {error}
                </p>
              )}
              {!error && (
                <p className="text-xs text-slate-400">
                  当前模式：{activeCategory}，点击“生成名字”后将实时调用 Gemini
                  接口，返回 5 个名字方案。
                </p>
              )}
            </div>

            {/* 右侧视觉占位（可选） */}
            <div className="mt-4 w-full max-w-md self-stretch rounded-2xl bg-slate-950/90 p-5 text-slate-50 shadow-md lg:mt-0">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-300">
                  Name Canvas
                </p>
                <p className="text-sm text-slate-200">
                  从字形、音律到寓意，让 AI 为你勾勒名字背后的完整故事。
                </p>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-slate-200">
                <div className="rounded-xl bg-slate-900/70 p-3">
                  <p className="text-[10px] text-slate-400">维度分析</p>
                  <p className="mt-1 font-semibold">音形义 · 三位一体</p>
                </div>
                <div className="rounded-xl bg-slate-900/70 p-3">
                  <p className="text-[10px] text-slate-400">灵感来源</p>
                  <p className="mt-1 font-semibold">诗词 · 星辰 · 山海</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 预留结果卡片区域 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              候选名字预览
            </h2>
            <p className="text-xs text-slate-400">
              共展示 {names.length > 0 ? names.length : 3} 个名字方案。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {names.length > 0 ? (
              names.map((item) => (
                <article
                  key={item.name + item.pinyin}
                  className="flex flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
                >
                  <div className="flex items-baseline justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">
                        {item.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {item.pinyin}
                      </p>
                    </div>
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                      AI 生成
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {item.meaning}
                  </p>
                </article>
              ))
            ) : (
              <>
                {/* Card 1 */}
                <article className="flex flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">
                        语桐
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-400">
                        yǔ tóng
                      </p>
                    </div>
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                      诗意文雅
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    寓意解析占位文案：名字整体给人温柔而富有文采的印象，
                    兼具自然意象与书卷气息，象征豁达、坚韧与内在的成长力量。
                  </p>
                </article>

                {/* Card 2 */}
                <article className="flex flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">
                        星澜
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-400">
                        xīng lán
                      </p>
                    </div>
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                      简约大气
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    寓意解析占位文案：名字整体气质开阔而克制，
                    带有未来感与高级感，象征视野广阔、心怀理想与波澜不惊的力量。
                  </p>
                </article>

                {/* Card 3 */}
                <article className="flex flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">
                        初言
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-400">
                        chū yán
                      </p>
                    </div>
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                      国风古韵
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    寓意解析占位文案：整体风格温润含蓄，兼具古典气息与细腻情感，
                    象征初心不改、言而有信与细水长流的守护。
                  </p>
                </article>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

