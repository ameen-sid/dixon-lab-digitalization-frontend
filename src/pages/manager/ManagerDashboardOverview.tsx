import { useState, useMemo } from 'react';
import { 
	ClipboardList, 
	AlertTriangle, 
	Cpu, 
	ShieldCheck
} from 'lucide-react';

interface ManagerDashboardOverviewProps {
	navigate: (path: string) => void;
	requests: any[];
	capas: any[];
	engineers: any[];
}

export default function ManagerDashboardOverview({ navigate, requests, capas, engineers: _engineers }: ManagerDashboardOverviewProps) {
	// Retrieve manager user details
	const userStr = localStorage.getItem('user');
	const managerUser = userStr ? JSON.parse(userStr) : null;
	const managerId = managerUser ? String(managerUser.id) : '';

	// Active tab for the test plans breakdown
	const [activePlanTab, setActivePlanTab] = useState<'pending' | 'active' | 'completed' | 'failed'>('active');

	// 1. Approved Sample Requests Summary (not assigned to any engineer)
	const approvedRequests = requests.filter(r => !r.engineerId);

	// 2. Test Plans Categorization
	const pendingTestPlans = requests.filter(r => ['UNDER_INSPECTION', 'INSPECTION_COMPLETED', 'PENDING_TEST_PLAN', 'RETEST'].includes((r.status || '').toUpperCase()));
	const activeTestPlans = requests.filter(r => ['UNDER_TESTING', 'UNDER_TEST'].includes((r.status || '').toUpperCase()));
	const completedTestPlans = requests.filter(r => ['TESTING_PASSED', 'PASS', 'COMPLETED', 'TESTING_PARTIAL', 'PARTIAL'].includes((r.status || '').toUpperCase()));
	const failedTestPlans = requests.filter(r => ['TESTING_FAILED', 'FAIL', 'FAILED'].includes((r.status || '').toUpperCase()));

	// Calculate sum of sample quantities for active test plans
	const activeTestPlansSamplesCount = activeTestPlans.reduce((acc, r) => acc + (r.sampleQty || 1), 0);

	// 4. Samples inspected by Lab Manager
	const inspectedByManager = requests.filter(r => r.engineerId === managerId && ['UNDER_TEST', 'UNDER_TESTING', 'TESTING_PASSED', 'TESTING_FAILED', 'TESTING_PARTIAL', 'PASS', 'FAIL', 'PARTIAL', 'COMPLETED'].includes((r.status || '').toUpperCase()));

	// 5. Samples assigned to Engineers
	const assignedToEngineers = requests.filter(r => !!r.engineerId && r.engineerId !== managerId);

	// 6. Pending CAPA Reports
	const pendingCapas = capas.filter(c => (c.status || '').toUpperCase() !== 'COMPLETED');

	// 7. Pending Reports to Evaluate (submitted by engineer but not yet evaluated)
	const pendingEvaluations = useMemo(() => {
		const list: any[] = [];
		requests.forEach(req => {
			const testTypeName = String(req.testType?.name || '').toLowerCase();
			const isReliability = testTypeName.includes('reliability');
			if (isReliability) return; // Only non-reliability has reports submitted by engineer

			const requestPlans = Array.isArray(req.testPlans) ? req.testPlans : [];
			const inspections = Array.isArray(req.sampleInspections) ? req.sampleInspections : [];

			requestPlans.forEach((plan: any) => {
				const isPlanEvaluated = plan.evaluationStatus === 'PASSED' || plan.evaluationStatus === 'FAILED';
				if (isPlanEvaluated) return;

				const sampleIdx = plan.sampleIndex;
				const insp = inspections.find((si: any) => Number(si.sampleIndex) === Number(sampleIdx));
				if (!insp) return;

				const isSubmitted = (insp.status || '').toUpperCase() === 'UNDER_REVIEW';
				if (isSubmitted) {
					list.push({
						req,
						plan,
						sampleIndex: sampleIdx,
						allottedId: plan.allottedId || `REQ-${req.id}-S${String(sampleIdx + 1).padStart(2, '0')}`
					});
				}
			});
		});
		return list;
	}, [requests]);

	return (
		<div className="space-y-8">
			{/* Metric Cards Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				{/* Approved Requests Card */}
				<div 
					onClick={() => navigate('/manager/approved-requests')}
					className="bg-white border border-zinc-200 hover:border-[#11236a]/30 rounded-2xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
				>
					<div>
						<span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Pending for Assign Engineer for Inspection</span>
						<h3 className="text-3xl font-extrabold text-zinc-900 mt-1">{approvedRequests.length}</h3>
						<p className="text-[#11236a] text-xs mt-2 font-bold group-hover:underline flex items-center gap-1">
							Assign Engineers <span className="transition-transform group-hover:translate-x-0.5">→</span>
						</p>
					</div>
					<div className="w-12 h-12 bg-blue-50 text-[#11236a] rounded-xl flex items-center justify-center border border-blue-100 group-hover:bg-[#11236a]/5 transition-colors shrink-0">
						<ClipboardList className="w-5.5 h-5.5" />
					</div>
				</div>

				{/* Active Test Plans Card */}
				<div 
					onClick={() => navigate('/manager/test-plans')}
					className="bg-white border border-zinc-200 hover:border-violet-500/30 rounded-2xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
				>
					<div>
						<span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Active Test Plans for Samples</span>
						<h3 className="text-3xl font-extrabold text-zinc-900 mt-1">{activeTestPlansSamplesCount}</h3>
						<p className="text-violet-600 text-xs mt-2 font-bold group-hover:underline flex items-center gap-1">
							Monitor Testing <span className="transition-transform group-hover:translate-x-0.5">→</span>
						</p>
					</div>
					<div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center border border-violet-100 group-hover:bg-violet-100/5 transition-colors shrink-0">
						<Cpu className="w-5.5 h-5.5" />
					</div>
				</div>

				{/* Inspected by Manager Card */}
				<div 
					onClick={() => navigate('/manager/assigned-samples')}
					className="bg-white border border-zinc-200 hover:border-emerald-500/30 rounded-2xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
				>
					<div>
						<span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">My Inspected Samples</span>
						<h3 className="text-3xl font-extrabold text-zinc-900 mt-1">{inspectedByManager.length}</h3>
						<p className="text-emerald-600 text-xs mt-2 font-bold group-hover:underline flex items-center gap-1">
							My Assignments <span className="transition-transform group-hover:translate-x-0.5">→</span>
						</p>
					</div>
					<div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-100/5 transition-colors shrink-0">
						<ShieldCheck className="w-5.5 h-5.5" />
					</div>
				</div>

				{/* Total CAPA Reports Card */}
				<div 
					onClick={() => navigate('/manager/capa-management')}
					className="bg-white border border-zinc-200 hover:border-amber-500/30 rounded-2xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
				>
					<div>
						<span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Total CAPA Reports</span>
						<h3 className="text-3xl font-extrabold text-zinc-900 mt-1">{capas.length}</h3>
						<p className="text-amber-600 text-xs mt-2 font-bold group-hover:underline flex items-center gap-1">
							View Quality Actions <span className="transition-transform group-hover:translate-x-0.5">→</span>
						</p>
					</div>
					<div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100 group-hover:bg-amber-100/5 transition-colors shrink-0">
						<AlertTriangle className="w-5.5 h-5.5" />
					</div>
				</div>
			</div>

			{/* Main Grid Content */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				
				{/* Left Columns (Col Span 2) */}
				<div className="lg:col-span-2 space-y-6">
					
					{/* 1. Approved Sample Requests Summary */}
					<div className="bg-white border border-zinc-200/50 rounded-2xl p-6 shadow-sm space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Approved Sample Requests</h3>
								<p className="text-[11px] text-zinc-400 font-semibold mt-0.5">Recently approved sample requests requiring engineer allocation.</p>
							</div>
							<span className="text-[10px] font-extrabold px-2.5 py-1 bg-blue-50 text-[#11236a] border border-blue-100 rounded-full">
								{approvedRequests.length} Pending Assignment
							</span>
						</div>

						<div className="border border-zinc-100 rounded-xl overflow-hidden">
							<table className="w-full text-xs">
								<thead>
									<tr className="bg-zinc-50 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-100">
										<th className="py-2.5 px-4 text-left">Request ID</th>
										<th className="py-2.5 px-4 text-left">Brand & Product</th>
										<th className="py-2.5 px-4 text-left">Requester</th>
										<th className="py-2.5 px-4 text-right">Action</th>
									</tr>
								</thead>
								<tbody>
									{approvedRequests.slice(0, 3).map((req, i) => (
										<tr key={i} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-all">
											<td className="py-3 px-4 font-bold text-indigo-700">{req.requestId || req.id}</td>
											<td className="py-3 px-4">
												<p className="font-bold text-zinc-800">{req.brandName}</p>
												<p className="text-zinc-400 text-[10px] font-semibold mt-0.5">{req.sampleDescription}</p>
											</td>
											<td className="py-3 px-4 font-semibold text-zinc-650">{req.requesterName}</td>
											<td className="py-3 px-4 text-right">
												<button 
													onClick={() => navigate(`/manager/approved-requests/${req.id}`)}
													className="text-[10px] font-bold text-[#11236a] hover:underline bg-white border border-[#11236a]/20 px-2.5 py-1 rounded-lg cursor-pointer transition-all"
												>
													Assign
												</button>
											</td>
										</tr>
									))}
									{approvedRequests.length === 0 && (
										<tr>
											<td colSpan={4} className="py-8 text-center text-zinc-400 font-semibold">
												All approved sample requests have been successfully allocated.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</div>

					{/* Test Reports Pending Evaluation */}
					<div className="bg-white border border-zinc-200/50 rounded-2xl p-6 shadow-sm space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Reports Pending Evaluation</h3>
								<p className="text-[11px] text-zinc-400 font-semibold mt-0.5">Test reports submitted by engineers awaiting manager sign-off.</p>
							</div>
							<span className="text-[10px] font-extrabold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full">
								{pendingEvaluations.length} Pending Evaluation
							</span>
						</div>

						<div className="border border-zinc-100 rounded-xl overflow-hidden bg-white">
							<table className="w-full text-xs">
								<thead>
									<tr className="bg-zinc-50 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-100">
										<th className="py-2.5 px-4 text-left">Allotted ID</th>
										<th className="py-2.5 px-4 text-left">Brand & Model</th>
										<th className="py-2.5 px-4 text-left">Submitted By</th>
										<th className="py-2.5 px-4 text-right">Action</th>
									</tr>
								</thead>
								<tbody>
									{pendingEvaluations.slice(0, 3).map((item, i) => {
										const sampleInsp = item.req.sampleInspections?.find((si: any) => Number(si.sampleIndex) === Number(item.sampleIndex));
										let checksObj: any = {};
										try {
											checksObj = typeof sampleInsp?.checks === 'string' ? JSON.parse(sampleInsp.checks) : (sampleInsp?.checks || {});
										} catch (e) {
											checksObj = {};
										}
										const engineerName = checksObj.submittedByName || item.req.engineerName || 'Engineer';
										
										return (
											<tr key={i} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-all">
												<td className="py-3 px-4 font-bold text-indigo-700">{item.allottedId}</td>
												<td className="py-3 px-4">
													<p className="font-bold text-zinc-800">{item.req.brandName}</p>
													<p className="text-zinc-400 text-[10px] font-semibold mt-0.5">{item.req.modelNo}</p>
												</td>
												<td className="py-3 px-4 font-semibold text-zinc-655">{engineerName}</td>
												<td className="py-3 px-4 text-right">
													<button 
														onClick={() => navigate(`/manager/evaluate-checksheet/${item.req.id}-sample-${item.sampleIndex}`)}
														className="text-[10px] font-bold text-amber-700 hover:text-white bg-amber-50 hover:bg-amber-600 border border-amber-250 px-2.5 py-1 rounded-lg cursor-pointer transition-all"
													>
														Evaluate
													</button>
												</td>
											</tr>
										);
									})}
									{pendingEvaluations.length === 0 && (
										<tr>
											<td colSpan={4} className="py-8 text-center text-zinc-400 font-semibold">
												No test reports pending evaluation.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</div>

					{/* 2. Test Plans breakdown grid */}
					<div className="bg-white border border-zinc-200/50 rounded-2xl p-6 shadow-sm space-y-4">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
							<div>
								<h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Test Plans Monitoring Registry</h3>
								<p className="text-[11px] text-zinc-400 font-semibold mt-0.5">Track samples through their physical station testing and evaluations.</p>
							</div>
							{/* Tab Selection */}
							<div className="flex bg-zinc-100 p-1 rounded-xl gap-1 shrink-0">
								{[
									{ key: 'pending', label: 'Pending', count: pendingTestPlans.length },
									{ key: 'active', label: 'Active', count: activeTestPlans.length },
									{ key: 'completed', label: 'Completed', count: completedTestPlans.length },
									{ key: 'failed', label: 'Failed', count: failedTestPlans.length }
								].map((t) => (
									<button
										key={t.key}
										onClick={() => setActivePlanTab(t.key as any)}
										className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all border-none outline-none cursor-pointer flex items-center gap-1 ${
											activePlanTab === t.key 
												? 'bg-white text-zinc-900 shadow-xs' 
												: 'text-zinc-500 hover:text-zinc-805'
										}`}
									>
										{t.label}
										<span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
											activePlanTab === t.key 
												? 'bg-[#11236a]/10 text-[#11236a]' 
												: 'bg-zinc-200 text-zinc-600'
										}`}>
											{t.count}
										</span>
									</button>
								))}
							</div>
						</div>

						{/* Tab Results View */}
						<div className="border border-zinc-100 rounded-xl overflow-hidden bg-zinc-50/20">
							<table className="w-full text-xs">
								<thead>
									<tr className="bg-zinc-50 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-100">
										<th className="py-2.5 px-4 text-left">Plan ID</th>
										<th className="py-2.5 px-4 text-left">Brand / Spec</th>
										<th className="py-2.5 px-4 text-left">Assigned Engineer</th>
										<th className="py-2.5 px-4 text-left">Testing Status</th>
									</tr>
								</thead>
								<tbody>
									{activePlanTab === 'pending' && pendingTestPlans.slice(0, 3).map((req, i) => (
										<tr key={i} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-all bg-white">
											<td className="py-3 px-4 font-bold text-indigo-700">{req.requestId || req.id}</td>
											<td className="py-3 px-4">
												<p className="font-bold text-zinc-800">{req.brandName}</p>
												<p className="text-zinc-400 text-[10px] font-semibold mt-0.5">{req.modelNo}</p>
											</td>
											<td className="py-3 px-4 font-semibold text-zinc-700">{req.engineerName || '—'}</td>
											<td className="py-3 px-4">
												<span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 uppercase">
													{req.status}
												</span>
											</td>
										</tr>
									))}
									{activePlanTab === 'active' && activeTestPlans.slice(0, 3).map((req, i) => (
										<tr key={i} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-all bg-white">
											<td className="py-3 px-4 font-bold text-indigo-700">{req.requestId || req.id}</td>
											<td className="py-3 px-4">
												<p className="font-bold text-zinc-800">{req.brandName}</p>
												<p className="text-zinc-400 text-[10px] font-semibold mt-0.5">{req.modelNo}</p>
											</td>
											<td className="py-3 px-4 font-semibold text-zinc-700">{req.engineerName || '—'}</td>
											<td className="py-3 px-4">
												<span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100 uppercase">
													Testing
												</span>
											</td>
										</tr>
									))}
									{activePlanTab === 'completed' && completedTestPlans.slice(0, 3).map((req, i) => (
										<tr key={i} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-all bg-white">
											<td className="py-3 px-4 font-bold text-indigo-700">{req.requestId || req.id}</td>
											<td className="py-3 px-4">
												<p className="font-bold text-zinc-800">{req.brandName}</p>
												<p className="text-zinc-400 text-[10px] font-semibold mt-0.5">{req.modelNo}</p>
											</td>
											<td className="py-3 px-4 font-semibold text-zinc-700">{req.engineerName || '—'}</td>
											<td className="py-3 px-4">
												<span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">
													Passed / Done
												</span>
											</td>
										</tr>
									))}
									{activePlanTab === 'failed' && failedTestPlans.slice(0, 3).map((req, i) => (
										<tr key={i} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-all bg-white">
											<td className="py-3 px-4 font-bold text-indigo-700">{req.requestId || req.id}</td>
											<td className="py-3 px-4">
												<p className="font-bold text-zinc-800">{req.brandName}</p>
												<p className="text-zinc-400 text-[10px] font-semibold mt-0.5">{req.modelNo}</p>
											</td>
											<td className="py-3 px-4 font-semibold text-zinc-700">{req.engineerName || '—'}</td>
											<td className="py-3 px-4">
												<span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 uppercase">
													Failed
												</span>
											</td>
										</tr>
									))}

									{/* Empty States */}
									{activePlanTab === 'pending' && pendingTestPlans.length === 0 && (
										<tr><td colSpan={4} className="py-8 text-center text-zinc-400 font-semibold bg-white">No pending test plan configurations.</td></tr>
									)}
									{activePlanTab === 'active' && activeTestPlans.length === 0 && (
										<tr><td colSpan={4} className="py-8 text-center text-zinc-400 font-semibold bg-white">No active tests running currently.</td></tr>
									)}
									{activePlanTab === 'completed' && completedTestPlans.length === 0 && (
										<tr><td colSpan={4} className="py-8 text-center text-zinc-400 font-semibold bg-white">No completed test plans records yet.</td></tr>
									)}
									{activePlanTab === 'failed' && failedTestPlans.length === 0 && (
										<tr><td colSpan={4} className="py-8 text-center text-zinc-400 font-semibold bg-white">No failed test plan records.</td></tr>
									)}
								</tbody>
							</table>
						</div>
					</div>
				</div>

				{/* Right Column (Col Span 1) */}
				<div className="space-y-6">
					
					{/* 4. Assigned, Inspected, and Allocated workloads */}
					<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm space-y-4">
						<h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Duty Allocation Registry</h3>
						
						<div className="space-y-3">
							{/* Approved requests pending engineer allocation */}
							<div className="p-3 bg-indigo-50/30 border border-indigo-100 rounded-xl flex items-center justify-between">
								<div>
									<h4 className="text-xs font-bold text-[#11236a]">Pending for Assignment</h4>
									<p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Approved requests awaiting engineer allocation</p>
								</div>
								<span className="text-base font-extrabold text-[#11236a]">{approvedRequests.length}</span>
							</div>

							{/* Reports Pending Evaluation */}
							<div 
								onClick={() => navigate('/manager/test-plans')}
								className="p-3 bg-amber-50/30 border border-amber-100 rounded-xl flex items-center justify-between cursor-pointer hover:bg-amber-50/50 transition-all"
							>
								<div>
									<h4 className="text-xs font-bold text-amber-700">Pending Evaluation</h4>
									<p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Submitted reports awaiting manager check</p>
								</div>
								<span className="text-base font-extrabold text-amber-700">{pendingEvaluations.length}</span>
							</div>

							{/* Inspected by Lab Manager */}
							<div className="p-3 bg-emerald-50/30 border border-emerald-100 rounded-xl flex items-center justify-between">
								<div>
									<h4 className="text-xs font-bold text-emerald-700">Inspected by Me</h4>
									<p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Reports checked by Shift Manager</p>
								</div>
								<span className="text-base font-extrabold text-emerald-700">{inspectedByManager.length}</span>
							</div>

							{/* Samples Assigned to Engineers */}
							<div className="p-3 bg-violet-50/30 border border-violet-100 rounded-xl flex items-center justify-between">
								<div>
									<h4 className="text-xs font-bold text-violet-700">Engineer Allocated</h4>
									<p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Assigned to specialized staff members</p>
								</div>
								<span className="text-base font-extrabold text-violet-700">{assignedToEngineers.length}</span>
							</div>
						</div>
					</div>

					{/* 5. Pending CAPA reports */}
					<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Pending CAPA Reports</h3>
							<span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">
								{pendingCapas.length} Active
							</span>
						</div>

						<div className="space-y-3">
							{pendingCapas.slice(0, 3).map((capa, i) => (
								<div 
									key={i} 
									onClick={() => navigate('/manager/capa-management')}
									className="p-3 border border-zinc-100 hover:border-zinc-250 hover:bg-zinc-50/50 rounded-xl transition-all cursor-pointer group"
								>
									<div className="flex items-center justify-between">
										<span className="text-[9px] font-bold text-indigo-700">{capa.id}</span>
										<span className="text-[9px] text-zinc-400 font-semibold">Target: {capa.targetedDate}</span>
									</div>
									<h4 className="text-xs font-bold text-zinc-800 mt-1 line-clamp-1 group-hover:text-[#11236a]">{capa.productName}</h4>
									<p className="text-[10px] text-zinc-500 font-semibold mt-0.5 line-clamp-1">{capa.nonConformity}</p>
								</div>
							))}
							{pendingCapas.length === 0 && (
								<div className="text-center py-6 text-zinc-400 font-semibold text-xs">
									No pending CAPA reports reported.
								</div>
							)}
						</div>
					</div>


				</div>
			</div>
		</div>
	);
}
