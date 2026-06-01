import { useNavigate } from 'react-router-dom';
import { Cpu, CheckSquare, BarChart2, ArrowRight, ShieldCheck, ClipboardList } from 'lucide-react';

interface EngineerDashboardOverviewProps {
	stats: {
		assignedCount: number;
		pendingCount: number;
		completedCount: number;
	};
}

export default function EngineerDashboardOverview({ stats }: EngineerDashboardOverviewProps) {
	const navigate = useNavigate();

	return (
		<div className="space-y-6">
			{/* Metric Cards Row */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{/* Card 1: Total Assigned */}
				<div className="bg-white border border-zinc-200/60 rounded-3xl p-6 flex items-center justify-between shadow-sm">
					<div>
						<span className="text-zinc-550 text-[10px] font-bold uppercase tracking-wider block">My Assigned Plans</span>
						<h3 className="text-3xl font-extrabold text-zinc-950 mt-1">{stats.assignedCount} Active</h3>
						<p className="text-zinc-500 text-xs mt-2 font-medium">Allotted by Lab Manager</p>
					</div>
					<div className="w-12 h-12 bg-indigo-50 text-[#11236a] rounded-2xl flex items-center justify-center border border-indigo-100">
						<Cpu className="w-5.5 h-5.5" />
					</div>
				</div>

				{/* Card 2: Pending Inspections */}
				<div className="bg-white border border-zinc-200/60 rounded-3xl p-6 flex items-center justify-between shadow-sm">
					<div>
						<span className="text-zinc-550 text-[10px] font-bold uppercase tracking-wider block">Awaiting Checklist</span>
						<h3 className="text-3xl font-extrabold text-rose-600 mt-1">{stats.pendingCount} Pending</h3>
						<p className="text-amber-600 text-xs mt-2 font-bold flex items-center gap-1">
							<ShieldCheck className="w-3.5 h-3.5" />
							Calibration pending setup
						</p>
					</div>
					<div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center border border-rose-100">
						<ClipboardList className="w-5.5 h-5.5" />
					</div>
				</div>

				{/* Card 3: Completed Inspections */}
				<div className="bg-white border border-zinc-200/60 rounded-3xl p-6 flex items-center justify-between shadow-sm sm:col-span-2 lg:col-span-1">
					<div>
						<span className="text-zinc-550 text-[10px] font-bold uppercase tracking-wider block">Completed Signoffs</span>
						<h3 className="text-3xl font-extrabold text-emerald-600 mt-1">{stats.completedCount} Certified</h3>
						<p className="text-emerald-600 text-xs mt-2 font-semibold">100% NABL diagnostics conform</p>
					</div>
					<div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100">
						<CheckSquare className="w-5.5 h-5.5" />
					</div>
				</div>
			</div>

			{/* Main action console panel */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				
				{/* Welcome/Workspace status card */}
				<div className="lg:col-span-2 bg-white border border-zinc-200/60 rounded-3xl p-8 shadow-sm flex flex-col justify-between items-start gap-6">
					<div className="space-y-3">
						<div className="w-12 h-12 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-500 shadow-sm">
							<BarChart2 className="w-6 h-6 text-emerald-600" />
						</div>
						<h2 className="text-lg font-extrabold text-zinc-900 tracking-tight">Engineer Workspace: Fully Synced</h2>
						<p className="text-zinc-500 text-xs font-semibold leading-relaxed">
							Welcome to the Testing Engineer Workspace. Active lab equipment logs, instrument feeds, diagnostics telemetry, and test plans are fully synchronized with the Lab Manager Control Hub. Select "Execute Inspections" below to access your active queue and submit visual calibration checklists.
						</p>
					</div>
					<button 
						onClick={() => navigate('/engineer/assigned-samples')}
						className="bg-[#11236a] text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-[#0c1a52] transition-all cursor-pointer active:scale-95 border-none outline-none flex items-center gap-1.5 shadow-sm"
					>
						Execute Inspections
						<ArrowRight className="w-4 h-4" />
					</button>
				</div>

				{/* Side telemetries / guidelines card */}
				<div className="bg-white border border-zinc-200/60 rounded-3xl p-6 shadow-sm space-y-4">
					<h4 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider border-b border-zinc-150 pb-2">
						NABL Verification Protocol
					</h4>
					<div className="text-[11px] font-semibold text-zinc-650 space-y-3">
						<div className="flex items-start gap-2">
							<span className="w-1.5 h-1.5 rounded-full bg-[#11236a] mt-1 shrink-0" />
							<p>Ensure sample dimensions and visual specs perfectly match description fields before allotting Sample ID.</p>
						</div>
						<div className="flex items-start gap-2">
							<span className="w-1.5 h-1.5 rounded-full bg-[#11236a] mt-1 shrink-0" />
							<p>Verify external accessories match packaging checklist indices conformant to IS/IEC standards.</p>
						</div>
						<div className="flex items-start gap-2">
							<span className="w-1.5 h-1.5 rounded-full bg-[#11236a] mt-1 shrink-0" />
							<p>Attach visual photographic evidence in multiple dimensions for any physical damage or void anomalies observed.</p>
						</div>
						<div className="flex items-start gap-2">
							<span className="w-1.5 h-1.5 rounded-full bg-[#11236a] mt-1 shrink-0" />
							<p>All completed calibrations compile instantly into reports for Lab Head final review.</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
