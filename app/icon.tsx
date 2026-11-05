import { ImageResponse } from "next/og";
import { STRUCTA_S_PATH_TOP, STRUCTA_S_PATH_BOTTOM } from "@/components/shared/StructaLogo";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          background: "#12151C",
          border: "1px solid rgba(61, 220, 151, 0.4)",
        }}
      >
        <svg
          viewBox="0 0 100 100"
          width="20"
          height="20"
          fill="#3DDC97"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d={STRUCTA_S_PATH_TOP} />
          <path d={STRUCTA_S_PATH_BOTTOM} />
        </svg>
      </div>
    ),
    { ...size }
  );
}

