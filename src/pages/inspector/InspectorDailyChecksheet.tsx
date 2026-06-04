import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clipboard, Activity, ArrowRight } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { getTestRequests } from '../../services/operations/testRequestService';
import { getTestTypes } from '../../services/operations/testTypeService';
import { getTestCategories } from '../../services/operations/testCategoryService';
import { getTestProtocols } from '../../services/operations/testProtocolService';

export default function InspectorDailyChecksheet() {
	const navigate = useNavigate();

	// Data stores
	const [requests, setRequests] = useState<any[]>([]);
	const [testTypes, setTestTypes] = useState<any[]>([]);
	const [testCategories, setTestCategories] = useState<any[]>([]);
	const [testProtocols, setTestProtocols] = useState<any[]>([]);
	const [plans, setPlans] = useState<{ [key: string]: any }>({});
	const [loading, setLoading] = useState(true);

	// Fetch all parameters on mount
	useEffect(() => {
		let isMounted = true;
		const loadData = async () => {
			try {
				const reqs = await getTestRequests()();
				const types = await getTestTypes()();
				const categories = await getTestCategories()();
				const protocols = await getTestProtocols()();
				const cachedPlans = localStorage.getItem('dixon_sample_test_plans');

				if (isMounted) {
					setRequests(reqs || []);
					setTestTypes(types || []);
					setTestCategories(categories || []);
					setTestProtocols(protocols || []);
					setPlans(cachedPlans ? JSON.parse(cachedPlans) : {});
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

	// Filter active test plans to Reliability tests only active today
	const reliabilityPlans = Object.entries(plans).map(([key, plan]) => {
		// Key shape: "${requestId}-sample-${sampleIndex}"
		const [reqIdStr] = key.split('-sample-');
		const request = requests.find(r => String(r.id) === String(reqIdStr));
		
		const testType = testTypes.find(t => String(t.id) === String(plan.testTypeId));
		const testCategory = testCategories.find(c => String(c.id) === String(plan.testCategoryId));
		const protocol = testProtocols.find(p => String(p.id) === String(plan.testProtocolId));

		// Check if it qualifies as a reliability test
		const isReliability = 
			(testType && testType.name.toLowerCase().includes('reliability')) ||
			(testCategory && testCategory.name.toLowerCase().includes('reliability')) ||
			(protocol && protocol.name.toLowerCase().includes('reliability'));

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
	}).filter(
		item =>
			item.isReliability &&
			item.request &&
			item.isTodayInRange &&
			!(item.plan.evaluationStatus === 'PASSED' || item.plan.evaluationStatus === 'FAILED')
	);

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

					{reliabilityPlans.length === 0 ? (
						<div className="text-center py-16 border-2 border-dashed border-zinc-200 rounded-2xl">
							<Clipboard className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
							<h4 className="text-sm font-bold text-zinc-800">No reliability test plans found active today</h4>
							<p className="text-xs text-zinc-500 font-light mt-1 max-w-sm mx-auto">
								Once the Lab Manager configures test plans matching Reliability test types or protocols spanning today's date, they will appear here.
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{reliabilityPlans.map((item) => (
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
											<span className="text-xs text-zinc-400 font-extrabold uppercase bg-zinc-100 px-2 py-0.5 rounded">
												Plan #{item.plan.stationNo}
											</span>
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
												<span className="text-zinc-400 block font-semibold text-[9px] uppercase">Sample ID</span>
												<span className="text-zinc-900">
													{(() => {
														const sampleIndex = Number(item.key.split('-sample-')[1]);
														const inspection = item.request.sampleInspections?.find(
															(si: any) => Number(si.sampleIndex) === sampleIndex
														);
														return inspection?.allottedId || `Sample #${sampleIndex + 1}`;
													})()}
												</span>
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
