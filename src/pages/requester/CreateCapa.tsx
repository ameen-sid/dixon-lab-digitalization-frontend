import { useState } from 'react';
import { ChevronLeft, Send } from 'lucide-react';

interface RequestRecord {
	id: string;
	customerNameAddress: string;
	manufacturerNameAddress: string;
	customerContactDetails: string;
	sampleDescription: string;
	modelNo: string;
	familyModel?: string | null;
	serialNumber?: string | null;
	productRating: string;
	sampleQty: number;
	brandName: string;
	attachmentMention?: string | null;
	witnessRequired: string;
	witnessPersonDetails?: string | null;
	testMethodRef: string;
	conformityStatement: string;
	decisionRule?: string | null;
	collectBack: string;
	status: string;
	remarks?: string | null;
	createdDate: string;
	telemetry: number[];
	attachments?: { id: number; fileName: string; filePath: string; fileSize: number }[];
}

interface NewCapaInput {
	relatedRequest: string;
	productName: string;
	nonConformity: string;
	rootCause: string;
	correctiveAction: string;
	preventiveAction: string;
	targetedDate: string;
}

interface CreateCapaProps {
	requests: RequestRecord[];
	onSubmit: (input: NewCapaInput) => void;
	setActiveTab: (tab: string) => void;
	initialInput?: NewCapaInput;
}

