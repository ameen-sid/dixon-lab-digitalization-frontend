import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { apiConnector } from '../../services/apiConnector';
import { getCapas } from '../../services/operations/capaService';
import { getTestingEquipments } from '../../services/operations/testingEquipmentService';
import { getPlatforms } from '../../services/operations/platformAvailabilityService';
import { ClipboardList, CheckCircle, Clock, XCircle, AlertTriangle, FileText, Activity, RotateCw, TrendingDown, TrendingUp } from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Helpers ──────────────────────────────────────────────────────────────────
const isCompleted = (s: string) => ['pass','fail','partial','completed','testing_passed','testing_failed','testing_partial'].includes(s.toLowerCase());
const isFailed    = (s: string) => ['fail','testing_failed'].includes(s.toLowerCase());
const isPending   = (s: string) => ['pending_approval','under_inspection','under_test','under_testing','inspection_completed'].includes(s.toLowerCase());

// ── Donut Chart ───────────────────────────────────────────────────────────────
function Donut({ segments, size = 100 }: { segments: {value: number; color: string; label: string}[]; size?: number }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = 36; const cx = 50; const cy = 50; const stroke = 14;
  let offset = 0;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dash = pct * circ;
        const gap = circ - dash;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color}
            strokeWidth={stroke} strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset * circ} strokeLinecap="butt"
            style={{ transformOrigin: '50px 50px', transform: 'rotate(-90deg)' }} />
        );
        offset += pct;
        return el;
      })}
      <text x="50" y="54" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#18181b">{total}</text>
    </svg>
  );
}

