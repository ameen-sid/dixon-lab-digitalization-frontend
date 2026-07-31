import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../layouts/DashboardLayout';
import Pagination from '../../components/Pagination';
import CustomSelect from '../../components/CustomSelect';
import { getNablRequests, createNablRequest } from '../../services/operations/nablRequestService';
import { getTestTypes } from '../../services/operations/testTypeService';
import {
	Plus, RotateCw, FileText, Search, ChevronLeft, Send, Upload, X, CheckCircle, Edit3, Eye
} from 'lucide-react';

interface RequestRecord {
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
	status: string;
	createdAt: string;
	customerSignName?: string | null;
	attachments?: { id: number; fileName: string; filePath: string; fileSize: number }[];
	testType?: { id: number; name: string } | null;
}

export default function NablManagerRequests() {
	const navigate = useNavigate();

	// Auth check
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

	// Page states
	const [requests, setRequests] = useState<RequestRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState('ALL');
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(20);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [showPreview, setShowPreview] = useState(false);
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

	// Form inputs state
	const [formInput, setFormInput] = useState({
		customerNameAddress: '',
		manufacturerNameAddress: '',
		customerContactDetails: '',
		sampleDescription: '',
		modelNo: '',
		familyModel: '',
		serialNumber: '',
		productRating: '',
		sampleQty: 1,
		brandName: '',
		attachmentMention: '',
		witnessRequired: 'No',
		witnessPersonDetails: '',
		testMethodRef: '',
		conformityStatement: 'not Required',
		decisionRule: 'As per standard',
		collectBack: 'Yes',
		testTypeId: '',
		reportNablLogo: 'Yes',
		customerSignName: ''
	});

	const fetchDashboardData = async () => {
		setLoading(true);
		try {
			// Fetch NABL requests
			const allReqs = await getNablRequests()();
			setRequests(allReqs || []);

			// Fetch test types
			const types = await getTestTypes()();

			// Find "NABL Test" type and auto-select its ID in formInput
			if (types && Array.isArray(types)) {
				const nablType = types.find((t: any) => t.name === 'NABL Test');
				if (nablType) {
					setFormInput(prev => ({ ...prev, testTypeId: String(nablType.id) }));
				}
			}
		} catch (error) {
			console.error('Failed to load NABL manager requests:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (token && userStr) {
			fetchDashboardData();
		}
	}, [token, userStr]);

	const handleRefresh = async () => {
		await fetchDashboardData();
		toast.success('Requests synchronized successfully.');
	};

	// File attachments handlers
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const filesArray = Array.from(e.target.files);
			setSelectedFiles((prev) => [...prev, ...filesArray]);
		}
	};

	const removeFile = (index: number) => {
		setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
	};

	const handleOpenFile = (file: File) => {
		try {
			const fileUrl = URL.createObjectURL(file);
			window.open(fileUrl, '_blank');
		} catch (error) {
			console.error('Failed to open file:', error);
		}
	};

	const handleFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formInput.testTypeId) {
			toast.error('Please select a Test Type.');
			return;
		}
		setShowPreview(true);
	};

	// Submission to backend
	const handleFinalConfirm = async () => {
		try {
			const formData = new FormData();

			// Append all form inputs
			Object.keys(formInput).forEach((key) => {
				const val = (formInput as any)[key];
				if (key === 'testTypeId' && (val === '' || val === null || val === undefined)) {
					return;
				}
				formData.append(key, String(val));
			});

			// Bypass request ID generation
			formData.append('generateRequestId', 'false');

			// Append multiple files of multiple types
			selectedFiles.forEach((file) => {
				formData.append('files', file);
			});

			await createNablRequest(formData)();

			// Reset states
			setShowCreateForm(false);
			setShowPreview(false);
			setSelectedFiles([]);
			setFormInput({
				customerNameAddress: '',
				manufacturerNameAddress: '',
				customerContactDetails: '',
				sampleDescription: '',
				modelNo: '',
				familyModel: '',
				serialNumber: '',
				productRating: '',
				sampleQty: 1,
				brandName: '',
				attachmentMention: '',
				witnessRequired: 'No',
				witnessPersonDetails: '',
				testMethodRef: '',
				conformityStatement: 'not Required',
				decisionRule: 'As per standard',
				collectBack: 'Yes',
				testTypeId: formInput.testTypeId,
				reportNablLogo: 'Yes',
				customerSignName: ''
			});

			await fetchDashboardData();
		} catch (error) {
			console.error('Failed to create NABL request:', error);
		}
	};

	// Filtered & Paginated requests based on search and status filter
	const filteredRequests = requests.filter(r => {
		const matchesSearch = 
			(r.brandName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
			(r.modelNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
			(r.sampleDescription || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
			(r.customerSignName || '').toLowerCase().includes(searchTerm.toLowerCase());

		if (!matchesSearch) return false;
		if (statusFilter === 'ALL') return true;

		const s = (r.status || '').toUpperCase();
		if (statusFilter === 'REQUEST_GENERATED') return s === 'REQUEST_GENERATED';
		if (statusFilter === 'UNDER_TESTING') return s === 'UNDER_TESTING' || s === 'UNDER_TEST';
		if (statusFilter === 'COMPLETED') return ['COMPLETED', 'FAILED', 'PASS', 'FAIL'].includes(s);

		return true;
	});

	const paginatedRequests = filteredRequests.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	// Status badge mapping
	const getStatusBadge = (status: string) => {
		const s = status.toUpperCase();
		if (['COMPLETED', 'TESTING_PASSED', 'PASS'].includes(s)) {
			return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-100 uppercase tracking-wide">Completed</span>;
		}
		if (['FAILED', 'TESTING_FAILED', 'FAIL'].includes(s)) {
			return <span className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-bold border border-rose-100 uppercase tracking-wide">Failed</span>;
		}
		if (['UNDER_TESTING', 'UNDER_TEST'].includes(s)) {
			return <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold border border-amber-100 uppercase tracking-wide animate-pulse">Testing</span>;
		}
		if (['PENDING_APPROVAL', 'PENDING'].includes(s)) {
			return <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold border border-blue-100 uppercase tracking-wide">Pending Approval</span>;
		}
		return <span className="px-2.5 py-1 bg-zinc-50 text-zinc-600 rounded-full text-[10px] font-bold border border-zinc-100 uppercase tracking-wide">{status.replace(/_/g, ' ')}</span>;
	};

	return (
		<DashboardLayout
			title="NABL Requests Registry"
			description="Manage NABL requests queue and submit new laboratory calibration requests."
			activeTab="requests"
		>
			{showCreateForm ? (
				showPreview ? (
					/* Preview Sheet Layout */
					<div className="space-y-6 animate-fade-in">
						<div className="flex items-center">
							<button
								onClick={() => setShowPreview(false)}
								className="text-xs font-bold text-zinc-700 hover:text-zinc-950 flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none transition-colors"
							>
								<ChevronLeft className="w-4 h-4" /> Back to Form Editor
							</button>
						</div>

						{/* Preview Layout Sheet */}
						<div className="bg-white border border-zinc-300 rounded-[32px] shadow-md p-6 max-w-4xl mx-auto space-y-6">
							{/* Form Top Specification Header */}
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
									TEST REQUEST FORM PREVIEW
								</div>
							</div>

							{/* Physical Paper Sheet Mock Table */}
							<div className="border border-zinc-400 rounded-lg overflow-hidden text-xs bg-white divide-y divide-zinc-400">
								{/* Customer Address */}
								<div className="grid grid-cols-12">
									<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
										Name and Address of Customer / Applicant
									</div>
									<div className="col-span-8 p-3 font-bold text-zinc-900 whitespace-pre-wrap leading-relaxed">
										{formInput.customerNameAddress}
									</div>
								</div>

								{/* Manufacturer Address */}
								<div className="grid grid-cols-12">
									<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
										Manufacturer Name and address
									</div>
									<div className="col-span-8 p-3 font-bold text-zinc-900 whitespace-pre-wrap leading-relaxed">
										{formInput.manufacturerNameAddress}
									</div>
								</div>

								{/* Contact Details */}
								<div className="grid grid-cols-12">
									<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
										Contact Details of Customer / Applicant
									</div>
									<div className="col-span-8 p-3 font-bold text-zinc-900 whitespace-pre-wrap leading-relaxed">
										{formInput.customerContactDetails}
									</div>
								</div>

								{/* Sample Description */}
								<div className="grid grid-cols-12">
									<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
										Sample Description
									</div>
									<div className="col-span-8 p-3 font-bold text-zinc-900 whitespace-pre-wrap leading-relaxed">
										{formInput.sampleDescription}
									</div>
								</div>

								{/* Model No */}
								<div className="grid grid-cols-12">
									<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
										Model No. / Identification
									</div>
									<div className="col-span-8 p-3 font-bold text-zinc-900">
										{formInput.modelNo}
									</div>
								</div>

								{/* Family Model */}
								<div className="grid grid-cols-12">
									<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
										Family Model (If Any)
									</div>
									<div className="col-span-8 p-3 font-bold text-zinc-900">
										{formInput.familyModel || 'NA'}
									</div>
								</div>

								{/* Product Serial Number */}
								<div className="grid grid-cols-12">
									<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
										Product Serial Number (If any)
									</div>
									<div className="col-span-8 p-3 font-bold text-zinc-900">
										{formInput.serialNumber || 'NA'}
									</div>
								</div>

								{/* Product Rating */}
								<div className="grid grid-cols-12">
									<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
										Product Rating
									</div>
									<div className="col-span-8 p-3 font-bold text-zinc-900 whitespace-pre-wrap leading-relaxed">
										{formInput.productRating}
									</div>
								</div>

								{/* Sample Qty */}
								<div className="grid grid-cols-12">
									<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
										Sample Qty.
									</div>
									<div className="col-span-8 p-3 font-bold text-zinc-900">
										{formInput.sampleQty}
									</div>
								</div>

								{/* Brand */}
								<div className="grid grid-cols-12">
									<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
										Trade Mark / Brand
									</div>
									<div className="col-span-8 p-3 font-bold text-zinc-900">
										{formInput.brandName}
									</div>
								</div>

								{/* Drawings attachments details */}
								<div className="grid grid-cols-12">
									<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
										Drawing / Specification /any attachment (Please mention)
									</div>
									<div className="col-span-8 p-3 font-bold text-zinc-900">
										{formInput.attachmentMention || 'User manual provided'}
									</div>
								</div>

								{/* Witness Required */}
								<div className="grid grid-cols-12">
									<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
										Witness Required
									</div>
									<div className="col-span-8 p-3 bg-white flex items-center gap-6">
										<div className="flex items-center gap-2 font-bold">
											<span className={`w-3.5 h-3.5 border border-zinc-550 flex items-center justify-center font-black ${formInput.witnessRequired === 'Yes' ? 'bg-[#11236a] text-white text-[8px]' : ''}`}>
												{formInput.witnessRequired === 'Yes' && '✓'}
											</span>
											Yes
										</div>
										<div className="flex items-center gap-2 font-bold">
											<span className={`w-3.5 h-3.5 border border-zinc-550 flex items-center justify-center font-black ${formInput.witnessRequired === 'No' ? 'bg-[#11236a] text-white text-[8px]' : ''}`}>
												{formInput.witnessRequired === 'No' && '✓'}
											</span>
											No
										</div>
									</div>
								</div>

								{/* Witness Designation */}
								<div className="grid grid-cols-12">
									<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
										Name and designation of person who will witness the test
									</div>
									<div className="col-span-8 p-3 font-bold text-zinc-900">
										{formInput.witnessRequired === 'Yes' ? formInput.witnessPersonDetails : 'NA'}
									</div>
								</div>

								{/* Test Method */}
								<div className="grid grid-cols-12">
									<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
										Ref. Test Method/ Specification’s
									</div>
									<div className="col-span-8 p-3 font-bold text-zinc-900 leading-relaxed">
										{formInput.testMethodRef}
									</div>
								</div>

								{/* Statement of Conformity */}
								<div className="grid grid-cols-12">
									<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
										Statement of conformity:
									</div>
									<div className="col-span-8 p-3 space-y-2">
										<div className="flex items-center gap-6">
											<div className="flex items-center gap-2 font-bold">
												<span className={`w-3.5 h-3.5 border border-zinc-550 flex items-center justify-center font-black ${formInput.conformityStatement === 'Required' ? 'bg-[#11236a] text-white text-[8px]' : ''}`}>
													{formInput.conformityStatement === 'Required' && '✓'}
												</span>
												Required
											</div>
											<div className="flex items-center gap-2 font-bold">
												<span className={`w-3.5 h-3.5 border border-zinc-550 flex items-center justify-center font-black ${formInput.conformityStatement === 'not Required' ? 'bg-[#11236a] text-white text-[8px]' : ''}`}>
													{formInput.conformityStatement === 'not Required' && '✓'}
												</span>
												Not-Required
											</div>
										</div>

										{formInput.conformityStatement === 'Required' && (
											<div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 space-y-1.5 font-bold">
												<p className="text-[10px] text-zinc-450 uppercase">Decision Rule choice:</p>
												<div className="text-zinc-900 leading-relaxed text-[11px]">
													{formInput.decisionRule === 'Measurement of uncertainty' && '(A) Measurement of uncertainty'}
													{formInput.decisionRule === 'As per standard' && '(B) As per standard'}
													{formInput.decisionRule === 'As per customer specification, if better than standards' && '(C) As per customer specification, if better than standards'}
												</div>
											</div>
										)}
									</div>
								</div>

								{/* Report with NABL Logo */}
								<div className="grid grid-cols-12">
									<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
										Report Required with NABL logo
									</div>
									<div className="col-span-8 p-3 bg-white flex items-center gap-6">
										<div className="flex items-center gap-2 font-bold">
											<span className={`w-3.5 h-3.5 border border-zinc-550 flex items-center justify-center font-black ${formInput.reportNablLogo === 'Yes' ? 'bg-[#11236a] text-white text-[8px]' : ''}`}>
												{formInput.reportNablLogo === 'Yes' && '✓'}
											</span>
											Yes
										</div>
										<div className="flex items-center gap-2 font-bold">
											<span className={`w-3.5 h-3.5 border border-zinc-550 flex items-center justify-center font-black ${formInput.reportNablLogo === 'No' ? 'bg-[#11236a] text-white text-[8px]' : ''}`}>
												{formInput.reportNablLogo === 'No' && '✓'}
											</span>
											No
										</div>
									</div>
								</div>

								{/* Collected Back */}
								<div className="grid grid-cols-12">
									<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
										Whether sample will be collected back (not applicable for destructive test)
									</div>
									<div className="col-span-8 p-3 space-y-2">
										<div className="flex items-center gap-6">
											<div className="flex items-center gap-2 font-bold">
												<span className={`w-3.5 h-3.5 border border-zinc-550 flex items-center justify-center font-black ${formInput.collectBack === 'Yes' ? 'bg-[#11236a] text-white text-[8px]' : ''}`}>
													{formInput.collectBack === 'Yes' && '✓'}
												</span>
												Yes
											</div>
											<div className="flex items-center gap-2 font-bold">
												<span className={`w-3.5 h-3.5 border border-zinc-550 flex items-center justify-center font-black ${formInput.collectBack === 'No' ? 'bg-[#11236a] text-white text-[8px]' : ''}`}>
													{formInput.collectBack === 'No' && '✓'}
												</span>
												No
											</div>
										</div>
										<p className="text-[10px] text-zinc-500 font-bold leading-normal">
											If yes, please collect within 15 days from the date of issuing the test report. After this period, the sample will be destroyed.
										</p>
									</div>
								</div>

								{/* Signature Name */}
								<div className="grid grid-cols-12">
									<div className="col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 border-r border-zinc-400 flex items-center">
										Customer Name & Signature:
									</div>
									<div className="col-span-8 p-3 bg-white flex items-center">
										<span className="font-extrabold text-[#11236a] italic text-xs tracking-wide">
											{formInput.customerSignName}
										</span>
									</div>
								</div>
							</div>

							{/* Attached Files List */}
							{selectedFiles.length > 0 && (
								<div className="space-y-4 pt-4 border-t border-zinc-200">
									<h4 className="text-xs font-extrabold text-[#11236a] uppercase tracking-wider">Specifications & Manuals Attachments ({selectedFiles.length})</h4>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										{selectedFiles.map((file, idx) => (
											<div
												key={idx}
												onClick={() => handleOpenFile(file)}
												className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 shadow-sm cursor-pointer hover:bg-zinc-100 hover:border-indigo-300 transition-all group"
											>
												<FileText className="w-5 h-5 text-[#11236a] group-hover:text-indigo-650 shrink-0 transition-colors" />
												<div className="overflow-hidden">
													<p className="text-xs font-bold text-zinc-955 truncate leading-none mb-1 group-hover:underline group-hover:text-indigo-650 transition-colors">{file.name}</p>
													<span className="text-[10px] text-zinc-555 font-semibold">Size: {(file.size / 1024).toFixed(1)} KB</span>
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Final Confirmation Buttons */}
							<div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
								<button
									type="button"
									onClick={() => setShowPreview(false)}
									className="px-4 py-2.5 border border-zinc-200 text-zinc-700 rounded-xl text-xs font-bold bg-white hover:bg-zinc-50 cursor-pointer active:scale-95 transition-all outline-none flex items-center gap-1.5"
								>
									<Edit3 className="w-3.5 h-3.5 text-zinc-700" /> Edit Form
								</button>
								<button
									type="button"
									onClick={handleFinalConfirm}
									className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer active:scale-95 transition-all border-none outline-none flex items-center gap-1.5 shadow-sm"
								>
									<CheckCircle className="w-4 h-4" /> Submit Request
								</button>
							</div>
						</div>
					</div>
				) : (
					/* Request Form Editor Layout */
					<div className="space-y-6 animate-fade-in">
						<div className="flex items-center">
							<button
								onClick={() => setShowCreateForm(false)}
								className="text-xs font-bold text-zinc-700 hover:text-zinc-955 flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none transition-colors"
							>
								<ChevronLeft className="w-4 h-4" /> Back to List
							</button>
						</div>

						{/* Form Sheet Card */}
						<div className="bg-white border border-zinc-200/60 rounded-3xl shadow-md p-6 max-w-4xl mx-auto">
							{/* Document top table header */}
							<div className="border border-zinc-400 rounded-lg overflow-hidden text-xs mb-6 bg-white">
								<div className="grid grid-cols-12">
									<div className="col-span-12 md:col-span-6 border-r border-zinc-400 p-6 flex flex-col justify-center items-start bg-white">
										<div className="flex flex-col items-start pl-6">
											<span className="text-5xl font-black text-[#121c60] tracking-tight relative leading-none select-none font-sans">
												D<span className="relative inline-block text-5xl">ı<span className="absolute top-[6px] left-[1px] w-[8px] h-[8px] bg-[#df1d24] rounded-none"></span></span>xon
											</span>
											<span className="text-xs font-normal text-[#121c60] tracking-tight mt-1 select-none font-sans">
												The brand behind brands
											</span>
										</div>
									</div>

									<div className="col-span-12 md:col-span-6 p-6 flex flex-col justify-center items-center text-center bg-white font-extrabold text-[#121c60] leading-tight select-none">
										<span className="text-sm uppercase tracking-wider font-extrabold">PERFORMANCE & SAFETY LAB,</span>
										<span className="text-sm uppercase tracking-wider mt-1 font-extrabold">DIXON TECHNOLOGIES (INDIA) LIMITED</span>
									</div>
								</div>

								<div className="bg-[#11236a] text-white text-center py-2.5 font-extrabold uppercase tracking-widest text-[10px] border-t border-zinc-400">
									TEST REQUEST FORM
								</div>
							</div>

							<form onSubmit={handleFormSubmit} className="space-y-6">
								{/* Main Form Fields structured as physical table rows */}
								<div className="border border-zinc-400 rounded-lg overflow-hidden text-xs bg-white divide-y divide-zinc-400">

									{/* Customer Name & Address */}
									<div className="grid grid-cols-12 min-h-[80px]">
										<div className="col-span-12 md:col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 md:border-r border-zinc-400 flex items-center">
											Name and Address of Customer / Applicant <span className="text-rose-500 font-extrabold ml-1">*</span>
										</div>
										<div className="col-span-12 md:col-span-8 p-1 bg-white">
											<textarea
												required
												rows={3}
												placeholder="Enter Customer company name and complete registration address"
												value={formInput.customerNameAddress}
												onChange={(e) => setFormInput({ ...formInput, customerNameAddress: e.target.value })}
												className="w-full h-full p-2 border-none outline-none resize-none font-bold text-zinc-900 bg-transparent text-xs placeholder-zinc-400"
											/>
										</div>
									</div>

									{/* Manufacturer Name & Address */}
									<div className="grid grid-cols-12 min-h-[80px]">
										<div className="col-span-12 md:col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 md:border-r border-zinc-400 flex items-center">
											Manufacturer Name and address <span className="text-rose-500 font-extrabold ml-1">*</span>
										</div>
										<div className="col-span-12 md:col-span-8 p-1 bg-white">
											<textarea
												required
												rows={3}
												placeholder="Enter Manufacturer facility name and physical layout location details"
												value={formInput.manufacturerNameAddress}
												onChange={(e) => setFormInput({ ...formInput, manufacturerNameAddress: e.target.value })}
												className="w-full h-full p-2 border-none outline-none resize-none font-bold text-zinc-900 bg-transparent text-xs placeholder-zinc-400"
											/>
										</div>
									</div>

									{/* Contact Details */}
									<div className="grid grid-cols-12 min-h-[60px]">
										<div className="col-span-12 md:col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 md:border-r border-zinc-400 flex items-center">
											Contact Details of Customer / Applicant <span className="text-rose-500 font-extrabold ml-1">*</span>
										</div>
										<div className="col-span-12 md:col-span-8 p-1 bg-white">
											<textarea
												required
												rows={2}
												placeholder="e.g. Mr. John Doe, Email: john.doe@example.com, Contact: +91 9876543210"
												value={formInput.customerContactDetails}
												onChange={(e) => setFormInput({ ...formInput, customerContactDetails: e.target.value })}
												className="w-full h-full p-2 border-none outline-none resize-none font-bold text-zinc-900 bg-transparent text-xs placeholder-zinc-400"
											/>
										</div>
									</div>

									{/* Sample Description */}
									<div className="grid grid-cols-12 min-h-[50px]">
										<div className="col-span-12 md:col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 md:border-r border-zinc-400 flex items-center">
											Sample Description <span className="text-rose-500 font-extrabold ml-1">*</span>
										</div>
										<div className="col-span-12 md:col-span-8 p-1 bg-white">
											<textarea
												required
												rows={2}
												placeholder="e.g. Fully Automatic Top Load Washing Machine"
												value={formInput.sampleDescription}
												onChange={(e) => setFormInput({ ...formInput, sampleDescription: e.target.value })}
												className="w-full h-full p-2 border-none outline-none resize-none font-bold text-zinc-900 bg-transparent text-xs placeholder-zinc-400"
											/>
										</div>
									</div>

									{/* Model No */}
									<div className="grid grid-cols-12">
										<div className="col-span-12 md:col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 md:border-r border-zinc-400 flex items-center">
											Model No. / Identification <span className="text-rose-500 font-extrabold ml-1">*</span>
										</div>
										<div className="col-span-12 md:col-span-8 p-1 bg-white">
											<input
												type="text"
												required
												placeholder="e.g. T75GDB"
												value={formInput.modelNo}
												onChange={(e) => setFormInput({ ...formInput, modelNo: e.target.value })}
												className="w-full p-2 border-none outline-none font-bold text-zinc-900 bg-transparent text-xs placeholder-zinc-400"
											/>
										</div>
									</div>

									{/* Family Model */}
									<div className="grid grid-cols-12">
										<div className="col-span-12 md:col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 md:border-r border-zinc-400 flex items-center">
											Family Model (If Any)
										</div>
										<div className="col-span-12 md:col-span-8 p-1 bg-white">
											<input
												type="text"
												placeholder="e.g. T75GDB2, T75GDB3"
												value={formInput.familyModel}
												onChange={(e) => setFormInput({ ...formInput, familyModel: e.target.value })}
												className="w-full p-2 border-none outline-none font-bold text-zinc-900 bg-transparent text-xs placeholder-zinc-400"
											/>
										</div>
									</div>

									{/* Product Serial Number */}
									<div className="grid grid-cols-12">
										<div className="col-span-12 md:col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 md:border-r border-zinc-400 flex items-center">
											Product Serial Number (If any)
										</div>
										<div className="col-span-12 md:col-span-8 p-1 bg-white">
											<input
												type="text"
												placeholder="e.g. NA"
												value={formInput.serialNumber}
												onChange={(e) => setFormInput({ ...formInput, serialNumber: e.target.value })}
												className="w-full p-2 border-none outline-none font-bold text-zinc-900 bg-transparent text-xs placeholder-zinc-400"
											/>
										</div>
									</div>

									{/* Product Rating */}
									<div className="grid grid-cols-12 min-h-[50px]">
										<div className="col-span-12 md:col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 md:border-r border-zinc-400 flex items-center">
											Product Rating <span className="text-rose-500 font-extrabold ml-1">*</span>
										</div>
										<div className="col-span-12 md:col-span-8 p-1 bg-white">
											<textarea
												required
												rows={2}
												placeholder="e.g. Rated Capacity: 7.5 Kg, Rated Voltage: 230V, 50Hz, Rated Power Input : 550 W"
												value={formInput.productRating}
												onChange={(e) => setFormInput({ ...formInput, productRating: e.target.value })}
												className="w-full h-full p-2 border-none outline-none resize-none font-bold text-zinc-900 bg-transparent text-xs placeholder-zinc-400"
											/>
										</div>
									</div>

									{/* Sample Qty */}
									<div className="grid grid-cols-12">
										<div className="col-span-12 md:col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 md:border-r border-zinc-400 flex items-center">
											Sample Qty. <span className="text-rose-500 font-extrabold ml-1">*</span>
										</div>
										<div className="col-span-12 md:col-span-8 p-1 bg-white">
											<input
												type="number"
												required
												min="1"
												value={formInput.sampleQty}
												onChange={(e) => setFormInput({ ...formInput, sampleQty: parseInt(e.target.value) || 1 })}
												className="w-full p-2 border-none outline-none font-bold text-zinc-900 bg-transparent text-xs placeholder-zinc-400"
											/>
										</div>
									</div>

									{/* Brand */}
									<div className="grid grid-cols-12">
										<div className="col-span-12 md:col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 md:border-r border-zinc-400 flex items-center">
											Trade Mark / Brand <span className="text-rose-500 font-extrabold ml-1">*</span>
										</div>
										<div className="col-span-12 md:col-span-8 p-1 bg-white">
											<input
												type="text"
												required
												placeholder="dixon"
												value={formInput.brandName}
												onChange={(e) => setFormInput({ ...formInput, brandName: e.target.value })}
												className="w-full p-2 border-none outline-none font-bold text-zinc-900 bg-transparent text-xs placeholder-zinc-400"
											/>
										</div>
									</div>

									{/* Drawings attachments */}
									<div className="grid grid-cols-12">
										<div className="col-span-12 md:col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 md:border-r border-zinc-400 flex items-center">
											Drawing / Specification /any attachment (Please mention)
										</div>
										<div className="col-span-12 md:col-span-8 p-1 bg-white">
											<input
												type="text"
												placeholder="e.g. User manual provided"
												value={formInput.attachmentMention}
												onChange={(e) => setFormInput({ ...formInput, attachmentMention: e.target.value })}
												className="w-full p-2 border-none outline-none font-bold text-zinc-900 bg-transparent text-xs placeholder-zinc-400"
											/>
										</div>
									</div>

									{/* Witness Required */}
									<div className="grid grid-cols-12">
										<div className="col-span-12 md:col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 md:border-r border-zinc-400 flex items-center">
											Witness Required <span className="text-rose-500 font-extrabold ml-1">*</span>
										</div>
										<div className="col-span-12 md:col-span-8 p-3 bg-white flex items-center gap-6">
											<label className="flex items-center gap-2 cursor-pointer font-bold">
												<input
													type="radio"
													name="witnessRequired"
													checked={formInput.witnessRequired === 'Yes'}
													onChange={() => setFormInput({ ...formInput, witnessRequired: 'Yes' })}
													className="w-4 h-4 text-[#11236a] focus:ring-[#11236a]"
												/>
												Yes
											</label>
											<label className="flex items-center gap-2 cursor-pointer font-bold">
												<input
													type="radio"
													name="witnessRequired"
													checked={formInput.witnessRequired === 'No'}
													onChange={() => setFormInput({ ...formInput, witnessRequired: 'No', witnessPersonDetails: '' })}
													className="w-4 h-4 text-[#11236a] focus:ring-[#11236a]"
												/>
												No
											</label>
										</div>
									</div>

									{/* Witness Details */}
									<div className="grid grid-cols-12">
										<div className="col-span-12 md:col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 md:border-r border-zinc-400 flex items-center">
											Name and designation of person who will witness the test
										</div>
										<div className="col-span-12 md:col-span-8 p-1 bg-white">
											<input
												type="text"
												disabled={formInput.witnessRequired === 'No'}
												placeholder={formInput.witnessRequired === 'No' ? 'Witness is not required' : 'Enter name and designation of witness'}
												value={formInput.witnessPersonDetails}
												onChange={(e) => setFormInput({ ...formInput, witnessPersonDetails: e.target.value })}
												className="w-full p-2 border-none outline-none font-bold text-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-400 bg-transparent text-xs placeholder-zinc-400"
											/>
										</div>
									</div>

									{/* Test Method */}
									<div className="grid grid-cols-12">
										<div className="col-span-12 md:col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 md:border-r border-zinc-400 flex items-center">
											Ref. Test Method/ Specification's <span className="text-rose-500 font-extrabold ml-1">*</span>
										</div>
										<div className="col-span-12 md:col-span-8 p-1 bg-white">
											<input
												type="text"
												required
												placeholder="e.g. Performance testing as IEC 60456 and BEE guideline"
												value={formInput.testMethodRef}
												onChange={(e) => setFormInput({ ...formInput, testMethodRef: e.target.value })}
												className="w-full p-2 border-none outline-none font-bold text-zinc-900 bg-transparent text-xs placeholder-zinc-400"
											/>
										</div>
									</div>

									{/* Statement of Conformity */}
									<div className="grid grid-cols-12 min-h-[80px]">
										<div className="col-span-12 md:col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 md:border-r border-zinc-400 flex items-center">
											Statement of conformity: <span className="text-rose-500 font-extrabold ml-1">*</span>
										</div>
										<div className="col-span-12 md:col-span-8 p-3 bg-white space-y-3">
											<div className="flex items-center gap-6">
												<label className="flex items-center gap-2 cursor-pointer font-bold">
													<input
														type="radio"
														name="conformityStatement"
														checked={formInput.conformityStatement === 'Required'}
														onChange={() => setFormInput({ ...formInput, conformityStatement: 'Required' })}
														className="w-4 h-4 text-[#11236a] focus:ring-[#11236a]"
													/>
													Required
												</label>
												<label className="flex items-center gap-2 cursor-pointer font-bold">
													<input
														type="radio"
														name="conformityStatement"
														checked={formInput.conformityStatement === 'not Required'}
														onChange={() => setFormInput({ ...formInput, conformityStatement: 'not Required', decisionRule: 'As per standard' })}
														className="w-4 h-4 text-[#11236a] focus:ring-[#11236a]"
													/>
													Not-Required
												</label>
											</div>

											{formInput.conformityStatement === 'Required' && (
												<div className="bg-zinc-50 p-3 border border-zinc-200 rounded-xl space-y-2 animate-fade-in text-[11px]">
													<p className="font-extrabold text-zinc-700">If required, select any one for decision rule:</p>
													<div className="space-y-1.5 font-bold text-zinc-850">
														<label className="flex items-center gap-2 cursor-pointer">
															<input
																type="radio"
																name="decisionRule"
																value="Measurement of uncertainty"
																checked={formInput.decisionRule === 'Measurement of uncertainty'}
																onChange={(e) => setFormInput({ ...formInput, decisionRule: e.target.value })}
																className="w-3.5 h-3.5"
															/>
															(A) Measurement of uncertainty
														</label>
														<label className="flex items-center gap-2 cursor-pointer">
															<input
																type="radio"
																name="decisionRule"
																value="As per standard"
																checked={formInput.decisionRule === 'As per standard'}
																onChange={(e) => setFormInput({ ...formInput, decisionRule: e.target.value })}
																className="w-3.5 h-3.5"
															/>
															(B) As per standard
														</label>
														<label className="flex items-center gap-2 cursor-pointer">
															<input
																type="radio"
																name="decisionRule"
																value="As per customer specification, if better than standards"
																checked={formInput.decisionRule === 'As per customer specification, if better than standards'}
																onChange={(e) => setFormInput({ ...formInput, decisionRule: e.target.value })}
																className="w-3.5 h-3.5"
															/>
															(C) As per customer specification, if better than standards
														</label>
													</div>
												</div>
											)}
										</div>
									</div>

									{/* Report Required with NABL Logo */}
									<div className="grid grid-cols-12">
										<div className="col-span-12 md:col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 md:border-r border-zinc-400 flex items-center">
											Report Required with NABL logo <span className="text-rose-500 font-extrabold ml-1">*</span>
										</div>
										<div className="col-span-12 md:col-span-8 p-3 bg-white flex items-center gap-6">
											<label className="flex items-center gap-2 cursor-pointer font-bold">
												<input
													type="radio"
													name="reportNablLogo"
													checked={formInput.reportNablLogo === 'Yes'}
													onChange={() => setFormInput({ ...formInput, reportNablLogo: 'Yes' })}
													className="w-4 h-4 text-[#11236a] focus:ring-[#11236a]"
												/>
												Yes
											</label>
											<label className="flex items-center gap-2 cursor-pointer font-bold">
												<input
													type="radio"
													name="reportNablLogo"
													checked={formInput.reportNablLogo === 'No'}
													onChange={() => setFormInput({ ...formInput, reportNablLogo: 'No' })}
													className="w-4 h-4 text-[#11236a] focus:ring-[#11236a]"
												/>
												No
											</label>
										</div>
									</div>

									{/* Collected Back */}
									<div className="grid grid-cols-12 min-h-[60px]">
										<div className="col-span-12 md:col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 md:border-r border-zinc-400 flex items-center">
											Whether sample will be collected back (not applicable for destructive test) <span className="text-rose-500 font-extrabold ml-1">*</span>
										</div>
										<div className="col-span-12 md:col-span-8 p-3 bg-white space-y-2">
											<div className="flex items-center gap-6">
												<label className="flex items-center gap-2 cursor-pointer font-bold">
													<input
														type="radio"
														name="collectBack"
														checked={formInput.collectBack === 'Yes'}
														onChange={() => setFormInput({ ...formInput, collectBack: 'Yes' })}
														className="w-4 h-4 text-[#11236a] focus:ring-[#11236a]"
													/>
													Yes
												</label>
												<label className="flex items-center gap-2 cursor-pointer font-bold">
													<input
														type="radio"
														name="collectBack"
														checked={formInput.collectBack === 'No'}
														onChange={() => setFormInput({ ...formInput, collectBack: 'No' })}
														className="w-4 h-4 text-[#11236a] focus:ring-[#11236a]"
													/>
													No
												</label>
											</div>
											<p className="text-[10px] text-zinc-500 font-bold leading-relaxed">
												If yes, please collect within 15 days from the date of issuing the test report. After this period, the sample will be destroyed.
											</p>
										</div>
									</div>

									{/* Signature Name */}
									<div className="grid grid-cols-12">
										<div className="col-span-12 md:col-span-4 bg-zinc-50/70 p-3 font-extrabold text-zinc-800 md:border-r border-zinc-400 flex items-center">
											Customer Name & Signature: <span className="text-rose-500 font-extrabold ml-1">*</span>
										</div>
										<div className="col-span-12 md:col-span-8 p-1 bg-white">
											<input
												type="text"
												required
												placeholder="e.g. VILAS GAYAKHE"
												value={formInput.customerSignName}
												onChange={(e) => setFormInput({ ...formInput, customerSignName: e.target.value })}
												className="w-full p-2 border-none outline-none font-bold text-[#11236a] italic text-xs bg-transparent placeholder-zinc-400"
											/>
										</div>
									</div>

								</div>


								{/* Multiple File Attachments */}
								<div className="space-y-4 pt-2">
									<h4 className="text-xs font-bold text-[#11236a] uppercase tracking-wider border-l-2 border-[#11236a] pl-2">Upload Supporting Files (Drawings / Specifications)</h4>
									<div className="border-2 border-dashed border-zinc-200 hover:border-[#11236a] rounded-2xl p-6 text-center bg-zinc-50/50 transition-colors relative group">
										<input
											type="file"
											multiple
											onChange={handleFileChange}
											className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
										/>
										<Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
										<p className="text-xs font-bold text-zinc-700">Drag and drop files or click to browse</p>
										<p className="text-[10px] text-zinc-555 font-semibold mt-1">Acceptable types: PDF, PNG, JPG, DOC, DOCX, CAD (Max 15MB each)</p>
									</div>

									{selectedFiles.length > 0 && (
										<div className="bg-[#f8fafc] border border-zinc-200 rounded-2xl p-4 space-y-2 max-h-48 overflow-y-auto">
											<p className="text-[10px] text-zinc-700 font-extrabold uppercase tracking-wider mb-2">Attached Files ({selectedFiles.length})</p>
											{selectedFiles.map((file, idx) => (
												<div key={idx} className="flex items-center justify-between bg-white border border-zinc-200 rounded-xl p-2.5 hover:shadow-sm transition-shadow animate-fade-in">
													<div
														onClick={() => handleOpenFile(file)}
														className="flex items-center gap-2 overflow-hidden mr-3 cursor-pointer hover:text-indigo-650 group"
													>
														<FileText className="w-4 h-4 text-indigo-650 shrink-0" />
														<span className="text-xs font-bold text-zinc-800 truncate group-hover:underline group-hover:text-indigo-600 transition-colors">{file.name}</span>
														<span className="text-[9px] text-zinc-500 shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
													</div>
													<button
														type="button"
														onClick={() => removeFile(idx)}
														className="p-1 hover:bg-zinc-100 text-zinc-500 hover:text-red-650 rounded-lg cursor-pointer outline-none border-none transition-colors"
													>
														<X className="w-3.5 h-3.5" />
													</button>
												</div>
											))}
										</div>
									)}
								</div>

								{/* Form Editor Control Buttons */}
								<div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
									<button
										type="button"
										onClick={() => setShowCreateForm(false)}
										className="px-4 py-2 border border-zinc-200 text-zinc-700 rounded-xl text-xs font-bold bg-white hover:bg-zinc-50 cursor-pointer active:scale-95 transition-all outline-none"
									>
										Cancel
									</button>
									<button
										type="submit"
										className="px-5 py-2 bg-[#11236a] hover:bg-[#0c1a52] text-white rounded-xl text-xs font-bold cursor-pointer active:scale-95 transition-all border-none outline-none flex items-center gap-1.5 shadow-sm"
									>
										<Send className="w-3.5 h-3.5" /> Preview & Confirm
									</button>
								</div>
							</form>
						</div>
					</div>
				)
			) : (
				/* Requests Registry Queue Table Layout */
				<div className="space-y-6">
					{/* Header actions */}
					<div className="bg-white border border-zinc-200/50 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
						{/* Search Bar */}
						<div className="relative w-full md:max-w-md shrink-0">
							<span className="absolute inset-y-0 left-0 flex items-center pl-3">
								<Search className="w-4 h-4 text-zinc-400" />
							</span>
							<input
								type="text"
								placeholder="Search by Brand Name, Model, or Sample Description..."
								value={searchTerm}
								onChange={(e) => {
									setSearchTerm(e.target.value);
									setCurrentPage(1);
								}}
								className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-medium text-zinc-800 placeholder-zinc-450 outline-none focus:bg-white focus:border-[#11236a] transition-all"
							/>
						</div>

						{/* Action Buttons */}
						<div className="flex items-center gap-3 w-full md:w-auto justify-end">
							<CustomSelect
								value={statusFilter}
								onChange={(val) => {
									setStatusFilter(val);
									setCurrentPage(1);
								}}
								options={[
									{ value: 'ALL', label: 'All Statuses' },
									{ value: 'REQUEST_GENERATED', label: 'Request Generated' },
									{ value: 'UNDER_TESTING', label: 'Under Testing' },
									{ value: 'COMPLETED', label: 'Completed' },
								]}
								className="w-48"
							/>

							<button
								onClick={handleRefresh}
								title="Synchronize registry queue"
								className="w-10 h-10 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-850 hover:bg-zinc-100 transition-all cursor-pointer outline-none active:scale-95 border-none"
							>
								<RotateCw className="w-4 h-4" />
							</button>
							<button
								onClick={() => setShowCreateForm(true)}
								className="px-5 py-2.5 bg-[#11236a] hover:bg-[#0c1a52] text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer outline-none active:scale-95 border-none"
							>
								<Plus className="w-4 h-4" /> Add NABL Request
							</button>
						</div>
					</div>

					{/* Registry table queue */}
					<div className="bg-white border border-zinc-200/60 rounded-[24px] p-6 shadow-sm">
						{loading ? (
							<div className="flex flex-col items-center justify-center py-20 gap-3">
								<div className="w-10 h-10 border-4 border-[#11236a] border-t-transparent rounded-full animate-spin" />
								<p className="text-zinc-500 font-bold text-xs">Loading NABL requests queue...</p>
							</div>
						) : filteredRequests.length === 0 ? (
							<div className="text-center py-16 bg-zinc-50/50 border border-dashed border-zinc-200 rounded-2xl">
								<FileText className="w-10 h-10 text-zinc-350 mx-auto mb-2.5" />
								<p className="text-zinc-500 font-bold text-xs">No matching NABL requests found in the database.</p>
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full text-left border-collapse">
									<thead>
										<tr className="border-b border-zinc-200 bg-zinc-50/50">
											<th className="px-4 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Customer Name & Signature</th>
											<th className="px-4 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Brand Name</th>
											<th className="px-4 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Model No</th>
											<th className="px-4 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Sample Description</th>
											<th className="px-4 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-center">Qty</th>
											<th className="px-4 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Date Logged</th>
											<th className="px-4 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Status</th>
											<th className="px-4 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-center">Action</th>
										</tr>
									</thead>
									<tbody>
										{paginatedRequests.map((row) => (
											<tr key={row.id} className="border-b border-zinc-100 hover:bg-zinc-55/20 transition-colors">
												<td className="px-4 py-4 text-xs font-bold text-[#11236a] italic">
													{row.customerSignName || '—'}
												</td>
												<td className="px-4 py-4 text-xs font-bold text-zinc-800">{row.brandName}</td>
												<td className="px-4 py-4 text-xs font-medium text-zinc-650">{row.modelNo}</td>
												<td className="px-4 py-4 text-xs text-zinc-500 truncate max-w-xs">{row.sampleDescription}</td>
												<td className="px-4 py-4 text-xs font-bold text-zinc-700 text-center">{row.sampleQty}</td>
												<td className="px-4 py-4 text-xs text-zinc-400 font-light">{row.createdAt ? row.createdAt.split('T')[0] : 'N/A'}</td>
												<td className="px-4 py-4 text-xs">{getStatusBadge(row.status || '')}</td>
												<td className="px-4 py-4 text-xs text-center">
													<button
														onClick={() => navigate(`/nabl-manager/requests/${row.id}`)}
														title="View Report"
														className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#11236a]/10 hover:bg-[#11236a] text-[#11236a] hover:text-white font-bold text-[10px] rounded-lg transition-all cursor-pointer outline-none border-none active:scale-95"
													>
														<Eye className="w-3.5 h-3.5" /> View Report
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>

								<Pagination
									totalItems={filteredRequests.length}
									itemsPerPage={itemsPerPage}
									currentPage={currentPage}
									onPageChange={setCurrentPage}
									onItemsPerPageChange={(limit) => {
										setItemsPerPage(limit);
										setCurrentPage(1);
									}}
									itemNamePlural="NABL requests"
								/>
							</div>
						)}
					</div>
				</div>
			)}
		</DashboardLayout>
	);
}
