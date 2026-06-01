import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
	CheckCircle, 
	XCircle, 
	ChevronLeft, 
	FileText, 
	AlertTriangle, 
	RefreshCw, 
	Eye 
} from 'lucide-react';
import { getTestRequestDetails, updateTestRequestStatus } from '../../services/operations/testRequestService';
import { toast } from 'react-hot-toast';

interface AttachmentRecord {
	id: number;
	fileName: string;
	filePath: string;
	fileSize: number;
}

interface RequestRecord {
	id: number;
	requestId: string;
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
	createdAt: string;
	attachments?: AttachmentRecord[];
	sampleInspections?: any[];
}

export default function HeadRequestDetails() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [request, setRequest] = useState<RequestRecord | null>(null);
	const [loading, setLoading] = useState(false);
	
	// Modals and operations state
	const [showApproveModal, setShowApproveModal] = useState(false);
	const [showRejectModal, setShowRejectModal] = useState(false);
	const [remarksText, setRemarksText] = useState('');

	const loadRequestDetails = async () => {
		if (!id) return;
		setLoading(true);
		try {
			const fetchOp = getTestRequestDetails(id);
			const data = await fetchOp();
			setRequest(data);
		} catch (error) {
			console.error('Failed to load request details:', error);
			navigate('/head/sample-tests');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadRequestDetails();
	}, [id]);

	// Handle Approval Submit
	const handleApproveSubmit = async () => {
		if (!request) return;
		try {
			const updateOp = updateTestRequestStatus(request.id, 'UNDER_INSPECTION', remarksText);
			const updated = await updateOp();
			if (updated) {
				await loadRequestDetails();
			}
			setShowApproveModal(false);
			setRemarksText('');
		} catch (error) {
			console.error('Failed to approve request:', error);
		}
	};

	// Handle Rejection Submit
	const handleRejectSubmit = async () => {
		if (!request) return;
		if (!remarksText.trim()) {
			toast.error('Mandatory rejection remarks are required.');
			return;
		}
		try {
			const updateOp = updateTestRequestStatus(request.id, 'REJECTED', remarksText);
			const updated = await updateOp();
			if (updated) {
				await loadRequestDetails();
			}
			setShowRejectModal(false);
			setRemarksText('');
		} catch (error) {
			console.error('Failed to reject request:', error);
		}
	};

	if (loading && !request) {
		return (
			<div className="flex flex-col items-center justify-center py-20 gap-3">
				<RefreshCw className="w-8 h-8 text-[#11236a] animate-spin" />
				<p className="text-xs text-zinc-550 font-bold">Synchronizing request metrics...</p>
			</div>
		);
	}

	if (!request) {
		return (
			<div className="text-center py-16 bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm space-y-4">
				<AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
				<h4 className="text-sm font-bold text-zinc-800">Testing Request Not Found</h4>
				<button 
					onClick={() => navigate('/head/sample-tests')}
					className="px-4 py-2 bg-[#11236a] hover:bg-[#0c1a52] text-white font-bold rounded-xl border-none cursor-pointer text-xs"
				>
					Back to Queue
				</button>
			</div>
		);
	}

	return (
		<div className="space-y-6 text-xs font-semibold">
			
			{/* Top Control Bar */}
			<div className="flex items-center justify-between bg-white border border-zinc-200/50 rounded-2xl px-5 py-3.5 shadow-sm">
				<button 
					onClick={() => navigate('/head/sample-tests')}
					className="flex items-center gap-1.5 text-zinc-700 hover:text-[#11236a] text-xs font-bold bg-transparent border-none cursor-pointer transition-colors"
				>
					<ChevronLeft className="w-4 h-4" /> 
					<span>Back to Queue</span>
				</button>
				
				<div className="flex items-center gap-3">
					<span className="text-[10px] text-zinc-400 font-extrabold uppercase">
						Status:
					</span>
					<span className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${
						request.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
						request.status === 'UNDER_TEST' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
						request.status === 'UNDER_INSPECTION' ? 'bg-amber-50 text-amber-600 border-amber-100' :
						request.status === 'PENDING_APPROVAL' ? 'bg-amber-50/70 text-amber-700 border-amber-200' :
						request.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
						'bg-zinc-50 text-zinc-650 border-zinc-100'
					}`}>
						{request.status === 'COMPLETED' && <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />}
						{request.status === 'UNDER_TEST' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />}
						{request.status === 'UNDER_INSPECTION' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
						{request.status === 'PENDING_APPROVAL' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
						{request.status.replace('_', ' ')}
					</span>
				</div>
			</div>

			{/* Rejection Banner */}
			{request.status === 'REJECTED' && request.remarks && (
				<div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col gap-1.5 shadow-sm">
					<div className="flex items-center gap-2 text-rose-800 font-extrabold text-xs">
						<AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />
						Rejection Remarks from Head of Lab
					</div>
					<p className="text-xs font-semibold text-rose-750 leading-relaxed bg-white/60 rounded-xl p-3 border border-rose-100/50">
						{request.remarks}
					</p>
				</div>
			)}

			{/* Layout split: 2 columns details + 1 column timeline */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				
				{/* Left column: core specifications */}
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
								<p className="font-bold text-zinc-800 mt-1">{request.customerContactDetails}</p>
							</div>
							<div className="sm:col-span-2 border-t border-zinc-100 pt-3">
								<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Manufacturer Details</p>
								<p className="font-bold text-zinc-800 mt-1 whitespace-pre-wrap leading-relaxed">{request.manufacturerNameAddress}</p>
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
								<p className="font-bold text-zinc-800 mt-1">{request.productRating}</p>
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
								<p className="font-bold text-zinc-800 mt-1">
									{request.collectBack === 'Yes' ? 'Collect back after testing' : 
									 request.collectBack === 'No_Retain' ? 'Retain in archives' : 
									 'Discard / Recycle sample'}
								</p>
							</div>
							<div className="border-t border-zinc-100 pt-3">
								<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Witness Requirement</p>
								<p className="font-bold text-zinc-800 mt-1">{request.witnessRequired}</p>
								{request.witnessRequired === 'Yes' && request.witnessPersonDetails && (
									<div className="mt-1.5 p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-[10px] text-zinc-700 font-bold">
										Details: {request.witnessPersonDetails}
									</div>
								)}
							</div>
							<div className="border-t border-zinc-100 pt-3">
								<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Statement of Conformity</p>
								<p className="font-bold text-zinc-800 mt-1">{request.conformityStatement}</p>
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
				</div>

				{/* Right column: Step progression timeline & Actions */}
				<div className="space-y-6">
					
					{/* Action Card (Only displays if status is PENDING_APPROVAL) */}
					{request.status === 'PENDING_APPROVAL' && (
						<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm space-y-4">
							<h4 className="text-[10px] font-extrabold text-zinc-700 uppercase tracking-wider border-b border-zinc-100 pb-2">
								Request Approval Actions
							</h4>
							<p className="text-[11px] text-zinc-550 leading-relaxed font-semibold">
								Review the submitted sample details and documents. You can approve to proceed to the inspection phase or reject for revisions.
							</p>
							<div className="flex flex-col gap-2.5">
								<button
									onClick={() => {
										setShowApproveModal(true);
										setRemarksText('');
									}}
									className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl border border-emerald-600 outline-none cursor-pointer transition-colors active:scale-95 shadow-sm flex items-center justify-center gap-1.5"
								>
									<CheckCircle className="w-4 h-4" /> 
									<span>Approve Sample Plan</span>
								</button>
								<button
									onClick={() => {
										setShowRejectModal(true);
										setRemarksText('');
									}}
									className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold rounded-xl border border-rose-500 outline-none cursor-pointer transition-colors active:scale-95 shadow-sm flex items-center justify-center gap-1.5"
								>
									<XCircle className="w-4 h-4" /> 
									<span>Reject Testing Request</span>
								</button>
							</div>
						</div>
					)}

					{/* Step progression timeline */}
					<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm space-y-5">
						<h4 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2">
							Step Progression
						</h4>
						
						<div className="space-y-5 relative pl-5 border-l border-zinc-200 ml-2 pt-1">
							{(() => {
								const isRejected = request.status === 'REJECTED';
								const steps = [
									{ 
										step: 'Testing Request Submitted', 
										date: new Date(request.createdAt).toLocaleString(), 
										completed: true 
									},
									{ 
										step: 'Approved Testing Request by Head of Lab', 
										date: isRejected 
											? 'Rejected' 
											: (request.status !== 'PENDING_APPROVAL' ? new Date(request.createdAt).toLocaleString() : 'Awaiting approval'), 
										completed: request.status !== 'PENDING_APPROVAL' && !isRejected,
										failed: isRejected
									},
									...(!isRejected ? [
										{ 
											step: 'Sample Checked', 
											date: request.status === 'UNDER_TEST' || request.status === 'COMPLETED' 
												? new Date(request.createdAt).toLocaleString() 
												: (request.status === 'UNDER_INSPECTION' ? 'In inspection phase' : 'Pending verification'), 
											completed: request.status === 'UNDER_TEST' || request.status === 'COMPLETED',
										},
										{ 
											step: 'Test Plan Created', 
											date: request.status === 'COMPLETED' 
												? new Date(request.createdAt).toLocaleString() 
												: 'Awaiting plan', 
											completed: request.status === 'COMPLETED'
										},
										{ 
											step: 'Testing', 
											date: request.status === 'COMPLETED' 
												? new Date(request.createdAt).toLocaleString() 
												: 'Awaiting start', 
											completed: request.status === 'COMPLETED'
										},
										{ 
											step: request.status === 'COMPLETED' ? 'Testing Passed' : 'Testing Failed / Testing Passed', 
											date: request.status === 'COMPLETED' ? new Date(request.createdAt).toLocaleString() : 'Awaiting results', 
											completed: request.status === 'COMPLETED' 
										},
										{ 
											step: 'Report Generation', 
											date: request.status === 'COMPLETED' ? new Date(request.createdAt).toLocaleString() : 'Pending release', 
											completed: request.status === 'COMPLETED' 
										},
										{ 
											step: 'Approved Final Report by Head', 
											date: request.status === 'COMPLETED' ? new Date(request.createdAt).toLocaleString() : 'Pending final sign-off', 
											completed: request.status === 'COMPLETED' 
										}
									] : [])
								];

								const activeIdx = steps.findIndex(s => !s.completed && !s.failed);

								return steps.map((item, idx) => {
									const isActive = idx === activeIdx;
									return (
										<div key={idx} className="relative">
											<div className={`absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full border-2 ${
												item.failed
													? 'bg-rose-500 border-rose-500 animate-pulse'
													: item.completed 
														? 'bg-emerald-500 border-emerald-500' 
														: isActive
															? 'bg-indigo-650 border-indigo-700 ring-4 ring-indigo-100 animate-pulse'
															: 'bg-white border-zinc-300'
											}`} />
											<p className={`text-xs font-bold leading-tight ${
												item.failed 
													? 'text-rose-600' 
													: item.completed 
														? 'text-zinc-900' 
														: isActive 
															? 'text-[#11236a]' 
															: 'text-zinc-500'
											}`}>
												{item.step}
											</p>
											<span className={`text-[10px] font-bold block mt-0.5 ${
												isActive ? 'text-[#11236a]' : 'text-zinc-400'
											}`}>{item.date}</span>
										</div>
									);
								});
							})()}
						</div>
					</div>

					{/* Individual Sample Inspection Results */}
					{(request.status === 'UNDER_TEST' || request.status === 'COMPLETED') && (
						<div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm space-y-4">
							<h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2 flex items-center justify-between">
								<span>Sample Inspection Results</span>
								<span className="text-[10px] font-bold text-zinc-400">Total: {request.sampleQty || 1}</span>
							</h4>
							
							<div className="divide-y divide-zinc-150/70">
								{(() => {
									const qty = request.sampleQty || 1;
									const list = [];
									const dbInspections = request.sampleInspections || [];
									
									for (let i = 0; i < qty; i++) {
										const dbReport = dbInspections.find((r: any) => Number(r.sampleIndex) === i);
										if (dbReport) {
											list.push({
												index: i,
												report: {
													allottedId: dbReport.allottedId,
													status: dbReport.status,
													remarks: dbReport.remarks
												}
											});
										} else {
											const cacheKey = `${request.id}-sample-${i}`;
											const cachedManager = localStorage.getItem('dixon_sample_inspections');
											const cachedEngineer = localStorage.getItem('dixon_engineer_sample_inspections');
											const cachedCompleted = localStorage.getItem('dixon_completed_sample_inspections');
											
											const managerReports = cachedManager ? JSON.parse(cachedManager) : {};
											const engineerReports = cachedEngineer ? JSON.parse(cachedEngineer) : {};
											const completedReports = cachedCompleted ? JSON.parse(cachedCompleted) : {};
											
											const merged = { ...engineerReports, ...managerReports, ...completedReports };
											list.push({
												index: i,
												report: merged[cacheKey]
											});
										}
									}
									
									return list.map(({ index, report }) => {
										const sampleNumber = index + 1;
										if (!report) {
											return (
												<div key={index} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
													<div className="flex items-center gap-3">
														<div className="w-2 h-2 rounded-full bg-zinc-300 shrink-0" />
														<div>
															<p className="text-[11px] font-bold text-zinc-800">Sample #{sampleNumber}</p>
															<p className="text-[9px] text-zinc-400 font-bold uppercase mt-0.5">Awaiting Inspection</p>
														</div>
													</div>
													<span className="text-[8px] font-extrabold px-1.5 py-0.5 bg-zinc-100 text-zinc-450 rounded uppercase tracking-wider">
														Pending
													</span>
												</div>
											);
										}

										return (
											<div key={index} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
												<div className="flex items-center gap-3">
													<div className={`w-2 h-2 rounded-full shrink-0 ${report.status === 'PASSED' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
													<div>
														<p className="text-[11px] font-bold text-zinc-900">
															Sample #{sampleNumber}
														</p>
														<p className="text-[9px] text-zinc-400 font-bold uppercase mt-0.5">
															ID: <span className="text-zinc-650 font-semibold">{report.allottedId}</span>
														</p>
													</div>
												</div>
												<span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
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
					)}

				</div>
			</div>

			{/* ========================================================================= */}
			{/* APPROVAL ACTION MODAL */}
			{/* ========================================================================= */}
			{showApproveModal && (
				<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center animate-fade-in backdrop-blur-xs">
					<div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full mx-4 space-y-4 border border-zinc-200 animate-scale-up">
						<div className="flex items-center gap-2.5 text-emerald-800">
							<CheckCircle className="w-5 h-5 shrink-0" />
							<h3 className="text-sm font-extrabold uppercase tracking-wider">Confirm Request Approval</h3>
						</div>
						
						<p className="text-xs text-zinc-655 font-bold leading-relaxed">
							You are approving request <span className="font-extrabold text-[#11236a]">{request.requestId || `REQ-00${request.id}`}</span> ({request.brandName}). This will transition the sample request to the <span className="font-extrabold text-indigo-700">UNDER_INSPECTION</span> phase.
						</p>

						<div className="space-y-1.5">
							<label className="block text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">
								Optional Approval Remarks
							</label>
							<textarea
								placeholder="Enter any guidance remarks or instructions for the Lab Manager (optional)..."
								value={remarksText}
								onChange={e => setRemarksText(e.target.value)}
								className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs font-bold text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-emerald-600 outline-none min-h-[90px] transition-all resize-none"
							/>
						</div>

						<div className="flex gap-2.5 justify-end">
							<button
								onClick={() => {
									setShowApproveModal(false);
									setRemarksText('');
								}}
								className="px-4 py-2 text-xs font-extrabold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl border border-zinc-200 outline-none cursor-pointer transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleApproveSubmit}
								className="px-4 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl border border-emerald-600 outline-none cursor-pointer transition-colors active:scale-95 shadow-sm"
							>
								Yes, Approve Request
							</button>
						</div>
					</div>
				</div>
			)}

			{/* ========================================================================= */}
			{/* REJECTION ACTION MODAL */}
			{/* ========================================================================= */}
			{showRejectModal && (
				<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center animate-fade-in backdrop-blur-xs">
					<div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full mx-4 space-y-4 border border-zinc-200 animate-scale-up">
						<div className="flex items-center gap-2.5 text-rose-600">
							<AlertTriangle className="w-5 h-5 shrink-0 animate-bounce" />
							<h3 className="text-sm font-extrabold uppercase tracking-wider">Reject Testing Request</h3>
						</div>
						
						<p className="text-xs text-rose-700 font-bold bg-rose-50 border border-rose-100/50 p-3 rounded-xl leading-relaxed">
							Warning: You are rejecting testing request <span className="font-extrabold">{request.requestId || `REQ-00${request.id}`}</span>. Rejection remarks are mandatory and will be displayed directly to the requester.
						</p>

						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<label className="block text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">
									Mandatory Rejection Remarks *
								</label>
								{!remarksText.trim() && (
									<span className="text-[9px] text-rose-500 font-bold uppercase">Required</span>
								)}
							</div>
							<textarea
								placeholder="Please specify details of the mistake, missing documentation, or corrections needed..."
								value={remarksText}
								onChange={e => setRemarksText(e.target.value)}
								className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs font-bold text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-rose-500 outline-none min-h-[100px] transition-all resize-none"
							/>
						</div>

						<div className="flex gap-2.5 justify-end">
							<button
								onClick={() => {
									setShowRejectModal(false);
									setRemarksText('');
								}}
								className="px-4 py-2 text-xs font-extrabold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl border border-zinc-200 outline-none cursor-pointer transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleRejectSubmit}
								disabled={!remarksText.trim()}
								className="px-4 py-2 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-xl border border-rose-600 outline-none cursor-pointer transition-colors active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Reject Request
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
