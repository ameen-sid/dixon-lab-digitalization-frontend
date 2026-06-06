import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit3, Trash2, XCircle, Loader2, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import Pagination from '../../components/Pagination';
import CustomSelect from '../../components/CustomSelect';
import userService from '../../services/operations/userService';
import departmentService from '../../services/operations/departmentService';

interface BackendDepartment {
	id: number;
	name: string;
}

interface UserRecord {
	id: number;
	name: string;
	username: string;
	email: string | null;
	role: string;
	dept: string;
	departmentId: number | null;
}

const mapUIToBackendRole = (uiRole: string): string => {
	switch (uiRole) {
		case 'Engineer':
			return 'Engineer';
		case 'Lab Manager':
			return 'Lab Manager';
		case 'Head':
			return 'Head';
		case 'Inspector':
			return 'Inspector';
		case 'Requester':
			return 'Requester';
		case 'Admin':
			return 'Admin';
		case 'CEO':
			return 'CEO';
		default:
			return 'Requester';
	}
};

const mapBackendRoleToUI = (backendRole: string): string => {
	switch (backendRole) {
		case 'Engineer':
			return 'Engineer';
		case 'Lab Manager':
			return 'Lab Manager';
		case 'Head':
			return 'Head';
		case 'Inspector':
			return 'Inspector';
		case 'Requester':
			return 'Requester';
		case 'Admin':
			return 'Admin';
		case 'CEO':
			return 'CEO';
		default:
			return backendRole;
	}
};

