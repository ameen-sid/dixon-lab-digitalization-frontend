import { apiConnector } from '../apiConnector';
import { toast } from 'react-hot-toast';
import { departmentEndpoints } from '../apis';

const { GET_DEPARTMENTS_API, CREATE_DEPARTMENT_API, UPDATE_DEPARTMENT_API, DELETE_DEPARTMENT_API } = departmentEndpoints;

interface AxiosServiceError {
	response?: {
		data?: {
			message?: string;
		};
	};
	message?: string;
}

export const getDepartments = () => {
	return async () => {
		try {
			const response = await apiConnector('GET', GET_DEPARTMENTS_API);
			return response.data.data || response.data || [];
		} catch (error) {
			console.error('GET_DEPARTMENTS_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to load active departments list.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		}
	};
};

export const createDepartment = (name: string) => {
	return async () => {
		const toastId = toast.loading('Registering department...');
		try {
			const response = await apiConnector('POST', CREATE_DEPARTMENT_API, { name: name.trim() });
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to register department');

			toast.success(`Department "${name.trim()}" created successfully!`);
			return response.data;
		} catch (error) {
			console.error('CREATE_DEPARTMENT_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to register department.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

export const updateDepartment = (id: number, name: string) => {
	return async () => {
		const toastId = toast.loading('Updating department...');
		try {
			const response = await apiConnector('PATCH', UPDATE_DEPARTMENT_API(id), { name: name.trim() });
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to update department');

			toast.success(`Department "${name.trim()}" updated successfully!`);
			return response.data;
		} catch (error) {
			console.error('UPDATE_DEPARTMENT_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to update department record.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

export const deleteDepartment = (id: number) => {
	return async () => {
		const toastId = toast.loading('Deleting department...');
		try {
			const response = await apiConnector('DELETE', DELETE_DEPARTMENT_API(id));
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to delete department');

			toast.success('Department deleted successfully.');
			return response.data;
		} catch (error) {
			console.error('DELETE_DEPARTMENT_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to delete department.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

const departmentService = {
	getDepartments,
	createDepartment,
	updateDepartment,
	deleteDepartment
};

export default departmentService;