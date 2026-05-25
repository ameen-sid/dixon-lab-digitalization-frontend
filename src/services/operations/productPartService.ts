import { apiConnector } from '../apiConnector';
import { toast } from 'react-hot-toast';
import { productPartEndpoints } from '../apis';

const { GET_PRODUCT_PARTS_API, CREATE_PRODUCT_PART_API, UPDATE_PRODUCT_PART_API, DELETE_PRODUCT_PART_API } = productPartEndpoints;

interface AxiosServiceError {
	response?: {
		data?: {
			message?: string;
		};
	};
	message?: string;
}

export const getProductParts = (params?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string }) => {
	return async () => {
		try {
			const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : '';
			const response = await apiConnector('GET', `${GET_PRODUCT_PARTS_API}${query}`);
			return response.data.data || response.data || [];
		} catch (error) {
			console.error('GET_PRODUCT_PARTS_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to load product parts.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		}
	};
};

export const createProductPart = (name: string) => {
	return async () => {
		const toastId = toast.loading('Creating product part...');
		try {
			const response = await apiConnector('POST', CREATE_PRODUCT_PART_API, {
				name: name.trim()
			});
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to create product part');

			toast.success(`Product part "${name.trim()}" created successfully!`);
			return response.data.data || response.data;
		} catch (error) {
			console.error('CREATE_PRODUCT_PART_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to create product part.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

export const updateProductPart = (id: number, name: string) => {
	return async () => {
		const toastId = toast.loading('Updating product part...');
		try {
			const response = await apiConnector('PATCH', UPDATE_PRODUCT_PART_API(id), {
				name: name.trim()
			});
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to update product part');

			toast.success(`Product part updated successfully!`);
			return response.data.data || response.data;
		} catch (error) {
			console.error('UPDATE_PRODUCT_PART_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to update product part.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

export const deleteProductPart = (id: number) => {
	return async () => {
		const toastId = toast.loading('Deleting product part...');
		try {
			const response = await apiConnector('DELETE', DELETE_PRODUCT_PART_API(id));
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to delete product part');

			toast.success('Product part deleted successfully.');
			return response.data;
		} catch (error) {
			console.error('DELETE_PRODUCT_PART_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to delete product part.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

const productPartService = {
	getProductParts,
	createProductPart,
	updateProductPart,
	deleteProductPart
};

export default productPartService;