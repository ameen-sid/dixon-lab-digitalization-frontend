import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, FileText, Eye, X } from 'lucide-react';
import CustomSelect from '../../components/CustomSelect';
import { getTestingEquipments } from '../../services/operations/testingEquipmentService';


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
	remarks?: string | null;
	inspectionDate?: string;
	attachments?: AttachmentRecord[];
	testType?: { id: number; name: string } | null;
	testPlans?: any[];
	sampleInspections?: any[];
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
	const [activeTimelineSampleIndex, setActiveTimelineSampleIndex] = useState<number | null>(null);
	const [equipments, setEquipments] = useState<any[]>([]);

	useEffect(() => {
		let isMounted = true;
		getTestingEquipments({ limit: 100 })()
			.then(data => {
				if (isMounted) {
					setEquipments(data || []);
				}
			})
			.catch(err => {
				console.error('Failed to load equipments:', err);
			});
		return () => {
			isMounted = false;
		};
	}, []);

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

	const sampleKey = activeTimelineSampleIndex !== null ? `${request.id}-sample-${activeTimelineSampleIndex}` : '';

	const testPlan = (() => {
		if (activeTimelineSampleIndex === null) return null;
		return (request.testPlans || []).find((p: any) => Number(p.sampleIndex) === activeTimelineSampleIndex) || null;
	})();

	const equipmentName = (() => {
		if (!testPlan || !testPlan.equipmentId) return 'N/A';
		const eq = equipments.find((e: any) => String(e.id) === String(testPlan.equipmentId));
		return eq ? eq.name : `Equipment #${testPlan.equipmentId}`;
	})();

	const sampleReport = (() => {
		if (!sampleKey) return null;
		const [, sampleIdxStr] = sampleKey.split('-sample-');
		const sampleIdx = parseInt(sampleIdxStr, 10);
		if (request && request.sampleInspections) {
			const insp = request.sampleInspections.find((si: any) => Number(si.sampleIndex) === sampleIdx);
			if (insp) {
				let checksObj = {};
				try {
					checksObj = typeof insp.checks === 'string' ? JSON.parse(insp.checks) : (insp.checks || {});
				} catch (e) {
					checksObj = {};
				}
				let imagesArr = [];
				try {
					imagesArr = typeof insp.images === 'string' ? JSON.parse(insp.images) : (insp.images || []);
				} catch (e) {
					imagesArr = [];
				}
				return {
					allottedId: insp.allottedId,
					remarks: insp.remarks || '',
					status: insp.status,
					checks: checksObj,
					images: imagesArr
				};
			}
		}
		return null;
	})();

	const timelineSteps = (() => {
		if (activeTimelineSampleIndex === null) return [];
		const steps = [
			{
				step: 'Testing Request Submitted',
				date: request.approvedDate ? new Date(request.approvedDate).toLocaleDateString() : new Date().toLocaleDateString(),
				completed: true
			},
			{
				step: 'Testing Request Approved',
				date: request.approvedDate ? new Date(request.approvedDate).toLocaleDateString() : new Date().toLocaleDateString(),
				completed: true
			},
			{
				step: `Sample Checked & Passed (ID: ${sampleReport?.allottedId || 'N/A'})`,
				date: sampleReport ? new Date().toLocaleDateString() : 'Awaiting check',
				completed: !!sampleReport
			},
			{
				step: 'Test Plan Configured',
				date: testPlan
					? `Allotted - Station P${testPlan.stationNo}, Platform Nos: [${testPlan.platformNos.join(', ')}]`
					: 'Awaiting plan',
				completed: !!testPlan
			},
			{
				step: 'Testing execution',
				date: (request.status === 'COMPLETED' || (testPlan && testPlan.evaluationStatus))
					? 'Testing completed successfully'
					: testPlan
						? (new Date() >= new Date(testPlan.startDate) && new Date() <= new Date(testPlan.endDate)
							? `In testing phase (Ends: ${new Date(testPlan.endDate).toLocaleDateString()})`
							: new Date() < new Date(testPlan.startDate)
								? `Scheduled to start: ${new Date(testPlan.startDate).toLocaleDateString()}`
								: `Testing duration ended on ${new Date(testPlan.endDate).toLocaleDateString()}`)
						: 'Awaiting start',
				completed: request.status === 'COMPLETED' || 
						   ['TESTING_COMPLETED', 'TESTING_PASSED', 'TESTING_FAILED', 'TESTING_PARTIAL', 'COMPLETED', 'FAILED', 'FAIL'].includes(request.status) ||
						   !!(testPlan && testPlan.evaluationStatus) ||
						   !!(testPlan && new Date() > new Date(testPlan.endDate))
			},
			{
				step: 'Reliability Evaluation',
				date: testPlan && testPlan.evaluationStatus
					? `Result: ${testPlan.evaluationStatus} (${testPlan.evaluationRemarks || 'No remarks'})`
					: 'Awaiting checksheet completion and evaluation',
				completed: !!(testPlan && testPlan.evaluationStatus)
			},
			{
				step: 'Approved Final Report by Head',
				date: request.status === 'COMPLETED' ? new Date().toLocaleDateString() : 'Pending final sign-off',
				completed: request.status === 'COMPLETED'
			}
		];
		return steps;
	})();

	const activeIdx = timelineSteps.findIndex(s => !s.completed);

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
								<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Test Type</p>
								<p className="font-bold text-[#11236a] mt-1 leading-relaxed">{request.testType?.name || 'N/A'}</p>
							</div>
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
								<p className="font-bold text-zinc-800 mt-1">
									{request.conformityStatement === 'not Required'
										? 'Not Required'
										: request.conformityStatement || 'Not Requested'}
								</p>
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

					{/* Remarks from Head of Lab */}
					{request.remarks && request.remarks.trim() !== '' && (
						<div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-5 shadow-sm space-y-2">
							<p className="text-[9px] text-amber-700 font-extrabold uppercase tracking-wider">Remarks from Head of Lab</p>
							<p className="text-xs text-amber-900 font-bold leading-relaxed bg-white/70 rounded-xl p-3 border border-amber-100/40">
								{request.remarks}
							</p>
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
								const qty = request.sampleQty || 1;
								const list = [];

								for (let i = 0; i < qty; i++) {
									const dbReport = (request.sampleInspections || []).find((si: any) => Number(si.sampleIndex) === i);
									let parsedReport = null;
									if (dbReport) {
										let checksObj = {};
										try {
											checksObj = typeof dbReport.checks === 'string' ? JSON.parse(dbReport.checks) : (dbReport.checks || {});
										} catch (e) {
											checksObj = {};
										}
										let imagesArr = [];
										try {
											imagesArr = typeof dbReport.images === 'string' ? JSON.parse(dbReport.images) : (dbReport.images || []);
										} catch (e) {
											imagesArr = [];
										}
										parsedReport = {
											allottedId: dbReport.allottedId,
											remarks: dbReport.remarks || '',
											status: dbReport.status,
											checks: checksObj,
											images: imagesArr
										};
									}
									list.push({
										index: i,
										report: parsedReport
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
											<div className="flex items-center gap-2">
												<span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${report.status === 'PASSED'
													? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
													: 'bg-rose-50 border border-rose-100 text-rose-700'
													}`}>
													{report.status}
												</span>
												{report.status === 'PASSED' && (
													<button
														type="button"
														onClick={() => setActiveTimelineSampleIndex(index)}
														className="text-[9px] font-extrabold text-[#11236a] hover:text-white px-2 py-0.5 rounded border border-[#11236a]/20 bg-white hover:bg-[#11236a] transition-all cursor-pointer outline-none"
													>
														View More
													</button>
												)}
											</div>
										</div>
									);
								});
							})()}
						</div>
					</div>
				</div>
			</div>			{/* Sample Progression Timeline Modal */}
			{activeTimelineSampleIndex !== null && (
				<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
					<div className="bg-white border border-zinc-200 rounded-[28px] max-w-lg w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto">
						<button
							onClick={() => setActiveTimelineSampleIndex(null)}
							className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center text-slate-555 hover:text-slate-850 cursor-pointer border-none outline-none"
						>
							<X className="w-4 h-4" />
						</button>

						<div className="space-y-5">
							<div>
								<span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
									Telemetry Tracking
								</span>
								<h3 className="text-xl font-extrabold text-[#11236a] mt-2 leading-tight">
									Sample #{activeTimelineSampleIndex + 1} Testing Timeline
								</h3>
								<p className="text-xs font-bold text-zinc-400 uppercase mt-1">
									Allotted ID: <span className="text-zinc-700 font-extrabold">{sampleReport?.allottedId || 'N/A'}</span>
								</p>
							</div>

							{/* Steps progression */}
							<div className="space-y-6 relative pl-6 border-l border-zinc-200 ml-2 pt-1">
								{timelineSteps.map((item, idx) => {
									const isActive = idx === activeIdx;
									return (
										<div key={idx} className="relative">
											<div className={`absolute -left-[30px] top-1 w-3 h-3 rounded-full border-2 ${item.completed
												? 'bg-emerald-500 border-emerald-500'
												: isActive
													? 'bg-indigo-650 border-indigo-700 ring-4 ring-indigo-100 animate-pulse'
													: 'bg-white border-zinc-300'
												}`} />
											<p className={`text-sm font-extrabold leading-tight ${item.completed
												? 'text-zinc-900'
												: isActive
													? 'text-[#11236a]'
													: 'text-zinc-555'
												}`}>
												{item.step}
											</p>
											<span className={`text-xs font-bold block mt-1 ${isActive ? 'text-[#11236a]' : 'text-zinc-400'
												}`}>{item.date}</span>
										</div>
									);
								})}
							</div>

							{/* Plan specifications */}
							{testPlan && (
								<div className="bg-[#f8fafc] border border-zinc-200/50 rounded-2xl p-5 space-y-3 mt-2">
									<p className="text-xs text-zinc-400 font-extrabold uppercase tracking-wider mb-2">Test Plan Configuration</p>
									<div className="grid grid-cols-2 gap-4 text-xs font-medium text-zinc-700">
										<div>
											<span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold mb-0.5">Station / Platforms</span>
											<span className="text-sm font-extrabold text-zinc-800">P{testPlan.stationNo} (Platforms: {testPlan.platformNos.join(', ')})</span>
										</div>
										<div>
											<span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold mb-0.5">Duration (Days)</span>
											<span className="text-sm font-extrabold text-zinc-800">{testPlan.numberOfDays} Days</span>
										</div>
										<div>
											<span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold mb-0.5">Start Date</span>
											<span className="text-sm font-extrabold text-zinc-800">{testPlan.startDate ? new Date(testPlan.startDate).toLocaleDateString() : 'N/A'}</span>
										</div>
										<div>
											<span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold mb-0.5">End Date</span>
											<span className="text-sm font-extrabold text-zinc-800">{testPlan.endDate ? new Date(testPlan.endDate).toLocaleDateString() : 'N/A'}</span>
										</div>
										<div className="col-span-2 border-t border-zinc-150 pt-3 mt-1">
											<span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold mb-0.5">Assigned Equipment</span>
											<span className="text-sm font-extrabold text-zinc-800">{equipmentName}</span>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
