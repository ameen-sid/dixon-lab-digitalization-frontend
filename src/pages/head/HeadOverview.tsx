import { useState, useEffect } from 'react';
import { 
	ClipboardList, 
	CheckCircle, 
	XCircle, 
	AlertTriangle, 
	ArrowRight, 
	RefreshCw, 
	FileText, 
	Layers, 
	FolderOpen, 
	HelpCircle,
	TrendingUp
} from 'lucide-react';
import { getTestRequests } from '../../services/operations/testRequestService';
import { getCapas } from '../../services/operations/capaService';

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
	sampleInspections?: any[];
	requester?: {
		id: number;
		name: string;
		username: string;
		role: string;
		department?: {
			id: number;
			name: string;
		} | null;
	} | null;
}

export default function HeadOverview({ navigate }: HeadOverviewProps) {
	const [requests, setRequests] = useState<RequestRecord[]>([]);
	const [capas, setCapas] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);

	const loadData = async () => {
		setLoading(true);
		try {
			// Fetch Test Requests
			const fetchOp = getTestRequests();
			const testRequestsData = await fetchOp();
			setRequests(testRequestsData || []);

			// Fetch CAPA reports
			const capasData = await getCapas()();
			setCapas(capasData || []);
		} catch (error) {
			console.error('Failed to load dashboard overview data:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	// Group/Filter Calculations
	const totalRequests = requests.length;
	const pendingApprovalsCount = requests.filter(r => r.status === 'PENDING_APPROVAL').length;
	const approvedRequestsCount = requests.filter(r => !['PENDING_APPROVAL', 'REJECTED'].includes(r.status)).length;
	const rejectedRequestsCount = requests.filter(r => r.status === 'REJECTED').length;

	// Completed Tests Pending Approval (PASS, FAIL, PARTIAL representing completed tests needing Lab Head certification/approval)
	const completedPendingApprovalCount = requests.filter(r => ['PASS', 'FAIL', 'PARTIAL'].includes(r.status)).length;

	// Failed tests pending decision (FAIL, TESTING_FAILED, or all samples failed AND status is NOT actioned/finalized)
	const failedTestsPendingDecisionCount = requests.filter((req: any) => {
		const statusLower = (req.status || '').toLowerCase();
		
		// If already finalized (completed, failed) or retest, it is no longer pending decision
		if (['completed', 'failed', 'retest'].includes(statusLower)) {
			return false;
		}

		const isFailedStatus = ['testing_failed', 'fail'].includes(statusLower);

		const qty = req.sampleQty || 1;
		let failedCount = 0;
		for (let i = 0; i < qty; i++) {
			const report = (req.sampleInspections || []).find((r: any) => Number(r.sampleIndex) === i);
			if (report && report.status === 'FAILED') {
				failedCount++;
			}
		}
		const isFullyFailed = failedCount === qty;
		return isFailedStatus || isFullyFailed;
	}).length;

	// CAPA reports pending review (status is NOT COMPLETED or DONE case-insensitively)
	const capasPendingReviewCount = capas.filter(c => 
		!['completed', 'done'].includes((c.status || '').toLowerCase())
	).length;

	// Department-wise request summary
	const departmentSummary: Record<string, { total: number; pending: number; completed: number }> = {};
	requests.forEach(req => {
		const deptName = req.requester?.department?.name || 'General / Unknown';
		if (!departmentSummary[deptName]) {
			departmentSummary[deptName] = { total: 0, pending: 0, completed: 0 };
		}
		departmentSummary[deptName].total++;
		if (req.status === 'PENDING_APPROVAL') {
			departmentSummary[deptName].pending++;
		} else if (['COMPLETED', 'PASS', 'FAIL', 'PARTIAL'].includes(req.status)) {
			departmentSummary[deptName].completed++;
		}
	});

	// Get 5 most recent requests
	const recentActivity = [...requests]
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
		.slice(0, 5);

	return (
		<div className="space-y-6">
			{/* Refresh Header widget */}
			<div className="flex items-center justify-between bg-white border border-zinc-200/50 rounded-2xl px-5 py-3 shadow-sm">
				<div>
					<p className="text-[#11236a] font-extrabold text-[11px] uppercase tracking-wider">Directorate Console</p>
					<p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Real-time laboratory testing queue & approval metrics.</p>
				</div>
				<button 
					onClick={loadData}
					disabled={loading}
					className="flex items-center gap-1.5 text-zinc-700 hover:text-[#11236a] text-[10px] font-extrabold bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-lg cursor-pointer outline-none transition-all disabled:opacity-50"
				>
					<RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
					<span>Sync Console</span>
				</button>
			</div>

			{/* Primary Metrics Grid (Total, Pending, Approved, Rejected) */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				{/* Total Requests */}
				<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-[#11236a]" />
					<div>
						<span className="text-zinc-500 text-[10px] font-extrabold uppercase tracking-wider">Total Received</span>
						<h3 className="text-2xl font-bold text-zinc-955 mt-1">{totalRequests}</h3>
						<p className="text-zinc-650 text-xs mt-1.5 font-semibold">Requests logged in system</p>
					</div>
					<div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 border border-blue-100 text-[#11236a]">
						<FolderOpen className="w-5 h-5" />
					</div>
				</div>

				{/* Pending Approvals */}
				<div 
					onClick={() => navigate('/head/sample-tests')}
					className="bg-white border border-zinc-200/50 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group"
				>
					<div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
					<div>
						<span className="text-zinc-500 text-[10px] font-extrabold uppercase tracking-wider">Pending Approvals</span>
						<h3 className="text-2xl font-bold text-zinc-955 mt-1">{pendingApprovalsCount}</h3>
						<p className="text-zinc-650 text-xs mt-1.5 font-semibold">Awaiting initial sign-off</p>
					</div>
					<div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-amber-50 border border-amber-100 text-amber-600">
						<ClipboardList className="w-5 h-5" />
					</div>
				</div>

				{/* Approved Requests */}
				<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
					<div>
						<span className="text-zinc-500 text-[10px] font-extrabold uppercase tracking-wider">Approved Requests</span>
						<h3 className="text-2xl font-bold text-zinc-955 mt-1">{approvedRequestsCount}</h3>
						<p className="text-zinc-650 text-xs mt-1.5 font-semibold">Active or finished cycles</p>
					</div>
					<div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 border border-emerald-100 text-emerald-600">
						<CheckCircle className="w-5 h-5" />
					</div>
				</div>

				{/* Rejected Requests */}
				<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
					<div>
						<span className="text-zinc-500 text-[10px] font-extrabold uppercase tracking-wider">Rejected Requests</span>
						<h3 className="text-2xl font-bold text-zinc-955 mt-1">{rejectedRequestsCount}</h3>
						<p className="text-zinc-650 text-xs mt-1.5 font-semibold">Requests turned down</p>
					</div>
					<div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-rose-50 border border-rose-100 text-rose-600">
						<XCircle className="w-5 h-5" />
					</div>
				</div>
			</div>

			{/* Review Pipelines Grid (Completed Tests Pending Approval, Failed Tests Pending Decision, CAPA Pending Review) */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* Pipeline 1: Completed Tests Pending Approval */}
				<div 
					onClick={() => navigate('/head/completed-reports')}
					className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between h-44 group relative"
				>
					<div>
						<span className="text-[10px] font-extrabold text-[#11236a] uppercase tracking-wider flex items-center gap-1.5">
							<CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
							Final Certification Pipeline
						</span>
						<h4 className="text-lg font-bold text-zinc-950 mt-3">Completed Tests Pending Sign-Off</h4>
						<p className="text-zinc-650 text-xs mt-1 font-semibold">Final test results ready for certificate release.</p>
					</div>
					<div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100">
						<span className="text-2xl font-black text-zinc-900">{completedPendingApprovalCount} pending</span>
						<span className="text-xs font-bold text-[#11236a] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
							Verify <ArrowRight className="w-3.5 h-3.5" />
						</span>
					</div>
				</div>

				{/* Pipeline 2: Failed Tests Pending Decision */}
				<div 
					onClick={() => navigate('/head/failure-decision')}
					className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between h-44 group relative"
				>
					<div>
						<span className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
							<AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
							Adjudication board
						</span>
						<h4 className="text-lg font-bold text-zinc-955 mt-3">Failed Tests Pending Decision</h4>
						<p className="text-zinc-650 text-xs mt-1 font-semibold">Failed plans requiring Retest or CAPA commands.</p>
					</div>
					<div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100">
						<span className="text-2xl font-black text-rose-700">{failedTestsPendingDecisionCount} pending</span>
						<span className="text-xs font-bold text-rose-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
							Adjudicate <ArrowRight className="w-3.5 h-3.5" />
						</span>
					</div>
				</div>

				{/* Pipeline 3: CAPA Reports Pending Review */}
				<div 
					onClick={() => navigate('/head/capa-reports')}
					className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between h-44 group relative"
				>
					<div>
						<span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
							<FileText className="w-4 h-4 text-indigo-600 shrink-0" />
							Quality Assurance Audits
						</span>
						<h4 className="text-lg font-bold text-zinc-955 mt-3">CAPA Reports Pending Review</h4>
						<p className="text-zinc-650 text-xs mt-1 font-semibold">Corrective reports submitted needing head approval.</p>
					</div>
					<div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100">
						<span className="text-2xl font-black text-indigo-700">{capasPendingReviewCount} pending</span>
						<span className="text-xs font-bold text-indigo-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
							Review <ArrowRight className="w-3.5 h-3.5" />
						</span>
					</div>
				</div>
			</div>

			{/* Department-wise Request Summary Table */}
			<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm">
				<div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
					<h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
						<Layers className="w-4 h-4 text-zinc-500" />
						Department-Wise Request Distribution Summary
					</h3>
					<span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#11236a] border border-blue-100">
						Live Grouping
					</span>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse min-w-[400px]">
						<thead>
							<tr className="border-b border-zinc-150 text-zinc-700 font-bold text-[9px] uppercase tracking-wider bg-zinc-50">
								<th className="py-2.5 px-3">Department Name</th>
								<th className="py-2.5 px-3 text-center">Total Requests Received</th>
								<th className="py-2.5 px-3 text-center">Pending Approvals</th>
								<th className="py-2.5 px-3 text-center">Finalized / Completed</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-zinc-100 text-xs font-semibold text-zinc-800">
							{Object.entries(departmentSummary).map(([dept, summary]) => (
								<tr key={dept} className="hover:bg-zinc-50/50 transition-colors">
									<td className="py-3 px-3 font-bold text-zinc-900">{dept}</td>
									<td className="py-3 px-3 text-center font-bold text-zinc-900">{summary.total}</td>
									<td className="py-3 px-3 text-center">
										<span className={`inline-block font-extrabold px-2.5 py-0.5 rounded-full text-[9px] ${
											summary.pending > 0 
												? 'bg-amber-50 text-amber-700 border border-amber-200' 
												: 'bg-zinc-100 text-zinc-500'
										}`}>
											{summary.pending}
										</span>
									</td>
									<td className="py-3 px-3 text-center">
										<span className="inline-block font-extrabold px-2.5 py-0.5 rounded-full text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-250">
											{summary.completed}
										</span>
									</td>
								</tr>
							))}
							{Object.keys(departmentSummary).length === 0 && (
								<tr>
									<td colSpan={4} className="py-8 text-center text-zinc-400 font-bold">
										No request data available for department analysis.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Recent Submissions Queue Activity (recent 5 requests) */}
			<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm">
				<div className="flex items-center justify-between border-b border-zinc-100 pb-3.5 mb-4">
					<h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
						<TrendingUp className="w-4 h-4 text-zinc-500" />
						Recent Request Queue Activity (Last 5 Requests)
					</h3>
					<button 
						onClick={() => navigate('/head/sample-tests')}
						className="text-xs font-bold text-[#11236a] hover:text-[#0c1a52] cursor-pointer border-none bg-transparent outline-none hover:underline flex items-center gap-1"
					>
						<span>Open Approval Queue</span>
						<ArrowRight className="w-3.5 h-3.5" />
					</button>
				</div>
				
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse min-w-[600px]">
						<thead>
							<tr className="border-b border-zinc-200 text-zinc-700 font-bold text-[10px] uppercase tracking-wider">
								<th className="pb-3 px-2">Request ID</th>
								<th className="pb-3 px-2">Department</th>
								<th className="pb-3 px-2">Product Description</th>
								<th className="pb-3 px-2">Test Standard / Method</th>
								<th className="pb-3 px-2">Quantity</th>
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
									<td className="py-3.5 px-2 font-bold text-zinc-800">
										<span className="text-[10px] font-bold text-zinc-900 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-md">
											{req.requester?.department?.name || 'General'}
										</span>
									</td>
									<td className="py-3.5 px-2">
										<p className="text-xs font-bold text-zinc-900 leading-tight">{req.brandName} - {req.modelNo}</p>
										<span className="text-[9px] text-zinc-650 font-bold uppercase">{req.customerNameAddress}</span>
									</td>
									<td className="py-3.5 px-2 text-zinc-700 font-semibold">{req.testMethodRef}</td>
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
									<td colSpan={7} className="py-12 text-center text-zinc-400 font-bold">
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
