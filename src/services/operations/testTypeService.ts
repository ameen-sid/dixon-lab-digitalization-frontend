import { apiConnector } from '../apiConnector';
import { toast } from 'react-hot-toast';
import { testTypeEndpoints } from '../apis';

const { GET_TEST_TYPES_API, CREATE_TEST_TYPE_API, UPDATE_TEST_TYPE_API, DELETE_TEST_TYPE_API } = testTypeEndpoints;

interface AxiosServiceError {
	response?: {
		data?: {
			message?: string;
		};
	};
	message?: string;
}

export const getTestTypes = () => {
	return async () => {
		try {
			const response = await apiConnector('GET', GET_TEST_TYPES_API);
			return response.data.data || response.data || [];
		} catch (error) {
			console.error('GET_TEST_TYPES_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to load test types.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		}
	};
};

export const createTestType = (name: string) => {
	return async () => {
		const toastId = toast.loading('Creating test type...');
		try {
			const response = await apiConnector('POST', CREATE_TEST_TYPE_API, { name: name.trim() });
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to create test type');

			toast.success(`Test Type "${name.trim()}" created successfully!`);
			return response.data;
		} catch (error) {
			console.error('CREATE_TEST_TYPE_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to create test type.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

export const updateTestType = (id: number, name: string) => {
	return async () => {
		const toastId = toast.loading('Updating test type...');
		try {
			const response = await apiConnector('PATCH', UPDATE_TEST_TYPE_API(id), { name: name.trim() });
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to update test type');

			toast.success(`Test Type "${name.trim()}" updated successfully!`);
			return response.data;
		} catch (error) {
			console.error('UPDATE_TEST_TYPE_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to update test type.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

export const deleteTestType = (id: number) => {
	return async () => {
		const toastId = toast.loading('Deleting test type...');
		try {
			const response = await apiConnector('DELETE', DELETE_TEST_TYPE_API(id));
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to delete test type');

			toast.success('Test Type deleted successfully.');
			return response.data;
		} catch (error) {
			console.error('DELETE_TEST_TYPE_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to delete test type.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

const testTypeService = {
	getTestTypes,
	createTestType,
	updateTestType,
	deleteTestType
};

export default testTypeService;