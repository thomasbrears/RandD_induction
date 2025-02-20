import { useState, useEffect } from "react";
import Select from "react-select";
import Permissions from "../models/Permissions";
import { DefaultNewUser } from "../models/User";
import Locations from "../models/Locations";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import useAuth from "../hooks/useAuth";
import "react-datepicker/dist/react-datepicker.css";
import { getAllPositions } from '../api/PositionApi';
import Status from "../models/Status";
import { deleteUser, deactivateUser, reactivateUser } from "../api/UserApi";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ConfirmationModal from './ConfirmationModal';
import { FaUserCheck, FaUserTimes, FaTrashAlt, FaSave, FaUserPlus } from 'react-icons/fa';

export const UserForm = ({ userData = DefaultNewUser, onSubmit }) => {
  const [user, setUser] = useState({ ...DefaultNewUser, position: '' });
  const [actionType, setActionType] = useState(null); // Store whether it's deactivation, reactivation, or deletion
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [setNewAssignedInductions] = useState([]);
  const [positions, setPositions] = useState([]);
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if the current page is the edit page and if the userData has an ID (existing user)
  const isEditPage = location.pathname.includes('/edit');
  const isExistingUser = userData?.uid !== undefined; // Check if it's an existing user

  const userSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email format"),
    locations: z.array(z.string()).min(1, "At least one location is required"),
    newAssignedInductions: z
      .array(
        z.object({
          id: z.string().optional(),
          name: z.string().min(1, "Induction cannot be empty"),
          dueDate: z.date(),
          availableFrom: z.date(),
        })
      )
      .optional()
      .superRefine((inductions, ctx) => {
        if (inductions) {
          const uniqueIds = new Set();
          inductions.forEach((induction, index) => {
            if (induction.id && uniqueIds.has(induction.id)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Duplicate inductions are not allowed",
                path: [index, "id"],
              });
            } else if (induction.id) {
              uniqueIds.add(induction.id);
            }

            if (induction.dueDate < induction.availableFrom) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                  "Due date must be greater than or equal to the available from date.",
                path: [index, "dueDate"],
              });
            }

            const existingInduction = Array.isArray(user.assignedInductions)
              ? user.assignedInductions.find(
                  (existing) => existing.id === induction.id
                )
              : undefined;

            if (
              existingInduction &&
              existingInduction.status !== Status.COMPLETED
            ) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Induction "${induction.name}" already exists and is not completed.`,
                path: [index, "id"],
              });
            }
          });
        }
      }),
  });

  const methods = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: userData,
    mode: "onChange",
  });

  useEffect(() => {
    setUser(userData);
    methods.reset(userData);
    if (userData.uid) {
      methods.trigger();
    }

    // Check if the user is deactivated on page load
    if (userData.disabled) {
      setIsDeactivated(true); // User is deactivated
    } else {
      setIsDeactivated(false); // User is active
    }
  }, [userData, methods]);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const positionsData = await getAllPositions();
        // console.log("Positions data:", positionsData);
        setPositions(positionsData);
      } catch (error) {
        console.error("Error fetching positions:", error);
      }
    };

    fetchPositions();
  }, []);

  // Handle form submission
  const handleSubmit = async (data) => {
    setUser(data);
    const userToSubmit = {
      ...user,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      position: user.position,
      permission: user.permission,
      locations: user.locations,
    };

    await onSubmit(userToSubmit);

    if (!userData.uid) {
      methods.reset(DefaultNewUser);
      setUser(DefaultNewUser);
      setNewAssignedInductions([]);
    } else {
      setUser(userToSubmit);
      methods.reset(user);
      setNewAssignedInductions([]);
    }
  };

  // Handle locations change
  const handleLocationsChange = (selectedOptions) => {
    const selectedValues = selectedOptions
      ? selectedOptions.map((option) => option.value)
      : [];

    methods.setValue("locations", selectedValues, { shouldValidate: true });

    setUser((prevUser) => ({
      ...prevUser,
      locations: selectedValues,
    }));

    methods.trigger("locations");
  };

  // Get available permissions based on the current user's role
  const availablePermissions =
    currentUser?.role === Permissions.ADMIN
      ? Object.values(Permissions)
      : [Permissions.USER];

  // Handle user deactivate/reactivate action
  const handleDeactivateOrReactivate = () => {
    const action = user.disabled ? 'reactivate' : 'deactivate';
    setActionType(action);
    setConfirmDeactivate(true); // Open the modal for confirmation
  };

  // Handle user delete action
  const handleDelete = () => {
    setActionType('delete');
    setConfirmDelete(true); // Open the modal for confirmation
  };

  // Confirm user deactivation or reactivation
  const confirmDeactivationOrReactivation = () => {
    setConfirmDeactivate(false); // Close the modal
  
    const actionPromise =
      actionType === 'deactivate'
        ? deactivateUser(currentUser, user.uid)
        : reactivateUser(currentUser, user.uid);
  
    toast.promise(actionPromise, {
      pending: actionType === 'deactivate'
        ? "Deactivating user..."
        : "Reactivating user...",
      success: actionType === 'deactivate'
        ? "User deactivated successfully!"
        : "User reactivated successfully!",
      error: actionType === 'deactivate'
        ? "Failed to deactivate user."
        : "Failed to reactivate user.",
    });
  
    actionPromise
      .then(() => {
        setUser({
          ...user,
          disabled: actionType === 'deactivate',
        }); // Update state immediately
        setIsDeactivated(actionType === 'deactivate'); // Update the deactivated banner status
      })
      .catch((err) => {
        console.error(err); // Log the error for debugging
      });
  };  

  // Confirm user deletion
  const confirmDeletion = () => {
    setConfirmDelete(false); // Close the modal
  
    if (currentUser && user) {
      const deletePromise = deleteUser(currentUser, user.uid);
  
      toast.promise(deletePromise, {
        pending: "Deleting user...",
        success: "User deleted successfully!",
        error: {
          render({ data }) {
            // Extract error message from the rejected promise
            const errorMessage = data?.response?.data?.message || "An error occurred";
            return errorMessage;
          },
        },
      });
  
      deletePromise
        .then(() => {
          navigate("/management/users/view"); // Redirect after successful deletion
        })
        .catch((err) => {
          console.error(err); // Log the error for debugging
        });
    }
  };  

  return (
    <>
      <div className="flex items-start justify-center pt-8">
        <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-4xl mx-4 md:mx-8">
          {/* Render deactivated banner if the user is deactivated */}
          {isDeactivated && (
            <div className="bg-red-500 text-white p-2 rounded mb-4">This user is currently deactivated and cannot login or complete inductions.</div>
          )}
        <div className="flex justify-between items-center">
          <h1>User Details</h1>
          {/* Render action buttons for existing users for deleting and deactivating/reactivating */}
          {isEditPage && isExistingUser && (
              <div className="flex space-x-2">
                <button
                  className={`text-white px-3 py-2 rounded-md ${user.disabled ? 'bg-green-600' : 'bg-gray-700'}`}
                  onClick={handleDeactivateOrReactivate}
                >
                  {user.disabled ? (
                    <>
                      <FaUserCheck className="inline mr-2" /> Reactivate User
                    </>
                  ) : (
                    <>
                      <FaUserTimes className="inline mr-2" /> Deactivate User
                    </>
                  )}
                </button>
                <button
                  className="text-white bg-red-700 hover:bg-red-900 px-3 py-2 rounded-md"
                  onClick={handleDelete}
                >
                  <FaTrashAlt className="inline mr-2" />Delete User
                </button>
              </div>
            )}
        </div>
          {/* User Details Form */}
          <FormProvider {...methods}>
            <form
              onSubmit={methods.handleSubmit(handleSubmit)}
              className="w-full"
            >
              {/* First Name and Last Name */}
              <div className="flex flex-wrap -mx-3 mb-6">
                <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                  <label
                    className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                    htmlFor="grid-first-name"
                  >
                    First Name:
                  </label>
                  <input
                    className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                    type="text"
                    {...methods.register("firstName")}
                    placeholder="First Name"
                  />
                  {methods.formState.errors.firstName && (
                    <p className="text-red-500 text-xs italic">
                      {methods.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="w-full md:w-1/2 px-3">
                  <label
                    className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                    htmlFor="grid-last-name"
                  >
                    Last Name:
                  </label>
                  <input
                    className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                    type="text"
                    {...methods.register("lastName")}
                    placeholder="Last Name"
                  />
                  {methods.formState.errors.lastName && (
                    <p className="text-red-500 text-xs italic">
                      {methods.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Email and Permission */}
              <div className="flex flex-wrap -mx-3 mb-6">
                <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                  <label
                    className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                    htmlFor="grid-email"
                  >
                    Email:
                  </label>
                  <input
                    className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                    type="email"
                    {...methods.register("email")}
                    placeholder="Email"
                  />
                  {methods.formState.errors.email && (
                    <p className="text-red-500 text-xs italic">
                      {methods.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="w-full md:w-1/2 px-3">
                  <label
                    className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                    htmlFor="grid-permission"
                  >
                    Permission:
                  </label>
                  <select
                    className="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                    value={user.permission}
                    onChange={(e) =>
                      setUser({ ...user, permission: e.target.value })
                    }
                  >
                    {Object.values(availablePermissions).map((perm) => (
                      <option className="text-gray-700" key={perm} value={perm}>
                        {perm.charAt(0).toUpperCase() + perm.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Position dropdown */}
              <div className="flex flex-wrap -mx-3 mb-6">
                <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                  <label
                    className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                    htmlFor="grid-position"
                  >
                    Position:
                  </label>
                  <select
                    className="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                    value={user.position}
                    onChange={(e) => setUser({ ...user, position: e.target.value })}
                  >
                    <option value="" disabled>Select Position</option> {/* Default "Select Position" option */}
                    {positions.length === 0 ? (
                      <option className="text-gray-700">Loading positions...</option>
                    ) : (
                      positions.map((pos) => {
                        const positionName = String(pos.name); // Convert to string if not already
                        return (
                          <option key={pos.id} value={positionName}>
                            {positionName.charAt(0).toUpperCase() + positionName.slice(1)}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>

                {/* Location Multi-Select */}
                <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                  <label
                    className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                    htmlFor="grid-location"
                  >
                    Location:
                  </label>
                  <Select
                    classNamePrefix="custom-select"
                    isMulti
                    options={Object.values(Locations).map((loc) => ({
                      value: loc,
                      label: loc.charAt(0).toUpperCase() + loc.slice(1),
                    }))}
                    value={user.locations.map((loc) => ({
                      value: loc,
                      label: loc.charAt(0).toUpperCase() + loc.slice(1),
                    }))}
                    onChange={handleLocationsChange}
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        backgroundColor: "rgb(229 231 235)",
                        borderColor: "rgb(229 231 235)",
                        padding: "0.3rem",
                        height: "auto",
                        minHeight: "40px",
                        boxShadow: "none",
                        "&:hover": {
                          borderColor: "rgb(156 163 175)",
                        },
                      }),
                      multiValue: (provided) => ({
                        ...provided,
                        backgroundColor: "rgb(209 213 219)",
                      }),
                      option: (provided, state) => ({
                        ...provided,
                        color: state.isSelected ? "white" : "rgb(55 65 81)",
                        backgroundColor: state.isSelected
                          ? "rgb(156 163 175)"
                          : "white",
                        "&:hover": {
                          backgroundColor: "rgb(229 231 235)",
                        },
                      }),
                    }}
                  />
                  {methods.formState.errors.locations && (
                    <p className="text-red-500 text-xs italic">
                      {methods.formState.errors.locations.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button - "Save" for existing user, "Create" for new user */}
              <div className="flex justify-center">
                <button
                  className="text-white bg-gray-700 hover:bg-gray-900 px-3 py-2 rounded-md"
                  type="submit"
                >
                  {userData.uid ? (
                    <>
                      <FaSave className="inline mr-2" /> Save Changes
                    </>
                  ) : (
                    <>
                      <FaUserPlus className="inline mr-2" /> Create User
                    </>
                  )}
                </button>
              </div>
            </form>
          </FormProvider>

          {/* Deactivation/Deletion Confirmation Modal */}
          <ConfirmationModal
            isOpen={confirmDeactivate}
            message={
              actionType === 'deactivate'
                ? "Are you sure you want to deactivate this user?"
                : "Are you sure you want to reactivate this user?"
            }
            subtext={
              actionType === 'deactivate'
                ? "This will prevent the user from loging into the site and completing inductions. The users data and inductions will remain and they can be reactivated at any time."
                : "This will restore the user's access to the platform and they can immediately login and complete inductions."
            }
            onCancel={() => setConfirmDeactivate(false)}
            onConfirm={confirmDeactivationOrReactivation}
            actionLabel={actionType === 'deactivate' ? "Yes, Deactivate User" : "Yes, Reactivate User"}
            cancelLabel="Cancel"
          />

          {/* Deletion Confirmation Modal */}
          <ConfirmationModal
            isOpen={confirmDelete}
            message="Are you sure you want to permanently delete this user?"
            subtext="This action will permanently remove the user and all their associated data and induction records. THIS CANNOT BE UNDONE."
            onCancel={() => setConfirmDelete(false)}
            onConfirm={confirmDeletion}
            actionLabel="Yes, Permanently Delete User"
            cancelLabel="Cancel"
          />
        </div>
      </div>
    </>
  );
};
