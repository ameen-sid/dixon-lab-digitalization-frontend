import { useState, useEffect } from 'react';
import { ChevronLeft, Clipboard, CheckCircle, Eye, FileText, XCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface RequestRecord {
	id: string;
	dbId?: number;
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
	createdAt?: string;
	updatedAt?: string;
	telemetry: number[];
	attachments?: { id: number; fileName: string; filePath: string; fileSize: number }[];
	testType?: { id: number; name: string } | null;
}

const formatCompletionDate = (dateString: string | undefined) => {
	if (!dateString) return '';
	const date = new Date(dateString);
	if (isNaN(date.getTime())) return dateString;

	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = date.getFullYear();

	return `${day}-${month}-${year}`;
};

interface RequestTrackingProps {
	selectedRequest: RequestRecord | null;
	setActiveTab: (tab: string) => void;
	onInitiateCapa: (req: RequestRecord) => void;
}

export default function RequestTracking({ selectedRequest, setActiveTab, onInitiateCapa }: RequestTrackingProps) {
	const [realSampleInspections, setRealSampleInspections] = useState<any[]>([]);
	const [realTestPlans, setRealTestPlans] = useState<any[]>([]);
	const [activeTimelineSampleIndex, setActiveTimelineSampleIndex] = useState<number | null>(null);

	const handleDownloadTearDownExcel = async (plan: any, request: any) => {
		try {
			const token = localStorage.getItem('token');
			const dbIdVal = request.dbId || (request.id ? Number(request.id.split('-').pop()) : null);
			if (!dbIdVal) throw new Error('Request ID not found');

			const res = await fetch(`/api/v1/test-requests/${dbIdVal}/test-plans/${plan.id}/tear-down-report`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			if (!res.ok) {
				throw new Error('Failed to generate report');
			}

			const blob = await res.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `Tear_Down_Report_${request.brandName}_${request.modelNo}_Plan_${plan.id}.xlsx`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			window.URL.revokeObjectURL(url);
			toast.success('Tear Down Report downloaded successfully!');
		} catch (err) {
			console.error(err);
			toast.error('Failed to download Tear Down Report.');
		}
	};


	useEffect(() => {
		const fetchDbInspections = async () => {
			const dbIdVal = selectedRequest?.dbId || (selectedRequest?.id ? Number(selectedRequest.id.split('-').pop()) : null);
			if (!dbIdVal || isNaN(dbIdVal)) return;
			try {
				const { getTestRequestDetails } = await import('../../services/operations/testRequestService');
				const data = await getTestRequestDetails(dbIdVal)();
				if (data) {
					if (data.sampleInspections) {
						setRealSampleInspections(data.sampleInspections);
					}
					if (data.testPlans) {
						setRealTestPlans(data.testPlans);
					}
				}
			} catch (err) {
				console.error('Failed to fetch real database inspection results:', err);
			}
		};
		fetchDbInspections();
	}, [selectedRequest?.dbId, selectedRequest?.id, selectedRequest?.status]);

	const reqDbIdVal = selectedRequest?.dbId || (selectedRequest?.id ? Number(selectedRequest.id.split('-').pop()) : null);

	const samplePlans = (() => {
		if (activeTimelineSampleIndex === null) return [];
		return realTestPlans.filter((p: any) => Number(p.sampleIndex) === activeTimelineSampleIndex);
	})();

	const sampleReport = (() => {
		if (activeTimelineSampleIndex === null) return null;
		const dbReport = realSampleInspections.find((r: any) => Number(r.sampleIndex) === activeTimelineSampleIndex);
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
			return {
				allottedId: dbReport.allottedId,
				status: dbReport.status,
				remarks: dbReport.remarks || '',
				checks: checksObj,
				images: imagesArr
			};
		}
		return null;
	})();

	const timelineSteps = (() => {
		if (activeTimelineSampleIndex === null || !selectedRequest) return [];
		const isSampleFailed = sampleReport?.status === 'FAILED';
		const steps = [
			{
				step: 'Testing Request Submitted',
				date: selectedRequest.createdAt || selectedRequest.createdDate ? new Date(selectedRequest.createdAt || selectedRequest.createdDate!).toLocaleDateString() : new Date().toLocaleDateString(),
				completed: true
			},
			{
				step: 'Testing Request Approved',
				date: selectedRequest.updatedAt ? new Date(selectedRequest.updatedAt).toLocaleDateString() : new Date().toLocaleDateString(),
				completed: !['PENDING_APPROVAL', 'REJECTED'].includes(selectedRequest.status)
			},
			{
				step: isSampleFailed
					? `Sample Checked & Failed (ID: ${sampleReport?.allottedId || 'N/A'})`
					: `Sample Checked & Passed (ID: ${sampleReport?.allottedId || 'N/A'})`,
				date: sampleReport ? new Date().toLocaleDateString() : 'Awaiting check',
				completed: !!sampleReport,
				failed: isSampleFailed
			},
			...(!isSampleFailed ? (
				samplePlans.length > 0 
					? samplePlans.flatMap((p: any) => {
						const planName = p.testType?.name || 'General Test';
						const isCompleted = ['PASSED', 'FAILED'].includes((p.evaluationStatus || '').toUpperCase());
						const isTestingPhase = !isCompleted && p.startDate && p.endDate;
						
						return [
							{
								step: `Testing Execution (${planName})`,
								date: isCompleted
									? 'Testing completed successfully'
									: isTestingPhase
										? (new Date() >= new Date(p.startDate) && new Date() <= new Date(p.endDate)
											? `In testing phase (Ends: ${new Date(p.endDate).toLocaleDateString()})`
											: new Date() < new Date(p.startDate)
												? `Scheduled to start: ${new Date(p.startDate).toLocaleDateString()}`
												: `Testing duration ended on ${new Date(p.endDate).toLocaleDateString()}`)
										: 'Awaiting start',
								completed: isCompleted || (p.endDate && new Date() > new Date(p.endDate))
							},
							{
								step: `Evaluation (${planName})`,
								date: p.evaluationStatus
									? `Result: ${p.evaluationStatus} (${p.evaluationRemarks || 'No remarks'})`
									: 'Awaiting checksheet completion and evaluation',
								completed: isCompleted,
								failed: p.evaluationStatus === 'FAILED'
							}
						];
					})
					: [
						{
							step: 'Testing Execution',
							date: 'Awaiting test plan allocation',
							completed: false
						},
						{
							step: 'Evaluation',
							date: 'Awaiting checksheet completion and evaluation',
							completed: false
						}
					]
			) : []),
			{
				step: 'Approved Final Report by Head',
				date: ['COMPLETED', 'FAILED', 'FAIL'].includes(selectedRequest.status) ? new Date().toLocaleDateString() : 'Pending final sign-off',
				completed: ['COMPLETED', 'FAILED', 'FAIL'].includes(selectedRequest.status)
			}
		];
		return steps;
	})();

	const activeIdx = timelineSteps.findIndex(s => !s.completed && !s.failed);

	if (!selectedRequest) {
		return (
			<div className="bg-white border border-zinc-200/50 rounded-3xl p-8 text-center">
				<p className="text-zinc-655 text-xs font-semibold">No request selected for tracking.</p>
				<button
					onClick={() => setActiveTab('my-requests')}
					className="mt-4 px-4 py-2 bg-[#11236a] text-white text-xs font-bold rounded-xl outline-none border-none cursor-pointer hover:bg-[#0c1a52] transition-colors"
				>
					View My Requests
				</button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Back bar */}
			<div className="flex items-center justify-between">
				<button
					onClick={() => setActiveTab('my-requests')}
					className="text-xs font-bold text-zinc-705 hover:text-zinc-955 flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none transition-colors"
				>
					<ChevronLeft className="w-4 h-4" /> Back to Submission Register
				</button>

				<div className="flex items-center gap-2">
					{['COMPLETED', 'FAILED', 'FAIL', 'REJECTED', 'INSPECTION_FAILED'].includes(selectedRequest.status) && (
						<button
							onClick={() => onInitiateCapa(selectedRequest)}
							className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all border-none outline-none cursor-pointer active:scale-95 shadow-sm animate-pulse"
						>
							<Clipboard className="w-4 h-4" /> Initiate CAPA Report
						</button>
					)}
				</div>
			</div>

			{/* Rejection Remarks from Head */}
			{selectedRequest.status === 'REJECTED' && selectedRequest.remarks && (
				<div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 shadow-sm flex flex-col gap-2">
					<div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm">
						<span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
						Rejection Remarks from Head of Lab
					</div>
					<p className="text-xs font-semibold text-rose-750 leading-relaxed bg-white/60 rounded-xl p-3 border border-rose-100/50">
						{selectedRequest.remarks}
					</p>
				</div>
			)}

			{/* Three Column details panel */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left Columns: Core Metadata */}
				<div className="lg:col-span-2 space-y-6">
					{/* Core Specs Card */}
					<div className="bg-white border border-zinc-200/50 rounded-3xl p-5 shadow-sm space-y-6">
						<div className="flex items-center justify-between border-b border-zinc-150 pb-3">
							<div>
								<span className="text-[10px] font-bold text-zinc-650 tracking-wider uppercase">{selectedRequest.id}</span>
								<h3 className="text-base font-extrabold text-zinc-955 mt-0.5 leading-tight">{selectedRequest.brandName} - {selectedRequest.modelNo}</h3>
							</div>
							{(() => {
								const getStatusStyle = (status: string) => {
									switch (status) {
										case 'COMPLETED':
										case 'PASS':
										case 'TESTING_PASSED':
										case 'INSPECTION_COMPLETED':
											return 'bg-emerald-50 text-emerald-600 border-emerald-100';
										case 'FAIL':
										case 'TESTING_FAILED':
										case 'REJECTED':
										case 'FAILED':
										case 'INSPECTION_FAILED':
											return 'bg-rose-50 text-rose-600 border-rose-100';
										case 'PARTIAL':
										case 'TESTING_PARTIAL':
											return 'bg-amber-50 text-amber-600 border-amber-100';
										case 'UNDER_TEST':
										case 'UNDER_TESTING':
											return 'bg-indigo-50 text-indigo-600 border-indigo-100';
										case 'TESTING_COMPLETED':
											return 'bg-blue-50 text-blue-700 border-blue-150';
										case 'UNDER_INSPECTION':
											return 'bg-blue-50 text-blue-600 border-blue-100';
										case 'PENDING_APPROVAL':
											return 'bg-amber-50/70 text-amber-700 border-amber-200';
										default:
											return 'bg-zinc-50 text-zinc-650 border-zinc-100';
									}
								};
								return (
									<span className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusStyle(selectedRequest.status)}`}>
										{['COMPLETED', 'PASS', 'TESTING_PASSED', 'INSPECTION_COMPLETED'].includes(selectedRequest.status) && <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />}
										{['FAIL', 'TESTING_FAILED', 'REJECTED', 'FAILED', 'INSPECTION_FAILED'].includes(selectedRequest.status) && <XCircle className="w-3 h-3 text-rose-600 shrink-0" />}
										{['UNDER_TEST', 'UNDER_TESTING', 'UNDER_INSPECTION', 'PENDING_APPROVAL', 'PARTIAL', 'TESTING_PARTIAL'].includes(selectedRequest.status) && (
											<span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0" />
										)}
										{selectedRequest.status === 'PASS' || selectedRequest.status === 'TESTING_PASSED'
											? 'TESTING PASSED'
											: selectedRequest.status === 'FAIL' || selectedRequest.status === 'TESTING_FAILED' || selectedRequest.status === 'FAILED'
												? 'TESTING FAILED'
												: selectedRequest.status === 'PARTIAL' || selectedRequest.status === 'TESTING_PARTIAL'
													? 'TESTING PARTIAL'
													: selectedRequest.status.replace('_', ' ')}
									</span>
								);
							})()}
						</div>

						{/* Applicant details */}
						<div className="bg-zinc-50/50 border border-zinc-200/50 rounded-2xl p-4 space-y-3">
							<h4 className="text-[10px] font-extrabold text-indigo-955 uppercase tracking-wider">Applicant & Manufacturer Information</h4>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
								<div>
									<p className="text-[9px] text-zinc-600 font-extrabold uppercase">Applicant Name & Address</p>
									<p className="font-bold text-zinc-800 mt-0.5 whitespace-pre-wrap">{selectedRequest.customerNameAddress}</p>
								</div>
								<div>
									<p className="text-[9px] text-zinc-600 font-extrabold uppercase">Contact Details</p>
									<p className="font-bold text-zinc-855 mt-0.5">{selectedRequest.customerContactDetails}</p>
								</div>
								<div className="sm:col-span-2 border-t border-zinc-200/70 pt-2.5">
									<p className="text-[9px] text-zinc-600 font-extrabold uppercase">Manufacturer Name & Address</p>
									<p className="font-bold text-zinc-800 mt-0.5 whitespace-pre-wrap">{selectedRequest.manufacturerNameAddress}</p>
								</div>
							</div>
						</div>

						{/* Product details */}
						<div className="border border-zinc-200/50 rounded-2xl p-4 space-y-3 bg-[#f8fafc]/30">
							<h4 className="text-[10px] font-extrabold text-[#11236a] uppercase tracking-wider">Product Specifications</h4>
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-semibold">
								<div>
									<p className="text-[9px] text-zinc-600 font-extrabold uppercase">Trade Mark / Brand</p>
									<p className="font-bold text-zinc-900 mt-0.5">{selectedRequest.brandName}</p>
								</div>
								<div>
									<p className="text-[9px] text-zinc-600 font-extrabold uppercase">Model Identification</p>
									<p className="font-bold text-zinc-900 mt-0.5">{selectedRequest.modelNo}</p>
								</div>
								<div>
									<p className="text-[9px] text-zinc-600 font-extrabold uppercase">Family Model (if any)</p>
									<p className="font-bold text-zinc-800 mt-0.5">{selectedRequest.familyModel || 'None'}</p>
								</div>
								<div>
									<p className="text-[9px] text-zinc-600 font-extrabold uppercase">Serial Number (if any)</p>
									<p className="font-bold text-zinc-800 mt-0.5">{selectedRequest.serialNumber || 'None'}</p>
								</div>
								<div>
									<p className="text-[9px] text-zinc-600 font-extrabold uppercase">Product Rating</p>
									<p className="font-bold text-zinc-900 mt-0.5">{selectedRequest.productRating}</p>
								</div>
								<div>
									<p className="text-[9px] text-zinc-600 font-extrabold uppercase">Sample Qty</p>
									<p className="font-bold text-zinc-900 mt-0.5">{selectedRequest.sampleQty} Pcs</p>
								</div>
							</div>
						</div>

						{/* NABL Testing Protocols details */}
						<div className="border border-zinc-200/50 rounded-2xl p-4 space-y-3 bg-zinc-50/50">
							<h4 className="text-[10px] font-extrabold text-zinc-700 uppercase tracking-wider">Test Configuration</h4>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
								<div>
									<p className="text-[9px] text-zinc-600 font-extrabold uppercase">Ref. Test Method / Specifications</p>
									<p className="font-bold text-zinc-900 mt-0.5 leading-relaxed">{selectedRequest.testMethodRef}</p>
								</div>
								<div>
									<p className="text-[9px] text-zinc-600 font-extrabold uppercase">Test Type</p>
									<p className="font-bold text-zinc-900 mt-0.5">{selectedRequest.testType?.name || 'N/A'}</p>
								</div>
								<div>
									<p className="text-[9px] text-zinc-600 font-extrabold uppercase">Sample Disposal Scheme</p>
									<p className="font-bold text-zinc-855 mt-0.5">
										{selectedRequest.collectBack === 'Yes' ? 'Collect Back after test' :
											selectedRequest.collectBack === 'No_Retain' ? 'Retain in lab archives' :
												'Discard after testing cycle'}
									</p>
								</div>
								<div className="border-t border-zinc-200 pt-2.5">
									<p className="text-[9px] text-zinc-600 font-extrabold uppercase">Witness Required</p>
									<p className="font-bold text-zinc-900 mt-0.5">{selectedRequest.witnessRequired}</p>
									{selectedRequest.witnessRequired === 'Yes' && selectedRequest.witnessPersonDetails && (
										<p className="text-[10px] text-zinc-650 font-semibold mt-1 bg-white p-2 border border-zinc-150 rounded-lg">
											Witness: <span className="font-bold text-zinc-800">{selectedRequest.witnessPersonDetails}</span>
										</p>
									)}
								</div>
								<div className="border-t border-zinc-200 pt-2.5">
									<p className="text-[9px] text-zinc-600 font-extrabold uppercase">Statement of Conformity</p>
									<p className="font-bold text-zinc-900 mt-0.5">
										{selectedRequest.conformityStatement === 'not Required' ? 'Not Required' : selectedRequest.conformityStatement}
									</p>
									{selectedRequest.conformityStatement === 'Required' && selectedRequest.decisionRule && (
										<p className="text-[10px] text-zinc-655 font-semibold mt-1 bg-white p-2 border border-zinc-150 rounded-lg">
											Decision Rule: <span className="font-bold text-zinc-800">
												{selectedRequest.decisionRule === 'A' ? 'A (Measurement of uncertainty)' :
													selectedRequest.decisionRule === 'B' ? 'B (As per standard)' :
														'C (As per customer specification, if better)'}
											</span>
										</p>
									)}
								</div>
							</div>
						</div>

						{/* Sample Description */}
						<div className="border-t border-zinc-150 pt-4">
							<p className="text-[9px] text-zinc-700 font-extrabold uppercase mb-1">Sample Description</p>
							<p className="text-xs text-zinc-800 font-medium leading-relaxed bg-[#f8fafc] rounded-xl p-3 border border-zinc-200">
								{selectedRequest.sampleDescription}
							</p>
						</div>

						{/* Attachment Mentions */}
						{selectedRequest.attachmentMention && (
							<div className="border-t border-zinc-150 pt-4">
								<p className="text-[9px] text-zinc-700 font-extrabold uppercase mb-1">Attachments Mentioned / Remarks</p>
								<p className="text-xs text-zinc-800 font-medium leading-relaxed bg-[#f8fafc] rounded-xl p-3 border border-zinc-200">
									{selectedRequest.attachmentMention}
								</p>
							</div>
						)}

						{/* File Attachments */}
						{selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
							<div className="border-t border-zinc-150 pt-4">
								<p className="text-[9px] text-zinc-700 font-extrabold uppercase mb-2">Submitted File Attachments</p>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									{selectedRequest.attachments.map((file) => (
										<a
											key={file.id}
											href={`/${(() => {
												const idx = file.filePath.toLowerCase().indexOf('uploads');
												return idx !== -1 ? file.filePath.substring(idx).replace(/\\/g, '/') : file.filePath.replace(/\\/g, '/');
											})()}`}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center justify-between p-3 bg-zinc-50 hover:bg-zinc-100/70 border border-zinc-200 rounded-xl transition-all group cursor-pointer no-underline"
										>
											<div className="flex items-center gap-2.5 min-w-0">
												<FileText className="w-5 h-5 text-indigo-600 shrink-0" />
												<div className="min-w-0">
													<p className="text-xs font-bold text-zinc-800 truncate leading-snug">{file.fileName}</p>
													<p className="text-[9px] text-zinc-500 font-semibold uppercase">{(file.fileSize / 1024).toFixed(1)} KB</p>
												</div>
											</div>
											<Eye className="w-4 h-4 text-zinc-650 group-hover:text-indigo-600 transition-colors shrink-0" />
										</a>
									))}
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Right Column: Telemetry & Flow Charts */}
				<div className="space-y-6">
					{/* Testing Progression Status Timeline */}
					<div className="bg-white border border-zinc-200/50 rounded-3xl p-5 shadow-sm space-y-4">
						<h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Step Progression</h4>
						<div className="space-y-4 relative pl-5 border-l border-zinc-200 ml-2 pt-1">
							{(() => {
								const isRejected = selectedRequest.status === 'REJECTED';
								const isInspectionFailed = selectedRequest.status === 'INSPECTION_FAILED';
								const isRetest = selectedRequest.status === 'RETEST';
								const isFailedStatus = ['FAIL', 'TESTING_FAILED', 'FAILED', 'INSPECTION_FAILED'].includes(selectedRequest.status) || (selectedRequest.status === 'COMPLETED' && selectedRequest.remarks?.toLowerCase().includes('fail'));
								const isFinalFailedStatus = ['FAIL', 'FAILED', 'INSPECTION_FAILED'].includes(selectedRequest.status) || (selectedRequest.status === 'COMPLETED' && selectedRequest.remarks?.toLowerCase().includes('fail'));

								const hasFailedSample = (realSampleInspections || []).some((r: any) => r.status === 'FAILED') ||
									(realTestPlans || []).some((p: any) => p.evaluationStatus === 'FAILED');

								const steps = [
									{
										step: 'Testing Request Submitted',
										date: formatCompletionDate(selectedRequest.createdAt || selectedRequest.createdDate),
										completed: true
									},
									{
										step: 'Approved Testing Request by Head of Lab',
										date: isRejected
											? `Rejected (${formatCompletionDate(selectedRequest.updatedAt || selectedRequest.createdAt || selectedRequest.createdDate)})`
											: (selectedRequest.status !== 'PENDING_APPROVAL'
												? formatCompletionDate(selectedRequest.updatedAt || selectedRequest.createdAt || selectedRequest.createdDate)
												: 'Awaiting approval'),
										completed: ["UNDER_INSPECTION", "INSPECTION_COMPLETED", "UNDER_TESTING", "TESTING_PASSED", "TESTING_FAILED", "TESTING_PARTIAL", "COMPLETED", "REJECTED", "FAILED", "FAIL", "RETEST", "INSPECTION_FAILED", "TESTING_COMPLETED"].includes(selectedRequest.status),
										failed: isRejected
									},
									...(!isRejected ? (
										isInspectionFailed ? [
											{
												step: 'Samples Checked',
												date: formatCompletionDate(selectedRequest.updatedAt || selectedRequest.createdAt || selectedRequest.createdDate),
												completed: true
											},
											{
												step: 'Inspection Failed',
												date: formatCompletionDate(selectedRequest.updatedAt || selectedRequest.createdAt || selectedRequest.createdDate),
												completed: true,
												failed: true
											}
										] : isRetest ? [
											{
												step: 'Samples Checked',
												date: formatCompletionDate(selectedRequest.updatedAt || selectedRequest.createdAt || selectedRequest.createdDate),
												completed: true
											},
											{
												step: 'Test Plan Created',
												date: formatCompletionDate(selectedRequest.updatedAt || selectedRequest.createdAt || selectedRequest.createdDate),
												completed: true
											},
											{
												step: 'Testing',
												date: formatCompletionDate(selectedRequest.updatedAt || selectedRequest.createdAt || selectedRequest.createdDate),
												completed: true
											},
											{
												step: 'Testing Failed',
												date: formatCompletionDate(selectedRequest.updatedAt || selectedRequest.createdAt || selectedRequest.createdDate),
												completed: true,
												failed: true
											},
											{
												step: 'Returned for Retesting',
												date: formatCompletionDate(selectedRequest.updatedAt || selectedRequest.createdAt || selectedRequest.createdDate),
												completed: true
											}
										] : [
											{
												step: 'Samples Checked',
												date: ["INSPECTION_COMPLETED", "UNDER_TESTING", "TESTING_PASSED", "TESTING_FAILED", "TESTING_PARTIAL", "COMPLETED", "REJECTED", "FAILED", "FAIL", "RETEST", "TESTING_COMPLETED"].includes(selectedRequest.status)
													? formatCompletionDate(selectedRequest.updatedAt || selectedRequest.createdAt || selectedRequest.createdDate)
													: (selectedRequest.status === 'UNDER_INSPECTION' ? 'In inspection phase' : 'Pending verification'),
												completed: ["INSPECTION_COMPLETED", "UNDER_TESTING", "TESTING_PASSED", "TESTING_FAILED", "TESTING_PARTIAL", "COMPLETED", "REJECTED", "FAILED", "FAIL", "RETEST", "TESTING_COMPLETED"].includes(selectedRequest.status),
											},
											{
												step: 'Test Plan Created',
												date: ["UNDER_TESTING", "TESTING_PASSED", "TESTING_FAILED", "TESTING_PARTIAL", "COMPLETED", "REJECTED", "FAILED", "FAIL", "TESTING_COMPLETED"].includes(selectedRequest.status)
													? formatCompletionDate(selectedRequest.updatedAt || selectedRequest.createdAt || selectedRequest.createdDate)
													: 'Awaiting plan',
												completed: ["UNDER_TESTING", "TESTING_PASSED", "TESTING_FAILED", "TESTING_PARTIAL", "COMPLETED", "REJECTED", "FAILED", "FAIL", "TESTING_COMPLETED"].includes(selectedRequest.status)
											},
											{
												step: 'Testing',
												date: ["TESTING_PASSED", "TESTING_FAILED", "TESTING_PARTIAL", "COMPLETED", "REJECTED", "FAILED", "FAIL", "TESTING_COMPLETED"].includes(selectedRequest.status)
													? formatCompletionDate(selectedRequest.updatedAt || selectedRequest.createdAt || selectedRequest.createdDate)
													: (selectedRequest.status === 'UNDER_TESTING' ? 'In testing phase' : 'Awaiting start'),
												completed: ["TESTING_PASSED", "TESTING_FAILED", "TESTING_PARTIAL", "COMPLETED", "REJECTED", "FAILED", "FAIL", "TESTING_COMPLETED"].includes(selectedRequest.status)
											},
											{
												step: selectedRequest.status === 'TESTING_COMPLETED'
													? (hasFailedSample ? 'Testing Completed (Failed Samples)' : 'Testing Completed (Passed)')
													: ['TESTING_PASSED', 'PASS'].includes(selectedRequest.status) || (selectedRequest.status === 'COMPLETED' && !selectedRequest.remarks?.toLowerCase().includes('fail') && !selectedRequest.remarks?.toLowerCase().includes('partial'))
														? 'Testing Passed'
														: (['TESTING_FAILED', 'FAILED', 'FAIL'].includes(selectedRequest.status) || (selectedRequest.status === 'COMPLETED' && selectedRequest.remarks?.toLowerCase().includes('fail'))
															? 'Testing Failed'
															: (['TESTING_PARTIAL', 'PARTIAL'].includes(selectedRequest.status) || (selectedRequest.status === 'COMPLETED' && selectedRequest.remarks?.toLowerCase().includes('partial')) ? 'Testing Partial (Passed/Failed)' : 'Testing Failed / Testing Passed')),
												date: ["TESTING_PASSED", "TESTING_FAILED", "TESTING_PARTIAL", "COMPLETED", "REJECTED", "FAILED", "FAIL", "TESTING_COMPLETED"].includes(selectedRequest.status)
													? formatCompletionDate(selectedRequest.updatedAt || selectedRequest.createdAt || selectedRequest.createdDate)
													: 'Awaiting results',
												completed: ["TESTING_PASSED", "TESTING_FAILED", "TESTING_PARTIAL", "COMPLETED", "REJECTED", "FAILED", "FAIL", "TESTING_COMPLETED"].includes(selectedRequest.status),
												failed: isFailedStatus || (selectedRequest.status === 'TESTING_COMPLETED' && hasFailedSample)
											},
											{
												step: 'Report Generation',
												date: ["COMPLETED", "REJECTED", "FAILED", "FAIL"].includes(selectedRequest.status)
													? formatCompletionDate(selectedRequest.updatedAt || selectedRequest.createdAt || selectedRequest.createdDate)
													: 'Pending release',
												completed: ["COMPLETED", "REJECTED", "FAILED", "FAIL"].includes(selectedRequest.status),
												failed: isFinalFailedStatus
											},
											{
												step: 'Approved Final Report',
												date: ["COMPLETED", "REJECTED", "FAILED", "FAIL"].includes(selectedRequest.status)
													? formatCompletionDate(selectedRequest.updatedAt || selectedRequest.createdAt || selectedRequest.createdDate)
													: 'Pending final sign-off',
												completed: ["COMPLETED", "REJECTED", "FAILED", "FAIL"].includes(selectedRequest.status),
												failed: isFinalFailedStatus
											}
										]
									) : [])
								];

								const activeIdx = steps.findIndex(s => !s.completed && !s.failed);

								return steps.map((item, idx) => {
									const isActive = idx === activeIdx;
									return (
										<div key={idx} className="relative">
											<div className={`absolute -left-[25px] top-0.5 w-2.5 h-2.5 rounded-full border-2 ${item.failed
												? 'bg-rose-500 border-rose-500 animate-pulse'
												: item.completed
													? 'bg-emerald-500 border-emerald-500'
													: isActive
														? 'bg-indigo-650 border-indigo-700 ring-4 ring-indigo-100 animate-pulse'
														: 'bg-white border-zinc-300'
												}`} />
											<p className={`text-xs font-bold leading-tight ${item.failed
												? 'text-rose-600'
												: item.completed
													? 'text-zinc-900'
													: isActive
														? 'text-indigo-650'
														: 'text-zinc-500'
												}`}>
												{item.step}
											</p>
											<span className={`text-[10px] font-semibold block mt-0.5 ${isActive ? 'text-indigo-500' : 'text-zinc-400'
												}`}>{item.date}</span>
										</div>
									);
								});
							})()}
						</div>
					</div>

					{/* Individual Sample Inspection Results */}
					{selectedRequest.status !== 'PENDING_APPROVAL' && selectedRequest.status !== 'REJECTED' && (
						<div className="bg-white border border-zinc-200/50 rounded-3xl p-5 shadow-sm space-y-4">
							<h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2 flex items-center justify-between">
								<span>Sample Inspection & Testing Results</span>
								<span className="text-[10px] font-bold text-zinc-400">Total: {selectedRequest.sampleQty || 1}</span>
							</h4>

							<div className="divide-y divide-zinc-150/70">
								{(() => {
									const qty = selectedRequest.sampleQty || 1;
									const list = [];

									for (let i = 0; i < qty; i++) {
										const dbReport = realSampleInspections.find((r: any) => Number(r.sampleIndex) === i);
										list.push({
											index: i,
											report: dbReport ? {
												allottedId: dbReport.allottedId,
												status: dbReport.status,
												remarks: dbReport.remarks
											} : null
										});
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
												<div className="flex items-center gap-2">
													<span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${report.status === 'PASSED'
														? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
														: 'bg-rose-50 border border-rose-100 text-rose-700'
														}`}>
														{report.status}
													</span>
													{report.status === 'PASSED' && (
														<div className="flex flex-col gap-1.5 items-end">
															{(() => {
																const samplePlans = realTestPlans.filter((p: any) => Number(p.sampleIndex) === index);
																if (samplePlans.length === 0) {
																	return <span className="text-[9px] text-zinc-400 italic">No plans allocated</span>;
																}
																return samplePlans.map((p: any) => {
																	const isPlanEvaluated = ['PASSED', 'FAILED'].includes((p.evaluationStatus || '').toUpperCase());
																	return (
																		<div key={p.id} className="flex items-center gap-1.5">
																			<span className="text-[9px] font-bold text-zinc-500">
																				{p.testType?.name || 'General'}:
																			</span>
																			{isPlanEvaluated ? (
																				<div className="flex items-center gap-1.5">
																					<button
																						type="button"
																						onClick={() => window.open(`/reports/preview?type=plan&key=${reqDbIdVal}-plan-${p.id}`, '_blank')}
																						className="text-[9px] font-extrabold text-emerald-600 hover:text-white px-2 py-0.5 rounded border border-emerald-200 bg-white hover:bg-emerald-600 transition-all cursor-pointer outline-none flex items-center gap-0.5"
																					>
																						<FileText className="w-2.5 h-2.5" /> Report
																					</button>
																					{p.testType?.name?.toLowerCase().includes('reliability') && (
																						<button
																							type="button"
																							onClick={() => handleDownloadTearDownExcel(p, selectedRequest)}
																							className="text-[9px] font-extrabold text-emerald-700 hover:text-white px-2 py-0.5 rounded border border-emerald-250 bg-white hover:bg-emerald-600 transition-all cursor-pointer outline-none flex items-center gap-0.5"
																						>
																							<FileText className="w-2.5 h-2.5" /> Tear Down
																						</button>
																					)}
																				</div>
																			) : (
																				<span className="text-[8px] font-extrabold px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded uppercase">
																					Testing
																				</span>
																			)}
																		</div>
																	);
																});
															})()}
															<button
																type="button"
																onClick={() => setActiveTimelineSampleIndex(index)}
																className="text-[9px] font-extrabold text-[#11236a] hover:text-white px-2 py-0.5 rounded border border-[#11236a]/20 bg-white hover:bg-[#11236a] transition-all cursor-pointer outline-none mt-1"
															>
																View Timeline
															</button>
														</div>
													)}
													{report.status === 'FAILED' && selectedRequest.status === 'INSPECTION_FAILED' && !(selectedRequest.remarks || '').includes('Submitted to Head') && (
														<button
															type="button"
															onClick={() => window.open(`/reports/preview?type=sample&key=${reqDbIdVal}-sample-${index}`, '_blank')}
															className="text-[9px] font-extrabold text-emerald-600 hover:text-white px-2 py-0.5 rounded border border-emerald-250 bg-white hover:bg-emerald-600 transition-all cursor-pointer outline-none flex items-center gap-0.5 active:scale-95"
														>
															<FileText className="w-2.5 h-2.5" /> View Report
														</button>
													)}
												</div>
											</div>
										);
									});
								})()}
							</div>
						</div>
					)}

				</div>
			</div>

			{/* Sample Progression Timeline Modal */}
			{activeTimelineSampleIndex !== null && (
				<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
					<div className="bg-white border border-zinc-200 rounded-[28px] max-w-lg w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto animate-scale-up">
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
								<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
									<h3 className="text-xl font-extrabold text-[#11236a] leading-tight">
										Sample #{activeTimelineSampleIndex + 1} Testing Timeline
									</h3>
									<div className="flex flex-wrap gap-2">
										{samplePlans.filter((p: any) => ['PASSED', 'FAILED'].includes((p.evaluationStatus || '').toUpperCase())).map((p: any) => (
											<div key={p.id} className="flex items-center gap-1.5">
												<button
													onClick={() => window.open(`/reports/preview?type=plan&key=${reqDbIdVal}-plan-${p.id}`, '_blank')}
													className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 hover:text-white px-2 py-1.5 rounded-lg border border-emerald-250 bg-white hover:bg-emerald-600 transition-all cursor-pointer outline-none active:scale-95 shadow-sm"
												>
													<FileText className="w-3 h-3" />
													<span>{p.testType?.name || 'Report'}</span>
												</button>
												{p.testType?.name?.toLowerCase().includes('reliability') && (
													<button
														onClick={() => handleDownloadTearDownExcel(p, selectedRequest)}
														className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 hover:text-white px-2 py-1.5 rounded-lg border border-emerald-250 bg-white hover:bg-emerald-600 transition-all cursor-pointer outline-none active:scale-95 shadow-sm"
													>
														<FileText className="w-3 h-3" />
														<span>Tear Down</span>
													</button>
												)}
											</div>
										))}
									</div>
								</div>
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
											<div className={`absolute -left-[30px] top-1 w-3 h-3 rounded-full border-2 ${item.failed
												? 'bg-rose-500 border-rose-500 animate-pulse'
												: item.completed
													? 'bg-emerald-500 border-emerald-500'
													: isActive
														? 'bg-indigo-650 border-indigo-700 ring-4 ring-indigo-100 animate-pulse'
														: 'bg-white border-zinc-300'
												}`} />
											<p className={`text-sm font-extrabold leading-tight ${item.failed
												? 'text-rose-600'
												: item.completed
													? 'text-zinc-900'
													: isActive
														? 'text-[#11236a]'
														: 'text-zinc-555'
												}`}>
												{item.step}
											</p>
											<span className={`text-xs font-bold block mt-1 ${item.failed ? 'text-rose-500' : isActive ? 'text-[#11236a]' : 'text-zinc-400'
												}`}>{item.date}</span>
										</div>
									);
								})}
							</div>


						</div>
					</div>
				</div>
			)}
		</div>
	);
}
