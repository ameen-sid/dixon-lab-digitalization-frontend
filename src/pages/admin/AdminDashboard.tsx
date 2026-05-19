import { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import DepartmentManagement from './DepartmentManagement';
import UserManagement from './UserManagement';
import { 
	Shield, Database, Users, ChevronRight, Plus
} from 'lucide-react';

export default function AdminDashboard() {
	const [activeTab, setActiveTab] = useState('departments-management'); // Set default to Departments Management

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
										<p className="text-xs text-zinc-400 font-medium">Active Profiles</p>
									</div>
								</div>
								<div 
									onClick={() => setActiveTab('users-management')} 
									className="border-t border-zinc-100 mt-4 pt-3 flex items-center justify-between text-xs text-zinc-450 hover:text-[#11236a] transition-all cursor-pointer"
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
										<p className="text-xs text-zinc-400 font-medium">Database Pools</p>
									</div>
								</div>
								<div 
									onClick={() => setActiveTab('platform-availability')}
									className="border-t border-zinc-100 mt-4 pt-3 flex items-center justify-between text-xs text-zinc-450 hover:text-[#11236a] transition-all cursor-pointer"
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
										<p className="text-xs text-zinc-400 font-medium">Departments</p>
									</div>
								</div>
								<div 
									onClick={() => setActiveTab('departments-management')}
									className="border-t border-zinc-100 mt-4 pt-3 flex items-center justify-between text-xs text-zinc-450 hover:text-[#11236a] transition-all cursor-pointer"
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
						{/* Availability Grid */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Services Uptime Status */}
							<div className="bg-white border border-zinc-200/50 rounded-3xl p-6 shadow-sm">
								<div className="flex items-center justify-between border-b border-zinc-100 pb-4">
									<h3 className="text-sm font-bold text-zinc-800">Node Availability</h3>
									<span className="bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full px-2 py-0.5 text-[10px] font-bold">100% Online</span>
								</div>
								<div className="mt-5 space-y-4">
									{[
										{ name: 'Core API Gateway', uptime: '99.98%', ping: '4ms' },
										{ name: 'Identity Provider (JWT)', uptime: '100%', ping: '2ms' },
										{ name: 'MS SQL Database Pool', uptime: '99.99%', ping: '12ms' },
										{ name: 'NABL Telemetry Service', uptime: '99.95%', ping: '15ms' }
									].map((node, i) => (
										<div key={i} className="flex items-center justify-between border-b border-zinc-50 pb-3 last:border-0 last:pb-0">
											<div>
												<p className="text-xs font-bold text-zinc-800">{node.name}</p>
												<span className="text-[10px] text-zinc-400 font-light">Latency: {node.ping}</span>
											</div>
											<span className="text-xs font-semibold text-emerald-600">{node.uptime} Uptime</span>
										</div>
									))}
								</div>
							</div>

							{/* Server Telemetry Performance Charts */}
							<div className="bg-white border border-zinc-200/50 rounded-3xl p-6 shadow-sm">
								<div className="flex items-center justify-between">
									<h3 className="text-sm font-bold text-zinc-800">Server Latency (Avg)</h3>
									<span className="text-[10px] text-zinc-400 font-bold">Live Monitor</span>
								</div>
								<div className="w-full h-44 mt-6">
									<svg className="w-full h-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
										<line x1="0" y1="37.5" x2="500" y2="37.5" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
										<line x1="0" y1="75" x2="500" y2="75" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
										<line x1="0" y1="112.5" x2="500" y2="112.5" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
										<path d="M0,100 C100,100 120,40 180,60 C250,80 300,30 360,30 C420,30 460,90 500,90 L500,150 L0,150 Z" fill="#11236a" fillOpacity="0.05" />
										<path d="M0,100 C100,100 120,40 180,60 C250,80 300,30 360,30 C420,30 460,90 500,90" fill="none" stroke="#11236a" strokeWidth="2" strokeLinecap="round" />
									</svg>
									<div className="flex justify-between text-[10px] text-zinc-400 font-medium px-1 mt-2">
										<span>12:00</span>
										<span>12:10</span>
										<span>12:20</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				);

			case 'equipment-availability':
				return (
					<div className="bg-white border border-zinc-200/50 rounded-3xl p-6 shadow-sm">
						<div className="flex items-center justify-between border-b border-zinc-100 pb-4">
							<h3 className="text-sm font-bold text-zinc-800">Stress Chambers & Calibration Availability</h3>
							<button className="bg-[#11236a] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-[#0c1a52] transition-all border-none outline-none">
								<Plus className="w-3.5 h-3.5" /> Add Equipment
							</button>
						</div>
						<div className="mt-5 space-y-4">
							{[
								{ name: 'SMT Thermal Shock Chamber', type: 'Thermal Stress', status: 'Available', percent: '100%', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
								{ name: 'Vibration Safety Shaker Table', type: 'Mechanical Stress', status: 'Occupied', percent: '45%', color: 'text-amber-600 bg-amber-50 border-amber-100' },
								{ name: 'NABL High-Frequency Oscilloscope', type: 'Signal Calibration', status: 'Maintenance', percent: '0%', color: 'text-rose-600 bg-rose-50 border-rose-100' }
							].map((eq, i) => (
								<div key={i} className="flex items-center justify-between border-b border-zinc-50 pb-3.5 last:border-0 last:pb-0">
									<div>
										<p className="text-xs font-bold text-zinc-800">{eq.name}</p>
										<span className="text-[10px] text-zinc-400 font-light">Class: {eq.type}</span>
									</div>
									<div className="flex items-center gap-4">
										<span className={`text-[10px] font-bold px-2 py-0.5 border rounded-full uppercase tracking-wider ${eq.color}`}>{eq.status}</span>
										<span className="text-xs font-bold text-zinc-500">{eq.percent} Capacity</span>
									</div>
								</div>
							))}
						</div>
					</div>
				);

			case 'departments-management':
				return <DepartmentManagement />;

			case 'users-management':
				return <UserManagement />;

			case 'test-types-management':
				return (
					<div className="bg-white border border-zinc-200/50 rounded-3xl p-6 shadow-sm">
						<div className="flex items-center justify-between border-b border-zinc-100 pb-4">
							<h3 className="text-sm font-bold text-zinc-800">Diagnostic Stress Mappings</h3>
							<button className="bg-[#11236a] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-[#0c1a52] transition-all border-none outline-none">
								<Plus className="w-3.5 h-3.5" /> New Test Type
							</button>
						</div>
						<div className="mt-5 space-y-4">
							{[
								{ name: 'Thermal Cycling Fatigue', code: 'TC-FAT', duration: '48 Hours', standard: 'IEC 60068-2-14' },
								{ name: 'High-G Shock Mechanical Run', code: 'MECH-SHK', duration: '4 Hours', standard: 'MIL-STD-810H' },
								{ name: 'High-Voltage Insulation Sweep', code: 'ELEC-INS', duration: '30 Minutes', standard: 'IS 13252' }
							].map((t, i) => (
								<div key={i} className="flex items-center justify-between border-b border-zinc-50 pb-3.5 last:border-0 last:pb-0">
									<div>
										<div className="flex items-center gap-2">
											<span className="text-xs font-bold text-zinc-800">{t.name}</span>
											<span className="text-[9px] bg-[#11236a]/5 border border-[#11236a]/15 text-[#11236a] font-bold px-1.5 py-0.2 rounded">{t.code}</span>
										</div>
										<span className="text-[10px] text-zinc-400 font-light">Compliance Directive: {t.standard}</span>
									</div>
									<span className="text-xs font-bold text-zinc-500">{t.duration}</span>
								</div>
							))}
						</div>
					</div>
				);

			case 'test-category-management':
				return (
					<div className="bg-white border border-zinc-200/50 rounded-3xl p-6 shadow-sm">
						<div className="flex items-center justify-between border-b border-zinc-100 pb-4">
							<h3 className="text-sm font-bold text-zinc-800">Compliance & Stress Classifications</h3>
							<button className="bg-[#11236a] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-[#0c1a52] transition-all border-none outline-none">
								<Plus className="w-3.5 h-3.5" /> Add Category
							</button>
						</div>
						<div className="mt-5 space-y-4">
							{[
								{ name: 'Safety & Shock Testing', code: 'SAFE-NABL', count: '14 Procedures' },
								{ name: 'Environmental Heat Stress', code: 'ENV-STRESS', count: '28 Procedures' },
								{ name: 'Electromagnetic Calibration', code: 'EMI-CAL', count: '8 Procedures' }
							].map((cat, i) => (
								<div key={i} className="flex items-center justify-between border-b border-zinc-50 pb-3.5 last:border-0 last:pb-0">
									<div>
										<div className="flex items-center gap-2">
											<span className="text-xs font-bold text-zinc-800">{cat.name}</span>
											<span className="text-[9px] bg-zinc-100 border border-zinc-200 text-zinc-500 font-bold px-1.5 py-0.2 rounded">{cat.code}</span>
										</div>
										<span className="text-[10px] text-zinc-400 font-light">Calibration Standard Class A</span>
									</div>
									<span className="text-xs font-bold text-zinc-500">{cat.count}</span>
								</div>
							))}
						</div>
					</div>
				);

			case 'test-protocols-management':
				return (
					<div className="bg-white border border-zinc-200/50 rounded-3xl p-6 shadow-sm">
						<div className="flex items-center justify-between border-b border-zinc-100 pb-4">
							<h3 className="text-sm font-bold text-zinc-800">Standard Calibration Protocols</h3>
							<button className="bg-[#11236a] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-[#0c1a52] transition-all border-none outline-none">
								<Plus className="w-3.5 h-3.5" /> Create Protocol
							</button>
						</div>
						<div className="mt-5 space-y-4">
							{[
								{ name: 'Dixon MIL-STD reliability sweep', code: 'DX-MIL-102', revision: 'Rev 4.2', author: 'Dr. Anita Roy' },
								{ name: 'SMT Thermocouple stress plan', code: 'DX-THERM-88', revision: 'Rev 1.0', author: 'Aditya Gupta' },
								{ name: 'Consumer Safe-Adjudicate guidelines', code: 'DX-SAFE-09', revision: 'Rev 3.5', author: 'Sunita Sharma' }
							].map((p, i) => (
								<div key={i} className="flex items-center justify-between border-b border-zinc-50 pb-3.5 last:border-0 last:pb-0">
									<div>
										<div className="flex items-center gap-2">
											<span className="text-xs font-bold text-zinc-800">{p.name}</span>
											<span className="text-[9px] bg-[#11236a]/5 border border-[#11236a]/15 text-[#11236a] font-bold px-1.5 py-0.2 rounded">{p.code}</span>
										</div>
										<span className="text-[10px] text-zinc-400 font-light">Drafted by: {p.author}</span>
									</div>
									<span className="text-xs font-bold text-[#11236a]">{p.revision}</span>
								</div>
							))}
						</div>
					</div>
				);

			case 'product-part-names':
				return (
					<div className="bg-white border border-zinc-200/50 rounded-3xl p-6 shadow-sm">
						<div className="flex items-center justify-between border-b border-zinc-100 pb-4">
							<h3 className="text-sm font-bold text-zinc-800">Product & Component Parts Register</h3>
							<button className="bg-[#11236a] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-[#0c1a52] transition-all border-none outline-none">
								<Plus className="w-3.5 h-3.5" /> Add New Part
							</button>
						</div>
						<div className="mt-5 space-y-4">
							{[
								{ name: 'ARM Cortex-M4 Microcontroller', part: 'MCU-ARM-M4-64', category: 'Microprocessors', status: 'Compliant' },
								{ name: 'Dixon Dual-layer SMT PCB base', part: 'PCB-SMT-2L-A', category: 'PCBs / Assemblies', status: 'Compliant' },
								{ name: 'High-Frequency Solid-State Relay', part: 'REL-HF-SSR-05', category: 'Electromechanics', status: 'Under Stress Testing' }
							].map((part, i) => (
								<div key={i} className="flex items-center justify-between border-b border-zinc-50 pb-3.5 last:border-0 last:pb-0">
									<div>
										<div className="flex items-center gap-2">
											<span className="text-xs font-bold text-zinc-800">{part.name}</span>
											<span className="text-[9px] bg-zinc-100 border border-zinc-200 text-zinc-500 font-bold px-1.5 py-0.2 rounded">{part.part}</span>
										</div>
										<span className="text-[10px] text-zinc-400 font-light">Class: {part.category}</span>
									</div>
									<span className="text-xs font-bold text-[#11236a]">{part.status}</span>
								</div>
							))}
						</div>
					</div>
				);

			case 'suppliers-customers':
				return (
					<div className="bg-white border border-zinc-200/50 rounded-3xl p-6 shadow-sm">
						<div className="flex items-center justify-between border-b border-zinc-100 pb-4">
							<h3 className="text-sm font-bold text-zinc-800">Suppliers & Customers Registry</h3>
							<button className="bg-[#11236a] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-[#0c1a52] transition-all border-none outline-none">
								<Plus className="w-3.5 h-3.5" /> Add Partner
							</button>
						</div>
						<div className="mt-5 space-y-4">
							{[
								{ name: 'Samsung Semiconductor India', type: 'Supplier (Chamber Parts)', city: 'Bengaluru', status: 'Verified' },
								{ name: 'Tata Power Electrical Division', type: 'Customer (Calibrations)', city: 'Mumbai', status: 'Verified' },
								{ name: 'Siemens Industrial Automation', type: 'Supplier (Relays)', city: 'New Delhi', status: 'Verified' }
							].map((partner, i) => (
								<div key={i} className="flex items-center justify-between border-b border-zinc-50 pb-3.5 last:border-0 last:pb-0">
									<div>
										<p className="text-xs font-bold text-zinc-800">{partner.name}</p>
										<span className="text-[10px] text-zinc-400 font-light">Sector: {partner.type} | Hq: {partner.city}</span>
									</div>
									<span className="text-[10px] font-bold px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full">{partner.status}</span>
								</div>
							))}
						</div>
					</div>
				);

			case 'rd-testing-equipments':
				return (
					<div className="bg-white border border-zinc-200/50 rounded-3xl p-6 shadow-sm">
						<div className="flex items-center justify-between border-b border-zinc-100 pb-4">
							<h3 className="text-sm font-bold text-zinc-800">R&D Lab Chambers & Diagnostic Equipment</h3>
							<button className="bg-[#11236a] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-[#0c1a52] transition-all border-none outline-none">
								<Plus className="w-3.5 h-3.5" /> Add Chamber
							</button>
						</div>
						<div className="mt-5 space-y-4">
							{[
								{ name: 'Ultra-Climatic Thermal Chamber', asset: 'EQ-RND-CT-01', location: 'Lab Room A1', health: 'Healthy' },
								{ name: 'Fatigue Vibration Shaker Frame', asset: 'EQ-RND-VS-05', location: 'Lab Room B3', health: 'Healthy' },
								{ name: 'High-Frequency Digital Analyzer', asset: 'EQ-RND-DA-09', location: 'Calibration Desk 2', health: 'Calibration Needed' }
							].map((eq, i) => (
								<div key={i} className="flex items-center justify-between border-b border-zinc-50 pb-3.5 last:border-0 last:pb-0">
									<div>
										<div className="flex items-center gap-2">
											<span className="text-xs font-bold text-zinc-800">{eq.name}</span>
											<span className="text-[9px] bg-zinc-100 border border-zinc-200 text-zinc-500 font-bold px-1.5 py-0.2 rounded">{eq.asset}</span>
										</div>
										<span className="text-[10px] text-zinc-400 font-light">Location: {eq.location}</span>
									</div>
									<span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${eq.health === 'Healthy' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{eq.health}</span>
								</div>
							))}
						</div>
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<DashboardLayout
			title={headers.title}
			description={headers.desc}
			activeTab={activeTab}
			onTabChange={setActiveTab}
		>
			{renderContent()}
		</DashboardLayout>
	);
}
