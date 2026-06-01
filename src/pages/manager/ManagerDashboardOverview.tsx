import { Activity, ClipboardList, CheckCircle, AlertTriangle, Users, TrendingUp } from 'lucide-react';

interface ManagerDashboardOverviewProps {
	setActiveTab: (tab: string) => void;
	stats: {
		approvedCount: number;
		assignedCount: number;
		completedCount: number;
		capaCount: number;
	};
}

export default function ManagerDashboardOverview({ setActiveTab, stats }: ManagerDashboardOverviewProps) {
	return (
		<div className="space-y-8">
			{/* Metric Cards Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				{/* Approved Requests Card */}
				<div 
					onClick={() => setActiveTab('approved-requests')}
					className="bg-white border border-zinc-200 hover:border-[#11236a]/30 rounded-2xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
				>
					<div>
						<span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Approved Requests</span>
						<h3 className="text-3xl font-extrabold text-zinc-900 mt-1">{stats.approvedCount}</h3>
						<p className="text-[#11236a] text-xs mt-2 font-bold group-hover:underline flex items-center gap-1">
							Assign Engineers <span className="transition-transform group-hover:translate-x-0.5">→</span>
						</p>
					</div>
					<div className="w-12 h-12 bg-blue-50 text-[#11236a] rounded-xl flex items-center justify-center border border-blue-100 group-hover:bg-[#11236a]/5 transition-colors shrink-0">
						<ClipboardList className="w-5.5 h-5.5" />
					</div>
				</div>

				{/* Assigned Samples Card */}
				<div 
					onClick={() => setActiveTab('assigned-samples')}
					className="bg-white border border-zinc-200 hover:border-violet-500/30 rounded-2xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
				>
					<div>
						<span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Assigned to Me</span>
						<h3 className="text-3xl font-extrabold text-zinc-900 mt-1">{stats.assignedCount}</h3>
						<p className="text-violet-600 text-xs mt-2 font-bold group-hover:underline flex items-center gap-1">
							Inspect Now <span className="transition-transform group-hover:translate-x-0.5">→</span>
						</p>
					</div>
					<div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center border border-violet-100 group-hover:bg-violet-100/5 transition-colors shrink-0">
						<Users className="w-5.5 h-5.5" />
					</div>
				</div>

				{/* Completed Inspections Card */}
				<div className="bg-white border border-zinc-200 rounded-2xl p-6 flex items-center justify-between shadow-sm shrink-0">
					<div>
						<span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Completed Reports</span>
						<h3 className="text-3xl font-extrabold text-zinc-900 mt-1">{stats.completedCount}</h3>
						<p className="text-emerald-600 text-xs mt-2 font-semibold flex items-center gap-1">
							<TrendingUp className="w-3.5 h-3.5" /> 100% certified accuracy
						</p>
					</div>
					<div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100 shrink-0">
						<CheckCircle className="w-5.5 h-5.5" />
					</div>
				</div>

				{/* CAPA Corrective Card */}
				<div 
					onClick={() => setActiveTab('capa-management')}
					className="bg-white border border-zinc-200 hover:border-amber-500/30 rounded-2xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
				>
					<div>
						<span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Active CAPA Reports</span>
						<h3 className="text-3xl font-extrabold text-zinc-900 mt-1">{stats.capaCount}</h3>
						<p className="text-amber-600 text-xs mt-2 font-bold group-hover:underline flex items-center gap-1">
							Manage CAPAs <span className="transition-transform group-hover:translate-x-0.5">→</span>
						</p>
					</div>
					<div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100 group-hover:bg-amber-100/5 transition-colors shrink-0">
						<AlertTriangle className="w-5.5 h-5.5" />
					</div>
				</div>
			</div>

			{/* Detailed Status Dashboard Panel */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Telemetry and System Uptime */}
				<div className="bg-white border border-zinc-200/60 rounded-3xl p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
					<div>
						<h3 className="text-sm font-extrabold text-zinc-950 uppercase tracking-wider">System Operations & Availability</h3>
						<p className="text-xs text-zinc-500 font-medium mt-1">Real-time status tracking of structural modules and testing telemetry channels.</p>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
						<div className="bg-zinc-50 border border-zinc-150 rounded-xl p-4 flex items-center justify-between">
							<div>
								<span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Platform Tracking</span>
								<h4 className="text-xl font-extrabold text-zinc-900 mt-0.5">140 Live Channels</h4>
								<span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1.5">
									<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> 93% Available
								</span>
							</div>
							<button 
								onClick={() => setActiveTab('platform-tracking')}
								className="text-xs font-bold text-[#11236a] hover:underline bg-white border border-zinc-200 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
							>
								Monitor
							</button>
						</div>

						<div className="bg-zinc-50 border border-zinc-150 rounded-xl p-4 flex items-center justify-between">
							<div>
								<span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Equipment Tracking</span>
								<h4 className="text-xl font-extrabold text-zinc-900 mt-0.5">4 NABL Chambers</h4>
								<span className="text-[10px] text-indigo-600 font-bold flex items-center gap-1 mt-1.5">
									<span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> 3 Idle / 1 Busy
								</span>
							</div>
							<button 
								onClick={() => setActiveTab('equipment-tracking')}
								className="text-xs font-bold text-[#11236a] hover:underline bg-white border border-zinc-200 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
							>
								Monitor
							</button>
						</div>
					</div>

					<div className="border-t border-zinc-100 pt-4 flex items-center justify-between text-xs text-zinc-650">
						<span>Baseline SMT Profile Oven Uptime: <strong className="text-emerald-600 font-extrabold">99.8%</strong></span>
						<span>Last calibration: 4 days ago</span>
					</div>
				</div>

				{/* Duty Engineers & Staff availability */}
				<div className="bg-white border border-zinc-200/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
					<div>
						<h3 className="text-sm font-extrabold text-zinc-950 uppercase tracking-wider">Supervised Staff Status</h3>
						<p className="text-xs text-zinc-500 font-medium mt-1">Active engineers currently on shift duty.</p>
					</div>

					<div className="space-y-3.5 my-6">
						{[
							{ name: 'Dr. Amit Patel', status: 'ACTIVE', load: '1 request active', spec: 'Vibration Spec' },
							{ name: 'Er. Rajesh Kumar', status: 'ACTIVE', load: '2 requests active', spec: 'Thermal Stress' },
							{ name: 'Er. Sunita Sharma', status: 'ON_LEAVE', load: 'Offline', spec: 'Signal Calibration' },
							{ name: 'Er. Vikram Singh', status: 'ACTIVE', load: 'Idle', spec: 'Environmental' },
						].map((eng, idx) => (
							<div key={idx} className="flex items-center justify-between border-b border-zinc-100/50 pb-2.5 last:border-0 last:pb-0">
								<div>
									<h4 className="text-xs font-bold text-zinc-900 leading-tight">{eng.name}</h4>
									<span className="text-[9px] text-zinc-500 font-semibold">{eng.spec} • {eng.load}</span>
								</div>
								<span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
									eng.status === 'ACTIVE' 
										? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
										: 'bg-zinc-100 text-zinc-500 border-zinc-200'
								}`}>
									{eng.status === 'ACTIVE' ? 'Active' : 'Offline'}
								</span>
							</div>
						))}
					</div>

					<div className="text-[10px] text-zinc-500 font-bold bg-[#f8fafc] border border-zinc-150 p-2.5 rounded-xl text-center">
						Shift Supervisor Duty: <strong>Lab Manager</strong> (On Duty)
					</div>
				</div>
			</div>

			{/* Welcome Info Board */}
			<div className="bg-white border border-zinc-200/50 rounded-3xl p-8 shadow-sm flex flex-col justify-center items-center text-center">
				<div className="w-14 h-14 bg-[#11236a]/5 border border-[#11236a]/10 rounded-2xl flex items-center justify-center text-[#11236a] mb-4">
					<Activity className="w-7 h-7" />
				</div>
				<h2 className="text-lg font-bold text-zinc-900 tracking-tight">Lab Operations Portal: Shift Active</h2>
				<p className="text-zinc-500 max-w-lg mt-2 text-sm font-light leading-relaxed">
					As a Lab Manager, you are responsible for checking recently approved sample requests, assigning specialized testing engineers, tracking platform/equipment occupancy, and resolving corrective action plans (CAPAs).
				</p>
			</div>
		</div>
	);
}
