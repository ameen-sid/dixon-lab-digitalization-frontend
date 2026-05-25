import { apiConnector } from '../apiConnector';
import { toast } from 'react-hot-toast';
import { testCategoryEndpoints } from '../apis';

const { GET_TEST_CATEGORIES_API, CREATE_TEST_CATEGORY_API, UPDATE_TEST_CATEGORY_API, DELETE_TEST_CATEGORY_API } = testCategoryEndpoints;

interface AxiosServiceError {
	response?: {
		data?: {
			message?: string;
		};
	};
	message?: string;
}

export const getTestCategories = () => {
	return async () => {
		try {
			const response = await apiConnector('GET', GET_TEST_CATEGORIES_API);
			return response.data.data || response.data || [];
		} catch (error) {
			console.error('GET_TEST_CATEGORIES_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to load test categories.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		}
	};
};

export const createTestCategory = (name: string, testTypeId: number) => {
	return async () => {
		const toastId = toast.loading('Creating test category...');
		try {
			const response = await apiConnector('POST', CREATE_TEST_CATEGORY_API, {
				name: name.trim(),
				testTypeId
			});
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to create test category');

			toast.success(`Test Category "${name.trim()}" created successfully!`);
			return response.data;
		} catch (error) {
			console.error('CREATE_TEST_CATEGORY_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to create test category.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

export const updateTestCategory = (id: number, name?: string, testTypeId?: number) => {
	return async () => {
		const toastId = toast.loading('Updating test category...');
		try {
			const response = await apiConnector('PATCH', UPDATE_TEST_CATEGORY_API(id), {
				...(name !== undefined && { name: name.trim() }),
				...(testTypeId !== undefined && { testTypeId })
			});
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to update test category');

			toast.success(`Test Category updated successfully!`);
			return response.data;
		} catch (error) {
			console.error('UPDATE_TEST_CATEGORY_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to update test category.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

export const deleteTestCategory = (id: number) => {
	return async () => {
		const toastId = toast.loading('Deleting test category...');
		try {
			const response = await apiConnector('DELETE', DELETE_TEST_CATEGORY_API(id));
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to delete test category');

			toast.success('Test Category deleted successfully.');
			return response.data;
		} catch (error) {
			console.error('DELETE_TEST_CATEGORY_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to delete test category.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

const testCategoryService = {
	getTestCategories,
	createTestCategory,
	updateTestCategory,
	deleteTestCategory
};

export default testCategoryService;