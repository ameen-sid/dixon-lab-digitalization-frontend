import { useState, useEffect } from 'react';
import { AlertTriangle, Search, CheckCircle, RefreshCw } from 'lucide-react';
import { getCapas, updateCapaStatus } from '../../services/operations/capaService';

export default function HeadCapaReports() {
	const [capas, setCapas] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState('ALL');

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
		const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
		return matchSearch && matchStatus;
	});

	const formatDate = (d: string) => {
		if (!d) return '—';
		try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
		catch { return d; }
	};

	return (
		<div className="space-y-5">
			{/* Toolbar */}
			<div className="bg-white border border-zinc-200/50 rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-3">
				<div className="relative flex-1 min-w-[220px]">
					<Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
					<input
						type="text"
						placeholder="Search CAPA ID, product, or request..."
						value={search}
						onChange={e => setSearch(e.target.value)}
						className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-[#11236a] outline-none transition-all"
					/>
				</div>
				<select
					value={statusFilter}
					onChange={e => setStatusFilter(e.target.value)}
					className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 outline-none cursor-pointer"
				>
					<option value="ALL">All Statuses</option>
					<option value="OPEN">Open</option>
					<option value="COMPLETED">Completed</option>
				</select>
				<button
					onClick={loadCapas}
					className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 hover:text-[#11236a] bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-xl cursor-pointer outline-none transition-colors"
				>
					<RefreshCw className="w-3.5 h-3.5" /> Refresh
				</button>
				<span className="ml-auto text-[10px] font-bold text-zinc-400 uppercase">{filtered.length} records</span>
			</div>

			{/* Loading */}
			{loading && (
				<div className="bg-white border border-zinc-200/50 rounded-2xl py-12 text-center shadow-sm">
					<div className="w-6 h-6 border-2 border-[#11236a] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
					<p className="text-xs font-bold text-zinc-400">Loading CAPA reports...</p>
				</div>
			)}

			{/* Cards */}
			{!loading && (
				<div className="space-y-4">
					{filtered.map((capa, i) => (
						<div key={i} className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm space-y-4">
							{/* Header */}
							<div className="flex items-start justify-between gap-4 border-b border-zinc-100 pb-3">
								<div>
									<div className="flex items-center gap-2 flex-wrap">
										<span className="text-[10px] font-bold text-indigo-700">{capa.capaId}</span>
										<span className="text-zinc-300">|</span>
										<span className="text-[10px] font-bold text-[#11236a]">REF: {capa.relatedRequest}</span>
										<span className="text-zinc-300">|</span>
										<span className="text-[10px] text-zinc-400 font-medium">
											Submitted by: {capa.submittedBy?.name || 'Unknown'} · {formatDate(capa.createdAt)}
										</span>
									</div>
									<h4 className="text-sm font-bold text-zinc-900 mt-1">{capa.productName}</h4>
									{capa.title && <p className="text-[11px] text-zinc-500 font-medium mt-0.5">{capa.title}</p>}
								</div>
								<span className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${capa.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
									{capa.status === 'COMPLETED' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
									{capa.status}
								</span>
							</div>

							{/* Details Grid */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
								<div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3">
									<p className="text-[9px] font-bold text-rose-700 uppercase tracking-wider mb-1">Non-Conformity / Problem</p>
									<p className="font-semibold text-zinc-700 leading-relaxed">{capa.nonConformity || capa.problem || '—'}</p>
								</div>
								<div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3">
									<p className="text-[9px] font-bold text-amber-700 uppercase tracking-wider mb-1">Root Cause (Why 1)</p>
									<p className="font-semibold text-zinc-700 leading-relaxed">{capa.rootCause || capa.why1 || '—'}</p>
								</div>
								<div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
									<p className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Corrective Action</p>
									<p className="font-semibold text-zinc-700 leading-relaxed">{capa.correctiveAction || capa.tempCountermeasure || '—'}</p>
								</div>
							</div>

							{/* Footer */}
							<div className="flex items-center justify-between pt-2 border-t border-zinc-100">
								<div className="flex items-center gap-4 text-[10px] font-semibold text-zinc-500">
									<span>Owner: <span className="text-zinc-700 font-bold">{capa.owner || '—'}</span></span>
									<span>Target: <span className="text-zinc-700 font-bold">{capa.targetedDate || '—'}</span></span>
									{capa.improvementType && <span>Type: <span className="text-zinc-700 font-bold">{capa.improvementType}</span></span>}
								</div>
								{capa.status === 'OPEN' && (
									<button
										onClick={() => handleResolve(capa.id)}
										className="text-[10px] font-bold text-white bg-[#11236a] hover:bg-[#0c1a52] rounded-lg px-3 py-1.5 outline-none cursor-pointer border-none transition-colors"
									>
										Mark as Resolved
									</button>
								)}
							</div>
						</div>
					))}
					{filtered.length === 0 && (
						<div className="bg-white border border-zinc-200/50 rounded-2xl py-12 text-center shadow-sm">
							<AlertTriangle className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
							<p className="text-sm font-bold text-zinc-400">No CAPA records found.</p>
							<p className="text-xs text-zinc-400 mt-1">CAPA reports submitted by requesters will appear here.</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
