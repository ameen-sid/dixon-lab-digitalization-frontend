import { useState, useEffect } from 'react';
import { AlertTriangle, Search, CheckCircle, RefreshCw, X } from 'lucide-react';
import { getCapas, updateCapaStatus } from '../../services/operations/capaService';
import CapaReports from '../requester/CapaReports';
import CustomSelect from '../../components/CustomSelect';
import Pagination from '../../components/Pagination';

export default function HeadCapaReports() {
	const [capas, setCapas] = useState<any[]>([]);
	const [selectedCapa, setSelectedCapa] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState('ALL');
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');

	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(5);
	const [remarks, setRemarks] = useState('');

	const loadCapas = async () => {
		setLoading(true);
		try {
			const data = await getCapas()();
			setCapas(data);
		} catch (err) {
			console.error('Failed to load CAPAs', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { loadCapas(); }, []);

	const handleResolve = async (id: number) => {
		try {
			await updateCapaStatus(id, 'COMPLETED')();
			await loadCapas();
		} catch (err) {
			console.error('Failed to update CAPA status', err);
		}
	};

	const filtered = capas.filter(c => {
		const matchSearch =
			(c.capaId || '').toLowerCase().includes(search.toLowerCase()) ||
			(c.productName || '').toLowerCase().includes(search.toLowerCase()) ||
			(c.relatedRequest || '').toLowerCase().includes(search.toLowerCase());
		let matchStatus = true;
		if (statusFilter === 'OPEN') {
			matchStatus = (c.status || '').toUpperCase() !== 'COMPLETED';
		} else if (statusFilter === 'COMPLETED') {
			matchStatus = (c.status || '').toUpperCase() === 'COMPLETED';
		}
		let matchDate = true;
		const createdDate = c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : '';
		if (startDate) {
			matchDate = matchDate && createdDate >= startDate;
		}
		if (endDate) {
			matchDate = matchDate && createdDate <= endDate;
		}
		return matchSearch && matchStatus && matchDate;
	});

	const formatDate = (d: string) => {
		if (!d) return '—';
		try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
		catch { return d; }
	};

	// Pagination Math
	const maxPage = Math.ceil(filtered.length / itemsPerPage);
	const activePage = maxPage > 0 ? Math.min(currentPage, maxPage) : 1;
	
	const startIndex = (activePage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedFiltered = filtered.slice(startIndex, endIndex);

	const handleApproveCapa = async () => {
		if (!selectedCapa) return;
		try {
			await updateCapaStatus(selectedCapa.id, 'COMPLETED', remarks)();
			const updatedCapa = { ...selectedCapa, status: 'COMPLETED', remark: remarks };
			setSelectedCapa(updatedCapa);
			await loadCapas();
			setRemarks('');
		} catch (err) {
			console.error('Failed to approve CAPA:', err);
		}
	};

	if (selectedCapa) {
		return (
			<div className="space-y-6">
				<CapaReports selectedCapa={selectedCapa} setActiveTab={() => setSelectedCapa(null)} />
				{(selectedCapa.status || '').toUpperCase() !== 'COMPLETED' && (
					<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm space-y-4 max-w-6xl mx-auto">
						<div>
							<h3 className="text-sm font-bold text-zinc-900">Lab Head Adjudication & Certification</h3>
							<p className="text-[11px] text-zinc-400 font-semibold mt-0.5">Review the corrective and preventive actions submitted. Provide remarks and click Approve to certify this CAPA report.</p>
						</div>
						
						<div className="space-y-2">
							<label className="block text-[10px] font-bold text-zinc-700 uppercase tracking-wider">Approval / Verification Remarks</label>
							<textarea
								value={remarks}
								onChange={e => setRemarks(e.target.value)}
								placeholder="Enter verification comments or approval remarks..."
								className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-[#11236a] outline-none transition-all resize-none h-24"
							/>
						</div>

						<div className="flex justify-end gap-3 pt-2">
							<button
								onClick={() => setSelectedCapa(null)}
								className="px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 rounded-xl cursor-pointer transition-colors border-none outline-none"
							>
								Cancel
							</button>
							<button
								onClick={handleApproveCapa}
								disabled={!remarks.trim()}
								className="px-5 py-2 text-xs font-bold text-white bg-[#11236a] hover:bg-[#0c1a52] rounded-xl cursor-pointer disabled:opacity-50 transition-colors border-none outline-none"
							>
								Approve & Close CAPA
							</button>
						</div>
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-5">
			{/* Toolbar */}
			<div className="bg-white border border-zinc-200/50 rounded-2xl p-4 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
				<div className="flex flex-col md:flex-row gap-3 flex-1 flex-wrap">
					<div className="relative min-w-[200px] flex-1">
						<Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
						<input
							type="text"
							placeholder="Search CAPA ID, product, or request..."
							value={search}
							onChange={e => {
								setSearch(e.target.value);
								setCurrentPage(1);
							}}
							className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-[#11236a] outline-none transition-all"
						/>
						{search && (
							<button 
								onClick={() => {
									setSearch('');
									setCurrentPage(1);
								}}
								className="absolute right-3 top-2.5 text-zinc-400 hover:text-red-655 bg-transparent border-none cursor-pointer outline-none"
							>
								<X className="w-4 h-4" />
							</button>
						)}
					</div>

					<CustomSelect
						value={statusFilter}
						onChange={(val) => {
							setStatusFilter(val);
							setCurrentPage(1);
						}}
						options={[
							{ value: 'ALL', label: 'All Statuses' },
							{ value: 'OPEN', label: 'Open' },
							{ value: 'COMPLETED', label: 'Completed' }
						]}
						className="w-44 shrink-0"
					/>

					<div className="flex items-center gap-2 bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-1">
						<span className="text-[9px] font-extrabold text-zinc-700 uppercase tracking-wider">From</span>
						<input 
							type="date" 
							value={startDate}
							onChange={(e) => {
								setStartDate(e.target.value);
								setCurrentPage(1);
							}}
							className="bg-transparent border-none text-xs font-semibold text-zinc-700 outline-none cursor-pointer"
						/>
					</div>

					<div className="flex items-center gap-2 bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-1">
						<span className="text-[9px] font-extrabold text-zinc-700 uppercase tracking-wider">To</span>
						<input 
							type="date" 
							value={endDate}
							onChange={(e) => {
								setEndDate(e.target.value);
								setCurrentPage(1);
							}}
							className="bg-transparent border-none text-xs font-semibold text-zinc-700 outline-none cursor-pointer"
						/>
					</div>

					<button
						onClick={loadCapas}
						className="flex items-center gap-1.5 text-xs font-bold text-zinc-650 hover:text-[#11236a] bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-xl cursor-pointer outline-none transition-colors"
					>
						<RefreshCw className="w-3.5 h-3.5" /> Refresh
					</button>
				</div>

				<div className="flex items-center gap-3.5 ml-auto">
					{(search || statusFilter !== 'ALL' || startDate || endDate) && (
						<button 
							onClick={() => {
								setSearch('');
								setStatusFilter('ALL');
								setStartDate('');
								setEndDate('');
								setCurrentPage(1);
							}}
							className="text-xs font-bold text-red-655 hover:text-red-755 hover:underline bg-transparent border-none cursor-pointer text-left"
						>
							Clear Filters
						</button>
					)}
					<span className="text-[10px] font-bold text-zinc-400 uppercase shrink-0">{filtered.length} records</span>
				</div>
			</div>

			{/* Table */}
			<div className="bg-white border border-zinc-200/50 rounded-2xl shadow-sm overflow-hidden">
				{loading ? (
					<div className="flex flex-col items-center justify-center py-20 gap-3">
						<RefreshCw className="w-8 h-8 text-[#11236a] animate-spin" />
						<p className="text-xs text-zinc-550 font-bold">Retrieving CAPA records...</p>
					</div>
				) : (
					<>
						<table className="w-full text-xs">
							<thead>
								<tr className="bg-zinc-50 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-100">
									<th className="py-3 px-5 text-left">CAPA ID</th>
									<th className="py-3 px-5 text-left">Related Request</th>
									<th className="py-3 px-5 text-left">Product / Title</th>
									<th className="py-3 px-5 text-left">Submitted By</th>
									<th className="py-3 px-5 text-left">Target Date</th>
									<th className="py-3 px-5 text-left">Status</th>
									<th className="py-3 px-5 text-right">Actions</th>
								</tr>
							</thead>
							<tbody>
								{paginatedFiltered.map((capa, i) => {
									const isCompleted = capa.status === 'COMPLETED';
									return (
										<tr key={i} className="border-t border-zinc-100 hover:bg-zinc-50/50 transition-colors">
											<td className="py-4 px-5 font-bold text-indigo-700">
												{capa.capaId}
											</td>
											<td className="py-4 px-5 font-bold text-[#11236a]">
												{capa.relatedRequest || 'N/A'}
											</td>
											<td className="py-4 px-5">
												<p className="font-bold text-zinc-800">{capa.productName}</p>
												{capa.title && <p className="text-zinc-400 text-[10px] font-semibold mt-0.5">{capa.title}</p>}
											</td>
											<td className="py-4 px-5">
												<p className="font-bold text-zinc-700">{capa.submittedBy?.name || 'Unknown'}</p>
												<p className="text-zinc-400 text-[10px] font-semibold mt-0.5">{formatDate(capa.createdAt)}</p>
											</td>
											<td className="py-4 px-5 text-zinc-700 font-semibold">
												{formatDate(capa.targetedDate)}
											</td>
											<td className="py-4 px-5">
												<span className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${
													isCompleted 
														? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
														: 'bg-rose-50 text-rose-700 border-rose-100'
												}`}>
													{isCompleted ? <CheckCircle className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5" />}
													{capa.status}
												</span>
											</td>
											<td className="py-4 px-5 text-right">
												<div className="flex items-center justify-end gap-2">
													<button 
														onClick={() => setSelectedCapa(capa)}
														className="inline-flex items-center gap-1 text-[10px] font-extrabold text-indigo-700 hover:text-white px-2.5 py-1.5 rounded-lg border border-indigo-700/20 bg-white hover:bg-indigo-700 transition-all cursor-pointer outline-none"
													>
														View Report
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
								<p className="text-sm font-bold text-zinc-400">No CAPA records found.</p>
							</div>
						)}
						<Pagination
							totalItems={filtered.length}
							itemsPerPage={itemsPerPage}
							currentPage={currentPage}
							onPageChange={setCurrentPage}
							onItemsPerPageChange={(limit) => {
								setItemsPerPage(limit);
								setCurrentPage(1);
							}}
							itemNamePlural="CAPA reports"
						/>
					</>
				)}
			</div>
		</div>
	);
}
