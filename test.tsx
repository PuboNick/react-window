import { HeatmapColorCalculator, HeatmapColorSchemes } from './heatmap-color';

const heatmap = new HeatmapColorCalculator({
  minValue: 0,
  maxValue: 500,
  gradient: HeatmapColorSchemes.GREEN_YELLOW_RED,
});

const data: any[] = [];

for (let i = 0; i <= 500; i++) {
  data.push({ id: i, color: heatmap.getColor(i) });
}

export default function TestPanel() {
  return (
    <div style={{ display: 'flex', width: '100%', overflow: 'hidden' }}>
      {data.map((item) => (
        <div
          key={item.id}
          style={{ background: `rgba(${item.color.r}, ${item.color.g}, ${item.color.b})`, flex: 1, height: 20 }}
        ></div>
      ))}
    </div>
  );
}
