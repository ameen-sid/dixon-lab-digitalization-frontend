import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

export const axiosInstance = axios.create({});

axiosInstance.interceptors.request.use((config) => {
	const token = localStorage.getItem('token');
	if (token) config.headers['Authorization'] = `Bearer ${token}`;
	return config;
}, (error) => Promise.reject(error));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiConnector = <TResponse = any, TBody = any, TParams = any>(
  method: string,
  url: string,
  bodyData?: TBody,
  headers?: AxiosRequestConfig['headers'],
  params?: TParams
): Promise<AxiosResponse<TResponse>> => {
  return axiosInstance({
    method: method as AxiosRequestConfig['method'],
    url,
    data: bodyData ?? null,
    headers: headers ?? undefined,
    params: params ?? undefined,
  });
};