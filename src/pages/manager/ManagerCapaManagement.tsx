import { useState } from 'react';
import { Search, Plus, X, ArrowLeft, AlertTriangle } from 'lucide-react';
import Pagination from '../../components/Pagination';

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

interface ManagerCapaManagementProps {
	capas: CapaRecord[];
	onAddCapa: (newCapa: any) => void;
	requests: any[];
}

export default function ManagerCapaManagement({ capas, onAddCapa, requests }: ManagerCapaManagementProps) {
	const [capaView, setCapaView] = useState<'list' | 'new' | 'details'>('list');
	const [selectedCapa, setSelectedCapa] = useState<CapaRecord | null>(null);

	// List filters state
	const [searchQuery, setSearchQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState('ALL');
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(5);

	// New CAPA Form State
	const [relatedRequest, setRelatedRequest] = useState('');
	const [productName, setProductName] = useState('');
	const [nonConformity, setNonConformity] = useState('');
	const [rootCause, setRootCause] = useState('');
	const [correctiveAction, setCorrectiveAction] = useState('');
	const [preventiveAction, setPreventiveAction] = useState('');
	const [targetedDate, setTargetedDate] = useState('');

	// Handler for selecting request in new CAPA form
	const handleRequestSelection = (reqId: string) => {
		setRelatedRequest(reqId);
		const found = requests.find(r => r.id === reqId);
		if (found) {
			setProductName(`${found.brandName} ${found.modelNo}`);
			setNonConformity(`Test values failed criteria parameters. Method: ${found.testMethodRef}.`);
		}
	};

	const handleFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!relatedRequest || !rootCause || !correctiveAction || !preventiveAction || !targetedDate) {
			alert('Please complete all mandatory fields.');
			return;
		}

		onAddCapa({
			relatedRequest,
			productName,
			nonConformity,
			rootCause,
			correctiveAction,
			preventiveAction,
			targetedDate,
		});

		// Clear form
		setRelatedRequest('');
		setProductName('');
		setNonConformity('');
		setRootCause('');
		setCorrectiveAction('');
		setPreventiveAction('');
		setTargetedDate('');

		setCapaView('list');
	};

	// 1. NEW CAPA FORM VIEW
	if (capaView === 'new') {
		return (
			<div className="space-y-6">
				{/* Back bar */}
				<div className="flex items-center gap-3">
					<button 
						onClick={() => setCapaView('list')}
						className="w-9 h-9 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-800 hover:shadow-sm transition-all cursor-pointer outline-none border-none"
					>
						<ArrowLeft className="w-4 h-4 shrink-0" />
					</button>
					<div>
						<h3 className="text-base font-extrabold text-zinc-900 tracking-tight leading-none">Initiate CAPA Corrective Plan</h3>
						<span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Root Cause Analysis & Preventive Protocol</span>
					</div>
				</div>

				<form onSubmit={handleFormSubmit} className="bg-white border border-zinc-200/60 rounded-3xl p-6 shadow-sm space-y-6 max-w-3xl">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{/* Relate request */}
						<div className="space-y-1.5">
							<label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Relate to Request ID</label>
							<select 
								value={relatedRequest}
								onChange={(e) => handleRequestSelection(e.target.value)}
								required
								className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-700 outline-none cursor-pointer focus:bg-white focus:border-[#11236a]"
							>
								<option value="">-- Choose Approved/Failed Request --</option>
								{requests.map(req => (
									<option key={req.id} value={req.id}>{req.id} ({req.brandName})</option>
								))}
							</select>
						</div>

						{/* Product name */}
						<div className="space-y-1.5">
							<label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Product Name / Model</label>
							<input 
								type="text"
								value={productName}
								onChange={(e) => setProductName(e.target.value)}
								required
								placeholder="SMT Board X-90..."
								className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 placeholder-zinc-400 outline-none focus:bg-white focus:border-[#11236a]"
							/>
						</div>

						{/* Non conformity */}
						<div className="sm:col-span-2 space-y-1.5">
							<label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Non-Conformity observed</label>
							<textarea 
								value={nonConformity}
								onChange={(e) => setNonConformity(e.target.value)}
								required
								placeholder="Enter visual or calibration discrepancies logged..."
								className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 placeholder-zinc-400 outline-none focus:bg-white focus:border-[#11236a] h-16 resize-none"
							/>
						</div>

						{/* Root Cause */}
						<div className="sm:col-span-2 space-y-1.5">
							<label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">1. Root Cause Analysis (RCA)</label>
							<textarea 
								value={rootCause}
								onChange={(e) => setRootCause(e.target.value)}
								required
								placeholder="Detail why the calibration anomaly occurred..."
								className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 placeholder-zinc-400 outline-none focus:bg-white focus:border-[#11236a] h-20 resize-none"
							/>
						</div>

						{/* Corrective Action */}
						<div className="sm:col-span-2 space-y-1.5">
							<label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">2. Immediate Corrective Action</label>
							<textarea 
								value={correctiveAction}
								onChange={(e) => setCorrectiveAction(e.target.value)}
								required
								placeholder="What active steps were taken to resolve this immediate board error..."
								className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 placeholder-zinc-400 outline-none focus:bg-white focus:border-[#11236a] h-20 resize-none"
							/>
						</div>

						{/* Preventive Action */}
						<div className="sm:col-span-2 space-y-1.5">
							<label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">3. Systematic Preventive Action (Prevent Reoccurrence)</label>
							<textarea 
								value={preventiveAction}
								onChange={(e) => setPreventiveAction(e.target.value)}
								required
								placeholder="What process modifications are enforced to prevent future ingress..."
								className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 placeholder-zinc-400 outline-none focus:bg-white focus:border-[#11236a] h-20 resize-none"
							/>
						</div>

						{/* Target date */}
						<div className="space-y-1.5">
							<label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Targeted Completion Date</label>
							<input 
								type="date"
								value={targetedDate}
								onChange={(e) => setTargetedDate(e.target.value)}
								required
								className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 outline-none focus:bg-white focus:border-[#11236a]"
							/>
						</div>
					</div>

					<div className="border-t border-zinc-100 pt-6 flex justify-end gap-3 shrink-0">
						<button 
							type="button"
							onClick={() => setCapaView('list')}
							className="bg-transparent hover:bg-zinc-50 text-zinc-750 font-bold text-xs px-4 py-2.5 rounded-xl border border-zinc-200 cursor-pointer active:scale-95 outline-none"
						>
							Cancel
						</button>
						<button 
							type="submit"
							className="bg-[#11236a] text-white font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-[#0c1a52] transition-all cursor-pointer active:scale-[0.98] outline-none border-none"
						>
							Launch CAPA Report Plan
						</button>
					</div>
				</form>
			</div>
		);
	}

	// 2. DETAILS VIEW
	if (capaView === 'details' && selectedCapa) {
		return (
			<div className="space-y-6">
				{/* Back bar */}
				<div className="flex items-center gap-3">
					<button 
						onClick={() => setCapaView('list')}
						className="w-9 h-9 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-800 hover:shadow-sm transition-all cursor-pointer outline-none border-none"
					>
						<ArrowLeft className="w-4 h-4 shrink-0" />
					</button>
					<div>
						<h3 className="text-base font-extrabold text-zinc-900 tracking-tight leading-none">{selectedCapa.id} Audit Analysis</h3>
						<span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">{selectedCapa.productName} • Relates to {selectedCapa.relatedRequest}</span>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Action logs */}
					<div className="bg-white border border-zinc-200/60 rounded-3xl p-6 shadow-sm lg:col-span-2 space-y-6">
						<div className="space-y-4">
							<div className="border-b border-zinc-100 pb-4">
								<span className="text-zinc-500 font-bold text-[9px] uppercase tracking-wider block">Observed Failure Non-Conformity</span>
								<p className="text-zinc-900 font-semibold text-xs leading-relaxed mt-1">{selectedCapa.nonConformity}</p>
							</div>

							<div className="border-b border-zinc-100 pb-4">
								<span className="text-zinc-500 font-bold text-[9px] uppercase tracking-wider block">1. Root Cause Analysis (RCA)</span>
								<p className="text-zinc-800 font-medium text-xs leading-relaxed mt-1 bg-zinc-50 p-3.5 rounded-xl border border-zinc-150">
									{selectedCapa.rootCause}
								</p>
							</div>

							<div className="border-b border-zinc-100 pb-4">
								<span className="text-zinc-500 font-bold text-[9px] uppercase tracking-wider block">2. Immediate Corrective Actions Taken</span>
								<p className="text-zinc-800 font-medium text-xs leading-relaxed mt-1">
									{selectedCapa.correctiveAction}
								</p>
							</div>

							<div>
								<span className="text-zinc-500 font-bold text-[9px] uppercase tracking-wider block">3. Systematic Preventive Measures Enforced</span>
								<p className="text-zinc-800 font-medium text-xs leading-relaxed mt-1">
									{selectedCapa.preventiveAction}
								</p>
							</div>
						</div>
					</div>

					{/* Metadata panel */}
					<div className="bg-white border border-zinc-200/60 rounded-3xl p-6 shadow-sm space-y-4 h-fit">
						<h4 className="text-sm font-bold text-zinc-950 uppercase tracking-wider border-b border-zinc-100 pb-2">Status Registry</h4>
						<div className="text-xs space-y-3.5">
							<div>
								<span className="text-zinc-500 font-bold block uppercase text-[9px]">CAPA Resolution State</span>
								<span className={`inline-block text-[9px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider mt-1.5 ${
									selectedCapa.status === 'COMPLETED' 
										? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
										: 'bg-rose-50 text-rose-600 border-rose-100'
								}`}>
									{selectedCapa.status}
								</span>
							</div>

							<div>
								<span className="text-zinc-500 font-bold block uppercase text-[9px]">Department / Owner</span>
								<p className="text-zinc-900 font-bold mt-0.5">{selectedCapa.owner}</p>
							</div>

							<div>
								<span className="text-zinc-500 font-bold block uppercase text-[9px]">Target Date</span>
								<p className="text-[#11236a] font-extrabold mt-0.5">{selectedCapa.targetedDate}</p>
							</div>

							<div>
								<span className="text-zinc-500 font-bold block uppercase text-[9px]">Initiation Date</span>
								<p className="text-zinc-950 font-bold mt-0.5">{selectedCapa.createdDate}</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// 3. TABLE LIST VIEW (DEFAULT)
	const filteredCapas = capas.filter(c => {
		const matchesSearch = c.productName.toLowerCase().includes(searchQuery.toLowerCase()) || 
							  c.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
							  c.relatedRequest.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
		return matchesSearch && matchesStatus;
	});

	const maxPage = Math.ceil(filteredCapas.length / itemsPerPage);
	const activePage = maxPage > 0 ? Math.min(currentPage, maxPage) : 1;
	if (currentPage !== activePage) {
		setCurrentPage(activePage);
	}

	const startIndex = (activePage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedCapas = filteredCapas.slice(startIndex, endIndex);

	return (
		<div className="space-y-6">
			{/* Top toolbar */}
			<div className="bg-white border border-zinc-200/50 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="flex flex-col sm:flex-row gap-3 flex-1">
					<div className="relative flex-1 max-w-md">
						<Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-550" />
						<input 
							type="text" 
							placeholder="Search by product, CAPA ID, or request..."
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								setCurrentPage(1);
							}}
							className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-zinc-800 placeholder-zinc-500 outline-none focus:bg-white focus:border-[#11236a] transition-all"
						/>
						{searchQuery && (
							<button 
								onClick={() => {
									setSearchQuery('');
									setCurrentPage(1);
								}}
								className="absolute right-3 top-2.5 text-zinc-550 hover:text-red-650 bg-transparent border-none cursor-pointer outline-none"
							>
								<X className="w-4 h-4" />
							</button>
						)}
					</div>

					<select
						value={statusFilter}
						onChange={(e) => {
							setStatusFilter(e.target.value);
							setCurrentPage(1);
						}}
						className="bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 outline-none cursor-pointer hover:bg-zinc-50 transition-colors"
					>
						<option value="ALL">All Statuses</option>
						<option value="OPEN">Open Investigations</option>
						<option value="COMPLETED">Completed Actions</option>
					</select>
				</div>
			</div>

			{/* CAPA Table list */}
			<div className="bg-white border border-zinc-200/50 rounded-3xl shadow-sm overflow-hidden p-1">
				{paginatedCapas.length === 0 ? (
					<div className="text-center py-16">
						<AlertTriangle className="w-10 h-10 text-zinc-350 mx-auto mb-3" />
						<h4 className="text-sm font-bold text-zinc-850">No CAPA plans registered</h4>
						<p className="text-xs text-zinc-650 font-light mt-1">Refine active parameters or launch a new report plan.</p>
					</div>
				) : (
					<div className="overflow-x-auto flex flex-col justify-between">
						<table className="w-full text-left border-collapse min-w-[700px]">
							<thead>
								<tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 font-bold text-[10px] uppercase tracking-wider">
									<th className="py-4 px-6">CAPA ID</th>
									<th className="py-4 px-6">Related Request</th>
									<th className="py-4 px-6">Product Affected</th>
									<th className="py-4 px-6">Non-Conformity Failure</th>
									<th className="py-4 px-6">Target Date</th>
									<th className="py-4 px-6">Status</th>
									<th className="py-4 px-6 text-right">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-750">
								{paginatedCapas.map((capa) => (
									<tr key={capa.id} className="hover:bg-zinc-50/50 transition-all group">
										<td className="py-4 px-6 font-bold text-zinc-900">{capa.id}</td>
										<td className="py-4 px-6 font-bold text-[#11236a]">{capa.relatedRequest}</td>
										<td className="py-4 px-6 font-bold text-zinc-900">{capa.productName}</td>
										<td className="py-4 px-6 text-zinc-700 font-medium truncate max-w-xs">{capa.nonConformity}</td>
										<td className="py-4 px-6 text-zinc-700 font-medium">{capa.targetedDate}</td>
										<td className="py-4 px-6">
											<span className={`text-[9px] font-bold px-2 py-0.5 border rounded-full uppercase tracking-wider ${
												capa.status === 'COMPLETED' 
													? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
													: 'bg-rose-50 text-rose-600 border-rose-100'
											}`}>
												{capa.status}
											</span>
										</td>
										<td className="py-4 px-6 text-right">
											<button 
												onClick={() => {
													setSelectedCapa(capa);
													setCapaView('details');
												}}
												className="text-xs font-bold text-[#11236a] hover:text-[#0c1a52] cursor-pointer group-hover:underline bg-transparent border-none outline-none"
											>
												Open Plan
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>

						<Pagination
							totalItems={filteredCapas.length}
							itemsPerPage={itemsPerPage}
							currentPage={currentPage}
							onPageChange={setCurrentPage}
							onItemsPerPageChange={(limit) => {
								setItemsPerPage(limit);
								setCurrentPage(1);
							}}
							itemNamePlural="CAPA reports"
						/>
					</div>
				)}
			</div>
		</div>
	);
}
