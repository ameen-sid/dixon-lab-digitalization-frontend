import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2, XCircle, Loader2, CheckCircle, AlertCircle, AlertTriangle, Cpu } from 'lucide-react';
import Pagination from '../../components/Pagination';
import productPartService from '../../services/operations/productPartService';

interface ProductPartRecord {
	id: number;
	name: string;
	partNo: string;
	createdAt: string;
}

export default function ProductPartManagement() {
	const [parts, setParts] = useState<ProductPartRecord[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const [searchQuery, setSearchQuery] = useState("");
	const [showAddModal, setShowAddModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [recordToDelete, setRecordToDelete] = useState<ProductPartRecord | null>(null);

	// Form states
	const [name, setName] = useState("");
	const [partNo, setPartNo] = useState("");
	const [editingId, setEditingId] = useState<number | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(5);

	const fetchData = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const fetchedParts = await productPartService.getProductParts()();
			setParts(fetchedParts);
		} catch (err) {
			console.error('Error fetching product parts:', err);
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
		if (!name.trim()) return showNotification('Product part name cannot be empty', 'error');


		try {
			await productPartService.createProductPart(name, partNo)();
			showNotification(`Product part "${name.trim()}" created successfully!`, 'success');
			resetForm();
			fetchData();
		} catch (err) {
			showNotification(err instanceof Error ? err.message : 'Connection error creating product part.', 'error');
		}
	};

	const handleEdit = (record: ProductPartRecord) => {
		setEditingId(record.id);
		setName(record.name);
		setPartNo(record.partNo || "");
		setShowEditModal(true);
	};

	const handleUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || editingId === null) return;

		try {
			await productPartService.updateProductPart(editingId, name, partNo)();
			showNotification(`Product part updated successfully!`, 'success');
			resetForm();
			fetchData();
		} catch (err) {
			showNotification(err instanceof Error ? err.message : 'Connection error updating product part.', 'error');
		}
	};

	const handleDelete = async (id: number) => {
		try {
			await productPartService.deleteProductPart(id)();
			showNotification('Product part deleted successfully.', 'success');
			setShowDeleteModal(false);
			setRecordToDelete(null);
			fetchData();
		} catch (err) {
			showNotification(err instanceof Error ? err.message : 'Connection error deleting product part.', 'error');
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
		setPartNo("");
		setEditingId(null);
		setShowAddModal(false);
		setShowEditModal(false);
	};

	const filteredRecords = parts.filter(
		(p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.partNo.toLowerCase().includes(searchQuery.toLowerCase())
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
					<p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total Parts</p>
					<h3 className="text-2xl font-bold text-zinc-950 mt-1">
						{isLoading ? (
							<Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
						) : (
							parts.length
						)}
					</h3>
				</div>
			</div>

			<div className="bg-white border border-zinc-200/50 rounded-[20px] p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
				<div className="relative w-full sm:w-80 shrink-0">
					<span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
						<Search className="w-4 h-4" />
					</span>
					<input
						type="text"
						placeholder="Search by part name or part number..."
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							setCurrentPage(1);
						}}
						className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-800 placeholder-zinc-400 outline-none focus:border-[#11236a] transition-all font-light"
					/>
				</div>
				<button
					onClick={() => {
						resetForm();
						setShowAddModal(true);
					}}
					className="w-full sm:w-auto bg-[#11236a] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#0c1a52] transition-all border-none outline-none shrink-0"
				>
					<Plus className="w-4 h-4" /> Create Product Part
				</button>
			</div>

			<div className="bg-white border border-zinc-200/50 rounded-3xl shadow-sm overflow-hidden">
				{isLoading ? (
					<div className="py-20 flex flex-col items-center justify-center gap-3">
						<Loader2 className="w-8 h-8 text-[#11236a] animate-spin" />
						<p className="text-xs text-zinc-450 font-light">Loading product parts...</p>
					</div>
				) : (
					<div className="overflow-x-auto flex flex-col justify-between">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-bold text-[10px] uppercase tracking-wider">
									<th className="py-4 px-6">Part ID</th>
									<th className="py-4 px-6">Part Name</th>
									<th className="py-4 px-6">Part Number</th>
									<th className="py-4 px-6 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-700">
								{paginatedRecords.length === 0 ? (
									<tr>
										<td
											colSpan={4}
											className="py-8 text-center text-zinc-400 font-light"
										> No registered product parts found.</td>
									</tr>
								) : (
									paginatedRecords.map((item) => (
										<tr
											key={item.id}
											className="hover:bg-zinc-50/50 transition-colors"
										>
											<td className="py-4 px-6 font-mono text-zinc-400 text-xs">#{item.id}</td>
											<td className="py-4 px-6 font-bold text-zinc-800">{item.name}</td>
											<td className="py-4 px-6 font-mono text-zinc-600 bg-zinc-50/30">
												<span className="bg-zinc-100 border border-zinc-200 text-zinc-500 font-bold px-2 py-0.5 rounded text-[10px]">
													{item.partNo}
												</span>
											</td>
											<td className="py-4 px-6 text-right space-x-2 shrink-0">
												<button
													onClick={() => handleEdit(item)}
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
							itemNamePlural="product parts"
						/>
					</div>
				)}
			</div>

			{showAddModal && (
				<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full shadow-2xl p-6 relative">
						<button
							onClick={() => setShowAddModal(false)}
							className="absolute top-4 right-4 w-7 h-7 bg-zinc-50 border border-zinc-200 rounded-full flex items-center justify-center text-zinc-455 hover:text-zinc-700 transition-all cursor-pointer outline-none"
						>
							<XCircle className="w-4 h-4" />
						</button>
						<h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
							<Cpu className="w-5 h-5 text-[#11236a]" /> Create Product Part
						</h3>
						<form
							onSubmit={handleAdd}
							className="mt-4 space-y-4"
						>
							<div>
								<label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wide mb-1">Part Name <span className="text-red-500">*</span></label>
								<input
									type="text"
									required
									placeholder="e.g. ARM Cortex-M4 Microcontroller"
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all font-light"
								/>
							</div>
							<div>
								<label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wide mb-1">Part Number</label>
								<input
									type="text"
									placeholder="e.g. MCU-ARM-M4-64"
									value={partNo}
									onChange={(e) => setPartNo(e.target.value)}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all font-light"
								/>
							</div>
							<button
								type="submit"
								className="w-full bg-[#11236a] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-[#0c1a52] transition-all border-none outline-none cursor-pointer"
							>
								Create Part
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
							className="absolute top-4 right-4 w-7 h-7 bg-zinc-50 border border-zinc-200 rounded-full flex items-center justify-center text-zinc-455 hover:text-zinc-700 transition-all cursor-pointer outline-none"
						>
							<XCircle className="w-4 h-4" />
						</button>
						<h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
							<Edit3 className="w-5 h-5 text-[#11236a]" /> Edit Product Part
						</h3>
						<form
							onSubmit={handleUpdate}
							className="mt-4 space-y-4 text-left"
						>
							<div>
								<label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wide mb-1">Part Name</label>
								<input
									type="text"
									required
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all font-light"
								/>
							</div>
							<div>
								<label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wide mb-1">Part Number</label>
								<input
									type="text"
									value={partNo}
									onChange={(e) => setPartNo(e.target.value)}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all font-light"
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
					<div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full shadow-2xl p-6 relative overflow-hidden">
						<button
							onClick={() => {
								setShowDeleteModal(false);
								setRecordToDelete(null);
							}}
							className="absolute top-4 right-4 w-7 h-7 bg-zinc-50 border border-zinc-200 rounded-full flex items-center justify-center text-zinc-455 hover:text-zinc-700 transition-all cursor-pointer outline-none"
						>
							<XCircle className="w-4 h-4" />
						</button>

						<div className="flex items-center gap-3 text-red-650">
							<div className="w-10 h-10 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center shrink-0">
								<AlertTriangle className="w-5 h-5 text-red-600" />
							</div>
							<h3 className="text-base font-bold text-zinc-900">Delete Product Part</h3>
						</div>

						<div className="mt-4 space-y-4">
							<p className="text-xs text-zinc-500 font-light leading-relaxed">
								Are you sure you want to permanently delete the component registry for{" "}
								<strong className="font-bold text-zinc-800">"{recordToDelete.name}"</strong>?
							</p>
							<p className="text-[11px] text-red-500 font-semibold bg-red-50/50 border border-red-150 rounded-xl p-3 leading-normal">
								Warning: This action is irreversible. The record will be permanently deleted from the database.
							</p>
							<div className="flex gap-3 justify-end pt-2">
								<button
									type="button"
									onClick={() => {
										setShowDeleteModal(false);
										setRecordToDelete(null);
									}}
									className="px-4 py-2 border border-zinc-200 text-zinc-555 rounded-xl text-xs font-bold bg-white hover:bg-zinc-50 transition-all cursor-pointer outline-none"
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
