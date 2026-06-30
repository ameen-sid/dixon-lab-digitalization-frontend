import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ClipboardList, CheckCircle, XCircle, ArrowLeft, Eye, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Pagination from '../../components/Pagination';
import CustomSelect from '../../components/CustomSelect';
import toast from 'react-hot-toast';

interface InspectionTask {
	id: string; // Dynamic DB request ID
	requestId: string; // Formal REQ-2026-X format
	brandName: string;
	modelNo: string;
	testMethodRef: string;
	sampleDescription: string;
	sampleQty: number;
	status: string; // 'PENDING' | 'PASSED' | 'FAILED' | 'COMPLETED'
	assignedDate: string;
	engineerId?: string;
	engineerName?: string;
	testType?: { id: number; name: string } | null;
	sampleInspections?: any[];
}

interface SampleReport {
	allottedId: string;
	remarks: string;
	images: string[]; // Server file paths e.g. /uploads/inspection_results/...
	checks: { [key: number]: 'Yes' | 'No' | 'N.A' | undefined };
	status: 'PASSED' | 'FAILED';
}

interface AssignedSamplesProps {
	tasks: InspectionTask[];
	onCompleteInspection: (taskId: string, result: 'PASSED' | 'FAILED', remarks: string, checks: any) => void;
}

const CHECKPOINTS = [
	{ id: 1, text: "Is Sample Description same as written on Test Request Form?" },
	{ id: 2, text: "Is Model / Identification same as written on Test Request Form?" },
	{ id: 3, text: "Is Product Serial Number same as written on Test Request Form?" },
	{ id: 4, text: "Is Label available on sample?" },
	{ id: 5, text: "Is Sample Rating same as written on Test Request Form?" },
	{ id: 6, text: "Is Trade Mark / Brand same as written on Test Request Form?" },
	{ id: 7, text: "Is User Manual provided along with Test Request Form?" },
	{ id: 8, text: "Is sample free from damage?" },
	{ id: 9, text: "Is all accessories received with sample?" },
];

