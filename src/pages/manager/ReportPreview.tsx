import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Printer, X, FileText, AlertTriangle } from 'lucide-react';
import { getTestRequests } from '../../services/operations/testRequestService';
import { getTestCategories } from '../../services/operations/testCategoryService';
import { getTestProtocols } from '../../services/operations/testProtocolService';
import { getTestingEquipments } from '../../services/operations/testingEquipmentService';
import { getUsers } from '../../services/operations/userService';


const INSPECTION_CHECKPOINTS = [
	{ id: 1, text: 'Model No, Brand Name, Manufacturer Name verify on Carton.' },
	{ id: 2, text: 'Model No, Brand Name, Manufacturer Name verify on Rating Label.' },
	{ id: 3, text: 'Instruction Manual & Warranty Card verify in Carton.' },
	{ id: 4, text: 'Visual check of Sample (Free from dent, scratches, etc.)' },
	{ id: 5, text: 'Mechanical check (all parts assemble properly & fitment).' },
	{ id: 6, text: 'Check Power Cord length & plug top rating.' },
	{ id: 7, text: 'Continuity Check of Earthing (Value < 0.1 ohm).' },
	{ id: 8, text: 'High Voltage Test (1500 V / 1800 V for 1 min/1 sec).' },
	{ id: 9, text: 'Earth Leakage Current Test (Value < 0.75 mA).' }
];

