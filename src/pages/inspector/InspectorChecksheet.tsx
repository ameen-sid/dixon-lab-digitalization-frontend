import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Clipboard } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { getTestRequests } from '../../services/operations/testRequestService';
import { getTestTypes } from '../../services/operations/testTypeService';
import { getTestCategories } from '../../services/operations/testCategoryService';
import { getTestProtocols } from '../../services/operations/testProtocolService';
import { getChecksheetEntries, upsertChecksheetEntry } from '../../services/operations/reliabilityChecksheetService';

// Column definition types
interface ColumnDef {
	id: string;
	label: string;
}

// Columns for Semi-automatic Washing Machine Life Test (SATL)
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

// Columns for Fully automatic Washing Machine Life Test (FATL)
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

export default function InspectorChecksheet() {
	const navigate = useNavigate();
	const { planKey } = useParams<{ planKey: string }>();

	// Data stores
	const [requests, setRequests] = useState<any[]>([]);
	const [testTypes, setTestTypes] = useState<any[]>([]);
	const [testCategories, setTestCategories] = useState<any[]>([]);
	const [testProtocols, setTestProtocols] = useState<any[]>([]);
	const [plans, setPlans] = useState<{ [key: string]: any }>({});

	// Checksheet values cache: map of "dateStr_colId" -> value
	const [cellData, setCellData] = useState<{ [key: string]: string }>({});

	// Temporary typing values to prevent re-render lag
	const [tempValues, setTempValues] = useState<{ [key: string]: string }>({});

	// Loading state
	const [loading, setLoading] = useState(true);

	// Fetch all parameters and backend database entries on mount
	useEffect(() => {
		let isMounted = true;
		const loadData = async () => {
			if (!planKey) return;
			try {
				const reqs = await getTestRequests()();
				const types = await getTestTypes()();
				const categories = await getTestCategories()();
				const protocols = await getTestProtocols()();
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

				// Fetch entries from backend database
				const dbEntries = await getChecksheetEntries(planKey)();

				if (isMounted) {
					setRequests(reqs || []);
					setTestTypes(types || []);
					setTestCategories(categories || []);
					setTestProtocols(protocols || []);
					setPlans(plansMap);

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
				console.error('Failed to load checksheet data from database:', err);
			} finally {
				if (isMounted) setLoading(false);
			}
		};
		loadData();
		return () => {
			isMounted = false;
		};
	}, [planKey]);

	// Get select plan info
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
			const noOfCycleVal = Number(tempValues[`${dateStr}_noOfCycle`] !== undefined ? tempValues[`${dateStr}_noOfCycle`] : (cellData[`${dateStr}_noOfCycle`] || 0));
			const washCyclesVal = Number(tempValues[`${dateStr}_washCycles`] !== undefined ? tempValues[`${dateStr}_washCycles`] : (cellData[`${dateStr}_washCycles`] || 0));
			const spinCyclesVal = Number(tempValues[`${dateStr}_spinCycles`] !== undefined ? tempValues[`${dateStr}_spinCycles`] : (cellData[`${dateStr}_spinCycles`] || 0));

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
	}, [datesList, cellData, tempValues]);

	// Local temporary value synchronize
	const getCellValue = (dateStr: string, colId: string) => {
		if (productType === 'FATL' && colId === 'totalCycles') {
			return calculatedTotals[dateStr]?.totalCycles !== undefined ? String(calculatedTotals[dateStr].totalCycles) : '';
		}
		if (productType === 'SATL') {
			if (colId === 'totalCyclesWash') {
				return calculatedTotals[dateStr]?.totalCyclesWash !== undefined ? String(calculatedTotals[dateStr].totalCyclesWash) : '';
			}
			if (colId === 'totalCyclesSpin') {
				return calculatedTotals[dateStr]?.totalCyclesSpin !== undefined ? String(calculatedTotals[dateStr].totalCyclesSpin) : '';
			}
		}

		const cellKey = `${dateStr}_${colId}`;
		if (tempValues[cellKey] !== undefined) {
			return tempValues[cellKey];
		}
		return cellData[cellKey] || '';
	};

	const handleCellChange = (dateStr: string, colId: string, val: string) => {
		const cellKey = `${dateStr}_${colId}`;
		setTempValues(prev => ({ ...prev, [cellKey]: val }));
	};

	// Save entry row to database on cell blur
	const handleCellBlur = async (dateStr: string, colId: string, val: string) => {
		if (!planKey) return;
		const cellKey = `${dateStr}_${colId}`;
		
		// Update cache state locally
		const updatedCellData = { ...cellData, [cellKey]: val };

		// Auto-calculate and update totals before saving
		if (productType === 'FATL') {
			const totalVal = calculatedTotals[dateStr]?.totalCycles;
			if (totalVal !== undefined) {
				updatedCellData[`${dateStr}_totalCycles`] = String(totalVal);
			}
		} else {
			const washVal = calculatedTotals[dateStr]?.totalCyclesWash;
			const spinVal = calculatedTotals[dateStr]?.totalCyclesSpin;
			if (washVal !== undefined) {
				updatedCellData[`${dateStr}_totalCyclesWash`] = String(washVal);
			}
			if (spinVal !== undefined) {
				updatedCellData[`${dateStr}_totalCyclesSpin`] = String(spinVal);
			}
		}

		setCellData(updatedCellData);

		// Aggregate all entries for this specific date
		const dateData: { [key: string]: string } = {};
		columns.forEach(col => {
			const k = `${dateStr}_${col.id}`;
			const cellVal = updatedCellData[k] || '';
			if (cellVal) {
				dateData[col.id] = cellVal;
			}
		});

		try {
			// Save in backend database
			await upsertChecksheetEntry(planKey, dateStr, dateData)();
		} catch (error) {
			console.error('Failed to sync checksheet entry with database:', error);
		}
	};

	// Keyboard arrow navigation helper
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, dateIndex: number, colIndex: number) => {
		let targetDateIndex = dateIndex;
		let targetColIndex = colIndex;

		if (e.key === 'ArrowLeft') {
			targetColIndex = colIndex - 1;
		} else if (e.key === 'ArrowRight') {
			targetColIndex = colIndex + 1;
		} else if (e.key === 'ArrowUp') {
			targetDateIndex = dateIndex - 1;
		} else if (e.key === 'ArrowDown') {
			targetDateIndex = dateIndex + 1;
		} else {
			return; // Not an arrow key
		}

		// Prevent browser scroll or standard cursor movements on arrow keys
		e.preventDefault();

		let safety = 0;
		while (safety < 20) {
			safety++;
			if (targetDateIndex < 0 || targetDateIndex >= datesList.length || targetColIndex < 0 || targetColIndex >= columns.length) {
				break; // Out of bounds
			}

			const targetId = `cell-${targetDateIndex}-${targetColIndex}`;
			const el = document.getElementById(targetId) as HTMLInputElement | null;
			if (el && !el.disabled) {
				el.focus();
				el.select();
				break;
			}

			// If disabled/unavailable, keep walking in that direction
			if (e.key === 'ArrowLeft') {
				targetColIndex--;
			} else if (e.key === 'ArrowRight') {
				targetColIndex++;
			} else if (e.key === 'ArrowUp') {
				targetDateIndex--;
			} else if (e.key === 'ArrowDown') {
				targetDateIndex++;
			}
		}
	};

	// Format platforms list text
	const getPlatformsText = (plan: any) => {
		if (!plan || !plan.platformNos) return 'N/A';
		let platforms = plan.platformNos;
		if (typeof platforms === 'string') {
			try {
				platforms = JSON.parse(platforms);
			} catch (e) {
				platforms = [];
			}
		}
		if (!Array.isArray(platforms)) return 'N/A';
		return platforms.map((pNum: number) => `P${plan.stationNo}-S${pNum}`).join(', ');
	};

	// Print sheets helper
	const triggerPrint = () => {
		window.print();
	};

	if (loading) {
		return (
			<DashboardLayout title="Daily Checksheets Dashboard" description="Loading Active Reliability Life Testing parameters...">
				<div className="flex flex-col items-center justify-center py-20 space-y-4">
					<div className="w-12 h-12 border-4 border-indigo-700 border-t-transparent rounded-full animate-spin"></div>
					<p className="text-zinc-555 text-xs font-semibold">Synchronizing Master Reliability Schedules...</p>
				</div>
			</DashboardLayout>
		);
	}

	if (!planInfo) {
		return (
			<DashboardLayout title="Checksheet Not Found" description="The requested test plan checksheet could not be located.">
				<div className="bg-white border border-zinc-200 rounded-3xl p-8 text-center max-w-md mx-auto my-12">
					<Clipboard className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
					<h3 className="text-lg font-bold text-zinc-800">Invalid Test Plan</h3>
					<p className="text-xs text-zinc-500 mt-2">
						Please return to the checksheet queue and verify the plan selection.
					</p>
					<button
						onClick={() => navigate('/inspector/daily-checksheet')}
						className="mt-6 px-4 py-2 bg-indigo-750 text-white rounded-xl text-xs font-bold hover:bg-indigo-900 transition-colors"
					>
						Back to Test Queue
					</button>
				</div>
			</DashboardLayout>
		);
	}

	return (
		<>
			{/* Print layout override styles */}
			<style>{`
				@media print {
					@page {
						size: landscape;
						margin: 10mm;
					}
					body {
						background: #fff !important;
						color: #000 !important;
					}
					body * {
						visibility: hidden;
					}
					#printable-checksheet, #printable-checksheet * {
						visibility: visible;
					}
					#printable-checksheet {
						position: absolute;
						left: 0;
						top: 0;
						width: 100%;
						margin: 0;
						padding: 0;
						border: none !important;
						box-shadow: none !important;
					}
					.no-print {
						display: none !important;
					}
					.overflow-x-auto {
						overflow: visible !important;
					}
					table {
						width: 100% !important;
						border-collapse: collapse !important;
					}
					th, td {
						border: 1px solid #000 !important;
						padding: 4px 2px !important;
						font-size: 8px !important;
						text-align: center !important;
						word-wrap: break-word !important;
					}
					input {
						border: none !important;
						outline: none !important;
						background: transparent !important;
						font-size: 8px !important;
						text-align: center !important;
						width: 100% !important;
					}
				}
			`}</style>

			<div className="min-h-screen bg-[#f8fafc] text-zinc-900 p-8 flex flex-col gap-6">
				
				{/* Header back & prints bar */}
				<div className="flex flex-row justify-between items-center no-print">
					<button 
						onClick={() => navigate('/inspector/daily-checksheet')}
						className="flex items-center gap-2 text-xs font-bold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 px-3.5 py-2 rounded-xl shadow-sm transition-colors cursor-pointer border-none outline-none"
					>
						<ArrowLeft className="w-4 h-4" />
						<span>Back to Test Queue</span>
					</button>

					<div className="flex items-center gap-4">
						<span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
							Tip: Cell inputs save to database on blur
						</span>
						<button 
							onClick={triggerPrint}
							className="flex items-center gap-2 text-xs font-bold text-white bg-[#11236a] hover:bg-[#0c1a52] px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer border-none outline-none"
						>
							<Printer className="w-4 h-4" />
							<span>Print Sheet</span>
						</button>
					</div>
				</div>

				{/* Document checksheet frame */}
				<div 
					id="printable-checksheet" 
					className="bg-white border border-zinc-300 rounded-[28px] p-8 shadow-xl flex flex-col gap-6"
				>
					
					{/* Table Header Dixon style */}
					<div className="border border-zinc-900 grid grid-cols-4 text-zinc-900">
						<div className="col-span-1 border-r border-zinc-900 p-3.5 flex items-center justify-center text-[10px] font-bold tracking-widest uppercase">
							R&D Test Lab
						</div>
						<div className="col-span-2 border-r border-zinc-900 p-3.5 flex flex-col items-center justify-center text-center">
							<h2 className="text-sm font-black tracking-wider uppercase leading-snug">
								{productType === 'FATL' 
									? 'Fully automatic Washing Machine life test Check-sheet' 
									: 'Semi-automatic Washing Machine Life Test Check Sheet'}
							</h2>
						</div>
						<div className="col-span-1 p-3.5 flex items-center justify-center text-[10px] font-black uppercase">
							Plan #{planInfo.plan.stationNo}
						</div>
					</div>

					{/* Metadata table grid */}
					<div className="border-x border-b border-zinc-900 -mt-6 grid grid-cols-3 text-zinc-900 text-xs font-bold">
						<div className="col-span-2 divide-y divide-zinc-900">
							<div className="grid grid-cols-3 divide-x divide-zinc-900">
								<span className="p-2.5 text-zinc-500 uppercase tracking-wider text-[9px]">Request ID</span>
								<span className="p-2.5 col-span-2 text-zinc-900 uppercase font-black">{planInfo.request?.requestId || `REQ-2026-${planInfo.request?.id}`}</span>
							</div>
							<div className="grid grid-cols-3 divide-x divide-zinc-900">
								<span className="p-2.5 text-zinc-500 uppercase tracking-wider text-[9px]">Sample ID</span>
								<span className="p-2.5 col-span-2 text-zinc-900 uppercase font-black">
									{(() => {
										const sampleIndex = Number(planKey?.split('-sample-')[1]);
										const inspection = planInfo.request?.sampleInspections?.find(
											(si: any) => Number(si.sampleIndex) === sampleIndex
										);
										return inspection?.allottedId || `Sample #${sampleIndex + 1}`;
									})()}
								</span>
							</div>
							<div className="grid grid-cols-3 divide-x divide-zinc-900">
								<span className="p-2.5 text-zinc-500 uppercase tracking-wider text-[9px]">Model / Cap.</span>
								<span className="p-2.5 col-span-2 text-zinc-900 uppercase font-black">{planInfo.request?.modelNo || 'N/A'}</span>
							</div>
							<div className="grid grid-cols-3 divide-x divide-zinc-900">
								<span className="p-2.5 text-zinc-500 uppercase tracking-wider text-[9px]">Category</span>
								<span className="p-2.5 col-span-2 text-zinc-900 uppercase font-black">{planInfo.testCategory?.name || 'Reliability Life'}</span>
							</div>
							<div className="grid grid-cols-3 divide-x divide-zinc-900">
								<span className="p-2.5 text-zinc-500 uppercase tracking-wider text-[9px]">Platform No.</span>
								<span className="p-2.5 col-span-2 text-blue-700 font-extrabold">{getPlatformsText(planInfo.plan)}</span>
							</div>
						</div>
						<div className="col-span-1 border-l border-zinc-900 p-4 flex flex-col items-center justify-center text-center bg-zinc-50/50">
							<img src="/logo.png" alt="Dixon Logo" className="h-10 object-contain max-w-full" />
							<span className="text-[8px] font-extrabold uppercase tracking-widest mt-1 text-zinc-555">Reliability Lab</span>
						</div>
					</div>

					{/* Grid Data Sheets */}
					<div className="overflow-x-auto border border-zinc-900">
						<table className="min-w-full border-collapse text-left">
							<thead>
								<tr className="bg-zinc-100/80 border-b border-zinc-900 text-zinc-800 text-[10px] font-bold uppercase tracking-wider">
									<th className="border-r border-zinc-900 p-2.5 text-center min-w-[100px]">Date</th>
									{columns.map(col => (
										<th key={col.id} className="border-r border-zinc-900 p-2.5 text-center text-[9px] min-w-[90px]">
											{col.label}
										</th>
									))}
								</tr>
							</thead>
							<tbody className="divide-y divide-zinc-900">
								{datesList.map((dateStr, dateIndex) => {
									// Format date to show like 14-04-2026
									const [y, m, d] = dateStr.split('-');
									const formattedDate = `${d}-${m}-${y}`;

									return (
										<tr key={dateStr} className="hover:bg-slate-50/50 text-[11px] font-extrabold text-zinc-800">
											<td className="border-r border-zinc-900 p-2.5 text-center font-extrabold bg-zinc-50/60 select-none">
												{formattedDate}
											</td>
											{columns.map((col, colIndex) => {
												const val = getCellValue(dateStr, col.id);
												const isCalculated = (productType === 'FATL' && col.id === 'totalCycles') || 
																	 (productType === 'SATL' && (col.id === 'totalCyclesWash' || col.id === 'totalCyclesSpin'));
												return (
													<td key={col.id} className={`border-r border-zinc-900 p-1.5 ${isCalculated ? 'bg-zinc-50' : ''}`}>
														<input
															id={`cell-${dateIndex}-${colIndex}`}
															type="text"
															value={val}
															onChange={(e) => handleCellChange(dateStr, col.id, e.target.value)}
															onBlur={(e) => handleCellBlur(dateStr, col.id, e.target.value)}
															onKeyDown={(e) => handleKeyDown(e, dateIndex, colIndex)}
															disabled={isCalculated}
															className={`w-full bg-transparent text-center font-bold text-xs border-none outline-none rounded p-1 transition-all ${
																isCalculated 
																	? 'text-zinc-500 font-extrabold cursor-not-allowed' 
																	: 'text-zinc-900 hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-indigo-500'
															}`}
														/>
													</td>
												);
											})}
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>

					{/* Document signature footnotes */}
					<div className="grid grid-cols-2 gap-8 text-[10px] font-bold text-zinc-500 mt-6 pt-4 border-t border-zinc-200">
						<div>
							<span>Prepared By: Quality Inspector</span>
						</div>
						<div className="text-right">
							<span>Approved By: Lab Manager / Quality Head</span>
						</div>
					</div>

				</div>
			</div>
		</>
	);
}
