import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle, FileText, ExternalLink, Bookmark, RefreshCw } from 'lucide-react';
import { getTestRequestDetails, updateTestRequestStatus } from '../../services/operations/testRequestService';
import { toast } from 'react-hot-toast';

export default function HeadFailureDetails() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const [request, setRequest] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [processing, setProcessing] = useState(false);

	const loadRequestDetails = async () => {
		if (!id) return;
		setLoading(true);
		try {
			const fetchOp = getTestRequestDetails(id);
			const data = await fetchOp();
			setRequest(data);
		} catch (error) {
			console.error('Failed to load request details:', error);
			toast.error('Failed to retrieve request details.');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadRequestDetails();
	}, [id]);

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center py-24 gap-4">
				<div className="w-12 h-12 border-4 border-[#11236a] border-t-transparent rounded-full animate-spin"></div>
				<p className="text-zinc-655 text-xs font-extrabold">Loading Failure Details...</p>
			</div>
		);
	}

	if (!request) {
		return (
			<div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center max-w-md mx-auto space-y-4">
				<AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
				<h3 className="text-base font-black text-zinc-800">Request Not Found</h3>
				<p className="text-xs text-zinc-555">The requested test report details could not be found or has been removed.</p>
				<button
					onClick={() => navigate('/head/failure-decision')}
					className="px-4 py-2 bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all hover:bg-zinc-900 active:scale-95"
				>
					Return to Failures Board
				</button>
			</div>
		);
	}

	const qty = request.sampleQty || 1;

	// Check if already certified/completed, failed, or returned to testing
	const isActioned = ['completed', 'failed', 'fail', 'retest', 'inspection_failed'].includes((request.status || '').toLowerCase());

	const handleReturnToTesting = async () => {
		if (processing) return;
		setProcessing(true);
		try {
			// Update status in backend
			const op = updateTestRequestStatus(
				request.id,
				'RETEST',
				undefined
			);
			await op();

			// Clear evaluation status in DB for all sample test plans
			for (let idx = 0; idx < qty; idx++) {
				const planObj = (request.testPlans || []).find((p: any) => Number(p.sampleIndex) === idx);
				if (planObj) {
					let platformNosParsed = [];
					if (planObj.platformNos) {
						try {
							platformNosParsed = typeof planObj.platformNos === 'string' ? JSON.parse(planObj.platformNos) : planObj.platformNos;
						} catch (e) {
							platformNosParsed = [];
						}
					}
					await fetch(`/api/v1/test-requests/${request.id}/test-plans`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
						body: JSON.stringify({
							sampleIndex: idx,
							testTypeId: planObj.testTypeId,
							testCategoryId: planObj.testCategoryId,
							testProtocolId: planObj.testProtocolId,
							stationNo: planObj.stationNo,
							platformNos: platformNosParsed,
							equipmentId: planObj.equipmentId,
							numberOfDays: planObj.numberOfDays,
							startDate: planObj.startDate,
							endDate: planObj.endDate,
							remarks: planObj.remarks,
							evaluationStatus: null,
							evaluationRemarks: null
						})
					});
				}
			}

			toast.success('Request returned to testing for Retest successfully!');
			navigate('/head/failure-decision');
		} catch (e) {
			console.error(e);
			toast.error('Failed to update request status.');
		} finally {
			setProcessing(false);
		}
	};

	const handleReturnToRequester = async () => {
		if (processing) return;
		setProcessing(true);
		try {
			const targetStatus = request.status === 'INSPECTION_FAILED'
				? 'INSPECTION_FAILED'
				: request.status === 'INSPECTION_COMPLETED'
					? 'INSPECTION_FAILED'
					: 'FAILED';

			if (request.status !== 'INSPECTION_FAILED') {
				const op = updateTestRequestStatus(
					request.id,
					targetStatus,
					undefined
				);
				await op();
			}
			toast.success('Test request failure approved & returned to requester!');
			navigate('/head/failure-decision');
		} catch (e) {
			console.error(e);
			toast.error('Failed to finalize request failure.');
		} finally {
			setProcessing(false);
		}
	};

	const formatDate = (dateStr: string) => {
		if (!dateStr) return 'N/A';
		const d = new Date(dateStr);
		if (isNaN(d.getTime())) return dateStr;
		const day = String(d.getDate()).padStart(2, '0');
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const year = d.getFullYear();
		return `${day}/${month}/${year}`;
	};

	return (
		<div className="space-y-6">
			{/* Back navigation */}
			<div className="flex items-center justify-between">
				<button
					onClick={() => navigate('/head/failure-decision')}
					className="flex items-center gap-1.5 text-xs font-extrabold text-zinc-600 hover:text-[#11236a] transition-all cursor-pointer border-none bg-transparent outline-none"
				>
					<ArrowLeft className="w-4 h-4" />
					<span>Back to Failure Decision Board</span>
				</button>
			</div>

			{/* Main Grid: Request Summary & Action Panel */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

				{/* Left Columns: Request details & Samples List */}
				<div className="lg:col-span-2 space-y-6">

					{/* Request Details Card */}
					<div className="bg-white border border-zinc-200/60 rounded-2xl p-6 shadow-sm space-y-4">
						<div className="flex items-center justify-between border-b border-zinc-100 pb-3">
							<div className="flex items-center gap-2">
								<Bookmark className="w-4.5 h-4.5 text-[#11236a]" />
								<h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider">
									Request Specifications
								</h3>
							</div>
							<span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${isActioned
								? 'bg-emerald-50 text-emerald-700 border-emerald-100'
								: 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse'
								}`}>
								{request.status === 'RETEST' ? 'RETURNED FOR RETEST' : ['COMPLETED', 'FAILED', 'FAIL', 'INSPECTION_FAILED'].includes(request.status) ? 'FINALIZED & RELEASED' : 'AWAITING FAILURE DECISION'}
							</span>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
							<div>
								<span className="block text-zinc-400 text-[10px] uppercase font-bold">Request ID</span>
								<span className="text-[#11236a] font-extrabold">{request.requestId || `REQ-00${request.id}`}</span>
							</div>
							<div>
								<span className="block text-zinc-400 text-[10px] uppercase font-bold">Customer Name</span>
								<span className="text-zinc-800 font-extrabold">{request.customerNameAddress}</span>
							</div>
							<div>
								<span className="block text-zinc-400 text-[10px] uppercase font-bold">Brand & Model No</span>
								<span className="text-zinc-800 font-extrabold">{request.brandName} ({request.modelNo})</span>
							</div>
							<div>
								<span className="block text-zinc-400 text-[10px] uppercase font-bold">Test Type</span>
								<span className="text-zinc-800 font-extrabold">{request.testType?.name || 'N/A'}</span>
							</div>
							<div>
								<span className="block text-zinc-400 text-[10px] uppercase font-bold">Sample Quantity</span>
								<span className="text-zinc-800 font-extrabold">{request.sampleQty || 1} Samples allotted</span>
							</div>
							<div>
								<span className="block text-zinc-400 text-[10px] uppercase font-bold">Date of Request</span>
								<span className="text-zinc-800 font-extrabold">{formatDate(request.createdAt)}</span>
							</div>
						</div>

						<div className="border-t border-zinc-100 pt-4 flex items-center justify-between">
							<p className="text-[11px] text-zinc-400 font-bold">Need to inspect complete specs, workflow, or timeline history?</p>
							<button
								onClick={() => navigate(`/head/sample-tests/${request.id}`)}
								className="flex items-center gap-1 text-[10px] font-extrabold text-[#11236a] hover:text-white px-3.5 py-2 rounded-xl border border-[#11236a]/20 bg-white hover:bg-[#11236a] transition-all cursor-pointer outline-none"
							>
								<span>View More Details</span>
								<ExternalLink className="w-3 h-3" />
							</button>
						</div>
					</div>

					{/* Samples List */}
					<div className="bg-white border border-zinc-200/60 rounded-2xl p-6 shadow-sm space-y-4">
						<div className="flex items-center justify-between border-b border-zinc-100 pb-3">
							<h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider">
								Individual Samples Reports
							</h3>
							<span className="text-[10px] font-bold text-zinc-400 uppercase">{qty} Samples</span>
						</div>

						<div className="divide-y divide-zinc-100 space-y-4">
							{Array.from({ length: qty }).map((_, idx) => {
								const planObj = (request.testPlans || []).find((p: any) => Number(p.sampleIndex) === idx);
								const inspection = (request.sampleInspections || []).find((si: any) => Number(si.sampleIndex) === idx);

								let statusColor = 'bg-zinc-50 text-zinc-500 border-zinc-200';
								let statusText = 'Pending';
								let resultText = '';

								if (inspection) {
									if (inspection.status === 'FAILED') {
										statusColor = 'bg-rose-50 text-rose-700 border-rose-100';
										statusText = 'FAILED INSPECTION';
										resultText = inspection.remarks || 'Visual verification failed';
									} else if (inspection.status === 'PASSED') {
										if (planObj) {
											if (planObj.evaluationStatus === 'PASSED') {
												statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
												statusText = 'PASSED';
												resultText = planObj.evaluationRemarks || 'Physical test specs complied';
											} else if (planObj.evaluationStatus === 'FAILED') {
												statusColor = 'bg-rose-50 text-rose-700 border-rose-100';
												statusText = 'FAILED';
												resultText = planObj.evaluationRemarks || 'Physical test failed';
											} else {
												statusColor = 'bg-blue-50 text-blue-700 border-blue-100';
												statusText = 'UNDER TESTING';
												resultText = 'Checksheet filled, awaiting manager approval';
											}
										} else {
											statusColor = 'bg-indigo-50 text-indigo-700 border-indigo-100';
											statusText = 'INSPECTION COMPLETED';
											resultText = 'Visual check complied, test plan pending';
										}
									}
								}

								return (
									<div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 first:pt-0">
										<div className="space-y-1">
											<div className="flex items-center gap-2">
												<span className="text-xs font-bold text-zinc-900">Sample #{idx + 1}</span>
												<span className="text-[10px] text-zinc-400 font-bold">({inspection?.allottedId || `S-${idx + 1}`})</span>
												<span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${statusColor}`}>
													{statusText}
												</span>
											</div>
											{resultText && (
												<p className="text-[10px] text-zinc-555 font-bold">
													Result remarks: <span className="text-zinc-700 font-semibold">{resultText}</span>
												</p>
											)}
										</div>

										<button
											onClick={() => window.open(`/reports/preview?type=sample&key=${request.id}-sample-${idx}`, '_blank')}
											className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-600 hover:text-white px-3 py-1.5 rounded-lg border border-emerald-250 bg-white hover:bg-emerald-600 transition-all cursor-pointer outline-none active:scale-95"
										>
											<FileText className="w-3.5 h-3.5" />
											<span>Individual Report</span>
										</button>
									</div>
								);
							})}
						</div>
					</div>
				</div>

				{/* Right Column: Actions Panel */}
				<div className="space-y-6">



					{/* Failure Adjudication Decisions */}
					<div className="bg-white border border-zinc-200/60 rounded-2xl p-6 shadow-sm space-y-4">
						<h3 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-3">
							Adjudication Decisions
						</h3>

						{isActioned ? (
							<div className="space-y-3">
								<div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 flex items-start gap-2.5">
									<CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
									<div>
										<p className="text-xs font-bold text-emerald-800">Decision Signed Off</p>
										<p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
											{request.status === 'RETEST'
												? 'This request was returned to testing for a complete retest.'
												: 'This request was certified as FAILED and returned to requester.'}
										</p>
									</div>
								</div>
								<div className="text-[10px] font-bold text-zinc-400 italic text-center uppercase">
									Status: {request.status}
								</div>
							</div>
						) : (
							<div className="space-y-3.5">
								<p className="text-xs text-zinc-655 font-semibold leading-relaxed">
									{request.status === 'INSPECTION_COMPLETED'
										? 'All samples in this request have failed the inspection phase. Please review the results and return the request to the requester.'
										: 'All samples in this request have failed testing. Please choose one of the options below to adjudicate this failure.'}
								</p>

								{request.status !== 'INSPECTION_COMPLETED' && (
									<button
										onClick={handleReturnToTesting}
										disabled={processing}
										className="w-full py-2.5 bg-[#11236a] hover:bg-[#0c1a52] text-white font-extrabold rounded-xl transition-all cursor-pointer outline-none active:scale-95 shadow-sm flex items-center justify-center gap-2 border-none disabled:opacity-50"
									>
										<RefreshCw className="w-4 h-4 text-white" />
										<span>{processing ? 'Processing...' : 'Return to Testing (Retest)'}</span>
									</button>
								)}

								<button
									onClick={handleReturnToRequester}
									disabled={processing}
									className="w-full py-2.5 bg-rose-600 hover:bg-rose-750 text-white font-extrabold rounded-xl transition-all cursor-pointer outline-none active:scale-95 shadow-sm flex items-center justify-center gap-2 border-none disabled:opacity-50"
								>
									<CheckCircle className="w-4 h-4 text-white" />
									<span>{processing ? 'Processing...' : 'Return to Requester'}</span>
								</button>
							</div>
						)}
					</div>
				</div>

			</div>
		</div>
	);
}
