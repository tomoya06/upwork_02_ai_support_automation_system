"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bot, ArrowLeft, Sparkles, Globe } from "lucide-react";

type Lang = "en" | "zh";

// ─── i18n dictionary ─────────────────────────────────────────────────────────
const i18n = {
  en: {
    navBrand: "AI Support Automation",
    navSub: "/ Showcase",
    backToApp: "Back to App",
    heroTag: "Product Showcase",
    heroTitle: "Stop Drowning in Tickets.",
    heroTitleAccent: "Let AI Handle the Triage.",
    heroP1:
      "Customer support teams waste hours on repetitive questions, manual triage, and context-switching between tools. The result? Slow responses, inconsistent answers, and burned-out agents.",
    heroP2:
      "This system replaces that chaos with an AI-powered pipeline that automatically classifies incoming tickets, retrieves relevant knowledge via RAG, generates draft replies, and recommends resolution actions — all in one unified inbox.",
    stepLabel: "Step",
    visitPage: "Visit page",
    footer: "AI Support Automation Engine · Built with Next.js, Supabase & Groq",
    langSwitch: "中文",
    items: [
      {
        title: "Landing Page",
        desc: "Clean entry point — one click to open the Inbox or manage your knowledge base.",
        href: "/",
      },
      {
        title: "Inbox · Ticket List",
        desc: "Multi-dimensional filtering by status, category, and priority. AI confidence scores visible at a glance.",
        href: "/inbox",
      },
      {
        title: "New Ticket · Create Dialog",
        desc: "Subject options grouped by business category for fast, structured ticket intake.",
        href: "/inbox",
      },
      {
        title: "Ticket Detail",
        desc: "Message thread on the left, AI Insights panel on the right — everything an agent needs in one view.",
        href: "/inbox",
      },
      {
        title: "Pipeline Trace · Decision Chain",
        desc: "Visualize every AI step: classification, RAG retrieval, reply generation, and action recommendation.",
        href: "/inbox",
      },
      {
        title: "Knowledge Base",
        desc: "Manage FAQ and product docs, auto-chunked for RAG retrieval to power accurate AI responses.",
        href: "/knowledge",
      },
      {
        title: "Analytics · Dashboard",
        desc: "Real-time metrics: ticket distribution, AI adoption rate, resolution rate, and pipeline run counts.",
        href: "/analytics",
      },
    ],
  },
  zh: {
    navBrand: "AI 客服自动化引擎",
    navSub: "/ 产品展示",
    backToApp: "返回应用",
    heroTag: "产品展示",
    heroTitle: "别让工单淹没你的团队。",
    heroTitleAccent: "让 AI 接管分拣。",
    heroP1:
      "客服团队每天花大量时间处理重复问题、手动分类工单、在不同工具间频繁切换——结果就是回复慢、答案不一致、人力疲惫。",
    heroP2:
      "本系统用一条 AI 流水线替代这些低效环节：自动分类工单、通过 RAG 检索知识库、生成回复草稿、推荐处理动作，全部集中在统一收件箱中完成。",
    stepLabel: "环节",
    visitPage: "前往页面",
    footer: "AI 客服自动化引擎 · 基于 Next.js、Supabase 与 Groq 构建",
    langSwitch: "EN",
    items: [
      {
        title: "首页入口",
        desc: "简洁的着陆页，一键进入收件箱或知识库管理。",
        href: "/",
      },
      {
        title: "收件箱 · 工单列表",
        desc: "按状态、类别、优先级多维筛选，AI 置信度标签一目了然。",
        href: "/inbox",
      },
      {
        title: "新建工单 · 创建弹窗",
        desc: "按业务类别分组选择主题，快速录入结构化工单。",
        href: "/inbox",
      },
      {
        title: "工单详情",
        desc: "左侧消息线程 + 右侧 AI 洞察面板，客服所需信息一屏呈现。",
        href: "/inbox",
      },
      {
        title: "Pipeline Trace · AI 决策链",
        desc: "可视化每一步 AI 处理：分类、RAG 检索、回复生成、动作推荐。",
        href: "/inbox",
      },
      {
        title: "知识库",
        desc: "管理 FAQ 与产品文档，自动切分为 chunks 用于 RAG 精准检索。",
        href: "/knowledge",
      },
      {
        title: "数据分析 · 看板",
        desc: "实时统计工单分布、AI 采用率、解决率及 Pipeline 运行次数。",
        href: "/analytics",
      },
    ],
  },
} as const;

const SHOWCASE_IMAGES = [
  "/showcase/home.png",
  "/showcase/inbox.png",
  "/showcase/create-ticket-dialog.png",
  "/showcase/ticket-detail.png",
  "/showcase/pipeline-trace.png",
  "/showcase/knowledge.png",
  "/showcase/analytics.png",
];

export default function ShowcasePage() {
  const [lang, setLang] = useState<Lang>("en");
  const t = i18n[lang];
  const otherLang: Lang = lang === "en" ? "zh" : "en";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Nav */}
      <header className="sticky top-0 z-10 backdrop-blur bg-background/70 border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <span className="font-semibold tracking-tight">{t.navBrand}</span>
            <span className="text-xs text-muted-foreground ml-1">
              {t.navSub}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(otherLang)}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border hover:bg-accent transition-colors"
            >
              <Globe className="h-3 w-3" />
              {t.langSwitch}
            </button>
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t.backToApp}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-10 text-center space-y-5">
        <div className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
          <Sparkles className="h-3 w-3" />
          {t.heroTag}
        </div>

        <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight max-w-3xl mx-auto">
          {t.heroTitle}
          <br />
          <span className="text-primary">{t.heroTitleAccent}</span>
        </h1>

        <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {t.heroP1}
        </p>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {t.heroP2}
        </p>
      </section>

      {/* Gallery */}
      <section className="max-w-6xl mx-auto px-4 pb-20 space-y-12">
        {t.items.map((item, idx) => (
          <article
            key={idx}
            className={`flex flex-col ${
              idx % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
            } gap-6 lg:gap-10 items-center`}
          >
            {/* Image */}
            <div className="flex-1 w-full lg:w-auto">
              <div className="relative rounded-2xl overflow-hidden border shadow-lg bg-card">
                <Image
                  src={SHOWCASE_IMAGES[idx]}
                  alt={item.title}
                  width={1440}
                  height={900}
                  className="w-full h-auto"
                  priority={idx < 2}
                />
              </div>
            </div>

            {/* Text */}
            <div className="flex-shrink-0 lg:w-72 xl:w-80 space-y-3">
              <span className="text-xs font-semibold text-primary/70 uppercase tracking-widest">
                {t.stepLabel} {String(idx + 1).padStart(2, "0")}
              </span>
              <h2 className="text-xl md:text-2xl font-bold">{item.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.desc}
              </p>
              <Link
                href={item.href}
                className="inline-flex items-center text-sm text-primary hover:underline gap-1"
              >
                {t.visitPage}
                <span aria-hidden>→</span>
              </Link>
            </div>
          </article>
        ))}
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        {t.footer}
      </footer>
    </div>
  );
}
