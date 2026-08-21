import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Clipboard, CheckCircle2, XCircle, Upload, Trash2, Save, X } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { getTestRequests, saveSampleInspection } from '../../services/operations/testRequestService';
import { getTestTypes } from '../../services/operations/testTypeService';
import { getTestCategories } from '../../services/operations/testCategoryService';
import { getTestProtocols } from '../../services/operations/testProtocolService';
import { getChecksheetEntries, upsertChecksheetEntry } from '../../services/operations/reliabilityChecksheetService';
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

export default function InspectorChecksheet() {
	const navigate = useNavigate();
	const { planKey } = useParams<{ planKey: string }>();

	const [requests, setRequests] = useState<any[]>([]);
	const [testTypes, setTestTypes] = useState<any[]>([]);
	const [testCategories, setTestCategories] = useState<any[]>([]);
	const [testProtocols, setTestProtocols] = useState<any[]>([]);
	const [plans, setPlans] = useState<{ [key: string]: any }>({});

	const [cellData, setCellData] = useState<{ [key: string]: string }>({});

	const [tempValues, setTempValues] = useState<{ [key: string]: string }>({});

	const [loading, setLoading] = useState(true);

	const [isRecommendationModalOpen, setIsRecommendationModalOpen] = useState(false);
	const [modalDecision, setModalDecision] = useState<'PASSED' | 'FAILED' | ''>('');
	const [inspectorStatus, setInspectorStatus] = useState<'PASSED' | 'FAILED' | ''>('');
	const [inspectorRemarks, setInspectorRemarks] = useState('');
	const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
	const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
	const [isSavingRecommendation, setIsSavingRecommendation] = useState(false);
	const [previewPhotoModal, setPreviewPhotoModal] = useState<string | null>(null);

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
								plansMap[`${req.id}-plan-${plan.id}`] = {
									...plan,
									platformNos: platformNosParsed
								};
							});
						}
					});
				}

				const dbEntries = await getChecksheetEntries(planKey)();

				if (isMounted) {
					setRequests(reqs || []);
					setTestTypes(types || []);
					setTestCategories(categories || []);
					setTestProtocols(protocols || []);
					setPlans(plansMap);

					const mappedData: { [key: string]: string } = {};
					dbEntries.forEach((entry: any) => {
						if (entry.date && entry.data) {
							let parsedData = entry.data;
							while (typeof parsedData === 'string') {
								try {
									const temp = JSON.parse(parsedData);
									if (temp === parsedData) break;
									parsedData = temp;
								} catch (e) {
									break;
								}
							}
							if (parsedData && typeof parsedData === 'object') {
								Object.entries(parsedData).forEach(([colId, val]) => {
									mappedData[`${entry.date}_${colId}`] = String(val);
								});
							}
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

	const planInfo = useMemo(() => {
		if (!planKey || !plans[planKey]) return null;
		const plan = plans[planKey];
		const [reqIdStr] = planKey.split('-plan-');
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
	}, [planKey, plans, requests, testTypes, testCategories, testProtocols]);

	const targetPlanId = planInfo?.plan?.id;
	useEffect(() => {
		if (!planInfo || !targetPlanId) return;
		const dbReport = planInfo.request?.sampleInspections?.find(
			(si: any) => Number(si.testPlanId) === Number(targetPlanId)
		);

		if (dbReport) {
			setInspectorStatus(dbReport.status === 'PASSED' || dbReport.status === 'FAILED' ? dbReport.status : '');
			setInspectorRemarks(dbReport.remarks || '');
			if (dbReport.images) {
				try {
					const imgs = typeof dbReport.images === 'string' ? JSON.parse(dbReport.images) : dbReport.images;
					setUploadedPhotos(Array.isArray(imgs) ? imgs : []);
				} catch (e) {
					setUploadedPhotos([]);
				}
			} else {
				setUploadedPhotos([]);
			}
		} else {
			setInspectorStatus('');
			setInspectorRemarks('');
			setUploadedPhotos([]);
			setSelectedImageFiles([]);
		}
	}, [targetPlanId]);

	const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files) return;
		const files = Array.from(e.target.files);
		setSelectedImageFiles(prev => [...prev, ...files]);

		files.forEach(file => {
			const reader = new FileReader();
			reader.onloadend = () => {
				if (reader.result) {
					setUploadedPhotos(prev => [...prev, String(reader.result)]);
				}
			};
			reader.readAsDataURL(file);
		});
	};

	const handleRemovePhoto = (index: number) => {
		setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
		setSelectedImageFiles(prev => prev.filter((_, i) => i !== index));
	};

	const handleOpenRecommendationModal = (decision: 'PASSED' | 'FAILED') => {
		setModalDecision(decision);
		setIsRecommendationModalOpen(true);
	};

	const handleSaveInspectionRecommendation = async () => {
		const targetStatus = modalDecision || inspectorStatus;
		if (!planInfo || !targetStatus) {
			toast.error('Please select Pass or Fail decision.');
			return;
		}

		setIsSavingRecommendation(true);
		try {
			const requestId = String(planInfo.request.id);
			const sampleIdx = Number(planInfo.plan.sampleIndex);

			const formData = new FormData();
			formData.append('sampleIndex', String(sampleIdx));
			formData.append('testPlanId', String(planInfo.plan.id));
			formData.append('status', targetStatus);
			formData.append('remarks', inspectorRemarks || '');
			formData.append('allottedId', `REQ-${requestId}-S${String(sampleIdx + 1).padStart(2, '0')}`);
			const existingServerPhotos = uploadedPhotos.filter(img => typeof img === 'string' && !img.startsWith('data:'));
			formData.append('existingImages', JSON.stringify(existingServerPhotos));

			selectedImageFiles.forEach(file => {
				formData.append('images', file);
			});

			const saveOp = saveSampleInspection(requestId, formData);
			const res = await saveOp();

			if (res && res.data && res.data.images) {
				try {
					const updatedImgs = typeof res.data.images === 'string' ? JSON.parse(res.data.images) : res.data.images;
					if (Array.isArray(updatedImgs)) {
						setUploadedPhotos(updatedImgs);
					}
				} catch (e) {}
			}

			setInspectorStatus(targetStatus);
			toast.success(`Test marked as ${targetStatus} & email notification sent to Lab Manager!`);
			setSelectedImageFiles([]);
			setIsRecommendationModalOpen(false);
		} catch (err) {
			console.error('Failed to save recommendation:', err);
			toast.error('Failed to save test outcome decision and photos.');
		} finally {
			setIsSavingRecommendation(false);
		}
	};

	const productType = (planInfo?.plan?.productType || planInfo?.protocol?.productType || 'SATL').toUpperCase();
	const columns = productType === 'FATL' ? FATL_COLUMNS : SATL_COLUMNS;

	const getDatesArray = (startStr: string, endStr: string) => {
		if (!startStr || !endStr) return [];
		const dates: string[] = [];
		const start = new Date(startStr);
		const end = new Date(endStr);
		if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];

		let curr = new Date(start);
		let safety = 0;
		while (curr <= end && safety < 1000) {
			dates.push(curr.toISOString().split('T')[0]);
			curr.setDate(curr.getDate() + 1);
			safety++;
		}
		return dates;
	};

	const datesList = planInfo
		? getDatesArray(planInfo.plan.startDate, planInfo.plan.endDate)
		: [];

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
		let val = '';
		if (tempValues[cellKey] !== undefined) {
			val = tempValues[cellKey];
		} else {
			val = cellData[cellKey] || '';
		}
		return val.toUpperCase();
	};

	const handleCellChange = (dateStr: string, colId: string, val: string) => {
		const cellKey = `${dateStr}_${colId}`;
		setTempValues(prev => ({ ...prev, [cellKey]: val.toUpperCase() }));
	};

	const handleCellBlur = async (dateStr: string, colId: string, val: string) => {
		if (!planKey) return;
		const cellKey = `${dateStr}_${colId}`;
		const upperVal = val.toUpperCase();

		const updatedCellData = { ...cellData, [cellKey]: upperVal };

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

		const dateData: { [key: string]: string } = {};
		columns.forEach(col => {
			const k = `${dateStr}_${col.id}`;
			const cellVal = updatedCellData[k] || '';
			if (cellVal) {
				dateData[col.id] = cellVal.toUpperCase();
			}
		});

		try {
			await upsertChecksheetEntry(planKey, dateStr, dateData)();
		} catch (error) {
			console.error('Failed to sync checksheet entry with database:', error);
		}
	};

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
			return; 
		}

		e.preventDefault();

		let safety = 0;
		while (safety < 20) {
			safety++;
			if (targetDateIndex < 0 || targetDateIndex >= datesList.length || targetColIndex < 0 || targetColIndex >= columns.length) {
				break; 
			}

			const targetId = `cell-${targetDateIndex}-${targetColIndex}`;
			const el = document.getElementById(targetId) as HTMLInputElement | null;
			if (el && !el.disabled) {
				el.focus();
				el.select();
				break;
			}

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
		return platforms.map((pNum: number) => `S${plan.stationNo}-P${pNum}`).join(', ');
	};

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
						overflow: visible !important;
						max-height: none !important;
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
						display: block !important;
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

			<div className="min-h-screen bg-[#f8fafc] text-zinc-900 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 overflow-y-auto">
				<div className="flex flex-row justify-between items-center no-print shrink-0">
					<button
						onClick={() => navigate('/inspector/daily-checksheet')}
						className="flex items-center gap-2 text-xs font-bold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 px-3.5 py-2 rounded-xl shadow-sm transition-colors cursor-pointer border-none outline-none"
					>
						<ArrowLeft className="w-4 h-4" />
						<span>Back to Test Queue</span>
					</button>

					<div className="flex items-center gap-3">
						<span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
							Tip: Cell inputs save to database on blur
						</span>
						<button
							type="button"
							onClick={() => handleOpenRecommendationModal('PASSED')}
							className={`flex items-center gap-1.5 text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer border-none outline-none active:scale-95 ${inspectorStatus === 'PASSED'
									? 'bg-emerald-700 text-white ring-2 ring-emerald-300'
									: 'bg-emerald-600 hover:bg-emerald-700 text-white'
								}`}
						>
							<CheckCircle2 className="w-4 h-4" />
							<span>{inspectorStatus === 'PASSED' ? 'Passed (Edit)' : 'Pass Test'}</span>
						</button>
						<button
							type="button"
							onClick={() => handleOpenRecommendationModal('FAILED')}
							className={`flex items-center gap-1.5 text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer border-none outline-none active:scale-95 ${inspectorStatus === 'FAILED'
									? 'bg-rose-700 text-white ring-2 ring-rose-300'
									: 'bg-rose-600 hover:bg-rose-700 text-white'
								}`}
						>
							<XCircle className="w-4 h-4" />
							<span>{inspectorStatus === 'FAILED' ? 'Failed (Edit)' : 'Fail Test'}</span>
						</button>

						<button
							onClick={triggerPrint}
							className="flex items-center gap-2 text-xs font-bold text-white bg-[#11236a] hover:bg-[#0c1a52] px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer border-none outline-none"
						>
							<Printer className="w-4 h-4" />
							<span>Print Sheet</span>
						</button>
					</div>
				</div>
				<div
					id="printable-checksheet"
					className="bg-white border border-zinc-300 rounded-[28px] p-4 sm:p-8 shadow-xl flex-1 flex flex-col gap-6"
				>
					<div className="border border-zinc-900 grid grid-cols-4 text-zinc-900 shrink-0">
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
					<div className="border-x border-b border-zinc-900 -mt-6 grid grid-cols-3 text-zinc-900 text-xs font-bold shrink-0">
						<div className="col-span-2 divide-y divide-zinc-900">
							<div className="grid grid-cols-3 divide-x divide-zinc-900">
								<span className="p-2.5 text-zinc-500 uppercase tracking-wider text-[9px]">Request & Sample ID</span>
								<span className="p-2.5 col-span-2 text-zinc-900 uppercase font-black">
									{(() => {
										const sampleIndex = planInfo.plan.sampleIndex;
										const inspection = planInfo.request?.sampleInspections?.find(
											(si: any) => Number(si.sampleIndex) === sampleIndex
										);
										return inspection?.allottedId || `REQ-${planInfo.request?.id}-S${String(sampleIndex + 1).padStart(2, '0')}`;
									})()}
								</span>
							</div>
							<div className="grid grid-cols-3 divide-x divide-zinc-900">
								<span className="p-2.5 text-zinc-500 uppercase tracking-wider text-[9px]">Serial Number</span>
								<span className="p-2.5 col-span-2 text-zinc-900 uppercase font-black">{planInfo.request?.serialNumber || 'N/A'}</span>
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
					<div className="overflow-x-auto overflow-y-auto border border-zinc-900 flex-1 min-h-[350px]">
						<table className="min-w-full border-collapse text-left">
							<thead className="sticky top-0 z-10 bg-zinc-100 shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">
								<tr className="bg-zinc-100 border-b border-zinc-900 text-zinc-800 text-[10px] font-bold uppercase tracking-wider">
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
															autoComplete="off"
															className={`w-full bg-transparent text-center font-bold text-xs border-none outline-none rounded p-1 transition-all ${isCalculated
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
			{isRecommendationModalOpen && (
				<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsRecommendationModalOpen(false)}>
					<div
						className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 border border-zinc-200 animate-fadeIn"
						onClick={e => e.stopPropagation()}
					>
						<div className="flex items-center justify-between border-b border-zinc-100 pb-3">
							<div>
								<h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
									<Clipboard className="w-5 h-5 text-indigo-600" />
									<span>Test Completion Recommendation</span>
								</h3>
								<p className="text-xs text-zinc-500 font-medium mt-0.5">
									Submit outcome recommendation and evidence photos to Lab Manager.
								</p>
							</div>
							<button
								onClick={() => setIsRecommendationModalOpen(false)}
								className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
							>
								<X className="w-5 h-5" />
							</button>
						</div>
						<div className="flex items-center justify-between bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200/60">
							<span className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Outcome Recommendation:</span>
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => setModalDecision('PASSED')}
									className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border cursor-pointer ${modalDecision === 'PASSED'
											? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
											: 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
										}`}
								>
									<CheckCircle2 className="w-4 h-4" />
									<span>PASSED</span>
								</button>

								<button
									type="button"
									onClick={() => setModalDecision('FAILED')}
									className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border cursor-pointer ${modalDecision === 'FAILED'
											? 'bg-rose-600 text-white border-rose-600 shadow-sm'
											: 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
										}`}
								>
									<XCircle className="w-4 h-4" />
									<span>FAILED</span>
								</button>
							</div>
						</div>
						<div className="space-y-1.5">
							<label className="text-xs font-bold text-zinc-700">Inspector Observations / Remarks</label>
							<textarea
								value={inspectorRemarks}
								onChange={(e) => setInspectorRemarks(e.target.value)}
								placeholder="Enter observations or comments for the Lab Manager..."
								rows={3}
								className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs font-semibold text-zinc-800 outline-none focus:border-indigo-600 transition-all resize-none"
							/>
						</div>
						<div className="space-y-2">
							<label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
								<Upload className="w-3.5 h-3.5 text-indigo-600" />
								<span>Upload Test / Evidence Photos</span>
							</label>
							<label className="border-2 border-dashed border-zinc-200 hover:border-indigo-500 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer bg-zinc-50/50 hover:bg-indigo-50/30 transition-all">
								<Upload className="w-6 h-6 text-zinc-400 mb-1" />
								<span className="text-xs font-bold text-zinc-700">Click to select photos</span>
								<span className="text-[10px] text-zinc-400 mt-0.5">PNG, JPG, JPEG photos for manager review & report</span>
								<input
									type="file"
									accept="image/*"
									multiple
									onChange={handleImageFileSelect}
									className="hidden"
								/>
							</label>
							{uploadedPhotos.length > 0 && (
								<div className="flex flex-wrap items-center gap-2.5 pt-1 max-h-32 overflow-y-auto">
									{uploadedPhotos.map((imgSrc, idx) => (
										<div key={idx} className="relative group w-16 h-16 rounded-xl border border-zinc-200 overflow-hidden bg-zinc-100 shadow-sm shrink-0">
											<img src={imgSrc} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
											<button
												type="button"
												onClick={() => handleRemovePhoto(idx)}
												className="absolute top-0.5 right-0.5 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
											>
												<Trash2 className="w-3 h-3" />
											</button>
										</div>
									))}
								</div>
							)}
						</div>
						<div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
							<button
								type="button"
								onClick={() => setIsRecommendationModalOpen(false)}
								className="px-4 py-2 border border-zinc-200 text-zinc-650 hover:bg-zinc-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleSaveInspectionRecommendation}
								disabled={isSavingRecommendation}
								className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
							>
								<Save className="w-4 h-4" />
								<span>{isSavingRecommendation ? 'Submitting...' : 'Submit & Notify Manager'}</span>
							</button>
						</div>
					</div>
				</div>
			)}
			{previewPhotoModal && (
				<div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewPhotoModal(null)}>
					<div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2" onClick={e => e.stopPropagation()}>
						<button
							onClick={() => setPreviewPhotoModal(null)}
							className="absolute top-4 right-4 p-2 bg-zinc-900/80 text-white rounded-full hover:bg-zinc-900 transition-colors z-10 cursor-pointer"
						>
							<X className="w-5 h-5" />
						</button>
						<img src={previewPhotoModal} alt="Preview" className="max-w-full max-h-[80vh] object-contain rounded-xl" />
					</div>
				</div>
			)}
		</>
	);
}