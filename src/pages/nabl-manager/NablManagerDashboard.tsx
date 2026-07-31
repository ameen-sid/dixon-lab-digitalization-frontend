import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../layouts/DashboardLayout';
import Pagination from '../../components/Pagination';
import CustomSelect from '../../components/CustomSelect';
import { getNablRequests } from '../../services/operations/nablRequestService';
import { 
	Activity, FileText, CheckCircle2, AlertCircle, RotateCw, ClipboardList, TrendingUp, PieChart as PieIcon, BarChart2, Layers
} from 'lucide-react';

// Monthly Trend Stacked Bar Chart Component
function MonthlyTrendChart({ data }: { data: { month: string; generated: number; testing: number; pass: number; fail: number }[] }) {
	const [hoveredMonth, setHoveredMonth] = useState<any | null>(null);

	const height = 220;
	const width = 620;
	const padding = { top: 20, right: 20, bottom: 40, left: 40 };

	const maxVal = Math.max(...data.map((d) => d.generated + d.testing + d.pass + d.fail), 4);
	const step = Math.max(1, Math.ceil(maxVal / 4));
	const yMax = step * 4;
	const yTicks = [0, step, step * 2, step * 3, step * 4];

	const chartHeight = height - padding.top - padding.bottom;
	const chartWidth = width - padding.left - padding.right;

	return (
		<div className="relative w-full overflow-x-auto">
			<svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[500px]" style={{ height: 210 }}>
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
								stroke="#f1f5f9"
								strokeWidth="1.5"
								strokeDasharray="4,4"
							/>
							<text
								x={padding.left - 10}
								y={y + 4}
								textAnchor="end"
								className="text-[10px] fill-zinc-400 font-extrabold"
							>
								{tick}
							</text>
						</g>
					);
				})}

				{/* Stacked Bars */}
				{data.map((d, i) => {
					const colWidth = chartWidth / Math.max(data.length, 1);
					const xCenter = padding.left + i * colWidth + colWidth / 2;
					const barWidth = Math.min(32, Math.max(18, colWidth * 0.45));

					const hPass = (d.pass / yMax) * chartHeight;
					const hFail = (d.fail / yMax) * chartHeight;
					const hTesting = (d.testing / yMax) * chartHeight;
					const hGen = (d.generated / yMax) * chartHeight;

					let currentY = padding.top + chartHeight;

					const yPass = currentY - hPass;
					currentY -= hPass;

					const yFail = currentY - hFail;
					currentY -= hFail;

					const yTesting = currentY - hTesting;
					currentY -= hTesting;

					const yGen = currentY - hGen;

					return (
						<g 
							key={d.month} 
							onMouseEnter={() => setHoveredMonth(d)} 
							onMouseLeave={() => setHoveredMonth(null)} 
							className="cursor-pointer"
						>
							{/* Track */}
							<rect
								x={xCenter - barWidth / 2}
								y={padding.top}
								width={barWidth}
								height={chartHeight}
								fill="#f8fafc"
								rx="6"
							/>

							{/* Pass (Emerald) */}
							{d.pass > 0 && (
								<rect x={xCenter - barWidth / 2} y={yPass} width={barWidth} height={hPass} fill="#10b981" rx="4" />
							)}
							{/* Fail (Rose) */}
							{d.fail > 0 && (
								<rect x={xCenter - barWidth / 2} y={yFail} width={barWidth} height={hFail} fill="#f43f5e" rx="4" />
							)}
							{/* Testing (Amber) */}
							{d.testing > 0 && (
								<rect x={xCenter - barWidth / 2} y={yTesting} width={barWidth} height={hTesting} fill="#f59e0b" rx="4" />
							)}
							{/* Generated (Blue) */}
							{d.generated > 0 && (
								<rect x={xCenter - barWidth / 2} y={yGen} width={barWidth} height={hGen} fill="#3b82f6" rx="4" />
							)}

							<text
								x={xCenter}
								y={padding.top + chartHeight + 20}
								textAnchor="middle"
								className="text-[10px] fill-zinc-500 font-extrabold"
							>
								{d.month}
							</text>
						</g>
					);
				})}
			</svg>

			{hoveredMonth && (
				<div className="absolute top-2 right-4 bg-zinc-900 text-white text-[11px] font-bold px-3.5 py-2 rounded-xl shadow-xl space-y-1 z-10 border border-zinc-800">
					<div className="text-zinc-400 font-extrabold uppercase text-[9px]">{hoveredMonth.month} Details</div>
					<div className="flex items-center gap-3">
						<span className="text-blue-400">Generated: {hoveredMonth.generated}</span>
						<span className="text-amber-400">Testing: {hoveredMonth.testing}</span>
						<span className="text-emerald-400">Pass: {hoveredMonth.pass}</span>
						<span className="text-rose-400">Fail: {hoveredMonth.fail}</span>
					</div>
				</div>
			)}
		</div>
	);
}

