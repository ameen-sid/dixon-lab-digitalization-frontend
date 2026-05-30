import React, { useState, useEffect } from 'react';
import { Layers, Plus, Search, Edit3, Trash2, XCircle, Loader2, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import Pagination from '../../components/Pagination';
import userService from '../../services/operations/userService';
import departmentService from '../../services/operations/departmentService';

interface BackendUser {
	id: number;
	name: string;
	role: string;
	departmentId: number | null;
}

interface DepartmentRecord {
	id: number;
	name: string;
	count: number;
}

export default function DepartmentManagement() {
	const [departments, setDepartments] = useState<DepartmentRecord[]>([]);

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const [deptSearch, setDeptSearch] = useState("");
	const [showAddDeptModal, setShowAddDeptModal] = useState(false);
	const [showEditDeptModal, setShowEditDeptModal] = useState(false);
	const [showDeleteDeptModal, setShowDeleteDeptModal] = useState(false);
	const [deptToDelete, setDeptToDelete] = useState<DepartmentRecord | null>(null);

	const [deptName, setDeptName] = useState("");
	const [editingDeptId, setEditingDeptId] = useState<number | null>(null);

	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(5);

	const fetchDatabaseState = async () => {
		setIsLoading(true);
		setError(null);
		try {
			let activeUsers: BackendUser[] = [];
			try {
				activeUsers = await userService.getUsers()();
			} catch (e) {
				console.warn('Failed to load active users for staff count calculation:', e);
			}

			const fetchedDepts = await departmentService.getDepartments()();
			const mappedRecords: DepartmentRecord[] = fetchedDepts.map((d: { id: number; name: string }) => {
				const staffCount = activeUsers.filter((u: BackendUser) => u.departmentId === d.id).length;
				return { id: d.id, name: d.name, count: staffCount };
			});

			setDepartments(mappedRecords);
		} catch (err) {
			console.error('Error fetching departments:', err);
			setError(err instanceof Error ? err.message : 'An unexpected connection error occurred.');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		let active = true;
		setTimeout(() => {
			if (active) {
				fetchDatabaseState();
			}
		}, 0);
		return () => {
			active = false;
		};
	}, []);

	const handleAddDept = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!deptName.trim()) {
			showNotification('Please fill in the Department Name field.', 'error');
			return;
		}

		try {
			await departmentService.createDepartment(deptName)();
			showNotification(`Department "${deptName.trim()}" created successfully!`, 'success');
			resetDeptForm();
			fetchDatabaseState();
		} catch (err) {
			showNotification(err instanceof Error ? err.message : 'Connection error creating department.', 'error');
		}
	};

	const handleEditDept = (dept: DepartmentRecord) => {
		setEditingDeptId(dept.id);
		setDeptName(dept.name);
		setShowEditDeptModal(true);
	};

	const handleUpdateDept = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!deptName.trim() || editingDeptId === null) return;

		try {
			await departmentService.updateDepartment(editingDeptId, deptName)();
			showNotification(`Department "${deptName.trim()}" updated successfully!`, 'success');
			resetDeptForm();
			fetchDatabaseState();
		} catch (err) {
			showNotification(err instanceof Error ? err.message : 'Connection error updating department.', 'error');
		}
	};

	const handleDeleteDept = async (id: number) => {
		try {
			await departmentService.deleteDepartment(id)();

			showNotification('Department deleted successfully.', 'success');
			setShowDeleteDeptModal(false);
			setDeptToDelete(null);
			fetchDatabaseState();
		} catch (err) {
			showNotification(err instanceof Error ? err.message : 'Connection error deleting department.', 'error');
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

	const resetDeptForm = () => {
		setDeptName("");
		setEditingDeptId(null);
		setShowAddDeptModal(false);
		setShowEditDeptModal(false);
	};

	const filteredDepts = departments.filter((d) => d.name.toLowerCase().includes(deptSearch.toLowerCase()));

	// Adjust page bounds dynamically if currentPage exceeds maxPage (directly during render)
	const maxPage = Math.ceil(filteredDepts.length / itemsPerPage);
	const activePage = maxPage > 0 ? Math.min(currentPage, maxPage) : 1;
	if (currentPage !== activePage) {
		setCurrentPage(activePage);
	}

	const startIndex = (activePage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedDepts = filteredDepts.slice(startIndex, endIndex);

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

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
				<div className="bg-white border border-zinc-200/50 rounded-2xl p-4 shadow-sm">
					<p className="text-[10px] text-zinc-700 font-bold uppercase tracking-wider">Total Departments</p>
					<h3 className="text-2xl font-bold text-zinc-950 mt-1">
						{isLoading ? (
							<Loader2 className="w-5 h-5 animate-spin text-zinc-650" />
						) : (
							departments.length
						)}
					</h3>
				</div>
				<div className="bg-white border border-zinc-200/50 rounded-2xl p-4 shadow-sm">
					<p className="text-[10px] text-zinc-700 font-bold uppercase tracking-wider">Active Staff Assigned</p>
					<h3 className="text-2xl font-bold text-[#11236a] mt-1">
						{isLoading ? (
							<Loader2 className="w-5 h-5 animate-spin text-zinc-650" />
						) : (
							departments.reduce(
								(acc, curr) => acc + curr.count,
								0,
							)
						)}{" "}
						Members
					</h3>
				</div>
			</div>

			<div className="bg-white border border-zinc-200/50 rounded-[20px] p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
				<div className="relative w-full sm:w-80">
					<span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
						<Search className="w-4 h-4" />
					</span>
					<input
						type="text"
						placeholder="Search by department name..."
						value={deptSearch}
						onChange={(e) => {
							setDeptSearch(e.target.value);
							setCurrentPage(1);
						}}
						className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-800 placeholder-zinc-500 outline-none focus:border-[#11236a] transition-all font-light"
					/>
				</div>
				<div className="w-full sm:w-auto flex flex-row gap-3">
					<button
						onClick={() => {
							resetDeptForm();
							setShowAddDeptModal(true);
						}}
						className="w-full sm:w-auto bg-[#11236a] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#0c1a52] transition-all border-none outline-none"
					>
						<Plus className="w-4 h-4" /> Add Department
					</button>
				</div>
			</div>

			<div className="bg-white border border-zinc-200/50 rounded-3xl shadow-sm overflow-hidden">
				{isLoading ? (
					<div className="py-20 flex flex-col items-center justify-center gap-3">
						<Loader2 className="w-8 h-8 text-[#11236a] animate-spin" />
						<p className="text-xs text-zinc-600 font-light">Loading departments registry from Dixon DB...</p>
					</div>
				) : (
					<div className="overflow-x-auto flex flex-col justify-between">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 font-bold text-[10px] uppercase tracking-wider">
									<th className="py-4 px-6">Department Name</th>
									<th className="py-4 px-6">Staff Count</th>
									<th className="py-4 px-6 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-700">
								{paginatedDepts.length === 0 ? (
									<tr>
										<td
											colSpan={3}
											className="py-8 text-center text-zinc-600 font-light"
										> No registered departments found in full-stack registry.</td>
									</tr>
								) : (
									paginatedDepts.map((dept) => (
										<tr
											key={dept.id}
											className="hover:bg-zinc-50/50 transition-colors"
										>
											<td className="py-4 px-6">
												<p className="font-bold text-[#11236a] text-sm">{dept.name}</p>
											</td>
											<td className="py-4 px-6 text-zinc-700">
												<span className="bg-zinc-100 px-2 py-0.5 rounded text-[10px] font-bold">{dept.count} Members</span>
											</td>
											<td className="py-4 px-6 text-right space-x-2">
												<button
													onClick={() =>
														handleEditDept(dept)
													}
													className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 p-1.5 rounded-lg border-none outline-none cursor-pointer transition-all inline-flex items-center justify-center"
													title="Edit"
												>
													<Edit3 className="w-3.5 h-3.5" />
												</button>
												<button
													onClick={() => {
														setDeptToDelete(dept);
														setShowDeleteDeptModal(
															true,
														);
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
							totalItems={filteredDepts.length}
							itemsPerPage={itemsPerPage}
							currentPage={currentPage}
							onPageChange={setCurrentPage}
							onItemsPerPageChange={(limit) => {
								setItemsPerPage(limit);
								setCurrentPage(1);
							}}
							itemNamePlural="departments"
						/>
					</div>
				)}
			</div>

			{showAddDeptModal && (
				<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full shadow-2xl p-6 relative overflow-hidden">
						<button
							onClick={() => setShowAddDeptModal(false)}
							className="absolute top-4 right-4 w-7 h-7 bg-zinc-50 border border-zinc-200 rounded-full flex items-center justify-center text-zinc-600 hover:text-red-600 transition-all cursor-pointer outline-none"
						>
							<XCircle className="w-4 h-4" />
						</button>
						<h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
							<Layers className="w-5 h-5 text-[#11236a]" /> Add Department
						</h3>
						<form
							onSubmit={handleAddDept}
							className="mt-4 space-y-4"
						>
							<div>
								<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide">Department Name <span className="text-red-500">*</span></label>
								<input
									type="text"
									required
									placeholder="e.g. SMT Electronic Assembly Line"
									value={deptName}
									onChange={(e) => setDeptName(e.target.value)}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2 mt-1 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all font-light"
								/>
							</div>
							<button
								type="submit"
								className="w-full bg-[#11236a] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-[#0c1a52] transition-all border-none outline-none cursor-pointer"
							>
								Submit Department
							</button>
						</form>
					</div>
				</div>
			)}

			{showEditDeptModal && (
				<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full shadow-2xl p-6 relative overflow-hidden">
						<button
							onClick={() => setShowEditDeptModal(false)}
							className="absolute top-4 right-4 w-7 h-7 bg-zinc-50 border border-zinc-200 rounded-full flex items-center justify-center text-zinc-600 hover:text-red-600 transition-all cursor-pointer outline-none"
						>
							<XCircle className="w-4 h-4" />
						</button>
						<h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
							<Edit3 className="w-5 h-5 text-[#11236a]" /> Edit Department
						</h3>
						<form
							onSubmit={handleUpdateDept}
							className="mt-4 space-y-4"
						>
							<div>
								<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide">Department Name <span className="text-red-500">*</span></label>
								<input
									type="text"
									required
									value={deptName}
									onChange={(e) => setDeptName(e.target.value)}
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

			{showDeleteDeptModal && deptToDelete && (
				<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full shadow-2xl p-6 relative overflow-hidden">
						<button
							onClick={() => {
								setShowDeleteDeptModal(false);
								setDeptToDelete(null);
							}}
							className="absolute top-4 right-4 w-7 h-7 bg-zinc-50 border border-zinc-200 rounded-full flex items-center justify-center text-zinc-600 hover:text-red-600 transition-all cursor-pointer outline-none"
						>
							<XCircle className="w-4 h-4" />
						</button>
						<div className="flex items-center gap-3 text-red-650">
							<div className="w-10 h-10 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center shrink-0">
								<AlertTriangle className="w-5 h-5 text-red-600" />
							</div>
							<h3 className="text-base font-bold text-zinc-900">Delete Department</h3>
						</div>

						<div className="mt-4 space-y-4">
							<p className="text-xs text-zinc-700 font-medium leading-relaxed">Are you sure you want to permanently delete the department{" "}
								<strong className="font-bold text-zinc-800">"{deptToDelete.name}"</strong>
								?
							</p>
							<p className="text-[11px] text-red-500 font-semibold bg-red-50/50 border border-red-150 rounded-xl p-3 leading-normal">Warning: This action is irreversible. All users currently assigned to this department will have their department assignment revoked ("no department").</p>
							<div className="flex gap-3 justify-end pt-2">
								<button
									type="button"
									onClick={() => {
										setShowDeleteDeptModal(false);
										setDeptToDelete(null);
									}}
									className="px-4 py-2 border border-zinc-200 text-zinc-700 rounded-xl text-xs font-bold bg-white hover:bg-zinc-50 transition-all cursor-pointer outline-none"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={() => handleDeleteDept(deptToDelete.id)}
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
