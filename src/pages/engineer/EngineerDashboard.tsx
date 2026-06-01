import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { getTestRequests, updateTestRequestStatus } from '../../services/operations/testRequestService';

// Import sub-pages
import EngineerDashboardOverview from './EngineerDashboardOverview';
import EngineerAssignedSamples from './EngineerAssignedSamples';

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
	engineerId?: string;
	engineerName?: string;
}

export default function EngineerDashboard() {
	const navigate = useNavigate();
	const location = useLocation();

	// Validate Authentication and Role
	const token = localStorage.getItem('token');
	const userStr = localStorage.getItem('user');
	const loggedInUser = userStr ? JSON.parse(userStr) : null;
	const currentEngineerId = loggedInUser ? String(loggedInUser.id) : '';

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

	// Live backend requests state
	const [approvedRequests, setApprovedRequests] = useState<ApprovedRequest[]>([]);
	const [loading, setLoading] = useState(false);

	// Load all requests assigned to this engineer from backend
	const loadRequests = async () => {
		if (!currentEngineerId) return;
		setLoading(true);
		try {
			const fetchOp = getTestRequests();
			const data = await fetchOp();
			
			const mapped = data.map((req: any) => ({
				id: String(req.id),
				requestId: req.requestId || `REQ-${req.id}`,
				brandName: req.brandName,
				modelNo: req.modelNo,
				testMethodRef: req.testMethodRef,
				sampleDescription: req.sampleDescription,
				sampleQty: req.sampleQty || 1,
				status: req.status,
				approvedDate: req.updatedAt ? req.updatedAt.split('T')[0] : req.createdAt.split('T')[0],
				engineerId: req.assignedTo ? String(req.assignedTo.id) : undefined,
				engineerName: req.assignedTo ? req.assignedTo.name : undefined,
				inspectionResult: req.status === 'COMPLETED' ? 'PASSED' : undefined
			}));

			// Only keep requests explicitly assigned to THIS engineer (UNDER_INSPECTION / UNDER_TEST / COMPLETED)
			const filtered = mapped.filter((r: any) =>
				r.status !== 'PENDING_APPROVAL' &&
				r.status !== 'REJECTED' &&
				r.engineerId === currentEngineerId
			);
			setApprovedRequests(filtered);
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
	}, [token, userStr]);

	// Handler to sync finished inspection with backend server
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

			// Reload list dynamically
			await loadRequests();
		} catch (error) {
			console.error('Failed to update inspection report on backend:', error);
		}
	};

	// Determine active path/tab
	const pathSegment = location.pathname.replace('/engineer/', '') || 'dashboard';
	const activeTab = (pathSegment === 'assigned-samples' || pathSegment.startsWith('assigned-samples/')) ? 'assigned-samples' : 'dashboard';

	// Stats matching engineer specific metrics
	const myAssignedRequests = approvedRequests.filter(r => String(r.engineerId) === currentEngineerId);
	const activeCount = myAssignedRequests.length;
	const pendingCount = myAssignedRequests.filter(r => r.status === 'UNDER_TEST' || r.status === 'UNDER_INSPECTION').length;
	const completedCount = myAssignedRequests.filter(r => r.status === 'COMPLETED').length;

	const dynamicTasks: InspectionTask[] = myAssignedRequests.map(r => ({
		id: String(r.id),
		requestId: r.requestId,
		brandName: r.brandName,
		modelNo: r.modelNo,
		testMethodRef: r.testMethodRef,
		sampleDescription: r.sampleDescription,
		sampleQty: r.sampleQty,
		status: r.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
		assignedDate: r.approvedDate,
		engineerId: r.engineerId,
		engineerName: r.engineerName
	}));

	const renderContent = () => {
		if (loading && approvedRequests.length === 0) {
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

		return (
			<EngineerDashboardOverview 
				stats={{
					assignedCount: activeCount,
					pendingCount: pendingCount,
					completedCount: completedCount
				}}
			/>
		);
	};

	return (
		<DashboardLayout
			title={activeTab === 'assigned-samples' ? 'Assigned Stress Checklists' : 'Engineering Workspace'}
			description={activeTab === 'assigned-samples' ? 'Verify calibration profiles and submit visual checks.' : 'Log sensor logs, run physical sequences, and check status parameters.'}
			activeTab={activeTab}
		>
			{renderContent()}
		</DashboardLayout>
	);
}
