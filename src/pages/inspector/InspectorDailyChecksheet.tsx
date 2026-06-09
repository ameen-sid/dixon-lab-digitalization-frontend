import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clipboard, Activity, ArrowRight, Search, X } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import CustomSelect from '../../components/CustomSelect';
import { getTestRequests } from '../../services/operations/testRequestService';
import { getTestTypes } from '../../services/operations/testTypeService';
import { getTestCategories } from '../../services/operations/testCategoryService';
import { getTestProtocols } from '../../services/operations/testProtocolService';
import { getTestingEquipments } from '../../services/operations/testingEquipmentService';
import { getChecksheetEntries } from '../../services/operations/reliabilityChecksheetService';

export default function InspectorDailyChecksheet() {
	const navigate = useNavigate();

	// Data stores
	const [requests, setRequests] = useState<any[]>([]);
	const [testTypes, setTestTypes] = useState<any[]>([]);
	const [testCategories, setTestCategories] = useState<any[]>([]);
	const [testProtocols, setTestProtocols] = useState<any[]>([]);
	const [equipments, setEquipments] = useState<any[]>([]);
	const [plans, setPlans] = useState<{ [key: string]: any }>({});
	const [checksheetEntriesMap, setChecksheetEntriesMap] = useState<{ [key: string]: any[] }>({});
	const [loading, setLoading] = useState(true);

	// Filter states
	const [searchQuery, setSearchQuery] = useState('');
	const [typeFilter, setTypeFilter] = useState('All');
	const [stationFilter, setStationFilter] = useState('All');
	const [statusFilter, setStatusFilter] = useState('All');

	// Fetch all parameters on mount
	useEffect(() => {
		let isMounted = true;
		const loadData = async () => {
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

				// Concurrently fetch database checksheet entries for all test plans
				const entriesMap: { [key: string]: any[] } = {};
				await Promise.all(
					Object.keys(parsedPlans).map(async (key) => {
						try {
							const entries = await getChecksheetEntries(key)();
							entriesMap[key] = entries || [];
						} catch (err) {
							console.error(`Failed to load entries for ${key}:`, err);
							entriesMap[key] = [];
						}
					})
				);

				if (isMounted) {
					setRequests(reqs || []);
					setTestTypes(types || []);
					setTestCategories(categories || []);
					setTestProtocols(protocols || []);
					setEquipments(eqps || []);
					setPlans(parsedPlans);
					setChecksheetEntriesMap(entriesMap);
				}
			} catch (err) {
				console.error('Failed to load daily checksheet master data:', err);
			} finally {
				if (isMounted) setLoading(false);
			}
		};
		loadData();
		return () => {
			isMounted = false;
		};
	}, []);

	const _todayLocal = new Date();
	const todayStr = `${_todayLocal.getFullYear()}-${String(_todayLocal.getMonth() + 1).padStart(2, '0')}-${String(_todayLocal.getDate()).padStart(2, '0')}`;

	// Filter active test plans to Reliability tests only active today
	const reliabilityPlans = Object.entries(plans).map(([key, plan]) => {
		const [reqIdStr] = key.split('-sample-');
		const request = requests.find(r => String(r.id) === String(reqIdStr));
		
		const testType = testTypes.find(t => String(t.id) === String(plan.testTypeId));
		const testCategory = testCategories.find(c => String(c.id) === String(plan.testCategoryId));
		const protocol = testProtocols.find(p => String(p.id) === String(plan.testProtocolId));

		// Check if it qualifies as a reliability test
		const isReliability = !!(testType && testType.name.toLowerCase().includes('reliability'));

		// Check if today falls within start and end date range
		let isTodayInRange = false;
		if (plan.startDate && plan.endDate) {
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const start = new Date(plan.startDate);
			start.setHours(0, 0, 0, 0);

			const end = new Date(plan.endDate);
			end.setHours(0, 0, 0, 0);

			if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
				isTodayInRange = today >= start && today <= end;
			}
		}

		return {
			key,
			plan,
			request,
			testType,
			testCategory,
			protocol,
			isReliability,
			isTodayInRange
		};
	}).filter(item => {
		const requestStatus = (item.request?.status || '').toUpperCase();
		const evaluationStatus = (item.plan?.evaluationStatus || '').toUpperCase();

		const isActiveTestingRequest = [
			'UNDER_TEST',
			'UNDER_TESTING'
		].includes(requestStatus);

		const isNotEvaluated = ![
			'PASSED',
			'FAILED',
			'RETEST'
		].includes(evaluationStatus);

		return (
			item.isReliability &&
			item.request &&
			item.isTodayInRange &&
			isActiveTestingRequest &&
			isNotEvaluated
		);
	});

	// Static type options
	const typeOptions = [
		{ value: 'All', label: 'All Types' },
		{ value: 'FATL', label: 'FATL' },
		{ value: 'FAFL', label: 'FAFL' },
		{ value: 'SATL', label: 'SATL' }
	];

	const stationOptions = [
		{ value: 'All', label: 'All Stations' },
		...Array.from({ length: 14 }, (_, i) => ({
			value: String(i + 1),
			label: `Station ${i + 1}`
		}))
	];



	// Apply all filter selections
	const filteredPlans = reliabilityPlans.map(item => {
		const entries = checksheetEntriesMap[item.key] || [];
		const hasTodayEntry = entries.some((e: any) => e.date === todayStr);
		const statusVal = hasTodayEntry ? 'Completed' : 'Pending';
		const eqName = equipments.find(e => String(e.id) === String(item.plan.equipmentId))?.name || 'N/A';

		return {
			...item,
			status: statusVal,
			equipmentName: eqName
		};
	}).filter(item => {
		// Search query filter
		const q = searchQuery.toLowerCase();
		const matchesSearch = 
			item.request.brandName.toLowerCase().includes(q) ||
			item.request.modelNo.toLowerCase().includes(q) ||
			item.request.sampleDescription.toLowerCase().includes(q) ||
			(item.request.requestId || `REQ-${item.request.id}`).toLowerCase().includes(q);

		// Checksheet Type filter
		const typeVal = item.plan.productType || item.protocol?.productType || 'SATL';
		const matchesType = typeFilter === 'All' || typeVal.toUpperCase() === typeFilter.toUpperCase();

		// Station filter
		const matchesStation = stationFilter === 'All' || String(item.plan.stationNo) === stationFilter;

		// Status filter
		const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

		return matchesSearch && matchesType && matchesStation && matchesStatus;
	});

	// Format platforms list text
	const getPlatformsText = (plan: any) => {
		if (!plan || !plan.platformNos) return 'N/A';
		return plan.platformNos.map((pNum: number) => `P${plan.stationNo}-S${pNum}`).join(', ');
	};

	if (loading) {
		return (
			<DashboardLayout title="Daily Checksheets Dashboard" description="Loading Active Reliability Life Testing parameters...">
				<div className="flex flex-col items-center justify-center py-20 space-y-4">
					<div className="w-12 h-12 border-4 border-indigo-700 border-t-transparent rounded-full animate-spin"></div>
					<p className="text-zinc-550 text-xs font-semibold">Synchronizing Master Reliability Schedules...</p>
				</div>
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout
			title="Daily Checksheet Queue"
			description="Select active reliability test plan to log chronological checksheet parameters."
		>
			<div className="space-y-6">
				{/* Search & Filters Toolbar */}
				<div className="bg-white border border-zinc-200/50 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
					{/* Search input (Left side) */}
					<div className="relative w-full lg:max-w-xs">
						<Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
						<input 
							type="text" 
							placeholder="Search by brand, model, request..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-zinc-800 placeholder-zinc-400 outline-none focus:bg-white focus:border-[#11236a] transition-all"
						/>
					</div>

					{/* Dropdowns (Right side) */}
					<div className="flex flex-wrap gap-4 items-center w-full lg:w-auto lg:justify-end">
						<div className="flex items-center gap-1.5">
							<span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Type:</span>
							<CustomSelect
								value={typeFilter}
								onChange={setTypeFilter}
								options={typeOptions}
								className="w-28"
							/>
						</div>

						<div className="flex items-center gap-1.5">
							<span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Station:</span>
							<CustomSelect
								value={stationFilter}
								onChange={setStationFilter}
								options={stationOptions}
								className="w-28"
							/>
						</div>



						<div className="flex items-center gap-1.5">
							<span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Status:</span>
							<CustomSelect
								value={statusFilter}
								onChange={setStatusFilter}
								options={[
									{ value: 'All', label: 'All Status' },
									{ value: 'Pending', label: 'Pending Today' },
									{ value: 'Completed', label: 'Completed Today' }
								]}
								className="w-32"
							/>
						</div>

						{(searchQuery || typeFilter !== 'All' || stationFilter !== 'All' || statusFilter !== 'All') && (
							<button
								onClick={() => {
									setSearchQuery('');
									setTypeFilter('All');
									setStationFilter('All');
									setStatusFilter('All');
								}}
								className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/50 px-3 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1"
							>
								<X className="w-3.5 h-3.5" />
								<span>Clear</span>
							</button>
						)}
					</div>
				</div>

				{/* Table Grid Cards */}
				<div className="bg-white border border-zinc-200/60 rounded-3xl p-6 shadow-sm">
					<div className="flex items-center gap-3 mb-6">
						<div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
							<Activity className="w-5 h-5" />
						</div>
						<div>
							<h2 className="text-base font-bold text-zinc-900 leading-tight">Reliability Testing Queue</h2>
							<p className="text-xs text-zinc-500 font-medium">Daily checklists configured for active endurance parameters.</p>
						</div>
					</div>

					{filteredPlans.length === 0 ? (
						<div className="text-center py-16 border-2 border-dashed border-zinc-200 rounded-2xl">
							<Clipboard className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
							<h4 className="text-sm font-bold text-zinc-800">No matching reliability test plans found</h4>
							<p className="text-xs text-zinc-500 font-light mt-1 max-w-sm mx-auto">
								Adjust your filters or query to locate specific active testing plans.
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{filteredPlans.map((item) => (
								<div 
									key={item.key}
									onClick={() => navigate(`/inspector/checksheet/${item.key}`)}
									className="border border-zinc-200 hover:border-indigo-650 hover:shadow-md hover:bg-slate-50/50 rounded-2xl p-5 transition-all cursor-pointer flex flex-col justify-between"
								>
									<div className="space-y-3">
										<div className="flex justify-between items-start">
											<div>
												<span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
													{item.plan.productType || item.protocol?.productType || 'SATL'} Plan
												</span>
												<h4 className="text-sm font-black text-zinc-900 mt-1.5 leading-none">
													{item.request.brandName} - {item.request.modelNo}
												</h4>
											</div>
											<div className="flex flex-col items-end gap-1.5">
												<span className="text-xs text-zinc-400 font-extrabold uppercase bg-zinc-100 px-2 py-0.5 rounded">
													Plan #{item.plan.stationNo}
												</span>
												<span className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${
													item.status === 'Completed'
														? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
														: 'bg-amber-50 text-amber-805 border border-amber-100 animate-pulse'
												}`}>
													{item.status} Today
												</span>
											</div>
										</div>

										<p className="text-xs text-zinc-555 line-clamp-1">
											{item.request.sampleDescription}
										</p>

										<div className="grid grid-cols-2 gap-2 border-t border-zinc-100 pt-3 text-[11px] font-bold text-zinc-650">
											<div>
												<span className="text-zinc-400 block font-semibold text-[9px] uppercase">Request ID</span>
												<span className="text-zinc-900">{item.request.requestId || `REQ-2026-${item.request.id}`}</span>
											</div>
											<div>
												<span className="text-zinc-400 block font-semibold text-[9px] uppercase">Equipment</span>
												<span className="text-zinc-900 truncate block max-w-[150px]" title={item.equipmentName}>{item.equipmentName}</span>
											</div>
											<div>
												<span className="text-zinc-400 block font-semibold text-[9px] uppercase">Platforms</span>
												<span>{getPlatformsText(item.plan)}</span>
											</div>
											<div>
												<span className="text-zinc-450 block font-semibold text-[9px] uppercase">Duration</span>
												<span>{item.plan.numberOfDays} Days</span>
											</div>
										</div>
									</div>

									<div className="flex items-center gap-2 mt-4 text-xs font-extrabold text-[#11236a] hover:underline justify-end pt-1">
										<span>Open Checksheet</span>
										<ArrowRight className="w-3.5 h-3.5" />
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</DashboardLayout>
	);
}
