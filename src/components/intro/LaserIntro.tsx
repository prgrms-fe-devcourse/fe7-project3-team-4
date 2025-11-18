"use client";
import { useEffect, useState, useRef, useMemo } from "react";

// 프롬프트 예시들 (카드 꽉 차게 길게)
const PROMPTS = [
  "당신은 전문적인 마케팅 카피라이터입니다. 20대 여성을 타겟으로 한 친환경 화장품 브랜드의 신제품 런칭 캠페인을 기획해주세요. SNS 광고 문구 5가지, 인스타그램 해시태그 10개, 그리고 제품의 핵심 가치를 전달하는 브랜드 슬로건을 작성해주세요. 감성적이면서도 MZ세대의 언어로 공감을 이끌어낼 수 있어야 합니다.",
  "아래 React 컴포넌트 코드를 분석하고 성능을 개선할 수 있는 방법을 구체적으로 제시해주세요. 특히 불필요한 리렌더링을 방지하고, 메모리 사용량을 최적화하며, 번들 사이즈를 줄일 수 있는 방안을 중점적으로 다뤄주세요. useMemo, useCallback, React.memo 등의 최적화 기법을 적절히 활용한 리팩토링 예시도 함께 제공해주세요.",
  "5살 아이에게 설명하듯이 양자역학의 기본 개념을 쉽고 재미있게 설명해주세요. 슈뢰딩거의 고양이, 이중 슬릿 실험, 양자 얽힘 같은 핵심 개념들을 장난감이나 일상 속 사물에 비유해서 아이가 이해할 수 있게 만들어주세요. 각 개념마다 재미있는 이야기 형식으로 풀어주시면 좋겠습니다.",
  "다음 회의록을 읽고 핵심 내용을 3줄로 요약하고, 액션 아이템을 우선순위별로 정리해주세요. 각 액션 아이템에는 담당자, 마감일, 예상 소요 시간을 명시하고, 의존성이 있는 작업들은 선후 관계를 표시해주세요. 또한 회의에서 결정되지 않아 추가 논의가 필요한 사항도 별도로 리스트업해주세요.",
  "당신은 베테랑 UX 디자이너입니다. 전자상거래 앱의 결제 플로우를 개선하려고 합니다. 현재 카트 추가부터 결제 완료까지 평균 7단계가 소요되는데, 이를 4단계 이내로 줄이면서도 사용자 경험을 해치지 않는 방안을 제시해주세요. 각 단계별 UI 개선안과 함께 A/B 테스트 시나리오도 작성해주세요.",
  "AI 기반 헬스케어 스타트업의 투자 제안서를 작성해주세요. 시장 규모 분석, 경쟁사 비교, 우리의 차별화 포인트, 향후 3개년 매출 전망, 그리고 시리즈 A 라운드에서 확보하려는 투자금의 사용 계획을 포함해주세요. 투자자들이 가장 궁금해할 만한 리스크 요인과 이에 대한 대응 전략도 빠짐없이 다뤄주세요.",
  "중학교 2학년 학생을 위한 한국사 공부 계획을 세워주세요. 2개월 안에 조선시대 전체를 마스터해야 합니다. 매주 학습할 주제, 각 시대별 핵심 사건과 인물, 암기해야 할 연도, 그리고 효과적인 복습 방법을 단계별로 정리해주세요. 역사를 재미있게 공부할 수 있는 유튜브 채널이나 다큐멘터리 추천도 함께 부탁드립니다.",
  "블록체인 기반 NFT 마켓플레이스의 스마트 컨트랙트 설계 문서를 작성해주세요. ERC-721 토큰 표준을 따르며, 민팅, 리스팅, 경매, 로열티 분배 기능을 포함해야 합니다. 각 함수의 입출력 파라미터, 가스비 최적화 방안, 보안 취약점 검토 사항, 그리고 Solidity로 작성된 핵심 로직 예시 코드도 함께 제공해주세요.",
];

