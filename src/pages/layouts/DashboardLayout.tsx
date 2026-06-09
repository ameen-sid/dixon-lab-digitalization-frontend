import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Compass, Server, Activity, Layers, Users, Settings, FolderOpen, FileText, Cpu, Briefcase, Wrench, CheckSquare } from 'lucide-react';
import { logout } from '../../services/operations/authService';

interface DashboardLayoutProps {
	children: React.ReactNode;
	title: string;
	description?: string;
	activeTab?: string;
	onTabChange?: (tab: string) => void;
}

export default function DashboardLayout({ children, title, activeTab, onTabChange }: DashboardLayoutProps) {
	const navigate = useNavigate();
	const location = useLocation();
	const [isCollapsed, setIsCollapsed] = useState(false);
	
	const userStr = localStorage.getItem('user');
	const user = userStr ? JSON.parse(userStr) : { name: 'System User', role: 'Requester', username: 'user' };

	const handleLogout = async () => {
		const action = logout();
		await action();
		navigate('/');
	};

	const path = location.pathname;
	let derivedActiveTab = activeTab;
	if (user.role.toLowerCase() === 'requester') {
		if (path.includes('/requester/my-requests') || path.includes('/requester/requests/new') || path.includes('/requester/requests/track')) {
			derivedActiveTab = 'my-requests';
		} else if (path.includes('/requester/capa') || path.includes('/requester/capa/new') || path.includes('/requester/capa/details')) {
			derivedActiveTab = 'capa-management';
		} else {
			derivedActiveTab = 'dashboard';
		}
	} else if (user.role.toLowerCase() === 'lab manager') {
		if (path.includes('/admin/platform-availability')) {
			derivedActiveTab = 'platform-availability';
		} else if (path.includes('/admin/nabl-station-availability')) {
			derivedActiveTab = 'nabl-station-availability';
		} else if (path.includes('/admin/equipment-availability')) {
			derivedActiveTab = 'equipment-availability';
		} else if (path.includes('/manager/approved-requests') || path.includes('/manager/approved-request-details')) {
			derivedActiveTab = 'approved-requests';
		} else if (path.includes('/manager/assigned-samples')) {
			derivedActiveTab = 'assigned-samples';
		} else if (path.includes('/manager/capa-management')) {
			derivedActiveTab = 'capa-management';
		} else if (path.includes('/manager/test-plans')) {
			derivedActiveTab = 'test-plans';
		} else {
			derivedActiveTab = 'dashboard';
		}
	} else if (user.role.toLowerCase() === 'engineer') {
		if (path.includes('/engineer/assigned-samples')) {
			derivedActiveTab = 'assigned-samples';
		} else if (path.includes('/engineer/test-report')) {
			derivedActiveTab = 'test-report';
		} else {
			derivedActiveTab = 'dashboard';
		}
	} else if (user.role.toLowerCase() === 'inspector') {
		if (path.includes('/inspector/daily-checksheet') || path.includes('/inspector/checksheet')) {
			derivedActiveTab = 'daily-checksheet';
		} else {
			derivedActiveTab = 'dashboard';
		}
	} else if (user.role.toLowerCase() === 'admin') {
		if (path.includes('/admin/dashboard')) {
			derivedActiveTab = 'dashboard';
		} else if (path.includes('/admin/platform-availability')) {
			derivedActiveTab = 'platform-availability';
		} else if (path.includes('/admin/nabl-station-availability')) {
			derivedActiveTab = 'nabl-station-availability';
		} else if (path.includes('/admin/equipment-availability')) {
			derivedActiveTab = 'equipment-availability';
		} else if (path.includes('/admin/departments-management')) {
			derivedActiveTab = 'departments-management';
		} else if (path.includes('/admin/users-management')) {
			derivedActiveTab = 'users-management';
		} else if (path.includes('/admin/test-types')) {
			derivedActiveTab = 'test-types-management';
		} else if (path.includes('/admin/test-categories')) {
			derivedActiveTab = 'test-category-management';
		} else if (path.includes('/admin/test-protocols')) {
			derivedActiveTab = 'test-protocols-management';
		} else if (path.includes('/admin/product-part-names')) {
			derivedActiveTab = 'product-part-names';
		} else if (path.includes('/admin/suppliers-customers')) {
			derivedActiveTab = 'suppliers-customers';
		} else if (path.includes('/admin/rd-equipment')) {
			derivedActiveTab = 'rd-testing-equipments';
		} else {
			derivedActiveTab = 'dashboard';
		}
	} else if (user.role.toLowerCase() === 'ceo') {
		derivedActiveTab = 'dashboard';
	}

	const handleTabClick = (itemId: string) => {
		const userRoleLower = user.role.toLowerCase();
		if (userRoleLower === 'requester') {
			if (itemId === 'dashboard') navigate('/requester/dashboard');
			else if (itemId === 'my-requests') navigate('/requester/my-requests');
			else if (itemId === 'capa-management') navigate('/requester/capa');
		} else if (userRoleLower === 'admin') {
			if (itemId === 'dashboard') navigate('/admin/dashboard');
			else if (itemId === 'platform-availability') navigate('/admin/platform-availability');
			else if (itemId === 'nabl-station-availability') navigate('/admin/nabl-station-availability');
			else if (itemId === 'equipment-availability') navigate('/admin/equipment-availability');
			else if (itemId === 'departments-management') navigate('/admin/departments-management');
			else if (itemId === 'users-management') navigate('/admin/users-management');
			else if (itemId === 'test-types-management') navigate('/admin/test-types');
			else if (itemId === 'test-category-management') navigate('/admin/test-categories');
			else if (itemId === 'test-protocols-management') navigate('/admin/test-protocols');
			else if (itemId === 'product-part-names') navigate('/admin/product-part-names');
			else if (itemId === 'suppliers-customers') navigate('/admin/suppliers-customers');
			else if (itemId === 'rd-testing-equipments') navigate('/admin/rd-equipment');
		} else if (userRoleLower === 'lab manager') {
			if (itemId === 'dashboard') navigate('/manager/dashboard');
			else if (itemId === 'platform-availability') navigate('/admin/platform-availability');
			else if (itemId === 'nabl-station-availability') navigate('/admin/nabl-station-availability');
			else if (itemId === 'equipment-availability') navigate('/admin/equipment-availability');
			else if (itemId === 'approved-requests') navigate('/manager/approved-requests');
			else if (itemId === 'assigned-samples') navigate('/manager/assigned-samples');
			else if (itemId === 'capa-management') navigate('/manager/capa-management');
			else if (itemId === 'test-plans') navigate('/manager/test-plans');
		} else if (userRoleLower === 'engineer') {
			if (itemId === 'dashboard') navigate('/engineer/dashboard');
			else if (itemId === 'assigned-samples') navigate('/engineer/assigned-samples');
			else if (itemId === 'test-report') navigate('/engineer/test-report');
		} else if (userRoleLower === 'ceo') {
			if (itemId === 'dashboard') navigate('/ceo/dashboard');
		} else if (userRoleLower === 'inspector') {
			if (itemId === 'dashboard') navigate('/inspector/dashboard');
			else if (itemId === 'daily-checksheet') navigate('/inspector/daily-checksheet');
		} else {
			onTabChange?.(itemId);
		}
	};

	if (user.role?.toLowerCase() === 'ceo') {
		return (
			<div className="h-screen w-screen overflow-hidden bg-[#f8fafc] text-zinc-800 flex flex-col relative">
				{/* Top Header Bar for CEO */}
				<header className="h-16 bg-white border-b border-zinc-200/80 flex items-center justify-between px-8 shrink-0 shadow-sm">
					<img src="/logo.png" alt="Dixon Logo" className="h-10 object-contain" />
					<div className="flex items-center gap-4">
						<span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold shadow-sm">
							<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
							System Online
						</span>
						<button
							onClick={handleLogout}
							className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-extrabold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
						>
							<LogOut className="w-4 h-4" />
							Logout
						</button>
					</div>
				</header>
				{/* Main Content Area */}
				<main className="flex-1 h-full overflow-y-auto p-8 pr-6">
					<div className="max-w-7xl mx-auto w-full pb-10">
						{children}
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="h-screen w-screen overflow-hidden bg-[#eef2f6] text-zinc-800 flex flex-row relative">
			<aside className={`h-full bg-white shrink-0 flex flex-col justify-between z-20 shadow-sm border-r border-zinc-200 overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-20 p-4' : 'w-64 p-5'}`}>
				<div className="flex flex-col gap-6 min-h-0 flex-1">
					<div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
						{!isCollapsed && <img src="/logo.png" alt="Dixon Logo" className="h-14 w-75 object-contain" />}
						<button 
							onClick={() => setIsCollapsed(!isCollapsed)}
							className="w-8 h-8 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg flex items-center justify-center text-zinc-500 hover:text-[#11236a] transition-all cursor-pointer border-none outline-none"
						>
							<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
								<rect x="3" y="3" width="18" height="18" rx="2" />
								<path d="M9 3v18" />
							</svg>
						</button>
					</div>
					
					<nav className="flex flex-col gap-4 overflow-y-auto flex-1 pr-1 no-scrollbar">
						{user.role === 'Admin' ? (
							<>
								{[
									{
										category: 'Overview & Systems',
										items: [
											{ id: 'dashboard', label: 'Dashboard', icon: Compass },
											{ id: 'platform-availability', label: 'Platform Availability', icon: Server },
											{ id: 'nabl-station-availability', label: 'NABL Station Availability', icon: Server },
											{ id: 'equipment-availability', label: 'Equipment Availability', icon: Activity },
										]
									},
									{
										category: 'Access & Teams',
										items: [
											{ id: 'departments-management', label: 'Departments Management', icon: Layers },
											{ id: 'users-management', label: 'Users Management', icon: Users },
										]
									},
									{
										category: 'Test Bench Standards',
										items: [
											{ id: 'test-types-management', label: 'Test Types', icon: Settings },
											{ id: 'test-category-management', label: 'Test Categories', icon: FolderOpen },
											{ id: 'test-protocols-management', label: 'Test Protocols', icon: FileText },
										]
									},
									{
										category: 'Supply & Hardware',
										items: [
											{ id: 'product-part-names', label: 'Product / Part Names', icon: Cpu },
											{ id: 'suppliers-customers', label: 'Suppliers / Customers', icon: Briefcase },
											{ id: 'rd-testing-equipments', label: 'R&D Equipments', icon: Wrench },
										]
									}
								].map((cat, groupIdx) => (
									<div key={groupIdx} className="flex flex-col gap-1">
										{!isCollapsed && (
											<div className="px-3.5 mb-1.5 text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-none">
												{cat.category}
											</div>
										)}
										{cat.items.map((item) => {
											const Icon = item.icon;
											const isActive = derivedActiveTab === item.id;
											return (
												<button
													key={item.id}
													onClick={() => handleTabClick(item.id)}
													title={item.label}
													className={`group flex items-center gap-3 rounded-xl transition-all border-none outline-none cursor-pointer text-xs font-bold ${isCollapsed ? 'justify-center py-3 px-0 w-full' : 'px-3.5 py-2.5 text-left w-full'} ${isActive ? 'bg-[#11236a]/5 text-[#11236a]' : 'text-zinc-700 hover:text-[#11236a] hover:bg-zinc-100/70'}`}
												>
													<Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#11236a]' : 'text-zinc-500 group-hover:text-[#11236a]'}`} />
													{!isCollapsed && <span className="truncate">{item.label}</span>}
												</button>
											);
										})}
									</div>
								))}
							</>
						) : (user.role === 'Lab Manager' || user.role?.toLowerCase() === 'lab manager') ? (
							<>
								{[
									{
										category: 'Overview & Systems',
										items: [
											{ id: 'dashboard', label: 'Dashboard', icon: Compass },
											...(user.department?.name?.toUpperCase() !== 'NABL'
												? [{ id: 'platform-availability', label: 'Platform Availability', icon: Server }]
												: []),
											...(user.department?.name?.toUpperCase() === 'NABL'
												? [{ id: 'nabl-station-availability', label: 'NABL Station Availability', icon: Server }]
												: []),
											{ id: 'equipment-availability', label: 'Equipment Availability', icon: Activity },
										]
									},
									{
										category: 'Operations & Testing',
										items: [
											{ id: 'approved-requests', label: 'Approved Requests', icon: FileText },
											{ id: 'assigned-samples', label: 'Assigned Samples', icon: Users },
											{ id: 'test-plans', label: 'Test Plans', icon: Settings },
											{ id: 'capa-management', label: 'CAPA Management', icon: Layers },
										]
									}
								].map((cat, groupIdx) => (
									<div key={groupIdx} className="flex flex-col gap-1">
										{!isCollapsed && (
											<div className="px-3.5 mb-1.5 text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-none">
												{cat.category}
											</div>
										)}
										{cat.items.map((item) => {
											const Icon = item.icon;
											const isActive = derivedActiveTab === item.id ||
												(item.id === 'approved-requests' && derivedActiveTab === 'approved-request-details') ||
												(item.id === 'assigned-samples' && derivedActiveTab === 'inspect-sample');
											return (
												<button
													key={item.id}
													onClick={() => handleTabClick(item.id)}
													title={item.label}
													className={`group flex items-center gap-3 rounded-xl transition-all border-none outline-none cursor-pointer text-xs font-bold ${isCollapsed ? 'justify-center py-3 px-0 w-full' : 'px-3.5 py-2.5 text-left w-full'} ${isActive ? 'bg-[#11236a]/5 text-[#11236a]' : 'text-zinc-700 hover:text-[#11236a] hover:bg-zinc-100/70'}`}
												>
													<Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#11236a]' : 'text-zinc-500 group-hover:text-[#11236a]'}`} />
													{!isCollapsed && <span className="truncate">{item.label}</span>}
												</button>
											);
										})}
									</div>
								))}
							</>
						) : (user.role?.toLowerCase() === 'engineer') ? (
							<>
								{[
									{
										category: 'Overview & Systems',
										items: [
											{ id: 'dashboard', label: 'Dashboard', icon: Compass },
										]
									},
									{
										category: 'Operations & Testing',
										items: [
											{ id: 'assigned-samples', label: 'Assigned Samples', icon: Users },
											{ id: 'test-report', label: 'Test Reports', icon: FileText },
										]
									}
								].map((cat, groupIdx) => (
									<div key={groupIdx} className="flex flex-col gap-1">
										{!isCollapsed && (
											<div className="px-3.5 mb-1.5 text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-none">
												{cat.category}
											</div>
										)}
										{cat.items.map((item) => {
											const Icon = item.icon;
											const isActive = derivedActiveTab === item.id;
											return (
												<button
													key={item.id}
													onClick={() => handleTabClick(item.id)}
													title={item.label}
													className={`group flex items-center gap-3 rounded-xl transition-all border-none outline-none cursor-pointer text-xs font-bold ${isCollapsed ? 'justify-center py-3 px-0 w-full' : 'px-3.5 py-2.5 text-left w-full'} ${isActive ? 'bg-[#11236a]/5 text-[#11236a]' : 'text-zinc-700 hover:text-[#11236a] hover:bg-zinc-100/70'}`}
												>
													<Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#11236a]' : 'text-zinc-500 group-hover:text-[#11236a]'}`} />
													{!isCollapsed && <span className="truncate">{item.label}</span>}
												</button>
											);
										})}
									</div>
								))}
							</>
						) : (user.role?.toLowerCase() === 'inspector') ? (
							<>
								{[
									{
										category: 'Inspector Workspace',
										items: [
											{ id: 'dashboard', label: 'Dashboard', icon: Compass },
											{ id: 'daily-checksheet', label: 'Daily Checksheet', icon: CheckSquare },
										]
									}
								].map((cat, groupIdx) => (
									<div key={groupIdx} className="flex flex-col gap-1">
										{!isCollapsed && (
											<div className="px-3.5 mb-1.5 text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-none">
												{cat.category}
											</div>
										)}
										{cat.items.map((item) => {
											const Icon = item.icon;
											const isActive = derivedActiveTab === item.id;
											return (
												<button
													key={item.id}
													onClick={() => handleTabClick(item.id)}
													title={item.label}
													className={`group flex items-center gap-3 rounded-xl transition-all border-none outline-none cursor-pointer text-xs font-bold ${isCollapsed ? 'justify-center py-3 px-0 w-full' : 'px-3.5 py-2.5 text-left w-full'} ${isActive ? 'bg-[#11236a]/5 text-[#11236a]' : 'text-zinc-700 hover:text-[#11236a] hover:bg-zinc-100/70'}`}
												>
													<Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#11236a]' : 'text-zinc-500 group-hover:text-[#11236a]'}`} />
													{!isCollapsed && <span className="truncate">{item.label}</span>}
												</button>
											);
										})}
									</div>
								))}
							</>
						) : (user.role?.toLowerCase() === 'ceo') ? (
							<>
								{[
									{
										category: 'CEO Portal',
										items: [
											{ id: 'dashboard', label: 'Overview', icon: Compass },
										]
									}
								].map((cat, groupIdx) => (
									<div key={groupIdx} className="flex flex-col gap-1">
										{!isCollapsed && (
											<div className="px-3.5 mb-1.5 text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-none">
												{cat.category}
											</div>
										)}
										{cat.items.map((item) => {
											const Icon = item.icon;
											const isActive = derivedActiveTab === item.id;
											return (
												<button
													key={item.id}
													onClick={() => handleTabClick(item.id)}
													title={item.label}
													className={`group flex items-center gap-3 rounded-xl transition-all border-none outline-none cursor-pointer text-xs font-bold ${isCollapsed ? 'justify-center py-3 px-0 w-full' : 'px-3.5 py-2.5 text-left w-full'} ${isActive ? 'bg-[#11236a]/5 text-[#11236a]' : 'text-zinc-700 hover:text-[#11236a] hover:bg-zinc-100/70'}`}
												>
													<Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#11236a]' : 'text-zinc-500 group-hover:text-[#11236a]'}`} />
													{!isCollapsed && <span className="truncate">{item.label}</span>}
												</button>
											);
										})}
									</div>
								))}
							</>
						) : (
							<>
								{[
									{
										category: 'Requester Hub',
										items: [
											{ id: 'dashboard', label: 'Dashboard', icon: Compass },
											{ id: 'my-requests', label: 'My Requests', icon: FileText },
											{ id: 'capa-management', label: 'CAPA Management', icon: Layers },
										]
									}
								].map((cat, groupIdx) => (
									<div key={groupIdx} className="flex flex-col gap-1">
										{!isCollapsed && (
											<div className="px-3.5 mb-1.5 text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-none">
												{cat.category}
											</div>
										)}
										{cat.items.map((item) => {
											const Icon = item.icon;
											const isActive = derivedActiveTab === item.id || 
												(item.id === 'my-requests' && (derivedActiveTab === 'new-request' || derivedActiveTab === 'view-request-details')) ||
												(item.id === 'capa-management' && (derivedActiveTab === 'new-capa' || derivedActiveTab === 'view-capa-details'));
											return (
												<button
													key={item.id}
													onClick={() => handleTabClick(item.id)}
													title={item.label}
													className={`group flex items-center gap-3 rounded-xl transition-all border-none outline-none cursor-pointer text-xs font-bold ${isCollapsed ? 'justify-center py-3 px-0 w-full' : 'px-3.5 py-2.5 text-left w-full'} ${isActive ? 'bg-[#11236a]/5 text-[#11236a]' : 'text-zinc-700 hover:text-[#11236a] hover:bg-zinc-100/70'}`}
												>
													<Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#11236a]' : 'text-zinc-500 group-hover:text-[#11236a]'}`} />
													{!isCollapsed && <span className="truncate">{item.label}</span>}
												</button>
											);
										})}
									</div>
								))}
							</>
						)}
					</nav>
				</div>

				{/* Bottom Section: User profile */}
				<div className="flex flex-col gap-4 mt-6 shrink-0">
					<div className="border-t border-zinc-200/80 pt-4 flex flex-col gap-3">
						<div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
							<div className="w-9 h-9 bg-zinc-100 border border-zinc-200 rounded-lg flex items-center justify-center text-zinc-500 shadow-inner shrink-0">
								<User className="w-4.5 h-4.5" />
							</div>
							{!isCollapsed && (
								<div className="overflow-hidden">
									<p className="text-xs font-bold text-zinc-900 leading-tight truncate">{user.name}</p>
									<span className="inline-block text-[9px] font-bold px-1.5 py-0.5 bg-[#11236a]/10 text-[#11236a] rounded mt-1 uppercase tracking-wide">{user.role}</span>
								</div>
							)}
						</div>
						
						<button
							onClick={handleLogout}
							title="Disconnect Portal"
							className={`bg-zinc-50 hover:bg-red-50 hover:border-red-200 border border-zinc-200 text-zinc-700 hover:text-red-600 font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 outline-none active:scale-[0.98] cursor-pointer text-xs ${isCollapsed ? 'p-2.5' : 'py-2 px-3 w-full'}`}
						>
							<LogOut className="w-3.5 h-3.5 shrink-0" />
							{!isCollapsed && <span>Disconnect Portal</span>}
						</button>
					</div>
				</div>
			</aside>

			{/* Main Content Area */}
			<main className="flex-1 h-full overflow-y-auto flex flex-col gap-6 p-8 pr-6">
				<div className="flex flex-col gap-6 pb-6 pt-1">
					<div className="flex flex-row justify-between items-center gap-4">
						<h1 className="text-2xl font-bold tracking-tight text-zinc-900" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>{title}</h1>
					</div>
					{children}
				</div>
			</main>
		</div>
	);
}
