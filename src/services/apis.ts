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

// Test Category Endpoints
export const testCategoryEndpoints = {
	GET_TEST_CATEGORIES_API: BASE_URL + '/test-categories',
	CREATE_TEST_CATEGORY_API: BASE_URL + '/test-categories',
	UPDATE_TEST_CATEGORY_API: (id: string | number) => BASE_URL + `/test-categories/${id}`,
	DELETE_TEST_CATEGORY_API: (id: string | number) => BASE_URL + `/test-categories/${id}`,
};

// Test Protocol Endpoints
export const testProtocolEndpoints = {
	GET_TEST_PROTOCOLS_API: BASE_URL + '/test-protocols',
	CREATE_TEST_PROTOCOL_API: BASE_URL + '/test-protocols',
	UPDATE_TEST_PROTOCOL_API: (id: string | number) => BASE_URL + `/test-protocols/${id}`,
	DELETE_TEST_PROTOCOL_API: (id: string | number) => BASE_URL + `/test-protocols/${id}`,
};

// Product Part Endpoints
export const productPartEndpoints = {
	GET_PRODUCT_PARTS_API: BASE_URL + '/product-parts',
	CREATE_PRODUCT_PART_API: BASE_URL + '/product-parts',
	UPDATE_PRODUCT_PART_API: (id: string | number) => BASE_URL + `/product-parts/${id}`,
	DELETE_PRODUCT_PART_API: (id: string | number) => BASE_URL + `/product-parts/${id}`,
};

// Supplier Customer Endpoints
export const supplierCustomerEndpoints = {
	GET_SUPPLIER_CUSTOMERS_API: BASE_URL + '/supplier-customers',
	CREATE_SUPPLIER_CUSTOMER_API: BASE_URL + '/supplier-customers',
	UPDATE_SUPPLIER_CUSTOMER_API: (id: string | number) => BASE_URL + `/supplier-customers/${id}`,
	DELETE_SUPPLIER_CUSTOMER_API: (id: string | number) => BASE_URL + `/supplier-customers/${id}`,
};

// Testing Equipment Endpoints
export const testingEquipmentEndpoints = {
	GET_TESTING_EQUIPMENTS_API: BASE_URL + '/testing-equipments',
	CREATE_TESTING_EQUIPMENT_API: BASE_URL + '/testing-equipments',
	UPDATE_TESTING_EQUIPMENT_API: (id: string | number) => BASE_URL + `/testing-equipments/${id}`,
	DELETE_TESTING_EQUIPMENT_API: (id: string | number) => BASE_URL + `/testing-equipments/${id}`,
};

// Test Request Endpoints
export const testRequestEndpoints = {
	GET_TEST_REQUESTS_API: BASE_URL + '/test-requests',
	CREATE_TEST_REQUEST_API: BASE_URL + '/test-requests',
	GET_TEST_REQUEST_DETAILS_API: (id: string | number) => BASE_URL + `/test-requests/${id}`,
	UPDATE_TEST_REQUEST_STATUS_API: (id: string | number) => BASE_URL + `/test-requests/${id}`,
	SAVE_SAMPLE_INSPECTION_API: (id: string | number) => BASE_URL + `/test-requests/${id}/sample-inspections`,
};