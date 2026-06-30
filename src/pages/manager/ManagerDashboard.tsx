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
import ManagerCapaDetails from './ManagerCapaDetails';
import ManagerTestPlans from './ManagerTestPlans';
import ManagerCompletedRequests from './ManagerCompletedRequests';

// Import backend API services
import { getTestRequests, getTestRequestDetails, updateTestRequestStatus } from '../../services/operations/testRequestService';
import { getUsers } from '../../services/operations/userService';
import { getCapas, createCapa } from '../../services/operations/capaService';

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
	remarks?: string | null;
	inspectionDate?: string;
	customerContactDetails?: string;
	manufacturerNameAddress?: string;
	sampleInspections?: any[];
	testType?: { id: number; name: string } | null;
	testPlans?: any[];
	familyModel?: string | null;
	serialNumber?: string | null;
	productRating?: string;
	attachments?: any[];
	witnessRequired?: string;
	witnessPersonDetails?: string | null;
	collectBack?: string;
	conformityStatement?: string;
	decisionRule?: string | null;
	assignedDate?: string | null;
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
	testType?: { id: number; name: string } | null;
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
				remarks: req.remarks,
				sampleInspections: req.sampleInspections,
				testType: req.testType,
				testPlans: req.testPlans,
				familyModel: req.familyModel,
				serialNumber: req.serialNumber,
				productRating: req.productRating,
				attachments: req.attachments,
				witnessRequired: req.witnessRequired,
				witnessPersonDetails: req.witnessPersonDetails,
				collectBack: req.collectBack,
				conformityStatement: req.conformityStatement,
				decisionRule: req.decisionRule,
				customerContactDetails: req.customerContactDetails,
				manufacturerNameAddress: req.manufacturerNameAddress,
				assignedDate: req.assignedDate ? req.assignedDate.split('T')[0] : null
			}));

			// Perform an automatic check for completed requests that are still UNDER_TEST
			for (const req of mapped) {
				if (['UNDER_TESTING', 'UNDER_TEST', 'TESTING_PASSED', 'TESTING_FAILED', 'TESTING_PARTIAL'].includes(req.status)) {
					const qty = req.sampleQty || 1;
					let allSamplesComplete = true;
					let hasPlans = false;

					for (let i = 0; i < qty; i++) {
						const dbReport = (req.sampleInspections || []).find((r: any) => Number(r.sampleIndex) === i && (r.testPlanId === null || r.testPlanId === undefined));
						const plansForSample = (req.testPlans || []).filter((p: any) => Number(p.sampleIndex) === i);

						if (plansForSample.length > 0) {
							hasPlans = true;
						}

						if (dbReport) {
							if (dbReport.status === 'FAILED') {
								// Failed inspection means it's complete/failed
								continue;
							} else if (dbReport.status === 'PASSED') {
								// Passed inspection means all its plans must be evaluated
								if (plansForSample.length > 0 && plansForSample.every((p: any) => p.evaluationStatus === 'PASSED' || p.evaluationStatus === 'FAILED')) {
									continue;
								}
							}
						}
						allSamplesComplete = false;
						break;
					}

					// We only auto-transition if it actually had plans configured and all are completed
					if (allSamplesComplete && hasPlans) {
						let passedCount = 0;
						let failedCount = 0;

						const requestPlans = req.testPlans || [];
						requestPlans.forEach((p: any) => {
							if (p.evaluationStatus === 'PASSED') {
								passedCount++;
							} else if (p.evaluationStatus === 'FAILED') {
								failedCount++;
							}
						});

						// If there are failed inspections for samples without plans, count them as failed
						const passedSampleIndices: number[] = [];
						for (let i = 0; i < qty; i++) {
							const report = (req.sampleInspections || []).find((r: any) => Number(r.sampleIndex) === i && (r.testPlanId === null || r.testPlanId === undefined));
							if (req.status === 'RETEST' || (report && report.status === 'PASSED')) {
								passedSampleIndices.push(i);
							} else if (report && report.status === 'FAILED') {
								failedCount++;
							}
						}

						let finalStatus = 'TESTING_COMPLETED';
						const totalAllocationsCount = requestPlans.length + (qty - passedSampleIndices.length);

						if (passedCount === totalAllocationsCount) {
							finalStatus = 'TESTING_PASSED';
						} else if (failedCount === totalAllocationsCount) {
							finalStatus = 'TESTING_FAILED';
						} else {
							finalStatus = 'TESTING_PARTIAL';
						}

						if (req.status !== finalStatus) {
							try {
								const statusUpdateOp = updateTestRequestStatus(
									Number(req.id),
									finalStatus,
									undefined
								);
								await statusUpdateOp();
								req.status = finalStatus;
							} catch (e) {
								console.error(`Failed to auto-update request ${req.id} status to ${finalStatus}:`, e);
							}
						}
					} else if (!allSamplesComplete) {
						// If not all samples/plans are complete, but request is in a final status, reset it back to UNDER_TESTING
						if (['TESTING_PASSED', 'TESTING_FAILED', 'TESTING_PARTIAL'].includes(req.status)) {
							try {
								const statusUpdateOp = updateTestRequestStatus(
									Number(req.id),
									'UNDER_TESTING',
									undefined
								);
								await statusUpdateOp();
								req.status = 'UNDER_TESTING';
							} catch (e) {
								console.error(`Failed to reset request ${req.id} status to UNDER_TESTING:`, e);
							}
						}
					}
				}
			}

			// Approved requests are those which have been signed off by the Lab Head 
			// (Status is NOT PENDING_APPROVAL and NOT REJECTED)
			let filtered = mapped.filter((r: any) => r.status !== 'PENDING_APPROVAL' && r.status !== 'REJECTED');
			const currentUser = userStr ? JSON.parse(userStr) : null;
			const isNablDept = currentUser?.department?.name?.toUpperCase() === 'NABL';
			if (isNablDept) {
				filtered = filtered.filter((r: any) => r.testType?.name === 'NABL Test');
			} else {
				filtered = filtered.filter((r: any) => r.testType?.name !== 'NABL Test');
			}
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
					role: u.role,
					department: u.department
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
			loadCapas();
		}
	}, [token, userStr]);

	// Fetch dynamic single request details fresh from database when URL parameters change
	useEffect(() => {
		const loadDetails = async () => {
			if (!id || location.pathname.includes('/manager/capa-management')) {
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
					remarks: req.remarks,
					inspectionRemarks: req.remarks,
					customerContactDetails: req.customerContactDetails,
					manufacturerNameAddress: req.manufacturerNameAddress,
					testType: req.testType,
					testPlans: req.testPlans,
					sampleInspections: req.sampleInspections,
					familyModel: req.familyModel,
					serialNumber: req.serialNumber,
					productRating: req.productRating,
					attachments: req.attachments,
					witnessRequired: req.witnessRequired,
					witnessPersonDetails: req.witnessPersonDetails,
					collectBack: req.collectBack,
					conformityStatement: req.conformityStatement,
					decisionRule: req.decisionRule,
					assignedDate: req.assignedDate ? req.assignedDate.split('T')[0] : null
				};

				const currentUser = userStr ? JSON.parse(userStr) : null;
				const isNablDept = currentUser?.department?.name?.toUpperCase() === 'NABL';
				const isNablRequest = mapped.testType?.name === 'NABL Test';

				if (isNablDept && !isNablRequest) {
					setActiveRequestDetails(null);
					toast.error('Access Denied: Non-NABL test requests are not accessible by NABL managers.');
					navigate('/manager/dashboard');
					return;
				} else if (!isNablDept && isNablRequest) {
					setActiveRequestDetails(null);
					toast.error('Access Denied: NABL test requests are not accessible by this department.');
					navigate('/manager/dashboard');
					return;
				}

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
	}, [id, location.pathname, userStr, navigate]);

	// ==========================================
	// MOCK DATABASE STATES FOR OFFLINE MODULES
	// ==========================================

	// 3. CAPA Records — live from backend
	const [capas, setCapas] = useState<CapaRecord[]>([]);

	const loadCapas = async () => {
		try {
			const data = await getCapas()();
			const mapped = data.map((c: any) => ({
				id: c.capaId,
				relatedRequest: c.relatedRequest,
				productName: c.productName,
				nonConformity: c.nonConformity,
				rootCause: c.rootCause,
				correctiveAction: c.correctiveAction,
				preventiveAction: c.preventiveAction,
				targetedDate: c.targetedDate,
				status: c.status === 'Done' ? 'COMPLETED' : (c.status === 'COMPLETED' ? 'COMPLETED' : 'OPEN'),
				owner: c.owner || '',
				createdDate: new Date(c.createdAt).toISOString().split('T')[0],
			}));

			const currentUser = userStr ? JSON.parse(userStr) : null;
			const isNablDept = currentUser?.department?.name?.toUpperCase() === 'NABL';

			const fetchRequestsOp = getTestRequests();
			const allReqs = await fetchRequestsOp();

			const filteredMapped = mapped.filter((c: any) => {
				const matchedReq = allReqs.find((r: any) => String(r.id) === String(c.relatedRequest) || r.requestId === c.relatedRequest);
				if (!matchedReq) return false;
				const isNablRequest = matchedReq.testType?.name === 'NABL Test';
				return isNablDept ? isNablRequest : !isNablRequest;
			});

			setCapas(filteredMapped);
		} catch (err) {
			console.error('Failed to load CAPAs', err);
		}
	};

	// Derive current URL properties
	const pathSegment = location.pathname.replace('/manager/', '') || 'dashboard';

	// ==========================================
	// INTEGRATED OPERATIONS WORKFLOW LOGIC
	// ==========================================

	// 1. Assign Engineer to Request (Live Backend Integration)
	const handleAssignEngineer = async (requestId: string, engineerId: string, _engineerName: string) => {
		try {
			const numericRequestId = Number(requestId);
			const numericEngineerId = Number(engineerId);

			// Call backend update API to transition status to UNDER_TEST & assign scientist
			const updateOp = updateTestRequestStatus(
				numericRequestId,
				'UNDER_INSPECTION',
				undefined,
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
					remarks: req.remarks,
					inspectionRemarks: req.remarks,
					customerContactDetails: req.customerContactDetails,
					manufacturerNameAddress: req.manufacturerNameAddress,
					testType: req.testType
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
					remarks: req.remarks,
					inspectionRemarks: req.remarks,
					customerContactDetails: req.customerContactDetails,
					manufacturerNameAddress: req.manufacturerNameAddress,
					testType: req.testType
				};
				setActiveRequestDetails(mapped);
			}
		} catch (error) {
			console.error('Failed to log inspection results on backend:', error);
		}
	};

	// 3. Form inspection completion (from Manager's Assigned task screen checklist)
	const handleCompleteInspectionForm = async (taskId: string, _result: 'PASSED' | 'FAILED', _remarks: string, _checks: any) => {
		try {
			const numericTaskId = Number(taskId);
			const statusTransition = _result === 'FAILED' ? 'INSPECTION_FAILED' : 'INSPECTION_COMPLETED';

			const updateOp = updateTestRequestStatus(
				numericTaskId,
				statusTransition,
				undefined
			);
			await updateOp();

			// Refresh list
			await loadApprovedRequests();

		} catch (error) {
			console.error('Failed to log checklist form on backend:', error);
		}
	};

	// 4. Initiate CAPA Report Submission


	// Set active tab logic
	let activeTab = 'dashboard';
	if (pathSegment === 'approved-requests') activeTab = 'approved-requests';
	else if (pathSegment.startsWith('approved-requests/')) activeTab = 'approved-request-details';
	else if (pathSegment === 'assigned-samples' || pathSegment.startsWith('assigned-samples/')) activeTab = 'assigned-samples';
	else if (pathSegment === 'capa-management') activeTab = 'capa-management';
	else if (pathSegment.startsWith('capa-management/')) activeTab = 'capa-details';
	else if (pathSegment === 'test-plans') activeTab = 'test-plans';
	else if (pathSegment.startsWith('test-plans/')) activeTab = 'test-plan-details';
	else if (pathSegment === 'completed-requests' || pathSegment.startsWith('completed-requests/')) activeTab = 'completed-requests';

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
			case 'capa-details':
				return { title: 'CAPA Quality Analysis', desc: 'NABL-compliant Corrective and Preventive Action detailed execution sheet.' };
			case 'test-plans':
				return { title: 'Test Plan Configurations', desc: 'Create, schedule, and allocate physical station testing parameters for successfully inspected samples.' };
			case 'test-plan-details':
				return { title: 'Configure Test Plan Specifications', desc: 'Define physical testing parameters, platforms grid, NABL cycles, and begin physical testing.' };
			case 'completed-requests':
				return { title: 'Completed & Failed Requests Registry', desc: 'Centralized view of finalized test reports, failed inspects, and evaluation details.' };
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
						requests={approvedRequests}
						capas={capas}
						engineers={engineers}
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
				const currentUserForEng = userStr ? JSON.parse(userStr) : null;
				const isNablDeptForEng = currentUserForEng?.department?.name?.toUpperCase() === 'NABL';
				const filteredEngineers = engineers.filter((eng: any) => {
					const isEngNabl = eng.department?.name?.toUpperCase() === 'NABL';
					return isNablDeptForEng ? isEngNabl : !isEngNabl;
				});
				return (
					<ApprovedRequestDetails
						request={activeRequestDetails}
						engineers={filteredEngineers}
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
						status: r.status,
						assignedDate: r.assignedDate || r.approvedDate,
						engineerId: r.engineerId,
						engineerName: r.engineerName,
						testType: r.testType,
						sampleInspections: r.sampleInspections
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
						onAddCapa={async (newCapa: any) => {
							try {
								await createCapa(newCapa)();
								await loadCapas();
								toast.success('CAPA Report initialized successfully.');
							} catch (e) {
								console.error('Failed to initialize CAPA:', e);
								toast.error('Failed to initialize CAPA report.');
							}
						}}
						requests={approvedRequests}
					/>
				);

			case 'capa-details':
				return (
					<ManagerCapaDetails />
				);

			case 'test-plans':
				return (
					<ManagerTestPlans
						requests={approvedRequests}
						onRefreshRequests={loadApprovedRequests}
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
						onRefreshRequests={loadApprovedRequests}
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
			case 'completed-requests':
				return (
					<ManagerCompletedRequests
						requests={approvedRequests}
						selectedRequestId={id}
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
