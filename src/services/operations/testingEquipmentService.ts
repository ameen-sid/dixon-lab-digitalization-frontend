import { apiConnector } from '../apiConnector';
import { toast } from 'react-hot-toast';
import { testingEquipmentEndpoints } from '../apis';

const { GET_TESTING_EQUIPMENTS_API, CREATE_TESTING_EQUIPMENT_API, UPDATE_TESTING_EQUIPMENT_API, DELETE_TESTING_EQUIPMENT_API, RESERVE_EQUIPMENT_API, RELEASE_EQUIPMENT_API, GET_WEEKLY_ANALYTICS_API } = testingEquipmentEndpoints;

interface AxiosServiceError {
	response?: {
		data?: {
			message?: string;
		};
	};
	message?: string;
}

export const getTestingEquipments = (params?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string }) => {
	return async () => {
		try {
			const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : '';
			const response = await apiConnector('GET', `${GET_TESTING_EQUIPMENTS_API}${query}`);
			return response.data.data || response.data || [];
		} catch (error) {
			console.error('GET_TESTING_EQUIPMENTS_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to load testing equipment.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		}
	};
};

export const createTestingEquipment = (name: string, calibrationDueDate: string | null, status?: string) => {
	return async () => {
		const toastId = toast.loading('Creating testing equipment...');
		try {
			const response = await apiConnector('POST', CREATE_TESTING_EQUIPMENT_API, {
				name: name.trim(),
				calibrationDueDate,
				status
			});
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to create testing equipment');

			toast.success(`Equipment "${name.trim()}" created successfully!`);
			return response.data.data || response.data;
		} catch (error) {
			console.error('CREATE_TESTING_EQUIPMENT_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to create testing equipment.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

export const updateTestingEquipment = (id: number, name?: string, calibrationDueDate?: string | null, status?: string) => {
	return async () => {
		const toastId = toast.loading('Updating testing equipment...');
		try {
			const response = await apiConnector('PATCH', UPDATE_TESTING_EQUIPMENT_API(id), {
				...(name !== undefined && { name: name.trim() }),
				...(calibrationDueDate !== undefined && { calibrationDueDate }),
				...(status !== undefined && { status })
			});
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to update testing equipment');

			toast.success(`Testing equipment updated successfully!`);
			return response.data.data || response.data;
		} catch (error) {
			console.error('UPDATE_TESTING_EQUIPMENT_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to update testing equipment.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

export const deleteTestingEquipment = (id: number) => {
	return async () => {
		const toastId = toast.loading('Deleting testing equipment...');
		try {
			const response = await apiConnector('DELETE', DELETE_TESTING_EQUIPMENT_API(id));
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to delete testing equipment');

			toast.success('Testing equipment deleted successfully.');
			return response.data;
		} catch (error) {
			console.error('DELETE_TESTING_EQUIPMENT_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to delete testing equipment.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

export const reserveEquipment = (
	id: number,
	testRequestId: number,
	occupiedBy: string,
	modelNo: string,
	occupiedUntil: string
) => {
	return async () => {
		const toastId = toast.loading('Reserving testing equipment...');
		try {
			const response = await apiConnector('POST', RESERVE_EQUIPMENT_API, {
				id,
				testRequestId,
				occupiedBy,
				modelNo,
				occupiedUntil
			});
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to reserve equipment');

			toast.success(`Equipment reserved successfully!`);
			return response.data.data;
		} catch (error) {
			console.error('RESERVE_EQUIPMENT_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to reserve equipment.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

export const releaseEquipment = (id: number) => {
	return async () => {
		const toastId = toast.loading('Releasing testing equipment...');
		try {
			const response = await apiConnector('POST', RELEASE_EQUIPMENT_API, { id });
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to release equipment');

			toast.success(`Equipment released successfully.`);
			return response.data.data;
		} catch (error) {
			console.error('RELEASE_EQUIPMENT_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to release equipment.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

export const getWeeklyEquipmentAnalytics = (month: string, equipmentId = '', testTypeId = '') => {
	return async () => {
		try {
			let url = `${GET_WEEKLY_ANALYTICS_API}?month=${month}`;
			if (equipmentId) url += `&equipmentId=${equipmentId}`;
			if (testTypeId) url += `&testTypeId=${testTypeId}`;
			const response = await apiConnector('GET', url);
			return response.data.data || [];
		} catch (error) {
			console.error('GET_WEEKLY_ANALYTICS_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to load weekly equipment utilization analytics.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		}
	};
};

const testingEquipmentService = {
	getTestingEquipments,
	createTestingEquipment,
	updateTestingEquipment,
	deleteTestingEquipment,
	reserveEquipment,
	releaseEquipment,
	getWeeklyEquipmentAnalytics
};

export default testingEquipmentService;