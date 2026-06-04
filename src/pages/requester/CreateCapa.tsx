import { useState } from 'react';
import { ChevronLeft, Send, Upload, CheckCircle, AlertCircle, X } from 'lucide-react';

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
	const defaultRelated = requests.length > 0 ? requests[0].id : '';
	const initialRequest = initialInput?.relatedRequest || defaultRelated;
	const matchedRequest = requests.find(r => r.id === initialRequest);

	const [showPreview, setShowPreview] = useState(false);

	const [formInput, setFormInput] = useState<any>({
		relatedRequest: initialRequest,
		partProduct: initialInput?.partProduct || matchedRequest?.brandName || '',
		modelName: initialInput?.modelName || matchedRequest?.modelNo || '',
		customerSupplier: initialInput?.customerSupplier || matchedRequest?.customerNameAddress || '',
		date: initialInput?.date || new Date().toISOString().split('T')[0],
		result: initialInput?.result || 'NG',
		title: initialInput?.title || initialInput?.nonConformity || '',
		improvementType: initialInput?.improvementType || 'Process',
		partName: initialInput?.partName || matchedRequest?.sampleDescription || '',

		problem: initialInput?.problem || initialInput?.nonConformity || '',
		model: initialInput?.model || matchedRequest?.modelNo || '',
		defectQty: initialInput?.defectQty || (matchedRequest ? String(matchedRequest.sampleQty) : ''),
		venue: initialInput?.venue || '',
		// image fields stored as preview strings only; actual File objects held separately
		imageUrl: '',

		why1: initialInput?.why1 || initialInput?.rootCause || '',
		why2: initialInput?.why2 || '',
		why3: initialInput?.why3 || '',
		why4: initialInput?.why4 || '',

		undetectedWhy1: initialInput?.undetectedWhy1 || '',
		undetectedWhy2: initialInput?.undetectedWhy2 || '',
		undetectedWhy3: initialInput?.undetectedWhy3 || '',

		tempCountermeasure: initialInput?.tempCountermeasure || initialInput?.correctiveAction || '',
		radicalCountermeasure: initialInput?.radicalCountermeasure || initialInput?.preventiveAction || '',
		inspectionControl: initialInput?.inspectionControl || '',
		processControl: initialInput?.processControl || '',

		beforeImprovementImgUrl: '',
		afterImprovementImgUrl: '',
		preventionImgUrl: '',

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
			partName: matched ? matched.sampleDescription : '',
			problem: matched ? `Test failure observed under ${matched.testMethodRef} testing cycles. Details: ${matched.sampleDescription}` : '',
			title: matched ? `Test failure observed under ${matched.testMethodRef} testing cycles. Details: ${matched.sampleDescription}` : '',
			model: matched ? matched.modelNo : '',
			defectQty: matched ? String(matched.sampleQty) : ''
		});
	};

	// Store raw File objects for upload; preview strings for display
	const [imageFiles, setImageFiles] = useState<{
		imageFile?: File;
		beforeImprovementFile?: File;
		afterImprovementFile?: File;
		preventionFile?: File;
	}>({});
	const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});

	const handleImageChange = (fileField: string, previewField: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		// Store raw file for FormData upload
		setImageFiles(prev => ({ ...prev, [fileField]: file }));
		// Generate local preview
		const reader = new FileReader();
		reader.onloadend = () => {
			setImagePreviews(prev => ({ ...prev, [previewField]: reader.result as string }));
		};
		reader.readAsDataURL(file);
	};

	const clearImage = (fileField: string, previewField: string) => {
		setImageFiles(prev => { const n = { ...prev }; delete (n as any)[fileField]; return n; });
		setImagePreviews(prev => { const n = { ...prev }; delete n[previewField]; return n; });
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setShowPreview(true);
	};

	const confirmSubmit = () => {
		// Build FormData so images are sent as multipart files
		const fd = new FormData();

		const textPayload: Record<string, string> = {
			...formInput,
			productName: `${formInput.partProduct} ${formInput.modelName}`,
			nonConformity: formInput.problem || formInput.title,
			rootCause: formInput.why1 || formInput.why2 || formInput.why3 || 'See Why-Why Analysis details.',
			correctiveAction: formInput.tempCountermeasure || 'See Temporary Countermeasure details.',
			preventiveAction: formInput.radicalCountermeasure || 'See Radical Countermeasure details.',
			targetedDate: formInput.targetDate
		};

		// Append all text fields
		Object.entries(textPayload).forEach(([k, v]) => {
			if (v !== undefined && v !== null) fd.append(k, String(v));
		});

		// Append image files under their multer field names
		if (imageFiles.imageFile)             fd.append('imageFile',             imageFiles.imageFile);
		if (imageFiles.beforeImprovementFile) fd.append('beforeImprovementFile', imageFiles.beforeImprovementFile);
		if (imageFiles.afterImprovementFile)  fd.append('afterImprovementFile',  imageFiles.afterImprovementFile);
		if (imageFiles.preventionFile)        fd.append('preventionFile',        imageFiles.preventionFile);

		onSubmit(fd);
		setShowPreview(false);
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
										<input type="file" accept="image/*" className="hidden" onChange={handleImageChange('imageFile', 'imageUrl')} />
									</label>
									{imagePreviews.imageUrl && (
										<div className="relative w-16 h-16 rounded-xl border border-zinc-200 overflow-hidden shrink-0 bg-zinc-50">
											<img src={imagePreviews.imageUrl} alt="Defect" className="w-full h-full object-cover" />
											<button type="button" onClick={() => clearImage('imageFile', 'imageUrl')} className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full w-4 h-4 flex items-center justify-center cursor-pointer border-none outline-none">
												<X className="w-2.5 h-2.5" />
											</button>
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
											<input type="file" accept="image/*" className="hidden" onChange={handleImageChange('beforeImprovementFile', 'beforeImprovementImgUrl')} />
										</label>
										{imagePreviews.beforeImprovementImgUrl && (
											<div className="relative mt-1.5">
												<img src={imagePreviews.beforeImprovementImgUrl} className="w-10 h-10 object-cover rounded-md border border-zinc-200" alt="Before" />
												<button type="button" onClick={() => clearImage('beforeImprovementFile', 'beforeImprovementImgUrl')} className="absolute -top-1 -right-1 bg-black/50 text-white rounded-full w-4 h-4 flex items-center justify-center cursor-pointer border-none outline-none">
													<X className="w-2.5 h-2.5" />
												</button>
											</div>
										)}
									</div>

									{/* After */}
									<div className="flex flex-col items-center">
										<label className="w-full flex flex-col items-center justify-center border border-dashed border-zinc-200 rounded-lg p-2 bg-white cursor-pointer hover:bg-zinc-50 text-center min-h-[70px]">
											<Upload className="w-3.5 h-3.5 text-zinc-450 mb-0.5" />
											<span className="text-[8px] font-bold text-zinc-500 uppercase">After</span>
											<input type="file" accept="image/*" className="hidden" onChange={handleImageChange('afterImprovementFile', 'afterImprovementImgUrl')} />
										</label>
										{imagePreviews.afterImprovementImgUrl && (
											<div className="relative mt-1.5">
												<img src={imagePreviews.afterImprovementImgUrl} className="w-10 h-10 object-cover rounded-md border border-zinc-200" alt="After" />
												<button type="button" onClick={() => clearImage('afterImprovementFile', 'afterImprovementImgUrl')} className="absolute -top-1 -right-1 bg-black/50 text-white rounded-full w-4 h-4 flex items-center justify-center cursor-pointer border-none outline-none">
													<X className="w-2.5 h-2.5" />
												</button>
											</div>
										)}
									</div>

									{/* Prevention */}
									<div className="flex flex-col items-center">
										<label className="w-full flex flex-col items-center justify-center border border-dashed border-zinc-200 rounded-lg p-2 bg-white cursor-pointer hover:bg-zinc-50 text-center min-h-[70px]">
											<Upload className="w-3.5 h-3.5 text-zinc-450 mb-0.5" />
											<span className="text-[8px] font-bold text-zinc-500 uppercase">Prevention</span>
											<input type="file" accept="image/*" className="hidden" onChange={handleImageChange('preventionFile', 'preventionImgUrl')} />
										</label>
										{imagePreviews.preventionImgUrl && (
											<div className="relative mt-1.5">
												<img src={imagePreviews.preventionImgUrl} className="w-10 h-10 object-cover rounded-md border border-zinc-200" alt="Prevention" />
												<button type="button" onClick={() => clearImage('preventionFile', 'preventionImgUrl')} className="absolute -top-1 -right-1 bg-black/50 text-white rounded-full w-4 h-4 flex items-center justify-center cursor-pointer border-none outline-none">
													<X className="w-2.5 h-2.5" />
												</button>
											</div>
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
						<CheckCircle className="w-3.5 h-3.5" /> Preview CAPA Report
					</button>
				</div>
			</form>
		</div>

		{/* ============================================================
		    PREVIEW MODAL — shown after clicking "Preview CAPA Report"
		    ============================================================ */}
		{showPreview && (
			<div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-10 px-4">
				<div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 w-full max-w-3xl mx-auto">

					{/* Modal Header */}
					<div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-100">
						<div>
							<h2 className="text-sm font-extrabold text-[#11236a] uppercase tracking-wider">CAPA Report Preview</h2>
							<p className="text-[11px] text-zinc-500 font-medium mt-0.5">Review all details before final submission. You cannot edit after submitting.</p>
						</div>
						<button
							onClick={() => setShowPreview(false)}
							className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 cursor-pointer border-none outline-none transition-colors"
						>
							<X className="w-4 h-4" />
						</button>
					</div>

					{/* Preview Body */}
					<div className="px-6 py-5 space-y-5 text-xs">

						{/* Header Info */}
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
							{[
								{ label: 'Part / Product',     value: formInput.partProduct },
								{ label: 'Model Name',         value: formInput.modelName },
								{ label: 'Customer / Supplier',value: formInput.customerSupplier },
								{ label: 'Date',               value: formInput.date },
								{ label: 'Result',             value: formInput.result },
								{ label: 'Improvement Type',   value: formInput.improvementType },
							].map(({ label, value }) => (
								<div key={label} className="bg-zinc-50 border border-zinc-100 rounded-xl p-2.5">
									<p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">{label}</p>
									<p className="font-bold text-zinc-800 truncate">{value || <span className="text-zinc-400 font-normal italic">—</span>}</p>
								</div>
							))}
						</div>

						{/* Linked Request */}
						<div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3">
							<p className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider mb-0.5">Linked Request ID</p>
							<p className="font-bold text-indigo-800">{formInput.relatedRequest || '—'}</p>
						</div>

						{/* Title & Part */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3">
								<p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Title</p>
								<p className="font-semibold text-zinc-800 leading-relaxed">{formInput.title || '—'}</p>
							</div>
							<div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3">
								<p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Part Name</p>
								<p className="font-semibold text-zinc-800">{formInput.partName || '—'}</p>
							</div>
						</div>

						{/* Problem */}
						<div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3">
							<p className="text-[9px] font-bold text-rose-600 uppercase tracking-wider mb-1">Problem Statement</p>
							<p className="font-semibold text-zinc-800 leading-relaxed">{formInput.problem || '—'}</p>
							<div className="flex gap-4 mt-2 text-[10px] text-zinc-500 font-medium">
								<span>Model: <strong className="text-zinc-700">{formInput.model || '—'}</strong></span>
								<span>Defect Qty: <strong className="text-zinc-700">{formInput.defectQty || '—'}</strong></span>
								<span>Venue: <strong className="text-zinc-700">{formInput.venue || '—'}</strong></span>
							</div>
						</div>

						{/* Why-Why */}
						<div className="bg-amber-50/40 border border-amber-100 rounded-xl p-3 space-y-1.5">
							<p className="text-[9px] font-bold text-amber-700 uppercase tracking-wider mb-1">Root Cause (Why-Why Analysis)</p>
							{['why1','why2','why3','why4'].map((w, i) => formInput[w] ? (
								<div key={w} className="flex gap-2">
									<span className="text-[10px] font-extrabold text-[#11236a] w-12 shrink-0">Why {i+1}:</span>
									<span className="font-semibold text-zinc-700">{formInput[w]}</span>
								</div>
							) : null)}
						</div>

						{/* Countermeasures */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3">
								<p className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Temporary Countermeasure</p>
								<p className="font-semibold text-zinc-700 leading-relaxed">{formInput.tempCountermeasure || '—'}</p>
							</div>
							<div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3">
								<p className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Radical Countermeasure</p>
								<p className="font-semibold text-zinc-700 leading-relaxed">{formInput.radicalCountermeasure || '—'}</p>
							</div>
						</div>

						{/* Image previews */}
						{(imagePreviews.imageUrl || imagePreviews.beforeImprovementImgUrl || imagePreviews.afterImprovementImgUrl || imagePreviews.preventionImgUrl) && (
							<div>
								<p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Attached Images</p>
								<div className="flex flex-wrap gap-3">
									{imagePreviews.imageUrl && (
										<div className="flex flex-col items-center gap-1">
											<img src={imagePreviews.imageUrl} className="w-16 h-16 object-cover rounded-xl border border-zinc-200" alt="Defect" />
											<span className="text-[9px] text-zinc-400 font-bold uppercase">Defect</span>
										</div>
									)}
									{imagePreviews.beforeImprovementImgUrl && (
										<div className="flex flex-col items-center gap-1">
											<img src={imagePreviews.beforeImprovementImgUrl} className="w-16 h-16 object-cover rounded-xl border border-zinc-200" alt="Before" />
											<span className="text-[9px] text-zinc-400 font-bold uppercase">Before</span>
										</div>
									)}
									{imagePreviews.afterImprovementImgUrl && (
										<div className="flex flex-col items-center gap-1">
											<img src={imagePreviews.afterImprovementImgUrl} className="w-16 h-16 object-cover rounded-xl border border-zinc-200" alt="After" />
											<span className="text-[9px] text-zinc-400 font-bold uppercase">After</span>
										</div>
									)}
									{imagePreviews.preventionImgUrl && (
										<div className="flex flex-col items-center gap-1">
											<img src={imagePreviews.preventionImgUrl} className="w-16 h-16 object-cover rounded-xl border border-zinc-200" alt="Prevention" />
											<span className="text-[9px] text-zinc-400 font-bold uppercase">Prevention</span>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Schedule */}
						<div className="grid grid-cols-2 gap-3">
							<div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3">
								<p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Target Date</p>
								<p className="font-bold text-[#11236a]">{formInput.targetDate || '—'}</p>
							</div>
							<div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3">
								<p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Status</p>
								<p className="font-bold text-zinc-800">{formInput.status || '—'}</p>
							</div>
						</div>

						{formInput.remark && (
							<div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3">
								<p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Remark</p>
								<p className="font-semibold text-zinc-700">{formInput.remark}</p>
							</div>
						)}
					</div>

					{/* Modal Footer */}
					<div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 rounded-b-3xl">
						<button
							type="button"
							onClick={() => setShowPreview(false)}
							className="px-5 py-2.5 border border-zinc-200 text-zinc-700 rounded-xl text-xs font-bold bg-white hover:bg-zinc-50 cursor-pointer active:scale-95 transition-all outline-none"
						>
							← Edit Form
						</button>
						<button
							type="button"
							onClick={confirmSubmit}
							className="px-6 py-2.5 bg-[#11236a] hover:bg-[#0c1a52] text-white rounded-xl text-xs font-bold cursor-pointer active:scale-95 transition-all border-none outline-none flex items-center gap-1.5 shadow-sm"
						>
							<Send className="w-3.5 h-3.5" /> Confirm & Submit CAPA
						</button>
					</div>
				</div>
			</div>
		)}
	</div>
	);
}
