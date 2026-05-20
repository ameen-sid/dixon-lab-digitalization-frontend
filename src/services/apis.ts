const BASE_URL = '/api/v1';

// Auth Endpoints
export const authEndpoints = {
	LOGIN_API: BASE_URL + '/auth/login',
	LOGOUT_API: BASE_URL + '/auth/logout',
};

// Department Endpoints
export const departmentEndpoints = {
	GET_DEPARTMENTS_API: BASE_URL + '/departments',
	CREATE_DEPARTMENT_API: BASE_URL + '/departments',
	UPDATE_DEPARTMENT_API: (id: string | number) => BASE_URL + `/departments/${id}`,
	DELETE_DEPARTMENT_API: (id: string | number) => BASE_URL + `/departments/${id}`,
};

// User Endpoints
export const userEndpoints = {
	GET_USERS_API: BASE_URL + '/users',
	CREATE_USER_API: BASE_URL + '/users',
	UPDATE_USER_API: (id: string | number) => BASE_URL + `/users/${id}`,
	DELETE_USER_API: (id: string | number) => BASE_URL + `/users/${id}`,
};

// Test Type Endpoints
export const testTypeEndpoints = {
	GET_TEST_TYPES_API: BASE_URL + '/test-types',
	CREATE_TEST_TYPE_API: BASE_URL + '/test-types',
	UPDATE_TEST_TYPE_API: (id: string | number) => BASE_URL + `/test-types/${id}`,
	DELETE_TEST_TYPE_API: (id: string | number) => BASE_URL + `/test-types/${id}`,
};