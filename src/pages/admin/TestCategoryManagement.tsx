import React, { useState, useEffect } from 'react';
import { Layers, Plus, Search, Edit3, Trash2, XCircle, Loader2, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import Pagination from '../../components/Pagination';
import CustomSelect from '../../components/CustomSelect';
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
	testType?: TestTypeRecord | null;
	createdAt: string;
}

export default function TestCategoryManagement() {
	const [categories, setCategories] = useState<TestCategoryRecord[]>([]);
	const [testTypes, setTestTypes] = useState<TestTypeRecord[]>([]);

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const [searchQuery, setSearchQuery] = useState("");
	const [filterTestTypeId, setFilterTestTypeId] = useState<string>("");
	const [showAddModal, setShowAddModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [recordToDelete, setRecordToDelete] = useState<TestCategoryRecord | null>(null);

	const [categoryName, setCategoryName] = useState("");
	const [selectedTestTypeId, setSelectedTestTypeId] = useState<string>("");
	const [editingId, setEditingId] = useState<number | null>(null);

	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(5);

	const fetchData = async () => {
		setIsLoading(true);
		setError(null);
		try {
			// Fetch test types for select dropdown
			const fetchedTypes = await testTypeService.getTestTypes()();
			setTestTypes(fetchedTypes);

			// Fetch test categories
			const fetchedCats = await testCategoryService.getTestCategories()();
			setCategories(fetchedCats);
		} catch (err) {
			console.error('Error fetching categories/types:', err);
			setError(err instanceof Error ? err.message : 'An unexpected connection error occurred.');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const handleAdd = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!categoryName.trim()) {
			showNotification('Please fill in the Category Name field.', 'error');
			return;
		}
		if (!selectedTestTypeId) {
			showNotification('Please select a parent Test Type.', 'error');
			return;
		}

		try {
			await testCategoryService.createTestCategory(categoryName, Number(selectedTestTypeId))();
			showNotification(`Test Category "${categoryName.trim()}" created successfully!`, 'success');
			resetForm();
			fetchData();
		} catch (err) {
			showNotification(err instanceof Error ? err.message : 'Connection error creating test category.', 'error');
		}
	};

	const handleEdit = (record: TestCategoryRecord) => {
		setEditingId(record.id);
		setCategoryName(record.name);
		setSelectedTestTypeId(record.testTypeId ? record.testTypeId.toString() : "");
		setShowEditModal(true);
	};

	const handleUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!categoryName.trim() || editingId === null) return;
		if (!selectedTestTypeId) {
			showNotification('Please select a parent Test Type.', 'error');
			return;
		}

		try {
			await testCategoryService.updateTestCategory(editingId, categoryName, Number(selectedTestTypeId))();
			showNotification(`Test Category "${categoryName.trim()}" updated successfully!`, 'success');
			resetForm();
			fetchData();
		} catch (err) {
			showNotification(err instanceof Error ? err.message : 'Connection error updating test category.', 'error');
		}
	};

	const handleDelete = async (id: number) => {
		try {
			await testCategoryService.deleteTestCategory(id)();
			showNotification('Test Category deleted successfully.', 'success');
			setShowDeleteModal(false);
			setRecordToDelete(null);
			fetchData();
		} catch (err) {
			showNotification(err instanceof Error ? err.message : 'Connection error deleting test category.', 'error');
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
		setCategoryName("");
		setSelectedTestTypeId("");
		setEditingId(null);
		setShowAddModal(false);
		setShowEditModal(false);
	};

	const filteredRecords = categories.filter((c) => {
		const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			c.testType?.name.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesType = !filterTestTypeId || c.testTypeId === Number(filterTestTypeId);
		return matchesSearch && matchesType;
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
					<p className="text-[10px] text-zinc-700 font-bold uppercase tracking-wider">Total Categories</p>
					<h3 className="text-2xl font-bold text-zinc-950 mt-1">
						{isLoading ? (
							<Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
						) : (
							categories.length
						)}
					</h3>
				</div>
			</div>

			<div className="bg-white border border-zinc-200/50 rounded-[20px] p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
				<div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch sm:items-center">
					<div className="relative w-full sm:w-80">
						<span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-600">
							<Search className="w-4 h-4" />
						</span>
						<input
							type="text"
							placeholder="Search by category name..."
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								setCurrentPage(1);
							}}
							className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-800 placeholder-zinc-600 outline-none focus:border-[#11236a] transition-all font-light"
						/>
					</div>
					<div className="w-full sm:w-64">
						<CustomSelect
							value={filterTestTypeId}
							onChange={(val) => {
								setFilterTestTypeId(val);
								setCurrentPage(1);
							}}
							options={[
								{ value: "", label: "All Test Types" },
								...testTypes.map((t) => ({ value: t.id.toString(), label: t.name }))
							]}
							placeholder="All Test Types"
						/>
					</div>

					{(searchQuery !== "" || filterTestTypeId !== "") && (
						<button
							onClick={() => {
								setSearchQuery("");
								setFilterTestTypeId("");
								setCurrentPage(1);
							}}
							className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/50 px-3.5 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
						>
							<XCircle className="w-3.5 h-3.5 text-red-500" /> Clear Filters
						</button>
					)}
				</div>
				<div className="w-full lg:w-auto flex flex-row gap-3">
					<button
						onClick={() => {
							resetForm();
							setShowAddModal(true);
						}}
						className="w-full lg:w-auto bg-[#11236a] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#0c1a52] transition-all border-none outline-none"
					>
						<Plus className="w-4 h-4" /> Add Category
					</button>
				</div>
			</div>

			<div className="bg-white border border-zinc-200/50 rounded-3xl shadow-sm overflow-hidden">
				{isLoading ? (
					<div className="py-20 flex flex-col items-center justify-center gap-3">
						<Loader2 className="w-8 h-8 text-[#11236a] animate-spin" />
						<p className="text-xs text-zinc-600 font-light">Loading test categories registry...</p>
					</div>
				) : (
					<div className="overflow-x-auto flex flex-col justify-between">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 font-bold text-[10px] uppercase tracking-wider">
									<th className="py-4 px-6">Category Name</th>
									<th className="py-4 px-6">Parent Test Type</th>
									<th className="py-4 px-6 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-700">
								{paginatedRecords.length === 0 ? (
									<tr>
										<td
											colSpan={3}
											className="py-8 text-center text-zinc-600 font-light"
										> No registered categories found.</td>
									</tr>
								) : (
									paginatedRecords.map((item) => (
										<tr
											key={item.id}
											className="hover:bg-zinc-50/50 transition-colors"
										>
											<td className="py-4 px-6">
												<p className="font-bold text-[#11236a] text-sm">{item.name}</p>
											</td>
											<td className="py-4 px-6">
												<span className="bg-zinc-100 px-3 py-1 rounded-full text-[10px] font-bold text-zinc-800">
													{item.testType?.name || 'No Test Type Assigned'}
												</span>
											</td>
											<td className="py-4 px-6 text-right space-x-2">
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
							itemNamePlural="categories"
						/>
					</div>
				)}
			</div>

			{showAddModal && (
				<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full shadow-2xl p-6 relative">
						<button
							onClick={() => setShowAddModal(false)}
							className="absolute top-4 right-4 w-7 h-7 bg-zinc-50 border border-zinc-200 rounded-full flex items-center justify-center text-zinc-600 hover:text-red-600 transition-all cursor-pointer outline-none"
						>
							<XCircle className="w-4 h-4" />
						</button>
						<h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
							<Layers className="w-5 h-5 text-[#11236a]" /> Add Test Category
						</h3>
						<form
							onSubmit={handleAdd}
							className="mt-4 space-y-4"
						>
							<div>
								<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide">Category Name <span className="text-red-500">*</span></label>
								<input
									type="text"
									required
									placeholder="e.g. Mechanical Fatigue Testing"
									value={categoryName}
									onChange={(e) => setCategoryName(e.target.value)}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2 mt-1 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all font-light"
								/>
							</div>
							<div className="mt-1">
								<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide mb-1">Parent Test Type <span className="text-red-500">*</span></label>
								<CustomSelect
									value={selectedTestTypeId}
									onChange={setSelectedTestTypeId}
									options={testTypes.map((type) => ({ value: type.id.toString(), label: type.name }))}
									placeholder="-- Select Test Type --"
								/>
							</div>
							<button
								type="submit"
								className="w-full bg-[#11236a] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-[#0c1a52] transition-all border-none outline-none cursor-pointer"
							>
								Submit Category
							</button>
						</form>
					</div>
				</div>
			)}

			{showEditModal && (
				<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full shadow-2xl p-6 relative">
						<button
							onClick={() => setShowEditModal(false)}
							className="absolute top-4 right-4 w-7 h-7 bg-zinc-50 border border-zinc-200 rounded-full flex items-center justify-center text-zinc-600 hover:text-red-600 transition-all cursor-pointer outline-none"
						>
							<XCircle className="w-4 h-4" />
						</button>
						<h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
							<Edit3 className="w-5 h-5 text-[#11236a]" /> Edit Test Category
						</h3>
						<form
							onSubmit={handleUpdate}
							className="mt-4 space-y-4"
						>
							<div>
								<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide">Category Name</label>
								<input
									type="text"
									required
									value={categoryName}
									onChange={(e) => setCategoryName(e.target.value)}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2 mt-1 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all font-light"
								/>
							</div>
							<div className="mt-1">
								<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide mb-1">Parent Test Type</label>
								<CustomSelect
									value={selectedTestTypeId}
									onChange={setSelectedTestTypeId}
									options={testTypes.map((type) => ({ value: type.id.toString(), label: type.name }))}
									placeholder="-- Select Test Type --"
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

			{showDeleteModal && recordToDelete && (
				<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full shadow-2xl p-6 relative">
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
							<h3 className="text-base font-bold text-zinc-900">Delete Test Category</h3>
						</div>

						<div className="mt-4 space-y-4">
							<p className="text-xs text-zinc-700 font-medium leading-relaxed">Are you sure you want to permanently delete the test category{" "}
								<strong className="font-bold text-zinc-800">"{recordToDelete.name}"</strong>
								?
							</p>
							<p className="text-[11px] text-red-500 font-semibold bg-red-50/50 border border-red-150 rounded-xl p-3 leading-normal">Warning: This action is irreversible. All related test plans and protocols mapped to this category will also be affected.</p>
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
