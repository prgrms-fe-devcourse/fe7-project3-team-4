// src/app/api/parse/route.ts
// [기능]: (핵심) HTML 파싱 및 Supabase 저장 API
// - POST 요청으로 HTML 문자열을 받음
// - JSDOM, Readability, Metascraper로 파싱
// - [수정] 파싱된 본문의 <iframe>에 loading="lazy" 자동 추가
// - 파싱된 데이터를 Supabase 'news' 테이블에 삽입 (Service Key 사용)

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js"; // [수정] Service Key용 클라이언트 생성
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { createRequire } from "module";

export const runtime = "nodejs"; // JSDOM, metascraper 등 Node.js API 사용

// [리뷰] (중요/보안) Service Key 사용
// 데이터 '쓰기'는 반드시 Service Key를 사용하는 API 라우트를 통해서만 수행
// [수정] Service Key를 사용하도록 별도 클라이언트 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // 보안 키
);

// CommonJS 모듈(metascraper)을 ESM 환경(Next.js API)에서 로드
const require = createRequire(import.meta.url);
const metascraper = require("metascraper");
const msAuthor = require("metascraper-author");
const msDate = require("metascraper-date");
const msDescription = require("metascraper-description");
const msImage = require("metascraper-image");
const msLogo = require("metascraper-logo");
const msPublisher = require("metascraper-publisher");
const msTitle = require("metascraper-title");
const msUrl = require("metascraper-url");
const msLang = require("metascraper-lang");
const msIframe = require("metascraper-iframe");
const msVideo = require("metascraper-video");

// metascraper 인스턴스 초기화
const ms = metascraper([
  msAuthor(),
  msDate(),
  msDescription(),
  msImage(),
  msLogo(),
  msPublisher(),
  msTitle(),
  msUrl(),
  msLang(),
  msIframe(),
  msVideo(),
]);

// type ParsePayload = { html: string; url?: string };

