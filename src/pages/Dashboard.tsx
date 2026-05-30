import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import AdminDashboard from './admin/AdminDashboard';
import CeoDashboard from './ceo/CeoDashboard';
import HeadDashboard from './head/HeadDashboard';
import ManagerDashboard from './manager/ManagerDashboard';
import EngineerDashboard from './engineer/EngineerDashboard';
import InspectorDashboard from './inspector/InspectorDashboard';
import RequesterDashboard from './requester/RequesterDashboard';

export default function Dashboard() {
	const navigate = useNavigate();

	const token = localStorage.getItem('token');
	const userStr = localStorage.getItem('user');

	useEffect(() => {
		if (!token || !userStr) {
			localStorage.clear();
			navigate('/');
		}
	}, [token, userStr, navigate]);

	if (!token || !userStr)	return null;

	const user = JSON.parse(userStr);
	const role = user.role ? user.role.toLowerCase() : 'requester';

	switch (role) {
		case 'admin':
			return <AdminDashboard />;
		case 'ceo':
			return <CeoDashboard />;
		case 'head':
			return <HeadDashboard />;
		case 'lab manager':
			return <ManagerDashboard />;
		case 'engineer':
			return <EngineerDashboard />;
		case 'inspector':
			return <InspectorDashboard />;
		case 'requester':
			return <RequesterDashboard />;
		default:
			return <RequesterDashboard />;
	}
}
