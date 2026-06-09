import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clipboard, CheckCircle, Upload, FileText, Trash2, Search, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

import { getTestTypes } from '../../services/operations/testTypeService';
import { getTestCategories } from '../../services/operations/testCategoryService';
import { getTestProtocols } from '../../services/operations/testProtocolService';
import { getTestingEquipments, releaseEquipment } from '../../services/operations/testingEquipmentService';
import { releasePlatforms } from '../../services/operations/platformAvailabilityService';
import { saveSampleReport } from '../../services/operations/testRequestService';
import CustomSelect from '../../components/CustomSelect';

interface EngineerTestReportsProps {
	requests: any[];
	currentEngineerIsNabl: boolean;
	onUpdateStatus: (requestId: string, status: string, remarks?: string) => Promise<void>;
}

interface TestReportForm {
	specifiedRequirement: string;
	observationResults: string;
	specimenImages: string[];
	eqName: string;
	eqMake: string;
	eqModel: string;
	eqCalibration: string;
	imagePaths?: string[];
}

export default function EngineerTestReports({
	requests,
	currentEngineerIsNabl,
	onUpdateStatus
}: EngineerTestReportsProps) {
	const navigate = useNavigate();
	const { planKey } = useParams<{ planKey: string }>();

	const normalizeSavedReport = (
		report: Partial<TestReportForm> & { imagePaths?: string[]; specimenImages?: string[] } | any
	): TestReportForm => {
		const storedImages = Array.isArray(report?.imagePaths)
			? report.imagePaths
			: Array.isArray(report?.specimenImages)
				? report.specimenImages.filter((item: string) => typeof item === 'string' && !item.startsWith('data:'))
				: [];

		return {
			specifiedRequirement: report?.specifiedRequirement || '',
			observationResults: report?.observationResults || '',
			specimenImages: storedImages,
			eqName: report?.eqName || '',
			eqMake: report?.eqMake || '',
			eqModel: report?.eqModel || '',
			eqCalibration: report?.eqCalibration || '',
			imagePaths: storedImages
		};
	};

	const [testTypes, setTestTypes] = useState<any[]>([]);
	const [testCategories, setTestCategories] = useState<any[]>([]);
	const [testProtocols, setTestProtocols] = useState<any[]>([]);
	const [equipments, setEquipments] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [reportStatusFilter, setReportStatusFilter] = useState('ALL');

	const [reportForm, setReportForm] = useState<TestReportForm>({
		specifiedRequirement: '',
		observationResults: '',
		specimenImages: [],
		eqName: '',
		eqMake: '',
		eqModel: '',
		eqCalibration: ''
	});

	const plans = useMemo(() => {
		const plansMap: { [key: string]: any } = {};

		for (const req of requests) {
			const requestPlans = Array.isArray(req.testPlans) ? req.testPlans : [];

			for (const p of requestPlans) {
				let platformNosParsed: number[] = [];

				if (p.platformNos) {
					try {
						platformNosParsed =
							typeof p.platformNos === 'string'
								? JSON.parse(p.platformNos)
								: p.platformNos;
					} catch (e) {
						platformNosParsed = [];
					}
				}

				plansMap[`${req.id}-sample-${p.sampleIndex}`] = {
					...p,
					platformNos: platformNosParsed,
					requestId: req.id,
					requestStatus: req.status,
					requestTestType: req.testType
				};
			}
		}

		return plansMap;
	}, [requests]);

	const savedReports = useMemo(() => {
		const reportsMap: { [key: string]: TestReportForm } = {};

		requests.forEach(req => {
			if (!Array.isArray(req.sampleInspections)) return;

			req.sampleInspections.forEach((insp: any) => {
				const reportKey = `${req.id}-sample-${insp.sampleIndex}`;

				let checksObj: any = {};
				try {
					checksObj = typeof insp.checks === 'string'
						? JSON.parse(insp.checks)
						: (insp.checks || {});
				} catch (e) {
					checksObj = {};
				}

				let imagesArr: string[] = [];
				try {
					imagesArr = typeof insp.images === 'string'
						? JSON.parse(insp.images)
						: (insp.images || []);
				} catch (e) {
					imagesArr = [];
				}

				const hasEngineerReportData =
					!!checksObj.specifiedRequirement ||
					!!checksObj.eqName ||
					!!checksObj.eqMake ||
					!!checksObj.eqModel ||
					!!checksObj.eqCalibration ||
					(imagesArr && imagesArr.length > 0);

				const isReportStatus = [
					'UNDER_REVIEW',
					'COMPLETED',
					'TESTING_PASSED',
					'TESTING_FAILED',
					'TESTING_PARTIAL'
				].includes((insp.status || '').toUpperCase());

				if (isReportStatus && hasEngineerReportData) {
					reportsMap[reportKey] = normalizeSavedReport({
						specifiedRequirement: checksObj.specifiedRequirement || '',
						observationResults: insp.remarks || '',
						specimenImages: imagesArr,
						eqName: checksObj.eqName || '',
						eqMake: checksObj.eqMake || '',
						eqModel: checksObj.eqModel || '',
						eqCalibration: checksObj.eqCalibration || '',
						imagePaths: imagesArr
					});
				}
			});
		});

		return reportsMap;
	}, [requests]);

	useEffect(() => {
		let isMounted = true;

		const loadData = async () => {
			try {
				const types = await getTestTypes()();
				const categories = await getTestCategories()();
				const protocols = await getTestProtocols()();
				const eqps = await getTestingEquipments({ limit: 100 })();

				if (isMounted) {
					setTestTypes(types || []);
					setTestCategories(categories || []);
					setTestProtocols(protocols || []);
					setEquipments(eqps || []);
				}
			} catch (err) {
				console.error('Failed to load master metadata for test reports:', err);
			} finally {
				if (isMounted) setLoading(false);
			}
		};

		loadData();

		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		if (!planKey || loading || !plans[planKey]) return;

		const plan = plans[planKey];
		const testProtocol = testProtocols.find(p => String(p.id) === String(plan.testProtocolId));
		const eq = plan.equipmentId ? equipments.find(e => String(e.id) === String(plan.equipmentId)) : null;

		const getEquipmentDetails = (eqItem: any) => {
			if (!eqItem) return { name: 'Not Assigned', make: '-', model: '-', calibration: '-' };

			const nameLower = String(eqItem.name || '').toLowerCase();
			let make = 'Dixon Quality';
			let model = `DX-${eqItem.id || '01'}`;

			if (nameLower.includes('needle') || nameLower.includes('flame')) {
				make = 'LISHUN GROUP';
				model = 'ZY-3';
			} else if (nameLower.includes('glow') || nameLower.includes('wire')) {
				make = 'SANS';
				model = 'ZRS-2';
			} else if (nameLower.includes('chamber') || nameLower.includes('humidity')) {
				make = 'ESPEC';
				model = 'EPL-4H';
			} else if (nameLower.includes('tracking') || nameLower.includes('index')) {
				make = 'LISUN';
				model = 'TTC-1';
			}

			let calibration = 'Valid';

			if (eqItem.calibrationDueDate) {
				const dueDate = new Date(eqItem.calibrationDueDate);
				const formatted = dueDate.toLocaleDateString();
				calibration = dueDate >= new Date()
					? `Valid (Due: ${formatted})`
					: `Expired (Due: ${formatted})`;
			}

			return { name: eqItem.name, make, model, calibration };
		};

		const eqDet = getEquipmentDetails(eq);
		const existingReport = savedReports[planKey];

		if (existingReport) {
			setReportForm({
				...existingReport,
				specifiedRequirement: testProtocol?.judgementCriteria || existingReport.specifiedRequirement || '',
				eqName: eqDet.name !== 'Not Assigned' ? eqDet.name : (existingReport.eqName || ''),
				eqMake: eqDet.make !== '-' ? eqDet.make : (existingReport.eqMake || ''),
				eqModel: eqDet.model !== '-' ? eqDet.model : (existingReport.eqModel || ''),
				eqCalibration: eqDet.calibration !== '-' ? eqDet.calibration : (existingReport.eqCalibration || '')
			});
		} else {
			setReportForm({
				specifiedRequirement: testProtocol?.judgementCriteria || '',
				observationResults: '',
				specimenImages: [],
				eqName: eqDet.name,
				eqMake: eqDet.make,
				eqModel: eqDet.model,
				eqCalibration: eqDet.calibration
			});
		}
	}, [planKey, loading, plans, requests, testProtocols, equipments, savedReports]);

	const handleSpecimenImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);

		if (!files.length) return;

		files.forEach(file => {
			const reader = new FileReader();

			reader.onloadend = () => {
				setReportForm(prev => ({
					...prev,
					specimenImages: [...(prev.specimenImages || []), reader.result as string]
				}));
			};

			reader.readAsDataURL(file);
		});

		e.target.value = '';
	};

	const removeSpecimenImage = (idx: number) => {
		setReportForm(prev => ({
			...prev,
			specimenImages: prev.specimenImages.filter((_, i) => i !== idx)
		}));
	};

	const nonReliabilityPlans = Object.entries(plans).map(([key, plan]) => {
		const [reqIdStr, sampleIdxStr] = key.split('-sample-');
		const sampleIdx = parseInt(sampleIdxStr, 10);

		const request = requests.find(r => String(r.id) === String(reqIdStr));

		const masterTestType = testTypes.find(t => String(t.id) === String(plan.testTypeId));
		const testType = masterTestType || request?.testType || plan.requestTestType || null;

		const testCategory = testCategories.find(c => String(c.id) === String(plan.testCategoryId));
		const protocol = testProtocols.find(p => String(p.id) === String(plan.testProtocolId));

		const testTypeName = String(testType?.name || '').toLowerCase();

		const isReliability = testTypeName.includes('reliability');
		const isNabl = testTypeName.includes('nabl');
		const isFilled = !!savedReports[key];

		return {
			key,
			plan,
			request,
			sampleIndex: sampleIdx,
			testType,
			testCategory,
			protocol,
			isReliability,
			isNabl,
			isFilled,
			testTypeName
		};
	}).filter(item => {
		const requestStatus = (item.request?.status || '').toUpperCase();
		const evaluationStatus = (item.plan?.evaluationStatus || '').toUpperCase();

		const isActiveTestingRequest = [
			'UNDER_TEST',
			'UNDER_TESTING'
		].includes(requestStatus);

		const isNotEvaluated = ![
			'PASSED',
			'FAILED'
		].includes(evaluationStatus);

		const departmentAllowed = currentEngineerIsNabl
			? item.isNabl
			: !item.isNabl;

		return (
			item.request &&
			isActiveTestingRequest &&
			!item.isReliability &&
			isNotEvaluated &&
			departmentAllowed
		);
	});

	const filteredPlans = nonReliabilityPlans.filter(item => {
		const q = searchQuery.toLowerCase();

		const matchesSearch =
			item.request.brandName.toLowerCase().includes(q) ||
			item.request.modelNo.toLowerCase().includes(q) ||
			(item.testType?.name || '').toLowerCase().includes(q) ||
			(item.request.requestId || `REQ-${item.request.id}`).toLowerCase().includes(q);

		const matchesReportStatus =
			reportStatusFilter === 'ALL' ||
			(reportStatusFilter === 'PENDING' && !item.isFilled) ||
			(reportStatusFilter === 'FILLED' && item.isFilled);

		return matchesSearch && matchesReportStatus;
	});

	const handleSubmitReport = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!planKey || !plans[planKey]) return;

		const plan = plans[planKey];
		const [reqIdStr, sampleIdxStr] = planKey.split('-sample-');
		const sampleIdx = parseInt(sampleIdxStr, 10);

		if (!reportForm.observationResults.trim()) {
			toast.error('Please fill in Observation / Results.');
			return;
		}

		try {
			const formData = new FormData();

			formData.append('sampleIndex', String(sampleIdx));
			formData.append('testPlanId', String(plan.id));
			formData.append('allottedId', plan.allottedId || `REQ-${reqIdStr}-S${String(sampleIdx + 1).padStart(2, '0')}`);
			formData.append('remarks', reportForm.observationResults);
			formData.append('status', 'UNDER_REVIEW');

			const checksPayload = {
				specifiedRequirement: reportForm.specifiedRequirement,
				eqName: reportForm.eqName,
				eqMake: reportForm.eqMake,
				eqModel: reportForm.eqModel,
				eqCalibration: reportForm.eqCalibration
			};

			formData.append('checks', JSON.stringify(checksPayload));

			reportForm.specimenImages.forEach((img, index) => {
				if (typeof img === 'string' && img.startsWith('data:')) {
					const match = img.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

					if (!match) return;

					const mimeType = match[1];
					const base64Data = match[2];
					const byteString = atob(base64Data);
					const bytes = new Uint8Array(byteString.length);

					for (let i = 0; i < byteString.length; i++) {
						bytes[i] = byteString.charCodeAt(i);
					}

					const ext = mimeType.split('/')[1] || 'png';

					formData.append(
						'images',
						new File([bytes], `report-image-${index + 1}.${ext}`, { type: mimeType })
					);
				}
			});

			await saveSampleReport(reqIdStr, formData)();

			if (onUpdateStatus) {
				await onUpdateStatus(reqIdStr, 'UNDER_TESTING', undefined);
			}

			if (plan.stationNo && plan.platformNos && plan.platformNos.length > 0) {
				try {
					const relPlatOp = releasePlatforms(Number(plan.stationNo), plan.platformNos.map(Number));
					await relPlatOp();
				} catch (platErr) {
					console.error('Failed to release platforms:', platErr);
				}
			}

			if (plan.equipmentId) {
				try {
					const relEqOp = releaseEquipment(Number(plan.equipmentId));
					await relEqOp();
				} catch (eqErr) {
					console.error('Failed to release equipment:', eqErr);
				}
			}

			toast.success('Test Report submitted successfully!');
			navigate('/engineer/test-report');
		} catch (error) {
			console.error('Failed to submit test report:', error);
			toast.error('Failed to submit test report.');
		}
	};

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center py-20 space-y-4">
				<div className="w-12 h-12 border-4 border-indigo-700 border-t-transparent rounded-full animate-spin"></div>
				<p className="text-zinc-550 text-xs font-semibold">Loading Test Report Queue...</p>
			</div>
		);
	}

	if (planKey && plans[planKey]) {
		const plan = plans[planKey];
		const [reqIdStr] = planKey.split('-sample-');
		const request = requests.find(r => String(r.id) === String(reqIdStr));
		const category = testCategories.find(c => String(c.id) === String(plan.testCategoryId));
		const isSubmitted = plan.reportSubmitted || !!savedReports[planKey];

		return (
			<div className="space-y-6">
				<div className="flex items-center gap-3 border-b border-zinc-200 pb-4">
					<button
						onClick={() => navigate('/engineer/test-report')}
						className="w-9 h-9 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-555 hover:text-zinc-850 hover:shadow-sm transition-all cursor-pointer outline-none"
					>
						<ArrowLeft className="w-4 h-4 shrink-0" />
					</button>

					<div>
						<h3 className="text-base font-extrabold text-zinc-900 tracking-tight leading-none">
							{isSubmitted ? 'View Test Report' : 'Fill Out Test Report'}
						</h3>
						<span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
							{request?.requestId || `REQ-${reqIdStr}`} • Sample #{parseInt(planKey.split('-sample-')[1]) + 1} Allotment
						</span>
					</div>
				</div>

				<form onSubmit={handleSubmitReport} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
					<div className="lg:col-span-2 space-y-6">
						<div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
							<h4 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider border-b border-zinc-150 pb-2">
								Test Details
							</h4>

							<div className="flex flex-col gap-1">
								<label className="text-[10px] text-zinc-400 font-extrabold uppercase">Test Name</label>
								<input
									type="text"
									value={category?.name || 'N/A'}
									disabled
									className="bg-zinc-100 border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-600 font-semibold outline-none cursor-not-allowed opacity-80"
								/>
							</div>

							<div className="flex flex-col gap-1">
								<label className="text-[10px] text-zinc-400 font-extrabold uppercase">Test Method</label>
								<input
									type="text"
									value={request?.testMethodRef || 'N/A'}
									disabled
									className="bg-zinc-100 border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-600 font-semibold outline-none cursor-not-allowed opacity-80"
								/>
							</div>

							<div className="flex flex-col gap-1">
								<label className="text-[10px] text-zinc-400 font-extrabold uppercase">Specified Requirements</label>
								<textarea
									rows={3}
									placeholder="Enter specified requirements or judgement criteria..."
									disabled={isSubmitted}
									value={reportForm.specifiedRequirement}
									onChange={e => setReportForm({ ...reportForm, specifiedRequirement: e.target.value })}
									className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs text-zinc-800 font-semibold outline-none focus:border-[#11236a] resize-none focus:bg-white transition-all disabled:opacity-75 disabled:cursor-not-allowed"
								/>
							</div>

							<div className="flex flex-col gap-1">
								<label className="text-[10px] text-[#11236a] font-black uppercase">Observation / Result *</label>
								<textarea
									rows={4}
									required
									placeholder="Describe the physical parameters observed, stress test outcomes, time intervals, or failure reasons..."
									disabled={isSubmitted}
									value={reportForm.observationResults}
									onChange={e => setReportForm({ ...reportForm, observationResults: e.target.value })}
									className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs text-zinc-800 font-semibold outline-none focus:border-[#11236a] resize-none focus:bg-white transition-all disabled:opacity-75 disabled:cursor-not-allowed"
								/>
							</div>

							<div className="flex flex-col gap-2">
								<label className="text-[10px] text-zinc-400 font-extrabold uppercase">Test Specimen Pictures</label>

								{!isSubmitted && (
									<label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-zinc-200 hover:border-[#11236a] rounded-xl p-5 cursor-pointer hover:bg-zinc-50 transition-all bg-zinc-50/50">
										<Upload className="w-5 h-5 text-zinc-400" />
										<span className="text-[11px] text-zinc-500 font-semibold">Click to upload multiple images</span>
										<input
											type="file"
											multiple
											accept="image/*"
											onChange={handleSpecimenImagesChange}
											className="hidden"
										/>
									</label>
								)}

								{reportForm.specimenImages.length > 0 && (
									<div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-2">
										{reportForm.specimenImages.map((src, idx) => (
											<div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200 group">
												<img src={src} alt={`specimen-${idx}`} className="w-full h-full object-cover" />

												{!isSubmitted && (
													<button
														type="button"
														onClick={() => removeSpecimenImage(idx)}
														className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer border-none outline-none"
													>
														<Trash2 className="w-4 h-4" />
													</button>
												)}
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</div>

					<div className="space-y-6 col-span-1">
						<div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4 font-bold text-xs text-zinc-800">
							<h4 className="text-[10px] font-extrabold text-[#11236a] uppercase tracking-wider border-b border-zinc-150 pb-2">
								Sample Details
							</h4>

							<div className="space-y-3">
								<div>
									<span className="text-[9px] text-zinc-400 font-bold block uppercase">Manufacturer & Model</span>
									<span className="text-zinc-900 font-extrabold">{request?.brandName} — {request?.modelNo}</span>
								</div>

								<div>
									<span className="text-[9px] text-zinc-400 font-bold block uppercase">Test Description</span>
									<span className="text-zinc-900 font-extrabold">{category?.name || 'N/A'}</span>
								</div>

								<div>
									<span className="text-[9px] text-zinc-400 font-bold block uppercase">Allotted ID</span>
									<span className="text-[#11236a] font-black">
										{plan.allottedId || `REQ-${reqIdStr}-S${String(parseInt(planKey.split('-sample-')[1]) + 1).padStart(2, '0')}`}
									</span>
								</div>

								<div>
									<span className="text-[9px] text-zinc-400 font-bold block uppercase">Testing Station</span>
									<span className="text-zinc-900 font-extrabold">
										{plan.stationNo ? `Station S${plan.stationNo}` : 'N/A'}
									</span>
								</div>
							</div>
						</div>

						<div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-3">
							<h4 className="text-[10px] font-extrabold text-[#11236a] uppercase tracking-wider border-b border-zinc-150 pb-2">
								Equipment Calibration Details
							</h4>

							{[
								{ label: 'Equipment Name', value: reportForm.eqName },
								{ label: 'Make', value: reportForm.eqMake },
								{ label: 'Model', value: reportForm.eqModel },
								{ label: 'Calibration Due', value: reportForm.eqCalibration },
							].map(({ label, value }) => (
								<div key={label}>
									<span className="text-[9px] text-zinc-400 font-bold block uppercase">{label}</span>
									<span className="text-xs font-bold text-zinc-800">{value || 'N/A'}</span>
								</div>
							))}
						</div>

						<div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
							<h4 className="text-[10px] font-extrabold text-[#11236a] uppercase tracking-wider border-b border-zinc-150 pb-2">
								{isSubmitted ? 'Report Submitted' : 'Submit Test Report'}
							</h4>

							<div className="pt-1 space-y-3">
								{!isSubmitted ? (
									<button
										type="submit"
										className="w-full py-3 bg-[#11236a] hover:bg-[#0c1a52] text-white text-xs font-black rounded-xl transition-all cursor-pointer border-none outline-none flex items-center justify-center gap-1.5 shadow-md active:scale-95"
									>
										<CheckCircle className="w-4 h-4" />
										<span>Submit Test Report</span>
									</button>
								) : (
									<div className="w-full py-3 bg-emerald-600 text-white text-xs font-black rounded-xl text-center flex items-center justify-center gap-1.5">
										<CheckCircle className="w-4 h-4" />
										<span>Report Already Submitted</span>
									</div>
								)}

								<button
									type="button"
									onClick={() => navigate('/engineer/test-report')}
									className="w-full py-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-250 text-zinc-650 text-xs font-bold rounded-xl transition-all cursor-pointer outline-none active:scale-95"
								>
									Cancel
								</button>
							</div>
						</div>
					</div>
				</form>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="bg-white border border-zinc-200/50 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
				<div className="relative w-full lg:max-w-xs">
					<Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
					<input
						type="text"
						placeholder="Search by brand, request, test..."
						value={searchQuery}
						onChange={e => setSearchQuery(e.target.value)}
						className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-zinc-850 placeholder-zinc-400 outline-none focus:bg-white focus:border-[#11236a]"
					/>
				</div>

				<div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
					<div className="flex items-center gap-1.5">
						<span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
							Report Status:
						</span>

						<CustomSelect
							value={reportStatusFilter}
							onChange={setReportStatusFilter}
							options={[
								{ value: 'ALL', label: 'All Reports' },
								{ value: 'PENDING', label: 'Pending to Fill' },
								{ value: 'FILLED', label: 'Filled / Submitted' }
							]}
							className="w-44"
						/>
					</div>

					{(searchQuery || reportStatusFilter !== 'ALL') && (
						<button
							type="button"
							onClick={() => {
								setSearchQuery('');
								setReportStatusFilter('ALL');
							}}
							className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/50 px-3 py-2 rounded-xl cursor-pointer transition-all"
						>
							Clear
						</button>
					)}
				</div>
			</div>

			<div className="bg-white border border-zinc-200/60 rounded-3xl p-6 shadow-sm">
				<div className="flex items-center gap-3 mb-6">
					<div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
						<FileText className="w-5 h-5" />
					</div>

					<div>
						<h2 className="text-base font-bold text-zinc-900 leading-tight">
							{currentEngineerIsNabl ? 'NABL Test Reports Queue' : 'General Test Reports Queue'}
						</h2>
						<p className="text-xs text-zinc-500 font-medium">
							{currentEngineerIsNabl
								? 'Only NABL test report forms are available for your department.'
								: 'NABL and Reliability plans are hidden for your department.'}
						</p>
					</div>
				</div>

				{filteredPlans.length === 0 ? (
					<div className="text-center py-16 border-2 border-dashed border-zinc-200 rounded-2xl">
						<Clipboard className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
						<h4 className="text-sm font-bold text-zinc-800">No active test plans found</h4>
						<p className="text-xs text-zinc-500 font-light mt-1 max-w-sm mx-auto">
							No matching test plans are active for your department or all visible plans are evaluated.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{filteredPlans.map(item => (
							<div
								key={item.key}
								onClick={() => navigate('/engineer/test-report/' + item.key)}
								className="border border-zinc-200 hover:border-indigo-650 hover:shadow-md hover:bg-slate-50/50 rounded-2xl p-5 transition-all cursor-pointer flex flex-col justify-between"
							>
								<div className="space-y-3">
									<div className="flex justify-between items-start">
										<div>
											<span className="text-[9px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-extrabold uppercase">
												{item.testType?.name || 'General Test'}
											</span>

											<h4 className="text-sm font-black text-zinc-900 mt-1.5 leading-none">
												{item.request.brandName} - {item.request.modelNo}
											</h4>
										</div>

										<div className="flex flex-col items-end gap-1.5">
											<span className="text-xs text-zinc-400 font-extrabold uppercase bg-zinc-100 px-2 py-0.5 rounded">
												Sample #{item.sampleIndex + 1}
											</span>

											<span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${item.isFilled
												? 'bg-emerald-50 text-emerald-700 border-emerald-100'
												: 'bg-amber-50 text-amber-805 border-amber-100 animate-pulse'
												}`}>
												{item.isFilled ? 'Report Submitted' : 'Pending Submission'}
											</span>
										</div>
									</div>

									<p className="text-xs text-zinc-555 line-clamp-1">
										Category: {item.testCategory?.name || 'Stress Verification'}
									</p>

									<div className="grid grid-cols-2 gap-2 border-t border-zinc-100 pt-3 text-[11px] font-bold text-zinc-650">
										<div>
											<span className="text-zinc-450 block font-semibold text-[9px] uppercase">Request ID</span>
											<span className="text-zinc-900">{item.request.requestId || 'REQ-' + item.request.id}</span>
										</div>

										<div>
											<span className="text-zinc-450 block font-semibold text-[9px] uppercase">Allotted Code</span>
											<span className="text-zinc-900 truncate block">
												{'REQ-' + item.request.id + '-S' + String(item.sampleIndex + 1).padStart(2, '0')}
											</span>
										</div>

										<div>
											<span className="text-zinc-450 block font-semibold text-[9px] uppercase">Station Unit</span>
											<span>{'S' + item.plan.stationNo + ' (Platforms: ' + (item.plan.platformNos?.join(', ') || 'None') + ')'}</span>
										</div>

										<div>
											<span className="text-zinc-450 block font-semibold text-[9px] uppercase">Period</span>
											<span>{item.plan.startDate + ' to ' + item.plan.endDate}</span>
										</div>
									</div>
								</div>

								<div className="flex items-center gap-2 mt-4 text-xs font-extrabold text-[#11236a] hover:underline justify-end pt-1">
									<span>{item.isFilled ? 'View Submitted Report' : 'Fill Test Report form'}</span>
									<ChevronRight className="w-4 h-4" />
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}