import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clipboard, CheckCircle, XCircle } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { getTestRequests, updateTestRequestStatus, saveSampleInspection } from '../../services/operations/testRequestService';
import { getTestTypes } from '../../services/operations/testTypeService';
import { getTestCategories } from '../../services/operations/testCategoryService';
import { getTestProtocols } from '../../services/operations/testProtocolService';
import { getChecksheetEntries } from '../../services/operations/reliabilityChecksheetService';
import { releasePlatforms } from '../../services/operations/platformAvailabilityService';
import { getTestingEquipments, releaseEquipment } from '../../services/operations/testingEquipmentService';
import toast from 'react-hot-toast';

interface ColumnDef {
	id: string;
	label: string;
}

const SATL_COLUMNS: ColumnDef[] = [
	{ id: 'loadCondition', label: 'Load Condition' },
	{ id: 'washCycles', label: 'NO. OF CYCLE-wash' },
	{ id: 'spinCycles', label: 'NO. OF CYCLE-Spin' },
	{ id: 'washMotor', label: 'Wash Motor' },
	{ id: 'spinMotor', label: 'Spin Motor' },
	{ id: 'gearBox', label: 'Gear Box' },
	{ id: 'sealBellow', label: 'Seal Bellow' },
	{ id: 'washTimer', label: 'Wash Timer' },
	{ id: 'spinTimer', label: 'Spin Timer' },
	{ id: 'drainSelector', label: 'Drain Selector' },
	{ id: 'capacitor', label: 'Capacitor' },
	{ id: 'safetySwitch', label: 'Safety Switch' },
	{ id: 'totalCyclesWash', label: 'Total cycles Wash' },
	{ id: 'totalCyclesSpin', label: 'Total cycles Spin' },
	{ id: 'remarks', label: 'Remarks' },
];

const FATL_COLUMNS: ColumnDef[] = [
	{ id: 'loadCondition', label: 'Load Condition' },
	{ id: 'noOfCycle', label: 'NO. OF CYCLE' },
	{ id: 'motor', label: 'Motor' },
	{ id: 'clutch', label: 'Clutch' },
	{ id: 'waterInletValve', label: 'Water Inlet Valve' },
	{ id: 'pressureSensor', label: 'Pressure sensor' },
	{ id: 'pcb', label: 'PCB' },
	{ id: 'suspensionRod', label: 'Suspension Rod' },
	{ id: 'drainMotor', label: 'Drain Motor' },
	{ id: 'lidSwitch', label: 'Lid Switch' },
	{ id: 'inverterBoard', label: 'Inverter Board' },
	{ id: 'totalCycles', label: 'Total cycles' },
	{ id: 'remarks', label: 'Remarks' },
];