// 영어 코드 문자열 생성
const generateCodeText = (length: number): string => {
  const codeSnippets = [
    "async function processPrompt(input) { const tokens = tokenize(input); return await model.generate(tokens); }",
    "const embeddings = await encoder.encode(text); const similarity = cosineSimilarity(embeddings, query);",
    "class TransformerLayer { constructor(dim, heads) { this.attention = MultiHeadAttention(dim, heads); } }",
    "const response = await fetch('/api/completions', { method: 'POST', body: JSON.stringify({ prompt }) });",
    "torch.nn.functional.softmax(logits, dim=-1) @ value_matrix.transpose(-2, -1)",
    "def forward(self, x): attention_output = self.self_attention(x); return self.feed_forward(attention_output)",
    "const temperature = 0.7; const topP = 0.9; const maxTokens = 2048; const frequencyPenalty = 0.5;",
    "import { OpenAI } from 'openai'; const completion = await openai.chat.completions.create({ model: 'gpt-4' });",
    "SELECT * FROM embeddings WHERE vector <-> query_vector < 0.8 ORDER BY similarity DESC LIMIT 10;",
    "pipeline = transformers.pipeline('text-generation', model='gpt2', device=0, max_length=512)",
    "const tokenizer = new GPT2Tokenizer(); const encoded = tokenizer.encode(text); const decoded = tokenizer.decode(tokens);",
    "loss = criterion(outputs, targets); optimizer.zero_grad(); loss.backward(); optimizer.step();",
  ];

  let result = "";
  while (result.length < length) {
    result +=
      codeSnippets[Math.floor(Math.random() * codeSnippets.length)] + " ";
  }
  return result.slice(0, length);
};

interface PromptBlockProps {
  text: string;
  index: number;
  rotation?: "left" | "right"; // left: 위로 이동, right: 아래로 이동
}

