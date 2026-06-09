import { apiConnector } from '../apiConnector';
import { toast } from 'react-hot-toast';
import { systemLogEndpoints } from '../apis';

const { GET_SYSTEM_LOGS_API } = systemLogEndpoints;

interface AxiosServiceError {
	response?: {
		data?: {
			message?: string;
		};
	};
	message?: string;
}

export interface SystemLogFilterParams {
	page?: number;
	limit?: number;
	search?: string;
	entity?: string;
	action?: string;
	sortBy?: string;
	sortOrder?: string;
}

export const getSystemLogs = (filterParams: SystemLogFilterParams = {}) => {
	return async () => {
		try {
			// Convert params to string values expected by systemLogQuerySchema
			const params: any = {};
			if (filterParams.page) params.page = String(filterParams.page);
			if (filterParams.limit) params.limit = String(filterParams.limit);
			if (filterParams.search) params.search = filterParams.search;
			if (filterParams.entity) params.entity = filterParams.entity;
			if (filterParams.action) params.action = filterParams.action;
			if (filterParams.sortBy) params.sortBy = filterParams.sortBy;
			if (filterParams.sortOrder) params.sortOrder = filterParams.sortOrder;

			const response = await apiConnector('GET', GET_SYSTEM_LOGS_API, undefined, undefined, params);
			return response.data;
		} catch (error) {
			console.error('GET_SYSTEM_LOGS_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to load system logs.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		}
	};
};

const systemLogService = {
	getSystemLogs
};

export default systemLogService;
