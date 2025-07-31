import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Cell,
  LabelList,
} from "recharts";
import BeerIcon from "../assets/beer.svg";

// Responsive breakpoint
const MOBILE_BREAKPOINT = 600;
// Color palette
const COLORS = ["#FFD24C", "#4CAF50", "#2E7D32", "#81C784", "#A5D6A7"];
const OTHER_COLOR = "#E0E0E0";
// Chart margins and gaps
const MARGIN_PC = { top: 16, right: 60, bottom: 16, left: 200 };
const MARGIN_MOBILE = { top: 16, right: 60, bottom: 16, left: 110 };

// Hook: detect mobile viewport
function useIsMobile(breakpoint = MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth <= breakpoint
  );
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);
  return isMobile;
}

// Custom tooltip for bars
function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const { rank, name, pingas } = payload[0].payload;
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #ccc',
        padding: 8,
        borderRadius: 4,
        fontSize: '0.95rem',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
      }}
    >
      <strong style={{ fontSize: '1.1rem' }}>{rank}º {name}</strong>
      <br />
      <span style={{ fontSize: '1rem' }}>{pingas} 🍻</span>
    </div>
  );
}
CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
};

// Y-Axis tick: rank + team name, vertically centered
const RankTick = ({ x, y, payload }) => {
  const [rank, ...nameParts] = String(payload.value).split(' ');
  const name = nameParts.join(' ');
  return (
    <text
      x={x - 10}
      y={y}
      textAnchor="end"
      dominantBaseline="middle"
      style={{ fontSize: '1.2rem', fontWeight: 800 }}
    >
      <tspan fontSize="1.3rem">{rank}</tspan>
      <tspan dx={8} fill="var(--text-primary)" fontSize="1.1rem" fontWeight={700}>
        {name}
      </tspan>
    </text>
  );
};
RankTick.propTypes = {
  x: PropTypes.number,
  y: PropTypes.number,
  payload: PropTypes.object,
};

// Custom label: pingas number + beer icon, centered on bar row
const BeerLabel = ({ x, y, width, value, barSize, isMobile }) => {
  const fontSize = isMobile ? 16 : 22;
  const iconSize = fontSize * 0.95;
  const cy = y + barSize / 2;
  return (
    <g>
      <text
        x={x + width + 8}
        y={cy}
        fontSize={fontSize}
        fontWeight="bold"
        fill="var(--text-primary)"
        dominantBaseline="middle"
      >
        {value}
      </text>
      <image
        href={BeerIcon}
        x={x + width + 8 + fontSize + 4}
        y={cy - iconSize / 2}
        width={iconSize}
        height={iconSize}
      />
    </g>
  );
};
BeerLabel.propTypes = {
  x: PropTypes.number,
  y: PropTypes.number,
  width: PropTypes.number,
  value: PropTypes.number,
  barSize: PropTypes.number,
  isMobile: PropTypes.bool,
};

// Main component
function HorizontalBarChart({ data, highlight }) {
  const isMobile = useIsMobile();
  const margin = isMobile ? MARGIN_MOBILE : MARGIN_PC;
  const barSize = isMobile ? 30 : 44;

  // Memoized chart data with rank and label
  const chartData = useMemo(
    () => data.map((team, i) => ({
      ...team,
      rank: i + 1,
      label: `${i + 1}º ${team.name}`,
    })),
    [data]
  );

  const height = 60 + chartData.length * (barSize + 14);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ ...margin }}
        barCategoryGap="28%"
      >
        <XAxis type="number" hide />
        <YAxis
          dataKey="label"
          type="category"
          tick={<RankTick />}
          width={margin.left}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          content={<CustomTooltip />}
        />
        <Bar
          dataKey="pingas"
          barSize={barSize}
          isAnimationActive
          animationDuration={600}
          animationEasing="ease-in-out"
          radius={[0, 8, 8, 0]}
        >
          {chartData.map((entry, idx) => (
            <Cell
              key={entry.id}
              fill={idx < highlight ? COLORS[idx] : OTHER_COLOR}
            />
          ))}
          <LabelList
            dataKey="pingas"
            position="right"
            content={(props) => (
              <BeerLabel {...props} barSize={barSize} isMobile={isMobile} />
            )}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

HorizontalBarChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      pingas: PropTypes.number.isRequired,
    })
  ).isRequired,
  highlight: PropTypes.number,
};
HorizontalBarChart.defaultProps = {
  highlight: 5,
};

export default React.memo(HorizontalBarChart);
