import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clipboard, CheckCircle, XCircle } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { getTestRequests, updateTestRequestStatus } from '../../services/operations/testRequestService';
import { getTestTypes } from '../../services/operations/testTypeService';
import { getTestCategories } from '../../services/operations/testCategoryService';
import { getTestProtocols } from '../../services/operations/testProtocolService';
import { getChecksheetEntries } from '../../services/operations/reliabilityChecksheetService';
import { releasePlatforms } from '../../services/operations/platformAvailabilityService';
import { releaseEquipment } from '../../services/operations/testingEquipmentService';
import toast from 'react-hot-toast';

interface ColumnDef {
	id: string;
	label: string;
}

const SATL_COLUMNS: ColumnDef[] = [
	{ id: 'loadCondition', label: 'Load Condition' },
	{ id: 'washCycles', label: 'No. of Cycle (Wash)' },
	{ id: 'spinCycles', label: 'No. of Cycle (Spin)' },
	{ id: 'washMotor', label: 'Wash Motor' },
	{ id: 'spinMotor', label: 'Spin Motor' },
	{ id: 'gearBox', label: 'Gear Box' },
	{ id: 'sealBellow', label: 'Seal Bellow' },
	{ id: 'washTimer', label: 'Wash Timer' },
	{ id: 'spinTimer', label: 'Spin Timer' },
	{ id: 'drainSelector', label: 'Drain Selector' },
	{ id: 'capacitor', label: 'Capacitor' },
	{ id: 'safetySwitch', label: 'Safety Switch' },
	{ id: 'totalCycles', label: 'Total Cycles' },
	{ id: 'remarks', label: 'Remarks' },
];

