import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { getTestRequests, updateTestRequestStatus } from '../../services/operations/testRequestService';

// Import sub-pages
import EngineerDashboardOverview from './EngineerDashboardOverview';
import EngineerAssignedSamples from './EngineerAssignedSamples';
import EngineerTestReports from './EngineerTestReports';

interface ApprovedRequest {
	id: string;
	requestId: string;
	brandName: string;
	modelNo: string;
	testMethodRef: string;
	sampleDescription: string;
	sampleQty: number;
	status: string;
	approvedDate: string;
	engineerId?: string;
	engineerName?: string;
	inspectionResult?: string;
	testType?: { id: number; name: string } | null;
	testPlans?: any[];
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
	status: string;
	assignedDate: string;
	engineerId?: string;
	engineerName?: string;
	testType?: { id: number; name: string } | null;
	testPlans?: any[];
	sampleInspections?: any[];
}

export default function EngineerDashboard() {
	const navigate = useNavigate();
	const location = useLocation();

	// Validate Authentication and Role
	const token = localStorage.getItem('token');
	const userStr = localStorage.getItem('user');
	const loggedInUser = userStr ? JSON.parse(userStr) : null;
	const currentEngineerId = loggedInUser ? String(loggedInUser.id) : '';

	const getLoggedInUserDepartmentName = () => {
		if (!loggedInUser) return '';

		return String(
			loggedInUser.department?.name ||
			loggedInUser.departmentName ||
			loggedInUser.department ||
			loggedInUser.departmentData?.name ||
			''
		).toLowerCase();
	};

	const currentEngineerDepartmentName = getLoggedInUserDepartmentName();
	const currentEngineerIsNabl = currentEngineerDepartmentName.includes('nabl');

	useEffect(() => {
		if (!token || !userStr) {
			localStorage.clear();
			navigate('/');
			return;
		}

		const user = JSON.parse(userStr);
		const role = user.role ? user.role.toLowerCase() : '';

		if (role !== 'engineer') {
			navigate('/dashboard', { replace: true });
		}
	}, [token, userStr, navigate]);

	// allRequests = for Test Reports page
	// approvedRequests = only assigned inspections for Assigned Samples / Dashboard
	const [allRequests, setAllRequests] = useState<ApprovedRequest[]>([]);
	const [approvedRequests, setApprovedRequests] = useState<ApprovedRequest[]>([]);
	const [loading, setLoading] = useState(false);

	// Load all requests from backend
	const loadRequests = async () => {
		if (!currentEngineerId) return;

		setLoading(true);

		try {
			const fetchOp = getTestRequests();
			const data = await fetchOp();

			const mapped: ApprovedRequest[] = data.map((req: any) => ({
				id: String(req.id),
				requestId: req.requestId || `REQ-${req.id}`,
				brandName: req.brandName,
				modelNo: req.modelNo,
				testMethodRef: req.testMethodRef,
				sampleDescription: req.sampleDescription,
				sampleQty: req.sampleQty || 1,
				status: req.status,
				approvedDate: req.updatedAt ? req.updatedAt.split('T')[0] : req.createdAt.split('T')[0],

				engineerId: req.assignedTo
					? String(req.assignedTo.id)
					: req.assignedToId
						? String(req.assignedToId)
						: undefined,

				engineerName: req.assignedTo?.name || undefined,
				inspectionResult: req.status === 'COMPLETED' ? 'PASSED' : undefined,

				testType: req.testType || null,
				sampleInspections: Array.isArray(req.sampleInspections) ? req.sampleInspections : [],
				testPlans: Array.isArray(req.testPlans) ? req.testPlans : [],
			}));

			// Test Reports page should receive all valid requests, not only assigned engineer requests
			const reportVisibleRequests = mapped.filter((r: any) => {
				const requestStatus = (r.status || '').toUpperCase();

				return ![
					'PENDING_APPROVAL',
					'REJECTED',
				].includes(requestStatus);
			});

			setAllRequests(reportVisibleRequests);

			// Assigned Samples / Dashboard should show only assigned inspections
			const assignedInspectionRequests = mapped.filter((r: any) => {
				const requestStatus = (r.status || '').toUpperCase();

				const allowedStatus = ![
					'PENDING_APPROVAL',
					'REJECTED',
				].includes(requestStatus);

				const assignedToCurrentEngineer =
					String(r.engineerId) === String(currentEngineerId);

				return allowedStatus && assignedToCurrentEngineer;
			});

			setApprovedRequests(assignedInspectionRequests);
		} catch (error) {
			console.error('Failed to load requests for engineer:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (token && userStr) {
			loadRequests();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token, userStr]);

	// Handler to sync finished inspection with backend server
	const handleCompleteInspectionForm = async (
		taskId: string,
		_result: 'PASSED' | 'FAILED',
		_remarks: string,
		_checks: any
	) => {
		try {
			const numericTaskId = Number(taskId);
			const statusTransition = _result === 'FAILED' ? 'INSPECTION_FAILED' : 'INSPECTION_COMPLETED';

			const updateOp = updateTestRequestStatus(
				numericTaskId,
				statusTransition,
				undefined
			);

			await updateOp();
			await loadRequests();
		} catch (error) {
			console.error('Failed to update inspection report on backend:', error);
		}
	};

	// Determine active path/tab
	const pathSegment = location.pathname.replace('/engineer/', '') || 'dashboard';

	let activeTab = 'dashboard';

	if (pathSegment === 'assigned-samples' || pathSegment.startsWith('assigned-samples/')) {
		activeTab = 'assigned-samples';
	} else if (pathSegment === 'test-report' || pathSegment.startsWith('test-report/')) {
		activeTab = 'test-report';
	}

	const myAssignedRequests = approvedRequests.filter(
		r => String(r.engineerId) === String(currentEngineerId)
	);

	const dynamicTasks: InspectionTask[] = myAssignedRequests.map(r => ({
		id: String(r.id),
		requestId: r.requestId,
		brandName: r.brandName,
		modelNo: r.modelNo,
		testMethodRef: r.testMethodRef,
		sampleDescription: r.sampleDescription,
		sampleQty: r.sampleQty,
		status: r.status,
		assignedDate: r.approvedDate,
		engineerId: r.engineerId,
		engineerName: r.engineerName,
		testType: r.testType,
		sampleInspections: r.sampleInspections,
		testPlans: r.testPlans,
	}));

	const renderContent = () => {
		if (loading && approvedRequests.length === 0 && allRequests.length === 0) {
			return (
				<div className="flex flex-col items-center justify-center py-20 gap-3">
					<div className="w-8 h-8 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin" />
					<p className="text-xs text-zinc-550 font-bold">Connecting to R&D data nodes...</p>
				</div>
			);
		}

		if (activeTab === 'assigned-samples') {
			return (
				<EngineerAssignedSamples
					tasks={dynamicTasks}
					onCompleteInspection={handleCompleteInspectionForm}
				/>
			);
		}

		if (activeTab === 'test-report') {
			return (
				<EngineerTestReports
					requests={allRequests}
					currentEngineerIsNabl={currentEngineerIsNabl}
					onUpdateStatus={async (requestId, status, remarks) => {
						try {
							const updateOp = updateTestRequestStatus(Number(requestId), status, remarks);
							await updateOp();
							await loadRequests();
						} catch (e) {
							console.error('Failed to update request status via test report:', e);
						}
					}}
				/>
			);
		}

		return (
			<EngineerDashboardOverview
				requests={myAssignedRequests}
			/>
		);
	};

	const getLayoutTitle = () => {
		if (activeTab === 'assigned-samples') return 'Assigned Stress Checklists';
		if (activeTab === 'test-report') return 'Quality Test Reports';
		return 'Engineering Workspace';
	};

	const getLayoutDesc = () => {
		if (activeTab === 'assigned-samples') return 'Verify calibration profiles and submit visual checks.';
		if (activeTab === 'test-report') {
			return currentEngineerIsNabl
				? 'Log NABL test report observations.'
				: 'Log safety and performance stress observations.';
		}
		return 'Log sensor logs, run physical sequences, and check status parameters.';
	};

	return (
		<DashboardLayout
			title={getLayoutTitle()}
			description={getLayoutDesc()}
			activeTab={activeTab}
		>
			{renderContent()}
		</DashboardLayout>
	);
}