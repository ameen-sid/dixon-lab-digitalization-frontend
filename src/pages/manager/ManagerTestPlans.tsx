import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clipboard, CheckCircle, AlertTriangle, X, Search, ChevronRight, FileText, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import Pagination from '../../components/Pagination';
import CustomSelect from '../../components/CustomSelect';

// Import operations
import { getTestTypes } from '../../services/operations/testTypeService';
import { getTestCategories } from '../../services/operations/testCategoryService';
import { getTestProtocols } from '../../services/operations/testProtocolService';
import { getPlatforms as getNormalPlatforms, reservePlatforms as reserveNormalPlatforms, releasePlatforms as releaseNormalPlatforms } from '../../services/operations/platformAvailabilityService';
import { getPlatforms as getNablPlatforms, reservePlatforms as reserveNablPlatforms, releasePlatforms as releaseNablPlatforms } from '../../services/operations/nablStationAvailabilityService';
import { getTestingEquipments, reserveEquipment, releaseEquipment } from '../../services/operations/testingEquipmentService';

interface ManagerTestPlansProps {
	requests: any[];
	selectedRequestId?: string;
	onUpdateStatus?: (id: string, status: string, remarks?: string) => Promise<any>;
	onRefreshRequests?: () => Promise<void>;
}

interface TestPlanForm {
	id?: number;
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

const INSPECTION_CHECKPOINTS = [
	{ id: 1, text: 'Is Sample Description same as written on Test Request Form?' },
	{ id: 2, text: 'Is Model / Identification same as written on Test Request Form?' },
	{ id: 3, text: 'Is Product Serial Number same as written on Test Request Form?' },
	{ id: 4, text: 'Is Label available on sample?' },
	{ id: 5, text: 'Is Sample Rating same as written on Test Request Form?' },
	{ id: 6, text: 'Is Trade Mark / Brand same as written on Test Request Form?' },
	{ id: 7, text: 'Is User Manual provided along with Test Request Form?' },
	{ id: 8, text: 'Is sample free from damage?' },
	{ id: 9, text: 'Is all accessories received with sample?' }
];

const getLocalTodayStr = () => {
	const d = new Date();
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};

export default function ManagerTestPlans({ requests, selectedRequestId, onUpdateStatus, onRefreshRequests }: ManagerTestPlansProps) {
	const navigate = useNavigate();

	// Resolve selected request from dynamic route parameter prop
	const selectedReq = selectedRequestId
		? requests.find(r => String(r.id) === String(selectedRequestId))
		: null;

	const isAllInspectionFailed = (() => {
		if (!selectedReq) return false;
		const qty = selectedReq.sampleQty || 1;
		let failedCount = 0;
		for (let i = 0; i < qty; i++) {
			const realReport = (selectedReq.sampleInspections || []).find((r: any) => Number(r.sampleIndex) === i);
			if (realReport && realReport.status === 'FAILED') {
				failedCount++;
			}
		}
		return failedCount === qty;
	})();

	// Filter requests to those inspected (status INSPECTION_COMPLETED, UNDER_TESTING, or other testing states)
	const inspectedRequests = requests.filter((r: any) =>
		[
			'INSPECTION_COMPLETED',
			'UNDER_TEST',
			'UNDER_TESTING',
			'TESTING_PASSED',
			'TESTING_FAILED',
			'TESTING_PARTIAL',
			'TESTING_COMPLETED',
			'COMPLETED',
			'FAILED',
			'RETEST',
			'INSPECTION_FAILED',
			'PASS',
			'FAIL',
			'PARTIAL'
		].includes((r.status || '').toUpperCase())
	);

	// Component states
	const [activeSampleIndex, setActiveSampleIndex] = useState<number | null>(null);
	const [activeInspectionReport, setActiveInspectionReport] = useState<any | null>(null);
	const [activeInspectionSampleIndex, setActiveInspectionSampleIndex] = useState<number | null>(null);

	// Search & Pagination states
	const [searchQuery, setSearchQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState('ALL');
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(5);

	// Database options states
	const [testTypes, setTestTypes] = useState<any[]>([]);
	const [testCategories, setTestCategories] = useState<any[]>([]);
	const [testProtocols, setTestProtocols] = useState<any[]>([]);
	const [normalPlatforms, setNormalPlatforms] = useState<any[]>([]);
	const [nablPlatforms, setNablPlatforms] = useState<any[]>([]);
	const [equipments, setEquipments] = useState<any[]>([]);

	const savedPlans = useMemo(() => {
		const plansMap: { [key: string]: any[] } = {};
		for (const req of requests) {
			if (req.testPlans) {
				for (const p of req.testPlans) {
					let platformNosParsed: number[] = [];
					if (p.platformNos) {
						try {
							const parsed = typeof p.platformNos === 'string' ? JSON.parse(p.platformNos) : p.platformNos;
							platformNosParsed = (Array.isArray(parsed) ? parsed : [parsed]).map(Number).filter(n => !isNaN(n));
						} catch (e) {
							platformNosParsed = [];
						}
					}
					const key = `${req.id}-sample-${p.sampleIndex}`;
					if (!plansMap[key]) plansMap[key] = [];
					plansMap[key].push({
						id: p.id,
						testTypeId: String(p.testTypeId),
						testCategoryId: String(p.testCategoryId),
						productType: p.productType || 'FATL',
						stationNo: p.stationNo || 1,
						platformNos: platformNosParsed,
						testProtocolId: String(p.testProtocolId),
						referenceStandard: p.referenceStandard || '',
						numberOfDays: p.numberOfDays || 9,
						startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : '',
						endDate: p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : '',
						remarks: p.remarks || '',
						equipmentId: String(p.equipmentId || ''),
						evaluationStatus: p.evaluationStatus || undefined,
						evaluationRemarks: p.evaluationRemarks || undefined
					});
				}
			}
		}
		return plansMap;
	}, [requests]);

	const isSubmittedToHead = selectedReq ? (selectedReq.remarks || '').includes('Submitted to Head') : false;

	const canSubmitToHead = (() => {
		if (!selectedReq) return false;
		if (isAllInspectionFailed) return false;
		const qty = selectedReq.sampleQty || 1;

		for (let i = 0; i < qty; i++) {
			const plansForSample = savedPlans[`${selectedReq.id}-sample-${i}`] || [];
			if (plansForSample.length === 0) return false;
			const hasEvaluated = plansForSample.some(
				(p: any) => p.evaluationStatus === 'PASSED' || p.evaluationStatus === 'FAILED'
			);
			if (!hasEvaluated) return false;
		}
		return true;
	})();

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
		startDate: getLocalTodayStr(),
		endDate: '',
		remarks: '',
		equipmentId: ''
	});

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

