import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, FileText, Download, Eye } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';

import { getNablRequestDetails } from '../../services/operations/nablRequestService';

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
	testMethodRef: string;
	conformityStatement: string;
	decisionRule?: string | null;
	collectBack: string;
	reportNablLogo?: string | null;
	customerSignName?: string | null;
	status: string;
	createdAt: string;
	attachments?: { id: number; fileName: string; filePath: string; fileSize: number }[];
	testType?: { id: number; name: string } | null;
}

export default function NablRequestReport() {
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
					console.error('Failed to load NABL request details:', error);
				} finally {
					setLoading(false);
				}
			})();
		}
	}, [id, token]);

	const getStatusBadge = (status: string) => {
		const statusMap: Record<string, { bg: string; text: string; label: string }> = {
			'Pending': { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending' },
			'In Progress': { bg: 'bg-blue-50', text: 'text-blue-700', label: 'In Progress' },
			'Completed': { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Completed' },
			'Rejected': { bg: 'bg-rose-50', text: 'text-rose-700', label: 'Rejected' },
		};
		const s = statusMap[status] || { bg: 'bg-zinc-50', text: 'text-zinc-600', label: status || 'Unknown' };
		return (
			<span className={`inline-flex items-center whitespace-nowrap px-3 py-1 rounded-full text-[10px] font-bold ${s.bg} ${s.text} border border-current/10`}>
				{s.label}
			</span>
		);
	};


	if (loading) {
		return (
			<DashboardLayout title="NABL Request Report">
				<div className="flex flex-col items-center justify-center py-32 gap-3">
					<div className="w-10 h-10 border-4 border-[#11236a] border-t-transparent rounded-full animate-spin" />
					<p className="text-zinc-500 font-bold text-xs">Loading report...</p>
				</div>
			</DashboardLayout>
		);
	}

	if (!request) {
		return (
			<DashboardLayout title="NABL Request Report">
				<div className="flex flex-col items-center justify-center py-32 gap-3">
					<FileText className="w-10 h-10 text-zinc-350" />
					<p className="text-zinc-500 font-bold text-xs">Request not found.</p>
					<button
						onClick={() => navigate('/nabl-manager/requests')}
						className="mt-2 px-4 py-2 bg-[#11236a] text-white text-xs font-bold rounded-xl cursor-pointer outline-none border-none"
					>
						Back to Requests
					</button>
				</div>
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout title="NABL Request Report">
			<div className="space-y-6 animate-fade-in">
				<div className="flex items-center justify-between">
					<button
						onClick={() => navigate('/nabl-manager/requests')}
						className="text-xs font-bold text-zinc-700 hover:text-zinc-955 flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none transition-colors"
					>
						<ChevronLeft className="w-4 h-4" /> Back to Requests Registry
					</button>
					<div className="flex items-center gap-3">
						{getStatusBadge(request.status || '')}
						<span className="text-[10px] text-zinc-400 font-medium">
							Created: {request.createdAt ? request.createdAt.split('T')[0] : 'N/A'}
						</span>
					</div>
				</div>
				<div className="bg-white border border-zinc-300 rounded-[32px] shadow-md p-6 max-w-4xl mx-auto space-y-6">
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

							<div className="col-span-6 p-6 flex flex-col justify-center items-center text-center bg-white font-extrabold text-[#121c60] leading-tight select-none">
								<span className="text-sm uppercase tracking-wider font-extrabold">PERFORMANCE & SAFETY LAB,</span>
								<span className="text-sm uppercase tracking-wider mt-1 font-extrabold">DIXON TECHNOLOGIES (INDIA) LIMITED</span>
							</div>
						</div>

						<div className="bg-[#11236a] text-center py-2 text-white font-extrabold tracking-widest uppercase text-[10px] border-t border-zinc-400">
							TEST REQUEST FORM — REPORT VIEW
						</div>
					</div>
					<div className="border border-zinc-400 rounded-lg overflow-hidden text-xs bg-white divide-y divide-zinc-400">
						<div className="grid grid-cols-12">
							<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
								Name and Address of Customer / Applicant
							</div>
							<div className="col-span-8 p-3 font-bold text-zinc-900 whitespace-pre-wrap leading-relaxed">
								{request.customerNameAddress}
							</div>
						</div>
						<div className="grid grid-cols-12">
							<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
								Manufacturer Name and address
							</div>
							<div className="col-span-8 p-3 font-bold text-zinc-900 whitespace-pre-wrap leading-relaxed">
								{request.manufacturerNameAddress}
							</div>
						</div>
						<div className="grid grid-cols-12">
							<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
								Contact Details of Customer / Applicant
							</div>
							<div className="col-span-8 p-3 font-bold text-zinc-900 whitespace-pre-wrap leading-relaxed">
								{request.customerContactDetails}
							</div>
						</div>
						<div className="grid grid-cols-12">
							<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
								Sample Description
							</div>
							<div className="col-span-8 p-3 font-bold text-zinc-900 whitespace-pre-wrap leading-relaxed">
								{request.sampleDescription}
							</div>
						</div>
						<div className="grid grid-cols-12">
							<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
								Model No. / Identification
							</div>
							<div className="col-span-8 p-3 font-bold text-zinc-900">
								{request.modelNo}
							</div>
						</div>
						<div className="grid grid-cols-12">
							<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
								Family Model (If Any)
							</div>
							<div className="col-span-8 p-3 font-bold text-zinc-900">
								{request.familyModel || 'NA'}
							</div>
						</div>
						<div className="grid grid-cols-12">
							<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
								Product Serial Number (If any)
							</div>
							<div className="col-span-8 p-3 font-bold text-zinc-900">
								{request.serialNumber || 'NA'}
							</div>
						</div>
						<div className="grid grid-cols-12">
							<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
								Product Rating
							</div>
							<div className="col-span-8 p-3 font-bold text-zinc-900 whitespace-pre-wrap leading-relaxed">
								{request.productRating}
							</div>
						</div>
						<div className="grid grid-cols-12">
							<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
								Sample Qty.
							</div>
							<div className="col-span-8 p-3 font-bold text-zinc-900">
								{request.sampleQty}
							</div>
						</div>
						<div className="grid grid-cols-12">
							<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
								Trade Mark / Brand
							</div>
							<div className="col-span-8 p-3 font-bold text-zinc-900">
								{request.brandName}
							</div>
						</div>
						<div className="grid grid-cols-12">
							<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
								Drawing / Specification /any attachment (Please mention)
							</div>
							<div className="col-span-8 p-3 font-bold text-zinc-900">
								{request.attachmentMention || 'NA'}
							</div>
						</div>
						<div className="grid grid-cols-12">
							<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
								Witness Required
							</div>
							<div className="col-span-8 p-3 bg-white flex items-center gap-6">
								<div className="flex items-center gap-2 font-bold">
									<span className={`w-3.5 h-3.5 border border-zinc-550 flex items-center justify-center font-black ${request.witnessRequired === 'Yes' ? 'bg-[#11236a] text-white text-[8px]' : ''}`}>
										{request.witnessRequired === 'Yes' && '✓'}
									</span>
									Yes
								</div>
								<div className="flex items-center gap-2 font-bold">
									<span className={`w-3.5 h-3.5 border border-zinc-550 flex items-center justify-center font-black ${request.witnessRequired === 'No' ? 'bg-[#11236a] text-white text-[8px]' : ''}`}>
										{request.witnessRequired === 'No' && '✓'}
									</span>
									No
								</div>
							</div>
						</div>
						<div className="grid grid-cols-12">
							<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
								Name and designation of person who will witness the test
							</div>
							<div className="col-span-8 p-3 font-bold text-zinc-900">
								{request.witnessRequired === 'Yes' ? request.witnessPersonDetails : 'NA'}
							</div>
						</div>
						<div className="grid grid-cols-12">
							<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
								Ref. Test Method/ Specification's
							</div>
							<div className="col-span-8 p-3 font-bold text-zinc-900 leading-relaxed">
								{request.testMethodRef}
							</div>
						</div>
						<div className="grid grid-cols-12">
							<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
								Statement of conformity:
							</div>
							<div className="col-span-8 p-3 space-y-2">
								<div className="flex items-center gap-6">
									<div className="flex items-center gap-2 font-bold">
										<span className={`w-3.5 h-3.5 border border-zinc-550 flex items-center justify-center font-black ${request.conformityStatement === 'Required' ? 'bg-[#11236a] text-white text-[8px]' : ''}`}>
											{request.conformityStatement === 'Required' && '✓'}
										</span>
										Required
									</div>
									<div className="flex items-center gap-2 font-bold">
										<span className={`w-3.5 h-3.5 border border-zinc-550 flex items-center justify-center font-black ${request.conformityStatement === 'not Required' ? 'bg-[#11236a] text-white text-[8px]' : ''}`}>
											{request.conformityStatement === 'not Required' && '✓'}
										</span>
										Not-Required
									</div>
								</div>

								{request.conformityStatement === 'Required' && (
									<div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 space-y-1.5 font-bold">
										<p className="text-[10px] text-zinc-450 uppercase">Decision Rule choice:</p>
										<div className="text-zinc-900 leading-relaxed text-[11px]">
											{request.decisionRule === 'Measurement of uncertainty' && '(A) Measurement of uncertainty'}
											{request.decisionRule === 'As per standard' && '(B) As per standard'}
											{request.decisionRule === 'As per customer specification, if better than standards' && '(C) As per customer specification, if better than standards'}
										</div>
									</div>
								)}
							</div>
						</div>
						<div className="grid grid-cols-12">
							<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
								Report Required with NABL symbol
							</div>
							<div className="col-span-8 p-3 bg-white flex items-center gap-6">
								<div className="flex items-center gap-2 font-bold">
									<span className={`w-3.5 h-3.5 border border-zinc-550 flex items-center justify-center font-black ${(request.reportNablLogo || 'Yes') === 'Yes' ? 'bg-[#11236a] text-white text-[8px]' : ''}`}>
										{(request.reportNablLogo || 'Yes') === 'Yes' && '✓'}
									</span>
									Yes
								</div>
								<div className="flex items-center gap-2 font-bold">
									<span className={`w-3.5 h-3.5 border border-zinc-550 flex items-center justify-center font-black ${request.reportNablLogo === 'No' ? 'bg-[#11236a] text-white text-[8px]' : ''}`}>
										{request.reportNablLogo === 'No' && '✓'}
									</span>
									No
								</div>
							</div>
						</div>
						<div className="grid grid-cols-12">
							<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
								Whether sample will be collected back (not applicable for destructive test)
							</div>
							<div className="col-span-8 p-3 space-y-2">
								<div className="flex items-center gap-6">
									<div className="flex items-center gap-2 font-bold">
										<span className={`w-3.5 h-3.5 border border-zinc-550 flex items-center justify-center font-black ${request.collectBack === 'Yes' ? 'bg-[#11236a] text-white text-[8px]' : ''}`}>
											{request.collectBack === 'Yes' && '✓'}
										</span>
										Yes
									</div>
									<div className="flex items-center gap-2 font-bold">
										<span className={`w-3.5 h-3.5 border border-zinc-550 flex items-center justify-center font-black ${request.collectBack === 'No' ? 'bg-[#11236a] text-white text-[8px]' : ''}`}>
											{request.collectBack === 'No' && '✓'}
										</span>
										No
									</div>
								</div>
								<p className="text-[10px] text-zinc-500 font-bold leading-normal">
									If yes, please collect within 15 days from the date of issuing the test report. After this period, the sample will be destroyed.
								</p>
							</div>
						</div>
						<div className="grid grid-cols-12">
							<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
								Customer Name:
							</div>
							<div className="col-span-8 p-3 bg-white flex justify-between items-center">
								<span className="font-extrabold text-[#11236a] italic text-xs tracking-wide">
									{request.customerSignName || '—'}
								</span>
							</div>
						</div>
					</div>
					{request.attachments && request.attachments.length > 0 && (
						<div className="space-y-4 pt-4 border-t border-zinc-200">
							<h4 className="text-xs font-extrabold text-[#11236a] uppercase tracking-wider">
								Specifications & Manuals Attachments ({request.attachments.length})
							</h4>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{request.attachments.map((att) => {
									const ext = att.fileName.split('.').pop()?.toLowerCase() || '';
									const viewableExts = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'txt', 'html'];
									const isViewable = viewableExts.includes(ext);

									const cleanPath = att.filePath.replace(/\\/g, '/');
									const relativePath = cleanPath.includes('uploads')
										? cleanPath.substring(cleanPath.indexOf('uploads'))
										: cleanPath;
									const fileUrl = `/${relativePath}`;

									const handleClick = () => {
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
										<div
											key={att.id}
											onClick={handleClick}
											className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 shadow-sm cursor-pointer hover:bg-zinc-100 hover:border-indigo-300 transition-all group"
										>
											<FileText className="w-5 h-5 text-[#11236a] group-hover:text-indigo-650 shrink-0 transition-colors" />
											<div className="overflow-hidden flex-1">
												<p className="text-xs font-bold text-zinc-955 truncate leading-none mb-1 group-hover:underline group-hover:text-indigo-650 transition-colors">{att.fileName}</p>
												<span className="text-[10px] text-zinc-555 font-semibold">
													Size: {(att.fileSize / 1024).toFixed(1)} KB · {isViewable ? 'Click to view' : 'Click to download'}
												</span>
											</div>
											{isViewable ? (
												<Eye className="w-4 h-4 text-zinc-400 group-hover:text-[#11236a] transition-colors shrink-0" />
											) : (
												<Download className="w-4 h-4 text-zinc-400 group-hover:text-[#11236a] transition-colors shrink-0" />
											)}
										</div>
									);
								})}
							</div>
						</div>
					)}
				</div>
			</div>
		</DashboardLayout>
	);
}