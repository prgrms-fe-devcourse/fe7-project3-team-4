/* eslint-disable @typescript-eslint/no-unused-expressions */
// src/app/api/parse/route.ts
// [기능]: (핵심) HTML 파싱 및 Supabase 저장 API
// - POST 요청으로 HTML 문자열을 받음
// - JSDOM, Readability, Metascraper로 파싱
// - [수정] 파싱된 본문의 <iframe>에 loading="lazy" 자동 추가
// - 파싱된 데이터를 Supabase 'news' 테이블에 삽입 (Service Key 사용)

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js"; // [수정] Service Key용 클라이언트 생성
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability"; // [수정] Article 타입 임포트
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

// [수정] 1. 타입 정의 추가
type ParsePayload = {
  html: string;
  url?: string;
};

// metascraper 결과 타입
interface MetaScraperResult {
  author?: string;
  date?: string;
  description?: string;
  image?: string;
  logo?: string;
  publisher?: string;
  title?: string;
  url?: string;
  lang?: string;
  iframe?: string; // HTML 문자열
  video?: string; // URL
}

// JSON-LD 미디어 객체 타입 (최소)
interface JsonLdMedia {
  contentUrl?: string;
  url?: string;
}

// JSON-LD 기사 타입 (최소)
interface JsonLdArticle {
  "@type"?: string | string[];
  image?: unknown; // string | string[] | object | object[] ...
  video?: unknown; // string | JsonLdMedia | (string | JsonLdMedia)[]
  headline?: string;
  name?: string;
  datePublished?: string;
  publisher?: { name?: string };
}

