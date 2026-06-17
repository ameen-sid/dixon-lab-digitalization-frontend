import { CheckCircle, Clipboard, Plus, FileText, ArrowRight } from 'lucide-react';

interface RequestRecord {
	id: string;
	customerNameAddress: string;
	manufacturerNameAddress: string;
	customerContactDetails: string;
	sampleDescription: string;
	modelNo: string;
	familyModel?: string | null;
	serialNumber?: string | null;
	productRating: string;
	sampleQty: number;
	brandName: string;
	attachmentMention?: string | null;
	witnessRequired: string;
	witnessPersonDetails?: string | null;
	testMethodRef: string;
	conformityStatement: string;
	decisionRule?: string | null;
	collectBack: string;
	status: string;
	remarks?: string | null;
	createdDate: string;
	telemetry: number[];
	attachments?: { id: number; fileName: string; filePath: string; fileSize: number }[];
	testType?: { id: number; name: string } | null;
}

interface CapaRecord {
	id: string;
	relatedRequest: string;
	productName: string;
	nonConformity: string;
	rootCause: string;
	correctiveAction: string;
	preventiveAction: string;
	targetedDate: string;
	status: string;
	owner: string;
	createdDate: string;
}

interface RequesterOverviewProps {
	requests: RequestRecord[];
	capas: CapaRecord[];
	setActiveTab: (tab: string) => void;
	setSelectedRequest: (req: RequestRecord) => void;
}

