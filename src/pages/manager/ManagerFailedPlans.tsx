import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, FileText, ArrowRight, RefreshCw, Search, CheckCircle } from 'lucide-react';
import { getTestRequests } from '../../services/operations/testRequestService';
import { getCapas } from '../../services/operations/capaService';
import CustomSelect from '../../components/CustomSelect';
import Pagination from '../../components/Pagination';

interface ManagerFailedPlansProps {
	onFillCapa: (request: any, plan: any) => void;
	onViewCapa?: (request: any, plan: any) => void;
}

export default function ManagerFailedPlans({ onFillCapa, onViewCapa }: ManagerFailedPlansProps) {
	const navigate = useNavigate();
	const [requests, setRequests] = useState<any[]>([]);
	const [capas, setCapas] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const [search, setSearch] = useState('');
	const [capaStatusFilter, setCapaStatusFilter] = useState('ALL');
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');

	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);

	const loadData = async () => {
		setLoading(true);
		try {
			const fetchOp = getTestRequests();
			const data = await fetchOp();
			setRequests(data || []);

			const capasData = await getCapas()();
			setCapas(capasData || []);
		} catch (err) {
			console.error('Failed to fetch requests/capas:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	const findMatchingCapa = (request: any, plan: any) => {
		const reqIdFull = (request.requestId || `REQ-00${request.id}`).toLowerCase();
		const reqIdNumOnly = String(request.id || request.dbId || '');

		return capas.find((c: any) => {
			const relReq = (c.relatedRequest || '').toLowerCase();
			const matchesReq = relReq.includes(reqIdFull) ||
				reqIdFull.includes(relReq) ||
				(reqIdNumOnly && relReq.includes(reqIdNumOnly));

			if (!matchesReq) return false;

			const text = `${c.title || ''} ${c.problem || ''} ${c.nonConformity || ''}`.toLowerCase();
			const planName = (plan.testType?.name || '').toLowerCase();
			const sampleStr = `sample #${plan.sampleIndex + 1}`;

			const matchesPlanName = planName ? text.includes(planName) : true;
			const matchesSampleNum = text.includes(sampleStr);

			return matchesPlanName && matchesSampleNum;
		});
	};

	const checkIsCapaFilled = (request: any, plan: any) => {
		return !!findMatchingCapa(request, plan);
	};

	const failedPlansList: { request: any; plan: any; isCapaFilled: boolean }[] = [];
	requests.forEach((req: any) => {
		(req.testPlans || []).forEach((p: any) => {
			const isFailed = (p.evaluationStatus || '').toUpperCase() === 'FAILED';
			const evalRemarks = p.evaluationRemarks || '';

			// Include plans returned by the Head to Lab Manager for CAPA or returned for Retest
			const isReturnedToLabManagerOrRetest = p.headAction === 'RETURNED_TO_LAB_MANAGER' ||
				evalRemarks.includes('[HEAD_ACTION:RETURNED_TO_LAB_MANAGER]') ||
				p.headAction === 'RETURNED_TO_TESTING' ||
				evalRemarks.includes('[HEAD_ACTION:RETURNED_TO_TESTING]') ||
				(req.status || '').toUpperCase() === 'RETEST';

			// Exclude plans that were assigned to the requester for CAPA
			const isReturnedToRequester = p.headAction === 'RETURNED_TO_REQUESTER' ||
				evalRemarks.includes('[HEAD_ACTION:RETURNED_TO_REQUESTER]');

			// Exclude in-progress child retest plans
			const isChildRetest = Boolean(p.parentPlanId);

			if (isFailed && !isChildRetest && !isReturnedToRequester && isReturnedToLabManagerOrRetest) {
				failedPlansList.push({
					request: req,
					plan: p,
					isCapaFilled: checkIsCapaFilled(req, p)
				});
			}
		});
	});

	const filtered = failedPlansList.filter(({ request, plan, isCapaFilled }) => {
		const q = search.toLowerCase();
		const matchesSearch = (
			(request.requestId || '').toLowerCase().includes(q) ||
			(request.brandName || '').toLowerCase().includes(q) ||
			(request.modelNo || '').toLowerCase().includes(q) ||
			(plan.testType?.name || '').toLowerCase().includes(q)
		);

		let matchesCapaStatus = true;
		if (capaStatusFilter === 'PENDING_CAPA') {
			matchesCapaStatus = !isCapaFilled;
		} else if (capaStatusFilter === 'CAPA_FILLED') {
			matchesCapaStatus = isCapaFilled;
		}

		let matchesDate = true;
		const reqDate = (request.updatedAt || request.createdAt || '').split('T')[0];
		if (startDate) {
			matchesDate = matchesDate && reqDate >= startDate;
		}
		if (endDate) {
			matchesDate = matchesDate && reqDate <= endDate;
		}

		return matchesSearch && matchesCapaStatus && matchesDate;
	});

	const hasActiveFilters = search || capaStatusFilter !== 'ALL' || startDate || endDate;

	const maxPage = Math.ceil(filtered.length / itemsPerPage);
	const activePage = maxPage > 0 ? Math.min(currentPage, maxPage) : 1;
	const startIndex = (activePage - 1) * itemsPerPage;
	const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

	return (
		<div className="space-y-6">
			<div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
						<AlertTriangle className="w-5 h-5 text-blue-600" />
					</div>
					<div>
						<h3 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">
							Lab Manager Action Required: {failedPlansList.length} Failed Test Plans Returned
						</h3>
						<p className="text-[11px] text-blue-700 font-medium mt-0.5">
							The Head of Laboratory returned these failed test plans to the Lab Manager for internal lab CAPA documentation and root cause action.
						</p>
					</div>
				</div>
				<button
					onClick={loadData}
					disabled={loading}
					className="p-2 text-blue-700 hover:bg-blue-100 rounded-lg transition-all cursor-pointer border-none outline-none disabled:opacity-50"
				>
					<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
				</button>
			</div>

			<div className="bg-white border border-zinc-200/50 rounded-2xl p-4 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
				<div className="flex flex-col md:flex-row gap-3 flex-1 flex-wrap">
					<div className="relative min-w-[220px] flex-1">
						<Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
						<input
							type="text"
							placeholder="Search by Request ID, brand, model or test type..."
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setCurrentPage(1);
							}}
							className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-[#11236a] outline-none transition-all"
						/>
					</div>

					<CustomSelect
						value={capaStatusFilter}
						onChange={(val) => {
							setCapaStatusFilter(val);
							setCurrentPage(1);
						}}
						options={[
							{ value: 'ALL', label: 'All CAPA Statuses' },
							{ value: 'PENDING_CAPA', label: 'CAPA Pending' },
							{ value: 'CAPA_FILLED', label: 'CAPA Filled' }
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

				<div className="flex items-center justify-between xl:justify-end gap-3 shrink-0">
					{hasActiveFilters && (
						<button
							onClick={() => {
								setSearch('');
								setCapaStatusFilter('ALL');
								setStartDate('');
								setEndDate('');
								setCurrentPage(1);
							}}
							className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline bg-transparent border-none cursor-pointer"
						>
							Reset Filters
						</button>
					)}
					<span className="text-xs font-bold text-zinc-400 uppercase">{filtered.length} plans found</span>
				</div>
			</div>

			<div className="bg-white border border-zinc-200/50 rounded-2xl shadow-sm overflow-hidden">
				{loading ? (
					<div className="flex flex-col items-center justify-center py-20 gap-3">
						<RefreshCw className="w-8 h-8 text-[#11236a] animate-spin" />
						<p className="text-xs text-zinc-500 font-bold">Loading failed test plans...</p>
					</div>
				) : paginated.length === 0 ? (
					<div className="py-16 text-center bg-white">
						<AlertTriangle className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
						<p className="text-sm font-bold text-zinc-400">No failed test plans match your search and filter criteria.</p>
					</div>
				) : (
					<>
						<div className="divide-y divide-zinc-100">
							{paginated.map(({ request, plan, isCapaFilled }, idx) => {
								const cleanRemarks = (plan.evaluationRemarks || '').replace(/\[HEAD_ACTION:[^\]]+\]/g, '').trim();
								return (
									<div key={idx} className="p-5 hover:bg-zinc-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
										<div className="space-y-1.5 flex-1">
											<div className="flex items-center gap-2 flex-wrap">
												<span className="text-xs font-extrabold text-[#11236a]">
													{request.requestId || `REQ-00${request.id}`}
												</span>
												<span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
													Sample #{plan.sampleIndex + 1}
												</span>
												<span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
													FAILED: {plan.testType?.name || 'Test Plan'}
												</span>
												{isCapaFilled ? (
													<span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
														<CheckCircle className="w-3 h-3 text-emerald-600" />
														CAPA FILLED
													</span>
												) : (
													<span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
														CAPA PENDING
													</span>
												)}
												{(() => {
													const hasRetest = (request.testPlans || []).some((tp: any) => Number(tp.parentPlanId) === Number(plan.id));
													if (hasRetest) {
														return (
															<span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
																🔄 RETEST CONFIGURED
															</span>
														);
													}
													return null;
												})()}
											</div>

											<p className="text-xs font-bold text-zinc-800">
												{request.brandName} — {request.modelNo}
											</p>

											{cleanRemarks && (
												<p className="text-xs text-blue-800 font-semibold bg-blue-50/60 p-2.5 rounded-xl border border-blue-100 max-w-2xl">
													Evaluation Remarks: <span className="font-normal">{cleanRemarks}</span>
												</p>
											)}
										</div>

										<div className="flex items-center gap-2 shrink-0">
											<button
												onClick={() => window.open(`/reports/preview?type=plan&key=${request.id}-plan-${plan.id}`, '_blank')}
												className="inline-flex items-center gap-1 text-xs font-bold text-zinc-700 hover:text-[#11236a] px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-all cursor-pointer outline-none"
											>
												<FileText className="w-3.5 h-3.5" />
												<span>Report</span>
											</button>

											{isCapaFilled ? (
												<button
													onClick={() => {
														const matchedCapa = findMatchingCapa(request, plan);
														if (onViewCapa) {
															onViewCapa(request, plan);
														} else if (matchedCapa) {
															navigate(`/manager/capa-management/${matchedCapa.id}`);
														} else {
															navigate('/manager/capa-management');
														}
													}}
													className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-xl transition-all cursor-pointer outline-none active:scale-95 shadow-xs"
												>
													<CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
													<span>View CAPA</span>
												</button>
											) : (
												<button
													onClick={() => onFillCapa(request, plan)}
													className="inline-flex items-center gap-1.5 text-xs font-extrabold text-white bg-[#11236a] hover:bg-[#0c1a52] px-4 py-2 rounded-xl transition-all cursor-pointer border-none outline-none shadow-xs active:scale-95"
												>
													<span>Fill CAPA</span>
													<ArrowRight className="w-3.5 h-3.5" />
												</button>
											)}
										</div>
									</div>
								);
							})}
						</div>

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