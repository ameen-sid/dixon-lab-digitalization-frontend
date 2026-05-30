import React, { useState, useEffect } from 'react';
import { Layers, Plus, Search, Edit3, Trash2, XCircle, Loader2, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import Pagination from '../../components/Pagination';
import testTypeService from '../../services/operations/testTypeService';

interface TestTypeRecord {
	id: number;
	name: string;
	createdAt: string;
}

export default function TestTypeManagement() {
	const [testTypes, setTestTypes] = useState<TestTypeRecord[]>([]);

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const [searchQuery, setSearchQuery] = useState("");
	const [showAddModal, setShowAddModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [recordToDelete, setRecordToDelete] = useState<TestTypeRecord | null>(null);

	const [typeName, setTypeName] = useState("");
	const [editingId, setEditingId] = useState<number | null>(null);

	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(5);

	const fetchTestTypes = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const data = await testTypeService.getTestTypes()();
			setTestTypes(data);
		} catch (err) {
			console.error('Error fetching test types:', err);
			setError(err instanceof Error ? err.message : 'An unexpected connection error occurred.');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchTestTypes();
	}, []);

	const handleAdd = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!typeName.trim()) {
			showNotification('Please fill in the Test Type Name field.', 'error');
			return;
		}

		try {
			await testTypeService.createTestType(typeName)();
			showNotification(`Test Type "${typeName.trim()}" created successfully!`, 'success');
			resetForm();
			fetchTestTypes();
		} catch (err) {
			showNotification(err instanceof Error ? err.message : 'Connection error creating test type.', 'error');
		}
	};

	const handleEdit = (record: TestTypeRecord) => {
		setEditingId(record.id);
		setTypeName(record.name);
		setShowEditModal(true);
	};

	const handleUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!typeName.trim() || editingId === null) return;

		try {
			await testTypeService.updateTestType(editingId, typeName)();
			showNotification(`Test Type "${typeName.trim()}" updated successfully!`, 'success');
			resetForm();
			fetchTestTypes();
		} catch (err) {
			showNotification(err instanceof Error ? err.message : 'Connection error updating test type.', 'error');
		}
	};

	const handleDelete = async (id: number) => {
		try {
			await testTypeService.deleteTestType(id)();
			showNotification('Test Type deleted successfully.', 'success');
			setShowDeleteModal(false);
			setRecordToDelete(null);
			fetchTestTypes();
		} catch (err) {
			showNotification(err instanceof Error ? err.message : 'Connection error deleting test type.', 'error');
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
		setTypeName("");
		setEditingId(null);
		setShowAddModal(false);
		setShowEditModal(false);
	};

	const filteredRecords = testTypes.filter((t) =>
		t.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

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
					<p className="text-[10px] text-zinc-700 font-bold uppercase tracking-wider">Total Test Types</p>
					<h3 className="text-2xl font-bold text-zinc-950 mt-1">
						{isLoading ? (
							<Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
						) : (
							testTypes.length
						)}
					</h3>
				</div>
			</div>

			<div className="bg-white border border-zinc-200/50 rounded-[20px] p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
				<div className="relative w-full sm:w-80">
					<span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-600">
						<Search className="w-4 h-4" />
					</span>
					<input
						type="text"
						placeholder="Search by test type name..."
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							setCurrentPage(1);
						}}
						className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-800 placeholder-zinc-600 outline-none focus:border-[#11236a] transition-all font-light"
					/>
				</div>
				<div className="w-full sm:w-auto flex flex-row gap-3">
					<button
						onClick={() => {
							resetForm();
							setShowAddModal(true);
						}}
						className="w-full sm:w-auto bg-[#11236a] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#0c1a52] transition-all border-none outline-none"
					>
						<Plus className="w-4 h-4" /> Add Test Type
					</button>
				</div>
			</div>

			<div className="bg-white border border-zinc-200/50 rounded-3xl shadow-sm overflow-hidden">
				{isLoading ? (
					<div className="py-20 flex flex-col items-center justify-center gap-3">
						<Loader2 className="w-8 h-8 text-[#11236a] animate-spin" />
						<p className="text-xs text-zinc-600 font-light">Loading test types registry from DB...</p>
					</div>
				) : (
					<div className="overflow-x-auto flex flex-col justify-between">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 font-bold text-[10px] uppercase tracking-wider">
									<th className="py-4 px-6">Test Type Name</th>
									<th className="py-4 px-6 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-700">
								{paginatedRecords.length === 0 ? (
									<tr>
										<td
											colSpan={2}
											className="py-8 text-center text-zinc-650 font-light"
										> No registered test types found.</td>
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
							itemNamePlural="test types"
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
							<Layers className="w-5 h-5 text-[#11236a]" /> Add Test Type
						</h3>
						<form
							onSubmit={handleAdd}
							className="mt-4 space-y-4"
						>
							<div>
								<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide">Test Type Name <span className="text-red-500">*</span></label>
								<input
									type="text"
									required
									placeholder="e.g. Environmental Stress Screening (ESS)"
									value={typeName}
									onChange={(e) => setTypeName(e.target.value)}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2 mt-1 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all font-light"
								/>
							</div>
							<button
								type="submit"
								className="w-full bg-[#11236a] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-[#0c1a52] transition-all border-none outline-none cursor-pointer"
							>
								Submit Test Type
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
							<Edit3 className="w-5 h-5 text-[#11236a]" /> Edit Test Type
						</h3>
						<form
							onSubmit={handleUpdate}
							className="mt-4 space-y-4"
						>
							<div>
								<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide">Test Type Name <span className="text-red-500">*</span></label>
								<input
									type="text"
									required
									value={typeName}
									onChange={(e) => setTypeName(e.target.value)}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2 mt-1 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all font-light"
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
							<h3 className="text-base font-bold text-zinc-900">Delete Test Type</h3>
						</div>

						<div className="mt-4 space-y-4">
							<p className="text-xs text-zinc-700 font-medium leading-relaxed">Are you sure you want to permanently delete the test type{" "}
								<strong className="font-bold text-zinc-800">"{recordToDelete.name}"</strong>
								?
							</p>
							<p className="text-[11px] text-red-500 font-semibold bg-red-50/50 border border-red-150 rounded-xl p-3 leading-normal">Warning: This action is irreversible. All categories, protocols, and test plans mapped to this test type will also be affected.</p>
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