	// Helpers to determine test type context
	const isNabl = testTypes.find(t => String(t.id) === String(form.testTypeId))?.name?.toLowerCase().includes('nabl') || false;
	const isReliability = testTypes.find(t => String(t.id) === String(form.testTypeId))?.name?.toLowerCase().includes('reliability') || false;

	const isPlatformReservedByOtherPlan = (stationNo: number, platformNo: number, currentPlanId?: number, checkNabl = false) => {
		for (const req of requests) {
			if (req.testPlans) {
				for (const p of req.testPlans) {
					if (currentPlanId && p.id === currentPlanId) continue;

					// Determine if this test plan is NABL
					const pIsNabl = testTypes.find(t => String(t.id) === String(p.testTypeId))?.name?.toLowerCase().includes('nabl') || false;
					if (pIsNabl !== checkNabl) continue;

					let platformNosParsed: number[] = [];
					if (p.platformNos) {
						try {
							const parsed = typeof p.platformNos === 'string' ? JSON.parse(p.platformNos) : p.platformNos;
							platformNosParsed = (Array.isArray(parsed) ? parsed : [parsed]).map(Number).filter(n => !isNaN(n));
						} catch (e) {
							platformNosParsed = [];
						}
					}

					if (Number(p.stationNo) === stationNo && platformNosParsed.includes(platformNo)) {
						return true;
					}
				}
			}
		}
		return false;
	};

	// Fetch dynamic data parameters
	const loadDbOptions = async () => {
		try {
			const types = await getTestTypes()();
			const categories = await getTestCategories()();
			const protocols = await getTestProtocols()();
			const normalPlts = await getNormalPlatforms()();
			const nablPlts = await getNablPlatforms()();
			const eqps = await getTestingEquipments({ limit: 100 })();

			setTestTypes(types || []);
			setTestCategories(categories || []);
			setTestProtocols(protocols || []);
			setNormalPlatforms(normalPlts || []);
			setNablPlatforms(nablPlts || []);
			setEquipments(eqps || []);

			// Do not auto-prefill equipment so it remains optional unless explicitly chosen
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
	const handleOpenPlanForm = async (sampleIndex: number, planToEdit?: any) => {
		if (!selectedReq) return;
		setActiveSampleIndex(sampleIndex);

		// Synchronize fresh real-time platform & equipment bookings
		try {
			const normalPlts = await getNormalPlatforms()();
			setNormalPlatforms(normalPlts || []);
			const nablPlts = await getNablPlatforms()();
			setNablPlatforms(nablPlts || []);
			const eqps = await getTestingEquipments({ limit: 100 })();
			setEquipments(eqps || []);
		} catch (e) {
			console.error('Failed to refresh live platforms & equipment status:', e);
		}

		if (planToEdit) {
			setForm({
				id: planToEdit.id,
				testTypeId: planToEdit.testTypeId,
				testCategoryId: planToEdit.testCategoryId,
				productType: planToEdit.productType || 'FATL',
				stationNo: Number(planToEdit.stationNo) || 1,
				platformNos: Array.isArray(planToEdit.platformNos) ? planToEdit.platformNos.map(Number) : [],
				testProtocolId: planToEdit.testProtocolId,
				referenceStandard: planToEdit.referenceStandard || '',
				numberOfDays: Number(planToEdit.numberOfDays) || 9,
				startDate: planToEdit.startDate || getLocalTodayStr(),
				endDate: '', // Will be calculated
				remarks: planToEdit.remarks || '',
				equipmentId: planToEdit.equipmentId ? String(planToEdit.equipmentId) : '',
				evaluationStatus: planToEdit.evaluationStatus,
				evaluationRemarks: planToEdit.evaluationRemarks
			});
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
				startDate: getLocalTodayStr(),
				endDate: '',
				remarks: '',
				equipmentId: defaultEq ? String(defaultEq.id) : ''
			});
		}
	};

	// Delete test plan from database and release resources
	const handleDeletePlan = async (planId: number, stationNo?: number, platformNos?: number[], equipmentId?: string, planTestTypeId?: string) => {
		if (!selectedReq) return;
		if (!window.confirm('Are you sure you want to delete this test plan?')) return;

		try {
			const planIsNabl = planTestTypeId && testTypes.find(t => String(t.id) === String(planTestTypeId))?.name?.toLowerCase().includes('nabl') || false;
			const planIsReliability = planTestTypeId && testTypes.find(t => String(t.id) === String(planTestTypeId))?.name?.toLowerCase().includes('reliability') || false;

			if (platformNos && platformNos.length > 0 && stationNo) {
				const releaseOp = planIsNabl
					? releaseNablPlatforms(Number(stationNo), platformNos.map(Number))
					: releaseNormalPlatforms(Number(stationNo), platformNos.map(Number));
				await releaseOp();
			}
			if (equipmentId && !planIsReliability) {
				const releaseEqOp = releaseEquipment(Number(equipmentId));
				await releaseEqOp();
			}

			const res = await fetch(`/api/v1/test-requests/${selectedReq.id}/test-plans/${planId}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`
				}
			});

			if (!res.ok) {
				throw new Error('Failed to delete test plan');
			}

