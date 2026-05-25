import { apiConnector } from '../apiConnector';
import { toast } from 'react-hot-toast';
import { supplierCustomerEndpoints } from '../apis';

const { GET_SUPPLIER_CUSTOMERS_API, CREATE_SUPPLIER_CUSTOMER_API, UPDATE_SUPPLIER_CUSTOMER_API, DELETE_SUPPLIER_CUSTOMER_API } = supplierCustomerEndpoints;

interface AxiosServiceError {
	response?: {
		data?: {
			message?: string;
		};
	};
	message?: string;
}

export const getSupplierCustomers = (params?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string }) => {
	return async () => {
		try {
			const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : '';
			const response = await apiConnector('GET', `${GET_SUPPLIER_CUSTOMERS_API}${query}`);
			return response.data.data || response.data || [];
		} catch (error) {
			console.error('GET_SUPPLIER_CUSTOMERS_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to load supplier customers.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		}
	};
};

export const createSupplierCustomer = (name: string) => {
	return async () => {
		const toastId = toast.loading('Creating supplier/customer partner...');
		try {
			const response = await apiConnector('POST', CREATE_SUPPLIER_CUSTOMER_API, {
				name: name.trim()
			});
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to create supplier/customer partner');

			toast.success(`Partner "${name.trim()}" registered successfully!`);
			return response.data.data || response.data;
		} catch (error) {
			console.error('CREATE_SUPPLIER_CUSTOMER_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to register supplier/customer partner.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

export const updateSupplierCustomer = (id: number, name: string) => {
	return async () => {
		const toastId = toast.loading('Updating partner information...');
		try {
			const response = await apiConnector('PATCH', UPDATE_SUPPLIER_CUSTOMER_API(id), {
				name: name.trim()
			});
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to update partner information');

			toast.success(`Partner updated successfully!`);
			return response.data.data || response.data;
		} catch (error) {
			console.error('UPDATE_SUPPLIER_CUSTOMER_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to update partner information.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

export const deleteSupplierCustomer = (id: number) => {
	return async () => {
		const toastId = toast.loading('Deleting supplier/customer partner...');
		try {
			const response = await apiConnector('DELETE', DELETE_SUPPLIER_CUSTOMER_API(id));
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to delete partner');

			toast.success('Partner deleted successfully.');
			return response.data;
		} catch (error) {
			console.error('DELETE_SUPPLIER_CUSTOMER_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to delete partner.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

const supplierCustomerService = {
	getSupplierCustomers,
	createSupplierCustomer,
	updateSupplierCustomer,
	deleteSupplierCustomer
};

export default supplierCustomerService;