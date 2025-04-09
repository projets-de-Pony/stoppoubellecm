import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ReportsPage from './pages/ReportsPage';
import NewReportPage from './pages/NewReportPage';
import LoginForm from './pages/LoginForm';
import RegisterForm from './pages/RegisterForm';
import ContributorDashboard from './pages/ContributorDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen w-full">
        <Navbar />
        
        <main className="flex-grow w-full">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/report/new" element={<NewReportPage />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/dashboard" element={<ContributorDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            {/* Autres routes à ajouter plus tard */}
          </Routes>
        </main>
        
        <Footer />
      </div>
      
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </Router>
  );
}

export default App;
