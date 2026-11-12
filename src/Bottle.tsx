import React, { useId } from "react";
import Svg, {
  Defs,
  G,
  LinearGradient,
  Stop,
  Path,
  ClipPath,
  Rect,
  Ellipse,
  Text as SvgText,
  Circle,
} from "react-native-svg";
import { isComplete } from "./engine";
export const COLORS = [
  { name: "Coral", value: "#FFAB99", letter: "A" },
  { name: "Mint", value: "#76E0C1", letter: "B" },
  { name: "Lavender", value: "#B6A0F5", letter: "C" },
  { name: "Honey", value: "#FFD478", letter: "D" },
  { name: "Sky", value: "#83C7FA", letter: "E" },
];
export function Bottle({
  tube,
  width = 72,
  selected = false,
  target = false,
  labels = false,
}: {
  tube: number[];
  width?: number;
  selected?: boolean;
  target?: boolean;
  labels?: boolean;
}) {
  const id = useId().replace(/[^a-z0-9]/gi, "");
  const shape =
    "M26 17 L56 17 L56 43 Q71 48 71 64 L71 166 Q71 184 53 184 L29 184 Q11 184 11 166 L11 64 Q11 48 26 43Z";
  return (
    <Svg width={width} height={width * 2.44} viewBox="0 0 82 200">
      <Defs>
        <ClipPath id={`clip${id}`}>
          <Path d={shape} />
        </ClipPath>
        <LinearGradient id={`glass${id}`} x1="0" y1="0" x2="1" y2=".4">
          <Stop stopColor="#C8E3DD" stopOpacity=".2" />
          <Stop offset=".3" stopColor="#CAE6DD" stopOpacity=".025" />
          <Stop offset="1" stopColor="#E8FCF5" stopOpacity=".12" />
        </LinearGradient>
        {COLORS.map((c, i) => (
          <LinearGradient
            key={i}
            id={`water${id}${i}`}
            x1="0"
            y1="0"
            x2="1"
            y2=".5"
          >
            <Stop stopColor={c.value} />
            <Stop offset=".65" stopColor={c.value} />
            <Stop offset="1" stopColor={c.value} stopOpacity=".8" />
          </LinearGradient>
        ))}
      </Defs>
      <Ellipse cx="41" cy="191" rx="29" ry="4" fill="#000000" opacity=".18" />
      <Path
        d={shape}
        fill={`url(#glass${id})`}
        stroke={selected || target ? "#E0C5FF" : "#B2BEDD"}
        strokeOpacity={selected || target ? 1 : 0.5}
        strokeWidth={selected || target ? 2.2 : 1.1}
      />
      <GFluid id={id} tube={tube} labels={labels} />
      <Path
        d="M20 68 L20 158 Q20 174 29 175"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3.4"
        opacity=".25"
        strokeLinecap="round"
      />
      <Path
        d="M63 72 L63 151"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1"
        opacity=".13"
      />
      <Rect
        x="23"
        y="10"
        width="36"
        height="8"
        rx="3"
        fill="#444B66"
        stroke={selected ? "#E0C5FF" : "#B2BEDD"}
        strokeOpacity=".6"
        strokeWidth="1"
      />
      <Path d="M26 12 L53 12" stroke="#E3F6ED" opacity=".23" strokeWidth="1" />
      {isComplete(tube) && (
        <>
          <Circle cx="63" cy="22" r="8.5" fill="#E2D6AC" />
          <Path
            d="M59 22 L62 25 L67 19"
            fill="none"
            stroke="#1B3934"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {target && (
        <Path
          d="M36 1 L41 6 L46 1"
          stroke="#E0C5FF"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </Svg>
  );
}
function GFluid({
  id,
  tube,
  labels,
}: {
  id: string;
  tube: number[];
  labels: boolean;
}) {
  return (
    <G>
      {tube.map((color, i) => (
        <React.Fragment key={i}>
          <Rect
            x="12"
            y={182 - (i + 1) * 29}
            width="58"
            height="29.5"
            fill={`url(#water${id}${color})`}
            clipPath={`url(#clip${id})`}
          />
          {labels && (
            <SvgText
              x="41"
              y={182 - i * 29 - 10}
              fill="#16332F"
              opacity=".7"
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
            >
              {COLORS[color].letter}
            </SvgText>
          )}
        </React.Fragment>
      ))}
      {tube.length > 0 && (
        <Ellipse
          cx="41"
          cy={183 - tube.length * 29}
          rx="28"
          ry="3"
          fill={COLORS[tube[tube.length - 1]].value}
          stroke="#FFFFFF"
          strokeOpacity=".18"
          strokeWidth=".6"
          clipPath={`url(#clip${id})`}
        />
      )}
    </G>
  );
}
