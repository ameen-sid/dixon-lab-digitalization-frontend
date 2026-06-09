import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../layouts/DashboardLayout';
import { getPlatforms } from '../../services/operations/platformAvailabilityService';
import { getPlatforms as getNablPlatforms } from '../../services/operations/nablStationAvailabilityService';
import { getTestingEquipments } from '../../services/operations/testingEquipmentService';
import { getTestTypes } from '../../services/operations/testTypeService';
import { getTestCategories } from '../../services/operations/testCategoryService';
import { getTestProtocols } from '../../services/operations/testProtocolService';
import departmentService from '../../services/operations/departmentService';
import userService from '../../services/operations/userService';
import DepartmentManagement from './DepartmentManagement';
import UserManagement from './UserManagement';
import TestTypeManagement from './TestTypeManagement';
import TestCategoryManagement from './TestCategoryManagement';
import TestProtocolManagement from './TestProtocolManagement';
import ProductPartManagement from './ProductPartManagement';
import SupplierCustomerManagement from './SupplierCustomerManagement';
import TestingEquipmentManagement from './TestingEquipmentManagement';
import { 
	Users, ChevronRight, RotateCw, Activity,
	Building2, FlaskConical, Tag, BookOpen, Server, Cpu, CheckCircle2, AlertCircle
} from 'lucide-react';

const getFormattedRequestId = (occupiedBy: string, testRequestId: any) => {
	if (!occupiedBy) return `#${testRequestId || 'N/A'}`;
	const match = occupiedBy.match(/(REQ-[A-Za-z0-9-]+)/);
	if (match) {
		return match[1].replace(/^REQ-REQ-/, 'REQ-');
	}
	return `#${testRequestId || 'N/A'}`;
};

const formatOccupiedUntil = (dateStr: string) => {
	if (!dateStr) return 'N/A';
	const d = new Date(dateStr);
	if (isNaN(d.getTime())) return dateStr;
	
	const day = d.getUTCDate();
	const month = d.getUTCMonth() + 1;
	const year = d.getUTCFullYear();
	
	const hours = d.getUTCHours();
	const minutes = d.getUTCMinutes();
	
	if (hours === 0 && minutes === 0) {
		return `${month}/${day}/${year}, 12:00:00 AM`;
	}
	return d.toLocaleString();
};

