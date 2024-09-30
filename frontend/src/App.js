import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
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
import useAuth from './hooks/useAuth';
import './style/Global.css';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import Permissions from './models/Permissions';

// PrivateRoute for protecting routes based on roles and authentication
const PrivateRoute = ({ component: Component, roleRequired, ...rest }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return user && (!roleRequired || user.role === roleRequired) ? (
    <Component {...rest} /> 
  ) : (
    <Navigate to="/signin" />
  );
};

const App = () => {
  return (
    <div className="App flex flex-col min-h-screen">
      <Router>
        <Navbar />
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
            <Route path="/admin/dashboard" element={<PrivateRoute component={Dashboard} roleRequired = {Permissions.ADMIN} />} />
            <Route path="/admin/view-users" element={<PrivateRoute component={ViewUsers} roleRequired={Permissions.ADMIN} />} />
            <Route path="/admin/add-user" element={<PrivateRoute component={UserForm} roleRequired={Permissions.ADMIN} />} />
            <Route path="/admin/inductions" element={<PrivateRoute component={InductionList} roleRequired={Permissions.ADMIN} />} />
            <Route path="/admin/edit-induction" element={<PrivateRoute component={InductionEdit} roleRequired={Permissions.ADMIN} />} />
            <Route path="/admin/induction-results" element={<PrivateRoute component={InductionResults} roleRequired={Permissions.ADMIN} />} />
          </Routes>
        </div>
        <Footer />
      </Router>
    </div>
  );
};

export default App;
