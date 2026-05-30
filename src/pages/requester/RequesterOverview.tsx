import { Send, CheckCircle, Clipboard, Plus, FileText, ArrowRight } from 'lucide-react';

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
	const completedCount = requests.filter(r => r.status === 'COMPLETED').length;
	const underTestCount = requests.filter(r => r.status === 'UNDER_TEST').length;
	const activeCapasCount = capas.filter(c => c.status === 'OPEN').length;

	return (
		<div className="space-y-6">
			{/* Overview Summary Badges */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">				
				<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
					<div>
						<span className="text-zinc-700 text-[10px] font-bold uppercase tracking-wider">My Submissions</span>
						<h3 className="text-2xl font-bold text-zinc-950 mt-1">{requests.length} Requests</h3>
						<p className="text-zinc-650 text-xs mt-2 font-medium">
							<span className="font-semibold text-emerald-700">{completedCount}</span> completed, <span className="font-semibold text-indigo-700">{underTestCount}</span> under test
						</p>
					</div>
					<div className="w-12 h-12 bg-indigo-50 text-[#11236a] rounded-xl flex items-center justify-center border border-indigo-100 shrink-0">
						<Send className="w-5 h-5 text-[#11236a]" />
					</div>
				</div>

				<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
					<div>
						<span className="text-zinc-700 text-[10px] font-bold uppercase tracking-wider">Certified Reports</span>
						<h3 className="text-2xl font-bold text-zinc-950 mt-1">
							{completedCount} Reports
						</h3>
						<p className="text-emerald-700 text-xs mt-2 font-bold flex items-center gap-1.5">
							<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
							Approved & Released
						</p>
					</div>
					<div className="w-12 h-12 bg-emerald-50 text-emerald-755 rounded-xl flex items-center justify-center border border-emerald-100 shrink-0">
						<CheckCircle className="w-5 h-5 text-emerald-600" />
					</div>
				</div>

				<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
					<div>
						<span className="text-zinc-700 text-[10px] font-bold uppercase tracking-wider">CAPA Action Plans</span>
						<h3 className="text-2xl font-bold text-zinc-950 mt-1">{capas.length} Registered</h3>
						<p className="text-amber-700 text-xs mt-2 font-bold">
							{activeCapasCount} active investigations
						</p>
					</div>
					<div className="w-12 h-12 bg-amber-50 text-amber-755 rounded-xl flex items-center justify-center border border-amber-100 shrink-0">
						<Clipboard className="w-5 h-5 text-amber-600" />
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
						onClick={() => setActiveTab('new-capa')}
						className="flex items-center justify-between p-4 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all cursor-pointer border-none outline-none group active:scale-[0.98]"
					>
						<div className="flex items-center gap-3">
							<Clipboard className="w-5 h-5 shrink-0" />
							<div className="text-left">
								<p className="text-xs font-bold leading-none">Initiate CAPA Report</p>
								<span className="text-[10px] text-amber-100 font-light mt-1 block">Address product failures</span>
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
								<th className="pb-3 px-2">Test Method</th>
								<th className="pb-3 px-2">Qty</th>
								<th className="pb-3 px-2">Status</th>
								<th className="pb-3 px-2 text-right">Action</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-700">
							{requests.slice(0, 3).map((req) => (
								<tr key={req.id} className="hover:bg-zinc-50/50 transition-all group">
									<td className="py-3 px-2 font-bold text-zinc-800">{req.id}</td>
									<td className="py-3 px-2">
										<p className="text-xs font-bold text-zinc-900 leading-tight">{req.brandName} - {req.modelNo}</p>
										<span className="text-[9px] text-zinc-650 font-bold uppercase">{req.customerNameAddress}</span>
									</td>
									<td className="py-3 px-2 text-zinc-700 font-medium">{req.testMethodRef}</td>
									<td className="py-3 px-2">
										<span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">{req.sampleQty} pcs</span>
									</td>
									<td className="py-3 px-2">
										<span className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${
											req.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
											req.status === 'UNDER_TEST' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
											req.status === 'UNDER_INSPECTION' ? 'bg-amber-50 text-amber-600 border-amber-100' :
											req.status === 'PENDING_APPROVAL' ? 'bg-amber-50/70 text-amber-700 border-amber-200' :
											req.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
											'bg-zinc-50 text-zinc-650 border-zinc-100'
										}`}>
											{req.status === 'COMPLETED' && <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />}
											{req.status === 'UNDER_TEST' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />}
											{req.status === 'UNDER_INSPECTION' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
											{req.status === 'PENDING_APPROVAL' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
											{req.status.replace('_', ' ')}
										</span>
									</td>
									<td className="py-3 px-2 text-right">
										<button 
											onClick={() => {
												setSelectedRequest(req);
												setActiveTab('view-request-details');
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