// POST /api/parse
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { html, url } = body as { html: string; url?: string };

    if (!html?.trim()) {
      return NextResponse.json(
        { success: false, error: "HTML 본문이 필요합니다." },
        { status: 400 }
      );
    }

    const baseUrl = url || "https://example.com/";
    const fullDom = new JSDOM(html, { url: baseUrl });
    const document = fullDom.window.document;

    // 1. Readability로 본문(article) 추출
    const reader = new Readability(document);
    const article = reader.parse(); // { title, content, textContent, ... }

    // 2. Metascraper로 메타데이터 추출
    const meta = await ms({ html, url: baseUrl });

    // 3. JSON-LD 추출
    const jsonLdBlobs: unknown[] = [];
    document
      .querySelectorAll('script[type="application/ld+json"]')
      .forEach((s) => {
        try {
          const data = JSON.parse(s.textContent || "{}");
          Array.isArray(data)
            ? jsonLdBlobs.push(...data)
            : jsonLdBlobs.push(data);
        } catch {}
      });
    const ldArticle =
      jsonLdBlobs.find(
        (d) =>
          d &&
          typeof d === "object" &&
          ["Article", "NewsArticle", "BlogPosting"].includes(d["@type"])
      ) || undefined;

    // 4. 미디어 (썸네일용) 수집
    const toAbs = (src: string) => {
      try {
        return new URL(src, baseUrl).toString();
      } catch {
        return src;
      }
    };
    const imageSet = new Set<string>();
    const videoSet = new Set<string>();
    const audioSet = new Set<string>();

    // DOM에서 직접 수집
    document.querySelectorAll("img[src]").forEach((img) => {
      const s = img.getAttribute("src")!;
      if (s) imageSet.add(toAbs(s));
    });
    // srcset (고해상도 이미지)
    const pickFromSrcset = (srcset: string) => {
      const cands = srcset
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      let best = "";
      let bestW = -1;
      for (const c of cands) {
        const [u, wStr] = c.split(/\s+/);
        const w = parseInt((wStr || "").replace(/[^\d]/g, ""), 10);
        if (!isNaN(w) && w > bestW) {
          bestW = w;
          best = u;
        } else if (!wStr && !best) {
          best = u;
        }
      }
      return best || cands[0] || "";
    };
    document.querySelectorAll("img[srcset], source[srcset]").forEach((n) => {
      const ss = n.getAttribute("srcset");
      if (ss) {
        const best = pickFromSrcset(ss);
        if (best) imageSet.add(toAbs(best));
      }
    });
    // video/iframe/audio
    document
      .querySelectorAll("video[src], video source[src], iframe[src]")
      .forEach((n) => {
        const s = n.getAttribute("src")!;
        if (s) videoSet.add(toAbs(s));
      });
    document.querySelectorAll("audio[src], audio source[src]").forEach((n) => {
      const s = n.getAttribute("src")!;
      if (s) audioSet.add(toAbs(s));
    });

    // Metascraper/JSON-LD 보강
    if (meta.image) imageSet.add(toAbs(meta.image));
    if ((meta as any).video) videoSet.add(toAbs((meta as any).video));
    if ((meta as any).iframe) {
      try {
        const tmp = new JSDOM(String((meta as any).iframe));
        const ifr = tmp.window.document.querySelector("iframe[src]");
        if (ifr) videoSet.add(toAbs(ifr.getAttribute("src")!));
      } catch {}
    }
    // ... (JSON-LD 보강 로직, 기존과 동일)
    const pushAll = (v: any, to: any[]) => {
      if (!v) return;
      Array.isArray(v) ? v.forEach((x) => to.push(x)) : to.push(v);
    };
    const ldImages: any[] = [];
    const ldVideos: any[] = [];
    if (ldArticle) {
      pushAll(ldArticle.image, ldImages);
      const v = ldArticle.video;
      if (v) {
        if (typeof v === "string") ldVideos.push(v);
        else if (Array.isArray(v))
          v.forEach((x) => {
            if (typeof x === "string") ldVideos.push(x);
            else if (x?.contentUrl) ldVideos.push(x.contentUrl);
            else if (x?.url) ldVideos.push(x.url);
          });
        else if (typeof v === "object") {
          if (v.contentUrl) ldVideos.push(v.contentUrl);
          else if (v.url) ldVideos.push(v.url);
        }
      }
    }
    ldImages.forEach((u) => typeof u === "string" && imageSet.add(toAbs(u)));
    ldVideos.forEach((u) => typeof u === "string" && videoSet.add(toAbs(u)));

    const images = Array.from(imageSet);
    const videos = Array.from(videoSet);
    const audios = Array.from(audioSet);

    // Readability content 기준
    const contentHtml = article?.content || "";

    // media_positions 배열을 항상 비어있도록 설정
    type MediaPos = {
      type: "video" | "audio" | "image";
      url: string;
      afterParagraphIndex: number;
    };
    const media_positions: MediaPos[] = []; // ✅ 항상 빈 배열

    // 최종 데이터 조합
    const finalTitle = (
      article?.title?.trim() ||
      (meta.title || "").trim() ||
      ldArticle?.headline ||
      ldArticle?.name ||
      "Untitled"
    ).slice(0, 300);

    const publishedAt = meta.date
      ? new Date(meta.date).toISOString()
      : ldArticle?.datePublished
      ? new Date(ldArticle.datePublished).toISOString()
      : null;

    const siteName =
      meta.publisher ||
      fullDom.window.document // [수정] document 변수 재사용
        .querySelector('meta[property="og:site_name"]')
        ?.getAttribute("content") ||
      ldArticle?.publisher?.name ||
      null;

    // 5. Supabase DB에 삽입
    const { error } = await supabase.from("news").insert([
      {
        title: finalTitle,
        content: contentHtml,
        url: url || null,
        site_name: siteName,
        published_at: publishedAt,
        images, // (썸네일용)
        videos, // (저장은 되지만 상세페이지에서 사용 안 함)
        audios, // (저장은 되지만 상세페이지에서 사용 안 함)
        metadata: {
          readability: article || null,
          metascraper: meta || null,
          jsonld: ldArticle || null,
          media_positions, // ✅ 항상 빈 배열 []이 저장됨
        },
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 성공 응답
    return NextResponse.json({
      success: true,
      title: finalTitle,
      counts: {
        images: images.length,
        videos: videos.length,
        audios: audios.length,
      },
    });
  } catch (e: any) {
    console.error("API Parse Error:", e);
    return NextResponse.json(
      { success: false, error: e?.message || "서버 에러" },
      { status: 500 }
    );
  }
}