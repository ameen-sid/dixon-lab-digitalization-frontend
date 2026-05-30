import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
	const navigate = useNavigate();

	useEffect(() => {
		const token = localStorage.getItem('token');
		const userStr = localStorage.getItem('user');

		if (!token || !userStr) {
			localStorage.clear();
			navigate('/');
			return;
		}

		const user = JSON.parse(userStr);
		const role = user.role ? user.role.toLowerCase() : 'requester';

		switch (role) {
			case 'admin':
				navigate('/admin/dashboard', { replace: true });
				break;
			case 'ceo':
				navigate('/ceo/dashboard', { replace: true });
				break;
			case 'head':
				navigate('/head/dashboard', { replace: true });
				break;
			case 'lab manager':
				navigate('/manager/dashboard', { replace: true });
				break;
			case 'engineer':
				navigate('/engineer/dashboard', { replace: true });
				break;
			case 'inspector':
				navigate('/inspector/dashboard', { replace: true });
				break;
			case 'requester':
			default:
				navigate('/requester/dashboard', { replace: true });
				break;
		}
	}, [navigate]);

	return null;
}
