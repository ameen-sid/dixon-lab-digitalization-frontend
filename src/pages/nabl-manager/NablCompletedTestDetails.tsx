import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
ChevronLeft, FileText, Download, Eye, CheckCircle, XCircle, Calendar, UserCheck, Clipboard
} from 'lucide-react';

import DashboardLayout from '../layouts/DashboardLayout';

import { getNablRequestDetails } from '../../services/operations/nablRequestService';

interface Attachment {
	id: number;
	fileName: string;
	filePath: string;
	fileSize: number;
}

interface TestPlan {
	id: number;
	startDate: string | null;
	endDate: string | null;
	issueDate: string | null;
	reportNo: string | null;
	testedBy: string | null;
	reviewedAndApprovedBy: string | null;
	status: string;
	attachments: Attachment[];
}

interface NablRequestData {
	id: number;
	requestId: string | null;
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
	testMethodRef?: string;
	testStandard?: string;
	testType?: { name: string } | null;
	clauseSubClause?: string;
	sampleCondition?: string;
	conformityStatement: string;
	decisionRule?: string | null;
	collectBack?: string;
	collectBackSample?: boolean | string;
	reportNablLogo?: string | null;
	customerSignName?: string | null;
	status: string;
	createdAt: string;
	attachments?: Attachment[];
	testPlan?: TestPlan | null;
}