export default function UserManagement() {
	const [users, setUsers] = useState<UserRecord[]>([]);
	const [departments, setDepartments] = useState<BackendDepartment[]>([]);

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const [userSearch, setUserSearch] = useState("");
	const [showAddUserModal, setShowAddUserModal] = useState(false);
	const [showEditUserModal, setShowEditUserModal] = useState(false);
	const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
	const [userToDelete, setUserToDelete] = useState<UserRecord | null>(null);

	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(5);

	const [selectedRoleFilter, setSelectedRoleFilter] = useState("All");
	const [selectedDeptFilter, setSelectedDeptFilter] = useState("All");

	const [usrName, setUsrName] = useState("");
	const [usrUsername, setUsrUsername] = useState("");
	const [usrEmail, setUsrEmail] = useState("");
	const [usrPassword, setUsrPassword] = useState("");
	const [usrRole, setUsrRole] = useState("Engineer");
	const [usrDeptId, setUsrDeptId] = useState<string>("");
	const [editingUserId, setEditingUserId] = useState<number | null>(null);

	const fetchDatabaseState = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const fetchedDepts = await departmentService.getDepartments()();
			setDepartments(fetchedDepts);

			const fetchedUsers = await userService.getUsers()();

			const mappedRecords: UserRecord[] = fetchedUsers.map((u: { id: number; name: string; username: string; email: string | null; role: string; departmentId: number | null }) => {
				const matchingDept = fetchedDepts.find((d: BackendDepartment) => d.id === u.departmentId);
				return {
					id: u.id,
					name: u.name,
					username: u.username,
					email: u.email,
					role: mapBackendRoleToUI(u.role),
					dept: matchingDept ? matchingDept.name : 'no department',
					departmentId: u.departmentId,
				};
			});

			setUsers(mappedRecords);

			if (fetchedDepts.length > 0)	setUsrDeptId(fetchedDepts[0].id.toString());
		} catch (err) {
			console.error('Error fetching database state:', err);
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

	const handleAddUser = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!usrName || !usrUsername || !usrPassword || !usrEmail) {
			showNotification('Please fill in all mandatory fields, including the email and password.', 'error');
			return;
		}

		const backendRole = mapUIToBackendRole(usrRole);
		const isExempt = ['Admin', 'CEO'].includes(backendRole);
		if (!isExempt && !usrDeptId) {
			showNotification('Please assign this user profile to a designated Department.', 'error');
			return;
		}

		if (usrRole === 'Admin' && users.some((u) => u.role === 'Admin')) {
			showNotification('Only one Administrator account is permitted in the system.', 'error');
			return;
		}

		try {
			const bodyData = {
				name: usrName.trim(),
				username: usrUsername.trim().toLowerCase(),
				password: usrPassword,
				role: backendRole,
				departmentId: isExempt ? null : parseInt(usrDeptId),
				email: usrEmail.trim()
			};

			await userService.createUser(bodyData)();
			showNotification('User profile and access key created successfully!', 'success');
			resetUserForm();
			fetchDatabaseState();
		} catch (err) {
			showNotification(err instanceof Error ? err.message : 'Connection error creating profile.', 'error');
		}
	};

	const handleEditUser = (user: UserRecord) => {
		setEditingUserId(user.id);
		setUsrName(user.name);
		setUsrUsername(user.username);
		setUsrEmail(user.email || "");
		setUsrPassword("");
		setUsrRole(user.role);
		setUsrDeptId(user.departmentId ? user.departmentId.toString() : "");
		setShowEditUserModal(true);
	};

	const handleUpdateUser = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!usrName || !usrUsername || !usrEmail || editingUserId === null) {
			showNotification('Please fill in all mandatory fields, including email.', 'error');
			return;
		}

		const backendRole = mapUIToBackendRole(usrRole);
		const isExempt = ['Admin', 'CEO'].includes(backendRole);
		if (!isExempt && !usrDeptId) {
			showNotification('Please assign this user profile to a designated Department.', 'error');
			return;
		}

		if (usrRole === 'Admin' && users.some((u) => u.role === 'Admin' && u.id !== editingUserId)) {
			showNotification('Only one Administrator account is permitted in the system.', 'error');
			return;
		}

		try {
			const bodyData: Record<string, unknown> = {
				name: usrName.trim(),
				username: usrUsername.trim().toLowerCase(),
				role: backendRole,
				departmentId: isExempt ? null : parseInt(usrDeptId),
				email: usrEmail.trim()
			};

			if (usrPassword.trim() !== "")	bodyData.password = usrPassword;
			await userService.updateUser(editingUserId, bodyData)();

			showNotification('User profile settings synchronized successfully!', 'success');
			resetUserForm();
			fetchDatabaseState();
		} catch (err) {
			showNotification(err instanceof Error ? err.message : 'Connection error updating profile.', 'error');
		}
	};

	const handleDeleteUser = async (id: number) => {
		try {
			await userService.deleteUser(id)();
			showNotification('User profile deleted and credentials revoked successfully.', 'success');
			setShowDeleteUserModal(false);
			setUserToDelete(null);
			fetchDatabaseState();
		} catch (err) {
			showNotification(err instanceof Error ? err.message : 'Connection error deleting profile.', 'error');
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

	const resetUserForm = () => {
		setUsrName("");
		setUsrUsername("");
		setUsrEmail("");
		setUsrPassword("");
		setUsrRole('Engineer');
		setUsrDeptId(departments.length > 0 ? departments[0].id.toString() : "");
		setEditingUserId(null);
		setShowAddUserModal(false);
		setShowEditUserModal(false);
	};

	const filteredUsers = users.filter((u) => {
		const matchesSearch =
			u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
			u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
			u.role.toLowerCase().includes(userSearch.toLowerCase()) ||
			u.dept.toLowerCase().includes(userSearch.toLowerCase());

		const matchesRole = selectedRoleFilter === "All" || u.role === selectedRoleFilter;
		const matchesDept = selectedDeptFilter === "All" || u.dept === selectedDeptFilter;
		return matchesSearch && matchesRole && matchesDept;
	});

	// Adjust page bounds dynamically if currentPage exceeds maxPage (directly during render)
	const maxPage = Math.ceil(filteredUsers.length / itemsPerPage);
	const activePage = maxPage > 0 ? Math.min(currentPage, maxPage) : 1;
	if (currentPage !== activePage) {
		setCurrentPage(activePage);
	}

	const startIndex = (activePage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

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
					<p className="text-[10px] text-zinc-700 font-bold uppercase tracking-wider">Total Profiles</p>
					<h3 className="text-2xl font-bold text-zinc-950 mt-1">
						{isLoading ? (
							<Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
						) : (
							users.length
						)}
					</h3>
				</div>
				<div className="bg-white border border-zinc-200/50 rounded-2xl p-4 shadow-sm">
					<p className="text-[10px] text-zinc-700 font-bold uppercase tracking-wider">Inspector Roles</p>
					<h3 className="text-2xl font-bold text-zinc-950 mt-1">
						{isLoading ? (
							<Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
						) : (
							users.filter((u) => u.role === "Inspector").length
						)}{" "}
						Inspector
					</h3>
				</div>
				<div className="bg-white border border-zinc-200/50 rounded-2xl p-4 shadow-sm">
					<p className="text-[10px] text-zinc-700 font-bold uppercase tracking-wider">Requester Roles</p>
					<h3 className="text-2xl font-bold text-[#11236a] mt-1">
						{isLoading ? (
							<Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
						) : (
							users.filter((u) => u.role === "Requester").length
						)}{" "}
						Requester
					</h3>
				</div>
			</div>

			<div className="bg-white border border-zinc-200/50 rounded-[20px] p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
				<div className="w-full md:w-auto flex flex-col sm:flex-row gap-4 items-center flex-1">
					<div className="relative w-full sm:w-64">
						<span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-600">
							<Search className="w-4 h-4" />
						</span>
						<input
							type="text"
							placeholder="Search by profile name, username..."
							value={userSearch}
							onChange={(e) => {
								setUserSearch(e.target.value);
								setCurrentPage(1);
							}}
							className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-800 placeholder-zinc-600 outline-none focus:border-[#11236a] transition-all font-light"
						/>
					</div>

					<div className="flex items-center gap-2 w-full sm:w-auto">
						<span className="text-[10px] text-zinc-700 font-bold uppercase tracking-wider whitespace-nowrap">Role:</span>
						<CustomSelect
							value={selectedRoleFilter}
							onChange={(val) => {
								setSelectedRoleFilter(val);
								setCurrentPage(1);
							}}
							options={[
								{ value: "All", label: "All Roles" },
								{ value: "Engineer", label: "Engineer" },
								{ value: "Lab Manager", label: "Lab Manager" },
								{ value: "Head", label: "Head" },
								{ value: "Inspector", label: "Inspector" },
								{ value: "Requester", label: "Requester" },
								{ value: "Admin", label: "Admin" },
								{ value: "CEO", label: "CEO" },
							]}
							className="w-full sm:w-40"
						/>
					</div>

					<div className="flex items-center gap-2 w-full sm:w-auto">
						<span className="text-[10px] text-zinc-700 font-bold uppercase tracking-wider whitespace-nowrap">Dept:</span>
						<CustomSelect
							value={selectedDeptFilter}
							onChange={(val) => {
								setSelectedDeptFilter(val);
								setCurrentPage(1);
							}}
							options={[
								{ value: "All", label: "All Departments" },
								{ value: "no department", label: "No Department" },
								...departments.map((d) => ({ value: d.name, label: d.name })),
							]}
							className="w-full sm:w-48"
						/>
					</div>

					{(userSearch !== "" || selectedRoleFilter !== "All" || selectedDeptFilter !== "All") && (
						<button
							onClick={() => {
								setUserSearch("");
								setSelectedRoleFilter("All");
								setSelectedDeptFilter("All");
								setCurrentPage(1);
							}}
							className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/50 px-3.5 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
						>
							<XCircle className="w-3.5 h-3.5 text-red-500" /> Clear Filters
						</button>
					)}
				</div>
				<button
					onClick={() => {
						resetUserForm();
						setShowAddUserModal(true);
					}}
					className="w-full md:w-auto bg-[#11236a] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#0c1a52] transition-all border-none outline-none shrink-0"
				>
					<Plus className="w-4 h-4" /> Create User Profile
				</button>
			</div>

			<div className="bg-white border border-zinc-200/50 rounded-3xl shadow-sm overflow-hidden">
				{isLoading ? (
					<div className="py-20 flex flex-col items-center justify-center gap-3">
						<Loader2 className="w-8 h-8 text-[#11236a] animate-spin" />
						<p className="text-xs text-zinc-600 font-light">Loading full-stack records from Dixon DB...</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 font-bold text-[10px] uppercase tracking-wider">
									<th className="py-4 px-6">Portal Name</th>
									<th className="py-4 px-6">Username (UID)</th>
									<th className="py-4 px-6">Email Address</th>
									<th className="py-4 px-6">Role Assignment</th>
									<th className="py-4 px-6">Department Name</th>
									<th className="py-4 px-6 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-700">
								{paginatedUsers.length === 0 ? (
									<tr>
										<td
											colSpan={6}
											className="py-8 text-center text-zinc-600 font-light"
										> No user credentials found in full-stack registry.</td>
									</tr>
								) : (
									paginatedUsers.map((user) => (
										<tr
											key={user.id}
											className="hover:bg-zinc-50/50 transition-colors"
										>
											<td className="py-4 px-6">
												<p className="font-bold text-zinc-900">{user.name}</p>
											</td>
											<td className="py-4 px-6 text-zinc-700 font-medium">{user.username}</td>
											<td className="py-4 px-6 text-zinc-700 font-medium">{user.email || <em className="text-zinc-400 font-normal">NULL</em>}</td>
											<td className="py-4 px-6">
												<span className="bg-[#11236a]/10 text-[#11236a] text-[9px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide">{user.role}</span>
											</td>
											<td className="py-4 px-6 text-zinc-700 font-medium">
												<span className="bg-zinc-100/80 border border-zinc-200/50 px-2 py-0.5 rounded text-[10px] font-bold">{user.dept}</span>
											</td>
											<td className="py-4 px-6 text-right space-x-2">
												<button
													onClick={() => handleEditUser(user)}
													className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 p-1.5 rounded-lg border-none outline-none cursor-pointer transition-all inline-flex items-center justify-center"
													title="Edit User"
												>
													<Edit3 className="w-3.5 h-3.5" />
												</button>
												<button
													onClick={() => {
														setUserToDelete(user);
														setShowDeleteUserModal(true);
													}}
													className="bg-red-50 hover:bg-red-100 text-red-600 p-1.5 rounded-lg border-none outline-none cursor-pointer transition-all inline-flex items-center justify-center"
													title="Remove Profile"
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
							totalItems={filteredUsers.length}
							itemsPerPage={itemsPerPage}
							currentPage={currentPage}
							onPageChange={setCurrentPage}
							onItemsPerPageChange={(limit) => {
								setItemsPerPage(limit);
								setCurrentPage(1);
							}}
							itemNamePlural="users"
						/>
					</div>
				)}
			</div>

			{showAddUserModal && (
				<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full shadow-2xl p-6 relative">
						<button
							onClick={() => setShowAddUserModal(false)}
							className="absolute top-4 right-4 w-7 h-7 bg-zinc-50 border border-zinc-200 rounded-full flex items-center justify-center text-zinc-600 hover:text-red-600 transition-all cursor-pointer outline-none"
						>
							<XCircle className="w-4 h-4" />
						</button>
						<h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
							<Users className="w-5 h-5 text-[#11236a]" /> Create Portal Credentials
						</h3>
						<form
							onSubmit={handleAddUser}
							className="mt-4 space-y-4"
						>
							<div>
								<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide">Full Name <span className="text-red-500">*</span></label>
								<input
									type="text"
									required
									placeholder="e.g. Ramesh Kumar"
									value={usrName}
									onChange={(e) => setUsrName(e.target.value)}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2 mt-1 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all font-light"
								/>
							</div>
							<div>
								<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide">Email Address <span className="text-red-500">*</span></label>
								<input
									type="email"
									required
									placeholder="e.g. user@dixoninfo.com"
									value={usrEmail}
									onChange={(e) => setUsrEmail(e.target.value)}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2 mt-1 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all font-light"
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide">Username (UID) <span className="text-red-500">*</span></label>
									<input
										type="text"
										required
										placeholder="e.g. ramesh.eng"
										value={usrUsername}
										onChange={(e) => setUsrUsername(e.target.value)}
										className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2 mt-1 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all font-light"
									/>
								</div>
								<div>
									<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide">Password (Secret) <span className="text-red-500">*</span></label>
									<input
										type="password"
										required
										placeholder="Secret access password"
										value={usrPassword}
										onChange={(e) => setUsrPassword(e.target.value)}
										className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2 mt-1 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all font-light"
									/>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide">Role Assignment <span className="text-red-500">*</span></label>
									<CustomSelect
										value={usrRole}
										onChange={setUsrRole}
										options={[
											{ value: "Engineer", label: "Engineer" },
											{ value: "Lab Manager", label: "Lab Manager" },
											{ value: "Head", label: "Head" },
											{ value: "Inspector", label: "Inspector" },
											{ value: "Requester", label: "Requester" },
											{ value: "CEO", label: "CEO" },
										]}
										className="mt-1"
									/>
								</div>
								<div>
									<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide">Department Name {!["Admin", "CEO"].includes(mapUIToBackendRole(usrRole)) && <span className="text-red-500">*</span>}</label>
									<CustomSelect
										value={usrDeptId}
										onChange={setUsrDeptId}
										disabled={["Admin", "CEO"].includes(mapUIToBackendRole(usrRole))}
										options={
											departments.length === 0
												? []
												: departments.map((d) => ({
													value: d.id.toString(),
													label: d.name,
												}))
										}
										placeholder="No Departments Available"
										className="mt-1"
									/>
								</div>
							</div>
							<button
								type="submit"
								className="w-full bg-[#11236a] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-[#0c1a52] transition-all border-none outline-none cursor-pointer"
							>
								Create Portal Profile
							</button>
						</form>
					</div>
				</div>
			)}

			{showEditUserModal && (
				<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full shadow-2xl p-6 relative">
						<button
							onClick={() => setShowEditUserModal(false)}
							className="absolute top-4 right-4 w-7 h-7 bg-zinc-50 border border-zinc-200 rounded-full flex items-center justify-center text-zinc-600 hover:text-red-600 transition-all cursor-pointer outline-none"
						>
							<XCircle className="w-4 h-4" />
						</button>
						<h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
							<Edit3 className="w-5 h-5 text-[#11236a]" /> Edit User Credentials
						</h3>
						<form
							onSubmit={handleUpdateUser}
							className="mt-4 space-y-4"
						>
							<div>
								<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide">Full Name</label>
								<input
									type="text"
									required
									value={usrName}
									onChange={(e) => setUsrName(e.target.value)}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2 mt-1 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all font-light"
								/>
							</div>
							<div>
								<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide">Email Address <span className="text-red-500">*</span></label>
								<input
									type="email"
									required
									placeholder="e.g. user@dixoninfo.com"
									value={usrEmail}
									onChange={(e) => setUsrEmail(e.target.value)}
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2 mt-1 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all font-light"
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide">Username (UID)</label>
									<input
										type="text"
										required
										value={usrUsername}
										onChange={(e) => setUsrUsername(e.target.value)}
										className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2 mt-1 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all font-light"
									/>
								</div>
								<div>
									<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide">New Password (Optional)</label>
									<input
										type="password"
										placeholder="Leave empty to retain same"
										value={usrPassword}
										onChange={(e) => setUsrPassword(e.target.value)}
										className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-2 mt-1 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all font-light"
									/>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide">Role Assignment</label>
									<CustomSelect
										value={usrRole}
										onChange={setUsrRole}
										options={[
											{ value: "Engineer", label: "Engineer" },
											{ value: "Lab Manager", label: "Lab Manager" },
											{ value: "Head", label: "Head" },
											{ value: "Inspector", label: "Inspector" },
											{ value: "Requester", label: "Requester" },
											{ value: "CEO", label: "CEO" },
										]}
										className="mt-1"
									/>
								</div>
								<div>
									<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide">Department Name</label>
									<CustomSelect
										value={usrDeptId}
										onChange={setUsrDeptId}
										disabled={["Admin", "CEO"].includes(mapUIToBackendRole(usrRole))}
										options={
											departments.length === 0
												? []
												: departments.map((d) => ({ value: d.id.toString(), label: d.name}))
										}
										placeholder="No Departments Available"
										className="mt-1"
									/>
								</div>
							</div>
							<button
								type="submit"
								className="w-full bg-[#11236a] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-[#0c1a52] transition-all border-none outline-none cursor-pointer"
							>
								Save Profile Changes
							</button>
						</form>
					</div>
				</div>
			)}

			{showDeleteUserModal && userToDelete && (
				<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full shadow-2xl p-6 relative overflow-hidden">
						<button
							onClick={() => {
								setShowDeleteUserModal(false);
								setUserToDelete(null);
							}}
							className="absolute top-4 right-4 w-7 h-7 bg-zinc-50 border border-zinc-200 rounded-full flex items-center justify-center text-zinc-600 hover:text-red-600 transition-all cursor-pointer outline-none"
						>
							<XCircle className="w-4 h-4" />
						</button>

						<div className="flex items-center gap-3 text-red-650">
							<div className="w-10 h-10 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center shrink-0">
								<AlertTriangle className="w-5 h-5 text-red-600" />
							</div>
							<h3 className="text-base font-bold text-zinc-900">Delete User Profile</h3>
						</div>

						<div className="mt-4 space-y-4">
							<p className="text-xs text-zinc-700 font-medium leading-relaxed">
								Are you sure you want to permanently delete the user profile for{" "}
								<strong className="font-bold text-zinc-800">"{userToDelete.name}"</strong> ?
							</p>
							<p className="text-[11px] text-red-500 font-semibold bg-red-50/50 border border-red-150 rounded-xl p-3 leading-normal">Warning: This action is irreversible. The credentials will be revoked immediately and they will no longer be able to log in to the Dixon Lab management system.</p>
							<div className="flex gap-3 justify-end pt-2">
								<button
									type="button"
									onClick={() => {
										setShowDeleteUserModal(false);
										setUserToDelete(null);
									}}
									className="px-4 py-2 border border-zinc-200 text-zinc-700 rounded-xl text-xs font-bold bg-white hover:bg-zinc-50 transition-all cursor-pointer outline-none"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={() => handleDeleteUser(userToDelete.id)}
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
