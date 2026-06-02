import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import toast from 'react-hot-toast';

// Import sub-pages
import ManagerDashboardOverview from './ManagerDashboardOverview';
import ApprovedRequests from './ApprovedRequests';
import ApprovedRequestDetails from './ApprovedRequestDetails';
import AssignedSamples from './AssignedSamples';
import ManagerCapaManagement from './ManagerCapaManagement';
import ManagerTestPlans from './ManagerTestPlans';

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
	sampleInspections?: any[];
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
				inspectionRemarks: req.remarks,
				sampleInspections: req.sampleInspections
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
	const handleCompleteInspectionForm = async (taskId: string, _result: 'PASSED' | 'FAILED', remarks: string, _checks: any) => {
		try {
			const numericTaskId = Number(taskId);
			const statusTransition = 'UNDER_TEST';

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

	// Set active tab logic
	let activeTab = 'dashboard';
	if (pathSegment === 'approved-requests') activeTab = 'approved-requests';
	else if (pathSegment.startsWith('approved-requests/')) activeTab = 'approved-request-details';
	else if (pathSegment === 'assigned-samples' || pathSegment.startsWith('assigned-samples/')) activeTab = 'assigned-samples';
	else if (pathSegment === 'capa-management') activeTab = 'capa-management';
	else if (pathSegment === 'test-plans') activeTab = 'test-plans';
	else if (pathSegment.startsWith('test-plans/')) activeTab = 'test-plan-details';

	// ==========================================
	// UI NAVIGATION AND TITLE HEADERS
	// ==========================================
	const getTabHeaders = () => {
		switch (activeTab) {
			case 'dashboard':
				return { title: 'Laboratory Manager Control Hub', desc: 'Coordinate testing workloads, assign equipment, manage calibrations, and supervise engineers.' };
			case 'approved-requests':
				return { title: 'Approved Requests Registry', desc: 'Approved testing plans from the Laboratory Head awaiting specialized engineer allocations.' };
			case 'approved-request-details':
				return { title: 'Approved Plan Specifications', desc: 'Configure duty staff scheduling parameters and review certification results.' };
			case 'assigned-samples':
				return { title: 'Self-Assigned Inspections', desc: 'Verify calibration parameters and execute physical checklists assigned directly to you.' };
			case 'capa-management':
				return { title: 'CAPA Action Plans', desc: 'Track Corrective and Preventive Action plans addressing testing failures or quality exceptions.' };
			case 'test-plans':
				return { title: 'Test Plan Configurations', desc: 'Create, schedule, and allocate physical station testing parameters for successfully inspected samples.' };
			case 'test-plan-details':
				return { title: 'Configure Test Plan Specifications', desc: 'Define physical testing parameters, platforms grid, NABL cycles, and begin physical testing.' };
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

			case 'test-plans':
				return (
					<ManagerTestPlans 
						requests={approvedRequests}
						onUpdateStatus={async (requestId, status, remarks) => {
							const numId = Number(requestId);
							if (isNaN(numId)) return;
							try {
								const updateOp = updateTestRequestStatus(numId, status, remarks);
								await updateOp();
								await loadApprovedRequests();
							} catch (e) {
								console.error('Failed to update request testing status:', e);
								throw e;
							}
						}}
					/>
				);

			case 'test-plan-details':
				return (
					<ManagerTestPlans 
						requests={approvedRequests}
						selectedRequestId={id}
						onUpdateStatus={async (requestId, status, remarks) => {
							const numId = Number(requestId);
							if (isNaN(numId)) return;
							try {
								const updateOp = updateTestRequestStatus(numId, status, remarks);
								await updateOp();
								await loadApprovedRequests();
							} catch (e) {
								console.error('Failed to update request testing status:', e);
								throw e;
							}
						}}
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
