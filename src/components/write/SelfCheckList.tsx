"use client";

import M3Checkbox from "@/components/ui/M3CheckBox";

export function SelfCheckList() {
  return (
    <div className="grid bg-white/40 shadow-lg rounded-xl p-6">
      <p className="font-semibold text-xl mb-4">자가진단 문항</p>
      <div className="grid mx-auto">
        <label className="flex items-center">
          <M3Checkbox />
          <p>프롬프트를 올리기 전에 프롬프트의 성능을 충분히 검증하였나요?</p>
        </label>
        <label className="flex items-center">
          <M3Checkbox />
          <p>이용규정 및 사회 일반의 통념에 위배되지 않는 프롬프트인가요?</p>
        </label>
        <label className="flex items-center">
          <M3Checkbox />
          <p>프롬프트 업로드에 관한 자체 라이선스 규정에 동의하시나요?</p>
        </label>
      </div>
    </div>
  );
}