// Evaluation Status Donut Chart Component
function StatusDonutChart({ stats }: { stats: { pass: number; fail: number; testing: number; generated: number } }) {
	const total = stats.pass + stats.fail + stats.testing + stats.generated || 1;
	const passPct = Math.round((stats.pass / total) * 100);
	const failPct = Math.round((stats.fail / total) * 100);
	const testingPct = Math.round((stats.testing / total) * 100);
	const genPct = Math.max(0, 100 - passPct - failPct - testingPct);

	const radius = 40;
	const circumference = 2 * Math.PI * radius;

	const passLength = (stats.pass / total) * circumference;
	const failLength = (stats.fail / total) * circumference;
	const testingLength = (stats.testing / total) * circumference;
	const genLength = (stats.generated / total) * circumference;

	let offset = 0;
	const passOffset = offset;
	offset -= passLength;
	const failOffset = offset;
	offset -= failLength;
	const testingOffset = offset;
	offset -= testingLength;
	const genOffset = offset;

	return (
		<div className="flex flex-col sm:flex-row items-center justify-between gap-6">
			<div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
				<svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
					<circle cx="50" cy="50" r={radius} stroke="#f1f5f9" strokeWidth="12" fill="transparent" />

					{stats.pass > 0 && (
						<circle
							cx="50"
							cy="50"
							r={radius}
							stroke="#10b981"
							strokeWidth="12"
							fill="transparent"
							strokeDasharray={`${passLength} ${circumference - passLength}`}
							strokeDashoffset={passOffset}
							className="transition-all duration-500"
						/>
					)}

					{stats.fail > 0 && (
						<circle
							cx="50"
							cy="50"
							r={radius}
							stroke="#f43f5e"
							strokeWidth="12"
							fill="transparent"
							strokeDasharray={`${failLength} ${circumference - failLength}`}
							strokeDashoffset={failOffset}
							className="transition-all duration-500"
						/>
					)}

					{stats.testing > 0 && (
						<circle
							cx="50"
							cy="50"
							r={radius}
							stroke="#f59e0b"
							strokeWidth="12"
							fill="transparent"
							strokeDasharray={`${testingLength} ${circumference - testingLength}`}
							strokeDashoffset={testingOffset}
							className="transition-all duration-500"
						/>
					)}

					{stats.generated > 0 && (
						<circle
							cx="50"
							cy="50"
							r={radius}
							stroke="#3b82f6"
							strokeWidth="12"
							fill="transparent"
							strokeDasharray={`${genLength} ${circumference - genLength}`}
							strokeDashoffset={genOffset}
							className="transition-all duration-500"
						/>
					)}
				</svg>
				<div className="absolute inset-0 flex flex-col items-center justify-center text-center">
					<span className="text-2xl font-black text-[#11236a]">{stats.pass + stats.fail + stats.testing + stats.generated}</span>
					<span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Requests</span>
				</div>
			</div>

			<div className="space-y-2.5 w-full">
				<div className="flex items-center justify-between text-xs bg-emerald-50/60 border border-emerald-100 p-2.5 rounded-xl font-bold">
					<div className="flex items-center gap-2 text-emerald-900">
						<span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
						Completed (Pass)
					</div>
					<span className="text-emerald-700 font-extrabold">{stats.pass} ({passPct}%)</span>
				</div>

				<div className="flex items-center justify-between text-xs bg-rose-50/60 border border-rose-100 p-2.5 rounded-xl font-bold">
					<div className="flex items-center gap-2 text-rose-900">
						<span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
						Completed (Fail)
					</div>
					<span className="text-rose-700 font-extrabold">{stats.fail} ({failPct}%)</span>
				</div>

				<div className="flex items-center justify-between text-xs bg-amber-50/60 border border-amber-100 p-2.5 rounded-xl font-bold">
					<div className="flex items-center gap-2 text-amber-900">
						<span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
						Under Testing
					</div>
					<span className="text-amber-700 font-extrabold">{stats.testing} ({testingPct}%)</span>
				</div>

				<div className="flex items-center justify-between text-xs bg-blue-50/60 border border-blue-100 p-2.5 rounded-xl font-bold">
					<div className="flex items-center gap-2 text-blue-900">
						<span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
						Request Generated
					</div>
					<span className="text-blue-700 font-extrabold">{stats.generated} ({genPct}%)</span>
				</div>
			</div>
		</div>
	);
}

