import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import CeoDashboard from './pages/ceo/CeoDashboard';
import HeadDashboard from './pages/head/HeadDashboard';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import EngineerDashboard from './pages/engineer/EngineerDashboard';
import InspectorDashboard from './pages/inspector/InspectorDashboard';
import InspectorDailyChecksheet from './pages/inspector/InspectorDailyChecksheet';
import InspectorChecksheet from './pages/inspector/InspectorChecksheet';
import ManagerEvaluateChecksheet from './pages/manager/ManagerEvaluateChecksheet';
import ReportPreview from './pages/manager/ReportPreview';
import RequesterDashboard from './pages/requester/RequesterDashboard';
import NablManagerDashboard from './pages/nabl-manager/NablManagerDashboard';
import NablManagerRequests from './pages/nabl-manager/NablManagerRequests';
import NablManagerTestPlans from './pages/nabl-manager/NablManagerTestPlans';
import NablRequestReport from './pages/nabl-manager/NablRequestReport';
import NablManagerCompletedTests from './pages/nabl-manager/NablManagerCompletedTests';
import NablCompletedTestDetails from './pages/nabl-manager/NablCompletedTestDetails';

function App() {
	useEffect(() => {
		const handleGlobalKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Enter') {
				const target = e.target as HTMLElement;
				if (window.location.pathname === '/') {
					return;
				}

				if (
					target.tagName === 'INPUT' &&
					!['button', 'submit', 'image', 'reset'].includes((target as HTMLInputElement).type)
				) {
					const isSearch = (target.getAttribute('type') === 'search') ||
									 (target.getAttribute('placeholder')?.toLowerCase().includes('search')) ||
									 (target.getAttribute('name')?.toLowerCase().includes('search'));
					if (!isSearch) {
						e.preventDefault();
					}
				}
			}
		};
		window.addEventListener('keydown', handleGlobalKeyDown);
		return () => {
			window.removeEventListener('keydown', handleGlobalKeyDown);
		};
	}, []);

	return (
		<Router>
			<Toaster position="bottom-right" reverseOrder={false} />
			<Routes>
				<Route path="/" element={<Login />} />
				<Route path="/dashboard" element={<Dashboard />} />

				<Route path="/admin/dashboard" element={<AdminDashboard />} />
				<Route path="/admin/platform-availability" element={<AdminDashboard />} />
				<Route path="/admin/nabl-station-availability" element={<AdminDashboard />} />
				<Route path="/admin/equipment-availability" element={<AdminDashboard />} />
				<Route path="/admin/departments-management" element={<AdminDashboard />} />
				<Route path="/admin/users-management" element={<AdminDashboard />} />
				<Route path="/admin/test-types" element={<AdminDashboard />} />
				<Route path="/admin/test-categories" element={<AdminDashboard />} />
				<Route path="/admin/test-protocols" element={<AdminDashboard />} />
				<Route path="/admin/product-part-names" element={<AdminDashboard />} />
				<Route path="/admin/suppliers-customers" element={<AdminDashboard />} />
				<Route path="/admin/rd-equipment" element={<AdminDashboard />} />
				<Route path="/admin/system-logs" element={<AdminDashboard />} />
				<Route path="/admin/mis-reports" element={<AdminDashboard />} />

				<Route path="/ceo/dashboard" element={<CeoDashboard />} />

				<Route path="/head/dashboard" element={<HeadDashboard />} />
				<Route path="/head/ceo-dashboard" element={<HeadDashboard />} />
				<Route path="/head/sample-tests" element={<HeadDashboard />} />
				<Route path="/head/sample-tests/:id" element={<HeadDashboard />} />
				<Route path="/head/completed-reports" element={<HeadDashboard />} />
				<Route path="/head/completed-reports/:id" element={<HeadDashboard />} />
				<Route path="/head/failure-decision" element={<HeadDashboard />} />
				<Route path="/head/failure-decision/:id" element={<HeadDashboard />} />
				<Route path="/head/capa-reports" element={<HeadDashboard />} />

				<Route path="/manager/dashboard" element={<ManagerDashboard />} />
				<Route path="/manager/approved-requests" element={<ManagerDashboard />} />
				<Route path="/manager/approved-requests/:id" element={<ManagerDashboard />} />
				<Route path="/manager/assigned-samples" element={<ManagerDashboard />} />
				<Route path="/manager/assigned-samples/:planId" element={<ManagerDashboard />} />
				<Route path="/manager/assigned-samples/:planId/sample/:sampleIndex" element={<ManagerDashboard />} />
				<Route path="/manager/capa-management" element={<ManagerDashboard />} />
				<Route path="/manager/capa-management/:id" element={<ManagerDashboard />} />
				<Route path="/manager/test-plans" element={<ManagerDashboard />} />
				<Route path="/manager/test-plans/:id" element={<ManagerDashboard />} />
				<Route path="/manager/completed-requests" element={<ManagerDashboard />} />
				<Route path="/manager/completed-requests/:id" element={<ManagerDashboard />} />
				<Route path="/manager/evaluate-checksheet/:planKey" element={<ManagerEvaluateChecksheet />} />

				<Route path="/reports/preview" element={<ReportPreview />} />

				<Route path="/engineer/dashboard" element={<EngineerDashboard />} />
				<Route path="/engineer/assigned-samples" element={<EngineerDashboard />} />
				<Route path="/engineer/assigned-samples/:planId" element={<EngineerDashboard />} />
				<Route path="/engineer/assigned-samples/:planId/sample/:sampleIndex" element={<EngineerDashboard />} />
				<Route path="/engineer/test-report" element={<EngineerDashboard />} />
				<Route path="/engineer/test-report/:planKey" element={<EngineerDashboard />} />
				<Route path="/engineer/filled-reports" element={<EngineerDashboard />} />

				<Route path="/inspector/dashboard" element={<InspectorDashboard />} />
				<Route path="/inspector/daily-checksheet" element={<InspectorDailyChecksheet />} />
				<Route path="/inspector/checksheet/:planKey" element={<InspectorChecksheet />} />

				<Route path="/nabl-manager/dashboard" element={<NablManagerDashboard />} />
				<Route path="/nabl-manager/requests" element={<NablManagerRequests />} />
				<Route path="/nabl-manager/requests/:id" element={<NablRequestReport />} />
				<Route path="/nabl-manager/test-plans" element={<NablManagerTestPlans />} />
				<Route path="/nabl-manager/completed-tests" element={<NablManagerCompletedTests />} />
				<Route path="/nabl-manager/completed-tests/:id" element={<NablCompletedTestDetails />} />

				<Route path="/requester" element={<RequesterDashboard />} />
				<Route path="/requester/dashboard" element={<RequesterDashboard />} />
				<Route path="/requester/my-requests" element={<RequesterDashboard />} />
				<Route path="/requester/requests/new" element={<RequesterDashboard />} />
				<Route path="/requester/requests/track" element={<RequesterDashboard />} />
				<Route path="/requester/capa" element={<RequesterDashboard />} />
				<Route path="/requester/capa/new" element={<RequesterDashboard />} />
				<Route path="/requester/capa/details" element={<RequesterDashboard />} />

				<Route path="*" element={<Login />} />
			</Routes>
		</Router>
	);
}

export default App;