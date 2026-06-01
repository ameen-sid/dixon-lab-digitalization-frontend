import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { RotateCw, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

// Import sub-pages
import ManagerDashboardOverview from './ManagerDashboardOverview';
import ApprovedRequests from './ApprovedRequests';
import ApprovedRequestDetails from './ApprovedRequestDetails';
import AssignedSamples from './AssignedSamples';
import ManagerCapaManagement from './ManagerCapaManagement';

// Import backend API services
import { getTestRequests, getTestRequestDetails, updateTestRequestStatus } from '../../services/operations/testRequestService';
import { getUsers } from '../../services/operations/userService';

// Interface definitions
interface ApprovedRequest {
	id: string;
	requestId: string;
	customerNameAddress: string;
	sampleDescription: string;
	modelNo: string;
	brandName: string;
	sampleQty: number;
	testMethodRef: string;
	requesterName: string;
	status: string;
	approvedDate: string;
	engineerId?: string;
	engineerName?: string;
	inspectionResult?: string;
	inspectionRemarks?: string;
	inspectionDate?: string;
	customerContactDetails?: string;
	manufacturerNameAddress?: string;
}

interface InspectionTask {
	id: string;
	requestId: string;
	brandName: string;
	modelNo: string;
	testMethodRef: string;
	sampleDescription: string;
	sampleQty: number;
	status: string; // 'PENDING' | 'PASSED' | 'FAILED' | 'COMPLETED'
	assignedDate: string;
	completedDate?: string;
	remarks?: string;
	engineerId?: string;
	engineerName?: string;
}

interface CapaRecord {
	id: string;
	relatedRequest: string;
	productName: string;
	nonConformity: string;
	rootCause: string;
	correctiveAction: string;
	preventiveAction: string;
	targetedDate: string;
	status: string;
	owner: string;
	createdDate: string;
}

export default function ManagerDashboard() {
	const navigate = useNavigate();
	const location = useLocation();
	const { id } = useParams<{ id: string }>();

	// Validate Authentication and Role
	const token = localStorage.getItem('token');
	const userStr = localStorage.getItem('user');

	useEffect(() => {
		if (!token || !userStr) {
			localStorage.clear();
			navigate('/');
			return;
		}
		const user = JSON.parse(userStr);
		const role = user.role ? user.role.toLowerCase() : 'requester';
		if (role !== 'lab manager') {
			navigate('/dashboard', { replace: true });
		}
	}, [token, userStr, navigate]);

	// ==========================================
	// LIVE BACKEND DATA STATES & EFFECT HOOKS
	// ==========================================
	const [approvedRequests, setApprovedRequests] = useState<ApprovedRequest[]>([]);
	const [loadingRequests, setLoadingRequests] = useState(false);
	const [engineers, setEngineers] = useState<{ id: string; name: string; role: string }[]>([]);
	
	// Dynamic request details loading state
	const [activeRequestDetails, setActiveRequestDetails] = useState<ApprovedRequest | null>(null);
	const [loadingDetails, setLoadingDetails] = useState(false);

	// Load Approved Requests from database
	const loadApprovedRequests = async () => {
		setLoadingRequests(true);
		try {
			const fetchOp = getTestRequests();
			const data = await fetchOp();
			
			// Map the database format to the component expectations
			const mapped = data.map((req: any) => ({
				id: String(req.id),
				requestId: req.requestId,
				customerNameAddress: req.customerNameAddress,
				sampleDescription: req.sampleDescription,
				modelNo: req.modelNo,
				brandName: req.brandName,
				sampleQty: req.sampleQty,
				testMethodRef: req.testMethodRef,
				requesterName: req.requester?.name || 'System User',
				status: req.status,
				approvedDate: req.updatedAt ? req.updatedAt.split('T')[0] : req.createdAt.split('T')[0],
				engineerId: req.assignedTo ? String(req.assignedTo.id) : undefined,
				engineerName: req.assignedTo ? req.assignedTo.name : undefined,
				inspectionResult: req.status === 'COMPLETED' ? 'PASSED' : undefined,
				inspectionRemarks: req.remarks
			}));

			// Approved requests are those which have been signed off by the Lab Head 
			// (Status is NOT PENDING_APPROVAL and NOT REJECTED)
			const filtered = mapped.filter((r: any) => r.status !== 'PENDING_APPROVAL' && r.status !== 'REJECTED');
			setApprovedRequests(filtered);
		} catch (error) {
			console.error('Failed to load approved requests from database:', error);
		} finally {
			setLoadingRequests(false);
		}
	};

	// Load Users to display as Engineers
	const loadEngineers = async () => {
		try {
			const fetchUsersOp = getUsers();
			const users = await fetchUsersOp();
			// Capture ONLY registered staff whose role is strictly 'Engineer' case-insensitively
			const staff = users
				.filter((u: any) => {
					const r = (u.role || '').toLowerCase();
					return r === 'engineer';
				})
				.map((u: any) => ({
					id: String(u.id),
					name: u.name,
					role: u.role
				}));
			setEngineers(staff);
		} catch (error) {
			console.error('Failed to load engineers from database:', error);
		}
	};

	// Boot load live data
	useEffect(() => {
		if (token && userStr) {
			loadApprovedRequests();
			loadEngineers();
		}
	}, [token, userStr]);

	// Fetch dynamic single request details fresh from database when URL parameters change
	useEffect(() => {
		const loadDetails = async () => {
			if (!id) {
				setActiveRequestDetails(null);
				return;
			}
			setLoadingDetails(true);
			try {
				const fetchOp = getTestRequestDetails(id);
				const req = await fetchOp();
				
				const mapped = {
					id: String(req.id),
					requestId: req.requestId,
					customerNameAddress: req.customerNameAddress,
					sampleDescription: req.sampleDescription,
					modelNo: req.modelNo,
					brandName: req.brandName,
					sampleQty: req.sampleQty,
					testMethodRef: req.testMethodRef,
					requesterName: req.requester?.name || 'System User',
					status: req.status,
					approvedDate: req.updatedAt ? req.updatedAt.split('T')[0] : req.createdAt.split('T')[0],
					engineerId: req.assignedTo ? String(req.assignedTo.id) : undefined,
					engineerName: req.assignedTo ? req.assignedTo.name : undefined,
					inspectionResult: req.status === 'COMPLETED' ? 'PASSED' : undefined,
					inspectionRemarks: req.remarks,
					customerContactDetails: req.customerContactDetails,
					manufacturerNameAddress: req.manufacturerNameAddress
				};
				setActiveRequestDetails(mapped);
				
				// Instantly reload available engineers list to stay synchronized
				await loadEngineers();
			} catch (error) {
				console.error('Failed to load request details from database:', error);
			} finally {
				setLoadingDetails(false);
			}
		};
		loadDetails();
	}, [id]);

	// ==========================================
	// MOCK DATABASE STATES FOR OFFLINE MODULES
	// ==========================================

	// 3. CAPA Records State
	const [capas, setCapas] = useState<CapaRecord[]>([
		{
			id: 'CAPA-2026-001',
			relatedRequest: 'REQ-2026-001',
			productName: 'Dixon SMT SMT-X90',
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
			relatedRequest: 'REQ-2026-002',
			productName: 'Dixon LED LED-DRV-45',
			nonConformity: 'Minor moisture ingress on high-voltage connectors during humidity soak chamber testing.',
			rootCause: 'Elastomer sealing ring gasket size was slightly out-of-tolerance, permitting capillary water absorption.',
			correctiveAction: 'Replace high-voltage elastomer rings with double-lipped silicone seals across batch lots.',
			preventiveAction: 'Introduce incoming quality inspection (IQC) dimension checks for elastomer components using laser gauges.',
			targetedDate: '2026-06-25',
			status: 'OPEN',
			owner: 'Component Engineering',
			createdDate: '2026-05-28'
		}
	]);

	// Derive current URL properties
	const pathSegment = location.pathname.replace('/manager/', '') || 'dashboard';

	let activeTab = 'dashboard';
	if (pathSegment === 'platform-tracking') activeTab = 'platform-tracking';
	else if (pathSegment === 'equipment-tracking') activeTab = 'equipment-tracking';
	else if (pathSegment === 'approved-requests') activeTab = 'approved-requests';
	else if (pathSegment.startsWith('approved-requests/')) activeTab = 'approved-request-details';
	else if (pathSegment === 'assigned-samples' || pathSegment.startsWith('assigned-samples/')) activeTab = 'assigned-samples';
	else if (pathSegment === 'capa-management') activeTab = 'capa-management';

	// ==========================================
	// PLATFORM TRACKING SYSTEM STATE (SHARED FROM ADMIN)
	// ==========================================
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
		toast.success(`Platform ${p} Slot ${s} status updated successfully.`);
	};

	const resetSlots = () => {
		const initial: { [key: string]: boolean } = {};
		for (let p = 1; p <= 14; p++) {
			for (let s = 1; s <= 10; s++) {
				initial[`${p}-${s}`] = p !== 5;
			}
		}
		setPlatformSlots(initial);
		toast.success('Platform live tracking grid re-initialized.');
	};

	const availableCount = Object.values(platformSlots).filter(v => v === true).length;
	const occupiedCount = Object.values(platformSlots).filter(v => v === false).length;

	// ==========================================
	// EQUIPMENT TRACKING SYSTEM STATE (SHARED FROM ADMIN)
	// ==========================================
	const [equipmentTelemetry, setEquipmentTelemetry] = useState([
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
			slots: [false, false, false, false, false, true, true, true]
		}
	]);

	const toggleEquipmentSlot = (eqIndex: number, slotIndex: number) => {
		setEquipmentTelemetry(prev => {
			const updated = [...prev].map(item => ({...item, slots: [...item.slots]}));
			const slots = updated[eqIndex].slots;
			slots[slotIndex] = !slots[slotIndex];
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
		toast.success('Equipment telemetry channel updated.');
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
		toast.success(`Chamber ${equipmentTelemetry[eqIndex].id} status set to ${newStatus}`);
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
				slots: [false, false, false, false, false, true, true, true]
			}
		]);
		toast.success('Chamber calibrations re-synced.');
	};

	const availableEq = equipmentTelemetry.filter(e => e.status === 'AVAILABLE').length;
	const underTestEq = equipmentTelemetry.filter(e => e.status === 'UNDER_TEST').length;
	const maintenanceEq = equipmentTelemetry.filter(e => e.status === 'MAINTENANCE').length;

	// ==========================================
	// INTEGRATED OPERATIONS WORKFLOW LOGIC
	// ==========================================

	// 1. Assign Engineer to Request (Live Backend Integration)
	const handleAssignEngineer = async (requestId: string, engineerId: string, engineerName: string) => {
		try {
			const numericRequestId = Number(requestId);
			const numericEngineerId = Number(engineerId);

			// Call backend update API to transition status to UNDER_TEST & assign scientist
			const updateOp = updateTestRequestStatus(
				numericRequestId, 
				'UNDER_INSPECTION', 
				`Assigned testing plan to specialized engineer: ${engineerName}`, 
				numericEngineerId
			);
			await updateOp();

			// Refresh listing data
			await loadApprovedRequests();

			// Sync details page dynamically
			if (id && id === requestId) {
				const fetchOp = getTestRequestDetails(id);
				const req = await fetchOp();
				const mapped = {
					id: String(req.id),
					requestId: req.requestId,
					customerNameAddress: req.customerNameAddress,
					sampleDescription: req.sampleDescription,
					modelNo: req.modelNo,
					brandName: req.brandName,
					sampleQty: req.sampleQty,
					testMethodRef: req.testMethodRef,
					requesterName: req.requester?.name || 'System User',
					status: req.status,
					approvedDate: req.updatedAt ? req.updatedAt.split('T')[0] : req.createdAt.split('T')[0],
					engineerId: req.assignedTo ? String(req.assignedTo.id) : undefined,
					engineerName: req.assignedTo ? req.assignedTo.name : undefined,
					inspectionResult: req.status === 'COMPLETED' ? 'PASSED' : undefined,
					inspectionRemarks: req.remarks,
					customerContactDetails: req.customerContactDetails,
					manufacturerNameAddress: req.manufacturerNameAddress
				};
				setActiveRequestDetails(mapped);
			}
		} catch (error) {
			console.error('Failed to allocate testing plan on backend:', error);
		}
	};

	// 2. Simulate Inspection Completion (Live Backend Integration)
	const handleSimulateInspectionCompletion = async (requestId: string, result: 'PASSED' | 'FAILED', remarks: string) => {
		try {
			const numericRequestId = Number(requestId);
			const statusTransition = result === 'PASSED' ? 'UNDER_TEST' : 'UNDER_INSPECTION';

			const updateOp = updateTestRequestStatus(
				numericRequestId,
				statusTransition,
				remarks
			);
			await updateOp();

			// Refresh listing data
			await loadApprovedRequests();

			// Sync details page dynamically
			if (id && id === requestId) {
				const fetchOp = getTestRequestDetails(id);
				const req = await fetchOp();
				const mapped = {
					id: String(req.id),
					requestId: req.requestId,
					customerNameAddress: req.customerNameAddress,
					sampleDescription: req.sampleDescription,
					modelNo: req.modelNo,
					brandName: req.brandName,
					sampleQty: req.sampleQty,
					testMethodRef: req.testMethodRef,
					requesterName: req.requester?.name || 'System User',
					status: req.status,
					approvedDate: req.updatedAt ? req.updatedAt.split('T')[0] : req.createdAt.split('T')[0],
					engineerId: req.assignedTo ? String(req.assignedTo.id) : undefined,
					engineerName: req.assignedTo ? req.assignedTo.name : undefined,
					inspectionResult: req.status === 'COMPLETED' ? 'PASSED' : undefined,
					inspectionRemarks: req.remarks,
					customerContactDetails: req.customerContactDetails,
					manufacturerNameAddress: req.manufacturerNameAddress
				};
				setActiveRequestDetails(mapped);
			}
		} catch (error) {
			console.error('Failed to log inspection results on backend:', error);
		}
	};

	// 3. Form inspection completion (from Manager's Assigned task screen checklist)
	const handleCompleteInspectionForm = async (taskId: string, result: 'PASSED' | 'FAILED', remarks: string, _checks: any) => {
		try {
			const numericTaskId = Number(taskId);
			const statusTransition = result === 'PASSED' ? 'UNDER_TEST' : 'UNDER_INSPECTION';

			const updateOp = updateTestRequestStatus(
				numericTaskId,
				statusTransition,
				remarks
			);
			await updateOp();

			// Refresh list
			await loadApprovedRequests();

		} catch (error) {
			console.error('Failed to log checklist form on backend:', error);
		}
	};

	// 4. Initiate CAPA Report Submission
	const handleAddCapa = (newCapa: any) => {
		const newId = `CAPA-2026-00${capas.length + 1}`;
		const capaRecord: CapaRecord = {
			id: newId,
			relatedRequest: newCapa.relatedRequest,
			productName: newCapa.productName,
			nonConformity: newCapa.nonConformity,
			rootCause: newCapa.rootCause,
			correctiveAction: newCapa.correctiveAction,
			preventiveAction: newCapa.preventiveAction,
			targetedDate: newCapa.targetedDate,
			status: 'OPEN',
			owner: 'Lab Operations Manager',
			createdDate: new Date().toISOString().split('T')[0]
		};

		setCapas(prev => [capaRecord, ...prev]);
		toast.success(`CAPA plan ${newId} initialized and queued.`);
	};

	// ==========================================
	// UI NAVIGATION AND TITLE HEADERS
	// ==========================================
	const getTabHeaders = () => {
		switch (activeTab) {
			case 'dashboard':
				return { title: 'Laboratory Manager Control Hub', desc: 'Coordinate testing workloads, assign equipment, manage calibrations, and supervise engineers.' };
			case 'platform-tracking':
				return { title: 'Platform Live Tracking', desc: 'Real-time service uptime, backend node states, and DB latencies.' };
			case 'equipment-tracking':
				return { title: 'Equipment Availability Telemetry', desc: 'Active NABL stress chamber occupancy and high-frequency calibration loads.' };
			case 'approved-requests':
				return { title: 'Approved Requests Registry', desc: 'Approved testing plans from the Laboratory Head awaiting specialized engineer allocations.' };
			case 'approved-request-details':
				return { title: 'Approved Plan Specifications', desc: 'Configure duty staff scheduling parameters and review certification results.' };
			case 'assigned-samples':
				return { title: 'Self-Assigned Inspections', desc: 'Verify calibration parameters and execute physical checklists assigned directly to you.' };
			case 'capa-management':
				return { title: 'CAPA Action Plans', desc: 'Track Corrective and Preventive Action plans addressing testing failures or quality exceptions.' };
			default:
				return { title: 'Lab Operations Console', desc: 'NABL calibration and structural stress testing hub.' };
		}
	};

	const headers = getTabHeaders();

	// Render current sub-page
	const renderContent = () => {
		switch (activeTab) {
			case 'dashboard':
				return (
					<ManagerDashboardOverview 
						navigate={navigate}
						stats={{
							approvedCount: approvedRequests.filter(r => !r.engineerId).length,
							assignedCount: approvedRequests.filter(r => !!r.engineerId && (r.status === 'UNDER_TEST' || r.status === 'UNDER_INSPECTION')).length,
							completedCount: approvedRequests.filter(r => !!r.inspectionResult).length,
							capaCount: capas.filter(c => c.status === 'OPEN').length
						}}
					/>
				);

			case 'platform-tracking':
				return (
					<div className="space-y-6">
						<div className="bg-white border border-zinc-200/50 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
							<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
								<h2 className="text-base font-extrabold text-zinc-900 tracking-tight" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
									Platform Channel Monitors
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
								title="Reset telemetry grid"
								className="w-10 h-10 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-center text-zinc-555 hover:text-[#11236a] transition-all hover:bg-zinc-100 cursor-pointer outline-none border-none shrink-0"
							>
								<RotateCw className="w-4 h-4" />
							</button>
						</div>

						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
							{Array.from({ length: 14 }, (_, i) => {
								const pNum = i + 1;
								return (
									<div key={pNum} className="bg-white border border-zinc-200/60 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
										<div className="bg-[#11236a] flex items-center justify-between px-3 py-2 shrink-0">
											<span className="text-white text-xs font-extrabold tracking-wide">S{pNum}</span>
											<span className="text-zinc-500 text-[8px] font-bold tracking-wider uppercase">UNIT</span>
										</div>
										<div className="grid grid-cols-2 gap-2 p-3 flex-grow bg-[#f8fafc]/30">
											{Array.from({ length: 10 }, (_, j) => {
												const sNum = j + 1;
												const isAvailable = platformSlots[`${pNum}-${sNum}`];
												return (
													<button
														key={sNum}
														onClick={() => toggleSlot(pNum, sNum)}
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

			case 'equipment-tracking':
				return (
					<div className="space-y-6">
						<div className="bg-white border border-zinc-200/50 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
							<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
								<h2 className="text-base font-extrabold text-zinc-900 tracking-tight" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
									Active Chamber Availability Telemetry
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
								className="w-10 h-10 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-center text-zinc-555 hover:text-zinc-800 transition-all hover:bg-zinc-100 cursor-pointer outline-none border-none shrink-0"
							>
								<RotateCw className="w-4 h-4" />
							</button>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
							{equipmentTelemetry.map((eq, eqIdx) => (
								<div key={eq.id} className="bg-white border border-zinc-200/60 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
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
											<option value="MAINTENANCE" className="text-zinc-855 font-medium">Maintenance</option>
										</select>
									</div>

									<div className="p-4 flex-grow flex flex-col justify-between bg-[#f8fafc]/30">
										<div>
											<h4 className="text-xs font-bold text-zinc-955 truncate leading-tight">{eq.name}</h4>
											<p className="text-[10px] text-zinc-555 font-medium mt-0.5">{eq.class}</p>

											<div className="border border-zinc-150 bg-zinc-50/50 rounded-xl p-3 my-3.5 flex flex-col gap-2">
												<div className="flex items-center justify-between text-[10px] text-zinc-555 font-bold uppercase tracking-wider">
													<span>Telemetry Metric</span>
													<span className="text-zinc-700 font-extrabold">{eq.metric}</span>
												</div>
												<div className="space-y-1">
													<div className="flex justify-between text-[10px] text-zinc-555 font-bold uppercase">
														<span>Chamber Load</span>
														<span className={eq.status === 'MAINTENANCE' ? 'text-rose-650 font-extrabold' : 'text-zinc-800 font-extrabold'}>
															{eq.status === 'MAINTENANCE' ? 'OFFLINE' : `${eq.capacity}%`}
														</span>
													</div>
													<div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
														<div 
															className={`h-full transition-all duration-500 rounded-full ${
																eq.status === 'MAINTENANCE' 
																	? 'bg-rose-505' 
																	: eq.status === 'AVAILABLE' 
																		? 'bg-emerald-500' 
																		: 'bg-indigo-650'
															}`}
															style={{ width: `${eq.status === 'MAINTENANCE' ? 100 : eq.capacity}%` }}
														/>
													</div>
												</div>
											</div>
										</div>

										<div>
											<p className="text-[9px] text-zinc-555 font-bold uppercase tracking-widest mb-1.5">Telemetry Slots</p>
											<div className="grid grid-cols-4 gap-1.5">
												{eq.slots.map((isSlotAvailable, slotIdx) => (
													<button
														key={slotIdx}
														onClick={() => toggleEquipmentSlot(eqIdx, slotIdx)}
														disabled={eq.status === 'MAINTENANCE'}
														className={`group p-1.5 rounded-lg border outline-none text-center flex flex-col items-center justify-center transition-all border-none ${
															eq.status === 'MAINTENANCE'
																? 'bg-zinc-100 border-zinc-200 text-zinc-555 cursor-not-allowed'
																: isSlotAvailable
																	? 'bg-emerald-50/50 hover:bg-emerald-100/50 border-emerald-100 hover:border-emerald-255 text-emerald-700 cursor-pointer active:scale-95'
																	: 'bg-indigo-50/50 hover:bg-indigo-100/50 border-indigo-100 hover:border-indigo-255 text-indigo-700 cursor-pointer active:scale-95'
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
												))}
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				);

			case 'approved-requests':
				if (loadingRequests && approvedRequests.length === 0) {
					return (
						<div className="flex flex-col items-center justify-center py-20 gap-3">
							<div className="w-8 h-8 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin" />
							<p className="text-xs text-zinc-555 font-bold">Synchronizing approved requests from database...</p>
						</div>
					);
				}
				return (
					<ApprovedRequests 
						requests={approvedRequests}
					/>
				);

			case 'approved-request-details':
				if (loadingDetails && !activeRequestDetails) {
					return (
						<div className="flex flex-col items-center justify-center py-20 gap-3">
							<div className="w-8 h-8 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin" />
							<p className="text-xs text-zinc-555 font-bold">Loading testing plan specifications...</p>
						</div>
					);
				}
				return (
					<ApprovedRequestDetails 
						request={activeRequestDetails}
						engineers={engineers}
						onAssignEngineer={handleAssignEngineer}
						onSimulateInspectionCompletion={handleSimulateInspectionCompletion}
					/>
				);

			case 'assigned-samples':
				const currentUser = userStr ? JSON.parse(userStr) : null;
				const currentManagerId = currentUser ? String(currentUser.id) : '';
				const dynamicTasks: InspectionTask[] = approvedRequests
					// Only requests where the engineer assigned IS the manager themselves
					.filter(r => !!r.engineerId && r.engineerId === currentManagerId)
					.map(r => ({
						id: String(r.id),
						requestId: r.requestId || `REQ-${r.id}`,
						brandName: r.brandName,
						modelNo: r.modelNo,
						testMethodRef: r.testMethodRef,
						sampleDescription: r.sampleDescription,
						sampleQty: r.sampleQty || 1,
						status: r.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
						assignedDate: r.approvedDate,
						engineerId: r.engineerId,
						engineerName: r.engineerName
					}));
				return (
					<AssignedSamples 
						tasks={dynamicTasks}
						onCompleteInspection={handleCompleteInspectionForm}
					/>
				);

			case 'capa-management':
				return (
					<ManagerCapaManagement 
						capas={capas}
						onAddCapa={handleAddCapa}
						requests={approvedRequests}
					/>
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
		>
			{renderContent()}
		</DashboardLayout>
	);
}
