import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clipboard, Play, CheckCircle, AlertTriangle, X, Search, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Pagination from '../../components/Pagination';

// Import operations
import { getTestTypes } from '../../services/operations/testTypeService';
import { getTestCategories } from '../../services/operations/testCategoryService';
import { getTestProtocols } from '../../services/operations/testProtocolService';
import { getPlatforms, reservePlatforms } from '../../services/operations/platformAvailabilityService';

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
		remarks: ''
	});

	// Fetch dynamic data parameters
	const loadDbOptions = async () => {
		try {
			const types = await getTestTypes()();
			const categories = await getTestCategories()();
			const protocols = await getTestProtocols()();
			const plts = await getPlatforms()();
			
			setTestTypes(types || []);
			setTestCategories(categories || []);
			setTestProtocols(protocols || []);
			setPlatforms(plts || []);

			// Set default options if available
			if (types && types.length > 0) {
				setForm(f => ({ ...f, testTypeId: String(types[0].id) }));
			}
			if (categories && categories.length > 0) {
				setForm(f => ({ ...f, testCategoryId: String(categories[0].id) }));
			}
			if (protocols && protocols.length > 0) {
				setForm(f => ({ ...f, testProtocolId: String(protocols[0].id) }));
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

	// Open test plan modal for a passed sample
	const handleOpenPlanForm = async (sampleIndex: number) => {
		if (!selectedReq) return;
		setActiveSampleIndex(sampleIndex);

		// Synchronize fresh real-time platform bookings
		try {
			const plts = await getPlatforms()();
			setPlatforms(plts || []);
		} catch (e) {
			console.error('Failed to refresh live platforms status:', e);
		}

		const key = `${selectedReq.id}-sample-${sampleIndex}`;
		const existing = savedPlans[key];

		if (existing) {
			setForm(existing);
		} else {
			// Find standard defaults
			const defaultType = testTypes.find(t => t.name.toLowerCase().includes('reliability')) || testTypes[0];
			const defaultCat = testCategories.find(c => c.name.toLowerCase().includes('pcb buttons')) || testCategories[0];
			const defaultProtocol = testProtocols.find(p => p.name.toLowerCase().includes('reliability of pcb')) || testProtocols[0];

			setForm({
				testTypeId: defaultType ? String(defaultType.id) : '',
				testCategoryId: defaultCat ? String(defaultCat.id) : '',
				productType: 'FATL',
				stationNo: 1,
				platformNos: [],
				testProtocolId: defaultProtocol ? String(defaultProtocol.id) : '',
				referenceStandard: 'IEC 60335-2-7',
				numberOfDays: 9,
				startDate: new Date().toISOString().split('T')[0],
				endDate: '',
				remarks: ''
			});
		}
	};

	// Save test plan to local cache
	const handleSaveTestPlan = (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedReq || activeSampleIndex === null) return;

		if (form.platformNos.length === 0) {
			toast.error('Please assign at least one physical Platform channel.');
			return;
		}

		const key = `${selectedReq.id}-sample-${activeSampleIndex}`;
		const updatedPlans = {
			...savedPlans,
			[key]: form
		};

		setSavedPlans(updatedPlans);
		localStorage.setItem('dixon_sample_test_plans', JSON.stringify(updatedPlans));
		
		toast.success(`Test plan for Sample #${activeSampleIndex + 1} saved successfully!`);
		setActiveSampleIndex(null);
	};

	// Activate complete test plan, update request phase and occupy database platforms
	const handleActivateRequestTesting = async () => {
		if (!selectedReq) return;
		
		const qty = selectedReq.sampleQty || 1;
		const passedIndices: number[] = [];

		for (let i = 0; i < qty; i++) {
			const report = (selectedReq.sampleInspections || []).find((r: any) => Number(r.sampleIndex) === i);
			if (report && report.status === 'PASSED') {
				passedIndices.push(i);
			}
		}

		// Validate that all passed samples have a test plan created
		const missingPlans = passedIndices.filter(idx => !savedPlans[`${selectedReq.id}-sample-${idx}`]);
		if (missingPlans.length > 0) {
			toast.error(`Please create test plans for all passed samples (Sample #${missingPlans.map(i => i + 1).join(', ')}) before starting testing.`);
			return;
		}

		try {
			// 1. Reserve platform channels in database for all planned samples
			for (const idx of passedIndices) {
				const plan = savedPlans[`${selectedReq.id}-sample-${idx}`];
				if (plan) {
					const resOp = reservePlatforms(
						Number(plan.stationNo),
						plan.platformNos.map(Number),
						Number(selectedReq.id),
						`REQ-${selectedReq.requestId || selectedReq.id} (Sample #${idx + 1})`,
						selectedReq.modelNo,
						plan.endDate
					);
					await resOp();
				}
			}

			// 2. Perform request state transition to UNDER_TEST
			if (onUpdateStatus) {
				await onUpdateStatus(selectedReq.id, 'UNDER_TEST', 'Test Plan activated. Commencing physical platform testing.');
				toast.success('Test plan activated successfully! Request is now running stress tests.');
				
				// Return to the register list
				navigate('/manager/test-plans');
			}
		} catch (error) {
			console.error('Failed to transition request to testing phase:', error);
			toast.error('Failed to activate platform testing reservations.');
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
						{/* Left: Request Details (Specifications Card) */}
						<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm space-y-4 lg:col-span-1">
							<h4 className="text-[10px] font-extrabold text-[#11236a] uppercase tracking-wider border-b border-zinc-100 pb-2">
								Request Specifications
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

										return (
											<div key={index} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
												<div className="space-y-1">
													<div className="flex items-center gap-2">
														<span className="text-xs font-bold text-zinc-855">Sample #{sampleNo}</span>
														{report ? (
															<span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
																isPassed 
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
													</div>
													{report && (
														<p className="text-[10px] text-zinc-555 font-semibold mt-0.5">
															Allotted Code: <span className="text-zinc-700 font-extrabold">{report.allottedId || 'N/A'}</span>
														</p>
													)}
													{plan && (
														<div className="text-[9px] text-indigo-650 bg-indigo-50/50 border border-indigo-100/50 rounded-lg p-2 mt-2 space-y-0.5">
															<p className="font-extrabold">Active Test Plan Configured:</p>
															<p className="font-bold">Product: {plan.productType} | Station Unit: S{plan.stationNo} (Platforms: {plan.platformNos.join(', ') || 'None'})</p>
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
													<button
														onClick={() => handleOpenPlanForm(index)}
														className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all outline-none border-none cursor-pointer flex items-center gap-1.5 shadow-sm shrink-0 hover:scale-[1.01] active:scale-95 ${
															plan 
																? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-300' 
																: 'bg-[#11236a] hover:bg-[#0c1a52] text-white'
														}`}
													>
														<Clipboard className="w-3.5 h-3.5 shrink-0" />
														{plan ? 'Edit Test Plan' : 'Create Test Plan'}
													</button>
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
							<div className="border-t border-zinc-150 pt-5 flex items-center justify-end gap-3">
								<button
									onClick={() => navigate('/manager/test-plans')}
									className="px-4 py-2 border border-zinc-200 text-zinc-650 hover:bg-zinc-50 rounded-xl text-xs font-bold transition-all cursor-pointer outline-none"
								>
									Close View
								</button>
								<button
									onClick={handleActivateRequestTesting}
									className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer border-none outline-none flex items-center gap-2 shadow-md hover:scale-[1.01] active:scale-95"
								>
									<Play className="w-3.5 h-3.5 shrink-0" />
									Activate Test Plan & Start Testing
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
										onChange={(e) => setForm({ ...form, testTypeId: e.target.value })}
										className="bg-[#f8fafc] border border-zinc-200 rounded-xl p-3 text-zinc-800 text-xs font-semibold outline-none focus:border-[#11236a] transition-all cursor-pointer h-[42px]"
									>
										{testTypes.map((t: any) => (
											<option key={t.id} value={String(t.id)}>{t.name}</option>
										))}
										{testTypes.length === 0 && <option value="">Reliability Test</option>}
									</select>
								</div>

								{/* Test Category Select */}
								<div className="flex flex-col gap-1.5">
									<label htmlFor="testCategory" className="text-[10px] text-zinc-500 font-extrabold">Test Category</label>
									<select
										id="testCategory"
										value={form.testCategoryId}
										onChange={(e) => setForm({ ...form, testCategoryId: e.target.value })}
										className="bg-[#f8fafc] border border-zinc-200 rounded-xl p-3 text-zinc-800 text-xs font-semibold outline-none focus:border-[#11236a] transition-all cursor-pointer h-[42px]"
									>
										{testCategories.map((c: any) => (
											<option key={c.id} value={String(c.id)}>{c.name}</option>
										))}
										{testCategories.length === 0 && <option value="">PCB Buttons On-Off Test</option>}
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
												className={`py-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer outline-none border-none text-center ${
													isActive
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

							{/* Dynamic Interactive Station selection dropdown */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								<div className="flex flex-col gap-1.5">
									<label htmlFor="stationSelect" className="text-[10px] text-zinc-500 font-extrabold">Assign Station Unit</label>
									<select
										id="stationSelect"
										value={form.stationNo}
										onChange={(e) => setForm({ ...form, stationNo: Number(e.target.value), platformNos: [] })}
										className="bg-[#f8fafc] border border-zinc-200 rounded-xl p-3 text-zinc-800 text-xs font-semibold outline-none focus:border-[#11236a] transition-all cursor-pointer h-[42px]"
									>
										{Array.from({ length: 14 }, (_, i) => (
											<option key={i + 1} value={i + 1}>Station S{i + 1}</option>
										))}
									</select>
								</div>
							</div>

							{/* Dynamic Platform Telemetry grid for Selected Station */}
							<div className="flex flex-col gap-2.5">
								<label className="text-[10px] text-zinc-500 font-extrabold">Assign Platforms (Station S{form.stationNo})</label>
								<div className="border border-zinc-150 bg-[#f8fafc]/50 rounded-2xl p-4 space-y-3">
									<div className="flex flex-wrap gap-2">
										{Array.from({ length: 10 }, (_, i) => {
											const pNum = i + 1;
											const isSelected = form.platformNos.includes(pNum);
											// Query real-time database state
											const slot = platforms.find(
												(p: any) => p.stationNo === form.stationNo && p.platformNo === pNum
											);
											const isOccupied = slot ? !slot.isAvailable : false;

											return (
												<button
													key={pNum}
													type="button"
													onClick={() => {
														if (isOccupied) return;
														setForm(prev => {
															const current = prev.platformNos;
															const updated = current.includes(pNum)
																? current.filter(n => n !== pNum)
																: [...current, pNum];
															return { ...prev, platformNos: updated };
														});
													}}
													className={`w-14 h-12 rounded-xl border text-xs font-bold transition-all relative flex flex-col items-center justify-center cursor-pointer outline-none border-none ${
														isOccupied
															? 'bg-rose-50 text-rose-500 border-rose-100 opacity-80 cursor-not-allowed'
															: isSelected
																? 'bg-blue-600 text-white shadow-inner font-extrabold border-blue-500'
																: 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
													}`}
													title={
														isOccupied
															? `Occupied by: ${slot?.occupiedBy || 'N/A'}\nUntil: ${slot?.occupiedUntil ? new Date(slot.occupiedUntil).toLocaleDateString() : 'N/A'}`
															: `Platform #${pNum} (Available)`
													}
												>
													<span className="text-[10px] font-extrabold">#{pNum}</span>
													<span className={`text-[7px] font-extrabold px-1.5 py-0.2 rounded mt-0.5 uppercase ${
														isOccupied 
															? 'bg-rose-100 text-rose-700' 
															: isSelected 
																? 'bg-blue-500 text-white' 
																: 'bg-emerald-50 text-emerald-700'
													}`}>
														{isOccupied ? 'Busy' : isSelected ? 'Selected' : 'Free'}
													</span>
												</button>
											);
										})}
									</div>
								</div>
							</div>

							{/* Test Protocol select */}
							<div className="flex flex-col gap-1.5">
								<label htmlFor="testProtocol" className="text-[10px] text-zinc-500 font-extrabold">Test Protocol</label>
								<select
									id="testProtocol"
									value={form.testProtocolId}
									onChange={(e) => setForm({ ...form, testProtocolId: e.target.value })}
									className="bg-[#f8fafc] border border-zinc-200 rounded-xl p-3 text-zinc-800 text-xs font-semibold outline-none focus:border-[#11236a] transition-all cursor-pointer h-[42px]"
								>
									{testProtocols.map((p: any) => (
										<option key={p.id} value={String(p.id)}>{p.name}</option>
									))}
									{testProtocols.length === 0 && (
										<option value="">Reliability of PCB sticker , PCB keys, Panel keys</option>
									)}
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

								{/* End Date (Auto-Calculated) read-only */}
								<div className="flex flex-col gap-1.5">
									<label htmlFor="endDate" className="text-[10px] text-zinc-500 font-extrabold">End Date (Auto-Calculated)</label>
									<div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-zinc-500 text-xs font-semibold select-none flex items-center h-[42px]">
										{formatDateToDMY(form.endDate) || 'Awaiting Calculation'}
									</div>
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
