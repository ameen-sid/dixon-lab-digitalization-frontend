import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { apiConnector } from '../../services/apiConnector';
import { getCapas } from '../../services/operations/capaService';
import { getTestingEquipments, getWeeklyEquipmentAnalytics } from '../../services/operations/testingEquipmentService';
import { getPlatforms, getWeeklyPlatformAnalytics } from '../../services/operations/platformAvailabilityService';
import { getPlatforms as getNablPlatforms, getWeeklyPlatformAnalytics as getNablWeeklyPlatformAnalytics } from '../../services/operations/nablStationAvailabilityService';
import { getTestTypes } from '../../services/operations/testTypeService';
import CustomSelect from '../../components/CustomSelect';
import {
  RotateCw,
  Monitor,
  Clock
} from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const platformOptions = [
  { value: '', label: 'All Platforms' },
  ...Array.from({ length: 10 }, (_, idx) => ({
    value: String(idx + 1),
    label: `Platform ${idx + 1}`
  }))
];

const getSafeStatusText = (status: any) => {
  if (!status) return '';

  if (typeof status === 'string') {
    return status.trim().toLowerCase();
  }

  if (typeof status === 'object') {
    return String(status.name || status.status || status.title || '')
      .trim()
      .toLowerCase();
  }

  return String(status).trim().toLowerCase();
};

const isFailed = (s: any) => {
  const status = getSafeStatusText(s);

  return [
    'failed',
    'fail',
    'inspection_failed',
    'testing_failed',
  ].includes(status);
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const isCompleted = (s: any) => [
  'pass',
  'fail',
  'failed',
  'partial',
  'completed',
  'testing_passed',
  'testing_failed',
  'testing_partial',
  'testing_completed',
  'inspection_failed'
].includes(getSafeStatusText(s));

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM SVG CHARTS WITH LIVE DATA
// ─────────────────────────────────────────────────────────────────────────────

// Donut Chart for Statuses
function Donut({
  segments,
  size = 100,
  onSegmentClick,
}: {
  segments: { value: number; color: string; label: string }[];
  size?: number;
  onSegmentClick?: (label: string) => void;
}) {
  const [hoveredSeg, setHoveredSeg] = useState<{ label: string; value: number; color: string } | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const sum = segments.reduce((a, s) => a + s.value, 0);
  const totalForDiv = sum || 1;
  const r = 36;
  const cx = 50;
  const cy = 50;
  const stroke = 14;
  let offset = 0;
  const circ = 2 * Math.PI * r;

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="overflow-visible"
        onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
      >
        {segments.map((seg, i) => {
          const pct = seg.value / totalForDiv;
          const dash = pct * circ;
          const gap = circ - dash;
          const isHovered = hoveredSeg?.label === seg.label;

          const el = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={isHovered ? stroke + 2 : stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset * circ}
              strokeLinecap="butt"
              onMouseEnter={() => setHoveredSeg({ ...seg, color: seg.color })}
              onMouseLeave={() => setHoveredSeg(null)}
              onClick={() => {
                if (onSegmentClick) {
                  onSegmentClick(seg.label);
                }
              }}
              className="transition-all duration-200 cursor-pointer"
              style={{
                transformOrigin: '50px 50px',
                transform: 'rotate(-90deg)',
                opacity: hoveredSeg && !isHovered ? 0.65 : 1,
              }}
            >
              <title>{`${seg.label}: ${seg.value} (${((seg.value / totalForDiv) * 100).toFixed(1)}%)`}</title>
            </circle>
          );

          offset += pct;
          return el;
        })}

        {hoveredSeg ? (
          <>
            <text x="50" y="47" textAnchor="middle" fontSize="13" fontWeight="900" fill="#18181b">
              {hoveredSeg.value}
            </text>
            <text x="50" y="60" textAnchor="middle" fontSize="5.5" fontWeight="800" className="fill-zinc-500 uppercase tracking-wider">
              {hoveredSeg.label.length > 14 ? hoveredSeg.label.substring(0, 11) + '…' : hoveredSeg.label}
            </text>
          </>
        ) : (
          <text x="50" y="54" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#18181b">
            {sum}
          </text>
        )}
      </svg>

      {hoveredSeg && (
        <div
          className="fixed z-[9999] bg-zinc-950/95 text-white p-3 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] text-[11px] pointer-events-none transition-all duration-75 border border-zinc-800/80 backdrop-blur-md flex flex-col gap-0.5"
          style={{ left: tooltipPos.x + 15, top: tooltipPos.y + 15 }}
        >
          <div className="font-extrabold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: hoveredSeg.color }} />
            <span className="text-zinc-100">{hoveredSeg.label}</span>
          </div>
          <div className="text-[10px] text-zinc-400 font-semibold mt-1">
            Quantity: <span className="text-white font-black">{hoveredSeg.value}</span>{' '}
            ({((hoveredSeg.value / totalForDiv) * 100).toFixed(1)}%)
          </div>
          <div className="text-[9px] text-zinc-500 font-semibold mt-1">
            Click to view details
          </div>
        </div>
      )}
    </div>
  );
}

// Vertical Bar Chart for Monthly Trends with hover details and stacked sub-bars
type TrendBarBreakdown = {
  key: string;
  label: string;
  color: string;
};

type TrendBarData = {
  label: string;
  value: number;
  [key: string]: any;
};

