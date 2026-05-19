import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Compass, Server, Activity, Layers, Users, Settings, FolderOpen, FileText, Cpu, Briefcase, Wrench } from 'lucide-react';
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
	const [isCollapsed, setIsCollapsed] = useState(false);
	
	const userStr = localStorage.getItem('user');
	const user = userStr ? JSON.parse(userStr) : { name: 'System User', role: 'Requester', username: 'user' };

	const handleLogout = async () => {
		const action = logout();
		await action();
		navigate('/');
	};

	return (
		<div className="h-screen w-screen overflow-hidden bg-[#eef2f6] text-zinc-800 flex flex-row relative">
			<aside className={`h-full bg-white shrink-0 flex flex-col justify-between z-20 shadow-sm border-r border-zinc-200 overflow-y-auto no-scrollbar transition-all duration-300 ${isCollapsed ? 'w-20 p-4' : 'w-72 p-6'}`}>
				<div className="flex flex-col gap-6">
					<div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
						{!isCollapsed && <img src="/logo.png" alt="Dixon Logo" className="h-14 w-75 object-contain" />}
						<button 
							onClick={() => setIsCollapsed(!isCollapsed)}
							className="w-8 h-8 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-center text-zinc-455 hover:text-zinc-650 transition-all cursor-pointer border-none outline-none"
						>
							<svg className="w-4 h-4 text-zinc-655" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
								<rect x="3" y="3" width="18" height="18" rx="2" />
								<path d="M9 3v18" />
							</svg>
						</button>
					</div>
					
					<nav className="flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-200px)] pr-1 no-scrollbar">
						{user.role === 'Admin' ? (
							<>
								{[
									{
										category: 'Overview & Systems',
										items: [
											{ id: 'dashboard', label: 'Dashboard', icon: Compass },
											{ id: 'platform-availability', label: 'Platform Availability', icon: Server },
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
											<div className="px-3.5 mb-1.5 text-[9px] text-zinc-400 font-bold uppercase tracking-widest leading-none">
												{cat.category}
											</div>
										)}
										{cat.items.map((item) => {
											const Icon = item.icon;
											const isActive = activeTab === item.id;
											return (
												<button
													key={item.id}
													onClick={() => onTabChange?.(item.id)}
													title={item.label}
													className={`flex items-center gap-3 rounded-xl transition-all border-none outline-none cursor-pointer text-xs font-semibold ${isCollapsed ? 'justify-center py-3 px-0 w-full' : 'px-3.5 py-2.5 text-left w-full'} ${isActive ? 'bg-[#11236a]/5 text-[#11236a]' : 'hover:bg-zinc-50 text-zinc-500 hover:text-zinc-800'}`}
												>
													<Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#11236a]' : 'text-zinc-400'}`} />
													{!isCollapsed && <span className="truncate">{item.label}</span>}
												</button>
											);
										})}
									</div>
								))}
							</>
						) : (
							<>
								<div className="flex flex-col gap-1">
									{!isCollapsed && <div className="px-3 mb-2 text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Navigation</div>}
									<a 
										href="#dashboard" 
										title="Dashboard"
										className={`flex items-center gap-3 rounded-xl bg-zinc-100 text-zinc-800 text-xs font-semibold transition-all ${
											isCollapsed ? 'justify-center py-3 px-0 w-full' : 'px-3.5 py-2.5 text-left w-full'
										}`}
									>
										<svg className="w-4 h-4 text-zinc-800 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
											<rect x="3" y="3" width="7" height="9" rx="1" />
											<rect x="14" y="3" width="7" height="5" rx="1" />
											<rect x="14" y="12" width="7" height="9" rx="1" />
											<rect x="3" y="16" width="7" height="5" rx="1" />
										</svg>
										{!isCollapsed && <span>Dashboard</span>}
									</a>
									<a 
										href="#cms" 
										title="CMS"
										className={`flex items-center gap-3 rounded-xl hover:bg-zinc-50 text-zinc-500 hover:text-zinc-800 text-xs font-semibold transition-all ${
											isCollapsed ? 'justify-center py-3 px-0 w-full' : 'px-3.5 py-2.5 text-left w-full'
										}`}
									>
										<svg className="w-4 h-4 text-zinc-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
											<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
											<line x1="4" y1="22" x2="4" y2="15" />
										</svg>
										{!isCollapsed && <span>CMS</span>}
									</a>
									<a 
										href="#forms" 
										title="Forms"
										className={`flex items-center gap-3 rounded-xl hover:bg-zinc-50 text-zinc-500 hover:text-zinc-800 text-xs font-semibold transition-all ${
											isCollapsed ? 'justify-center py-3 px-0 w-full' : 'px-3.5 py-2.5 text-left w-full'
										}`}
									>
										<svg className="w-4 h-4 text-zinc-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
											<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
											<polyline points="14 2 14 8 20 8" />
											<line x1="16" y1="13" x2="8" y2="13" />
											<line x1="16" y1="17" x2="8" y2="17" />
										</svg>
										{!isCollapsed && <span>Forms</span>}
									</a>
								</div>
							</>
						)}
					</nav>
				</div>

				{/* Bottom Section: User profile */}
				<div className="flex flex-col gap-4 mt-6">
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
							className={`bg-zinc-50 hover:bg-red-50 hover:border-red-200 border border-zinc-200 text-zinc-650 hover:text-red-600 font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 outline-none active:scale-[0.98] cursor-pointer text-xs ${isCollapsed ? 'p-2.5' : 'py-2 px-3 w-full'}`}
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