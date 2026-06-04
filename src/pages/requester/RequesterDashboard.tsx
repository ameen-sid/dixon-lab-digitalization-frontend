import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { CheckCircle } from 'lucide-react';

// Import newly added modular requester sub-pages
import RequesterOverview from './RequesterOverview';
import MyRequests from './MyRequests';
import CreateRequest from './CreateRequest';
import RequestTracking from './RequestTracking';
import CapaManagement from './CapaManagement';
import CreateCapa from './CreateCapa';
import CapaReports from './CapaReports';

// Import API services
import { getTestRequests, createTestRequest } from '../../services/operations/testRequestService';

interface RequestRecord {
	id: string;
	dbId?: number;
	customerNameAddress: string;
	manufacturerNameAddress: string;
	customerContactDetails: string;
	sampleDescription: string;
	modelNo: string;
	familyModel?: string | null;
	serialNumber?: string | null;
	productRating: string;
	sampleQty: number;
	brandName: string;
	attachmentMention?: string | null;
	witnessRequired: string;
	witnessPersonDetails?: string | null;
	testMethodRef: string;
	conformityStatement: string;
	decisionRule?: string | null;
	collectBack: string;
	status: string;
	remarks?: string | null;
	createdDate: string;
	createdAt?: string;
	updatedAt?: string;
	telemetry: number[];
	attachments?: { id: number; fileName: string; filePath: string; fileSize: number }[];
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

	// new format fields
	partProduct?: string;
	modelName?: string;
	customerSupplier?: string;
	date?: string;
	result?: string;
	title?: string;
	improvementType?: string;
	partName?: string;
	problem?: string;
	model?: string;
	defectQty?: string;
	venue?: string;
	imageUrl?: string;
	why1?: string;
	why2?: string;
	why3?: string;
	why4?: string;
	undetectedWhy1?: string;
	undetectedWhy2?: string;
	undetectedWhy3?: string;
	tempCountermeasure?: string;
	radicalCountermeasure?: string;
	inspectionControl?: string;
	processControl?: string;
	beforeImprovementImgUrl?: string;
	afterImprovementImgUrl?: string;
	preventionImgUrl?: string;
	remark?: string;
}

