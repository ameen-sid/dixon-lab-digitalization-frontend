import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';

// Import individual dashboard pages to expose clean paths
import AdminDashboard from './pages/admin/AdminDashboard';
import CeoDashboard from './pages/ceo/CeoDashboard';
import HeadDashboard from './pages/head/HeadDashboard';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import EngineerDashboard from './pages/engineer/EngineerDashboard';
import InspectorDashboard from './pages/inspector/InspectorDashboard';
import InspectorDailyChecksheet from './pages/inspector/InspectorDailyChecksheet';
import InspectorChecksheet from './pages/inspector/InspectorChecksheet';
import ManagerEvaluateChecksheet from './pages/manager/ManagerEvaluateChecksheet';
import ReportPreview from './pages/manager/ReportPreview';
import RequesterDashboard from './pages/requester/RequesterDashboard';

function App() {
	const [syncing, setSyncing] = useState(true);

	useEffect(() => {
		const originalSetItem = localStorage.setItem;
		localStorage.setItem = function(key: string, value: string) {
			originalSetItem.call(localStorage, key, value);
			if (key === 'dixon_sample_test_plans' || key === 'dixon_completed_sample_inspections') {
				fetch(`/api/v1/local-storage-sync/${key}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ value })
				}).catch(err => console.error('Failed to sync to database:', key, err));
			}
		};

		const originalRemoveItem = localStorage.removeItem;
		localStorage.removeItem = function(key: string) {
			originalRemoveItem.call(localStorage, key);
			if (key === 'dixon_sample_test_plans' || key === 'dixon_completed_sample_inspections') {
				fetch(`/api/v1/local-storage-sync/${key}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ value: null })
				}).catch(err => console.error('Failed to remove sync key from database:', key, err));
			}
		};

		const syncKeys = async () => {
			try {
				console.log('[Sync] Starting startup synchronization...');
				const keysToSync = ['dixon_sample_test_plans', 'dixon_completed_sample_inspections'];
				for (const key of keysToSync) {
					const localVal = localStorage.getItem(key);
					console.log(`[Sync] Fetching key ${key} from database...`);
					const res = await fetch(`/api/v1/local-storage-sync/${key}`);
					if (res.ok) {
						const data = await res.json();
						console.log(`[Sync] Received database response for ${key}:`, data);
						if (data && data.success) {
							const dbVal = data.value;
							if (dbVal && localVal) {
								try {
									const dbObj = JSON.parse(dbVal);
									const localObj = JSON.parse(localVal);
									const mergedObj = { ...localObj, ...dbObj };
									const mergedVal = JSON.stringify(mergedObj);
									originalSetItem.call(localStorage, key, mergedVal);
									console.log(`[Sync] Merged local and db values for ${key}:`, mergedObj);

									// If merged value is different from db value, sync it back
									if (mergedVal !== dbVal) {
										await fetch(`/api/v1/local-storage-sync/${key}`, {
											method: 'POST',
											headers: { 'Content-Type': 'application/json' },
											body: JSON.stringify({ value: mergedVal })
										});
									}
								} catch (e) {
									originalSetItem.call(localStorage, key, dbVal);
									console.warn(`[Sync] Parsing error for ${key}, fallback to database value.`, e);
								}
							} else if (dbVal) {
								originalSetItem.call(localStorage, key, dbVal);
								console.log(`[Sync] Local storage empty. Loaded database value for ${key}.`);
							} else if (localVal) {
								await fetch(`/api/v1/local-storage-sync/${key}`, {
									method: 'POST',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify({ value: localVal })
								});
								console.log(`[Sync] Database empty. Synced local value for ${key} to server.`);
							} else {
								console.log(`[Sync] Both database and local storage are empty for ${key}.`);
							}
						}
					} else {
						console.error(`[Sync] Server returned error status ${res.status} for ${key}`);
					}
				}
			} catch (err) {
				console.error('[Sync] Failed to sync local storage on startup:', err);
			} finally {
				setSyncing(false);
			}
		};

		syncKeys();
	}, []);

	if (syncing) {
		return (
			<div className="min-h-screen bg-zinc-150 flex flex-col items-center justify-center space-y-4">
				<div className="w-12 h-12 border-4 border-indigo-700 border-t-transparent rounded-full animate-spin"></div>
				<p className="text-zinc-650 text-xs font-bold">Synchronizing laboratory cache with server...</p>
			</div>
		);
	}

	return (
		<Router>
			<Toaster position="bottom-right" reverseOrder={false} />
			<Routes>
				<Route path="/" element={<Login />} />
				
				{/* Dynamic dispatcher route */}
				<Route path="/dashboard" element={<Dashboard />} />

				{/* Role-specific clean path routes */}
				{/* Admin Console clean path routes */}
				<Route path="/admin/dashboard" element={<AdminDashboard />} />
				<Route path="/admin/platform-availability" element={<AdminDashboard />} />
				<Route path="/admin/equipment-availability" element={<AdminDashboard />} />
				<Route path="/admin/departments-management" element={<AdminDashboard />} />
				<Route path="/admin/users-management" element={<AdminDashboard />} />
				<Route path="/admin/test-types" element={<AdminDashboard />} />
				<Route path="/admin/test-categories" element={<AdminDashboard />} />
				<Route path="/admin/test-protocols" element={<AdminDashboard />} />
				<Route path="/admin/product-part-names" element={<AdminDashboard />} />
				<Route path="/admin/suppliers-customers" element={<AdminDashboard />} />
				<Route path="/admin/rd-equipment" element={<AdminDashboard />} />
				<Route path="/ceo/dashboard" element={<CeoDashboard />} />
				<Route path="/head/dashboard" element={<HeadDashboard />} />
				<Route path="/head/sample-tests" element={<HeadDashboard />} />
				<Route path="/head/sample-tests/:id" element={<HeadDashboard />} />
				<Route path="/head/completed-reports" element={<HeadDashboard />} />
				<Route path="/head/completed-reports/:id" element={<HeadDashboard />} />
				<Route path="/head/failure-decision" element={<HeadDashboard />} />
				<Route path="/head/failure-decision/:id" element={<HeadDashboard />} />
				<Route path="/head/capa-reports" element={<HeadDashboard />} />
				<Route path="/manager/dashboard" element={<ManagerDashboard />} />
				<Route path="/manager/approved-requests" element={<ManagerDashboard />} />
				<Route path="/manager/approved-requests/:id" element={<ManagerDashboard />} />
				<Route path="/manager/assigned-samples" element={<ManagerDashboard />} />
				<Route path="/manager/assigned-samples/:planId" element={<ManagerDashboard />} />
				<Route path="/manager/assigned-samples/:planId/sample/:sampleIndex" element={<ManagerDashboard />} />
				<Route path="/manager/capa-management" element={<ManagerDashboard />} />
				<Route path="/manager/capa-management/:id" element={<ManagerDashboard />} />
				<Route path="/manager/test-plans" element={<ManagerDashboard />} />
				<Route path="/manager/test-plans/:id" element={<ManagerDashboard />} />
				<Route path="/manager/evaluate-checksheet/:planKey" element={<ManagerEvaluateChecksheet />} />
				<Route path="/reports/preview" element={<ReportPreview />} />
				<Route path="/engineer/dashboard" element={<EngineerDashboard />} />
				<Route path="/engineer/assigned-samples" element={<EngineerDashboard />} />
				<Route path="/engineer/assigned-samples/:planId" element={<EngineerDashboard />} />
				<Route path="/engineer/assigned-samples/:planId/sample/:sampleIndex" element={<EngineerDashboard />} />
				<Route path="/inspector/dashboard" element={<InspectorDashboard />} />
				<Route path="/inspector/daily-checksheet" element={<InspectorDailyChecksheet />} />
				<Route path="/inspector/checksheet/:planKey" element={<InspectorChecksheet />} />
				
				{/* Requester sub-pages serving unique URL paths */}
				<Route path="/requester" element={<RequesterDashboard />} />
				<Route path="/requester/dashboard" element={<RequesterDashboard />} />
				<Route path="/requester/my-requests" element={<RequesterDashboard />} />
				<Route path="/requester/requests/new" element={<RequesterDashboard />} />
				<Route path="/requester/requests/track" element={<RequesterDashboard />} />
				<Route path="/requester/capa" element={<RequesterDashboard />} />
				<Route path="/requester/capa/new" element={<RequesterDashboard />} />
				<Route path="/requester/capa/details" element={<RequesterDashboard />} />

				{/* Fallback to Login */}
				<Route path="*" element={<Login />} />
			</Routes>
		</Router>
	);
}

export default App;