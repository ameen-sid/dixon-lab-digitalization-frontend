import { apiConnector } from '../apiConnector';
import { toast } from 'react-hot-toast';
import { platformAvailabilityEndpoints } from '../apis';

const { 
	GET_PLATFORMS_API, 
	TOGGLE_PLATFORM_API, 
	RESERVE_PLATFORMS_API, 
	RELEASE_PLATFORMS_API 
} = platformAvailabilityEndpoints;

interface AxiosServiceError {
	response?: {
		data?: {
			message?: string;
		};
	};
	message?: string;
}

export const getPlatforms = () => {
	return async () => {
		try {
			const response = await apiConnector('GET', GET_PLATFORMS_API);
			return response.data.data || [];
		} catch (error) {
			console.error('GET_PLATFORMS_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to load platform tracking telemetry.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		}
	};
};

export const togglePlatform = (stationNo: number, platformNo: number) => {
	return async () => {
		const toastId = toast.loading(`Toggling S${stationNo} Platform #${platformNo} status...`);
		try {
			const response = await apiConnector('POST', TOGGLE_PLATFORM_API, { stationNo, platformNo });
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to toggle platform.');

			toast.success(`Platform S${stationNo} #${platformNo} toggled successfully.`);
			return response.data.data;
		} catch (error) {
			console.error('TOGGLE_PLATFORM_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to toggle platform state.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

export const reservePlatforms = (
	stationNo: number,
	platformNos: number[],
	testRequestId: number,
	occupiedBy: string,
	modelNo: string,
	occupiedUntil: string
) => {
	return async () => {
		const toastId = toast.loading(`Reserving Platform channels for test...`);
		try {
			const response = await apiConnector('POST', RESERVE_PLATFORMS_API, {
				stationNo,
				platformNos,
				testRequestId,
				occupiedBy,
				modelNo,
				occupiedUntil
			});
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to reserve platforms');

			toast.success(`Platform S${stationNo} (Platforms: ${platformNos.join(', ')}) reserved successfully!`);
			return response.data.data;
		} catch (error) {
			console.error('RESERVE_PLATFORMS_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to reserve platform channels.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

export const releasePlatforms = (stationNo: number, platformNos: number[]) => {
	return async () => {
		const toastId = toast.loading(`Releasing Platform channels...`);
		try {
			const response = await apiConnector('POST', RELEASE_PLATFORMS_API, { stationNo, platformNos });
			const isSuccess = response.data?.success ?? true;
			if (!isSuccess) throw new Error(response.data?.message || 'Failed to release platforms');

			toast.success(`Platform S${stationNo} (Platforms: ${platformNos.join(', ')}) released successfully.`);
			return response.data.data;
		} catch (error) {
			console.error('RELEASE_PLATFORMS_API Error: ', error);
			const err = error as AxiosServiceError;
			const errMsg = err.response?.data?.message || err.message || 'Failed to release platform channels.';
			toast.error(errMsg);
			throw new Error(errMsg, { cause: error });
		} finally {
			toast.dismiss(toastId);
		}
	};
};

const platformAvailabilityService = {
	getPlatforms,
	togglePlatform,
	reservePlatforms,
	releasePlatforms
};

export default platformAvailabilityService;
