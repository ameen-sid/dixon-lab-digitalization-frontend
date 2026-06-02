import { apiConnector } from '../apiConnector';
import { toast } from 'react-hot-toast';
import { reliabilityChecksheetEndpoints } from '../apis';

const { UPSERT_ENTRY_API, GET_ENTRIES_API } = reliabilityChecksheetEndpoints;

interface AxiosServiceError {
	response?: {
		data?: {
			message?: string;
		};
	};
	message?: string;
}

export const getChecksheetEntries = (planKey: string) => {
	return async () => {
		try {
			const response = await apiConnector('GET', GET_ENTRIES_API(planKey));
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to fetch checksheet entries.');
			return response.data?.data || [];
		} catch (error) {
			console.error('GET_ENTRIES_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to load checksheet entries.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		}
	};
};

export const upsertChecksheetEntry = (planKey: string, date: string, data: any) => {
	return async () => {
		try {
			const response = await apiConnector('POST', UPSERT_ENTRY_API, {
				planKey,
				date,
				data
			});
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to save checksheet entry.');
			return response.data?.data;
		} catch (error) {
			console.error('UPSERT_ENTRY_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to save checksheet entry.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		}
	};
};

const reliabilityChecksheetService = {
	getChecksheetEntries,
	upsertChecksheetEntry
};

export default reliabilityChecksheetService;
