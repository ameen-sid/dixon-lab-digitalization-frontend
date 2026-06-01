import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, FileText, Eye } from 'lucide-react';
import CustomSelect from '../../components/CustomSelect';


interface AttachmentRecord {
	id: number;
	fileName: string;
	filePath: string;
	fileSize: number;
}

interface ApprovedRequest {
	id: string;
	requestId?: string;
	customerNameAddress: string;
	manufacturerNameAddress?: string;
	customerContactDetails?: string;
	sampleDescription: string;
	modelNo: string;
	familyModel?: string | null;
	serialNumber?: string | null;
	productRating?: string;
	sampleQty: number;
	brandName: string;
	attachmentMention?: string | null;
	witnessRequired?: string;
	witnessPersonDetails?: string | null;
	testMethodRef: string;
	conformityStatement?: string;
	decisionRule?: string | null;
	collectBack?: string;
	requesterName: string;
	status: string;
	approvedDate: string;
	engineerId?: string;
	engineerName?: string;
	inspectionResult?: string;
	inspectionRemarks?: string;
	inspectionDate?: string;
	attachments?: AttachmentRecord[];
}

interface EngineerRecord {
	id: string;
	name: string;
	role: string;
}

interface ApprovedRequestDetailsProps {
	request: ApprovedRequest | null;
	engineers: EngineerRecord[];
	onAssignEngineer: (requestId: string, engineerId: string, engineerName: string) => void;
	onSimulateInspectionCompletion: (requestId: string, result: 'PASSED' | 'FAILED', remarks: string) => void;
}

