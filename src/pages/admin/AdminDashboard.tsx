import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
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

	const [platformSlots, setPlatformSlots] = useState<{ [key: string]: boolean }>(() => {
		const initial: { [key: string]: boolean } = {};
		for (let p = 1; p <= 14; p++) {
			for (let s = 1; s <= 10; s++) {
				initial[`${p}-${s}`] = p !== 5; // P5 occupied by default (false), others available (true)
			}
		}
		return initial;
	});

	const toggleSlot = (p: number, s: number) => {
		setPlatformSlots(prev => ({
			...prev,
			[`${p}-${s}`]: !prev[`${p}-${s}`]
		}));
	};

	const resetSlots = () => {
		const initial: { [key: string]: boolean } = {};
		for (let p = 1; p <= 14; p++) {
			for (let s = 1; s <= 10; s++) {
				initial[`${p}-${s}`] = p !== 5;
			}
		}
		setPlatformSlots(initial);
	};

	const availableCount = Object.values(platformSlots).filter(v => v === true).length;
	const occupiedCount = Object.values(platformSlots).filter(v => v === false).length;

	const [equipmentTelemetry, setEquipmentTelemetry] = useState([
		{
			id: 'TC-01',
			name: 'Thermal Shock Chamber',
			class: 'Thermal Stress Testing',
			status: 'UNDER_TEST',
			metric: 'Temp: -40°C to +150°C',
			capacity: 75,
			slots: [false, false, false, false, false, false, true, true] // true = available, false = occupied
		},
		{
			id: 'VS-02',
			name: 'Vibration Shaker Table',
			class: 'Mechanical Fatigue Stress',
			status: 'AVAILABLE',
			metric: 'Freq: 10Hz - 2000Hz',
			capacity: 0,
			slots: [true, true, true, true, true, true, true, true]
		},
		{
			id: 'OSC-03',
			name: 'NABL High-Freq Oscilloscope',
			class: 'Signal Calibration',
			status: 'MAINTENANCE',
			metric: 'BW: 4 GHz Bandwidth',
			capacity: 0,
			slots: [false, false, false, false, false, false, false, false]
		},
		{
			id: 'CC-04',
			name: 'Climate Walk-in Chamber',
			class: 'Humidity & Environment',
			status: 'UNDER_TEST',
			metric: 'Humidity: 95% RH',
			capacity: 62,
			slots: [false, false, false, false, false, true, true, true]
		}
	]);

	const toggleEquipmentSlot = (eqIndex: number, slotIndex: number) => {
		setEquipmentTelemetry(prev => {
			const updated = [...prev].map(item => ({...item, slots: [...item.slots]}));
			const slots = updated[eqIndex].slots;
			slots[slotIndex] = !slots[slotIndex];
			
			// Recalculate capacity based on occupied slots
			const totalSlots = slots.length;
			const occupiedCount = slots.filter(s => !s).length;
			const newCapacity = Math.round((occupiedCount / totalSlots) * 100);
			
			updated[eqIndex] = {
				...updated[eqIndex],
				slots,
				capacity: newCapacity
			};
			
			if (updated[eqIndex].status !== 'MAINTENANCE') {
				updated[eqIndex].status = occupiedCount > 0 ? 'UNDER_TEST' : 'AVAILABLE';
			}
			
			return updated;
		});
	};

	const changeEquipmentStatus = (eqIndex: number, newStatus: string) => {
		setEquipmentTelemetry(prev => {
			const updated = prev.map((item, idx) => {
				if (idx === eqIndex) {
					return {
						...item,
						status: newStatus,
						capacity: newStatus === 'MAINTENANCE' ? 0 : item.capacity
					};
				}
				return item;
			});
			return updated;
		});
	};

	const resetEquipmentTelemetry = () => {
		setEquipmentTelemetry([
			{
				id: 'TC-01',
				name: 'Thermal Shock Chamber',
				class: 'Thermal Stress Testing',
				status: 'UNDER_TEST',
				metric: 'Temp: -40°C to +150°C',
				capacity: 75,
				slots: [false, false, false, false, false, false, true, true]
			},
			{
				id: 'VS-02',
				name: 'Vibration Shaker Table',
				class: 'Mechanical Fatigue Stress',
				status: 'AVAILABLE',
				capacity: 0,
				metric: 'Freq: 10Hz - 2000Hz',
				slots: [true, true, true, true, true, true, true, true]
			},
			{
				id: 'OSC-03',
				name: 'NABL High-Freq Oscilloscope',
				class: 'Signal Calibration',
				status: 'MAINTENANCE',
				capacity: 0,
				metric: 'BW: 4 GHz Bandwidth',
				slots: [false, false, false, false, false, false, false, false]
			},
			{
				id: 'CC-04',
				name: 'Climate Walk-in Chamber',
				class: 'Humidity & Environment',
				status: 'UNDER_TEST',
				capacity: 62,
				metric: 'Humidity: 95% RH',
				slots: [false, false, false, false, false, true, true, true]
			}
		]);
	};

	const availableEq = equipmentTelemetry.filter(e => e.status === 'AVAILABLE').length;
	const underTestEq = equipmentTelemetry.filter(e => e.status === 'UNDER_TEST').length;
	const maintenanceEq = equipmentTelemetry.filter(e => e.status === 'MAINTENANCE').length;

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
														onClick={() => toggleSlot(pNum, sNum)}
														className={`group flex flex-col items-center justify-center p-2 rounded-lg transition-all border outline-none cursor-pointer active:scale-95 ${
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
										READY/IDLE: {availableEq}
									</div>
									<div className="flex items-center gap-1.5 text-indigo-600 font-bold text-xs bg-indigo-50/70 border border-indigo-100 rounded-full px-3 py-1 shadow-sm shrink-0">
										<span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
										RUNNING TEST: {underTestEq}
									</div>
									<div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs bg-amber-50/70 border border-amber-100 rounded-full px-3 py-1 shadow-sm shrink-0">
										<span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
										MAINTENANCE: {maintenanceEq}
									</div>
								</div>
							</div>
							<button
								onClick={resetEquipmentTelemetry}
								title="Reset chamber states"
								className="w-10 h-10 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-all hover:bg-zinc-100 cursor-pointer outline-none active:scale-95 border-none shrink-0"
							>
								<RotateCw className="w-4 h-4" />
							</button>
						</div>

						{/* Equipment Telemetry Cards Grid */}
						<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
							{equipmentTelemetry.map((eq, eqIdx) => {
								return (
									<div key={eq.id} className="bg-white border border-zinc-200/60 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
										{/* Card Header */}
										<div className="bg-[#11236a] flex items-center justify-between px-4 py-2.5 shrink-0">
											<div className="flex items-center gap-2">
												<Activity className="w-3.5 h-3.5 text-white shrink-0" />
												<span className="text-white text-xs font-extrabold tracking-wide">{eq.id}</span>
											</div>
											<select
												value={eq.status}
												onChange={(e) => changeEquipmentStatus(eqIdx, e.target.value)}
												className="bg-white/10 hover:bg-white/20 border-none outline-none rounded text-white text-[10px] font-bold px-2 py-0.5 cursor-pointer leading-none"
											>
												<option value="AVAILABLE" className="text-zinc-800 font-medium">Ready/Idle</option>
												<option value="UNDER_TEST" className="text-zinc-800 font-medium">Running Test</option>
												<option value="MAINTENANCE" className="text-zinc-800 font-medium">Maintenance</option>
											</select>
										</div>

										{/* Card Body */}
										<div className="p-4 flex-grow flex flex-col justify-between bg-[#f8fafc]/30">
											<div>
												<h4 className="text-xs font-bold text-zinc-950 truncate leading-tight">{eq.name}</h4>
												<p className="text-[10px] text-zinc-500 font-medium mt-0.5">{eq.class}</p>

												{/* Metrics Stats Box */}
												<div className="border border-zinc-150 bg-zinc-50/50 rounded-xl p-3 my-3.5 flex flex-col gap-2">
													<div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
														<span>Telemetry Metric</span>
														<span className="text-zinc-700  font-extrabold">{eq.metric}</span>
													</div>
													<div className="space-y-1">
														<div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase">
															<span>Chamber Load</span>
															<span className={eq.status === 'MAINTENANCE' ? 'text-rose-600 font-extrabold' : 'text-zinc-850 font-extrabold'}>
																{eq.status === 'MAINTENANCE' ? 'OFFLINE' : `${eq.capacity}%`}
															</span>
														</div>
														<div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
															<div 
																className={`h-full transition-all duration-500 rounded-full ${
																	eq.status === 'MAINTENANCE' 
																		? 'bg-rose-500' 
																		: eq.status === 'AVAILABLE' 
																			? 'bg-emerald-500' 
																			: 'bg-indigo-600'
																}`}
																style={{ width: `${eq.status === 'MAINTENANCE' ? 100 : eq.capacity}%` }}
															/>
														</div>
													</div>
												</div>
											</div>

											{/* Telemetry Points (Slots Grid) */}
											<div>
												<p className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest mb-1.5">Telemetry Slots (Click to toggle)</p>
												<div className="grid grid-cols-4 gap-1.5">
													{eq.slots.map((isSlotAvailable, slotIdx) => {
														return (
															<button
																key={slotIdx}
																onClick={() => toggleEquipmentSlot(eqIdx, slotIdx)}
																disabled={eq.status === 'MAINTENANCE'}
																className={`group p-1.5 rounded-lg border outline-none text-center flex flex-col items-center justify-center transition-all ${
																	eq.status === 'MAINTENANCE'
																		? 'bg-zinc-100 border-zinc-200 text-zinc-500 cursor-not-allowed'
																		: isSlotAvailable
																			? 'bg-emerald-50/50 hover:bg-emerald-100/50 border-emerald-100 hover:border-emerald-250 text-emerald-700 cursor-pointer active:scale-95'
																			: 'bg-indigo-50/50 hover:bg-indigo-100/50 border-indigo-100 hover:border-indigo-250 text-indigo-700 cursor-pointer active:scale-95'
																}`}
															>
																<span className="text-[10px] font-extrabold">{slotIdx + 1}</span>
																<span className={`w-1 h-1 rounded-full mt-0.5 transition-all ${
																	eq.status === 'MAINTENANCE'
																		? 'bg-zinc-400'
																		: isSlotAvailable
																			? 'bg-emerald-500 group-hover:scale-125'
																			: 'bg-indigo-500 group-hover:scale-125'
																}`} />
															</button>
														);
													})}
												</div>
											</div>
										</div>
									</div>
								);
							})}
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
		</DashboardLayout>
	);
}
