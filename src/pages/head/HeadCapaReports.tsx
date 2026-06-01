import { useState } from 'react';
import { AlertTriangle, Search, CheckCircle } from 'lucide-react';

const capaReports = [
	{ id: 'CAPA-2026-004', relatedReq: 'REQ-2026-012', product: 'SMT Control Board X-90', nonConformity: 'Dielectric strength failure at 2500V AC insulation test.', rootCause: 'Substandard PCB laminate substrate used in batch lot B22.', corrective: 'Replace PCB laminate supplier and rework batch B22.', preventive: 'Enforce incoming quality check on laminate dielectric specs.', owner: 'SMT Engineering', target: '2026-06-15', status: 'OPEN', submittedBy: 'Lab Engineer', date: '2026-05-29' },
	{ id: 'CAPA-2026-003', relatedReq: 'REQ-2026-008', product: 'BLDC Motor Controller', nonConformity: 'Insulation resistance dropped below 1MΩ at 85°C thermal test.', rootCause: 'Wire insulation rating insufficient for continuous elevated temperature.', corrective: 'Replace wiring harness with 105°C rated insulation.', preventive: 'Update BOM specification for all motor controllers above 200V.', owner: 'Design Engineering', target: '2026-06-10', status: 'OPEN', submittedBy: 'Requester', date: '2026-05-25' },
	{ id: 'CAPA-2026-002', relatedReq: 'REQ-2026-004', product: 'LED Driver Unit V1', nonConformity: 'THD exceeded 10% during 20–100% load sweep test.', rootCause: 'PFC controller firmware had incorrect compensation coefficients.', corrective: 'Flash updated PFC firmware v2.3 across affected units.', preventive: 'Add firmware version validation gate in production line testing.', owner: 'Firmware Engineering', target: '2026-05-30', status: 'COMPLETED', submittedBy: 'Lab Manager', date: '2026-05-20' },
	{ id: 'CAPA-2026-001', relatedReq: 'REQ-2026-001', product: 'SMT Control Board Legacy', nonConformity: 'Delamination on SMT solder pads during thermal shock.', rootCause: 'Reflow peak temperature too low causing void formation.', corrective: 'Recalibrate reflow oven to 250°C peak with nitrogen purge.', preventive: 'Monthly thermal profiling mandatory for all new board revisions.', owner: 'SMT Engineering', target: '2026-06-01', status: 'COMPLETED', submittedBy: 'Requester', date: '2026-05-15' },
];

export default function HeadCapaReports() {
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState('ALL');

	const filtered = capaReports.filter(c => {
		const matchSearch = c.id.toLowerCase().includes(search.toLowerCase()) || c.product.toLowerCase().includes(search.toLowerCase()) || c.relatedReq.toLowerCase().includes(search.toLowerCase());
		const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
		return matchSearch && matchStatus;
	});

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
				<span className="ml-auto text-[10px] font-bold text-zinc-400 uppercase">{filtered.length} records</span>
			</div>

			{/* Cards */}
			<div className="space-y-4">
				{filtered.map((capa, i) => (
					<div key={i} className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm space-y-4">
						{/* Header */}
						<div className="flex items-start justify-between gap-4 border-b border-zinc-100 pb-3">
							<div>
								<div className="flex items-center gap-2 flex-wrap">
									<span className="text-[10px] font-bold text-indigo-700">{capa.id}</span>
									<span className="text-zinc-300">|</span>
									<span className="text-[10px] font-bold text-[#11236a]">REF: {capa.relatedReq}</span>
									<span className="text-zinc-300">|</span>
									<span className="text-[10px] text-zinc-400 font-medium">Submitted by: {capa.submittedBy} · {capa.date}</span>
								</div>
								<h4 className="text-sm font-bold text-zinc-900 mt-1">{capa.product}</h4>
							</div>
							<span className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${capa.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
								{capa.status === 'COMPLETED' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
								{capa.status}
							</span>
						</div>

						{/* Details Grid */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
							<div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3">
								<p className="text-[9px] font-bold text-rose-700 uppercase tracking-wider mb-1">Non-Conformity</p>
								<p className="font-semibold text-zinc-700 leading-relaxed">{capa.nonConformity}</p>
							</div>
							<div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3">
								<p className="text-[9px] font-bold text-amber-700 uppercase tracking-wider mb-1">Root Cause</p>
								<p className="font-semibold text-zinc-700 leading-relaxed">{capa.rootCause}</p>
							</div>
							<div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
								<p className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Corrective Action</p>
								<p className="font-semibold text-zinc-700 leading-relaxed">{capa.corrective}</p>
							</div>
						</div>

						{/* Footer */}
						<div className="flex items-center justify-between pt-2 border-t border-zinc-100">
							<div className="flex items-center gap-4 text-[10px] font-semibold text-zinc-500">
								<span>Owner: <span className="text-zinc-700 font-bold">{capa.owner}</span></span>
								<span>Target: <span className="text-zinc-700 font-bold">{capa.target}</span></span>
							</div>
							{capa.status === 'OPEN' && (
								<button className="text-[10px] font-bold text-white bg-[#11236a] hover:bg-[#0c1a52] rounded-lg px-3 py-1.5 outline-none cursor-pointer border-none transition-colors">
									Mark as Resolved
								</button>
							)}
						</div>
					</div>
				))}
				{filtered.length === 0 && (
					<div className="bg-white border border-zinc-200/50 rounded-2xl py-12 text-center shadow-sm">
						<p className="text-sm font-bold text-zinc-400">No CAPA records found.</p>
					</div>
				)}
			</div>
		</div>
	);
}
