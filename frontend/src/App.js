import React  from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async'; // HelmetProvider for dynamicly setting page head including titles

// Toastify message container and style
import { ToastContainer } from 'react-toastify'; 
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
import ManageUserInductionsPage from './pages/management/ManageUserInductionsPage.jsx';
import InductionList from './pages/management/InductionList';
import InductionEdit from './pages/management/InductionEdit';
import InductionCreate from './pages/management/InductionCreate';
import InductionResults from './pages/management/InductionResults';
import EditUser from './pages/management/EditUser';
import Settings from './pages/management/Settings';
import ContactSubmissions from './pages/management/ContactSubmissions.jsx';
import ManageAccount from './pages/ManageAccountPage';

// Auth hook and components
import useAuth from './hooks/useAuth';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import Loading from './components/Loading';
import Permissions from './models/Permissions';

// Global style sheet
import './style/Global.css'; 

// Private Route for authentication and role-based access
const PrivateRoute = ({ component: Component, roleRequired, ...rest }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    sessionStorage.setItem('previousUrl', location.pathname);
    return <Navigate to="/auth/signin" />;
  }

  // Role-based access control
  const hasPermission = roleRequired
    ? Array.isArray(roleRequired)
      ? roleRequired.includes(user.role)
      : user.role === roleRequired
    : true;
  
  if (!hasPermission) {
    return <Navigate to="/" />;
  }

  return <Component {...rest} />;
};

const App = () => {
  return (
    <HelmetProvider>
      <div className="App flex flex-col min-h-screen">
        {/* Toast notifications */}
        <ToastContainer
          theme="light"
          position="top-center"
          draggable={true}
          closeOnClick={true}
          autoClose={5000}
          hideProgressBar={false}
          pauseOnHover={true}
          pauseOnFocusLoss={false}
        />

        <Router>
          <Navbar />
          <div className="flex-grow">
            <Routes>
              {/* Redirects */}
              <Route path="/management" element={<Navigate to="/management/dashboard" />} />
              <Route path="/admin" element={<Navigate to="/admin/settings" />} />
              <Route path="/inductions" element={<Navigate to="/inductions/my-inductions" />} />
              <Route path="/auth" element={<Navigate to="/auth/signin" />} />
              <Route path="/account" element={<Navigate to="/account/manage" />} />
              <Route path="/management/users" element={<Navigate to="/management/users/view" />} />
              <Route path="/management/inductions" element={<Navigate to="/management/inductions/view" />} />
              
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/auth/signin" element={<SignInPage />} />
              <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
              <Route path="/auth/complete-signin" element={<CompleteSignInPage />} />
              <Route path="*" element={<NotFoundPage />} />

              {/* Protected Routes */}
              <Route path="/inductions/my-inductions" element={<PrivateRoute component={FormListPage} />} />
              <Route path="/induction/take" element={<PrivateRoute component={InductionFormPage} />} />
              <Route path="/account/manage" element={<PrivateRoute component={ManageAccount} />} />

              {/* Management Routes (Restricted) */}
              <Route path="/admin/settings" element={<PrivateRoute component={Settings} roleRequired={[Permissions.ADMIN]} />} />
              <Route path="/management/dashboard" element={<PrivateRoute component={Dashboard} roleRequired={[Permissions.ADMIN, Permissions.MANAGER]} />} />
              <Route path="/management/users/view" element={<PrivateRoute component={ViewUsers} roleRequired={[Permissions.ADMIN, Permissions.MANAGER]} />} />
              <Route path="/management/users/add" element={<PrivateRoute component={UserForm} roleRequired={[Permissions.ADMIN]} />} />
              <Route path="/management/users/edit/:id" element={<PrivateRoute component={EditUser} roleRequired={[Permissions.ADMIN]} />} />
              <Route path="/management/inductions/view" element={<PrivateRoute component={InductionList} roleRequired={[Permissions.ADMIN, Permissions.MANAGER]} />} />
              <Route path="/management/inductions/edit/:id" element={<PrivateRoute component={InductionEdit} roleRequired={[Permissions.ADMIN]} />} />
              <Route path="/management/inductions/create" element={<PrivateRoute component={InductionCreate} roleRequired={[Permissions.ADMIN]} />} />
              <Route path="/management/inductions/results/:id" element={<PrivateRoute component={InductionResults} roleRequired={[Permissions.ADMIN, Permissions.MANAGER]} />} />
              <Route path="/management/users/inductions/:id" element={<PrivateRoute component={ManageUserInductionsPage} roleRequired={[Permissions.ADMIN, Permissions.MANAGER]} />} />
              <Route path="/management/contact-submissions" element={<PrivateRoute component={ContactSubmissions} roleRequired={[Permissions.ADMIN]} />} />
            </Routes>
          </div>
          <Footer />
        </Router>
      </div>
    </HelmetProvider>
  );
};

export default App;