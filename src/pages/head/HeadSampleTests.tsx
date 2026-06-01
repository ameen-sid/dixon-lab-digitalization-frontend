import { useState } from 'react';
import { CheckCircle, XCircle, Search, Eye } from 'lucide-react';

const sampleRequests = [
	{ id: 'REQ-2026-014', brand: 'Dixon PCB Module', model: 'PCB-X90', customer: 'Dixon Electronics Ltd.', testMethod: 'IEC 60065', qty: 3, date: '2026-05-30', status: 'PENDING_APPROVAL' },
	{ id: 'REQ-2026-010', brand: 'Thermal Sensor Array', model: 'TSA-400K', customer: 'Bosch Pvt Ltd.', testMethod: 'IS 302-2-21', qty: 5, date: '2026-05-26', status: 'PENDING_APPROVAL' },
	{ id: 'REQ-2026-008', brand: 'BLDC Motor Controller', model: 'BMC-220V', customer: 'Havells India', testMethod: 'IEC 60034', qty: 2, date: '2026-05-24', status: 'PENDING_APPROVAL' },
	{ id: 'REQ-2026-006', brand: 'Safety Relay Module', model: 'SRM-48DC', customer: 'Schneider Electric', testMethod: 'IEC 61810', qty: 6, date: '2026-05-22', status: 'UNDER_INSPECTION' },
	{ id: 'REQ-2026-004', brand: 'LED Driver Unit', model: 'LDU-24V', customer: 'Philips Lighting', testMethod: 'IEC 61347', qty: 4, date: '2026-05-20', status: 'PENDING_APPROVAL' },
	{ id: 'REQ-2026-002', brand: 'Inverter Control PCB', model: 'ICP-100Hz', customer: 'Microtek International', testMethod: 'IS 16086', qty: 1, date: '2026-05-18', status: 'UNDER_INSPECTION' },
];

export default function HeadSampleTests() {
	const [search, setSearch] = useState('');
	const [approving, setApproving] = useState<string | null>(null);

	const filtered = sampleRequests.filter(r =>
		r.id.toLowerCase().includes(search.toLowerCase()) ||
		r.brand.toLowerCase().includes(search.toLowerCase()) ||
		r.customer.toLowerCase().includes(search.toLowerCase())
	);

	return (
		<div className="space-y-5">
			{/* Toolbar */}
			<div className="bg-white border border-zinc-200/50 rounded-2xl p-4 shadow-sm flex items-center gap-3">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
					<input
						type="text"
						placeholder="Search by ID, brand, or customer..."
						value={search}
						onChange={e => setSearch(e.target.value)}
						className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-[#11236a] outline-none transition-all"
					/>
				</div>
				<div className="ml-auto flex items-center gap-2">
					<span className="text-[10px] font-bold text-zinc-500 uppercase">{filtered.length} requests</span>
				</div>
			</div>

			{/* Table */}
			<div className="bg-white border border-zinc-200/50 rounded-2xl shadow-sm overflow-hidden">
				<table className="w-full text-xs">
					<thead>
						<tr className="bg-zinc-50 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-100">
							<th className="py-3 px-5 text-left">Request ID</th>
							<th className="py-3 px-5 text-left">Brand / Model</th>
							<th className="py-3 px-5 text-left">Customer</th>
							<th className="py-3 px-5 text-left">Test Method</th>
							<th className="py-3 px-5 text-left">Qty</th>
							<th className="py-3 px-5 text-left">Status</th>
							<th className="py-3 px-5 text-left">Date</th>
							<th className="py-3 px-5 text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{filtered.map((req, i) => (
							<tr key={i} className="border-t border-zinc-100 hover:bg-zinc-50/50 transition-colors">
								<td className="py-4 px-5 font-bold text-[#11236a]">{req.id}</td>
								<td className="py-4 px-5">
									<p className="font-bold text-zinc-800">{req.brand}</p>
									<p className="text-zinc-400 text-[10px] font-semibold mt-0.5">{req.model}</p>
								</td>
								<td className="py-4 px-5 text-zinc-600 font-medium">{req.customer}</td>
								<td className="py-4 px-5 text-zinc-600 font-medium">{req.testMethod}</td>
								<td className="py-4 px-5 font-bold text-zinc-700">{req.qty} pcs</td>
								<td className="py-4 px-5">
									<span className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${
										req.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
									}`}>
										<span className={`w-1.5 h-1.5 rounded-full animate-pulse ${req.status === 'PENDING_APPROVAL' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
										{req.status.replace(/_/g, ' ')}
									</span>
								</td>
								<td className="py-4 px-5 text-zinc-400 font-medium">{req.date}</td>
								<td className="py-4 px-5">
									<div className="flex items-center gap-2 justify-end">
										<button className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-[#11236a] bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg px-2.5 py-1.5 transition-all outline-none cursor-pointer">
											<Eye className="w-3.5 h-3.5" /> View
										</button>
										<button
											onClick={() => setApproving(req.id)}
											className="flex items-center gap-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 border border-emerald-600 rounded-lg px-2.5 py-1.5 transition-all outline-none cursor-pointer"
										>
											<CheckCircle className="w-3.5 h-3.5" /> Approve
										</button>
										<button className="flex items-center gap-1 text-[10px] font-bold text-white bg-rose-500 hover:bg-rose-600 border border-rose-500 rounded-lg px-2.5 py-1.5 transition-all outline-none cursor-pointer">
											<XCircle className="w-3.5 h-3.5" /> Reject
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
				{filtered.length === 0 && (
					<div className="py-12 text-center">
						<p className="text-sm font-bold text-zinc-400">No requests found.</p>
					</div>
				)}
			</div>

			{/* Approval confirmation modal */}
			{approving && (
				<div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
					<div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-4 border border-zinc-200">
						<h3 className="text-sm font-bold text-zinc-900">Confirm Approval</h3>
						<p className="text-xs text-zinc-600 font-medium">Are you sure you want to approve request <span className="font-bold text-[#11236a]">{approving}</span>? This action will move the request to the inspection stage.</p>
						<div className="flex gap-3 justify-end">
							<button
								onClick={() => setApproving(null)}
								className="px-4 py-2 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl border border-zinc-200 outline-none cursor-pointer transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={() => setApproving(null)}
								className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl border border-emerald-600 outline-none cursor-pointer transition-colors"
							>
								Yes, Approve
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
