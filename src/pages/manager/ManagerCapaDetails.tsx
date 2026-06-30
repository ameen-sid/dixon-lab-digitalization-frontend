import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Image as ImageIcon, Printer } from 'lucide-react';
import { getCapaById } from '../../services/operations/capaService';
import { getTestRequests } from '../../services/operations/testRequestService';
import toast from 'react-hot-toast';

interface CapaRecord {
	id: string;
	relatedRequest: string;
	productName: string;
	nonConformity: string;
	rootCause: string;
	correctiveAction: string;
	preventiveAction: string;
	targetedDate: string;
	status: string;
	owner: string;
	createdDate: string;
	targetDate?: string;

	// new format fields
	partProduct?: string;
	modelName?: string;
	customerSupplier?: string;
	date?: string;
	result?: string;
	title?: string;
	improvementType?: string;
	partName?: string;
	problem?: string;
	model?: string;
	defectQty?: string;
	venue?: string;
	imageUrl?: string;
	why1?: string;
	why2?: string;
	why3?: string;
	why4?: string;
	undetectedWhy1?: string;
	undetectedWhy2?: string;
	undetectedWhy3?: string;
	tempCountermeasure?: string;
	radicalCountermeasure?: string;
	inspectionControl?: string;
	processControl?: string;
	beforeImprovementImgUrl?: string;
	afterImprovementImgUrl?: string;
	preventionImgUrl?: string;
	remark?: string;
}