export default function NablCompletedTestDetails() {
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();

	const token = localStorage.getItem('token');
	const userStr = localStorage.getItem('user');

	useEffect(() => {
		if (!token || !userStr) {
			localStorage.clear();
			navigate('/');
			return;
		}
		const user = JSON.parse(userStr);
		const role = user.role ? user.role.toLowerCase() : 'requester';
		if (role !== 'nabl manager') {
			navigate('/dashboard', { replace: true });
		}
	}, [token, userStr, navigate]);

	const [request, setRequest] = useState<NablRequestData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (id && token) {
			(async () => {
				setLoading(true);
				try {
					const data = await getNablRequestDetails(id)();
					setRequest(data);
				} catch (error) {
					console.error('Failed to load completed test details:', error);
				} finally {
					setLoading(false);
				}
			})();
		}
	}, [id, token]);

	if (loading) {
		return (
			<DashboardLayout title="Completed Test Details">
				<div className="flex flex-col items-center justify-center py-32 gap-3">
					<div className="w-10 h-10 border-4 border-[#11236a] border-t-transparent rounded-full animate-spin" />
					<p className="text-zinc-500 font-bold text-xs">Loading completed test details...</p>
				</div>
			</DashboardLayout>
		);
	}

	if (!request) {
		return (
			<DashboardLayout title="Completed Test Details">
				<div className="flex flex-col items-center justify-center py-32 gap-3">
					<FileText className="w-10 h-10 text-zinc-350" />
					<p className="text-zinc-500 font-bold text-xs">Completed test record not found.</p>
					<button
						onClick={() => navigate('/nabl-manager/completed-tests')}
						className="mt-2 px-4 py-2 bg-[#11236a] text-white text-xs font-bold rounded-xl cursor-pointer outline-none border-none"
					>
						Back to Completed Tests
					</button>
				</div>
			</DashboardLayout>
		);
	}

	const isFail = ['FAILED', 'FAIL'].includes((request.testPlan?.status || request.status || '').toUpperCase());

	const handleFileClick = (att: Attachment) => {
		const ext = att.fileName.split('.').pop()?.toLowerCase() || '';
		const viewableExts = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'txt', 'html'];
		const isViewable = viewableExts.includes(ext);

		const cleanPath = att.filePath.replace(/\\/g, '/');
		const relativePath = cleanPath.includes('uploads')
			? cleanPath.substring(cleanPath.indexOf('uploads'))
			: cleanPath;
		const fileUrl = `/${relativePath}`;

		if (isViewable) {
			window.open(fileUrl, '_blank');
		} else {
			const link = document.createElement('a');
			link.href = fileUrl;
			link.download = att.fileName;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	};

	return (
		<DashboardLayout title="Completed Test Details">
			<div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
				<div className="flex items-center justify-between">
					<button 
						onClick={() => navigate('/nabl-manager/completed-tests')}
						className="text-xs font-bold text-zinc-700 hover:text-zinc-955 flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none transition-colors"
					>
						<ChevronLeft className="w-4 h-4" /> Back to Completed Tests Registry
					</button>
					<div className="flex items-center gap-2">
						{isFail ? (
							<span className="px-3.5 py-1.5 bg-rose-50 text-rose-700 rounded-full text-xs font-extrabold border border-rose-200 uppercase tracking-wider flex items-center gap-1.5">
								<XCircle className="w-4 h-4 text-rose-600" /> Evaluation: FAIL
							</span>
						) : (
							<span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-extrabold border border-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
								<CheckCircle className="w-4 h-4 text-emerald-600" /> Evaluation: PASS
							</span>
						)}
					</div>
				</div>
				<div className="bg-white border border-zinc-300 rounded-[32px] shadow-md p-6 space-y-6">
					<h3 className="text-xs font-extrabold text-[#11236a] uppercase tracking-wider flex items-center gap-2 border-b border-zinc-200 pb-3">
						<FileText className="w-4 h-4 text-[#11236a]" /> Completed Test Request Form Details (TRF)
					</h3>
					<div className="border border-zinc-400 rounded-lg overflow-hidden text-xs">
						<div className="grid grid-cols-12">
							<div className="col-span-6 border-r border-zinc-400 p-6 flex flex-col justify-center items-start bg-white">
								<div className="flex flex-col items-start pl-6">
									<span className="text-5xl font-black text-[#121c60] tracking-tight relative leading-none select-none font-sans">
										D<span className="relative inline-block text-5xl">ı<span className="absolute top-[6px] left-[1px] w-[8px] h-[8px] bg-[#df1d24] rounded-none"></span></span>xon
									</span>
									<span className="text-xs font-normal text-[#121c60] tracking-tight mt-1 select-none font-sans">
										The brand behind brands
									</span>
								</div>
							</div>
							<div className="col-span-6 p-4 flex flex-col justify-center text-[#11236a] font-extrabold bg-[#f8fafc]">
								<h2 className="text-base font-black uppercase text-center leading-tight">
									Test Request Form (TRF)
								</h2>
								<p className="text-[11px] text-center text-zinc-600 font-bold mt-1">
									(As per NABL ISO/IEC 17025 Requirement)
								</p>
							</div>
						</div>
						<div className="border-t border-zinc-400 divide-y divide-zinc-400">
							<div className="grid grid-cols-12">
								<div className="col-span-4 border-r border-zinc-400 p-3 font-extrabold text-zinc-800 bg-zinc-50 flex items-center">
									1. Customer Name & Address:
								</div>
								<div className="col-span-8 p-3 bg-white text-zinc-800 font-bold leading-relaxed whitespace-pre-wrap">
									{request.customerNameAddress}
								</div>
							</div>

							<div className="grid grid-cols-12">
								<div className="col-span-4 border-r border-zinc-400 p-3 font-extrabold text-zinc-800 bg-zinc-50 flex items-center">
									2. Manufacturer Name & Address:
								</div>
								<div className="col-span-8 p-3 bg-white text-zinc-800 font-bold leading-relaxed whitespace-pre-wrap">
									{request.manufacturerNameAddress}
								</div>
							</div>

							<div className="grid grid-cols-12">
								<div className="col-span-4 border-r border-zinc-400 p-3 font-extrabold text-zinc-800 bg-zinc-50 flex items-center">
									3. Customer Contact Details:
								</div>
								<div className="col-span-8 p-3 bg-white text-zinc-800 font-bold leading-relaxed whitespace-pre-wrap">
									{request.customerContactDetails}
								</div>
							</div>
							<div className="grid grid-cols-12">
								<div className="col-span-4 border-r border-zinc-400 p-3 font-extrabold text-zinc-800 bg-zinc-50 flex items-center">
									4. Sample Description:
								</div>
								<div className="col-span-8 p-3 bg-white text-zinc-800 font-bold leading-relaxed whitespace-pre-wrap">
									{request.sampleDescription}
								</div>
							</div>

							<div className="grid grid-cols-12">
								<div className="col-span-4 border-r border-zinc-400 p-3 font-extrabold text-zinc-800 bg-zinc-50 flex items-center">
									5. Brand Name:
								</div>
								<div className="col-span-8 p-3 bg-white text-zinc-800 font-extrabold text-[#11236a] break-words whitespace-pre-wrap">
									{request.brandName}
								</div>
							</div>

							<div className="grid grid-cols-12">
								<div className="col-span-4 border-r border-zinc-400 p-3 font-extrabold text-zinc-800 bg-zinc-50 flex items-center">
									6. Model Number:
								</div>
								<div className="col-span-8 p-3 bg-white text-zinc-800 font-extrabold break-words whitespace-pre-wrap">
									{request.modelNo}
								</div>
							</div>

							{request.familyModel && (
								<div className="grid grid-cols-12">
									<div className="col-span-4 border-r border-zinc-400 p-3 font-extrabold text-zinc-800 bg-zinc-50 flex items-center">
										7. Family / Series Model:
									</div>
									<div className="col-span-8 p-3 bg-white text-zinc-800 font-semibold break-words whitespace-pre-wrap">
										{request.familyModel}
									</div>
								</div>
							)}

							{request.serialNumber && (
								<div className="grid grid-cols-12">
									<div className="col-span-4 border-r border-zinc-400 p-3 font-extrabold text-zinc-800 bg-zinc-50 flex items-center">
										8. Serial Number / Batch No:
									</div>
									<div className="col-span-8 p-3 bg-white text-zinc-800 font-semibold break-words whitespace-pre-wrap">
										{request.serialNumber}
									</div>
								</div>
							)}

							<div className="grid grid-cols-12">
								<div className="col-span-4 border-r border-zinc-400 p-3 font-extrabold text-zinc-800 bg-zinc-50 flex items-center">
									9. Product Rating:
								</div>
								<div className="col-span-8 p-3 bg-white text-zinc-800 font-bold">
									{request.productRating}
								</div>
							</div>

							<div className="grid grid-cols-12">
								<div className="col-span-4 border-r border-zinc-400 p-3 font-extrabold text-zinc-800 bg-zinc-50 flex items-center">
									10. Sample Quantity:
								</div>
								<div className="col-span-8 p-3 bg-white text-zinc-800 font-extrabold">
									{request.sampleQty}
								</div>
							</div>
							<div className="grid grid-cols-12">
								<div className="col-span-4 border-r border-zinc-400 p-3 font-extrabold text-zinc-800 bg-zinc-50 flex items-center">
									11. Test Standard / Protocol:
								</div>
								<div className="col-span-8 p-3 bg-white text-zinc-800 font-bold">
									{request.testStandard || request.testType?.name || 'N/A'}
								</div>
							</div>

							<div className="grid grid-cols-12">
								<div className="col-span-4 border-r border-zinc-400 p-3 font-extrabold text-zinc-800 bg-zinc-50 flex items-center">
									12. Clause / Sub-Clause:
								</div>
								<div className="col-span-8 p-3 bg-white text-zinc-800 font-semibold">
									{request.clauseSubClause || 'N/A'}
								</div>
							</div>

							<div className="grid grid-cols-12">
								<div className="col-span-4 border-r border-zinc-400 p-3 font-extrabold text-zinc-800 bg-zinc-50 flex items-center">
									13. Sample Condition on Receipt:
								</div>
								<div className="col-span-8 p-3 bg-white text-zinc-800 font-semibold">
									{request.sampleCondition || 'Satisfactory'}
								</div>
							</div>
							<div className="grid grid-cols-12">
								<div className="col-span-4 border-r border-zinc-400 p-3 font-extrabold text-zinc-800 bg-zinc-50 flex items-center">
									14. Witness Required:
								</div>
								<div className="col-span-8 p-3 bg-white text-zinc-800 font-bold">
									{request.witnessRequired ? 'Yes' : 'No'}
								</div>
							</div>

							<div className="grid grid-cols-12">
								<div className="col-span-4 border-r border-zinc-400 p-3 font-extrabold text-zinc-800 bg-zinc-50 flex items-center">
									15. Display NABL Logo on Report:
								</div>
								<div className="col-span-8 p-3 bg-white text-zinc-800 font-bold">
									{request.reportNablLogo ? 'Yes' : 'No'}
								</div>
							</div>

							<div className="grid grid-cols-12">
								<div className="col-span-4 border-r border-zinc-400 p-3 font-extrabold text-zinc-800 bg-zinc-50 flex items-center">
									16. Return / Collect Back Sample:
								</div>
								<div className="col-span-8 p-3 bg-white text-zinc-800 font-bold">
									{request.collectBackSample ? 'Yes' : 'No'}
								</div>
							</div>

							<div className="grid grid-cols-12">
								<div className="col-span-4 border-r border-zinc-400 p-3 font-extrabold text-zinc-800 bg-zinc-50 flex items-center">
									17. Statement of Conformity:
								</div>
								<div className="col-span-8 p-3 bg-white text-zinc-800 font-bold">
									{request.conformityStatement ? 'Required' : 'Not Required'}
								</div>
							</div>

							{request.decisionRule && (
								<div className="grid grid-cols-12">
									<div className="col-span-4 border-r border-zinc-400 p-3 font-extrabold text-zinc-800 bg-zinc-50 flex items-center">
										18. Decision Rule Applied:
									</div>
									<div className="col-span-8 p-3 bg-white text-zinc-800 font-semibold">
										{request.decisionRule}
									</div>
								</div>
							)}
							<div className="grid grid-cols-12">
								<div className="col-span-4 border-r border-zinc-400 p-3 font-extrabold text-zinc-800 bg-zinc-50 flex items-center">
									19. Customer Name & Signature:
								</div>
								<div className="col-span-8 p-3 bg-white flex items-center">
									<span className="font-extrabold text-[#11236a] italic text-xs tracking-wide">
										{request.customerSignName || '—'}
									</span>
								</div>
							</div>
						</div>
					</div>
					<div className="space-y-3 pt-4 border-t border-zinc-200">
						<h4 className="text-xs font-extrabold text-[#11236a] uppercase tracking-wider flex items-center gap-2">
							<FileText className="w-3.5 h-3.5 text-blue-600" /> Request Form Attachments ({request.attachments?.length || 0})
						</h4>

						{request.attachments && request.attachments.length > 0 ? (
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{request.attachments.map((att) => {
									const ext = att.fileName.split('.').pop()?.toLowerCase() || '';
									const isViewable = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'txt', 'html'].includes(ext);

									return (
										<div
											key={`req-${att.id}`}
											onClick={() => handleFileClick(att)}
											className="flex items-center gap-2.5 bg-blue-50/40 border border-blue-200/80 rounded-xl p-3.5 shadow-sm cursor-pointer hover:bg-blue-100/60 hover:border-blue-300 transition-all group"
										>
											<FileText className="w-5 h-5 text-blue-700 group-hover:text-blue-900 shrink-0 transition-colors" />
											<div className="overflow-hidden flex-1">
												<div className="flex items-center gap-1.5 mb-1">
													<span className="text-[9px] bg-blue-200 text-blue-900 font-extrabold px-1.5 py-0.5 rounded uppercase">Request Document</span>
													<p className="text-xs font-bold text-zinc-900 truncate leading-none group-hover:underline group-hover:text-blue-900 transition-colors">{att.fileName}</p>
												</div>
												<span className="text-[10px] text-zinc-555 font-semibold">
													Size: {(att.fileSize / 1024).toFixed(1)} KB · {isViewable ? 'Click to view in new tab' : 'Click to download'}
												</span>
											</div>
											{isViewable ? (
												<Eye className="w-4 h-4 text-blue-600 group-hover:text-blue-900 transition-colors shrink-0" />
											) : (
												<Download className="w-4 h-4 text-blue-600 group-hover:text-blue-900 transition-colors shrink-0" />
											)}
										</div>
									);
								})}
							</div>
						) : (
							<p className="text-xs text-zinc-400 italic">No request form attachments uploaded.</p>
						)}
					</div>
				</div>
				<div className="bg-white border border-zinc-300 rounded-[32px] shadow-md p-6 space-y-6">
					<h3 className="text-xs font-extrabold text-[#11236a] uppercase tracking-wider flex items-center gap-2 border-b border-zinc-200 pb-3">
						<Clipboard className="w-4 h-4 text-[#11236a]" /> Test Plan Execution & Certified Report Summary
					</h3>

					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
						<div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-1">
							<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
								<Calendar className="w-3.5 h-3.5" /> Start Date
							</span>
							<p className="font-extrabold text-zinc-900">
								{request.testPlan?.startDate ? new Date(request.testPlan.startDate).toLocaleDateString() : 'N/A'}
							</p>
						</div>

						<div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-1">
							<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
								<Calendar className="w-3.5 h-3.5" /> End Date
							</span>
							<p className="font-extrabold text-zinc-900">
								{request.testPlan?.endDate ? new Date(request.testPlan.endDate).toLocaleDateString() : 'N/A'}
							</p>
						</div>

						<div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-1">
							<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
								<Calendar className="w-3.5 h-3.5" /> Issue Date
							</span>
							<p className="font-extrabold text-zinc-900">
								{request.testPlan?.issueDate ? new Date(request.testPlan.issueDate).toLocaleDateString() : 'N/A'}
							</p>
						</div>

						<div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-1">
							<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
								<Clipboard className="w-3.5 h-3.5" /> Report Number
							</span>
							<p className="font-extrabold text-[#11236a]">
								{request.testPlan?.reportNo || 'N/A'}
							</p>
						</div>

						<div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-1">
							<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
								<UserCheck className="w-3.5 h-3.5" /> Tested By
							</span>
							<p className="font-extrabold text-zinc-900">
								{request.testPlan?.testedBy || 'N/A'}
							</p>
						</div>

						<div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-1">
							<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
								<UserCheck className="w-3.5 h-3.5" /> Approved By
							</span>
							<p className="font-extrabold text-zinc-900">
								{request.testPlan?.reviewedAndApprovedBy || 'N/A'}
							</p>
						</div>
					</div>
					<div className="space-y-3 pt-4 border-t border-zinc-200">
						<h4 className="text-xs font-extrabold text-[#11236a] uppercase tracking-wider flex items-center gap-2">
							<FileText className="w-3.5 h-3.5 text-emerald-600" /> Test Plan & Report Attachments ({request.testPlan?.attachments?.length || 0})
						</h4>

						{request.testPlan?.attachments && request.testPlan.attachments.length > 0 ? (
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{request.testPlan.attachments.map((att) => {
									const ext = att.fileName.split('.').pop()?.toLowerCase() || '';
									const isViewable = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'txt', 'html'].includes(ext);

									return (
										<div
											key={`plan-${att.id}`}
											onClick={() => handleFileClick(att)}
											className="flex items-center gap-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5 shadow-sm cursor-pointer hover:bg-emerald-100/60 hover:border-emerald-300 transition-all group"
										>
											<FileText className="w-5 h-5 text-emerald-800 group-hover:text-emerald-900 shrink-0 transition-colors" />
											<div className="overflow-hidden flex-1">
												<div className="flex items-center gap-1.5 mb-1">
													<span className="text-[9px] bg-emerald-200 text-emerald-900 font-extrabold px-1.5 py-0.5 rounded uppercase">Test Plan Report</span>
													<p className="text-xs font-bold text-zinc-900 truncate leading-none group-hover:underline group-hover:text-emerald-900 transition-colors">{att.fileName}</p>
												</div>
												<span className="text-[10px] text-zinc-555 font-semibold">
													Size: {(att.fileSize / 1024).toFixed(1)} KB · {isViewable ? 'Click to view in new tab' : 'Click to download'}
												</span>
											</div>
											{isViewable ? (
												<Eye className="w-4 h-4 text-emerald-700 group-hover:text-emerald-900 transition-colors shrink-0" />
											) : (
												<Download className="w-4 h-4 text-emerald-700 group-hover:text-emerald-900 transition-colors shrink-0" />
											)}
										</div>
									);
								})}
							</div>
						) : (
							<p className="text-xs text-zinc-400 italic">No test plan report attachments uploaded.</p>
						)}
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
}