import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
	CheckCircle, 
	Search, 
	X, 
	AlertTriangle, 
	RefreshCw 
} from 'lucide-react';
import { getTestRequests } from '../../services/operations/testRequestService';
import CustomSelect from '../../components/CustomSelect';
import Pagination from '../../components/Pagination';

interface AttachmentRecord {
	id: number;
	fileName: string;
	filePath: string;
	fileSize: number;
}

interface RequestRecord {
	id: number;
	requestId: string;
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
	createdAt: string;
	attachments?: AttachmentRecord[];
}

export default function HeadSampleTests() {
	const navigate = useNavigate();
	const [requests, setRequests] = useState<RequestRecord[]>([]);
	const [loading, setLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState('PENDING_APPROVAL');
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');

	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(5);

	// Load requests from backend
	const loadRequests = async () => {
		setLoading(true);
		try {
			const fetchRequests = getTestRequests();
			const data = await fetchRequests();
			setRequests(data || []);
		} catch (error) {
			console.error('Failed to fetch test requests:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadRequests();
	}, []);

	// Filter & search logic matching Requester MyRequests
	const filteredRequests = requests.filter(req => {
		const matchesSearch = 
			(req.brandName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
			(req.modelNo || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
			(req.requestId || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
			(req.customerNameAddress || '').toLowerCase().includes(searchQuery.toLowerCase());
			
		const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
		
		let matchesDate = true;
		const reqDate = req.createdAt.split('T')[0];
		if (startDate) {
			matchesDate = matchesDate && reqDate >= startDate;
		}
		if (endDate) {
			matchesDate = matchesDate && reqDate <= endDate;
		}

		return matchesSearch && matchesStatus && matchesDate;
	});

	// Pagination math
	const maxPage = Math.ceil(filteredRequests.length / itemsPerPage);
	const activePage = maxPage > 0 ? Math.min(currentPage, maxPage) : 1;
	
	const startIndex = (activePage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

	return (
		<div className="space-y-6">
			{/* Filters Dashboard Toolbar */}
			<div className="bg-white border border-zinc-200/50 rounded-2xl p-4 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
				<div className="flex flex-col md:flex-row gap-3 flex-1 flex-wrap">
					
					{/* Search input */}
					<div className="relative min-w-[200px] flex-1">
						<Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-655" />
						<input 
							type="text" 
							placeholder="Search product, ID, or customer..."
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								setCurrentPage(1);
							}}
							className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-zinc-800 placeholder-zinc-600 focus:bg-white focus:border-[#11236a] outline-none transition-all"
						/>
						{searchQuery && (
							<button 
								onClick={() => {
									setSearchQuery('');
									setCurrentPage(1);
								}}
								className="absolute right-3 top-2.5 text-zinc-550 hover:text-red-655 bg-transparent border-none cursor-pointer outline-none"
							>
								<X className="w-4 h-4" />
							</button>
						)}
					</div>
					
					{/* CustomSelect status filter */}
					<CustomSelect
						value={statusFilter}
						onChange={(val) => {
							setStatusFilter(val);
							setCurrentPage(1);
						}}
						options={[
							{ value: 'ALL',              label: 'All Statuses' },
							{ value: 'PENDING_APPROVAL', label: 'Pending Approval' },
							{ value: 'UNDER_INSPECTION', label: 'Under Inspection' },
							{ value: 'UNDER_TEST',       label: 'Under Test' },
							{ value: 'COMPLETED',        label: 'Completed' },
							{ value: 'REJECTED',         label: 'Rejected' }
						]}
						className="w-44 shrink-0"
					/>

					{/* Date filters */}
					<div className="flex items-center gap-2 bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-1">
						<span className="text-[9px] font-extrabold text-zinc-700 uppercase tracking-wider">From</span>
						<input 
							type="date" 
							value={startDate}
							onChange={(e) => {
								setStartDate(e.target.value);
								setCurrentPage(1);
							}}
							className="bg-transparent border-none text-xs font-semibold text-zinc-700 outline-none cursor-pointer"
						/>
					</div>

					<div className="flex items-center gap-2 bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-1">
						<span className="text-[9px] font-extrabold text-zinc-700 uppercase tracking-wider">To</span>
						<input 
							type="date" 
							value={endDate}
							onChange={(e) => {
								setEndDate(e.target.value);
								setCurrentPage(1);
							}}
							className="bg-transparent border-none text-xs font-semibold text-zinc-700 outline-none cursor-pointer"
						/>
					</div>
				</div>

				{/* Clear Filters Action */}
				{(searchQuery || statusFilter !== 'PENDING_APPROVAL' || startDate || endDate) && (
					<button 
						onClick={() => {
							setSearchQuery('');
							setStatusFilter('PENDING_APPROVAL');
							setStartDate('');
							setEndDate('');
							setCurrentPage(1);
						}}
						className="text-xs font-bold text-red-650 hover:text-red-755 hover:underline bg-transparent border-none cursor-pointer text-left"
					>
						Reset Queue Filter
					</button>
				)}

				{/* Reload button */}
				<button 
					onClick={loadRequests}
					disabled={loading}
					className="bg-[#11236a] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-[#0c1a52] transition-all border-none outline-none cursor-pointer shrink-0 active:scale-[0.98] disabled:opacity-50"
				>
					<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
					<span>Reload Queue</span>
				</button>
			</div>

			{/* Table of requests */}
			<div className="bg-white border border-zinc-200/50 rounded-3xl shadow-sm overflow-hidden p-1">
				{filteredRequests.length === 0 ? (
					<div className="text-center py-16">
						<AlertTriangle className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
						<h4 className="text-sm font-bold text-zinc-700">No requests found in approval queue</h4>
						<p className="text-xs text-zinc-655 font-light mt-1">Refine active filter search queries or date ranges.</p>
					</div>
				) : (
					<div className="overflow-x-auto flex flex-col justify-between">
						<table className="w-full text-left border-collapse min-w-[700px]">
							<thead>
								<tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 font-bold text-[10px] uppercase tracking-wider">
									<th className="py-4 px-6">ID</th>
									<th className="py-4 px-6">Product Details</th>
									<th className="py-4 px-6">Supplier / Customer</th>
									<th className="py-4 px-6">Status</th>
									<th className="py-4 px-6 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-700">
								{paginatedRequests.map((req) => (
									<tr key={req.id} className="hover:bg-zinc-50/50 transition-all group">
										<td className="py-4 px-6 font-bold text-zinc-800">
											{req.requestId || `REQ-00${req.id}`}
										</td>
										<td className="py-4 px-6">
											<p className="text-xs font-bold text-zinc-900 leading-tight">{req.brandName} - {req.modelNo}</p>
											<span className="text-[9px] text-zinc-650 font-bold block mt-0.5">Qty: {req.sampleQty} Pcs • Ref: {req.testMethodRef}</span>
										</td>
										<td className="py-4 px-6 text-zinc-700 font-medium truncate max-w-[200px]">
											{req.customerNameAddress}
										</td>
										<td className="py-4 px-6">
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
										<td className="py-4 px-6 text-right">
											<button 
												onClick={() => navigate(`/head/sample-tests/${req.id}`)}
												className="text-xs font-bold text-[#11236a] hover:text-[#0c1a52] cursor-pointer group-hover:underline bg-transparent border-none outline-none"
											>
												View Details
											</button>
										</td>
									</tr>
								))}
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
							itemNamePlural="requests"
						/>
					</div>
				)}
			</div>
		</div>
	);
}
