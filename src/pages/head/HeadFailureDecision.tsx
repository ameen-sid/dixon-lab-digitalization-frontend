import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCw, Eye, AlertTriangle } from 'lucide-react';
import { getTestRequests } from '../../services/operations/testRequestService';
import CustomSelect from '../../components/CustomSelect';
import Pagination from '../../components/Pagination';

export default function HeadFailureDecision() {
	const navigate = useNavigate();
	const [requests, setRequests] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState('ALL');
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');

	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(20);

	const loadRequests = async () => {
		setLoading(true);
		try {
			const fetchRequests = getTestRequests();
			const data = await fetchRequests();
			setRequests(data || []);
		} catch (error) {
			console.error('Failed to fetch failed requests:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadRequests();
	}, []);

	const allFailedItems = requests.flatMap((req: any) => {
		const reqDate = req.createdAt || req.updatedAt;
		const year = reqDate ? new Date(reqDate).getFullYear() : new Date().getFullYear();
		let rawReqId = req.requestId || String(req.id || '');
		rawReqId = rawReqId.replace(/^REQ-/i, '');

		let reqWithYear = rawReqId;
		if (!/^\d{4}-/.test(rawReqId)) {
			const idPart = /^\d+$/.test(rawReqId) ? String(Number(rawReqId)).padStart(3, '0') : rawReqId;
			reqWithYear = `${year}-${idPart}`;
		}

		const items: any[] = [];

		const requestPlans = req.testPlans || [];
		const remarksLower = (req.remarks || '').toLowerCase();
		const statusLower = (req.status || '').toLowerCase();
		const isSubmittedToHead = remarksLower.includes('submitted to head') ||
			remarksLower.includes('submitted to head panel') ||
			['retest', 'completed'].includes(statusLower);

		if (isSubmittedToHead) {
			requestPlans.forEach((p: any) => {
				const isRetestPlan = Boolean(p.parentPlanId || p.isRetest);
				if (!isRetestPlan && (p.evaluationStatus || '').toUpperCase() === 'FAILED') {
					const sampleSuffix = `S${String(p.sampleIndex + 1).padStart(2, '0')}`;
					const allottedCode = (p.allottedId && /REQ-\d{4}-/i.test(p.allottedId))
						? p.allottedId
						: `REQ-${reqWithYear}-${sampleSuffix}`;

					const currentHeadAction = p.headAction || (
						(p.evaluationRemarks || '').includes('[HEAD_ACTION:RETURNED_TO_REQUESTER]')
							? 'RETURNED_TO_REQUESTER'
							: (p.evaluationRemarks || '').includes('[HEAD_ACTION:RETURNED_TO_LAB_MANAGER]')
								? 'RETURNED_TO_LAB_MANAGER'
								: (p.evaluationRemarks || '').includes('[HEAD_ACTION:RETURNED_TO_TESTING]')
									? 'RETURNED_TO_TESTING'
									: (p.evaluationRemarks || '').includes('[HEAD_ACTION:APPROVED_BY_HEAD]')
										? 'APPROVED_BY_HEAD'
										: (req.status === 'RETEST' ? 'RETURNED_TO_TESTING' : null)
					);

					items.push({
						id: `${req.id}-plan-${p.id}`,
						reqId: req.id,
						planId: p.id,
						sampleIndex: p.sampleIndex,
						allottedCode,
						type: 'TEST_PLAN_FAILURE',
						testTypeName: p.testType?.name || 'Test Plan',
						brandName: req.brandName,
						modelNo: req.modelNo,
						customerName: req.customerNameAddress,
						date: p.evaluatedAt || p.updatedAt || req.updatedAt || req.createdAt,
						headAction: currentHeadAction,
						request: req,
						plan: p
					});
				}
			});
		}

		const qty = req.sampleQty || 1;
		for (let i = 0; i < qty; i++) {
			const insp = (req.sampleInspections || []).find((r: any) => Number(r.sampleIndex) === i);
			if (insp && insp.status === 'FAILED') {
				const sampleSuffix = `S${String(i + 1).padStart(2, '0')}`;
				const allottedCode = insp.allottedId || `REQ-${reqWithYear}-${sampleSuffix}`;

				const currentHeadAction = insp.headAction || (
					(insp.remarks || '').includes('[HEAD_ACTION:RETURNED_TO_REQUESTER]')
						? 'RETURNED_TO_REQUESTER'
						: (insp.remarks || '').includes('[HEAD_ACTION:RETURNED_TO_LAB_MANAGER]')
							? 'RETURNED_TO_LAB_MANAGER'
							: (insp.remarks || '').includes('[HEAD_ACTION:RETURNED_TO_TESTING]')
								? 'RETURNED_TO_TESTING'
								: (insp.remarks || '').includes('[HEAD_ACTION:APPROVED_BY_HEAD]')
									? 'APPROVED_BY_HEAD'
									: (req.status === 'RETEST' ? 'RETURNED_TO_TESTING' : null)
				);

				items.push({
					id: `${req.id}-inspection-${i}`,
					reqId: req.id,
					sampleIndex: i,
					allottedCode,
					type: 'INSPECTION_FAILURE',
					testTypeName: 'Visual Inspection Failure',
					brandName: req.brandName,
					modelNo: req.modelNo,
					customerName: req.customerNameAddress,
					date: insp.updatedAt || insp.createdAt || req.updatedAt || req.createdAt,
					headAction: currentHeadAction,
					request: req,
					inspection: insp
				});
			}
		}

		return items;
	});

	const filtered = allFailedItems.filter((item: any) => {
		const q = search.toLowerCase();
		const matchesSearch = (
			(item.allottedCode || '').toLowerCase().includes(q) ||
			(item.request.requestId || '').toLowerCase().includes(q) ||
			(item.brandName || '').toLowerCase().includes(q) ||
			(item.modelNo || '').toLowerCase().includes(q) ||
			(item.customerName || '').toLowerCase().includes(q) ||
			(item.testTypeName || '').toLowerCase().includes(q)
		);

		const isDecisionTaken = Boolean(item.headAction) || (item.request.status || '').toLowerCase() === 'retest';

		let matchesStatus = true;
		if (statusFilter === 'PENDING_DECISION') {
			matchesStatus = !isDecisionTaken;
		} else if (statusFilter === 'DECISION_TAKEN') {
			matchesStatus = isDecisionTaken;
		}

		let matchesDate = true;
		const reqDate = (item.date || '').split('T')[0];
		if (startDate) {
			matchesDate = matchesDate && reqDate >= startDate;
		}
		if (endDate) {
			matchesDate = matchesDate && reqDate <= endDate;
		}

		return matchesSearch && matchesStatus && matchesDate;
	});

	const formatDate = (dateStr: string) => {
		if (!dateStr) return 'N/A';
		const d = new Date(dateStr);
		if (isNaN(d.getTime())) return dateStr;
		const day = String(d.getDate()).padStart(2, '0');
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const year = d.getFullYear();
		return `${day}/${month}/${year}`;
	};

	const maxPage = Math.ceil(filtered.length / itemsPerPage);
	const activePage = maxPage > 0 ? Math.min(currentPage, maxPage) : 1;

	const startIndex = (activePage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedFiltered = filtered.slice(startIndex, endIndex);

	const pendingCount = allFailedItems.filter((item: any) => {
		return !item.headAction && (item.request.status || '').toLowerCase() !== 'retest';
	}).length;

	return (
		<div className="space-y-5">
			<div className={`${pendingCount > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'} border rounded-2xl p-4 flex items-center justify-between gap-3`}>
				<div className="flex items-center gap-3">
					<div className={`w-9 h-9 ${pendingCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'} rounded-xl flex items-center justify-center shrink-0`}>
						<AlertTriangle className="w-5 h-5" />
					</div>
					<div>
						<p className={`text-xs font-bold ${pendingCount > 0 ? 'text-rose-800' : 'text-emerald-800'}`}>
							{pendingCount} Failed Sample Test Plans Pending Adjudication
						</p>
						<p className={`text-[10px] ${pendingCount > 0 ? 'text-rose-600' : 'text-emerald-600'} font-medium mt-0.5`}>
							{pendingCount > 0 
								? 'Review individual failed test outcomes, choose to return to requester or return to lab manager for CAPA.'
								: 'All failed test plans have been adjudicated by Head of Laboratory.'}
						</p>
					</div>
				</div>
				<button
					onClick={loadRequests}
					disabled={loading}
					className="p-2 text-zinc-555 hover:text-[#11236a] hover:bg-zinc-100 rounded-lg cursor-pointer transition-all border-none outline-none disabled:opacity-50"
				>
					<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
				</button>
			</div>
			<div className="bg-white border border-zinc-200/50 rounded-2xl p-4 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
				<div className="flex flex-col md:flex-row gap-3 flex-1 flex-wrap">
					<div className="relative min-w-[200px] flex-1">
						<Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
						<input
							type="text"
							placeholder="Search by code, brand, model or test type..."
							value={search}
							onChange={e => {
								setSearch(e.target.value);
								setCurrentPage(1);
							}}
							className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-[#11236a] outline-none transition-all"
						/>
					</div>

					<CustomSelect
						value={statusFilter}
						onChange={(val) => {
							setStatusFilter(val);
							setCurrentPage(1);
						}}
						options={[
							{ value: 'ALL', label: 'All Failures' },
							{ value: 'PENDING_DECISION', label: 'Pending Decision' },
							{ value: 'DECISION_TAKEN', label: 'Decisions Taken' }
						]}
						className="w-44 shrink-0"
					/>
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

				<div className="flex items-center gap-3 shrink-0">
					{(search || statusFilter !== 'ALL' || startDate || endDate) && (
						<button
							onClick={() => {
								setSearch('');
								setStatusFilter('ALL');
								setStartDate('');
								setEndDate('');
								setCurrentPage(1);
							}}
							className="text-xs font-bold text-red-650 hover:text-red-755 hover:underline bg-transparent border-none cursor-pointer text-left mr-2"
						>
							Reset Filters
						</button>
					)}
					<span className="text-[10px] font-bold text-zinc-400 uppercase">{filtered.length} failed items found</span>
				</div>
			</div>
			<div className="bg-white border border-zinc-200/50 rounded-2xl shadow-sm overflow-hidden">
				{loading ? (
					<div className="flex flex-col items-center justify-center py-20 gap-3">
						<RefreshCw className="w-8 h-8 text-[#11236a] animate-spin" />
						<p className="text-xs text-zinc-555 font-bold">Retrieving failed records...</p>
					</div>
				) : (
					<>
						<table className="w-full text-xs">
							<thead>
								<tr className="bg-zinc-50 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-100">
									<th className="py-3 px-5 text-left">Allotted Code</th>
									<th className="py-3 px-5 text-left">Brand / Model</th>
									<th className="py-3 px-5 text-left">Test Type / Component</th>
									<th className="py-3 px-5 text-left">Customer</th>
									<th className="py-3 px-5 text-left">Result Status</th>
									<th className="py-3 px-5 text-left">Date</th>
									<th className="py-3 px-5 text-right">Actions</th>
								</tr>
							</thead>
							<tbody>
								{paginatedFiltered.map((item, i) => {
									let badgeClass = 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse';
									let badgeText = 'FAILED (PENDING DECISION)';

									if (item.headAction === 'RETURNED_TO_REQUESTER') {
										badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
										badgeText = 'RETURNED TO REQUESTER';
									} else if (item.headAction === 'RETURNED_TO_LAB_MANAGER') {
										badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
										badgeText = 'RETURNED TO LAB MANAGER';
									} else if (item.headAction === 'RETURNED_TO_TESTING') {
										badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
										badgeText = 'RETURNED FOR RETEST';
									} else if (item.headAction === 'APPROVED_BY_HEAD') {
										badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';
										badgeText = 'FINALIZED & RELEASED';
									}

									return (
										<tr key={i} className="border-t border-zinc-100 hover:bg-zinc-50/50 transition-colors">
											<td className="py-4 px-5 font-bold text-[#11236a]">
												{item.allottedCode}
											</td>
											<td className="py-4 px-5">
												<p className="font-bold text-zinc-800">{item.brandName}</p>
												<p className="text-zinc-400 text-[10px] font-semibold mt-0.5">{item.modelNo}</p>
											</td>
											<td className="py-4 px-5 font-bold text-zinc-700">
												<span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full border border-rose-100">
													{item.testTypeName}
												</span>
											</td>
											<td className="py-4 px-5 text-zinc-600 font-medium truncate max-w-[150px]">{item.customerName}</td>
											<td className="py-4 px-5">
												<span className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${badgeClass}`}>
													{badgeText}
												</span>
											</td>
											<td className="py-4 px-5 text-zinc-400 font-medium">{formatDate(item.date)}</td>
											<td className="py-4 px-5 text-right">
												<div className="flex items-center justify-end gap-2">
													<button
														onClick={() => {
															const queryParam = item.planId ? `?planId=${item.planId}` : (item.sampleIndex !== undefined ? `?sampleIndex=${item.sampleIndex}` : '');
															navigate(`/head/failure-decision/${item.reqId}${queryParam}`);
														}}
														className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#11236a] hover:text-white px-2.5 py-1.5 rounded-lg border border-[#11236a]/20 bg-white hover:bg-[#11236a] transition-all cursor-pointer outline-none"
													>
														<Eye className="w-3.5 h-3.5" /> View Details
													</button>
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
						{filtered.length === 0 && (
							<div className="py-16 text-center bg-white">
								<AlertTriangle className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
								<p className="text-sm font-bold text-zinc-400">No failed sample test plans found matching your filter criteria.</p>
							</div>
						)}
						<Pagination
							totalItems={filtered.length}
							itemsPerPage={itemsPerPage}
							currentPage={currentPage}
							onPageChange={setCurrentPage}
							onItemsPerPageChange={(limit) => {
								setItemsPerPage(limit);
								setCurrentPage(1);
							}}
							itemNamePlural="failed plans"
						/>
					</>
				)}
			</div>
		</div>
	);
}