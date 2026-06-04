import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Printer, X, FileText, AlertTriangle } from 'lucide-react';
import { getTestRequests } from '../../services/operations/testRequestService';
import { getTestCategories } from '../../services/operations/testCategoryService';
import { getTestProtocols } from '../../services/operations/testProtocolService';
import { getTestingEquipments } from '../../services/operations/testingEquipmentService';


export default function ReportPreview() {
	const location = useLocation();

	// Parse query params
	const query = new URLSearchParams(location.search);
	const type = query.get('type'); // 'sample' | 'request'
	const key = query.get('key'); // for sample: `${requestId}-sample-${sampleIndex}`
	const id = query.get('id'); // for request: `${requestId}`

	// States
	const [requests, setRequests] = useState<any[]>([]);
	const [testCategories, setTestCategories] = useState<any[]>([]);
	const [testProtocols, setTestProtocols] = useState<any[]>([]);
	const [equipments, setEquipments] = useState<any[]>([]);
	const [plans, setPlans] = useState<{ [key: string]: any }>({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;
		const loadData = async () => {
			try {
				const reqs = await getTestRequests()();
				const categories = await getTestCategories()();
				const protocols = await getTestProtocols()();
				const eqs = await getTestingEquipments()();
				const cachedPlans = localStorage.getItem('dixon_sample_test_plans');

				if (isMounted) {
					setRequests(reqs || []);
					setTestCategories(categories || []);
					setTestProtocols(protocols || []);
					setEquipments(eqs || []);
					setPlans(cachedPlans ? JSON.parse(cachedPlans) : {});
				}
			} catch (err) {
				console.error('Failed to load report data:', err);
			} finally {
				if (isMounted) setLoading(false);
			}
		};
		loadData();
		return () => {
			isMounted = false;
		};
	}, []);

	// Formatting Helpers
	const formatDate = (dateStr: string) => {
		if (!dateStr) return 'N/A';
		const d = new Date(dateStr);
		if (isNaN(d.getTime())) return dateStr;
		const day = String(d.getDate()).padStart(2, '0');
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const year = d.getFullYear();
		return `${day}/${month}/${year}`;
	};

	const triggerPrint = () => {
		window.print();
	};

	const closeTab = () => {
		window.close();
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center space-y-4">
				<div className="w-12 h-12 border-4 border-indigo-700 border-t-transparent rounded-full animate-spin"></div>
				<p className="text-zinc-650 text-xs font-bold">Assembling Quality Laboratory PDF Preview...</p>
			</div>
		);
	}

	// 1. RESOLVE DATA DEPENDING ON REPORT TYPE
	let request: any = null;
	let sampleIndex: number | null = null;
	let targetPlan: any = null;
	let samplesList: any[] = [];
	let isOverallPassed = true;

	if (type === 'sample' && key) {
		const [reqIdStr, sampleIdxStr] = key.split('-sample-');
		sampleIndex = parseInt(sampleIdxStr, 10);
		request = requests.find(r => String(r.id) === String(reqIdStr));
		targetPlan = plans[key];
		if (targetPlan) {
			isOverallPassed = targetPlan.evaluationStatus === 'PASSED';
		}
	} else if (type === 'request' && id) {
		request = requests.find(r => String(r.id) === String(id));
		if (request) {
			const qty = request.sampleQty || 1;
			let hasFailure = false;
			for (let i = 0; i < qty; i++) {
				const cacheKey = `${request.id}-sample-${i}`;
				const plan = plans[cacheKey];
				const inspectionReport = request.sampleInspections?.find((r: any) => Number(r.sampleIndex) === i);
				
				let finalOutcome = 'PENDING';
				let remarks = '';
				if (inspectionReport) {
					if (inspectionReport.status === 'FAILED') {
						finalOutcome = 'FAILED';
						remarks = inspectionReport.remarks || 'Failed visual verification check.';
						hasFailure = true;
					} else if (inspectionReport.status === 'PASSED') {
						if (plan) {
							if (plan.evaluationStatus === 'PASSED') {
								finalOutcome = 'PASSED';
								remarks = plan.evaluationRemarks || 'Endurance specifications complied.';
							} else if (plan.evaluationStatus === 'FAILED') {
								finalOutcome = 'FAILED';
								remarks = plan.evaluationRemarks || 'Physical parameter out of tolerance.';
								hasFailure = true;
							}
						}
					}
				}
				samplesList.push({
					index: i,
					allottedId: inspectionReport?.allottedId || `REQ-${request.id}-S${String(i + 1).padStart(2, '0')}`,
					inspectionReport,
					plan,
					finalOutcome,
					remarks
				});
			}
			isOverallPassed = !hasFailure;
			// Use first sample's plan for metadata template fields
			const firstPlanKey = `${request.id}-sample-0`;
			targetPlan = plans[firstPlanKey];
		}
	}

	if (!request || !targetPlan) {
		return (
			<div className="min-h-screen bg-zinc-100 flex flex-col items-center justify-center p-6 text-center">
				<AlertTriangle className="w-12 h-12 text-rose-500 mb-2" />
				<h3 className="text-base font-black text-zinc-800">Test Plan or Request Data Not Found</h3>
				<p className="text-xs text-zinc-500 mt-1 max-w-sm">Please verify the selected plan or refresh your manager panel.</p>
				<button onClick={closeTab} className="mt-4 px-4 py-2 bg-zinc-800 text-white rounded-lg text-xs font-bold">Close Tab</button>
			</div>
		);
	}

	const testCategory = testCategories.find(c => String(c.id) === String(targetPlan.testCategoryId));
	const testProtocol = testProtocols.find(p => String(p.id) === String(targetPlan.testProtocolId));
	const equipmentUsed = equipments.find(e => String(e.id) === String(targetPlan.equipmentId));

	// DQL constants & template variables
	const testDescription = testCategory?.name || 'NEEDLE FLAME TEST';
	const issueDate = formatDate(new Date().toISOString());
	const testPurpose = 'New Development Test';
	const testItemDescription = request.sampleDescription || 'Spin Lid Switch';
	const associateModel = request.modelNo || 'All Semi-Automatic Washing Machine';
	const testSpecification = `${testDescription} AS PER ${request.testMethodRef || 'IEC 60695-11-5'}`;
	const sampleQuantity = String(request.sampleQty || 1).padStart(2, '0');
	const startOfTestDate = formatDate(targetPlan.startDate);
	const endOfTestDate = formatDate(targetPlan.endDate);
	const otherAspects = targetPlan.remarks || 'Nil';

	// Signatures
	const testedBy = 'Shaukat';
	const approvedBy = 'Prasunanand';

	// Collect specimen images
	const specimenImages: string[] = [];
	if (type === 'sample' && sampleIndex !== null) {
		const insp = request.sampleInspections?.find((si: any) => Number(si.sampleIndex) === sampleIndex);
		if (insp?.images) {
			try {
				const paths = typeof insp.images === 'string' ? JSON.parse(insp.images) : insp.images;
				if (Array.isArray(paths)) specimenImages.push(...paths);
			} catch (e) {}
		}
	} else {
		request.sampleInspections?.forEach((si: any) => {
			if (si.images) {
				try {
					const paths = typeof si.images === 'string' ? JSON.parse(si.images) : si.images;
					if (Array.isArray(paths)) specimenImages.push(...paths);
				} catch (e) {}
			}
		});
	}

	// Render custom page components
	const renderHeader = (pageNo: number) => (
		<div className="w-full border-2 border-black text-black select-none">
			{/* Top Row: Logo & Lab Details */}
			<div className="grid grid-cols-12 border-b-2 border-black divide-x-2 divide-black">
				<div className="col-span-4 p-2.5 flex items-center justify-center">
					<div className="flex items-center gap-2">
						<img src="/logo.png" alt="Dixon Logo" className="h-9 object-contain" />
						<div className="w-[1px] h-8 bg-zinc-400 mx-1"></div>
						<div className="flex items-center gap-1">
							<div className="w-6.5 h-6.5 rounded-full bg-[#e11d48] flex items-center justify-center text-white text-[9px] font-black italic">25+</div>
							<div className="text-[8px] text-[#e11d48] font-black italic leading-none">Years</div>
						</div>
					</div>
				</div>
				<div className="col-span-8 p-2 text-center flex flex-col justify-center items-center">
					<h2 className="text-[13.5px] font-black tracking-tight uppercase text-zinc-900 leading-tight">
						PERFORMANCE & SAFETY LAB,
					</h2>
					<h2 className="text-[12.5px] font-black tracking-tight uppercase text-zinc-900 leading-tight">
						DIXON TECHNOLOGIES (INDIA) LIMITED
					</h2>
				</div>
			</div>
			{/* Bottom Row: Metadata info */}
			<div className="grid grid-cols-6 divide-x-2 divide-black text-[8px] font-bold text-center bg-white">
				<div className="py-1 px-1">ISSUE NO: 01</div>
				<div className="py-1 px-1">ISSUE DATE: 15-01-2024</div>
				<div className="py-1 px-1">REV NO: 00</div>
				<div className="py-1 px-1">REV DATE: 00</div>
				<div className="py-1 px-1">DOC NO: PSL/QSP/07/TR-02</div>
				<div className="py-1 px-1">Page {pageNo} of 3</div>
			</div>
		</div>
	);

	const renderFooter = () => (
		<div className="grid grid-cols-2 gap-10 text-[10px] font-bold text-zinc-700 mt-6 pt-4 border-t border-zinc-200">
			<div>
				<p className="text-[8px] uppercase tracking-wider text-zinc-400">Tested by</p>
				<p className="text-zinc-900 font-black mt-1">({testedBy})</p>
			</div>
			<div className="text-right flex flex-col items-end">
				<p className="text-[8px] uppercase tracking-wider text-zinc-400">Review & Approved by</p>
				<p className="text-zinc-900 font-black mt-1">({approvedBy})</p>
			</div>
		</div>
	);

	return (
		<>
			<style>{`
				body {
					background-color: #f1f5f9;
					margin: 0;
					padding: 0;
					font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
				}
				.a4-page {
					width: 210mm;
					height: 297mm;
					padding: 15mm;
					background: white;
					box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
					margin: 20px auto;
					box-sizing: border-box;
					display: flex;
					flex-direction: column;
					justify-content: space-between;
					position: relative;
					overflow: hidden;
				}
				.watermark {
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%) rotate(-35deg);
					font-size: 80px;
					color: rgba(220, 220, 220, 0.15);
					font-weight: 900;
					pointer-events: none;
					z-index: 0;
					letter-spacing: 12px;
					user-select: none;
					text-transform: uppercase;
				}
				.content-container {
					position: relative;
					z-index: 10;
					flex: 1;
				}
				@media print {
					body {
						background: white !important;
						margin: 0 !important;
						padding: 0 !important;
					}
					.no-print {
						display: none !important;
					}
					.a4-page {
						margin: 0 !important;
						border: none !important;
						box-shadow: none !important;
						width: 100% !important;
						height: 100vh !important;
						page-break-after: always !important;
						padding: 12mm !important;
					}
					.a4-page:last-child {
						page-break-after: avoid !important;
					}
				}
			`}</style>

			<div className="min-h-screen flex flex-col no-scrollbar">
				{/* Top Command Action bar */}
				<div className="bg-white border-b border-zinc-200/80 px-6 py-3 flex items-center justify-between no-print sticky top-0 z-50 shadow-sm">
					<div className="flex items-center gap-2 text-zinc-800">
						<FileText className="w-5 h-5 text-[#11236a]" />
						<div>
							<span className="text-xs font-black uppercase text-zinc-900">Performance & Safety Lab Report</span>
							<p className="text-[10px] text-zinc-500 font-semibold">
								{type === 'sample' 
									? `Sample ID Allotment report for ${key}` 
									: `Overall Request Report for ${request.requestId || `REQ-${request.id}`}`}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<button
							onClick={triggerPrint}
							className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#11236a] hover:bg-[#0c1a52] px-4 py-2 rounded-xl transition-all cursor-pointer border-none outline-none active:scale-[0.98]"
						>
							<Printer className="w-3.5 h-3.5" />
							<span>Download / Print PDF</span>
						</button>
						<button
							onClick={closeTab}
							className="flex items-center gap-1.5 text-xs font-bold text-zinc-650 hover:bg-zinc-100 border border-zinc-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer outline-none active:scale-[0.98]"
						>
							<X className="w-3.5 h-3.5" />
							<span>Close Preview</span>
						</button>
					</div>
				</div>

				{/* -------------------- PAGE 1 -------------------- */}
				<div className="a4-page">
					<div className="watermark">CONFIDENTIAL</div>
					<div className="content-container flex flex-col justify-between h-full">
						<div>
							{renderHeader(1)}
							<h3 className="text-center font-bold text-[14px] underline tracking-widest my-5 text-black">TEST REPORT</h3>
							
							<table className="w-full border-2 border-black text-[11.5px] font-bold border-collapse text-black">
								<tbody>
									<tr className="border-b-2 border-black">
										<td className="p-2.5">
											<div className="flex justify-between">
												<div><span className="inline-block w-48 text-zinc-650">Test Description:</span> <span className="uppercase text-black">{testDescription}</span></div>
												<div className="pr-4"><span className="text-zinc-650">ISSUE DATE:</span> <span className="text-black">{issueDate}</span></div>
											</div>
										</td>
									</tr>
									<tr className="border-b-2 border-black">
										<td className="p-2.5">
											<span className="inline-block w-48 text-zinc-650">Test Purpose / Identification:</span> <span className="text-black">{testPurpose}</span>
										</td>
									</tr>
									<tr className="border-b-2 border-black">
										<td className="p-2.5">
											<span className="inline-block w-48 text-zinc-650">Test Item Description:</span> <span className="text-black">{testItemDescription}</span>
										</td>
									</tr>
									<tr className="border-b-2 border-black">
										<td className="p-2.5">
											<span className="inline-block w-48 text-zinc-650">Associate Model:</span> <span className="text-black">{associateModel}</span>
										</td>
									</tr>
									<tr className="border-b-2 border-black">
										<td className="p-2.5 leading-normal">
											<span className="inline-block w-48 text-zinc-650 align-top">Testing laboratory and its address:</span>
											<span className="text-black inline-block w-[calc(100%-12.5rem)] align-top font-semibold uppercase">
												PERFORMANCE AND SAFETY LAB, DIXON TECHNOLOGIES (INDIA) LIMITED
												<br />
												C-2/1, SELAQUI INDUSTRIAL AREA DEHRADUN, UTTARAKHAND - 248197
											</span>
										</td>
									</tr>
									<tr className="border-b-2 border-black">
										<td className="p-2.5">
											<span className="inline-block w-48 text-zinc-650">Test specification:</span> <span className="uppercase text-black">{testSpecification}</span>
										</td>
									</tr>
									<tr className="border-b-2 border-black">
										<td className="p-2.5">
											<span className="inline-block w-48 text-zinc-650">Sample Quantity:</span> <span className="text-black">{sampleQuantity}</span>
										</td>
									</tr>
									<tr className="border-b-2 border-black">
										<td className="p-2.5">
											<div className="flex">
												<div className="w-1/2"><span className="inline-block w-48 text-zinc-650">Start of test date:</span> <span className="text-black">{startOfTestDate}</span></div>
												<div className="w-1/2"><span className="inline-block w-32 text-zinc-650">End of Test Date:</span> <span className="text-black">{endOfTestDate}</span></div>
											</div>
										</td>
									</tr>
									<tr className="border-b-2 border-black">
										<td className="p-2.5">
											<span className="inline-block w-48 text-zinc-650">Test Result:</span> 
											<span className="text-black font-semibold">
												The test item{' '}
												<span className="font-extrabold uppercase" style={{ textDecoration: isOverallPassed ? 'none' : 'line-through', color: isOverallPassed ? '#059669' : '#000' }}>Passed</span>
												{' / '}
												<span className="font-extrabold uppercase" style={{ textDecoration: !isOverallPassed ? 'none' : 'line-through', color: !isOverallPassed ? '#dc2626' : '#000' }}>Failed</span>
												{' as per the test specification(s).'}
											</span>
										</td>
									</tr>
									<tr className="border-b-2 border-black">
										<td className="p-2.5">
											<span className="inline-block w-48 text-zinc-650">Abbreviations:</span> <span className="text-black font-semibold">P(Pass) = Passed, F(Fail) = Failed, N/A = Not applicable</span>
										</td>
									</tr>
									<tr className="border-b-2 border-black">
										<td className="p-2.5">
											<span className="inline-block w-48 text-zinc-650 font-bold">Laboratory Environmental conditions:</span> <span className="text-black font-semibold">Temperature (27±5)°C & Relative humidity &lt; 70%</span>
										</td>
									</tr>
									<tr className="border-b-2 border-black">
										<td className="p-2.5">
											<span className="inline-block w-48 text-zinc-650">Other Aspects:</span> <span className="text-black font-semibold">{otherAspects}</span>
										</td>
									</tr>
									<tr>
										<td className="p-2.5 text-center text-[10.5px] font-semibold text-zinc-550 italic">
											This test report relates to the test sample submitted
										</td>
									</tr>
								</tbody>
							</table>
						</div>
						{renderFooter()}
					</div>
				</div>

				{/* -------------------- PAGE 2 -------------------- */}
				<div className="a4-page">
					<div className="watermark">CONFIDENTIAL</div>
					<div className="content-container flex flex-col justify-between h-full">
						<div>
							{renderHeader(2)}
							<div className="my-5">
								<table className="w-full border-2 border-black text-left border-collapse text-black text-[10px]">
									<thead>
										<tr className="bg-zinc-100 border-b-2 border-black divide-x-2 divide-black text-[10.5px] font-black uppercase text-center">
											<th className="p-2 w-14">S. No.</th>
											<th className="p-2 w-32">Tests Name</th>
											<th className="p-2 w-32">Test Method</th>
											<th className="p-2">Specified Requirement</th>
											<th className="p-2 w-48">Observation / Results</th>
										</tr>
									</thead>
									<tbody className="divide-y-2 divide-black font-semibold">
										{type === 'sample' ? (
											<tr className="divide-x-2 divide-black">
												<td className="p-2 text-center">1</td>
												<td className="p-2 uppercase">{testDescription}</td>
												<td className="p-2 uppercase">{request.testMethodRef || 'IEC 60695-11-5'}</td>
												<td className="p-2 font-medium leading-relaxed">
													{testProtocol?.judgementCriteria || 
														'The test specimen is considered to have satisfactorily withstood the test if there is no flame and no glowing of the test specimen.'}
												</td>
												<td className="p-2 uppercase">
													{targetPlan.evaluationStatus === 'PASSED' ? (
														<span className="text-emerald-700 font-bold">Complies. Meets specifications.</span>
													) : (
														<span className="text-rose-700 font-bold">
															Non-compliance: {targetPlan.evaluationRemarks || 'Failed test specs.'}
														</span>
													)}
												</td>
											</tr>
										) : (
											samplesList.map((sample, idx) => (
												<tr key={idx} className="divide-x-2 divide-black">
													<td className="p-2 text-center">{idx + 1}</td>
													<td className="p-2 uppercase">{testDescription}</td>
													<td className="p-2 uppercase">{request.testMethodRef || 'IEC 60695-11-5'}</td>
													<td className="p-2 font-medium leading-relaxed text-[9px]">
														{testProtocol?.judgementCriteria || 
															'The test specimen is considered to have satisfactorily withstood the test.'}
													</td>
													<td className="p-2 uppercase text-[9px]">
														{sample.finalOutcome === 'PASSED' ? (
															<span className="text-emerald-700 font-bold">Passed: Complied</span>
														) : sample.finalOutcome === 'FAILED' ? (
															<span className="text-rose-700 font-bold">Failed: {sample.remarks}</span>
														) : (
															<span className="text-zinc-500 italic">Under Testing</span>
														)}
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>

							<div className="text-xs font-bold text-black mb-6">
								Conclusion: Tested samples{' '}
								<span className="underline uppercase">
									{isOverallPassed ? 'meets' : 'does not meet'}
								</span>{' '}
								the test specification requirement.
							</div>

							<div className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50/50">
								<h4 className="text-center font-bold text-xs underline mb-3 text-black">Test Specimen Picture:</h4>
								<div className="grid grid-cols-2 gap-4 justify-center">
									{specimenImages.length > 0 ? (
										specimenImages.slice(0, 2).map((img, index) => (
											<div key={index} className="border border-zinc-300 rounded-xl overflow-hidden bg-white aspect-[4/3] flex items-center justify-center">
												<img src={img} alt={`Specimen ${index + 1}`} className="max-w-full max-h-full object-contain" />
											</div>
										))
									) : (
										<>
											<div className="border-2 border-dashed border-zinc-300 rounded-xl p-6 bg-white aspect-[4/3] flex flex-col items-center justify-center text-zinc-400">
												<span className="text-[10px] font-bold uppercase">Specimen Front View</span>
											</div>
											<div className="border-2 border-dashed border-zinc-300 rounded-xl p-6 bg-white aspect-[4/3] flex flex-col items-center justify-center text-zinc-400">
												<span className="text-[10px] font-bold uppercase">Specimen Rear View</span>
											</div>
										</>
									)}
								</div>
							</div>
						</div>
						{renderFooter()}
					</div>
				</div>

				{/* -------------------- PAGE 3 -------------------- */}
				<div className="a4-page">
					<div className="watermark">CONFIDENTIAL</div>
					<div className="content-container flex flex-col justify-between h-full">
						<div>
							{renderHeader(3)}
							
							<div className="my-5">
								<h4 className="text-[11px] font-black uppercase text-black mb-2.5">Test Equipment Details</h4>
								<table className="w-full border-2 border-black text-left border-collapse text-black text-[10.5px]">
									<thead>
										<tr className="bg-zinc-100 border-b-2 border-black divide-x-2 divide-black font-black uppercase text-center">
											<th className="p-2">Equipment Name</th>
											<th className="p-2 w-36">Make</th>
											<th className="p-2 w-36">Model</th>
											<th className="p-2 w-44">Calibration status</th>
										</tr>
									</thead>
									<tbody className="divide-y-2 divide-black font-semibold text-center">
										<tr className="divide-x-2 divide-black">
											<td className="p-2.5 font-bold uppercase text-left">
												{equipmentUsed?.name || 'Needle Flame Test Apparatus'}
											</td>
											<td className="p-2.5 uppercase">LISHUN GROUP</td>
											<td className="p-2.5 uppercase">ZY-3</td>
											<td className="p-2.5 uppercase text-emerald-700 font-extrabold">Valid</td>
										</tr>
									</tbody>
								</table>
							</div>

							<div className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50/50 space-y-4">
								<div className="flex gap-4">
									<div className="w-1/2 flex flex-col items-center">
										<div className="border border-zinc-300 rounded-xl overflow-hidden bg-white w-full aspect-[4/3] flex items-center justify-center">
											{specimenImages[2] ? (
												<img src={specimenImages[2]} alt="Test Setup" className="max-w-full max-h-full object-contain" />
											) : (
												<div className="w-full h-full bg-zinc-100/50 flex items-center justify-center text-zinc-400 text-[10px] font-bold">SETUP PREVIEW</div>
											)}
										</div>
										<span className="text-[10px] font-black underline mt-2 text-black">Test Setup</span>
									</div>

									<div className="w-1/2 flex flex-col items-center">
										<div className="border border-zinc-300 rounded-xl overflow-hidden bg-white w-full aspect-[4/3] flex items-center justify-center">
											{specimenImages[3] ? (
												<img src={specimenImages[3]} alt="Equipment Overview" className="max-w-full max-h-full object-contain" />
											) : (
												<div className="w-full h-full bg-zinc-100/50 flex items-center justify-center text-zinc-400 text-[10px] font-bold">EQUIPMENT PREVIEW</div>
											)}
										</div>
										<span className="text-[10px] font-black underline mt-2 text-black">Overview of test equipment's</span>
									</div>
								</div>
							</div>

							<div className="text-center font-black tracking-widest text-[11px] text-zinc-800 uppercase mt-8 select-none">
								***** END OF THE TEST REPORT *****
							</div>
						</div>
						{renderFooter()}
					</div>
				</div>
			</div>
		</>
	);
}