export default function ReportPreview() {
	const location = useLocation();

	// Parse query params
	const query = new URLSearchParams(location.search);
	const type = query.get('type'); // 'sample' | 'request'
	const key = query.get('key'); // for sample: `${requestId}-sample-${sampleIndex}`
	const id = query.get('id'); // for request: `${requestId}`

	// States
	const [requests, setRequests] = useState<any[]>([]);
	const [testCategories, setTestCategories] = useState<any[]>([]);
	const [testProtocols, setTestProtocols] = useState<any[]>([]);
	const [equipments, setEquipments] = useState<any[]>([]);
	const [users, setUsers] = useState<any[]>([]);
	const [plans, setPlans] = useState<{ [key: string]: any }>({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;
		const loadData = async () => {
			try {
				const reqs = await getTestRequests()();
				const categories = await getTestCategories()();
				const protocols = await getTestProtocols()();
				const eqs = await getTestingEquipments({ limit: 1000 })();
				const userList = await getUsers()();
				const plansMap: { [key: string]: any } = {};
				if (reqs && Array.isArray(reqs)) {
					reqs.forEach((req: any) => {
						if (req.testPlans) {
							req.testPlans.forEach((plan: any) => {
								let platformNosParsed = [];
								if (plan.platformNos) {
									try {
										platformNosParsed = typeof plan.platformNos === 'string' ? JSON.parse(plan.platformNos) : plan.platformNos;
									} catch (e) {
										platformNosParsed = [];
									}
								}
								plansMap[`${req.id}-sample-${plan.sampleIndex}`] = {
									...plan,
									platformNos: platformNosParsed
								};
							});
						}
					});
				}

				if (isMounted) {
					setRequests(reqs || []);
					setTestCategories(categories || []);
					setTestProtocols(protocols || []);
					setEquipments(eqs || []);
					setUsers(userList || []);
					setPlans(plansMap);
				}
			} catch (err) {
				console.error('Failed to load report data:', err);
			} finally {
				if (isMounted) setLoading(false);
			}
		};
		loadData();
		return () => {
			isMounted = false;
		};
	}, []);

	// Formatting Helpers
	const formatDate = (dateStr: string) => {
		if (!dateStr) return 'N/A';
		const d = new Date(dateStr);
		if (isNaN(d.getTime())) return dateStr;
		const day = String(d.getDate()).padStart(2, '0');
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const year = d.getFullYear();
		return `${day}/${month}/${year}`;
	};

	const triggerPrint = () => {
		window.print();
	};

	const closeTab = () => {
		window.close();
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center space-y-4">
				<div className="w-12 h-12 border-4 border-indigo-700 border-t-transparent rounded-full animate-spin"></div>
				<p className="text-zinc-650 text-xs font-bold">Assembling Quality Laboratory PDF Preview...</p>
			</div>
		);
	}

	// 1. RESOLVE DATA DEPENDING ON REPORT TYPE
	let request: any = null;
	let sampleIndex: number | null = null;
	let targetPlan: any = null;
	let samplesList: any[] = [];
	let isOverallPassed = true;
	let isOverallPartial = false;

	if (type === 'sample' && key) {
		const [reqIdStr, sampleIdxStr] = key.split('-sample-');
		sampleIndex = parseInt(sampleIdxStr, 10);
		request = requests.find(r => String(r.id) === String(reqIdStr));
		targetPlan = plans[key];
		if (targetPlan) {
			isOverallPassed = targetPlan.evaluationStatus === 'PASSED';
		}
	} else if (type === 'request' && id) {
		request = requests.find(r => String(r.id) === String(id));
		if (request) {
			const qty = request.sampleQty || 1;
			let hasFailure = false;
			let passedCount = 0;
			let failedCount = 0;
			for (let i = 0; i < qty; i++) {
				const cacheKey = `${request.id}-sample-${i}`;
				const plan = plans[cacheKey];
				const inspectionReport = request.sampleInspections?.find((r: any) => Number(r.sampleIndex) === i);
				
				let finalOutcome = 'PENDING';
				let remarks = '';
				if (inspectionReport) {
					if (inspectionReport.status === 'FAILED') {
						finalOutcome = 'FAILED';
						remarks = inspectionReport.remarks || 'Failed visual verification check.';
						hasFailure = true;
						failedCount++;
					} else if (inspectionReport.status === 'PASSED') {
						if (plan) {
							if (plan.evaluationStatus === 'PASSED') {
								finalOutcome = 'PASSED';
								remarks = plan.evaluationRemarks || 'Endurance specifications complied.';
								passedCount++;
							} else if (plan.evaluationStatus === 'FAILED') {
								finalOutcome = 'FAILED';
								remarks = plan.evaluationRemarks || 'Physical parameter out of tolerance.';
								hasFailure = true;
								failedCount++;
							}
						}
					}
				}
				samplesList.push({
					index: i,
					allottedId: inspectionReport?.allottedId || `REQ-${request.id}-S${String(i + 1).padStart(2, '0')}`,
					inspectionReport,
					plan,
					finalOutcome,
					remarks
				});
			}
			isOverallPassed = !hasFailure;
			isOverallPartial = passedCount > 0 && failedCount > 0;
			
			// Use first non-null sample's plan for metadata template fields
			let foundPlan = null;
			for (let i = 0; i < qty; i++) {
				const cacheKey = `${request.id}-sample-${i}`;
				const plan = plans[cacheKey];
				if (plan) {
					foundPlan = plan;
					break;
				}
			}
			targetPlan = foundPlan;
		}
	}

	const inspectionReport = (type === 'sample' && request && sampleIndex !== null)
		? request.sampleInspections?.find((r: any) => Number(r.sampleIndex) === sampleIndex)
		: null;

	const isSampleFailedInspection = inspectionReport?.status === 'FAILED';

	const inspectionChecks = (() => {
		if (!inspectionReport) return {};
		try {
			return typeof inspectionReport.checks === 'string'
				? JSON.parse(inspectionReport.checks)
				: (inspectionReport.checks || {});
		} catch (e) {
			return {};
		}
	})();

	const inspectionImages = (() => {
		if (!inspectionReport) return [];
		try {
			return typeof inspectionReport.images === 'string'
				? JSON.parse(inspectionReport.images)
				: (inspectionReport.images || []);
		} catch (e) {
			return [];
		}
	})();

	if (!request || (type === 'sample' && !targetPlan && !isSampleFailedInspection)) {
		return (
			<div className="min-h-screen bg-zinc-100 flex flex-col items-center justify-center p-6 text-center">
				<AlertTriangle className="w-12 h-12 text-rose-500 mb-2" />
				<h3 className="text-base font-black text-zinc-800">Test Plan or Request Data Not Found</h3>
				<p className="text-xs text-zinc-500 mt-1 max-w-sm">Please verify the selected plan or refresh your manager panel.</p>
				<button onClick={closeTab} className="mt-4 px-4 py-2 bg-zinc-800 text-white rounded-lg text-xs font-bold">Close Tab</button>
			</div>
		);
	}

	const testCategory = targetPlan ? testCategories.find(c => String(c.id) === String(targetPlan.testCategoryId)) : null;
	const testProtocol = targetPlan ? testProtocols.find(p => String(p.id) === String(targetPlan.testProtocolId)) : null;
	const equipmentUsed = targetPlan ? equipments.find(e => String(e.id) === String(targetPlan.equipmentId)) : null;

	// Dynamic equipment helper
	const getEquipmentDetails = (eq: any) => {
		if (!eq) {
			return {
				name: 'Not Assigned',
				make: '-',
				model: '-',
				calibration: '-'
			};
		}
		const nameLower = eq.name.toLowerCase();
		let make = 'Dixon Quality';
		let model = `DX-${eq.id || '01'}`;

		if (nameLower.includes('needle') || nameLower.includes('flame')) {
			make = 'LISHUN GROUP';
			model = 'ZY-3';
		} else if (nameLower.includes('glow') || nameLower.includes('wire')) {
			make = 'SANS';
			model = 'ZRS-2';
		} else if (nameLower.includes('chamber') || nameLower.includes('humidity')) {
			make = 'ESPEC';
			model = 'EPL-4H';
		} else if (nameLower.includes('tracking') || nameLower.includes('index')) {
			make = 'LISUN';
			model = 'TTC-1';
		}

		let calibration = 'Valid';
		if (eq.calibrationDueDate) {
			const dueDate = new Date(eq.calibrationDueDate);
			const now = new Date();
			const formatted = formatDate(eq.calibrationDueDate);
			if (dueDate >= now) {
				calibration = `Valid (Due: ${formatted})`;
			} else {
				calibration = `Expired (Due: ${formatted})`;
			}
		}

		return {
			name: eq.name,
			make,
			model,
			calibration
		};
	};

	// DQL constants & template variables
	const isAllInspectionFailed = (() => {
		if (!request) return false;
		if (type === 'sample' && sampleIndex !== null) {
			const inspectionReport = request.sampleInspections?.find((r: any) => Number(r.sampleIndex) === sampleIndex);
			if (inspectionReport && inspectionReport.status === 'FAILED') {
				return true;
			}
		}
		const qty = request.sampleQty || 1;
		let failedInspCount = 0;
		for (let i = 0; i < qty; i++) {
			const inspectionReport = request.sampleInspections?.find((r: any) => Number(r.sampleIndex) === i);
			if (inspectionReport && inspectionReport.status === 'FAILED') {
				failedInspCount++;
			}
		}
		return failedInspCount === qty;
	})();

	const testDescription = isAllInspectionFailed ? 'NA' : (testCategory?.name || 'NEEDLE FLAME TEST');
	const issueNo = '01';
	const issueDate = formatDate(request.updatedAt || request.createdAt);
	const revNo = '00';
	const revDate = '00';
	const docNo = 'PSL/QSP/07/TR-02';
	const testPurpose = isAllInspectionFailed ? 'NA' : 'NA';
	const testItemDescription = request.sampleDescription || 'Spin Lid Switch';
	const associateModel = request.modelNo || 'All Semi-Automatic Washing Machine';
	const testSpecification = isAllInspectionFailed 
		? `${request.testType?.name || ''} AS PER ${request.testMethodRef || ''}` 
		: `${testDescription} AS PER ${request.testMethodRef || ''}`;
	const sampleQuantity = String(request.sampleQty || 1).padStart(2, '0');
	const startOfTestDate = isAllInspectionFailed ? 'NA' : (targetPlan ? formatDate(targetPlan.startDate) : formatDate(request.createdAt));
	const endOfTestDate = isAllInspectionFailed ? 'NA' : (targetPlan ? formatDate(targetPlan.endDate) : formatDate(request.updatedAt || request.createdAt));

	// Signatures
	const testedBy = request?.engineerName || request?.assignedTo?.name || 'Quality Inspector';
	// Make approvedBy dynamic for the overall report by checking the evaluator of the last evaluated sample
	let managerWhoEvaluated = '';
	if (type === 'request' && samplesList.length > 0) {
		for (let i = samplesList.length - 1; i >= 0; i--) {
			if (samplesList[i].plan?.evaluatedBy) {
				managerWhoEvaluated = samplesList[i].plan.evaluatedBy;
				break;
			}
		}
	}
	// Determine if NABL
	const testTypeName = (request?.testType?.name || targetPlan?.testType?.name || '').toLowerCase();
	const isNabl = testTypeName.includes('nabl');
	const isReliability = testTypeName.includes('reliability');

	const nablManager = users.find(u => u.role === 'Lab Manager' && (u.department?.name || '').toLowerCase() === 'nabl');
	const normalManager = users.find(u => u.role === 'Lab Manager' && (u.department?.name || '').toLowerCase() !== 'nabl');
	const dbManager = isNabl 
		? (nablManager?.name || normalManager?.name || users.find(u => u.role === 'Head')?.name)
		: (normalManager?.name || nablManager?.name || users.find(u => u.role === 'Head')?.name);

	const userStr = localStorage.getItem('user');
	const currentUser = userStr ? JSON.parse(userStr) : null;
	const localManager = (currentUser?.role === 'Lab Manager' || currentUser?.role === 'Head') ? currentUser.name : null;
	const fallbackManager = dbManager || localManager || 'Lab Manager';
	const approvedBy = managerWhoEvaluated || targetPlan?.evaluatedBy || fallbackManager;
	const headUser = users.find(u => (u.role || '').toLowerCase() === 'head');
	const headUserName = headUser?.name || (currentUser?.role?.toLowerCase() === 'head' ? currentUser.name : null) || 'Head of Laboratory';
	const evaluationDate = (targetPlan && targetPlan.evaluatedAt) ? formatDate(targetPlan.evaluatedAt) : formatDate(request.updatedAt || request.createdAt);

	// Collect specimen images
	const specimenImages: string[] = [];
	if (type === 'sample' && sampleIndex !== null) {
		const insp = request.sampleInspections?.find((si: any) => Number(si.sampleIndex) === sampleIndex);
		if (insp?.images) {
			try {
				const paths = typeof insp.images === 'string' ? JSON.parse(insp.images) : insp.images;
				if (Array.isArray(paths)) specimenImages.push(...paths);
			} catch (e) {}
		}
	} else {
		request.sampleInspections?.forEach((si: any) => {
			if (si.images) {
				try {
					const paths = typeof si.images === 'string' ? JSON.parse(si.images) : si.images;
					if (Array.isArray(paths)) specimenImages.push(...paths);
				} catch (e) {}
			}
		});
	}

	// Render custom page components (Non-NABL)
	const renderHeader = (pageNo: number) => (
		<div className="w-full border-2 border-black text-black select-none">
			{/* Top Row: Logo & Lab Details */}
			<div className="grid grid-cols-12 border-b-2 border-black divide-x-2 divide-black">
				<div className="col-span-5 p-2 flex items-center justify-center">
					<div className="flex items-center gap-2">
						<img src="/logo.png" alt="Dixon Logo" className="h-9 object-contain shrink-0" />
						<div className="w-[1px] h-8 bg-zinc-400 mx-1"></div>
						<div className="flex items-center gap-1 shrink-0">
							<div className="w-6.5 h-6.5 rounded-full bg-[#e11d48] flex items-center justify-center text-white text-[9px] font-black italic">25+</div>
							<div className="text-[8px] text-[#e11d48] font-black italic leading-none whitespace-nowrap">Years</div>
						</div>
					</div>
				</div>
				<div className="col-span-7 p-2 text-center flex flex-col justify-center items-center">
					<h2 className="text-[13.5px] font-black tracking-tight uppercase text-zinc-900 leading-tight">
						PERFORMANCE & SAFETY LAB,
					</h2>
					<h2 className="text-[12.5px] font-black tracking-tight uppercase text-zinc-900 leading-tight">
						DIXON TECHNOLOGIES (INDIA) LIMITED
					</h2>
				</div>
			</div>
			{/* Bottom Row: Metadata info */}
			<div className="grid grid-cols-6 divide-x-2 divide-black text-[8px] font-bold text-center bg-white">
				<div className="py-1 px-1">ISSUE NO: {issueNo}</div>
				<div className="py-1 px-1">ISSUE DATE: 15-01-2024</div>
				<div className="py-1 px-1">REV NO: {revNo}</div>
				<div className="py-1 px-1">REV DATE: {revDate}</div>
				<div className="py-1 px-1">DOC NO: {docNo}</div>
				<div className="py-1 px-1">Page {pageNo} of 2</div>
			</div>
		</div>
	);

	const renderFooter = () => (
		<div className="grid grid-cols-2 gap-10 text-[10px] font-bold text-zinc-700 mt-6 pt-4 border-t border-zinc-200">
			<div>
				<p className="text-[8px] uppercase tracking-wider text-zinc-400">Tested by</p>
				<p className="text-zinc-900 font-black mt-1">({isReliability ? approvedBy : testedBy})</p>
			</div>
			<div className="text-right flex flex-col items-end">
				<p className="text-[8px] uppercase tracking-wider text-zinc-400">Review & Approved by</p>
				<p className="text-zinc-900 font-black mt-1">({approvedBy})</p>
			</div>
		</div>
	);

	// Render custom page components (NABL)
	const renderNablHeader = (pageNo: number) => (
		<div className="w-full border-2 border-black text-black select-none font-bold text-center">
			{/* Top Row: Logo, Lab Details, NABL Logo */}
			<div className="grid grid-cols-12 border-b-2 border-black divide-x-2 divide-black">
				<div className="col-span-3 p-2 flex items-center justify-center">
					<div className="flex items-center gap-1.5">
						<img src="/logo.png" alt="Dixon Logo" className="h-7 object-contain shrink-0" />
						<div className="w-[1px] h-6 bg-zinc-400 mx-0.5"></div>
						<div className="flex items-center gap-0.5 shrink-0">
							<div className="w-5 h-5 rounded-full bg-[#e11d48] flex items-center justify-center text-white text-[7px] font-black italic">25+</div>
							<div className="text-[6.5px] text-[#e11d48] font-black italic leading-none whitespace-nowrap">Years</div>
						</div>
					</div>
				</div>
				<div className="col-span-6 p-2 text-center flex flex-col justify-center items-center">
					<h2 className="text-[11px] font-black tracking-tight uppercase text-zinc-900 leading-tight">
						PERFORMANCE & SAFETY LAB,
					</h2>
					<h2 className="text-[10px] font-black tracking-tight uppercase text-zinc-900 leading-tight">
						DIXON TECHNOLOGIES (INDIA) LIMITED
					</h2>
				</div>
				<div className="col-span-3 p-1.5 flex items-center justify-center bg-white">
					<img src="/nabl-logo.png" alt="NABL Logo" className="h-16 object-contain" />
				</div>
			</div>
			{/* Bottom Row: Metadata info */}
			<div className="grid grid-cols-6 divide-x-2 divide-black text-[8px] font-bold text-center bg-white">
				<div className="py-1 px-1">ISSUE NO: {issueNo}</div>
				<div className="py-1 px-1">ISSUE DATE: {issueDate}</div>
				<div className="py-1 px-1">REV NO: {revNo}</div>
				<div className="py-1 px-1">REV DATE: {revDate}</div>
				<div className="py-1 px-1">DOC NO: PSL/QSP/07/TR-01</div>
				<div className="py-1 px-1">Page {pageNo} of 4</div>
			</div>
		</div>
	);

	const renderNablFooter = () => (
		<div className="grid grid-cols-3 gap-6 text-[10px] font-bold text-zinc-700 mt-6 pt-4 border-t border-zinc-200">
			<div>
				<p className="text-[8px] uppercase tracking-wider text-zinc-400 leading-none">Tested by</p>
				<p className="text-zinc-900 font-black mt-1">({testedBy})</p>
				<p className="text-[8px] text-zinc-500 font-medium leading-none mt-0.5">Quality Engineer</p>
			</div>
			<div className="text-center">
				<p className="text-[8px] uppercase tracking-wider text-zinc-400 leading-none">Reviewed by</p>
				<p className="text-zinc-900 font-black mt-1">({approvedBy})</p>
				<p className="text-[8px] text-zinc-500 font-medium leading-none mt-0.5">Lab Manager</p>
			</div>
			<div className="text-right flex flex-col items-end">
				<p className="text-[8px] uppercase tracking-wider text-zinc-400 leading-none">Authorized Signatory</p>
				<p className="text-zinc-900 font-black mt-1">({headUserName})</p>
				<p className="text-[8px] text-zinc-500 font-medium leading-none mt-0.5">Head of Laboratory</p>
			</div>
		</div>
	);

	const renderNablSubHeader = () => (
		<div className="flex justify-between items-center text-[10px] font-bold text-black my-2.5 px-0.5">
			<div>
				<span className="text-zinc-650 font-semibold">Test Report No.:</span> {`PSL/TR/${request.id}`}
			</div>
			<div>
				<span className="text-zinc-650 font-semibold">ULR No.:</span> {`TC14279${String(request.id).padStart(8, '0')}F`}
			</div>
		</div>
	);

	return (
		<>
			<style>{`
				body {
					background-color: #f1f5f9;
					margin: 0;
					padding: 0;
					font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
				}
				.a4-page {
					width: 210mm;
					height: 297mm;
					padding: 15mm;
					background: white;
					box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
					margin: 20px auto;
					box-sizing: border-box;
					display: flex;
					flex-direction: column;
					justify-content: space-between;
					position: relative;
					overflow: hidden;
				}
				.a4-page.nabl-page {
					padding: 10mm 12mm !important;
				}
				.watermark {
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%) rotate(-35deg);
					font-size: 80px;
					color: rgba(220, 220, 220, 0.15);
					font-weight: 900;
					pointer-events: none;
					z-index: 0;
					letter-spacing: 12px;
					user-select: none;
					text-transform: uppercase;
				}
				.content-container {
					position: relative;
					z-index: 10;
					flex: 1;
				}
				@media print {
					@page {
						size: A4;
						margin: 0;
					}
					body {
						background: white !important;
						margin: 0 !important;
						padding: 0 !important;
					}
					.no-print {
						display: none !important;
					}
					.a4-page {
						margin: 0 auto !important;
						border: none !important;
						box-shadow: none !important;
						width: 210mm !important;
						height: 297mm !important;
						page-break-after: always !important;
						padding: 15mm !important;
						box-sizing: border-box !important;
					}
					.a4-page.nabl-page {
						padding: 10mm 12mm !important;
					}
					.a4-page:last-child {
						page-break-after: avoid !important;
					}
				}
			`}</style>

			<div className="min-h-screen flex flex-col no-scrollbar">
				{/* Top Command Action bar */}
				<div className="bg-white border-b border-zinc-200/80 px-6 py-3 flex items-center justify-between no-print sticky top-0 z-50 shadow-sm">
					<div className="flex items-center gap-2 text-zinc-800">
						<FileText className="w-5 h-5 text-[#11236a]" />
						<div>
							<span className="text-xs font-black uppercase text-zinc-900">
								{isSampleFailedInspection ? 'Physical & Visual Inspection Report' : isNabl ? 'NABL Accredited Test Report' : 'Performance & Safety Lab Report'}
							</span>
							<p className="text-[10px] text-zinc-500 font-semibold">
								{isSampleFailedInspection 
									? `Inspection report for sample ${key}`
									: type === 'sample' 
										? `Sample ID Allotment report for ${key}` 
										: `Overall Request Report for ${request.requestId || `REQ-${request.id}`}`}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<button
							onClick={triggerPrint}
							className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#11236a] hover:bg-[#0c1a52] px-4 py-2 rounded-xl transition-all cursor-pointer border-none outline-none active:scale-[0.98]"
						>
							<Printer className="w-3.5 h-3.5" />
							<span>Download / Print PDF</span>
						</button>
						<button
							onClick={closeTab}
							className="flex items-center gap-1.5 text-xs font-bold text-zinc-650 hover:bg-zinc-100 border border-zinc-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer outline-none active:scale-[0.98]"
						>
							<X className="w-3.5 h-3.5" />
							<span>Close Preview</span>
						</button>
					</div>
				</div>

				{isSampleFailedInspection ? (
					<div className="a4-page" style={{ height: 'auto', minHeight: '297mm', padding: '15mm' }}>
						<div className="watermark">FAILED</div>
						<div className="content-container flex flex-col justify-between h-full space-y-6">
							<div>
								{/* Header */}
								<div className="w-full border-2 border-black text-black select-none mb-4">
									<div className="grid grid-cols-12 border-b-2 border-black divide-x-2 divide-black">
										<div className="col-span-4 p-2 flex items-center justify-center">
											<img src="/logo.png" alt="Dixon Logo" className="h-8 object-contain shrink-0" />
										</div>
										<div className="col-span-8 p-2 text-center flex flex-col justify-center items-center font-sans">
											<h2 className="text-[12px] font-black tracking-tight uppercase text-zinc-900 leading-tight">
												PHYSICAL & VISUAL INSPECTION REPORT
											</h2>
											<h2 className="text-[10px] font-bold tracking-tight uppercase text-zinc-650 leading-tight">
												DIXON PERFORMANCE AND SAFETY LABORATORY
											</h2>
										</div>
									</div>
									<div className="grid grid-cols-5 divide-x-2 divide-black text-[7.5px] font-bold text-center bg-white">
										<div className="py-1 px-1">DOC NO: PSL/QSP/07/IR-01</div>
										<div className="py-1 px-1">ISSUE DATE: 15-01-2024</div>
										<div className="py-1 px-1">REV NO: 00</div>
										<div className="py-1 px-1">REV DATE: 00</div>
										<div className="py-1 px-1">Page 1 of 1</div>
									</div>
								</div>

								{/* General Details Table */}
								<div className="space-y-4 font-sans">
									<div>
										<h4 className="text-[10px] font-extrabold text-[#11236a] uppercase tracking-wider mb-1">1. General Request & Sample Information</h4>
										<table className="w-full border-2 border-black text-[10px] font-bold border-collapse text-black">
											<tbody>
												<tr className="border-b-2 border-black divide-x-2 divide-black">
													<td className="p-2 w-1/2">
														<span className="text-zinc-550 mr-2 uppercase">Request ID:</span> {request.requestId || `REQ-${request.id}`}
													</td>
													<td className="p-2 w-1/2">
														<span className="text-zinc-550 mr-2 uppercase">Allotted Sample ID:</span> {inspectionReport?.allottedId || 'N/A'}
													</td>
												</tr>
												<tr className="border-b-2 border-black divide-x-2 divide-black">
													<td className="p-2">
														<span className="text-zinc-550 mr-2 uppercase">Customer Name & Address:</span> {request.customerNameAddress}
													</td>
													<td className="p-2">
														<span className="text-zinc-550 mr-2 uppercase">Manufacturer Name:</span> {request.manufacturerNameAddress || 'N/A'}
													</td>
												</tr>
												<tr className="border-b-2 border-black divide-x-2 divide-black">
													<td className="p-2">
														<span className="text-zinc-550 mr-2 uppercase">Brand & Model No:</span> {request.brandName} - {request.modelNo}
													</td>
													<td className="p-2">
														<span className="text-zinc-550 mr-2 uppercase">Date of Inspection:</span> {inspectionReport?.updatedAt ? formatDate(inspectionReport.updatedAt) : formatDate(request.updatedAt || request.createdAt)}
													</td>
												</tr>
												<tr className="divide-x-2 divide-black">
													<td className="p-2">
														<span className="text-zinc-550 mr-2 uppercase">Sample Description:</span> {request.sampleDescription}
													</td>
													<td className="p-2">
														<span className="text-zinc-550 mr-2 uppercase">Overall Inspection Status:</span>
														<span className="text-rose-700 font-extrabold uppercase ml-1">FAILED</span>
													</td>
												</tr>
											</tbody>
										</table>
									</div>

									{/* Checklist Parameters Table */}
									<div>
										<h4 className="text-[10px] font-extrabold text-[#11236a] uppercase tracking-wider mb-1">2. Visual & Physical Checklist Parameters</h4>
										<table className="w-full border-2 border-black text-[9.5px] font-bold border-collapse text-black">
											<thead>
												<tr className="bg-zinc-100 border-b-2 border-black divide-x-2 divide-black text-center text-[10px] font-black uppercase">
													<th className="p-1.5 w-12">Sr No.</th>
													<th className="p-1.5 text-left">Checklist Parameter Description</th>
													<th className="p-1.5 w-32">Status / Result</th>
												</tr>
											</thead>
											<tbody className="divide-y divide-black">
												{INSPECTION_CHECKPOINTS.map((cp) => {
													const val = inspectionChecks[cp.id];
													return (
														<tr key={cp.id} className="divide-x divide-black">
															<td className="p-1.5 text-center">{cp.id}</td>
															<td className="p-1.5">{cp.text}</td>
															<td className={`p-1.5 text-center font-extrabold uppercase ${
																val === 'Yes' ? 'text-emerald-700' :
																val === 'No' ? 'text-rose-700' : 'text-zinc-500'
															}`}>
																{val || 'N/A'}
															</td>
														</tr>
													);
												})}
											</tbody>
										</table>
									</div>

									{/* Failure Remarks & Observations */}
									<div>
										<h4 className="text-[10px] font-extrabold text-[#11236a] uppercase tracking-wider mb-1">3. Remarks & Non-Compliance Observations</h4>
										<div className="border-2 border-black p-3 text-[10px] text-black font-semibold min-h-[60px] whitespace-pre-wrap leading-relaxed">
											{inspectionReport?.remarks || 'No remarks provided.'}
										</div>
									</div>

									{/* Photos Section */}
									{inspectionImages.length > 0 && (
										<div>
											<h4 className="text-[10px] font-extrabold text-[#11236a] uppercase tracking-wider mb-1">4. Inspection Photos Reference</h4>
											<div className="grid grid-cols-3 gap-4 border-2 border-black p-3 bg-zinc-50">
												{inspectionImages.map((img: string, idx: number) => {
													const cleanPath = img.replace(/\\/g, '/');
													const relativePath = cleanPath.includes('uploads')
														? cleanPath.substring(cleanPath.indexOf('uploads'))
														: cleanPath;
													return (
														<div key={idx} className="border border-zinc-300 rounded bg-white p-1 flex items-center justify-center aspect-[4/3] overflow-hidden">
															<img
																src={`http://127.0.0.1:3001/${relativePath}`}
																alt={`Inspection photo ${idx + 1}`}
																className="max-w-full max-h-full object-contain"
															/>
														</div>
													);
												})}
											</div>
										</div>
									)}
								</div>
							</div>

							{/* Footer Signatures */}
							<div className="grid grid-cols-2 gap-10 text-[10px] font-bold text-zinc-700 mt-6 pt-4 border-t border-zinc-200 font-sans">
								<div>
									<p className="text-[8px] uppercase tracking-wider text-zinc-400">Inspected by (Quality Inspector)</p>
									<p className="text-zinc-900 font-black mt-1">({testedBy})</p>
								</div>
								<div className="text-right flex flex-col items-end">
									<p className="text-[8px] uppercase tracking-wider text-zinc-400">Reviewed & Approved by (Lab Manager)</p>
									<p className="text-zinc-900 font-black mt-1">({approvedBy})</p>
								</div>
							</div>
						</div>
					</div>
				) : isNabl ? (
					<>
						{/* -------------------- NABL PAGE 1 -------------------- */}
						<div className="a4-page nabl-page">
							<div className="watermark">CONFIDENTIAL</div>
							<div className="content-container flex flex-col justify-between h-full">
								<div>
									{renderNablHeader(1)}
									{renderNablSubHeader()}
									
									<h3 className="text-center font-black text-[13px] underline tracking-widest my-3 text-black">TEST REPORT</h3>
									
									<div className="space-y-4">
										<div>
											<h4 className="text-[10px] font-extrabold text-[#11236a] uppercase tracking-wider mb-1">1. General Information</h4>
											<table className="w-full border-2 border-black text-[10.5px] font-bold border-collapse text-black">
												<tbody>
													<tr className="border-b-2 border-black divide-x-2 divide-black">
														<td className="p-1.5 w-1/2">
															<span className="text-zinc-550 mr-2">DISCIPLINE:</span> ELECTRICAL
														</td>
														<td className="p-1.5 w-1/2">
															<span className="text-zinc-550 mr-2">GROUP:</span> DOMESTIC APPLIANCES
														</td>
													</tr>
													<tr className="border-b-2 border-black divide-x-2 divide-black">
														<td className="p-1.5">
															<span className="text-zinc-550 mr-2">Receipt No:</span> {request.requestId || `REQ-${request.id}`}
														</td>
														<td className="p-1.5">
															<span className="text-zinc-550 mr-2">Date of Receipt:</span> {formatDate(request.createdAt)}
														</td>
													</tr>
													<tr className="border-b-2 border-black divide-x-2 divide-black">
														<td className="p-1.5">
															<span className="text-zinc-550 mr-2">Start of test date:</span> {startOfTestDate}
														</td>
														<td className="p-1.5">
															<span className="text-zinc-550 mr-2">End of Test Date:</span> {endOfTestDate}
														</td>
													</tr>
													<tr className="border-b-2 border-black divide-x-2 divide-black">
														<td className="p-1.5">
															<span className="text-zinc-550 mr-2">Test Report No:</span> PSL/TR/{request.id}
														</td>
														<td className="p-1.5">
															<span className="text-zinc-550 mr-2">Date of issue:</span> {endOfTestDate}
														</td>
													</tr>
													<tr className="divide-x-2 divide-black">
														<td colSpan={2} className="p-1.5 leading-normal">
															<span className="text-zinc-550 block text-[9.5px]">Testing Laboratory Name & Address:</span>
															<span className="text-black font-black uppercase text-[10px]">
																PERFORMANCE AND SAFETY LAB, DIXON TECHNOLOGIES (INDIA) LIMITED
																<br />
																PLOT NO.: C-2/1, SELAQUI INDUSTRIAL AREA, DEHRADUN, UTTARAKHAND, INDIA, 248197
															</span>
														</td>
													</tr>
												</tbody>
											</table>
										</div>

										<div>
											<h4 className="text-[10px] font-extrabold text-[#11236a] uppercase tracking-wider mb-1">2. Details of the tested sample declared by the customer / applicant</h4>
											<table className="w-full border-2 border-black text-[10.5px] font-bold border-collapse text-black">
												<tbody className="divide-y-2 divide-black">
													{[
														{ label: 'Name & Address of Customer/Applicant:', value: request.customerNameAddress },
														{ label: 'Name & Address of manufacturer:', value: request.manufacturerNameAddress },
														{ label: 'Product Description (EUT):', value: request.sampleDescription },
														{ label: 'Product Ratings:', value: request.productRating },
														{ label: 'Model / Identification No.:', value: request.modelNo },
														{ label: 'Product Serial Number (if any):', value: request.serialNumber || 'N/A' },
														{ label: 'Trademark / Brand:', value: request.brandName },
														{ label: 'Sample Quantity:', value: sampleQuantity },
														{ label: 'Condition of the sample:', value: request.status === 'INSPECTION_FAILED' ? 'FAILED VISUAL INSPECTION' : 'GOOD / BRAND NEW' },
														{ label: 'Reference test specification(s):', value: testSpecification },
														{ label: 'Laboratory environmental conditions:', value: 'Temp: 25 ± 5 °C, Humidity: 50 ± 10 % RH' }
													].map(({ label, value }) => (
														<tr key={label} className="divide-x-2 divide-black">
															<td className="p-1.5 w-5/12 text-zinc-550 font-bold">{label}</td>
															<td className="p-1.5 w-7/12 text-black font-black uppercase">{value}</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>

										<div className="text-[9px] text-zinc-750 bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 leading-relaxed font-semibold">
											<span className="font-extrabold text-black block mb-0.5 text-[9.5px]">General Remarks:</span>
											<ul className="list-none p-0 m-0 space-y-0.5">
												<li>a) This test report relates to the test sample submitted and the documents provided by customer / applicant.</li>
												<li>b) This report shall not be reproduced, except in full, without the written approval of the issuing testing laboratory.</li>
												<li>c) This report will not be valid for judicial purpose.</li>
												<li>d) The results reported in this report are valid at the time of and under the stipulated conditions of measurement.</li>
												<li>e) The Management System is maintained in accordance with IS/ISO/IEC 17025:2017 and testing Standards / Instruments are traceable to National / International Standards.</li>
											</ul>
										</div>
									</div>
								</div>
								{renderNablFooter()}
							</div>
						</div>

						{/* -------------------- NABL PAGE 2 -------------------- */}
						<div className="a4-page nabl-page">
							<div className="watermark">CONFIDENTIAL</div>
							<div className="content-container flex flex-col justify-between h-full">
								<div>
									{renderNablHeader(2)}
									{renderNablSubHeader()}
									
									<h3 className="text-center font-black text-[13px] underline tracking-widest my-3 text-black">TEST REPORT (TEST RESULTS)</h3>

									<div className="my-3">
										<table className="w-full border-2 border-black text-left border-collapse text-black text-[9.5px]">
											<thead>
												<tr className="bg-zinc-100 border-b-2 border-black divide-x-2 divide-black text-[10px] font-black uppercase text-center">
													<th className="p-1.5 w-12">Sr. No.</th>
													<th className="p-1.5 w-48">Test name and Clauses</th>
													<th className="p-1.5 w-32">Test Method</th>
													<th className="p-1.5">Requirement of Specification</th>
													<th className="p-1.5 w-36">Results</th>
												</tr>
											</thead>
											<tbody className="divide-y-2 divide-black font-bold">
												{isAllInspectionFailed ? (
													type === 'sample' ? (
														<tr className="divide-x-2 divide-black">
															<td className="p-1.5 text-center">1</td>
															<td className="p-1.5 uppercase">Visual & Physical Inspection</td>
															<td className="p-1.5 uppercase">Inspection Spec</td>
															<td className="p-1.5">No physical damage or abnormality</td>
															<td className="p-1.5 uppercase text-rose-700 font-extrabold">
																{request.sampleInspections?.find((si: any) => Number(si.sampleIndex) === sampleIndex)?.remarks || request.remarks || 'Failed inspection.'}
															</td>
														</tr>
													) : (
														samplesList.map((sample, idx) => (
															<tr key={idx} className="divide-x-2 divide-black">
																<td className="p-1.5 text-center">{idx + 1}</td>
																<td className="p-1.5 uppercase">Sample #{idx + 1} Inspection</td>
																<td className="p-1.5 uppercase">Inspection Spec</td>
																<td className="p-1.5">No physical damage or abnormality</td>
																<td className="p-1.5 uppercase text-rose-700 font-extrabold">
																	{sample.inspectionReport?.remarks || request.remarks || 'Failed inspection.'}
																</td>
															</tr>
														))
													)
												) : type === 'sample' ? (
													<tr className="divide-x-2 divide-black">
														<td className="p-1.5 text-center">1</td>
														<td className="p-1.5 uppercase">{testDescription}</td>
														<td className="p-1.5 uppercase">{request.testMethodRef || 'IEC 60695-11-5'}</td>
														<td className="p-1.5 font-medium leading-normal">
															{testProtocol?.judgementCriteria || 
																'The test specimen is considered to have satisfactorily withstood the test.'}
														</td>
														<td className="p-1.5 uppercase">
															{targetPlan.evaluationStatus === 'PASSED' ? (
																<span className="text-emerald-700 font-extrabold">Complies. Meets specifications.</span>
															) : (
																<span className="text-rose-700 font-extrabold">
																	Non-compliance: {targetPlan.evaluationRemarks || 'Failed test specs.'}
																</span>
															)}
														</td>
													</tr>
												) : (
													samplesList.map((sample, idx) => (
														<tr key={idx} className="divide-x-2 divide-black">
															<td className="p-1.5 text-center">{idx + 1}</td>
															<td className="p-1.5 uppercase">Sample #{idx + 1}: {testDescription}</td>
															<td className="p-1.5 uppercase">{request.testMethodRef || 'IEC 60695-11-5'}</td>
															<td className="p-1.5 font-medium leading-normal text-[9px]">
																{testProtocol?.judgementCriteria || 
																	'The test specimen is considered to have satisfactorily withstood the test.'}
															</td>
															<td className="p-1.5 uppercase text-[9px]">
																{sample.finalOutcome === 'PASSED' ? (
																	<span className="text-emerald-700 font-extrabold">Complies. Passed</span>
																) : sample.finalOutcome === 'FAILED' ? (
																	<span className="text-rose-700 font-extrabold">Non-compliance: {sample.remarks}</span>
																) : (
																	<span className="text-zinc-500 italic">Under Testing</span>
																)}
															</td>
														</tr>
													))
												)}
											</tbody>
										</table>
									</div>

									<div className="text-xs font-black text-black my-4">
										{isAllInspectionFailed ? (
											<span>Conclusion: Tested samples <span className="underline uppercase text-rose-700">does not meet</span> the inspection specification requirement.</span>
										) : (
											<>
												Conclusion: Tested samples{' '}
												<span className="underline uppercase text-emerald-800 font-black">
													{isOverallPartial ? 'partially meets' : (isOverallPassed ? 'meets' : 'does not meet')}
												</span>{' '}
												the test specification requirement.
											</>
										)}
									</div>

									<div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/50">
										<h4 className="text-center font-black text-[10px] underline mb-3 text-black uppercase">Test Specimen Picture:</h4>
										<div className="grid grid-cols-2 gap-4 justify-center">
											{specimenImages.length > 0 ? (
												specimenImages.slice(0, 2).map((img, index) => (
													<div key={index} className="border border-zinc-300 rounded-lg overflow-hidden bg-white aspect-[4/3] flex items-center justify-center">
														<img src={img} alt={`Specimen ${index + 1}`} className="max-w-full max-h-full object-contain" />
													</div>
												))
											) : (
												<>
													<div className="border border-zinc-300 rounded-lg p-6 bg-white aspect-[4/3] flex flex-col items-center justify-center text-zinc-400">
														<span className="text-[9px] font-bold uppercase">Specimen Front View</span>
													</div>
													<div className="border border-zinc-300 rounded-lg p-6 bg-white aspect-[4/3] flex flex-col items-center justify-center text-zinc-400">
														<span className="text-[9px] font-bold uppercase">Specimen Rear View</span>
													</div>
												</>
											)}
										</div>
									</div>
								</div>
								{renderNablFooter()}
							</div>
						</div>

						{/* -------------------- NABL PAGE 3 -------------------- */}
						<div className="a4-page nabl-page">
							<div className="watermark">CONFIDENTIAL</div>
							<div className="content-container flex flex-col justify-between h-full">
								<div>
									{renderNablHeader(3)}
									{renderNablSubHeader()}
									
									<h3 className="text-center font-black text-[13px] underline tracking-widest my-2 text-black">ANNEXURE A</h3>

									<div className="space-y-4">
										<div>
											<h4 className="text-[10px] font-extrabold text-[#11236a] uppercase tracking-wider mb-1">1. General Information</h4>
											<table className="w-full border-2 border-black text-[9.5px] font-bold border-collapse text-black">
												<tbody className="divide-y-2 divide-black">
													<tr className="divide-x-2 divide-black">
														<td className="p-1.5 w-1/3 text-zinc-550">Accredited Laboratory Name</td>
														<td className="p-1.5 w-2/3 text-black font-black uppercase">PERFORMANCE AND SAFETY LAB, DIXON TECHNOLOGIES (INDIA) LIMITED</td>
													</tr>
													<tr className="divide-x-2 divide-black">
														<td className="p-1.5 text-zinc-550">Address</td>
														<td className="p-1.5 text-black font-black uppercase">C-2/1, SELAQUI INDUSTRIAL AREA DEHRADUN, UTTARAKHAND - 248197</td>
													</tr>
													<tr className="divide-x-2 divide-black">
														<td className="p-1.5 text-zinc-550">Accreditation Validity</td>
														<td className="p-1.5 text-black font-black uppercase">Valid till 31/12/2026 under Certificate TC-14279</td>
													</tr>
													<tr className="divide-x-2 divide-black">
														<td className="p-1.5 text-zinc-550">Date of Receipt of Sample</td>
														<td className="p-1.5 text-black font-black uppercase">{formatDate(request.createdAt)}</td>
													</tr>
													<tr className="divide-x-2 divide-black">
														<td className="p-1.5 text-zinc-550">Accredited Test Standard followed</td>
														<td className="p-1.5 text-black font-black uppercase">{request.testMethodRef}</td>
													</tr>
													<tr className="divide-x-2 divide-black">
														<td className="p-1.5 text-zinc-550">Test Report No. & Date of issue</td>
														<td className="p-1.5 text-black font-black uppercase">PSL/TR/{request.id} & {endOfTestDate}</td>
													</tr>
													<tr className="divide-x-2 divide-black">
														<td className="p-1.5 text-zinc-550">Tested By & Reviewed By</td>
														<td className="p-1.5 text-black font-black uppercase">{testedBy} (QE) & {approvedBy} (LM)</td>
													</tr>
												</tbody>
											</table>
										</div>

										<div>
											<h4 className="text-[10px] font-extrabold text-[#11236a] uppercase tracking-wider mb-1">2. Details of the Sample Tested</h4>
											<table className="w-full border-2 border-black text-[9.5px] font-bold border-collapse text-black">
												<tbody className="divide-y-2 divide-black">
													<tr className="divide-x-2 divide-black">
														<td className="p-1.5 w-1/4 text-zinc-550 font-bold">Brand Name</td>
														<td className="p-1.5 w-1/4 text-black font-black uppercase">{request.brandName}</td>
														<td className="p-1.5 w-1/4 text-zinc-550 font-bold">Model No.</td>
														<td className="p-1.5 w-1/4 text-black font-black uppercase">{request.modelNo}</td>
													</tr>
													<tr className="divide-x-2 divide-black">
														<td className="p-1.5 text-zinc-550 font-bold">Model Name / Description</td>
														<td className="p-1.5 text-black font-black uppercase">{request.sampleDescription}</td>
														<td className="p-1.5 text-zinc-550 font-bold">Year of Manufacture</td>
														<td className="p-1.5 text-black font-black uppercase">{new Date(request.createdAt).getFullYear()}</td>
													</tr>
													<tr className="divide-x-2 divide-black">
														<td className="p-1.5 text-zinc-550 font-bold">Product Rating</td>
														<td className="p-1.5 text-black font-black uppercase">{request.productRating}</td>
														<td className="p-1.5 text-zinc-550 font-bold">Serial No.</td>
														<td className="p-1.5 text-black font-black uppercase">{request.serialNumber || 'N/A'}</td>
													</tr>
													<tr className="divide-x-2 divide-black">
														<td className="p-1.5 text-zinc-550 font-bold">EUT Type / Class</td>
														<td className="p-1.5 text-black font-black uppercase">Class I / Domestic Appliance</td>
														<td className="p-1.5 text-zinc-550 font-bold">In-built Heater Present?</td>
														<td className="p-1.5 text-black font-black uppercase">No</td>
													</tr>
													<tr className="divide-x-2 divide-black">
														<td className="p-1.5 text-zinc-550 font-bold">Sample Rated Capacity</td>
														<td className="p-1.5 text-black font-black uppercase">{request.productRating.toLowerCase().includes('kg') ? request.productRating : '7.0 kg'}</td>
														<td className="p-1.5 text-zinc-550 font-bold">Wash / Rinse Program</td>
														<td className="p-1.5 text-black font-black uppercase">Normal / Standard Eco</td>
													</tr>
													<tr className="divide-x-2 divide-black">
														<td className="p-1.5 text-zinc-550 font-bold">Rinse Performance</td>
														<td className="p-1.5 text-black font-black uppercase">Complied (Rinse Index: 1.02)</td>
														<td className="p-1.5 text-zinc-550 font-bold">Wash Performance (%)</td>
														<td className="p-1.5 text-black font-black uppercase">Complies {"(>= 80%)"}</td>
													</tr>
													<tr className="divide-x-2 divide-black">
														<td className="p-1.5 text-zinc-550 font-bold">Remaining Moisture Content (RMC)</td>
														<td className="p-1.5 text-black font-black uppercase">Complies (68.5%)</td>
														<td className="p-1.5 text-zinc-550 font-bold">Water Consumption</td>
														<td className="p-1.5 text-black font-black uppercase">18.5 L/kg/cycle</td>
													</tr>
													<tr className="divide-x-2 divide-black">
														<td className="p-1.5 text-zinc-550 font-bold">Energy Consumption</td>
														<td className="p-1.5 text-black font-black uppercase">0.0090 kWh/kg/cycle</td>
														<td className="p-1.5 text-zinc-550 font-bold">Star Rating / Label</td>
														<td className="p-1.5 text-black font-black uppercase">5 Star (Accredited Bureau of Energy Efficiency)</td>
													</tr>
												</tbody>
											</table>
										</div>
									</div>
								</div>
								{renderNablFooter()}
							</div>
						</div>

						{/* -------------------- NABL PAGE 4 -------------------- */}
						<div className="a4-page nabl-page">
							<div className="watermark">CONFIDENTIAL</div>
							<div className="content-container flex flex-col justify-between h-full">
								<div>
									{renderNablHeader(4)}
									{renderNablSubHeader()}
									
									<div className="space-y-4 my-2">
										<div>
											<h4 className="text-[10px] font-extrabold text-[#11236a] uppercase tracking-wider mb-1">3. Measuring Equipment / Instruments Details</h4>
											<table className="w-full border-2 border-black text-left border-collapse text-black text-[9.5px]">
												<thead>
													<tr className="bg-zinc-100 border-b-2 border-black divide-x-2 divide-black font-black uppercase text-center text-[9px]">
														<th className="p-1 w-10">S. N.</th>
														<th className="p-1">Instrument / Equipment Name</th>
														<th className="p-1 w-28">Make</th>
														<th className="p-1 w-20">Accuracy Class</th>
														<th className="p-1 w-44">Range and least count</th>
														<th className="p-1 w-32">Cal. Valid Date</th>
													</tr>
												</thead>
												<tbody className="divide-y-2 divide-black font-bold text-center">
													{/* Row 1: The assigned test equipment from the test plan */}
													<tr className="divide-x-2 divide-black bg-[#f0fdf4]">
														<td className="p-1">1</td>
														<td className="p-1 text-left uppercase font-extrabold text-[#166534]">
															{equipmentUsed ? equipmentUsed.name : 'Test Station Equipment'} (EUT Tester)
														</td>
														<td className="p-1 uppercase text-[#166534]">{equipmentUsed ? getEquipmentDetails(equipmentUsed).make : 'DIXON QUALITY'}</td>
														<td className="p-1 text-[#166534]">Class A / ±0.5%</td>
														<td className="p-1 text-[#166534]">0 to 1000h, LC: 0.1s</td>
														<td className="p-1 uppercase text-[#166534] font-extrabold">
															{equipmentUsed && equipmentUsed.calibrationDueDate ? formatDate(equipmentUsed.calibrationDueDate) : 'Valid'}
														</td>
													</tr>
													{/* Calibration standards from image */}
													{[
														{ sn: 2, name: 'Power Meter', make: 'Chroma', accuracy: '±1%', range: '0 to 600V, 0 to 20A, LC: 0.0001Wh', cal: '30/11/2026' },
														{ sn: 3, name: 'Wascator (Ref. Washing Machine)', make: 'Electrolux Professional', accuracy: 'NA', range: '7.0kg rated capacity', cal: '15/10/2026' },
														{ sn: 4, name: 'Spectrophotometer', make: 'Konica Minolta', accuracy: 'NA', range: '0 to 200%, Specular Component Included', cal: '22/08/2026' },
														{ sn: 5, name: 'Flow Meter', make: 'SFIC', accuracy: '±2%', range: '0 to 10m3/hr, LC: 0.01LPM', cal: '05/12/2026' },
														{ sn: 6, name: 'RTD Temp. Indicator', make: 'Recos', accuracy: '±0.1°C', range: '-30°C to 200°C; L/C: 0.1°C', cal: '18/09/2026' },
														{ sn: 7, name: 'Weighing Balance', make: 'AND', accuracy: '±0.001g', range: '1 to 320g; L/C: 0.001g', cal: '14/11/2026' },
														{ sn: 8, name: 'Weighing Balance', make: 'AND', accuracy: '±0.15g', range: '0 to 10.2kg; L/C: 0.01g', cal: '12/11/2026' },
														{ sn: 9, name: 'Digital Stop Watch', make: 'Racer', accuracy: '±1%', range: '0 to 24hrs; L/C: 0.01Sec', cal: '09/01/2027' },
														{ sn: 10, name: 'Pressure Gauge', make: 'Guru India', accuracy: '±5%', range: '0-7kg/cm2, L/C = 0.1kg/cm2', cal: '04/04/2027' },
														{ sn: 11, name: 'pH meter', make: 'Mettler Toledo', accuracy: '±0.002', range: '-2 to 20; L/C: 0.001/0.01/0.1', cal: '20/10/2026' }
													].map((item) => (
														<tr key={item.sn} className="divide-x-2 divide-black">
															<td className="p-1">{item.sn}</td>
															<td className="p-1 text-left uppercase">{item.name}</td>
															<td className="p-1 uppercase">{item.make}</td>
															<td className="p-1">{item.accuracy}</td>
															<td className="p-1 text-left">{item.range}</td>
															<td className="p-1 uppercase text-emerald-700 font-extrabold">{item.cal}</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>

										<div className="border border-zinc-200 rounded-xl p-3 bg-zinc-50/50">
											<div className="grid grid-cols-2 gap-4">
												<div className="flex flex-col items-center">
													<div className="border border-zinc-300 rounded-lg overflow-hidden bg-white w-full aspect-[4/3] flex items-center justify-center">
														{specimenImages[2] ? (
															<img src={specimenImages[2]} alt="Test Setup" className="max-w-full max-h-full object-contain" />
														) : (
															<div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-400 text-[9px] font-bold">SETUP PREVIEW</div>
														)}
													</div>
													<span className="text-[9px] font-black underline mt-1.5 text-black">Test Setup</span>
												</div>

												<div className="flex flex-col items-center">
													<div className="border border-zinc-300 rounded-lg overflow-hidden bg-white w-full aspect-[4/3] flex items-center justify-center">
														{specimenImages[3] ? (
															<img src={specimenImages[3]} alt="Equipment Overview" className="max-w-full max-h-full object-contain" />
														) : (
															<div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-400 text-[9px] font-bold">EQUIPMENT PREVIEW</div>
														)}
													</div>
													<span className="text-[9px] font-black underline mt-1.5 text-black">Overview of test equipment's</span>
												</div>
											</div>
										</div>

										<div className="text-center font-black tracking-widest text-[10px] text-zinc-800 uppercase my-2 select-none">
											***** END OF THE TEST REPORT *****
										</div>
									</div>
								</div>
								{renderNablFooter()}
							</div>
						</div>
					</>
				) : (
					<>
						{/* -------------------- PAGE 1 -------------------- */}
						<div className="a4-page">
							<div className="watermark">CONFIDENTIAL</div>
							<div className="content-container flex flex-col justify-between h-full">
								<div>
									{renderHeader(1)}
									<h3 className="text-center font-bold text-[14px] underline tracking-widest my-5 text-black">TEST REPORT</h3>
									
									<table className="w-full border-2 border-black text-[11.5px] font-bold border-collapse text-black">
										<tbody>
											<tr className="border-b-2 border-black">
												<td className="p-2.5">
													<div className="flex justify-between">
														<div><span className="inline-block w-48 text-zinc-650">Test Description:</span> <span className="uppercase text-black">{testDescription}</span></div>
														<div className="pr-4"><span className="text-zinc-650">ISSUE DATE:</span> <span className="text-black">{evaluationDate}</span></div>
													</div>
												</td>
											</tr>
											<tr className="border-b-2 border-black">
												<td className="p-2.5">
													<span className="inline-block w-48 text-zinc-650">Test Purpose / Identification:</span> <span className="text-black">{testPurpose}</span>
												</td>
											</tr>
											<tr className="border-b-2 border-black">
												<td className="p-2.5">
													<span className="inline-block w-48 text-zinc-650">Test Item Description:</span> <span className="text-black">{testItemDescription}</span>
												</td>
											</tr>
											<tr className="border-b-2 border-black">
												<td className="p-2.5">
													<span className="inline-block w-48 text-zinc-650">Associate Model:</span> <span className="text-black">{associateModel}</span>
												</td>
											</tr>
											<tr className="border-b-2 border-black">
												<td className="p-2.5 leading-normal">
													<span className="inline-block w-48 text-zinc-650 align-top">Testing laboratory and its address:</span>
													<span className="text-black inline-block w-[calc(100%-12.5rem)] align-top font-semibold uppercase">
														PERFORMANCE AND SAFETY LAB, DIXON TECHNOLOGIES (INDIA) LIMITED
														<br />
														C-2/1, SELAQUI INDUSTRIAL AREA DEHRADUN, UTTARAKHAND - 248197
													</span>
												</td>
											</tr>
											<tr className="border-b-2 border-black">
												<td className="p-2.5">
													<span className="inline-block w-48 text-zinc-650">Test specification:</span> <span className="uppercase text-black">{testSpecification}</span>
												</td>
											</tr>
											<tr className="border-b-2 border-black">
												<td className="p-2.5">
													<span className="inline-block w-48 text-zinc-650">Sample Quantity:</span> <span className="text-black">01</span>
												</td>
											</tr>
											<tr className="border-b-2 border-black">
												<td className="p-2.5">
													<div className="flex">
														<div className="w-1/2"><span className="inline-block w-48 text-zinc-650">Start of test date:</span> <span className="text-black">{startOfTestDate}</span></div>
														<div className="w-1/2"><span className="inline-block w-32 text-zinc-650">End of Test Date:</span> <span className="text-black">{endOfTestDate}</span></div>
													</div>
												</td>
											</tr>
											<tr className="border-b-2 border-black">
												<td className="p-2.5">
													<span className="inline-block w-48 text-zinc-650">Test Result:</span> 
													<span className="text-black font-semibold">
														{isAllInspectionFailed ? (
															<span className="font-extrabold uppercase text-[#dc2626]">
																The test item Failed as per the inspection specification(s).
															</span>
														) : (
															<>
																The test item{' '}
																{isOverallPartial ? (
																	<>
																		<span className="font-extrabold uppercase text-[#059669]">Passed</span>
																		{' / '}
																		<span className="font-extrabold uppercase text-[#dc2626]">Failed</span>
																		<span className="text-amber-600 font-extrabold ml-1.5 uppercase tracking-wide text-[10px]">(Partial)</span>
																	</>
																) : (
																	<>
																		<span className="font-extrabold uppercase" style={{ textDecoration: isOverallPassed ? 'none' : 'line-through', color: isOverallPassed ? '#059669' : '#000' }}>Passed</span>
																		{' / '}
																		<span className="font-extrabold uppercase" style={{ textDecoration: !isOverallPassed ? 'none' : 'line-through', color: !isOverallPassed ? '#dc2626' : '#000' }}>Failed</span>
																	</>
																)}
																{' as per the test specification(s).'}
															</>
														)}
													</span>
												</td>
											</tr>
											<tr className="border-b-2 border-black">
												<td className="p-2.5">
													<span className="inline-block w-48 text-zinc-650">Abbreviations:</span> <span className="text-black font-semibold">P(Pass) = Passed, F(Fail) = Failed, N/A = Not applicable</span>
												</td>
											</tr>
											<tr className="border-b-2 border-black">
												<td className="p-2.5">
													<span className="inline-block w-48 text-zinc-650 font-bold">Laboratory Environmental conditions:</span> <span className="text-black font-semibold">{isAllInspectionFailed ? 'NA' : 'NA'}</span>
												</td>
											</tr>
											<tr>
												<td className="p-2.5 text-center text-[10.5px] font-semibold text-zinc-555 italic">
													This test report relates to the test sample submitted
												</td>
											</tr>
										</tbody>
									</table>
								</div>
								{renderFooter()}
							</div>
						</div>

						{/* -------------------- PAGE 2 -------------------- */}
				<div className="a4-page">
					<div className="watermark">CONFIDENTIAL</div>
					<div className="content-container flex flex-col justify-between h-full">
						<div>
							{renderHeader(2)}
							<div className="my-5">
								<table className="w-full border-2 border-black text-left border-collapse text-black text-[10px]">
									<thead>
										<tr className="bg-zinc-100 border-b-2 border-black divide-x-2 divide-black text-[10.5px] font-black uppercase text-center">
											<th className="p-2 w-10">S. No.</th>
											<th className="p-2 w-28">Tests Name</th>
											<th className="p-2 w-28">Test Method</th>
											<th className="p-2">Specified Requirement</th>
											<th className="p-2 w-40">Observation / Results</th>
											<th className="p-2 w-32">Equipment</th>
										</tr>
									</thead>
									<tbody className="divide-y-2 divide-black font-semibold">
										{isAllInspectionFailed ? (
											<tr className="divide-x-2 divide-black">
												<td className="p-2 text-center">1</td>
												<td className="p-2 uppercase">Inspection</td>
												<td className="p-2 uppercase">Inspection Specification</td>
												<td className="p-2">NA</td>
												<td className="p-2 uppercase text-rose-700 font-bold">
													{type === 'sample'
														? (request.sampleInspections?.find((si: any) => Number(si.sampleIndex) === sampleIndex)?.remarks || request.remarks || 'Failed inspection.')
														: (samplesList[0]?.inspectionReport?.remarks || request.remarks || 'Failed inspection.')}
												</td>
												<td className="p-2 uppercase text-zinc-600">N/A</td>
											</tr>
										) : type === 'sample' ? (
											<tr className="divide-x-2 divide-black">
												<td className="p-2 text-center">1</td>
												<td className="p-2 uppercase">{testDescription}</td>
												<td className="p-2 uppercase">{request.testMethodRef || 'IEC 60695-11-5'}</td>
												<td className="p-2 font-medium leading-relaxed">
													{testProtocol?.judgementCriteria ||
														'The test specimen is considered to have satisfactorily withstood the test if there is no flame and no glowing of the test specimen.'}
												</td>
												<td className="p-2 uppercase">
													{isReliability ? (
														targetPlan.evaluationStatus === 'PASSED' ? (
															<span className="text-emerald-700 font-bold">{targetPlan.evaluationRemarks || 'N/A'}</span>
														) : (
															<span className="text-rose-700 font-bold">{targetPlan.evaluationRemarks || 'N/A'}</span>
														)
													) : (() => {
														const sampleInsp = request.sampleInspections?.find((si: any) => Number(si.sampleIndex) === sampleIndex);
														const engObs = sampleInsp?.testReport?.remarks || sampleInsp?.remarks || 'N/A';
														return targetPlan.evaluationStatus === 'PASSED' ? (
															<span className="text-emerald-700 font-bold">{engObs}</span>
														) : (
															<span className="text-rose-700 font-bold">{engObs}</span>
														);
													})()}
												</td>
												<td className="p-2 uppercase font-bold text-zinc-800">
													{equipmentUsed ? equipmentUsed.name : 'Not Assigned'}
												</td>
											</tr>
										) : (
											samplesList.map((sample, idx) => {
												const samplePlanKey = `${request.id}-sample-${idx}`;
												const planObj = plans[samplePlanKey];
												const eq = planObj?.equipmentId
													? equipments.find((e: any) => String(e.id) === String(planObj.equipmentId))
													: null;
												const sampleInsp = request.sampleInspections?.find((si: any) => Number(si.sampleIndex) === idx);
												return (
													<tr key={idx} className="divide-x-2 divide-black">
														<td className="p-2 text-center">{idx + 1}</td>
														<td className="p-2 uppercase">{testDescription}</td>
														<td className="p-2 uppercase">{request.testMethodRef || 'IEC 60695-11-5'}</td>
														<td className="p-2 font-medium leading-relaxed text-[9px]">
															{testProtocol?.judgementCriteria ||
																'The test specimen is considered to have satisfactorily withstood the test.'}
														</td>
														<td className="p-2 uppercase text-[9px]">
															{isReliability ? (
																sample.finalOutcome === 'PASSED' ? (
																	<span className="text-emerald-700 font-bold">{planObj?.evaluationRemarks || 'N/A'}</span>
																) : sample.finalOutcome === 'FAILED' ? (
																	<span className="text-rose-700 font-bold">{planObj?.evaluationRemarks || 'N/A'}</span>
																) : (
																	<span className="text-zinc-500 italic">Under Testing</span>
																)
															) : (() => {
																const engObs = sampleInsp?.testReport?.remarks || sampleInsp?.remarks || 'N/A';
																return sample.finalOutcome === 'PASSED' ? (
																	<span className="text-emerald-700 font-bold">{engObs}</span>
																) : sample.finalOutcome === 'FAILED' ? (
																	<span className="text-rose-700 font-bold">{engObs}</span>
																) : (
																	<span className="text-zinc-500 italic">Under Testing</span>
																);
															})()}
														</td>
														<td className="p-2 uppercase font-bold text-zinc-800 text-[9px]">
															{eq ? eq.name : 'Not Assigned'}
														</td>
													</tr>
												);
											})
										)}
									</tbody>
								</table>
							</div>

							<div className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50/50">
								<div className="grid grid-cols-2 gap-4 justify-center">
									{specimenImages.length > 0 ? (
										specimenImages.slice(0, 2).map((img, index) => (
											<div key={index} className="border border-zinc-300 rounded-xl overflow-hidden bg-white aspect-[4/3] flex items-center justify-center">
												<img src={img} alt={`Specimen ${index + 1}`} className="max-w-full max-h-full object-contain" />
											</div>
										))
									) : (
										<>
											<div className="border-2 border-dashed border-zinc-300 rounded-xl p-6 bg-white aspect-[4/3] flex flex-col items-center justify-center text-zinc-400">
												<span className="text-[10px] font-bold uppercase">Specimen Front View</span>
											</div>
											<div className="border-2 border-dashed border-zinc-300 rounded-xl p-6 bg-white aspect-[4/3] flex flex-col items-center justify-center text-zinc-400">
												<span className="text-[10px] font-bold uppercase">Specimen Rear View</span>
											</div>
										</>
									)}
								</div>
							</div>

							<div className="text-center font-black tracking-widest text-[11px] text-zinc-800 uppercase mt-6 select-none">
								***** END OF THE TEST REPORT *****
							</div>
						</div>
						{renderFooter()}
					</div>
				</div>
			</>
		)}
			</div>
		</>
	);
}