const PromptBlock = ({ text, rotation = "left" }: PromptBlockProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const koreanRef = useRef<HTMLDivElement>(null);
  const englishRef = useRef<HTMLDivElement>(null);
  const codeText = useMemo(() => generateCodeText(text.length), [text.length]);

  useEffect(() => {
    const update = () => {
      if (!wrapperRef.current || !koreanRef.current || !englishRef.current) {
        requestAnimationFrame(update);
        return;
      }

      const rect = wrapperRef.current.getBoundingClientRect();
      const scannerY = window.innerHeight / 2;

      const cardTop = rect.top;
      const cardBottom = rect.bottom;
      const cardHeight = rect.height || 1;

      // 기본값: 카드 전체 보이도록
      let koreanTop = 0;
      let koreanBottom = 0;
      let englishTop = 0;
      let englishBottom = 0;

      if (rotation === "left") {
        // 왼쪽 열: 한국어 카드는 화면 중앙~바닥(레이저 이하)만 보이게
        // 카드가 전부 레이저 위에 있으면 한국어는 안 보임
        if (cardBottom <= scannerY) {
          koreanTop = cardHeight;
          koreanBottom = 0;
        }
        // 카드가 전부 레이저 아래에 있으면 전체 한국어
        else if (cardTop >= scannerY) {
          koreanTop = 0;
          koreanBottom = 0;
        }
        // 레이저가 카드 안을 관통
        else {
          // 레이저보다 위쪽 부분은 잘라내고, 레이저~카드 아래 부분만 남김
          koreanTop = Math.max(0, scannerY - cardTop);
          koreanBottom = 0;
        }

        // 왼쪽 열: 영어 카드는 레이저 위쪽(화면 천장~레이저)만 보이게
        if (cardTop >= scannerY) {
          // 카드 전체가 레이저 아래에 있음 -> 영어 안 보임
          englishTop = 0;
          englishBottom = cardHeight;
        } else if (cardBottom <= scannerY) {
          // 카드 전체가 레이저 위에 있음 -> 전체 영어
          englishTop = 0;
          englishBottom = 0;
        } else {
          // 카드 윗부분~레이저까지만 보이도록, 아래쪽은 잘라냄
          englishTop = 0;
          englishBottom = Math.max(0, cardBottom - scannerY);
        }
      } else {
        // 오른쪽 열: 한국어 카드는 화면 천장~레이저(레이저 이상)만 보이게
        if (cardTop >= scannerY) {
          // 카드 전체가 레이저 아래 -> 아직 하나도 스캔 안 됨 -> 0 (한국어 없음)
          koreanTop = 0;
          koreanBottom = cardHeight;
        } else if (cardBottom <= scannerY) {
          // 카드 전체가 레이저 위 → 전체 한국어
          koreanTop = 0;
          koreanBottom = 0;
        } else {
          // 카드 위쪽~레이저까지만 보이도록, 아래쪽은 잘라냄
          koreanTop = 0;
          koreanBottom = Math.max(0, cardBottom - scannerY);
        }

        // 오른쪽 열: 영어 카드는 레이저 이하(화면 중앙~바닥)만 보이게
        if (cardBottom <= scannerY) {
          // 카드 전체가 레이저 위 -> 영어 없음
          englishTop = cardHeight;
          englishBottom = 0;
        } else if (cardTop >= scannerY) {
          // 카드 전체가 레이저 아래 -> 전체 영어
          englishTop = 0;
          englishBottom = 0;
        } else {
          // 레이저보다 위쪽은 잘라내고, 레이저~카드 아래 부분만 보이게
          englishTop = Math.max(0, scannerY - cardTop);
          englishBottom = 0;
        }
      }

      const koreanClipPath =
        rotation === "left"
          ? `inset(0 ${koreanTop}px 0 ${koreanBottom}px)`
          : `inset(0 ${koreanBottom}px 0 ${koreanTop}px)`;

      const englishClipPath =
        rotation === "left"
          ? `inset(0 ${englishTop}px 0 ${englishBottom}px)`
          : `inset(0 ${englishBottom}px 0 ${englishTop}px)`;

      koreanRef.current.style.clipPath = koreanClipPath;
      englishRef.current.style.clipPath = englishClipPath;

      requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  }, [rotation]);

  return (
    <div
      ref={wrapperRef}
      className={`relative shrink-0 w-[370px] h-[250px] origin-center ${
        rotation === "left" ? "-rotate-90" : "rotate-90"
      }`}
    >
      {/* 한글 카드 */}
      <div
        ref={koreanRef}
        className="absolute inset-0 bg-linear-to-br from-violet-950/40 to-indigo-950/40 rounded-2xl p-8 border border-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.2)] backdrop-blur-sm"
      >
        <div className="h-full overflow-hidden">
          <p className="text-[15px] leading-relaxed text-violet-100">{text}</p>
        </div>
      </div>

      {/* 영어 코드 카드 */}
      <div
        ref={englishRef}
        className="absolute inset-0 bg-linear-to-br from-violet-950/40 to-indigo-950/40 rounded-2xl p-8 border border-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.2)] backdrop-blur-sm"
      >
        <div className="h-full overflow-hidden">
          <p className="text-[13px] leading-relaxed text-green-400 font-mono">
            {codeText}
          </p>
        </div>
      </div>
    </div>
  );
};
// 파티클 시스템
const ParticleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    // 그라디언트
    const gradCanvas = document.createElement("canvas");
    const gradCtx = gradCanvas.getContext("2d")!;
    gradCanvas.width = 16;
    gradCanvas.height = 16;

    const half = 8;
    const gradient = gradCtx.createRadialGradient(
      half,
      half,
      0,
      half,
      half,
      half
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.3, "rgba(196, 181, 253, 0.8)");
    gradient.addColorStop(0.7, "rgba(139, 92, 246, 0.4)");
    gradient.addColorStop(1, "transparent");
    gradCtx.fillStyle = gradient;
    gradCtx.beginPath();
    gradCtx.arc(half, half, half, 0, Math.PI * 2);
    gradCtx.fill();

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      decay: number;
      life: number;
      time: number;
      originalAlpha: number;
      twinkleSpeed: number;
      twinkleAmount: number;
    }

    const particles: Particle[] = [];
    const maxParticles = 1200;
    let lightBarY = h / 2;
    const lightBarHeight = 4;
    const fadeZone = 150;

    const handleResize = () => {
      if (!canvasRef.current) return;
      const canvasEl = canvasRef.current;
      w = window.innerWidth;
      h = window.innerHeight;
      canvasEl.width = w;
      canvasEl.height = h;
      lightBarY = h / 2;
    };

    window.addEventListener("resize", handleResize);

    const createParticle = (): Particle => ({
      x: Math.random() * w,
      y: lightBarY + (Math.random() - 0.5) * lightBarHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: Math.random() * 1.0 + 0.3,
      radius: Math.random() * 1.2 + 0.5,
      alpha: Math.random() * 0.4 + 0.6,
      decay: Math.random() * 0.012 + 0.004,
      life: 1,
      time: 0,
      originalAlpha: 0,
      twinkleSpeed: Math.random() * 0.06 + 0.02,
      twinkleAmount: Math.random() * 0.15 + 0.1,
    });

    for (let i = 0; i < maxParticles; i++) {
      const p = createParticle();
      p.originalAlpha = p.alpha;
      particles.push(p);
    }

    const animate = () => {
      ctx.clearRect(0, 0, w, h);

      // 라이트 바
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;

      // 코어 라인
      const coreGradient = ctx.createLinearGradient(
        0,
        lightBarY - lightBarHeight / 2,
        0,
        lightBarY + lightBarHeight / 2
      );
      coreGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
      coreGradient.addColorStop(0.5, "rgba(255, 255, 255, 1)");
      coreGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = coreGradient;
      ctx.fillRect(0, lightBarY - lightBarHeight / 2, w, lightBarHeight);

      // 글로우 레이어들
      const glow1 = ctx.createLinearGradient(
        0,
        lightBarY - lightBarHeight * 3,
        0,
        lightBarY + lightBarHeight * 3
      );
      glow1.addColorStop(0, "rgba(139, 92, 246, 0)");
      glow1.addColorStop(0.5, "rgba(196, 181, 253, 0.9)");
      glow1.addColorStop(1, "rgba(139, 92, 246, 0)");

      ctx.globalAlpha = 0.8;
      ctx.fillStyle = glow1;
      ctx.fillRect(0, lightBarY - lightBarHeight * 3, w, lightBarHeight * 6);

      const glow2 = ctx.createLinearGradient(
        0,
        lightBarY - lightBarHeight * 6,
        0,
        lightBarY + lightBarHeight * 6
      );
      glow2.addColorStop(0, "rgba(139, 92, 246, 0)");
      glow2.addColorStop(0.5, "rgba(139, 92, 246, 0.5)");
      glow2.addColorStop(1, "rgba(139, 92, 246, 0)");

      ctx.globalAlpha = 0.6;
      ctx.fillStyle = glow2;
      ctx.fillRect(0, lightBarY - lightBarHeight * 6, w, lightBarHeight * 12);

      // 파티클
      ctx.globalCompositeOperation = "lighter";
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.time++;
        p.alpha =
          p.originalAlpha * p.life +
          Math.sin(p.time * p.twinkleSpeed) * p.twinkleAmount;
        p.life -= p.decay;

        if (p.y > h + 10 || p.life <= 0) {
          Object.assign(p, createParticle());
          p.originalAlpha = p.alpha;
        }

        let fadeAlpha = 1;
        if (p.x < fadeZone) {
          fadeAlpha = p.x / fadeZone;
        } else if (p.x > w - fadeZone) {
          fadeAlpha = (w - p.x) / fadeZone;
        }

        ctx.globalAlpha = p.alpha * fadeAlpha;
        ctx.drawImage(
          gradCanvas,
          p.x - p.radius,
          p.y - p.radius,
          p.radius * 2,
          p.radius * 2
        );
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-20"
    />
  );
};