function BarChart({
  data,
  color = '#11236a',
  tooltipTitle = 'Monthly Details',
  breakdown = [],
}: {
  data: TrendBarData[];
  color?: string;
  tooltipTitle?: string;
  breakdown?: TrendBarBreakdown[];
}) {
  const [hoveredBar, setHoveredBar] = useState<TrendBarData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const height = 250;
  const width = 780;
  const padding = { top: 28, right: 24, bottom: 48, left: 46 };

  const maxVal = Math.max(...data.map((d) => Number(d.value) || 0), 4);
  const step = Math.max(1, Math.ceil(maxVal / 4));
  const yMax = step * 4;
  const yTicks = [0, step, step * 2, step * 3, step * 4];

  const chartHeight = height - padding.top - padding.bottom;
  const chartWidth = width - padding.left - padding.right;

  return (
    <div className="relative w-full overflow-x-auto overflow-y-visible">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[680px] overflow-visible"
        style={{ height: 245 }}
        onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
        onMouseLeave={() => setHoveredBar(null)}
      >
        {/* Grid lines */}
        {yTicks.map((tick) => {
          const y = padding.top + chartHeight - (tick / yMax) * chartHeight;
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartWidth}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                className="text-[11px] fill-zinc-500 font-semibold"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const colWidth = chartWidth / Math.max(data.length, 1);
          const xCenter = padding.left + i * colWidth + colWidth / 2;
          const barWidth = Math.min(32, Math.max(18, colWidth * 0.5));
          const totalValue = Number(d.value) || 0;
          const barHeight = yMax === 0 ? 0 : (totalValue / yMax) * chartHeight;
          const barY = padding.top + chartHeight - barHeight;
          const isHovered = hoveredBar?.label === d.label;

          let currentBottomY = padding.top + chartHeight;
          const visibleBreakdown = breakdown.filter((item) => Number(d[item.key]) > 0);
          const breakdownTotal = visibleBreakdown.reduce((sum, item) => sum + Number(d[item.key] || 0), 0);
          const shouldUseBreakdown = visibleBreakdown.length > 0 && breakdownTotal > 0;

          return (
            <g
              key={`${d.label}-${i}`}
              onMouseEnter={() => setHoveredBar(d)}
              className="cursor-pointer"
              opacity={hoveredBar && !isHovered ? 0.55 : 1}
            >
              {/* Invisible wider hover target */}
              <rect
                x={xCenter - colWidth / 2}
                y={padding.top}
                width={colWidth}
                height={chartHeight + 30}
                fill="transparent"
              />

              {/* Background track */}
              <rect
                x={xCenter - barWidth / 2}
                y={padding.top}
                width={barWidth}
                height={chartHeight}
                fill="#f4f4f5"
                rx="8"
              />

              {shouldUseBreakdown ? (
                visibleBreakdown.map((item, idx) => {
                  const segmentValue = Number(d[item.key]) || 0;
                  const segmentHeight = yMax === 0 ? 0 : (segmentValue / yMax) * chartHeight;
                  currentBottomY -= segmentHeight;

                  return (
                    <rect
                      key={item.key}
                      x={xCenter - barWidth / 2}
                      y={currentBottomY}
                      width={barWidth}
                      height={segmentHeight}
                      fill={item.color}
                      rx={idx === 0 ? 0 : 2}
                      style={{
                        transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1), y 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                  );
                })
              ) : (
                <rect
                  x={xCenter - barWidth / 2}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  fill={color}
                  rx="8"
                  style={{
                    transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1), y 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
              )}

              {/* If breakdown total is less than total, fill remaining with main color */}
              {shouldUseBreakdown && breakdownTotal < totalValue && (
                <rect
                  x={xCenter - barWidth / 2}
                  y={padding.top + chartHeight - barHeight}
                  width={barWidth}
                  height={((totalValue - breakdownTotal) / yMax) * chartHeight}
                  fill={color}
                  rx="8"
                  style={{
                    transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1), y 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
              )}

              <text
                x={xCenter}
                y={padding.top + chartHeight + 24}
                textAnchor="middle"
                className="text-[11px] fill-zinc-500 font-bold"
              >
                {d.label}
              </text>

              {totalValue > 0 && (
                <text
                  x={xCenter}
                  y={barY - 8}
                  textAnchor="middle"
                  className="text-[12px] fill-zinc-900 font-extrabold"
                >
                  {totalValue}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hoveredBar && (
        <div
          className="fixed z-[9999] min-w-[190px] rounded-2xl border border-zinc-800/80 bg-zinc-950/95 p-3 text-[11px] text-white shadow-[0_10px_40px_rgba(0,0,0,0.22)] pointer-events-none backdrop-blur-md"
          style={{ left: tooltipPos.x + 14, top: tooltipPos.y + 14 }}
        >
          <div className="text-[12px] font-extrabold text-zinc-100">
            {tooltipTitle} - {hoveredBar.label}
          </div>
          <div className="mt-2 flex items-center justify-between gap-6 text-zinc-300">
            <span>Total</span>
            <span className="font-black text-white">{Number(hoveredBar.value) || 0}</span>
          </div>

          {breakdown.length > 0 && (
            <div className="mt-2 space-y-1 border-t border-zinc-800 pt-2">
              {breakdown.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-6 text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </span>
                  <span className="font-black text-white">{Number(hoveredBar[item.key]) || 0}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Platform Availability Stacked Bar Chart using calculated data
function StackedBarChart({ data }: { data: any[] }) {
  const [hoveredWeek, setHoveredWeek] = useState<any | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const height = 180;
  const width = 450;
  const padding = { top: 20, right: 20, bottom: 30, left: 45 };

  const yTicks = [0, 45, 90, 135, 180];
  const maxVal = 180;

  const chartHeight = height - padding.top - padding.bottom;
  const chartWidth = width - padding.left - padding.right;

  return (
    <div className="w-full overflow-x-auto relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[360px] overflow-visible"
        style={{ maxHeight: 200 }}
        onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
      >
        {/* Y-axis label */}
        <text
          transform="rotate(-90)"
          x={-(padding.top + chartHeight / 2)}
          y={14}
          textAnchor="middle"
          className="text-[10px] fill-zinc-400 font-extrabold uppercase tracking-wider"
        >
          Hours
        </text>

        {/* Grid lines */}
        {yTicks.map((tick) => {
          const y = padding.top + chartHeight - (tick / maxVal) * chartHeight;
          return (
            <g key={tick}>
              <line x1={padding.left} y1={y} x2={padding.left + chartWidth} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" className="text-[10px] fill-zinc-400 font-semibold">{tick}</text>
            </g>
          );
        })}

        {/* Stacked bars */}
        {data.map((d, i) => {
          const colWidth = chartWidth / data.length;
          const xCenter = padding.left + i * colWidth + colWidth / 2;
          const barWidth = 24;
          const isHovered = hoveredWeek?.label === d.label;

          const occupiedVal = Math.min(180, d.occupied);
          const availableVal = Math.min(180, d.available);

          const occupiedH = (occupiedVal / maxVal) * chartHeight;
          const availableH = (availableVal / maxVal) * chartHeight;

          const occupiedY = padding.top + chartHeight - occupiedH;
          const availableY = occupiedY - availableH;

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredWeek(d)}
              onMouseLeave={() => setHoveredWeek(null)}
              className="cursor-pointer"
            >
              {/* Background hover highlight */}
              {isHovered && (
                <rect
                  x={xCenter - colWidth / 2 + 4}
                  y={padding.top}
                  width={colWidth - 8}
                  height={chartHeight}
                  fill="#f8fafc"
                  rx="8"
                />
              )}
              {/* Occupied time - blue */}
              <rect
                x={xCenter - barWidth / 2}
                y={occupiedY}
                width={barWidth}
                height={occupiedH}
                fill="#3b82f6"
                rx="2"
                style={{
                  transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1), y 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
              {/* Available time - light gray */}
              <rect
                x={xCenter - barWidth / 2}
                y={availableY}
                width={barWidth}
                height={availableH}
                fill="#cbd5e1"
                rx="2"
                style={{
                  transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1), y 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
              {/* X-axis Label */}
              <text x={xCenter} y={padding.top + chartHeight + 18} textAnchor="middle" className="text-[10px] fill-zinc-400 font-bold">{d.label}</text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredWeek && (
        <div
          className="fixed z-[9999] bg-white text-zinc-900 p-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] text-xs pointer-events-none transition-all duration-75 border border-zinc-100 flex flex-col gap-2 min-w-[155px]"
          style={{ left: tooltipPos.x + 15, top: tooltipPos.y + 15 }}
        >
          <div className="font-extrabold text-[13px] text-zinc-950">{hoveredWeek.label}</div>
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center gap-2 font-bold text-zinc-650">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] shrink-0" />
              Occupied Time: <span className="text-zinc-950 font-black ml-auto">{Math.round(hoveredWeek.occupied)}</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-zinc-650">
              <span className="w-2.5 h-2.5 rounded-full bg-[#cbd5e1] shrink-0" />
              Available Time: <span className="text-zinc-950 font-black ml-auto">{Math.round(hoveredWeek.available)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Machine Utilization Grouped Bar Chart using calculated data
function MachineUtilizationChart({ data }: { data: any[] }) {
  const [hoveredWeek, setHoveredWeek] = useState<any | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const height = 180;
  const width = 450;
  const padding = { top: 20, right: 20, bottom: 30, left: 45 };

  const yTicks = [0, 45, 90, 135, 180];
  const maxVal = 180;

  const chartHeight = height - padding.top - padding.bottom;
  const chartWidth = width - padding.left - padding.right;

  return (
    <div className="w-full overflow-x-auto relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[360px] overflow-visible"
        style={{ maxHeight: 200 }}
        onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
      >
        {/* Y-axis label */}
        <text
          transform="rotate(-90)"
          x={-(padding.top + chartHeight / 2)}
          y={14}
          textAnchor="middle"
          className="text-[10px] fill-zinc-400 font-extrabold uppercase tracking-wider"
        >
          Hours
        </text>

        {/* Grid lines */}
        {yTicks.map((tick) => {
          const y = padding.top + chartHeight - (tick / maxVal) * chartHeight;
          return (
            <g key={tick}>
              <line x1={padding.left} y1={y} x2={padding.left + chartWidth} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" className="text-[10px] fill-zinc-400 font-semibold">{tick}</text>
            </g>
          );
        })}

        {/* Grouped bars */}
        {data.map((d, i) => {
          const colWidth = chartWidth / data.length;
          const xCenter = padding.left + i * colWidth + colWidth / 2;
          const barWidth = 16;
          const spacing = 2;
          const isHovered = hoveredWeek?.label === d.label;

          const allocatedH = (Math.min(180, d.allocated) / maxVal) * chartHeight;
          const actualH = (Math.min(180, d.actual) / maxVal) * chartHeight;

          const allocatedY = padding.top + chartHeight - allocatedH;
          const actualY = padding.top + chartHeight - actualH;

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredWeek(d)}
              onMouseLeave={() => setHoveredWeek(null)}
              className="cursor-pointer"
            >
              {/* Background hover highlight */}
              {isHovered && (
                <rect
                  x={xCenter - colWidth / 2 + 4}
                  y={padding.top}
                  width={colWidth - 8}
                  height={chartHeight}
                  fill="#f8fafc"
                  rx="8"
                />
              )}
              {/* Allocated - light gray */}
              <rect
                x={xCenter - barWidth - spacing}
                y={allocatedY}
                width={barWidth}
                height={allocatedH}
                fill="#cbd5e1"
                rx="3"
                style={{
                  transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1), y 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
              {/* Actual runtime - purple */}
              <rect
                x={xCenter + spacing}
                y={actualY}
                width={barWidth}
                height={actualH}
                fill="#6366f1"
                rx="3"
                style={{
                  transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1), y 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
              {/* X-axis Label */}
              <text x={xCenter} y={padding.top + chartHeight + 18} textAnchor="middle" className="text-[10px] fill-zinc-400 font-bold">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredWeek && (
        <div
          className="fixed z-[9999] bg-white text-zinc-900 p-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] text-xs pointer-events-none transition-all duration-75 border border-zinc-100 flex flex-col gap-2 min-w-[155px]"
          style={{ left: tooltipPos.x + 15, top: tooltipPos.y + 15 }}
        >
          <div className="font-extrabold text-[13px] text-zinc-950">{hoveredWeek.label}</div>
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center gap-2 font-bold text-zinc-650">
              <span className="w-2.5 h-2.5 rounded-full bg-[#cbd5e1] shrink-0" />
              Allocated Time: <span className="text-zinc-950 font-black ml-auto">{Math.round(hoveredWeek.allocated)}</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-zinc-650">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1] shrink-0" />
              Actual Runtime: <span className="text-zinc-950 font-black ml-auto">{Math.round(hoveredWeek.actual)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-zinc-600 font-bold">{label}</span>
      <span className="ml-auto font-black text-zinc-800">{value}</span>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-zinc-250/30 rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)] transition-all min-h-[350px] relative">
      <h3 className="text-sm font-extrabold text-zinc-950 mb-4 tracking-tight" style={{ fontFamily: "Outfit, Inter, sans-serif" }}>{title}</h3>
      <div className="flex-1 flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-zinc-200/60 rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)] transition-all min-h-[310px] flex flex-col">
      <h3
        className="text-[15px] font-extrabold text-zinc-950 mb-5 tracking-tight"
        style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
      >
        {title}
      </h3>
      <div className="flex-1 flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CEO DASHBOARD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function CeoDashboard({ bare = false }: { bare?: boolean }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [capas, setCapas] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [plans, setPlans] = useState<{ [key: string]: any }>({});
  const [platformAvailData, setPlatformAvailData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    title: string;
    type: 'request' | 'capa' | 'equipment' | 'station' | '';
    label: string;
    data: any[];
  }>({
    open: false,
    title: '',
    type: '',
    label: '',
    data: [],
  });

  // Filter states
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
  });
  const [selectedStation, setSelectedStation] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [machineUtilData, setMachineUtilData] = useState<any[]>([]);
  const [testTypes, setTestTypes] = useState<any[]>([]);
  const [selectedTestType, setSelectedTestType] = useState('');
  const isFirstLoadRef = useRef(true);


  const load = async () => {
    if (isFirstLoadRef.current) {
      setLoading(true);
    }
    try {
      const [reqRes, caps, eqps, plats, nablPlats, weeklyPlatData, weeklyNablPlatData, weeklyEqData, testTypesData] = await Promise.all([
        apiConnector('GET', '/api/v1/test-requests?limit=1000').catch(() => ({ data: { data: [] } })),
        getCapas()().catch(() => []),
        getTestingEquipments({ limit: 500 })().catch(() => []),
        getPlatforms()().catch(() => []),
        getNablPlatforms()().catch(() => []),
        getWeeklyPlatformAnalytics(selectedMonth, selectedStation, selectedPlatform, selectedTestType)().catch(() => []),
        getNablWeeklyPlatformAnalytics(selectedMonth, selectedStation, selectedPlatform, selectedTestType)().catch(() => []),
        getWeeklyEquipmentAnalytics(selectedMonth, selectedEquipment, selectedTestType)().catch(() => []),
        getTestTypes()().catch(() => [])
      ]);
      const rawReqs = (reqRes as any)?.data?.data || (reqRes as any)?.data || [];
      const reqs = selectedTestType
        ? rawReqs.filter((r: any) => String(r.testTypeId || r.testType?.id || '') === String(selectedTestType))
        : rawReqs;

      const activeTestTypes = Array.isArray(testTypesData) ? testTypesData : [];
      const selectedTypeName = activeTestTypes.find((t: any) => String(t.id) === String(selectedTestType))?.name || '';
      const isNabl = selectedTypeName.toLowerCase().includes('nabl');

      const finalPlatforms = isNabl ? nablPlats : plats;
      const finalWeeklyPlatData = isNabl ? weeklyNablPlatData : weeklyPlatData;

      const parsedPlans: { [key: string]: any } = {};
      if (Array.isArray(reqs)) {
        reqs.forEach((req: any) => {
          if (req.testPlans) {
            req.testPlans.forEach((plan: any) => {
              let platformNosParsed = [];
              if (plan.platformNos) {
                try {
                  platformNosParsed = typeof plan.platformNos === 'string' ? JSON.parse(plan.platformNos) : plan.platformNos;
                } catch (e) {
                  platformNosParsed = [];
                }
              }
              parsedPlans[`${req.id}-sample-${plan.sampleIndex}`] = {
                ...plan,
                platformNos: platformNosParsed
              };
            });
          }
        });
      }

      setRequests(Array.isArray(reqs) ? reqs : []);
      setCapas(Array.isArray(caps) ? caps : []);
      setEquipment(Array.isArray(eqps) ? eqps : []);
      setPlatforms(Array.isArray(finalPlatforms) ? finalPlatforms : []);
      setTestTypes(activeTestTypes);
      setPlans(parsedPlans);
      setPlatformAvailData(Array.isArray(finalWeeklyPlatData) ? finalWeeklyPlatData : []);
      setMachineUtilData(Array.isArray(weeklyEqData) ? weeklyEqData : []);
    } finally {
      setLoading(false);
      isFirstLoadRef.current = false;
    }
  };

  // Reset filters when test type filter changes to avoid mismatch
  useEffect(() => {
    setSelectedStation('');
    setSelectedPlatform('');
  }, [selectedTestType]);

  useEffect(() => { load(); }, [selectedMonth, selectedStation, selectedPlatform, selectedEquipment, selectedTestType]);

  // Format date exactly: "Saturday, June 6, 2026"
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Helper to parse selected month (YYYY-MM) and match records
  const matchesFilter = (dateStr: string, monthVal: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}` === monthVal;
  };

  // Get previous month string in YYYY-MM format
  const previousMonthStr = (() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    if (!y || !m) return '';
    const prevDate = new Date(y, m - 2, 1);
    const pyyyy = prevDate.getFullYear();
    const pmm = String(prevDate.getMonth() + 1).padStart(2, '0');
    return `${pyyyy}-${pmm}`;
  })();

  const equipmentOptions = [
    { value: '', label: 'All Equipments' },
    ...equipment.map((eq: any) => ({
      value: String(eq.id),
      label: eq.name
    }))
  ];

  const testTypeOptions = [
    { value: '', label: 'All Test Types' },
    ...testTypes.map((t: any) => ({
      value: String(t.id),
      label: t.name
    }))
  ];

  const selectedTypeName = testTypes.find((t: any) => String(t.id) === String(selectedTestType))?.name || '';
  const isNablSelected = selectedTypeName.toLowerCase().includes('nabl');

  const dynamicStationOptions = isNablSelected
    ? [
        { value: '', label: 'All Stations' },
        { value: '1', label: 'NABL Station 1' }
      ]
    : [
        { value: '', label: 'All Stations' },
        ...Array.from({ length: 14 }, (_, idx) => ({
          value: String(idx + 1),
          label: `Station ${idx + 1}`
        }))
      ];

  // ── FILTERED DATASETS ──────────────────────────────────────────────────────
  const periodRequests = requests.filter(r => matchesFilter(r.createdAt, selectedMonth));
  const filteredRequestIds = new Set(requests.map(r => String(r.id)));
  const filteredRequestNoStrings = new Set(requests.map(r => String(r.requestId)));
  const periodCapas = capas
    .filter(c => matchesFilter(c.createdAt, selectedMonth))
    .filter(c => {
      if (!selectedTestType) return true;
      return filteredRequestIds.has(String(c.testRequestId || '')) ||
             filteredRequestNoStrings.has(String(c.relatedRequest || '')) ||
             filteredRequestIds.has(String(c.relatedRequest || ''));
    });

  // ── Main Dashboard General Metrics ─────────────────────────────────────────

  // Detailed statuses for the Test Request Status Card
  const countPendingApproval = periodRequests.filter(r =>
    getSafeStatusText(r.status) === 'pending_approval'
  ).length;

  const countUnderInspection = periodRequests.filter(r =>
    ['under_inspection', 'inspection_completed'].includes(getSafeStatusText(r.status))
  ).length;

  const countInspectionFailed = periodRequests.filter(r =>
    getSafeStatusText(r.status) === 'inspection_failed'
  ).length;

  const countUnderTesting = periodRequests.filter(r =>
    ['under_testing', 'under_test', 'testing_completed'].includes(getSafeStatusText(r.status))
  ).length;

  const countCompleted = periodRequests.filter(r =>
    ['completed', 'testing_passed', 'testing_partial'].includes(getSafeStatusText(r.status))
  ).length;

  const countRejected = periodRequests.filter(r =>
    getSafeStatusText(r.status) === 'rejected'
  ).length;

  const countRetest = periodRequests.filter(r =>
    ['retest', 'restest'].includes(getSafeStatusText(r.status))
  ).length;

  const countFailed = periodRequests.filter(r =>
    ['failed', 'fail', 'testing_failed'].includes(getSafeStatusText(r.status))
  ).length;

  const capaOpenStatuses = ['pending', 'open', 'in_progress', 'under_review'];
  const capaClosedStatuses = ['completed', 'closed', 'resolved', 'done'];

  const capaOpen = periodCapas.filter(c =>
    capaOpenStatuses.includes(getSafeStatusText(c.status))
  ).length;

  const capaClosed = periodCapas.filter(c =>
    capaClosedStatuses.includes(getSafeStatusText(c.status))
  ).length;

  const capaTotal = periodCapas.length;

  const eqTotal = equipment.length;
  const eqAvail = equipment.filter(e => e.isAvailable === true && !['maintenance', 'under_maintenance'].includes(getSafeStatusText(e.status))).length;
  const eqOccupied = equipment.filter(e => e.isAvailable === false).length;
  const eqMaint = equipment.filter(e => ['maintenance', 'under_maintenance'].includes(getSafeStatusText(e.status))).length;

  const stTotal = platforms.length;
  const stAvail = platforms.filter(p => p.isAvailable === true).length;
  const stOccupied = platforms.filter(p => p.isAvailable === false).length;

  // ── DYNAMIC METRIC CALCULATIONS & TRENDS ───────────────────────────────────
  const getEfficiencyForPeriod = (monthVal: string) => {
    const periodReqs = requests.filter(r => matchesFilter(r.createdAt, monthVal));
    const done = periodReqs.filter(r => isCompleted(r.status));
    if (!done.length) return 0;
    const efficientCount = done.filter(r => {
      const planKey = Object.keys(plans).find(k => k.startsWith(String(r.id) + '-'));
      const plan = plans[planKey || ''];
      const targetDays = plan ? Number(plan.numberOfDays) + 2 : 12;
      const actualDays = Math.round((new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()) / 86400000);
      return actualDays <= targetDays;
    }).length;
    return Number(((efficientCount / done.length) * 100).toFixed(1));
  };

  const getCompletedPassedForPeriod = (monthVal: string) => {
    const periodReqs = requests.filter(r => matchesFilter(r.createdAt, monthVal));
    return periodReqs.filter(r =>
      ['completed', 'testing_passed', 'testing_partial', 'pass'].includes(getSafeStatusText(r.status))
    ).length;
  };

  const getFailedForPeriod = (monthVal: string) => {
    const periodReqs = requests.filter(r => matchesFilter(r.createdAt, monthVal));
    return periodReqs.filter(r => isFailed(r.status)).length;
  };

  const getSuccessRateForPeriod = (monthVal: string) => {
    const periodReqs = requests.filter(r => matchesFilter(r.createdAt, monthVal));
    const passedCount = periodReqs.filter(r =>
      ['completed', 'testing_passed', 'testing_partial', 'pass'].includes(getSafeStatusText(r.status))
    ).length;
    const failedCount = periodReqs.filter(r =>
      isFailed(r.status)
    ).length;
    const totalConcluded = passedCount + failedCount;
    if (totalConcluded === 0) return 0;
    return Number(((passedCount / totalConcluded) * 100).toFixed(1));
  };

  const currentEfficiency = getEfficiencyForPeriod(selectedMonth);
  const prevEfficiency = getEfficiencyForPeriod(previousMonthStr);
  const efficiencyTrend = Number((currentEfficiency - prevEfficiency).toFixed(1));

  const currentCompletedPassed = getCompletedPassedForPeriod(selectedMonth);
  const currentFailed = getFailedForPeriod(selectedMonth);
  const prevCompletedPassed = getCompletedPassedForPeriod(previousMonthStr);
  const prevFailed = getFailedForPeriod(previousMonthStr);

  const completedPassedTrend = currentCompletedPassed - prevCompletedPassed;
  const failedTrend = currentFailed - prevFailed;

  const currentSuccessRate = getSuccessRateForPeriod(selectedMonth);
  const prevSuccessRate = getSuccessRateForPeriod(previousMonthStr);
  const successRateTrend = Number((currentSuccessRate - prevSuccessRate).toFixed(1));

  const currentResourceUtilization = (() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const totalDaysInMonth = new Date(y, m, 0).getDate();
    const monthStart = new Date(y, m - 1, 1, 0, 0, 0);
    const monthEnd = new Date(y, m - 1, totalDaysInMonth, 23, 59, 59);

    const activePlans = Object.values(plans).filter((p: any) => {
      const planStart = new Date(p.startDate || Date.now());
      const planEnd = new Date(p.endDate || Date.now());
      const overlaps = planStart <= monthEnd && planEnd >= monthStart;
      return overlaps && !(p.evaluationStatus === 'PASSED' || p.evaluationStatus === 'FAILED');
    });
    const occupiedPlatforms = activePlans.reduce((sum: number, p: any) => sum + (p.platformNos?.length || 0), 0);
    // NABL is 1 station * 10 platforms = 10 slots. Standard is 14 stations * 10 platforms = 140 slots.
    const capacity = isNablSelected ? 10 : 140;
    const platformUtil = (occupiedPlatforms / capacity) * 100;
    const eqUsed = activePlans.filter((p: any) => p.equipmentId).map((p: any) => String(p.equipmentId));
    const uniqueEqUsed = new Set(eqUsed).size;
    const eqUtil = equipment.length > 0 ? (uniqueEqUsed / equipment.length) * 100 : 0;
    const util = ((platformUtil + eqUtil) / 2) || 0;
    return Number(Math.min(100, util).toFixed(1));
  })();





  const now = new Date();

  const selectedYear = selectedMonth
    ? Number(selectedMonth.split('-')[0])
    : now.getFullYear();

  const fullYearMonths = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(selectedYear, i, 1);

    return {
      label: MONTHS[i],
      y: d.getFullYear(),
      m: d.getMonth(),
    };
  });

  const matchMonth = (dateStr: string, y: number, m: number) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getFullYear() === y && d.getMonth() === m;
  };

  const getRequestReferenceKeys = (request: any) => {
    const keys = [
      request?.id,
      request?.requestId,
      request?.sampleRequestId,
      request?.requestNo,
      request?.testRequestId,
      request?.id ? `REQ-${request.id}` : '',
    ];

    return keys
      .filter((key) => key !== null && key !== undefined && key !== '')
      .map((key) => String(key).trim().toLowerCase());
  };

  const getCapaRequestReference = (capa: any) => {
    const ref =
      capa?.relatedRequest ||
      capa?.testRequestId ||
      capa?.requestId ||
      capa?.requestNo ||
      capa?.testRequest?.requestId ||
      capa?.request?.requestId ||
      capa?.testRequest?.id ||
      capa?.request?.id ||
      '';

    if (typeof ref === 'object') {
      return String(ref.requestId || ref.id || ref.name || '').trim().toLowerCase();
    }

    return String(ref).trim().toLowerCase();
  };

  const monthlyReqs = fullYearMonths.map((mo) => {
    const monthRequests = requests.filter((r) => matchMonth(r.createdAt, mo.y, mo.m));
    const completed = monthRequests.filter((r) => isCompleted(r.status)).length;
    const notCompleted = Math.max(0, monthRequests.length - completed);

    return {
      label: mo.label,
      value: monthRequests.length,
      completed,
      notCompleted,
    };
  });

  const monthlyFailed = fullYearMonths.map((mo) => {
    const failedRequests = requests.filter((r) =>
      isFailed(r.status) && matchMonth(r.createdAt, mo.y, mo.m)
    );

    const failedRequestKeys = new Set(
      failedRequests.flatMap((request) => getRequestReferenceKeys(request))
    );

    const capaSubmitted = capas.filter((capa) => {
      const capaRef = getCapaRequestReference(capa);
      return (
        capaRef &&
        failedRequestKeys.has(capaRef) &&
        matchMonth(capa.createdAt, mo.y, mo.m)
      );
    }).length;

    const cappedCapaSubmitted = Math.min(failedRequests.length, capaSubmitted);
    const withoutCapa = Math.max(0, failedRequests.length - cappedCapaSubmitted);

    return {
      label: mo.label,
      value: failedRequests.length,
      capaSubmitted: cappedCapaSubmitted,
      withoutCapa,
    };
  });

  const monthlyCapa = fullYearMonths.map((mo) => {
    const monthCapas = capas.filter((c) => matchMonth(c.createdAt, mo.y, mo.m));
    const open = monthCapas.filter((c) => capaOpenStatuses.includes(getSafeStatusText(c.status))).length;
    const closed = monthCapas.filter((c) => capaClosedStatuses.includes(getSafeStatusText(c.status))).length;
    const other = Math.max(0, monthCapas.length - open - closed);

    return {
      label: mo.label,
      value: monthCapas.length,
      open,
      closed,
      other,
    };
  });

  const statusSegs = [
    { label: 'Pending Approval', value: countPendingApproval, color: '#f59e0b' },
    { label: 'Under Inspection', value: countUnderInspection, color: '#8b5cf6' },
    { label: 'Inspection Failed', value: countInspectionFailed, color: '#ef4444' },
    { label: 'Under Testing', value: countUnderTesting, color: '#3b82f6' },
    { label: 'Completed', value: countCompleted, color: '#15803d' },
    { label: 'Rejected', value: countRejected, color: '#64748b' },
    { label: 'Retest', value: countRetest, color: '#0ea5e9' },
    { label: 'Failed', value: countFailed, color: '#b91c1c' },
  ];

  const capaSegs = [
    { label: 'Open', value: capaOpen, color: '#f59e0b' },
    { label: 'Closed', value: capaClosed, color: '#10b981' },
  ];

  const eqSegs = [
    { label: 'Available', value: eqAvail, color: '#10b981' },
    { label: 'Occupied', value: eqOccupied, color: '#6366f1' },
    { label: 'Maintenance', value: eqMaint, color: '#f59e0b' },
  ];

  const stSegs = [
    { label: 'Available', value: stAvail, color: '#10b981' },
    { label: 'Occupied', value: stOccupied, color: '#e11d48' },
  ];

  const getRequestDetailsByStatus = (label: string) => {
    const statusMap: Record<string, string[]> = {
      'Pending Approval': ['pending_approval'],
      'Under Inspection': ['under_inspection', 'inspection_completed'],
      'Inspection Failed': ['inspection_failed'],
      'Under Testing': ['under_testing', 'under_test', 'testing_completed'],
      'Completed': ['completed', 'testing_passed', 'testing_partial'],
      'Rejected': ['rejected'],
      'Retest': ['retest', 'restest'],
      'Failed': ['failed', 'fail', 'testing_failed'],
    };

    const allowedStatuses = statusMap[label] || [];

    const data = periodRequests.filter((r) =>
      allowedStatuses.includes(getSafeStatusText(r.status))
    );

    setDetailModal({
      open: true,
      title: `Test Request Status - ${label}`,
      type: 'request',
      label,
      data,
    });
  };

  const getCapaDetailsByStatus = (label: string) => {
    const allowedStatuses =
      label === 'Open'
        ? capaOpenStatuses
        : capaClosedStatuses;

    const data = periodCapas.filter((c) =>
      allowedStatuses.includes(getSafeStatusText(c.status))
    );

    setDetailModal({
      open: true,
      title: `CAPA Status - ${label}`,
      type: 'capa',
      label,
      data,
    });
  };

  const getEquipmentDetailsByStatus = (label: string) => {
    let data: any[] = [];

    if (label === 'Available') {
      data = equipment.filter(
        (e) =>
          e.isAvailable === true &&
          !['maintenance', 'under_maintenance'].includes(getSafeStatusText(e.status))
      );
    }

    if (label === 'Occupied') {
      data = equipment
        .filter((e) => e.isAvailable === false)
        .map((eq) => {
          const relatedPlans = Object.entries(plans)
            .filter(([_, plan]: [string, any]) => String(plan.equipmentId) === String(eq.id))
            .map(([key, plan]: [string, any]) => {
              const [reqIdStr] = key.split('-sample-');
              const request = requests.find((r) => String(r.id) === String(reqIdStr));

              return {
                key,
                plan,
                request,
              };
            })
            .filter((item) => item.request);

          return {
            ...eq,
            relatedPlans,
          };
        });
    }

    if (label === 'Maintenance') {
      data = equipment.filter((e) =>
        ['maintenance', 'under_maintenance'].includes(getSafeStatusText(e.status))
      );
    }

    setDetailModal({
      open: true,
      title: `Equipment Availability - ${label}`,
      type: 'equipment',
      label,
      data,
    });
  };

  const getStationDetailsByStatus = (label: string) => {
    let data: any[] = [];

    if (label === 'Available') {
      data = platforms.filter((p) => p.isAvailable === true);
    }

    if (label === 'Occupied') {
      data = platforms
        .filter((p) => p.isAvailable === false)
        .map((platform) => {
          const relatedPlans = Object.entries(plans)
            .filter(([_, plan]: [string, any]) => {
              const stationMatch = String(plan.stationNo) === String(platform.stationNo || platform.station || platform.name);
              const platformMatch = Array.isArray(plan.platformNos)
                ? plan.platformNos.map(String).includes(String(platform.platformNo || platform.no || platform.id))
                : false;

              return stationMatch || platformMatch;
            })
            .map(([key, plan]: [string, any]) => {
              const [reqIdStr] = key.split('-sample-');
              const request = requests.find((r) => String(r.id) === String(reqIdStr));

              return {
                key,
                plan,
                request,
              };
            })
            .filter((item) => item.request);

          return {
            ...platform,
            relatedPlans,
          };
        });
    }

    setDetailModal({
      open: true,
      title: `Station Occupancy - ${label}`,
      type: 'station',
      label,
      data,
    });
  };

  const displayValue = (value: any, fallback = '-') => {
    if (value === null || value === undefined || value === '') return fallback;

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (typeof value === 'object') {
      return (
        value.name ||
        value.title ||
        value.requestId ||
        value.capaId ||
        value.status ||
        value.type ||
        value.id ||
        fallback
      );
    }

    return fallback;
  };

  const displayDate = (value: any) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <DashboardLayout title="Executive Dashboard" description="Loading Dashboard Stats..." bare={bare}>
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-700 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-550 text-xs font-semibold">Synchronizing Executive LIMS Analytics...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="" description="" bare={bare}>
      {/* Custom Header Section exactly matching the screenshot style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight" style={{ fontFamily: "Outfit, Inter, sans-serif" }}>
            Executive Dashboard
          </h1>
          <p className="text-sm font-semibold text-zinc-500 mt-1">{formattedDate}</p>
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-3">
          {/* Test Type selector */}
          <CustomSelect
            value={selectedTestType}
            onChange={setSelectedTestType}
            options={testTypeOptions}
            placeholder="All Test Types"
            className="w-40"
          />

          {/* Month selector */}
          <div className="relative">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white border border-zinc-200/80 rounded-xl px-4 py-2 text-xs font-bold text-zinc-700 shadow-sm focus:outline-none focus:border-indigo-500 cursor-pointer hover:border-zinc-300 transition-colors h-[42px]"
            />
          </div>

          <button onClick={load} className="w-9 h-9 rounded-xl bg-white border border-zinc-200/80 flex items-center justify-center text-zinc-500 hover:text-indigo-600 shadow-sm transition-all cursor-pointer">
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-8">

        {/* KPI Cards Row with Live Computed Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Card 1: OVERALL LAB EFFICIENCY */}
          <div className="bg-white border border-zinc-250/30 rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between min-h-[120px] transition-all hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)]">
            <span className="text-[10px] tracking-wider text-zinc-400 font-extrabold uppercase">Overall Lab Efficiency</span>
            <div className="flex items-end justify-between mt-3">
              <span className="text-3xl font-extrabold text-zinc-900 leading-none">{currentEfficiency}%</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${efficiencyTrend >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
                }`}>
                {efficiencyTrend >= 0 ? `+${efficiencyTrend}%` : `${efficiencyTrend}%`}
              </span>
            </div>
          </div>

          {/* Card 2: TESTS COMPLETED / FAILED */}
          <div className="bg-white border border-zinc-250/30 rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between min-h-[120px] transition-all hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)]">
            <span className="text-[10px] tracking-wider text-zinc-400 font-extrabold uppercase">Tests Completed / Failed</span>
            <div className="flex items-end justify-between mt-3">
              <span className="text-2xl font-extrabold text-zinc-900 leading-none">
                {currentCompletedPassed} <span className="text-zinc-350 text-lg font-medium">/</span> <span className="text-zinc-500">{currentFailed}</span>
              </span>
              <div className="flex flex-col items-end gap-1">
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${completedPassedTrend >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                  Passed: {completedPassedTrend >= 0 ? `+${completedPassedTrend}` : completedPassedTrend}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${failedTrend >= 0 ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50'}`}>
                  Failed: {failedTrend >= 0 ? `+${failedTrend}` : failedTrend}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: SUCCESS RATE */}
          <div className="bg-white border border-zinc-250/30 rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between min-h-[120px] transition-all hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)]">
            <span className="text-[10px] tracking-wider text-zinc-400 font-extrabold uppercase">Success Rate</span>
            <div className="flex items-end justify-between mt-3">
              <span className="text-3xl font-extrabold text-zinc-900 leading-none">{currentSuccessRate}%</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${successRateTrend >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
                }`}>
                {successRateTrend >= 0 ? `+${successRateTrend}%` : `${successRateTrend}%`}
              </span>
            </div>
          </div>

          {/* Card 4: RESOURCE UTILIZATION */}
          <div className="bg-white border border-zinc-250/30 rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between min-h-[120px] transition-all hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)]">
            <span className="text-[10px] tracking-wider text-zinc-400 font-extrabold uppercase">Resource Utilization</span>
            <div className="flex items-end justify-between mt-3">
              <span className="text-3xl font-extrabold text-zinc-900 leading-none">{currentResourceUtilization}%</span>
              <span className="text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5 text-[10px] font-bold">Active</span>
            </div>
          </div>

        </div>

        {/* Row 1 Charts: Platform Availability & Machine Utilization (using live calculated data) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Platform Availability Card */}
          <div className="bg-white border border-zinc-200/50 rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-2.5">
                <Monitor className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-zinc-900">Platform Availability</h3>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Station Filter */}
                <CustomSelect
                  value={selectedStation}
                  onChange={setSelectedStation}
                  options={dynamicStationOptions}
                  placeholder="All Stations"
                  className="w-32"
                />

                {/* Platform Filter */}
                <CustomSelect
                  value={selectedPlatform}
                  onChange={setSelectedPlatform}
                  options={platformOptions}
                  placeholder="All Platforms"
                  className="w-32"
                />

                <div className="flex items-center gap-3 text-[10px] font-extrabold ml-2 border-l border-zinc-200 pl-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#cbd5e1]" />
                    Available Time
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
                    Occupied Time
                  </span>
                </div>
              </div>
            </div>

            <StackedBarChart data={platformAvailData} />
          </div>

          {/* Machine Utilization Card */}
          <div className="bg-white border border-zinc-200/50 rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-zinc-900">Machine Utilization</h3>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Equipment Filter */}
                <CustomSelect
                  value={selectedEquipment}
                  onChange={setSelectedEquipment}
                  options={equipmentOptions}
                  placeholder="All Equipments"
                  className="w-48"
                />

                <div className="flex items-center gap-3 text-[10px] font-extrabold ml-2 border-l border-zinc-200 pl-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#cbd5e1]" />
                    Allocated Time
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" />
                    Actual Runtime
                  </span>
                </div>
              </div>
            </div>

            <MachineUtilizationChart data={machineUtilData} />
          </div>

        </div>

        {/* Row 2: Status Donuts (Original Data Modules) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card title="Test Request Status">
            <div className="flex flex-col gap-4">
              <div className="flex justify-center">
                <Donut segments={statusSegs} size={140} onSegmentClick={getRequestDetailsByStatus} />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-zinc-100 pt-3">
                {statusSegs.map(s => <Legend key={s.label} color={s.color} label={s.label} value={s.value} />)}
              </div>
              {!statusSegs.length && <p className="text-xs text-zinc-400 text-center">No data</p>}
            </div>
          </Card>

          <Card title="CAPA Status Breakdown">
            <div className="flex flex-col gap-4">
              <div className="flex justify-center">
                <Donut
                  segments={capaSegs}
                  size={140}
                  onSegmentClick={getCapaDetailsByStatus}
                />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-zinc-100 pt-3">
                {capaSegs.map(s => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => getCapaDetailsByStatus(s.label)}
                    className="text-left"
                  >
                    <Legend color={s.color} label={s.label} value={s.value} />
                  </button>
                ))}
              </div>
              {!capaSegs.length && <p className="text-xs text-zinc-400 text-center">No CAPAs</p>}
              <div className="mt-1 text-[10px] text-zinc-500 border-t border-zinc-100 pt-1 font-bold text-center">Total: {capaTotal}</div>
            </div>
          </Card>

          <Card title="Equipment Availability">
            <div className="flex flex-col gap-4">
              <div className="flex justify-center">
                <Donut segments={eqSegs} size={140} onSegmentClick={getEquipmentDetailsByStatus} />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-zinc-100 pt-3">
                {eqSegs.map(s => <Legend key={s.label} color={s.color} label={s.label} value={s.value} />)}
              </div>
              {!eqSegs.length && <p className="text-xs text-zinc-400 text-center">No equipment</p>}
              <div className="mt-1 text-[10px] text-zinc-500 border-t border-zinc-100 pt-1 font-bold text-center">Total: {eqTotal}</div>
            </div>
          </Card>

          <Card title="Station Occupancy">
            <div className="flex flex-col gap-4">
              <div className="flex justify-center">
                <Donut segments={stSegs} size={140} onSegmentClick={getStationDetailsByStatus} />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-zinc-100 pt-3">
                {stSegs.map(s => <Legend key={s.label} color={s.color} label={s.label} value={s.value} />)}
              </div>
              {!stSegs.length && <p className="text-xs text-zinc-400 text-center">No platforms</p>}
              <div className="mt-1 text-[10px] text-zinc-500 border-t border-zinc-100 pt-1 font-bold text-center">Total slots: {stTotal}</div>
            </div>
          </Card>
        </div>

        {/* Row 3: Monthly bar charts - Full Year Timeline */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <ChartCard title="Monthly Sample Requests">
            <BarChart
              data={monthlyReqs}
              color="#11236a"
              tooltipTitle="Sample Requests"
              breakdown={[
                { key: 'completed', label: 'Completed', color: '#15803d' },
                { key: 'notCompleted', label: 'Not completed', color: '#11236a' },
              ]}
            />
            <p className="text-xs text-zinc-500 font-semibold mt-3">
              Total requests this year: {monthlyReqs.reduce((sum, item) => sum + item.value, 0)}
            </p>
          </ChartCard>

          <ChartCard title="Monthly Failure Trend">
            <BarChart
              data={monthlyFailed}
              color="#e11d48"
              tooltipTitle="Failure Trend"
              breakdown={[
                { key: 'capaSubmitted', label: 'CAPA submitted', color: '#8b5cf6' },
                { key: 'withoutCapa', label: 'Without CAPA', color: '#e11d48' },
              ]}
            />
            <p className="text-xs text-zinc-500 font-semibold mt-3">
              Total failed / retest this year: {monthlyFailed.reduce((sum, item) => sum + item.value, 0)}
            </p>
          </ChartCard>

          <ChartCard title="Monthly CAPA Submissions">
            <BarChart
              data={monthlyCapa}
              color="#f59e0b"
              tooltipTitle="CAPA Submissions"
              breakdown={[
                { key: 'closed', label: 'Closed', color: '#10b981' },
                { key: 'open', label: 'Open', color: '#f59e0b' },
                { key: 'other', label: 'Other', color: '#64748b' },
              ]}
            />
            <p className="text-xs text-zinc-500 font-semibold mt-3">
              Total CAPAs this year: {monthlyCapa.reduce((sum, item) => sum + item.value, 0)}
            </p>
          </ChartCard>
        </div>


      </div>

      {detailModal.open && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden border border-zinc-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <div>
                <h2 className="text-lg font-extrabold text-zinc-900">{detailModal.title}</h2>
                <p className="text-xs text-zinc-500 font-semibold mt-0.5">
                  Total Records: {detailModal.data.length}
                </p>
              </div>

              <button
                onClick={() =>
                  setDetailModal({
                    open: false,
                    title: '',
                    type: '',
                    label: '',
                    data: [],
                  })
                }
                className="w-9 h-9 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-black"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {detailModal.data.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-zinc-200 rounded-xl">
                  <p className="text-sm font-bold text-zinc-500">No details found for this section.</p>
                </div>
              ) : (
                <>
                  {detailModal.type === 'request' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-100 text-zinc-400 uppercase text-[10px] font-extrabold">
                            <th className="pb-3 pr-3">Request ID</th>
                            <th className="pb-3 px-3">Brand / Model</th>
                            <th className="pb-3 px-3">Test Type</th>
                            <th className="pb-3 px-3">Status</th>
                            <th className="pb-3 px-3">Created By</th>
                            <th className="pb-3 pl-3">Created Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                          {detailModal.data.map((r) => (
                            <tr key={r.id} className="hover:bg-zinc-50">
                              <td className="py-3 pr-3 font-black text-indigo-700">
                                {r.requestId || `REQ-${r.id}`}
                              </td>
                              <td className="py-3 px-3 font-bold text-zinc-900">
                                {r.brandName || '-'} {r.modelNo ? `- ${r.modelNo}` : ''}
                              </td>
                              <td className="py-3 px-3">
                                {displayValue(r.testType || r.type)}
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold uppercase text-[10px]">
                                  {displayValue(r.status)}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                {displayValue(r.createdBy || r.requester || r.user)}
                              </td>
                              <td className="py-3 pl-3">
                                {displayDate(r.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {detailModal.type === 'capa' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-100 text-zinc-400 uppercase text-[10px] font-extrabold">
                            <th className="pb-3 pr-3">CAPA ID</th>
                            <th className="pb-3 px-3">CAPA Title</th>
                            <th className="pb-3 px-3">Status</th>
                            <th className="pb-3 px-3">Belongs To</th>
                            <th className="pb-3 px-3">Request</th>
                            <th className="pb-3 px-3">Test Type</th>
                            <th className="pb-3 pl-3">Created Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                          {detailModal.data.map((c) => (
                            <tr key={c.id} className="hover:bg-zinc-50">
                              <td className="py-3 pr-3 font-black text-indigo-700">
                                {displayValue(c.capaId || c.id)}
                              </td>

                              <td className="py-3 px-3 font-bold text-zinc-900">
                                {displayValue(c.title || c.problem || c.nonConformity)}
                              </td>

                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold uppercase text-[10px]">
                                  {displayValue(c.status)}
                                </span>
                              </td>

                              <td className="py-3 px-3">
                                {displayValue(c.owner || c.submittedBy || c.submittedById)}
                              </td>

                              <td className="py-3 px-3">
                                {displayValue(c.relatedRequest)}
                              </td>

                              <td className="py-3 px-3">
                                {displayValue(c.productName || c.partProduct || c.improvementType)}
                              </td>

                              <td className="py-3 pl-3">
                                {displayDate(c.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {detailModal.type === 'equipment' && (
                    <div className="space-y-4">
                      {detailModal.data.map((eq) => (
                        <div key={eq.id} className="border border-zinc-100 rounded-2xl p-4 bg-zinc-50/50">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-extrabold text-zinc-900">
                                {displayValue(eq.name || eq.equipmentName || `Equipment ${eq.id}`)}
                              </h3>
                              <p className="text-xs text-zinc-500 font-semibold">
                                Status: {displayValue(eq.status || (eq.isAvailable ? 'Available' : 'Occupied'))}
                              </p>
                            </div>

                            <span className={`px-2 py-1 rounded-full text-[10px] font-extrabold uppercase ${eq.isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'
                              }`}>
                              {eq.isAvailable ? 'Available' : 'Occupied'}
                            </span>
                          </div>

                          {detailModal.label === 'Occupied' && (
                            <div className="mt-4">
                              <p className="text-[11px] font-extrabold text-zinc-500 mb-2">
                                Running Request Details
                              </p>

                              {eq.relatedPlans?.length ? (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="text-left text-[10px] uppercase text-zinc-400 border-b border-zinc-200">
                                        <th className="pb-2">Request</th>
                                        <th className="pb-2">Brand / Model</th>
                                        <th className="pb-2">Test Type</th>
                                        <th className="pb-2">Station</th>
                                        <th className="pb-2">Allocated Days</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {eq.relatedPlans.map((item: any) => (
                                        <tr key={item.key} className="border-b border-zinc-100">
                                          <td className="py-2 font-bold text-indigo-700">
                                            {item.request?.requestId || `REQ-${item.request?.id}`}
                                          </td>
                                          <td className="py-2">
                                            {item.request?.brandName || '-'} {item.request?.modelNo ? `- ${item.request.modelNo}` : ''}
                                          </td>
                                          <td className="py-2">
                                            {displayValue(item.request?.testType || item.plan?.productType)}
                                          </td>
                                          <td className="py-2">
                                            Station {item.plan?.stationNo || '-'}
                                          </td>
                                          <td className="py-2">
                                            {item.plan?.numberOfDays || '-'} Days
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-xs text-zinc-400 font-semibold">
                                  No linked active request found for this equipment.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {detailModal.type === 'station' && (
                    <div className="space-y-4">
                      {detailModal.data.map((station) => (
                        <div key={station.id} className="border border-zinc-100 rounded-2xl p-4 bg-zinc-50/50">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-extrabold text-zinc-900">
                                {displayValue(station.name || `Station ${displayValue(station.stationNo || station.station || station.id)}`)}
                              </h3>
                              <p className="text-xs text-zinc-500 font-semibold">
                                Platform: {displayValue(station.platformNo || station.no || station.id)}
                              </p>
                            </div>

                            <span className={`px-2 py-1 rounded-full text-[10px] font-extrabold uppercase ${station.isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                              {station.isAvailable ? 'Free' : 'Busy'}
                            </span>
                          </div>

                          {detailModal.label === 'Occupied' && (
                            <div className="mt-4">
                              <p className="text-[11px] font-extrabold text-zinc-500 mb-2">
                                Busy Request Details
                              </p>

                              {station.relatedPlans?.length ? (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="text-left text-[10px] uppercase text-zinc-400 border-b border-zinc-200">
                                        <th className="pb-2">Request</th>
                                        <th className="pb-2">Brand / Model</th>
                                        <th className="pb-2">Test Type</th>
                                        <th className="pb-2">Station</th>
                                        <th className="pb-2">Platforms</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {station.relatedPlans.map((item: any) => (
                                        <tr key={item.key} className="border-b border-zinc-100">
                                          <td className="py-2 font-bold text-indigo-700">
                                            {item.request?.requestId || `REQ-${item.request?.id}`}
                                          </td>
                                          <td className="py-2">
                                            {item.request?.brandName || '-'} {item.request?.modelNo ? `- ${item.request.modelNo}` : ''}
                                          </td>
                                          <td className="py-2">
                                            {displayValue(item.request?.testType || item.plan?.productType)}
                                          </td>
                                          <td className="py-2">
                                            Station {item.plan?.stationNo || '-'}
                                          </td>
                                          <td className="py-2">
                                            {item.plan?.platformNos?.map((p: number) => `P${item.plan.stationNo}-S${p}`).join(', ') || '-'}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-xs text-zinc-400 font-semibold">
                                  No linked active request found for this station.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