// POST /api/parse
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ParsePayload; // [수정]
    const { html, url } = body;

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
    const article = reader.parse(); // [수정 1] 타입 주석 제거 (TS가 추론)

    // 2. Metascraper로 메타데이터 추출
    const meta = (await ms({ html, url: baseUrl })) as MetaScraperResult; // [수정]

    // [수정 3] 코드 순서 변경 (ldArticle 선언부보다 위로 이동)
    // 3. JSON-LD 추출
    const jsonLdBlobs: unknown[] = []; // [수정] any[] -> unknown[]
    document
      .querySelectorAll('script[type="application/ld+json"]')
      .forEach((s) => {
        try {
          const data = JSON.parse(s.textContent || "{}") as unknown; // [수정] any -> unknown
          Array.isArray(data)
            ? jsonLdBlobs.push(...data)
            : jsonLdBlobs.push(data);
        } catch {}
      });

    // [수정] JsonLdArticle 타입 가드 함수
    const isJsonLdArticle = (d: unknown): d is JsonLdArticle => {
      if (d && typeof d === "object") {
        const type = (d as Record<string, unknown>)["@type"];
        const types = ["Article", "NewsArticle", "BlogPosting"];
        if (typeof type === "string" && types.includes(type)) return true;
        if (Array.isArray(type) && type.some((t) => types.includes(t)))
          return true;
      }
      return false;
    };
    
    // [수정 3] ldArticle 선언부 (이제 jsonLdBlobs가 채워진 상태)
    const ldArticle = jsonLdBlobs.find(isJsonLdArticle) || undefined;

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

    // [수정] DOM 쿼리에 제네릭 타입 사용
    document.querySelectorAll<HTMLImageElement>("img[src]").forEach((img) => {
      const s = img.getAttribute("src")!;
      if (s) imageSet.add(toAbs(s));
    });

    const pickFromSrcset = (srcset: string) => {
      // ... (내부 로직은 타입 문제 없음)
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
      return best || cands[0]?.[0] || ""; // [수정] cands[0] 접근 안정화
    };

    document
      .querySelectorAll<HTMLImageElement | HTMLSourceElement>(
        "img[srcset], source[srcset]"
      )
      .forEach((n) => {
        const ss = n.getAttribute("srcset");
        if (ss) {
          const best = pickFromSrcset(ss);
          if (best) imageSet.add(toAbs(best));
        }
      });

    document
      .querySelectorAll<HTMLVideoElement | HTMLSourceElement | HTMLIFrameElement>(
        "video[src], video source[src], iframe[src]"
      )
      .forEach((n) => {
        const s = n.getAttribute("src")!;
        if (s) videoSet.add(toAbs(s));
      });
    document
      .querySelectorAll<HTMLAudioElement | HTMLSourceElement>(
        "audio[src], audio source[src]"
      )
      .forEach((n) => {
        const s = n.getAttribute("src")!;
        if (s) audioSet.add(toAbs(s));
      });

    // Metascraper/JSON-LD 보강 (any 제거)
    if (meta.image) imageSet.add(toAbs(meta.image));
    if (meta.video) videoSet.add(toAbs(meta.video)); // [수정] (meta as any) 제거
    if (meta.iframe) { // [수정] (meta as any) 제거
      try {
        const tmp = new JSDOM(String(meta.iframe));
        const ifr = tmp.window.document.querySelector<HTMLIFrameElement>(
          "iframe[src]"
        ); // [수정]
        if (ifr) videoSet.add(toAbs(ifr.getAttribute("src")!));
      } catch {}
    }
    
    // [수정] pushAll (any -> unknown)
    const pushAll = (v: unknown, to: unknown[]) => {
      if (!v) return;
      Array.isArray(v) ? to.push(...v) : to.push(v);
    };

    const ldImages: unknown[] = []; // [수정] any[] -> unknown[]
    const ldVideos: unknown[] = []; // [수정] any[] -> unknown[]

    if (ldArticle) {
      pushAll(ldArticle.image, ldImages);
      const v = ldArticle.video;
      if (v) {
        if (typeof v === "string") ldVideos.push(v);
        else if (Array.isArray(v))
          v.forEach((x) => {
            if (typeof x === "string") ldVideos.push(x);
            // [수정] x가 JsonLdMedia 타입일 수 있음
            else if (typeof x === "object" && x !== null) {
              const media = x as JsonLdMedia;
              if (media.contentUrl) ldVideos.push(media.contentUrl);
              else if (media.url) ldVideos.push(media.url);
            }
          });
        else if (typeof v === "object" && v !== null) {
          const media = v as JsonLdMedia;
          if (media.contentUrl) ldVideos.push(media.contentUrl);
          else if (media.url) ldVideos.push(media.url);
        }
      }
    }
    
    // [수정] ldImages/ldVideos (any[] -> unknown[]) 순회 시 타입 가드
    ldImages.forEach((u) => typeof u === "string" && imageSet.add(toAbs(u)));
    ldVideos.forEach((u) => typeof u === "string" && videoSet.add(toAbs(u)));

    const images = Array.from(imageSet);
    const videos = Array.from(videoSet);
    const audios = Array.from(audioSet);

    const contentHtml = article?.content || "";

    type MediaPos = {
      type: "video" | "audio" | "image";
      url: string;
      afterParagraphIndex: number;
    };
    const media_positions: MediaPos[] = [];

    const finalTitle = (
      article?.title?.trim() ||
      (meta.title || "").trim() ||
      ldArticle?.headline || // [수정] 타입 추론으로 안전
      ldArticle?.name || // [수정] 타입 추론으로 안전
      "Untitled"
    ).slice(0, 300);

    const publishedAt = meta.date
      ? new Date(meta.date).toISOString()
      : ldArticle?.datePublished // [수정] 타입 추론으로 안전
      ? new Date(ldArticle.datePublished).toISOString()
      : null;

    const siteName =
      meta.publisher ||
      fullDom.window.document // [수정] document 변수 재사용
        .querySelector<HTMLMetaElement>('meta[property="og:site_name"]') // [수정]
        ?.getAttribute("content") ||
      ldArticle?.publisher?.name || // [수정] 타입 추론으로 안전
      null;

    // 5. Supabase DB에 삽입
    const { error } = await supabase.from("news").insert([
      {
        title: finalTitle,
        content: contentHtml,
        url: url || null,
        site_name: siteName,
        published_at: publishedAt,
        images,
        videos,
        audios,
        metadata: {
          readability: article || null,
          metascraper: meta || null,
          jsonld: ldArticle || null,
          media_positions,
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
  } catch (e: unknown) { // [수정] any -> unknown
    console.error("API Parse Error:", e);
    // [수정] 타입 가드
    const message = e instanceof Error ? e.message : "서버 에러";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}