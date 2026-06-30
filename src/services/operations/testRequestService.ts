import { apiConnector } from '../apiConnector';
import { toast } from 'react-hot-toast';
import { testRequestEndpoints } from '../apis';

const { GET_TEST_REQUESTS_API, CREATE_TEST_REQUEST_API, GET_TEST_REQUEST_DETAILS_API, UPDATE_TEST_REQUEST_STATUS_API, SAVE_SAMPLE_INSPECTION_API, SAVE_SAMPLE_REPORT_API } = testRequestEndpoints;

interface AxiosServiceError {
	response?: {
		data?: {
			message?: string;
		};
	};
	message?: string;
}

export const getTestRequests = (status?: string, search?: string) => {
	return async () => {
		try {
			const queryParams = new URLSearchParams();
			if (status) queryParams.append('status', status);
			if (search) queryParams.append('search', search);

			const url = `${GET_TEST_REQUESTS_API}?${queryParams.toString()}`;
			const response = await apiConnector('GET', url);
			return response.data.data || response.data || [];
		} catch (error) {
			console.error('GET_TEST_REQUESTS_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to load testing requests.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		}
	};
};

export const createTestRequest = (formData: FormData) => {
	return async () => {
		const toastId = toast.loading('Submitting test request plan...');
		try {
			const response = await apiConnector(
				'POST', 
				CREATE_TEST_REQUEST_API, 
				formData
			);
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to submit testing request');

			toast.success('Testing request submitted successfully!');
			return response.data.data || response.data;
		} catch (error) {
			console.error('CREATE_TEST_REQUEST_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to submit testing request.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

export const getTestRequestDetails = (id: string | number) => {
	return async () => {
		try {
			const response = await apiConnector('GET', GET_TEST_REQUEST_DETAILS_API(id));
			return response.data.data || response.data;
		} catch (error) {
			console.error('GET_TEST_REQUEST_DETAILS_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to load testing request details.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		}
	};
};

export const updateTestRequestStatus = (id: string | number, status: string, remarks?: string, assignedToId?: number) => {
	return async () => {
		const toastId = toast.loading('Updating request status...');
		try {
			const response = await apiConnector('PATCH', UPDATE_TEST_REQUEST_STATUS_API(id), { status, remarks, assignedToId });
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to update status');

			toast.success('Testing request status updated successfully!');
			return response.data.data || response.data;
		} catch (error) {
			console.error('UPDATE_TEST_REQUEST_STATUS_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to update testing request.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

export const saveSampleInspection = (id: string | number, payload: FormData) => {
	return async () => {
		const toastId = toast.loading('Saving sample inspection...');
		try {
			const response = await apiConnector('POST', SAVE_SAMPLE_INSPECTION_API(id), payload);
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to save sample inspection');

			toast.success('Sample inspection saved to database!');
			return response.data.data || response.data;
		} catch (error) {
			console.error('SAVE_SAMPLE_INSPECTION Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to save sample inspection.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

export const saveSampleReport = (id: string | number, payload: FormData) => {
	return async () => {
		const toastId = toast.loading('Saving sample report...');
		try {
			const response = await apiConnector('POST', SAVE_SAMPLE_REPORT_API(id), payload);
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to save sample report');

			toast.success('Sample report saved to database!');
			return response.data.data || response.data;
		} catch (error) {
			console.error('SAVE_SAMPLE_REPORT Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to save sample report.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

const testRequestService = {
	getTestRequests,
	createTestRequest,
	getTestRequestDetails,
	updateTestRequestStatus,
	saveSampleInspection,
	saveSampleReport
};

export default testRequestService;
