import { ChevronLeft, AlertTriangle, HelpCircle } from 'lucide-react';

interface CapaRecord {
	id: string;
	relatedRequest: string;
	productName: string;
	nonConformity: string;
	rootCause: string;
	correctiveAction: string;
	preventiveAction: string;
	targetedDate: string;
	status: string;
	owner: string;
	createdDate: string;
}

interface CapaReportsProps {
	selectedCapa: CapaRecord | null;
	setActiveTab: (tab: string) => void;
}

export default function CapaReports({ selectedCapa, setActiveTab }: CapaReportsProps) {
	if (!selectedCapa) {
		return (
			<div className="bg-white border border-zinc-200/50 rounded-3xl p-8 text-center">
				<p className="text-zinc-650 text-xs font-semibold">No CAPA report selected.</p>
				<button 
					onClick={() => setActiveTab('capa-management')}
					className="mt-4 px-4 py-2 bg-[#11236a] text-white text-xs font-bold rounded-xl outline-none border-none cursor-pointer hover:bg-[#0c1a52] transition-colors"
				>
					View CAPA Management
				</button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Back btn */}
			<div className="flex items-center">
				<button 
					onClick={() => setActiveTab('capa-management')}
					className="text-xs font-bold text-zinc-700 hover:text-zinc-950 flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none transition-colors"
				>
					<ChevronLeft className="w-4 h-4" /> Back to CAPA Register
				</button>
			</div>

			{/* CAPA details layout sheet */}
			<div className="bg-white border border-zinc-200/50 rounded-3xl p-6 shadow-sm max-w-4xl mx-auto space-y-6">
				{/* Upper Header Metadata */}
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-150 pb-4 gap-4">
					<div>
						<div className="flex items-center gap-2 text-xs font-bold">
							<span className="text-[10px] font-bold text-zinc-650 tracking-wider uppercase">{selectedCapa.id}</span>
							<span className="text-zinc-300">|</span>
							<span className="text-[10px] font-bold text-indigo-700 tracking-wider uppercase">REF: {selectedCapa.relatedRequest}</span>
						</div>
						<h3 className="text-base font-extrabold text-zinc-950 mt-0.5 leading-tight">{selectedCapa.productName}</h3>
					</div>
					<span className={`text-[10px] font-bold px-3 py-1 border rounded-full uppercase tracking-wider ${
						selectedCapa.status === 'COMPLETED' 
							? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
							: 'bg-rose-50 text-rose-600 border-rose-100'
					}`}>
						{selectedCapa.status}
					</span>
				</div>

				{/* Core Details Grid */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div className="md:col-span-2 space-y-5">
						{/* Non conformity defect */}
						<div className="bg-rose-50/10 border border-rose-150 p-4 rounded-2xl">
							<h4 className="text-[10px] text-rose-700 font-extrabold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
								<AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
								Non-Conformity Failure Defect
							</h4>
							<p className="text-xs font-semibold text-zinc-800 leading-relaxed">
								{selectedCapa.nonConformity}
							</p>
						</div>

						{/* RCA block */}
						<div className="bg-amber-500/5 border border-amber-200 p-4 rounded-2xl">
							<h4 className="text-[10px] text-amber-700 font-extrabold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
								<HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
								Root Cause Analysis (RCA)
							</h4>
							<p className="text-xs font-semibold text-zinc-800 leading-relaxed">
								{selectedCapa.rootCause}
							</p>
						</div>

						{/* Dual plans split */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="bg-emerald-50/20 border border-emerald-250 p-4 rounded-2xl">
								<h5 className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider mb-1.5">Corrective Action (Immediate)</h5>
								<p className="text-xs text-zinc-700 font-semibold leading-relaxed">{selectedCapa.correctiveAction}</p>
							</div>
							<div className="bg-indigo-50/20 border border-indigo-250 p-4 rounded-2xl">
								<h5 className="text-[10px] text-[#11236a] font-extrabold uppercase tracking-wider mb-1.5">Preventive Action (Long Term)</h5>
								<p className="text-xs text-zinc-700 font-semibold leading-relaxed">{selectedCapa.preventiveAction}</p>
							</div>
						</div>
					</div>

					{/* Side Info Panel */}
					<div className="space-y-4">
						<div className="bg-zinc-50 border border-zinc-200 p-4 rounded-2xl space-y-3.5">
							<h4 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">Ownership & Schedule</h4>
							<div className="space-y-3 text-xs font-semibold">
								<div>
									<p className="text-[9px] text-zinc-700 font-extrabold uppercase">Department Owner</p>
									<p className="font-bold text-zinc-900 mt-0.5">{selectedCapa.owner}</p>
								</div>
								<div>
									<p className="text-[9px] text-zinc-700 font-extrabold uppercase">Initiation Date</p>
									<p className="font-bold text-zinc-900 mt-0.5 ">{selectedCapa.createdDate}</p>
								</div>
								<div>
									<p className="text-[9px] text-zinc-700 font-extrabold uppercase">Target Date</p>
									<p className="font-bold text-zinc-900 mt-0.5 ">{selectedCapa.targetedDate}</p>
								</div>
							</div>
						</div>

						{/* Approval Stamp signature */}
						<div className="border border-zinc-200 bg-white rounded-2xl p-4 text-center space-y-3 shadow-inner">
							<p className="text-[9px] text-zinc-700 font-extrabold uppercase tracking-wider">Quality Manager Verification</p>
							<div className="w-20 h-20 border border-dashed border-zinc-300 rounded-full mx-auto flex items-center justify-center text-zinc-350 bg-zinc-50 relative">
								<span className="text-[9px] font-extrabold text-[#11236a] opacity-80 select-none transform -rotate-12 border-2 border-solid border-[#11236a] px-1 py-0.5 uppercase tracking-wide">
									NABL STAMPED
								</span>
							</div>
							<p className="text-[10px] text-zinc-700 font-bold">Approved & Signed off</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