export default function RequesterDashboard() {
	const navigate = useNavigate();
	const location = useLocation();
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

		if (role !== 'requester') {
			navigate('/dashboard', { replace: true });
		}
	}, [token, userStr, navigate]);

	const path = location.pathname;

	// Derive active tab string for header labeling
	let activeTab = 'dashboard';
	if (path === '/requester/my-requests') activeTab = 'my-requests';
	else if (path === '/requester/requests/new') activeTab = 'new-request';
	else if (path === '/requester/requests/track') activeTab = 'view-request-details';
	else if (path === '/requester/capa') activeTab = 'capa-management';
	else if (path === '/requester/capa/new') activeTab = 'new-capa';
	else if (path === '/requester/capa/details') activeTab = 'view-capa-details';

	const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

	const [requests, setRequests] = useState<RequestRecord[]>([]);

	const loadRequests = async () => {
		try {
			const dbRequests = await getTestRequests()();
			const mapped = dbRequests.map((db: any) => ({
				id: db.requestId || `REQ-2026-${String(db.id).padStart(3, '0')}`,
				dbId: db.id,
				customerNameAddress: db.customerNameAddress,
				manufacturerNameAddress: db.manufacturerNameAddress,
				customerContactDetails: db.customerContactDetails,
				sampleDescription: db.sampleDescription,
				modelNo: db.modelNo,
				familyModel: db.familyModel,
				serialNumber: db.serialNumber,
				productRating: db.productRating,
				sampleQty: db.sampleQty,
				brandName: db.brandName,
				attachmentMention: db.attachmentMention,
				witnessRequired: db.witnessRequired,
				witnessPersonDetails: db.witnessPersonDetails,
				testMethodRef: db.testMethodRef,
				conformityStatement: db.conformityStatement,
				decisionRule: db.decisionRule,
				collectBack: db.collectBack,
				status: db.status,
				remarks: db.remarks || 'Awaiting lab supervisor allocation.',
				createdDate: new Date(db.createdAt).toISOString().split('T')[0],
				createdAt: db.createdAt,
				updatedAt: db.updatedAt,
				telemetry: db.telemetry || [],
				attachments: db.attachments || []
			}));

			setRequests(mapped);
		} catch (error) {
			console.error('Failed to load real requests from API:', error);
			setRequests([]);
		}
	};

	useEffect(() => {
		if (token && userStr) {
			loadRequests();
		}
	}, [token, userStr]);

	// 2. CAPA (Corrective and Preventive Action) Mock Database
	const [capas, setCapas] = useState<CapaRecord[]>([
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
	const [selectedRequest, setSelectedRequest] = useState<RequestRecord | null>(null);
	const [selectedCapa, setSelectedCapa] = useState<CapaRecord | null>(capas[0]);

	const queryParams = new URLSearchParams(location.search);
	const reqIdFromUrl = queryParams.get('id');
	const currentTrackedRequest = reqIdFromUrl 
		? (requests.find(r => r.id === reqIdFromUrl) || selectedRequest)
		: (selectedRequest || (requests.length > 0 ? requests[0] : null));

	// Ensure selectedRequest defaults to requests[0] when requests updates
	useEffect(() => {
		if (requests.length > 0 && !selectedRequest) {
			setSelectedRequest(requests[0]);
		}
	}, [requests, selectedRequest]);

	// New CAPA Form Inputs State for passing initial values from complete requests
	const [initialCapaInput, setInitialCapaInput] = useState<any>(null);

	const triggerNotification = (message: string, type: 'success' | 'info' = 'success') => {
		setNotification({ message, type });
		setTimeout(() => {
			setNotification(null);
		}, 4000);
	};

	// Form Submission Handlers
	const handleCreateRequestSubmit = async (input: any, files: File[]) => {
		try {
			const formData = new FormData();
			Object.keys(input).forEach((key) => {
				formData.append(key, input[key]);
			});
			files.forEach((file) => {
				formData.append('files', file);
			});

			await createTestRequest(formData)();
			triggerNotification('Testing request submitted successfully!');
			await loadRequests();
			navigate('/requester/my-requests');
		} catch (error) {
			console.error('Failed to submit request to database:', error);
			triggerNotification('Failed to submit request. Please try again.', 'info');
		}
	};

	const handleCreateCapaSubmit = (input: any) => {
		const isOldFormatComplete = input.nonConformity && input.rootCause && input.correctiveAction && input.preventiveAction && input.targetedDate;
		const isNewFormatComplete = input.title && input.problem && input.partName;

		if (!isOldFormatComplete && !isNewFormatComplete) {
			triggerNotification('Please complete all mandatory fields.', 'info');
			return;
		}

		const newCapaId = `CAPA-2026-00${capas.length + 1}`;
		const newCapaItem: CapaRecord = {
			id: newCapaId,
			relatedRequest: input.relatedRequest,
			productName: input.productName || input.partProduct || 'SMT Control Board X-90',
			nonConformity: input.nonConformity || input.problem || 'Test failure observed.',
			rootCause: input.rootCause || input.why1 || 'Analysis in progress.',
			correctiveAction: input.correctiveAction || input.tempCountermeasure || 'Immediate check sheet adjustments.',
			preventiveAction: input.preventiveAction || input.radicalCountermeasure || 'Preventive actions in progress.',
			targetedDate: input.targetedDate || input.targetDate || new Date().toISOString().split('T')[0],
			status: input.status ? (input.status === 'Done' ? 'COMPLETED' : 'OPEN') : 'OPEN',
			owner: 'SMT Engineering Dept',
			createdDate: new Date().toISOString().split('T')[0],

			// Include new format fields
			partProduct: input.partProduct,
			modelName: input.modelName,
			customerSupplier: input.customerSupplier,
			date: input.date,
			result: input.result,
			title: input.title,
			improvementType: input.improvementType,
			partName: input.partName,
			problem: input.problem,
			model: input.model,
			defectQty: input.defectQty,
			venue: input.venue,
			imageUrl: input.imageUrl,
			why1: input.why1,
			why2: input.why2,
			why3: input.why3,
			why4: input.why4,
			undetectedWhy1: input.undetectedWhy1,
			undetectedWhy2: input.undetectedWhy2,
			undetectedWhy3: input.undetectedWhy3,
			tempCountermeasure: input.tempCountermeasure,
			radicalCountermeasure: input.radicalCountermeasure,
			inspectionControl: input.inspectionControl,
			processControl: input.processControl,
			beforeImprovementImgUrl: input.beforeImprovementImgUrl,
			afterImprovementImgUrl: input.afterImprovementImgUrl,
			preventionImgUrl: input.preventionImgUrl,
			remark: input.remark
		};

		setCapas([newCapaItem, ...capas]);
		setInitialCapaInput(null);
		triggerNotification(`CAPA Plan ${newCapaId} initiated successfully!`);
		navigate('/requester/capa');
	};

	const handleInitiateCapaFromRequest = (req: RequestRecord) => {
		setInitialCapaInput({
			relatedRequest: req.id,
			productName: `${req.brandName} ${req.modelNo}`,
			nonConformity: `Test failure observed under ${req.testMethodRef} testing cycles. Details: ${req.sampleDescription}`,
			rootCause: '',
			correctiveAction: '',
			preventiveAction: '',
			targetedDate: ''
		});
		navigate('/requester/capa/new');
	};

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
		if (path === '/requester/dashboard' || path === '/requester') {
			return (
				<RequesterOverview 
					requests={requests}
					capas={capas}
					setActiveTab={(tab) => {
						if (tab === 'my-requests') navigate('/requester/my-requests');
						else if (tab === 'new-request') navigate('/requester/requests/new');
						else if (tab === 'capa-management') navigate('/requester/capa');
					}}
					setSelectedRequest={(req) => {
						setSelectedRequest(req);
						navigate(`/requester/requests/track?id=${req.id}`);
					}}
				/>
			);
		}
		if (path === '/requester/my-requests') {
			return (
				<MyRequests 
					requests={requests}
					setActiveTab={(tab) => {
						if (tab === 'new-request') navigate('/requester/requests/new');
						else if (tab === 'view-request-details') navigate('/requester/requests/track');
					}}
					setSelectedRequest={(req) => {
						setSelectedRequest(req);
						navigate(`/requester/requests/track?id=${req.id}`);
					}}
				/>
			);
		}
		if (path === '/requester/requests/new') {
			return (
				<CreateRequest 
					onSubmit={handleCreateRequestSubmit}
					setActiveTab={(tab) => {
						if (tab === 'my-requests') navigate('/requester/my-requests');
					}}
				/>
			);
		}
		if (path === '/requester/requests/track') {
			return (
				<RequestTracking 
					selectedRequest={currentTrackedRequest}
					setActiveTab={(tab) => {
						if (tab === 'my-requests') navigate('/requester/my-requests');
					}}
					onInitiateCapa={handleInitiateCapaFromRequest}
				/>
			);
		}
		if (path === '/requester/capa') {
			return (
				<CapaManagement 
					capas={capas}
					setActiveTab={(tab) => {
						if (tab === 'new-capa') navigate('/requester/capa/new');
						else if (tab === 'view-capa-details') navigate('/requester/capa/details');
					}}
					setSelectedCapa={(capa) => {
						setSelectedCapa(capa);
						navigate('/requester/capa/details');
					}}
				/>
			);
		}
		if (path === '/requester/capa/new') {
			return (
				<CreateCapa 
					requests={requests}
					onSubmit={handleCreateCapaSubmit}
					setActiveTab={(tab) => {
						if (tab === 'capa-management') navigate('/requester/capa');
					}}
					initialInput={initialCapaInput}
				/>
			);
		}
		if (path === '/requester/capa/details') {
			return (
				<CapaReports 
					selectedCapa={selectedCapa}
					setActiveTab={(tab) => {
						if (tab === 'capa-management') navigate('/requester/capa');
					}}
				/>
			);
		}
		return null;
	};

	if (!token || !userStr) return null;
	const user = JSON.parse(userStr);
	const role = user.role ? user.role.toLowerCase() : 'requester';
	if (role !== 'requester') return null;

	return (
		<DashboardLayout
			title={headers.title}
			description={headers.desc}
			activeTab={activeTab}
			onTabChange={(tab) => {
				// Reset CAPA pre-fill states if navigated manually
				if (tab !== 'new-capa') {
					setInitialCapaInput(null);
				}
			}}
		>
			{/* Notifications Popups */}
			{notification && (
				<div className={`fixed top-4 right-4 z-50 rounded-xl px-4 py-3 shadow-md flex items-center gap-2 text-xs font-bold transition-all border animate-fade-in ${
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
