import React, { useContext }  from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async'; // HelmetProvider for dynamicly setting page head including titles

// Toastify message container and style
import { ToastContainer, toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css';

// Pages
import HomePage from './pages/HomePage';
import ContactPage from './pages/ContactPage';
import SignInPage from './pages/SignInPage';
import CompleteSignInPage from './pages/CompleteSignInPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import NotFoundPage from './pages/NotFoundPage';
import FormListPage from './pages/FormListPage';
import InductionFormPage from './pages/InductionFormPage';
import Dashboard from './pages/management/Dashboard';
import ViewUsers from './pages/management/ViewUsers';
import UserForm from './pages/management/AddUser';
import InductionList from './pages/management/InductionList';
import InductionEdit from './pages/management/InductionEdit';
import InductionCreate from './pages/management/InductionCreate';
import InductionResults from './pages/management/InductionResults';
import EditUser from './pages/management/EditUser';
import Settings from './pages/management/Settings';
import ManageAccount from './pages/ManageAccountPage';

// Auth hook and components
import useAuth from './hooks/useAuth';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import Loading from './components/Loading';
import Permissions from './models/Permissions';

// Global style sheet
import './style/Global.css'; 

// PrivateRoute for protecting routes based on roles and authentication
const PrivateRoute = ({ component: Component, roleRequired, ...rest }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading />;
  }


  if (!user) {
    // If the user is not logged in store the current URL and redirect to login
    sessionStorage.setItem('previousUrl', location.pathname);
    return <Navigate to="/signin" />;
  }
  
  // Check role if required
  const hasPermission = roleRequired
    ? Array.isArray(roleRequired)
      ? roleRequired.includes(user.role)
      : user.role === roleRequired
    : true;
  
  if (!hasPermission) {
    return <Navigate to="/" />; // Redirect to homepage if user does not have the required role
  }

  // If authenticated and role matches, render the component
  return <Component {...rest} />;
};

const App = () => {
  return (
    <HelmetProvider>
      <div className="App flex flex-col min-h-screen">
        {/* Toastify message container with default actions*/}
        <ToastContainer
          theme="light" // Set light theme
          position="top-center" // Set default position
          draggable={true} // Allow toasts to be draggable
          closeOnClick={true} // Close toast on click
          autoClose={5000} // Auto close after 5 seconds
          hideProgressBar={false} // Show progress bar
          pauseOnHover={true} // Pause on hover
          pauseOnFocusLoss={false} // Keep toast running even when focus is lost
        />
        <Router>
          <Navbar />
          <ToastContainer/>
          <div className="flex-grow">
            <Routes>
              
              {/* Link redirects on main breadcrumb / link to pages */}
              {/* Redirect /management to /management/dashboard */}
              <Route path="/management" element={<Navigate to="/management/dashboard" />} />
              {/* Redirect /admin to /admin/settings */}
              <Route path="/admin" element={<Navigate to="/admin/settings" />} />
              {/* Redirect /inductions to /inductions/my-inductions */}
              <Route path="/inductions" element={<Navigate to="/inductions/my-inductions" />} />
              {/* Redirect /auth to /auth/signin */}
              <Route path="/auth" element={<Navigate to="/auth/signin" />} />
              {/* Redirect /account to /account/manage */}
              <Route path="/account" element={<Navigate to="/account/manage" />} />
              {/* Redirect /management/users to /management/users/view */}
              <Route path="/management/users" element={<Navigate to="/management/users/view" />} />
              {/* Redirect /management/inductions to /management/inductions/view */}
              <Route path="/management/inductions" element={<Navigate to="/management/inductions/view" />} />
              
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/auth/signin" element={<SignInPage />} />
              <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
              <Route path="/auth/complete-signin" element={<CompleteSignInPage />} />
              <Route path="*" element={<NotFoundPage />} />

              {/* Restricted to logged-in users */}
              <Route path="/inductions/my-inductions" element={<PrivateRoute component={FormListPage} />} />
              <Route path="/induction/take" element={<PrivateRoute component={InductionFormPage} />} />
              <Route path="/account/manage" element={<PrivateRoute component={ManageAccount} />} />

              {/* Management restricted routes for admin and/or mananger */}
              <Route path="/admin/settings" element={<PrivateRoute component={Settings} roleRequired = {[Permissions.ADMIN]} />} />
              <Route path="/management/dashboard" element={<PrivateRoute component={Dashboard} roleRequired = {[Permissions.ADMIN, Permissions.MANAGER]} />} />
              <Route path="/management/users/view" element={<PrivateRoute component={ViewUsers} roleRequired={[Permissions.ADMIN, Permissions.MANAGER]} />} />
              <Route path="/management/users/edit" element={<PrivateRoute component={EditUser} roleRequired={[Permissions.ADMIN, Permissions.MANAGER]} />} />
              <Route path="/management/users/create" element={<PrivateRoute component={UserForm} roleRequired={[Permissions.ADMIN, Permissions.MANAGER]} />} />
              <Route path="/management/inductions/view" element={<PrivateRoute component={InductionList} roleRequired={[Permissions.ADMIN, Permissions.MANAGER]} />} />
              <Route path="/management/inductions/edit" element={<PrivateRoute component={InductionEdit} roleRequired={[Permissions.ADMIN, Permissions.MANAGER]} />} />
              <Route path="/management/inductions/create" element={<PrivateRoute component={InductionCreate} roleRequired={[Permissions.ADMIN, Permissions.MANAGER]} />} />
              <Route path="/management/inductions/results" element={<PrivateRoute component={InductionResults} roleRequired={[Permissions.ADMIN, Permissions.MANAGER]} />} />
            </Routes>
          </div>
          <Footer />
        </Router>
      </div>
    </HelmetProvider>
  );
};

export default App;
