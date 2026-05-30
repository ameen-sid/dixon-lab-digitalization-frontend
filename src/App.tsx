import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';

// Import individual dashboard pages to expose clean paths
import AdminDashboard from './pages/admin/AdminDashboard';
import CeoDashboard from './pages/ceo/CeoDashboard';
import HeadDashboard from './pages/head/HeadDashboard';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import EngineerDashboard from './pages/engineer/EngineerDashboard';
import InspectorDashboard from './pages/inspector/InspectorDashboard';
import RequesterDashboard from './pages/requester/RequesterDashboard';

function App() {
	return (
		<Router>
			<Toaster position="bottom-right" reverseOrder={false} />
			<Routes>
				<Route path="/" element={<Login />} />
				
				{/* Dynamic dispatcher route */}
				<Route path="/dashboard" element={<Dashboard />} />

				{/* Role-specific clean path routes */}
				<Route path="/admin/dashboard" element={<AdminDashboard />} />
				<Route path="/ceo/dashboard" element={<CeoDashboard />} />
				<Route path="/head/dashboard" element={<HeadDashboard />} />
				<Route path="/manager/dashboard" element={<ManagerDashboard />} />
				<Route path="/engineer/dashboard" element={<EngineerDashboard />} />
				<Route path="/inspector/dashboard" element={<InspectorDashboard />} />
				
				{/* Requester sub-pages serving unique URL paths */}
				<Route path="/requester" element={<RequesterDashboard />} />
				<Route path="/requester/dashboard" element={<RequesterDashboard />} />
				<Route path="/requester/my-requests" element={<RequesterDashboard />} />
				<Route path="/requester/requests/new" element={<RequesterDashboard />} />
				<Route path="/requester/requests/track" element={<RequesterDashboard />} />
				<Route path="/requester/capa" element={<RequesterDashboard />} />
				<Route path="/requester/capa/new" element={<RequesterDashboard />} />
				<Route path="/requester/capa/details" element={<RequesterDashboard />} />

				{/* Fallback to Login */}
				<Route path="*" element={<Login />} />
			</Routes>
		</Router>
	);
}

export default App;