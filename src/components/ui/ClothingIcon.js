import Svg, { Path } from "react-native-svg";

// Biểu tượng quần áo vẽ bằng SVG: Ionicons (và các bộ icon miễn phí khác) không có quần, váy đầm.
// Nét viền, đầu tròn, độ dày tương đương Ionicons "-outline" để đứng cạnh nhau không lệch kiểu.
// Khung 24×24; vẽ cả 3 (áo, quần, váy đầm) cùng một tay cho đồng bộ
const PATHS = {
  // Áo thun: vai, tay ngắn, cổ tròn
  shirt: [
    "M8.5 3 4 5.5 2.5 9.5 6 11l1-1.5V21h10V9.5l1 1.5 3.5-1.5L20 5.5 15.5 3c-.6 1.5-1.9 2.4-3.5 2.4S9.1 4.5 8.5 3z",
  ],
  // Quần dài: cạp + hai ống
  pants: ["M6 3h12l1 18h-5l-2-10-2 10H5L6 3z", "M6 6.5h12"],
  // Đầm: dây vai, thân trên, eo, chân váy xoè
  dress: [
    "M9 2v3.2L7.5 10 4 21h16l-3.5-11L15 5.2V2",
    "M9 5.2c1.8 1.4 4.2 1.4 6 0",
    "M7.5 10h9",
  ],
};

export function ClothingIcon({ name, size = 24, color }) {
  const paths = PATHS[name];
  if (!paths) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {paths.map((d) => (
        <Path
          key={d}
          d={d}
          stroke={color}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
