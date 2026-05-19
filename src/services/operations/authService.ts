import { apiConnector } from '../apiConnector';
import { toast } from 'react-hot-toast';
import { authEndpoints } from '../apis';

const { LOGIN_API, LOGOUT_API } = authEndpoints;

interface AxiosServiceError {
	response?: {
		data?: {
			message?: string;
		};
	};
	message?: string;
}

export const login = (username: string, password: string) => {
	return async () => {
		const toastId = toast.loading('Loading...');
		try {
			const response = await apiConnector('POST', LOGIN_API, {
				username,
				password
			});
			console.log('Login API Response: ', response);

			if (!response.data.success) throw new Error(response.data.message);
			localStorage.setItem('token', response.data.data.token);
			localStorage.setItem('user', JSON.stringify(response.data.data.user));

			toast.success('Login Successful');
			return response.data;
		} catch (error) {
			console.log('Login API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Login Failed';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		}
		finally {
			toast.dismiss(toastId);
		}
	};
};

export const logout = () => {
	return async () => {
		const toastId = toast.loading('Logging out...');
		try {
			await apiConnector('POST', LOGOUT_API);

			localStorage.removeItem('token');
			localStorage.removeItem('user');
			toast.success('Logged Out');
		} catch (error) {
			console.log('Logout API Error: ', error);

			localStorage.removeItem('token');
			localStorage.removeItem('user');
			toast.success('Logged Out');
		} finally {
			toast.dismiss(toastId);
		}
	};
};