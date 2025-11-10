"use client";

import * as React from "react";
import {
  Checkbox,
  FormControlLabel,
  createTheme,
  ThemeProvider,
} from "@mui/material";
import { blue, grey } from "@mui/material/colors";

type Props = {
  label?: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  // 완전 제어형으로 쓰고 싶을 때:
  checked?: boolean;
  onChange?: (checked: boolean) => void;
};

// Blue + Dark Theme (DT)
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: blue[500] }, // 핵심 블루 톤
    background: { default: "#0F1117", paper: "#121821" },
    text: { primary: "#E6E8EE", secondary: "#B8BECC" },
  },
  shape: { borderRadius: 6 },
});

export default function M3Checkbox({
  label = "옵션",
  defaultChecked = false,
  disabled = false,
  checked, // 있으면 제어형, 없으면 내부 상태 사용
  onChange,
}: Props) {
  const [local, setLocal] = React.useState(defaultChecked);
  const isControlled = typeof checked === "boolean";
  const value = isControlled ? checked! : local;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setLocal(e.target.checked);
    onChange?.(e.target.checked);
  };

  return (
    <ThemeProvider theme={theme}>
      <FormControlLabel
        // 라벨 전체 클릭 가능 → 체크 토글됨
        control={
          <Checkbox
            checked={value}
            onChange={handleChange}
            disabled={disabled}
            sx={{
              color: grey[500], // 미체크 상태
              "&.Mui-checked": { color: blue[500] }, // 체크 상태
              "&.MuiCheckbox-indeterminate": { color: blue[400] },
              // 포커스/호버 상태 살짝 강조
              "&:hover": { backgroundColor: "rgba(25,118,210,0.08)" }, // blue[500]의 알파
            }}
          />
        }
        label={label}
      />
    </ThemeProvider>
  );
}