export default function AdminDashboard() {
	const location = useLocation();
	const navigate = useNavigate();
	const path = location.pathname;

	let activeTab = 'departments-management'; // Set default to Departments Management
	if (path.includes('/admin/dashboard')) activeTab = 'dashboard';
	else if (path.includes('/admin/platform-availability')) activeTab = 'platform-availability';
	else if (path.includes('/admin/nabl-station-availability')) activeTab = 'nabl-station-availability';
	else if (path.includes('/admin/equipment-availability')) activeTab = 'equipment-availability';
	else if (path.includes('/admin/departments-management')) activeTab = 'departments-management';
	else if (path.includes('/admin/users-management')) activeTab = 'users-management';
	else if (path.includes('/admin/test-types')) activeTab = 'test-types-management';
	else if (path.includes('/admin/test-categories')) activeTab = 'test-category-management';
	else if (path.includes('/admin/test-protocols')) activeTab = 'test-protocols-management';
	else if (path.includes('/admin/product-part-names')) activeTab = 'product-part-names';
	else if (path.includes('/admin/suppliers-customers')) activeTab = 'suppliers-customers';
	else if (path.includes('/admin/rd-equipment')) activeTab = 'rd-testing-equipments';

	const token = localStorage.getItem('token');
	const userStr = localStorage.getItem('user');
	const currentUser = userStr ? JSON.parse(userStr) : null;
	const isNablDept = currentUser?.department?.name?.toUpperCase() === 'NABL';

	useEffect(() => {
		if (currentUser && (currentUser.role === 'Lab Manager' || currentUser.role?.toLowerCase() === 'lab manager')) {
			if (isNablDept && path.includes('/admin/platform-availability')) {
				navigate('/admin/nabl-station-availability');
			} else if (!isNablDept && path.includes('/admin/nabl-station-availability')) {
				navigate('/admin/platform-availability');
			}
		}
	}, [path, currentUser, isNablDept, navigate]);

	const [platformSlots, setPlatformSlots] = useState<{ [key: string]: boolean }>({});
	const [platformOccupancies, setPlatformOccupancies] = useState<any[]>([]);
	const [selectedPlatformModal, setSelectedPlatformModal] = useState<{ stationNo: number; platformNo: number } | null>(null);

	const [nablPlatformSlots, setNablPlatformSlots] = useState<{ [key: string]: boolean }>({});
	const [nablPlatformOccupancies, setNablPlatformOccupancies] = useState<any[]>([]);
	const [selectedNablPlatformModal, setSelectedNablPlatformModal] = useState<{ stationNo: number; platformNo: number } | null>(null);

	// Dashboard summary stats
	const [dashUsers, setDashUsers] = useState<any[]>([]);
	const [dashDepts, setDashDepts] = useState<any[]>([]);
	const [dashTestTypes, setDashTestTypes] = useState<any[]>([]);
	const [dashTestCats, setDashTestCats] = useState<any[]>([]);
	const [dashTestProtos, setDashTestProtos] = useState<any[]>([]);
	const [dashStations, setDashStations] = useState<any[]>([]);
	const [dashLoading, setDashLoading] = useState(true);

	const loadPlatformTelemetry = async () => {
		try {
			const data = await getPlatforms()();
			setPlatformOccupancies(data || []);
			setDashStations(data || []);
			const mapping: { [key: string]: boolean } = {};
			(data || []).forEach((item: any) => {
				mapping[`${item.stationNo}-${item.platformNo}`] = item.isAvailable;
			});
			setPlatformSlots(mapping);
		} catch (err) {
			console.error('Failed to load platform availability telemetry:', err);
		}
	};

	const loadNablPlatformTelemetry = async () => {
		try {
			const data = await getNablPlatforms()();
			setNablPlatformOccupancies(data || []);
			const mapping: { [key: string]: boolean } = {};
			(data || []).forEach((item: any) => {
				mapping[`${item.stationNo}-${item.platformNo}`] = item.isAvailable;
			});
			setNablPlatformSlots(mapping);
		} catch (err) {
			console.error('Failed to load NABL platform availability telemetry:', err);
		}
	};

	const [equipmentList, setEquipmentList] = useState<any[]>([]);
	const [selectedEquipmentModal, setSelectedEquipmentModal] = useState<any | null>(null);

	const loadEquipmentTelemetry = async () => {
		try {
			const data = await getTestingEquipments({ limit: 100 })();
			setEquipmentList(data || []);
		} catch (err) {
			console.error('Failed to load equipment availability telemetry:', err);
		}
	};

	const loadDashboardStats = async () => {
		setDashLoading(true);
		try {
			const [users, depts, types, cats, protos] = await Promise.all([
				userService.getUsers()().catch(() => []),
				departmentService.getDepartments()().catch(() => []),
				getTestTypes()().catch(() => []),
				getTestCategories()().catch(() => []),
				getTestProtocols()().catch(() => []),
			]);
			setDashUsers(users || []);
			setDashDepts(depts || []);
			setDashTestTypes(types || []);
			setDashTestCats(cats || []);
			setDashTestProtos(protos || []);
		} catch (err) {
			console.error('Failed to load dashboard stats:', err);
		} finally {
			setDashLoading(false);
		}
	};

	useEffect(() => {
		if (token && userStr) {
			loadPlatformTelemetry();
			loadNablPlatformTelemetry();
			loadEquipmentTelemetry();
			loadDashboardStats();
		}
	}, [token, userStr]);

	const resetSlots = async () => {
		await loadPlatformTelemetry();
		await loadNablPlatformTelemetry();
		await loadEquipmentTelemetry();
		toast.success('Resource availability synchronized from database.');
	};

	const availableCount = Object.values(platformSlots).filter(v => v === true).length;
	const occupiedCount = Object.values(platformSlots).filter(v => v === false).length;

	const nablAvailableCount = Object.values(nablPlatformSlots).filter(v => v === true).length;
	const nablOccupiedCount = Object.values(nablPlatformSlots).filter(v => v === false).length;

	const availableEq = equipmentList.filter(e => e.isAvailable && e.status === 'ACTIVE').length;
	const occupiedEq = equipmentList.filter(e => !e.isAvailable && e.status === 'ACTIVE').length;
	const maintenanceEq = equipmentList.filter(e => e.status === 'MAINTENANCE' || e.status === 'UNDER_MAINTENANCE').length;

	// Dynamic tab header texts
	const getTabHeaders = () => {
		switch (activeTab) {
			case 'dashboard':
				return { title: 'Dashboard', desc: 'System configuration, user metrics, and operational statistics.' };
			case 'platform-availability':
				return { title: 'Platform Availability', desc: 'Real-time service uptime, backend node states, and DB latencies.' };
			case 'nabl-station-availability':
				return { title: 'NABL Station Availability', desc: 'Real-time service uptime, backend node states, and DB latencies for NABL station.' };
			case 'equipment-availability':
				return { title: 'Equipment Availability', desc: 'Chamber utilization telemetry and active machine queue counts.' };
			case 'departments-management':
				return { title: 'Departments Management', desc: 'Configure active SMT divisions, engineering sectors, and NABL teams.' };
			case 'users-management':
				return { title: 'Users Management', desc: 'Administrate system users, active sessions, and access credentials.' };
			case 'test-types-management':
				return { title: 'Test Types Management', desc: 'Define diagnostic procedures, stress runs, and validation types.' };
			case 'test-category-management':
				return { title: 'Test Category Management', desc: 'Organize lab test groupings, compliance labels, and NABL channels.' };
			case 'test-protocols-management':
				return { title: 'Test Protocols Management', desc: 'Configure industry standard test pipelines (IEC, ISO, IS, MIL).' };
			case 'product-part-names':
				return { title: 'Product / Part Names', desc: 'Inventory of testing components, SMT PCBs, and product registers.' };
			case 'suppliers-customers':
				return { title: 'Suppliers / Customers', desc: 'Administrate external vendor verification logs and client listings.' };
			case 'rd-testing-equipments':
				return { title: 'R&D Testing Equipments', desc: 'Telemetry status logs of physical stress chambers and oscilloscopes.' };
			default:
				return { title: 'Dashboard', desc: '' };
		}
	};

	const headers = getTabHeaders();

	const renderContent = () => {
		switch (activeTab) {
			case 'dashboard':
				return (
					<div className="space-y-7">

						{/* Header Banner */}
						<div className="relative bg-[#11236a] rounded-[24px] px-8 py-6 flex items-center justify-between overflow-hidden shadow-lg">
							<div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #6366f1 0%, transparent 60%)' }} />
							<div className="relative z-10">
								<p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">System Admin Console</p>
								<h1 className="text-white text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
									Dixon Lab — Admin Overview
								</h1>
								<p className="text-white/50 text-xs mt-1 font-medium">Real-time system configuration and operational statistics</p>
							</div>
							<button
								onClick={() => { loadDashboardStats(); loadPlatformTelemetry(); loadEquipmentTelemetry(); toast.success('Dashboard refreshed.'); }}
								className="relative z-10 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
							>
								<RotateCw className="w-4 h-4" />
							</button>
						</div>

						{/* Row 1: Users, Departments, Stations, Equipment */}
						<div>
							<p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-3">Infrastructure Overview</p>
							<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
								{[
									{ label: 'Total Users', value: dashUsers.length, icon: Users, color: 'indigo', route: '/admin/users-management', sub: `${dashUsers.filter((u:any) => u.role === 'Admin').length} Admin · ${dashUsers.filter((u:any) => u.role === 'Engineer').length} Engineers` },
									{ label: 'Departments', value: dashDepts.length, icon: Building2, color: 'violet', route: '/admin/departments-management', sub: 'Active lab divisions' },
									{ label: 'Platform Stations', value: (() => { const ids = new Set(dashStations.map((s:any) => s.stationNo)); return ids.size; })(), icon: Server, color: 'sky', route: '/admin/platform-availability', sub: `${Object.values(platformSlots).filter(v => v === false).length} occupied` },
									{ label: 'R&D Equipment', value: equipmentList.length, icon: Cpu, color: 'emerald', route: '/admin/equipment-availability', sub: `${equipmentList.filter((e:any) => e.isAvailable).length} available` },
								].map(({ label, value, icon: Icon, color, route, sub }) => {
									const colMap: Record<string, string> = {
										indigo: 'bg-indigo-500/10 text-indigo-600',
										violet: 'bg-violet-500/10 text-violet-600',
										sky: 'bg-sky-500/10 text-sky-600',
										emerald: 'bg-emerald-500/10 text-emerald-600',
									};
									return (
										<div key={label} className="bg-white border border-zinc-200/60 rounded-[20px] p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
											<div className="flex items-start justify-between">
												<div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colMap[color]}`}>
													<Icon className="w-5 h-5" />
												</div>
												{dashLoading && <span className="w-2 h-2 rounded-full bg-zinc-300 animate-pulse mt-1" />}
											</div>
											<div className="mt-4">
												<p className="text-3xl font-extrabold text-zinc-900 leading-none">{dashLoading ? '—' : value}</p>
												<p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 mt-1">{label}</p>
												<p className="text-[10px] text-zinc-400 font-medium mt-0.5">{sub}</p>
											</div>
											<div onClick={() => navigate(route)} className="border-t border-zinc-100 mt-4 pt-3 flex items-center justify-between text-[10px] font-bold text-zinc-500 hover:text-[#11236a] transition-all cursor-pointer uppercase tracking-wide">
												<span>Manage</span><ChevronRight className="w-3.5 h-3.5" />
											</div>
										</div>
									);
								})}
							</div>
						</div>

						{/* Row 2: Test Types, Categories, Protocols */}
						<div>
							<p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-3">Test Configuration Summary</p>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								{[
									{ label: 'Test Types', value: dashTestTypes.length, icon: FlaskConical, color: '#f59e0b', bg: 'bg-amber-500/10', route: '/admin/test-types', items: dashTestTypes.slice(0, 3) },
									{ label: 'Test Categories', value: dashTestCats.length, icon: Tag, color: '#8b5cf6', bg: 'bg-violet-500/10', route: '/admin/test-categories', items: dashTestCats.slice(0, 3) },
									{ label: 'Test Protocols', value: dashTestProtos.length, icon: BookOpen, color: '#0ea5e9', bg: 'bg-sky-500/10', route: '/admin/test-protocols', items: dashTestProtos.slice(0, 3) },
								].map(({ label, value, icon: Icon, color, bg, route, items }) => (
									<div key={label} className="bg-white border border-zinc-200/60 rounded-[20px] p-5 shadow-sm hover:shadow-md transition-all flex flex-col">
										<div className="flex items-center justify-between mb-4">
											<div className="flex items-center gap-3">
												<div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
													<Icon className="w-4.5 h-4.5" style={{ color }} />
												</div>
												<div>
													<p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">{label}</p>
													<p className="text-2xl font-extrabold text-zinc-900 leading-none">{dashLoading ? '—' : value}</p>
												</div>
											</div>
										</div>
										<div className="flex-1 space-y-1.5">
											{dashLoading ? (
												[1,2,3].map(i => <div key={i} className="h-5 bg-zinc-100 rounded-lg animate-pulse" />)
											) : items.length > 0 ? items.map((item: any) => (
												<div key={item.id} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 rounded-xl">
													<span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
													<span className="text-[11px] font-semibold text-zinc-700 truncate">{item.name}</span>
												</div>
											)) : (
												<p className="text-[11px] text-zinc-400 italic px-1">No entries configured yet.</p>
											)}
											{!dashLoading && value > 3 && (
												<p className="text-[10px] text-zinc-400 font-bold px-1">+{value - 3} more…</p>
											)}
										</div>
										<div onClick={() => navigate(route)} className="border-t border-zinc-100 mt-4 pt-3 flex items-center justify-between text-[10px] font-bold text-zinc-500 hover:text-[#11236a] transition-all cursor-pointer uppercase tracking-wide">
											<span>Configure</span><ChevronRight className="w-3.5 h-3.5" />
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Row 3: Pending System Configuration Status */}
						<div>
							<p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-3">Pending Configuration Status</p>
							<div className="bg-white border border-zinc-200/60 rounded-[20px] p-5 shadow-sm">
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
									{[
										{ label: 'Departments configured', ok: dashDepts.length > 0, route: '/admin/departments-management' },
										{ label: 'Users created', ok: dashUsers.length > 0, route: '/admin/users-management' },
										{ label: 'Test Types defined', ok: dashTestTypes.length > 0, route: '/admin/test-types' },
										{ label: 'Test Categories defined', ok: dashTestCats.length > 0, route: '/admin/test-categories' },
										{ label: 'Test Protocols configured', ok: dashTestProtos.length > 0, route: '/admin/test-protocols' },
										{ label: 'Equipment registered', ok: equipmentList.length > 0, route: '/admin/rd-equipment' },
									].map(({ label, ok, route }) => (
										<div
											key={label}
											onClick={() => navigate(route)}
											className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${ok ? 'border-emerald-100 bg-emerald-50/60 hover:bg-emerald-50' : 'border-amber-100 bg-amber-50/60 hover:bg-amber-50'}`}
										>
											{dashLoading ? (
												<span className="w-4 h-4 rounded-full bg-zinc-200 animate-pulse shrink-0" />
											) : ok ? (
												<CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
											) : (
												<AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
											)}
											<span className={`text-xs font-semibold ${ok ? 'text-emerald-800' : 'text-amber-800'}`}>{label}</span>
											{!ok && <span className="ml-auto text-[9px] font-extrabold uppercase tracking-wider text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Pending</span>}
										</div>
									))}
								</div>
							</div>
						</div>

					</div>
				);


			case 'platform-availability':
				return (
					<div className="space-y-6">
						{/* Header Card with Metrics */}
						<div className="bg-white border border-zinc-200/50 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
							<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
								<h2 className="text-base font-extrabold text-zinc-900 tracking-tight" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
									Platform Live Tracking
								</h2>
								<div className="flex items-center gap-4">
									<div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50/70 border border-emerald-100 rounded-full px-3 py-1 shadow-sm shrink-0">
										<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
										AVAILABLE: {availableCount}
									</div>
									<div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs bg-rose-50/70 border border-rose-100 rounded-full px-3 py-1 shadow-sm shrink-0">
										<span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
										OCCUPIED/RESERVED: {occupiedCount}
									</div>
								</div>
							</div>
							<button
								onClick={resetSlots}
								title="Reset telemetry view"
								className="w-10 h-10 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-all hover:bg-zinc-100 cursor-pointer outline-none active:scale-95 border-none shrink-0"
							>
								<RotateCw className="w-4 h-4" />
							</button>
						</div>

						{/* Interactive Platform 14-Grid */}
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
							{Array.from({ length: 14 }, (_, i) => {
								const pNum = i + 1;
								return (
									<div key={pNum} className="bg-white border border-zinc-200/60 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
										{/* Card Header */}
										<div className="bg-[#11236a] flex items-center justify-between px-3 py-2 shrink-0">
											<span className="text-white text-xs font-extrabold tracking-wide">S{pNum}</span>
											<span className="text-zinc-500 text-[8px] font-bold tracking-wider uppercase">UNIT</span>
										</div>
										{/* Card Body Grid */}
										<div className="grid grid-cols-2 gap-2 p-3 flex-1 bg-[#f8fafc]/30">
											{Array.from({ length: 10 }, (_, j) => {
												const sNum = j + 1;
												const isAvailable = platformSlots[`${pNum}-${sNum}`];
												return (
													<button
														key={sNum}
														onClick={() => setSelectedPlatformModal({ stationNo: pNum, platformNo: sNum })}
														className={`group flex flex-col items-center justify-center p-2 rounded-lg transition-all border outline-none cursor-pointer active:scale-95 border-none ${
															isAvailable
																? 'bg-emerald-50/50 hover:bg-emerald-100/50 border-emerald-100 text-emerald-700 hover:border-emerald-250'
																: 'bg-rose-50/70 hover:bg-rose-100/70 border-rose-150 text-rose-700 hover:border-rose-250'
														}`}
													>
														<span className="text-[11px] font-extrabold">{sNum}</span>
														<span className={`w-1.5 h-1.5 rounded-full mt-1 transition-all ${
															isAvailable
																? 'bg-emerald-500 group-hover:scale-125'
																: 'bg-rose-500 group-hover:scale-125'
														}`} />
													</button>
												);
											})}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				);

			case 'nabl-station-availability':
				return (
					<div className="space-y-6">
						{/* Header Card with Metrics */}
						<div className="bg-white border border-zinc-200/50 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
							<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
								<h2 className="text-base font-extrabold text-zinc-900 tracking-tight" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
									NABL Station Live Tracking
								</h2>
								<div className="flex items-center gap-4">
									<div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50/70 border border-emerald-100 rounded-full px-3 py-1 shadow-sm shrink-0">
										<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
										AVAILABLE: {nablAvailableCount}
									</div>
									<div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs bg-rose-50/70 border border-rose-100 rounded-full px-3 py-1 shadow-sm shrink-0">
										<span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
										OCCUPIED/RESERVED: {nablOccupiedCount}
									</div>
								</div>
							</div>
							<button
								onClick={resetSlots}
								title="Reset telemetry view"
								className="w-10 h-10 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-all hover:bg-zinc-100 cursor-pointer outline-none active:scale-95 border-none shrink-0"
							>
								<RotateCw className="w-4 h-4" />
							</button>
						</div>

						{/* Interactive NABL Platform 1-Grid */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
							{Array.from({ length: 1 }, (_, i) => {
								const pNum = i + 1;
								return (
									<div key={pNum} className="bg-white border border-zinc-200/60 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
										{/* Card Header */}
										<div className="bg-[#11236a] flex items-center justify-between px-3 py-2 shrink-0">
											<span className="text-white text-xs font-extrabold tracking-wide">NABL Station {pNum}</span>
											<span className="text-zinc-500 text-[8px] font-bold tracking-wider uppercase">UNIT</span>
										</div>
										{/* Card Body Grid */}
										<div className="grid grid-cols-2 gap-2 p-3 flex-1 bg-[#f8fafc]/30">
											{Array.from({ length: 10 }, (_, j) => {
												const sNum = j + 1;
												const isAvailable = nablPlatformSlots[`${pNum}-${sNum}`];
												return (
													<button
														key={sNum}
														onClick={() => setSelectedNablPlatformModal({ stationNo: pNum, platformNo: sNum })}
														className={`group flex flex-col items-center justify-center p-2 rounded-lg transition-all border outline-none cursor-pointer active:scale-95 border-none ${
															isAvailable
																? 'bg-emerald-50/50 hover:bg-emerald-100/50 border-emerald-100 text-emerald-700 hover:border-emerald-250'
																: 'bg-rose-50/70 hover:bg-rose-100/70 border-rose-150 text-rose-700 hover:border-rose-250'
														}`}
													>
														<span className="text-[11px] font-extrabold">{sNum}</span>
														<span className={`w-1.5 h-1.5 rounded-full mt-1 transition-all ${
															isAvailable
																? 'bg-emerald-500 group-hover:scale-125'
																: 'bg-rose-500 group-hover:scale-125'
														}`} />
													</button>
												);
											})}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				);

			case 'equipment-availability':
				return (
					<div className="space-y-6">
						{/* Header Card with Metrics */}
						<div className="bg-white border border-zinc-200/50 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
							<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
								<h2 className="text-base font-extrabold text-zinc-900 tracking-tight" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
									Testing Equipment Availability
								</h2>
								<div className="flex items-center gap-4">
									<div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50/70 border border-emerald-100 rounded-full px-3 py-1 shadow-sm shrink-0">
										<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
										AVAILABLE/IDLE: {availableEq}
									</div>
									<div className="flex items-center gap-1.5 text-indigo-600 font-bold text-xs bg-indigo-50/70 border border-indigo-100 rounded-full px-3 py-1 shadow-sm shrink-0">
										<span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
										OCCUPIED/BUSY: {occupiedEq}
									</div>
									<div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs bg-amber-50/70 border border-amber-100 rounded-full px-3 py-1 shadow-sm shrink-0">
										<span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
										MAINTENANCE: {maintenanceEq}
									</div>
								</div>
							</div>
							<button
								onClick={resetSlots}
								title="Reset chamber states"
								className="w-10 h-10 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-all hover:bg-zinc-100 cursor-pointer outline-none active:scale-95 border-none shrink-0"
							>
								<RotateCw className="w-4 h-4" />
							</button>
						</div>

						{/* Equipment Telemetry Cards Grid */}
						<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
							{equipmentList.map((eq) => {
								const isOccupied = !eq.isAvailable;
								return (
									<div 
										key={eq.id} 
										onClick={() => setSelectedEquipmentModal(eq)}
										className="bg-white border border-zinc-200/60 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col cursor-pointer hover:scale-[1.01]"
									>
										{/* Card Header */}
										<div className="bg-[#11236a] flex items-center justify-between px-4 py-2.5 shrink-0">
											<div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
												<Activity className="w-3.5 h-3.5 text-white shrink-0" />
												<span className="text-white text-xs font-extrabold tracking-wide truncate" title={eq.name}>{eq.name}</span>
											</div>
											<span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase leading-none shrink-0 ${
												eq.status === 'MAINTENANCE' || eq.status === 'UNDER_MAINTENANCE'
													? 'bg-amber-100 text-amber-800'
													: isOccupied
														? 'bg-rose-100 text-rose-800'
														: 'bg-emerald-100 text-emerald-800'
											}`}>
												{eq.status === 'MAINTENANCE' || eq.status === 'UNDER_MAINTENANCE' ? 'Maintenance' : isOccupied ? 'Occupied' : 'Available'}
											</span>
										</div>

										{/* Card Body */}
										<div className="p-4 flex-grow flex flex-col justify-between bg-[#f8fafc]/30 space-y-3">
											<div className="border border-zinc-150 bg-zinc-50/50 rounded-xl p-3 flex flex-col gap-2 text-[10px]">
												<div className="flex items-center justify-between text-zinc-500 font-bold uppercase tracking-wider">
													<span>Calibration Due</span>
													<span className="text-zinc-700 font-extrabold">
														{eq.calibrationDueDate ? new Date(eq.calibrationDueDate).toLocaleDateString() : 'N/A'}
													</span>
												</div>
												<div className="flex items-center justify-between text-zinc-500 font-bold uppercase tracking-wider">
													<span>Status</span>
													<span className="text-zinc-700 font-extrabold">{eq.status}</span>
												</div>
											</div>

											<div className="text-right">
												<span className="text-[10px] text-indigo-600 font-extrabold hover:underline">
													View Details →
												</span>
											</div>
										</div>
									</div>
								);
							})}
							{equipmentList.length === 0 && (
								<div className="col-span-full text-center py-10 bg-white border border-dashed rounded-xl">
									<p className="text-zinc-500 font-bold text-xs">No R&D equipment found in the database.</p>
								</div>
							)}
						</div>
					</div>
				);

			case 'departments-management':
				return <DepartmentManagement />;

			case 'users-management':
				return <UserManagement />;

			case 'test-types-management':
				return <TestTypeManagement />;

			case 'test-category-management':
				return <TestCategoryManagement />;

			case 'test-protocols-management':
				return <TestProtocolManagement />;

			case 'product-part-names':
				return <ProductPartManagement />;

			case 'suppliers-customers':
				return <SupplierCustomerManagement />;

			case 'rd-testing-equipments':
				return <TestingEquipmentManagement />;

			default:
				return null;
		}
	};

	return (
		<DashboardLayout
			title={headers.title}
			description={headers.desc}
			activeTab={activeTab}
			onTabChange={(tab) => {
				if (tab === 'dashboard') navigate('/admin/dashboard');
				else if (tab === 'platform-availability') navigate('/admin/platform-availability');
				else if (tab === 'nabl-station-availability') navigate('/admin/nabl-station-availability');
				else if (tab === 'equipment-availability') navigate('/admin/equipment-availability');
				else if (tab === 'departments-management') navigate('/admin/departments-management');
				else if (tab === 'users-management') navigate('/admin/users-management');
				else if (tab === 'test-types-management') navigate('/admin/test-types');
				else if (tab === 'test-category-management') navigate('/admin/test-categories');
				else if (tab === 'test-protocols-management') navigate('/admin/test-protocols');
				else if (tab === 'product-part-names') navigate('/admin/product-part-names');
				else if (tab === 'suppliers-customers') navigate('/admin/suppliers-customers');
				else if (tab === 'rd-testing-equipments') navigate('/admin/rd-equipment');
			}}
		>
			{renderContent()}

			{/* High-Fidelity Occupancy Details Modal */}
			{selectedPlatformModal && (() => {
				const details = platformOccupancies.find(
					(item: any) => String(item.stationNo) === String(selectedPlatformModal.stationNo) && String(item.platformNo) === String(selectedPlatformModal.platformNo)
				);
				const isAvailable = platformSlots[`${selectedPlatformModal.stationNo}-${selectedPlatformModal.platformNo}`];
				
				return (
					<div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
						<div className="bg-white border border-zinc-200 rounded-[24px] max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
							{/* Header */}
							<div className="bg-[#11236a] text-white px-6 py-4 flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Activity className="w-5 h-5 text-white/90" />
									<h3 className="font-extrabold text-sm tracking-wide uppercase">
										Station {selectedPlatformModal.stationNo} - Platform {selectedPlatformModal.platformNo}
									</h3>
								</div>
								<button 
									onClick={() => setSelectedPlatformModal(null)}
									className="text-white/70 hover:text-white transition-all bg-white/10 hover:bg-white/20 rounded-full w-7 h-7 flex items-center justify-center outline-none border-none cursor-pointer"
								>
									✕
								</button>
							</div>
							
							{/* Content */}
							<div className="p-6 space-y-4">
								{isAvailable ? (
									<div className="text-center py-6 space-y-3">
										<div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
											<span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse" />
										</div>
										<div className="space-y-1">
											<h4 className="text-base font-extrabold text-zinc-950">Platform is Available</h4>
											<p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
												This testing channel is currently free and idle. It will automatically lock when a Lab Manager assigns a passed sample during the Test Plan configuration phase.
											</p>
										</div>
									</div>
								) : (
									<div className="space-y-4">
										<div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-4 flex items-center gap-3">
											<span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shrink-0" />
											<div>
												<h4 className="text-xs font-extrabold text-rose-950">Active Testing Reservation</h4>
												<p className="text-[11px] text-rose-700/80 font-medium">Platform is currently occupied and running load cycles.</p>
											</div>
										</div>
										
										<div className="border border-zinc-150 bg-zinc-50/30 rounded-2xl p-4 space-y-3 text-xs">
											<div className="flex justify-between items-center py-1.5 border-b border-zinc-100">
												<span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Occupied By</span>
												<span className="text-zinc-850 font-extrabold text-right">{(details?.occupiedBy || 'N/A').replace(/^REQ-REQ-/, 'REQ-')}</span>
											</div>
											<div className="flex justify-between items-center py-1.5 border-b border-zinc-100">
												<span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Model Number</span>
												<span className="text-zinc-850 font-extrabold text-right">{details?.modelNo || 'N/A'}</span>
											</div>
											<div className="flex justify-between items-center py-1.5 border-b border-zinc-100">
												<span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Test Request ID</span>
												<span className="text-zinc-850 font-extrabold text-right">
													{getFormattedRequestId(details?.occupiedBy, details?.testRequestId)}
												</span>
											</div>
											<div className="flex justify-between items-center py-1.5">
												<span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Occupied Until</span>
												<span className="text-rose-600 font-extrabold text-right">
													{formatOccupiedUntil(details?.occupiedUntil)}
												</span>
											</div>
										</div>
									</div>
								)}
							</div>
							
							{/* Footer */}
							<div className="bg-zinc-50 border-t border-zinc-200/80 px-6 py-4 flex justify-end">
								<button
									onClick={() => setSelectedPlatformModal(null)}
									className="bg-zinc-900 hover:bg-zinc-850 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all outline-none border-none cursor-pointer active:scale-95 shadow-sm"
								>
									Close Details
								</button>
							</div>
						</div>
					</div>
				);
			})()}

			{/* High-Fidelity NABL Occupancy Details Modal */}
			{selectedNablPlatformModal && (() => {
				const details = nablPlatformOccupancies.find(
					(item: any) => String(item.stationNo) === String(selectedNablPlatformModal.stationNo) && String(item.platformNo) === String(selectedNablPlatformModal.platformNo)
				);
				const isAvailable = nablPlatformSlots[`${selectedNablPlatformModal.stationNo}-${selectedNablPlatformModal.platformNo}`];
				
				return (
					<div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
						<div className="bg-white border border-zinc-200 rounded-[24px] max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
							{/* Header */}
							<div className="bg-[#11236a] text-white px-6 py-4 flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Activity className="w-5 h-5 text-white/90" />
									<h3 className="font-extrabold text-sm tracking-wide uppercase">
										NABL Station {selectedNablPlatformModal.stationNo} - Platform {selectedNablPlatformModal.platformNo}
									</h3>
								</div>
								<button 
									onClick={() => setSelectedNablPlatformModal(null)}
									className="text-white/70 hover:text-white transition-all bg-white/10 hover:bg-white/20 rounded-full w-7 h-7 flex items-center justify-center outline-none border-none cursor-pointer"
								>
									✕
								</button>
							</div>
							
							{/* Content */}
							<div className="p-6 space-y-4">
								{isAvailable ? (
									<div className="text-center py-6 space-y-3">
										<div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
											<span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse" />
										</div>
										<div className="space-y-1">
											<h4 className="text-base font-extrabold text-zinc-950">Platform is Available</h4>
											<p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
												This testing channel is currently free and idle.
											</p>
										</div>
									</div>
								) : (
									<div className="space-y-4">
										<div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-4 flex items-center gap-3">
											<span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shrink-0" />
											<div>
												<h4 className="text-xs font-extrabold text-rose-950">Active Testing Reservation</h4>
												<p className="text-[11px] text-rose-700/80 font-medium">Platform is currently occupied and running load cycles.</p>
											</div>
										</div>
										
										<div className="border border-zinc-150 bg-zinc-50/30 rounded-2xl p-4 space-y-3 text-xs">
											<div className="flex justify-between items-center py-1.5 border-b border-zinc-100">
												<span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Occupied By</span>
												<span className="text-zinc-850 font-extrabold text-right">{(details?.occupiedBy || 'N/A').replace(/^REQ-REQ-/, 'REQ-')}</span>
											</div>
											<div className="flex justify-between items-center py-1.5 border-b border-zinc-100">
												<span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Model Number</span>
												<span className="text-zinc-850 font-extrabold text-right">{details?.modelNo || 'N/A'}</span>
											</div>
											<div className="flex justify-between items-center py-1.5 border-b border-zinc-100">
												<span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Test Request ID</span>
												<span className="text-zinc-850 font-extrabold text-right">
													{getFormattedRequestId(details?.occupiedBy, details?.testRequestId)}
												</span>
											</div>
											<div className="flex justify-between items-center py-1.5">
												<span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Occupied Until</span>
												<span className="text-rose-600 font-extrabold text-right">
													{formatOccupiedUntil(details?.occupiedUntil)}
												</span>
											</div>
										</div>
									</div>
								)}
							</div>
							
							{/* Footer */}
							<div className="bg-zinc-50 border-t border-zinc-200/80 px-6 py-4 flex justify-end">
								<button
									onClick={() => setSelectedNablPlatformModal(null)}
									className="bg-zinc-900 hover:bg-zinc-850 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all outline-none border-none cursor-pointer active:scale-95 shadow-sm"
								>
									Close Details
								</button>
							</div>
						</div>
					</div>
				);
			})()}

			{/* High-Fidelity Equipment Occupancy Details Modal */}
			{selectedEquipmentModal && (() => {
				const isAvailable = selectedEquipmentModal.isAvailable;
				
				return (
					<div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
						<div className="bg-white border border-zinc-200 rounded-[24px] max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
							{/* Header */}
							<div className="bg-[#11236a] text-white px-6 py-4 flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Activity className="w-5 h-5 text-white/90" />
									<h3 className="font-extrabold text-sm tracking-wide uppercase">
										Equipment: {selectedEquipmentModal.name}
									</h3>
								</div>
								<button 
									onClick={() => setSelectedEquipmentModal(null)}
									className="text-white/70 hover:text-white transition-all bg-white/10 hover:bg-white/20 rounded-full w-7 h-7 flex items-center justify-center outline-none border-none cursor-pointer"
								>
									✕
								</button>
							</div>
							
							{/* Content */}
							<div className="p-6 space-y-4">
								{isAvailable ? (
									<div className="text-center py-6 space-y-3">
										<div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
											<span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse" />
										</div>
										<div className="space-y-1">
											<h4 className="text-base font-extrabold text-zinc-950">Equipment is Available</h4>
											<p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
												This R&D Equipment is currently free and idle. It will automatically lock when a Lab Manager assigns a passed sample during the Test Plan configuration phase.
											</p>
										</div>
									</div>
								) : (
									<div className="space-y-4">
										<div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-4 flex items-center gap-3">
											<span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shrink-0" />
											<div>
												<h4 className="text-xs font-extrabold text-rose-950">Active Equipment Reservation</h4>
												<p className="text-[11px] text-rose-700/80 font-medium">Equipment is currently occupied and running test cycles.</p>
											</div>
										</div>
										
										<div className="border border-zinc-150 bg-zinc-50/30 rounded-2xl p-4 space-y-3 text-xs">
											<div className="flex justify-between items-center py-1.5 border-b border-zinc-100">
												<span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Occupied By</span>
												<span className="text-zinc-850 font-extrabold text-right">{(selectedEquipmentModal.occupiedBy || 'N/A').replace(/^REQ-REQ-/, 'REQ-')}</span>
											</div>
											<div className="flex justify-between items-center py-1.5 border-b border-zinc-100">
												<span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Model Number</span>
												<span className="text-zinc-850 font-extrabold text-right">{selectedEquipmentModal.modelNo || 'N/A'}</span>
											</div>
											<div className="flex justify-between items-center py-1.5 border-b border-zinc-100">
												<span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Test Request ID</span>
												<span className="text-zinc-850 font-extrabold text-right">
													{getFormattedRequestId(selectedEquipmentModal.occupiedBy, selectedEquipmentModal.testRequestId)}
												</span>
											</div>
											<div className="flex justify-between items-center py-1.5">
												<span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Occupied Until</span>
												<span className="text-rose-600 font-extrabold text-right">
													{formatOccupiedUntil(selectedEquipmentModal.occupiedUntil)}
												</span>
											</div>
										</div>
									</div>
								)}
							</div>
							
							{/* Footer */}
							<div className="bg-zinc-50 border-t border-zinc-200/80 px-6 py-4 flex justify-end">
								<button
									onClick={() => setSelectedEquipmentModal(null)}
									className="bg-zinc-900 hover:bg-zinc-850 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all outline-none border-none cursor-pointer active:scale-95 shadow-sm"
								>
									Close Details
								</button>
							</div>
						</div>
					</div>
				);
			})()}
		</DashboardLayout>
	);
}
