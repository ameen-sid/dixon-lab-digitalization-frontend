import { useState } from 'react';
import { ChevronLeft, Send, Upload, CheckCircle, AlertCircle } from 'lucide-react';

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

interface CreateCapaProps {
	requests: RequestRecord[];
	onSubmit: (input: any) => void;
	setActiveTab: (tab: string) => void;
	initialInput?: any;
}

export default function CreateCapa({ requests, onSubmit, setActiveTab, initialInput }: CreateCapaProps) {
	const defaultRelated = requests.length > 0 ? requests[0].id : 'REQ-2026-001';
	const matchedRequest = requests.find(r => r.id === (initialInput?.relatedRequest || defaultRelated));

	const [formInput, setFormInput] = useState<any>({
		relatedRequest: initialInput?.relatedRequest || defaultRelated,
		partProduct: initialInput?.partProduct || matchedRequest?.brandName || 'SAMSUNG',
		modelName: initialInput?.modelName || matchedRequest?.modelNo || 'WT80F4560RD',
		customerSupplier: initialInput?.customerSupplier || matchedRequest?.customerNameAddress || 'SAMSUNG',
		date: initialInput?.date || new Date().toISOString().split('T')[0],
		result: initialInput?.result || 'NG',
		title: initialInput?.title || initialInput?.nonConformity || 'Spin Lid Crack at front side',
		improvementType: initialInput?.improvementType || 'Process',
		partName: initialInput?.partName || 'Spin lid',

		problem: initialInput?.problem || initialInput?.nonConformity || 'Spin Lid Crack at front side',
		model: initialInput?.model || matchedRequest?.modelNo || 'WT80F4560RD/TL',
		defectQty: initialInput?.defectQty || '01',
		venue: initialInput?.venue || 'BI',
		imageUrl: initialInput?.imageUrl || '',

		why1: initialInput?.why1 || initialInput?.rootCause || 'Spin Lid Crack at front side',
		why2: initialInput?.why2 || 'Inspector not detect spin lid crack issue during inspection',
		why3: initialInput?.why3 || 'Spin lid covered with polybag.',
		why4: initialInput?.why4 || '',

		undetectedWhy1: initialInput?.undetectedWhy1 || 'Spin Lid Crack at front side',
		undetectedWhy2: initialInput?.undetectedWhy2 || 'Inspector not detect spin lid crack issue during inspection',
		undetectedWhy3: initialInput?.undetectedWhy3 || 'Spin lid covered with polybag.',

		tempCountermeasure: initialInput?.tempCountermeasure || initialInput?.correctiveAction || '',
		radicalCountermeasure: initialInput?.radicalCountermeasure || initialInput?.preventiveAction || '',
		inspectionControl: initialInput?.inspectionControl || '-Wash & Spin lid polybag will be removed before the inspection stage, allowing the inspector to easily inspect the Wash/spin lid crack.\n-Glass fixing operator will check for crack in the spin lid after the glass assembly.',
		processControl: initialInput?.processControl || '-Process Engineer will check the Spin lid crack Every two Hour Frequency.',

		beforeImprovementImgUrl: initialInput?.beforeImprovementImgUrl || '',
		afterImprovementImgUrl: initialInput?.afterImprovementImgUrl || '',
		preventionImgUrl: initialInput?.preventionImgUrl || '',

		targetDate: initialInput?.targetDate || initialInput?.targetedDate || '',
		status: initialInput?.status || 'Pending',
		remark: initialInput?.remark || ''
	});

	const handleRequestChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const reqId = e.target.value;
		const matched = requests.find(r => r.id === reqId);
		setFormInput({
			...formInput,
			relatedRequest: reqId,
			partProduct: matched ? matched.brandName : '',
			modelName: matched ? matched.modelNo : '',
			customerSupplier: matched ? matched.customerNameAddress : '',
			model: matched ? matched.modelNo : ''
		});
	};

	const handleImageChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setFormInput((prev: any) => ({
					...prev,
					[field]: reader.result as string
				}));
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// Compute backwards-compatible fields
		const computedInput = {
			...formInput,
			productName: `${formInput.partProduct} ${formInput.modelName}`,
			nonConformity: formInput.problem || formInput.title,
			rootCause: formInput.why1 || formInput.why2 || formInput.why3 || 'See Why-Why Analysis details.',
			correctiveAction: formInput.tempCountermeasure || 'See Temporary Countermeasure details.',
			preventiveAction: formInput.radicalCountermeasure || 'See Radical Countermeasure details.',
			targetedDate: formInput.targetDate
		};
		onSubmit(computedInput);
	};

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

			{/* CAPA Form Sheet Container */}
			<div className="bg-white border border-zinc-200/50 rounded-3xl shadow-sm p-6 max-w-5xl mx-auto">
				<div className="border-b border-zinc-150 pb-4 mb-6">
					<h3 className="text-sm font-extrabold text-[#11236a] uppercase tracking-wider">Corrective and Preventive Action (CAPA) Form</h3>
					<p className="text-[11px] text-zinc-550 font-medium mt-1">Please document systematic failure tracking, root-cause WHY-WHY analysis, and countermeasures.</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* 1. Header Grid Box */}
					<div className="border border-zinc-200 rounded-2xl overflow-hidden bg-zinc-50/50">
						<div className="bg-zinc-100/80 px-4 py-2 border-b border-zinc-200">
							<span className="text-[10px] font-extrabold text-[#11236a] uppercase tracking-wider">CAPA Header Information</span>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-zinc-200">
							<div className="p-3">
								<label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Part / Product</label>
								<input 
									type="text" 
									value={formInput.partProduct} 
									onChange={(e) => setFormInput({ ...formInput, partProduct: e.target.value })}
									className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-800 outline-none focus:border-[#11236a]"
									placeholder="e.g. Spin Lid"
								/>
							</div>
							<div className="p-3">
								<label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Model Name</label>
								<input 
									type="text" 
									value={formInput.modelName} 
									onChange={(e) => setFormInput({ ...formInput, modelName: e.target.value })}
									className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-800 outline-none focus:border-[#11236a]"
									placeholder="e.g. WT80F4560RD"
								/>
							</div>
							<div className="p-3">
								<label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Customer / Supplier</label>
								<input 
									type="text" 
									value={formInput.customerSupplier} 
									onChange={(e) => setFormInput({ ...formInput, customerSupplier: e.target.value })}
									className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-800 outline-none focus:border-[#11236a]"
									placeholder="e.g. SAMSUNG"
								/>
							</div>
							<div className="p-3">
								<label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Date</label>
								<input 
									type="date" 
									value={formInput.date} 
									onChange={(e) => setFormInput({ ...formInput, date: e.target.value })}
									className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-800 outline-none focus:border-[#11236a]"
								/>
							</div>
							<div className="p-3 bg-zinc-50">
								<label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Result Status</label>
								<div className="flex items-center gap-2 mt-1">
									<button 
										type="button" 
										onClick={() => setFormInput({ ...formInput, result: 'OK' })}
										className={`flex-1 text-center py-1 rounded-md font-bold text-xs border transition-all ${
											formInput.result === 'OK' 
												? 'bg-emerald-600 border-emerald-600 text-white shadow-xs' 
												: 'bg-white border-zinc-200 text-zinc-450 hover:bg-zinc-50'
										}`}
									>
										OK
									</button>
									<button 
										type="button" 
										onClick={() => setFormInput({ ...formInput, result: 'NG' })}
										className={`flex-1 text-center py-1 rounded-md font-bold text-xs border transition-all ${
											formInput.result === 'NG' 
												? 'bg-rose-600 border-rose-600 text-white shadow-xs' 
												: 'bg-white border-zinc-200 text-zinc-450 hover:bg-zinc-50'
										}`}
									>
										NG
									</button>
								</div>
							</div>
						</div>
					</div>

					{/* 2. Title & Improvement Row */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 border border-zinc-200 rounded-2xl p-4 bg-zinc-50/20">
						<div className="lg:col-span-2">
							<label className="block text-[10px] font-bold text-[#11236a] uppercase tracking-wider mb-1.5">
								Title <span className="text-rose-500 font-extrabold">*</span>
							</label>
							<input 
								type="text" 
								required
								value={formInput.title}
								onChange={(e) => setFormInput({ ...formInput, title: e.target.value })}
								className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2 text-xs font-semibold text-zinc-800 outline-none focus:border-[#11236a]"
								placeholder="e.g. Title :: Spin Lid Crack at front side"
							/>
						</div>

						<div>
							<label className="block text-[10px] font-bold text-[#11236a] uppercase tracking-wider mb-1.5">
								Improvement Category
							</label>
							<div className="flex flex-wrap items-center gap-4 mt-2">
								{['Process', 'Part', 'Mold', 'Others'].map((type) => (
									<label key={type} className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 cursor-pointer">
										<input 
											type="radio" 
											name="improvementType"
											checked={formInput.improvementType === type}
											onChange={() => setFormInput({ ...formInput, improvementType: type })}
											className="accent-[#11236a]"
										/>
										{type}
									</label>
								))}
							</div>
						</div>
					</div>

					{/* 3. Linkage Info & Part Name */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-[10px] font-bold text-[#11236a] uppercase tracking-wider mb-1.5">
								Link to Request ID <span className="text-rose-500 font-extrabold">*</span>
							</label>
							<select 
								value={formInput.relatedRequest}
								onChange={handleRequestChange}
								className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2 text-xs font-semibold text-zinc-800 outline-none focus:border-[#11236a] cursor-pointer"
							>
								{requests.map(r => (
									<option key={r.id} value={r.id}>{r.id} ({r.brandName} {r.modelNo})</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-[10px] font-bold text-[#11236a] uppercase tracking-wider mb-1.5">
								Part Name <span className="text-rose-500 font-extrabold">*</span>
							</label>
							<input 
								type="text" 
								required
								value={formInput.partName}
								onChange={(e) => setFormInput({ ...formInput, partName: e.target.value })}
								className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2 text-xs font-semibold text-zinc-800 outline-none focus:border-[#11236a]"
								placeholder="e.g. Spin lid"
							/>
						</div>
					</div>

					{/* 4. Two Column Layout: Problem vs Countermeasure */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
						{/* LEFT COLUMN: Problem & Reason */}
						<div className="space-y-4 border border-zinc-200 rounded-2xl p-4 bg-[#fcfdfe]">
							<h4 className="text-xs font-extrabold text-[#11236a] uppercase tracking-wider border-b border-zinc-150 pb-2 flex items-center gap-1.5">
								<AlertCircle className="w-4 h-4 text-rose-500" />
								(Problem & Reason) Details
							</h4>

							<div>
								<label className="block text-[10px] font-bold text-zinc-450 uppercase mb-1">Problem Statement</label>
								<textarea 
									rows={2}
									value={formInput.problem}
									onChange={(e) => setFormInput({ ...formInput, problem: e.target.value })}
									className="w-full bg-white border border-zinc-200 rounded-xl p-3 text-xs font-semibold text-zinc-800 outline-none focus:border-[#11236a] resize-none"
									placeholder="Describe the failure/problem..."
								/>
							</div>

							<div className="grid grid-cols-3 gap-2.5">
								<div>
									<label className="block text-[9px] font-bold text-zinc-400 uppercase mb-0.5">Model</label>
									<input 
										type="text" 
										value={formInput.model}
										onChange={(e) => setFormInput({ ...formInput, model: e.target.value })}
										className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-semibold text-zinc-800 outline-none"
									/>
								</div>
								<div>
									<label className="block text-[9px] font-bold text-zinc-400 uppercase mb-0.5">Defect Qty</label>
									<input 
										type="text" 
										value={formInput.defectQty}
										onChange={(e) => setFormInput({ ...formInput, defectQty: e.target.value })}
										className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-semibold text-zinc-800 outline-none"
									/>
								</div>
								<div>
									<label className="block text-[9px] font-bold text-zinc-400 uppercase mb-0.5">Venue</label>
									<input 
										type="text" 
										value={formInput.venue}
										onChange={(e) => setFormInput({ ...formInput, venue: e.target.value })}
										className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-semibold text-zinc-800 outline-none"
									/>
								</div>
							</div>

							{/* Defect Image upload */}
							<div>
								<label className="block text-[10px] font-bold text-zinc-450 uppercase mb-1">Defect Image Upload</label>
								<div className="flex items-center gap-3">
									<label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-xl py-4 bg-white cursor-pointer hover:bg-zinc-50 transition-colors">
										<Upload className="w-5 h-5 text-zinc-400 mb-1" />
										<span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Select Defect Image</span>
										<input type="file" accept="image/*" className="hidden" onChange={handleImageChange('imageUrl')} />
									</label>
									{formInput.imageUrl && (
										<div className="w-16 h-16 rounded-xl border border-zinc-200 overflow-hidden shrink-0 relative bg-zinc-50">
											<img src={formInput.imageUrl} alt="Defect" className="w-full h-full object-cover" />
										</div>
									)}
								</div>
							</div>

							{/* Root cause WHY-WHY analysis */}
							<div className="space-y-2 pt-1">
								<label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Root Cause (Why-Why Analysis)</label>
								{['why1', 'why2', 'why3', 'why4'].map((why, idx) => (
									<div key={why} className="flex items-center gap-2">
										<span className="text-[10px] font-extrabold text-[#11236a] w-12 uppercase">Why {idx+1}:</span>
										<input 
											type="text" 
											value={formInput[why]}
											onChange={(e) => setFormInput({ ...formInput, [why]: e.target.value })}
											className="flex-1 bg-white border border-zinc-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-zinc-800 outline-none focus:border-[#11236a]"
											placeholder={`Why does this failure happen? (Level ${idx+1})`}
										/>
									</div>
								))}
							</div>

							{/* Process Undetected Cause WHY-WHY */}
							<div className="space-y-2 pt-2 border-t border-zinc-150">
								<label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Process Undetected Cause</label>
								{['undetectedWhy1', 'undetectedWhy2', 'undetectedWhy3'].map((why, idx) => (
									<div key={why} className="flex items-center gap-2">
										<span className="text-[10px] font-extrabold text-[#11236a] w-12 uppercase">Why {idx+1}:</span>
										<input 
											type="text" 
											value={formInput[why]}
											onChange={(e) => setFormInput({ ...formInput, [why]: e.target.value })}
											className="flex-1 bg-white border border-zinc-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-zinc-800 outline-none focus:border-[#11236a]"
											placeholder={`Why did the inspection/process fail to detect? (Level ${idx+1})`}
										/>
									</div>
								))}
							</div>
						</div>

						{/* RIGHT COLUMN: Counter Measure */}
						<div className="space-y-4 border border-zinc-200 rounded-2xl p-4 bg-[#fcfdfe]">
							<h4 className="text-xs font-extrabold text-[#11236a] uppercase tracking-wider border-b border-zinc-150 pb-2 flex items-center gap-1.5">
								<CheckCircle className="w-4 h-4 text-emerald-600" />
								(Counter Measure) Details
							</h4>

							<div>
								<label className="block text-[10px] font-bold text-zinc-450 uppercase mb-1">Temporary Countermeasure</label>
								<textarea 
									rows={2}
									value={formInput.tempCountermeasure}
									onChange={(e) => setFormInput({ ...formInput, tempCountermeasure: e.target.value })}
									className="w-full bg-white border border-zinc-200 rounded-xl p-3 text-xs font-semibold text-zinc-800 outline-none focus:border-[#11236a] resize-none"
									placeholder="Describe immediate action plan taken..."
								/>
							</div>

							<div>
								<label className="block text-[10px] font-bold text-zinc-450 uppercase mb-1">Radical Countermeasure (Root Cause fix)</label>
								<textarea 
									rows={2}
									value={formInput.radicalCountermeasure}
									onChange={(e) => setFormInput({ ...formInput, radicalCountermeasure: e.target.value })}
									className="w-full bg-white border border-zinc-200 rounded-xl p-3 text-xs font-semibold text-zinc-800 outline-none focus:border-[#11236a] resize-none"
									placeholder="Describe permanent system/tool action plan..."
								/>
							</div>

							<div>
								<label className="block text-[10px] font-bold text-zinc-450 uppercase mb-1">Inspection Control Plan</label>
								<textarea 
									rows={2}
									value={formInput.inspectionControl}
									onChange={(e) => setFormInput({ ...formInput, inspectionControl: e.target.value })}
									className="w-full bg-white border border-zinc-200 rounded-xl p-3 text-xs font-semibold text-zinc-800 outline-none focus:border-[#11236a] resize-none"
									placeholder="Describe quality testing & NABL control safeguards..."
								/>
							</div>

							<div>
								<label className="block text-[10px] font-bold text-zinc-450 uppercase mb-1">Process Control Plan</label>
								<textarea 
									rows={2}
									value={formInput.processControl}
									onChange={(e) => setFormInput({ ...formInput, processControl: e.target.value })}
									className="w-full bg-white border border-zinc-200 rounded-xl p-3 text-xs font-semibold text-zinc-800 outline-none focus:border-[#11236a] resize-none"
									placeholder="Describe frequency, audit checking details..."
								/>
							</div>

							{/* Before / After / Prevention Image Uploads */}
							<div className="border-t border-zinc-150 pt-3 mt-2">
								<label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Verification Attachment Previews</label>
								<div className="grid grid-cols-3 gap-2.5">
									{/* Before */}
									<div className="flex flex-col items-center">
										<label className="w-full flex flex-col items-center justify-center border border-dashed border-zinc-200 rounded-lg p-2 bg-white cursor-pointer hover:bg-zinc-50 text-center min-h-[70px]">
											<Upload className="w-3.5 h-3.5 text-zinc-450 mb-0.5" />
											<span className="text-[8px] font-bold text-zinc-500 uppercase">Before</span>
											<input type="file" accept="image/*" className="hidden" onChange={handleImageChange('beforeImprovementImgUrl')} />
										</label>
										{formInput.beforeImprovementImgUrl && (
											<img src={formInput.beforeImprovementImgUrl} className="w-10 h-10 object-cover mt-1.5 rounded-md border border-zinc-200" alt="Before" />
										)}
									</div>

									{/* After */}
									<div className="flex flex-col items-center">
										<label className="w-full flex flex-col items-center justify-center border border-dashed border-zinc-200 rounded-lg p-2 bg-white cursor-pointer hover:bg-zinc-50 text-center min-h-[70px]">
											<Upload className="w-3.5 h-3.5 text-zinc-450 mb-0.5" />
											<span className="text-[8px] font-bold text-zinc-500 uppercase">After</span>
											<input type="file" accept="image/*" className="hidden" onChange={handleImageChange('afterImprovementImgUrl')} />
										</label>
										{formInput.afterImprovementImgUrl && (
											<img src={formInput.afterImprovementImgUrl} className="w-10 h-10 object-cover mt-1.5 rounded-md border border-zinc-200" alt="After" />
										)}
									</div>

									{/* Prevention */}
									<div className="flex flex-col items-center">
										<label className="w-full flex flex-col items-center justify-center border border-dashed border-zinc-200 rounded-lg p-2 bg-white cursor-pointer hover:bg-zinc-50 text-center min-h-[70px]">
											<Upload className="w-3.5 h-3.5 text-zinc-450 mb-0.5" />
											<span className="text-[8px] font-bold text-zinc-500 uppercase">Prevention</span>
											<input type="file" accept="image/*" className="hidden" onChange={handleImageChange('preventionImgUrl')} />
										</label>
										{formInput.preventionImgUrl && (
											<img src={formInput.preventionImgUrl} className="w-10 h-10 object-cover mt-1.5 rounded-md border border-zinc-200" alt="Prevention" />
										)}
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* 5. Schedule Details & Remarks */}
					<div className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50/10 space-y-4">
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div>
								<label className="block text-[10px] font-bold text-[#11236a] uppercase tracking-wider mb-1">Target Date</label>
								<input 
									type="date" 
									value={formInput.targetDate} 
									onChange={(e) => setFormInput({ ...formInput, targetDate: e.target.value })}
									className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-800 outline-none"
								/>
							</div>

							<div>
								<label className="block text-[10px] font-bold text-[#11236a] uppercase tracking-wider mb-1">Status</label>
								<select 
									value={formInput.status} 
									onChange={(e) => setFormInput({ ...formInput, status: e.target.value })}
									className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-800 outline-none cursor-pointer"
								>
									<option value="Pending">Pending</option>
									<option value="Done">Done</option>
								</select>
							</div>
						</div>

						<div>
							<label className="block text-[10px] font-bold text-[#11236a] uppercase tracking-wider mb-1">Remark</label>
							<textarea 
								rows={2}
								value={formInput.remark} 
								onChange={(e) => setFormInput({ ...formInput, remark: e.target.value })}
								className="w-full bg-white border border-zinc-200 rounded-xl p-3 text-xs font-semibold text-zinc-800 outline-none focus:border-[#11236a] resize-none"
								placeholder="Add extra remarks..."
							/>
						</div>
					</div>

					{/* Submit buttons */}
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
							className="px-5 py-2 bg-[#11236a] hover:bg-[#0c1a52] text-white rounded-xl text-xs font-bold cursor-pointer active:scale-95 transition-all border-none outline-none flex items-center gap-1.5 shadow-xs"
						>
							<Send className="w-3.5 h-3.5" /> Submit CAPA Report
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
