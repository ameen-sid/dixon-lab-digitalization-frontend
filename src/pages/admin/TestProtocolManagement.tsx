import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2, XCircle, Loader2, CheckCircle, AlertCircle, AlertTriangle, FileText, Eye, Calendar } from 'lucide-react';
import Pagination from '../../components/Pagination';
import CustomSelect from '../../components/CustomSelect';
import testProtocolService from '../../services/operations/testProtocolService';
import testCategoryService from '../../services/operations/testCategoryService';
import testTypeService from '../../services/operations/testTypeService';

interface TestTypeRecord {
	id: number;
	name: string;
}

interface TestCategoryRecord {
	id: number;
	name: string;
	testTypeId: number | null;
}

interface TestProtocolRecord {
	id: number;
	name: string;
	productType: string;
	testMethod: string;
	judgementCriteria: string;
	testTypeId: number | null;
	testCategoryId: number | null;
	testType?: TestTypeRecord | null;
	testCategory?: TestCategoryRecord | null;
	createdAt: string;
}

export default function TestProtocolManagement() {
	const [protocols, setProtocols] = useState<TestProtocolRecord[]>([]);
	const [testTypes, setTestTypes] = useState<TestTypeRecord[]>([]);
	const [categories, setCategories] = useState<TestCategoryRecord[]>([]);

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const [searchQuery, setSearchQuery] = useState("");
	const [showAddModal, setShowAddModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showViewModal, setShowViewModal] = useState(false);
	const [selectedProtocolForView, setSelectedProtocolForView] = useState<TestProtocolRecord | null>(null);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [recordToDelete, setRecordToDelete] = useState<TestProtocolRecord | null>(null);

	// Form states
	const [name, setName] = useState("");
	const [productType, setProductType] = useState("SATL");
	const [testMethod, setTestMethod] = useState("");
	const [judgementCriteria, setJudgementCriteria] = useState("");
	const [selectedTestTypeId, setSelectedTestTypeId] = useState<string>("");
	const [selectedTestCategoryId, setSelectedTestCategoryId] = useState<string>("");
	const [editingId, setEditingId] = useState<number | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(5);

	const [filterTestTypeId, setFilterTestTypeId] = useState<string>("all");
	const [filterTestCategoryId, setFilterTestCategoryId] = useState<string>("all");

	const fetchData = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const fetchedTypes = await testTypeService.getTestTypes()();
			setTestTypes(fetchedTypes);

			const fetchedCats = await testCategoryService.getTestCategories()();
			setCategories(fetchedCats);

			const fetchedProtos = await testProtocolService.getTestProtocols()();
			setProtocols(fetchedProtos);
		} catch (err) {
			console.error('Error fetching protocols dataset:', err);
			setError(err instanceof Error ? err.message : 'An unexpected connection error occurred.');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	// Filter categories based on selected test type
	const filteredCategoriesDropdown = categories.filter(
		(cat) => cat.testTypeId === (selectedTestTypeId ? Number(selectedTestTypeId) : null)
	);

	const handleAdd = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return showNotification('Test protocol name cannot be empty', 'error');
		if (!selectedTestTypeId) return showNotification('Please select a Test Type', 'error');
		if (!selectedTestCategoryId) return showNotification('Please select a Test Category', 'error');
		if (!productType.trim()) return showNotification('Product type cannot be empty', 'error');
		if (!testMethod.trim()) return showNotification('Test method cannot be empty', 'error');
		if (!judgementCriteria.trim()) return showNotification('Judgement criteria cannot be empty', 'error');

		try {
			await testProtocolService.createTestProtocol(
				name,
				Number(selectedTestTypeId),
				Number(selectedTestCategoryId),
				productType,
				testMethod,
				judgementCriteria
			)();
			showNotification(`Test Protocol "${name.trim()}" created successfully!`, 'success');
			resetForm();
			fetchData();
		} catch (err) {
			showNotification(err instanceof Error ? err.message : 'Connection error creating test protocol.', 'error');
		}
	};

	const handleEdit = (record: TestProtocolRecord) => {
		setEditingId(record.id);
		setName(record.name);
		setProductType(record.productType);
		setTestMethod(record.testMethod);
		setJudgementCriteria(record.judgementCriteria);
		setSelectedTestTypeId(record.testTypeId ? record.testTypeId.toString() : "");
		setSelectedTestCategoryId(record.testCategoryId ? record.testCategoryId.toString() : "");
		setShowEditModal(true);
	};

	const handleUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || editingId === null) return;
		if (!selectedTestTypeId) return showNotification('Please select a Test Type', 'error');
		if (!selectedTestCategoryId) return showNotification('Please select a Test Category', 'error');
		if (!productType.trim()) return showNotification('Product type cannot be empty', 'error');
		if (!testMethod.trim()) return showNotification('Test method cannot be empty', 'error');
		if (!judgementCriteria.trim()) return showNotification('Judgement criteria cannot be empty', 'error');

		try {
			await testProtocolService.updateTestProtocol(
				editingId,
				name,
				Number(selectedTestTypeId),
				Number(selectedTestCategoryId),
				productType,
				testMethod,
				judgementCriteria
			)();
			showNotification(`Test Protocol "${name.trim()}" updated successfully!`, 'success');
			resetForm();
			fetchData();
		} catch (err) {
			showNotification(err instanceof Error ? err.message : 'Connection error updating test protocol.', 'error');
		}
	};

	const handleDelete = async (id: number) => {
		try {
			await testProtocolService.deleteTestProtocol(id)();
			showNotification('Test Protocol deleted successfully.', 'success');
			setShowDeleteModal(false);
			setRecordToDelete(null);
			fetchData();
		} catch (err) {
			showNotification(err instanceof Error ? err.message : 'Connection error deleting test protocol.', 'error');
		}
	};

	const showNotification = (msg: string, type: 'success' | 'error') => {
		if (type === 'success') {
			setSuccessMessage(msg);
			setTimeout(() => setSuccessMessage(null), 4000);
		} else {
			setError(msg);
			setTimeout(() => setError(null), 4000);
		}
	};

	const resetForm = () => {
		setName("");
		setProductType("SATL");
		setTestMethod("");
		setJudgementCriteria("");
		setSelectedTestTypeId("");
		setSelectedTestCategoryId("");
		setEditingId(null);
		setShowAddModal(false);
		setShowEditModal(false);
	};

	// Filter categories for the page filter dropdown based on selected filterTestTypeId
	const filteredCategoriesForFilter = categories.filter(
		(cat) => filterTestTypeId === "all" || cat.testTypeId === Number(filterTestTypeId)
	);

	const filteredRecords = protocols.filter((p) => {
		const matchesSearch =
			p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.productType.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(p.testType?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
			(p.testCategory?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

		const matchesTestType =
			filterTestTypeId === "all" ||
			p.testTypeId === Number(filterTestTypeId);

		const matchesTestCategory =
			filterTestCategoryId === "all" ||
			p.testCategoryId === Number(filterTestCategoryId);

		return matchesSearch && matchesTestType && matchesTestCategory;
	});

	const maxPage = Math.ceil(filteredRecords.length / itemsPerPage);
	const activePage = maxPage > 0 ? Math.min(currentPage, maxPage) : 1;
	if (currentPage !== activePage) {
		setCurrentPage(activePage);
	}

	const startIndex = (activePage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

	return (
		<div className="space-y-6">
			{successMessage && (
				<div className="bg-emerald-50 border border-emerald-250 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold animate-fade-in shadow-sm">
					<CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
					<span>{successMessage}</span>
				</div>
			)}
			{error && (
				<div className="bg-rose-50 border border-rose-250 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold animate-fade-in shadow-sm">
					<AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
					<span>{error}</span>
				</div>
			)}

			<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
				<div className="bg-white border border-zinc-200/50 rounded-2xl p-4 shadow-sm">
					<p className="text-[10px] text-zinc-700 font-bold uppercase tracking-wider">Total Protocols</p>
					<h3 className="text-2xl font-bold text-zinc-950 mt-1">
						{isLoading ? (
							<Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
						) : (
							protocols.length
						)}
					</h3>
				</div>
			</div>

			<div className="bg-white border border-zinc-200/50 rounded-[20px] p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
				<div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch sm:items-center">
					<div className="relative w-full sm:w-80 shrink-0">
						<span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-600">
							<Search className="w-4 h-4" />
						</span>
						<input
							type="text"
							placeholder="Search by protocol, method or product..."
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								setCurrentPage(1);
							}}
							className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-800 placeholder-zinc-600 outline-none focus:border-[#11236a] transition-all font-light"
						/>
					</div>
					<div className="w-full sm:w-48">
						<CustomSelect
							value={filterTestTypeId}
							onChange={(val) => {
								setFilterTestTypeId(val);
								setFilterTestCategoryId("all"); // Reset category filter when type changes
								setCurrentPage(1);
							}}
							options={[
								{ value: "all", label: "All Test Types" },
								...testTypes.map((t) => ({ value: String(t.id), label: t.name }))
							]}
							placeholder="Filter by Test Type"
						/>
					</div>
					<div className="w-full sm:w-48">
						<CustomSelect
							value={filterTestCategoryId}
							onChange={(val) => {
								setFilterTestCategoryId(val);
								setCurrentPage(1);
							}}
							disabled={filterTestTypeId === "all"}
							options={[
								{ value: "all", label: "All Categories" },
								...filteredCategoriesForFilter.map((c) => ({ value: String(c.id), label: c.name }))
							]}
							placeholder={filterTestTypeId === "all" ? "Select Test Type first" : "Filter by Category"}
						/>
					</div>

					{(searchQuery !== "" || filterTestTypeId !== "all" || filterTestCategoryId !== "all") && (
						<button
							onClick={() => {
								setSearchQuery("");
								setFilterTestTypeId("all");
								setFilterTestCategoryId("all");
								setCurrentPage(1);
							}}
							className="text-xs font-bold text-red-650 hover:text-red-750 bg-red-50 hover:bg-red-100 border border-red-200/50 px-3.5 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shrink-0 text-red-600"
						>
							<XCircle className="w-3.5 h-3.5 text-red-500" /> Clear Filters
						</button>
					)}
				</div>
				<button
					onClick={() => {
						resetForm();
						setShowAddModal(true);
					}}
					className="w-full lg:w-auto bg-[#11236a] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#0c1a52] transition-all border-none outline-none shrink-0"
				>
					<Plus className="w-4 h-4" /> Create Protocol
				</button>
			</div>

			<div className="bg-white border border-zinc-200/50 rounded-3xl shadow-sm overflow-hidden">
				{isLoading ? (
					<div className="py-20 flex flex-col items-center justify-center gap-3">
						<Loader2 className="w-8 h-8 text-[#11236a] animate-spin" />
						<p className="text-xs text-zinc-600 font-light">Loading test protocols registry...</p>
					</div>
				) : (
					<div className="overflow-x-auto flex flex-col justify-between">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 font-bold text-[10px] uppercase tracking-wider">
									<th className="py-4 px-6">Protocol Details</th>
									<th className="py-4 px-6">Classification</th>
									<th className="py-4 px-6">Specifications (Method / Judgement)</th>
									<th className="py-4 px-6 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-700">
								{paginatedRecords.length === 0 ? (
									<tr>
										<td
											colSpan={4}
											className="py-8 text-center text-zinc-600 font-light"
										> No registered test protocols found.</td>
									</tr>
								) : (
									paginatedRecords.map((item) => (
										<tr
											key={item.id}
											className="hover:bg-zinc-50/50 transition-colors"
										>
											<td className="py-4 px-6 max-w-xs">
												<p className="font-bold text-[#11236a] text-sm">{item.name}</p>
												<p className="text-[10px] text-zinc-700 font-semibold mt-0.5">Product Type: <strong className="text-zinc-900">{item.productType}</strong></p>
											</td>
											<td className="py-4 px-6 space-y-1">
												<div>
													<span className="bg-[#11236a]/5 border border-[#11236a]/15 text-[#11236a] px-2 py-0.5 rounded text-[9px] font-bold">
														{item.testType?.name || 'No Test Type'}
													</span>
												</div>
												<div>
													<span className="bg-zinc-100 px-2 py-0.5 rounded text-[9px] font-bold text-zinc-800">
														{item.testCategory?.name || 'No Category'}
													</span>
												</div>
											</td>
											<td className="py-4 px-6 max-w-sm">
												<p className="font-bold text-zinc-800 line-clamp-1">Method: <span className="font-medium text-zinc-700">{item.testMethod}</span></p>
												<p className="font-bold text-zinc-800 line-clamp-1 mt-0.5">Judgement: <span className="font-medium text-zinc-700">{item.judgementCriteria}</span></p>
											</td>
											<td className="py-4 px-6 text-right space-x-2 shrink-0">
												<button
													onClick={() => {
														setSelectedProtocolForView(item);
														setShowViewModal(true);
													}}
													className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 p-1.5 rounded-lg border-none outline-none cursor-pointer transition-all inline-flex items-center justify-center"
													title="View Details"
												>
													<Eye className="w-3.5 h-3.5" />
												</button>
												<button
													onClick={() =>
														handleEdit(item)
													}
													className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 p-1.5 rounded-lg border-none outline-none cursor-pointer transition-all inline-flex items-center justify-center"
													title="Edit"
												>
													<Edit3 className="w-3.5 h-3.5" />
												</button>
												<button
													onClick={() => {
														setRecordToDelete(item);
														setShowDeleteModal(true);
													}}
													className="bg-red-50 hover:bg-red-100 text-red-600 p-1.5 rounded-lg border-none outline-none cursor-pointer transition-all inline-flex items-center justify-center"
													title="Delete"
												>
													<Trash2 className="w-3.5 h-3.5" />
												</button>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>

						<Pagination
							totalItems={filteredRecords.length}
							itemsPerPage={itemsPerPage}
							currentPage={currentPage}
							onPageChange={setCurrentPage}
							onItemsPerPageChange={(limit) => {
								setItemsPerPage(limit);
								setCurrentPage(1);
							}}
							itemNamePlural="protocols"
						/>
					</div>
				)}
			</div>

			{showAddModal && (
				<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<div className="bg-white border border-zinc-200 rounded-3xl max-w-lg w-full shadow-2xl p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
						<button
							onClick={() => setShowAddModal(false)}
							className="absolute top-4 right-4 w-7 h-7 bg-zinc-50 border border-zinc-200 rounded-full flex items-center justify-center text-zinc-600 hover:text-red-600 transition-all cursor-pointer outline-none"
						>
							<XCircle className="w-4 h-4" />
						</button>
						<h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
							<FileText className="w-5 h-5 text-[#11236a]" /> Create Test Protocol
						</h3>
						<form
							onSubmit={handleAdd}
							className="mt-4 space-y-4 text-left"
						>
							<div>
								<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide">Protocol Name <span className="text-red-500">*</span></label>
								<input
									type="text"
									required
									placeholder="e.g. PCB Base Thermal Shock Reliability Sweep"
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2 mt-1 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all font-light"
								/>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide mb-1">Parent Test Type <span className="text-red-500">*</span></label>
									<CustomSelect
										value={selectedTestTypeId}
										onChange={(val) => {
											setSelectedTestTypeId(val);
											setSelectedTestCategoryId(""); // Reset category when type changes
										}}
										options={testTypes.map((type) => ({ value: type.id.toString(), label: type.name }))}
										placeholder="-- Select Test Type --"
									/>
								</div>
								<div>
									<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide mb-1">Test Category <span className="text-red-500">*</span></label>
									<CustomSelect
										value={selectedTestCategoryId}
										onChange={setSelectedTestCategoryId}
										disabled={!selectedTestTypeId}
										options={filteredCategoriesDropdown.map((cat) => ({ value: cat.id.toString(), label: cat.name }))}
										placeholder={selectedTestTypeId ? "-- Select Category --" : "Select Test Type first"}
									/>
								</div>
							</div>

							<div>
								<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide flex items-center gap-0.5">
									Product Type <span className="text-red-500 font-bold">*</span>
								</label>
								<div className="flex flex-row gap-3 mt-1.5">
									{['SATL', 'FATL', 'FAFL'].map((type) => {
										const isSelected = productType === type;
										return (
											<button
												key={type}
												type="button"
												onClick={() => setProductType(type)}
												className={`flex-1 py-2.5 px-4 rounded-[14px] text-xs font-bold text-center border transition-all cursor-pointer outline-none ${
													isSelected
														? 'bg-[#111f54] text-white border-transparent shadow-lg shadow-[#111f54]/15'
														: 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
												}`}
											>
												{type}
											</button>
										);
									})}
								</div>
							</div>

							<div>
								<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide">Test Method Details <span className="text-red-500">*</span></label>
								<textarea
									required
									rows={3}
									placeholder="Describe the steps, ambient ranges, and chamber cycle durations..."
									value={testMethod}
									onChange={(e) => setTestMethod(e.target.value)}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2 mt-1 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all font-light resize-none"
								/>
							</div>

							<div>
								<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide">Judgement / Pass Criteria <span className="text-red-500">*</span></label>
								<textarea
									required
									rows={3}
									placeholder="Describe the thresholds for PCB micro-cracking, resistance shifts, etc..."
									value={judgementCriteria}
									onChange={(e) => setJudgementCriteria(e.target.value)}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2 mt-1 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all font-light resize-none"
								/>
							</div>

							<button
								type="submit"
								className="w-full bg-[#11236a] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-[#0c1a52] transition-all border-none outline-none cursor-pointer"
							>
								Submit Protocol Details
							</button>
						</form>
					</div>
				</div>
			)}

			{showEditModal && (
				<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<div className="bg-white border border-zinc-200 rounded-3xl max-w-lg w-full shadow-2xl p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
						<button
							onClick={() => setShowEditModal(false)}
							className="absolute top-4 right-4 w-7 h-7 bg-zinc-50 border border-zinc-200 rounded-full flex items-center justify-center text-zinc-600 hover:text-red-600 transition-all cursor-pointer outline-none"
						>
							<XCircle className="w-4 h-4" />
						</button>
						<h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
							<Edit3 className="w-5 h-5 text-[#11236a]" /> Edit Test Protocol
						</h3>
						<form
							onSubmit={handleUpdate}
							className="mt-4 space-y-4 text-left"
						>
							<div>
								<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide">Protocol Name</label>
								<input
									type="text"
									required
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2 mt-1 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all font-light"
								/>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide mb-1">Parent Test Type</label>
									<CustomSelect
										value={selectedTestTypeId}
										onChange={(val) => {
											setSelectedTestTypeId(val);
											setSelectedTestCategoryId(""); // Reset category when type changes
										}}
										options={testTypes.map((type) => ({ value: type.id.toString(), label: type.name }))}
										placeholder="-- Select Test Type --"
									/>
								</div>
								<div>
									<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide mb-1">Test Category</label>
									<CustomSelect
										value={selectedTestCategoryId}
										onChange={setSelectedTestCategoryId}
										disabled={!selectedTestTypeId}
										options={filteredCategoriesDropdown.map((cat) => ({ value: cat.id.toString(), label: cat.name }))}
										placeholder={selectedTestTypeId ? "-- Select Category --" : "Select Test Type first"}
									/>
								</div>
							</div>

							<div>
								<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide flex items-center gap-0.5">
									Product Type <span className="text-red-500 font-bold">*</span>
								</label>
								<div className="flex flex-row gap-3 mt-1.5">
									{['SATL', 'FATL', 'FAFL'].map((type) => {
										const isSelected = productType === type;
										return (
											<button
												key={type}
												type="button"
												onClick={() => setProductType(type)}
												className={`flex-1 py-2.5 px-4 rounded-[14px] text-xs font-bold text-center border transition-all cursor-pointer outline-none ${
													isSelected
														? 'bg-[#111f54] text-white border-transparent shadow-lg shadow-[#111f54]/15'
														: 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
												}`}
											>
												{type}
											</button>
										);
									})}
								</div>
							</div>

							<div>
								<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide">Test Method Details</label>
								<textarea
									required
									rows={3}
									value={testMethod}
									onChange={(e) => setTestMethod(e.target.value)}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2 mt-1 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all font-light resize-none"
								/>
							</div>

							<div>
								<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide">Judgement / Pass Criteria</label>
								<textarea
									required
									rows={3}
									value={judgementCriteria}
									onChange={(e) => setJudgementCriteria(e.target.value)}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2 mt-1 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all font-light resize-none"
								/>
							</div>

							<button
								type="submit"
								className="w-full bg-[#11236a] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-[#0c1a52] transition-all border-none outline-none cursor-pointer"
							>
								Save Changes
							</button>
						</form>
					</div>
				</div>
			)}

			{showViewModal && selectedProtocolForView && (
				<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<div className="bg-white border border-zinc-200 rounded-3xl max-w-2xl w-full shadow-2xl p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar">
						<button
							onClick={() => {
								setShowViewModal(false);
								setSelectedProtocolForView(null);
							}}
							className="absolute top-4 right-4 w-7 h-7 bg-zinc-50 border border-zinc-200 rounded-full flex items-center justify-center text-zinc-600 hover:text-red-600 transition-all cursor-pointer outline-none"
						>
							<XCircle className="w-4 h-4" />
						</button>

						<div className="flex items-start gap-3">
							<div className="w-10 h-10 bg-[#11236a]/5 border border-[#11236a]/15 rounded-xl flex items-center justify-center text-[#11236a] shrink-0 mt-0.5">
								<FileText className="w-5 h-5" />
							</div>
							<div className="space-y-1">
								<span className="text-[10px] text-zinc-700 font-bold uppercase tracking-wider">Test Protocol Specifications</span>
								<h3 className="text-lg font-bold text-zinc-950 pr-8 leading-tight">
									{selectedProtocolForView.name}
								</h3>
							</div>
						</div>

						<div className="mt-6 space-y-5 border-t border-zinc-100 pt-5">
							{/* Badges/Classifications */}
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div className="bg-zinc-50 border border-zinc-150 rounded-2xl p-3 shadow-sm">
									<p className="text-[9px] text-zinc-700 font-bold uppercase tracking-wider">Parent Test Type</p>
									<p className="text-xs font-bold text-[#11236a] mt-1">
										{selectedProtocolForView.testType?.name || "Not Specified"}
									</p>
								</div>
								<div className="bg-zinc-50 border border-zinc-150 rounded-2xl p-3 shadow-sm">
									<p className="text-[9px] text-zinc-700 font-bold uppercase tracking-wider">Test Category</p>
									<p className="text-xs font-bold text-zinc-800 mt-1">
										{selectedProtocolForView.testCategory?.name || "Not Specified"}
									</p>
								</div>
								<div className="bg-zinc-50 border border-zinc-150 rounded-2xl p-3 shadow-sm">
									<p className="text-[9px] text-zinc-700 font-bold uppercase tracking-wider">Product Type</p>
									<div className="mt-1.5">
										<span className="bg-[#11236a] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
											{selectedProtocolForView.productType}
										</span>
									</div>
								</div>
							</div>

							{/* Details Text Boxes */}
							<div className="space-y-4">
								<div className="bg-white border border-zinc-200/60 rounded-2xl p-4 shadow-sm space-y-2">
									<h4 className="text-xs font-bold text-[#11236a] uppercase tracking-wider flex items-center gap-1.5">
										<div className="w-1.5 h-1.5 bg-[#11236a] rounded-full" />
										Test Method Details
									</h4>
									<div className="bg-[#f8fafc] border border-zinc-100 rounded-xl p-3 text-xs text-zinc-700 leading-relaxed  whitespace-pre-wrap max-h-48 overflow-y-auto no-scrollbar">
										{selectedProtocolForView.testMethod}
									</div>
								</div>

								<div className="bg-white border border-zinc-200/60 rounded-2xl p-4 shadow-sm space-y-2">
									<h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
										<div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
										Judgement / Pass Criteria
									</h4>
									<div className="bg-[#f8fafc] border border-[#d1fae5]/40 rounded-xl p-3 text-xs text-zinc-700 leading-relaxed  whitespace-pre-wrap max-h-48 overflow-y-auto no-scrollbar">
										{selectedProtocolForView.judgementCriteria}
									</div>
								</div>
							</div>

							{/* Meta timestamps */}
							<div className="flex flex-row items-center gap-2 text-[10px] text-zinc-700 font-semibold bg-zinc-50/50 border border-zinc-150 rounded-xl p-3">
								<Calendar className="w-3.5 h-3.5 text-zinc-650 shrink-0" />
								<span>
									Registered on {new Date(selectedProtocolForView.createdAt).toLocaleDateString(undefined, {
										year: 'numeric',
										month: 'long',
										day: 'numeric',
										hour: '2-digit',
										minute: '2-digit'
									})}
								</span>
							</div>
						</div>
					</div>
				</div>
			)}

			{showDeleteModal && recordToDelete && (
				<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full shadow-2xl p-6 relative overflow-hidden">
						<button
							onClick={() => {
								setShowDeleteModal(false);
								setRecordToDelete(null);
							}}
							className="absolute top-4 right-4 w-7 h-7 bg-zinc-50 border border-zinc-200 rounded-full flex items-center justify-center text-zinc-600 hover:text-red-600 transition-all cursor-pointer outline-none"
						>
							<XCircle className="w-4 h-4" />
						</button>
						<div className="flex items-center gap-3 text-red-650">
							<div className="w-10 h-10 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center shrink-0">
								<AlertTriangle className="w-5 h-5 text-red-600" />
							</div>
							<h3 className="text-base font-bold text-zinc-900">Delete Test Protocol</h3>
						</div>

						<div className="mt-4 space-y-4">
							<p className="text-xs text-zinc-700 font-medium leading-relaxed">Are you sure you want to permanently delete the test protocol{" "}
								<strong className="font-bold text-zinc-800">"{recordToDelete.name}"</strong>
								?
							</p>
							<p className="text-[11px] text-red-500 font-semibold bg-red-50/50 border border-red-150 rounded-xl p-3 leading-normal">Warning: This action is irreversible. All related test requests and active test plans mapped to this protocol will lose their binding.</p>
							<div className="flex gap-3 justify-end pt-2">
								<button
									type="button"
									onClick={() => {
										setShowDeleteModal(false);
										setRecordToDelete(null);
									}}
									className="px-4 py-2 border border-zinc-200 text-zinc-700 rounded-xl text-xs font-bold bg-white hover:bg-zinc-50 transition-all cursor-pointer outline-none"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={() => handleDelete(recordToDelete.id)}
									className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border-none outline-none"
								>
									Confirm Delete
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
