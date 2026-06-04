import { ChevronLeft, AlertTriangle, HelpCircle, Image as ImageIcon, Calendar } from 'lucide-react';

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
	targetDate?: string;

	// new format fields
	partProduct?: string;
	modelName?: string;
	customerSupplier?: string;
	date?: string;
	result?: string;
	title?: string;
	improvementType?: string;
	partName?: string;
	problem?: string;
	model?: string;
	defectQty?: string;
	venue?: string;
	imageUrl?: string;
	why1?: string;
	why2?: string;
	why3?: string;
	why4?: string;
	undetectedWhy1?: string;
	undetectedWhy2?: string;
	undetectedWhy3?: string;
	tempCountermeasure?: string;
	radicalCountermeasure?: string;
	inspectionControl?: string;
	processControl?: string;
	beforeImprovementImgUrl?: string;
	afterImprovementImgUrl?: string;
	preventionImgUrl?: string;
	remark?: string;
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

	// Detect if we should use the new NABL format layout
	const isNewFormat = !!(selectedCapa.title || selectedCapa.partProduct || selectedCapa.why1);

	if (!isNewFormat) {
		// Fallback to legacy format layout
		return (
			<div className="space-y-6">
				<div className="flex items-center">
					<button 
						onClick={() => setActiveTab('capa-management')}
						className="text-xs font-bold text-zinc-700 hover:text-zinc-950 flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none transition-colors"
					>
						<ChevronLeft className="w-4 h-4" /> Back to CAPA Register
					</button>
				</div>

				<div className="bg-white border border-zinc-200/50 rounded-3xl p-6 shadow-sm max-w-4xl mx-auto space-y-6">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-150 pb-4 gap-4">
						<div>
							<div className="flex items-center gap-2 text-xs font-bold">
								<span className="text-[10px] font-bold text-zinc-650 tracking-wider uppercase">{selectedCapa.id}</span>
								<span className="text-zinc-300">|</span>
								<span className="text-[10px] font-bold text-indigo-700 tracking-wider uppercase">REF: {selectedCapa.relatedRequest}</span>
							</div>
							<h3 className="text-base font-extrabold text-zinc-955 mt-0.5 leading-tight">{selectedCapa.productName}</h3>
						</div>
						<span className={`text-[10px] font-bold px-3 py-1 border rounded-full uppercase tracking-wider ${
							selectedCapa.status === 'COMPLETED' 
								? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
								: 'bg-rose-50 text-rose-600 border-rose-100'
						}`}>
							{selectedCapa.status}
						</span>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div className="md:col-span-2 space-y-5">
							<div className="bg-rose-50/10 border border-rose-150 p-4 rounded-2xl">
								<h4 className="text-[10px] text-rose-700 font-extrabold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
									<AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
									Non-Conformity Failure Defect
								</h4>
								<p className="text-xs font-semibold text-zinc-800 leading-relaxed">
									{selectedCapa.nonConformity}
								</p>
							</div>

							<div className="bg-amber-500/5 border border-amber-200 p-4 rounded-2xl">
								<h4 className="text-[10px] text-amber-700 font-extrabold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
									<HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
									Root Cause Analysis (RCA)
								</h4>
								<p className="text-xs font-semibold text-zinc-800 leading-relaxed">
									{selectedCapa.rootCause}
								</p>
							</div>

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

						<div className="space-y-4">
							<div className="bg-zinc-50 border border-zinc-200 p-4 rounded-2xl space-y-3.5">
								<h4 className="text-xs font-bold text-zinc-955 uppercase tracking-wider">Ownership & Schedule</h4>
								<div className="space-y-3 text-xs font-semibold">
									<div>
										<p className="text-[9px] text-zinc-700 font-extrabold uppercase">Department Owner</p>
										<p className="font-bold text-zinc-900 mt-0.5">{selectedCapa.owner}</p>
									</div>
									<div>
										<p className="text-[9px] text-zinc-700 font-extrabold uppercase">Initiation Date</p>
										<p className="font-bold text-zinc-900 mt-0.5">{selectedCapa.createdDate}</p>
									</div>
									<div>
										<p className="text-[9px] text-zinc-700 font-extrabold uppercase">Target Date</p>
										<p className="font-bold text-zinc-900 mt-0.5">{selectedCapa.targetedDate}</p>
									</div>
								</div>
							</div>

							<div className="border border-zinc-200 bg-white rounded-2xl p-4 text-center space-y-3 shadow-inner">
								<p className="text-[9px] text-zinc-700 font-extrabold uppercase tracking-wider">Quality Manager Verification</p>
								<div className="w-20 h-20 border border-dashed border-zinc-300 rounded-full mx-auto flex items-center justify-center bg-zinc-50">
									<span className="text-[9px] font-bold text-zinc-400">Pending</span>
								</div>
								<p className="text-[10px] text-zinc-700 font-bold">Approved & Signed off</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// ----------------------------------------------------
	// GORGEOUS NABL FORM LAYOUT (Matching user's image)
	// ----------------------------------------------------
	return (
		<div className="space-y-6">
			{/* Back btn */}
			<div className="flex items-center justify-between">
				<button 
					onClick={() => setActiveTab('capa-management')}
					className="text-xs font-bold text-zinc-700 hover:text-zinc-955 flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none transition-colors"
				>
					<ChevronLeft className="w-4 h-4" /> Back to CAPA Register
				</button>

				<div className="flex items-center gap-2 text-xs font-extrabold text-zinc-400">
					<span>CAPA ID: <strong className="text-zinc-800">{selectedCapa.id}</strong></span>
					<span>•</span>
					<span>REF REQ: <strong className="text-[#11236a]">{selectedCapa.relatedRequest}</strong></span>
				</div>
			</div>

			{/* CAPA Sheet View */}
			<div className="bg-white border border-zinc-300 rounded-2xl shadow-md overflow-hidden max-w-5xl mx-auto text-zinc-800">
				
				{/* Header Section (Blue Table Layout style) */}
				<div className="grid grid-cols-5 border-b border-zinc-300 font-bold text-[11px] leading-tight text-center bg-zinc-50">
					{/* Header Titles */}
					<div className="col-span-1 border-r border-zinc-300">
						<div className="bg-[#1e3a8a] text-white py-1.5 border-b border-zinc-300 uppercase tracking-wider">Part/Product</div>
						<div className="py-2.5 px-1 font-semibold text-zinc-700 bg-white min-h-[38px] flex items-center justify-center">
							{selectedCapa.partProduct || 'N/A'}
						</div>
					</div>

					<div className="col-span-1 border-r border-zinc-300">
						<div className="bg-[#1e3a8a] text-white py-1.5 border-b border-zinc-300 uppercase tracking-wider">Model Name</div>
						<div className="py-2.5 px-1 font-semibold text-zinc-700 bg-white min-h-[38px] flex items-center justify-center">
							{selectedCapa.modelName || 'N/A'}
						</div>
					</div>

					<div className="col-span-1 border-r border-zinc-300">
						<div className="bg-[#1e3a8a] text-white py-1.5 border-b border-zinc-300 uppercase tracking-wider">Customer/Supplier</div>
						<div className="py-2.5 px-1 font-semibold text-zinc-700 bg-white min-h-[38px] flex items-center justify-center">
							{selectedCapa.customerSupplier || 'N/A'}
						</div>
					</div>

					<div className="col-span-1 border-r border-zinc-300">
						<div className="bg-[#1e3a8a] text-white py-1.5 border-b border-zinc-300 uppercase tracking-wider">Date</div>
						<div className="py-2.5 px-1 font-semibold text-zinc-700 bg-white min-h-[38px] flex items-center justify-center">
							{selectedCapa.date || selectedCapa.createdDate || 'N/A'}
						</div>
					</div>

					<div className="col-span-1">
						<div className="bg-[#1e3a8a] text-white py-1.5 border-b border-zinc-300 uppercase tracking-wider">Result</div>
						<div className="grid grid-cols-2 divide-x divide-zinc-200 min-h-[38px] bg-white text-[10px]">
							<div className="flex flex-col items-center justify-center py-1">
								<span className="font-extrabold text-zinc-400">OK</span>
								{selectedCapa.result === 'OK' && <span className="text-[10px] text-emerald-600 font-extrabold">Done</span>}
							</div>
							<div className="flex flex-col items-center justify-center py-1 bg-rose-50/20">
								<span className="font-extrabold text-zinc-400">NG</span>
								{selectedCapa.result === 'NG' && <span className="text-[10px] text-rose-600 font-extrabold">Done</span>}
							</div>
						</div>
					</div>
				</div>

				{/* Title and Category Row */}
				<div className="grid grid-cols-3 divide-x divide-zinc-300 border-b border-zinc-300 text-xs text-zinc-800">
					<div className="col-span-2 p-3 font-semibold flex items-center bg-[#f8fafc]">
						<span className="text-indigo-800 font-extrabold text-[13px] mr-2">Title ::</span>
						<span className="text-zinc-950 font-bold">{selectedCapa.title || 'N/A'}</span>
					</div>

					<div className="col-span-1 p-3 flex flex-col justify-center">
						<span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mb-1">Improvement Process Type</span>
						<div className="flex items-center gap-3 text-[11px] font-bold text-zinc-700">
							{['Process', 'Part', 'Mold', 'Others'].map((type) => (
								<div key={type} className="flex items-center gap-1.5">
									<div className={`w-3 h-3 rounded-full border flex items-center justify-center ${
										selectedCapa.improvementType === type 
											? 'border-indigo-600 bg-indigo-50 text-indigo-600 font-bold' 
											: 'border-zinc-350 bg-white'
									}`}>
										{selectedCapa.improvementType === type && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
									</div>
									<span className={selectedCapa.improvementType === type ? 'text-indigo-900' : 'text-zinc-500'}>{type}</span>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Two Main Columns (Problem & Reason vs Counter Measure) */}
				<div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-zinc-300 border-b border-zinc-300 text-xs">
					
					{/* LEFT COLUMN: Problem & Reason */}
					<div className="p-4 space-y-4">
						{/* Title */}
						<div className="border-b border-zinc-200 pb-2 flex items-center justify-between">
							<span className="font-extrabold text-[#1e3a8a] text-[11px] uppercase tracking-wider">Part Name: {selectedCapa.partName || 'Spin lid'}</span>
							<span className="text-[11px] font-bold text-zinc-450 uppercase">(Problem & Reason)</span>
						</div>

						{/* Problem text block */}
						<div className="space-y-1">
							<span className="inline-flex items-center gap-1 font-bold text-[#1e3a8a] text-[11px]">
								<div className="w-1.5 h-1.5 bg-rose-600 rounded-full" /> Problem : {selectedCapa.title || 'N/A'}
							</span>
							<div className="pl-3 space-y-1 text-zinc-650 font-medium">
								<p>Model: {selectedCapa.model || 'WT80F4560RD/TL'}</p>
								<p>Defect Qty: {selectedCapa.defectQty || '01'}</p>
								<p>Venue: {selectedCapa.venue || 'BI'}</p>
							</div>
						</div>

						{/* Problem / Defect Image */}
						{selectedCapa.imageUrl ? (
							<div className="border border-zinc-250 rounded-xl overflow-hidden bg-zinc-50 max-w-[280px] mx-auto p-1.5 shadow-inner">
								<a href={selectedCapa.imageUrl} target="_blank" rel="noopener noreferrer" title="Click to open full size">
									<img src={selectedCapa.imageUrl} alt="Defect Detail" className="w-full h-auto max-h-[180px] object-contain rounded-lg cursor-zoom-in hover:opacity-90 transition-opacity" />
								</a>
								<div className="text-[9px] text-center text-zinc-500 font-bold uppercase tracking-wider mt-1">Defect Graphic Preview</div>
							</div>
						) : (
							<div className="border border-dashed border-zinc-200 rounded-xl p-4 text-center text-zinc-400 max-w-[280px] mx-auto">
								<ImageIcon className="w-6 h-6 mx-auto mb-1 text-zinc-300" />
								<span className="text-[10px] font-bold uppercase tracking-wider block">No defect graphic provided</span>
							</div>
						)}

						{/* Root cause why-why block */}
						<div className="bg-[#f8fafc] border border-zinc-200 rounded-xl p-3.5 space-y-2">
							<span className="block font-bold text-[#1e3a8a] text-[11px] uppercase tracking-wider border-b border-zinc-200 pb-1.5">
								Root Cause (Why-Why Analysis)
							</span>
							<div className="space-y-1.5 text-zinc-700">
								<p className="font-semibold"><strong className="text-indigo-800 text-[10px] uppercase font-bold mr-1">Why 1:</strong> {selectedCapa.why1 || 'Not specified'}</p>
								<p className="font-semibold"><strong className="text-indigo-800 text-[10px] uppercase font-bold mr-1">Why 2:</strong> {selectedCapa.why2 || 'Not specified'}</p>
								<p className="font-semibold"><strong className="text-indigo-800 text-[10px] uppercase font-bold mr-1">Why 3:</strong> {selectedCapa.why3 || 'Not specified'}</p>
								{selectedCapa.why4 && (
									<p className="font-semibold"><strong className="text-indigo-800 text-[10px] uppercase font-bold mr-1">Why 4:</strong> {selectedCapa.why4}</p>
								)}
							</div>
						</div>

						{/* Process undetected cause */}
						<div className="bg-[#fffbeb] border border-amber-100 rounded-xl p-3.5 space-y-2">
							<span className="block font-bold text-amber-800 text-[11px] uppercase tracking-wider border-b border-amber-100 pb-1.5">
								Process Undetected Cause
							</span>
							<div className="space-y-1.5 text-zinc-700">
								<p className="font-semibold"><strong className="text-amber-800 text-[10px] uppercase font-bold mr-1">Why 1:</strong> {selectedCapa.undetectedWhy1 || 'Not specified'}</p>
								<p className="font-semibold"><strong className="text-amber-800 text-[10px] uppercase font-bold mr-1">Why 2:</strong> {selectedCapa.undetectedWhy2 || 'Not specified'}</p>
								<p className="font-semibold"><strong className="text-amber-800 text-[10px] uppercase font-bold mr-1">Why 3:</strong> {selectedCapa.undetectedWhy3 || 'Not specified'}</p>
							</div>
						</div>
					</div>

					{/* RIGHT COLUMN: Counter Measure */}
					<div className="p-4 space-y-4">
						<div className="border-b border-zinc-200 pb-2 flex items-center justify-between">
							<span className="font-extrabold text-emerald-700 text-[11px] uppercase tracking-wider">Corrective Safeguards</span>
							<span className="text-[11px] font-bold text-zinc-450 uppercase">(Counter Measure)</span>
						</div>

						{/* Temp Countermeasure */}
						<div className="space-y-1">
							<span className="block font-bold text-indigo-900 text-[11px] uppercase tracking-wider">Temp Countermeasure :</span>
							<p className="pl-3 font-semibold text-zinc-700 leading-relaxed whitespace-pre-line">
								{selectedCapa.tempCountermeasure || 'N/A'}
							</p>
						</div>

						{/* Radical Countermeasure */}
						<div className="space-y-1 pt-1.5 border-t border-zinc-150">
							<span className="block font-bold text-indigo-900 text-[11px] uppercase tracking-wider">Radical Countermeasure :</span>
							<p className="pl-3 font-semibold text-zinc-700 leading-relaxed whitespace-pre-line">
								{selectedCapa.radicalCountermeasure || 'N/A'}
							</p>
						</div>

						{/* Inspection Control */}
						<div className="space-y-1 pt-1.5 border-t border-zinc-150">
							<span className="block font-bold text-emerald-800 text-[11px] uppercase tracking-wider">Inspection Control :-</span>
							<p className="pl-3 font-semibold text-zinc-700 leading-relaxed whitespace-pre-line bg-emerald-50/10 p-2.5 rounded-lg border border-emerald-100/50">
								{selectedCapa.inspectionControl || 'N/A'}
							</p>
						</div>

						{/* Process control */}
						<div className="space-y-1 pt-1.5 border-t border-zinc-150">
							<span className="block font-bold text-emerald-800 text-[11px] uppercase tracking-wider">Process control :-</span>
							<p className="pl-3 font-semibold text-zinc-700 leading-relaxed whitespace-pre-line bg-emerald-50/10 p-2.5 rounded-lg border border-emerald-100/50">
								{selectedCapa.processControl || 'N/A'}
							</p>
						</div>

						{/* Before / After / Prevention attachments grid */}
						<div className="pt-3 border-t border-zinc-150">
							<span className="block font-bold text-zinc-500 text-[10px] uppercase tracking-wider mb-2.5">Verification Attachment Images</span>
							<div className="grid grid-cols-3 gap-3">
								<div className="text-center">
									<span className="block text-[9px] text-zinc-400 font-extrabold uppercase mb-1">Before Improvement</span>
									{selectedCapa.beforeImprovementImgUrl ? (
										<a href={selectedCapa.beforeImprovementImgUrl} target="_blank" rel="noopener noreferrer" title="Open full size">
											<img src={selectedCapa.beforeImprovementImgUrl} className="w-full h-16 object-cover rounded-lg border border-zinc-200 cursor-zoom-in hover:opacity-90 transition-opacity" alt="Before" />
										</a>
									) : (
										<div className="h-16 flex items-center justify-center border border-dashed border-zinc-200 rounded-lg text-zinc-300">
											<ImageIcon className="w-5 h-5" />
										</div>
									)}
								</div>

								<div className="text-center">
									<span className="block text-[9px] text-zinc-400 font-extrabold uppercase mb-1">After Improvement</span>
									{selectedCapa.afterImprovementImgUrl ? (
										<a href={selectedCapa.afterImprovementImgUrl} target="_blank" rel="noopener noreferrer" title="Open full size">
											<img src={selectedCapa.afterImprovementImgUrl} className="w-full h-16 object-cover rounded-lg border border-zinc-200 cursor-zoom-in hover:opacity-90 transition-opacity" alt="After" />
										</a>
									) : (
										<div className="h-16 flex items-center justify-center border border-dashed border-zinc-200 rounded-lg text-zinc-300">
											<ImageIcon className="w-5 h-5" />
										</div>
									)}
								</div>

								<div className="text-center">
									<span className="block text-[9px] text-zinc-400 font-extrabold uppercase mb-1">Prevention</span>
									{selectedCapa.preventionImgUrl ? (
										<a href={selectedCapa.preventionImgUrl} target="_blank" rel="noopener noreferrer" title="Open full size">
											<img src={selectedCapa.preventionImgUrl} className="w-full h-16 object-cover rounded-lg border border-zinc-200 cursor-zoom-in hover:opacity-90 transition-opacity" alt="Prevention" />
										</a>
									) : (
										<div className="h-16 flex items-center justify-center border border-dashed border-zinc-200 rounded-lg text-zinc-300">
											<ImageIcon className="w-5 h-5" />
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Bottom target / status / remarks details */}
				<div className="bg-zinc-50/50 p-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold">
					<div className="flex items-center gap-2 border-r md:border-r border-zinc-200/80 pr-2">
						<Calendar className="w-4 h-4 text-indigo-700" />
						<div>
							<span className="block text-[9px] text-zinc-400 uppercase tracking-wider leading-none">Target Date</span>
							<span className="text-zinc-900 font-bold text-xs mt-0.5 block">
								{selectedCapa.targetDate || selectedCapa.targetedDate || 'N/A'}
							</span>
						</div>
					</div>

					<div className="flex items-center gap-2 border-r md:border-r border-zinc-200/80 pr-2">
						<div className={`w-2.5 h-2.5 rounded-full ${selectedCapa.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
						<div>
							<span className="block text-[9px] text-zinc-400 uppercase tracking-wider leading-none">Execution Status</span>
							<span className="text-zinc-900 font-extrabold text-xs mt-0.5 block">
								{selectedCapa.status === 'COMPLETED' ? 'Done' : selectedCapa.status || 'Pending'}
							</span>
						</div>
					</div>

					<div className="md:col-span-2">
						<span className="block text-[9px] text-zinc-400 uppercase tracking-wider leading-none">Management Remarks</span>
						<p className="text-zinc-650 text-[11px] font-medium mt-1 italic leading-relaxed">
							{selectedCapa.remark || 'No management remarks recorded.'}
						</p>
					</div>
				</div>

				{/* Stamp footer */}
				<div className="bg-white border-t border-zinc-200 p-4 flex items-center justify-between">
					<span className="text-[10px] text-zinc-450 uppercase font-bold">Document: CAPA-{selectedCapa.id} // Quality Audit System</span>
				</div>
			</div>
		</div>
	);
}
