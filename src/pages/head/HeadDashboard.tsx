import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Compass, ClipboardList, CheckCircle, XCircle, AlertTriangle, LogOut, User } from 'lucide-react';
import { logout } from '../../services/operations/authService';
import HeadOverview from './HeadOverview';
import HeadSampleTests from './HeadSampleTests';
import HeadCompletedReports from './HeadCompletedReports';
import HeadFailureDecision from './HeadFailureDecision';
import HeadCapaReports from './HeadCapaReports';

const navItems = [
	{ id: 'dashboard',          label: 'Dashboard',           icon: Compass,       path: '/head/dashboard' },
	{ id: 'sample-tests',       label: 'Sample Tests',        icon: ClipboardList,  path: '/head/sample-tests' },
	{ id: 'completed-reports',  label: 'Completed Reports',   icon: CheckCircle,   path: '/head/completed-reports' },
	{ id: 'failure-decision',   label: 'Failure Decision',    icon: XCircle,       path: '/head/failure-decision' },
	{ id: 'capa-reports',       label: 'CAPA Reports',        icon: AlertTriangle, path: '/head/capa-reports' },
];

const titleMap: Record<string, { title: string; desc: string }> = {
	'dashboard':         { title: 'Directorate Command Console',    desc: 'Overview of pending approvals, completed reports, and failure decisions.' },
	'sample-tests':      { title: 'Sample Tests — Approval Queue',  desc: 'Review all submitted test requests and approve or reject them.' },
	'completed-reports': { title: 'Completed Test Reports',         desc: 'All successfully passed test plans with downloadable reports.' },
	'failure-decision':  { title: 'Failure Decision Board',         desc: 'Review failed test plans and decide on CAPA or re-test authorization.' },
	'capa-reports':      { title: 'CAPA Reports',                   desc: 'Corrective and Preventive Action reports submitted by requesters and lab managers.' },
};

export default function HeadDashboard() {
	const navigate = useNavigate();
	const location = useLocation();
	const [isCollapsed, setIsCollapsed] = useState(false);

	const token = localStorage.getItem('token');
	const userStr = localStorage.getItem('user');

	useEffect(() => {
		if (!token || !userStr) { localStorage.clear(); navigate('/'); return; }
		const user = JSON.parse(userStr);
		if (user.role?.toLowerCase() !== 'head') navigate('/dashboard', { replace: true });
	}, [token, userStr, navigate]);

	if (!token || !userStr) return null;
	const user = JSON.parse(userStr);
	if (user.role?.toLowerCase() !== 'head') return null;

	const pathSegment = location.pathname.replace('/head/', '') || 'dashboard';
	const activeId = navItems.find(n => n.path === location.pathname)?.id ?? 'dashboard';
	const { title, desc } = titleMap[activeId] ?? titleMap['dashboard'];

	const handleLogout = async () => { await logout()(); navigate('/'); };

	const renderPage = () => {
		if (pathSegment === 'dashboard' || location.pathname === '/head/dashboard') return <HeadOverview navigate={navigate} />;
		if (pathSegment === 'sample-tests')      return <HeadSampleTests />;
		if (pathSegment === 'completed-reports') return <HeadCompletedReports />;
		if (pathSegment === 'failure-decision')  return <HeadFailureDecision />;
		if (pathSegment === 'capa-reports')      return <HeadCapaReports />;
		return <HeadOverview navigate={navigate} />;
	};

	return (
		<div className="h-screen w-screen overflow-hidden bg-[#eef2f6] text-zinc-800 flex flex-row">
			{/* Sidebar */}
			<aside className={`h-full bg-white shrink-0 flex flex-col justify-between z-20 shadow-sm border-r border-zinc-200 overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-20 p-4' : 'w-64 p-5'}`}>
				<div className="flex flex-col gap-6 min-h-0 flex-1">
					{/* Logo + collapse */}
					<div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
						{!isCollapsed && <img src="/logo.png" alt="Dixon Logo" className="h-14 object-contain" />}
						<button
							onClick={() => setIsCollapsed(!isCollapsed)}
							className="w-8 h-8 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg flex items-center justify-center text-zinc-500 hover:text-[#11236a] transition-all cursor-pointer outline-none"
						>
							<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
								<rect x="3" y="3" width="18" height="18" rx="2" />
								<path d="M9 3v18" />
							</svg>
						</button>
					</div>

					{/* Nav */}
					<nav className="flex flex-col gap-1 overflow-y-auto flex-1 pr-1">
						{!isCollapsed && (
							<div className="px-3.5 mb-2 text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Head Panel</div>
						)}
						{navItems.map(item => {
							const Icon = item.icon;
							const isActive = activeId === item.id;
							return (
								<button
									key={item.id}
									onClick={() => navigate(item.path)}
									title={item.label}
									className={`group flex items-center gap-3 rounded-xl transition-all border-none outline-none cursor-pointer text-xs font-bold ${isCollapsed ? 'justify-center py-3 px-0 w-full' : 'px-3.5 py-2.5 text-left w-full'} ${isActive ? 'bg-[#11236a]/5 text-[#11236a]' : 'text-zinc-600 hover:text-[#11236a] hover:bg-zinc-100/70'}`}
								>
									<Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#11236a]' : 'text-zinc-400 group-hover:text-[#11236a]'}`} />
									{!isCollapsed && <span className="truncate">{item.label}</span>}
								</button>
							);
						})}
					</nav>
				</div>

				{/* User + Logout */}
				<div className="border-t border-zinc-200/80 pt-4 flex flex-col gap-3 shrink-0">
					<div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
						<div className="w-9 h-9 bg-zinc-100 border border-zinc-200 rounded-lg flex items-center justify-center shrink-0">
							<User className="w-4 h-4 text-zinc-500" />
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
						className={`bg-zinc-50 hover:bg-red-50 hover:border-red-200 border border-zinc-200 text-zinc-700 hover:text-red-600 font-bold rounded-lg transition-all flex items-center justify-center gap-2 outline-none cursor-pointer text-xs ${isCollapsed ? 'p-2.5' : 'py-2 px-3 w-full'}`}
					>
						<LogOut className="w-3.5 h-3.5 shrink-0" />
						{!isCollapsed && <span>Disconnect Portal</span>}
					</button>
				</div>
			</aside>

			{/* Main content */}
			<main className="flex-1 h-full overflow-y-auto flex flex-col gap-6 p-8 pr-6">
				<div className="flex flex-col gap-1 pb-2">
					<h1 className="text-2xl font-bold tracking-tight text-zinc-900" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
						{title}
					</h1>
					<p className="text-xs text-zinc-500 font-medium">{desc}</p>
				</div>
				{renderPage()}
			</main>
		</div>
	);
}
