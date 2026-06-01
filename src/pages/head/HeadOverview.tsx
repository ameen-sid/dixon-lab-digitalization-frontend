import { ClipboardList, CheckCircle, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';

interface HeadOverviewProps {
	navigate: (path: string) => void;
}

export default function HeadOverview({ navigate }: HeadOverviewProps) {
	const kpis = [
		{
			label: 'Awaiting Approval',
			value: '6',
			sub: 'Pending your sign-off',
			color: 'amber',
			icon: ClipboardList,
		},
		{
			label: 'Completed Reports',
			value: '18',
			sub: 'Tests passed & released',
			color: 'emerald',
			icon: CheckCircle,
		},
		{
			label: 'Failed Tests',
			value: '3',
			sub: 'Awaiting failure decision',
			color: 'rose',
			icon: XCircle,
		},
		{
			label: 'Open CAPAs',
			value: '4',
			sub: 'Corrective actions pending',
			color: 'indigo',
			icon: AlertTriangle,
		},
	];

	const recentActivity = [
		{ id: 'REQ-2026-014', brand: 'Dixon PCB Module', status: 'PENDING_APPROVAL', date: '2026-05-30' },
		{ id: 'REQ-2026-013', brand: 'LED Driver Unit V2', status: 'COMPLETED', date: '2026-05-29' },
		{ id: 'REQ-2026-012', brand: 'SMT Control Board', status: 'REJECTED', date: '2026-05-28' },
		{ id: 'REQ-2026-011', brand: 'Relay Switch Pack', status: 'COMPLETED', date: '2026-05-27' },
		{ id: 'REQ-2026-010', brand: 'Thermal Sensor Array', status: 'PENDING_APPROVAL', date: '2026-05-26' },
	];

	const statusBadge = (status: string) => {
		if (status === 'COMPLETED') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
		if (status === 'PENDING_APPROVAL') return 'bg-amber-50 text-amber-700 border-amber-200';
		if (status === 'REJECTED') return 'bg-rose-50 text-rose-700 border-rose-100';
		return 'bg-zinc-50 text-zinc-600 border-zinc-200';
	};

	return (
		<div className="space-y-6">
			{/* KPI Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
				{kpis.map((kpi, i) => {
					const Icon = kpi.icon;
					const colors: Record<string, string> = {
						amber: 'bg-amber-50 text-amber-600 border-amber-100',
						emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
						rose: 'bg-rose-50 text-rose-600 border-rose-100',
						indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
					};
					return (
						<div key={i} className="bg-white border border-zinc-200/50 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
							<div>
								<span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">{kpi.label}</span>
								<h3 className="text-3xl font-bold text-zinc-900 mt-1">{kpi.value}</h3>
								<p className="text-zinc-500 text-xs mt-1 font-medium">{kpi.sub}</p>
							</div>
							<div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${colors[kpi.color]}`}>
								<Icon className="w-5 h-5" />
							</div>
						</div>
					);
				})}
			</div>

			{/* Recent Activity */}
			<div className="bg-white border border-zinc-200/50 rounded-2xl shadow-sm overflow-hidden">
				<div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
					<h3 className="text-sm font-bold text-zinc-900">Recent Request Activity</h3>
					<button
						onClick={() => navigate('/head/sample-tests')}
						className="flex items-center gap-1 text-[11px] font-bold text-[#11236a] hover:underline bg-transparent border-none outline-none cursor-pointer"
					>
						View all <ArrowRight className="w-3.5 h-3.5" />
					</button>
				</div>
				<table className="w-full text-xs">
					<thead>
						<tr className="bg-zinc-50 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
							<th className="py-3 px-6 text-left">Request ID</th>
							<th className="py-3 px-6 text-left">Product / Brand</th>
							<th className="py-3 px-6 text-left">Status</th>
							<th className="py-3 px-6 text-left">Date</th>
						</tr>
					</thead>
					<tbody>
						{recentActivity.map((item, i) => (
							<tr key={i} className="border-t border-zinc-100 hover:bg-zinc-50/50 transition-colors group">
								<td className="py-3.5 px-6 font-bold text-[#11236a]">{item.id}</td>
								<td className="py-3.5 px-6 text-zinc-700 font-medium">{item.brand}</td>
								<td className="py-3.5 px-6">
									<span className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge(item.status)}`}>
										<span className={`w-1.5 h-1.5 rounded-full ${item.status === 'COMPLETED' ? 'bg-emerald-500' : item.status === 'PENDING_APPROVAL' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`} />
										{item.status.replace(/_/g, ' ')}
									</span>
								</td>
								<td className="py-3.5 px-6 text-zinc-500 font-medium">{item.date}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
