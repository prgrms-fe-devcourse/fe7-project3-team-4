// src/hooks/useNewsUpload.ts
// [기능]: HTML 파일 업로드 로직을 담당하는 커스텀 훅
// - 숨겨진 <input type="file">을 참조(ref)하고 트리거
// - 파일 선택 시 /api/parse API로 업로드 (POST)
// - 업로드 상태(시작, 성공, 오류)에 따라 콜백 함수를 호출

"use client";

import { useState, useRef, useCallback } from "react"; // useCallback 임포트

// 업로드 상태에 따른 콜백 함수 타입 정의
type UploadCallback = {
  onUploadSuccess: () => void;
  onUploadStart: () => void;
  onUploadError: (errorMessage: string) => void;
};

export function useNewsUpload({
  onUploadSuccess,
  onUploadStart,
  onUploadError,
}: UploadCallback) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadingUpload, setLoadingUpload] = useState(false);

  // 업로드 API 호출
  // [수정] useCallback 래핑 (의존성: 콜백 함수들)
  const uploadAndRefresh = useCallback(
    async (f: File) => {
      setLoadingUpload(true);
      onUploadStart(); // 시작 콜백

      try {
        const text = await f.text();
        const res = await fetch("/api/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ html: text }),
        });
        const result = await res.json();

        if (result.success) {
          onUploadSuccess(); // 성공 콜백
        } else {
          throw new Error(result.error || "파싱 오류 발생");
        }
      } catch (err: unknown) { // [수정] any -> unknown
        console.error("[uploadAndRefresh Error]", err);
        // [수정] 타입 가드 추가
        let message = "알 수 없는 오류가 발생했습니다.";
        if (err instanceof Error) {
          message = err.message;
        }
        onUploadError(`❌ 오류: ${message}`); // 에러 콜백
      } finally {
        setLoadingUpload(false);
      }
    },
    [onUploadStart, onUploadSuccess, onUploadError], // 콜백 함수 의존성 추가
  );

  // 파일 input 변경 시 (파일 선택 완료)
  // [수정] useCallback 래핑 (의존성: uploadAndRefresh)
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) {
        await uploadAndRefresh(f);
      }
      // [클린 코드] 동일한 파일 재업로드를 위해 input 값 초기화
      e.target.value = "";
    },
    [uploadAndRefresh], // uploadAndRefresh 의존성 추가
  );

  // "새 게시글" 버튼 클릭 시 input을 프로그래매틱하게 클릭
  // [수정] useCallback 래핑 (의존성: 없음)
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []); // ref는 의존성 배열에 필요하지 않음

  return {
    fileInputRef,
    loadingUpload,
    handleFileChange,
    triggerFileInput,
  };
}