export default function CreateCapa({ requests, onSubmit, setActiveTab, initialInput }: CreateCapaProps) {
	const defaultRelated = requests.length > 0 ? requests[0].id : 'REQ-2026-001';
	const defaultProd = requests.length > 0 ? `${requests[0].brandName} ${requests[0].modelNo}` : 'SMT Control Board X-90';

	const [formInput, setFormInput] = useState<NewCapaInput>(initialInput || {
		relatedRequest: defaultRelated,
		productName: defaultProd,
		nonConformity: '',
		rootCause: '',
		correctiveAction: '',
		preventiveAction: '',
		targetedDate: ''
	});

	const handleRequestChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const reqId = e.target.value;
		const matched = requests.find(r => r.id === reqId);
		setFormInput({
			...formInput,
			relatedRequest: reqId,
			productName: matched ? `${matched.brandName} ${matched.modelNo}` : 'SMT Control Board X-90'
		});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit(formInput);
	};

	return (
		<div className="space-y-6">
			{/* Back btn */}
			<div className="flex items-center">
				<button 
					onClick={() => setActiveTab('capa-management')}
					className="text-xs font-bold text-zinc-700 hover:text-zinc-955 flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none transition-colors"
				>
					<ChevronLeft className="w-4 h-4" /> Back to CAPA Register
				</button>
			</div>

			{/* CAPA Form */}
			<div className="bg-white border border-zinc-200/50 rounded-3xl shadow-sm p-6 max-w-3xl mx-auto">
				<div className="border-b border-zinc-150 pb-4 mb-6">
					<h3 className="text-sm font-extrabold text-zinc-955 uppercase tracking-wider">Initiate CAPA Corrective Action Report</h3>
					<p className="text-[11px] text-zinc-650 font-medium mt-1">Define systematic, physical engineering adjustments to eliminate recurrent testing failures.</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-5">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
						{/* Related requests */}
						<div>
							<label className="block text-xs font-bold text-zinc-800 mb-1.5">
								Related Request <span className="text-rose-500 font-extrabold">*</span>
							</label>
							<select 
								value={formInput.relatedRequest}
								onChange={handleRequestChange}
								className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-800 outline-none focus:bg-white focus:border-[#11236a] transition-all cursor-pointer"
							>
								{requests.map(r => (
									<option key={r.id} value={r.id}>{r.id} ({r.brandName} {r.modelNo})</option>
								))}
							</select>
						</div>

						{/* Product Affected */}
						<div>
							<label className="block text-xs font-bold text-zinc-800 mb-1.5">
								Product Affected
							</label>
							<input 
								type="text" 
								disabled
								value={formInput.productName}
								className="w-full bg-zinc-100 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-700 cursor-not-allowed"
							/>
						</div>
					</div>

					{/* Non conformity */}
					<div>
						<label className="block text-xs font-bold text-zinc-800 mb-1.5">
							Non-Conformity Defect Description <span className="text-rose-500 font-extrabold">*</span>
						</label>
						<textarea 
							required
							rows={3}
							placeholder="Describe the failure parameters, delamination indicators, crack occurrences, or out-of-spec telemetry observed during the test cycle."
							value={formInput.nonConformity}
							onChange={(e) => setFormInput({...formInput, nonConformity: e.target.value})}
							className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl p-3.5 text-xs font-semibold text-zinc-800 placeholder-zinc-650 outline-none focus:bg-white focus:border-[#11236a] transition-all resize-none"
						/>
					</div>

					{/* Root Cause Analysis (RCA) */}
					<div>
						<label className="block text-xs font-bold text-zinc-800 mb-1.5">
							Root Cause Analysis (RCA) <span className="text-rose-500 font-extrabold">*</span>
						</label>
						<textarea 
							required
							rows={3}
							placeholder="Identify physical or procedural causes: e.g. reflow profile speed, solder alloy composition, material voids..."
							value={formInput.rootCause}
							onChange={(e) => setFormInput({...formInput, rootCause: e.target.value})}
							className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl p-3.5 text-xs font-semibold text-zinc-800 placeholder-zinc-650 outline-none focus:bg-white focus:border-[#11236a] transition-all resize-none"
						/>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
						{/* Corrective action */}
						<div>
							<label className="block text-xs font-bold text-zinc-800 mb-1.5">
								Immediate Corrective Action Plan <span className="text-rose-500 font-extrabold">*</span>
							</label>
							<textarea 
								required
								rows={3}
								placeholder="What quick adjustments were made to secure immediate production validation?"
								value={formInput.correctiveAction}
								onChange={(e) => setFormInput({...formInput, correctiveAction: e.target.value})}
								className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl p-3.5 text-xs font-semibold text-zinc-800 placeholder-zinc-650 outline-none focus:bg-white focus:border-[#11236a] transition-all resize-none"
							/>
						</div>

						{/* Preventive action */}
						<div>
							<label className="block text-xs font-bold text-zinc-800 mb-1.5">
								Preventive Action Plan (Long Term) <span className="text-rose-500 font-extrabold">*</span>
							</label>
							<textarea 
								required
								rows={3}
								placeholder="Specify automated safeguards or inspection cycles to prevent recurrence."
								value={formInput.preventiveAction}
								onChange={(e) => setFormInput({...formInput, preventiveAction: e.target.value})}
								className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl p-3.5 text-xs font-semibold text-zinc-800 placeholder-zinc-650 outline-none focus:bg-white focus:border-[#11236a] transition-all resize-none"
							/>
						</div>
					</div>

					{/* Targeted Completion date */}
					<div className="w-full sm:w-1/2">
						<label className="block text-xs font-bold text-zinc-800 mb-1.5">
							Target Resolution Date <span className="text-rose-500 font-extrabold">*</span>
						</label>
						<input 
							type="date" 
							required
							value={formInput.targetedDate}
							onChange={(e) => setFormInput({...formInput, targetedDate: e.target.value})}
							className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-800 outline-none focus:bg-white focus:border-[#11236a] transition-all"
						/>
					</div>

					{/* Buttons */}
					<div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-150">
						<button 
							type="button"
							onClick={() => setActiveTab('capa-management')}
							className="px-4 py-2 border border-zinc-200 text-zinc-700 rounded-xl text-xs font-bold bg-white hover:bg-zinc-50 cursor-pointer active:scale-95 transition-all outline-none"
						>
							Cancel
						</button>
						<button 
							type="submit"
							className="px-5 py-2 bg-[#11236a] hover:bg-[#0c1a52] text-white rounded-xl text-xs font-bold cursor-pointer active:scale-95 transition-all border-none outline-none flex items-center gap-1.5"
						>
							<Send className="w-3.5 h-3.5" /> Submit CAPA Plan
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
