import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useEffect } from 'react';
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
import { recordVisit } from './services/supabase';

// Composant pour enregistrer les visites à chaque changement de page
const PageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Enregistrer une visite à chaque changement de page
    recordVisit();
  }, [location.pathname]);

  return null;
};

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen w-full">
        {/* Suivi des visites */}
        <PageTracker />
        
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
