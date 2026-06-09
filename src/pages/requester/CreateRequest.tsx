import { useState, useEffect } from 'react';
import { ChevronLeft, Send, Upload, FileText, X, AlertTriangle, HelpCircle, CheckCircle, Edit3 } from 'lucide-react';
import { getTestTypes } from '../../services/operations/testTypeService';
import CustomSelect from '../../components/CustomSelect';
import { toast } from 'react-hot-toast';

interface CreateRequestProps {
	onSubmit: (input: any, files: File[]) => void;
	setActiveTab: (tab: string) => void;
}

export default function CreateRequest({ onSubmit, setActiveTab }: CreateRequestProps) {
	const [formInput, setFormInput] = useState({
		customerNameAddress: '',
		manufacturerNameAddress: '',
		customerContactDetails: '',
		sampleDescription: '',
		modelNo: '',
		familyModel: '',
		serialNumber: '',
		productRating: '',
		sampleQty: 1,
		brandName: '',
		attachmentMention: '',
		witnessRequired: 'No',
		witnessPersonDetails: '',
		testMethodRef: '',
		conformityStatement: 'not Required',
		decisionRule: 'As per standard',
		collectBack: 'No',
		testTypeId: ''
	});

	const [testTypes, setTestTypes] = useState<any[]>([]);
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [showPreview, setShowPreview] = useState(false);

	useEffect(() => {
		const fetchTypes = async () => {
			try {
				const types = await getTestTypes()();
				setTestTypes(types);
			} catch (error) {
				console.error('Failed to fetch test types:', error);
			}
		};
		fetchTypes();
	}, []);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const filesArray = Array.from(e.target.files);
			setSelectedFiles((prev) => [...prev, ...filesArray]);
		}
	};

	const removeFile = (index: number) => {
		setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
	};

	const handleOpenFile = (file: File) => {
		try {
			const fileUrl = URL.createObjectURL(file);
			window.open(fileUrl, '_blank');
		} catch (error) {
			console.error('Failed to open file:', error);
		}
	};

	const handleFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formInput.testTypeId) {
			toast.error('Please select a Test Type.');
			return;
		}
		setShowPreview(true);
	};

	const handleFinalConfirm = () => {
		onSubmit(formInput, selectedFiles);
	};

	if (showPreview) {
		return (
			<div className="space-y-6 animate-fade-in">
				{/* Top bar */}
				<div className="flex items-center">
					<button 
						onClick={() => setShowPreview(false)}
						className="text-xs font-bold text-zinc-700 hover:text-zinc-955 flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none transition-colors"
					>
						<ChevronLeft className="w-4 h-4" /> Back to Form Editor
					</button>
				</div>

				{/* Preview layout sheet */}
				<div className="bg-white border border-zinc-200 rounded-3xl shadow-md p-6 max-w-4xl mx-auto space-y-6">
					<div className="border-b border-zinc-200 pb-4">
						<span className="text-[10px] font-extrabold px-2.5 py-1 bg-indigo-50 text-[#11236a] border border-indigo-100 rounded-md uppercase tracking-wider">Verification Step</span>
						<h3 className="text-base font-extrabold text-zinc-955 uppercase tracking-wider mt-2.5">Confirm Testing Request Details</h3>
						<p className="text-xs text-zinc-700 font-semibold mt-1">Please review all values carefully. Click Confirm & Submit below to dispatch samples to NABL laboratory calibration.</p>
					</div>

					<div className="space-y-6 divide-y divide-zinc-200 text-xs">
						{/* SECTION 1 Preview */}
						<div className="space-y-4 pt-2">
							<h4 className="text-xs font-extrabold text-[#11236a] uppercase tracking-wider">1. Applicant & Manufacturer Profile</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 shadow-sm">
									<p className="text-[10px] text-zinc-700 font-extrabold uppercase tracking-wider mb-1.5">Customer / Applicant Name & Address</p>
									<p className="text-xs font-bold text-zinc-950 whitespace-pre-wrap leading-relaxed">{formInput.customerNameAddress}</p>
								</div>
								<div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 shadow-sm">
									<p className="text-[10px] text-zinc-700 font-extrabold uppercase tracking-wider mb-1.5">Manufacturer Name & Address</p>
									<p className="text-xs font-bold text-zinc-955 whitespace-pre-wrap leading-relaxed">{formInput.manufacturerNameAddress}</p>
								</div>
							</div>
							<div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 shadow-sm">
								<p className="text-[10px] text-zinc-700 font-extrabold uppercase tracking-wider mb-1.5">Contact Details</p>
								<p className="text-xs font-bold text-zinc-955 leading-relaxed">{formInput.customerContactDetails}</p>
							</div>
						</div>

						{/* SECTION 2 Preview */}
						<div className="space-y-4 pt-4">
							<h4 className="text-xs font-extrabold text-[#11236a] uppercase tracking-wider">2. Technical Specifications</h4>
							<div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 shadow-sm">
								<p className="text-[10px] text-zinc-700 font-extrabold uppercase tracking-wider mb-1.5">Sample Description</p>
								<p className="text-xs font-bold text-zinc-955 whitespace-pre-wrap leading-relaxed">{formInput.sampleDescription}</p>
							</div>
							
							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
								<div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 shadow-sm">
									<p className="text-[10px] text-zinc-700 font-extrabold uppercase tracking-wider mb-1.5">Model No. / ID</p>
									<p className="text-xs font-bold text-zinc-955">{formInput.modelNo}</p>
								</div>
								<div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 shadow-sm">
									<p className="text-[10px] text-zinc-700 font-extrabold uppercase tracking-wider mb-1.5">Family Model</p>
									<p className="text-xs font-bold text-zinc-955">{formInput.familyModel || 'N/A'}</p>
								</div>
								<div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 shadow-sm">
									<p className="text-[10px] text-zinc-700 font-extrabold uppercase tracking-wider mb-1.5">Serial Number</p>
									<p className="text-xs font-bold text-zinc-955">{formInput.serialNumber || 'N/A'}</p>
								</div>
								<div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 shadow-sm">
									<p className="text-[10px] text-zinc-700 font-extrabold uppercase tracking-wider mb-1.5">Product Rating</p>
									<p className="text-xs font-bold text-zinc-955">{formInput.productRating}</p>
								</div>
								<div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 shadow-sm">
									<p className="text-[10px] text-zinc-700 font-extrabold uppercase tracking-wider mb-1.5">Sample Quantity</p>
									<p className="text-xs font-bold text-zinc-955">{formInput.sampleQty} Pcs</p>
								</div>
								<div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 shadow-sm">
									<p className="text-[10px] text-zinc-700 font-extrabold uppercase tracking-wider mb-1.5">Trade Mark / Brand</p>
									<p className="text-xs font-bold text-zinc-955">{formInput.brandName}</p>
								</div>
							</div>

							{formInput.attachmentMention && (
								<div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 shadow-sm">
									<p className="text-[10px] text-zinc-700 font-extrabold uppercase tracking-wider mb-1.5">Drawing / Specifications Mentioned</p>
									<p className="text-xs font-bold text-zinc-955">{formInput.attachmentMention}</p>
								</div>
							)}
						</div>

						{/* SECTION 3 Preview */}
						<div className="space-y-4 pt-4">
							<h4 className="text-xs font-extrabold text-[#11236a] uppercase tracking-wider">3. Protocols & Witness Scope</h4>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 shadow-sm">
									<p className="text-[10px] text-zinc-700 font-extrabold uppercase tracking-wider mb-1.5">Ref. Test Method / Specifications</p>
									<p className="text-xs font-bold text-zinc-955 leading-relaxed">{formInput.testMethodRef}</p>
								</div>
								<div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 shadow-sm">
									<p className="text-[10px] text-zinc-700 font-extrabold uppercase tracking-wider mb-1.5">Test Type</p>
									<p className="text-xs font-bold text-zinc-955">
										{testTypes.find(t => String(t.id) === String(formInput.testTypeId))?.name || 'N/A'}
									</p>
								</div>
								<div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 shadow-sm">
									<p className="text-[10px] text-zinc-700 font-extrabold uppercase tracking-wider mb-1.5">Witness Requirements</p>
									<p className="text-xs font-bold text-zinc-955">{formInput.witnessRequired}</p>
								</div>
							</div>
							{formInput.witnessRequired === 'Yes' && (
								<div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 shadow-sm">
									<p className="text-[10px] text-zinc-700 font-extrabold uppercase tracking-wider mb-1.5">Witnessing Person Details</p>
									<p className="text-xs font-bold text-zinc-955">{formInput.witnessPersonDetails}</p>
								</div>
							)}
						</div>

						{/* SECTION 4 Preview */}
						<div className="space-y-4 pt-4">
							<h4 className="text-xs font-extrabold text-[#11236a] uppercase tracking-wider">4. Conformity & Logistical Rules</h4>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 shadow-sm">
									<p className="text-[10px] text-zinc-700 font-extrabold uppercase tracking-wider mb-1.5">Statement of Conformity</p>
									<p className="text-xs font-bold text-zinc-955">{formInput.conformityStatement === 'Required' ? 'Required' : 'Not Required'}</p>
								</div>
								{formInput.conformityStatement === 'Required' && (
									<div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 shadow-sm">
										<p className="text-[10px] text-zinc-700 font-extrabold uppercase tracking-wider mb-1.5">Decision Rule Choice</p>
										<p className="text-xs font-bold text-zinc-955">{formInput.decisionRule}</p>
									</div>
								)}
							</div>

							<div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
								<div>
									<p className="text-[10px] text-zinc-700 font-extrabold uppercase tracking-wider mb-1.5">Sample Collect-back Request</p>
									<p className="text-xs font-bold text-zinc-955">{formInput.collectBack}</p>
								</div>
								{formInput.collectBack === 'Yes' && (
									<div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start gap-2.5 max-w-md shrink-0">
										<AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
										<span className="text-[10px] text-amber-900 font-bold leading-normal">
											Collect within 15 days of test report issuance or sample will be destroyed.
										</span>
									</div>
								)}
							</div>
						</div>

						{/* File List Preview */}
						{selectedFiles.length > 0 && (
							<div className="space-y-4 pt-4">
								<h4 className="text-xs font-extrabold text-[#11236a] uppercase tracking-wider">5. Uploaded Drawing Documents</h4>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									{selectedFiles.map((file, idx) => (
										<div 
											key={idx} 
											onClick={() => handleOpenFile(file)}
											title="Click to preview file in a new tab"
											className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 shadow-sm cursor-pointer hover:bg-zinc-100 hover:border-indigo-300 transition-all group"
										>
											<FileText className="w-5 h-5 text-[#11236a] group-hover:text-indigo-650 shrink-0 transition-colors" />
											<div className="overflow-hidden">
												<p className="text-xs font-bold text-zinc-955 truncate leading-none mb-1 group-hover:underline group-hover:text-indigo-650 transition-colors">{file.name}</p>
												<span className="text-[10px] text-zinc-700 font-semibold">Size: {(file.size / 1024).toFixed(1)} KB</span>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Final buttons */}
					<div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
						<button 
							type="button" 
							onClick={() => setShowPreview(false)}
							className="px-4 py-2.5 border border-zinc-200 text-zinc-700 rounded-xl text-xs font-bold bg-white hover:bg-zinc-50 cursor-pointer active:scale-95 transition-all outline-none flex items-center gap-1.5"
						>
							<Edit3 className="w-3.5 h-3.5 text-zinc-700" /> Back & Edit Form
						</button>
						<button 
							type="button" 
							onClick={handleFinalConfirm}
							className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer active:scale-95 transition-all border-none outline-none flex items-center gap-1.5 shadow-sm"
						>
							<CheckCircle className="w-4 h-4" /> Confirm & Submit Request
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Back Button Panel */}
			<div className="flex items-center">
				<button 
					onClick={() => setActiveTab('my-requests')}
					className="text-xs font-bold text-zinc-700 hover:text-zinc-955 flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none transition-colors"
				>
					<ChevronLeft className="w-4 h-4" /> Back to Submission List
				</button>
			</div>

			{/* Form Sheet Card */}
			<div className="bg-white border border-zinc-200/50 rounded-3xl shadow-sm p-6 max-w-4xl mx-auto">
				<div className="border-b border-zinc-150 pb-4 mb-6">
					<h3 className="text-sm font-extrabold text-zinc-955 uppercase tracking-wider">Submit Testing Request Form</h3>
					<p className="text-[11px] text-zinc-650 font-medium mt-1">Please enter exact technical calibrations. Fields marked with <span className="text-rose-500 font-bold">*</span> are mandatory.</p>
				</div>

				<form onSubmit={handleFormSubmit} className="space-y-6">
					{/* SECTION 1: Customer & Manufacturer Information */}
					<div className="space-y-4">
						<h4 className="text-xs font-bold text-[#11236a] uppercase tracking-wider border-l-2 border-[#11236a] pl-2">1. Applicant & Manufacturer Details</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
							<div>
								<label className="block text-xs font-bold text-zinc-800 mb-1.5">
									Name and Address of Customer / Applicant <span className="text-rose-500 font-extrabold">*</span>
								</label>
								<textarea 
									required
									rows={2}
									placeholder="Enter full name, company, and complete address"
									value={formInput.customerNameAddress}
									onChange={(e) => setFormInput({...formInput, customerNameAddress: e.target.value})}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl p-3 text-xs font-semibold text-zinc-800 placeholder-zinc-600 outline-none focus:bg-white focus:border-[#11236a] transition-all resize-none"
								/>
							</div>

							<div>
								<label className="block text-xs font-bold text-zinc-800 mb-1.5">
									Manufacturer Name and Address <span className="text-rose-500 font-extrabold">*</span>
								</label>
								<textarea 
									required
									rows={2}
									placeholder="Enter full manufacturing facility name and location"
									value={formInput.manufacturerNameAddress}
									onChange={(e) => setFormInput({...formInput, manufacturerNameAddress: e.target.value})}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl p-3 text-xs font-semibold text-zinc-800 placeholder-zinc-600 outline-none focus:bg-white focus:border-[#11236a] transition-all resize-none"
								/>
							</div>
						</div>

						<div className="w-full">
							<label className="block text-xs font-bold text-zinc-800 mb-1.5">
								Contact Details of Customer / Applicant <span className="text-rose-500 font-extrabold">*</span>
							</label>
							<input 
								type="text" 
								required
								placeholder="Phone number, Email address, or primary point of contact"
								value={formInput.customerContactDetails}
								onChange={(e) => setFormInput({...formInput, customerContactDetails: e.target.value})}
								className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-800 placeholder-zinc-600 outline-none focus:bg-white focus:border-[#11236a] transition-all"
							/>
						</div>
					</div>

					{/* SECTION 2: Sample Description & Product Specs */}
					<div className="space-y-4 pt-2">
						<h4 className="text-xs font-bold text-[#11236a] uppercase tracking-wider border-l-2 border-[#11236a] pl-2">2. Sample & Product Specifications</h4>
						<div>
							<label className="block text-xs font-bold text-zinc-800 mb-1.5">
								Sample Description <span className="text-rose-500 font-extrabold">*</span>
							</label>
							<textarea 
								required
								rows={2}
								placeholder="Enter full detail describing the material composition, application, physical state..."
								value={formInput.sampleDescription}
								onChange={(e) => setFormInput({...formInput, sampleDescription: e.target.value})}
								className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl p-3 text-xs font-semibold text-zinc-800 placeholder-zinc-600 outline-none focus:bg-white focus:border-[#11236a] transition-all resize-none"
							/>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
							<div>
								<label className="block text-xs font-bold text-zinc-800 mb-1.5">
									Model No. / Identification <span className="text-rose-500 font-extrabold">*</span>
								</label>
								<input 
									type="text" 
									required
									placeholder="e.g. SMT-90-A"
									value={formInput.modelNo}
									onChange={(e) => setFormInput({...formInput, modelNo: e.target.value})}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-800 placeholder-zinc-600 outline-none focus:bg-white focus:border-[#11236a] transition-all"
								/>
							</div>

							<div>
								<label className="block text-xs font-bold text-zinc-800 mb-1.5">
									Family Model <span className="text-zinc-600 font-medium">(if Any)</span>
								</label>
								<input 
									type="text" 
									placeholder="e.g. SMT-90-B, SMT-90-C"
									value={formInput.familyModel}
									onChange={(e) => setFormInput({...formInput, familyModel: e.target.value})}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-800 placeholder-zinc-600 outline-none focus:bg-white focus:border-[#11236a] transition-all"
								/>
							</div>

							<div>
								<label className="block text-xs font-bold text-zinc-800 mb-1.5">
									Product Serial Number <span className="text-zinc-600 font-medium">(if Any)</span>
								</label>
								<input 
									type="text" 
									placeholder="e.g. SN-88301928"
									value={formInput.serialNumber}
									onChange={(e) => setFormInput({...formInput, serialNumber: e.target.value})}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-800 placeholder-zinc-600 outline-none focus:bg-white focus:border-[#11236a] transition-all"
								/>
							</div>

							<div>
								<label className="block text-xs font-bold text-zinc-800 mb-1.5">
									Product Rating <span className="text-rose-500 font-extrabold">*</span>
								</label>
								<input 
									type="text" 
									required
									placeholder="e.g. 230V AC, 50Hz, 16A"
									value={formInput.productRating}
									onChange={(e) => setFormInput({...formInput, productRating: e.target.value})}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-800 placeholder-zinc-600 outline-none focus:bg-white focus:border-[#11236a] transition-all"
								/>
							</div>

							<div>
								<label className="block text-xs font-bold text-zinc-800 mb-1.5">
									Sample Qty <span className="text-rose-500 font-extrabold">*</span>
								</label>
								<input 
									type="number" 
									required
									min="1"
									value={formInput.sampleQty}
									onChange={(e) => setFormInput({...formInput, sampleQty: parseInt(e.target.value) || 1})}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-800 outline-none focus:bg-white focus:border-[#11236a] transition-all"
								/>
							</div>

							<div>
								<label className="block text-xs font-bold text-zinc-800 mb-1.5">
									Trade Mark / Brand <span className="text-rose-500 font-extrabold">*</span>
								</label>
								<input 
									type="text" 
									required
									placeholder="e.g. DIXON"
									value={formInput.brandName}
									onChange={(e) => setFormInput({...formInput, brandName: e.target.value})}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-800 placeholder-zinc-600 outline-none focus:bg-white focus:border-[#11236a] transition-all"
								/>
							</div>
						</div>

						<div>
							<label className="block text-xs font-bold text-zinc-800 mb-1.5">
								Drawing / Specification / any attachment (Please mention)
							</label>
							<input 
								type="text" 
								placeholder="Mention title or drawing numbers attached, e.g. DWG-2026-REV2"
								value={formInput.attachmentMention}
								onChange={(e) => setFormInput({...formInput, attachmentMention: e.target.value})}
								className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-800 placeholder-zinc-600 outline-none focus:bg-white focus:border-[#11236a] transition-all"
							/>
						</div>
					</div>

					{/* SECTION 3: Testing Parameters & Witness */}
					<div className="space-y-4 pt-2">
						<h4 className="text-xs font-bold text-[#11236a] uppercase tracking-wider border-l-2 border-[#11236a] pl-2">3. Testing Protocols & Witness Parameters</h4>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
							<div>
								<label className="block text-xs font-bold text-zinc-800 mb-1.5">
									Ref. Test method / Specification's <span className="text-rose-500 font-extrabold">*</span>
								</label>
								<input 
									type="text" 
									required
									placeholder="e.g. IEC-60068-2-14 or IS-13252"
									value={formInput.testMethodRef}
									onChange={(e) => setFormInput({...formInput, testMethodRef: e.target.value})}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-800 placeholder-zinc-600 outline-none focus:bg-white focus:border-[#11236a] transition-all"
								/>
							</div>

							<div>
								<label className="block text-xs font-bold text-zinc-800 mb-1.5">
									Test Type <span className="text-rose-500 font-extrabold">*</span>
								</label>
								<CustomSelect
									value={formInput.testTypeId}
									onChange={(val) => setFormInput({...formInput, testTypeId: val})}
									options={testTypes.map(t => ({ value: String(t.id), label: t.name }))}
									placeholder="Select Test Type"
								/>
							</div>

							<div>
								<label className="block text-xs font-bold text-zinc-800 mb-1.5">
									Witness Required <span className="text-rose-500 font-extrabold">*</span>
								</label>
								<div className="grid grid-cols-2 gap-3">
									{['Yes', 'No'].map((opt) => (
										<button
											key={opt}
											type="button"
											onClick={() => {
												setFormInput({
													...formInput, 
													witnessRequired: opt,
													witnessPersonDetails: opt === 'No' ? '' : formInput.witnessPersonDetails
												});
											}}
											className={`py-2.5 rounded-xl text-xs font-bold border outline-none cursor-pointer active:scale-95 transition-all ${
												formInput.witnessRequired === opt
													? 'bg-[#11236a] border-[#11236a] text-white shadow-sm'
													: 'bg-[#f8fafc] border-zinc-200 text-zinc-700 hover:bg-zinc-50'
											}`}
										>
											{opt}
										</button>
									))}
								</div>
							</div>
						</div>

						{formInput.witnessRequired === 'Yes' && (
							<div className="w-full animate-fade-in">
								<label className="block text-xs font-bold text-zinc-800 mb-1.5">
									Name and designation of person who will witness the test <span className="text-rose-500 font-extrabold">*</span>
								</label>
								<input 
									type="text" 
									required
									placeholder="e.g. Mr. John Doe (Quality Manager)"
									value={formInput.witnessPersonDetails}
									onChange={(e) => setFormInput({...formInput, witnessPersonDetails: e.target.value})}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-800 placeholder-zinc-600 outline-none focus:bg-white focus:border-[#11236a] transition-all"
								/>
							</div>
						)}
					</div>

					{/* SECTION 4: Conformity & Logistical Rules */}
					<div className="space-y-4 pt-2">
						<h4 className="text-xs font-bold text-[#11236a] uppercase tracking-wider border-l-2 border-[#11236a] pl-2">4. Conformity & Logistical Parameters</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
							<div>
								<label className="block text-xs font-bold text-zinc-800 mb-1.5">
									Statement of conformity <span className="text-rose-500 font-extrabold">*</span>
								</label>
								<div className="grid grid-cols-2 gap-3">
									{['Required', 'not Required'].map((opt) => (
										<button
											key={opt}
											type="button"
											onClick={() => setFormInput({...formInput, conformityStatement: opt})}
											className={`py-2.5 rounded-xl text-xs font-bold border outline-none cursor-pointer active:scale-95 transition-all ${
												formInput.conformityStatement === opt
													? 'bg-[#11236a] border-[#11236a] text-white shadow-sm'
													: 'bg-[#f8fafc] border-zinc-200 text-zinc-700 hover:bg-zinc-50'
											}`}
										>
											{opt === 'Required' ? 'Required' : 'Not Required'}
										</button>
									))}
								</div>
							</div>

							{formInput.conformityStatement === 'Required' && (
								<div className="animate-fade-in">
									<label className="block text-xs font-bold text-zinc-800 mb-1.5 flex items-center gap-1">
										Select one for decision rule <span className="text-rose-500 font-extrabold">*</span>
										<HelpCircle className="w-3.5 h-3.5 text-zinc-650" />
									</label>
									<select
										value={formInput.decisionRule}
										onChange={(e) => setFormInput({...formInput, decisionRule: e.target.value})}
										className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-800 outline-none focus:bg-white focus:border-[#11236a] transition-all cursor-pointer"
									>
										<option value="Measurement of uncertainty">(A) Measurement of uncertainty</option>
										<option value="As per standard">(B) As per standard</option>
										<option value="As per customer specification, if better than standards">(C) As per customer specification, if better than standards</option>
									</select>
								</div>
							)}
						</div>

						<div className="bg-[#f8fafc] border border-zinc-200 rounded-2xl p-4 space-y-3">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
								<div>
									<label className="block text-xs font-bold text-zinc-800">
										Whether sample will be collected back <span className="text-zinc-600 font-semibold">(not applicable for destructive test)</span> <span className="text-rose-500 font-extrabold">*</span>
									</label>
								</div>
								<div className="flex gap-2 shrink-0">
									{['Yes', 'No'].map((opt) => (
										<button
											key={opt}
											type="button"
											onClick={() => setFormInput({...formInput, collectBack: opt})}
											className={`px-4 py-1.5 rounded-xl text-xs font-bold border outline-none cursor-pointer active:scale-95 transition-all ${
												formInput.collectBack === opt
													? 'bg-[#11236a] border-[#11236a] text-white shadow-sm'
													: 'bg-[#f8fafc] border-zinc-200 text-zinc-700 hover:bg-zinc-50'
											}`}
										>
											{opt}
										</button>
									))}
								</div>
							</div>

							{formInput.collectBack === 'Yes' && (
								<div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 animate-fade-in">
									<AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
									<p className="text-[10px] text-amber-800 font-bold leading-normal">
										Please collect the sample within 15 days from the date of issuing the test report. After this period, the sample will be destroyed.
									</p>
								</div>
							)}
						</div>
					</div>

					{/* File Attachments Dropzone */}
					<div className="space-y-4 pt-2">
						<h4 className="text-xs font-bold text-[#11236a] uppercase tracking-wider border-l-2 border-[#11236a] pl-2">5. Supporting Documents & File Attachments</h4>
						<div className="border-2 border-dashed border-zinc-200 hover:border-[#11236a] rounded-2xl p-6 text-center bg-zinc-50/50 transition-colors relative group">
							<input 
								type="file" 
								multiple 
								onChange={handleFileChange}
								className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
							/>
							<Upload className="w-8 h-8 text-zinc-650 mx-auto mb-2 group-hover:scale-110 transition-transform" />
							<p className="text-xs font-bold text-zinc-700">Drag and drop drawing files or click to browse</p>
							<p className="text-[10px] text-zinc-650 font-semibold mt-1">Acceptable types: PDF, PNG, JPG, CAD, DWG (Max 15MB each)</p>
						</div>

						{selectedFiles.length > 0 && (
							<div className="bg-[#f8fafc] border border-zinc-200 rounded-2xl p-4 space-y-2 max-h-48 overflow-y-auto">
								<p className="text-[10px] text-zinc-700 font-extrabold uppercase tracking-wider mb-2">Attached Files ({selectedFiles.length})</p>
								{selectedFiles.map((file, idx) => (
									<div key={idx} className="flex items-center justify-between bg-white border border-zinc-200 rounded-xl p-2.5 hover:shadow-sm transition-shadow animate-fade-in">
										<div 
											onClick={() => handleOpenFile(file)}
											title="Click to preview file in a new tab"
											className="flex items-center gap-2 overflow-hidden mr-3 cursor-pointer hover:text-indigo-650 group"
										>
											<FileText className="w-4 h-4 text-indigo-650 shrink-0" />
											<span className="text-xs font-bold text-zinc-800 truncate group-hover:underline group-hover:text-indigo-600 transition-colors">{file.name}</span>
											<span className="text-[9px] text-zinc-550 shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
										</div>
										<button 
											type="button" 
											onClick={() => removeFile(idx)}
											className="p-1 hover:bg-zinc-100 text-zinc-650 hover:text-red-650 rounded-lg cursor-pointer outline-none border-none transition-colors"
										>
											<X className="w-3.5 h-3.5" />
										</button>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Buttons */}
					<div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-150">
						<button 
							type="button"
							onClick={() => setActiveTab('my-requests')}
							className="px-4 py-2 border border-zinc-200 text-zinc-700 rounded-xl text-xs font-bold bg-white hover:bg-zinc-50 cursor-pointer active:scale-95 transition-all outline-none"
						>
							Cancel
						</button>
						<button 
							type="submit"
							className="px-5 py-2 bg-[#11236a] hover:bg-[#0c1a52] text-white rounded-xl text-xs font-bold cursor-pointer active:scale-95 transition-all border-none outline-none flex items-center gap-1.5 shadow-sm"
						>
							<Send className="w-3.5 h-3.5" /> Preview & Confirm
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
