import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Eye, AlertTriangle, ChevronRight, FolderOpen, RefreshCw, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import CustomSelect from '../../components/CustomSelect';
import Pagination from '../../components/Pagination';

interface ManagerCompletedRequestsProps {
	requests: any[];
	selectedRequestId?: string;
}

export default function ManagerCompletedRequests({ requests, selectedRequestId }: ManagerCompletedRequestsProps) {
	const navigate = useNavigate();
	
	const handleDownloadTearDownExcel = async (plan: any, request: any) => {
		try {
			const token = localStorage.getItem('token');
			const res = await fetch(`/api/v1/test-requests/${request.id}/test-plans/${plan.id}/tear-down-report`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			if (!res.ok) {
				throw new Error('Failed to generate report');
			}

			const blob = await res.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `Tear_Down_Report_${request.brandName}_${request.modelNo}_Plan_${plan.id}.xlsx`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			window.URL.revokeObjectURL(url);
			toast.success('Tear Down Report downloaded successfully!');
		} catch (err) {
			console.error(err);
			toast.error('Failed to download Tear Down Report.');
		}
	};
	
	// Filtering and UI states
	const [searchQuery, setSearchQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState('ALL');
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(5);

	// Resolve the selected request for details view
	const selectedReq = selectedRequestId
		? requests.find(r => String(r.id) === String(selectedRequestId))
		: null;

	const evaluatedRequests = requests.filter((r: any) => {
		const statusUpper = (r.status || '').toUpperCase();
		const remarks = r.remarks || '';
		
		if (statusUpper === 'COMPLETED') {
			return true;
		}
		if (statusUpper === 'FAILED') {
			return true;
		}
		if (statusUpper === 'INSPECTION_FAILED' && remarks.includes('Approved by Head')) {
			return true;
		}
		return false;
	});

	// Apply search and filter criteria
	const filteredRequests = evaluatedRequests.filter((r: any) => {
		// 1. Search filter
		const idStr = String(r.id).toLowerCase();
		const matchesSearch = 
			(r.requestId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
			idStr.includes(searchQuery.toLowerCase()) ||
			(r.brandName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
			(r.modelNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
			(r.customerNameAddress || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
			(r.sampleDescription || '').toLowerCase().includes(searchQuery.toLowerCase());

		// 2. Status filter
		const statusUpper = (r.status || '').toUpperCase();
		const isPassed = ['COMPLETED', 'TESTING_PASSED'].includes(statusUpper);
		const isFailed = ['FAILED', 'TESTING_FAILED', 'INSPECTION_FAILED'].includes(statusUpper);
		const isPartial = ['TESTING_PARTIAL', 'TESTING_COMPLETED'].includes(statusUpper);

		let matchesStatus = true;
		if (statusFilter === 'PASSED') {
			matchesStatus = isPassed;
		} else if (statusFilter === 'FAILED') {
			matchesStatus = isFailed;
		} else if (statusFilter === 'PARTIAL') {
			matchesStatus = isPartial;
		}

		// 3. Date range filter
		let matchesDate = true;
		const reqDate = r.approvedDate || r.updatedAt?.split('T')[0] || r.createdAt?.split('T')[0] || '';
		if (startDate) {
			matchesDate = matchesDate && reqDate >= startDate;
		}
		if (endDate) {
			matchesDate = matchesDate && reqDate <= endDate;
		}

		return matchesSearch && matchesStatus && matchesDate;
	});

	// Date format helper
	const formatDate = (dateStr: string) => {
		if (!dateStr) return 'N/A';
		const d = new Date(dateStr);
		if (isNaN(d.getTime())) return dateStr;
		const day = String(d.getDate()).padStart(2, '0');
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const year = d.getFullYear();
		return `${day}/${month}/${year}`;
	};

	// Status badge helper
	const getStatusBadge = (status: string) => {
		const s = (status || '').toUpperCase();
		if (s === 'COMPLETED' || s === 'TESTING_PASSED') {
			return {
				text: 'PASSED',
				className: 'bg-emerald-50 text-emerald-700 border-emerald-100'
			};
		} else if (s === 'FAILED' || s === 'TESTING_FAILED') {
			return {
				text: 'FAILED',
				className: 'bg-rose-50 text-rose-700 border-rose-100'
			};
		} else if (s === 'INSPECTION_FAILED') {
			return {
				text: 'INSPECTION FAILED',
				className: 'bg-amber-50 text-amber-700 border-amber-250'
			};
		} else {
			return {
				text: 'PARTIAL / EVALUATED',
				className: 'bg-blue-50 text-blue-700 border-blue-100'
			};
		}
	};

	// Pagination parameters
	const maxPage = Math.ceil(filteredRequests.length / itemsPerPage);
	const activePage = maxPage > 0 ? Math.min(currentPage, maxPage) : 1;
	const startIndex = (activePage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

	// Render details view
	if (selectedRequestId) {
		if (!selectedReq) {
			return (
				<div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-zinc-200 rounded-3xl p-8">
					<RefreshCw className="w-8 h-8 text-[#11236a] animate-spin" />
					<p className="text-xs text-zinc-555 font-bold">Retrieving evaluation record from database...</p>
				</div>
			);
		}

		const statusObj = getStatusBadge(selectedReq.status);

		return (
			<div className="space-y-6 animate-fade-in">
				{/* Top Back Nav bar */}
				<div className="flex items-center gap-3">
					<button
						onClick={() => navigate('/manager/completed-requests')}
						className="w-9 h-9 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-555 hover:text-zinc-800 hover:shadow-sm transition-all cursor-pointer outline-none"
					>
						<ArrowLeft className="w-4 h-4 shrink-0" />
					</button>
					<div>
						<h3 className="text-base font-extrabold text-zinc-900 tracking-tight leading-none">
							{selectedReq.requestId || `REQ-${selectedReq.id}`} Evaluation Details
						</h3>
						<span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
							{selectedReq.brandName} • {selectedReq.modelNo}
						</span>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
					{/* Left Column: Request Profile Details Card */}
					<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm space-y-4 lg:col-span-1">
						<div className="flex items-center justify-between border-b border-zinc-100 pb-2">
							<h4 className="text-[10px] font-extrabold text-[#11236a] uppercase tracking-wider">
								Request Summary
							</h4>
							<span className={`inline-flex items-center text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${statusObj.className}`}>
								{statusObj.text}
							</span>
						</div>

						<div className="space-y-3.5 text-xs font-semibold">
							<div>
								<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Brand & Model</p>
								<p className="font-bold text-zinc-800 mt-1">{selectedReq.brandName} — {selectedReq.modelNo}</p>
							</div>
							<div>
								<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Customer / Requester</p>
								<p className="font-bold text-zinc-800 mt-1">{selectedReq.customerNameAddress}</p>
								<p className="text-[10px] text-zinc-450 mt-0.5">Submitted by: {selectedReq.requesterName}</p>
							</div>
							<div>
								<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Test Method Reference</p>
								<p className="font-bold text-[#11236a] mt-1">
									{selectedReq.testMethodRef}
									<span className="text-[9px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-extrabold uppercase ml-2 inline-block">
										{selectedReq.testType?.name || 'General'}
									</span>
								</p>
							</div>
							<div>
								<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Quantity</p>
								<p className="font-bold text-zinc-800 mt-1">{selectedReq.sampleQty || 1} Units</p>
							</div>
							{selectedReq.engineerName && (
								<div>
									<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Assigned Scientist / Inspector</p>
									<p className="font-bold text-zinc-800 mt-1">{selectedReq.engineerName}</p>
								</div>
							)}
							{selectedReq.remarks && (
								<div className="bg-[#f8fafc] border border-zinc-150 rounded-xl p-3">
									<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Evaluation Remarks</p>
									<p className="font-bold text-zinc-700 mt-1 whitespace-pre-wrap leading-relaxed">{selectedReq.remarks}</p>
								</div>
							)}
						</div>
					</div>

					{/* Right Column: Samples details grid */}
					<div className="bg-white border border-zinc-200/50 rounded-2xl p-6 shadow-sm space-y-6 lg:col-span-2">
						<div className="flex items-center justify-between border-b border-zinc-100 pb-3">
							<h4 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider">
								Individual Sample Reports
							</h4>
							<span className="text-[10px] font-extrabold px-2 py-0.5 bg-zinc-100 text-zinc-555 rounded-full">
								{selectedReq.sampleQty || 1} Samples
							</span>
						</div>

						<div className="divide-y divide-zinc-150/70">
							{(() => {
								const qty = selectedReq.sampleQty || 1;
								const list = [];
								for (let i = 0; i < qty; i++) {
									const report = (selectedReq.sampleInspections || []).find((r: any) => Number(r.sampleIndex) === i && (r.testPlanId === null || r.testPlanId === undefined));
									const plans = (selectedReq.testPlans || []).filter((p: any) => Number(p.sampleIndex) === i);
									list.push({
										index: i,
										report,
										plans
									});
								}

								return list.map(({ index, report, plans }) => {
									const sampleNo = index + 1;
									const isInspectionFailed = report?.status === 'FAILED';

									return (
										<div key={index} className="py-5 first:pt-0 last:pb-0 space-y-4">
											{/* Sample Header */}
											<div className="flex items-center justify-between border-b border-zinc-100 pb-2 flex-wrap gap-2">
												<div className="flex items-center gap-2">
													<span className="text-sm font-extrabold text-zinc-900">Sample #{sampleNo}</span>
													{isInspectionFailed ? (
														<span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-100">
															Physical Check Failed
														</span>
													) : plans.length > 0 ? (
														<span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-100">
															Inspected & Planned
														</span>
													) : (
														<span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-zinc-50 text-zinc-500 border-zinc-150">
															Pending Testing
														</span>
													)}
												</div>
												{report?.allottedId && (
													<p className="text-[10px] text-zinc-555 font-bold">
														Allotted ID: <span className="text-zinc-700">{report.allottedId}</span>
													</p>
												)}
											</div>

											{/* Inspection Failed Details / Report */}
											{isInspectionFailed && (
												<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-rose-50/10 border border-rose-100 p-3.5 rounded-xl">
													<div className="space-y-1">
														<p className="text-[10px] text-zinc-555 font-bold">Physical Inspection Report</p>
														{report?.remarks && (
															<p className="text-[10px] text-rose-600 italic mt-1 bg-rose-50/20 p-2 rounded-lg border border-rose-100">
																Inspection Defect Remarks: {report.remarks}
															</p>
														)}
													</div>
													<div className="shrink-0">
														<button
															onClick={() => {
																window.open(`/reports/preview?type=sample&key=${selectedReq.id}-sample-${index}`, '_blank');
															}}
															className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-rose-700 hover:text-white px-3 py-2 rounded-xl border border-rose-200 bg-white hover:bg-rose-600 transition-all cursor-pointer outline-none shadow-sm active:scale-95"
														>
															<Eye className="w-3.5 h-3.5" />
															<span>View Inspection Report</span>
														</button>
													</div>
												</div>
											)}

											{/* Test Plans List */}
											{!isInspectionFailed && plans.length > 0 && (
												<div className="space-y-3 pl-3 border-l-2 border-zinc-200">
													{plans.map((plan: any) => {
														let planStatusText = 'Scheduled';
														let planBadgeClass = 'bg-zinc-50 text-zinc-500 border-zinc-150';

														if (plan.evaluationStatus === 'PASSED') {
															planStatusText = 'Testing Passed';
															planBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';
														} else if (plan.evaluationStatus === 'FAILED') {
															planStatusText = 'Testing Failed';
															planBadgeClass = 'bg-rose-50 text-rose-700 border-rose-100';
														} else {
															planStatusText = 'Under Testing';
															planBadgeClass = 'bg-blue-50 text-blue-700 border-blue-100';
														}

														return (
															<div key={plan.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50/50 border border-zinc-200/50 p-3.5 rounded-xl transition-all hover:bg-zinc-55">
																<div className="space-y-1">
																	<div className="flex items-center gap-2 flex-wrap">
																		<span className="text-[10px] font-extrabold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
																			{plan.testType?.name || 'General Test'}
																		</span>
																		<span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${planBadgeClass}`}>
																			{planStatusText}
																		</span>
																	</div>
																	<p className="text-[10px] text-zinc-555 font-semibold">
																		Station: S{plan.stationNo} | Duration: {plan.numberOfDays} Days | Dates: {formatDate(plan.startDate)} to {formatDate(plan.endDate)}
																	</p>
																	{plan.evaluationRemarks && (
																		<p className="text-[10px] text-zinc-500 italic mt-1 bg-white p-2 rounded-lg border border-zinc-100/70">
																			Remarks: {plan.evaluationRemarks}
																		</p>
																	)}
																</div>

																<div className="shrink-0 flex items-center gap-2">
																	<button
																		onClick={() => {
																			window.open(`/reports/preview?type=plan&key=${selectedReq.id}-plan-${plan.id}`, '_blank');
																		}}
																		className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#11236a] hover:text-white px-3 py-2 rounded-xl border border-[#11236a]/20 bg-white hover:bg-[#11236a] transition-all cursor-pointer outline-none shadow-sm active:scale-95"
																	>
																		<Eye className="w-3.5 h-3.5" />
																		<span>View Test Report</span>
																	</button>
																	{plan.testType?.name?.toLowerCase().includes('reliability') && (
																		<button
																			onClick={() => handleDownloadTearDownExcel(plan, selectedReq)}
																			className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-700 hover:text-white px-3 py-2 rounded-xl border border-emerald-250 bg-white hover:bg-emerald-600 transition-all cursor-pointer outline-none shadow-sm active:scale-95"
																		>
																			<FileText className="w-3.5 h-3.5" />
																			<span>Tear Down Report</span>
																		</button>
																	)}
																</div>
															</div>
														);
													})}
												</div>
											)}

											{!isInspectionFailed && plans.length === 0 && (
												<div className="text-zinc-400 text-[10px] italic pl-2">
													No test plans configured for this sample.
												</div>
											)}
										</div>
									);
								});
							})()}
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Render list view
	return (
		<div className="space-y-6">
			{/* Summary Banner */}
			<div className="bg-indigo-900 border border-indigo-950 rounded-2xl p-4 flex items-center justify-between gap-3 text-white">
				<div className="flex items-center gap-3">
					<div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
						<FolderOpen className="w-5 h-5 text-indigo-200" />
					</div>
					<div>
						<p className="text-xs font-bold">{evaluatedRequests.length} Evaluated Testing Requests</p>
						<p className="text-[10px] text-indigo-200 font-medium mt-0.5">
							Browse final calibration reports, standard tests, and NABL-certified request logs with complete sample records.
						</p>
					</div>
				</div>
			</div>

			{/* Search and Filters Toolbar */}
			<div className="bg-white border border-zinc-200/50 rounded-2xl p-4 shadow-sm space-y-4">
				<div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
					{/* Search field */}
					<div className="relative flex-1">
						<Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
						<input
							type="text"
							placeholder="Search by ID, brand, model, customer or description..."
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								setCurrentPage(1);
							}}
							className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-zinc-800 placeholder-zinc-400 outline-none focus:bg-white focus:border-[#11236a] transition-all"
						/>
					</div>

					{/* Dropdowns & Date filters */}
					<div className="flex flex-wrap items-center gap-3">
						<CustomSelect
							value={statusFilter}
							onChange={(val) => {
								setStatusFilter(val);
								setCurrentPage(1);
							}}
							options={[
								{ value: 'ALL', label: 'All Outcomes' },
								{ value: 'PASSED', label: 'Passed Requests' },
								{ value: 'FAILED', label: 'Failed Requests' },
								{ value: 'PARTIAL', label: 'Partial Outcomes' }
							]}
							className="w-44 shrink-0"
						/>

						<div className="flex items-center gap-2 bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-1 shrink-0">
							<span className="text-[9px] font-extrabold text-zinc-700 uppercase tracking-wider">From</span>
							<input
								type="date"
								value={startDate}
								onChange={(e) => {
									setStartDate(e.target.value);
									setCurrentPage(1);
								}}
								className="bg-transparent border-none text-xs font-semibold text-zinc-800 outline-none p-1 cursor-pointer"
							/>
						</div>

						<div className="flex items-center gap-2 bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-1 shrink-0">
							<span className="text-[9px] font-extrabold text-zinc-700 uppercase tracking-wider">To</span>
							<input
								type="date"
								value={endDate}
								onChange={(e) => {
									setEndDate(e.target.value);
									setCurrentPage(1);
								}}
								className="bg-transparent border-none text-xs font-semibold text-zinc-800 outline-none p-1 cursor-pointer"
							/>
						</div>

						{(searchQuery || statusFilter !== 'ALL' || startDate || endDate) && (
							<button
								onClick={() => {
									setSearchQuery('');
									setStatusFilter('ALL');
									setStartDate('');
									setEndDate('');
									setCurrentPage(1);
								}}
								className="text-xs font-bold text-red-650 hover:text-red-755 hover:underline bg-transparent border-none cursor-pointer"
							>
								Reset Filters
							</button>
						)}
					</div>
				</div>
			</div>

			{/* List Table */}
			<div className="bg-white border border-zinc-200/50 rounded-3xl shadow-sm overflow-hidden p-1">
				{filteredRequests.length === 0 ? (
					<div className="text-center py-16">
						<AlertTriangle className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
						<h4 className="text-sm font-bold text-zinc-850">No evaluated records found</h4>
						<p className="text-xs text-zinc-400 mt-1">There are no completed or failed evaluation requests matching the criteria.</p>
					</div>
				) : (
					<div className="overflow-x-auto flex flex-col justify-between">
						<table className="w-full text-left border-collapse min-w-[900px]">
							<thead>
								<tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 font-bold text-[10px] uppercase tracking-wider">
									<th className="py-4 px-6">Request ID</th>
									<th className="py-4 px-6">Brand & Model</th>
									<th className="py-4 px-6">Customer</th>
									<th className="py-4 px-6">Test Type</th>
									<th className="py-4 px-6">Evaluation Status</th>
									<th className="py-4 px-6 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-750">
								{paginatedRequests.map((req) => {
									const badge = getStatusBadge(req.status);

									return (
										<tr
											key={req.id}
											onClick={() => navigate(`/manager/completed-requests/${req.id}`)}
											className="hover:bg-zinc-50/50 transition-all group cursor-pointer"
										>
											<td className="py-4 px-6 font-bold text-zinc-900 group-hover:text-[#11236a]">
												{req.requestId || `REQ-${req.id}`}
											</td>
											<td className="py-4 px-6">
												<div className="font-bold text-zinc-900 leading-tight">{req.brandName}</div>
												<span className="text-[10px] text-zinc-555 font-medium">{req.modelNo}</span>
											</td>
											<td className="py-4 px-6 text-zinc-650 max-w-[200px] truncate">
												{req.customerNameAddress}
											</td>
											<td className="py-4 px-6 text-zinc-600">
												{req.testType?.name || 'General Test'}
											</td>
											<td className="py-4 px-6">
												<span className={`inline-flex items-center text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${badge.className}`}>
													{badge.text}
												</span>
											</td>
											<td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
												<button
													onClick={() => navigate(`/manager/completed-requests/${req.id}`)}
													className="bg-transparent border-none text-[#11236a] hover:text-[#0c1a52] font-bold text-xs inline-flex items-center gap-0.5 cursor-pointer outline-none group-hover:underline"
												>
													View Reports
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
							itemNamePlural="evaluated requests"
						/>
					</div>
				)}
			</div>
		</div>
	);
}
