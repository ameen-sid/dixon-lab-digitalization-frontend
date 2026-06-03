import { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, XCircle, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { getTestRequests } from '../../services/operations/testRequestService';

interface HeadOverviewProps {
	navigate: (path: string) => void;
}

interface RequestRecord {
	id: number;
	requestId: string;
	customerNameAddress: string;
	brandName: string;
	modelNo: string;
	testMethodRef: string;
	sampleQty: number;
	status: string;
	createdAt: string;
}

export default function HeadOverview({ navigate }: HeadOverviewProps) {
	const [requests, setRequests] = useState<RequestRecord[]>([]);
	const [loading, setLoading] = useState(false);

	const loadData = async () => {
		setLoading(true);
		try {
			const fetchOp = getTestRequests();
			const data = await fetchOp();
			setRequests(data || []);
		} catch (error) {
			console.error('Failed to load dashboard overview data:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	// Calculate live KPIs
	const awaitingApprovalCount = requests.filter(r => r.status === 'PENDING_APPROVAL' || ['PASS', 'FAIL', 'PARTIAL'].includes(r.status)).length;
	const completedCount = requests.filter(r => r.status === 'COMPLETED').length;
	const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;
	const inProgressCount = requests.filter(r => r.status === 'UNDER_INSPECTION' || r.status === 'UNDER_TEST').length;

	const kpis = [
		{
			label: 'Awaiting Approval',
			value: awaitingApprovalCount.toString(),
			sub: `${awaitingApprovalCount} pending your sign-off`,
			color: 'amber',
			icon: ClipboardList,
			path: '/head/sample-tests',
			bgIcon: 'bg-amber-50 border border-amber-100 text-amber-600'
		},
		{
			label: 'In Progress Tests',
			value: inProgressCount.toString(),
			sub: `${inProgressCount} in active test cycle`,
			color: 'indigo',
			icon: AlertTriangle,
			path: '/head/sample-tests',
			bgIcon: 'bg-indigo-50 border border-indigo-100 text-[#11236a]'
		},
		{
			label: 'Completed Reports',
			value: completedCount.toString(),
			sub: `${completedCount} successfully finalized`,
			color: 'emerald',
			icon: CheckCircle,
			path: '/head/completed-reports',
			bgIcon: 'bg-emerald-50 border border-emerald-100 text-emerald-600'
		},
		{
			label: 'Rejected Submissions',
			value: rejectedCount.toString(),
			sub: `${rejectedCount} requests rejected`,
			color: 'rose',
			icon: XCircle,
			path: '/head/sample-tests',
			bgIcon: 'bg-rose-50 border border-rose-100 text-rose-600'
		},
	];

	// Get 5 most recent requests
	const recentActivity = [...requests]
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
		.slice(0, 5);

	return (
		<div className="space-y-6">
			{/* Refresh Header widget */}
			<div className="flex items-center justify-between bg-white border border-zinc-200/50 rounded-2xl px-5 py-3 shadow-sm">
				<p className="text-zinc-700 font-bold text-[10px] uppercase tracking-wider">Telemetry & Console Heartbeat</p>
				<button 
					onClick={loadData}
					disabled={loading}
					className="flex items-center gap-1.5 text-zinc-700 hover:text-[#11236a] text-[10px] font-extrabold bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-lg cursor-pointer outline-none transition-all disabled:opacity-50"
				>
					<RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
					<span>Sync Dashboard</span>
				</button>
			</div>

			{/* Overview Summary Badges Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				{kpis.map((kpi, i) => {
					const Icon = kpi.icon;
					return (
						<div 
							key={i} 
							onClick={() => navigate(kpi.path)}
							className="bg-white border border-zinc-200/50 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
						>
							<div>
								<span className="text-zinc-700 text-[10px] font-bold uppercase tracking-wider">{kpi.label}</span>
								<h3 className="text-2xl font-bold text-zinc-955 mt-1">{kpi.value} Requests</h3>
								<p className="text-zinc-655 text-xs mt-2 font-medium">{kpi.sub}</p>
							</div>
							<div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${kpi.bgIcon}`}>
								<Icon className="w-5 h-5" />
							</div>
						</div>
					);
				})}
			</div>

			{/* Recent Submissions Feed */}
			<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm">
				<div className="flex items-center justify-between border-b border-zinc-100 pb-3.5 mb-4">
					<h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Recent Request Queue Activity</h3>
					<button 
						onClick={() => navigate('/head/sample-tests')}
						className="text-xs font-bold text-[#11236a] hover:text-[#0c1a52] cursor-pointer border-none bg-transparent outline-none hover:underline flex items-center gap-1"
					>
						<span>Open Approval Queue</span>
						<ArrowRight className="w-3.5 h-3.5" />
					</button>
				</div>
				
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse min-w-[500px]">
						<thead>
							<tr className="border-b border-zinc-200 text-zinc-700 font-bold text-[10px] uppercase tracking-wider">
								<th className="pb-3 px-2">ID</th>
								<th className="pb-3 px-2">Product Name</th>
								<th className="pb-3 px-2">Test Method</th>
								<th className="pb-3 px-2">Qty</th>
								<th className="pb-3 px-2">Status</th>
								<th className="pb-3 px-2 text-right">Action</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-700">
							{recentActivity.map((req) => (
								<tr key={req.id} className="hover:bg-zinc-50/50 transition-all group">
									<td className="py-3.5 px-2 font-bold text-zinc-800">
										{req.requestId || `REQ-00${req.id}`}
									</td>
									<td className="py-3.5 px-2">
										<p className="text-xs font-bold text-zinc-900 leading-tight">{req.brandName} - {req.modelNo}</p>
										<span className="text-[9px] text-zinc-650 font-bold uppercase">{req.customerNameAddress}</span>
									</td>
									<td className="py-3.5 px-2 text-zinc-700 font-medium">{req.testMethodRef}</td>
									<td className="py-3.5 px-2">
										<span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
											{req.sampleQty} pcs
										</span>
									</td>
									<td className="py-3.5 px-2">
										{(() => {
											const getStatusStyle = (status: string) => {
												switch (status) {
													case 'COMPLETED':
													case 'PASS':
													case 'TESTING_PASSED':
													case 'INSPECTION_COMPLETED':
														return 'bg-emerald-50 text-emerald-600 border-emerald-100';
													case 'FAIL':
													case 'TESTING_FAILED':
													case 'REJECTED':
														return 'bg-rose-50 text-rose-600 border-rose-100';
													case 'PARTIAL':
													case 'TESTING_PARTIAL':
														return 'bg-amber-50 text-amber-600 border-amber-100';
													case 'UNDER_TEST':
													case 'UNDER_TESTING':
														return 'bg-indigo-50 text-indigo-600 border-indigo-100';
													case 'UNDER_INSPECTION':
														return 'bg-blue-50 text-blue-600 border-blue-100';
													case 'PENDING_APPROVAL':
														return 'bg-amber-50/70 text-amber-700 border-amber-200';
													default:
														return 'bg-zinc-50 text-zinc-650 border-zinc-100';
												}
											};
											return (
												<span className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusStyle(req.status)}`}>
													{['COMPLETED', 'PASS', 'TESTING_PASSED', 'INSPECTION_COMPLETED'].includes(req.status) && <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />}
													{['FAIL', 'TESTING_FAILED', 'REJECTED'].includes(req.status) && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
													{['PARTIAL', 'TESTING_PARTIAL'].includes(req.status) && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
													{['UNDER_TEST', 'UNDER_TESTING'].includes(req.status) && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />}
													{req.status === 'UNDER_INSPECTION' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
													{req.status === 'PENDING_APPROVAL' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
													{req.status === 'PASS' || req.status === 'TESTING_PASSED' 
														? 'TESTING PASSED' 
														: req.status === 'FAIL' || req.status === 'TESTING_FAILED' 
															? 'TESTING FAILED' 
															: req.status === 'PARTIAL' || req.status === 'TESTING_PARTIAL' 
																? 'TESTING PARTIAL' 
																: req.status.replace('_', ' ')}
												</span>
											);
										})()}
									</td>
									<td className="py-3.5 px-2 text-right">
										<button 
											onClick={() => navigate(`/head/sample-tests/${req.id}`)}
											className="text-xs font-bold text-[#11236a] hover:text-[#0c1a52] cursor-pointer group-hover:underline bg-transparent border-none outline-none"
										>
											Open Detail
										</button>
									</td>
								</tr>
							))}
							
							{recentActivity.length === 0 && (
								<tr>
									<td colSpan={6} className="py-12 text-center text-zinc-400 font-bold">
										No recent requests submitted.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
