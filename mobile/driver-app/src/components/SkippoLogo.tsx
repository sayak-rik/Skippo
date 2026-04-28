import Svg, { Circle, Path, Rect } from "react-native-svg";

export function SkippoLogo({ size = 52 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Path d="M50 4 L91 19 L91 58 Q91 89 50 98 Q9 89 9 58 L9 19 Z" fill="#FFB300" />
      <Path d="M50 14 L82 27 L82 58 Q82 83 50 91 Q18 83 18 58 L18 27 Z" fill="#FFFFFF" />
      <Circle cx={50} cy={43} r={9.5} fill="#1C2E6E" />
      <Path d="M50 56 C42 52 26 55 20 67 L20 75 C26 63 42 59 50 63 Z" fill="#1C2E6E" />
      <Path d="M50 56 C58 52 74 55 80 67 L80 75 C74 63 58 59 50 63 Z" fill="#1C2E6E" />
      <Rect x={48.5} y={56} width={3} height={7} rx={1.5} fill="#1C2E6E" />
    </Svg>
  );
}