// ── Bar Chart (vertical) ──────────────────────────────────────────────────────
function BarChart({ data, color = '#11236a' }: { data: {label: string; value: number}[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-28 w-full mt-2 px-1">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <span className="text-[9px] font-bold text-zinc-600">{d.value || ''}</span>
          <div className="w-full rounded-t-md" style={{ height: `${Math.max((d.value / max) * 90, d.value > 0 ? 4 : 0)}px`, backgroundColor: color, opacity: 0.85 }} />
          <span className="text-[8px] text-zinc-500 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Spark({ data, color = '#11236a' }: { data: number[]; color?: string }) {
  if (data.every(v => v === 0)) return <div className="h-10 flex items-center justify-center text-[10px] text-zinc-400">No data</div>;
  const max = Math.max(...data, 1); const w = 300; const h = 48;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 6) - 3}`).join(' ');
  const id = `sp${color.replace('#','')}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{height: 48}}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.2"/><stop offset="100%" stopColor={color} stopOpacity="0"/>
      </linearGradient></defs>
      <path d={`M0,${h} L${pts.split(' ').join(' L')} L${w},${h} Z`} fill={`url(#${id})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── H-Bar Row ─────────────────────────────────────────────────────────────────
function HBar({ label, value, max, color = '#11236a' }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 shrink-0 text-zinc-700 font-semibold truncate">{label}</span>
      <div className="flex-1 bg-zinc-100 h-2 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{width:`${pct}%`, backgroundColor: color}}/>
      </div>
      <span className="w-5 text-right font-bold text-zinc-600">{value}</span>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPI({ icon: Icon, label, value, sub, iconCls, trend }: {icon:any; label:string; value:string|number; sub?:string; iconCls:string; trend?:'up'|'down'}) {
  return (
    <div className="bg-white border border-zinc-200/50 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconCls}`}><Icon className="w-4.5 h-4.5"/></div>
        {trend === 'up' && <span className="text-emerald-600 bg-emerald-50 rounded-full px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-0.5"><TrendingUp className="w-3 h-3"/>Up</span>}
        {trend === 'down' && <span className="text-rose-600 bg-rose-50 rounded-full px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-0.5"><TrendingDown className="w-3 h-3"/>Risk</span>}
      </div>
      <div>
        <h4 className="text-2xl font-extrabold text-zinc-900">{value}</h4>
        <p className="text-xs text-zinc-500 font-medium">{label}</p>
        {sub && <p className="text-[10px] text-zinc-400">{sub}</p>}
      </div>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm">
      <h3 className="text-sm font-extrabold text-zinc-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{backgroundColor: color}}/>
      <span className="text-zinc-600">{label}</span>
      <span className="ml-auto font-bold text-zinc-800">{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function CeoDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [capas,    setCapas]    = useState<any[]>([]);
  const [equipment,setEquipment]= useState<any[]>([]);
  const [platforms,setPlatforms]= useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [reqRes, caps, eqps, plats] = await Promise.all([
        // Use apiConnector directly with limit=1000 to bypass the default limit of 10
        apiConnector('GET', '/api/v1/test-requests?limit=1000').catch(() => ({ data: { data: [] } })),
        getCapas()().catch(() => []),
        getTestingEquipments({ limit: 500 })().catch(() => []),
        getPlatforms()().catch(() => []),
      ]);
      const reqs = (reqRes as any)?.data?.data || (reqRes as any)?.data || [];
      setRequests(Array.isArray(reqs) ? reqs : []);
      setCapas(Array.isArray(caps) ? caps : []);
      setEquipment(Array.isArray(eqps) ? eqps : []);
      setPlatforms(Array.isArray(plats) ? plats : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const total     = requests.length;
  const pending   = requests.filter(r => isPending(r.status)).length;
  const completed = requests.filter(r => isCompleted(r.status)).length;
  const failed    = requests.filter(r => isFailed(r.status)).length;
  const rejected  = requests.filter(r => r.status?.toLowerCase() === 'rejected').length;
  const retest    = requests.filter(r => r.status?.toLowerCase() === 'retest').length;
  const passed    = requests.filter(r => ['pass','testing_passed'].includes(r.status?.toLowerCase())).length;
  const partial   = requests.filter(r => ['partial','testing_partial'].includes(r.status?.toLowerCase())).length;
  const underTest = requests.filter(r => ['under_test','under_testing'].includes(r.status?.toLowerCase())).length;

  const capaOpen  = capas.filter(c => c.status?.toLowerCase() === 'open').length;
  const capaInProg= capas.filter(c => ['in_progress','inprogress','in progress'].includes(c.status?.toLowerCase())).length;
  const capaClosed= capas.filter(c => ['closed','resolved','completed'].includes(c.status?.toLowerCase())).length;
  const capaTotal = capas.length;

  const avgDays = (() => {
    const done = requests.filter(r => isCompleted(r.status));
    if (!done.length) return 0;
    const sum = done.reduce((a, r) => a + (new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()), 0);
    return Math.round(sum / done.length / 86400000);
  })();

  // ── Equipment ─────────────────────────────────────────────────────────────
  const eqTotal    = equipment.length;
  const eqAvail    = equipment.filter(e => e.isAvailable === true && !['maintenance','under_maintenance'].includes(e.status?.toLowerCase())).length;
  const eqOccupied = equipment.filter(e => e.isAvailable === false).length;
  const eqMaint    = equipment.filter(e => ['maintenance','under_maintenance'].includes(e.status?.toLowerCase())).length;

  // ── Platforms ──────────────────────────────────────────────────────────────
  const stTotal    = platforms.length;
  const stAvail    = platforms.filter(p => p.isAvailable === true).length;
  const stOccupied = platforms.filter(p => p.isAvailable === false).length;

  // ── Department breakdown ───────────────────────────────────────────────────
  const deptMap: Record<string,number> = {};
  requests.forEach(r => {
    const d = r.requester?.department?.name || 'N/A';
    deptMap[d] = (deptMap[d] || 0) + 1;
  });
  const deptData = Object.entries(deptMap).map(([label,value]) => ({label,value})).sort((a,b)=>b.value-a.value).slice(0,8);

  // ── Test type breakdown (by assignedTo/engineer or testMethodRef) ──────────
  const ttMap: Record<string,number> = {};
  requests.forEach(r => {
    const key = r.testMethodRef?.split(' ')[0]?.split('/')[0]?.trim() || r.brandName || 'Other';
    const label = key.length > 12 ? key.slice(0,12)+'…' : key;
    ttMap[label] = (ttMap[label] || 0) + 1;
  });
  const ttData = Object.entries(ttMap).map(([label,value]) => ({label,value})).sort((a,b)=>b.value-a.value).slice(0,6);

  // ── Monthly (last 6) ──────────────────────────────────────────────────────
  const now = new Date();
  const last6 = Array.from({length:6}, (_,i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5-i), 1);
    return { label: MONTHS[d.getMonth()], y: d.getFullYear(), m: d.getMonth() };
  });

  const matchMonth = (dateStr: string, y: number, m: number) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getFullYear() === y && d.getMonth() === m;
  };

  const monthlyReqs   = last6.map(mo => ({ label: mo.label, value: requests.filter(r => matchMonth(r.createdAt, mo.y, mo.m)).length }));
  const monthlyFailed = last6.map(mo => ({ label: mo.label, value: requests.filter(r => isFailed(r.status) && matchMonth(r.createdAt, mo.y, mo.m)).length }));
  const monthlyCapa   = last6.map(mo => ({ label: mo.label, value: capas.filter(c => matchMonth(c.createdAt, mo.y, mo.m)).length }));

  // ── Status donut segments ─────────────────────────────────────────────────
  const statusSegs = [
    { label: 'Pending',   value: pending,   color: '#f59e0b' },
    { label: 'Under Test',value: underTest,  color: '#6366f1' },
    { label: 'Passed',    value: passed,     color: '#10b981' },
    { label: 'Failed',    value: failed,     color: '#e11d48' },
    { label: 'Partial',   value: partial,    color: '#f97316' },
    { label: 'Rejected',  value: rejected,   color: '#71717a' },
    { label: 'Retest',    value: retest,     color: '#0ea5e9' },
  ].filter(s => s.value > 0);

  const capaSegs = [
    { label: 'Open',        value: capaOpen,   color: '#f59e0b' },
    { label: 'In Progress', value: capaInProg, color: '#6366f1' },
    { label: 'Closed',      value: capaClosed, color: '#10b981' },
  ].filter(s => s.value > 0);

  const eqSegs = [
    { label: 'Available', value: eqAvail,    color: '#10b981' },
    { label: 'Occupied',  value: eqOccupied, color: '#6366f1' },
    { label: 'Maintenance',value: eqMaint,   color: '#f59e0b' },
  ].filter(s => s.value > 0);

  const stSegs = [
    { label: 'Available', value: stAvail,    color: '#10b981' },
    { label: 'Occupied',  value: stOccupied, color: '#e11d48' },
  ].filter(s => s.value > 0);

  return (
    <DashboardLayout title="CEO Command Center" description="Executive overview — lab operations, test performance & quality trends.">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-extrabold text-zinc-900 tracking-tight">Executive Analytics Console</h2>
          <p className="text-[11px] text-zinc-500">Live data — Dixon Technology LIMS</p>
        </div>
        <button onClick={load} className="w-9 h-9 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-[#11236a] transition-all cursor-pointer outline-none border-none"><RotateCw className="w-4 h-4"/></button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-zinc-400 text-sm gap-2"><Activity className="w-5 h-5 animate-pulse"/>Loading dashboard…</div>
      ) : (
        <div className="space-y-5">
          {/* ── KPI Row ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <KPI icon={ClipboardList} label="Total Sample Requests" value={total} iconCls="bg-[#11236a]/10 text-[#11236a]"/>
            <KPI icon={Clock}        label="Pending Approvals"      value={pending} sub="Awaiting review" iconCls="bg-amber-500/10 text-amber-600"/>
            <KPI icon={CheckCircle}  label="Completed Tests"        value={completed} iconCls="bg-emerald-500/10 text-emerald-600" trend="up"/>
            <KPI icon={XCircle}      label="Failed Tests"           value={failed} sub={`${rejected} rejected`} iconCls="bg-rose-500/10 text-rose-600" trend={failed>0?'down':undefined}/>
            <KPI icon={AlertTriangle}label="Open CAPAs"             value={capaOpen} sub={`${capaClosed} closed`} iconCls="bg-orange-500/10 text-orange-600" trend={capaOpen>0?'down':undefined}/>
            <KPI icon={FileText}     label="Avg Completion"         value={`${avgDays}d`} sub="Calendar days" iconCls="bg-indigo-500/10 text-indigo-600"/>
          </div>

          {/* ── Row 2: Status Donuts ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card title="Test Request Status">
              <div className="flex items-center gap-4">
                <Donut segments={statusSegs.length ? statusSegs : [{value:1,color:'#e4e4e7',label:'None'}]} size={90}/>
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  {statusSegs.map(s=><Legend key={s.label} color={s.color} label={s.label} value={s.value}/>)}
                  {!statusSegs.length && <p className="text-xs text-zinc-400">No data</p>}
                </div>
              </div>
            </Card>
            <Card title="CAPA Status Breakdown">
              <div className="flex items-center gap-4">
                <Donut segments={capaSegs.length ? capaSegs : [{value:1,color:'#e4e4e7',label:'None'}]} size={90}/>
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  {capaSegs.map(s=><Legend key={s.label} color={s.color} label={s.label} value={s.value}/>)}
                  {!capaSegs.length && <p className="text-xs text-zinc-400">No CAPAs</p>}
                  <div className="mt-1 text-[10px] text-zinc-500 border-t border-zinc-100 pt-1">Total: {capaTotal}</div>
                </div>
              </div>
            </Card>
            <Card title="Equipment Utilization">
              <div className="flex items-center gap-4">
                <Donut segments={eqSegs.length ? eqSegs : [{value:1,color:'#e4e4e7',label:'None'}]} size={90}/>
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  {eqSegs.map(s=><Legend key={s.label} color={s.color} label={s.label} value={s.value}/>)}
                  {!eqSegs.length && <p className="text-xs text-zinc-400">No equipment</p>}
                  <div className="mt-1 text-[10px] text-zinc-500 border-t border-zinc-100 pt-1">Total: {eqTotal}</div>
                </div>
              </div>
            </Card>
            <Card title="Station Utilization">
              <div className="flex items-center gap-4">
                <Donut segments={stSegs.length ? stSegs : [{value:1,color:'#e4e4e7',label:'None'}]} size={90}/>
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  {stSegs.map(s=><Legend key={s.label} color={s.color} label={s.label} value={s.value}/>)}
                  {!stSegs.length && <p className="text-xs text-zinc-400">No platforms</p>}
                  <div className="mt-1 text-[10px] text-zinc-500 border-t border-zinc-100 pt-1">Total slots: {stTotal}</div>
                </div>
              </div>
            </Card>
          </div>

          {/* ── Row 3: Monthly bar charts ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title="Monthly Sample Requests">
              <BarChart data={monthlyReqs} color="#11236a"/>
            </Card>
            <Card title="Monthly Failure Trend">
              <BarChart data={monthlyFailed} color="#e11d48"/>
              <p className="text-[10px] text-zinc-400 mt-1">Total failed: {failed}</p>
            </Card>
            <Card title="Monthly CAPA Submissions">
              <BarChart data={monthlyCapa} color="#f59e0b"/>
              <p className="text-[10px] text-zinc-400 mt-1">Total CAPAs: {capaTotal}</p>
            </Card>
          </div>

          {/* ── Row 4: Dept + Test Type + Operational ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card title="Department-wise Request Summary">
              <div className="space-y-2.5 mt-1">
                {deptData.length > 0
                  ? deptData.map((d,i) => <HBar key={i} label={d.label} value={d.value} max={deptData[0].value} color="#11236a"/>)
                  : <p className="text-xs text-zinc-400 py-4 text-center">No department data</p>}
              </div>
            </Card>
            <Card title="Test Type Performance">
              <div className="space-y-2.5 mt-1">
                {ttData.length > 0
                  ? ttData.map((d,i) => <HBar key={i} label={d.label} value={d.value} max={ttData[0].value} color="#6366f1"/>)
                  : <p className="text-xs text-zinc-400 py-4 text-center">No test type data</p>}
              </div>
            </Card>
            <Card title="Operational Trend Summary">
              <div className="space-y-0">
                {[
                  { label: 'Total Requests',  value: total,     color: '#11236a', good: true },
                  { label: 'Pending',         value: pending,   color: '#f59e0b', good: pending <= 5 },
                  { label: 'Under Testing',   value: underTest, color: '#6366f1', good: true },
                  { label: 'Passed',          value: passed,    color: '#10b981', good: true },
                  { label: 'Failed',          value: failed,    color: '#e11d48', good: failed === 0 },
                  { label: 'Rejected',        value: rejected,  color: '#71717a', good: rejected === 0 },
                  { label: 'Retest',          value: retest,    color: '#0ea5e9', good: retest === 0 },
                  { label: 'CAPA Open',       value: capaOpen,  color: '#f59e0b', good: capaOpen === 0 },
                  { label: 'CAPA Closed',     value: capaClosed,color: '#10b981', good: true },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-zinc-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor: row.color}}/>
                      <span className="text-xs text-zinc-700 font-medium">{row.label}</span>
                    </div>
                    <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${row.good ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ── Row 5: Sparkline trends ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card title="Request Volume Trend (6 Months)">
              <Spark data={monthlyReqs.map(m=>m.value)} color="#11236a"/>
              <div className="flex justify-between text-[9px] text-zinc-400 px-0.5 mt-0.5">
                {monthlyReqs.map(m=><span key={m.label}>{m.label}</span>)}
              </div>
            </Card>
            <Card title="Failure Trend (6 Months)">
              <Spark data={monthlyFailed.map(m=>m.value)} color="#e11d48"/>
              <div className="flex justify-between text-[9px] text-zinc-400 px-0.5 mt-0.5">
                {monthlyFailed.map(m=><span key={m.label}>{m.label}</span>)}
              </div>
            </Card>
            <Card title="CAPA Submission Trend (6 Months)">
              <Spark data={monthlyCapa.map(m=>m.value)} color="#f59e0b"/>
              <div className="flex justify-between text-[9px] text-zinc-400 px-0.5 mt-0.5">
                {monthlyCapa.map(m=><span key={m.label}>{m.label}</span>)}
              </div>
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