// Top Brands Horizontal Bar Chart Component
function TopBrandsChart({ brandCounts }: { brandCounts: { name: string; count: number }[] }) {
	const maxCount = Math.max(...brandCounts.map(b => b.count), 1);

	return (
		<div className="space-y-3">
			{brandCounts.length === 0 ? (
				<p className="text-xs text-zinc-400 italic text-center py-4">No brand metrics logged yet.</p>
			) : (
				brandCounts.map((b) => {
					const pct = Math.round((b.count / maxCount) * 100);
					return (
						<div key={b.name} className="space-y-1">
							<div className="flex items-center justify-between text-xs font-extrabold">
								<span className="text-zinc-800 truncate">{b.name}</span>
								<span className="text-[#11236a]">{b.count} reqs</span>
							</div>
							<div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
								<div
									className="h-full bg-gradient-to-r from-[#11236a] to-blue-500 rounded-full transition-all duration-500"
									style={{ width: `${pct}%` }}
								/>
							</div>
						</div>
					);
				})
			)}
		</div>
	);
}

export default function NablManagerDashboard() {
	const navigate = useNavigate();

	// Authentication validation
	const token = localStorage.getItem('token');
	const userStr = localStorage.getItem('user');

	useEffect(() => {
		if (!token || !userStr) {
			localStorage.clear();
			navigate('/');
			return;
		}
		const user = JSON.parse(userStr);
		const role = user.role ? user.role.toLowerCase() : 'requester';
		if (role !== 'nabl manager') {
			navigate('/dashboard', { replace: true });
		}
	}, [token, userStr, navigate]);

	// Component States
	const [requests, setRequests] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState('ALL');
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(20);

	const loadDashboardData = async () => {
		setLoading(true);
		try {
			const requestsData = await getNablRequests()();
			setRequests(requestsData || []);
		} catch (err) {
			console.error('Failed to load NABL manager dashboard data:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (token && userStr) {
			loadDashboardData();
		}
	}, [token, userStr]);

	const refreshData = async () => {
		await loadDashboardData();
		toast.success('NABL Dashboard data synchronized successfully.');
	};

	// Helper to check end date passed
	const isEndDatePassed = (req: any) => {
		if (!req.testPlan?.endDate) return false;
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const end = new Date(req.testPlan.endDate);
		end.setHours(23, 59, 59, 999);
		return today > end;
	};

	// Metrics Calculation
	const totalRequestsCount = requests.length;

	let countGenerated = 0;
	let countTesting = 0;
	let countPass = 0;
	let countFail = 0;

	requests.forEach((req) => {
		const isEnded = isEndDatePassed(req);
		const planEval = (req.testPlan?.status || req.status || '').toUpperCase();
		const isFail = ['FAILED', 'FAIL'].includes(planEval);

		if (!req.testPlan?.startDate) {
			countGenerated++;
		} else if (!isEnded) {
			countTesting++;
		} else if (isFail) {
			countFail++;
		} else {
			countPass++;
		}
	});

	// Monthly Trend Data Calculation (Last 6 Months)
	const monthlyTrendData = (() => {
		const monthsMap: { [key: string]: { month: string; generated: number; testing: number; pass: number; fail: number } } = {};
		const now = new Date();

		for (let i = 5; i >= 0; i--) {
			const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
			const monthLabel = d.toLocaleString('default', { month: 'short', year: '2-digit' });
			monthsMap[monthLabel] = { month: monthLabel, generated: 0, testing: 0, pass: 0, fail: 0 };
		}

		requests.forEach((req) => {
			if (!req.createdAt) return;
			const createdDate = new Date(req.createdAt);
			const monthLabel = createdDate.toLocaleString('default', { month: 'short', year: '2-digit' });

			if (monthsMap[monthLabel]) {
				const isEnded = isEndDatePassed(req);
				const planEval = (req.testPlan?.status || req.status || '').toUpperCase();
				const isFail = ['FAILED', 'FAIL'].includes(planEval);

				if (!req.testPlan?.startDate) {
					monthsMap[monthLabel].generated++;
				} else if (!isEnded) {
					monthsMap[monthLabel].testing++;
				} else if (isFail) {
					monthsMap[monthLabel].fail++;
				} else {
					monthsMap[monthLabel].pass++;
				}
			}
		});

		return Object.values(monthsMap);
	})();

	// Top Brands Calculation
	const topBrandsData = (() => {
		const brandMap: { [key: string]: number } = {};
		requests.forEach((r) => {
			const b = (r.brandName || 'Unspecified').trim();
			brandMap[b] = (brandMap[b] || 0) + 1;
		});
		return Object.entries(brandMap)
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 5);
	})();

	// Filtering for Table
	const filteredRequests = requests.filter((r) => {
		if (statusFilter === 'ALL') return true;

		const isEnded = isEndDatePassed(r);
		const planEval = (r.testPlan?.status || r.status || '').toUpperCase();
		const isFail = ['FAILED', 'FAIL'].includes(planEval);

		if (statusFilter === 'REQUEST_GENERATED') return !r.testPlan?.startDate;
		if (statusFilter === 'UNDER_TESTING') return r.testPlan?.startDate && !isEnded;
		if (statusFilter === 'PASS') return isEnded && !isFail;
		if (statusFilter === 'FAIL') return isEnded && isFail;

		return true;
	});

	const paginatedRequests = filteredRequests.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	// Status Badge rendering
	const getStatusBadge = (req: any) => {
		const isEnded = isEndDatePassed(req);
		const planEval = (req.testPlan?.status || req.status || '').toUpperCase();
		const isFail = ['FAILED', 'FAIL'].includes(planEval);

		if (!req.testPlan?.startDate) {
			return <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold border border-blue-100 uppercase tracking-wide">Request Generated</span>;
		}
		if (!isEnded) {
			return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold border border-amber-200/60 uppercase tracking-wide flex items-center gap-1 w-fit animate-pulse">Under Testing</span>;
		}
		if (isFail) {
			return <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full text-[10px] font-bold border border-rose-200 uppercase tracking-wide">Completed (Fail)</span>;
		}
		return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-200 uppercase tracking-wide">Completed (Pass)</span>;
	};

	return (
		<DashboardLayout
			title="NABL Manager Overview"
			description="Centralized NABL testing analytics, execution metrics, and testing queue distribution."
			activeTab="dashboard"
		>
			{loading ? (
				<div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
					<div className="w-10 h-10 border-4 border-[#11236a] border-t-transparent rounded-full animate-spin" />
					<p className="text-zinc-500 font-bold text-xs">Synchronizing NABL analytics telemetry...</p>
				</div>
			) : (
				<div className="space-y-7">
					{/* Header Banner */}
					<div className="relative bg-[#11236a] rounded-[24px] px-8 py-6 flex items-center justify-between overflow-hidden shadow-lg">
						<div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #6366f1 0%, transparent 60%)' }} />
						<div className="relative z-10">
							<p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">NABL Analytics & Operations Hub</p>
							<h1 className="text-white text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
								NABL Manager Analytics Dashboard
							</h1>
							<p className="text-white/50 text-xs mt-1 font-medium">Real-time testing metrics, timeline execution trends, and status analytics</p>
						</div>
						<button
							onClick={refreshData}
							title="Synchronize live stats"
							className="w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer outline-none active:scale-95 shrink-0"
						>
							<RotateCw className="w-4 h-4" />
						</button>
					</div>

					{/* 5 Key Metric KPI Cards */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
						<div className="bg-white border border-zinc-200/60 rounded-2xl p-4 shadow-sm flex items-center justify-between">
							<div>
								<span className="text-zinc-500 text-[10px] font-extrabold uppercase tracking-wider">Total Requests</span>
								<h3 className="text-2xl font-extrabold text-[#11236a] mt-0.5">{totalRequestsCount}</h3>
							</div>
							<div className="w-9 h-9 bg-zinc-100 text-[#11236a] rounded-xl flex items-center justify-center shrink-0">
								<Layers className="w-4 h-4" />
							</div>
						</div>

						<div className="bg-white border border-zinc-200/60 rounded-2xl p-4 shadow-sm flex items-center justify-between">
							<div>
								<span className="text-zinc-500 text-[10px] font-extrabold uppercase tracking-wider">Request Generated</span>
								<h3 className="text-2xl font-extrabold text-blue-600 mt-0.5">{countGenerated}</h3>
							</div>
							<div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 shrink-0">
								<ClipboardList className="w-4 h-4" />
							</div>
						</div>

						<div className="bg-white border border-zinc-200/60 rounded-2xl p-4 shadow-sm flex items-center justify-between">
							<div>
								<span className="text-zinc-500 text-[10px] font-extrabold uppercase tracking-wider">Under Testing</span>
								<h3 className="text-2xl font-extrabold text-amber-600 mt-0.5">{countTesting}</h3>
							</div>
							<div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100 shrink-0">
								<Activity className="w-4 h-4" />
							</div>
						</div>

						<div className="bg-white border border-zinc-200/60 rounded-2xl p-4 shadow-sm flex items-center justify-between">
							<div>
								<span className="text-zinc-500 text-[10px] font-extrabold uppercase tracking-wider">Completed (Pass)</span>
								<h3 className="text-2xl font-extrabold text-emerald-600 mt-0.5">{countPass}</h3>
							</div>
							<div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100 shrink-0">
								<CheckCircle2 className="w-4 h-4" />
							</div>
						</div>

						<div className="bg-white border border-zinc-200/60 rounded-2xl p-4 shadow-sm flex items-center justify-between">
							<div>
								<span className="text-zinc-500 text-[10px] font-extrabold uppercase tracking-wider">Completed (Fail)</span>
								<h3 className="text-2xl font-extrabold text-rose-600 mt-0.5">{countFail}</h3>
							</div>
							<div className="w-9 h-9 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-100 shrink-0">
								<AlertCircle className="w-4 h-4" />
							</div>
						</div>
					</div>

					{/* GRAPHS SECTION */}
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
						{/* Chart 1: Monthly Trend Stacked Bar Chart */}
						<div className="lg:col-span-7 bg-white border border-zinc-200/60 rounded-[28px] p-6 shadow-sm space-y-4">
							<div className="flex items-center justify-between border-b border-zinc-100 pb-4">
								<div>
									<h2 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2">
										<BarChart2 className="w-4 h-4 text-[#11236a]" />
										Monthly Testing Volume & Status Trend
									</h2>
									<p className="text-[11px] text-zinc-500 font-medium">Historical breakdown of NABL requests logged over the last 6 months</p>
								</div>
								<div className="flex items-center gap-3 text-[10px] font-extrabold">
									<span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Generated</span>
									<span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Testing</span>
									<span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Pass</span>
									<span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Fail</span>
								</div>
							</div>

							<MonthlyTrendChart data={monthlyTrendData} />
						</div>

						{/* Chart 2: Status Donut Chart & Distribution */}
						<div className="lg:col-span-5 bg-white border border-zinc-200/60 rounded-[28px] p-6 shadow-sm space-y-4">
							<div className="border-b border-zinc-100 pb-4">
								<h2 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2">
									<PieIcon className="w-4 h-4 text-[#11236a]" />
									Evaluation Outcome Distribution
								</h2>
								<p className="text-[11px] text-zinc-500 font-medium">Proportional distribution of current NABL testing evaluation statuses</p>
							</div>

							<StatusDonutChart stats={{ pass: countPass, fail: countFail, testing: countTesting, generated: countGenerated }} />
						</div>
					</div>

					{/* Top Brands & Registry Summary Section */}
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
						{/* Top Brands Card */}
						<div className="lg:col-span-4 bg-white border border-zinc-200/60 rounded-[28px] p-6 shadow-sm space-y-4">
							<div className="border-b border-zinc-100 pb-3">
								<h2 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2">
									<TrendingUp className="w-4 h-4 text-[#11236a]" />
									Top Tested Brands
								</h2>
								<p className="text-[11px] text-zinc-500 font-medium">Brands with highest volume of NABL test requests</p>
							</div>

							<TopBrandsChart brandCounts={topBrandsData} />
						</div>

						{/* NABL Testing Registry List */}
						<div className="lg:col-span-8 bg-white border border-zinc-200/60 rounded-[28px] p-6 shadow-sm space-y-4">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
								<div>
									<h2 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2">
										<FileText className="w-4 h-4 text-[#11236a]" />
										NABL Test Requests Overview
									</h2>
									<p className="text-[11px] text-zinc-500 font-medium">Live registry queue of incoming and processed requests</p>
								</div>

								<div className="w-44">
									<CustomSelect
										value={statusFilter}
										onChange={(val) => {
											setStatusFilter(val);
											setCurrentPage(1);
										}}
										options={[
											{ value: 'ALL', label: 'All Statuses' },
											{ value: 'REQUEST_GENERATED', label: 'Request Generated' },
											{ value: 'UNDER_TESTING', label: 'Under Testing' },
											{ value: 'PASS', label: 'Completed (Pass)' },
											{ value: 'FAIL', label: 'Completed (Fail)' },
										]}
									/>
								</div>
							</div>

							{filteredRequests.length === 0 ? (
								<div className="text-center py-10 bg-zinc-50/50 border border-dashed border-zinc-200 rounded-2xl">
									<p className="text-zinc-500 font-bold text-xs">No matching NABL test requests logged in the database.</p>
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full text-left border-collapse">
										<thead>
											<tr className="border-b border-zinc-200/80 bg-zinc-50/50">
												<th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Customer / Signature</th>
												<th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Brand / Model</th>
												<th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Sample Description</th>
												<th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-center">Qty</th>
												<th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Status</th>
											</tr>
										</thead>
										<tbody>
											{paginatedRequests.map((row: any) => (
												<tr key={row.id} className="border-b border-zinc-100 hover:bg-zinc-50/30 transition-colors">
													<td className="px-4 py-3.5 text-xs font-bold text-[#11236a]">
														<div>{row.customerNameAddress?.split('\n')[0] || 'Customer'}</div>
														<div className="text-[10px] text-zinc-400 font-semibold italic mt-0.5">{row.customerSignName || '—'}</div>
													</td>
													<td className="px-4 py-3.5 text-xs font-bold text-zinc-800">
														<div>{row.brandName}</div>
														<div className="text-[10px] text-zinc-500 font-medium">{row.modelNo}</div>
													</td>
													<td className="px-4 py-3.5 text-xs text-zinc-600 truncate max-w-xs" title={row.sampleDescription}>
														{row.sampleDescription}
													</td>
													<td className="px-4 py-3.5 text-xs font-bold text-zinc-700 text-center">{row.sampleQty}</td>
													<td className="px-4 py-3.5 text-xs">{getStatusBadge(row)}</td>
												</tr>
											))}
										</tbody>
									</table>

									<Pagination
										totalItems={filteredRequests.length}
										itemsPerPage={itemsPerPage}
										currentPage={currentPage}
										onPageChange={setCurrentPage}
										onItemsPerPageChange={(limit) => {
											setItemsPerPage(limit);
											setCurrentPage(1);
										}}
										itemNamePlural="NABL requests"
									/>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</DashboardLayout>
	);
}
