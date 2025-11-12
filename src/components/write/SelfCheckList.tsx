"use client";

import M3Checkbox from "@/components/ui/M3CheckBox";

type SelfCheckValues = {
  q1: boolean;
  q2: boolean;
  q3: boolean;
};

type Props = {
  values: SelfCheckValues;
  onChange: (values: SelfCheckValues) => void;
};

export function SelfCheckList({ values, onChange }: Props) {
  const handleChange = (key: keyof SelfCheckValues) => (checked: boolean) => {
    onChange({
      ...values,
      [key]: checked,
    });
  };

  return (
    <div className="grid bg-white/40 shadow-lg rounded-xl p-6 gap-3">
      <p className="font-semibold text-xl mb-2">자가진단 문항</p>

      <div className="w-4/5 mx-auto">
        <div className="">
          <M3Checkbox
            label="프롬프트를 올리기 전에 프롬프트의 성능을 충분히 검증하였나요?"
            checked={values.q1}
            onChange={handleChange("q1")}
          />
          <M3Checkbox
            label="이용규정 및 사회 일반의 통념에 위배되지 않는 프롬프트인가요?"
            checked={values.q2}
            onChange={handleChange("q2")}
          />
          <M3Checkbox
            label="프롬프트 업로드에 관한 자체 라이선스 규정에 동의하시나요?"
            checked={values.q3}
            onChange={handleChange("q3")}
          />
        </div>
      </div>
    </div>
  );
}
