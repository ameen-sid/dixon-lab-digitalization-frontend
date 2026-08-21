import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
	RotateCw, FileText, Search, Eye, CheckCircle, XCircle
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';

import Pagination from '../../components/Pagination';
import CustomSelect from '../../components/CustomSelect';

import { getNablRequests } from '../../services/operations/nablRequestService';

interface Attachment {
	id: number;
	fileName: string;
	filePath: string;
	fileSize: number;
}

interface TestPlan {
	id: number;
	startDate: string | null;
	endDate: string | null;
	issueDate: string | null;
	reportNo: string | null;
	testedBy: string | null;
	reviewedAndApprovedBy: string | null;
	status: string;
	attachments: Attachment[];
}

interface RequestRecord {
	id: number;
	requestId: string | null;
	customerNameAddress: string;
	manufacturerNameAddress: string;
	customerContactDetails: string;
	sampleDescription: string;
	modelNo: string;
	familyModel: string | null;
	serialNumber: string | null;
	productRating: string;
	sampleQty: number;
	brandName: string;
	customerSignName?: string | null;
	status: string;
	createdAt: string;
	attachments?: Attachment[];
	testPlan: TestPlan | null;
}

export default function NablManagerCompletedTests() {
	const navigate = useNavigate();
	const token = localStorage.getItem('token');
	const userStr = localStorage.getItem('user');

	useEffect(() => {
		if (!token || !userStr) {
			localStorage.clear();
			navigate('/');
			return;
		}
		const user = JSON.parse(userStr);
		const role = user.role ? user.role.toLowerCase() : 'requester';
		if (role !== 'nabl manager') {
			navigate('/dashboard', { replace: true });
		}
	}, [token, userStr, navigate]);

	const [loading, setLoading] = useState(false);
	const [requests, setRequests] = useState<RequestRecord[]>([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [evalFilter, setEvalFilter] = useState('ALL');
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(20);

	const fetchCompletedRequests = async () => {
		setLoading(true);
		try {
			const allReqs = await getNablRequests()();
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const completed = (allReqs || []).filter((req: RequestRecord) => {
				if (!req.testPlan?.endDate) return false;

				const end = new Date(req.testPlan.endDate);
				end.setHours(23, 59, 59, 999);
				return today > end;
			});

			setRequests(completed);
		} catch (error) {
			console.error('Failed to load completed NABL tests:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (token && userStr) {
			fetchCompletedRequests();
		}
	}, [token, userStr]);

	const handleRefresh = async () => {
		await fetchCompletedRequests();
		toast.success('Completed tests queue synchronized.');
	};

	const filteredRequests = requests.filter(r => {
		const matchesSearch = 
			(r.customerSignName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
			(r.brandName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
			(r.modelNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
			(r.sampleDescription || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
			(r.testPlan?.reportNo || '').toLowerCase().includes(searchTerm.toLowerCase());

		if (!matchesSearch) return false;
		if (evalFilter === 'ALL') return true;

		const planEval = (r.testPlan?.status || '').toUpperCase();
		const isFail = ['FAILED', 'FAIL'].includes(planEval);

		if (evalFilter === 'PASS') return !isFail;
		if (evalFilter === 'FAIL') return isFail;
		return true;
	});

	const paginatedRequests = filteredRequests.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	const getEvalBadge = (req: RequestRecord) => {
		const planEval = (req.testPlan?.status || '').toUpperCase();
		if (['FAILED', 'FAIL'].includes(planEval)) {
			return (
				<span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full text-[10px] font-bold border border-rose-200/60 uppercase tracking-wide inline-flex items-center gap-1">
					<XCircle className="w-3 h-3 text-rose-600" /> FAIL
				</span>
			);
		}
		return (
			<span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-200/60 uppercase tracking-wide inline-flex items-center gap-1">
				<CheckCircle className="w-3 h-3 text-emerald-600" /> PASS
			</span>
		);
	};

	return (
		<DashboardLayout title="Completed Tests Registry">
			<div className="space-y-6">
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-zinc-200/60 p-4 rounded-2xl shadow-sm">
					<div className="relative w-full sm:max-w-md">
						<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
						<input 
							type="text" 
							placeholder="Search by Customer, Report No, Brand, Model..." 
							value={searchTerm}
							onChange={(e) => {
								setSearchTerm(e.target.value);
								setCurrentPage(1);
							}}
							className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-zinc-200 rounded-xl text-xs font-medium placeholder-zinc-400 focus:outline-none focus:border-[#11236a] transition-all"
						/>
					</div>

					<div className="flex items-center gap-3 shrink-0">
						<CustomSelect
							value={evalFilter}
							onChange={(val) => {
								setEvalFilter(val);
								setCurrentPage(1);
							}}
							options={[
								{ value: 'ALL', label: 'All Evaluation Results' },
								{ value: 'PASS', label: 'Pass Only' },
								{ value: 'FAIL', label: 'Fail Only' },
							]}
							className="w-52"
						/>

						<button 
							onClick={handleRefresh}
							disabled={loading}
							title="Synchronize completed tests"
							className="w-10 h-10 bg-[#f8fafc] hover:bg-zinc-100 border border-zinc-200 text-zinc-600 rounded-xl flex items-center justify-center transition-all cursor-pointer outline-none active:scale-95 border-none"
						>
							<RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
						</button>
					</div>
				</div>
				<div className="bg-white border border-zinc-200/60 rounded-[24px] overflow-hidden shadow-sm p-6">
					{loading ? (
						<div className="flex flex-col items-center justify-center py-20 gap-3">
							<div className="w-10 h-10 border-4 border-[#11236a] border-t-transparent rounded-full animate-spin" />
							<p className="text-zinc-500 font-bold text-xs">Loading completed tests queue...</p>
						</div>
					) : filteredRequests.length === 0 ? (
						<div className="text-center py-16 bg-zinc-50/50 border border-dashed border-zinc-200 rounded-2xl">
							<FileText className="w-10 h-10 text-zinc-350 mx-auto mb-2.5" />
							<p className="text-zinc-500 font-bold text-xs">No completed tests found in the database.</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left border-collapse">
								<thead>
									<tr className="border-b border-zinc-200 bg-zinc-50/50 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
										<th className="px-4 py-3.5">Customer Name</th>
										<th className="px-4 py-3.5">Brand / Model</th>
										<th className="px-4 py-3.5">Sample Description</th>
										<th className="px-4 py-3.5">Timeline</th>
										<th className="px-4 py-3.5">Report No</th>
										<th className="px-4 py-3.5 text-center">Evaluation</th>
										<th className="px-4 py-3.5 text-center">Action</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-zinc-100 text-xs">
									{paginatedRequests.map((row) => (
										<tr key={row.id} className="hover:bg-zinc-50/60 transition-colors">
											<td className="px-4 py-4 font-extrabold text-[#11236a] italic">
												{row.customerSignName || '—'}
											</td>
											<td className="px-4 py-4">
												<div className="font-extrabold text-zinc-800">{row.brandName}</div>
												<div className="text-[10px] font-bold text-zinc-500">{row.modelNo}</div>
											</td>
											<td className="px-4 py-4 text-zinc-650 max-w-xs truncate" title={row.sampleDescription}>
												{row.sampleDescription}
											</td>
											<td className="px-4 py-4 text-zinc-500 text-[11px]">
												{row.testPlan?.startDate && row.testPlan?.endDate ? (
													<div>
														<span className="font-semibold">{new Date(row.testPlan.startDate).toLocaleDateString()}</span>
														<span className="mx-1 text-zinc-400">→</span>
														<span className="font-semibold">{new Date(row.testPlan.endDate).toLocaleDateString()}</span>
													</div>
												) : (
													<span className="italic text-zinc-400">N/A</span>
												)}
											</td>
											<td className="px-4 py-4 font-bold text-zinc-800">
												{row.testPlan?.reportNo || '—'}
											</td>
											<td className="px-4 py-4 text-center">
												{getEvalBadge(row)}
											</td>
											<td className="px-4 py-4 text-center">
												<button
													onClick={() => navigate(`/nabl-manager/completed-tests/${row.id}`)}
													title="View full request & test plan details"
													className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#11236a] hover:bg-[#0c1a52] text-white font-extrabold text-[10px] rounded-lg transition-all cursor-pointer outline-none border-none active:scale-95 shadow-sm"
												>
													<Eye className="w-3.5 h-3.5" /> View Details
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
								itemNamePlural="completed tests"
							/>
						</div>
					)}
				</div>
			</div>
		</DashboardLayout>
	);
}