export default function ManagerEvaluateChecksheet() {
	const navigate = useNavigate();
	const { planKey } = useParams<{ planKey: string }>();

	// Metadata stores
	const [requests, setRequests] = useState<any[]>([]);
	const [testTypes, setTestTypes] = useState<any[]>([]);
	const [testCategories, setTestCategories] = useState<any[]>([]);
	const [testProtocols, setTestProtocols] = useState<any[]>([]);
	const [equipments, setEquipments] = useState<any[]>([]);
	const [plans, setPlans] = useState<{ [key: string]: any }>({});
	const [cellData, setCellData] = useState<{ [key: string]: string }>({});
	const [loading, setLoading] = useState(true);

	// Evaluation states
	const [evaluationRemarks, setEvaluationRemarks] = useState('');

	useEffect(() => {
		let isMounted = true;
		const loadData = async () => {
			if (!planKey) return;
			try {
				const reqs = await getTestRequests()();
				const types = await getTestTypes()();
				const categories = await getTestCategories()();
				const protocols = await getTestProtocols()();
				const eqps = await getTestingEquipments({ limit: 100 })();

				const parsedPlans: { [key: string]: any } = {};
				if (reqs) {
					for (const r of reqs) {
						if (r.testPlans) {
							for (const p of r.testPlans) {
								let platformNosParsed = [];
								if (p.platformNos) {
									try {
										platformNosParsed = typeof p.platformNos === 'string' ? JSON.parse(p.platformNos) : p.platformNos;
									} catch (e) {
										platformNosParsed = [];
									}
								}
								parsedPlans[`${r.id}-sample-${p.sampleIndex}`] = {
									...p,
									platformNos: platformNosParsed
								};
							}
						}
					}
				}

				// Fetch entries from backend database
				const dbEntries = await getChecksheetEntries(planKey)();

				if (isMounted) {
					setRequests(reqs || []);
					setTestTypes(types || []);
					setTestCategories(categories || []);
					setTestProtocols(protocols || []);
					setEquipments(eqps || []);
					setPlans(parsedPlans);

					// Map database entries to cellData state
					const mappedData: { [key: string]: string } = {};
					dbEntries.forEach((entry: any) => {
						if (entry.date && entry.data && typeof entry.data === 'object') {
							Object.entries(entry.data).forEach(([colId, val]) => {
								mappedData[`${entry.date}_${colId}`] = String(val);
							});
						}
					});
					setCellData(mappedData);
				}
			} catch (err) {
				console.error('Failed to load checksheet data for evaluation:', err);
			} finally {
				if (isMounted) setLoading(false);
			}
		};
		loadData();
		return () => {
			isMounted = false;
		};
	}, [planKey]);

	// Resolve details
	const planInfo = (() => {
		if (!planKey || !plans[planKey]) return null;
		const plan = plans[planKey];
		const [reqIdStr] = planKey.split('-sample-');
		const request = requests.find(r => String(r.id) === String(reqIdStr));
		const testType = testTypes.find(t => String(t.id) === String(plan.testTypeId));
		const testCategory = testCategories.find(c => String(c.id) === String(plan.testCategoryId));
		const protocol = testProtocols.find(p => String(p.id) === String(plan.testProtocolId));

		return {
			plan,
			request,
			testType,
			testCategory,
			protocol
		};
	})();

	const isReliability = planInfo?.testType?.name?.toLowerCase().includes('reliability') ?? true;

	const reportData = (() => {
		if (isReliability) return null;
		
		const [reqIdStr, sampleIdxStr] = (planKey || '').split('-sample-');
		const sampleIdx = parseInt(sampleIdxStr, 10);
		const request = requests.find(r => String(r.id) === String(reqIdStr));
		const dbReport = request?.sampleInspections?.find((r: any) => Number(r.sampleIndex) === sampleIdx);

		if (!dbReport) return null;

		let dbImages: string[] = [];
		try {
			dbImages = dbReport?.images ? (typeof dbReport.images === 'string' ? JSON.parse(dbReport.images) : dbReport.images) : [];
		} catch (e) {
			dbImages = [];
		}

		// Derive equipment details live from plan.equipmentId -> equipments list
		const planObj = planInfo?.plan;
		const assignedEq = planObj?.equipmentId ? equipments.find((e: any) => String(e.id) === String(planObj.equipmentId)) : null;

		const getEqField = (field: string, fallback: string) => {
			if (assignedEq) {
				if (field === 'name') return assignedEq.name || fallback;
				if (field === 'make') {
					const n = (assignedEq.name || '').toLowerCase();
					if (n.includes('needle') || n.includes('flame')) return 'LISHUN GROUP';
					if (n.includes('glow') || n.includes('wire')) return 'SANS';
					if (n.includes('chamber') || n.includes('humidity')) return 'ESPEC';
					if (n.includes('tracking') || n.includes('index')) return 'LISUN';
					return 'Dixon Quality';
				}
				if (field === 'model') {
					const n = (assignedEq.name || '').toLowerCase();
					if (n.includes('needle') || n.includes('flame')) return 'ZY-3';
					if (n.includes('glow') || n.includes('wire')) return 'ZRS-2';
					if (n.includes('chamber') || n.includes('humidity')) return 'EPL-4H';
					if (n.includes('tracking') || n.includes('index')) return 'TTC-1';
					return `DX-${assignedEq.id || '01'}`;
				}
				if (field === 'calibration') {
					if (!assignedEq.calibrationDueDate) return 'Valid';
					const d = new Date(assignedEq.calibrationDueDate);
					const fmt = d.toLocaleDateString();
					return d >= new Date() ? `Valid (Due: ${fmt})` : `Expired (Due: ${fmt})`;
				}
			}
			return fallback;
		};

		// Specified requirements always comes from the test protocol's judgement criteria
		const protocolJudgement = planInfo?.protocol?.judgementCriteria || 'N/A';

		const checksObj = (() => {
			if (!dbReport) return {};
			try {
				return typeof dbReport.checks === 'string' ? JSON.parse(dbReport.checks) : (dbReport.checks || {});
			} catch (e) {
				return {};
			}
		})();
		const isReportSubmitted = checksObj.specifiedRequirement !== undefined;

		return {
			specifiedRequirement: protocolJudgement,
			observationResults: isReportSubmitted ? (dbReport?.remarks || 'N/A') : 'Pending Submission',
			imagePaths: isReportSubmitted ? (dbImages || []) : [],
			beforeImages: isReportSubmitted ? (checksObj.beforeImages || []) : [],
			afterImages: isReportSubmitted ? (checksObj.afterImages || []) : [],
			eqName: getEqField('name', 'N/A'),
			eqMake: getEqField('make', 'N/A'),
			eqModel: getEqField('model', 'N/A'),
			eqCalibration: getEqField('calibration', 'N/A')
		};
	})();

	// Determine column layout strictly from productType
	const productType = (planInfo?.plan?.productType || planInfo?.protocol?.productType || 'SATL').toUpperCase();
	const columns = productType === 'FATL' ? FATL_COLUMNS : SATL_COLUMNS;

	// Date generator helper
	const getDatesArray = (startStr: string, endStr: string) => {
		if (!startStr || !endStr) return [];
		const dates: string[] = [];
		const start = new Date(startStr);
		const end = new Date(endStr);
		if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
		
		let curr = new Date(start);
		let safety = 0;
		while (curr <= end && safety < 100) {
			dates.push(curr.toISOString().split('T')[0]);
			curr.setDate(curr.getDate() + 1);
			safety++;
		}
		return dates;
	};

	const datesList = planInfo 
		? getDatesArray(planInfo.plan.startDate, planInfo.plan.endDate)
		: [];

	// Pre-calculate cumulative totals for FATL and SATL
	const calculatedTotals = useMemo(() => {
		const totals: {
			[dateStr: string]: {
				totalCycles?: number;
				totalCyclesWash?: number;
				totalCyclesSpin?: number;
			}
		} = {};

		let runningTotalCycles = 0;
		let runningTotalWash = 0;
		let runningTotalSpin = 0;

		datesList.forEach((dateStr) => {
			const noOfCycleVal = Number(cellData[`${dateStr}_noOfCycle`] || 0);
			const washCyclesVal = Number(cellData[`${dateStr}_washCycles`] || 0);
			const spinCyclesVal = Number(cellData[`${dateStr}_spinCycles`] || 0);

			if (!isNaN(noOfCycleVal)) {
				runningTotalCycles += noOfCycleVal;
			}
			if (!isNaN(washCyclesVal)) {
				runningTotalWash += washCyclesVal;
			}
			if (!isNaN(spinCyclesVal)) {
				runningTotalSpin += spinCyclesVal;
			}

			totals[dateStr] = {
				totalCycles: runningTotalCycles,
				totalCyclesWash: runningTotalWash,
				totalCyclesSpin: runningTotalSpin
			};
		});

		return totals;
	}, [datesList, cellData]);

	const handleEvaluate = async (status: 'PASSED' | 'FAILED') => {
		if (!planKey || !planInfo) return;
		if (!evaluationRemarks.trim()) {
			toast.error('Please enter evaluation remarks.');
			return;
		}

		try {
			const userStr = localStorage.getItem('user');
			const currentUser = userStr ? JSON.parse(userStr) : null;
			const managerName = currentUser ? currentUser.name : 'Lab Manager';

			const [requestId, sampleIdxStr] = planKey.split('-sample-');
			const sampleIdx = parseInt(sampleIdxStr, 10);

			// 1. Save TestPlan evaluation status to database
			const planUpdateData = {
				sampleIndex: sampleIdx,
				testTypeId: Number(planInfo.plan.testTypeId),
				testCategoryId: Number(planInfo.plan.testCategoryId),
				testProtocolId: Number(planInfo.plan.testProtocolId),
				stationNo: planInfo.plan.stationNo ? Number(planInfo.plan.stationNo) : null,
				platformNos: planInfo.plan.platformNos,
				equipmentId: planInfo.plan.equipmentId ? Number(planInfo.plan.equipmentId) : null,
				numberOfDays: planInfo.plan.numberOfDays ? Number(planInfo.plan.numberOfDays) : null,
				startDate: planInfo.plan.startDate,
				endDate: planInfo.plan.endDate,
				remarks: planInfo.plan.remarks,
				evaluationStatus: status,
				evaluationRemarks: evaluationRemarks,
				evaluatedAt: new Date().toISOString(),
				evaluatedBy: managerName
			};

			const planRes = await fetch(`/api/v1/test-requests/${requestId}/test-plans`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem('token')}`
				},
				body: JSON.stringify(planUpdateData)
			});

			if (!planRes.ok) {
				throw new Error('Failed to save test plan evaluation to database');
			}

			// 2. Save evaluation status and remarks to the backend database
			const existingInspection = planInfo.request?.sampleInspections?.find((r: any) => Number(r.sampleIndex) === sampleIdx);
			const existingChecks = (() => {
				if (!existingInspection) return {};
				try {
					return typeof existingInspection.checks === 'string'
						? JSON.parse(existingInspection.checks)
						: (existingInspection.checks || {});
				} catch (e) {
					return {};
				}
			})();
			
			const formData = new FormData();
			formData.append('sampleIndex', String(sampleIdx));
			formData.append('allottedId', planInfo.plan.allottedId || `REQ-${requestId}-S${String(sampleIdx + 1).padStart(2, '0')}`);
			
			// For reliability, we don't have engineer reports, so keep evaluationRemarks as comments
			// For performance/NABL, we must preserve the engineer's submitted remarks/observations
			const finalRemarks = isReliability ? evaluationRemarks : (existingInspection?.remarks || 'N/A');
			formData.append('remarks', finalRemarks);
			
			// Keep the status as PASSED/FAILED based on physical inspection status, but set it back to PASSED if it was UNDER_REVIEW
			const currentInspectionStatus = existingInspection?.status || 'PASSED';
			const finalInspectionStatus = currentInspectionStatus === 'UNDER_REVIEW' ? 'PASSED' : currentInspectionStatus;
			formData.append('status', finalInspectionStatus);
			formData.append('checks', JSON.stringify(existingChecks));

			const saveDbOp = saveSampleInspection(requestId, formData);
			await saveDbOp();

			// Release reserved platform channels and equipment
			if (planInfo.plan.stationNo && planInfo.plan.platformNos && planInfo.plan.platformNos.length > 0) {
				try {
					const releasePlatOp = releasePlatforms(
						Number(planInfo.plan.stationNo),
						planInfo.plan.platformNos.map(Number)
					);
					await releasePlatOp();
				} catch (platErr) {
					console.error('Failed to release platforms on evaluation:', platErr);
				}
			}

			if (planInfo.plan.equipmentId) {
				try {
					const releaseEqOp = releaseEquipment(Number(planInfo.plan.equipmentId));
					await releaseEqOp();
				} catch (eqErr) {
					console.error('Failed to release equipment on evaluation:', eqErr);
				}
			}

			// 3. Fetch latest request status with all inspections and plans from DB to check completeness
			const freshReqRes = await fetch(`/api/v1/test-requests/${requestId}`, {
				headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
			});
				if (!freshReqRes.ok) {
				throw new Error('Failed to fetch latest request details from database');
			}
			const freshRequest = (await freshReqRes.json()).data;

			if (freshRequest) {
				const qty = freshRequest.sampleQty || 1;
				let allSamplesComplete = true;

				for (let i = 0; i < qty; i++) {
					const plan = (freshRequest.testPlans || []).find((p: any) => Number(p.sampleIndex) === i);
					const dbReport = (freshRequest.sampleInspections || []).find((r: any) => Number(r.sampleIndex) === i);

					if (plan) {
						if (plan.evaluationStatus === 'PASSED' || plan.evaluationStatus === 'FAILED') {
							continue;
						}
					} else if (dbReport) {
						if (dbReport.status === 'FAILED') {
							continue;
						}
					}
					// If we reach here, this sample is not finished yet
					allSamplesComplete = false;
					break;
				}

				if (allSamplesComplete) {
					let passedCount = 0;
					let failedCount = 0;

					for (let i = 0; i < qty; i++) {
						const plan = (freshRequest.testPlans || []).find((p: any) => Number(p.sampleIndex) === i);
						const dbReport = (freshRequest.sampleInspections || []).find((r: any) => Number(r.sampleIndex) === i);

						if (plan) {
							if (plan.evaluationStatus === 'PASSED') {
								passedCount++;
							} else if (plan.evaluationStatus === 'FAILED') {
								failedCount++;
							}
						} else if (dbReport) {
							if (dbReport.status === 'FAILED') {
								failedCount++;
							}
						}
					}

					let finalStatus = 'TESTING_COMPLETED';
					if (passedCount === qty) {
						finalStatus = 'TESTING_PASSED';
					} else if (failedCount === qty) {
						finalStatus = 'TESTING_FAILED';
					} else if (passedCount > 0 && failedCount > 0) {
						finalStatus = 'TESTING_PARTIAL';
					}

					// All samples completed/evaluated, update request status to terminal state
					const statusUpdateOp = updateTestRequestStatus(
						Number(requestId),
						finalStatus,
						undefined
					);
					await statusUpdateOp();
				}
			}

			toast.success(`Sample test evaluated as ${status}!`);
			navigate(`/manager/test-plans/${requestId}`);
		} catch (error) {
			console.error('Failed to save sample evaluation status:', error);
			toast.error('Failed to save evaluation.');
		}
	};

	if (loading) {
		return (
			<DashboardLayout title="Evaluating Checksheet" description="Loading chronological checksheet logs...">
				<div className="flex flex-col items-center justify-center py-20 space-y-4">
					<div className="w-12 h-12 border-4 border-indigo-700 border-t-transparent rounded-full animate-spin"></div>
					<p className="text-zinc-555 text-xs font-semibold">Retrieving daily logs from SQL Server...</p>
				</div>
			</DashboardLayout>
		);
	}

	if (!planInfo) {
		return (
			<DashboardLayout title="Test Plan Not Found" description="The requested test plan checksheet could not be located.">
				<div className="bg-white border border-zinc-200 rounded-3xl p-8 text-center max-w-md mx-auto my-12">
					<Clipboard className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
					<h3 className="text-lg font-bold text-zinc-800">Invalid Test Plan</h3>
					<p className="text-xs text-zinc-500 mt-2">Please return to the test plan manager and verify the plan selection.</p>
					<button
						onClick={() => navigate('/manager/test-plans')}
						className="mt-6 px-4 py-2 bg-indigo-750 text-white rounded-xl text-xs font-bold hover:bg-indigo-900 transition-colors"
					>
						Back to Test Plans
					</button>
				</div>
			</DashboardLayout>
		);
	}

	const [reqIdStr] = planKey!.split('-sample-');

	return (
		<DashboardLayout
			title={isReliability ? "Evaluate Chronological Checksheet" : "Evaluate Test Report"}
			description={isReliability ? "Review chronological checksheet parameters filled out by inspector before evaluating sample result." : "Review submitted test report, observations, and specimen photos before evaluating sample result."}
		>
			<div className="space-y-6">
				{/* Top Bar Back button */}
				<div className="flex justify-between items-center">
					<button 
						onClick={() => navigate(`/manager/test-plans/${reqIdStr}`)}
						className="flex items-center gap-2 text-xs font-bold text-zinc-650 hover:text-zinc-900 bg-white border border-zinc-200 px-3.5 py-2 rounded-xl shadow-sm transition-colors cursor-pointer border-none outline-none"
					>
						<ArrowLeft className="w-4 h-4" />
						<span>Back to Test Specification</span>
					</button>
					<span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
						{isReliability ? "Evaluation Mode: Read-Only Grid" : "Evaluation Mode: Report Review"}
					</span>
				</div>

				{/* Metadata details block */}
				<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-5 text-xs font-bold text-zinc-800">
					<div>
						<span className="text-zinc-400 font-extrabold uppercase text-[8px] tracking-wider block">Model / Capacity</span>
						<span className="text-zinc-850 mt-1 block font-black">{planInfo.request?.modelNo || 'N/A'}</span>
					</div>
					<div>
						<span className="text-zinc-400 font-extrabold uppercase text-[8px] tracking-wider block">Category / Type</span>
						<span className="text-zinc-850 mt-1 block font-black">{planInfo.testCategory?.name || 'N/A'}</span>
					</div>
					<div>
						<span className="text-zinc-400 font-extrabold uppercase text-[8px] tracking-wider block">Platform Unit</span>
						<span className="text-blue-700 mt-1 block font-extrabold">S{planInfo.plan.stationNo} (P: {planInfo.plan.platformNos.join(', ') || 'N/A'})</span>
					</div>
					<div>
						<span className="text-zinc-400 font-extrabold uppercase text-[8px] tracking-wider block">Scheduled Dates</span>
						<span className="text-zinc-850 mt-1 block font-bold">{planInfo.plan.startDate} to {planInfo.plan.endDate}</span>
					</div>
				</div>

				{/* Read only checksheet table or Report display */}
				{isReliability ? (
					<div className="bg-white border border-zinc-200 rounded-[28px] p-6 shadow-sm overflow-hidden flex flex-col gap-4">
						<h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500">
							{productType === 'FATL' 
								? 'Fully automatic Washing Machine life test Check-sheet' 
								: 'Semi-automatic Washing Machine Life Test Check Sheet'}
						</h3>
						<div className="overflow-x-auto border border-zinc-900 rounded-lg">
							<table className="min-w-full border-collapse text-left">
								<thead>
									<tr className="bg-zinc-100 border-b border-zinc-900 text-zinc-800 text-[10px] font-bold uppercase tracking-wider">
										<th className="border-r border-zinc-900 p-2.5 text-center min-w-[100px]">Date</th>
										{columns.map(col => (
											<th key={col.id} className="border-r border-zinc-900 p-2.5 text-center text-[9px] min-w-[90px]">
												{col.label}
											</th>
										))}
									</tr>
								</thead>
								<tbody className="divide-y divide-zinc-900 text-xs text-zinc-800 font-semibold">
									{datesList.map((dateStr) => {
										const [y, m, d] = dateStr.split('-');
										const formattedDate = `${d}-${m}-${y}`;

										return (
											<tr key={dateStr} className="hover:bg-slate-50/50">
												<td className="border-r border-zinc-900 p-2.5 text-center font-extrabold bg-zinc-50/60 select-none">
													{formattedDate}
												</td>
												{columns.map((col) => {
													let val = cellData[`${dateStr}_${col.id}`] || '';
													const isCalculated = (productType === 'FATL' && col.id === 'totalCycles') || 
																		 (productType === 'SATL' && (col.id === 'totalCyclesWash' || col.id === 'totalCyclesSpin'));
													if (isCalculated) {
														if (productType === 'FATL' && col.id === 'totalCycles') {
															val = calculatedTotals[dateStr]?.totalCycles !== undefined ? String(calculatedTotals[dateStr].totalCycles) : '';
														} else if (productType === 'SATL') {
															if (col.id === 'totalCyclesWash') {
																val = calculatedTotals[dateStr]?.totalCyclesWash !== undefined ? String(calculatedTotals[dateStr].totalCyclesWash) : '';
															} else if (col.id === 'totalCyclesSpin') {
																val = calculatedTotals[dateStr]?.totalCyclesSpin !== undefined ? String(calculatedTotals[dateStr].totalCyclesSpin) : '';
															}
														}
													}
													return (
														<td key={col.id} className={`border-r border-zinc-900 p-2 text-center font-bold ${isCalculated ? 'text-zinc-500 bg-zinc-50/50 font-black' : ''}`}>
															{val || <span className="text-zinc-300 italic">-</span>}
														</td>
													);
												})}
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>
				) : (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Left: Test Details & Equipment */}
						<div className="space-y-6">
							<div className="bg-white border border-zinc-200 rounded-[28px] p-6 shadow-sm space-y-4">
								<h3 className="text-xs font-extrabold uppercase tracking-wider text-[#11236a] border-b border-zinc-100 pb-2">
									Test Report Information
								</h3>
								<div className="space-y-4 text-xs font-bold text-zinc-700">
									<div>
										<span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Test Name</span>
										<span className="text-zinc-800 font-black mt-1 block">{planInfo.testCategory?.name || 'N/A'}</span>
									</div>
									<div>
										<span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Test Method Reference</span>
										<span className="text-zinc-800 mt-1 block">{planInfo.request?.testMethodRef || 'N/A'}</span>
									</div>
									<div>
										<span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Specified Requirements</span>
										<p className="text-zinc-855 mt-1.5 p-3.5 bg-zinc-50 rounded-xl whitespace-pre-wrap font-semibold border border-zinc-100 leading-relaxed">
											{reportData?.specifiedRequirement || 'N/A'}
										</p>
									</div>
									<div>
										<span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Observation / Results</span>
										<p className={`mt-1.5 p-3.5 rounded-xl whitespace-pre-wrap border leading-relaxed ${
											reportData?.observationResults === 'Pending Submission'
												? 'text-zinc-400 bg-zinc-50 italic font-semibold border-zinc-100'
												: 'text-zinc-900 bg-[#f8fafc] font-extrabold border-zinc-150'
										}`}>
											{reportData?.observationResults || 'N/A'}
										</p>
									</div>
								</div>
							</div>

							<div className="bg-white border border-zinc-200 rounded-[28px] p-6 shadow-sm space-y-4">
								<h3 className="text-xs font-extrabold uppercase tracking-wider text-[#11236a] border-b border-zinc-100 pb-2">
									Equipment Calibration Details
								</h3>
								<div className="grid grid-cols-2 gap-4 text-xs font-bold text-zinc-700">
									<div>
										<span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Equipment Name</span>
										<span className="text-zinc-800 mt-1 block font-black">{reportData?.eqName || 'N/A'}</span>
									</div>
									<div>
										<span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Calibration Status</span>
										<span className="text-indigo-700 mt-1 block font-extrabold">{reportData?.eqCalibration || 'N/A'}</span>
									</div>
								</div>
							</div>
						</div>

						{/* Right: Test Pictures */}
						<div className="bg-white border border-zinc-200 rounded-[28px] p-6 shadow-sm space-y-6 flex flex-col max-h-[700px] overflow-y-auto">
							<h3 className="text-xs font-extrabold uppercase tracking-wider text-[#11236a] border-b border-zinc-100 pb-2">
								Test Pictures
							</h3>
							
							{((reportData?.beforeImages && reportData.beforeImages.length > 0) || 
							  (reportData?.afterImages && reportData.afterImages.length > 0) || 
							  (reportData?.imagePaths && reportData.imagePaths.length > 0)) ? (
								<div className="space-y-6">
									{/* Before Test Pictures */}
									{reportData?.beforeImages && reportData.beforeImages.length > 0 && (
										<div className="space-y-2.5">
											<span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider block">Before Test Pictures ({reportData.beforeImages.length})</span>
											<div className="grid grid-cols-2 gap-3">
												{reportData.beforeImages.map((path: string, i: number) => (
													<div key={i} className="group relative border border-zinc-200 rounded-xl overflow-hidden aspect-video bg-zinc-50 shadow-sm hover:shadow transition-all duration-300">
														<img 
															src={path} 
															alt={`Before Test ${i + 1}`} 
															className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
														/>
														<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
															<a 
																href={path} 
																target="_blank" 
																rel="noopener noreferrer" 
																className="px-3 py-1.5 bg-white text-zinc-800 text-[10px] font-extrabold rounded-lg shadow hover:bg-zinc-100 transition-colors"
															>
																View Full Image
															</a>
														</div>
													</div>
												))}
											</div>
										</div>
									)}

									{/* After Test Pictures */}
									{reportData?.afterImages && reportData.afterImages.length > 0 && (
										<div className="space-y-2.5">
											<span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider block">After Test Pictures ({reportData.afterImages.length})</span>
											<div className="grid grid-cols-2 gap-3">
												{reportData.afterImages.map((path: string, i: number) => (
													<div key={i} className="group relative border border-zinc-200 rounded-xl overflow-hidden aspect-video bg-zinc-50 shadow-sm hover:shadow transition-all duration-300">
														<img 
															src={path} 
															alt={`After Test ${i + 1}`} 
															className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
														/>
														<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
															<a 
																href={path} 
																target="_blank" 
																rel="noopener noreferrer" 
																className="px-3 py-1.5 bg-white text-zinc-800 text-[10px] font-extrabold rounded-lg shadow hover:bg-zinc-100 transition-colors"
															>
																View Full Image
															</a>
														</div>
													</div>
												))}
											</div>
										</div>
									)}

									{/* Legacy Test Pictures fallback */}
									{reportData?.imagePaths && reportData.imagePaths.length > 0 && 
									 (!reportData?.beforeImages || reportData.beforeImages.length === 0) && 
									 (!reportData?.afterImages || reportData.afterImages.length === 0) && (
										<div className="space-y-2.5">
											<span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider block">Legacy Test Pictures ({reportData.imagePaths.length})</span>
											<div className="grid grid-cols-2 gap-3">
												{reportData.imagePaths.map((path: string, i: number) => (
													<div key={i} className="group relative border border-zinc-200 rounded-xl overflow-hidden aspect-video bg-zinc-50 shadow-sm hover:shadow transition-all duration-300">
														<img 
															src={path} 
															alt={`Legacy Specimen ${i + 1}`} 
															className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
														/>
														<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
															<a 
																href={path} 
																target="_blank" 
																rel="noopener noreferrer" 
																className="px-3 py-1.5 bg-white text-zinc-800 text-[10px] font-extrabold rounded-lg shadow hover:bg-zinc-100 transition-colors"
															>
																View Full Image
															</a>
														</div>
													</div>
												))}
											</div>
										</div>
									)}
								</div>
							) : (
								<div className="flex-1 border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center py-20 text-zinc-400">
									<Clipboard className="w-10 h-10 mb-2 opacity-55" />
									<p className="text-xs font-semibold">No pictures uploaded for this report.</p>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Action Section */}
				<div className="bg-white border border-zinc-200 rounded-[28px] p-6 shadow-sm flex flex-col gap-4">
					<h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-900 border-b border-zinc-100 pb-2">
						Set Sample Test Result
					</h3>
					<div className="space-y-4">
						<div className="flex flex-col gap-2">
							<label htmlFor="evalRemarks" className="text-[10px] text-zinc-500 font-extrabold uppercase">
								Evaluation Remarks
							</label>
							<textarea 
								id="evalRemarks"
								rows={4}
								placeholder="Enter evaluation observations, cycle completions summary, compliance or failure remarks..."
								value={evaluationRemarks}
								onChange={(e) => setEvaluationRemarks(e.target.value)}
								className="bg-[#f8fafc] border border-zinc-200 rounded-xl p-3.5 text-zinc-800 text-xs font-semibold outline-none focus:border-[#11236a] focus:bg-white transition-all resize-none"
							/>
						</div>

						<div className="flex justify-end gap-3 pt-2">
							<button 
								onClick={() => handleEvaluate('FAILED')}
								className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer border-none outline-none flex items-center gap-1.5 shadow-md active:scale-95"
							>
								<XCircle className="w-4 h-4 shrink-0" />
								Fail Test
							</button>
							<button 
								onClick={() => handleEvaluate('PASSED')}
								className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer border-none outline-none flex items-center gap-1.5 shadow-md active:scale-95"
							>
								<CheckCircle className="w-4 h-4 shrink-0" />
								Pass Test
							</button>
						</div>
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
}
