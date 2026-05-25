import { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
	Send, FileText, CheckCircle, HelpCircle, Plus, 
	ChevronLeft, AlertTriangle, TrendingUp, UserCheck, Search, X, Clipboard, ArrowRight
} from 'lucide-react';

export default function RequesterDashboard() {
	const [activeTab, setActiveTab] = useState('dashboard');
	const [searchQuery, setSearchQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState('ALL');
	const [urgencyFilter, setUrgencyFilter] = useState('ALL');

	// Notification State for Success Feedback
	const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

	const triggerNotification = (message: string, type: 'success' | 'info' = 'success') => {
		setNotification({ message, type });
		setTimeout(() => {
			setNotification(null);
		}, 4000);
	};

	// 1. Lab Testing Requests Mock Database (Highly realistic, SMT engineering contexts)
	const [requests, setRequests] = useState([
		{
			id: 'REQ-2026-001',
			productName: 'SMT Control Board X-90',
			partNo: 'PT-90928-SMT',
			testType: 'Thermal Shock',
			category: 'Thermal Stress Testing',
			supplier: 'Infineon Semiconductors',
			quantity: 5,
			urgency: 'High',
			requiredDate: '2026-06-05',
			status: 'COMPLETED',
			createdDate: '2026-05-24',
			description: 'Perform cyclical thermal stress verification. -40°C to +150°C transition cycles, 200 repetitions. Stamped NABL report required for customer validation.',
			remarks: 'Completed. Telemetry verified, NABL stamped document uploaded successfully.',
			telemetry: [40, 22, -10, -40, -40, 20, 90, 150, 150, 80, 22]
		},
		{
			id: 'REQ-2026-002',
			productName: 'Core Power Converter V5',
			partNo: 'PT-11029-PWR',
			testType: 'Mechanical Vibration',
			category: 'Mechanical Fatigue Stress',
			supplier: 'Dixon In-House SMT',
			quantity: 3,
			urgency: 'Medium',
			requiredDate: '2026-06-12',
			status: 'UNDER_TEST',
			createdDate: '2026-05-25',
			description: 'Resonance search and sine sweep fatigue stress along X, Y, Z axes. Frequency sweep range 10Hz to 2000Hz.',
			remarks: 'Testing in progress on Vibration Shaker Table VS-02.',
			telemetry: [10, 50, 200, 500, 1000, 1500, 2000, 1200, 600, 100]
		},
		{
			id: 'REQ-2026-003',
			productName: 'IoT Wi-Fi Receiver Module',
			partNo: 'PT-88301-IOT',
			testType: 'Signal Calibration',
			category: 'Signal Calibration',
			supplier: 'Murata Electronics',
			quantity: 8,
			urgency: 'High',
			requiredDate: '2026-06-02',
			status: 'PENDING_APPROVAL',
			createdDate: '2026-05-25',
			description: 'Calibrate 4 GHz signal trace parameters. Check impedance match and trace losses across RF path channels.',
			remarks: 'Awaiting lab supervisor allocation.',
			telemetry: []
		},
		{
			id: 'REQ-2026-004',
			productName: 'LED Backlight Driver Unit',
			partNo: 'PT-45920-LED',
			testType: 'Humidity & Humidity Soak',
			category: 'Humidity & Environment',
			supplier: 'Nichicon Corp',
			quantity: 12,
			urgency: 'Low',
			requiredDate: '2026-06-20',
			status: 'COMPLETED',
			createdDate: '2026-05-20',
			description: 'Standard humidity soak testing at 95% RH relative humidity. Test structural delamination over 120 continuous hours.',
			remarks: 'Completed. Solder joints structurally sound, zero copper delamination observed.',
			telemetry: [20, 45, 60, 80, 95, 95, 95, 95, 95, 95, 95, 50]
		},
		{
			id: 'REQ-2026-005',
			productName: 'SMT Motherboard Shielding',
			partNo: '', // Optional/blank to show optional handling
			testType: 'Thermal Cycling',
			category: 'Thermal Stress Testing',
			supplier: 'TDK Electronics',
			quantity: 4,
			urgency: 'Medium',
			requiredDate: '2026-06-18',
			status: 'UNDER_TEST',
			createdDate: '2026-05-24',
			description: 'Verify solder joint durability under cyclical thermal expansion between -10°C and 85°C.',
			remarks: 'Active in S1 Station Unit.',
			telemetry: [22, 10, -5, -10, 0, 45, 85, 85, 22]
		}
	]);

	// 2. CAPA (Corrective and Preventive Action) Mock Database
	const [capas, setCapas] = useState([
		{
			id: 'CAPA-2026-001',
			relatedRequest: 'REQ-2026-001',
			productName: 'SMT Control Board X-90',
			nonConformity: 'Delamination and micro-voids observed on SMT solder pads during thermal shock cycles.',
			rootCause: 'Sub-optimal reflow soldering peak temperature caused micro-voids that cracked under rapid cycle transitions.',
			correctiveAction: 'Re-calibrate the SMT reflow oven temperature curve to 250°C and configure nitrogen purge on line 3.',
			preventiveAction: 'Enforce Automated Optical Inspection (AOI) with monthly thermal profiling of baseline mock boards.',
			targetedDate: '2026-06-15',
			status: 'COMPLETED',
			owner: 'SMT Engineering Dept',
			createdDate: '2026-05-25'
		},
		{
			id: 'CAPA-2026-002',
			relatedRequest: 'REQ-2026-004',
			productName: 'LED Backlight Driver Unit',
			nonConformity: 'Minor moisture ingress on high-voltage connectors during humidity soak chamber testing.',
			rootCause: 'Elastomer sealing ring gasket size was slightly out-of-tolerance, permitting capillary water absorption.',
			correctiveAction: 'Replace high-voltage elastomer rings with double-lipped silicone seals across batch lots.',
			preventiveAction: 'Introduce incoming quality inspection (IQC) dimension checks for elastomer components using laser gauges.',
			targetedDate: '2026-06-25',
			status: 'OPEN',
			owner: 'Component Engineering',
			createdDate: '2026-05-25'
		}
	]);

	// Selected Entities for Detail Views
	const [selectedRequest, setSelectedRequest] = useState<any>(requests[0]);
	const [selectedCapa, setSelectedCapa] = useState<any>(capas[0]);

	// 3. New Request Form Inputs State
	const [newRequestInput, setNewRequestInput] = useState({
		productName: '',
		partNo: '',
		testType: 'Thermal Shock',
		category: 'Thermal Stress Testing',
		supplier: '',
		quantity: '1',
		urgency: 'Medium',
		requiredDate: '',
		description: ''
	});

	// 4. New CAPA Form Inputs State
	const [newCapaInput, setNewCapaInput] = useState({
		relatedRequest: 'REQ-2026-001',
		productName: 'SMT Control Board X-90',
		nonConformity: '',
		rootCause: '',
		correctiveAction: '',
		preventiveAction: '',
		targetedDate: ''
	});

	// Form Submission Handlers
	const handleCreateRequest = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newRequestInput.productName || !newRequestInput.supplier || !newRequestInput.requiredDate || !newRequestInput.description) {
			triggerNotification('Please fill in all mandatory fields.', 'info');
			return;
		}

		const newReqId = `REQ-2026-00${requests.length + 1}`;
		const newRequestItem = {
			id: newReqId,
			productName: newRequestInput.productName,
			partNo: newRequestInput.partNo || 'N/A',
			testType: newRequestInput.testType,
			category: newRequestInput.category,
			supplier: newRequestInput.supplier,
			quantity: parseInt(newRequestInput.quantity) || 1,
			urgency: newRequestInput.urgency,
			requiredDate: newRequestInput.requiredDate,
			status: 'PENDING_APPROVAL',
			createdDate: new Date().toISOString().split('T')[0],
			description: newRequestInput.description,
			remarks: 'Awaiting lab supervisor allocation.',
			telemetry: []
		};

		setRequests([newRequestItem, ...requests]);
		setNewRequestInput({
			productName: '',
			partNo: '',
			testType: 'Thermal Shock',
			category: 'Thermal Stress Testing',
			supplier: '',
			quantity: '1',
			urgency: 'Medium',
			requiredDate: '',
			description: ''
		});

		triggerNotification(`Request ${newReqId} submitted successfully!`);
		setActiveTab('my-requests');
	};

	const handleCreateCapa = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newCapaInput.nonConformity || !newCapaInput.rootCause || !newCapaInput.correctiveAction || !newCapaInput.preventiveAction || !newCapaInput.targetedDate) {
			triggerNotification('Please complete all mandatory fields.', 'info');
			return;
		}

		const newCapaId = `CAPA-2026-00${capas.length + 1}`;
		const newCapaItem = {
			id: newCapaId,
			relatedRequest: newCapaInput.relatedRequest,
			productName: newCapaInput.productName,
			nonConformity: newCapaInput.nonConformity,
			rootCause: newCapaInput.rootCause,
			correctiveAction: newCapaInput.correctiveAction,
			preventiveAction: newCapaInput.preventiveAction,
			targetedDate: newCapaInput.targetedDate,
			status: 'OPEN',
			owner: 'SMT Engineering Dept',
			createdDate: new Date().toISOString().split('T')[0]
		};

		setCapas([newCapaItem, ...capas]);
		setNewCapaInput({
			relatedRequest: 'REQ-2026-001',
			productName: 'SMT Control Board X-90',
			nonConformity: '',
			rootCause: '',
			correctiveAction: '',
			preventiveAction: '',
			targetedDate: ''
		});

		triggerNotification(`CAPA Plan ${newCapaId} initiated successfully!`);
		setActiveTab('capa-management');
	};

	// Filters execution
	const filteredRequests = requests.filter(req => {
		const matchesSearch = req.productName.toLowerCase().includes(searchQuery.toLowerCase()) || 
							  req.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
							  req.supplier.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
		const matchesUrgency = urgencyFilter === 'ALL' || req.urgency === urgencyFilter;
		return matchesSearch && matchesStatus && matchesUrgency;
	});

	// Dynamic tab header texts
	const getTabHeaders = () => {
		switch (activeTab) {
			case 'dashboard':
				return { title: 'Lab Testing Request Center', desc: 'Draft product testing plans, submit active samples, and monitor real-time NABL progress.' };
			case 'my-requests':
				return { title: 'My Requests Register', desc: 'Track comprehensive testing schedules, supervisor approvals, and download stamped certificates.' };
			case 'new-request':
				return { title: 'Initiate Testing Plan', desc: 'Complete product metadata, attach hardware details, and define required calibration procedures.' };
			case 'view-request-details':
				return { title: 'Laboratory Request Review', desc: 'Analyze live telemetry feedback, testing phase progression, and laboratory engineer logs.' };
			case 'capa-management':
				return { title: 'CAPA Action Plans', desc: 'Manage Corrective and Preventive Actions (CAPAs) addressing testing discrepancies or non-conformity failures.' };
			case 'new-capa':
				return { title: 'Initiate CAPA Resolution', desc: 'Perform Root Cause Analysis (RCA) and document systematic preventive mechanisms.' };
			case 'view-capa-details':
				return { title: 'CAPA Corrective Review', desc: 'Verify corrective action tracking logs and NABL engineering approval stamps.' };
			default:
				return { title: 'Requester Portal', desc: 'Lab Request and CAPA Telemetry Command Center.' };
		}
	};

	const headers = getTabHeaders();

	const renderContent = () => {
		switch (activeTab) {
			case 'dashboard':
				return (
					<div className="space-y-6">
						{/* Overview Summary Badges */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">				
							<div className="bg-white border border-zinc-200/50 rounded-xl p-5 flex items-center justify-between shadow-sm">
								<div>
									<span className="text-zinc-400 text-[10px] font-extrabold uppercase tracking-widest">My Submissions</span>
									<h3 className="text-2xl font-bold text-zinc-950 mt-1">{requests.length} Requests</h3>
									<p className="text-zinc-500 text-xs mt-2 font-medium">
										{requests.filter(r => r.status === 'COMPLETED').length} completed, {requests.filter(r => r.status === 'UNDER_TEST').length} under test
									</p>
								</div>
								<div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100 shrink-0">
									<Send className="w-5 h-5" />
								</div>
							</div>
							<div className="bg-white border border-zinc-200/50 rounded-xl p-5 flex items-center justify-between shadow-sm">
								<div>
									<span className="text-zinc-400 text-[10px] font-extrabold uppercase tracking-widest">Certified Reports</span>
									<h3 className="text-2xl font-bold text-zinc-950 mt-1">
										{requests.filter(r => r.status === 'COMPLETED').length} Reports
									</h3>
									<p className="text-emerald-600 text-xs mt-2 font-bold flex items-center gap-1">
										<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
										NABL Stamped & Signed
									</p>
								</div>
								<div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100 shrink-0">
									<CheckCircle className="w-5 h-5" />
								</div>
							</div>
							<div className="bg-white border border-zinc-200/50 rounded-xl p-5 flex items-center justify-between shadow-sm sm:col-span-2 lg:col-span-1">
								<div>
									<span className="text-zinc-400 text-[10px] font-extrabold uppercase tracking-widest">CAPA Action Plans</span>
									<h3 className="text-2xl font-bold text-zinc-950 mt-1">{capas.length} Registered</h3>
									<p className="text-amber-600 text-xs mt-2 font-bold">
										{capas.filter(c => c.status === 'OPEN').length} active investigations
									</p>
								</div>
								<div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100 shrink-0">
									<Clipboard className="w-5 h-5" />
								</div>
							</div>
						</div>

						{/* Quick Access Actions */}
						<div className="bg-white border border-zinc-200/50 rounded-xl p-5 shadow-sm">
							<h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest mb-3.5">Quick Actions</h3>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<button 
									onClick={() => setActiveTab('new-request')}
									className="flex items-center justify-between p-4 bg-[#11236a] text-white rounded-xl hover:bg-[#0c1a52] transition-all cursor-pointer border-none outline-none group"
								>
									<div className="flex items-center gap-3">
										<Plus className="w-5 h-5 shrink-0" />
										<div className="text-left">
											<p className="text-xs font-bold leading-none">New Test Request</p>
											<span className="text-[10px] text-zinc-300 font-light mt-1 block">Register sample plans</span>
										</div>
									</div>
									<ArrowRight className="w-4 h-4 shrink-0 opacity-60 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
								</button>
								<button 
									onClick={() => setActiveTab('my-requests')}
									className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200 text-zinc-800 rounded-xl hover:bg-zinc-100 transition-all cursor-pointer outline-none group"
								>
									<div className="flex items-center gap-3">
										<FileText className="w-5 h-5 shrink-0 text-zinc-500" />
										<div className="text-left">
											<p className="text-xs font-bold leading-none text-zinc-950">My Submissions</p>
											<span className="text-[10px] text-zinc-400 font-medium mt-1 block">View test status logs</span>
										</div>
									</div>
									<ArrowRight className="w-4 h-4 shrink-0 opacity-60 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
								</button>
								<button 
									onClick={() => setActiveTab('new-capa')}
									className="flex items-center justify-between p-4 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all cursor-pointer border-none outline-none group"
								>
									<div className="flex items-center gap-3">
										<Clipboard className="w-5 h-5 shrink-0" />
										<div className="text-left">
											<p className="text-xs font-bold leading-none">Initiate CAPA Report</p>
											<span className="text-[10px] text-amber-100 font-light mt-1 block">Address product failures</span>
										</div>
									</div>
									<ArrowRight className="w-4 h-4 shrink-0 opacity-60 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
								</button>
							</div>
						</div>

						{/* Recent Submissions Feed */}
						<div className="bg-white border border-zinc-200/50 rounded-xl p-5 shadow-sm">
							<div className="flex items-center justify-between border-b border-zinc-100 pb-3.5 mb-4">
								<h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest">Recent Test Requests</h3>
								<button 
									onClick={() => setActiveTab('my-requests')}
									className="text-xs font-extrabold text-[#11236a] hover:underline cursor-pointer border-none bg-transparent"
								>
									View All Register
								</button>
							</div>
							<div className="overflow-x-auto">
								<table className="w-full text-left border-collapse min-w-[500px]">
									<thead>
										<tr className="border-b border-zinc-150">
											<th className="pb-3 text-[10px] font-bold text-zinc-400 uppercase">ID</th>
											<th className="pb-3 text-[10px] font-bold text-zinc-400 uppercase">Product Name</th>
											<th className="pb-3 text-[10px] font-bold text-zinc-400 uppercase">Test Category</th>
											<th className="pb-3 text-[10px] font-bold text-zinc-400 uppercase">Urgency</th>
											<th className="pb-3 text-[10px] font-bold text-zinc-400 uppercase">Status</th>
											<th className="pb-3 text-[10px] font-bold text-zinc-400 uppercase text-right">Action</th>
										</tr>
									</thead>
									<tbody>
										{requests.slice(0, 3).map((req) => (
											<tr key={req.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-all group last:border-b-0">
												<td className="py-3 text-xs font-mono font-bold text-zinc-800">{req.id}</td>
												<td className="py-3">
													<p className="text-xs font-bold text-zinc-950 leading-tight">{req.productName}</p>
													<span className="text-[9px] text-zinc-400 font-semibold uppercase">{req.supplier}</span>
												</td>
												<td className="py-3 text-xs text-zinc-500 font-medium">{req.category}</td>
												<td className="py-3">
													<span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
														req.urgency === 'High' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
														req.urgency === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
														'bg-zinc-100 text-zinc-650'
													}`}>{req.urgency}</span>
												</td>
												<td className="py-3">
													<span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2.5 py-0.5 rounded-full ${
														req.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
														req.status === 'UNDER_TEST' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
														'bg-amber-50 text-amber-600 border border-amber-100'
													}`}>
														{req.status === 'COMPLETED' && <CheckCircle className="w-2.5 h-2.5" />}
														{req.status === 'UNDER_TEST' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />}
														{req.status === 'PENDING_APPROVAL' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
														{req.status.replace('_', ' ')}
													</span>
												</td>
												<td className="py-3 text-right">
													<button 
														onClick={() => {
															setSelectedRequest(req);
															setActiveTab('view-request-details');
														}}
														className="text-xs font-extrabold text-[#11236a] hover:text-[#0c1a52] cursor-pointer group-hover:underline bg-transparent border-none outline-none"
													>
														Open Detail
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				);

			case 'my-requests':
				return (
					<div className="space-y-6">
						{/* Filters Dashboard Toolbar */}
						<div className="bg-white border border-zinc-200/50 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
							<div className="flex flex-col sm:flex-row gap-3 flex-1">
								<div className="relative flex-1">
									<Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
									<input 
										type="text" 
										placeholder="Search product, ID, or supplier..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-9 pr-4 py-2 text-xs font-medium focus:bg-white focus:ring-1 focus:ring-[#11236a] outline-none transition-all"
									/>
									{searchQuery && (
										<button 
											onClick={() => setSearchQuery('')}
											className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-700 bg-transparent border-none cursor-pointer"
										>
											<X className="w-4 h-4" />
										</button>
									)}
								</div>
								
								<select
									value={statusFilter}
									onChange={(e) => setStatusFilter(e.target.value)}
									className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-700 outline-none cursor-pointer"
								>
									<option value="ALL">All Statuses</option>
									<option value="PENDING_APPROVAL">Pending Approval</option>
									<option value="UNDER_TEST">Under Test</option>
									<option value="COMPLETED">Completed</option>
								</select>

								<select
									value={urgencyFilter}
									onChange={(e) => setUrgencyFilter(e.target.value)}
									className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-700 outline-none cursor-pointer"
								>
									<option value="ALL">All Urgencies</option>
									<option value="High">High Urgency</option>
									<option value="Medium">Medium Urgency</option>
									<option value="Low">Low Urgency</option>
								</select>
							</div>

							{(searchQuery || statusFilter !== 'ALL' || urgencyFilter !== 'ALL') && (
								<button 
									onClick={() => {
										setSearchQuery('');
										setStatusFilter('ALL');
										setUrgencyFilter('ALL');
									}}
									className="text-xs font-extrabold text-[#11236a] hover:underline bg-transparent border-none cursor-pointer text-left"
								>
									Clear Filters
								</button>
							)}

							<button 
								onClick={() => setActiveTab('new-request')}
								className="bg-[#11236a] text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 hover:bg-[#0c1a52] transition-all border-none outline-none cursor-pointer shrink-0"
							>
								<Plus className="w-4 h-4" /> New Test Request
							</button>
						</div>

						{/* Requests Registers Table */}
						<div className="bg-white border border-zinc-200/50 rounded-xl p-5 shadow-sm">
							{filteredRequests.length === 0 ? (
								<div className="text-center py-12">
									<AlertTriangle className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
									<h4 className="text-sm font-bold text-zinc-700">No testing requests found</h4>
									<p className="text-xs text-zinc-400 font-light mt-1">Refine your active filters or clear searches.</p>
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full text-left border-collapse min-w-[700px]">
										<thead>
											<tr className="border-b border-zinc-150">
												<th className="pb-3 text-[10px] font-bold text-zinc-400 uppercase">ID</th>
												<th className="pb-3 text-[10px] font-bold text-zinc-400 uppercase">Product Details</th>
												<th className="pb-3 text-[10px] font-bold text-zinc-400 uppercase">Supplier / Customer</th>
												<th className="pb-3 text-[10px] font-bold text-zinc-400 uppercase">Urgency</th>
												<th className="pb-3 text-[10px] font-bold text-zinc-400 uppercase">Status</th>
												<th className="pb-3 text-[10px] font-bold text-zinc-400 uppercase">Required Date</th>
												<th className="pb-3 text-[10px] font-bold text-zinc-400 uppercase text-right">Action</th>
											</tr>
										</thead>
										<tbody>
											{filteredRequests.map((req) => (
												<tr key={req.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-all group last:border-b-0">
													<td className="py-3.5 text-xs font-mono font-bold text-zinc-800">{req.id}</td>
													<td className="py-3.5">
														<p className="text-xs font-bold text-zinc-950 leading-tight">{req.productName}</p>
														<span className="text-[9px] text-zinc-400 font-medium">Part: {req.partNo || 'Optional / N/A'}</span>
													</td>
													<td className="py-3.5 text-xs text-zinc-650 font-medium">{req.supplier}</td>
													<td className="py-3.5">
														<span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
															req.urgency === 'High' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
															req.urgency === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
															'bg-zinc-100 text-zinc-650'
														}`}>{req.urgency}</span>
													</td>
													<td className="py-3.5">
														<span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2.5 py-0.5 rounded-full ${
															req.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
															req.status === 'UNDER_TEST' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
															'bg-amber-50 text-amber-600 border border-amber-100'
														}`}>
															{req.status === 'COMPLETED' && <CheckCircle className="w-2.5 h-2.5" />}
															{req.status === 'UNDER_TEST' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />}
															{req.status === 'PENDING_APPROVAL' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
															{req.status.replace('_', ' ')}
														</span>
													</td>
													<td className="py-3.5 text-xs text-zinc-500 font-mono">{req.requiredDate}</td>
													<td className="py-3.5 text-right">
														<button 
															onClick={() => {
																setSelectedRequest(req);
																setActiveTab('view-request-details');
															}}
															className="text-xs font-extrabold text-[#11236a] hover:text-[#0c1a52] cursor-pointer group-hover:underline bg-transparent border-none outline-none"
														>
															Open Details
														</button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>
					</div>
				);

			case 'new-request':
				return (
					<div className="space-y-6">
						{/* Back Button Panel */}
						<div className="flex items-center">
							<button 
								onClick={() => setActiveTab('my-requests')}
								className="text-xs font-bold text-zinc-500 hover:text-zinc-900 flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none"
							>
								<ChevronLeft className="w-4 h-4" /> Back to Submission List
							</button>
						</div>

						{/* Form Sheet Card */}
						<div className="bg-white border border-zinc-200/50 rounded-xl shadow-sm p-6 max-w-4xl mx-auto">
							<div className="border-b border-zinc-100 pb-4 mb-6">
								<h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wide">Register New Test Requirement</h3>
								<p className="text-[11px] text-zinc-400 font-light mt-0.5">Please specify precise telemetry calibrations. Red indicators (*) denote mandatory fields.</p>
							</div>

							<form onSubmit={handleCreateRequest} className="space-y-5">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
									{/* Product Name */}
									<div>
										<label className="block text-xs font-bold text-zinc-700 mb-1.5">
											Product Name <span className="text-rose-500">*</span>
										</label>
										<input 
											type="text" 
											required
											placeholder="e.g. SMT Power Grid Board"
											value={newRequestInput.productName}
											onChange={(e) => setNewRequestInput({...newRequestInput, productName: e.target.value})}
											className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:bg-white focus:ring-1 focus:ring-[#11236a] transition-all"
										/>
									</div>

									{/* Part No (Optional as per req #6!) */}
									<div>
										<label className="block text-xs font-bold text-zinc-700 mb-1.5">
											Part Number <span className="text-zinc-400 font-light">(Optional)</span>
										</label>
										<input 
											type="text" 
											placeholder="e.g. PT-99083-Dixon"
											value={newRequestInput.partNo}
											onChange={(e) => setNewRequestInput({...newRequestInput, partNo: e.target.value})}
											className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:bg-white focus:ring-1 focus:ring-[#11236a] transition-all"
										/>
									</div>

									{/* Test Type Select */}
									<div>
										<label className="block text-xs font-bold text-zinc-700 mb-1.5">
											Required Test Type <span className="text-rose-500">*</span>
										</label>
										<select 
											value={newRequestInput.testType}
											onChange={(e) => setNewRequestInput({...newRequestInput, testType: e.target.value})}
											className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:bg-white focus:ring-1 focus:ring-[#11236a] transition-all cursor-pointer"
										>
											<option value="Thermal Shock">Thermal Shock cycles</option>
											<option value="Mechanical Vibration">Mechanical Vibration Fatigue</option>
											<option value="Signal Calibration">RF Trace & Signal Calibration</option>
											<option value="Humidity & Humidity Soak">Humidity Chamber Soak</option>
											<option value="Thermal Cycling">Cyclical Thermal Expansion</option>
										</select>
									</div>

									{/* Category Select */}
									<div>
										<label className="block text-xs font-bold text-zinc-700 mb-1.5">
											Parent Test Category <span className="text-rose-500">*</span>
										</label>
										<select 
											value={newRequestInput.category}
											onChange={(e) => setNewRequestInput({...newRequestInput, category: e.target.value})}
											className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:bg-white focus:ring-1 focus:ring-[#11236a] transition-all cursor-pointer"
										>
											<option value="Thermal Stress Testing">Thermal Stress Testing</option>
											<option value="Mechanical Fatigue Stress">Mechanical Fatigue Stress</option>
											<option value="Signal Calibration">Signal Calibration Hub</option>
											<option value="Humidity & Environment">Humidity & Environment</option>
										</select>
									</div>

									{/* Supplier/Customer Standardized */}
									<div>
										<label className="block text-xs font-bold text-zinc-700 mb-1.5">
											Supplier / Customer <span className="text-rose-500">*</span>
										</label>
										<input 
											type="text" 
											required
											placeholder="Specify Supplier or Customer entity"
											value={newRequestInput.supplier}
											onChange={(e) => setNewRequestInput({...newRequestInput, supplier: e.target.value})}
											className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:bg-white focus:ring-1 focus:ring-[#11236a] transition-all"
										/>
									</div>

									{/* Sample Quantity */}
									<div>
										<label className="block text-xs font-bold text-zinc-700 mb-1.5">
											Sample Quantity <span className="text-rose-500">*</span>
										</label>
										<input 
											type="number" 
											required
											min="1"
											value={newRequestInput.quantity}
											onChange={(e) => setNewRequestInput({...newRequestInput, quantity: e.target.value})}
											className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:bg-white focus:ring-1 focus:ring-[#11236a] transition-all"
										/>
									</div>

									{/* Urgency select */}
									<div>
										<label className="block text-xs font-bold text-zinc-700 mb-1.5">
											Urgency Level <span className="text-rose-500">*</span>
										</label>
										<div className="grid grid-cols-3 gap-2">
											{['Low', 'Medium', 'High'].map((urg) => (
												<button
													key={urg}
													type="button"
													onClick={() => setNewRequestInput({...newRequestInput, urgency: urg})}
													className={`py-2 rounded-lg text-xs font-bold border outline-none cursor-pointer active:scale-95 transition-all ${
														newRequestInput.urgency === urg
															? 'bg-[#11236a] border-[#11236a] text-white'
															: 'bg-zinc-50 border-zinc-250 text-zinc-650 hover:bg-zinc-100'
													}`}
												>
													{urg}
												</button>
											))}
										</div>
									</div>

									{/* Required stamped date */}
									<div>
										<label className="block text-xs font-bold text-zinc-700 mb-1.5">
											Target Completion Date <span className="text-rose-500">*</span>
										</label>
										<div className="relative">
											<input 
												type="date" 
												required
												value={newRequestInput.requiredDate}
												onChange={(e) => setNewRequestInput({...newRequestInput, requiredDate: e.target.value})}
												className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:bg-white focus:ring-1 focus:ring-[#11236a] transition-all"
											/>
										</div>
									</div>
								</div>

								{/* Detailed description */}
								<div>
									<label className="block text-xs font-bold text-zinc-700 mb-1.5">
										Detailed Testing Protocol / Specifications <span className="text-rose-500">*</span>
									</label>
									<textarea 
										required
										rows={4}
										placeholder="Outline thermal ramp rates, sweep intervals, expected load curves, or testing standard (e.g. IEC-60068)..."
										value={newRequestInput.description}
										onChange={(e) => setNewRequestInput({...newRequestInput, description: e.target.value})}
										className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs font-medium outline-none focus:bg-white focus:ring-1 focus:ring-[#11236a] transition-all resize-none"
									/>
								</div>

								{/* Buttons */}
								<div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
									<button 
										type="button"
										onClick={() => setActiveTab('my-requests')}
										className="px-4 py-2 border border-zinc-250 text-zinc-700 rounded-lg text-xs font-bold bg-white hover:bg-zinc-50 cursor-pointer active:scale-95 outline-none"
									>
										Cancel
									</button>
									<button 
										type="submit"
										className="px-5 py-2 bg-[#11236a] text-white rounded-lg text-xs font-bold hover:bg-[#0c1a52] cursor-pointer active:scale-95 border-none outline-none flex items-center gap-1.5"
									>
										<Send className="w-3.5 h-3.5" /> Submit Request
									</button>
								</div>
							</form>
						</div>
					</div>
				);

			case 'view-request-details':
				if (!selectedRequest) return null;
				return (
					<div className="space-y-6">
						{/* Back bar */}
						<div className="flex items-center justify-between">
							<button 
								onClick={() => setActiveTab('my-requests')}
								className="text-xs font-bold text-zinc-500 hover:text-zinc-900 flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none"
							>
								<ChevronLeft className="w-4 h-4" /> Back to Submission Register
							</button>

							{selectedRequest.status === 'COMPLETED' && (
								<button 
									onClick={() => {
										setNewCapaInput({
											relatedRequest: selectedRequest.id,
											productName: selectedRequest.productName,
											nonConformity: `Test failure observed under ${selectedRequest.testType} testing cycles. Details: ${selectedRequest.description}`,
											rootCause: '',
											correctiveAction: '',
											preventiveAction: '',
											targetedDate: ''
										});
										setActiveTab('new-capa');
									}}
									className="bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 hover:bg-amber-600 transition-all border-none outline-none cursor-pointer"
								>
									<Clipboard className="w-4 h-4" /> Initiate CAPA Report
								</button>
							)}
						</div>

						{/* Two Column details panel */}
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
							{/* Left Column: Core Metadata */}
							<div className="lg:col-span-2 space-y-6">
								{/* Core Specs Card */}
								<div className="bg-white border border-zinc-200/50 rounded-xl p-5 shadow-sm space-y-4">
									<div className="flex items-center justify-between border-b border-zinc-100 pb-3">
										<div>
											<span className="text-[10px] font-extrabold text-zinc-400 font-mono tracking-wider">{selectedRequest.id}</span>
											<h3 className="text-base font-extrabold text-zinc-950 mt-0.5 leading-tight">{selectedRequest.productName}</h3>
										</div>
										<span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2.5 py-0.5 rounded-full ${
											selectedRequest.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
											selectedRequest.status === 'UNDER_TEST' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
											'bg-amber-50 text-amber-600 border border-amber-100'
										}`}>
											{selectedRequest.status === 'COMPLETED' && <CheckCircle className="w-2.5 h-2.5" />}
											{selectedRequest.status === 'UNDER_TEST' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />}
											{selectedRequest.status === 'PENDING_APPROVAL' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
											{selectedRequest.status.replace('_', ' ')}
										</span>
									</div>

									<div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
										<div>
											<p className="text-[10px] text-zinc-400 font-extrabold uppercase">Supplier / Customer</p>
											<p className="font-bold text-zinc-800 mt-0.5">{selectedRequest.supplier}</p>
										</div>
										<div>
											<p className="text-[10px] text-zinc-400 font-extrabold uppercase">Part Number</p>
											<p className="font-bold text-zinc-800 mt-0.5 font-mono">{selectedRequest.partNo || 'N/A'}</p>
										</div>
										<div>
											<p className="text-[10px] text-zinc-400 font-extrabold uppercase">Test Type</p>
											<p className="font-bold text-zinc-800 mt-0.5">{selectedRequest.testType}</p>
										</div>
										<div>
											<p className="text-[10px] text-zinc-400 font-extrabold uppercase">Quantity</p>
											<p className="font-bold text-zinc-800 mt-0.5">{selectedRequest.quantity} Samples</p>
										</div>
										<div>
											<p className="text-[10px] text-zinc-400 font-extrabold uppercase">Urgency Level</p>
											<p className="font-bold text-zinc-800 mt-0.5">{selectedRequest.urgency}</p>
										</div>
										<div>
											<p className="text-[10px] text-zinc-400 font-extrabold uppercase">Required Date</p>
											<p className="font-bold text-zinc-800 mt-0.5 font-mono">{selectedRequest.requiredDate}</p>
										</div>
									</div>

									<div className="border-t border-zinc-100 pt-3">
										<p className="text-[10px] text-zinc-400 font-extrabold uppercase mb-1">Testing Description / Specifications</p>
										<p className="text-xs text-zinc-650 font-medium leading-relaxed bg-zinc-50 rounded-xl p-3 border border-zinc-150">
											{selectedRequest.description}
										</p>
									</div>
								</div>

								{/* Lab Remark Log */}
								<div className="bg-white border border-zinc-200/50 rounded-xl p-5 shadow-sm space-y-3">
									<h4 className="text-xs font-bold text-zinc-900 uppercase tracking-widest flex items-center gap-1.5">
										<UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
										Laboratory Engineer Comments & Logs
									</h4>
									<div className="p-3 bg-zinc-50 rounded-xl border border-zinc-150">
										<p className="text-xs font-medium text-zinc-700 leading-relaxed">
											{selectedRequest.remarks}
										</p>
										<div className="flex justify-between items-center text-[9px] text-zinc-400 font-extrabold uppercase mt-2.5 pt-2.5 border-t border-dashed border-zinc-200">
											<span>Verifier: Lab Tech (NABL Certifier)</span>
											<span>Stamps: Verified & Stamped</span>
										</div>
									</div>
								</div>
							</div>

							{/* Right Column: Telemetry & Flow Charts */}
							<div className="space-y-6">
								{/* Testing Progression Status Timeline */}
								<div className="bg-white border border-zinc-200/50 rounded-xl p-5 shadow-sm space-y-4">
									<h4 className="text-xs font-bold text-zinc-900 uppercase tracking-widest">NABL Step Progression</h4>
									<div className="space-y-4 relative pl-5 border-l border-zinc-100 ml-2 pt-1">
										{[
											{ step: 'Testing Draft Submitted', date: selectedRequest.createdDate, completed: true },
											{ step: 'Sample Checked & Tagged', date: selectedRequest.createdDate, completed: true },
											{ step: 'Chamber Execution Calibration', date: 'Active Phase', completed: selectedRequest.status !== 'PENDING_APPROVAL' },
											{ step: 'Telemetry Certified Stamp', date: selectedRequest.status === 'COMPLETED' ? selectedRequest.requiredDate : 'Pending completion', completed: selectedRequest.status === 'COMPLETED' }
										].map((item, idx) => (
											<div key={idx} className="relative">
												<div className={`absolute -left-[25px] top-0.5 w-2.5 h-2.5 rounded-full border-2 ${
													item.completed 
														? 'bg-emerald-500 border-emerald-500' 
														: 'bg-white border-zinc-200'
												}`} />
												<p className={`text-xs font-bold leading-tight ${item.completed ? 'text-zinc-950' : 'text-zinc-400'}`}>
													{item.step}
												</p>
												<span className="text-[10px] text-zinc-400 font-medium block mt-0.5">{item.date}</span>
											</div>
										))}
									</div>
								</div>

								{/* Chamber SVG Telemetry Chart */}
								<div className="bg-white border border-zinc-200/50 rounded-xl p-5 shadow-sm space-y-3">
									<h4 className="text-xs font-bold text-zinc-900 uppercase tracking-widest flex items-center justify-between">
										<span>Active Telemetry Curve</span>
										{selectedRequest.status === 'UNDER_TEST' && <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full px-2 py-0.5 text-[9px] font-extrabold animate-pulse">Live</span>}
									</h4>
									
									{selectedRequest.telemetry.length === 0 ? (
										<div className="bg-zinc-50 border border-zinc-200 rounded-xl py-8 text-center">
											<TrendingUp className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
											<p className="text-[11px] text-zinc-400 font-medium">Awaiting calibration launch</p>
										</div>
									) : (
										<div>
											<div className="w-full h-32 bg-zinc-50 rounded-xl border border-zinc-150 p-2 flex items-center justify-center">
												<svg className="w-full h-full overflow-visible" viewBox="0 0 200 80" preserveAspectRatio="none">
													<path 
														d={`M ${selectedRequest.telemetry.map((val: number, i: number) => {
															const x = (i / (selectedRequest.telemetry.length - 1)) * 200;
															// map values from -40 to 150 to svg height 70 to 10
															const y = 70 - ((val + 40) / 190) * 60;
															return `${x},${y}`;
														}).join(' L ')}`}
														fill="none" 
														stroke={selectedRequest.status === 'COMPLETED' ? '#10b981' : '#4f46e5'} 
														strokeWidth="2" 
														strokeLinecap="round" 
													/>
												</svg>
											</div>
											<div className="flex justify-between text-[8px] text-zinc-400 font-extrabold uppercase mt-1 px-1">
												<span>Start Cycle</span>
												<span>Load Peaks</span>
												<span>Exit Cycle</span>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				);

			case 'capa-management':
				return (
					<div className="space-y-6">
						{/* Top toolbar */}
						<div className="bg-white border border-zinc-200/50 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest">CAPA Action Register</h3>
							<button 
								onClick={() => setActiveTab('new-capa')}
								className="bg-[#11236a] text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 hover:bg-[#0c1a52] transition-all border-none outline-none cursor-pointer self-start sm:self-auto"
							>
								<Plus className="w-4 h-4" /> Initiate CAPA Report
							</button>
						</div>

						{/* CAPA Table list */}
						<div className="bg-white border border-zinc-200/50 rounded-xl p-5 shadow-sm">
							<div className="overflow-x-auto">
								<table className="w-full text-left border-collapse min-w-[700px]">
									<thead>
										<tr className="border-b border-zinc-150">
											<th className="pb-3 text-[10px] font-bold text-zinc-400 uppercase">CAPA ID</th>
											<th className="pb-3 text-[10px] font-bold text-zinc-400 uppercase">Related Request</th>
											<th className="pb-3 text-[10px] font-bold text-zinc-400 uppercase">Product Affected</th>
											<th className="pb-3 text-[10px] font-bold text-zinc-400 uppercase">Non-Conformity Failure</th>
											<th className="pb-3 text-[10px] font-bold text-zinc-400 uppercase">Target Date</th>
											<th className="pb-3 text-[10px] font-bold text-zinc-400 uppercase">Status</th>
											<th className="pb-3 text-[10px] font-bold text-zinc-400 uppercase text-right">Action</th>
										</tr>
									</thead>
									<tbody>
										{capas.map((capa) => (
											<tr key={capa.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-all group last:border-b-0">
												<td className="py-3.5 text-xs font-mono font-bold text-zinc-800">{capa.id}</td>
												<td className="py-3.5 text-xs font-mono font-bold text-[#11236a]">{capa.relatedRequest}</td>
												<td className="py-3.5 text-xs font-bold text-zinc-950">{capa.productName}</td>
												<td className="py-3.5 text-xs text-zinc-500 font-light truncate max-w-xs">{capa.nonConformity}</td>
												<td className="py-3.5 text-xs text-zinc-550 font-mono">{capa.targetedDate}</td>
												<td className="py-3.5">
													<span className={`text-[9px] font-bold px-2 py-0.5 border rounded-full uppercase tracking-wider ${
														capa.status === 'COMPLETED' 
															? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
															: 'bg-rose-50 text-rose-600 border-rose-100'
													}`}>
														{capa.status}
													</span>
												</td>
												<td className="py-3.5 text-right">
													<button 
														onClick={() => {
															setSelectedCapa(capa);
															setActiveTab('view-capa-details');
														}}
														className="text-xs font-extrabold text-[#11236a] hover:text-[#0c1a52] cursor-pointer group-hover:underline bg-transparent border-none outline-none"
													>
														Open Plan
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				);

			case 'new-capa':
				return (
					<div className="space-y-6">
						{/* Back btn */}
						<div className="flex items-center">
							<button 
								onClick={() => setActiveTab('capa-management')}
								className="text-xs font-bold text-zinc-500 hover:text-zinc-900 flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none"
							>
								<ChevronLeft className="w-4 h-4" /> Back to CAPA Register
							</button>
						</div>

						{/* CAPA Form */}
						<div className="bg-white border border-zinc-200/50 rounded-xl shadow-sm p-6 max-w-3xl mx-auto">
							<div className="border-b border-zinc-100 pb-4 mb-6">
								<h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wide">Initiate CAPA Corrective Action Report</h3>
								<p className="text-[11px] text-zinc-400 font-light mt-0.5">Define systematic, physical engineering adjustments to eliminate recurrent testing failures.</p>
							</div>

							<form onSubmit={handleCreateCapa} className="space-y-5">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
									{/* Related requests */}
									<div>
										<label className="block text-xs font-bold text-zinc-700 mb-1.5">
											Related Request <span className="text-rose-500">*</span>
										</label>
										<select 
											value={newCapaInput.relatedRequest}
											onChange={(e) => {
												const matched = requests.find(r => r.id === e.target.value);
												setNewCapaInput({
													...newCapaInput,
													relatedRequest: e.target.value,
													productName: matched ? matched.productName : 'SMT Control Board X-90'
												});
											}}
											className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:bg-white focus:ring-1 focus:ring-[#11236a] transition-all cursor-pointer"
										>
											{requests.map(r => (
												<option key={r.id} value={r.id}>{r.id} ({r.productName})</option>
											))}
										</select>
									</div>

									{/* Product Affected */}
									<div>
										<label className="block text-xs font-bold text-zinc-700 mb-1.5">
											Product Affected
										</label>
										<input 
											type="text" 
											disabled
											value={newCapaInput.productName}
											className="w-full bg-zinc-100 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-medium text-zinc-500 cursor-not-allowed"
										/>
									</div>
								</div>

								{/* Non conformity */}
								<div>
									<label className="block text-xs font-bold text-zinc-700 mb-1.5">
										Non-Conformity Defect Description <span className="text-rose-500">*</span>
									</label>
									<textarea 
										required
										rows={3}
										placeholder="Describe the failure parameters, delamination indicators, crack occurrences, or out-of-spec telemetry observed during the test cycle."
										value={newCapaInput.nonConformity}
										onChange={(e) => setNewCapaInput({...newCapaInput, nonConformity: e.target.value})}
										className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs font-medium outline-none focus:bg-white focus:ring-1 focus:ring-[#11236a] transition-all resize-none"
									/>
								</div>

								{/* Root Cause Analysis (RCA) */}
								<div>
									<label className="block text-xs font-bold text-zinc-700 mb-1.5">
										Root Cause Analysis (RCA) <span className="text-rose-500">*</span>
									</label>
									<textarea 
										required
										rows={3}
										placeholder="Identify physical or procedural causes: e.g. reflow profile speed, solder alloy composition, material voids..."
										value={newCapaInput.rootCause}
										onChange={(e) => setNewCapaInput({...newCapaInput, rootCause: e.target.value})}
										className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs font-medium outline-none focus:bg-white focus:ring-1 focus:ring-[#11236a] transition-all resize-none"
									/>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
									{/* Corrective action */}
									<div>
										<label className="block text-xs font-bold text-zinc-700 mb-1.5">
											Immediate Corrective Action Plan <span className="text-rose-500">*</span>
										</label>
										<textarea 
											required
											rows={3}
											placeholder="What quick adjustments were made to secure immediate production validation?"
											value={newCapaInput.correctiveAction}
											onChange={(e) => setNewCapaInput({...newCapaInput, correctiveAction: e.target.value})}
											className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs font-medium outline-none focus:bg-white focus:ring-1 focus:ring-[#11236a] transition-all resize-none"
										/>
									</div>

									{/* Preventive action */}
									<div>
										<label className="block text-xs font-bold text-zinc-700 mb-1.5">
											Preventive Action Plan (Long Term) <span className="text-rose-500">*</span>
										</label>
										<textarea 
											required
											rows={3}
											placeholder="Specify automated safeguards or inspection cycles to prevent recurrence."
											value={newCapaInput.preventiveAction}
											onChange={(e) => setNewCapaInput({...newCapaInput, preventiveAction: e.target.value})}
											className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs font-medium outline-none focus:bg-white focus:ring-1 focus:ring-[#11236a] transition-all resize-none"
										/>
									</div>
								</div>

								{/* Targeted Completion date */}
								<div className="w-full sm:w-1/2">
									<label className="block text-xs font-bold text-zinc-700 mb-1.5">
										Target Resolution Date <span className="text-rose-500">*</span>
									</label>
									<input 
										type="date" 
										required
										value={newCapaInput.targetedDate}
										onChange={(e) => setNewCapaInput({...newCapaInput, targetedDate: e.target.value})}
										className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:bg-white focus:ring-1 focus:ring-[#11236a] transition-all"
									/>
								</div>

								{/* Buttons */}
								<div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
									<button 
										type="button"
										onClick={() => setActiveTab('capa-management')}
										className="px-4 py-2 border border-zinc-250 text-zinc-700 rounded-lg text-xs font-bold bg-white hover:bg-zinc-50 cursor-pointer active:scale-95 outline-none"
									>
										Cancel
									</button>
									<button 
										type="submit"
										className="px-5 py-2 bg-[#11236a] text-white rounded-lg text-xs font-bold hover:bg-[#0c1a52] cursor-pointer active:scale-95 border-none outline-none flex items-center gap-1.5"
									>
										<Send className="w-3.5 h-3.5" /> Submit CAPA Plan
									</button>
								</div>
							</form>
						</div>
					</div>
				);

			case 'view-capa-details':
				if (!selectedCapa) return null;
				return (
					<div className="space-y-6">
						{/* Back btn */}
						<div className="flex items-center">
							<button 
								onClick={() => setActiveTab('capa-management')}
								className="text-xs font-bold text-zinc-500 hover:text-zinc-900 flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none"
							>
								<ChevronLeft className="w-4 h-4" /> Back to CAPA Register
							</button>
						</div>

						{/* CAPA details layout sheet */}
						<div className="bg-white border border-zinc-200/50 rounded-xl p-6 shadow-sm max-w-4xl mx-auto space-y-6">
							{/* Upper Header Metadata */}
							<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-100 pb-4 gap-4">
								<div>
									<div className="flex items-center gap-2">
										<span className="text-[10px] font-extrabold text-zinc-400 font-mono tracking-wider">{selectedCapa.id}</span>
										<span className="text-zinc-300 text-xs">|</span>
										<span className="text-[10px] font-extrabold text-indigo-600 font-mono tracking-wider">REF: {selectedCapa.relatedRequest}</span>
									</div>
									<h3 className="text-base font-extrabold text-zinc-950 mt-0.5 leading-tight">{selectedCapa.productName}</h3>
								</div>
								<span className={`text-[10px] font-bold px-3 py-1 border rounded-full uppercase tracking-widest ${
									selectedCapa.status === 'COMPLETED' 
										? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
										: 'bg-rose-50 text-rose-600 border-rose-100'
								}`}>
									{selectedCapa.status}
								</span>
							</div>

							{/* Core Details Grid */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div className="md:col-span-2 space-y-5">
									{/* Non conformity defect */}
									<div className="bg-zinc-50 border border-zinc-150 p-4 rounded-xl">
										<h4 className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
											<AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
											Non-Conformity Failure Defect
										</h4>
										<p className="text-xs font-medium text-zinc-800 leading-relaxed">
											{selectedCapa.nonConformity}
										</p>
									</div>

									{/* RCA block */}
									<div className="bg-amber-500/5 border border-amber-100 p-4 rounded-xl">
										<h4 className="text-[10px] text-amber-600 font-extrabold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
											<HelpCircle className="w-4 h-4 shrink-0" />
											Root Cause Analysis (RCA)
										</h4>
										<p className="text-xs font-medium text-zinc-800 leading-relaxed">
											{selectedCapa.rootCause}
										</p>
									</div>

									{/* Dual plans split */}
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div className="bg-emerald-50/20 border border-emerald-100 p-4 rounded-xl">
											<h5 className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-widest mb-1">Corrective Action (Immediate)</h5>
											<p className="text-xs text-zinc-650 font-medium leading-relaxed">{selectedCapa.correctiveAction}</p>
										</div>
										<div className="bg-indigo-50/20 border border-indigo-100 p-4 rounded-xl">
											<h5 className="text-[10px] text-indigo-700 font-extrabold uppercase tracking-widest mb-1">Preventive Action (Long Term)</h5>
											<p className="text-xs text-zinc-650 font-medium leading-relaxed">{selectedCapa.preventiveAction}</p>
										</div>
									</div>
								</div>

								{/* Side Info Panel */}
								<div className="space-y-4">
									<div className="bg-zinc-50/50 border border-zinc-150 p-4 rounded-xl space-y-3.5">
										<h4 className="text-xs font-bold text-zinc-950 uppercase tracking-widest">Ownership & Schedule</h4>
										<div className="space-y-3 text-xs">
											<div>
												<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Department Owner</p>
												<p className="font-bold text-zinc-800 mt-0.5">{selectedCapa.owner}</p>
											</div>
											<div>
												<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Initiation Date</p>
												<p className="font-bold text-zinc-800 mt-0.5 font-mono">{selectedCapa.createdDate}</p>
											</div>
											<div>
												<p className="text-[9px] text-zinc-400 font-extrabold uppercase">Target Target Date</p>
												<p className="font-bold text-zinc-800 mt-0.5 font-mono">{selectedCapa.targetedDate}</p>
											</div>
										</div>
									</div>

									{/* Approval Stamp signature */}
									<div className="border border-zinc-200 bg-white rounded-xl p-4 text-center space-y-3 shadow-inner">
										<p className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider">Quality Manager Verification</p>
										<div className="w-20 h-20 border border-dashed border-zinc-300 rounded-full mx-auto flex items-center justify-center text-zinc-300 bg-zinc-50 relative">
											<span className="text-[9px] font-extrabold text-[#11236a] opacity-80 select-none transform -rotate-12 border-2 border-solid border-[#11236a] px-1 py-0.5 uppercase tracking-wide">
												NABL STAMPED
											</span>
										</div>
										<p className="text-[10px] text-zinc-500 font-bold">Approved & Signed off</p>
									</div>
								</div>
							</div>
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
			{/* Notifications Popups */}
			{notification && (
				<div className={`fixed top-4 right-4 z-50 rounded-xl px-4 py-3 shadow-md flex items-center gap-2 text-xs font-bold transition-all border animate-bounce ${
					notification.type === 'success' 
						? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
						: 'bg-indigo-50 text-indigo-800 border-indigo-100'
				}`}>
					<CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
					<span>{notification.message}</span>
				</div>
			)}

			{renderContent()}
		</DashboardLayout>
	);
}