export default function ApprovedRequestDetails({ 
	request, 
	engineers,
	onAssignEngineer, 
	onSimulateInspectionCompletion: _onSimulateInspectionCompletion
}: ApprovedRequestDetailsProps) {
	const navigate = useNavigate();
	const [selectedEngineerId, setSelectedEngineerId] = useState('');

	if (!request) {
		return (
			<div className="bg-white border border-zinc-200 rounded-3xl p-8 text-center space-y-4">
				<p className="text-zinc-555 text-sm font-medium">Request record not found in system.</p>
				<button onClick={() => navigate('/manager/approved-requests')} className="px-4 py-2 bg-[#11236a] text-white text-xs font-bold rounded-xl hover:bg-[#0c1a52] transition-all cursor-pointer border-none outline-none">
					Back to List
				</button>
			</div>
		);
	}

	// Fetch current logged-in manager info
	const userStr = localStorage.getItem('user');
	const currentUser = userStr ? JSON.parse(userStr) : null;
	const managerId = currentUser ? String(currentUser.id) : '4'; // Falls back to default manager ID '4' from NABL DB
	const managerName = currentUser ? currentUser.name : 'Lab Manager One';

	const activeEngineers = engineers || [];

	// Build dropdown options containing ONLY dynamic database staff and "Self" option
	const selectOptions = [
		...activeEngineers
			.filter(eng => String(eng.id) !== managerId) // Avoid listing manager twice
			.map(eng => ({
				value: String(eng.id),
				label: `${eng.name} (${eng.role})`
			})),
		{
			value: managerId,
			label: `${managerName} (Self Assignment)`
		}
	];

	const handleAssignSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedEngineerId) return;
		const option = selectOptions.find(opt => opt.value === selectedEngineerId);
		if (option) {
			onAssignEngineer(request.id, option.value, option.label);
		}
	};

	const isAllocated = !!request.engineerId;
	const isCompleted = !!request.inspectionResult || request.status === 'COMPLETED';

	return (
		<div className="space-y-6">
			{/* Back bar */}
			<div className="flex items-center gap-3">
				<button 
					onClick={() => navigate('/manager/approved-requests')}
					className="w-9 h-9 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-555 hover:text-zinc-800 hover:shadow-sm transition-all cursor-pointer outline-none"
				>
					<ArrowLeft className="w-4 h-4 shrink-0" />
				</button>
				<div>
					<h3 className="text-base font-extrabold text-zinc-900 tracking-tight leading-none">
						{request.requestId || `REQ-${request.id}`} Specifications
					</h3>
					<span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">{request.brandName} • {request.modelNo}</span>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Details Panel */}
				<div className="lg:col-span-2 space-y-6">
					
					{/* Applicant Details */}
					<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm space-y-4">
						<h4 className="text-[10px] font-extrabold text-[#11236a] uppercase tracking-wider border-b border-zinc-100 pb-2">
							Applicant & Manufacturer Profile
						</h4>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
							<div>
								<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Applicant / Customer Details</p>
								<p className="font-bold text-zinc-800 mt-1 whitespace-pre-wrap leading-relaxed">{request.customerNameAddress}</p>
							</div>
							<div>
								<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Contact Details</p>
								<p className="font-bold text-zinc-800 mt-1">{request.customerContactDetails || 'Not Provided'}</p>
							</div>
							<div className="sm:col-span-2 border-t border-zinc-100 pt-3">
								<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Manufacturer Details</p>
								<p className="font-bold text-zinc-800 mt-1 whitespace-pre-wrap leading-relaxed">{request.manufacturerNameAddress || 'Not Provided'}</p>
							</div>
						</div>
					</div>

					{/* Product Specifications */}
					<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm space-y-4">
						<h4 className="text-[10px] font-extrabold text-[#11236a] uppercase tracking-wider border-b border-zinc-100 pb-2">
							Product & Sample Details
						</h4>
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-semibold">
							<div>
								<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Brand Name</p>
								<p className="font-bold text-zinc-800 mt-1">{request.brandName}</p>
							</div>
							<div>
								<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Model No</p>
								<p className="font-bold text-zinc-800 mt-1">{request.modelNo}</p>
							</div>
							<div>
								<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Family Model</p>
								<p className="font-bold text-zinc-800 mt-1">{request.familyModel || 'None'}</p>
							</div>
							<div>
								<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Serial Number</p>
								<p className="font-bold text-zinc-800 mt-1">{request.serialNumber || 'None'}</p>
							</div>
							<div>
								<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Product Rating</p>
								<p className="font-bold text-zinc-800 mt-1">{request.productRating || 'Not Specified'}</p>
							</div>
							<div>
								<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Sample Qty</p>
								<p className="font-bold text-[#11236a] mt-1">{request.sampleQty} pcs</p>
							</div>
						</div>
					</div>

					{/* Test Configuration */}
					<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm space-y-4">
						<h4 className="text-[10px] font-extrabold text-[#11236a] uppercase tracking-wider border-b border-zinc-100 pb-2">
							Test Protocol Configuration
						</h4>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
							<div>
								<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Test Method Ref</p>
								<p className="font-bold text-zinc-800 mt-1 leading-relaxed">{request.testMethodRef}</p>
							</div>
							<div>
								<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Collect Back Scheme</p>
								<p className="font-bold text-zinc-800 mt-1 text-xs">
									{request.collectBack === 'Yes' ? 'Collect back after testing' : 
									 request.collectBack === 'No_Retain' ? 'Retain in archives' : 
									 'Discard / Recycle sample'}
								</p>
							</div>
							<div className="border-t border-zinc-100 pt-3">
								<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Witness Requirement</p>
								<p className="font-bold text-zinc-800 mt-1">{request.witnessRequired || 'No'}</p>
								{request.witnessRequired === 'Yes' && request.witnessPersonDetails && (
									<div className="mt-1.5 p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-[10px] text-zinc-700 font-bold">
										Details: {request.witnessPersonDetails}
									</div>
								)}
							</div>
							<div className="border-t border-zinc-100 pt-3">
								<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Statement of Conformity</p>
								<p className="font-bold text-zinc-800 mt-1">{request.conformityStatement || 'Not Requested'}</p>
								{request.conformityStatement === 'Required' && request.decisionRule && (
									<div className="mt-1.5 p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-[10px] text-zinc-700 font-bold">
										Decision Rule: {request.decisionRule}
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Sample Description */}
					<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm space-y-2">
						<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Detailed Sample Description</p>
						<p className="text-xs text-zinc-800 font-medium leading-relaxed bg-zinc-50 rounded-xl p-3 border border-zinc-200/60">
							{request.sampleDescription}
						</p>
					</div>

					{/* Attachment Mentions */}
					{request.attachmentMention && (
						<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm space-y-2">
							<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Attachments Mentioned / Remarks</p>
							<p className="text-xs text-zinc-800 font-medium leading-relaxed bg-zinc-50 rounded-xl p-3 border border-zinc-200/60">
								{request.attachmentMention}
							</p>
						</div>
					)}

					{/* File Attachments */}
					{request.attachments && request.attachments.length > 0 && (
						<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm space-y-3">
							<h4 className="text-[10px] font-extrabold text-[#11236a] uppercase tracking-wider">
								Submitted Documentation ({request.attachments.length})
							</h4>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{request.attachments.map((file) => (
									<a 
										key={file.id}
										href={`http://127.0.0.1:3001/${(() => {
											const idx = file.filePath.toLowerCase().indexOf('uploads');
											return idx !== -1 ? file.filePath.substring(idx).replace(/\\/g, '/') : file.filePath.replace(/\\/g, '/');
										})()}`}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center justify-between p-3 bg-zinc-50 hover:bg-zinc-100/70 border border-zinc-200 rounded-xl transition-all group cursor-pointer no-underline"
									>
										<div className="flex items-center gap-2.5 min-w-0">
											<FileText className="w-5 h-5 text-indigo-650 shrink-0" />
											<div className="min-w-0">
												<p className="text-xs font-bold text-zinc-800 truncate leading-snug">{file.fileName}</p>
												<p className="text-[9px] text-zinc-400 font-bold">{(file.fileSize / 1024).toFixed(1)} KB</p>
											</div>
										</div>
										<Eye className="w-4 h-4 text-zinc-400 group-hover:text-indigo-600 transition-colors shrink-0" />
									</a>
								))}
							</div>
						</div>
					)}
				</div>				{/* Assignment Actions Panel */}
				<div className="space-y-6">
					{/* Assignment Box */}
					<div className="bg-white border border-zinc-200/60 rounded-3xl p-6 shadow-sm">
						<h4 className="text-sm font-bold text-zinc-950 uppercase tracking-wider border-b border-zinc-100 pb-2 flex items-center gap-1.5">
							<User className="w-4 h-4 text-[#11236a]" /> Engineer Assignment
						</h4>

						{isAllocated ? (
							<div className="mt-4 space-y-4">
								<div className="bg-blue-50 border border-blue-100 text-blue-900 rounded-2xl p-4 text-xs font-semibold">
									<p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider leading-none mb-1">Assigned Inspector/Engineer</p>
									<p className="font-extrabold text-zinc-900">{request.engineerName}</p>
									<span className="inline-block text-[8px] font-bold px-1.5 py-0.5 bg-[#11236a]/10 text-[#11236a] rounded mt-2 uppercase tracking-wide">
										ID: {request.engineerId}
									</span>
								</div>
								{!isCompleted && (
									<p className="text-[10px] text-zinc-555 leading-relaxed italic">
										Inspection currently active in testing bay. Awaiting calibration logs.
									</p>
								)}
							</div>
						) : (
							<form onSubmit={handleAssignSubmit} className="mt-4 space-y-4">
								<div className="space-y-2">
									<label className="text-[10px] text-zinc-555 font-bold uppercase tracking-wider block">Select Duty Engineer</label>
									<CustomSelect 
										value={selectedEngineerId}
										onChange={setSelectedEngineerId}
										options={selectOptions}
										placeholder="-- Select Specialist --"
									/>
								</div>
								<button 
									type="submit"
									className="w-full bg-[#11236a] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-[#0c1a52] transition-all border-none outline-none cursor-pointer active:scale-[0.98]"
								>
									Allocate Inspection Plan
								</button>
							</form>
						)}
					</div>

					{/* Individual Sample Inspection Results */}
					<div className="bg-white border border-zinc-200/60 rounded-3xl p-6 shadow-sm space-y-4">
						<h4 className="text-sm font-bold text-zinc-955 uppercase tracking-wider border-b border-zinc-100 pb-2 flex items-center justify-between">
							<span>Sample Results</span>
							<span className="text-xs font-bold text-zinc-400">Total: {request.sampleQty || 1}</span>
						</h4>
						
						<div className="divide-y divide-zinc-150/70">
							{(() => {
								const cachedManager = localStorage.getItem('dixon_sample_inspections');
								const cachedEngineer = localStorage.getItem('dixon_engineer_sample_inspections');
								const cachedCompleted = localStorage.getItem('dixon_completed_sample_inspections');
								
								const managerReports = cachedManager ? JSON.parse(cachedManager) : {};
								const engineerReports = cachedEngineer ? JSON.parse(cachedEngineer) : {};
								const completedReports = cachedCompleted ? JSON.parse(cachedCompleted) : {};
								
								const merged = { ...engineerReports, ...managerReports, ...completedReports };
								const qty = request.sampleQty || 1;
								const list = [];
								
								for (let i = 0; i < qty; i++) {
									const cacheKey = `${request.id}-sample-${i}`;
									list.push({
										index: i,
										report: merged[cacheKey]
									});
								}
								
								return list.map(({ index, report }) => {
									const sampleNumber = index + 1;
									if (!report) {
										return (
											<div key={index} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
												<div className="flex items-center gap-3">
													<div className="w-2.5 h-2.5 rounded-full bg-zinc-300 shrink-0" />
													<div>
														<p className="text-xs font-bold text-zinc-800">Sample #{sampleNumber}</p>
														<p className="text-[10px] text-zinc-400 font-bold uppercase mt-0.5">Awaiting Inspection</p>
													</div>
												</div>
												<span className="text-[9px] font-extrabold px-2 py-0.5 bg-zinc-100 text-zinc-450 rounded uppercase tracking-wider">
													Pending
												</span>
											</div>
										);
									}

									return (
										<div key={index} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
											<div className="flex items-center gap-3">
												<div className={`w-2.5 h-2.5 rounded-full shrink-0 ${report.status === 'PASSED' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
												<div>
													<p className="text-xs font-bold text-zinc-900">
														Sample #{sampleNumber}
													</p>
													<p className="text-[10px] text-zinc-400 font-bold uppercase mt-0.5">
														ID: <span className="text-zinc-650 font-semibold">{report.allottedId}</span>
													</p>
												</div>
											</div>
											<span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
												report.status === 'PASSED' 
													? 'bg-emerald-50 border border-emerald-100 text-emerald-700' 
													: 'bg-rose-50 border border-rose-100 text-rose-700'
											}`}>
												{report.status}
											</span>
										</div>
									);
								});
							})()}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
