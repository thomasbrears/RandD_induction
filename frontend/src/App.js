import React, { useContext }  from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';

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
import Dashboard from './pages/admin/Dashboard';
import ViewUsers from './pages/admin/ViewUsers';
import UserForm from './pages/admin/AddUser';
import InductionList from './pages/admin/InductionList';
import InductionEdit from './pages/admin/InductionEdit';
import InductionResults from './pages/admin/InductionResults';
import EditUser from './pages/admin/EditUser';

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
            <Route path="/" element={<HomePage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/complete-signin" element={<CompleteSignInPage />} />
            <Route path="*" element={<NotFoundPage />} />

            {/* Restricted to logged-in users */}
            <Route path="/inductions" element={<PrivateRoute component={FormListPage} />} />
            <Route path="/inductionform" element={<PrivateRoute component={InductionFormPage} />} />
            {/* Admin-specific routes restricted to "admin" */}
            <Route path="/admin/dashboard" element={<PrivateRoute component={Dashboard} roleRequired = {[Permissions.ADMIN, Permissions.MANAGER]} />} />
            <Route path="/admin/view-users" element={<PrivateRoute component={ViewUsers} roleRequired={[Permissions.ADMIN, Permissions.MANAGER]} />} />
            <Route path="/admin/add-user" element={<PrivateRoute component={UserForm} roleRequired={[Permissions.ADMIN, Permissions.MANAGER]} />} />
            <Route path="/admin/inductions" element={<PrivateRoute component={InductionList} roleRequired={[Permissions.ADMIN, Permissions.MANAGER]} />} />
            <Route path="/admin/edit-induction" element={<PrivateRoute component={InductionEdit} roleRequired={[Permissions.ADMIN, Permissions.MANAGER]} />} />
            <Route path="/admin/induction-results" element={<PrivateRoute component={InductionResults} roleRequired={[Permissions.ADMIN, Permissions.MANAGER]} />} />
            <Route path="/admin/edit-user" element={<PrivateRoute component={EditUser} roleRequired={[Permissions.ADMIN, Permissions.MANAGER]} />} />
          </Routes>
        </div>
        <Footer />
      </Router>
    </div>
  );
};

export default App;
