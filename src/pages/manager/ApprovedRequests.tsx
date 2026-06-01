import { useState } from 'react';
import { Search, ChevronRight, ClipboardCheck, Clock } from 'lucide-react';
import Pagination from '../../components/Pagination';

interface ApprovedRequest {
	id: string;
	customerNameAddress: string;
	sampleDescription: string;
	modelNo: string;
	brandName: string;
	sampleQty: number;
	testMethodRef: string;
	requesterName: string;
	status: string;
	approvedDate: string;
	engineerId?: string;
	engineerName?: string;
	inspectionResult?: string;
}

interface ApprovedRequestsProps {
	requests: ApprovedRequest[];
	setActiveTab: (tab: string) => void;
	setSelectedRequest: (req: ApprovedRequest) => void;
}

export default function ApprovedRequests({ requests, setActiveTab, setSelectedRequest }: ApprovedRequestsProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(5);

	const filteredRequests = requests.filter(r => {
		return r.brandName.toLowerCase().includes(searchQuery.toLowerCase()) || 
			   r.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
			   r.modelNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
			   r.sampleDescription.toLowerCase().includes(searchQuery.toLowerCase());
	});

	const maxPage = Math.ceil(filteredRequests.length / itemsPerPage);
	const activePage = maxPage > 0 ? Math.min(currentPage, maxPage) : 1;
	if (currentPage !== activePage) {
		setCurrentPage(activePage);
	}

	const startIndex = (activePage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

	const handleRowClick = (req: ApprovedRequest) => {
		setSelectedRequest(req);
		setActiveTab('approved-request-details');
	};

	return (
		<div className="space-y-6">
			{/* Top Search Toolbar */}
			<div className="bg-white border border-zinc-200/50 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="relative flex-1 max-w-md">
					<Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
					<input 
						type="text" 
						placeholder="Search by brand, ID, model, or description..."
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							setCurrentPage(1);
						}}
						className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-zinc-800 placeholder-zinc-550 outline-none focus:bg-white focus:border-[#11236a] transition-all"
					/>
				</div>
				<div className="text-xs text-zinc-500 font-medium bg-zinc-50 border border-zinc-200 px-3.5 py-2 rounded-xl">
					Total Approved: <strong className="text-zinc-800 font-extrabold">{requests.length}</strong>
				</div>
			</div>

			{/* List Container */}
			<div className="bg-white border border-zinc-200/50 rounded-3xl shadow-sm overflow-hidden p-1">
				{paginatedRequests.length === 0 ? (
					<div className="text-center py-16">
						<ClipboardCheck className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
						<h4 className="text-sm font-bold text-zinc-800">No approved requests found</h4>
						<p className="text-xs text-zinc-500 font-light mt-1">Check back later once the Directorate approves new submittals.</p>
					</div>
				) : (
					<div className="overflow-x-auto flex flex-col justify-between">
						<table className="w-full text-left border-collapse min-w-[800px]">
							<thead>
								<tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 font-bold text-[10px] uppercase tracking-wider">
									<th className="py-4 px-6">Request ID</th>
									<th className="py-4 px-6">Brand & Model</th>
									<th className="py-4 px-6">Sample Description</th>
									<th className="py-4 px-6">Requested By</th>
									<th className="py-4 px-6">Approved Date</th>
									<th className="py-4 px-6">Allocation Status</th>
									<th className="py-4 px-6 text-right">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-750">
								{paginatedRequests.map((req) => {
									const isAllocated = !!req.engineerId;
									const isCompleted = !!req.inspectionResult;
									return (
										<tr 
											key={req.id} 
											className="hover:bg-zinc-50/50 transition-all group cursor-pointer"
											onClick={() => handleRowClick(req)}
										>
											<td className="py-4 px-6 font-bold text-zinc-900 group-hover:text-[#11236a]">{req.id}</td>
											<td className="py-4 px-6">
												<div className="font-bold text-zinc-900 leading-tight">{req.brandName}</div>
												<span className="text-[10px] text-zinc-500 font-medium">{req.modelNo}</span>
											</td>
											<td className="py-4 px-6 text-zinc-650 max-w-xs truncate">{req.sampleDescription}</td>
											<td className="py-4 px-6 text-zinc-700">{req.requesterName}</td>
											<td className="py-4 px-6 text-zinc-600 font-medium">{req.approvedDate}</td>
											<td className="py-4 px-6">
												<span className={`text-[9px] font-bold px-2 py-0.5 border rounded-full uppercase tracking-wider flex items-center gap-1 w-fit ${
													isCompleted 
														? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
														: isAllocated 
															? 'bg-indigo-50 text-indigo-600 border-indigo-100'
															: 'bg-amber-50 text-amber-600 border-amber-100'
												}`}>
													{isCompleted ? (
														<>Completed</>
													) : isAllocated ? (
														<>Allocated</>
													) : (
														<>
															<Clock className="w-2.5 h-2.5 shrink-0" />
															Pending Allocation
														</>
													)}
												</span>
											</td>
											<td className="py-4 px-6 text-right">
												<button 
													onClick={(e) => {
														e.stopPropagation();
														handleRowClick(req);
													}}
													className="bg-transparent border-none text-[#11236a] hover:text-[#0c1a52] font-bold text-xs inline-flex items-center gap-0.5 cursor-pointer outline-none group-hover:underline"
												>
													{isCompleted ? 'View Results' : isAllocated ? 'Manage Assignment' : 'Assign Engineer'}
													<ChevronRight className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
												</button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>

						<Pagination
							totalItems={filteredRequests.length}
							itemsPerPage={itemsPerPage}
							currentPage={currentPage}
							onPageChange={setCurrentPage}
							onItemsPerPageChange={(limit) => {
								setItemsPerPage(limit);
								setCurrentPage(1);
							}}
							itemNamePlural="approved requests"
						/>
					</div>
				)}
			</div>
		</div>
	);
}