const FATL_COLUMNS: ColumnDef[] = [
	{ id: 'loadCondition', label: 'Load Condition' },
	{ id: 'noOfCycle', label: 'No. of Cycle' },
	{ id: 'motor', label: 'Motor' },
	{ id: 'clutch', label: 'Clutch' },
	{ id: 'waterInletValve', label: 'Water Inlet Valve' },
	{ id: 'pressureSensor', label: 'Pressure Sensor' },
	{ id: 'pcb', label: 'PCB' },
	{ id: 'suspensionRod', label: 'Suspension Rod' },
	{ id: 'drainMotor', label: 'Drain Motor' },
	{ id: 'lidSwitch', label: 'Lid Switch' },
	{ id: 'inverterBoard', label: 'Inverter Board' },
	{ id: 'totalCycles', label: 'Total Cycles' },
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
				const cachedPlans = localStorage.getItem('dixon_sample_test_plans');

				// Fetch entries from backend database
				const dbEntries = await getChecksheetEntries(planKey)();

				if (isMounted) {
					setRequests(reqs || []);
					setTestTypes(types || []);
					setTestCategories(categories || []);
					setTestProtocols(protocols || []);
					setPlans(cachedPlans ? JSON.parse(cachedPlans) : {});

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

	const handleEvaluate = async (status: 'PASSED' | 'FAILED') => {
		if (!planKey || !planInfo) return;
		if (!evaluationRemarks.trim()) {
			toast.error('Please enter evaluation remarks.');
			return;
		}

		try {
			// 1. Update dixon_sample_test_plans
			const cachedPlans = localStorage.getItem('dixon_sample_test_plans');
			const plansMap = cachedPlans ? JSON.parse(cachedPlans) : {};
			
			const userStr = localStorage.getItem('user');
			const currentUser = userStr ? JSON.parse(userStr) : null;
			const managerName = currentUser ? currentUser.name : 'Lab Manager';

			plansMap[planKey] = {
				...plansMap[planKey],
				evaluationStatus: status,
				evaluationRemarks,
				evaluatedAt: new Date().toISOString(),
				evaluatedBy: managerName
			};
			localStorage.setItem('dixon_sample_test_plans', JSON.stringify(plansMap));

			// 2. Update dixon_completed_sample_inspections so that it updates the main requests results status
			const completedCached = localStorage.getItem('dixon_completed_sample_inspections');
			const completedDict = completedCached ? JSON.parse(completedCached) : {};
			
			const [requestId, sampleIdxStr] = planKey.split('-sample-');
			const sampleIdx = parseInt(sampleIdxStr, 10);
			
			completedDict[planKey] = {
				allottedId: planInfo.plan.allottedId || `REQ-${requestId}-S${String(sampleIdx + 1).padStart(2, '0')}`,
				remarks: evaluationRemarks,
				images: [],
				checks: {},
				status: status
			};
			localStorage.setItem('dixon_completed_sample_inspections', JSON.stringify(completedDict));

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

			// 3. Check if all samples for this request are completed/evaluated
			const request = requests.find(r => String(r.id) === String(requestId));
			if (request) {
				const qty = request.sampleQty || 1;
				let allSamplesComplete = true;

				const cachedManager = localStorage.getItem('dixon_sample_inspections');
				const cachedEngineer = localStorage.getItem('dixon_engineer_sample_inspections');
				const managerReports = cachedManager ? JSON.parse(cachedManager) : {};
				const engineerReports = cachedEngineer ? JSON.parse(cachedEngineer) : {};

				for (let i = 0; i < qty; i++) {
					const cacheKey = `${requestId}-sample-${i}`;
					const dbReport = (request.sampleInspections || []).find((r: any) => Number(r.sampleIndex) === i);
					const mergedReport = dbReport || engineerReports[cacheKey] || managerReports[cacheKey] || completedDict[cacheKey];
					const plan = plansMap[cacheKey];

					if (mergedReport) {
						if (mergedReport.status === 'FAILED') {
							// Sample failed inspection initially, so it's completed (closed as failed)
							continue;
						} else if (mergedReport.status === 'PASSED') {
							// Sample passed inspection, must have an evaluated test plan
							if (plan && (plan.evaluationStatus === 'PASSED' || plan.evaluationStatus === 'FAILED')) {
								continue;
							}
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
						const cacheKey = `${requestId}-sample-${i}`;
						const dbReport = (request.sampleInspections || []).find((r: any) => Number(r.sampleIndex) === i);
						const mergedReport = dbReport || engineerReports[cacheKey] || managerReports[cacheKey] || completedDict[cacheKey];
						const plan = plansMap[cacheKey];

						if (mergedReport) {
							if (mergedReport.status === 'FAILED') {
								failedCount++;
							} else if (mergedReport.status === 'PASSED') {
								if (plan && plan.evaluationStatus === 'PASSED') {
									passedCount++;
								} else if (plan && plan.evaluationStatus === 'FAILED') {
									failedCount++;
								}
							}
						}
					}

					let finalStatus = 'TESTING_PARTIAL';
					if (failedCount === qty) {
						finalStatus = 'TESTING_FAILED';
					} else if (passedCount === qty) {
						finalStatus = 'TESTING_PASSED';
					}

					// All samples completed/evaluated, update request status from UNDER_TEST to PASS/FAIL/PARTIAL
					const statusUpdateOp = updateTestRequestStatus(
						Number(requestId),
						finalStatus,
						`Testing fully evaluated: ${passedCount} passed, ${failedCount} failed.`
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
			title="Evaluate Chronological Checksheet"
			description="Review chronological checksheet parameters filled out by inspector before evaluating sample result."
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
						Evaluation Mode: Read-Only Grid
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
						<span className="text-blue-700 mt-1 block font-extrabold">S{planInfo.plan.stationNo} (P: {planInfo.plan.platformNos.join(', ')})</span>
					</div>
					<div>
						<span className="text-zinc-400 font-extrabold uppercase text-[8px] tracking-wider block">Scheduled Dates</span>
						<span className="text-zinc-850 mt-1 block font-bold">{planInfo.plan.startDate} to {planInfo.plan.endDate}</span>
					</div>
				</div>

				{/* Read only checksheet table */}
				<div className="bg-white border border-zinc-200 rounded-[28px] p-6 shadow-sm overflow-hidden flex flex-col gap-4">
					<h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500">Filled Daily Checksheet logs</h3>
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
												const val = cellData[`${dateStr}_${col.id}`] || '';
												return (
													<td key={col.id} className="border-r border-zinc-900 p-2 text-center font-bold">
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
