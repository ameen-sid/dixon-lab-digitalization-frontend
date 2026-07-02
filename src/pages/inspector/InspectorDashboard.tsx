import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
	SearchCode, 
	FileCheck, 
	ArrowRight, 
	Clock, 
	Calendar, 
	AlertTriangle, 
	CheckCircle2, 
	XCircle, 
	Sliders,
	Activity
} from 'lucide-react';
import { getTestRequests } from '../../services/operations/testRequestService';
import { getTestTypes } from '../../services/operations/testTypeService';
import { getTestCategories } from '../../services/operations/testCategoryService';
import { getTestProtocols } from '../../services/operations/testProtocolService';
import { getChecksheetEntries } from '../../services/operations/reliabilityChecksheetService';

export default function InspectorDashboard() {
	const navigate = useNavigate();

	const [requests, setRequests] = useState<any[]>([]);
	const [testTypes, setTestTypes] = useState<any[]>([]);
	const [testCategories, setTestCategories] = useState<any[]>([]);
	const [testProtocols, setTestProtocols] = useState<any[]>([]);
	const [plans, setPlans] = useState<{ [key: string]: any }>({});
	const [checksheetEntriesMap, setChecksheetEntriesMap] = useState<{ [key: string]: any[] }>({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;
		const loadData = async () => {
			try {
				const reqs = await getTestRequests()();
				const types = await getTestTypes()();
				const categories = await getTestCategories()();
				const protocols = await getTestProtocols()();

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
								parsedPlans[`${r.id}-plan-${p.id}`] = {
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
					setPlans(parsedPlans);
					setChecksheetEntriesMap(entriesMap);
				}
			} catch (err) {
				console.error('Failed to load dashboard parameters:', err);
			} finally {
				if (isMounted) setLoading(false);
			}
		};
		loadData();
		return () => {
			isMounted = false;
		};
	}, []);

	// Filter active test plans to Reliability tests
	const reliabilityPlans = Object.entries(plans).map(([key, plan]) => {
		const [reqIdStr] = key.split('-plan-');
		const request = requests.find(r => String(r.id) === String(reqIdStr));
		const testType = testTypes.find(t => String(t.id) === String(plan.testTypeId));
		const testCategory = testCategories.find(c => String(c.id) === String(plan.testCategoryId));
		const protocol = testProtocols.find(p => String(p.id) === String(plan.testProtocolId));

		const isReliability = !!(testType && testType.name.toLowerCase().includes('reliability'));

		return {
			key,
			isReliability,
			request,
			plan,
			testType,
			testCategory,
			protocol
		};
	}).filter(
		item =>
			item.isReliability &&
			item.request &&
			!(item.plan.evaluationStatus === 'PASSED' || item.plan.evaluationStatus === 'FAILED')
	);

	// Date generator helper
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

	// Compute statistics and lists
	let todayPendingCount = 0;
	let completedCount = 0;
	let missedCount = 0;
	let upcomingCount = 0;

	const _todayLocal = new Date();
	const todayStr = `${_todayLocal.getFullYear()}-${String(_todayLocal.getMonth() + 1).padStart(2, '0')}-${String(_todayLocal.getDate()).padStart(2, '0')}`;

	const alerts: { id: string; type: 'missed' | 'overdue'; message: string; date?: string; planKey: string }[] = [];
	const todayChecksheets: { planKey: string; request: any; plan: any; status: 'Completed' | 'Pending'; progress: number }[] = [];
	const planSummaries: { planKey: string; request: any; plan: any; completedDays: number; totalDays: number; missedDays: number; upcomingDays: number; progress: number }[] = [];

	reliabilityPlans.forEach(({ key, plan, request }) => {
		const dates = getDatesArray(plan.startDate, plan.endDate);
		const entries = checksheetEntriesMap[key] || [];

		let completedForThisPlan = 0;
		let missedForThisPlan = 0;
		let upcomingForThisPlan = 0;

		const hasToday = dates.includes(todayStr);
		const hasTodayEntry = entries.some((e: any) => e.date === todayStr);

		dates.forEach(dateStr => {
			const hasEntry = entries.some((e: any) => e.date === dateStr);
			if (dateStr > todayStr) {
				upcomingCount++;
				upcomingForThisPlan++;
			} else if (dateStr === todayStr) {
				if (hasEntry) {
					completedCount++;
					completedForThisPlan++;
				} else {
					todayPendingCount++;
				}
			} else {
				// Past date within active range
				if (hasEntry) {
					completedCount++;
					completedForThisPlan++;
				} else {
					missedCount++;
					missedForThisPlan++;
					alerts.push({
						id: `${key}-${dateStr}`,
						type: 'missed',
						message: `${request.brandName} (${request.requestId || `REQ-${request.id}`}) - Missed log on ${dateStr}`,
						date: dateStr,
						planKey: key
					});
				}
			}
		});

		const totalDays = dates.length;
		const progress = totalDays > 0 ? Math.round((completedForThisPlan / totalDays) * 100) : 0;

		if (hasToday) {
			todayChecksheets.push({
				planKey: key,
				request,
				plan,
				status: hasTodayEntry ? 'Completed' : 'Pending',
				progress
			});
		}

		planSummaries.push({
			planKey: key,
			request,
			plan,
			completedDays: completedForThisPlan,
			totalDays,
			missedDays: missedForThisPlan,
			upcomingDays: upcomingForThisPlan,
			progress
		});
	});

	// Sort alerts by date descending
	alerts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));



	if (loading) {
		return (
			<DashboardLayout title="Inspector Command Center" description="Loading metrics...">
				<div className="flex flex-col items-center justify-center py-20 space-y-4">
					<div className="w-12 h-12 border-4 border-[#11236a] border-t-transparent rounded-full animate-spin"></div>
					<p className="text-zinc-555 text-xs font-semibold">Loading inspector dashboard metrics...</p>
				</div>
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout
			title="Quality Inspection Hub"
			description="Log batch visual parameters, audit dimensional reports, and file daily life test checksheets."
		>
			<div className="space-y-6">
				{/* Stat Cards Row */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{/* Today Pending */}
					<div className="bg-white border border-zinc-200/60 rounded-3xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
						<div>
							<span className="text-zinc-550 text-[10px] font-extrabold uppercase tracking-wider block">Today Pending</span>
							<h3 className="text-2xl font-black text-amber-600 mt-1">{todayPendingCount} Sheets</h3>
							<p className="text-zinc-500 text-[10px] mt-1 font-medium">Require log input today</p>
						</div>
						<div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100">
							<Clock className="w-5 h-5" />
						</div>
					</div>

					{/* Completed Checksheets */}
					<div className="bg-white border border-zinc-200/60 rounded-3xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
						<div>
							<span className="text-zinc-550 text-[10px] font-extrabold uppercase tracking-wider block">Completed Days</span>
							<h3 className="text-2xl font-black text-emerald-600 mt-1">{completedCount} Logs</h3>
							<p className="text-zinc-500 text-[10px] mt-1 font-medium">Successfully logged days</p>
						</div>
						<div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
							<FileCheck className="w-5 h-5" />
						</div>
					</div>

					{/* Missed Checksheets */}
					<div className="bg-white border border-zinc-200/60 rounded-3xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
						<div>
							<span className="text-zinc-550 text-[10px] font-extrabold uppercase tracking-wider block">Missed Days</span>
							<h3 className="text-2xl font-black text-rose-600 mt-1">{missedCount} Days</h3>
							<p className="text-zinc-500 text-[10px] mt-1 font-medium">Active days with no log</p>
						</div>
						<div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-100">
							<XCircle className="w-5 h-5" />
						</div>
					</div>
				</div>

				{/* Dashboard Main layout splits */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					
					{/* Left 2 Columns: Today's pending checksheets & summaries */}
					<div className="lg:col-span-2 space-y-6">
						
						{/* Today Pending Checksheets Section */}
						<div className="bg-white border border-zinc-200/60 rounded-3xl p-6 shadow-sm space-y-4">
							<div className="flex items-center justify-between border-b border-zinc-100 pb-4">
								<div className="flex items-center gap-2">
									<Activity className="w-5 h-5 text-indigo-700" />
									<div>
										<h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Today's Checksheets</h3>
										<p className="text-xs text-zinc-500 font-semibold">Reliability tests scheduled for logging today ({todayStr})</p>
									</div>
								</div>
								<button 
									onClick={() => navigate('/inspector/daily-checksheet')}
									className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors flex items-center gap-1 cursor-pointer outline-none"
								>
									<span>View Complete Queue</span>
									<ArrowRight className="w-3.5 h-3.5" />
								</button>
							</div>

							{todayChecksheets.length === 0 ? (
								<div className="text-center py-10">
									<CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
									<h4 className="text-xs font-bold text-zinc-800">No Checksheets Scheduled Today</h4>
									<p className="text-[10px] text-zinc-500 mt-0.5">All reliability plans are either inactive or completed today.</p>
								</div>
							) : (
								<div className="divide-y divide-zinc-100">
									{todayChecksheets.map(item => (
										<div key={item.planKey} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 first:pt-0 last:pb-0">
											<div className="space-y-1">
												<div className="flex items-center gap-2">
													<span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
														Plan #{item.plan.stationNo}
													</span>
													<span className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${
														item.status === 'Completed'
															? 'bg-emerald-50 text-emerald-700'
															: 'bg-amber-50 text-amber-805 animate-pulse'
													}`}>
														{item.status} Today
													</span>
												</div>
												<h4 className="text-xs font-black text-zinc-900">
													{item.request.brandName} - {item.request.modelNo}
												</h4>
												<p className="text-[10px] text-zinc-500 font-semibold">
													Request: <span className="font-extrabold text-zinc-700">{item.request.requestId || `REQ-${item.request.id}`}</span> | Station: <span className="font-extrabold text-[#11236a]">P{item.plan.stationNo}-S{item.plan.platformNos?.join(',')}</span>
												</p>
											</div>

											<div className="flex items-center gap-4">
												{/* Progress */}
												<div className="text-right hidden sm:block">
													<span className="text-[9px] text-zinc-400 block font-semibold">Total Progress</span>
													<span className="text-xs font-extrabold text-indigo-700">{item.progress}%</span>
												</div>
												
												<button
													onClick={() => navigate(`/inspector/checksheet/${item.planKey}`)}
													className={`px-3.5 py-2 rounded-xl font-bold text-[11px] transition-all cursor-pointer outline-none active:scale-[0.98] ${
														item.status === 'Completed'
															? 'bg-transparent text-zinc-700 border border-zinc-200 hover:bg-zinc-50'
															: 'bg-[#11236a] text-white hover:bg-[#0c1a52]'
													}`}
												>
													{item.status === 'Completed' ? 'View/Edit Log' : 'Log Parameters'}
												</button>
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Daily Inspection Summary & Progress */}
						<div className="bg-white border border-zinc-200/60 rounded-3xl p-6 shadow-sm space-y-4">
							<div className="border-b border-zinc-100 pb-3">
								<h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">All Active Reliability Plans</h3>
								<p className="text-xs text-zinc-500 font-semibold">Overall logging progress for running reliability life testing</p>
							</div>

							{planSummaries.length === 0 ? (
								<div className="text-center py-8 text-zinc-500 text-[11px] font-semibold">
									No active test plans being logged currently.
								</div>
							) : (
								<div className="space-y-4">
									{planSummaries.map(summary => (
										<div key={summary.planKey} className="space-y-2 border-b border-zinc-100 pb-4 last:border-b-0 last:pb-0">
											<div className="flex items-center justify-between">
												<div>
													<h4 className="text-xs font-black text-zinc-800">
														{summary.request.brandName} ({summary.request.modelNo})
													</h4>
													<span className="text-[9px] font-bold text-zinc-450 uppercase">
														{summary.plan.numberOfDays} Days cycle | Station #{summary.plan.stationNo}
													</span>
												</div>
												<div className="text-right">
													<span className="text-xs font-extrabold text-[#11236a]">{summary.progress}% Logged</span>
													<span className="text-[9px] text-zinc-400 block font-semibold">
														{summary.completedDays} logged / {summary.totalDays} total
													</span>
												</div>
											</div>
											
											{/* Progress Bar */}
											<div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden flex">
												<div 
													className="bg-emerald-500 h-full transition-all duration-300"
													style={{ width: `${summary.progress}%` }}
												/>
												{summary.missedDays > 0 && (
													<div 
														className="bg-rose-500 h-full"
														style={{ width: `${Math.round((summary.missedDays / summary.totalDays) * 100)}%` }}
														title={`${summary.missedDays} days missed`}
													/>
												)}
											</div>

											{/* Metadata row details */}
											<div className="flex items-center gap-4 text-[9px] font-bold text-zinc-500">
												<span className="flex items-center gap-1 text-emerald-600">
													<CheckCircle2 className="w-3 h-3" />
													<span>{summary.completedDays} Completed</span>
												</span>
												{summary.missedDays > 0 && (
													<span className="flex items-center gap-1 text-rose-600">
														<XCircle className="w-3 h-3" />
														<span>{summary.missedDays} Missed Days</span>
													</span>
												)}
												{summary.upcomingDays > 0 && (
													<span className="flex items-center gap-1 text-indigo-600">
														<Calendar className="w-3 h-3" />
														<span>{summary.upcomingDays} Upcoming</span>
													</span>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Right 1 Column: Daily inspection summary and alerts */}
					<div className="space-y-6">
						
						{/* Daily alerts and exceptions */}
						<div className="bg-white border border-zinc-200/60 rounded-3xl p-5 shadow-sm space-y-4">
							<div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
								<AlertTriangle className="w-5 h-5 text-rose-600" />
								<div>
									<h4 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider">
										Inspection Alerts
									</h4>
									<p className="text-[10px] text-zinc-500 font-semibold">Compliance alerts and missed log audits</p>
								</div>
							</div>

							{alerts.length === 0 ? (
								<div className="py-8 text-center text-zinc-500">
									<CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
									<p className="text-[10px] font-bold text-zinc-700">All checksheets are fully updated</p>
									<p className="text-[9px] text-zinc-400 mt-0.5">No missed entries found in history.</p>
								</div>
							) : (
								<div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
									{alerts.map(alert => (
										<div 
											key={alert.id} 
											onClick={() => navigate(`/inspector/checksheet/${alert.planKey}`)}
											className="p-3 bg-rose-50/50 hover:bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-2.5 cursor-pointer transition-colors"
										>
											<XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
											<div className="space-y-0.5">
												<p className="text-[10px] font-extrabold text-zinc-800 leading-tight">
													{alert.message}
												</p>
												<span className="text-[8px] font-bold text-rose-700 uppercase tracking-wider block">
													Action: Complete Missing log
												</span>
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Static NABL Compliance Guidelines Card */}
						<div className="bg-white border border-zinc-200/60 rounded-3xl p-5 shadow-sm space-y-3">
							<div className="flex items-center gap-2 border-b border-[#f4f4f5] pb-2">
								<Sliders className="w-4 h-4 text-indigo-700" />
								<h4 className="text-[10px] font-bold text-zinc-900 uppercase tracking-wider">
									Daily Operations Guide
								</h4>
							</div>
							<div className="text-[10px] font-semibold text-zinc-650 space-y-2">
								<div className="flex items-start gap-2">
									<span className="w-1.5 h-1.5 rounded-full bg-[#11236a] mt-1 shrink-0" />
									<p>Ensure life test chamber temperature remains calibrated.</p>
								</div>
								<div className="flex items-start gap-2">
									<span className="w-1.5 h-1.5 rounded-full bg-[#11236a] mt-1 shrink-0" />
									<p>Record motor status logs strictly post-duty cycle completion.</p>
								</div>
							</div>
						</div>

						{/* Clean Workspace Card */}
						<div className="bg-gradient-to-tr from-[#11236a] to-[#253e9a] rounded-3xl p-5 text-white shadow-md space-y-3">
							<div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
								<SearchCode className="w-4 h-4 text-white" />
							</div>
							<div className="space-y-1">
								<h4 className="text-xs font-bold uppercase tracking-wider">Workspace Sync</h4>
								<p className="text-[10px] text-indigo-150 leading-relaxed font-semibold">
									Daily checksheets auto-save to database on cursor blur. Make changes directly and they are saved securely.
								</p>
							</div>
						</div>

					</div>

				</div>
			</div>
		</DashboardLayout>
	);
}
