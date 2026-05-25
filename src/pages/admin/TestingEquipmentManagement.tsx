import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2, XCircle, Loader2, CheckCircle, AlertCircle, AlertTriangle, Cpu, Calendar } from 'lucide-react';
import Pagination from '../../components/Pagination';
import CustomSelect from '../../components/CustomSelect';
import testingEquipmentService from '../../services/operations/testingEquipmentService';

interface TestingEquipmentRecord {
	id: number;
	name: string;
	calibrationDueDate: string;
	status: string;
	createdAt: string;
}

export default function TestingEquipmentManagement() {
	const [equipments, setEquipments] = useState<TestingEquipmentRecord[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const [searchQuery, setSearchQuery] = useState("");
	const [filterStatus, setFilterStatus] = useState<string>("all");
	const [showAddModal, setShowAddModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [recordToDelete, setRecordToDelete] = useState<TestingEquipmentRecord | null>(null);

	// Form states
	const [name, setName] = useState("");
	const [calibrationDueDate, setCalibrationDueDate] = useState("");
	const [status, setStatus] = useState("ACTIVE");
	const [editingId, setEditingId] = useState<number | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(5);

	const fetchData = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const fetchedEquipments = await testingEquipmentService.getTestingEquipments()();
			setEquipments(fetchedEquipments);
		} catch (err) {
			console.error('Error fetching testing equipment:', err);
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
		if (!name.trim()) return showNotification('Equipment name cannot be empty', 'error');
		if (!calibrationDueDate) return showNotification('Please select a calibration due date', 'error');

		try {
			await testingEquipmentService.createTestingEquipment(name, calibrationDueDate, status)();
			showNotification(`Testing equipment "${name.trim()}" registered successfully!`, 'success');
			resetForm();
			fetchData();
		} catch (err) {
			showNotification(err instanceof Error ? err.message : 'Connection error registering equipment.', 'error');
		}
	};

	const handleEdit = (record: TestingEquipmentRecord) => {
		setEditingId(record.id);
		setName(record.name);
		// Format ISO date (e.g., "2026-05-25T00:00:00.000Z") to YYYY-MM-DD for date inputs
		const dateObj = new Date(record.calibrationDueDate);
		const formattedDate = !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : "";
		setCalibrationDueDate(formattedDate);
		setStatus(record.status);
		setShowEditModal(true);
	};

	const handleUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || editingId === null) return;
		if (!calibrationDueDate) return showNotification('Please select a calibration due date', 'error');

		try {
			await testingEquipmentService.updateTestingEquipment(editingId, name, calibrationDueDate, status)();
			showNotification(`Testing equipment updated successfully!`, 'success');
			resetForm();
			fetchData();
		} catch (err) {
			showNotification(err instanceof Error ? err.message : 'Connection error updating equipment.', 'error');
		}
	};

	const handleDelete = async (id: number) => {
		try {
			await testingEquipmentService.deleteTestingEquipment(id)();
			showNotification('Equipment deleted successfully.', 'success');
			setShowDeleteModal(false);
			setRecordToDelete(null);
			fetchData();
		} catch (err) {
			showNotification(err instanceof Error ? err.message : 'Connection error deleting equipment.', 'error');
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
		setCalibrationDueDate("");
		setStatus("ACTIVE");
		setEditingId(null);
		setShowAddModal(false);
		setShowEditModal(false);
	};

	const filteredRecords = equipments.filter((eq) => {
		const matchesSearch = eq.name.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesStatus = filterStatus === "all" || eq.status.toUpperCase() === filterStatus.toUpperCase();
		return matchesSearch && matchesStatus;
	});

	const maxPage = Math.ceil(filteredRecords.length / itemsPerPage);
	const activePage = maxPage > 0 ? Math.min(currentPage, maxPage) : 1;
	if (currentPage !== activePage) {
		setCurrentPage(activePage);
	}

	const startIndex = (activePage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

	const getStatusBadge = (status: string) => {
		switch (status.toUpperCase()) {
			case 'ACTIVE':
				return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
			case 'CALIBRATION_DUE':
				return 'bg-amber-50 text-amber-600 border border-amber-100';
			case 'UNDER_MAINTENANCE':
				return 'bg-rose-50 text-rose-600 border border-rose-100';
			default:
				return 'bg-zinc-50 text-zinc-600 border border-zinc-150';
		}
	};

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
					<p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total Equipments</p>
					<h3 className="text-2xl font-bold text-zinc-950 mt-1">
						{isLoading ? (
							<Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
						) : (
							equipments.length
						)}
					</h3>
				</div>
			</div>

			<div className="bg-white border border-zinc-200/50 rounded-[20px] p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
				<div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch sm:items-center">
					<div className="relative w-full sm:w-80 shrink-0">
						<span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
							<Search className="w-4 h-4" />
						</span>
						<input
							type="text"
							placeholder="Search by equipment name..."
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								setCurrentPage(1);
							}}
							className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-800 placeholder-zinc-400 outline-none focus:border-[#11236a] transition-all font-light"
						/>
					</div>
					<div className="w-full sm:w-56">
						<CustomSelect
							value={filterStatus}
							onChange={(val) => {
								setFilterStatus(val);
								setCurrentPage(1);
							}}
							options={[
								{ value: "all", label: "All Statuses" },
								{ value: "ACTIVE", label: "Active" },
								{ value: "CALIBRATION_DUE", label: "Calibration Due" },
								{ value: "UNDER_MAINTENANCE", label: "Under Maintenance" }
							]}
							placeholder="Filter by Status"
						/>
					</div>

					{(searchQuery !== "" || filterStatus !== "all") && (
						<button
							onClick={() => {
								setSearchQuery("");
								setFilterStatus("all");
								setCurrentPage(1);
							}}
							className="text-xs font-bold text-red-650 hover:text-red-755 bg-red-50 hover:bg-red-100 border border-red-200/50 px-3.5 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shrink-0 text-red-600"
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
					<Plus className="w-4 h-4" /> Register Chamber / Asset
				</button>
			</div>

			<div className="bg-white border border-zinc-200/50 rounded-3xl shadow-sm overflow-hidden">
				{isLoading ? (
					<div className="py-20 flex flex-col items-center justify-center gap-3">
						<Loader2 className="w-8 h-8 text-[#11236a] animate-spin" />
						<p className="text-xs text-zinc-450 font-light">Loading testing equipments registry...</p>
					</div>
				) : (
					<div className="overflow-x-auto flex flex-col justify-between">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-bold text-[10px] uppercase tracking-wider">
									<th className="py-4 px-6">Equipment ID</th>
									<th className="py-4 px-6">Equipment Name</th>
									<th className="py-4 px-6">Calibration Due Date</th>
									<th className="py-4 px-6">Uptime Status</th>
									<th className="py-4 px-6 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-700">
								{paginatedRecords.length === 0 ? (
									<tr>
										<td
											colSpan={5}
											className="py-8 text-center text-zinc-400 font-light"
										> No registered chambers/assets found.</td>
									</tr>
								) : (
									paginatedRecords.map((item) => (
										<tr
											key={item.id}
											className="hover:bg-zinc-50/50 transition-colors"
										>
											<td className="py-4 px-6 font-mono text-zinc-400 text-xs">#{item.id}</td>
											<td className="py-4 px-6 font-bold text-zinc-800">{item.name}</td>
											<td className="py-4 px-6">
												<div className="flex items-center gap-1.5 font-mono text-zinc-600">
													<Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
													<span>
														{new Date(item.calibrationDueDate).toLocaleDateString(undefined, {
															year: 'numeric',
															month: 'short',
															day: 'numeric'
														})}
													</span>
												</div>
											</td>
											<td className="py-4 px-6">
												<span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getStatusBadge(item.status)}`}>
													{item.status.replace('_', ' ')}
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
							itemNamePlural="equipments"
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
							<Cpu className="w-5 h-5 text-[#11236a]" /> Register Testing Asset
						</h3>
						<form
							onSubmit={handleAdd}
							className="mt-4 space-y-4"
						>
							<div>
								<label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wide mb-1">Asset Name <span className="text-red-500">*</span></label>
								<input
									type="text"
									required
									placeholder="e.g. Ultra-Climatic Thermal Chamber"
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all font-light"
								/>
							</div>
							<div>
								<label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wide mb-1">Calibration Due Date <span className="text-red-500">*</span></label>
								<input
									type="date"
									required
									value={calibrationDueDate}
									onChange={(e) => setCalibrationDueDate(e.target.value)}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all font-light"
								/>
							</div>
							<div>
								<label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wide mb-1">Initial Status</label>
								<CustomSelect
									value={status}
									onChange={setStatus}
									options={[
										{ value: "ACTIVE", label: "Active" },
										{ value: "CALIBRATION_DUE", label: "Calibration Due" },
										{ value: "UNDER_MAINTENANCE", label: "Under Maintenance" }
									]}
								/>
							</div>
							<button
								type="submit"
								className="w-full bg-[#11236a] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-[#0c1a52] transition-all border-none outline-none cursor-pointer"
							>
								Register Asset
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
							<Edit3 className="w-5 h-5 text-[#11236a]" /> Edit Testing Equipment
						</h3>
						<form
							onSubmit={handleUpdate}
							className="mt-4 space-y-4 text-left"
						>
							<div>
								<label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wide mb-1">Equipment Name</label>
								<input
									type="text"
									required
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all font-light"
								/>
							</div>
							<div>
								<label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wide mb-1">Calibration Due Date</label>
								<input
									type="date"
									required
									value={calibrationDueDate}
									onChange={(e) => setCalibrationDueDate(e.target.value)}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all font-light"
								/>
							</div>
							<div>
								<label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wide mb-1">Uptime Status</label>
								<CustomSelect
									value={status}
									onChange={setStatus}
									options={[
										{ value: "ACTIVE", label: "Active" },
										{ value: "CALIBRATION_DUE", label: "Calibration Due" },
										{ value: "UNDER_MAINTENANCE", label: "Under Maintenance" }
									]}
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
							<h3 className="text-base font-bold text-zinc-900">Delete Testing Equipment</h3>
						</div>

						<div className="mt-4 space-y-4">
							<p className="text-xs text-zinc-500 font-light leading-relaxed">
								Are you sure you want to permanently delete the physical chamber registry for{" "}
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
