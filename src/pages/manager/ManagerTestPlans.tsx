import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clipboard, CheckCircle, AlertTriangle, X, Search, ChevronRight, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Pagination from '../../components/Pagination';

// Import operations
import { getTestTypes } from '../../services/operations/testTypeService';
import { getTestCategories } from '../../services/operations/testCategoryService';
import { getTestProtocols } from '../../services/operations/testProtocolService';
import { getPlatforms, reservePlatforms } from '../../services/operations/platformAvailabilityService';
import { getTestingEquipments, reserveEquipment } from '../../services/operations/testingEquipmentService';

interface ManagerTestPlansProps {
	requests: any[];
	selectedRequestId?: string;
	onUpdateStatus?: (id: string, status: string, remarks?: string) => Promise<any>;
}

interface TestPlanForm {
	testTypeId: string;
	testCategoryId: string;
	productType: string; // 'SATL' | 'FATL' | 'FAFL' | 'WASH'
	stationNo: number;
	platformNos: number[];
	testProtocolId: string;
	referenceStandard: string;
	numberOfDays: number;
	startDate: string;
	endDate: string;
	remarks: string;
	equipmentId: string;
	evaluationStatus?: 'PASSED' | 'FAILED';
	evaluationRemarks?: string;
}

export default function ManagerTestPlans({ requests, selectedRequestId, onUpdateStatus }: ManagerTestPlansProps) {
	const navigate = useNavigate();

	// Resolve selected request from dynamic route parameter prop
	const selectedReq = selectedRequestId
		? requests.find(r => String(r.id) === String(selectedRequestId))
		: null;

	// Filter requests to those inspected (status UNDER_TEST or COMPLETED)
	const inspectedRequests = requests.filter(
		(r: any) => r.status === 'UNDER_TEST' || r.status === 'COMPLETED'
	);

	// Component states
	const [activeSampleIndex, setActiveSampleIndex] = useState<number | null>(null);

	// Search & Pagination states
	const [searchQuery, setSearchQuery] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(5);

	// Database options states
	const [testTypes, setTestTypes] = useState<any[]>([]);
	const [testCategories, setTestCategories] = useState<any[]>([]);
	const [testProtocols, setTestProtocols] = useState<any[]>([]);
	const [platforms, setPlatforms] = useState<any[]>([]);
	const [equipments, setEquipments] = useState<any[]>([]);

	// Saved test plans cache state
	const [savedPlans, setSavedPlans] = useState<{ [key: string]: TestPlanForm }>(() => {
		const cached = localStorage.getItem('dixon_sample_test_plans');
		return cached ? JSON.parse(cached) : {};
	});

	// Active planning form state
	const [form, setForm] = useState<TestPlanForm>({
		testTypeId: '',
		testCategoryId: '',
		productType: 'FATL',
		stationNo: 1,
		platformNos: [],
		testProtocolId: '',
		referenceStandard: '',
		numberOfDays: 9,
		startDate: new Date().toISOString().split('T')[0],
		endDate: '',
		remarks: '',
		equipmentId: ''
	});

	// Fetch dynamic data parameters
	const loadDbOptions = async () => {
		try {
			const types = await getTestTypes()();
			const categories = await getTestCategories()();
			const protocols = await getTestProtocols()();
			const plts = await getPlatforms()();
			const eqps = await getTestingEquipments({ limit: 100 })();

			setTestTypes(types || []);
			setTestCategories(categories || []);
			setTestProtocols(protocols || []);
			setPlatforms(plts || []);
			setEquipments(eqps || []);

			// Only pre-fill active equipment default if available
			if (eqps && eqps.length > 0) {
				const activeEq = eqps.find((e: any) => e.status === 'ACTIVE' || e.isAvailable);
				if (activeEq) {
					setForm(f => ({ ...f, equipmentId: String(activeEq.id) }));
				}
			}
		} catch (err) {
			console.error('Failed to load test planning database parameters:', err);
		}
	};

	// Load options from database on mount
	useEffect(() => {
		loadDbOptions();
	}, []);

	// Date format helpers
	const formatDateToDMY = (dateStr: string) => {
		if (!dateStr) return '';
		const [year, month, day] = dateStr.split('-');
		return `${day}-${month}-${year}`;
	};

	// Auto-calculation of End Date: StartDate + NumberOfDays - 1
	useEffect(() => {
		if (!form.startDate || !form.numberOfDays) {
			setForm(prev => ({ ...prev, endDate: '' }));
			return;
		}
		try {
			const start = new Date(form.startDate);
			if (isNaN(start.getTime())) return;

			// Add days (minus 1 to include start date as day 1)
			start.setDate(start.getDate() + Number(form.numberOfDays) - 1);
			const calculatedStr = start.toISOString().split('T')[0];
			setForm(prev => ({ ...prev, endDate: calculatedStr }));
		} catch (e) {
			console.error('Failed to auto-calculate end date:', e);
		}
	}, [form.startDate, form.numberOfDays]);

	// Dependent dropdown change handlers
	const handleTestTypeChange = (typeId: string) => {
		const filteredCats = testCategories.filter(c => String(c.testTypeId) === String(typeId));
		const firstCat = filteredCats[0] || null;
		const catId = firstCat ? String(firstCat.id) : '';

		const filteredProtos = testProtocols.filter(p => String(p.testCategoryId) === String(catId));
		const firstProto = filteredProtos[0] || null;
		const protoId = firstProto ? String(firstProto.id) : '';

		setForm(prev => ({
			...prev,
			testTypeId: typeId,
			testCategoryId: catId,
			testProtocolId: protoId
		}));
	};

	const handleTestCategoryChange = (catId: string) => {
		const filteredProtos = testProtocols.filter(p => String(p.testCategoryId) === String(catId));
		const firstProto = filteredProtos[0] || null;
		const protoId = firstProto ? String(firstProto.id) : '';

		setForm(prev => ({
			...prev,
			testCategoryId: catId,
			testProtocolId: protoId
		}));
	};

	// Open test plan modal for a passed sample
	const handleOpenPlanForm = async (sampleIndex: number) => {
		if (!selectedReq) return;
		setActiveSampleIndex(sampleIndex);

		// Synchronize fresh real-time platform & equipment bookings
		try {
			const plts = await getPlatforms()();
			setPlatforms(plts || []);
			const eqps = await getTestingEquipments({ limit: 100 })();
			setEquipments(eqps || []);
		} catch (e) {
			console.error('Failed to refresh live platforms & equipment status:', e);
		}

		const key = `${selectedReq.id}-sample-${sampleIndex}`;
		const existing = savedPlans[key];

		if (existing) {
			setForm(existing);
		} else {
			const defaultEq = equipments.find((e: any) => e.status === 'ACTIVE' || e.isAvailable);

			setForm({
				testTypeId: '',
				testCategoryId: '',
				productType: 'FATL',
				stationNo: 1,
				platformNos: [],
				testProtocolId: '',
				referenceStandard: '',
				numberOfDays: 9,
				startDate: new Date().toISOString().split('T')[0],
				endDate: '',
				remarks: '',
				equipmentId: defaultEq ? String(defaultEq.id) : ''
			});
		}
	};

	// Save test plan to local cache & reserve in database
	const handleSaveTestPlan = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedReq || activeSampleIndex === null) return;

		if (!form.testTypeId) {
			toast.error('Please select a Test Type.');
			return;
		}

		if (!form.testCategoryId) {
			toast.error('Please select a Test Category.');
			return;
		}

		if (!form.testProtocolId) {
			toast.error('Please select a Test Protocol.');
			return;
		}

		if (form.platformNos.length === 0) {
			toast.error('Please assign at least one physical Platform channel.');
			return;
		}

		try {
			// 1. Reserve platform channels in database for this sample
			const resOp = reservePlatforms(
				Number(form.stationNo),
				form.platformNos.map(Number),
				Number(selectedReq.id),
				`REQ-${selectedReq.requestId || selectedReq.id} (Sample #${activeSampleIndex + 1})`,
				selectedReq.modelNo,
				form.endDate
			);
			await resOp();

			// 2. Reserve physical R&D Equipment in database if selected
			if (form.equipmentId) {
				const eqResOp = reserveEquipment(
					Number(form.equipmentId),
					Number(selectedReq.id),
					`REQ-${selectedReq.requestId || selectedReq.id} (Sample #${activeSampleIndex + 1})`,
					selectedReq.modelNo,
					form.endDate
				);
				await eqResOp();
			}

			// 3. Perform parent status sync if callback is provided
			if (onUpdateStatus) {
				await onUpdateStatus(
					selectedReq.id,
					'UNDER_TEST',
					`Test Plan configured for Sample #${activeSampleIndex + 1} at Station S${form.stationNo}.`
				);
			}

			const key = `${selectedReq.id}-sample-${activeSampleIndex}`;
			const updatedPlans = {
				...savedPlans,
				[key]: form
			};

			setSavedPlans(updatedPlans);
			localStorage.setItem('dixon_sample_test_plans', JSON.stringify(updatedPlans));

			toast.success(`Test plan for Sample #${activeSampleIndex + 1} saved, platforms & equipment reserved!`);
			setActiveSampleIndex(null);
		} catch (error) {
			console.error('Failed to reserve resources for test plan:', error);
			toast.error('Failed to reserve required platform or equipment resources.');
		}
	};


	// Search and Paginate filters
	const filteredRequests = inspectedRequests.filter(r => {
		return r.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(r.requestId && r.requestId.toLowerCase().includes(searchQuery.toLowerCase())) ||
			r.modelNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
			r.sampleDescription.toLowerCase().includes(searchQuery.toLowerCase());
	});

	const maxPage = Math.ceil(filteredRequests.length / itemsPerPage);
	const activePage = maxPage > 0 ? Math.min(currentPage, maxPage) : 1;

	const startIndex = (activePage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

	return (
		<div className="space-y-6">
			{/* Grid list of Inspected Requests */}
			{!selectedReq ? (
				<div className="space-y-6">
					{/* Top Search Toolbar */}
					<div className="bg-white border border-zinc-200/50 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div className="relative flex-1 max-w-md">
							<Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-555" />
							<input
								type="text"
								placeholder="Search by brand, ID, model, or description..."
								value={searchQuery}
								onChange={(e) => {
									setSearchQuery(e.target.value);
									setCurrentPage(1);
								}}
								className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-zinc-800 placeholder-zinc-555 outline-none focus:bg-white focus:border-[#11236a] transition-all"
							/>
						</div>
						<div className="text-xs text-zinc-500 font-medium bg-zinc-50 border border-zinc-200 px-3.5 py-2 rounded-xl">
							Total Inspected: <strong className="text-zinc-800 font-extrabold">{inspectedRequests.length}</strong>
						</div>
					</div>

					{/* List Container Card */}
					<div className="bg-white border border-zinc-200/50 rounded-3xl shadow-sm overflow-hidden p-1">
						{paginatedRequests.length === 0 ? (
							<div className="text-center py-16">
								<Clipboard className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
								<h4 className="text-sm font-bold text-zinc-800">No inspected requests found</h4>
								<p className="text-xs text-zinc-500 font-light mt-1">Check back later once the testing team submits new calibration results.</p>
							</div>
						) : (
							<div className="overflow-x-auto flex flex-col justify-between">
								<table className="w-full text-left border-collapse min-w-[800px]">
									<thead>
										<tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 font-bold text-[10px] uppercase tracking-wider">
											<th className="py-4 px-6">Request ID</th>
											<th className="py-4 px-6">Brand & Model</th>
											<th className="py-4 px-6">Sample Description</th>
											<th className="py-4 px-6">Inspection Metrics</th>
											<th className="py-4 px-6">Planning Status</th>
											<th className="py-4 px-6 text-right">Action</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-750">
										{paginatedRequests.map((req) => {
											const qty = req.sampleQty || 1;
											let passedCount = 0;
											let failedCount = 0;
											let plansCreated = 0;

											for (let i = 0; i < qty; i++) {
												const report = (req.sampleInspections || []).find((r: any) => Number(r.sampleIndex) === i);
												if (report) {
													if (report.status === 'PASSED') passedCount++;
													else if (report.status === 'FAILED') failedCount++;
												}
												if (savedPlans[`${req.id}-sample-${i}`]) {
													plansCreated++;
												}
											}

											const isAllPlanned = plansCreated >= passedCount;

											return (
												<tr
													key={req.id}
													className="hover:bg-zinc-50/50 transition-all group cursor-pointer"
													onClick={() => navigate(`/manager/test-plans/${req.id}`)}
												>
													<td className="py-4 px-6 font-bold text-zinc-900 group-hover:text-[#11236a]">
														{req.requestId || `REQ-2026-${req.id}`}
													</td>
													<td className="py-4 px-6">
														<div className="font-bold text-zinc-900 leading-tight">{req.brandName}</div>
														<span className="text-[10px] text-zinc-555 font-medium">{req.modelNo}</span>
													</td>
													<td className="py-4 px-6 text-zinc-655 max-w-xs truncate">{req.sampleDescription}</td>
													<td className="py-4 px-6">
														<div className="flex flex-wrap gap-1.5 items-center">
															<span className="text-[9px] font-bold px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded">
																Qty: {qty}
															</span>
															<span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded border border-emerald-100">
																Passed: {passedCount}
															</span>
															{failedCount > 0 && (
																<span className="text-[9px] font-bold px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded border border-rose-100">
																	Failed: {failedCount}
																</span>
															)}
														</div>
													</td>
													<td className="py-4 px-6">
														{isAllPlanned ? (
															<span className="text-[9px] font-bold px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full uppercase tracking-wider">
																Plan Created
															</span>
														) : (
															<span className="text-[9px] font-bold px-2.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full uppercase tracking-wider inline-flex items-center gap-1 shrink-0">
																Awaiting Plan ({plansCreated}/{passedCount})
															</span>
														)}
													</td>
													<td className="py-4 px-6 text-right">
														<button
															onClick={(e) => {
																e.stopPropagation();
																navigate(`/manager/test-plans/${req.id}`);
															}}
															className="bg-transparent border-none text-[#11236a] hover:text-[#0c1a52] font-bold text-xs inline-flex items-center gap-0.5 cursor-pointer outline-none group-hover:underline"
														>
															View & Plan
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
									itemNamePlural="inspected requests"
								/>
							</div>
						)}
					</div>
				</div>
			) : (
				/* Request Details & Sample Checklist View (Matches ApprovedRequestDetails.tsx standard perfectly) */
				<div className="space-y-6 animate-fade-in">
					{/* Back Navigation Bar */}
					<div className="flex items-center gap-3">
						<button
							onClick={() => navigate('/manager/test-plans')}
							className="w-9 h-9 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-555 hover:text-zinc-800 hover:shadow-sm transition-all cursor-pointer outline-none"
						>
							<ArrowLeft className="w-4 h-4 shrink-0" />
						</button>
						<div>
							<h3 className="text-base font-extrabold text-zinc-900 tracking-tight leading-none">
								{selectedReq.requestId || `REQ-2026-${selectedReq.id}`} Specifications
							</h3>
							<span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
								{selectedReq.brandName} • {selectedReq.modelNo}
							</span>
						</div>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
						{/* Left: Request Details Card */}
						<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm space-y-4 lg:col-span-1 flex flex-col justify-between">
							<div className="space-y-4">
								<h4 className="text-[10px] font-extrabold text-[#11236a] uppercase tracking-wider border-b border-zinc-100 pb-2">
									Request Details
								</h4>
								<div className="space-y-3.5 text-xs font-semibold">
									<div>
										<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Sample Description</p>
										<p className="font-bold text-zinc-800 mt-1 whitespace-pre-wrap leading-relaxed">{selectedReq.sampleDescription}</p>
									</div>
									<div>
										<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Manufacturer & Brand</p>
										<p className="font-bold text-zinc-800 mt-1">{selectedReq.brandName} — {selectedReq.modelNo}</p>
									</div>
									<div>
										<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Test Method Reference</p>
										<p className="font-bold text-[#11236a] mt-1">{selectedReq.testMethodRef}</p>
									</div>
									<div>
										<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Quantity</p>
										<p className="font-bold text-zinc-800 mt-1">{selectedReq.sampleQty || 1} Units</p>
									</div>
								</div>
							</div>
							<div className="border-t border-zinc-100 mt-4 pt-3">
								<button
									onClick={() => navigate(`/manager/approved-requests/${selectedReq.id}`)}
									className="w-full py-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 hover:text-[#11236a] text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm active:scale-95"
								>
									<span>View More</span>
									<ChevronRight className="w-3.5 h-3.5" />
								</button>
							</div>
						</div>

						{/* Right: Samples checklist and plan creation */}
						<div className="bg-white border border-zinc-200/50 rounded-2xl p-6 shadow-sm space-y-6 lg:col-span-2">
							<div className="flex items-center justify-between border-b border-zinc-100 pb-3">
								<h4 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider">
									Individual Sample Test Allocations
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
										const report = (selectedReq.sampleInspections || []).find((r: any) => Number(r.sampleIndex) === i);
										const plan = savedPlans[`${selectedReq.id}-sample-${i}`];
										list.push({
											index: i,
											report,
											plan
										});
									}

									return list.map(({ index, report, plan }) => {
										const sampleNo = index + 1;
										const isFailed = report?.status === 'FAILED';
										const isPassed = report?.status === 'PASSED';

										const todayStr = new Date().toISOString().split('T')[0];
										const isTesting = plan && plan.startDate <= todayStr;

										return (
											<div key={index} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
												<div className="space-y-1">
													<div className="flex items-center gap-2 flex-wrap">
														<span className="text-xs font-bold text-zinc-855">Sample #{sampleNo}</span>
														{report ? (
															<span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${isPassed
																	? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
																	: 'bg-rose-50 text-rose-700 border border-rose-100'
																}`}>
																{report.status}
															</span>
														) : (
															<span className="text-[8px] font-extrabold px-1.5 py-0.5 bg-zinc-100 text-zinc-450 rounded uppercase tracking-wider">
																No Inspection Report
															</span>
														)}
														{plan && (
															<span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${isTesting
																	? 'bg-blue-50 text-blue-700 border border-blue-100 animate-pulse'
																	: 'bg-amber-50 text-amber-700 border border-amber-100'
																}`}>
																{isTesting ? 'Testing' : 'Scheduled'}
															</span>
														)}
													</div>
													{report && (
														<p className="text-[10px] text-zinc-555 font-semibold mt-0.5">
															Allotted Code: <span className="text-zinc-700 font-extrabold">{report.allottedId || 'N/A'}</span>
														</p>
													)}
													{plan && (
														<div className="text-[9px] text-indigo-650 bg-indigo-50/50 border border-indigo-100/50 rounded-lg p-2 mt-2 space-y-0.5">
															<p className="font-extrabold">Active Test Plan Configured:</p>
															<p className="font-bold">
																Product: {plan.productType} | Station Unit: S{plan.stationNo} (Platforms: {plan.platformNos.join(', ') || 'None'})
																{plan.equipmentId && ` | Equipment: ${equipments.find(e => String(e.id) === String(plan.equipmentId))?.name || 'Assigned Equipment'}`}
															</p>
															<p className="font-bold">Duration: {plan.numberOfDays} Days ({formatDateToDMY(plan.startDate)} to {formatDateToDMY(plan.endDate)})</p>
														</div>
													)}
												</div>

												{/* Action Buttons */}
												{isFailed ? (
													<span className="text-[10px] font-extrabold px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl flex items-center gap-1.5 shrink-0 border border-rose-150">
														<AlertTriangle className="w-3.5 h-3.5 shrink-0" />
														Plan Disabled - Sample Failed
													</span>
												) : isPassed ? (
													<div className="flex flex-wrap items-center gap-2 shrink-0">
														<button
															onClick={() => handleOpenPlanForm(index)}
															className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all outline-none border-none cursor-pointer flex items-center gap-1.5 shadow-sm shrink-0 hover:scale-[1.01] active:scale-95 ${plan
																	? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-300'
																	: 'bg-[#11236a] hover:bg-[#0c1a52] text-white'
																}`}
														>
															<Clipboard className="w-3.5 h-3.5 shrink-0" />
															{plan ? 'Edit Test Plan' : 'Create Test Plan'}
														</button>

														{plan && (() => {
															const todayStr = new Date().toISOString().split('T')[0];
															const isLastDateOrLater = todayStr >= plan.endDate;
															const isEvaluated = plan.evaluationStatus === 'PASSED' || plan.evaluationStatus === 'FAILED';

															if (isLastDateOrLater) {
																if (isEvaluated) {
																	return (
																		<span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1 border shrink-0 ${
																			plan.evaluationStatus === 'PASSED'
																				? 'bg-emerald-50 text-emerald-600 border-emerald-100'
																				: 'bg-rose-50 text-rose-600 border-rose-100'
																		}`}>
																			{plan.evaluationStatus === 'PASSED' ? (
																				<CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
																			) : (
																				<XCircle className="w-3.5 h-3.5 text-rose-650 shrink-0" />
																			)}
																			Evaluated: {plan.evaluationStatus}
																		</span>
																	);
																}
																return (
																	<button
																		onClick={() => navigate(`/manager/evaluate-checksheet/${selectedReq.id}-sample-${index}`)}
																		className="px-4 py-2 text-xs font-extrabold rounded-xl transition-all outline-none border-none cursor-pointer flex items-center gap-1.5 shadow-sm bg-amber-600 hover:bg-amber-700 text-white hover:scale-[1.01] active:scale-95 shrink-0"
																	>
																		Evaluate
																	</button>
																);
															}
															return null;
														})()}
													</div>
												) : (
													<span className="text-[10px] font-bold text-zinc-400 shrink-0">
														Awaiting complete inspection
													</span>
												)}
											</div>
										);
									});
								})()}
							</div>

							{/* Activation Footer */}
							<div className="border-t border-zinc-150 pt-5 flex items-center justify-end">
								<button
									onClick={() => navigate('/manager/test-plans')}
									className="px-4 py-2 border border-zinc-200 text-zinc-650 hover:bg-zinc-50 rounded-xl text-xs font-bold transition-all cursor-pointer outline-none shadow-sm active:scale-95"
								>
									Close View
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* ========================================================================= */}
			{/* DYNAMIC HIGH-FIDELITY TEST PLAN MODAL FORM */}
			{/* ========================================================================= */}
			{activeSampleIndex !== null && (
				<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center animate-fade-in backdrop-blur-xs">
					<div className="bg-white rounded-3xl shadow-2xl p-6 max-w-2xl w-full mx-4 space-y-6 border border-zinc-200 max-h-[90vh] overflow-y-auto no-scrollbar animate-scale-up">

						{/* Header */}
						<div className="flex items-center justify-between border-b border-zinc-100 pb-3 shrink-0">
							<div className="flex items-center gap-2.5 text-[#11236a]">
								<Clipboard className="w-5 h-5 shrink-0" />
								<div>
									<h4 className="text-sm font-extrabold uppercase tracking-wider text-zinc-900">
										Configure Test Plan Specification
									</h4>
									<p className="text-[10px] text-zinc-555 font-bold mt-0.5">Sample Index #{activeSampleIndex + 1} allotment</p>
								</div>
							</div>
							<button
								onClick={() => setActiveSampleIndex(null)}
								className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors border-none outline-none cursor-pointer"
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						{/* Form */}
						<form onSubmit={handleSaveTestPlan} className="space-y-5 text-xs text-zinc-700 font-bold uppercase tracking-wider">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								{/* Test Type Select */}
								<div className="flex flex-col gap-1.5">
									<label htmlFor="testType" className="text-[10px] text-zinc-500 font-extrabold">Test Type</label>
									<select
										id="testType"
										value={form.testTypeId}
										onChange={(e) => handleTestTypeChange(e.target.value)}
										className="bg-[#f8fafc] border border-zinc-200 rounded-xl p-3 text-zinc-800 text-xs font-semibold outline-none focus:border-[#11236a] transition-all cursor-pointer h-[42px]"
									>
										<option value="">-- Select Test Type --</option>
										{testTypes.map((t: any) => (
											<option key={t.id} value={String(t.id)}>{t.name}</option>
										))}
									</select>
								</div>

								{/* Test Category Select */}
								<div className="flex flex-col gap-1.5">
									<label htmlFor="testCategory" className="text-[10px] text-zinc-500 font-extrabold">Test Category</label>
									<select
										id="testCategory"
										value={form.testCategoryId}
										disabled={!form.testTypeId}
										onChange={(e) => handleTestCategoryChange(e.target.value)}
										className={`bg-[#f8fafc] border border-zinc-200 rounded-xl p-3 text-zinc-800 text-xs font-semibold outline-none focus:border-[#11236a] transition-all cursor-pointer h-[42px] ${!form.testTypeId ? 'opacity-50 cursor-not-allowed' : ''}`}
									>
										<option value="">-- Select Test Category --</option>
										{testCategories
											.filter((c: any) => String(c.testTypeId) === String(form.testTypeId))
											.map((c: any) => (
												<option key={c.id} value={String(c.id)}>{c.name}</option>
											))}
									</select>
								</div>
							</div>

							{/* Product Type (For Reliability) selectable pills */}
							<div className="flex flex-col gap-2">
								<label className="text-[10px] text-zinc-500 font-extrabold">Product Type (For Reliability)</label>
								<div className="grid grid-cols-4 gap-3">
									{['SATL', 'FATL', 'FAFL', 'WASH'].map((pType) => {
										const isActive = form.productType === pType;
										return (
											<button
												key={pType}
												type="button"
												onClick={() => setForm({ ...form, productType: pType })}
												className={`py-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer outline-none border-none text-center ${isActive
														? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
														: 'bg-white border-zinc-250 text-zinc-555 hover:bg-zinc-50'
													}`}
											>
												{pType}
											</button>
										);
									})}
								</div>
							</div>
							{/* R&D Equipment selection */}
							<div className="flex flex-col gap-1.5">
								<label htmlFor="equipmentSelect" className="text-[10px] text-zinc-500 font-extrabold">Assign R&D Equipment (Optional)</label>
								<select
									id="equipmentSelect"
									value={form.equipmentId}
									onChange={(e) => setForm({ ...form, equipmentId: e.target.value })}
									className="bg-[#f8fafc] border border-[#d1d5db] rounded-xl p-3 text-zinc-800 text-xs font-semibold outline-none focus:border-[#11236a] transition-all cursor-pointer h-[42px]"
								>
									<option value="">-- Select R&D Equipment --</option>
									{equipments.map((eq: any) => {
										const isOccupied = !eq.isAvailable;
										return (
											<option
												key={eq.id}
												value={String(eq.id)}
												disabled={isOccupied && String(form.equipmentId) !== String(eq.id)}
											>
												{eq.name} {isOccupied ? `(Occupied - busy)` : '(Available)'}
											</option>
										);
									})}
								</select>
							</div>

							{/* Dynamic Platform Telemetry grid for ALL Stations */}
							<div className="flex flex-col gap-3">
								<label className="text-[10px] text-zinc-500 font-extrabold">Assign Platforms (Select platforms from a single Station unit)</label>
								<div className="space-y-4 max-h-[350px] overflow-y-auto p-3 bg-[#f8fafc] rounded-2xl border border-zinc-150">
									{Array.from({ length: 14 }, (_, stationIdx) => {
										const sNum = stationIdx + 1;
										const isStationActive = form.stationNo === sNum;

										return (
											<div key={sNum} className="bg-white border border-[#e4e4e7]/60 rounded-[22px] p-5 shadow-sm">
												<div className="flex items-center justify-between mb-3.5">
													<span className="text-xs font-bold text-slate-400 tracking-wider">P{sNum}</span>
													{isStationActive && form.platformNos.length > 0 && (
														<span className="text-[8px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
															Active (Selected: {form.platformNos.join(', ')})
														</span>
													)}
												</div>

												<div className="grid grid-cols-5 gap-3">
													{Array.from({ length: 10 }, (_, platformIdx) => {
														const pNum = platformIdx + 1;
														const isSelected = isStationActive && form.platformNos.includes(pNum);
														// Query real-time database state
														const slot = platforms.find(
															(p: any) => Number(p.stationNo) === sNum && Number(p.platformNo) === pNum
														);
														const isOccupied = slot ? !slot.isAvailable : false;

														return (
															<button
																key={pNum}
																type="button"
																onClick={() => {
																	if (isOccupied) return;
																	setForm(prev => {
																		// If switching station, reset selection to only this platform
																		if (prev.stationNo !== sNum) {
																			return {
																				...prev,
																				stationNo: sNum,
																				platformNos: [pNum]
																			};
																		}
																		// If same station, toggle platform
																		const current = prev.platformNos;
																		const updated = current.includes(pNum)
																			? current.filter(n => n !== pNum)
																			: [...current, pNum];
																		return { ...prev, platformNos: updated };
																	});
																}}
																className={`h-11 rounded-2xl text-xs font-bold transition-all relative flex items-center justify-center cursor-pointer outline-none border-none ${isOccupied
																		? 'bg-[#fff1f2] text-[#f87171] cursor-not-allowed opacity-90'
																		: isSelected
																			? 'bg-[#185adb] text-white shadow-md shadow-blue-500/20 font-bold'
																			: 'bg-white border border-[#e4e4e7] text-slate-800 hover:bg-slate-50'
																	}`}
																title={
																	isOccupied
																		? `Occupied by: ${slot?.occupiedBy || 'N/A'}\nUntil: ${slot?.occupiedUntil ? new Date(slot.occupiedUntil).toLocaleDateString() : 'N/A'}`
																		: `Station S${sNum} Platform #${pNum} (Available)`
																}
															>
																<span className="text-xs">{pNum}</span>
																{isOccupied && (
																	<span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#f43f5e] rounded-full border border-white shadow-sm"></span>
																)}
															</button>
														);
													})}
												</div>
											</div>
										);
									})}
								</div>
							</div>

							{/* Test Protocol select (Dependent on Category) */}
							<div className="flex flex-col gap-1.5">
								<label htmlFor="testProtocol" className="text-[10px] text-zinc-500 font-extrabold">Test Protocol</label>
								<select
									id="testProtocol"
									value={form.testProtocolId}
									disabled={!form.testCategoryId}
									onChange={(e) => setForm({ ...form, testProtocolId: e.target.value })}
									className={`bg-[#f8fafc] border border-zinc-200 rounded-xl p-3 text-zinc-800 text-xs font-semibold outline-none focus:border-[#11236a] transition-all cursor-pointer h-[42px] ${!form.testCategoryId ? 'opacity-50 cursor-not-allowed' : ''}`}
								>
									<option value="">-- Select Test Protocol --</option>
									{testProtocols
										.filter((p: any) => String(p.testCategoryId) === String(form.testCategoryId))
										.map((p: any) => (
											<option key={p.id} value={String(p.id)}>{p.name}</option>
										))}
								</select>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								{/* Reference Standard input */}
								<div className="flex flex-col gap-1.5">
									<label htmlFor="refStandard" className="text-[10px] text-zinc-500 font-extrabold">Reference Standard</label>
									<input
										id="refStandard"
										type="text"
										value={form.referenceStandard}
										onChange={(e) => setForm({ ...form, referenceStandard: e.target.value })}
										placeholder="e.g. IEC 60335-2-7"
										className="bg-[#f8fafc] border border-zinc-200 rounded-xl p-3 text-zinc-800 text-xs font-semibold outline-none focus:border-[#11236a] transition-all h-[42px]"
									/>
								</div>

								{/* Number of Days input */}
								<div className="flex flex-col gap-1.5">
									<label htmlFor="numDays" className="text-[10px] text-zinc-500 font-extrabold">Number of Days</label>
									<input
										id="numDays"
										type="number"
										value={form.numberOfDays}
										onChange={(e) => setForm({ ...form, numberOfDays: Number(e.target.value) })}
										className="bg-[#f8fafc] border border-zinc-200 rounded-xl p-3 text-zinc-800 text-xs font-semibold outline-none focus:border-[#11236a] transition-all h-[42px]"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								{/* Start Date selection */}
								<div className="flex flex-col gap-1.5">
									<label htmlFor="startDate" className="text-[10px] text-zinc-500 font-extrabold">Start Date</label>
									<div className="relative">
										<input
											id="startDate"
											type="date"
											value={form.startDate}
											onChange={(e) => setForm({ ...form, startDate: e.target.value })}
											className="bg-[#f8fafc] border border-zinc-200 rounded-xl p-3 pr-10 text-zinc-800 text-xs font-semibold outline-none focus:border-[#11236a] transition-all w-full h-[42px]"
										/>
									</div>
								</div>

								{/* End Date (Auto-Calculated) disabled input */}
								<div className="flex flex-col gap-1.5">
									<label htmlFor="endDate" className="text-[10px] text-zinc-500 font-extrabold">End Date (Auto-Calculated)</label>
									<input
										id="endDate"
										type="date"
										value={form.endDate}
										disabled
										className="bg-zinc-100 border border-zinc-200 rounded-xl p-3 text-zinc-500 text-xs font-semibold outline-none cursor-not-allowed h-[42px]"
									/>
								</div>
							</div>

							{/* Remarks optional textarea */}
							<div className="flex flex-col gap-1.5">
								<label htmlFor="remarks" className="text-[10px] text-zinc-500 font-extrabold">Remarks (Optional)</label>
								<textarea
									id="remarks"
									value={form.remarks}
									onChange={(e) => setForm({ ...form, remarks: e.target.value })}
									placeholder="Any special instructions..."
									rows={3}
									className="bg-[#f8fafc] border border-zinc-200 rounded-xl p-3 text-zinc-800 text-xs font-semibold outline-none focus:border-[#11236a] transition-all resize-none"
								/>
							</div>

							{/* Action buttons */}
							<div className="border-t border-zinc-100 pt-5 flex items-center justify-end gap-3 shrink-0">
								<button
									type="button"
									onClick={() => setActiveSampleIndex(null)}
									className="px-4 py-2.5 border border-zinc-200 text-zinc-650 hover:bg-zinc-50 rounded-xl text-xs font-bold transition-all cursor-pointer outline-none"
								>
									Cancel
								</button>
								<button
									type="submit"
									className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer border-none outline-none flex items-center gap-2 shadow-md hover:scale-[1.01] active:scale-95"
								>
									<CheckCircle className="w-3.5 h-3.5 shrink-0" />
									Save Test Plan Specification
								</button>
							</div>
						</form>

					</div>
				</div>
			)}
		</div>
	);
}
