import { useState } from 'react';
import { XCircle, Search, AlertTriangle } from 'lucide-react';

const failedTests = [
	{ id: 'REQ-2026-012', brand: 'SMT Control Board', model: 'SCB-X90-R2', customer: 'Dixon Electronics', testMethod: 'IEC 60065', failReason: 'Dielectric strength failure at 2500V AC test', date: '2026-05-28', decision: 'PENDING' },
	{ id: 'REQ-2026-008', brand: 'BLDC Motor Controller', model: 'BMC-220V', customer: 'Havells India', testMethod: 'IEC 60034', failReason: 'Insulation resistance below 1MΩ at elevated temperature', date: '2026-05-24', decision: 'PENDING' },
	{ id: 'REQ-2026-004', brand: 'LED Driver Unit', model: 'LDU-24V', customer: 'Philips Lighting', testMethod: 'IEC 61347', failReason: 'THD exceeded 10% limit during load variation test', date: '2026-05-20', decision: 'CAPA_INITIATED' },
];

const decisionBadge = (d: string) =>
	d === 'PENDING'
		? 'bg-rose-50 text-rose-700 border-rose-100'
		: 'bg-amber-50 text-amber-700 border-amber-200';

export default function HeadFailureDecision() {
	const [search, setSearch] = useState('');

	const filtered = failedTests.filter(r =>
		r.id.toLowerCase().includes(search.toLowerCase()) ||
		r.brand.toLowerCase().includes(search.toLowerCase())
	);

	return (
		<div className="space-y-5">
			{/* Warning banner */}
			<div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3">
				<div className="w-9 h-9 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
					<AlertTriangle className="w-5 h-5 text-rose-600" />
				</div>
				<div>
					<p className="text-xs font-bold text-rose-800">{failedTests.length} Test Plans Failed — Awaiting Failure Decision</p>
					<p className="text-[10px] text-rose-500 font-medium mt-0.5">Review each failure and initiate CAPA or re-test authorization.</p>
				</div>
			</div>

			{/* Search */}
			<div className="bg-white border border-zinc-200/50 rounded-2xl p-4 shadow-sm flex items-center gap-3">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
					<input
						type="text"
						placeholder="Search by ID or brand..."
						value={search}
						onChange={e => setSearch(e.target.value)}
						className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-[#11236a] outline-none transition-all"
					/>
				</div>
				<span className="ml-auto text-[10px] font-bold text-zinc-400 uppercase">{filtered.length} failures</span>
			</div>

			{/* Cards */}
			<div className="space-y-4">
				{filtered.map((item, i) => (
					<div key={i} className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm space-y-4">
						<div className="flex items-start justify-between gap-4">
							<div>
								<div className="flex items-center gap-2">
									<span className="text-[10px] font-bold text-[#11236a]">{item.id}</span>
									<span className="text-zinc-300">|</span>
									<span className="text-[10px] font-medium text-zinc-500">{item.date}</span>
								</div>
								<h4 className="text-sm font-bold text-zinc-900 mt-0.5">{item.brand} <span className="text-zinc-400 font-medium">— {item.model}</span></h4>
								<p className="text-[10px] text-zinc-500 font-medium mt-0.5">{item.customer} · {item.testMethod}</p>
							</div>
							<span className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${decisionBadge(item.decision)}`}>
								{item.decision === 'PENDING' ? <XCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
								{item.decision.replace(/_/g, ' ')}
							</span>
						</div>

						<div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3">
							<p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider mb-1">Failure Reason</p>
							<p className="text-xs font-semibold text-zinc-700">{item.failReason}</p>
						</div>

						<div className="flex items-center gap-2 justify-end border-t border-zinc-100 pt-3">
							<button className="text-[10px] font-bold text-zinc-600 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg px-3 py-1.5 outline-none cursor-pointer transition-colors">
								Authorize Re-Test
							</button>
							<button className="text-[10px] font-bold text-white bg-amber-600 hover:bg-amber-700 border border-amber-600 rounded-lg px-3 py-1.5 outline-none cursor-pointer transition-colors">
								Initiate CAPA
							</button>
							<button className="text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 border border-rose-600 rounded-lg px-3 py-1.5 outline-none cursor-pointer transition-colors">
								Close / Reject
							</button>
						</div>
					</div>
				))}
				{filtered.length === 0 && (
					<div className="bg-white border border-zinc-200/50 rounded-2xl py-12 text-center shadow-sm">
						<p className="text-sm font-bold text-zinc-400">No failed tests found.</p>
					</div>
				)}
			</div>
		</div>
	);
}
