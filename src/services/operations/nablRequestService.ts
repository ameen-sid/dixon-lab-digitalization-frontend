import { apiConnector } from '../apiConnector';
import { toast } from 'react-hot-toast';
import { nablRequestEndpoints } from '../apis';

const { 
	GET_NABL_REQUESTS_API, 
	CREATE_NABL_REQUEST_API, 
	GET_NABL_REQUEST_DETAILS_API, 
	UPDATE_NABL_REQUEST_STATUS_API,
	SAVE_NABL_TEST_PLAN_API
} = nablRequestEndpoints;

interface AxiosServiceError {
	response?: {
		data?: {
			message?: string;
		};
	};
	message?: string;
}

export const getNablRequests = (status?: string, search?: string) => {
	return async () => {
		try {
			const queryParams = new URLSearchParams();
			if (status) queryParams.append('status', status);
			if (search) queryParams.append('search', search);

			const url = `${GET_NABL_REQUESTS_API}?${queryParams.toString()}`;
			const response = await apiConnector('GET', url);
			return response.data.data || response.data || [];
		} catch (error) {
			console.error('GET_NABL_REQUESTS_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to load NABL requests.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		}
	};
};

export const createNablRequest = (formData: FormData) => {
	return async () => {
		const toastId = toast.loading('Submitting NABL test request...');
		try {
			const response = await apiConnector(
				'POST', 
				CREATE_NABL_REQUEST_API, 
				formData
			);
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to submit NABL request');

			toast.success('NABL request submitted successfully!');
			return response.data.data || response.data;
		} catch (error) {
			console.error('CREATE_NABL_REQUEST_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to submit NABL request.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

export const getNablRequestDetails = (id: string | number) => {
	return async () => {
		try {
			const response = await apiConnector('GET', GET_NABL_REQUEST_DETAILS_API(id));
			return response.data.data || response.data;
		} catch (error) {
			console.error('GET_NABL_REQUEST_DETAILS_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to load NABL request details.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		}
	};
};

export const updateNablRequestStatus = (id: string | number, status: string, remarks?: string, assignedToId?: number) => {
	return async () => {
		const toastId = toast.loading('Updating NABL request status...');
		try {
			const response = await apiConnector('PATCH', UPDATE_NABL_REQUEST_STATUS_API(id), { status, remarks, assignedToId });
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to update NABL status');

			toast.success('NABL request status updated successfully!');
			return response.data.data || response.data;
		} catch (error) {
			console.error('UPDATE_NABL_REQUEST_STATUS_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to update NABL request.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

export const saveNablTestPlan = (id: string | number, formData: FormData) => {
	return async () => {
		const toastId = toast.loading('Saving NABL test plan configuration...');
		try {
			const response = await apiConnector('POST', SAVE_NABL_TEST_PLAN_API(id), formData);
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to save NABL test plan');

			toast.success('NABL test plan saved successfully!');
			return response.data.data || response.data;
		} catch (error) {
			console.error('SAVE_NABL_TEST_PLAN_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to save NABL test plan.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

const nablRequestService = {
	getNablRequests,
	createNablRequest,
	getNablRequestDetails,
	updateNablRequestStatus,
	saveNablTestPlan
};

export default nablRequestService;
