import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { SearchCode, FileCheck, ClipboardList, CheckSquare, ArrowRight, Clock } from 'lucide-react';
import { getTestRequests } from '../../services/operations/testRequestService';
import { getTestTypes } from '../../services/operations/testTypeService';
import { getTestCategories } from '../../services/operations/testCategoryService';
import { getTestProtocols } from '../../services/operations/testProtocolService';

export default function InspectorDashboard() {
	const navigate = useNavigate();

	const [requests, setRequests] = useState<any[]>([]);
	const [testTypes, setTestTypes] = useState<any[]>([]);
	const [testCategories, setTestCategories] = useState<any[]>([]);
	const [testProtocols, setTestProtocols] = useState<any[]>([]);
	const [plans, setPlans] = useState<{ [key: string]: any }>({});
	const [loading, setLoading] = useState(true);

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

	// Filter active test plans to Reliability tests only
	const reliabilityPlans = Object.entries(plans).map(([key, plan]) => {
		const [reqIdStr] = key.split('-sample-');
		const request = requests.find(r => String(r.id) === String(reqIdStr));
		const testType = testTypes.find(t => String(t.id) === String(plan.testTypeId));
		const testCategory = testCategories.find(c => String(c.id) === String(plan.testCategoryId));
		const protocol = testProtocols.find(p => String(p.id) === String(plan.testProtocolId));

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
			isReliability,
			request,
			isTodayInRange,
			plan
		};
	}).filter(
		item =>
			item.isReliability &&
			item.request &&
			item.isTodayInRange &&
			!(item.plan.evaluationStatus === 'PASSED' || item.plan.evaluationStatus === 'FAILED')
	);

	// Count statistics
	const totalReliabilityCount = reliabilityPlans.length;
	const pendingInspectionRequestsCount = requests.filter(r => r.status === 'PENDING_APPROVAL').length;
	const completedTestingRequestsCount = requests.filter(r => ['COMPLETED', 'FAILED', 'FAIL'].includes(r.status)).length;

	if (loading) {
		return (
			<DashboardLayout title="Inspector Command Center" description="Loading metrics...">
				<div className="flex flex-col items-center justify-center py-20 space-y-4">
					<div className="w-12 h-12 border-4 border-indigo-700 border-t-transparent rounded-full animate-spin"></div>
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
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">				
				{/* Daily Checksheet Queue Card */}
				<div 
					onClick={() => navigate('/inspector/daily-checksheet')}
					className="bg-white border border-zinc-200 hover:border-indigo-650 hover:shadow-lg rounded-3xl p-6 flex items-center justify-between shadow-sm cursor-pointer transition-all group"
				>
					<div>
						<span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Daily Checksheets</span>
						<h3 className="text-3xl font-black text-[#11236a] mt-1">{totalReliabilityCount} Queue</h3>
						<p className="text-indigo-600 text-xs mt-2 font-extrabold flex items-center gap-1 group-hover:underline">
							<span>Access reliability logsheets</span>
							<ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
						</p>
					</div>
					<div className="w-14 h-14 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center justify-center border border-indigo-100 group-hover:scale-105 transition-transform">
						<CheckSquare className="w-7 h-7" />
					</div>
				</div>

				{/* Awaiting Inspection Card */}
				<div className="bg-white border border-zinc-200 rounded-3xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
					<div>
						<span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Awaiting Check</span>
						<h3 className="text-3xl font-black text-zinc-900 mt-1">{pendingInspectionRequestsCount} requests</h3>
						<p className="text-amber-600 text-xs mt-2 font-extrabold flex items-center gap-1">
							<Clock className="w-3.5 h-3.5" />
							<span>Needs verification approval</span>
						</p>
					</div>
					<div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100">
						<ClipboardList className="w-7 h-7" />
					</div>
				</div>

				{/* Inspected Batches Card */}
				<div className="bg-white border border-zinc-200 rounded-3xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all sm:col-span-2 lg:col-span-1">
					<div>
						<span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Inspected Batches</span>
						<h3 className="text-3xl font-black text-zinc-900 mt-1">{completedTestingRequestsCount}</h3>
						<p className="text-emerald-600 text-xs mt-2 font-extrabold flex items-center gap-1">
							<FileCheck className="w-3.5 h-3.5" />
							<span>100% compliance certified</span>
						</p>
					</div>
					<div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100">
						<FileCheck className="w-7 h-7" />
					</div>
				</div>
			</div>

			<div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm flex-1 flex flex-col justify-center items-center text-center">
				<div className="w-16 h-16 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-center text-zinc-500 shadow-inner mb-4">
					<SearchCode className="w-8 h-8 text-indigo-700" />
				</div>
				<h2 className="text-xl font-extrabold text-[#11236a] tracking-tight">Inspector Command Workspace</h2>
				<p className="text-zinc-500 max-w-lg mt-2 text-sm font-medium leading-relaxed">
					Welcome to the Quality Inspector Workspace. Daily checksheet filling for reliability and endurance test plans, batch inspection validation checklists, and physical laboratory parameters are fully synchronized. Your workspace is configured.
				</p>
			</div>
		</DashboardLayout>
	);
}
