import { apiConnector } from '../apiConnector';
import { toast } from 'react-hot-toast';
import { testProtocolEndpoints } from '../apis';

const { GET_TEST_PROTOCOLS_API, CREATE_TEST_PROTOCOL_API, UPDATE_TEST_PROTOCOL_API, DELETE_TEST_PROTOCOL_API } = testProtocolEndpoints;

interface AxiosServiceError {
	response?: {
		data?: {
			message?: string;
		};
	};
	message?: string;
}

export const getTestProtocols = () => {
	return async () => {
		try {
			const response = await apiConnector('GET', GET_TEST_PROTOCOLS_API);
			return response.data.data || response.data || [];
		} catch (error) {
			console.error('GET_TEST_PROTOCOLS_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to load test protocols.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		}
	};
};

export const createTestProtocol = (
	name: string,
	testTypeId: number,
	testCategoryId: number,
	productType: string,
	testMethod: string,
	judgementCriteria: string
) => {
	return async () => {
		const toastId = toast.loading('Creating test protocol...');
		try {
			const response = await apiConnector('POST', CREATE_TEST_PROTOCOL_API, {
				name: name.trim(),
				testTypeId,
				testCategoryId,
				productType: productType.trim(),
				testMethod: testMethod.trim(),
				judgementCriteria: judgementCriteria.trim()
			});
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to create test protocol');

			toast.success(`Test Protocol "${name.trim()}" created successfully!`);
			return response.data;
		} catch (error) {
			console.error('CREATE_TEST_PROTOCOL_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to create test protocol.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

export const updateTestProtocol = (
	id: number,
	name?: string,
	testTypeId?: number,
	testCategoryId?: number,
	productType?: string,
	testMethod?: string,
	judgementCriteria?: string
) => {
	return async () => {
		const toastId = toast.loading('Updating test protocol...');
		try {
			const response = await apiConnector('PATCH', UPDATE_TEST_PROTOCOL_API(id), {
				...(name !== undefined && { name: name.trim() }),
				...(testTypeId !== undefined && { testTypeId }),
				...(testCategoryId !== undefined && { testCategoryId }),
				...(productType !== undefined && { productType: productType.trim() }),
				...(testMethod !== undefined && { testMethod: testMethod.trim() }),
				...(judgementCriteria !== undefined && { judgementCriteria: judgementCriteria.trim() })
			});
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to update test protocol');

			toast.success(`Test Protocol updated successfully!`);
			return response.data;
		} catch (error) {
			console.error('UPDATE_TEST_PROTOCOL_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to update test protocol.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

export const deleteTestProtocol = (id: number) => {
	return async () => {
		const toastId = toast.loading('Deleting test protocol...');
		try {
			const response = await apiConnector('DELETE', DELETE_TEST_PROTOCOL_API(id));
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to delete test protocol');

			toast.success('Test Protocol deleted successfully.');
			return response.data;
		} catch (error) {
			console.error('DELETE_TEST_PROTOCOL_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to delete test protocol.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

const testProtocolService = {
	getTestProtocols,
	createTestProtocol,
	updateTestProtocol,
	deleteTestProtocol
};

export default testProtocolService;