export default function AssignedSamples({ tasks, onCompleteInspection }: AssignedSamplesProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(5);

	// Route-based Navigation flow parameters
	const { planId, sampleIndex } = useParams<{ planId?: string; sampleIndex?: string }>();
	const navigate = useNavigate();
	const location = useLocation();

	const basePath = location.pathname.startsWith('/engineer') ? '/engineer' : '/manager';
	const activePlanId = planId || null;
	const activeSampleIndex = sampleIndex !== undefined ? parseInt(sampleIndex, 10) : null;

	const activePlan = tasks.find(t => t.id === activePlanId);
	const isPlanCompleted = activePlan ? [
		'INSPECTION_COMPLETED',
		'INSPECTION_FAILED',
		'UNDER_TESTING',
		'TESTING_PASSED',
		'TESTING_FAILED',
		'TESTING_PARTIAL',
		'RETEST',
		'COMPLETED',
		'FAILED',
		'REJECTED'
	].includes(activePlan.status) : false;

	const isViewOnly = new URLSearchParams(location.search).get('view') === 'true' || isPlanCompleted;

	// Dictionary mapping unique key `${planId}-sample-${sampleIndex}` to SampleReport
	const [sampleInspections, setSampleInspections] = useState<{ [key: string]: SampleReport }>({});

	// Fetch and populate sample inspections from DB when activePlanId is set
	useEffect(() => {
		if (!activePlanId) return;

		const fetchDbInspections = async () => {
			try {
				const { getTestRequestDetails } = await import('../../services/operations/testRequestService');
				const details = await getTestRequestDetails(activePlanId)();
				if (details && details.sampleInspections) {
					const mapped: { [key: string]: SampleReport } = {};
					details.sampleInspections.forEach((insp: any) => {
						if (insp.testPlanId !== null && insp.testPlanId !== undefined) return;
						let checksObj = {};
						try {
							checksObj = typeof insp.checks === 'string' ? JSON.parse(insp.checks) : insp.checks;
						} catch (e) {
							checksObj = insp.checks || {};
						}

						let imagesArr = [];
						try {
							imagesArr = typeof insp.images === 'string' ? JSON.parse(insp.images) : insp.images;
						} catch (e) {
							imagesArr = insp.images || [];
						}

						mapped[`${activePlanId}-sample-${insp.sampleIndex}`] = {
							allottedId: insp.allottedId,
							remarks: insp.remarks || '',
							status: insp.status as 'PASSED' | 'FAILED',
							checks: checksObj,
							images: imagesArr  // server file paths
						};
					});

					setSampleInspections(prev => ({
						...prev,
						...mapped
					}));
				}
			} catch (err) {
				console.error('Failed to fetch sample inspections from database: ', err);
			}
		};

		fetchDbInspections();
	}, [activePlanId]);

	// Inspection Form states
	const [checks, setChecks] = useState<{ [key: number]: 'Yes' | 'No' | 'N.A' | undefined }>({});
	const [allottedId, setAllottedId] = useState('');
	const [remarks, setRemarks] = useState('');
	// pendingFiles: actual File objects to be uploaded on save
	const [pendingFiles, setPendingFiles] = useState<File[]>([]);
	// previewUrls: local object URLs for preview before save
	const [previewUrls, setPreviewUrls] = useState<string[]>([]);
	// savedImagePaths: server paths already persisted in the DB
	const [savedImagePaths, setSavedImagePaths] = useState<string[]>([]);

	// Filter state
	const [statusFilter, setStatusFilter] = useState('All');
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');

	// Dictionary/cache of inspections compiled for statistics and list badges
	// Compute merged reports dynamically from tasks prop database relations and state
	const mergedReports = useMemo(() => {
		const reportsMap: { [key: string]: any } = {};

		tasks.forEach(task => {
			const taskAny = task as any;
			if (taskAny.sampleInspections) {
				taskAny.sampleInspections.forEach((insp: any) => {
					if (insp.testPlanId !== null && insp.testPlanId !== undefined) return;
					let checksObj = {};
					try {
						checksObj = typeof insp.checks === 'string' ? JSON.parse(insp.checks) : (insp.checks || {});
					} catch (e) {
						checksObj = {};
					}

					let imagesArr = [];
					try {
						imagesArr = typeof insp.images === 'string' ? JSON.parse(insp.images) : (insp.images || []);
					} catch (e) {
						imagesArr = [];
					}

					reportsMap[`${task.id}-sample-${insp.sampleIndex}`] = {
						allottedId: insp.allottedId,
						remarks: insp.remarks || '',
						status: insp.status,
						checks: checksObj,
						images: imagesArr
					};
				});
			}
		});

		Object.entries(sampleInspections).forEach(([key, val]) => {
			reportsMap[key] = val;
		});

		return reportsMap;
	}, [tasks, sampleInspections]);

	const getSampleInspectionStatus = (taskId: string, qty: number, requestStatus?: string) => {
		const isCompleted = requestStatus ? [
			'INSPECTION_COMPLETED',
			'INSPECTION_FAILED',
			'UNDER_TESTING',
			'TESTING_PASSED',
			'TESTING_FAILED',
			'TESTING_PARTIAL',
			'RETEST',
			'COMPLETED',
			'FAILED',
			'REJECTED'
		].includes(requestStatus) : true;

		if (!isCompleted) {
			return 'Pending';
		}

		let passedCount = 0;
		let failedCount = 0;
		let pendingCount = 0;

		for (let i = 0; i < qty; i++) {
			const cacheKey = `${taskId}-sample-${i}`;
			const report = mergedReports[cacheKey];
			if (!report) {
				pendingCount++;
			} else if (report.status === 'PASSED') {
				passedCount++;
			} else if (report.status === 'FAILED') {
				failedCount++;
			}
		}

		if (pendingCount > 0) {
			if (requestStatus === 'INSPECTION_FAILED' || requestStatus === 'FAILED') {
				return 'Failed';
			}
			if (['UNDER_TESTING', 'TESTING_PASSED', 'TESTING_FAILED', 'TESTING_PARTIAL', 'RETEST', 'COMPLETED'].includes(requestStatus || '')) {
				return 'Passed';
			}
			return 'Pending';
		}
		if (passedCount === qty) {
			return 'Passed';
		}
		if (failedCount === qty) {
			return 'Failed';
		}
		return 'Partial';
	};

	const matchesDateRange = (taskDate: string) => {
		if (!startDate && !endDate) return true;
		if (!taskDate) return false;
		const tDate = new Date(taskDate);
		tDate.setHours(0, 0, 0, 0);
		if (startDate) {
			const sDate = new Date(startDate);
			sDate.setHours(0, 0, 0, 0);
			if (tDate < sDate) return false;
		}
		if (endDate) {
			const eDate = new Date(endDate);
			eDate.setHours(0, 0, 0, 0);
			if (tDate > eDate) return false;
		}
		return true;
	};

	// Filter tasks dynamically
	const filteredTasks = tasks.filter(t => {
		const q = searchQuery.toLowerCase();
		const matchesSearch = t.brandName.toLowerCase().includes(q) ||
			t.requestId.toLowerCase().includes(q) ||
			t.modelNo.toLowerCase().includes(q) ||
			(t.testType?.name || '').toLowerCase().includes(q);

		const status = getSampleInspectionStatus(t.id, t.sampleQty || 1, t.status);
		const matchesStatus = statusFilter === 'All' || status === statusFilter;

		const matchesDate = matchesDateRange(t.assignedDate);

		return matchesSearch && matchesStatus && matchesDate;
	});



	const maxPage = Math.ceil(filteredTasks.length / itemsPerPage);
	const activePage = maxPage > 0 ? Math.min(currentPage, maxPage) : 1;
	const startIndex = (activePage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

	// Handler to start inspecting a specific sample
	const handleStartSampleInspection = (sampleIdx: number, readOnly = false) => {
		if (!activePlanId) return;
		navigate(`${basePath}/assigned-samples/${activePlanId}/sample/${sampleIdx}${readOnly ? '?view=true' : ''}`);
	};

	useEffect(() => {
		if (activePlanId && activeSampleIndex !== null) {
			const cacheKey = `${activePlanId}-sample-${activeSampleIndex}`;
			const existingReport = sampleInspections[cacheKey];

			if (existingReport) {
				setChecks(existingReport.checks || {});
				setAllottedId(existingReport.allottedId || '');
				setRemarks(existingReport.remarks || '');
				setSavedImagePaths(existingReport.images || []);
				setPendingFiles([]);
				setPreviewUrls([]);
			} else {
				setChecks({});
				setAllottedId(`${activePlan?.requestId || 'REQ'}-S${String(activeSampleIndex + 1).padStart(2, '0')}`);
				setRemarks('');
				setPendingFiles([]);
				setPreviewUrls([]);
				setSavedImagePaths([]);
			}
		}
	}, [activePlanId, activeSampleIndex, activePlan, sampleInspections]);

	// Image loader: store File objects + generate preview URLs
	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files) return;
		const newFiles = Array.from(files);
		const newPreviews = newFiles.map(f => URL.createObjectURL(f));
		setPendingFiles(prev => [...prev, ...newFiles]);
		setPreviewUrls(prev => [...prev, ...newPreviews]);
	};

	// Remove a pending (not-yet-saved) file
	const removePendingImage = (idxToRemove: number) => {
		URL.revokeObjectURL(previewUrls[idxToRemove]);
		setPendingFiles(prev => prev.filter((_, idx) => idx !== idxToRemove));
		setPreviewUrls(prev => prev.filter((_, idx) => idx !== idxToRemove));
	};

	// Remove an already-saved server image path
	const removeSavedImage = (idxToRemove: number) => {
		setSavedImagePaths(prev => prev.filter((_, idx) => idx !== idxToRemove));
	};

	// Save individual sample inspection result
	const handleSaveSampleReport = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!activePlanId || activeSampleIndex === null) return;

		if (!allottedId.trim()) {
			toast.error('Please allot a sample identification code.');
			return;
		}

		// Validation: check if all 9 checkpoints are answered
		for (let i = 1; i <= 9; i++) {
			if (!checks[i]) {
				toast.error(`Please provide an observation for checkpoint ${i} before saving.`);
				return;
			}
		}

		// Outcome rule: if ANY checkpoint is answered 'No', the sample FAILS; 'Yes' and 'N.A' both pass
		const hasNonCompliance = CHECKPOINTS.some(cp => checks[cp.id] === 'No');
		const status: 'PASSED' | 'FAILED' = hasNonCompliance ? 'FAILED' : 'PASSED';

		const cacheKey = `${activePlanId}-sample-${activeSampleIndex}`;

		try {
			const { saveSampleInspection } = await import('../../services/operations/testRequestService');
			// Build FormData — send real files to backend
			const formData = new FormData();
			formData.append('sampleIndex', String(activeSampleIndex));
			formData.append('allottedId', allottedId);
			formData.append('remarks', remarks);
			formData.append('status', status);
			formData.append('checks', JSON.stringify(checks));
			formData.append('existingImages', JSON.stringify(savedImagePaths));
			pendingFiles.forEach(file => formData.append('images', file));
			const savedRecord = await saveSampleInspection(activePlanId, formData)();

			// Parse server paths back from the saved record
			let serverPaths: string[] = [];
			try {
				serverPaths = savedRecord?.images ? JSON.parse(savedRecord.images) : [];
			} catch { serverPaths = []; }

			const newReport: SampleReport = {
				allottedId,
				remarks,
				images: serverPaths,
				checks,
				status
			};
			setSampleInspections(prev => ({ ...prev, [cacheKey]: newReport }));
			// Clear pending files after successful save
			previewUrls.forEach(url => URL.revokeObjectURL(url));
			setPendingFiles([]);
			setPreviewUrls([]);
			setSavedImagePaths(serverPaths);
		} catch (err) {
			console.error('Failed to sync sample inspection with database: ', err);
		}

		toast.success(`Sample ${activeSampleIndex + 1} report logged successfully.`);
		navigate(`${basePath}/assigned-samples/${activePlanId}`);
	};

	// Compile and submit all sample reports to complete final plan
	const handleSubmitFinalInspectionPlan = async () => {
		if (!activePlanId || !activePlan) return;

		const qty = activePlan.sampleQty || 1;
		const compiledReports: SampleReport[] = [];

		for (let i = 0; i < qty; i++) {
			const cacheKey = `${activePlanId}-sample-${i}`;
			const report = sampleInspections[cacheKey];
			if (!report) {
				toast.error(`Please complete inspection for Sample ${i + 1} first.`);
				return;
			}
			compiledReports.push(report);
		}

		// Calculate overall result: if any sample failed, the overall outcome is FAILED
		const overallFailed = compiledReports.some(r => r.status === 'FAILED');
		const result: 'PASSED' | 'FAILED' = overallFailed ? 'FAILED' : 'PASSED';

		// Construct compiled remarks
		const finalRemarks = `Integrated Calibration Report: Completed visual checklist checks for all ${qty} samples. ` +
			`Overall outcome: ${result}. Details of sample allotments: ${compiledReports.map(r => r.allottedId).join(', ')}.`;

		try {
			await onCompleteInspection(
				activePlanId,
				result,
				finalRemarks,
				{ compiledReports }
			);

			// Save completed reports in DB via onCompleteInspection

			// Clear local storage cache for this plan
			setSampleInspections(prev => {
				const updated = { ...prev };
				for (let i = 0; i < qty; i++) {
					delete updated[`${activePlanId}-sample-${i}`];
				}
				return updated;
			});

			toast.success(`Final calibration report for ${activePlan.requestId} successfully synchronized to server!`);
			navigate(`${basePath}/assigned-samples`);
		} catch (error) {
			console.error("Failed to compile and submit final report:", error);
		}
	};

	// ==========================================
	// SCREEN 3: DYNAMIC SAMPLE INSPECTION FORM
	// ==========================================
	if (activePlan && activeSampleIndex !== null) {
		return (
			<div className="space-y-6">
				{/* Top Bar Navigation */}
				<div className="flex items-center gap-3">
					<button
						onClick={() => navigate(`${basePath}/assigned-samples/${activePlanId}`)}
						className="w-9 h-9 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-555 hover:text-zinc-800 hover:shadow-sm transition-all cursor-pointer outline-none border-none shrink-0"
					>
						<ArrowLeft className="w-4 h-4 shrink-0" />
					</button>
					<div>
						<h3 className="text-base font-extrabold text-zinc-900 tracking-tight leading-none">
							{isViewOnly ? 'View Inspection Result' : 'Inspect Sample'} {activeSampleIndex + 1}
						</h3>
						<span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
							{activePlan.requestId} • {activePlan.brandName} • {activePlan.modelNo}
						</span>
					</div>
				</div>

				<form onSubmit={handleSaveSampleReport} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

					{/* Left: The Checklist Table */}
					<div className="lg:col-span-2 bg-white border border-zinc-200/50 rounded-3xl shadow-sm overflow-hidden p-1.5">
						<div className="overflow-x-auto">
							<table className="w-full text-left border-collapse min-w-[600px]">
								<thead>
									<tr className="bg-zinc-50/80 border-b border-zinc-250/20 text-zinc-650 font-extrabold text-[11px] uppercase tracking-wider">
										<th className="py-4.5 px-6 w-16 text-center">Sr. No</th>
										<th className="py-4.5 px-6">Check Point</th>
										<th className="py-4.5 px-6 text-center w-56">Observation</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-zinc-100 text-zinc-800">
									{CHECKPOINTS.map((checkpoint) => {
										const qId = checkpoint.id;
										const selectedValue = checks[qId];
										return (
											<tr key={qId} className="hover:bg-zinc-50/30 transition-colors">
												<td className="py-5 px-6 text-[13px] text-zinc-400 font-bold text-center">{qId}</td>
												<td className="py-5 px-6 text-[13.5px] font-semibold text-zinc-800 leading-normal">{checkpoint.text}</td>
												<td className="py-5 px-6">
													<div className="flex justify-center gap-1.5">
														{['Yes', 'No', 'N.A'].map((opt) => {
															const isSelected = selectedValue === opt;
															let activeClass = '';

															if (isSelected) {
																if (opt === 'Yes') activeClass = 'bg-[#11236a] text-white border-[#11236a]';
																else if (opt === 'No') activeClass = 'bg-rose-600 text-white border-rose-600';
																else activeClass = 'bg-zinc-600 text-white border-zinc-600';
															} else {
																activeClass = 'bg-white hover:bg-zinc-50 text-zinc-650 border-zinc-200 hover:border-zinc-300';
															}

															return (
																<button
																	key={opt}
																	type="button"
																	disabled={isViewOnly}
																	onClick={() => setChecks(prev => ({ ...prev, [qId]: opt as 'Yes' | 'No' | 'N.A' }))}
																	className={`text-[11px] font-bold px-4 py-1.5 rounded-lg border transition-all cursor-pointer outline-none active:scale-95 min-w-[62px] text-center ${activeClass} ${isViewOnly ? 'opacity-80 cursor-not-allowed active:scale-100' : ''}`}
																>
																	{opt}
																</button>
															);
														})}
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>

					{/* Right: Telemetry metadata and uploads */}
					<div className="space-y-6">

						{/* Identification and remarks */}
						<div className="bg-white border border-zinc-200/60 rounded-3xl p-6 shadow-sm space-y-4">
							<h4 className="text-xs font-bold text-zinc-950 uppercase tracking-wider border-b border-zinc-100 pb-2">
								Sample Identification
							</h4>
							<div className="space-y-3.5">
								<div className="space-y-1.5">
									<label className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider block">
										10. Sample ID Allotted
									</label>
									<input
										type="text"
										value={allottedId}
										onChange={(e) => setAllottedId(e.target.value)}
										placeholder="Enter ID..."
										required
										disabled={isViewOnly}
										className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 placeholder-zinc-500 outline-none focus:bg-white focus:border-[#11236a] transition-all disabled:opacity-75 disabled:cursor-not-allowed"
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider block">
										11. Remarks (If any)
									</label>
									<textarea
										value={remarks}
										onChange={(e) => setRemarks(e.target.value)}
										placeholder="Add notes..."
										disabled={isViewOnly}
										className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 placeholder-zinc-500 outline-none focus:bg-white focus:border-[#11236a] transition-all h-20 resize-none disabled:opacity-75 disabled:cursor-not-allowed"
									/>
								</div>
							</div>
						</div>

						{/* Pictures upload zone */}
						<div className="bg-white border border-zinc-200/60 rounded-3xl p-6 shadow-sm space-y-4">
							<h4 className="text-xs font-bold text-zinc-955 uppercase tracking-wider border-b border-zinc-100 pb-2">
								12. Sample Picture Upload
							</h4>

							{/* Drag and Drop box */}
							{!isViewOnly && (
								<div
									onClick={() => fileInputRef.current?.click()}
									className="border-2 border-dashed border-zinc-200 hover:border-[#11236a] rounded-2xl p-6 text-center cursor-pointer transition-all bg-zinc-50/50 hover:bg-zinc-50 flex flex-col items-center justify-center gap-2 group"
								>
									<input
										type="file"
										ref={fileInputRef}
										onChange={handleImageChange}
										multiple
										accept="image/*"
										className="hidden"
									/>
									<div className="w-10 h-10 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-zinc-550 group-hover:text-[#11236a] shadow-sm transition-colors">
										<Upload className="w-4 h-4" />
									</div>
									<div>
										<p className="text-xs font-bold text-zinc-800 leading-none">CLICK TO UPLOAD PIC</p>
										<p className="text-[9px] text-zinc-400 font-bold mt-1.5 uppercase">Supports PNG, JPG references</p>
									</div>
								</div>
							)}

							{/* Already-saved server images */}
							{savedImagePaths.length > 0 && (
								<div className="space-y-2 border-t border-zinc-100 pt-3">
									<p className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider">
										Saved Photos ({savedImagePaths.length})
									</p>
									<div className="grid grid-cols-3 gap-2">
										{savedImagePaths.map((path, idx) => (
											<div key={`saved-${idx}`} className="relative aspect-square border border-zinc-200 rounded-lg overflow-hidden group">
												{isViewOnly ? (
													<a href={path} target="_blank" rel="noopener noreferrer" className="block w-full h-full cursor-zoom-in">
														<img
															src={path}
															alt={`saved-${idx}`}
															className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
														/>
													</a>
												) : (
													<>
														<img
															src={path}
															alt={`saved-${idx}`}
															className="w-full h-full object-cover"
														/>
														<button
															type="button"
															onClick={() => removeSavedImage(idx)}
															className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer border-none outline-none"
														>
															<Trash2 className="w-4 h-4" />
														</button>
													</>
												)}
											</div>
										))}
									</div>
								</div>
							)}

							{/* Pending (not yet saved) previews */}
							{previewUrls.length > 0 && (
								<div className="space-y-2 border-t border-zinc-100 pt-3">
									<p className="text-[9px] text-amber-600 font-extrabold uppercase tracking-wider">
										Pending Upload ({previewUrls.length}) — will save on submit
									</p>
									<div className="grid grid-cols-3 gap-2">
										{previewUrls.map((url, idx) => (
											<div key={`pending-${idx}`} className="relative aspect-square border-2 border-dashed border-amber-300 rounded-lg overflow-hidden group">
												<img
													src={url}
													alt={`pending-${idx}`}
													className="w-full h-full object-cover opacity-80"
												/>
												<button
													type="button"
													onClick={() => removePendingImage(idx)}
													className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer border-none outline-none"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											</div>
										))}
									</div>
								</div>
							)}
						</div>

						{/* Form submission controls + Live Result Evaluator */}
						{(() => {
							const answeredCount = CHECKPOINTS.filter(cp => checks[cp.id] !== undefined).length;
							const hasAnyNo = CHECKPOINTS.some(cp => checks[cp.id] === 'No');
							const allAnswered = answeredCount === CHECKPOINTS.length;
							const liveResult = allAnswered ? (hasAnyNo ? 'FAILED' : 'PASSED') : null;
							return (
								<div className="space-y-3">
									<div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
										<span>Checkpoint Progress</span>
										<span className={allAnswered ? 'text-emerald-600' : 'text-zinc-400'}>{answeredCount} / {CHECKPOINTS.length}</span>
									</div>
									<div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
										<div className={`h-full rounded-full transition-all duration-500 ${hasAnyNo ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${(answeredCount / CHECKPOINTS.length) * 100}%` }} />
									</div>
									{liveResult && (
										<div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border font-bold text-xs ${liveResult === 'PASSED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
											{liveResult === 'PASSED' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
											<span>Sample Result: <span className="font-extrabold">{liveResult}</span>{liveResult === 'FAILED' ? ' — One or more checkpoints marked as Non-Compliant (No)' : ' — All checkpoints compliant'}</span>
										</div>
									)}
									<div className="flex gap-2">
										<button type="button" onClick={() => navigate(`${basePath}/assigned-samples/${activePlanId}`)} className="flex-1 bg-white hover:bg-zinc-50 text-zinc-700 font-bold text-xs py-2.5 rounded-xl border border-zinc-200 cursor-pointer active:scale-95 outline-none transition-colors">Back to Samples</button>
										{!isViewOnly && (
											<button type="submit" className="flex-grow-[2] bg-[#11236a] text-white font-bold text-xs py-2.5 rounded-xl hover:bg-[#0c1a52] transition-all cursor-pointer active:scale-[0.98] outline-none border-none shadow-sm">Save Sample Report</button>
										)}
									</div>
								</div>
							);
						})()}
					</div>
				</form>
			</div>
		);
	}

	// ==========================================
	// SCREEN 2: DYNAMIC SAMPLES CHECKLIST GRID
	// ==========================================
	if (activePlan) {
		const qty = activePlan.sampleQty || 1;
		const samples = Array.from({ length: qty }, (_, idx) => {
			const cacheKey = `${activePlanId}-sample-${idx}`;
			const report = sampleInspections[cacheKey];
			return {
				index: idx,
				id: report?.allottedId || `${activePlan.requestId}-S${String(idx + 1).padStart(2, '0')}`,
				status: report ? report.status : 'PENDING',
				report
			};
		});

		const allCompleted = samples.every(s => s.status !== 'PENDING');

		return (
			<div className="space-y-6">
				{/* Top bar */}
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<button
							onClick={() => navigate(`${basePath}/assigned-samples`)}
							className="w-9 h-9 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-800 hover:shadow-sm transition-all cursor-pointer outline-none border-none shrink-0"
						>
							<ArrowLeft className="w-4 h-4 shrink-0" />
						</button>
						<div>
							<h3 className="text-base font-extrabold text-zinc-900 tracking-tight leading-none">
								Inspection Plan for {activePlan.requestId}
							</h3>
							<span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
								{activePlan.brandName} • {activePlan.modelNo} • {qty} {qty === 1 ? 'Sample' : 'Samples'} Awaiting Calibration
							</span>
						</div>
					</div>

					{(() => {
						const isPlanCompleted = [
							'INSPECTION_COMPLETED',
							'INSPECTION_FAILED',
							'UNDER_TESTING',
							'TESTING_PASSED',
							'TESTING_FAILED',
							'TESTING_PARTIAL',
							'RETEST',
							'COMPLETED',
							'FAILED',
							'REJECTED'
						].includes(activePlan.status);
						if (isPlanCompleted) {
							return (
								<div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-100 font-extrabold text-xs px-4 py-2 rounded-xl">
									<CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
									Final Report Submitted
								</div>
							);
						}
						if (allCompleted) {
							return (
								<button
									onClick={handleSubmitFinalInspectionPlan}
									className="bg-[#11236a] text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-[#0c1a52] transition-all cursor-pointer active:scale-95 outline-none border-none flex items-center gap-1.5 shadow-sm"
								>
									<CheckCircle className="w-4 h-4 shrink-0" />
									Compile & Submit Final Report
								</button>
							);
						}
						return null;
					})()}
				</div>

				{/* Parent specs details header */}
				<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-5">
					<div>
						<span className="text-zinc-400 font-extrabold uppercase text-[8px] tracking-wider block">Standard Reference Protocol</span>
						<span className="text-[#11236a] font-extrabold text-xs leading-none mt-1.5 block">{activePlan.testMethodRef}</span>
					</div>
					<div>
						<span className="text-zinc-400 font-extrabold uppercase text-[8px] tracking-wider block">Duty Specialist Allocation</span>
						<span className="text-zinc-800 font-bold text-xs leading-none mt-1.5 block">{activePlan.engineerName || 'Lab Manager'}</span>
					</div>
					<div>
						<span className="text-zinc-400 font-extrabold uppercase text-[8px] tracking-wider block">Original Submission Specifications</span>
						<p className="text-zinc-650 font-medium text-[11px] leading-relaxed mt-1">{activePlan.sampleDescription}</p>
					</div>
				</div>

				{/* Samples Registry Table - Tabular row wise layout */}
				<div className="bg-white border border-zinc-200/50 rounded-3xl shadow-sm overflow-hidden p-1">
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse min-w-[700px]">
							<thead>
								<tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 font-bold text-[10px] uppercase tracking-wider">
									<th className="py-4 px-6 w-28">Sample No</th>
									<th className="py-4 px-6">Allotted Sample ID</th>
									<th className="py-4 px-6">Current Status</th>
									<th className="py-4 px-6">Summary Remarks</th>
									<th className="py-4 px-6 text-right">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-zinc-100 text-xs font-semibold text-zinc-700">
								{samples.map((sample) => {
									const isPending = sample.status === 'PENDING';
									return (
										<tr key={sample.index} className="hover:bg-zinc-50/30 transition-all">
											<td className="py-4 px-6 font-bold text-zinc-400">Sample {sample.index + 1}</td>
											<td className="py-4 px-6 font-extrabold text-zinc-900">{sample.id}</td>
											<td className="py-4 px-6">
												<span className={`text-[9px] font-bold px-2.5 py-0.5 border rounded-full uppercase tracking-wider inline-flex items-center gap-1 ${sample.status === 'PASSED'
													? 'bg-emerald-50 text-emerald-600 border-emerald-100'
													: sample.status === 'FAILED'
														? 'bg-rose-50 text-rose-600 border-rose-100'
														: 'bg-zinc-50 text-zinc-550 border-zinc-200'
													}`}>
													{isPending ? (
														<>Awaiting Setup</>
													) : (
														<>
															{sample.status === 'PASSED' ? (
																<CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
															) : (
																<XCircle className="w-2.5 h-2.5 text-rose-600" />
															)}
															{sample.status}
														</>
													)}
												</span>
											</td>
											<td className="py-4 px-6">
												{!isPending && sample.report ? (
													<div className="max-w-xs space-y-0.5">
														<p className="text-zinc-650 truncate" title={sample.report.remarks}>
															Remarks: <span className="text-zinc-800 font-medium">"{sample.report.remarks || 'No issues observed.'}"</span>
														</p>
														{sample.report.images.length > 0 && (
															<span className="inline-flex items-center gap-1 text-[9px] text-[#11236a] font-bold">
																<ImageIcon className="w-3.5 h-3.5 shrink-0" />
																{sample.report.images.length} photo(s)
															</span>
														)}
													</div>
												) : (
													<span className="text-zinc-400 italic">Not inspected yet</span>
												)}
											</td>
											<td className="py-4 px-6 text-right">
												<button
													onClick={() => handleStartSampleInspection(sample.index, !isPending)}
													className={`font-bold text-[11px] px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer outline-none active:scale-[0.98] ${isPending
														? 'bg-[#11236a] text-white border-none hover:bg-[#0c1a52]'
														: 'bg-transparent text-zinc-700 hover:bg-zinc-50 border-zinc-200'
														}`}
												>
													{isPending ? 'Inspect Now' : 'View Result of Inspection'}
												</button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		);
	}

	// ==========================================
	// SCREEN 1: THE ACTIVE PLANS REGISTRY TABLE
	// ==========================================
	return (
		<div className="space-y-6">
			{/* Filters toolbar */}
			<div className="bg-white border border-zinc-200/50 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
				{/* Search input (Left side) */}
				<div className="relative w-full lg:max-w-xs">
					<Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-555" />
					<input
						type="text"
						placeholder="Search assigned inspection plans..."
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							setCurrentPage(1);
						}}
						className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-zinc-805 placeholder-zinc-500 outline-none focus:bg-white focus:border-[#11236a] transition-all"
					/>
				</div>

				{/* Other filters (Right side) */}
				<div className="flex flex-col sm:flex-row gap-4 items-center w-full lg:w-auto lg:justify-end">
					<div className="flex items-center gap-2 w-full sm:w-auto">
						<span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider whitespace-nowrap">Status:</span>
						<CustomSelect
							value={statusFilter}
							onChange={(val) => {
								setStatusFilter(val);
								setCurrentPage(1);
							}}
							options={[
								{ value: "All", label: "All Statuses" },
								{ value: "Passed", label: "Passed" },
								{ value: "Failed", label: "Failed" },
								{ value: "Partial", label: "Partial" },
								{ value: "Pending", label: "Pending" }
							]}
							className="w-full sm:w-36"
						/>
					</div>

					<div className="flex items-center gap-2 w-full sm:w-auto">
						<span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider whitespace-nowrap">From:</span>
						<input
							type="date"
							value={startDate}
							onChange={(e) => {
								setStartDate(e.target.value);
								setCurrentPage(1);
							}}
							className="bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-800 outline-none focus:bg-white focus:border-[#11236a] transition-all w-full sm:w-auto"
						/>
					</div>

					<div className="flex items-center gap-2 w-full sm:w-auto">
						<span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider whitespace-nowrap">To:</span>
						<input
							type="date"
							value={endDate}
							onChange={(e) => {
								setEndDate(e.target.value);
								setCurrentPage(1);
							}}
							className="bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-800 outline-none focus:bg-white focus:border-[#11236a] transition-all w-full sm:w-auto"
						/>
					</div>

					{(searchQuery || statusFilter !== 'All' || startDate || endDate) && (
						<button
							onClick={() => {
								setSearchQuery('');
								setStatusFilter('All');
								setStartDate('');
								setEndDate('');
								setCurrentPage(1);
							}}
							className="text-xs font-bold text-red-655 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/50 px-3.5 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-center"
						>
							Clear Filters
						</button>
					)}
				</div>
			</div>

			{/* Task table list */}
			<div className="bg-white border border-zinc-200/50 rounded-3xl shadow-sm overflow-hidden p-1">
				{paginatedTasks.length === 0 ? (
					<div className="text-center py-16">
						<ClipboardList className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
						<h4 className="text-sm font-bold text-zinc-800">No active plans assigned</h4>
						<p className="text-xs text-zinc-500 font-light mt-1">Select and assign a specialist in the Approved Request details page to see them listed here.</p>
					</div>
				) : (
					<div className="overflow-x-auto flex flex-col justify-between">
						<table className="w-full text-left border-collapse min-w-[800px]">
							<thead>
								<tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 font-bold text-[10px] uppercase tracking-wider">
									<th className="py-4 px-6">Plan/Request ID</th>
									<th className="py-4 px-6">Brand & Model</th>
									<th className="py-4 px-6">Test Type</th>
									<th className="py-4 px-6">Sample Qty</th>
									<th className="py-4 px-6 text-center">Inspection Status</th>
									<th className="py-4 px-6 text-center">Assigned Date</th>
									<th className="py-4 px-6 text-right">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-zinc-100 text-xs font-semibold text-zinc-700">
								{paginatedTasks.map((task) => {
									const isCompleted = [
										'INSPECTION_COMPLETED',
										'INSPECTION_FAILED',
										'UNDER_TESTING',
										'TESTING_PASSED',
										'TESTING_FAILED',
										'TESTING_PARTIAL',
										'RETEST',
										'COMPLETED',
										'FAILED',
										'REJECTED'
									].includes(task.status);
									const inspStatus = getSampleInspectionStatus(task.id, task.sampleQty || 1, task.status);
									return (
										<tr key={task.id} className="hover:bg-zinc-50/50 transition-all group">
											<td className="py-4 px-6 font-extrabold text-zinc-955">{task.requestId}</td>
											<td className="py-4 px-6">
												<div className="font-extrabold text-zinc-900">{task.brandName}</div>
												<span className="text-[10px] text-zinc-500 font-semibold">{task.modelNo}</span>
											</td>
											<td className="py-4 px-6 text-[#11236a] font-extrabold max-w-[220px] truncate" title={task.testType?.name || 'N/A'}>
												{task.testType?.name || 'N/A'}
											</td>
											<td className="py-4 px-6">
												<span className="inline-block text-[11px] font-extrabold px-2.5 py-0.5 bg-indigo-50 text-[#11236a] rounded-lg">
													{task.sampleQty} pcs
												</span>
											</td>
											<td className="py-4 px-6 text-center">
												<span className={`text-[9px] font-extrabold px-2.5 py-0.5 border rounded-full uppercase tracking-wider inline-flex items-center gap-1 ${inspStatus === 'Passed'
													? 'bg-emerald-50 text-emerald-700 border-emerald-100'
													: inspStatus === 'Failed'
														? 'bg-rose-50 text-rose-700 border-rose-100'
														: inspStatus === 'Partial'
															? 'bg-amber-50 text-amber-705 border-amber-100 animate-pulse'
															: 'bg-zinc-50 text-zinc-600 border-zinc-200'
													}`}>
													{inspStatus}
												</span>
											</td>
											<td className="py-4 px-6 text-center text-zinc-500 font-bold">{task.assignedDate}</td>
											<td className="py-4 px-6 text-right">
												<div className="flex items-center justify-end gap-3">
													{isCompleted && (
														<span className="text-emerald-600 font-extrabold text-[10px] uppercase tracking-wider bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
															<CheckCircle className="w-3 h-3 text-emerald-600" />
															Certified Done
														</span>
													)}
													<button
														onClick={() => navigate(`${basePath}/assigned-samples/${task.id}`)}
														className="bg-[#11236a] text-white font-bold text-[11px] px-3.5 py-1.5 rounded-lg hover:bg-[#0c1a52] transition-all cursor-pointer border-none outline-none active:scale-[0.97] flex items-center gap-1 shrink-0"
													>
														<Eye className="w-3.5 h-3.5" />
														{isCompleted ? 'View Checklist' : 'View Details'}
													</button>
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>

						<Pagination
							totalItems={filteredTasks.length}
							itemsPerPage={itemsPerPage}
							currentPage={currentPage}
							onPageChange={setCurrentPage}
							onItemsPerPageChange={(limit) => {
								setItemsPerPage(limit);
								setCurrentPage(1);
							}}
							itemNamePlural="inspection plans"
						/>
					</div>
				)}
			</div>
		</div>
	);
}