export default function LaserIntro({ onComplete }: { onComplete: () => void }) {
  const leftContainerRef = useRef<HTMLDivElement>(null);
  const rightContainerRef = useRef<HTMLDivElement>(null);
  const [prompts] = useState([...PROMPTS, ...PROMPTS, ...PROMPTS, ...PROMPTS]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 8000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  useEffect(() => {
    if (!leftContainerRef.current || !rightContainerRef.current) return;

    const leftContainer = leftContainerRef.current;
    const rightContainer = rightContainerRef.current;

    const loopHeight = leftContainer.scrollHeight / 2;
    const speed = 0.5;

    let leftOffset = 0;
    let rightOffset = 0;

    const animate = () => {
      leftOffset -= speed;
      if (leftOffset <= -loopHeight) {
        leftOffset += loopHeight;
      }
      leftContainer.style.transform = `translateY(${leftOffset}px)`;

      rightOffset += speed;
      if (rightOffset >= loopHeight) {
        rightOffset -= loopHeight;
      }
      rightContainer.style.transform = `translateY(${rightOffset}px)`;

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden bg-black">
      <ParticleCanvas />
      {/* 중앙 스캐너 라인 */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-10 pointer-events-none z-30">
        {/* 배경 글로우 */}
        <div className="absolute inset-0 bg-linear-to-r from-cyan-400/30 via-transparent to-cyan-400/30" />

        {/* 사이언 글로우 – 양끝 진함 / 중앙 투명 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-2 
                  bg-linear-to-r 
                  from-cyan-400 via-transparent to-cyan-400 
                  blur-sm"
        />

        {/* 흰색 코어 – 양끝 밝고 중앙 희미 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-1
                  bg-linear-to-r
                  from-white via-transparent to-white"
        />
      </div>
      {/* 왼쪽 카드 스트림 */}
      <div className="absolute left-4 top-0 h-full flex items-center z-10">
        <div ref={leftContainerRef} className="flex flex-col gap-40">
          {prompts.map((prompt, index) => (
            <PromptBlock
              key={`left-${index}`}
              text={prompt}
              index={index}
              rotation="left"
            />
          ))}
        </div>
      </div>
      {/* 오른쪽 카드 스트림 */}
      <div className="absolute right-4 top-0 h-full flex items-center z-10">
        <div ref={rightContainerRef} className="flex flex-col gap-40">
          {prompts.map((prompt, index) => (
            <PromptBlock
              key={`right-${index}`}
              text={prompt}
              index={index}
              rotation="right"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
