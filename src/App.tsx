import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';

function App() {
	return (
		<Router>
			<Toaster position="bottom-right" reverseOrder={false} />
			<Routes>
				<Route path="/" element={<Login />} />
				<Route path="/dashboard" element={<Dashboard />} />

				{/* Fallback to Login */}
				<Route path="*" element={<Login />} />
			</Routes>
		</Router>
	);
}

export default App;