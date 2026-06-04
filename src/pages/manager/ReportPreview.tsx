import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Printer, X, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { getTestRequests } from '../../services/operations/testRequestService';
import { getTestCategories } from '../../services/operations/testCategoryService';
import { getTestProtocols } from '../../services/operations/testProtocolService';
import { getChecksheetEntries } from '../../services/operations/reliabilityChecksheetService';

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
	const [plans, setPlans] = useState<{ [key: string]: any }>({});
	const [cellData, setCellData] = useState<{ [key: string]: string }>({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;
		const loadData = async () => {
			try {
				const reqs = await getTestRequests()();
				const categories = await getTestCategories()();
				const protocols = await getTestProtocols()();
				const cachedPlans = localStorage.getItem('dixon_sample_test_plans');

				if (isMounted) {
					setRequests(reqs || []);
					setTestCategories(categories || []);
					setTestProtocols(protocols || []);
					setPlans(cachedPlans ? JSON.parse(cachedPlans) : {});
				}

				// If it is a sample report, load checksheet entries
				if (type === 'sample' && key) {
					const dbEntries = await getChecksheetEntries(key)();
					if (isMounted) {
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
	}, [type, key]);

	// Format platforms list text
	const getPlatformsText = (plan: any) => {
		if (!plan || !plan.platformNos) return 'N/A';
		return plan.platformNos.map((pNum: number) => `P${plan.stationNo}-S${pNum}`).join(', ');
	};

	// Handlers
	const triggerPrint = () => {
		window.print();
	};

	const closeTab = () => {
		window.close();
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-zinc-150 flex flex-col items-center justify-center space-y-4">
				<div className="w-12 h-12 border-4 border-indigo-700 border-t-transparent rounded-full animate-spin"></div>
				<p className="text-zinc-650 text-xs font-bold">Assembling Quality Laboratory PDF Preview...</p>
			</div>
		);
	}

	// 1. RENDER INDIVIDUAL SAMPLE REPORT
	if (type === 'sample' && key) {
		const plan = plans[key];
		const [reqIdStr, sampleIdxStr] = key.split('-sample-');
		const sampleIndex = parseInt(sampleIdxStr, 10);
		const request = requests.find(r => String(r.id) === String(reqIdStr));

		if (!request || !plan) {
			return (
				<div className="min-h-screen bg-zinc-100 flex flex-col items-center justify-center p-6 text-center">
					<AlertTriangle className="w-12 h-12 text-rose-500 mb-2" />
					<h3 className="text-base font-black text-zinc-800">Test Plan or Request Data Not Found</h3>
					<p className="text-xs text-zinc-500 mt-1 max-w-sm">Please verify the selected plan or refresh your manager panel.</p>
					<button onClick={closeTab} className="mt-4 px-4 py-2 bg-zinc-800 text-white rounded-lg text-xs font-bold">Close Tab</button>
				</div>
			);
		}

		const testCategory = testCategories.find(c => String(c.id) === String(plan.testCategoryId));
		const protocol = testProtocols.find(p => String(p.id) === String(plan.testProtocolId));

		const productType = (plan.productType || protocol?.productType || 'SATL').toUpperCase();
		const columns = productType === 'FATL' ? FATL_COLUMNS : SATL_COLUMNS;

		// Generate Date List
		const start = new Date(plan.startDate);
		const end = new Date(plan.endDate);
		const datesList: string[] = [];
		if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
			let curr = new Date(start);
			let safety = 0;
			while (curr <= end && safety < 100) {
				datesList.push(curr.toISOString().split('T')[0]);
				curr.setDate(curr.getDate() + 1);
				safety++;
			}
		}

		// Inspection report
		const inspectionReport = request.sampleInspections?.find((si: any) => Number(si.sampleIndex) === sampleIndex);

		return (
			<>
				<style>{`
					@media print {
						.no-print {
							display: none !important;
						}
						body {
							background: white !important;
							color: black !important;
						}
						#printable-area {
							border: none !important;
							box-shadow: none !important;
							margin: 0 !important;
							padding: 0 !important;
							width: 100% !important;
						}
						@page {
							size: A4 portrait;
							margin: 15mm;
						}
					}
				`}</style>

				<div className="min-h-screen bg-zinc-100 flex flex-col no-scrollbar">
					{/* Sticky top action bar */}
					<div className="bg-white border-b border-zinc-200/80 px-6 py-3 flex items-center justify-between no-print sticky top-0 z-55 shadow-sm">
						<div className="flex items-center gap-2 text-zinc-800">
							<FileText className="w-5 h-5 text-indigo-750" />
							<div>
								<span className="text-xs font-black uppercase text-zinc-900">Sample Report PDF Preview</span>
								<p className="text-[10px] text-zinc-500 font-medium">Sample #{sampleIndex + 1} for Request {request.requestId || `REQ-2026-${request.id}`}</p>
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
								className="flex items-center gap-1.5 text-xs font-bold text-zinc-650 hover:bg-zinc-105 border border-zinc-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer outline-none active:scale-[0.98]"
							>
								<X className="w-3.5 h-3.5" />
								<span>Close</span>
							</button>
						</div>
					</div>

					{/* Printable A4 Container */}
					<div className="flex-1 p-8 flex justify-center overflow-y-auto">
						<div
							id="printable-area"
							className="w-[210mm] min-h-[297mm] bg-white border border-zinc-300 rounded-[24px] p-10 shadow-xl flex flex-col justify-between text-zinc-900"
							style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
						>
							<div className="space-y-6">
								{/* Dixon Quality Laboratory Header */}
								<div className="border border-zinc-900 grid grid-cols-4">
									<div className="col-span-1 border-r border-zinc-900 p-4 flex items-center justify-center">
										<img src="/logo.png" alt="Dixon Logo" className="h-10 object-contain max-w-full" />
									</div>
									<div className="col-span-2 border-r border-zinc-900 p-4 text-center flex flex-col justify-center items-center">
										<h2 className="text-base font-black tracking-wider uppercase text-zinc-900 leading-tight">
											Dixon Quality Laboratory
										</h2>
										<span className="text-[9px] font-bold text-zinc-555 uppercase tracking-widest mt-1 block">
											Sample Test Evaluation Report
										</span>
									</div>
									<div className="col-span-1 p-4 flex flex-col justify-center items-center text-center bg-zinc-50/50">
										<span className="text-[8px] text-zinc-450 block font-extrabold uppercase">DOC CODE</span>
										<span className="text-xs font-black text-zinc-800">DQL-STR-{request.id}</span>
									</div>
								</div>

								{/* Request & Sample Specifications Section */}
								<div>
									<h3 className="text-[10px] font-black uppercase tracking-wider text-indigo-900 border-b border-zinc-300 pb-1.5 mb-3">
										1. Request & Sample Specifications
									</h3>
									<table className="w-full border border-zinc-900 text-xs font-bold text-left border-collapse">
										<tbody>
											<tr className="border-b border-zinc-900 divide-x divide-zinc-900">
												<td className="p-2 bg-zinc-50 w-1/4 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Request ID</td>
												<td className="p-2 w-1/4 text-zinc-900 font-black">{request.requestId || `REQ-2026-${request.id}`}</td>
												<td className="p-2 bg-zinc-50 w-1/4 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Sample Allotted Code</td>
												<td className="p-2 w-1/4 text-zinc-900 font-black">{inspectionReport?.allottedId || `Sample #${sampleIndex + 1}`}</td>
											</tr>
											<tr className="border-b border-zinc-900 divide-x divide-zinc-900">
												<td className="p-2 bg-zinc-50 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Manufacturer</td>
												<td className="p-2 text-zinc-900 font-medium whitespace-pre-wrap">{request.manufacturerNameAddress}</td>
												<td className="p-2 bg-zinc-50 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Customer / Client</td>
												<td className="p-2 text-zinc-900 font-medium whitespace-pre-wrap">{request.customerNameAddress}</td>
											</tr>
											<tr className="border-b border-zinc-900 divide-x divide-zinc-900">
												<td className="p-2 bg-zinc-50 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Brand Name</td>
												<td className="p-2 text-zinc-900 font-black">{request.brandName}</td>
												<td className="p-2 bg-zinc-50 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Model No.</td>
												<td className="p-2 text-zinc-900 font-black">{request.modelNo}</td>
											</tr>
											<tr className="divide-x divide-zinc-900">
												<td className="p-2 bg-zinc-50 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Test Standard Ref</td>
												<td className="p-2 text-zinc-900 font-medium">{request.testMethodRef}</td>
												<td className="p-2 bg-zinc-50 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Initial Inspection</td>
												<td className="p-2 text-zinc-900">
													<span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${inspectionReport?.status === 'PASSED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-250' : 'bg-rose-50 text-rose-800 border border-rose-250'}`}>
														{inspectionReport?.status || 'PASSED'}
													</span>
												</td>
											</tr>
										</tbody>
									</table>
								</div>

								{/* Physical Test Plan Configuration Section */}
								<div>
									<h3 className="text-[10px] font-black uppercase tracking-wider text-indigo-900 border-b border-zinc-300 pb-1.5 mb-3">
										2. Endurance Test Plan Configurations
									</h3>
									<table className="w-full border border-zinc-900 text-xs font-bold text-left border-collapse">
										<tbody>
											<tr className="border-b border-zinc-900 divide-x divide-zinc-900">
												<td className="p-2 bg-zinc-50 w-1/4 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Test Category</td>
												<td className="p-2 w-1/4 text-zinc-900 font-medium">{testCategory?.name || 'Reliability Endurance Life'}</td>
												<td className="p-2 bg-zinc-50 w-1/4 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Test Protocol</td>
												<td className="p-2 w-1/4 text-zinc-900 font-medium">{protocol?.name || 'General Reliability'}</td>
											</tr>
											<tr className="border-b border-zinc-900 divide-x divide-zinc-900">
												<td className="p-2 bg-zinc-50 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Station Unit</td>
												<td className="p-2 text-zinc-900 font-black">Station S{plan.stationNo}</td>
												<td className="p-2 bg-zinc-50 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Platforms Allocated</td>
												<td className="p-2 text-blue-800 font-black">{getPlatformsText(plan)}</td>
											</tr>
											<tr className="divide-x divide-zinc-900">
												<td className="p-2 bg-zinc-50 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Duration Days</td>
												<td className="p-2 text-zinc-900 font-bold">{plan.numberOfDays} Days</td>
												<td className="p-2 bg-zinc-50 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Logsheet Period</td>
												<td className="p-2 text-zinc-900 font-medium">{plan.startDate} to {plan.endDate}</td>
											</tr>
										</tbody>
									</table>
								</div>

								{/* Inspector Chronological logsheets */}
								<div>
									<h3 className="text-[10px] font-black uppercase tracking-wider text-indigo-900 border-b border-zinc-300 pb-1.5 mb-3">
										3. Daily Inspection Chronology Logsheets ({productType} Endurance)
									</h3>
									<div className="overflow-x-auto border border-zinc-900">
										<table className="w-full border-collapse text-left text-[9px]">
											<thead>
												<tr className="bg-zinc-100 border-b border-zinc-900 font-bold uppercase text-zinc-800">
													<th className="border-r border-zinc-900 p-2 text-center w-[85px]">Date</th>
													{columns.map(col => (
														<th key={col.id} className="border-r border-zinc-900 p-2 text-center text-[8px]">
															{col.label}
														</th>
													))}
												</tr>
											</thead>
											<tbody className="divide-y divide-zinc-900 text-zinc-900 font-semibold">
												{datesList.map((dateStr) => {
													const [y, m, d] = dateStr.split('-');
													const formattedDate = `${d}-${m}-${y}`;

													return (
														<tr key={dateStr} className="hover:bg-zinc-50">
															<td className="border-r border-zinc-900 p-2 text-center bg-zinc-50/50 font-black">
																{formattedDate}
															</td>
															{columns.map((col) => {
																const val = cellData[`${dateStr}_${col.id}`] || '';
																return (
																	<td key={col.id} className="border-r border-zinc-900 p-2 text-center font-bold">
																		{val || <span className="text-zinc-300">-</span>}
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

								{/* Final Test Evaluation Results */}
								<div>
									<h3 className="text-[10px] font-black uppercase tracking-wider text-indigo-900 border-b border-zinc-300 pb-1.5 mb-3">
										4. Final Manager Evaluation Results
									</h3>
									<table className="w-full border border-zinc-900 text-xs font-bold text-left border-collapse">
										<tbody>
											<tr className="border-b border-zinc-900 divide-x divide-zinc-900">
												<td className="p-2 bg-zinc-50 w-1/4 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Evaluation Result</td>
												<td className="p-2 w-3/4 text-zinc-900">
													<span className={`text-[10px] font-black uppercase px-3 py-1 rounded inline-flex items-center gap-1 ${plan.evaluationStatus === 'PASSED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
														{plan.evaluationStatus === 'PASSED' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-700" /> : <XCircle className="w-3.5 h-3.5 text-rose-700" />}
														{plan.evaluationStatus}
													</span>
												</td>
											</tr>
											<tr className="border-b border-zinc-900 divide-x divide-zinc-900">
												<td className="p-2 bg-zinc-50 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Evaluator Remarks</td>
												<td className="p-2 text-zinc-900 font-medium whitespace-pre-wrap leading-relaxed">
													{plan.evaluationRemarks || 'No evaluation remarks recorded.'}
												</td>
											</tr>
											<tr className="divide-x divide-zinc-900">
												<td className="p-2 bg-zinc-50 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Evaluation Timestamp</td>
												<td className="p-2 text-zinc-900 font-medium">
													{plan.evaluatedAt ? new Date(plan.evaluatedAt).toLocaleString() : 'N/A'}
												</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>

							{/* Document footer & Signatures */}
							<div className="grid grid-cols-2 gap-10 text-[10px] font-bold text-zinc-500 mt-12 pt-6 border-t border-zinc-300">
								<div>
									<p className="text-[8px] uppercase tracking-wider text-zinc-400">Inspected and Logged By:</p>
									<p className="text-zinc-800 font-black mt-2">Quality Assurance Inspector</p>
									<div className="h-10 border-b border-dashed border-zinc-400 w-48 mt-2" />
									<p className="text-[8px] mt-1 text-zinc-400">Date & Signature</p>
								</div>
								<div className="text-right flex flex-col items-end">
									<p className="text-[8px] uppercase tracking-wider text-zinc-400">Certified and Evaluated By:</p>
									<p className="text-zinc-800 font-black mt-2">Laboratory Operations Manager</p>
									<div className="h-10 border-b border-dashed border-zinc-400 w-48 mt-2" />
									<p className="text-[8px] mt-1 text-zinc-400">Date & Signature</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</>
		);
	}

	// 2. RENDER OVERALL REQUEST REPORT
	if (type === 'request' && id) {
		const request = requests.find(r => String(r.id) === String(id));

		if (!request) {
			return (
				<div className="min-h-screen bg-zinc-100 flex flex-col items-center justify-center p-6 text-center">
					<AlertTriangle className="w-12 h-12 text-rose-500 mb-2" />
					<h3 className="text-base font-black text-zinc-800">Request Data Not Found</h3>
					<p className="text-xs text-zinc-500 mt-1 max-w-sm">Please verify the selected request or refresh your manager panel.</p>
					<button onClick={closeTab} className="mt-4 px-4 py-2 bg-zinc-800 text-white rounded-lg text-xs font-bold">Close Tab</button>
				</div>
			);
		}

		// Read plans map to get individual sample results
		const cachedPlans = localStorage.getItem('dixon_sample_test_plans');
		const plansMap = cachedPlans ? JSON.parse(cachedPlans) : {};

		const qty = request.sampleQty || 1;
		const samplesList = [];
		let totalPassed = 0;
		let totalFailed = 0;
		let totalInspectedFailed = 0;

		for (let i = 0; i < qty; i++) {
			const cacheKey = `${request.id}-sample-${i}`;
			const inspectionReport = request.sampleInspections?.find((r: any) => Number(r.sampleIndex) === i);
			const plan = plansMap[cacheKey];

			let finalOutcome = 'UNDER TESTING';
			let remarks = '';

			if (inspectionReport) {
				if (inspectionReport.status === 'FAILED') {
					finalOutcome = 'FAILED INSPECTION';
					remarks = inspectionReport.remarks || 'Failed visual verification check.';
					totalInspectedFailed++;
				} else if (inspectionReport.status === 'PASSED') {
					if (plan) {
						if (plan.evaluationStatus === 'PASSED') {
							finalOutcome = 'TEST PASSED';
							remarks = plan.evaluationRemarks || 'Endurance specifications complied.';
							totalPassed++;
						} else if (plan.evaluationStatus === 'FAILED') {
							finalOutcome = 'TEST FAILED';
							remarks = plan.evaluationRemarks || 'Physical parameter out of tolerance.';
							totalFailed++;
						}
					}
				}
			}
			samplesList.push({
				index: i,
				allottedId: inspectionReport?.allottedId || `REQ-${request.id}-S${String(i + 1).padStart(2, '0')}`,
				inspectionResult: inspectionReport?.status || 'N/A',
				plan,
				finalOutcome,
				remarks
			});
		}

		// Request level testing compliance status
		const isCompleted = (totalPassed + totalFailed + totalInspectedFailed) === qty;
		let requestComplianceStatus = 'UNDER EVALUATION';
		if (isCompleted) {
			if (totalFailed > 0 || totalInspectedFailed > 0) {
				requestComplianceStatus = totalPassed > 0 ? 'PARTIAL COMPLIANCE' : 'NON-COMPLIANCE';
			} else {
				requestComplianceStatus = 'FULL COMPLIANCE (PASSED)';
			}
		}

		return (
			<>
				<style>{`
					@media print {
						.no-print {
							display: none !important;
						}
						body {
							background: white !important;
							color: black !important;
						}
						#printable-area {
							border: none !important;
							box-shadow: none !important;
							margin: 0 !important;
							padding: 0 !important;
							width: 100% !important;
						}
						@page {
							size: A4 portrait;
							margin: 15mm;
						}
					}
				`}</style>

				<div className="min-h-screen bg-zinc-100 flex flex-col no-scrollbar">
					{/* Sticky top action bar */}
					<div className="bg-white border-b border-zinc-200/80 px-6 py-3 flex items-center justify-between no-print sticky top-0 z-55 shadow-sm">
						<div className="flex items-center gap-2 text-zinc-800">
							<FileText className="w-5 h-5 text-indigo-750" />
							<div>
								<span className="text-xs font-black uppercase text-zinc-900">Overall Request Report PDF Preview</span>
								<p className="text-[10px] text-zinc-500 font-medium">Testing Request {request.requestId || `REQ-2026-${request.id}`} - Aggregated Summary</p>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<button
								onClick={triggerPrint}
								className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#11236a] hover:bg-[#0c1a52] px-4 py-2.5 rounded-xl transition-all cursor-pointer border-none outline-none active:scale-[0.98]"
							>
								<Printer className="w-3.5 h-3.5" />
								<span>Download / Print PDF</span>
							</button>
							<button
								onClick={closeTab}
								className="flex items-center gap-1.5 text-xs font-bold text-zinc-650 hover:bg-zinc-105 border border-zinc-200 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer outline-none active:scale-[0.98]"
							>
								<X className="w-3.5 h-3.5" />
								<span>Close</span>
							</button>
						</div>
					</div>

					{/* Printable A4 Container */}
					<div className="flex-1 p-8 flex justify-center overflow-y-auto">
						<div
							id="printable-area"
							className="w-[210mm] min-h-[297mm] bg-white border border-zinc-300 rounded-[24px] p-10 shadow-xl flex flex-col justify-between text-zinc-900"
							style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
						>
							<div className="space-y-6">
								{/* Dixon Quality Laboratory Header */}
								<div className="border border-zinc-900 grid grid-cols-4">
									<div className="col-span-1 border-r border-zinc-900 p-4 flex items-center justify-center">
										<img src="/logo.png" alt="Dixon Logo" className="h-10 object-contain max-w-full" />
									</div>
									<div className="col-span-2 border-r border-zinc-900 p-4 text-center flex flex-col justify-center items-center">
										<h2 className="text-base font-black tracking-wider uppercase text-zinc-900 leading-tight">
											Dixon Quality Laboratory
										</h2>
										<span className="text-[9px] font-bold text-zinc-555 uppercase tracking-widest mt-1 block">
											Comprehensive NABL Life Test Report
										</span>
									</div>
									<div className="col-span-1 p-4 flex flex-col justify-center items-center text-center bg-zinc-50/50">
										<span className="text-[8px] text-zinc-450 block font-extrabold uppercase">DOC CODE</span>
										<span className="text-xs font-black text-zinc-800">DQL-RQR-{request.id}</span>
									</div>
								</div>

								{/* Request metadata table */}
								<div>
									<h3 className="text-[10px] font-black uppercase tracking-wider text-indigo-900 border-b border-zinc-300 pb-1.5 mb-3">
										1. Request Registry & Client Specifications
									</h3>
									<table className="w-full border border-zinc-900 text-xs font-bold text-left border-collapse">
										<tbody>
											<tr className="border-b border-zinc-900 divide-x divide-zinc-900">
												<td className="p-2 bg-zinc-50 w-1/4 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Request ID</td>
												<td className="p-2 w-1/4 text-zinc-900 font-black">{request.requestId || `REQ-2026-${request.id}`}</td>
												<td className="p-2 bg-zinc-50 w-1/4 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Requester Portal</td>
												<td className="p-2 w-1/4 text-zinc-900 font-bold">{request.requesterName || 'Client Portal'}</td>
											</tr>
											<tr className="border-b border-zinc-900 divide-x divide-zinc-900">
												<td className="p-2 bg-zinc-50 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Manufacturer Details</td>
												<td className="p-2 text-zinc-900 font-medium whitespace-pre-wrap">{request.manufacturerNameAddress}</td>
												<td className="p-2 bg-zinc-50 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Customer Details</td>
												<td className="p-2 text-zinc-900 font-medium whitespace-pre-wrap">{request.customerNameAddress}</td>
											</tr>
											<tr className="border-b border-zinc-900 divide-x divide-zinc-900">
												<td className="p-2 bg-zinc-50 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Product Brand</td>
												<td className="p-2 text-zinc-900 font-black">{request.brandName}</td>
												<td className="p-2 bg-zinc-50 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Model No.</td>
												<td className="p-2 text-zinc-900 font-black">{request.modelNo}</td>
											</tr>
											<tr className="border-b border-zinc-900 divide-x divide-zinc-900">
												<td className="p-2 bg-zinc-50 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Test Standard Ref</td>
												<td className="p-2 text-zinc-900 font-medium">{request.testMethodRef}</td>
												<td className="p-2 bg-zinc-50 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Total Quantity</td>
												<td className="p-2 text-zinc-900 font-black">{qty} Units</td>
											</tr>
											<tr className="divide-x divide-zinc-900">
												<td className="p-2 bg-zinc-50 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Report Date</td>
												<td className="p-2 text-zinc-900 font-medium">{new Date().toLocaleDateString()}</td>
												<td className="p-2 bg-zinc-50 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Compliance Status</td>
												<td className="p-2 text-zinc-900 font-black text-indigo-750">{requestComplianceStatus}</td>
											</tr>
										</tbody>
									</table>
								</div>

								{/* Individual sample results summary */}
								<div>
									<h3 className="text-[10px] font-black uppercase tracking-wider text-indigo-900 border-b border-zinc-300 pb-1.5 mb-3">
										2. Individual Sample Testing Results Summary
									</h3>
									<table className="w-full border border-zinc-900 text-xs font-bold text-left border-collapse text-zinc-900">
										<thead>
											<tr className="bg-zinc-50 border-b border-zinc-900 font-black divide-x divide-zinc-900 text-[9px] uppercase tracking-wider text-zinc-650">
												<th className="p-2 w-16 text-center">Unit #</th>
												<th className="p-2 w-32">Allotted ID</th>
												<th className="p-2 w-32">Initial Inspection</th>
												<th className="p-2 w-48">Platforms Assigned</th>
												<th className="p-2 w-40">Final Test Result</th>
												<th className="p-2">Evaluation Observations</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-zinc-900 font-medium text-[11px]">
											{samplesList.map(({ index, allottedId, inspectionResult, plan, finalOutcome, remarks }) => {
												let badgeColor = 'text-zinc-600 bg-zinc-50 border border-zinc-200';
												if (finalOutcome === 'TEST PASSED') {
													badgeColor = 'text-emerald-700 bg-emerald-50 border border-emerald-200';
												} else if (finalOutcome.includes('FAILED')) {
													badgeColor = 'text-rose-700 bg-rose-50 border border-rose-200';
												}

												return (
													<tr key={index} className="divide-x divide-zinc-900 hover:bg-zinc-50">
														<td className="p-2 text-center font-black text-zinc-800">Sample #{index + 1}</td>
														<td className="p-2 font-black text-zinc-900">{allottedId}</td>
														<td className="p-2">
															<span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${inspectionResult === 'PASSED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
																{inspectionResult}
															</span>
														</td>
														<td className="p-2 text-zinc-600 font-medium">{plan ? getPlatformsText(plan) : 'N/A'}</td>
														<td className="p-2">
															<span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${badgeColor}`}>
																{finalOutcome}
															</span>
														</td>
														<td className="p-2 text-[10px] text-zinc-600 font-medium">{remarks || '-'}</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>

								{/* Aggregated parameters evaluation stats */}
								<div>
									<h3 className="text-[10px] font-black uppercase tracking-wider text-indigo-900 border-b border-zinc-300 pb-1.5 mb-3">
										3. Aggregated Quality Compliance Metrics
									</h3>
									<table className="w-full border border-zinc-900 text-xs font-bold text-left border-collapse">
										<tbody>
											<tr className="border-b border-zinc-900 divide-x divide-zinc-900">
												<td className="p-2 bg-zinc-50 w-1/3 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Total Received Units</td>
												<td className="p-2 w-2/3 text-zinc-900 font-black">{qty} Units</td>
											</tr>
											<tr className="border-b border-zinc-900 divide-x divide-zinc-900">
												<td className="p-2 bg-zinc-50 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Visual Verification Failed</td>
												<td className="p-2 text-zinc-900 font-bold text-rose-650">{totalInspectedFailed} Units</td>
											</tr>
											<tr className="border-b border-zinc-900 divide-x divide-zinc-900">
												<td className="p-2 bg-zinc-50 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Physical Life Testing Passed</td>
												<td className="p-2 text-zinc-900 font-bold text-emerald-650">{totalPassed} Units</td>
											</tr>
											<tr className="border-b border-zinc-900 divide-x divide-zinc-900">
												<td className="p-2 bg-zinc-50 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Physical Life Testing Failed</td>
												<td className="p-2 text-zinc-900 font-bold text-rose-650">{totalFailed} Units</td>
											</tr>
											<tr className="divide-x divide-zinc-900">
												<td className="p-2 bg-zinc-50 text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider">Laboratory Verdict</td>
												<td className="p-2 text-zinc-900 font-black text-indigo-800">
													{requestComplianceStatus === 'FULL COMPLIANCE (PASSED)' 
														? 'THE REQUESTED PRODUCT BATCH SATISFACTORILY MEETS ALL ENDURANCE LIFE PARAMETERS COMPLIANT WITH NABL LABORATORY STANDARDS.' 
														: 'THE BATCH HAS QUALITY EXCEPTIONS OR STRESS FAILURES THAT PREVENT COMPLIANCE CERTIFICATION.'}
												</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>

							{/* Document footer & Signatures */}
							<div className="grid grid-cols-2 gap-10 text-[10px] font-bold text-zinc-500 mt-12 pt-6 border-t border-zinc-300">
								<div>
									<p className="text-[8px] uppercase tracking-wider text-zinc-400">Inspected and Logged By:</p>
									<p className="text-zinc-800 font-black mt-2">Quality Assurance Inspector</p>
									<div className="h-10 border-b border-dashed border-zinc-400 w-48 mt-2" />
									<p className="text-[8px] mt-1 text-zinc-400">Date & Signature</p>
								</div>
								<div className="text-right flex flex-col items-end">
									<p className="text-[8px] uppercase tracking-wider text-zinc-400">Certified and Checked By:</p>
									<p className="text-zinc-800 font-black mt-2">Laboratory Operations Manager</p>
									<div className="h-10 border-b border-dashed border-zinc-400 w-48 mt-2" />
									<p className="text-[8px] mt-1 text-zinc-400">Date & Signature</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</>
		);
	}

	return (
		<div className="min-h-screen bg-zinc-100 flex flex-col items-center justify-center p-6 text-center">
			<AlertTriangle className="w-12 h-12 text-rose-500 mb-2" />
			<h3 className="text-base font-black text-zinc-800">Invalid Report Type</h3>
			<p className="text-xs text-zinc-500 mt-1 max-w-sm">Please check the report preview parameters.</p>
			<button onClick={closeTab} className="mt-4 px-4 py-2 bg-zinc-800 text-white rounded-lg text-xs font-bold">Close Tab</button>
		</div>
	);
}