			toast.success('Test plan deleted successfully.');
			if (onRefreshRequests) {
				await onRefreshRequests();
			}
		} catch (error) {
			console.error('Failed to delete test plan:', error);
			toast.error('Failed to delete test plan.');
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

		// Validation checks based on Test Type
		if (isReliability) {
			if (form.platformNos.length === 0) {
				toast.error('Platform selection is mandatory for Reliability test plans.');
				return;
			}
			if (form.platformNos.length > 1) {
				toast.error('Only one platform selection is allowed for Reliability test plans.');
				return;
			}
		} else if (isNabl) {
			if (form.platformNos.length === 0) {
				toast.error('Platform/Station selection is mandatory for NABL test plans.');
				return;
			}
			if (!form.equipmentId) {
				toast.error('Assigned R&D Equipment is mandatory for NABL test plans.');
				return;
			}
		} else {
			// Other test types (e.g. Performance)
			if (form.platformNos.length > 1) {
				toast.error('Only one platform selection is allowed for this test type.');
				return;
			}
			if (!form.equipmentId) {
				toast.error('Assigned R&D Equipment is mandatory for this test type.');
				return;
			}
		}

		try {
			const reqIdPrefix = (selectedReq.requestId && String(selectedReq.requestId).startsWith('REQ-'))
				? selectedReq.requestId
				: `REQ-${selectedReq.requestId || selectedReq.id}`;

			// Release any previously reserved platforms/equipments for this specific test plan first
			const existing = form.id ? (savedPlans[`${selectedReq.id}-sample-${activeSampleIndex}`] || []).find((p: any) => p.id === form.id) : null;
			if (existing) {
				if (existing.platformNos && existing.platformNos.length > 0) {
					const existingIsNabl = testTypes.find(t => String(t.id) === String(existing.testTypeId))?.name?.toLowerCase().includes('nabl') || false;
					const releaseOp = existingIsNabl
						? releaseNablPlatforms(Number(existing.stationNo), existing.platformNos.map(Number))
						: releaseNormalPlatforms(Number(existing.stationNo), existing.platformNos.map(Number));
					await releaseOp();
				}
				if (existing.equipmentId) {
					const releaseEqOp = releaseEquipment(Number(existing.equipmentId));
					await releaseEqOp();
				}
			}

			// 1. Reserve platform channels in database for this sample if assigned
			if (form.platformNos.length > 0) {
				const resOp = isNabl
					? reserveNablPlatforms(
						Number(form.stationNo),
						form.platformNos.map(Number),
						Number(selectedReq.id),
						`${reqIdPrefix} (Sample #${activeSampleIndex + 1})`,
						selectedReq.modelNo,
						form.endDate
					)
					: reserveNormalPlatforms(
						Number(form.stationNo),
						form.platformNos.map(Number),
						Number(selectedReq.id),
						`${reqIdPrefix} (Sample #${activeSampleIndex + 1})`,
						selectedReq.modelNo,
						form.endDate
					);
				await resOp();
			}

			// 2. Reserve physical R&D Equipment in database if selected and permitted (not reliability)
			if (form.equipmentId && !isReliability) {
				const eqResOp = reserveEquipment(
					Number(form.equipmentId),
					Number(selectedReq.id),
					`${reqIdPrefix} (Sample #${activeSampleIndex + 1})`,
					selectedReq.modelNo,
					form.endDate
				);
				await eqResOp();
			}

			// 3. Save to database
			const testPlanData = {
				id: form.id ? Number(form.id) : undefined,
				sampleIndex: activeSampleIndex,
				testTypeId: Number(form.testTypeId),
				testCategoryId: Number(form.testCategoryId),
				testProtocolId: Number(form.testProtocolId),
				productType: form.productType,
				stationNo: Number(form.stationNo),
				platformNos: form.platformNos,
				equipmentId: (form.equipmentId && !isReliability) ? Number(form.equipmentId) : null,
				numberOfDays: Number(form.numberOfDays),
				startDate: form.startDate,
				endDate: form.endDate,
				remarks: form.remarks,
			};

			const planRes = await fetch(`/api/v1/test-requests/${selectedReq.id}/test-plans`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem('token')}`
				},
				body: JSON.stringify(testPlanData)
			});

			if (!planRes.ok) {
				throw new Error('Failed to save test plan to database');
			}

			// 4. Perform parent status sync if callback is provided
			if (onUpdateStatus) {
				await onUpdateStatus(
					selectedReq.id,
					'UNDER_TESTING',
					undefined
				);
			}

			if (onRefreshRequests) {
				await onRefreshRequests();
			}

			toast.success(`Test plan for Sample #${activeSampleIndex + 1} saved, platforms & equipment reserved!`);
			setActiveSampleIndex(null);
		} catch (error) {
			console.error('Failed to reserve resources for test plan:', error);
			toast.error('Failed to reserve required platform or equipment resources.');
		}
	};


	// Search and Paginate filters
	const filteredRequests = inspectedRequests.filter(r => {
		// 1. Search Match
		const idStr = String(r.id).toLowerCase();
		const matchSearch = r.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			idStr.includes(searchQuery.toLowerCase()) ||
			(r.requestId && r.requestId.toLowerCase().includes(searchQuery.toLowerCase())) ||
			r.modelNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(r.sampleDescription && r.sampleDescription.toLowerCase().includes(searchQuery.toLowerCase())) ||
			(r.testType?.name && r.testType.name.toLowerCase().includes(searchQuery.toLowerCase()));

		// 2. Status Match
		const isCompleted = ['TESTING_PASSED', 'PASS', 'COMPLETED', 'TESTING_PARTIAL', 'PARTIAL', 'TESTING_COMPLETED'].includes((r.status || '').toUpperCase());
		const isFailed = ['TESTING_FAILED', 'FAIL', 'FAILED'].includes((r.status || '').toUpperCase());
		const isTesting = ['UNDER_TESTING', 'UNDER_TEST'].includes((r.status || '').toUpperCase());
		const isSubmittedToHead = (r.remarks || '').includes('Submitted to Head');
		const isInspectionFailed = (r.status || '').toUpperCase() === 'INSPECTION_FAILED' || isSubmittedToHead;
		const isPending = !isCompleted && !isFailed && !isTesting && !isInspectionFailed;

		let matchStatus = true;
		if (statusFilter === 'PENDING') {
			matchStatus = isPending;
		} else if (statusFilter === 'UNDER_TEST') {
			matchStatus = isTesting;
		} else if (statusFilter === 'COMPLETED') {
			matchStatus = isCompleted;
		} else if (statusFilter === 'FAILED') {
			matchStatus = isFailed;
		} else if (statusFilter === 'INSPECTION_FAILED') {
			matchStatus = isInspectionFailed;
		}

		// 3. Date Range Match
		let matchDate = true;
		const reqDate = r.approvedDate;
		if (startDate) {
			matchDate = matchDate && reqDate >= startDate;
		}
		if (endDate) {
			matchDate = matchDate && reqDate <= endDate;
		}

		return matchSearch && matchStatus && matchDate;
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
					{/* Top Search & Advanced Filters Toolbar */}
					<div className="bg-white border border-zinc-200/50 rounded-2xl p-4 shadow-sm space-y-4">
						<div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
							{/* Search input */}
							<div className="relative flex-1">
								<Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
								<input
									type="text"
									placeholder="Search by brand, ID, model, or description..."
									value={searchQuery}
									onChange={(e) => {
										setSearchQuery(e.target.value);
										setCurrentPage(1);
									}}
									className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-zinc-800 placeholder-zinc-400 outline-none focus:bg-white focus:border-[#11236a] transition-all"
								/>
								{searchQuery && (
									<button
										onClick={() => {
											setSearchQuery('');
											setCurrentPage(1);
										}}
										className="absolute right-3 top-2.5 text-zinc-400 hover:text-red-500 bg-transparent border-none cursor-pointer outline-none"
									>
										<X className="w-4 h-4" />
									</button>
								)}
							</div>

							{/* Advanced status & date filters */}
							<div className="flex flex-wrap items-center gap-3">
								<CustomSelect
									value={statusFilter}
									onChange={(val) => {
										setStatusFilter(val);
										setCurrentPage(1);
									}}
									options={[
										{ value: 'ALL', label: 'All Statuses' },
										{ value: 'PENDING', label: 'Pending Setup' },
										{ value: 'UNDER_TEST', label: 'Under Testing' },
										{ value: 'COMPLETED', label: 'Completed' },
										{ value: 'FAILED', label: 'Failed' },
										{ value: 'INSPECTION_FAILED', label: 'Inspection Failed' }
									]}
									className="w-44 shrink-0"
								/>

								<div className="flex items-center gap-2 bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-1 shrink-0">
									<span className="text-[9px] font-extrabold text-zinc-700 uppercase tracking-wider">From</span>
									<input
										type="date"
										value={startDate}
										onChange={e => {
											setStartDate(e.target.value);
											setCurrentPage(1);
										}}
										className="bg-transparent border-none text-xs font-semibold text-zinc-850 outline-none p-1 cursor-pointer"
									/>
									{startDate && (
										<button
											onClick={() => {
												setStartDate('');
												setCurrentPage(1);
											}}
											className="text-zinc-400 hover:text-red-550 border-none bg-transparent cursor-pointer"
										>
											<X className="w-3.5 h-3.5" />
										</button>
									)}
								</div>

								<div className="flex items-center gap-2 bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-1 shrink-0">
									<span className="text-[9px] font-extrabold text-zinc-700 uppercase tracking-wider">To</span>
									<input
										type="date"
										value={endDate}
										onChange={e => {
											setEndDate(e.target.value);
											setCurrentPage(1);
										}}
										className="bg-transparent border-none text-xs font-semibold text-zinc-850 outline-none p-1 cursor-pointer"
									/>
									{endDate && (
										<button
											onClick={() => {
												setEndDate('');
												setCurrentPage(1);
											}}
											className="text-zinc-400 hover:text-red-550 border-none bg-transparent cursor-pointer"
										>
											<X className="w-3.5 h-3.5" />
										</button>
									)}
								</div>
							</div>
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
											<th className="py-4 px-6">Test Type</th>
											<th className="py-4 px-6">Inspection Metrics</th>
											<th className="py-4 px-6">Planning Status</th>
											<th className="py-4 px-6 text-right">Action</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-750">
										{paginatedRequests.map((req) => {
											const qty = req.sampleQty || 1;

											const testTypeName = (req.testType?.name || '').toLowerCase();
											const isReliabilityReq = testTypeName.includes('reliability');

											let physicalPassed = 0;
											let physicalFailed = 0;
											let testingPassed = 0;
											let testingFailed = 0;
											let plansCreated = 0;

											for (let i = 0; i < qty; i++) {
												const planList = savedPlans[`${req.id}-sample-${i}`] || [];
												const report = (req.sampleInspections || []).find(
													(r: any) => Number(r.sampleIndex) === i
												);

												if (req.status === 'RETEST') {
													physicalPassed++;
												} else if (report) {
													const reportStatus = (report.status || '').toUpperCase();
													if (
														reportStatus === 'PASSED' ||
														(!isReliabilityReq && reportStatus === 'UNDER_REVIEW')
													) {
														physicalPassed++;
													} else if (reportStatus === 'FAILED') {
														physicalFailed++;
													}
												} else if (planList.length > 0) {
													physicalPassed++;
												}

												if (planList.length > 0) {
													plansCreated += planList.length;
													planList.forEach((plan: any) => {
														if (plan.evaluationStatus === 'PASSED') {
															testingPassed++;
														} else if (plan.evaluationStatus === 'FAILED') {
															testingFailed++;
														}
													});
												}
											}

											const isAllPlanned = plansCreated >= physicalPassed;

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
													<td className="py-4 px-6 text-zinc-655 max-w-xs truncate">{req.testType?.name || 'General'}</td>
													<td className="py-4 px-6">
														<div className="flex flex-wrap gap-1.5 items-center">
															<span className="text-[9px] font-bold px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded">
																Qty: {qty}
															</span>
															{req.status === 'RETEST' ? (
																<span className="text-[9px] font-black px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded border border-rose-200 animate-pulse uppercase">
																	RETEST
																</span>
															) : (
																<>
																	{physicalPassed > 0 && (
																		<span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded border border-emerald-100" title="Physical Inspection Passed">
																			Insp Passed: {physicalPassed}
																		</span>
																	)}
																	{physicalFailed > 0 && (
																		<span className="text-[9px] font-bold px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded border border-rose-100" title="Physical Inspection Failed">
																			Insp Failed: {physicalFailed}
																		</span>
																	)}
																	{testingPassed > 0 && (
																		<span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded border border-emerald-200" title="Testing Evaluated Passed">
																			Test Passed: {testingPassed}
																		</span>
																	)}
																	{testingFailed > 0 && (
																		<span className="text-[9px] font-bold px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded border border-rose-200" title="Testing Evaluated Failed">
																			Test Failed: {testingFailed}
																		</span>
																	)}
																</>
															)}
														</div>
													</td>
													<td className="py-4 px-6">
														{physicalPassed === 0 ? (
															(req.status === 'INSPECTION_COMPLETED' || (req.remarks || '').includes('Submitted to Head')) ? (
																<span className="text-[9px] font-bold px-2.5 py-0.5 bg-zinc-100 text-zinc-600 border border-zinc-200 rounded-full uppercase tracking-wider">
																	Submitted
																</span>
															) : (
																<span className="text-[9px] font-bold px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-150 rounded-full uppercase tracking-wider">
																	Inspection Failed
																</span>
															)
														) : req.status === 'INSPECTION_COMPLETED' ? (
															<span className="text-[9px] font-bold px-2.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full uppercase tracking-wider inline-flex items-center gap-1 shrink-0">
																Pending Plan Creation ({plansCreated}/{physicalPassed})
															</span>
														) : req.status === 'INSPECTION_FAILED' ? (
															<span className="text-[9px] font-bold px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-150 rounded-full uppercase tracking-wider">
																Inspection Failed
															</span>
														) : req.status === 'RETEST' ? (
															<span className="text-[9px] font-bold px-2.5 py-0.5 bg-orange-50 text-orange-700 border border-orange-100 rounded-full uppercase tracking-wider">
																Pending Reconfigure Retest
															</span>
														) : req.status === 'TESTING_FAILED' || req.status === 'FAILED' ? (
															<span className="text-[9px] font-bold px-2.5 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 rounded-full uppercase tracking-wider">
																Testing Failed
															</span>
														) : req.status === 'TESTING_PARTIAL' || req.status === 'PARTIAL' ? (
															<span className="text-[9px] font-bold px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-250 rounded-full uppercase tracking-wider">
																Testing Partial
															</span>
														) : req.status === 'TESTING_PASSED' || req.status === 'COMPLETED' || req.status === 'TESTING_COMPLETED' ? (
															<span className="text-[9px] font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-250 rounded-full uppercase tracking-wider">
																Testing Passed
															</span>
														) : isAllPlanned ? (
															<span className="text-[9px] font-bold px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full uppercase tracking-wider">
																Plan Created
															</span>
														) : (
															<span className="text-[9px] font-bold px-2.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full uppercase tracking-wider inline-flex items-center gap-1 shrink-0">
																Awaiting Plan ({plansCreated}/{physicalPassed})
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
								{selectedReq.status === 'RETEST' && (
									<div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start gap-2.5">
										<AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
										<div>
											<p className="text-[10px] font-bold text-rose-800 uppercase tracking-wide">Retest Authorized</p>
											<p className="text-[9px] text-rose-500 font-semibold mt-0.5">This request failed previous testing. Head of Lab authorized a complete retest.</p>
										</div>
									</div>
								)}
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
										<p className="font-bold text-[#11236a] mt-1">
											{selectedReq.testMethodRef}
											<span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-extrabold uppercase ml-2 inline-block">
												{selectedReq.testType?.name || 'General'}
											</span>
										</p>
									</div>
									<div>
										<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Quantity</p>
										<p className="font-bold text-zinc-800 mt-1">{selectedReq.sampleQty || 1} Units</p>
									</div>
									<div>
										<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Family Model</p>
										<p className="font-bold text-zinc-800 mt-1">{selectedReq.familyModel || 'None'}</p>
									</div>
									<div>
										<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Serial Number</p>
										<p className="font-bold text-zinc-800 mt-1">{selectedReq.serialNumber || 'None'}</p>
									</div>
									<div>
										<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Product Rating</p>
										<p className="font-bold text-zinc-800 mt-1">{selectedReq.productRating || 'Not Specified'}</p>
									</div>
									{selectedReq.attachments && selectedReq.attachments.length > 0 && (
										<div className="space-y-2 mt-2 pt-2 border-t border-zinc-100">
											<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Attachments ({selectedReq.attachments.length})</p>
											<div className="space-y-1.5">
												{selectedReq.attachments.map((file: any) => (
													<a
														key={file.id}
														href={`/${(() => {
															const idx = file.filePath.toLowerCase().indexOf('uploads');
															return idx !== -1 ? file.filePath.substring(idx).replace(/\\/g, '/') : file.filePath.replace(/\\/g, '/');
														})()}`}
														target="_blank"
														rel="noopener noreferrer"
														className="flex items-center justify-between p-2 bg-zinc-50 hover:bg-zinc-100/70 border border-zinc-200 rounded-lg transition-all group cursor-pointer no-underline"
													>
														<div className="flex items-center gap-2 min-w-0">
															<FileText className="w-4 h-4 text-indigo-650 shrink-0" />
															<span className="text-[10px] font-bold text-zinc-800 truncate leading-snug">{file.fileName}</span>
														</div>
													</a>
												))}
											</div>
										</div>
									)}
								</div>
							</div>
							<div className="border-t border-zinc-100 mt-4 pt-3 space-y-2">
								<button
									onClick={() => navigate(`/manager/approved-requests/${selectedReq.id}`)}
									className="w-full py-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 hover:text-[#11236a] text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm active:scale-95"
								>
									<span>View More Details</span>
									<ChevronRight className="w-3.5 h-3.5" />
								</button>
								{selectedReq.status === 'RETEST' && (
									<button
										onClick={() => {
											navigate('/manager/capa-management', {
												state: {
													initialCapa: {
														relatedRequest: String(selectedReq.id),
														productName: `${selectedReq.brandName} ${selectedReq.modelNo}`,
														nonConformity: `Test failure observed under ${selectedReq.testMethodRef} testing cycles. Details: ${selectedReq.sampleDescription}`,
														rootCause: '',
														correctiveAction: '',
														preventiveAction: '',
														targetedDate: ''
													}
												}
											});
										}}
										className="w-full py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
									>
										<AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
										<span>Initiate CAPA Report</span>
									</button>
								)}
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
							</div>							<div className="divide-y divide-zinc-150/70">
								{(() => {
									const qty = selectedReq.sampleQty || 1;
									const list = [];

									for (let i = 0; i < qty; i++) {
										const report = (selectedReq.sampleInspections || []).find((r: any) => Number(r.sampleIndex) === i);
										const planList = savedPlans[`${selectedReq.id}-sample-${i}`] || [];
										list.push({
											index: i,
											report,
											planList
										});
									}

									return list.map(({ index, report, planList }) => {
										const sampleNo = index + 1;
										const isRetestOrTesting = ['RETEST', 'UNDER_TESTING', 'UNDER_TEST', 'TESTING_FAILED', 'TESTING_PASSED', 'FAILED', 'COMPLETED'].includes(selectedReq.status);
										const isFailed = report?.status === 'FAILED' && !isRetestOrTesting;
										const isPassed = report?.status === 'PASSED' || isRetestOrTesting;

										return (
											<div key={index} className="py-4 first:pt-0 last:pb-0 flex flex-col gap-4">
												{/* Sample Header & Inspection Status */}
												<div className="flex items-center justify-between border-b border-zinc-100 pb-2 flex-wrap gap-2">
													<div className="flex items-center gap-2">
														<span className="text-xs font-bold text-zinc-855">Sample #{sampleNo}</span>
														{report ? (
															<span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${report.status === 'PASSED'
																? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
																: report.status === 'UNDER_REVIEW'
																	? 'bg-amber-50 text-amber-700 border border-amber-100'
																	: 'bg-rose-50 text-rose-700 border border-rose-100'
																}`}>
																{report.status === 'PASSED'
																	? 'Inspection Passed'
																	: report.status === 'FAILED'
																		? 'Inspection Failed'
																		: report.status === 'UNDER_REVIEW'
																			? 'Report Submitted'
																			: report.status}
															</span>
														) : (
															<span className="text-[8px] font-extrabold px-1.5 py-0.5 bg-zinc-100 text-zinc-450 rounded uppercase tracking-wider">
																No Inspection Report
															</span>
														)}
													</div>
													{report && (
														<p className="text-[10px] text-zinc-555 font-semibold">
															Allotted Code: <span className="text-zinc-700 font-extrabold">{report.allottedId || 'N/A'}</span>
														</p>
													)}
												</div>

												{/* Test Plans List */}
												{isFailed ? (
													<div className="flex items-center gap-2">
														<span className="text-[10px] font-extrabold px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl flex items-center gap-1.5 shrink-0 border border-rose-150">
															<AlertTriangle className="w-3.5 h-3.5 shrink-0" />
															Plan Disabled - Sample Failed
														</span>
														<button
															onClick={() => {
																window.open(`/reports/preview?type=sample&key=${selectedReq.id}-sample-${index}`, '_blank');
															}}
															className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold rounded-xl text-[10px] flex items-center gap-1 border border-indigo-200 cursor-pointer shadow-sm active:scale-95 transition-all shrink-0"
														>
															<FileText className="w-3.5 h-3.5" />
															<span>View Details</span>
														</button>
													</div>
												) : (
													<div className="space-y-3">
														{planList.length > 0 ? (
															planList.map((plan: any) => {
																const todayStr = getLocalTodayStr();
																const isTesting = plan.startDate <= todayStr;
																const planTestType = testTypes.find(t => String(t.id) === String(plan.testTypeId));

																const hideEditTestPlanButton = plan.evaluationStatus === 'PASSED' || plan.evaluationStatus === 'FAILED';

																return (
																	<div key={plan.id} className="bg-zinc-50/50 border border-zinc-200/60 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-zinc-50">
																		<div className="space-y-1">
																			<div className="flex items-center gap-2 flex-wrap">
																				<span className="text-[10px] font-extrabold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
																					{planTestType?.name || 'General'}
																				</span>
																				<span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${plan.evaluationStatus === 'PASSED'
																					? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
																					: plan.evaluationStatus === 'FAILED'
																						? 'bg-rose-50 text-rose-700 border border-rose-100'
																						: isTesting
																							? 'bg-blue-50 text-blue-700 border border-blue-100 animate-pulse'
																							: 'bg-amber-50 text-amber-700 border border-amber-100'
																					}`}>
																					{plan.evaluationStatus === 'PASSED'
																						? 'Testing Passed'
																						: plan.evaluationStatus === 'FAILED'
																							? 'Testing Failed'
																							: isTesting
																								? 'Testing'
																								: 'Scheduled'}
																				</span>
																			</div>
																			<div className="text-[9px] text-zinc-600 font-bold space-y-0.5 mt-1">
																				<p>Product: {plan.productType} | Station Unit: S{plan.stationNo} (Platforms: {plan.platformNos.join(', ') || 'None'})</p>
																				{plan.equipmentId && (
																					<p>Equipment: {equipments.find(e => String(e.id) === String(plan.equipmentId))?.name || 'Assigned Equipment'}</p>
																				)}
																				<p>Duration: {plan.numberOfDays} Days ({formatDateToDMY(plan.startDate)} to {formatDateToDMY(plan.endDate)})</p>
																				{plan.remarks && (
																					<p className="italic text-zinc-500 font-medium">Remarks: {plan.remarks}</p>
																				)}
																			</div>
																		</div>

																		<div className="flex flex-wrap items-center gap-2 shrink-0">
																			{!hideEditTestPlanButton && (
																				<button
																					onClick={() => handleOpenPlanForm(index, plan)}
																					className="px-3 py-1.5 text-[10px] font-extrabold rounded-lg transition-all border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
																				>
																					<Clipboard className="w-3 h-3 shrink-0" />
																					Edit
																				</button>
																			)}

																			{!hideEditTestPlanButton && (
																				<button
																					onClick={() => handleDeletePlan(plan.id, Number(plan.stationNo), plan.platformNos, plan.equipmentId, plan.testTypeId)}
																					className="px-3 py-1.5 text-[10px] font-extrabold rounded-lg transition-all border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
																				>
																					Delete
																				</button>
																			)}

																			{(() => {
																				const isEvaluated = plan.evaluationStatus === 'PASSED' || plan.evaluationStatus === 'FAILED';
																				if (isEvaluated) {
																					const isReliabilityPlan = planTestType?.name?.toLowerCase().includes('reliability');
																					return (
																						<div className="flex items-center gap-2">
																							<button
																								onClick={() => window.open(`/reports/preview?type=plan&key=${selectedReq.id}-plan-${plan.id}`, '_blank')}
																								className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold rounded-lg text-[10px] flex items-center gap-1 border border-indigo-200 cursor-pointer shadow-sm active:scale-95 transition-all"
																							>
																								<FileText className="w-3 h-3" />
																								<span>Report</span>
																							</button>
																							{isReliabilityPlan && (
																								<button
																									onClick={() => handleDownloadTearDownExcel(plan, selectedReq)}
																									className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold rounded-lg text-[10px] flex items-center gap-1 border border-emerald-250 cursor-pointer shadow-sm active:scale-95 transition-all"
																								>
																									<FileText className="w-3 h-3" />
																									<span>Tear Down Report</span>
																								</button>
																							)}
																						</div>
																					);
																				}

																				const planReport = selectedReq.sampleInspections?.find(
																					(si: any) => si.testPlanId === plan.id
																				);
																				const planIsUnderReview = planReport?.status === 'UNDER_REVIEW';

																				const showEvaluate = isTesting || planIsUnderReview;
																				if (showEvaluate) {
																					return (
																						<button
																							onClick={() => navigate(`/manager/evaluate-checksheet/${selectedReq.id}-plan-${plan.id}`)}
																							className="px-3.5 py-1.5 text-[10px] font-extrabold rounded-lg transition-all outline-none border-none cursor-pointer flex items-center gap-1 shadow-sm bg-amber-600 hover:bg-amber-700 text-white active:scale-95"
																						>
																							Evaluate
																						</button>
																					);
																				}
																				return null;
																			})()}
																		</div>
																	</div>
																);
															})
														) : (
															<p className="text-[10px] text-zinc-400 italic">No active test plans configured for this sample.</p>
														)}

														{/* "+ Add Test Plan" button */}
														{isPassed && (
															<button
																onClick={() => handleOpenPlanForm(index)}
																className="mt-2 px-3 py-2 bg-[#11236a] hover:bg-[#0c1a52] text-white text-[10px] font-extrabold rounded-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1 border-none shadow-sm"
															>
																<span>+ Add Test Plan</span>
															</button>
														)}
													</div>
												)}
											</div>
										);
									});
								})()}
							</div>

							{/* Activation Footer */}
							<div className="border-t border-zinc-150 pt-5 flex items-center justify-end gap-3">
								{isAllInspectionFailed && ['INSPECTION_COMPLETED', 'INSPECTION_FAILED'].includes(selectedReq.status) && (
									(selectedReq.status === 'INSPECTION_COMPLETED' ||
										(selectedReq.remarks || '').includes('Submitted to Head') ||
										(selectedReq.remarks || '').includes('Approved by Head') ||
										(selectedReq.remarks || '').includes('Returned for Retest')) ? (
										<span className="text-xs font-bold text-zinc-500 bg-zinc-100 border border-zinc-200 px-4 py-2 rounded-xl">
											Submitted to Head Panel
										</span>
									) : (
										<button
											onClick={async () => {
												if (onUpdateStatus) {
													try {
														const remarksText = selectedReq.remarks ? `${selectedReq.remarks}` : '';
														const newRemarks = remarksText.includes('Submitted to Head') ? remarksText : `Submitted to Head. ${remarksText}`;
														await onUpdateStatus(selectedReq.id, 'INSPECTION_FAILED', newRemarks);
														toast.success('Failed request successfully submitted to Head Panel.');
														navigate('/manager/test-plans');
													} catch (e) {
														toast.error('Failed to submit request.');
													}
												}
											}}
											className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer outline-none shadow-sm active:scale-95 hover:scale-[1.01] border-none"
										>
											<CheckCircle className="w-4 h-4" />
											<span>Submit Failed Request</span>
										</button>
									)
								)}

								{!isAllInspectionFailed && (
									isSubmittedToHead ? (
										<span className="text-xs font-bold text-zinc-500 bg-zinc-100 border border-zinc-200 px-4 py-2 rounded-xl">
											Submitted to Head Panel
										</span>
									) : (
										canSubmitToHead && (
											<button
												onClick={async () => {
													if (onUpdateStatus) {
														try {
															const remarksText = selectedReq.remarks ? `${selectedReq.remarks}` : '';
															const newRemarks = remarksText.includes('Submitted to Head') ? remarksText : `Submitted to Head. ${remarksText}`;
															await onUpdateStatus(selectedReq.id, selectedReq.status, newRemarks);
															toast.success('Test reports successfully submitted to Head Panel.');
															navigate('/manager/test-plans');
														} catch (e) {
															toast.error('Failed to submit test reports.');
														}
													}
												}}
												className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer outline-none shadow-sm active:scale-95 hover:scale-[1.01] border-none"
											>
												<CheckCircle className="w-4 h-4" />
												<span>Submit to Head</span>
											</button>
										)
									)
								)}



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
								<div className="grid grid-cols-3 gap-3">
									{['SATL', 'FATL', 'FAFL'].map((pType) => {
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
								<label htmlFor="equipmentSelect" className="text-[10px] text-zinc-500 font-extrabold">
									Assign R&D Equipment {isReliability ? '(Not permitted)' : (isNabl || (!isReliability && !isNabl)) ? '(Mandatory)' : '(Optional)'}
								</label>
								<select
									id="equipmentSelect"
									value={isReliability ? "" : form.equipmentId}
									disabled={isReliability}
									onChange={(e) => setForm({ ...form, equipmentId: e.target.value })}
									className={`bg-[#f8fafc] border border-[#d1d5db] rounded-xl p-3 text-zinc-800 text-xs font-semibold outline-none focus:border-[#11236a] transition-all cursor-pointer h-[42px] ${isReliability ? 'opacity-50 cursor-not-allowed bg-zinc-100' : ''}`}
								>
									{isReliability ? (
										<option value="">-- R&D Equipment not permitted for Reliability --</option>
									) : (
										<>
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
										</>
									)}
								</select>
							</div>

							{/* Dynamic Platform Telemetry grid for Stations */}
							<div className="flex flex-col gap-3">
								<label className="text-[10px] text-zinc-500 font-extrabold">
									{isNabl
										? 'Assign NABL Station Platforms (Select platforms from NABL Station unit - Mandatory)'
										: `Assign Platforms (Select platform from a single Station unit - ${isReliability ? 'Mandatory, Max 1 selection' : 'Optional, Max 1 selection'})`
									}
								</label>
								<div className="space-y-4 max-h-[350px] overflow-y-auto p-3 bg-[#f8fafc] rounded-2xl border border-zinc-150">
									{isNabl ? (
										// Only render NABL Station 1
										(() => {
											const sNum = 1;
											const isStationActive = form.stationNo === sNum;
											return (
												<div key={sNum} className="bg-white border border-[#e4e4e7]/60 rounded-[22px] p-5 shadow-sm">
													<div className="flex items-center justify-between mb-3.5">
														<span className="text-xs font-bold text-slate-400 tracking-wider">NABL Station {sNum}</span>
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
															const slot = nablPlatforms.find(
																(p: any) => Number(p.stationNo) === sNum && Number(p.platformNo) === pNum
															);
															const isOccupied = slot
																? (!slot.isAvailable &&
																	(isPlatformReservedByOtherPlan(sNum, pNum, form.id, true) ||
																		slot.testRequestId !== Number(selectedReq.id) ||
																		(!form.id && slot.occupiedBy?.includes(`(Sample #${activeSampleIndex + 1})`))
																	)
																)
																: false;

															return (
																<button
																	key={pNum}
																	type="button"
																	onClick={() => {
																		if (isOccupied) return;
																		setForm(prev => {
																			if (prev.stationNo !== sNum) {
																				return {
																					...prev,
																					stationNo: sNum,
																					platformNos: [pNum]
																				};
																			}
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
																			: `NABL Station S${sNum} Platform #${pNum} (Available)`
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
										})()
									) : (
										// Render normal Stations 1 to 14
										Array.from({ length: 14 }, (_, stationIdx) => {
											const sNum = stationIdx + 1;
											const isStationActive = form.stationNo === sNum;

											return (
												<div key={sNum} className="bg-white border border-[#e4e4e7]/60 rounded-[22px] p-5 shadow-sm">
													<div className="flex items-center justify-between mb-3.5">
														<span className="text-xs font-bold text-slate-400 tracking-wider">Station Unit S{sNum}</span>
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
															const slot = normalPlatforms.find(
																(p: any) => Number(p.stationNo) === sNum && Number(p.platformNo) === pNum
															);
															const isOccupied = slot
																? (!slot.isAvailable &&
																	(isPlatformReservedByOtherPlan(sNum, pNum, form.id, false) ||
																		slot.testRequestId !== Number(selectedReq.id) ||
																		(!form.id && slot.occupiedBy?.includes(`(Sample #${activeSampleIndex + 1})`))
																	)
																)
																: false;

															return (
																<button
																	key={pNum}
																	type="button"
																	onClick={() => {
																		if (isOccupied) return;
																		setForm(prev => {
																			const isSingleAllowed = isReliability || (!isReliability && !isNabl);
																			if (isSingleAllowed) {
																				return {
																					...prev,
																					stationNo: sNum,
																					platformNos: prev.platformNos.includes(pNum) && prev.stationNo === sNum ? [] : [pNum]
																				};
																			}

																			if (prev.stationNo !== sNum) {
																				return {
																					...prev,
																					stationNo: sNum,
																					platformNos: [pNum]
																				};
																			}
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
										})
									)}
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

			{activeInspectionReport && activeInspectionSampleIndex !== null && (
				<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
					<div className="bg-white border border-zinc-200 rounded-[28px] max-w-2xl w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto">
						{/* Close button */}
						<button
							onClick={() => {
								setActiveInspectionReport(null);
								setActiveInspectionSampleIndex(null);
							}}
							className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer border-none outline-none"
						>
							<X className="w-4 h-4" />
						</button>

						<div className="space-y-5">
							{/* Header */}
							<div>
								<div className="flex items-center justify-between">
									<span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${activeInspectionReport.status === 'PASSED'
										? 'bg-emerald-50 text-emerald-700 border border-emerald-150'
										: 'bg-rose-50 text-rose-700 border border-rose-150'
										}`}>
										Inspection {activeInspectionReport.status}
									</span>
									<button
										onClick={() => window.open(`/reports/preview?type=sample&key=${selectedReq.id}-sample-${activeInspectionSampleIndex}`, '_blank')}
										className="px-3.5 py-1.5 bg-[#11236a] hover:bg-[#0c1a52] text-white font-black rounded-xl text-[10px] flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all outline-none border-none hover:scale-[1.01] mr-8"
									>
										<Printer className="w-3.5 h-3.5 text-white shrink-0" />
										<span>Print / Download PDF</span>
									</button>
								</div>
								<h3 className="text-lg font-extrabold text-[#11236a] mt-2.5 leading-tight">
									Physical Inspection Report — Sample #{activeInspectionSampleIndex + 1}
								</h3>
								<p className="text-xs font-bold text-zinc-450 uppercase mt-1">
									Allotted ID: <span className="text-zinc-700 font-extrabold">{activeInspectionReport.allottedId || 'N/A'}</span>
								</p>
							</div>

							{/* Checklist */}
							<div className="border border-zinc-200 rounded-2xl overflow-hidden">
								<table className="w-full text-left border-collapse text-xs font-semibold text-zinc-700">
									<thead>
										<tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-extrabold text-zinc-400 uppercase">
											<th className="p-3 w-10/12">Checkpoint Parameters</th>
											<th className="p-3 w-2/12 text-center">Result</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-zinc-150">
										{(() => {
											let checksObj = {};
											try {
												checksObj = typeof activeInspectionReport.checks === 'string'
													? JSON.parse(activeInspectionReport.checks)
													: (activeInspectionReport.checks || {});
											} catch (e) {
												checksObj = {};
											}

											return INSPECTION_CHECKPOINTS.map((cp) => {
												const val = (checksObj as any)[cp.id];
												return (
													<tr key={cp.id} className="hover:bg-zinc-50/50">
														<td className="p-3 font-medium text-zinc-800 leading-normal">{cp.text}</td>
														<td className="p-3 text-center">
															<span className={`inline-block px-2.5 py-1 text-[10px] font-extrabold rounded-lg uppercase tracking-wider text-center min-w-[50px] ${val === 'Yes' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' :
																	val === 'No' ? 'bg-rose-50 text-rose-700 border border-rose-150' :
																		'bg-zinc-100 text-zinc-500 border border-zinc-200'
																}`}>
																{val || 'N/A'}
															</span>
														</td>
													</tr>
												);
											});
										})()}
									</tbody>
								</table>
							</div>

							{/* Remarks */}
							<div className="bg-zinc-50 border border-zinc-200/60 rounded-2xl p-4 space-y-1.5">
								<span className="text-[9px] text-zinc-450 font-extrabold uppercase tracking-wider block">Inspector Remarks</span>
								<p className="text-xs text-zinc-800 font-semibold leading-relaxed whitespace-pre-wrap">
									{activeInspectionReport.remarks || 'No remarks provided.'}
								</p>
							</div>

							{/* Images */}
							{(() => {
								let imagesArr: string[] = [];
								try {
									imagesArr = typeof activeInspectionReport.images === 'string'
										? JSON.parse(activeInspectionReport.images)
										: (activeInspectionReport.images || []);
								} catch (e) {
									imagesArr = [];
								}

								if (imagesArr.length === 0) return null;

								return (
									<div className="space-y-2.5">
										<span className="text-[9px] text-zinc-450 font-extrabold uppercase tracking-wider block">Inspection Photos ({imagesArr.length})</span>
										<div className="flex flex-wrap gap-3">
											{imagesArr.map((img: string, idx: number) => {
												const cleanPath = img.replace(/\\/g, '/');
												const relativePath = cleanPath.includes('uploads')
													? cleanPath.substring(cleanPath.indexOf('uploads'))
													: cleanPath;
												return (
													<div key={idx} className="relative group rounded-xl overflow-hidden border border-zinc-200 shadow-sm hover:shadow-md transition-all">
														<img
															src={`/${relativePath}`}
															alt={`Inspection photo ${idx + 1}`}
															className="w-24 h-24 object-cover cursor-pointer hover:scale-105 transition-transform"
															onClick={() => window.open(`/${relativePath}`, '_blank')}
														/>
													</div>
												);
											})}
										</div>
									</div>
								);
							})()}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