export default function ManagerCapaDetails() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [selectedCapa, setSelectedCapa] = useState<CapaRecord | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const loadCapa = async () => {
			if (!id) return;
			setLoading(true);
			try {
				const data = await getCapaById(id)();

				// Validate access permissions based on manager's department
				const userStr = localStorage.getItem('user');
				const currentUser = userStr ? JSON.parse(userStr) : null;
				const isNablDept = currentUser?.department?.name?.toUpperCase() === 'NABL';

				const fetchRequestsOp = getTestRequests();
				const reqs = await fetchRequestsOp();
				const matchedReq = reqs.find((r: any) => String(r.id) === String(data.relatedRequest) || r.requestId === data.relatedRequest);
				if (matchedReq) {
					const isNablRequest = matchedReq.testType?.name === 'NABL Test';
					if (isNablDept && !isNablRequest) {
						toast.error('Access Denied: CAPA details are not accessible by NABL managers.');
						navigate('/manager/capa-management');
						return;
					} else if (!isNablDept && isNablRequest) {
						toast.error('Access Denied: NABL CAPA details are not accessible by this department.');
						navigate('/manager/capa-management');
						return;
					}
				}

				const mapped: CapaRecord = {
					id: data.capaId,
					relatedRequest: data.relatedRequest,
					productName: data.productName,
					nonConformity: data.nonConformity,
					rootCause: data.rootCause,
					correctiveAction: data.correctiveAction,
					preventiveAction: data.preventiveAction,
					targetedDate: data.targetedDate,
					status: data.status === 'Done' ? 'COMPLETED' : (data.status === 'COMPLETED' ? 'COMPLETED' : 'OPEN'),
					owner: data.owner || '',
					createdDate: new Date(data.createdAt).toISOString().split('T')[0],
					partProduct: data.partProduct,
					modelName: data.modelName,
					customerSupplier: data.customerSupplier,
					date: data.date,
					result: data.result,
					title: data.title,
					improvementType: data.improvementType,
					partName: data.partName,
					problem: data.problem,
					model: data.model,
					defectQty: data.defectQty,
					venue: data.venue,
					imageUrl: data.imageUrl,
					why1: data.why1,
					why2: data.why2,
					why3: data.why3,
					why4: data.why4,
					undetectedWhy1: data.undetectedWhy1,
					undetectedWhy2: data.undetectedWhy2,
					undetectedWhy3: data.undetectedWhy3,
					tempCountermeasure: data.tempCountermeasure,
					radicalCountermeasure: data.radicalCountermeasure,
					inspectionControl: data.inspectionControl,
					processControl: data.processControl,
					beforeImprovementImgUrl: data.beforeImprovementImgUrl,
					afterImprovementImgUrl: data.afterImprovementImgUrl,
					preventionImgUrl: data.preventionImgUrl,
					remark: data.remark
				};
				setSelectedCapa(mapped);
			} catch (err) {
				console.error('Failed to load CAPA details', err);
			} finally {
				setLoading(false);
			}
		};
		loadCapa();
	}, [id, navigate]);

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center py-20 gap-3">
				<div className="w-8 h-8 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin" />
				<p className="text-xs text-zinc-555 font-bold">Loading CAPA report details...</p>
			</div>
		);
	}

	if (!selectedCapa) {
		return (
			<div className="bg-white border border-zinc-200/50 p-8 text-center rounded-none">
				<p className="text-zinc-650 text-xs font-semibold">No CAPA report selected.</p>
				<button 
					onClick={() => navigate('/manager/capa-management')}
					className="mt-4 px-4 py-2 bg-[#11236a] text-white text-xs font-bold rounded-none outline-none border-none cursor-pointer hover:bg-[#0c1a52] transition-colors"
				>
					View CAPA Management
				</button>
			</div>
		);
	}

	const mappedCapa = {
		...selectedCapa,
		partProduct: selectedCapa.partProduct || selectedCapa.productName || 'N/A',
		modelName: selectedCapa.modelName || 'N/A',
		customerSupplier: selectedCapa.customerSupplier || selectedCapa.owner || 'N/A',
		date: selectedCapa.date || selectedCapa.createdDate || 'N/A',
		result: selectedCapa.result || (selectedCapa.status === 'COMPLETED' ? 'OK' : 'NG'),
		title: selectedCapa.title || selectedCapa.nonConformity || 'N/A',
		improvementType: selectedCapa.improvementType || 'Process',
		partName: selectedCapa.partName || selectedCapa.productName || 'N/A',
		problem: selectedCapa.problem || selectedCapa.nonConformity || 'N/A',
		model: selectedCapa.model || 'N/A',
		defectQty: selectedCapa.defectQty || 'N/A',
		venue: selectedCapa.venue || 'N/A',
		why1: selectedCapa.why1 || selectedCapa.rootCause || 'N/A',
		why2: selectedCapa.why2 || 'N/A',
		why3: selectedCapa.why3 || 'N/A',
		why4: selectedCapa.why4 || 'N/A',
		undetectedWhy1: selectedCapa.undetectedWhy1 || 'N/A',
		undetectedWhy2: selectedCapa.undetectedWhy2 || 'N/A',
		undetectedWhy3: selectedCapa.undetectedWhy3 || 'N/A',
		tempCountermeasure: selectedCapa.tempCountermeasure || selectedCapa.correctiveAction || 'N/A',
		radicalCountermeasure: selectedCapa.radicalCountermeasure || selectedCapa.preventiveAction || 'N/A',
		inspectionControl: selectedCapa.inspectionControl || 'N/A',
		processControl: selectedCapa.processControl || 'N/A',
	};

	const handlePrint = () => {
		const printContent = document.getElementById('printable-capa-sheet');
		if (!printContent) return;

		const iframe = document.createElement('iframe');
		iframe.style.position = 'fixed';
		iframe.style.right = '0';
		iframe.style.bottom = '0';
		iframe.style.width = '0';
		iframe.style.height = '0';
		iframe.style.border = '0';
		document.body.appendChild(iframe);

		const iframeDoc = iframe.contentWindow?.document;
		if (!iframeDoc) return;

		iframeDoc.open();
		iframeDoc.write(`
			<html>
				<head>
					<title>CAPA Report - ${mappedCapa.id}</title>
					<style>
						body {
							font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
							margin: 0;
							padding: 5px;
							background-color: white;
							-webkit-print-color-adjust: exact;
							print-color-adjust: exact;
						}
						table {
							width: 100%;
							border-collapse: collapse;
							table-layout: fixed;
						}
						td {
							border: 1px solid #475569 !important;
							padding: 4px !important;
							font-size: 9px !important;
							line-height: 1.2 !important;
							word-wrap: break-word;
							vertical-align: top;
						}
						.bg-blue-header {
							background-color: #1e3a8a !important;
							color: white !important;
						}
						.bg-zinc-50 {
							background-color: #f9fafb !important;
						}
						.bg-blue-light {
							background-color: rgba(239, 246, 255, 0.2) !important;
						}
						.text-white {
							color: white !important;
						}
						.text-blue-800 {
							color: #1e40af !important;
						}
						.text-center {
							text-align: center;
						}
						.font-bold {
							font-weight: 700;
						}
						.font-extrabold {
							font-weight: 800;
						}
						.text-xs {
							font-size: 9px !important;
						}
						.text-sm {
							font-size: 10px !important;
						}
						.text-emerald-600 {
							color: #059669 !important;
						}
						.text-rose-600 {
							color: #e11d48 !important;
						}
						.defect-img {
							max-width: 260px !important;
							max-height: 160px !important;
							display: block;
							margin: 3px auto;
							object-fit: contain;
						}
						.thumb-img {
							max-height: 140px !important;
							max-width: 100% !important;
							display: block;
							margin: 0 auto;
							object-fit: contain;
						}
						.whitespace-pre-line {
							white-space: pre-line;
						}
						.pl-3 {
							padding-left: 0.5rem;
						}
						.italic {
							font-style: italic;
						}
						@page {
							size: landscape;
							margin: 5mm;
						}
					</style>
				</head>
				<body>
					<div style="width: 100%; box-sizing: border-box; overflow: hidden; page-break-inside: avoid;">
						\${printContent.innerHTML}
					</div>
					<script>
						window.onload = function() {
							setTimeout(function() {
								window.focus();
								window.print();
								setTimeout(function() {
									window.frameElement.remove();
								}, 1000);
							}, 500);
						};
					</script>
				</body>
			</html>
		`);
		iframeDoc.close();
	};

	return (
		<div className="space-y-6">
			{/* Toolbar / Action buttons */}
			<div className="flex items-center justify-between">
				<button 
					onClick={() => navigate('/manager/capa-management')}
					className="text-xs font-bold text-zinc-700 hover:text-zinc-955 flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none transition-colors"
				>
					<ChevronLeft className="w-4 h-4" /> Back to CAPA Register
				</button>

				<div className="flex items-center gap-3">
					<button 
						onClick={handlePrint}
						className="text-xs font-bold text-white bg-[#11236a] hover:bg-[#0c1a52] flex items-center gap-1.5 px-3.5 py-1.5 rounded-none cursor-pointer border-none outline-none transition-all shadow-sm"
					>
						<Printer className="w-3.5 h-3.5" /> Download Report (PDF)
					</button>

					<div className="flex items-center gap-2 text-xs font-extrabold text-zinc-400">
						<span>CAPA ID: <strong className="text-zinc-800">{mappedCapa.id}</strong></span>
						<span>•</span>
						<span>REF REQ: <strong className="text-[#11236a]">{mappedCapa.relatedRequest}</strong></span>
					</div>
				</div>
			</div>

			{/* CAPA Printable Sheet View */}
			<div 
				id="printable-capa-sheet" 
				className="bg-white border border-slate-655 rounded-none overflow-hidden max-w-6xl mx-auto text-zinc-900"
			>
				<table className="w-full border-collapse border border-slate-655 text-xs bg-white" style={{ tableLayout: 'fixed' }}>
					{/* Row 1 & 2: Header Grid */}
					<thead>
						<tr className="text-center font-bold text-[11px] leading-tight">
							<td className="border border-slate-655 bg-[#1e3a8a] bg-blue-header text-white py-2 w-[9%]" style={{ width: '9%' }}>Part/Product</td>
							<td className="border border-slate-655 bg-[#1e3a8a] bg-blue-header text-white py-2 w-[14%]" style={{ width: '14%' }}>Model Name</td>
							<td className="border border-slate-655 bg-[#1e3a8a] bg-blue-header text-white py-2 w-[14%]" style={{ width: '14%' }}>Customer/Supplier</td>
							<td className="border border-slate-655 bg-[#1e3a8a] bg-blue-header text-white py-2 w-[14%]" style={{ width: '14%' }}>Date</td>
							<td className="border border-slate-655 text-zinc-900 bg-white font-extrabold align-middle w-[11%] px-1" style={{ width: '11%' }} rowSpan={2}>Result</td>
							<td className="border border-slate-655 text-zinc-900 bg-white font-bold py-1 w-[21%]" style={{ width: '21%' }}>OK</td>
							<td className="border border-slate-655 text-zinc-900 bg-white font-bold py-1 w-[17%]" style={{ width: '17%' }}>NG</td>
						</tr>
						<tr className="text-center font-semibold text-zinc-700 bg-white">
							<td className="border border-slate-655 py-2 px-2">{mappedCapa.partProduct}</td>
							<td className="border border-slate-655 py-2 px-2">{mappedCapa.modelName}</td>
							<td className="border border-slate-655 py-2 px-2">{mappedCapa.customerSupplier}</td>
							<td className="border border-slate-655 py-2 px-2">{mappedCapa.date}</td>
							<td className="border border-slate-655 py-2 text-center font-extrabold text-emerald-600">
								{mappedCapa.result === 'OK' && 'Done'}
							</td>
							<td className="border border-slate-655 py-2 text-center font-extrabold text-rose-600">
								{mappedCapa.result === 'NG' && 'Done'}
							</td>
						</tr>
					</thead>

					<tbody>
						{/* Row 3: Title & Improvement Options */}
						<tr>
							<td className="border border-slate-655 p-2 font-bold text-blue-800 text-[11px] bg-white" colSpan={4}>
								☐ Title :: <span className="text-zinc-900 font-bold">{mappedCapa.title}</span>
							</td>
							<td className="border border-slate-655 text-center font-bold bg-zinc-50 align-middle">Improvement</td>
							<td className="border border-slate-655 p-0 text-center align-middle" colSpan={2}>
								<table className="w-full h-full border-collapse text-[9px]" style={{ tableLayout: 'fixed' }}>
									<tbody>
										<tr className="border-b border-slate-655 font-bold text-center">
											<td className="border-r border-slate-655 py-0.5 bg-white" style={{ width: '25%' }}>Process</td>
											<td className="border-r border-slate-655 py-0.5 bg-white" style={{ width: '25%' }}>Part</td>
											<td className="border-r border-slate-655 py-0.5 bg-white" style={{ width: '25%' }}>Mold</td>
											<td className="py-0.5 bg-white" style={{ width: '25%' }}>Others</td>
										</tr>
										<tr className="font-bold text-[10px] text-center">
											<td className="border-r border-slate-655 py-1">{mappedCapa.improvementType === 'Process' ? '•' : ''}</td>
											<td className="border-r border-slate-655 py-1">{mappedCapa.improvementType === 'Part' ? '•' : ''}</td>
											<td className="border-r border-slate-655 py-1">{mappedCapa.improvementType === 'Mold' ? '•' : ''}</td>
											<td className="py-1">{mappedCapa.improvementType === 'Others' ? '•' : ''}</td>
										</tr>
									</tbody>
								</table>
							</td>
						</tr>

						{/* Row 4: Column Section Headers */}
						<tr className="bg-blue-50/20 bg-blue-light text-center font-bold text-[10px] text-zinc-800">
							<td className="border border-slate-655 py-1.5">Part Name</td>
							<td className="border border-slate-655 py-1.5" colSpan={3}>(Problem & Reason)</td>
							<td className="border border-slate-655 py-1.5" colSpan={2}>(Counter Measure)</td>
							<td className="border border-slate-655 py-1.5" style={{ width: '90px' }}>Target</td>
							<td className="border border-slate-655 py-1.5" style={{ width: '70px' }}>Status</td>
						</tr>

						{/* Row 5: Main Content Matrix */}
						<tr>
							<td className="border border-slate-655 p-2 text-center font-extrabold text-zinc-955 text-xs align-middle" rowSpan={2}>
								{mappedCapa.partName}
							</td>

							<td className="border border-slate-655 p-2.5 align-top space-y-2.5" colSpan={3} rowSpan={2}>
								<div className="space-y-0.5">
									<span className="block font-bold text-blue-800 text-[10px] uppercase">
										☐ Problem : {mappedCapa.title}
									</span>
									<div className="pl-3 space-y-0.5 text-zinc-650 font-semibold text-[10px]">
										<p>Model: {mappedCapa.model}</p>
										<p>Defect Qty: {mappedCapa.defectQty}</p>
										<p>Venue: {mappedCapa.venue}</p>
									</div>
								</div>

								{mappedCapa.imageUrl ? (
									<div className="border border-slate-300 rounded-none overflow-hidden bg-zinc-50 max-w-[420px] mx-auto p-1">
										<a href={mappedCapa.imageUrl} target="_blank" rel="noopener noreferrer">
											<img 
												src={mappedCapa.imageUrl} 
												alt="Defect Detail" 
												className="w-full h-auto max-h-[250px] defect-img object-contain cursor-zoom-in bg-white p-1" 
											/>
										</a>
									</div>
								) : (
									<div className="border border-dashed border-slate-300 p-2 text-center text-zinc-400 max-w-[150px] mx-auto">
										<ImageIcon className="w-4 h-4 mx-auto mb-0.5 text-zinc-300" />
										<span className="text-[9px] font-bold uppercase tracking-wider block">No defect graphic</span>
									</div>
								)}

								<div className="space-y-0.5 pt-1.5 border-t border-slate-200">
									<span className="block font-bold text-blue-800 text-[10px] uppercase">
										☐ Root Cause :
									</span>
									<div className="pl-3 space-y-0.5 text-zinc-700 font-bold text-[10px]">
										<p>Why 1: <span className="font-normal text-zinc-800">{mappedCapa.why1}</span></p>
										<p>Why 2: <span className="font-normal text-zinc-800">{mappedCapa.why2}</span></p>
										<p>Why 3: <span className="font-normal text-zinc-800">{mappedCapa.why3}</span></p>
										<p>Why 4: <span className="font-normal text-zinc-800">{mappedCapa.why4}</span></p>
									</div>
								</div>

								<div className="space-y-0.5 pt-1.5 border-t border-slate-200">
									<span className="block font-bold text-blue-800 text-[10px] uppercase">
										☐ Process undetected cause:
									</span>
									<div className="pl-3 space-y-0.5 text-zinc-700 font-normal text-[10px]">
										<p>Why 1: {mappedCapa.undetectedWhy1}</p>
										<p>Why 2: {mappedCapa.undetectedWhy2}</p>
										<p>Why 3: {mappedCapa.undetectedWhy3}</p>
									</div>
								</div>
							</td>

							<td className="border border-slate-655 p-2.5 align-top" colSpan={2}>
								<div className="space-y-2.5">
									<div className="space-y-0.5">
										<span className="block font-bold text-blue-800 text-[10px] uppercase">☐ Temp Countermeasure :</span>
										<p className="pl-3 text-zinc-800 leading-relaxed font-semibold text-[10px]">{mappedCapa.tempCountermeasure}</p>
									</div>

									<div className="space-y-0.5 pt-1.5 border-t border-slate-200">
										<span className="block font-bold text-blue-800 text-[10px] uppercase">☐ Radical Countermeasure :</span>
										<p className="pl-3 text-zinc-800 leading-relaxed font-semibold text-[10px]">{mappedCapa.radicalCountermeasure}</p>
									</div>

									<div className="space-y-0.5 pt-1.5 border-t border-slate-200">
										<span className="block font-bold text-blue-800 text-[10px] uppercase">☐ Inspection Control :-</span>
										<p className="pl-3 text-zinc-800 leading-relaxed font-semibold text-[10px] whitespace-pre-line">{mappedCapa.inspectionControl}</p>
									</div>

									<div className="space-y-0.5 pt-1.5 border-t border-slate-200">
										<span className="block font-bold text-blue-800 text-[10px] uppercase">☐ Process control :-</span>
										<p className="pl-3 text-zinc-800 leading-relaxed font-semibold text-[10px] whitespace-pre-line">{mappedCapa.processControl}</p>
									</div>
								</div>
							</td>

							{/* Column 4: Target Date */}
							<td className="border border-slate-655 p-2.5 text-center font-bold text-zinc-800 text-xs align-top col-target">
								<span className="block text-[8px] text-zinc-500 uppercase font-semibold border-b border-slate-200 pb-0.5">Target Date</span>
								<span className="block text-[11px] font-extrabold text-zinc-900 mt-1">{mappedCapa.targetDate || mappedCapa.targetedDate}</span>
							</td>

							{/* Column 5: Status */}
							<td className="border border-slate-655 p-2 text-center font-extrabold text-zinc-950 text-xs align-middle col-status" rowSpan={2}>
								{mappedCapa.status === 'COMPLETED' ? 'Done' : mappedCapa.status || 'Pending'}
							</td>
						</tr>

						{/* Row 5b: Improvement Images (In a separate table row to guarantee same-baseline horizontal alignment) */}
						<tr>
							{/* Column 3: Counter Measure Images */}
							<td className="border border-slate-655 p-2.5 align-middle bg-white" colSpan={2}>
								{/* Before / After attachments table */}
								<table className="w-full border-collapse border border-slate-400 text-[9px] bg-white">
									<thead>
										<tr className="bg-zinc-50 font-bold text-center">
											<td className="border border-slate-400 py-0.5 w-[50%]">Before Improvement</td>
											<td className="border border-slate-400 py-0.5 w-[50%]">After Improvement</td>
										</tr>
									</thead>
									<tbody>
										<tr className="h-44 text-center">
											<td className="border border-slate-400 p-1.5 align-middle">
												{mappedCapa.beforeImprovementImgUrl ? (
													<a href={mappedCapa.beforeImprovementImgUrl} target="_blank" rel="noopener noreferrer">
														<img src={mappedCapa.beforeImprovementImgUrl} className="thumb-img mx-auto object-contain max-h-[150px] bg-white p-0.5 rounded-sm border border-zinc-200" alt="Before" />
													</a>
												) : '—'}
											</td>
											<td className="border border-slate-400 p-1.5 align-middle">
												{mappedCapa.afterImprovementImgUrl ? (
													<a href={mappedCapa.afterImprovementImgUrl} target="_blank" rel="noopener noreferrer">
														<img src={mappedCapa.afterImprovementImgUrl} className="thumb-img mx-auto object-contain max-h-[150px] bg-white p-0.5 rounded-sm border border-zinc-200" alt="After" />
													</a>
												) : '—'}
											</td>
										</tr>
									</tbody>
								</table>
							</td>

							{/* Column 4: Prevention Image */}
							<td className="border border-slate-655 p-2.5 text-center align-middle col-target bg-white">
								<table className="w-full border-collapse border border-slate-400 text-[9px] bg-white">
									<thead>
										<tr className="bg-zinc-50 font-bold text-center">
											<td className="border border-slate-400 py-0.5">Prevention</td>
										</tr>
									</thead>
									<tbody>
										<tr className="h-44 text-center">
											<td className="border border-slate-400 p-1.5 align-middle">
												{mappedCapa.preventionImgUrl ? (
													<a href={mappedCapa.preventionImgUrl} target="_blank" rel="noopener noreferrer">
														<img src={mappedCapa.preventionImgUrl} className="thumb-img mx-auto object-contain max-h-[150px] bg-white p-0.5 rounded-sm border border-zinc-200" alt="Prevention" />
													</a>
												) : '—'}
											</td>
										</tr>
									</tbody>
								</table>
							</td>
						</tr>

						<tr>
							<td className="border border-slate-655 p-2 font-bold text-blue-800 text-[10px] align-top bg-white" colSpan={8}>
								Remark : <span className="font-semibold text-zinc-700 leading-relaxed italic">{mappedCapa.remark || 'No management remarks recorded.'}</span>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	);
}
