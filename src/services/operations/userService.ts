import { apiConnector } from '../apiConnector';
import { toast } from 'react-hot-toast';
import { userEndpoints } from '../apis';

const { GET_USERS_API, CREATE_USER_API, UPDATE_USER_API, DELETE_USER_API } = userEndpoints;

interface AxiosServiceError {
	response?: {
		data?: {
			message?: string;
		};
	};
	message?: string;
}

export const getUsers = () => {
	return async () => {
		try {
			const response = await apiConnector('GET', GET_USERS_API + '?limit=100');
			return response.data.data || response.data || [];
		} catch (error) {
			console.error('GET_USERS_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to load user credentials registry.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		}
	};
};

export const createUser = (payload: Record<string, unknown>) => {
	return async () => {
		const toastId = toast.loading('Creating user profile...');
		try {
			const response = await apiConnector('POST', CREATE_USER_API, payload);
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to create user profile');

			toast.success('User profile and access key created successfully!');
			return response.data;
		} catch (error) {
			console.error('CREATE_USER_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to create user credential registry.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

export const updateUser = (id: number, payload: Record<string, unknown>) => {
	return async () => {
		const toastId = toast.loading('Updating user profile...');
		try {
			const response = await apiConnector('PATCH', UPDATE_USER_API(id), payload);
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to update user profile');

			toast.success('User profile settings synchronized successfully!');
			return response.data;
		} catch (error) {
			console.error('UPDATE_USER_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to update user profile.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

export const deleteUser = (id: number) => {
	return async () => {
		const toastId = toast.loading('Deleting user profile...');
		try {
			const response = await apiConnector('DELETE', DELETE_USER_API(id));
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to delete user profile');

			toast.success('User profile deleted and credentials revoked successfully.');
			return response.data;
		} catch (error) {
			console.error('DELETE_USER_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to delete user profile.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

const userService = {
	getUsers,
	createUser,
	updateUser,
	deleteUser
};

export default userService;