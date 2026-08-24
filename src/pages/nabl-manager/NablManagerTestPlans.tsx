import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
	RotateCw, FileText, Search, Send, Upload, X, Edit3, Calendar, Clipboard, UserCheck, CheckCircle
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';

import Pagination from '../../components/Pagination';
import CustomSelect from '../../components/CustomSelect';

import { getNablRequests, saveNablTestPlan } from '../../services/operations/nablRequestService';

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

interface RequestRecord {
	id: number;
	requestId: string | null;
	customerNameAddress: string;
	manufacturerNameAddress: string;
	customerContactDetails: string;
	sampleDescription: string;
	modelNo: string;
	familyModel: string | null;
	serialNumber: string | null;
	productRating: string;
	sampleQty: number;
	brandName: string;
	attachmentMention: string | null;
	witnessRequired: string;
	witnessPersonDetails: string | null;
	testMethodRef: string;
	conformityStatement: string;
	decisionRule: string | null;
	collectBack: string;
	status: string;
	remarks: string | null;
	createdAt: string;
	testPlan: TestPlan | null;
}

export default function NablManagerTestPlans() {
	const token = localStorage.getItem('token');
	const userStr = localStorage.getItem('user');

	const [loading, setLoading] = useState(false);
	const [requests, setRequests] = useState<RequestRecord[]>([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState('ALL');
	const [filterStartDate, setFilterStartDate] = useState('');
	const [filterEndDate, setFilterEndDate] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(20);
	const [selectedRequest, setSelectedRequest] = useState<RequestRecord | null>(null);
	const [showConfigModal, setShowConfigModal] = useState(false);

	const isEndDatePassed = (req: RequestRecord) => {
		if (!req.testPlan?.endDate) return false;
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const end = new Date(req.testPlan.endDate);
		end.setHours(23, 59, 59, 999);
		return today > end;
	};

	const [formInput, setFormInput] = useState({
		startDate: '',
		endDate: '',
		issueDate: '',
		reportNo: '',
		testedBy: '',
		reviewedAndApprovedBy: '',
		status: 'PASS'
	});
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const fetchDashboardData = async () => {
		setLoading(true);
		try {
			const allReqs = await getNablRequests()();
			setRequests(allReqs || []);
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
		toast.success('Execution queue synchronized successfully.');
	};

	const openConfig = (req: RequestRecord) => {
		setSelectedRequest(req);
		const plan = req.testPlan;
		const initialStatus = (plan?.status || '').toUpperCase();
		const evalChoice = ['FAILED', 'FAIL'].includes(initialStatus) ? 'FAIL' : 'PASS';

		setFormInput({
			startDate: plan?.startDate ? plan.startDate.split('T')[0] : '',
			endDate: plan?.endDate ? plan.endDate.split('T')[0] : '',
			issueDate: plan?.issueDate ? plan.issueDate.split('T')[0] : '',
			reportNo: plan?.reportNo || '',
			testedBy: plan?.testedBy || '',
			reviewedAndApprovedBy: plan?.reviewedAndApprovedBy || '',
			status: evalChoice
		});
		setSelectedFiles([]);
		setShowConfigModal(true);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const filesArray = Array.from(e.target.files);
			setSelectedFiles((prev) => [...prev, ...filesArray]);
		}
	};

	const removeFile = (index: number) => {
		setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
	};

	const handleFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedRequest) return;

		if (!formInput.startDate || !formInput.endDate || !formInput.issueDate || !formInput.reportNo || !formInput.testedBy || !formInput.reviewedAndApprovedBy || !formInput.status) {
			toast.error('Start Date, End Date, Issue Date, Report Number, Tested By, Approved By, and Evaluation Result are mandatory.');
			return;
		}

		const existingAttachmentsCount = selectedRequest.testPlan?.attachments?.length || 0;
		if (selectedFiles.length === 0 && existingAttachmentsCount === 0) {
			toast.error('At least one attachment document is mandatory for configuring the test plan.');
			return;
		}

		setIsSubmitting(true);
		try {
			const formData = new FormData();
			formData.append('startDate', formInput.startDate);
			formData.append('endDate', formInput.endDate);
			formData.append('issueDate', formInput.issueDate);
			formData.append('reportNo', formInput.reportNo);
			formData.append('testedBy', formInput.testedBy);
			formData.append('reviewedAndApprovedBy', formInput.reviewedAndApprovedBy);
			formData.append('status', formInput.status);

			selectedFiles.forEach((file) => {
				formData.append('files', file);
			});

			await saveNablTestPlan(selectedRequest.id, formData)();
			toast.success('Test plan configured successfully.');
			setShowConfigModal(false);
			setSelectedRequest(null);
			await fetchDashboardData();
		} catch (error) {
			console.error('Failed to configure test plan:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const matchesDateRange = (dateStr: string | null | undefined) => {
		if (!filterStartDate && !filterEndDate) return true;
		if (!dateStr) return false;
		const dDate = new Date(dateStr);
		dDate.setHours(0, 0, 0, 0);
		if (filterStartDate) {
			const sDate = new Date(filterStartDate);
			sDate.setHours(0, 0, 0, 0);
			if (dDate < sDate) return false;
		}
		if (filterEndDate) {
			const eDate = new Date(filterEndDate);
			eDate.setHours(0, 0, 0, 0);
			if (dDate > eDate) return false;
		}
		return true;
	};

	const filteredRequests = requests.filter(r => {
		const isCompleted = isEndDatePassed(r);
		if (isCompleted) return false;

		const matchesSearch = 
			(r.brandName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
			(r.modelNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
			(r.sampleDescription || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
			(r.testPlan?.reportNo || '').toLowerCase().includes(searchTerm.toLowerCase());

		if (!matchesSearch) return false;
		if (!matchesDateRange(r.testPlan?.issueDate)) return false;
		if (statusFilter === 'ALL') return true;

		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const isEnded = isEndDatePassed(r);
		const isTesting = r.testPlan?.startDate && r.testPlan?.endDate && !isEnded;

		if (statusFilter === 'REQUEST_GENERATED') return !r.testPlan?.startDate;
		if (statusFilter === 'UNDER_TESTING') return isTesting;
		if (statusFilter === 'COMPLETED') return isEnded;
		return true;
	});

	const paginatedRequests = filteredRequests.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	const getStatusBadge = (req: RequestRecord) => {
		const plan = req.testPlan;
		const rawStatus = req.status || plan?.status || 'REQUEST_GENERATED';
		const s = rawStatus.toUpperCase();

		if (plan?.startDate && plan?.endDate) {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const start = new Date(plan.startDate);
			start.setHours(0, 0, 0, 0);
			const end = new Date(plan.endDate);
			end.setHours(23, 59, 59, 999);

			if (today >= start && today <= end) {
				return (
					<span className="inline-flex items-center whitespace-nowrap px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold border border-amber-200/60 uppercase tracking-wide gap-1 animate-pulse">
						Under Testing
					</span>
				);
			} else if (today > end) {
				const evalChoice = (plan.status || rawStatus).toUpperCase();
				if (['FAILED', 'FAIL'].includes(evalChoice)) {
					return (
						<span className="inline-flex items-center whitespace-nowrap px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full text-[10px] font-bold border border-rose-200/60 uppercase tracking-wide gap-1">
							Completed (Fail)
						</span>
					);
				}
				return (
					<span className="inline-flex items-center whitespace-nowrap px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-200/60 uppercase tracking-wide gap-1">
						Completed (Pass)
					</span>
				);
			}
		}

		if (['COMPLETED', 'TESTING_PASSED', 'PASS'].includes(s)) {
			return <span className="inline-flex items-center whitespace-nowrap px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-100 uppercase tracking-wide">Completed (Pass)</span>;
		}
		if (['FAILED', 'TESTING_FAILED', 'FAIL'].includes(s)) {
			return <span className="inline-flex items-center whitespace-nowrap px-2.5 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-bold border border-rose-100 uppercase tracking-wide">Completed (Fail)</span>;
		}
		if (['UNDER_TESTING', 'UNDER_TEST'].includes(s)) {
			return <span className="inline-flex items-center whitespace-nowrap px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold border border-amber-100 uppercase tracking-wide animate-pulse">Under Testing</span>;
		}
		return <span className="inline-flex items-center whitespace-nowrap px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold border border-blue-100 uppercase tracking-wide">Request Generated</span>;
	};

	return (
		<DashboardLayout
			title="NABL Test Configurations"
			description="Configure testing timelines, track evaluation status, and upload certified reports."
			activeTab="test-plans"
		>
			<div className="space-y-6">
				<div className="bg-white border border-zinc-200/60 p-4 rounded-2xl shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
					<div className="relative w-full lg:max-w-xs">
						<Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
						<input 
							type="text" 
							placeholder="Search by Report No, Brand, Model..." 
							value={searchTerm}
							onChange={(e) => {
								setSearchTerm(e.target.value);
								setCurrentPage(1);
							}}
							className="w-full pl-9 pr-4 py-2 bg-[#f8fafc] border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-805 placeholder-zinc-500 outline-none focus:bg-white focus:border-[#11236a] transition-all"
						/>
					</div>

					<div className="flex flex-col sm:flex-row gap-4 items-center w-full lg:w-auto lg:justify-end">
						<div className="flex items-center gap-2 w-full sm:w-auto">
							<span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider whitespace-nowrap">Status:</span>
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
								className="w-full sm:w-44"
							/>
						</div>

						<div className="flex items-center gap-2 w-full sm:w-auto">
							<span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider whitespace-nowrap">From:</span>
							<input
								type="date"
								value={filterStartDate}
								onChange={(e) => {
									setFilterStartDate(e.target.value);
									setCurrentPage(1);
								}}
								className="bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-800 outline-none focus:bg-white focus:border-[#11236a] transition-all w-full sm:w-auto"
							/>
						</div>

						<div className="flex items-center gap-2 w-full sm:w-auto">
							<span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider whitespace-nowrap">To:</span>
							<input
								type="date"
								value={filterEndDate}
								onChange={(e) => {
									setFilterEndDate(e.target.value);
									setCurrentPage(1);
								}}
								className="bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-800 outline-none focus:bg-white focus:border-[#11236a] transition-all w-full sm:w-auto"
							/>
						</div>

						{(filterStartDate || filterEndDate || searchTerm || statusFilter !== 'ALL') && (
							<button
								onClick={() => {
									setFilterStartDate('');
									setFilterEndDate('');
									setSearchTerm('');
									setStatusFilter('ALL');
									setCurrentPage(1);
								}}
								title="Reset all filters"
								className="px-3 py-1.5 bg-rose-50 hover:bg-rose-105 text-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer outline-none border border-rose-200 flex items-center gap-1 shrink-0 w-full sm:w-auto justify-center"
							>
								<X className="w-3.5 h-3.5" />
								Clear Filters
							</button>
						)}

						<button 
							onClick={handleRefresh}
							disabled={loading}
							className="w-9 h-9 bg-[#f8fafc] hover:bg-zinc-100 border border-zinc-200 text-zinc-650 rounded-xl flex items-center justify-center transition-all cursor-pointer outline-none active:scale-95 disabled:opacity-50 shrink-0"
						>
							<RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
						</button>
					</div>
				</div>
				<div className="bg-white border border-zinc-200/60 rounded-[24px] overflow-hidden shadow-sm">
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="bg-[#f8fafc] border-b border-zinc-150 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
									<th className="py-4 px-6">Brand / Model / S/N</th>
									<th className="py-4 px-6">Description</th>
									<th className="py-4 px-6">Testing Timeline</th>
									<th className="py-4 px-6">Report details</th>
									<th className="py-4 px-6">Tester</th>
									<th className="py-4 px-6">Status</th>
									<th className="py-4 px-6 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-700">
								{loading ? (
									<tr>
										<td colSpan={7} className="text-center py-12">
											<div className="flex flex-col items-center gap-2">
												<div className="w-6 h-6 border-2 border-[#11236a] border-t-transparent rounded-full animate-spin" />
												<span className="text-zinc-500 text-xs font-bold">Loading test configurations...</span>
											</div>
										</td>
									</tr>
								) : filteredRequests.length === 0 ? (
									<tr>
										<td colSpan={7} className="text-center py-12 text-zinc-500 font-bold">
											No NABL test configurations found.
										</td>
									</tr>
								) : (
									paginatedRequests.map((req) => (
										<tr key={req.id} className="hover:bg-[#f8fafc]/50 transition-colors">
											<td className="py-4 px-6">
												<div className="font-extrabold text-[#11236a]">{req.brandName}</div>
												<div className="text-[10px] text-zinc-500 font-bold mt-0.5">{req.modelNo}</div>
												{req.serialNumber && (
													<div className="text-[10px] text-zinc-400 font-bold mt-0.5">S/N: {req.serialNumber}</div>
												)}
											</td>
											<td className="py-4 px-6 max-w-xs truncate" title={req.sampleDescription}>
												{req.sampleDescription}
											</td>
											<td className="py-4 px-6">
												{req.testPlan?.startDate ? (
													<div className="space-y-0.5">
														<div className="flex items-center gap-1 text-[10px] text-zinc-500">
															<span className="font-bold uppercase">Start:</span>
															<span className="text-zinc-700 font-extrabold">{new Date(req.testPlan.startDate).toLocaleDateString()}</span>
														</div>
														{req.testPlan.endDate && (
															<div className="flex items-center gap-1 text-[10px] text-zinc-500">
																<span className="font-bold uppercase">End:</span>
																<span className="text-zinc-700 font-extrabold">{new Date(req.testPlan.endDate).toLocaleDateString()}</span>
															</div>
														)}
													</div>
												) : (
													<span className="text-zinc-400 italic">Timeline not set</span>
												)}
											</td>
											<td className="py-4 px-6">
												{req.testPlan?.reportNo ? (
													<div className="space-y-0.5">
														<div className="font-extrabold text-zinc-800">{req.testPlan.reportNo}</div>
														{req.testPlan.issueDate && (
															<div className="text-[9px] text-zinc-500 font-bold">
																Issued: {new Date(req.testPlan.issueDate).toLocaleDateString()}
															</div>
														)}
													</div>
												) : (
													<span className="text-zinc-400 italic">No report filed</span>
												)}
											</td>
											<td className="py-4 px-6">
												{req.testPlan?.testedBy ? (
													<div>
														<div className="font-extrabold text-zinc-800">{req.testPlan.testedBy}</div>
														{req.testPlan.reviewedAndApprovedBy && (
															<div className="text-[9px] text-zinc-500 font-bold">
																Appr: {req.testPlan.reviewedAndApprovedBy}
															</div>
														)}
													</div>
												) : (
													<span className="text-zinc-400 italic">—</span>
												)}
											</td>
											<td className="py-4 px-6">
												{getStatusBadge(req)}
											</td>
											<td className="py-4 px-6 text-right">
												{isEndDatePassed(req) ? (
													<span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider italic">
														Completed
													</span>
												) : (
													<button 
														onClick={() => openConfig(req)}
														className="px-3 py-1.5 bg-[#f8fafc] hover:bg-[#11236a] hover:text-white border border-zinc-200 text-[#11236a] rounded-lg text-[10px] font-bold uppercase transition-all tracking-wider outline-none active:scale-95 cursor-pointer flex items-center gap-1 ml-auto"
													>
														<Edit3 className="w-3.5 h-3.5" />
														Configure
													</button>
												)}
											</td>
										</tr>
									))
								)}
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
							itemNamePlural="NABL test plans"
						/>
					</div>
				</div>
			</div>

			{showConfigModal && selectedRequest && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in">
					<div className="bg-white border border-zinc-200 w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
						<div className="bg-[#11236a] px-6 py-4 flex items-center justify-between text-white shrink-0">
							<div>
								<span className="text-[10px] uppercase font-bold tracking-widest text-white/60">Execution Planning</span>
								<h3 className="text-base font-extrabold mt-0.5">Configure Testing Plan & timelines</h3>
							</div>
							<button 
								onClick={() => setShowConfigModal(false)}
								className="text-white/70 hover:text-white cursor-pointer bg-transparent border-none outline-none"
							>
								<X className="w-5 h-5" />
							</button>
						</div>
						<form onSubmit={handleFormSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
							<div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl space-y-1">
								<div className="text-[10px] font-bold text-zinc-400 uppercase">Product Information</div>
								<div className="grid grid-cols-2 gap-2 text-xs font-medium text-zinc-700">
									<div><span className="text-zinc-400 font-bold">Brand:</span> {selectedRequest.brandName}</div>
									<div><span className="text-zinc-400 font-bold">Model No:</span> {selectedRequest.modelNo}</div>
									<div className="col-span-2"><span className="text-zinc-400 font-bold">Description:</span> {selectedRequest.sampleDescription}</div>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-1.5">
									<label className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider flex items-center gap-1">
										<Calendar className="w-3.5 h-3.5 text-zinc-400" /> Start Date <span className="text-rose-500 font-extrabold ml-0.5">*</span>
									</label>
									<input 
										type="date"
										required
										value={formInput.startDate}
										onChange={(e) => setFormInput(prev => ({ ...prev, startDate: e.target.value }))}
										className="w-full p-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#11236a] transition-all"
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider flex items-center gap-1">
										<Calendar className="w-3.5 h-3.5 text-zinc-400" /> End Date <span className="text-rose-500 font-extrabold ml-0.5">*</span>
									</label>
									<input 
										type="date"
										required
										value={formInput.endDate}
										onChange={(e) => setFormInput(prev => ({ ...prev, endDate: e.target.value }))}
										className="w-full p-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#11236a] transition-all"
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider flex items-center gap-1">
										<Calendar className="w-3.5 h-3.5 text-zinc-400" /> Issue Date <span className="text-rose-500 font-extrabold ml-0.5">*</span>
									</label>
									<input 
										type="date"
										required
										value={formInput.issueDate}
										onChange={(e) => setFormInput(prev => ({ ...prev, issueDate: e.target.value }))}
										className="w-full p-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#11236a] transition-all"
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider flex items-center gap-1">
										<Clipboard className="w-3.5 h-3.5 text-zinc-400" /> Report Number <span className="text-rose-500 font-extrabold ml-0.5">*</span>
									</label>
									<input 
										type="text"
										required
										placeholder="e.g. NABL-REP-2026-09"
										value={formInput.reportNo}
										onChange={(e) => setFormInput(prev => ({ ...prev, reportNo: e.target.value }))}
										className="w-full p-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#11236a] transition-all"
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider flex items-center gap-1">
										<UserCheck className="w-3.5 h-3.5 text-zinc-400" /> Tested By (String) <span className="text-rose-500 font-extrabold ml-0.5">*</span>
									</label>
									<input 
										type="text"
										required
										placeholder="Name of tester"
										value={formInput.testedBy}
										onChange={(e) => setFormInput(prev => ({ ...prev, testedBy: e.target.value }))}
										className="w-full p-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#11236a] transition-all"
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider flex items-center gap-1">
										<UserCheck className="w-3.5 h-3.5 text-zinc-400" /> Approved By (String) <span className="text-rose-500 font-extrabold ml-0.5">*</span>
									</label>
									<input 
										type="text"
										required
										placeholder="Name of approver"
										value={formInput.reviewedAndApprovedBy}
										onChange={(e) => setFormInput(prev => ({ ...prev, reviewedAndApprovedBy: e.target.value }))}
										className="w-full p-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#11236a] transition-all"
									/>
								</div>
								<div className="col-span-1 sm:col-span-2 space-y-1.5">
									<label className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider block">
										Evaluation Result <span className="text-rose-500 font-extrabold ml-0.5">*</span>
									</label>
									<div className="grid grid-cols-2 gap-3 max-w-xs">
										<button
											type="button"
											onClick={() => setFormInput(prev => ({ ...prev, status: 'PASS' }))}
											className={`py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 border transition-all cursor-pointer outline-none ${
												formInput.status === 'PASS' || formInput.status === 'COMPLETED'
													? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
													: 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
											}`}
										>
											<CheckCircle className="w-4 h-4" /> PASS
										</button>
										<button
											type="button"
											onClick={() => setFormInput(prev => ({ ...prev, status: 'FAIL' }))}
											className={`py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 border transition-all cursor-pointer outline-none ${
												formInput.status === 'FAIL' || formInput.status === 'FAILED'
													? 'bg-rose-600 text-white border-rose-600 shadow-sm'
													: 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
											}`}
										>
											<X className="w-4 h-4" /> FAIL
										</button>
									</div>
									<div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-2.5 mt-2">
										<span className="text-amber-600 text-sm font-bold shrink-0 mt-0.5">💡</span>
										<p className="text-[11px] text-amber-900 font-medium leading-relaxed">
											<strong className="font-extrabold text-amber-950">Status Management:</strong> The status automatically remains <span className="font-extrabold">"Under Testing"</span> while current date is between Start Date & End Date. Once current date reaches or passes End Date, status automatically becomes <span className="font-extrabold">Completed</span> showing your selected Evaluation Result (Pass or Fail).
										</p>
									</div>
								</div>
							</div>
							<div className="space-y-2">
								<label className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider flex items-center gap-1">
									Plan Attachments (At least 1 mandatory) <span className="text-rose-500 font-extrabold ml-0.5">*</span>
								</label>
								<div className="border-2 border-dashed border-zinc-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-[#f8fafc]/50 hover:bg-[#f8fafc] transition-all relative">
									<input 
										type="file" 
										multiple
										onChange={handleFileChange}
										className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
									/>
									<Upload className="w-7 h-7 text-zinc-400 mb-2" />
									<p className="text-zinc-650 text-xs font-extrabold">Drag & Drop files or click to upload</p>
									<p className="text-[10px] text-zinc-400 font-bold mt-1">Supports PDF, Doc, Excel, Images (Max 15MB each)</p>
								</div>
								{selectedFiles.length > 0 && (
									<div className="bg-[#f8fafc] border border-zinc-150 p-4 rounded-2xl space-y-2.5">
										<p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Selected Documents ({selectedFiles.length})</p>
										<div className="max-h-36 overflow-y-auto space-y-2 pr-1">
											{selectedFiles.map((file, idx) => (
												<div key={idx} className="flex items-center justify-between p-2 bg-white border border-zinc-150 rounded-xl text-xs">
													<div className="flex items-center gap-2 max-w-[85%]">
														<FileText className="w-4 h-4 text-zinc-500 shrink-0" />
														<span className="truncate font-semibold text-zinc-700" title={file.name}>{file.name}</span>
														<span className="text-[9px] font-bold text-zinc-400">({(file.size / 1024).toFixed(0)} KB)</span>
													</div>
													<button 
														type="button"
														onClick={() => removeFile(idx)}
														className="text-rose-500 hover:text-rose-700 cursor-pointer bg-transparent border-none outline-none"
													>
														<X className="w-4 h-4" />
													</button>
												</div>
											))}
										</div>
									</div>
								)}
								{selectedRequest.testPlan?.attachments && selectedRequest.testPlan.attachments.length > 0 && (
									<div className="bg-[#f0fdf4] border border-[#dcfce7] p-4 rounded-2xl space-y-2.5">
										<p className="text-[10px] font-bold text-[#16a34a] uppercase tracking-wide">Existing Documents ({selectedRequest.testPlan.attachments.length})</p>
										<div className="max-h-36 overflow-y-auto space-y-2 pr-1">
											{selectedRequest.testPlan.attachments.map((file) => (
												<a 
													key={file.id}
													href={`/${file.filePath}`}
													target="_blank"
													rel="noreferrer"
													className="flex items-center justify-between p-2 bg-white border border-emerald-100 hover:border-[#16a34a] transition-all rounded-xl text-xs text-zinc-700 no-underline font-semibold"
												>
													<div className="flex items-center gap-2 max-w-[90%]">
														<FileText className="w-4 h-4 text-[#16a34a] shrink-0" />
														<span className="truncate">{file.fileName}</span>
														<span className="text-[9px] text-zinc-400 font-bold">({(file.fileSize / 1024).toFixed(0)} KB)</span>
													</div>
												</a>
											))}
										</div>
									</div>
								)}
							</div>
							<div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
								<button 
									type="button"
									onClick={() => setShowConfigModal(false)}
									className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold uppercase transition-all outline-none"
								>
									Cancel
								</button>
								<button 
									type="submit"
									disabled={isSubmitting}
									className="px-5 py-2 bg-[#11236a] hover:bg-[#183296] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
								>
									{isSubmitting ? (
										<>
											<div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
											Saving...
										</>
									) : (
										<>
											<Send className="w-3.5 h-3.5" />
											Save Configuration
										</>
									)}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</DashboardLayout>
	);
}