import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../layouts/DashboardLayout';
import { getPlatforms } from '../../services/operations/platformAvailabilityService';
import { getTestingEquipments } from '../../services/operations/testingEquipmentService';
import DepartmentManagement from './DepartmentManagement';
import UserManagement from './UserManagement';
import TestTypeManagement from './TestTypeManagement';
import TestCategoryManagement from './TestCategoryManagement';
import TestProtocolManagement from './TestProtocolManagement';
import ProductPartManagement from './ProductPartManagement';
import SupplierCustomerManagement from './SupplierCustomerManagement';
import TestingEquipmentManagement from './TestingEquipmentManagement';
import { 
	Shield, Database, Users, ChevronRight, RotateCw, Activity
} from 'lucide-react';

export default function AdminDashboard() {
	const location = useLocation();
	const navigate = useNavigate();
	const path = location.pathname;

	let activeTab = 'departments-management'; // Set default to Departments Management
	if (path.includes('/admin/dashboard')) activeTab = 'dashboard';
	else if (path.includes('/admin/platform-availability')) activeTab = 'platform-availability';
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

	const [platformSlots, setPlatformSlots] = useState<{ [key: string]: boolean }>({});
	const [platformOccupancies, setPlatformOccupancies] = useState<any[]>([]);
	const [selectedPlatformModal, setSelectedPlatformModal] = useState<{ stationNo: number; platformNo: number } | null>(null);

	const loadPlatformTelemetry = async () => {
		try {
			const data = await getPlatforms()();
			setPlatformOccupancies(data || []);
			const mapping: { [key: string]: boolean } = {};
			(data || []).forEach((item: any) => {
				mapping[`${item.stationNo}-${item.platformNo}`] = item.isAvailable;
			});
			setPlatformSlots(mapping);
		} catch (err) {
			console.error('Failed to load platform availability telemetry:', err);
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

	useEffect(() => {
		if (token && userStr) {
			loadPlatformTelemetry();
			loadEquipmentTelemetry();
		}
	}, [token, userStr]);

	const resetSlots = async () => {
		await loadPlatformTelemetry();
		await loadEquipmentTelemetry();
		toast.success('Resource availability synchronized from database.');
	};

	const availableCount = Object.values(platformSlots).filter(v => v === true).length;
	const occupiedCount = Object.values(platformSlots).filter(v => v === false).length;

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
					<div className="space-y-6">
						{/* Top Metric Cards */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							{/* Users Metric */}
							<div className="bg-white border border-zinc-200/50 rounded-[20px] p-5 shadow-sm flex flex-col justify-between">
								<div className="flex items-center gap-4">
									<div className="w-10 h-10 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
										<Users className="w-5 h-5" />
									</div>
									<div>
										<h4 className="text-2xl font-bold text-zinc-900 leading-tight">4</h4>
										<p className="text-xs text-zinc-500 font-medium">Active Profiles</p>
									</div>
								</div>
								<div 
									onClick={() => navigate('/admin/users-management')} 
									className="border-t border-zinc-100 mt-4 pt-3 flex items-center justify-between text-xs text-zinc-600 hover:text-[#11236a] transition-all cursor-pointer"
								>
									<span>View details</span>
									<ChevronRight className="w-3.5 h-3.5" />
								</div>
							</div>

							{/* Database Pool Metric */}
							<div className="bg-white border border-zinc-200/50 rounded-[20px] p-5 shadow-sm flex flex-col justify-between">
								<div className="flex items-center gap-4">
									<div className="w-10 h-10 bg-rose-500/10 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
										<Database className="w-5 h-5" />
									</div>
									<div>
										<h4 className="text-2xl font-bold text-zinc-900 leading-tight">21 Max</h4>
										<p className="text-xs text-zinc-500 font-medium">Database Pools</p>
									</div>
								</div>
								<div 
									onClick={() => navigate('/admin/platform-availability')}
									className="border-t border-zinc-100 mt-4 pt-3 flex items-center justify-between text-xs text-zinc-600 hover:text-[#11236a] transition-all cursor-pointer"
								>
									<span>View details</span>
									<ChevronRight className="w-3.5 h-3.5" />
								</div>
							</div>

							{/* System Alerts Metric */}
							<div className="bg-white border border-zinc-200/50 rounded-[20px] p-5 shadow-sm flex flex-col justify-between">
								<div className="flex items-center gap-4">
									<div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
										<Shield className="w-5 h-5" />
									</div>
									<div>
										<h4 className="text-2xl font-bold text-zinc-900 leading-tight">4 Hubs</h4>
										<p className="text-xs text-zinc-500 font-medium">Departments</p>
									</div>
								</div>
								<div 
									onClick={() => navigate('/admin/departments-management')}
									className="border-t border-zinc-100 mt-4 pt-3 flex items-center justify-between text-xs text-zinc-600 hover:text-[#11236a] transition-all cursor-pointer"
								>
									<span>View details</span>
									<ChevronRight className="w-3.5 h-3.5" />
								</div>
							</div>
						</div>

						{/* System Status Welcome Card */}
						<div className="bg-white border border-zinc-200/50 rounded-3xl p-8 shadow-sm flex flex-col justify-center items-center text-center">
							<div className="w-16 h-16 bg-[#11236a]/5 border border-[#11236a]/10 rounded-2xl flex items-center justify-center text-[#11236a] mb-4">
								<Shield className="w-8 h-8" />
							</div>
							<h2 className="text-xl font-bold text-zinc-900 tracking-tight" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
								System Admin Console
							</h2>
							<p className="text-zinc-500 max-w-lg mt-2 text-sm font-light leading-relaxed">
								Welcome to Dixon Technology Admin Center. Real-time platform states, department setups, NABL test procedures, and user credentials registers are active. Use the left navigation to manage resources.
							</p>
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
											<div className="flex items-center gap-2">
												<Activity className="w-3.5 h-3.5 text-white shrink-0" />
												<span className="text-white text-xs font-extrabold tracking-wide">ID: #{eq.id}</span>
											</div>
											<span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase leading-none ${
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
											<div>
												<h4 className="text-xs font-bold text-zinc-950 truncate leading-tight">{eq.name}</h4>
												<p className="text-[10px] text-zinc-500 font-medium mt-0.5">Model No: {eq.modelNo || 'N/A'}</p>
											</div>

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
												<span className="text-zinc-850 font-extrabold text-right">{details?.occupiedBy || 'N/A'}</span>
											</div>
											<div className="flex justify-between items-center py-1.5 border-b border-zinc-100">
												<span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Model Number</span>
												<span className="text-zinc-850 font-extrabold text-right">{details?.modelNo || 'N/A'}</span>
											</div>
											<div className="flex justify-between items-center py-1.5 border-b border-zinc-100">
												<span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Test Request ID</span>
												<span className="text-zinc-850 font-extrabold text-right">#{details?.testRequestId || 'N/A'}</span>
											</div>
											<div className="flex justify-between items-center py-1.5">
												<span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Occupied Until</span>
												<span className="text-rose-600 font-extrabold text-right">
													{details?.occupiedUntil ? new Date(details.occupiedUntil).toLocaleString() : 'N/A'}
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
												<span className="text-zinc-850 font-extrabold text-right">{selectedEquipmentModal.occupiedBy || 'N/A'}</span>
											</div>
											<div className="flex justify-between items-center py-1.5 border-b border-zinc-100">
												<span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Model Number</span>
												<span className="text-zinc-850 font-extrabold text-right">{selectedEquipmentModal.modelNo || 'N/A'}</span>
											</div>
											<div className="flex justify-between items-center py-1.5 border-b border-zinc-100">
												<span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Test Request ID</span>
												<span className="text-zinc-850 font-extrabold text-right">#{selectedEquipmentModal.testRequestId || 'N/A'}</span>
											</div>
											<div className="flex justify-between items-center py-1.5">
												<span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Occupied Until</span>
												<span className="text-rose-600 font-extrabold text-right">
													{selectedEquipmentModal.occupiedUntil ? new Date(selectedEquipmentModal.occupiedUntil).toLocaleString() : 'N/A'}
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
