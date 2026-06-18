import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
	Cpu, 
	CheckSquare, 
	ArrowRight, 
	ShieldCheck, 
	ClipboardList, 
	AlertTriangle, 
	Clock, 
	RotateCcw, 
	CheckCircle2, 
	XCircle, 
	Activity,
	Sliders
} from 'lucide-react';

interface ApprovedRequest {
	id: string;
	requestId: string;
	brandName: string;
	modelNo: string;
	testMethodRef: string;
	sampleDescription: string;
	sampleQty: number;
	status: string;
	approvedDate: string;
	engineerId?: string;
	engineerName?: string;
	sampleInspections?: any[];
	testPlans?: any[];
	testType?: { id: number; name: string } | null;
	inspectionResult?: string;
}

interface EngineerDashboardOverviewProps {
	requests: ApprovedRequest[];
}

export default function EngineerDashboardOverview({ requests }: EngineerDashboardOverviewProps) {
	const navigate = useNavigate();

	// Read compiled inspections dynamically from requests relations instead of localStorage
	const mergedReports = useMemo(() => {
		const reportsMap: { [key: string]: any } = {};
		requests.forEach(r => {
			if (r.sampleInspections) {
				r.sampleInspections.forEach((insp: any) => {
					reportsMap[`${r.id}-sample-${insp.sampleIndex}`] = {
						status: insp.status,
						remarks: insp.remarks,
						allottedId: insp.allottedId
					};
				});
			}
		});
		return reportsMap;
	}, [requests]);

	// 1. Calculate Metric Summary Stats
	let totalAssignedSamples = 0;
	let pendingSamples = 0;
	let inProgressSamples = 0;
	let passedInspections = 0;
	let failedInspections = 0;
	let partialInspections = 0;

	const activeTasksList: (ApprovedRequest & { passedCount: number; failedCount: number; pendingCount: number; isOverdue: boolean; daysText: string })[] = [];
	const recentSubmissionsList: (ApprovedRequest & { passedCount: number; failedCount: number; isPassed: boolean })[] = [];
	const retestRequestsList: ApprovedRequest[] = [];

	requests.forEach(r => {
		const qty = r.sampleQty || 1;
		totalAssignedSamples += qty;

		let passedCount = 0;
		let failedCount = 0;
		let pendingCount = 0;

		for (let i = 0; i < qty; i++) {
			const cacheKey = `${r.id}-sample-${i}`;
			const report = mergedReports[cacheKey];
			if (!report) {
				pendingCount++;
			} else if (report.status === 'PASSED') {
				passedCount++;
			} else if (report.status === 'FAILED') {
				failedCount++;
			}
		}

		// Check request completion state
		const isCompleted = [
			'INSPECTION_COMPLETED',
			'INSPECTION_FAILED',
			'UNDER_TESTING',
			'TESTING_PASSED',
			'TESTING_FAILED',
			'TESTING_PARTIAL',
			'RETEST',
			'COMPLETED',
			'FAILED',
			'REJECTED'
		].includes(r.status);

		// Flag retesting assignments
		const isRetest = r.status === 'RETEST' || r.status.includes('RETEST');
		if (isRetest) {
			retestRequestsList.push(r);
		}

		// Calculate SLA info
		const assignedDate = r.approvedDate ? new Date(r.approvedDate) : new Date();
		const today = new Date();
		const diffTime = today.getTime() - assignedDate.getTime();
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
		const daysLeft = 3 - diffDays;
		const isOverdue = !isCompleted && daysLeft < 0;
		const daysText = isOverdue 
			? `Overdue by ${Math.abs(daysLeft)}d` 
			: daysLeft <= 1 
				? `Due in ${daysLeft}d` 
				: `${daysLeft} days left`;

		// Compute task status standard classification
		let taskStatus = 'Pending';
		if (!isCompleted) {
			taskStatus = 'Pending';
		} else if (pendingCount > 0) {
			if (r.status === 'INSPECTION_FAILED' || r.status === 'FAILED') {
				taskStatus = 'Failed';
			} else if (['UNDER_TESTING', 'TESTING_PASSED', 'TESTING_FAILED', 'TESTING_PARTIAL', 'RETEST', 'COMPLETED'].includes(r.status || '')) {
				taskStatus = 'Passed';
			} else {
				taskStatus = 'Pending';
			}
		} else if (passedCount === qty) {
			taskStatus = 'Passed';
		} else if (failedCount === qty) {
			taskStatus = 'Failed';
		} else {
			taskStatus = 'Partial';
		}

		if (taskStatus === 'Passed') {
			passedInspections++;
		} else if (taskStatus === 'Failed') {
			failedInspections++;
		} else if (taskStatus === 'Partial') {
			partialInspections++;
		}

		if (isCompleted) {
			const hasFailed = taskStatus === 'Failed';
			recentSubmissionsList.push({
				...r,
				passedCount,
				failedCount,
				isPassed: !hasFailed
			});
		} else {
			// Sum sample-level counts for active requests
			pendingSamples += pendingCount;
			inProgressSamples += (passedCount + failedCount);

			activeTasksList.push({
				...r,
				passedCount,
				failedCount,
				pendingCount,
				isOverdue,
				daysText
			});
		}
	});

	// Sort recent submissions by date descending
	recentSubmissionsList.sort((a, b) => new Date(b.approvedDate).getTime() - new Date(a.approvedDate).getTime());

	return (
		<div className="space-y-6">
			{/* Metric Cards Row */}
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
				{/* Total Assigned Samples */}
				<div 
					onClick={() => navigate('/engineer/assigned-samples?status=All', { state: { stateFilter: 'All' } })}
					className="bg-white border border-zinc-200/60 rounded-3xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-[#11236a]/40 active:scale-[0.98]"
				>
					<div>
						<span className="text-zinc-555 text-[10px] font-extrabold uppercase tracking-wider block">Assigned Samples</span>
						<h3 className="text-2xl font-extrabold text-zinc-955 mt-1">{totalAssignedSamples} Samples</h3>
						<p className="text-zinc-500 text-[10px] mt-1 font-medium">{requests.length} Test Plans</p>
					</div>
					<div className="w-10 h-10 bg-indigo-50 text-[#11236a] rounded-xl flex items-center justify-center border border-indigo-100">
						<Cpu className="w-5 h-5" />
					</div>
				</div>

				{/* Pending Inspections */}
				<div 
					onClick={() => navigate('/engineer/assigned-samples?status=Pending', { state: { statusFilter: 'Pending' } })}
					className="bg-white border border-zinc-200/60 rounded-3xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-amber-600/40 active:scale-[0.98]"
				>
					<div>
						<span className="text-zinc-555 text-[10px] font-extrabold uppercase tracking-wider block">Pending</span>
						<h3 className="text-2xl font-extrabold text-amber-600 mt-1">{pendingSamples} Samples</h3>
						<p className="text-zinc-500 text-[10px] mt-1 font-medium">Not started yet</p>
					</div>
					<div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100">
						<Clock className="w-5 h-5" />
					</div>
				</div>

				{/* In-Progress Inspections */}
				<div 
					onClick={() => navigate('/engineer/assigned-samples?status=Pending', { state: { statusFilter: 'Pending' } })}
					className="bg-white border border-zinc-200/60 rounded-3xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-blue-600/40 active:scale-[0.98]"
				>
					<div>
						<span className="text-zinc-555 text-[10px] font-extrabold uppercase tracking-wider block">In Progress</span>
						<h3 className="text-2xl font-extrabold text-blue-600 mt-1">{inProgressSamples} Samples</h3>
						<p className="text-zinc-500 text-[10px] mt-1 font-medium">Started but not completed</p>
					</div>
					<div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
						<Activity className="w-5 h-5" />
					</div>
				</div>

				{/* Passed Inspections */}
				<div 
					onClick={() => navigate('/engineer/assigned-samples?status=Passed', { state: { statusFilter: 'Passed' } })}
					className="bg-white border border-zinc-200/60 rounded-3xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-emerald-600/40 active:scale-[0.98]"
				>
					<div>
						<span className="text-zinc-555 text-[10px] font-extrabold uppercase tracking-wider block">Passed</span>
						<h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{passedInspections} Requests</h3>
						<p className="text-zinc-500 text-[10px] mt-1 font-medium">All samples passed</p>
					</div>
					<div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
						<CheckSquare className="w-5 h-5" />
					</div>
				</div>

				{/* Failed Inspections */}
				<div 
					onClick={() => navigate('/engineer/assigned-samples?status=Failed', { state: { statusFilter: 'Failed' } })}
					className="bg-white border border-zinc-200/60 rounded-3xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-rose-600/40 active:scale-[0.98]"
				>
					<div>
						<span className="text-zinc-555 text-[10px] font-extrabold uppercase tracking-wider block">Failed</span>
						<h3 className="text-2xl font-extrabold text-rose-600 mt-1">{failedInspections} Requests</h3>
						<p className="text-zinc-500 text-[10px] mt-1 font-medium font-semibold">Samples failed checks</p>
					</div>
					<div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-100">
						<XCircle className="w-5 h-5" />
					</div>
				</div>

				{/* Partial Inspections */}
				<div 
					onClick={() => navigate('/engineer/assigned-samples?status=Partial', { state: { statusFilter: 'Partial' } })}
					className="bg-white border border-zinc-200/60 rounded-3xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-purple-600/40 active:scale-[0.98]"
				>
					<div>
						<span className="text-zinc-555 text-[10px] font-extrabold uppercase tracking-wider block">Partial</span>
						<h3 className="text-2xl font-extrabold text-purple-600 mt-1">{partialInspections} Requests</h3>
						<p className="text-zinc-500 text-[10px] mt-1 font-medium">Mixed compliance status</p>
					</div>
					<div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center border border-purple-100">
						<Sliders className="w-5 h-5" />
					</div>
				</div>
			</div>

			{/* Main Workspace Layout */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left Columns - Active queue and submissions */}
				<div className="lg:col-span-2 space-y-6">
					
					{/* Active Work Queue */}
					<div className="bg-white border border-zinc-200/60 rounded-3xl shadow-sm overflow-hidden p-1">
						<div className="p-5 border-b border-zinc-100 flex items-center justify-between">
							<div>
								<h3 className="text-sm font-extrabold text-zinc-900">Active Calibration Queue</h3>
								<p className="text-[11px] text-zinc-500 font-semibold mt-0.5">Assigned inspection tasks awaiting your action.</p>
							</div>
							<button 
								onClick={() => navigate('/engineer/assigned-samples')}
								className="text-xs font-bold text-[#11236a] hover:text-[#0c1a52] flex items-center gap-1 hover:underline transition-all bg-transparent border-none outline-none cursor-pointer"
							>
								View All Queue
								<ArrowRight className="w-4 h-4" />
							</button>
						</div>

						{activeTasksList.length === 0 ? (
							<div className="text-center py-12">
								<ShieldCheck className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
								<h4 className="text-xs font-bold text-zinc-800">Queue is Clear</h4>
								<p className="text-[11px] text-zinc-500 font-light mt-0.5">All assigned inspections have been compiled and submitted.</p>
							</div>
						) : (
							<div className="divide-y divide-zinc-100 max-h-[360px] overflow-y-auto">
								{activeTasksList.map(task => (
									<div 
										key={task.id} 
										className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/40 transition-all cursor-pointer"
										onClick={() => navigate(`/engineer/assigned-samples`)}
									>
										<div className="space-y-1 min-w-0">
											<div className="flex items-center gap-2">
												<span className="font-extrabold text-xs text-zinc-905">{task.requestId}</span>
												<span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
													task.isOverdue 
														? 'bg-rose-50 text-rose-700 border-rose-100' 
														: 'bg-zinc-50 text-zinc-600 border-zinc-200'
												}`}>
													{task.daysText}
												</span>
											</div>
											<h4 className="text-xs font-bold text-zinc-800 truncate">{task.brandName} - <span className="text-zinc-500 font-semibold">{task.modelNo}</span></h4>
											<p className="text-[10px] text-zinc-400 font-medium truncate max-w-sm" title={task.testMethodRef}>
												Standard: {task.testMethodRef}
											</p>
										</div>

										<div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
											<div className="text-right">
												<span className="inline-block text-[10px] font-extrabold px-2 py-0.5 bg-indigo-50 text-[#11236a] rounded-lg">
													{task.sampleQty} pcs
												</span>
												<p className="text-[9px] text-zinc-500 font-semibold mt-1">
													{task.passedCount} pass / {task.failedCount} fail
												</p>
											</div>
											<button className="bg-[#11236a] text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg hover:bg-[#0c1a52] transition-all cursor-pointer border-none outline-none">
												Inspect
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Recent Submissions Log */}
					<div className="bg-white border border-zinc-200/60 rounded-3xl shadow-sm overflow-hidden p-1">
						<div className="p-5 border-b border-zinc-100">
							<h3 className="text-sm font-extrabold text-zinc-900">Recent Completed Submissions</h3>
							<p className="text-[11px] text-zinc-500 font-semibold mt-0.5">Logs of your compiled final inspection reports.</p>
						</div>

						{recentSubmissionsList.length === 0 ? (
							<div className="text-center py-10">
								<ClipboardList className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
								<h4 className="text-xs font-bold text-zinc-850">No Recent Submissions</h4>
								<p className="text-[11px] text-zinc-500 font-light mt-0.5 font-semibold">Completed reports will show up here once submitted.</p>
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full text-left border-collapse min-w-[500px]">
									<thead>
										<tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 font-bold text-[9px] uppercase tracking-wider">
											<th className="py-3 px-5">Request ID</th>
											<th className="py-3 px-5">Equipment Model</th>
											<th className="py-3 px-5 text-center">Submission Status</th>
											<th className="py-3 px-5 text-center">Date Submitted</th>
											<th className="py-3 px-5 text-right">Reference</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-zinc-100 text-[11px] font-semibold text-zinc-700">
										{recentSubmissionsList.slice(0, 5).map(sub => (
											<tr key={sub.id} className="hover:bg-zinc-50/30 transition-all">
												<td className="py-3 px-5 font-extrabold text-zinc-950">{sub.requestId}</td>
												<td className="py-3 px-5">
													<div className="font-extrabold text-zinc-900">{sub.brandName}</div>
													<span className="text-[9px] text-zinc-500 font-medium">{sub.modelNo}</span>
												</td>
												<td className="py-3 px-5 text-center">
													<span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full border ${
														sub.isPassed 
															? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
															: 'bg-rose-50 text-rose-700 border-rose-100'
													}`}>
														{sub.isPassed ? 'PASSED' : 'NON-COMPLIANT'}
													</span>
												</td>
												<td className="py-3 px-5 text-center text-zinc-500">{sub.approvedDate}</td>
												<td className="py-3 px-5 text-right text-zinc-500 max-w-[120px] truncate" title={sub.testMethodRef}>
													{sub.testMethodRef}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>

				{/* Right Column - Retesting, alerts, & guidelines */}
				<div className="space-y-6">
					
					{/* Retesting Assignments Section */}
					<div className="bg-white border border-zinc-200/60 rounded-3xl p-5 shadow-sm space-y-4">
						<div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
							<RotateCcw className="w-5 h-5 text-rose-600" />
							<div>
								<h4 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider">
									Retesting Queue
								</h4>
								<p className="text-[10px] text-zinc-500 font-semibold">Flagged for repeating tests</p>
							</div>
						</div>

						{retestRequestsList.length === 0 ? (
							<div className="py-6 text-center text-zinc-500">
								<ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
								<p className="text-[10px] font-semibold">No active retest assignments</p>
							</div>
						) : (
							<div className="space-y-3">
								{retestRequestsList.map(req => (
									<div key={req.id} className="p-3 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-1.5">
										<div className="flex items-center justify-between">
											<span className="text-[10px] font-extrabold text-rose-700">{req.requestId}</span>
											<span className="text-[9px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">Retest</span>
										</div>
										<h5 className="text-[11px] font-bold text-zinc-800 truncate">{req.brandName} - {req.modelNo}</h5>
										<p className="text-[9px] text-zinc-500 font-medium">{req.sampleDescription}</p>
									</div>
								))}
							</div>
						)}
					</div>

					{/* SLA Due Date Alerts & Exception Center */}
					<div className="bg-white border border-zinc-200/60 rounded-3xl p-5 shadow-sm space-y-4">
						<div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
							<AlertTriangle className="w-5 h-5 text-amber-500" />
							<div>
								<h4 className="text-xs font-extrabold text-zinc-905 uppercase tracking-wider">
									SLA & Due Date Warnings
								</h4>
								<p className="text-[10px] text-zinc-500 font-semibold">Priority and turnaround alerts</p>
							</div>
						</div>

						{activeTasksList.filter(t => t.isOverdue || t.daysText.includes('Due in 1d') || t.daysText.includes('Due in 0d')).length === 0 ? (
							<div className="py-6 text-center text-zinc-500">
								<CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
								<p className="text-[10px] font-semibold">All due tasks are on track</p>
							</div>
						) : (
							<div className="space-y-2">
								{activeTasksList.filter(t => t.isOverdue || t.daysText.includes('Due in 1d') || t.daysText.includes('Due in 0d')).map(task => (
									<div key={task.id} className="p-3 bg-amber-50/50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3">
										<div className="min-w-0">
											<span className="text-[9px] font-extrabold text-amber-800">{task.requestId}</span>
											<h5 className="text-[10px] font-bold text-zinc-800 truncate">{task.brandName}</h5>
										</div>
										<span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
											task.isOverdue 
												? 'bg-rose-100 text-rose-700' 
												: 'bg-amber-100 text-amber-800'
										}`}>
											{task.daysText}
										</span>
									</div>
								))}
							</div>
						)}
					</div>


				</div>
			</div>
		</div>
	);
}