export default function RequesterOverview({ requests, capas, setActiveTab, setSelectedRequest }: RequesterOverviewProps) {
	const totalCount = requests.length;
	const pendingCount = requests.filter(r => ['PENDING', 'PENDING_APPROVAL'].includes(r.status)).length;
	const underInspectionCount = requests.filter(r => ['UNDER_INSPECTION'].includes(r.status)).length;
	const inspectionCompletedCount = requests.filter(r => ['INSPECTION_COMPLETED'].includes(r.status)).length;
	const inspectionFailedCount = requests.filter(r => ['INSPECTION_FAILED'].includes(r.status)).length;
	const rejectedCount = requests.filter(r => ['REJECTED'].includes(r.status)).length;
	const underTestingCount = requests.filter(r => ['UNDER_TEST', 'UNDER_TESTING', 'RETEST'].includes(r.status)).length;
	const completedCount = requests.filter(r => ['COMPLETED', 'PASS', 'TESTING_PASSED', 'PARTIAL', 'TESTING_PARTIAL'].includes(r.status)).length;
	const failedCount = requests.filter(r => ['FAIL', 'TESTING_FAILED', 'FAILED'].includes(r.status)).length;

	const totalCapas = capas.length;
	const openCapas = capas.filter(c => c.status === 'OPEN').length;
	const completedCapas = capas.filter(c => c.status === 'COMPLETED').length;

	return (
		<div className="space-y-6">
			{/* Requests Status Overview */}
			<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm">
				<h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-4">Requests Status Overview</h3>
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
					{/* Total */}
					<div className="bg-zinc-50 border border-zinc-200/80 p-3.5 rounded-xl flex flex-col justify-center text-center hover:shadow-md transition-shadow">
						<span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Total</span>
						<span className="text-xl font-black text-zinc-900 mt-1">{totalCount}</span>
					</div>
					
					{/* Pending */}
					<div className="bg-amber-50/50 border border-amber-100 p-3.5 rounded-xl flex flex-col justify-center text-center hover:shadow-md transition-shadow">
						<span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider">Pending</span>
						<span className="text-xl font-black text-amber-700 mt-1">{pendingCount}</span>
					</div>

					{/* Rejected */}
					<div className="bg-rose-50/50 border border-rose-100 p-3.5 rounded-xl flex flex-col justify-center text-center hover:shadow-md transition-shadow">
						<span className="text-[10px] text-rose-600 font-extrabold uppercase tracking-wider">Rejected</span>
						<span className="text-xl font-black text-rose-700 mt-1">{rejectedCount}</span>
					</div>

					{/* Under Inspection */}
					<div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-xl flex flex-col justify-center text-center hover:shadow-md transition-shadow">
						<span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-wider">Under Inspection</span>
						<span className="text-xl font-black text-blue-700 mt-1">{underInspectionCount}</span>
					</div>

					{/* Inspection Completed */}
					<div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-xl flex flex-col justify-center text-center hover:shadow-md transition-shadow">
						<span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider">Inspection Completed</span>
						<span className="text-xl font-black text-emerald-700 mt-1">{inspectionCompletedCount}</span>
					</div>

					{/* Inspection Failed */}
					<div className="bg-rose-50/50 border border-rose-100 p-3.5 rounded-xl flex flex-col justify-center text-center hover:shadow-md transition-shadow">
						<span className="text-[10px] text-rose-650 font-extrabold uppercase tracking-wider">Inspection Failed</span>
						<span className="text-xl font-black text-rose-700 mt-1">{inspectionFailedCount}</span>
					</div>

					{/* Under Testing */}
					<div className="bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-xl flex flex-col justify-center text-center hover:shadow-md transition-shadow">
						<span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider">Under Testing</span>
						<span className="text-xl font-black text-indigo-700 mt-1">{underTestingCount}</span>
					</div>

					{/* Completed */}
					<div className="bg-teal-50/50 border border-teal-100 p-3.5 rounded-xl flex flex-col justify-center text-center hover:shadow-md transition-shadow">
						<span className="text-[10px] text-teal-600 font-extrabold uppercase tracking-wider">Completed</span>
						<span className="text-xl font-black text-teal-700 mt-1">{completedCount}</span>
					</div>

					{/* Failed */}
					<div className="bg-red-50/50 border border-red-100 p-3.5 rounded-xl flex flex-col justify-center text-center hover:shadow-md transition-shadow">
						<span className="text-[10px] text-red-600 font-extrabold uppercase tracking-wider">Failed</span>
						<span className="text-xl font-black text-red-700 mt-1">{failedCount}</span>
					</div>
				</div>
			</div>

			{/* CAPA Reports Summary */}
			<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
						<Clipboard className="w-4 h-4 text-amber-600" />
						CAPA Reports Summary
					</h3>
					<button 
						onClick={() => setActiveTab('capa-management')}
						className="text-[10px] font-bold text-[#11236a] hover:text-[#0c1a52] cursor-pointer bg-transparent border-none outline-none hover:underline"
					>
						View All CAPAs
					</button>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
						<div>
							<p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total CAPAs</p>
							<p className="text-2xl font-black text-zinc-800 mt-0.5">{totalCapas}</p>
						</div>
						<div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500">
							<Clipboard className="w-4 h-4" />
						</div>
					</div>
					<div className="flex items-center justify-between p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
						<div>
							<p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Open Investigations</p>
							<p className="text-2xl font-black text-amber-700 mt-0.5">{openCapas}</p>
						</div>
						<div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
							<div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
						</div>
					</div>
					<div className="flex items-center justify-between p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
						<div>
							<p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Completed / Resolved</p>
							<p className="text-2xl font-black text-emerald-700 mt-0.5">{completedCapas}</p>
						</div>
						<div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
							<CheckCircle className="w-4 h-4" />
						</div>
					</div>
				</div>
			</div>

			{/* Quick Access Actions */}
			<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm">
				<h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-3.5">Quick Actions</h3>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<button 
						onClick={() => setActiveTab('new-request')}
						className="flex items-center justify-between p-4 bg-[#11236a] text-white rounded-xl hover:bg-[#0c1a52] transition-all cursor-pointer border-none outline-none group active:scale-[0.98]"
					>
						<div className="flex items-center gap-3">
							<Plus className="w-5 h-5 shrink-0" />
							<div className="text-left">
								<p className="text-xs font-bold leading-none">New Test Request</p>
								<span className="text-[10px] text-zinc-300 font-light mt-1 block">Register sample plans</span>
							</div>
						</div>
						<ArrowRight className="w-4 h-4 shrink-0 opacity-80 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
					</button>

					<button 
						onClick={() => setActiveTab('my-requests')}
						className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200 text-zinc-800 rounded-xl hover:bg-zinc-100/70 transition-all cursor-pointer outline-none group active:scale-[0.98]"
					>
						<div className="flex items-center gap-3">
							<FileText className="w-5 h-5 shrink-0 text-zinc-650" />
							<div className="text-left">
								<p className="text-xs font-bold leading-none text-zinc-850">My Submissions</p>
								<span className="text-[10px] text-zinc-650 font-medium mt-1 block">View test status logs</span>
							</div>
						</div>
						<ArrowRight className="w-4 h-4 shrink-0 opacity-80 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
					</button>

					<button 
						onClick={() => setActiveTab('capa-management')}
						className="flex items-center justify-between p-4 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all cursor-pointer border-none outline-none group active:scale-[0.98]"
					>
						<div className="flex items-center gap-3">
							<Clipboard className="w-5 h-5 shrink-0" />
							<div className="text-left">
								<p className="text-xs font-bold leading-none">CAPA Management</p>
								<span className="text-[10px] text-amber-100 font-light mt-1 block">View & track quality action plans</span>
							</div>
						</div>
						<ArrowRight className="w-4 h-4 shrink-0 opacity-80 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
					</button>
				</div>
			</div>

			{/* Recent Submissions Feed */}
			<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm">
				<div className="flex items-center justify-between border-b border-zinc-100 pb-3.5 mb-4">
					<h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Recent Test Requests</h3>
					<button 
						onClick={() => setActiveTab('my-requests')}
						className="text-xs font-bold text-[#11236a] hover:text-[#0c1a52] cursor-pointer border-none bg-transparent outline-none hover:underline"
					>
						View All Register
					</button>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse min-w-[500px]">
						<thead>
							<tr className="border-b border-zinc-200 text-zinc-700 font-bold text-[10px] uppercase tracking-wider">
								<th className="pb-3 px-2">ID</th>
								<th className="pb-3 px-2">Product Name</th>
								<th className="pb-3 px-2">Test Type</th>
								<th className="pb-3 px-2">Qty</th>
								<th className="pb-3 px-2">Status</th>
								<th className="pb-3 px-2 text-right">Action</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-700">
							{requests.slice(0, 5).map((req) => (
								<tr key={req.id} className="hover:bg-zinc-50/50 transition-all group">
									<td className="py-3 px-2 font-bold text-zinc-800">{req.id}</td>
									<td className="py-3 px-2">
										<p className="text-xs font-bold text-zinc-900 leading-tight">{req.brandName} - {req.modelNo}</p>
										<span className="text-[9px] text-zinc-650 font-bold uppercase">{req.customerNameAddress}</span>
									</td>
									<td className="py-3 px-2 text-zinc-700 font-medium">{req.testType?.name || 'N/A'}</td>
									<td className="py-3 px-2">
										<span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">{req.sampleQty} pcs</span>
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
													case 'FAILED':
													case 'TESTING_FAILED':
													case 'REJECTED':
													case 'INSPECTION_FAILED':
														return 'bg-rose-50 text-rose-600 border-rose-100';
													case 'PARTIAL':
													case 'TESTING_PARTIAL':
														return 'bg-amber-50 text-amber-600 border-amber-100';
													case 'UNDER_TEST':
													case 'UNDER_TESTING':
														return 'bg-indigo-50 text-indigo-600 border-indigo-100';
													case 'TESTING_COMPLETED':
														return 'bg-blue-50 text-blue-700 border-blue-150';
													case 'RETEST':
														return 'bg-amber-50 text-amber-650 border-amber-100';
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
													{['FAIL', 'FAILED', 'TESTING_FAILED', 'REJECTED', 'INSPECTION_FAILED'].includes(req.status) && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
													{['PARTIAL', 'TESTING_PARTIAL'].includes(req.status) && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
													{['UNDER_TEST', 'UNDER_TESTING', 'TESTING_COMPLETED', 'RETEST'].includes(req.status) && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />}
													{req.status === 'UNDER_INSPECTION' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
													{req.status === 'PENDING_APPROVAL' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
													{req.status === 'PASS' || req.status === 'TESTING_PASSED' 
														? 'TESTING PASSED' 
														: req.status === 'FAIL' || req.status === 'TESTING_FAILED' || req.status === 'FAILED'
															? 'TESTING FAILED' 
															: req.status === 'PARTIAL' || req.status === 'TESTING_PARTIAL' 
																? 'TESTING PARTIAL' 
																: req.status.replace('_', ' ')}
												</span>
											);
										})()}
									</td>
									<td className="py-3 px-2 text-right">
										<button 
											onClick={() => {
												setSelectedRequest(req);
											}}
											className="text-xs font-bold text-[#11236a] hover:text-[#0c1a52] cursor-pointer group-hover:underline bg-transparent border-none outline-none"
										>
											Open Detail
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
