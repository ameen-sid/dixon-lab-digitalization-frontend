import { useState } from 'react';
import { CheckCircle, Download, Search } from 'lucide-react';

const completedReports = [
	{ id: 'REQ-2026-013', brand: 'LED Driver Unit V2', model: 'LDU-48V', customer: 'Philips Lighting', reportNo: 'RPT-2026-013', completedDate: '2026-05-29' },
	{ id: 'REQ-2026-011', brand: 'Relay Switch Pack', model: 'RSP-24DC', customer: 'Schneider Electric', reportNo: 'RPT-2026-011', completedDate: '2026-05-27' },
	{ id: 'REQ-2026-009', brand: 'Motor Drive Unit', model: 'MDU-380V', customer: 'ABB India', reportNo: 'RPT-2026-009', completedDate: '2026-05-25' },
	{ id: 'REQ-2026-007', brand: 'Surge Protector SPD', model: 'SPD-40KA', customer: 'Legrand India', reportNo: 'RPT-2026-007', completedDate: '2026-05-23' },
	{ id: 'REQ-2026-005', brand: 'EV Charging Module', model: 'EVM-7.4KW', customer: 'Tata Power EV', reportNo: 'RPT-2026-005', completedDate: '2026-05-21' },
	{ id: 'REQ-2026-003', brand: 'Capacitor Bank Unit', model: 'CBU-440VAC', customer: 'Siemens India', reportNo: 'RPT-2026-003', completedDate: '2026-05-19' },
	{ id: 'REQ-2026-001', brand: 'SMT Control Board', model: 'SCB-X90', customer: 'Dixon Electronics', reportNo: 'RPT-2026-001', completedDate: '2026-05-15' },
];

export default function HeadCompletedReports() {
	const [search, setSearch] = useState('');

	const filtered = completedReports.filter(r =>
		r.id.toLowerCase().includes(search.toLowerCase()) ||
		r.brand.toLowerCase().includes(search.toLowerCase()) ||
		r.reportNo.toLowerCase().includes(search.toLowerCase())
	);

	return (
		<div className="space-y-5">
			{/* Summary Banner */}
			<div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
				<div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
					<CheckCircle className="w-5 h-5 text-emerald-600" />
				</div>
				<div>
					<p className="text-xs font-bold text-emerald-800">{completedReports.length} Test Plans Passed & Reports Released</p>
					<p className="text-[10px] text-emerald-600 font-medium mt-0.5">All reports have been approved and are available for download.</p>
				</div>
			</div>

			{/* Search */}
			<div className="bg-white border border-zinc-200/50 rounded-2xl p-4 shadow-sm flex items-center gap-3">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
					<input
						type="text"
						placeholder="Search by ID, brand, or report no..."
						value={search}
						onChange={e => setSearch(e.target.value)}
						className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-[#11236a] outline-none transition-all"
					/>
				</div>
				<span className="ml-auto text-[10px] font-bold text-zinc-400 uppercase">{filtered.length} reports</span>
			</div>

			{/* Table */}
			<div className="bg-white border border-zinc-200/50 rounded-2xl shadow-sm overflow-hidden">
				<table className="w-full text-xs">
					<thead>
						<tr className="bg-zinc-50 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-100">
							<th className="py-3 px-5 text-left">Request ID</th>
							<th className="py-3 px-5 text-left">Brand / Model</th>
							<th className="py-3 px-5 text-left">Customer</th>
							<th className="py-3 px-5 text-left">Report No.</th>
							<th className="py-3 px-5 text-left">Result</th>
							<th className="py-3 px-5 text-left">Completed Date</th>
							<th className="py-3 px-5 text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{filtered.map((rep, i) => (
							<tr key={i} className="border-t border-zinc-100 hover:bg-zinc-50/50 transition-colors">
								<td className="py-4 px-5 font-bold text-[#11236a]">{rep.id}</td>
								<td className="py-4 px-5">
									<p className="font-bold text-zinc-800">{rep.brand}</p>
									<p className="text-zinc-400 text-[10px] font-semibold mt-0.5">{rep.model}</p>
								</td>
								<td className="py-4 px-5 text-zinc-600 font-medium">{rep.customer}</td>
								<td className="py-4 px-5 font-bold text-zinc-700">{rep.reportNo}</td>
								<td className="py-4 px-5">
									<span className="inline-flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-100">
										<CheckCircle className="w-3 h-3 shrink-0" /> PASS
									</span>
								</td>
								<td className="py-4 px-5 text-zinc-400 font-medium">{rep.completedDate}</td>
								<td className="py-4 px-5 text-right">
									<button className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-[#11236a] hover:bg-[#0c1a52] rounded-lg px-3 py-1.5 transition-all outline-none cursor-pointer border-none">
										<Download className="w-3.5 h-3.5" /> Download
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
				{filtered.length === 0 && (
					<div className="py-12 text-center">
						<p className="text-sm font-bold text-zinc-400">No completed reports found.</p>
					</div>
				)}
			</div>
		</div>
	);
}
