import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, Search, RefreshCw, Eye, FileText, AlertTriangle } from 'lucide-react';
import { getTestRequests } from '../../services/operations/testRequestService';

export default function HeadFailureDecision() {
	const navigate = useNavigate();
	const [requests, setRequests] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState('');

	const loadRequests = async () => {
		setLoading(true);
		try {
			const fetchRequests = getTestRequests();
			const data = await fetchRequests();
			setRequests(data || []);
		} catch (error) {
			console.error('Failed to fetch failed requests:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadRequests();
	}, []);

	// Filter requests where status is failed/retest, or all samples are failed
	const failedRequests = requests.filter((req: any) => {
		const statusLower = (req.status || '').toLowerCase();
		const isFailedStatus = ['testing_failed', 'fail', 'failed', 'retest'].includes(statusLower);

		const qty = req.sampleQty || 1;
		let failedCount = 0;
		for (let i = 0; i < qty; i++) {
			const report = (req.sampleInspections || []).find((r: any) => Number(r.sampleIndex) === i);
			if (report && report.status === 'FAILED') {
				failedCount++;
			}
		}
		const isFullyFailed = failedCount === qty;
		return isFailedStatus || isFullyFailed;
	});

	// Filter based on search query
	const filtered = failedRequests.filter((r: any) => {
		const q = search.toLowerCase();
		return (
			(r.requestId || '').toLowerCase().includes(q) ||
			(r.brandName || '').toLowerCase().includes(q) ||
			(r.modelNo || '').toLowerCase().includes(q) ||
			(r.customerNameAddress || '').toLowerCase().includes(q)
		);
	});

	const formatDate = (dateStr: string) => {
		if (!dateStr) return 'N/A';
		const d = new Date(dateStr);
		if (isNaN(d.getTime())) return dateStr;
		const day = String(d.getDate()).padStart(2, '0');
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const year = d.getFullYear();
		return `${day}/${month}/${year}`;
	};

	return (
		<div className="space-y-5">
			{/* Warning Banner */}
			<div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<div className="w-9 h-9 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
						<AlertTriangle className="w-5 h-5 text-rose-600" />
					</div>
					<div>
						<p className="text-xs font-bold text-rose-800">{failedRequests.length} Failed Requests Pending Adjudication</p>
						<p className="text-[10px] text-rose-600 font-medium mt-0.5">Review failed test outcomes, choose to authorize a retest or certify the failure report to the requester.</p>
					</div>
				</div>
				<button 
					onClick={loadRequests} 
					disabled={loading}
					className="p-2 text-zinc-555 hover:text-[#11236a] hover:bg-zinc-100 rounded-lg cursor-pointer transition-all border-none outline-none disabled:opacity-50"
				>
					<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
				</button>
			</div>

			{/* Search */}
			<div className="bg-white border border-zinc-200/50 rounded-2xl p-4 shadow-sm flex items-center gap-3">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
					<input
						type="text"
						placeholder="Search by ID, brand, model or customer..."
						value={search}
						onChange={e => setSearch(e.target.value)}
						className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-[#11236a] outline-none transition-all"
					/>
				</div>
				<span className="ml-auto text-[10px] font-bold text-zinc-400 uppercase">{filtered.length} requests found</span>
			</div>

			{/* Table */}
			<div className="bg-white border border-zinc-200/50 rounded-2xl shadow-sm overflow-hidden">
				{loading ? (
					<div className="flex flex-col items-center justify-center py-20 gap-3">
						<RefreshCw className="w-8 h-8 text-[#11236a] animate-spin" />
						<p className="text-xs text-zinc-555 font-bold">Retrieving failed records...</p>
					</div>
				) : (
					<>
						<table className="w-full text-xs">
							<thead>
								<tr className="bg-zinc-50 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-100">
									<th className="py-3 px-5 text-left">Request ID</th>
									<th className="py-3 px-5 text-left">Brand / Model</th>
									<th className="py-3 px-5 text-left">Customer</th>
									<th className="py-3 px-5 text-left">Report No.</th>
									<th className="py-3 px-5 text-left">Result Status</th>
									<th className="py-3 px-5 text-left">Date</th>
									<th className="py-3 px-5 text-right">Actions</th>
								</tr>
							</thead>
							<tbody>
								{filtered.map((rep, i) => {
									const isRetest = (rep.status || '').toLowerCase() === 'retest';
									const isCompleted = ['completed', 'failed', 'fail'].includes((rep.status || '').toLowerCase());

									let badgeClass = 'bg-rose-50 text-rose-700 border-rose-100';
									let badgeText = 'ALL SAMPLES FAILED';

									if (isRetest) {
										badgeClass = 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse';
										badgeText = 'RETURNED FOR RETEST';
									} else if (isCompleted) {
										badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';
										badgeText = 'FINALIZED & RELEASED';
									}

									return (
										<tr key={i} className="border-t border-zinc-100 hover:bg-zinc-50/50 transition-colors">
											<td className="py-4 px-5 font-bold text-[#11236a]">
												{rep.requestId || `REQ-00${rep.id}`}
											</td>
											<td className="py-4 px-5">
												<p className="font-bold text-zinc-800">{rep.brandName}</p>
												<p className="text-zinc-400 text-[10px] font-semibold mt-0.5">{rep.modelNo}</p>
											</td>
											<td className="py-4 px-5 text-zinc-600 font-medium truncate max-w-[150px]">{rep.customerNameAddress}</td>
											<td className="py-4 px-5 font-bold text-zinc-700">RPT-{rep.requestId || `00${rep.id}`}</td>
											<td className="py-4 px-5">
												<span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${badgeClass}`}>
													{badgeText}
												</span>
											</td>
											<td className="py-4 px-5 text-zinc-400 font-medium">{formatDate(rep.updatedAt || rep.createdAt)}</td>
											<td className="py-4 px-5 text-right">
												<div className="flex items-center justify-end gap-2">
													<button 
														onClick={() => navigate(`/head/failure-decision/${rep.id}`)}
														className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#11236a] hover:text-white px-2.5 py-1.5 rounded-lg border border-[#11236a]/20 bg-white hover:bg-[#11236a] transition-all cursor-pointer outline-none"
													>
														<Eye className="w-3.5 h-3.5" /> Details
													</button>
													<button 
														onClick={() => window.open(`/reports/preview?type=request&id=${rep.id}`, '_blank')}
														className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-750 rounded-lg px-2.5 py-1.5 transition-all outline-none cursor-pointer border-none"
													>
														<FileText className="w-3.5 h-3.5" /> Report
													</button>
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
						{filtered.length === 0 && (
							<div className="py-16 text-center bg-white">
								<AlertTriangle className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
								<p className="text-sm font-bold text-zinc-400">No failed requests pending adjudication.</p>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}
