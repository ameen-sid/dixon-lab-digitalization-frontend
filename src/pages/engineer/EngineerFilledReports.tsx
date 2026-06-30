import { useState, useMemo } from 'react';
import { Clipboard, CheckCircle, Search, Eye } from 'lucide-react';
import CustomSelect from '../../components/CustomSelect';

interface EngineerFilledReportsProps {
	requests: any[];
	currentEngineerId: string;
	currentEngineerIsNabl: boolean;
}

export default function EngineerFilledReports({ requests, currentEngineerId, currentEngineerIsNabl }: EngineerFilledReportsProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState('ALL');

	const filledPlans = useMemo(() => {
		const list: any[] = [];
		requests.forEach(req => {
			const requestPlans = Array.isArray(req.testPlans) ? req.testPlans : [];
			const inspections = Array.isArray(req.sampleInspections) ? req.sampleInspections : [];

			requestPlans.forEach((plan: any) => {
				const planTestTypeName = String(plan.testType?.name || req.testType?.name || '').toLowerCase();
				const isReliability = planTestTypeName.includes('reliability');
				if (isReliability) return;

				const isNabl = planTestTypeName.includes('nabl');
				const departmentAllowed = currentEngineerIsNabl ? isNabl : !isNabl;
				if (!departmentAllowed) return;

				const sampleIdx = plan.sampleIndex;
				const insp = inspections.find((si: any) => Number(si.testPlanId) === Number(plan.id)) ||
					inspections.find((si: any) => {
						if (Number(si.sampleIndex) !== Number(sampleIdx)) return false;
						if (si.testPlanId) return false;
						let checksObj: any = {};
						try {
							checksObj = typeof si.checks === 'string' ? JSON.parse(si.checks) : (si.checks || {});
						} catch {
							checksObj = {};
						}
						return checksObj.specifiedRequirement !== undefined;
					});
				if (!insp) return;

				let checksObj: any = {};
				try {
					checksObj = typeof insp.checks === 'string' ? JSON.parse(insp.checks) : (insp.checks || {});
				} catch (e) {
					checksObj = {};
				}

				let imagesArr: string[] = [];
				try {
					imagesArr = typeof insp.images === 'string' ? JSON.parse(insp.images) : (insp.images || []);
				} catch (e) {
					imagesArr = [];
				}

				const hasReportData =
					!!checksObj.specifiedRequirement ||
					!!checksObj.eqName ||
					!!checksObj.eqMake ||
					!!checksObj.eqModel ||
					!!checksObj.eqCalibration ||
					(imagesArr && imagesArr.length > 0) ||
					!!insp.remarks;

				const isReportStatus = [
					'UNDER_REVIEW',
					'COMPLETED',
					'TESTING_PASSED',
					'TESTING_FAILED',
					'TESTING_PARTIAL',
					'PASSED',
					'FAILED'
				].includes((insp.status || '').toUpperCase());

				const getReportStatus = () => {
					const evalStatus = (plan.evaluationStatus || '').toUpperCase();
					if (evalStatus === 'PASSED') {
						return 'PASSED';
					}
					if (evalStatus === 'FAILED') {
						return 'FAILED';
					}
					return 'UNDER_REVIEW';
				};

				const isSubmittedByMe = checksObj.submittedById
					? String(checksObj.submittedById) === String(currentEngineerId)
					: String(req.assignedToId || req.assignedTo?.id || req.engineerId) === String(currentEngineerId);

				if (!isSubmittedByMe) return;

				const isReportSubmitted = checksObj.specifiedRequirement !== undefined;
				if (!isReportSubmitted) return;

				const isEvaluated = ['PASSED', 'FAILED'].includes((plan.evaluationStatus || '').toUpperCase());

				if (isReportStatus && hasReportData) {
					list.push({
						key: `${req.id}-sample-${sampleIdx}`,
						plan,
						request: req,
						sampleIndex: sampleIdx,
						remarks: insp.remarks || 'No remarks recorded.',
						status: getReportStatus(),
						isEvaluated,
						createdAt: insp.updatedAt || insp.createdAt,
						testType: req.testType,
						allottedId: plan.allottedId || `REQ-${req.id}-S${String(sampleIdx + 1).padStart(2, '0')}`,
						submittedBy: checksObj.submittedByName || req.engineerName || 'Unknown',
					});
				}
			});
		});
		return list;
	}, [requests, currentEngineerId, currentEngineerIsNabl]);

	const filteredPlans = useMemo(() => {
		return filledPlans.filter(item => {
			const q = searchQuery.toLowerCase();
			const matchesSearch =
				item.request.brandName.toLowerCase().includes(q) ||
				item.request.modelNo.toLowerCase().includes(q) ||
				(item.testType?.name || '').toLowerCase().includes(q) ||
				item.allottedId.toLowerCase().includes(q);

			const matchesStatus =
				statusFilter === 'ALL' ||
				item.status.toUpperCase() === statusFilter.toUpperCase();

			return matchesSearch && matchesStatus;
		});
	}, [filledPlans, searchQuery, statusFilter]);

	const formatDateTime = (val: string) => {
		if (!val) return '-';
		const d = new Date(val);
		return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	};

	const getStatusBadge = (status: string) => {
		const norm = status.toUpperCase();
		if (norm === 'PASSED' || norm === 'COMPLETED' || norm === 'TESTING_PASSED') {
			return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
		}
		if (norm === 'FAILED' || norm === 'TESTING_FAILED') {
			return 'bg-rose-50 text-rose-700 border border-rose-200';
		}
		return 'bg-amber-50 text-amber-800 border border-amber-200';
	};

	return (
		<div className="space-y-6">
			{/* Filters toolbar */}
			<div className="bg-white border border-zinc-200/50 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
				<div className="relative w-full lg:max-w-xs">
					<Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
					<input
						type="text"
						placeholder="Search by brand, model, code..."
						value={searchQuery}
						onChange={e => setSearchQuery(e.target.value)}
						className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-zinc-850 placeholder-zinc-400 outline-none focus:bg-white focus:border-[#11236a]"
					/>
				</div>

				<div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
					<div className="flex items-center gap-1.5">
						<span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
							Report Status:
						</span>

						<CustomSelect
							value={statusFilter}
							onChange={setStatusFilter}
							options={[
								{ value: 'ALL', label: 'All Statuses' },
								{ value: 'UNDER_REVIEW', label: 'Under Review' },
								{ value: 'PASSED', label: 'Passed' },
								{ value: 'FAILED', label: 'Failed' },
							]}
							className="w-44"
						/>
					</div>

					{(searchQuery || statusFilter !== 'ALL') && (
						<button
							type="button"
							onClick={() => {
								setSearchQuery('');
								setStatusFilter('ALL');
							}}
							className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/50 px-3 py-2 rounded-xl cursor-pointer transition-all"
						>
							Clear
						</button>
					)}
				</div>
			</div>

			{/* Main Content Table */}
			<div className="bg-white border border-zinc-200/60 rounded-3xl shadow-sm overflow-hidden">
				<div className="p-6 border-b border-zinc-100 flex items-center gap-3">
					<div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
						<CheckCircle className="w-5 h-5" />
					</div>

					<div>
						<h2 className="text-base font-bold text-zinc-900 leading-tight">Submitted Test Reports Registry</h2>
						<p className="text-xs text-zinc-500 font-medium">
							Archive of all safety, performance, and NABL test reports.
						</p>
					</div>
				</div>

				<div className="overflow-x-auto w-full">
					{filteredPlans.length === 0 ? (
						<div className="text-center py-16">
							<Clipboard className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
							<h4 className="text-sm font-bold text-zinc-800">No submitted test reports found</h4>
							<p className="text-xs text-zinc-500 font-light mt-1 max-w-sm mx-auto">
								Any test plan reports you fill out and submit will be archived here.
							</p>
						</div>
					) : (
						<table className="w-full text-xs">
							<thead>
								<tr className="bg-zinc-50 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-100 whitespace-nowrap">
									<th className="py-3 px-6 text-left">Allotted Code</th>
									<th className="py-3 px-6 text-left">Brand & Model</th>
									<th className="py-3 px-6 text-left">Test Type</th>
									<th className="py-3 px-6 text-left">Date Submitted</th>
									<th className="py-3 px-6 text-left">Status</th>
									<th className="py-3 px-6 text-right">Actions</th>
								</tr>
							</thead>
							<tbody>
								{filteredPlans.map((item, i) => (
									<tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
										<td className="py-4 px-6 font-bold text-[#11236a]">
											{item.allottedId}
										</td>
										<td className="py-4 px-6">
											<p className="font-bold text-zinc-800">{item.request.brandName}</p>
											<p className="text-zinc-400 text-[10px] font-semibold mt-0.5">{item.request.modelNo}</p>
										</td>
										<td className="py-4 px-6">
											<span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 whitespace-nowrap">
												{item.testType?.name || 'General'}
											</span>
										</td>
										<td className="py-4 px-6 text-zinc-400 font-medium whitespace-nowrap">
											{formatDateTime(item.createdAt)}
										</td>
										<td className="py-4 px-6">
											<span className={`inline-flex items-center text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wide whitespace-nowrap ${getStatusBadge(item.status)}`}>
												{item.status.replace('_', ' ')}
											</span>
										</td>
										<td className="py-4 px-6 text-right">
											<button
												disabled={!item.isEvaluated}
												onClick={() => window.open('/reports/preview?type=sample&key=' + item.key, '_blank')}
												className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#11236a] hover:text-white px-3 py-2 rounded-xl border border-[#11236a]/20 bg-white hover:bg-[#11236a] disabled:bg-zinc-50 disabled:text-zinc-400 disabled:border-zinc-200 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-zinc-400 transition-all cursor-pointer outline-none"
											>
												<Eye className="w-3.5 h-3.5" /> View Report
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>
			</div>
		</div>
	);
}
