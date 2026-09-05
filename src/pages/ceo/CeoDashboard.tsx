import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../layouts/DashboardLayout';
import { apiConnector } from '../../services/apiConnector';
import { getCapas } from '../../services/operations/capaService';
import { getTestingEquipments } from '../../services/operations/testingEquipmentService';
import { getPlatforms } from '../../services/operations/platformAvailabilityService';
import { getTestTypes } from '../../services/operations/testTypeService';
import { getNablRequests } from '../../services/operations/nablRequestService';
import CustomSelect from '../../components/CustomSelect';
import {
  RotateCw,
  Monitor,
  Clock,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Award,
  Briefcase,
  Layers,
  ChevronLeft,
  ChevronRight,
  Info
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
  if (typeof status === 'string') return status.trim().toLowerCase();
  if (typeof status === 'object') return String(status.name || status.status || status.title || '').trim().toLowerCase();
  return String(status).trim().toLowerCase();
};

const isFailedStatus = (s: any) => {
  const status = getSafeStatusText(s);
  return ['failed', 'fail', 'inspection_failed', 'testing_failed'].includes(status);
};

const isCompletedStatus = (s: any) => [
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

const isEndDatePassed = (req: any) => {
  if (!req.testPlan?.endDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(req.testPlan.endDate);
  end.setHours(23, 59, 59, 999);
  return today > end;
};

const getNablCategory = (req: any) => {
  if (!req.testPlan?.startDate) return 'REQUEST_GENERATED';
  if (!isEndDatePassed(req)) return 'UNDER_TESTING';
  const planEval = (req.testPlan?.status || req.status || '').toUpperCase();
  if (['FAILED', 'FAIL'].includes(planEval)) return 'FAILED';
  return 'COMPLETED_PASS';
};

function ShadcnDualMonthCalendar({
  startDate,
  endDate,
  onRangeSelect,
}: {
  startDate: string;
  endDate: string;
  onRangeSelect: (start: string, end: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (startDate) return new Date(startDate);
    return new Date();
  });

  const [selectFrom, setSelectFrom] = useState<Date | null>(startDate ? new Date(startDate) : null);
  const [selectTo, setSelectTo] = useState<Date | null>(endDate ? new Date(endDate) : null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectFrom(startDate ? new Date(startDate) : null);
    setSelectTo(endDate ? new Date(endDate) : null);
  }, [startDate, endDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const month1 = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const month2 = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDayClick = (d: Date) => {
    if (!selectFrom || (selectFrom && selectTo)) {
      setSelectFrom(d);
      setSelectTo(null);
    } else {
      let from = selectFrom;
      let to = d;
      if (to < from) {
        const temp = from;
        from = to;
        to = temp;
      }
      setSelectFrom(from);
      setSelectTo(to);
      const fromStr = from.toISOString().split('T')[0];
      const toStr = to.toISOString().split('T')[0];
      onRangeSelect(fromStr, toStr);
      setIsOpen(false);
    }
  };

  const renderMonthGrid = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const prevDaysInMonth = new Date(year, month, 0).getDate();
    const prevPadding = Array.from({ length: firstDayIndex }, (_, i) => {
      const dayNum = prevDaysInMonth - firstDayIndex + i + 1;
      return { dayNum, isCurrentMonth: false, date: new Date(year, month - 1, dayNum) };
    });

    const currentDays = Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      return { dayNum, isCurrentMonth: true, date: new Date(year, month, dayNum) };
    });

    const totalCells = Math.ceil((prevPadding.length + currentDays.length) / 7) * 7;
    const nextPaddingCount = totalCells - (prevPadding.length + currentDays.length);
    const nextPadding = Array.from({ length: nextPaddingCount }, (_, i) => {
      const dayNum = i + 1;
      return { dayNum, isCurrentMonth: false, date: new Date(year, month + 1, dayNum) };
    });

    const allCells = [...prevPadding, ...currentDays, ...nextPadding];

    return (
      <div className="flex-1">
        <div className="text-center font-extrabold text-sm mb-3 text-white">
          {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-400 font-bold mb-2">
          <span>Su</span>
          <span>Mo</span>
          <span>Tu</span>
          <span>We</span>
          <span>Th</span>
          <span>Fr</span>
          <span>Sa</span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {allCells.map((cell, idx) => {
            const cellDate = new Date(cell.date);
            cellDate.setHours(0, 0, 0, 0);

            const fromDate = selectFrom ? new Date(selectFrom) : null;
            if (fromDate) fromDate.setHours(0, 0, 0, 0);

            const toDate = selectTo ? new Date(selectTo) : null;
            if (toDate) toDate.setHours(0, 0, 0, 0);

            const isFrom = fromDate && cellDate.getTime() === fromDate.getTime();
            const isTo = toDate && cellDate.getTime() === toDate.getTime();
            const isInRange = fromDate && toDate && cellDate > fromDate && cellDate < toDate;

            let bgClasses = "hover:bg-zinc-800 text-zinc-300";
            if (!cell.isCurrentMonth) {
              bgClasses = "text-zinc-600 opacity-40 hover:bg-zinc-800/50";
            }

            if (isFrom || isTo) {
              bgClasses = "bg-white text-zinc-950 font-black rounded-lg shadow-md";
            } else if (isInRange) {
              bgClasses = "bg-zinc-800/80 text-white font-bold rounded-none";
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleDayClick(cell.date)}
                className={`h-9 w-9 flex items-center justify-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${bgClasses}`}
              >
                {cell.dayNum}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return 'dd - mm - yyyy';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dateStr;
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-white/10 px-5 py-2.5 rounded-full border border-white/20 shadow-inner hover:bg-white/15 transition-all cursor-pointer"
      >
        <Calendar className="w-5 h-5 text-indigo-300 shrink-0" />
        <span className="text-sm font-extrabold text-white tracking-wider">
          {formatDateDisplay(startDate)}
        </span>
        <Calendar className="w-4 h-4 text-indigo-300 shrink-0 opacity-70" />
        <span className="text-indigo-300 font-extrabold text-sm px-1">to</span>
        <span className="text-sm font-extrabold text-white tracking-wider">
          {formatDateDisplay(endDate)}
        </span>
        <Calendar className="w-4 h-4 text-indigo-300 shrink-0 opacity-70" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-3 z-[9999] bg-[#121214] text-white p-5 rounded-3xl shadow-2xl border border-zinc-800/80 min-w-[580px] animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-800/80 pb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider">
              Select Custom Date Range
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-6">
            {renderMonthGrid(month1)}
            <div className="w-[1px] bg-zinc-800/80 my-2" />
            {renderMonthGrid(month2)}
          </div>
          <div className="flex items-center justify-between border-t border-zinc-800/80 pt-3 mt-4 text-xs">
            <button
              type="button"
              onClick={() => {
                onRangeSelect('', '');
                setIsOpen(false);
              }}
              className="text-zinc-400 hover:text-rose-400 font-bold cursor-pointer transition-colors"
            >
              Clear Filter
            </button>

            <span className="text-[11px] text-zinc-500 font-semibold">
              {selectFrom ? selectFrom.toLocaleDateString() : 'Select start date'}{' '}
              {selectTo ? `— ${selectTo.toLocaleDateString()}` : ''}
            </span>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-3 py-1.5 rounded-lg cursor-pointer transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoTooltip({ title, text }: { title: string; text: string }) {
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  return (
    <span className="relative inline-flex items-center ml-1.5">
      <button
        type="button"
        onMouseEnter={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setPos({ x: rect.left + rect.width / 2, y: rect.top });
          setHovered(true);
        }}
        onMouseLeave={() => setHovered(false)}
        className="text-zinc-400 hover:text-indigo-600 transition-colors p-0.5 rounded-full cursor-pointer focus:outline-none"
      >
        <Info className="w-4.5 h-4.5" />
      </button>
      {hovered && (
        <div
          className="fixed z-[9999] bg-zinc-950 text-white p-4 rounded-2xl shadow-2xl pointer-events-none text-sm transform -translate-x-1/2 -translate-y-full mb-2 w-80 border border-zinc-800 leading-relaxed"
          style={{ left: pos.x, top: pos.y }}
        >
          <div className="font-extrabold text-[15px] text-indigo-400 mb-1.5 flex items-center gap-1.5">
            <Info className="w-4.5 h-4.5 shrink-0" />
            {title}
          </div>
          <div className="text-[13px] text-zinc-300 font-medium">{text}</div>
        </div>
      )}
    </span>
  );
}

function Donut({
  segments,
  size = 140,
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
              onClick={() => onSegmentClick && onSegmentClick(seg.label)}
              className="transition-all duration-300 cursor-pointer origin-center hover:opacity-90"
            />
          );
          offset += pct;
          return el;
        })}
        <text
          x={cx}
          y={cy + 4.5}
          textAnchor="middle"
          fontSize="15"
          fontWeight="900"
          fill="#18181b"
          style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
        >
          {sum}
        </text>
      </svg>
      {hoveredSeg && (
        <div
          className="fixed z-[9999] bg-zinc-900 text-white text-[13px] font-semibold py-2 px-3.5 rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="font-bold text-sm flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: hoveredSeg.color }} />
            {hoveredSeg.label}
          </div>
          <div className="text-zinc-300 mt-0.5">
            {hoveredSeg.value} items ({((hoveredSeg.value / totalForDiv) * 100).toFixed(1)}%)
          </div>
        </div>
      )}
    </div>
  );
}

function getSmoothPath(pts: { x: number; y: number }[]) {
  if (!pts || !pts.length) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const curr = pts[i];
    const next = pts[i + 1];
    const cp1x = curr.x + (next.x - curr.x) / 2;
    const cp1y = curr.y;
    const cp2x = curr.x + (next.x - curr.x) / 2;
    const cp2y = next.y;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
  }
  return d;
}

