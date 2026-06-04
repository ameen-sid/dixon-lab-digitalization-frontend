import { apiConnector } from '../apiConnector';
import { toast } from 'react-hot-toast';
import { capaEndpoints } from '../apis';

const { CREATE_CAPA_API, GET_CAPAS_API, GET_CAPA_BY_ID_API, UPDATE_CAPA_STATUS_API } = capaEndpoints;

interface AxiosServiceError {
	response?: { data?: { message?: string } };
	message?: string;
}

export const createCapa = (data: FormData | Record<string, any>) => {
	return async () => {
		const toastId = toast.loading('Submitting CAPA report...');
		try {
			const isFormData = data instanceof FormData;
			const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined;
			const response = await apiConnector('POST', CREATE_CAPA_API, data, headers);
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to submit CAPA');
			toast.success('CAPA report submitted successfully!');
			return response.data.data || response.data;
		} catch (error) {
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to submit CAPA.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

export const getCapas = () => {
	return async () => {
		try {
			const response = await apiConnector('GET', GET_CAPAS_API);
			return response.data.data || response.data || [];
		} catch (error) {
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to load CAPA reports.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		}
	};
};

export const getCapaById = (id: string | number) => {
	return async () => {
		try {
			const response = await apiConnector('GET', GET_CAPA_BY_ID_API(id));
			return response.data.data || response.data;
		} catch (error) {
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to load CAPA.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		}
	};
};

export const updateCapaStatus = (id: string | number, status: string) => {
	return async () => {
		const toastId = toast.loading('Updating CAPA status...');
		try {
			const response = await apiConnector('PATCH', UPDATE_CAPA_STATUS_API(id), { status });
			toast.success('CAPA status updated!');
			return response.data.data || response.data;
		} catch (error) {
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to update CAPA.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};