function getAreaPath(pts: { x: number; y: number }[], height: number, paddingY: number) {
  if (!pts || !pts.length) return '';
  const curveD = getSmoothPath(pts);
  const last = pts[pts.length - 1];
  const first = pts[0];
  return `${curveD} L ${last.x} ${height - paddingY} L ${first.x} ${height - paddingY} Z`;
}

function DailyPlatformLineChart({ data }: { data: any[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (!data || !data.length) {
    return <div className="h-48 flex items-center justify-center text-sm text-zinc-400 font-semibold">No daily platform analytics in date range</div>;
  }

  const height = 180;
  const width = 680;
  const paddingX = 12;
  const paddingY = 24;

  const maxVal = 24; 
  const labelStep = Math.max(1, Math.ceil(data.length / 7));

  const pointsOccupied = data.map((d, i) => {
    const x = paddingX + (i / Math.max(data.length - 1, 1)) * (width - 2 * paddingX);
    const y = height - paddingY - (Math.min(24, d.occupiedHours || 0) / maxVal) * (height - 2 * paddingY);
    return { x, y, val: d.occupiedHours || 0, label: d.label };
  });

  const pointsAvailable = data.map((d, i) => {
    const x = paddingX + (i / Math.max(data.length - 1, 1)) * (width - 2 * paddingX);
    const y = height - paddingY - (Math.min(24, d.availableHours || 0) / maxVal) * (height - 2 * paddingY);
    return { x, y, val: d.availableHours || 0, label: d.label };
  });

  const pathOccupiedCurve = getSmoothPath(pointsOccupied);
  const pathOccupiedArea = getAreaPath(pointsOccupied, height, paddingY);

  const pathAvailableCurve = getSmoothPath(pointsAvailable);
  const pathAvailableArea = getAreaPath(pointsAvailable, height, paddingY);

  return (
    <div className="relative w-full" onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 overflow-visible">
        <defs>
          <linearGradient id="platformOccupiedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="platformAvailableGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {[0, 0.33, 0.66, 1].map((pct, idx) => {
          const y = height - paddingY - pct * (height - 2 * paddingY);
          return (
            <line key={idx} x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="4 4" />
          );
        })}

        <path d={pathAvailableArea} fill="url(#platformAvailableGrad)" />
        <path d={pathOccupiedArea} fill="url(#platformOccupiedGrad)" />

        <path d={pathAvailableCurve} fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={pathOccupiedCurve} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {pointsOccupied.map((p, i) => (
          <g key={i} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)} className="cursor-pointer">
            {hoveredIndex === i && (
              <line x1={p.x} y1={paddingY} x2={p.x} y2={height - paddingY} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
            )}
            <circle cx={p.x} cy={pointsAvailable[i].y} r={hoveredIndex === i ? 6 : 3.5} fill="#cbd5e1" stroke="#ffffff" strokeWidth="2" />
            <circle cx={p.x} cy={p.y} r={hoveredIndex === i ? 6.5 : 4} fill="#3b82f6" stroke="#ffffff" strokeWidth="2.5" />
            {(i % labelStep === 0 || i === data.length - 1) && (
              <text x={p.x} y={height - 4} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#64748b">
                {p.label}
              </text>
            )}
          </g>
        ))}
      </svg>

      {hoveredIndex !== null && data[hoveredIndex] && (
        <div
          className="fixed z-[9999] bg-zinc-950 text-white p-4 rounded-2xl shadow-2xl pointer-events-none text-sm transform -translate-x-1/2 -translate-y-full mb-2 min-w-[230px] border border-zinc-800"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="font-extrabold text-[15px] text-zinc-100 mb-1.5 border-b border-zinc-800 pb-1 flex items-center justify-between">
            <span>📅 {data[hoveredIndex].dateStr || data[hoveredIndex].label}</span>
            <span className="text-[12px] bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-full font-bold">Daily Analytics</span>
          </div>
          <div className="flex flex-col gap-1.5 text-[13px]">
            <div className="flex items-center gap-2 font-bold text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 shrink-0" />
              Total Daily Hours: <span className="text-white font-black ml-auto">24 hrs</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-[#cbd5e1] shrink-0" />
              Available Hours: <span className="text-white font-black ml-auto">{Math.round(data[hoveredIndex].availableHours || 0)} hrs</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] shrink-0" />
              Occupied Hours: <span className="text-blue-400 font-black ml-auto">{Math.round(data[hoveredIndex].occupiedHours || 0)} hrs</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DailyMachineLineChart({ data }: { data: any[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (!data || !data.length) {
    return <div className="h-48 flex items-center justify-center text-sm text-zinc-400 font-semibold">No daily equipment analytics in date range</div>;
  }

  const height = 180;
  const width = 680;
  const paddingX = 12;
  const paddingY = 24;

  const maxVal = 24; 
  const labelStep = Math.max(1, Math.ceil(data.length / 7));

  const pointsAllocated = data.map((d, i) => {
    const x = paddingX + (i / Math.max(data.length - 1, 1)) * (width - 2 * paddingX);
    const y = height - paddingY - (Math.min(24, d.allocated || 0) / maxVal) * (height - 2 * paddingY);
    return { x, y, val: d.allocated || 0, label: d.label };
  });

  const pointsActual = data.map((d, i) => {
    const x = paddingX + (i / Math.max(data.length - 1, 1)) * (width - 2 * paddingX);
    const y = height - paddingY - (Math.min(24, d.actual || 0) / maxVal) * (height - 2 * paddingY);
    return { x, y, val: d.actual || 0, label: d.label };
  });

  const pathAllocatedCurve = getSmoothPath(pointsAllocated);
  const pathAllocatedArea = getAreaPath(pointsAllocated, height, paddingY);

  const pathActualCurve = getSmoothPath(pointsActual);
  const pathActualArea = getAreaPath(pointsActual, height, paddingY);

  return (
    <div className="relative w-full" onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 overflow-visible">
        <defs>
          <linearGradient id="machineActualGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="machineAllocatedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {[0, 0.33, 0.66, 1].map((pct, idx) => {
          const y = height - paddingY - pct * (height - 2 * paddingY);
          return (
            <line key={idx} x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="4 4" />
          );
        })}

        <path d={pathAllocatedArea} fill="url(#machineAllocatedGrad)" />
        <path d={pathActualArea} fill="url(#machineActualGrad)" />

        <path d={pathAllocatedCurve} fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={pathActualCurve} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {pointsActual.map((p, i) => (
          <g key={i} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)} className="cursor-pointer">
            {hoveredIndex === i && (
              <line x1={p.x} y1={paddingY} x2={p.x} y2={height - paddingY} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
            )}
            <circle cx={p.x} cy={pointsAllocated[i].y} r={hoveredIndex === i ? 6 : 3.5} fill="#cbd5e1" stroke="#ffffff" strokeWidth="2" />
            <circle cx={p.x} cy={p.y} r={hoveredIndex === i ? 6.5 : 4} fill="#6366f1" stroke="#ffffff" strokeWidth="2.5" />
            {(i % labelStep === 0 || i === data.length - 1) && (
              <text x={p.x} y={height - 4} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#64748b">
                {p.label}
              </text>
            )}
          </g>
        ))}
      </svg>

      {hoveredIndex !== null && data[hoveredIndex] && (
        <div
          className="fixed z-[9999] bg-zinc-950 text-white p-4 rounded-2xl shadow-2xl pointer-events-none text-sm transform -translate-x-1/2 -translate-y-full mb-2 min-w-[230px] border border-zinc-800"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="font-extrabold text-[15px] text-zinc-100 mb-1.5 border-b border-zinc-800 pb-1 flex items-center justify-between">
            <span>📅 {data[hoveredIndex].dateStr || data[hoveredIndex].label}</span>
            <span className="text-[12px] bg-indigo-900/60 text-indigo-300 px-2 py-0.5 rounded-full font-bold">Equipment Analytics</span>
          </div>
          <div className="flex flex-col gap-1.5 text-[13px]">
            <div className="flex items-center gap-2 font-bold text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 shrink-0" />
              Total Daily Hours: <span className="text-white font-black ml-auto">24 hrs</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-[#cbd5e1] shrink-0" />
              Allocated Hours: <span className="text-white font-black ml-auto">{Math.round(data[hoveredIndex].allocated || 0)} hrs</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1] shrink-0" />
              Actual Runtime Hours: <span className="text-indigo-400 font-black ml-auto">{Math.round(data[hoveredIndex].actual || 0)} hrs</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BarChart({
  data,
  color,
  tooltipTitle,
  breakdown
}: {
  data: any[];
  color: string;
  tooltipTitle: string;
  breakdown: { key: string; label: string; color: string }[];
}) {
  const [hoveredBar, setHoveredBar] = useState<any | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const maxVal = Math.max(...data.map((d) => d.value || 0), 1);

  return (
    <div className="relative" onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}>
      <div className="flex items-end justify-between gap-1.5 h-36 pt-6 pb-2 border-b border-zinc-100">
        {data.map((item, idx) => {
          const heightPct = ((item.value || 0) / maxVal) * 100;

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
              onMouseEnter={() => setHoveredBar(item)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              {item.value > 0 && (
                <span className="text-[11px] font-black text-zinc-900 mb-1">
                  {item.value}
                </span>
              )}
              <div
                className="w-full flex flex-col justify-end gap-0.5 rounded-t-sm overflow-hidden"
                style={{ height: `${Math.max(4, heightPct * 0.75)}%` }}
              >
                {item.breakdown && breakdown ? (
                  breakdown.map((b) => {
                    const subVal = item.breakdown[b.key] || 0;
                    const subPct = (subVal / maxVal) * 100;
                    return (
                      <div
                        key={b.key}
                        className="w-full transition-all"
                        style={{ height: `${subPct}%`, backgroundColor: b.color }}
                      />
                    );
                  })
                ) : (
                  <div className="w-full transition-all" style={{ height: '100%', backgroundColor: color }} />
                )}
              </div>
              <span className="text-[13px] font-extrabold text-zinc-600 mt-1">{item.label}</span>
            </div>
          );
        })}
      </div>

      {hoveredBar && (
        <div
          className="fixed z-[9999] bg-zinc-950 text-white p-4 rounded-2xl shadow-2xl pointer-events-none text-sm transform -translate-x-1/2 -translate-y-full mb-2 min-w-[200px] border border-zinc-800"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="font-extrabold text-[14px] text-zinc-100 mb-1 border-b border-zinc-800 pb-1 flex items-center justify-between">
            <span>📅 {hoveredBar.label} — {tooltipTitle}</span>
          </div>
          <div className="font-black text-lg text-indigo-400 my-1">{hoveredBar.value} Total</div>
          {breakdown && (
            <div className="flex flex-col gap-1 mt-1.5 border-t border-zinc-800 pt-1.5">
              {breakdown.map((b) => (
                <div key={b.key} className="flex items-center gap-2 font-bold text-zinc-400 text-[11px]">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                  {b.label}: <span className="text-white font-black ml-auto">{hoveredBar[b.key] || 0}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-sm py-0.5">
      <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-zinc-600 font-extrabold">{label}</span>
      <span className="ml-auto font-black text-zinc-900">{value}</span>
    </div>
  );
}

function renderCornerRibbon(active?: boolean) {
  if (!active) return null;
  return (
    <div className="absolute top-0 right-0 overflow-hidden w-16 h-16 pointer-events-none z-[49] select-none">
      <div className="absolute top-[12px] right-[-24px] w-[90px] rotate-45 bg-indigo-600 text-white text-[8px] font-black tracking-widest uppercase text-center py-0.5 shadow-sm border border-indigo-500/20">
        Filtered
      </div>
    </div>
  );
}

function Card({ title, children, isFiltered }: { title: string; children: React.ReactNode; isFiltered?: boolean }) {
  return (
    <div className="bg-white border border-zinc-200/60 rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)] transition-all min-h-[350px] relative overflow-hidden">
      {renderCornerRibbon(isFiltered)}
      <h3 className="text-sm font-extrabold text-zinc-950 mb-4 tracking-tight" style={{ fontFamily: "Outfit, Inter, sans-serif" }}>{title}</h3>
      <div className="flex-1 flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
}

function ChartCard({ title, children, isFiltered }: { title: string; children: React.ReactNode; isFiltered?: boolean }) {
  return (
    <div className="bg-white border border-zinc-200/60 rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)] transition-all min-h-[310px] flex flex-col relative overflow-hidden">
      {renderCornerRibbon(isFiltered)}
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

export default function CeoDashboard({ bare = false }: { bare?: boolean }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [nablRequests, setNablRequests] = useState<any[]>([]);
  const [capas, setCapas] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [plans, setPlans] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(true);

  const [startDateFilter, setStartDateFilter] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDateFilter, setEndDateFilter] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [activeDatePreset, setActiveDatePreset] = useState<'ALL' | 'THIS_MONTH' | 'LAST_30' | 'YTD' | 'CUSTOM'>('THIS_MONTH');

  const [selectedStation, setSelectedStation] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [testTypes, setTestTypes] = useState<any[]>([]);
  const [selectedTestType, setSelectedTestType] = useState('');
  const isFirstLoadRef = useRef(true);

  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    title: string;
    type: 'request' | 'capa' | 'equipment' | 'station' | 'nabl' | '';
    label: string;
    data: any[];
  }>({
    open: false,
    title: '',
    type: '',
    label: '',
    data: [],
  });

  const load = async () => {
    if (isFirstLoadRef.current) {
      setLoading(true);
    }
    try {
      const [reqRes, nablReqsRes, caps, eqps, plats, testTypesData] = await Promise.all([
        apiConnector('GET', '/api/v1/test-requests?limit=1000').catch(() => ({ data: { data: [] } })),
        getNablRequests()().catch(() => []),
        getCapas()().catch(() => []),
        getTestingEquipments({ limit: 500 })().catch(() => []),
        getPlatforms()().catch(() => []),
        getTestTypes()().catch(() => [])
      ]);

      const rawReqs = (reqRes as any)?.data?.data || (reqRes as any)?.data || [];
      const rawNablReqs = Array.isArray(nablReqsRes) ? nablReqsRes : [];
      const activeTestTypes = Array.isArray(testTypesData) ? testTypesData : [];

      const parsedPlans: { [key: string]: any } = {};
      if (Array.isArray(rawReqs)) {
        rawReqs.forEach((req: any) => {
          if (req.testPlans) {
            req.testPlans.forEach((plan: any) => {
              let platformNosParsed = [];
              if (plan.platformNos) {
                try {
                  platformNosParsed = typeof plan.platformNos === 'string' ? JSON.parse(plan.platformNos) : plan.platformNos;
                } catch {
                  platformNosParsed = [];
                }
              }
              parsedPlans[`${req.id}-plan-${plan.id}`] = {
                ...plan,
                platformNos: platformNosParsed,
                testRequestStatus: req.status
              };
            });
          }
        });
      }

      setRequests(Array.isArray(rawReqs) ? rawReqs : []);
      setNablRequests(rawNablReqs);
      setCapas(Array.isArray(caps) ? caps : []);
      setEquipment(Array.isArray(eqps) ? eqps : []);
      setPlatforms(Array.isArray(plats) ? plats : []);
      setTestTypes(activeTestTypes);
      setPlans(parsedPlans);
    } finally {
      setLoading(false);
      isFirstLoadRef.current = false;
    }
  };

  useEffect(() => {
    setSelectedStation('');
    setSelectedPlatform('');
  }, [selectedTestType]);

  useEffect(() => { load(); }, [startDateFilter, endDateFilter, selectedStation, selectedPlatform, selectedEquipment, selectedTestType]);

  const matchesDateRange = (dateStr: string) => {
    if (!dateStr) return true;
    if (!startDateFilter && !endDateFilter) return true;

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;

    if (startDateFilter) {
      const start = new Date(startDateFilter + 'T00:00:00');
      if (d < start) return false;
    }

    if (endDateFilter) {
      const end = new Date(endDateFilter + 'T23:59:59');
      if (d > end) return false;
    }

    return true;
  };

  const handlePresetChange = (preset: 'ALL' | 'THIS_MONTH' | 'LAST_30' | 'YTD' | 'CUSTOM') => {
    setActiveDatePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'ALL') {
      setStartDateFilter('');
      setEndDateFilter('');
    } else if (preset === 'THIS_MONTH') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setStartDateFilter(monthStart);
      setEndDateFilter(todayStr);
    } else if (preset === 'LAST_30') {
      const past30 = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
      setStartDateFilter(past30);
      setEndDateFilter(new Date().toISOString().split('T')[0]);
    } else if (preset === 'YTD') {
      const ytdStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
      setStartDateFilter(ytdStart);
      setEndDateFilter(new Date().toISOString().split('T')[0]);
    }
  };

  const handleResetAndRefresh = async () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];
    setStartDateFilter(monthStart);
    setEndDateFilter(todayStr);
    setActiveDatePreset('THIS_MONTH');
    setSelectedTestType('');
    setSelectedStation('');
    setSelectedPlatform('');
    setSelectedEquipment('');
    await load();
    toast.success('Dashboard filters reset and data refreshed.');
  };

  const selectedTypeName = testTypes.find((t: any) => String(t.id) === String(selectedTestType))?.name || '';
  const isNablSelected = selectedTestType === 'NABL_TESTING' || selectedTypeName.toLowerCase().includes('nabl');

  const equipmentOptions = [
    { value: '', label: 'All Equipments' },
    ...equipment.map((eq: any) => ({
      value: String(eq.id),
      label: eq.name
    }))
  ];

  const testTypeOptions = [
    { value: '', label: 'All Test Types' },
    { value: 'NABL_TESTING', label: 'NABL Testing' },
    ...testTypes.map((t: any) => ({
      value: String(t.id),
      label: t.name
    }))
  ];

  const stationOptions = [
    { value: '', label: 'All Stations' },
    ...Array.from({ length: 13 }, (_, idx) => ({
      value: String(idx + 1),
      label: `Station ${idx + 1}`
    }))
  ];

  const isDateFiltered = activeDatePreset !== 'THIS_MONTH';
  const isTestTypeFiltered = !!selectedTestType;
  const isStationFiltered = !!(selectedStation || selectedPlatform);
  const isEquipmentFiltered = !!selectedEquipment;
  const periodStandardRequests = requests.filter((r) => {
    if (isNablSelected) return false;
    if (selectedTestType && String(r.testTypeId || r.testType?.id || '') !== String(selectedTestType)) return false;
    return matchesDateRange(r.createdAt);
  });

  const periodNablRequests = nablRequests.filter((r) => {
    if (selectedTestType && !isNablSelected) return false;
    return matchesDateRange(r.createdAt);
  });

  const periodCapas = capas.filter((c) => {
    if (!matchesDateRange(c.createdAt)) return false;
    if (selectedTestType) {
      if (isNablSelected) {
        const isNabl = nablRequests.some(
          (nr) =>
            nr.requestId === c.relatedRequest ||
            String(nr.id) === c.relatedRequest ||
            `REQ-${nr.id}` === c.relatedRequest
        );
        if (!isNabl) return false;
      } else {
        const matchedReq = requests.find(
          (r) =>
            r.requestId === c.relatedRequest ||
            String(r.id) === c.relatedRequest ||
            `REQ-${r.id}` === c.relatedRequest
        );
        if (!matchedReq) return false;
        if (String(matchedReq.testTypeId || matchedReq.testType?.id || '') !== String(selectedTestType)) {
          return false;
        }
      }
    }
    return true;
  });

  const currentEfficiency = (() => {
    let totalDone = 0;
    let totalEfficient = 0;

    const doneStd = periodStandardRequests.filter((r) => isCompletedStatus(r.status));
    totalDone += doneStd.length;
    const efficientStd = doneStd.filter((r) => {
      const planKey = Object.keys(plans).find((k) => k.startsWith(String(r.id) + '-'));
      const plan = plans[planKey || ''];
      const targetDays = plan ? Number(plan.numberOfDays) + 5 : 15;
      const actualDays = Math.round((new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()) / 86400000);
      return actualDays <= targetDays;
    }).length;
    totalEfficient += efficientStd;

    const doneNabl = periodNablRequests.filter((r) => r.testPlan && r.testPlan.startDate && isEndDatePassed(r));
    totalDone += doneNabl.length;
    const efficientNabl = doneNabl.filter((r) => {
      const start = new Date(r.testPlan.startDate);
      const end = new Date(r.testPlan.endDate);
      const plannedDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
      const targetDays = plannedDays + 5;
      const actualCompletionDate = r.updatedAt ? new Date(r.updatedAt) : new Date();
      const actualDays = Math.round((actualCompletionDate.getTime() - start.getTime()) / 86400000);
      return actualDays <= targetDays;
    }).length;
    totalEfficient += efficientNabl;

    if (totalDone === 0) return 0;
    return Number(((totalEfficient / totalDone) * 100).toFixed(1));
  })();

  const currentCompletedPassed = (() => {
    const stdPass = periodStandardRequests.filter((r) =>
      ['completed', 'testing_passed', 'testing_partial', 'pass'].includes(getSafeStatusText(r.status))
    ).length;
    const nablPass = periodNablRequests.filter((r) => getNablCategory(r) === 'COMPLETED_PASS').length;
    return stdPass + nablPass;
  })();

  const currentFailed = (() => {
    const stdFail = periodStandardRequests.filter((r) => isFailedStatus(r.status)).length;
    const nablFail = periodNablRequests.filter((r) => getNablCategory(r) === 'FAILED').length;
    return stdFail + nablFail;
  })();

  const currentSuccessRate = (() => {
    const totalConcluded = currentCompletedPassed + currentFailed;
    if (totalConcluded === 0) return 0;
    return Number(((currentCompletedPassed / totalConcluded) * 100).toFixed(1));
  })();

  const eqTotal = equipment.length || 11;
  const eqMaint = equipment.filter((e) => ['maintenance', 'under_maintenance', 'breakdown'].includes(getSafeStatusText(e.status))).length;
  const eqOccupied = equipment.filter((e) => e.isAvailable === false || ['occupied', 'busy', 'in_use', 'running'].includes(getSafeStatusText(e.status))).length;
  const eqAvail = Math.max(0, eqTotal - eqOccupied - eqMaint);
  const occupiedEquipmentsCount = eqOccupied;

  const currentEquipmentsUtilization = (() => {
    return Number(((eqOccupied / eqTotal) * 100).toFixed(1));
  })();

  const stTotal = 130;
  const stOccupied = platforms.length > 0
    ? platforms.filter((p) => p.isAvailable === false || ['occupied', 'busy', 'reserved', 'in_use', 'testing'].includes(getSafeStatusText(p.status))).length
    : 7;
  const stAvail = Math.max(0, stTotal - stOccupied);
  const occupiedPlatformSlotsCount = stOccupied;

  const currentStationsUtilization = (() => {
    return Number(((stOccupied / stTotal) * 100).toFixed(1));
  })();

  const activePlanList = Object.values(plans);

  const dailyPlatformAvailData = (() => {
    let start = startDateFilter ? new Date(startDateFilter) : new Date(new Date().getFullYear(), 0, 1);
    let end = endDateFilter ? new Date(endDateFilter) : new Date();

    const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
    const slotsCount = selectedPlatform ? 1 : selectedStation ? 10 : 130;
    const result = [];

    if (totalDays <= 35) {
      for (let i = 0; i < totalDays; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const dayStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

        let activeSlotsCount = 0;
        activePlanList.forEach((plan: any) => {
          if (!plan.stationNo) return;
          const reqStatus = getSafeStatusText(plan.testRequestStatus);
          if (['completed', 'failed', 'rejected', 'testing_failed', 'testing_passed'].includes(reqStatus)) {
            return;
          }

          if (plan.startDate && plan.endDate) {
            const pStart = new Date(plan.startDate);
            pStart.setHours(0, 0, 0, 0);
            let resolvedEndDate = plan.endDate;
            if (plan.evaluationStatus && plan.evaluatedAt) {
              resolvedEndDate = plan.evaluatedAt;
            }
            const pEnd = new Date(resolvedEndDate);
            pEnd.setHours(23, 59, 59, 999);

            const curDay = new Date(d);
            curDay.setHours(12, 0, 0, 0);

            if (curDay >= pStart && curDay <= pEnd) {
              if (selectedStation) {
                const planStation = String(plan.stationNo || plan.station || '');
                if (planStation && planStation !== String(selectedStation)) return;
              }
              if (selectedPlatform) {
                const pNos = Array.isArray(plan.platformNos) ? plan.platformNos : [];
                if (!pNos.some((pNum: any) => String(pNum) === String(selectedPlatform))) return;
                activeSlotsCount += 1;
              } else if (selectedStation) {
                const pNos = Array.isArray(plan.platformNos) ? plan.platformNos : [1];
                activeSlotsCount += pNos.length;
              } else {
                const pNos = Array.isArray(plan.platformNos) ? plan.platformNos : [1];
                activeSlotsCount += pNos.length;
              }
            }
          }
        });

        const occupiedRatio = Math.min(1, activeSlotsCount / slotsCount);
        const occupiedHours = Math.round(occupiedRatio * 24);
        const availableHours = Math.max(0, 24 - occupiedHours);

        result.push({
          dateStr: dayStr,
          label,
          totalCapacityHours: 24,
          occupiedHours,
          availableHours,
        });
      }
    } else {
      const startYear = start.getFullYear();
      const startMonth = start.getMonth();
      const endYear = end.getFullYear();
      const endMonth = end.getMonth();

      const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;

      for (let m = 0; m < totalMonths; m++) {
        const curDate = new Date(startYear, startMonth + m, 15);
        const monthLabel = curDate.toLocaleDateString('en-US', { month: 'short', year: totalMonths > 12 ? '2-digit' : undefined });
        const monthStr = `${curDate.getFullYear()}-${String(curDate.getMonth() + 1).padStart(2, '0')}`;

        let activeSlotsCount = 0;
        activePlanList.forEach((plan: any) => {
          if (!plan.stationNo) return;
          const reqStatus = getSafeStatusText(plan.testRequestStatus);
          if (['completed', 'failed', 'rejected', 'testing_failed', 'testing_passed'].includes(reqStatus)) {
            return;
          }

          if (plan.startDate && plan.endDate) {
            const pStart = new Date(plan.startDate);
            let resolvedEndDate = plan.endDate;
            if (plan.evaluationStatus && plan.evaluatedAt) {
              resolvedEndDate = plan.evaluatedAt;
            }
            const pEnd = new Date(resolvedEndDate);
            if (curDate >= pStart && curDate <= pEnd) {
              if (selectedStation) {
                const planStation = String(plan.stationNo || plan.station || '');
                if (planStation && planStation !== String(selectedStation)) return;
              }
              if (selectedPlatform) {
                const pNos = Array.isArray(plan.platformNos) ? plan.platformNos : [];
                if (!pNos.some((pNum: any) => String(pNum) === String(selectedPlatform))) return;
                activeSlotsCount += 1;
              } else if (selectedStation) {
                const pNos = Array.isArray(plan.platformNos) ? plan.platformNos : [1];
                activeSlotsCount += pNos.length;
              } else {
                const pNos = Array.isArray(plan.platformNos) ? plan.platformNos : [1];
                activeSlotsCount += pNos.length;
              }
            }
          }
        });

        const occupiedRatio = Math.min(1, activeSlotsCount / slotsCount);
        const occupiedHours = Math.round(occupiedRatio * 24);
        const availableHours = Math.max(0, 24 - occupiedHours);

        result.push({
          dateStr: monthStr,
          label: monthLabel,
          totalCapacityHours: 24,
          occupiedHours,
          availableHours,
        });
      }
    }

    return result;
  })();

  const dailyMachineUtilData = (() => {
    let start = startDateFilter ? new Date(startDateFilter) : new Date(new Date().getFullYear(), 0, 1);
    let end = endDateFilter ? new Date(endDateFilter) : new Date();

    const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
    const totalEqCount = selectedEquipment ? 1 : Math.max(1, equipment.length);
    const result = [];

    const calculateActiveEqForDate = (curDay: Date) => {
      let count = 0;
      activePlanList.forEach((plan: any) => {
        const planEqId = plan.equipmentId || plan.testingEquipmentId || plan.testing_equipment_id || plan.equipment?.id || plan.chamberId;
        if (!planEqId) return;

        const reqStatus = getSafeStatusText(plan.testRequestStatus);
        if (['completed', 'failed', 'rejected', 'testing_failed', 'testing_passed'].includes(reqStatus)) {
          return;
        }

        if (plan.startDate && plan.endDate) {
          const pStart = new Date(plan.startDate);
          pStart.setHours(0, 0, 0, 0);
          let resolvedEndDate = plan.endDate;
          if (plan.evaluationStatus && plan.evaluatedAt) {
            resolvedEndDate = plan.evaluatedAt;
          }
          const pEnd = new Date(resolvedEndDate);
          pEnd.setHours(23, 59, 59, 999);

          if (curDay >= pStart && curDay <= pEnd) {
            if (selectedEquipment) {
              if (String(planEqId) === String(selectedEquipment)) {
                count += 1;
              }
            } else {
              count += 1;
            }
          }
        }
      });
      return Math.min(totalEqCount, count);
    };

    if (totalDays <= 35) {
      for (let i = 0; i < totalDays; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const dayStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

        const curDay = new Date(d);
        curDay.setHours(12, 0, 0, 0);

        const activeEqCount = calculateActiveEqForDate(curDay);
        const utilRatio = Math.min(1, activeEqCount / totalEqCount);

        const allocatedHours = Math.round(utilRatio * 22);
        const actualRuntimeHours = Math.round(utilRatio * 20);
        const availableHours = Math.max(0, 24 - allocatedHours);

        result.push({
          dateStr: dayStr,
          label,
          totalCapacityHours: 24,
          allocated: allocatedHours,
          actual: actualRuntimeHours,
          availableHours,
        });
      }
    } else {
      const startYear = start.getFullYear();
      const startMonth = start.getMonth();
      const endYear = end.getFullYear();
      const endMonth = end.getMonth();

      const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;

      for (let m = 0; m < totalMonths; m++) {
        const curDate = new Date(startYear, startMonth + m, 15);
        const monthLabel = curDate.toLocaleDateString('en-US', { month: 'short', year: totalMonths > 12 ? '2-digit' : undefined });
        const monthStr = `${curDate.getFullYear()}-${String(curDate.getMonth() + 1).padStart(2, '0')}`;

        const activeEqCount = calculateActiveEqForDate(curDate);
        const utilRatio = Math.min(1, activeEqCount / totalEqCount);

        const allocatedHours = Math.round(utilRatio * 22);
        const actualRuntimeHours = Math.round(utilRatio * 20);
        const availableHours = Math.max(0, 24 - allocatedHours);

        result.push({
          dateStr: monthStr,
          label: monthLabel,
          totalCapacityHours: 24,
          allocated: allocatedHours,
          actual: actualRuntimeHours,
          availableHours,
        });
      }
    }

    return result;
  })();

  const nablStatusSegs = [
    { label: 'Request Generated', value: periodNablRequests.filter((r) => getNablCategory(r) === 'REQUEST_GENERATED').length, color: '#8b5cf6' },
    { label: 'Under Testing', value: periodNablRequests.filter((r) => getNablCategory(r) === 'UNDER_TESTING').length, color: '#3b82f6' },
    { label: 'Completed (Pass)', value: periodNablRequests.filter((r) => getNablCategory(r) === 'COMPLETED_PASS').length, color: '#10b981' },
    { label: 'Completed (Fail)', value: periodNablRequests.filter((r) => getNablCategory(r) === 'FAILED').length, color: '#ef4444' },
  ];

  const standardStatusSegs = [
    { label: 'Pending Approval', value: periodStandardRequests.filter((r) => getSafeStatusText(r.status) === 'pending_approval').length, color: '#f59e0b' },
    { label: 'Under Inspection', value: periodStandardRequests.filter((r) => ['under_inspection', 'inspection_completed'].includes(getSafeStatusText(r.status))).length, color: '#8b5cf6' },
    { label: 'Inspection Failed', value: periodStandardRequests.filter((r) => getSafeStatusText(r.status) === 'inspection_failed').length, color: '#ef4444' },
    { label: 'Under Testing', value: periodStandardRequests.filter((r) => ['under_testing', 'under_test', 'testing_completed'].includes(getSafeStatusText(r.status))).length, color: '#3b82f6' },
    { label: 'Completed', value: periodStandardRequests.filter((r) => ['completed', 'testing_passed', 'testing_partial'].includes(getSafeStatusText(r.status))).length, color: '#10b981' },
    { label: 'Rejected', value: periodStandardRequests.filter((r) => getSafeStatusText(r.status) === 'rejected').length, color: '#64748b' },
    { label: 'Retest', value: periodStandardRequests.filter((r) => ['retest', 'restest'].includes(getSafeStatusText(r.status))).length, color: '#0ea5e9' },
    { label: 'Failed', value: periodStandardRequests.filter((r) => ['failed', 'fail', 'testing_failed'].includes(getSafeStatusText(r.status))).length, color: '#b91c1c' },
  ];

  const activeStatusSegs = isNablSelected ? nablStatusSegs : standardStatusSegs;

  const capaOpenStatuses = ['pending', 'open', 'in_progress', 'under_review'];
  const capaClosedStatuses = ['completed', 'closed', 'resolved', 'done'];

  const capaOpen = periodCapas.filter((c) => capaOpenStatuses.includes(getSafeStatusText(c.status))).length;
  const capaClosed = periodCapas.filter((c) => capaClosedStatuses.includes(getSafeStatusText(c.status))).length;
  const capaTotal = periodCapas.length;

  const capaSegs = [
    { label: 'Open', value: capaOpen, color: '#f59e0b' },
    { label: 'Closed', value: capaClosed, color: '#10b981' },
  ];

  const eqSegs = [
    { label: 'Available', value: eqAvail, color: '#38bdf8' },
    { label: 'Occupied', value: eqOccupied, color: '#6366f1' },
    { label: 'Maintenance', value: eqMaint, color: '#f59e0b' },
  ];

  const stSegs = [
    { label: 'Available', value: stAvail, color: '#38bdf8' },
    { label: 'Occupied', value: stOccupied, color: '#e11d48' },
  ];

  const selectedYear = new Date().getFullYear();
  const fullYearMonths = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(selectedYear, i, 1);
    return { label: MONTHS[i], y: d.getFullYear(), m: d.getMonth() };
  });

  const matchMonth = (dateStr: string, y: number, m: number) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getFullYear() === y && d.getMonth() === m;
  };

  const monthlyReqs = fullYearMonths.map((mo) => {
    const monthStd = periodStandardRequests.filter((r) => matchMonth(r.createdAt, mo.y, mo.m));
    const monthNabl = periodNablRequests.filter((r) => matchMonth(r.createdAt, mo.y, mo.m));
    const totalVal = monthStd.length + monthNabl.length;

    const stdDone = monthStd.filter((r) => isCompletedStatus(r.status)).length;
    const nablDone = monthNabl.filter((r) => ['COMPLETED_PASS', 'FAILED'].includes(getNablCategory(r))).length;
    const completed = stdDone + nablDone;
    const notCompleted = Math.max(0, totalVal - completed);

    return { label: mo.label, value: totalVal, completed, notCompleted };
  });

  const monthlyFailed = fullYearMonths.map((mo) => {
    const stdFailed = periodStandardRequests.filter((r) => isFailedStatus(r.status) && matchMonth(r.createdAt, mo.y, mo.m));
    const nablFailed = periodNablRequests.filter((r) => getNablCategory(r) === 'FAILED' && matchMonth(r.createdAt, mo.y, mo.m));
    const totalVal = stdFailed.length + nablFailed.length;

    const capaSubmitted = capas.filter((c) => matchMonth(c.createdAt, mo.y, mo.m)).length;
    const cappedCapa = Math.min(totalVal, capaSubmitted);
    const withoutCapa = Math.max(0, totalVal - cappedCapa);

    return { label: mo.label, value: totalVal, capaSubmitted: cappedCapa, withoutCapa };
  });

  const monthlyCapa = fullYearMonths.map((mo) => {
    const monthCapas = capas.filter((c) => matchMonth(c.createdAt, mo.y, mo.m));
    const open = monthCapas.filter((c) => capaOpenStatuses.includes(getSafeStatusText(c.status))).length;
    const closed = monthCapas.filter((c) => capaClosedStatuses.includes(getSafeStatusText(c.status))).length;
    return { label: mo.label, value: monthCapas.length, open, closed, other: Math.max(0, monthCapas.length - open - closed) };
  });

  const brandStats = (() => {
    const counts: Record<string, { total: number; pass: number; fail: number }> = {};
    const dataset = isNablSelected ? periodNablRequests : [...periodStandardRequests, ...periodNablRequests];

    dataset.forEach((r: any) => {
      const brand = r.brandName || r.customerNameAddress?.split('\n')[0] || 'Dixon Lab OEM';
      if (!counts[brand]) counts[brand] = { total: 0, pass: 0, fail: 0 };
      counts[brand].total += 1;

      const isPass = isNablSelected ? getNablCategory(r) === 'COMPLETED_PASS' : ['completed', 'pass', 'testing_passed'].includes(getSafeStatusText(r.status));
      if (isPass) counts[brand].pass += 1;
      else counts[brand].fail += 1;
    });

    return Object.entries(counts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  })();

  const getRequestDetailsByStatus = (label: string) => {
    let data: any[] = [];
    if (isNablSelected) {
      const categoryMap: Record<string, string> = {
        'Request Generated': 'REQUEST_GENERATED',
        'Under Testing': 'UNDER_TESTING',
        'Completed (Pass)': 'COMPLETED_PASS',
        'Completed (Fail)': 'FAILED',
      };
      const cat = categoryMap[label];
      data = periodNablRequests.filter((r) => getNablCategory(r) === cat);
    } else {
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
      const allowed = statusMap[label] || [];
      data = periodStandardRequests.filter((r) => allowed.includes(getSafeStatusText(r.status)));
    }

    setDetailModal({
      open: true,
      title: `Request Status - ${label}`,
      type: isNablSelected ? 'nabl' : 'request',
      label,
      data,
    });
  };

  const getCapaDetailsByStatus = (label: string) => {
    const allowed = label === 'Open' ? capaOpenStatuses : capaClosedStatuses;
    const data = periodCapas.filter((c) => allowed.includes(getSafeStatusText(c.status)));
    setDetailModal({ open: true, title: `CAPA Status - ${label}`, type: 'capa', label, data });
  };

  const getEquipmentDetailsByStatus = (label: string) => {
    let data: any[] = [];
    if (label === 'Available') {
      data = equipment.filter((e) => e.isAvailable === true && !['maintenance', 'under_maintenance', 'breakdown'].includes(getSafeStatusText(e.status)));
    } else if (label === 'Occupied') {
      data = equipment.filter((e) => e.isAvailable === false || ['occupied', 'busy', 'in_use', 'running'].includes(getSafeStatusText(e.status)));
    } else if (label === 'Maintenance') {
      data = equipment.filter((e) => ['maintenance', 'under_maintenance', 'breakdown'].includes(getSafeStatusText(e.status)));
    }
    setDetailModal({ open: true, title: `Equipment Availability - ${label}`, type: 'equipment', label, data });
  };

  const getStationDetailsByStatus = (label: string) => {
    const data = platforms.filter((p) => (label === 'Available' ? p.isAvailable === true : p.isAvailable === false));
    setDetailModal({ open: true, title: `Station Occupancy - ${label}`, type: 'station', label, data });
  };

  const displayValue = (value: any, fallback = '-') => {
    if (value === null || value === undefined || value === '') return fallback;
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'object') return value.name || value.title || value.requestId || value.status || fallback;
    return fallback;
  };

  const displayDate = (value: any) => {
    if (!value) return '-';
    const date = new Date(value);
    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
  };

  if (loading) {
    return (
      <DashboardLayout title="Executive Dashboard" description="Loading Dashboard Stats..." bare={bare}>
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-700 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-550 text-xs font-semibold">Synchronizing Executive LIMS Analytics...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="" description="" bare={bare}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-[28px] text-white shadow-xl">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white" style={{ fontFamily: "Outfit, Inter, sans-serif" }}>
            Executive Dashboard
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/10 text-xs font-bold">
            <button
              onClick={() => handlePresetChange('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeDatePreset === 'ALL' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-200 hover:text-white'}`}
            >
              All Time
            </button>
            <button
              onClick={() => handlePresetChange('THIS_MONTH')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeDatePreset === 'THIS_MONTH' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-200 hover:text-white'}`}
            >
              This Month
            </button>
            <button
              onClick={() => handlePresetChange('LAST_30')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeDatePreset === 'LAST_30' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-200 hover:text-white'}`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => handlePresetChange('YTD')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeDatePreset === 'YTD' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-200 hover:text-white'}`}
            >
              YTD
            </button>
          </div>
          <ShadcnDualMonthCalendar
            startDate={startDateFilter}
            endDate={endDateFilter}
            onRangeSelect={(start, end) => {
              setStartDateFilter(start);
              setEndDateFilter(end);
              setActiveDatePreset('CUSTOM');
            }}
          />

          <CustomSelect
            value={selectedTestType}
            onChange={setSelectedTestType}
            options={testTypeOptions}
            placeholder="All Test Types"
            className="w-44 text-zinc-900 font-bold text-xs"
          />

          <button
            onClick={handleResetAndRefresh}
            title="Reset Filters & Refresh Telemetry"
            className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white border border-zinc-200/60 rounded-[22px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between transition-all hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)] relative overflow-hidden">
            {renderCornerRibbon(isDateFiltered || isTestTypeFiltered)}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                  <span className="text-[10px] tracking-wider text-zinc-400 font-extrabold uppercase">Overall Lab Efficiency</span>
                  <InfoTooltip
                    title="SLA Efficiency Logic"
                    text="Calculated as (On-Time Finished Tests / Total Finished Tests) * 100. A test is On-Time if actual completion days <= (Planned Test Days + 5 Days Buffer)."
                  />
                </div>
                <TrendingUp className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-zinc-900 leading-none">{currentEfficiency}%</span>
                <p className="text-[11px] text-zinc-500 font-bold mt-1">SLA Target Compliance</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100">
              <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, currentEfficiency)}%` }} />
              </div>
            </div>
          </div>
          <div className="bg-white border border-zinc-200/60 rounded-[22px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between transition-all hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)] relative overflow-hidden">
            {renderCornerRibbon(isDateFiltered || isTestTypeFiltered)}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                  <span className="text-[10px] tracking-wider text-zinc-400 font-extrabold uppercase">Tests Concluded</span>
                  <InfoTooltip
                    title="Tests Concluded Logic"
                    text="Shows Total Passed vs Total Failed test requests in selected date range."
                  />
                </div>
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-extrabold text-zinc-900 leading-none">
                  {currentCompletedPassed} <span className="text-zinc-300 font-normal">/</span> <span className="text-rose-600">{currentFailed}</span>
                </span>
                <p className="text-[11px] text-zinc-500 font-bold mt-1">Pass vs Fail Outcome</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[10px] font-bold">
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Pass: {currentCompletedPassed}</span>
              <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">Fail: {currentFailed}</span>
            </div>
          </div>
          <div className="bg-white border border-zinc-200/60 rounded-[22px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between transition-all hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)] relative overflow-hidden">
            {renderCornerRibbon(isDateFiltered || isTestTypeFiltered)}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                  <span className="text-[10px] tracking-wider text-zinc-400 font-extrabold uppercase">Success Rate</span>
                  <InfoTooltip
                    title="Success Rate Formula"
                    text="Calculated as (Total Passed Tests / Total Concluded Tests) * 100. Measures overall pass yield across standard & NABL test requests."
                  />
                </div>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-zinc-900 leading-none">{currentSuccessRate}%</span>
                <p className="text-[11px] text-zinc-500 font-bold mt-1">Pass Yield Outcome</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100">
              <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, currentSuccessRate)}%` }} />
              </div>
            </div>
          </div>
          <div className="bg-white border border-zinc-200/60 rounded-[22px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between transition-all hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)]">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                  <span className="text-[10px] tracking-wider text-zinc-400 font-extrabold uppercase">Equipments Utilization</span>
                  <InfoTooltip
                    title="Equipments Utilization Formula"
                    text="Calculated as (Occupied Active Equipments / Total Equipment Inventory) * 100."
                  />
                </div>
                <Clock className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-zinc-900 leading-none">{currentEquipmentsUtilization}%</span>
                <p className="text-[11px] text-zinc-500 font-bold mt-1">{occupiedEquipmentsCount} / {equipment.length} Chambers Active</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100">
              <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, currentEquipmentsUtilization)}%` }} />
              </div>
            </div>
          </div>
          <div className="bg-white border border-zinc-200/60 rounded-[22px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between transition-all hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)]">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                  <span className="text-[10px] tracking-wider text-zinc-400 font-extrabold uppercase">Stations Utilization</span>
                  <InfoTooltip
                    title="Stations Utilization Formula"
                    text="Calculated as (Occupied Platform Slots / 130 Total Standard Platform Slots) * 100. Evaluates standard 13-station lab platform loading."
                  />
                </div>
                <Layers className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-zinc-900 leading-none">{currentStationsUtilization}%</span>
                <p className="text-[11px] text-zinc-500 font-bold mt-1">{occupiedPlatformSlotsCount} / 130 Slots Occupied</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100">
              <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, currentStationsUtilization)}%` }} />
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-zinc-200/60 rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden">
            {renderCornerRibbon(isDateFiltered || isStationFiltered)}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-2.5">
                <Monitor className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900">Platform Availability</h3>
                  <p className="text-[11px] text-zinc-400 font-medium">Daily platform loading analytics in date range</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <CustomSelect
                  value={selectedStation}
                  onChange={setSelectedStation}
                  options={stationOptions}
                  placeholder="All Stations"
                  className="w-32"
                />

                <CustomSelect
                  value={selectedPlatform}
                  onChange={setSelectedPlatform}
                  options={platformOptions}
                  placeholder="All Platforms"
                  className="w-32"
                />

                <div className="flex items-center gap-3 text-[10px] font-extrabold border-l border-zinc-200 pl-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#cbd5e1]" />
                    Available
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
                    Occupied
                  </span>
                </div>
              </div>
            </div>
            <DailyPlatformLineChart data={dailyPlatformAvailData} />
          </div>
          <div className="bg-white border border-zinc-200/60 rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden">
            {renderCornerRibbon(isDateFiltered || isEquipmentFiltered)}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900">Machine Utilization</h3>
                  <p className="text-[11px] text-zinc-400 font-medium">Daily chamber runtime analytics in date range</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <CustomSelect
                  value={selectedEquipment}
                  onChange={setSelectedEquipment}
                  options={equipmentOptions}
                  placeholder="All Equipments"
                  className="w-48"
                />

                <div className="flex items-center gap-3 text-[10px] font-extrabold border-l border-zinc-200 pl-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#cbd5e1]" />
                    Allocated
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" />
                    Runtime
                  </span>
                </div>
              </div>
            </div>
            <DailyMachineLineChart data={dailyMachineUtilData} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card title={isNablSelected ? "NABL Request Status" : "Test Request Status"} isFiltered={isDateFiltered || isTestTypeFiltered}>
            <div className="flex flex-col gap-4">
              <div className="flex justify-center">
                <Donut segments={activeStatusSegs} size={140} onSegmentClick={getRequestDetailsByStatus} />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-zinc-100 pt-3">
                {activeStatusSegs.map((s) => (
                  <button key={s.label} type="button" onClick={() => getRequestDetailsByStatus(s.label)} className="text-left cursor-pointer">
                    <Legend color={s.color} label={s.label} value={s.value} />
                  </button>
                ))}
              </div>
            </div>
          </Card>
          <Card title="CAPA Status Breakdown" isFiltered={isDateFiltered || isTestTypeFiltered}>
            <div className="flex flex-col gap-4">
              <div className="flex justify-center">
                <Donut segments={capaSegs} size={140} onSegmentClick={getCapaDetailsByStatus} />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-zinc-100 pt-3">
                {capaSegs.map((s) => (
                  <button key={s.label} type="button" onClick={() => getCapaDetailsByStatus(s.label)} className="text-left cursor-pointer">
                    <Legend color={s.color} label={s.label} value={s.value} />
                  </button>
                ))}
              </div>
              <div className="mt-1 text-xs text-zinc-600 border-t border-zinc-100 pt-1.5 font-black text-center">Total CAPAs: {capaTotal}</div>
            </div>
          </Card>
          <Card title="Equipment Availability">
            <div className="flex flex-col gap-4">
              <div className="flex justify-center">
                <Donut segments={eqSegs} size={140} onSegmentClick={getEquipmentDetailsByStatus} />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-zinc-100 pt-3">
                {eqSegs.map((s) => (
                  <button key={s.label} type="button" onClick={() => getEquipmentDetailsByStatus(s.label)} className="text-left cursor-pointer">
                    <Legend color={s.color} label={s.label} value={s.value} />
                  </button>
                ))}
              </div>
              <div className="mt-1 text-xs text-zinc-600 border-t border-zinc-100 pt-1.5 font-black text-center">Total Equipments: {eqTotal}</div>
            </div>
          </Card>
          <Card title="Station Occupancy">
            <div className="flex flex-col gap-4">
              <div className="flex justify-center">
                <Donut segments={stSegs} size={140} onSegmentClick={getStationDetailsByStatus} />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-zinc-100 pt-3">
                {stSegs.map((s) => (
                  <button key={s.label} type="button" onClick={() => getStationDetailsByStatus(s.label)} className="text-left cursor-pointer">
                    <Legend color={s.color} label={s.label} value={s.value} />
                  </button>
                ))}
              </div>
              <div className="mt-1 text-xs text-zinc-600 border-t border-zinc-100 pt-1.5 font-black text-center">Total Platform Slots: {stTotal}</div>
            </div>
          </Card>
        </div>
        <div className="bg-white border border-zinc-200/60 rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden">
          {renderCornerRibbon(isDateFiltered || isTestTypeFiltered)}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-base font-extrabold text-zinc-900">Top Client Brands & OEM Quality Breakdown</h3>
                <p className="text-xs text-zinc-400 font-medium">Most active brand requests in selected date window</p>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Executive OEM Analytics
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-2">
            {brandStats.length === 0 ? (
              <div className="col-span-5 text-center py-6 text-xs font-semibold text-zinc-400">No brand request data in this range</div>
            ) : (
              brandStats.map((b) => {
                const passYield = b.total > 0 ? ((b.pass / b.total) * 100).toFixed(0) : '0';
                return (
                  <div key={b.name} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col justify-between hover:bg-slate-100/80 transition-all">
                    <div>
                      <span className="text-sm font-black text-zinc-900 truncate block">{b.name}</span>
                      <span className="text-[13px] font-extrabold text-indigo-600 mt-0.5 block">{b.total} Total Requests</span>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[13px]">
                      <span className="font-bold text-emerald-700">{b.pass} Pass</span>
                      <span className="font-bold text-rose-600">{b.fail} Fail</span>
                      <span className="font-black text-slate-800 bg-white px-1.5 py-0.5 rounded shadow-sm">{passYield}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <ChartCard title={isNablSelected ? "Monthly NABL Sample Requests" : "Monthly Sample Requests"} isFiltered={isDateFiltered || isTestTypeFiltered}>
            <BarChart
              data={monthlyReqs}
              color="#11236a"
              tooltipTitle="Sample Requests"
              breakdown={[
                { key: 'completed', label: 'Completed', color: '#10b981' },
                { key: 'notCompleted', label: 'Not completed', color: '#11236a' },
              ]}
            />
            <p className="text-xs text-zinc-500 font-semibold mt-3">
              Total requests this year: {monthlyReqs.reduce((sum, item) => sum + item.value, 0)}
            </p>
          </ChartCard>

          <ChartCard title={isNablSelected ? "Monthly NABL Failure Trend" : "Monthly Failure Trend"} isFiltered={isDateFiltered || isTestTypeFiltered}>
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

          <ChartCard title="Monthly CAPA Submissions" isFiltered={isDateFiltered || isTestTypeFiltered}>
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
                className="w-9 h-9 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-black cursor-pointer"
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
                  {(detailModal.type === 'request' || detailModal.type === 'nabl') && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-100 text-zinc-400 uppercase text-xs font-extrabold">
                            <th className="pb-3 pr-3">Request ID</th>
                            <th className="pb-3 px-3">Brand / Model</th>
                            <th className="pb-3 px-3">Customer / Details</th>
                            <th className="pb-3 px-3">Status</th>
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
                                {displayValue(r.customerNameAddress || r.sampleDescription || r.testType?.name || 'N/A')}
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-extrabold uppercase text-xs">
                                  {detailModal.type === 'nabl' ? getNablCategory(r).replace('_', ' ') : displayValue(r.status)}
                                </span>
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
                      <table className="w-full text-sm text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-100 text-zinc-400 uppercase text-xs font-extrabold">
                            <th className="pb-3 pr-3">CAPA ID</th>
                            <th className="pb-3 px-3">CAPA Title</th>
                            <th className="pb-3 px-3">Status</th>
                            <th className="pb-3 px-3">Request</th>
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
                                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-extrabold uppercase text-xs">
                                  {displayValue(c.status)}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                {displayValue(c.relatedRequest)}
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
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-base font-extrabold text-zinc-900">{displayValue(eq.name || `Equipment ${eq.id}`)}</h3>
                              <p className="text-sm text-zinc-500 font-semibold">Chamber ID: #{eq.id}</p>
                            </div>
                            {(() => {
                              const isMaint = ['maintenance', 'under_maintenance', 'breakdown'].includes(getSafeStatusText(eq.status));
                              const isOccupied = eq.isAvailable === false || ['occupied', 'busy', 'in_use', 'running'].includes(getSafeStatusText(eq.status));
                              if (isMaint) {
                                return (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-extrabold uppercase bg-amber-50 text-amber-700">
                                    MAINTENANCE
                                  </span>
                                );
                              }
                              if (isOccupied) {
                                return (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-extrabold uppercase bg-indigo-50 text-indigo-700">
                                    OCCUPIED
                                  </span>
                                );
                              }
                              return (
                                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold uppercase bg-sky-50 text-sky-700">
                                  AVAILABLE
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {detailModal.type === 'station' && (
                    <div className="space-y-4">
                      {detailModal.data.map((station) => (
                        <div key={station.id} className="border border-zinc-100 rounded-2xl p-4 bg-zinc-50/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-base font-extrabold text-zinc-900">Station #{station.stationNo} — Platform #{station.platformNo}</h3>
                              <p className="text-sm text-zinc-500 font-semibold">Standard Lab Platform</p>
                              {(!station.isAvailable && (station.occupiedBy || station.modelNo || station.testRequestId)) && (
                                <p className="text-[13px] text-indigo-600 font-black mt-2 bg-indigo-50/80 px-3 py-1.5 rounded-lg inline-block border border-indigo-100/50">
                                  Occupied By: <span className="text-zinc-900">{station.occupiedBy || `REQ-${station.testRequestId}`}</span> {station.modelNo ? `(${station.modelNo})` : ''}
                                </p>
                              )}
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase ${station.isAvailable ? 'bg-sky-50 text-sky-700' : 'bg-rose-50 text-rose-700'}`}>
                              {station.isAvailable ? 'Free' : 'Busy'}
                            </span>
                          </div>
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