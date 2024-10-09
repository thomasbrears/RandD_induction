import { useState, useEffect } from "react";
import Select from "react-select";
import Permissions from "../models/Permissions";
import { DefaultNewUser } from "../models/User";
import Positions from "../models/Positions";
import Locations from "../models/Locations";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import useAuth from "../hooks/useAuth";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getAllInductions } from "../api/InductionApi";
import { DefaultNewAssignedInduction } from "../models/AssignedInduction";
import AssignedInductions from "./AssignedInductions";
import Status from "../models/Status";

export const UserForm = ({ userData = DefaultNewUser, onSubmit }) => {
  const [user, setUser] = useState(DefaultNewUser);
  const [availableInductions, setAvailableInductions] = useState([]);
  const [newAssignedInductions, setNewAssignedInductions] = useState([]);
  const { user: currentUser } = useAuth();

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
    const fetchInductions = async () => {
      if (currentUser) {
        const inductions = await getAllInductions(currentUser);
        setAvailableInductions(inductions);
      }
    };
    fetchInductions();
  }, [currentUser]);

  useEffect(() => {
    setUser(userData);
    methods.reset(userData);
    if (userData.uid) {
      methods.trigger();
    }
  }, [userData, methods]);

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
      assignedInductions: [
        ...(user.assignedInductions || []),
        ...(data.newAssignedInductions || []).map((induction) => ({
          ...DefaultNewAssignedInduction,
          ...induction,
        })),
      ],
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

  const handleAddInduction = () => {
    const newInduction = {
      ...DefaultNewAssignedInduction,
      dueDate: new Date(),
      availableFrom: new Date(),
    };
    const updatedInductions = [...newAssignedInductions, newInduction];
    setNewAssignedInductions(updatedInductions);
    methods.setValue("newAssignedInductions", updatedInductions, {
      shouldValidate: true,
    });
  };

  const handleRemoveInduction = (index) => {
    const updatedInductions = newAssignedInductions.filter(
      (_, i) => i !== index
    );
    setNewAssignedInductions(updatedInductions);
    methods.setValue("newAssignedInductions", updatedInductions, {
      shouldValidate: true,
    });
  };

  const handleInductionChange = (index, field, value, label) => {
    const updatedInductions = [...newAssignedInductions];
    if (!updatedInductions[index]) {
      updatedInductions[index] = { ...DefaultNewAssignedInduction };
    }
    updatedInductions[index][field] = value;
    if (field === "id" && label) {
      updatedInductions[index].name = label;
    }
    setNewAssignedInductions(updatedInductions);
    methods.setValue("newAssignedInductions", updatedInductions, {
      shouldValidate: true,
    });
  };

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

  const availablePermissions =
    currentUser?.role === Permissions.ADMIN
      ? Object.values(Permissions)
      : [Permissions.USER];

  return (
    <>
      <div className="flex items-start justify-center pt-8">
        <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-4xl mx-4 md:mx-8">
          <div>
            <h1>User Details</h1>
          </div>
          <FormProvider {...methods}>
            <form
              onSubmit={methods.handleSubmit(handleSubmit)}
              className="w-full"
            >
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
                    onChange={(e) =>
                      setUser({ ...user, position: e.target.value })
                    }
                  >
                    {Object.values(Positions).map((pos) => (
                      <option className="text-gray-700" key={pos} value={pos}>
                        {pos.charAt(0).toUpperCase() + pos.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
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

              <div className="w-full md:w-full px-3 flex justify-between items-center">
                <h1 className="text-left flex-grow">Assign Inductions</h1>
                <button
                  type="button"
                  onClick={handleAddInduction}
                  className="text-white bg-gray-800 px-3 py-2 rounded-md"
                >
                  Add Induction
                </button>
              </div>

              <div className="bg-gray-100 p-4 rounded-md mt-4 mb-4">
                {newAssignedInductions.map((induction, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Select
                        options={availableInductions.map((ind) => ({
                          value: ind.id,
                          label: ind.name,
                        }))}
                        onChange={(selected) =>
                          handleInductionChange(
                            index,
                            "id",
                            selected.value,
                            selected.label
                          )
                        }
                        value={
                          availableInductions.find(
                            (ind) => ind.id === induction.id
                          )
                            ? {
                                value: induction.id,
                                label: availableInductions.find(
                                  (ind) => ind.id === induction.id
                                ).name,
                              }
                            : null
                        }
                        className="flex-1 w-3/4"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveInduction(index)}
                        className="text-white bg-gray-800 px-3 py-2 rounded-md"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="flex flex-col md:flex-row space-x-0 md:space-x-4 mb-2">
                      <div className="flex items-center w-full mb-2 md:mb-0">
                        <label
                          className="block uppercase tracking-wide text-gray-700 text-xs font-bold mr-2"
                          htmlFor="available-from"
                        >
                          Available From:
                        </label>
                        <DatePicker
                          className="flex-grow h-10 border border-gray-300 bg-white rounded-md"
                          selected={induction.availableFrom || new Date()}
                          onChange={(date) =>
                            handleInductionChange(index, "availableFrom", date)
                          }
                          placeholderText="Available From"
                        />
                      </div>

                      <div className="flex items-center w-full mb-2 md:mb-0">
                        <label
                          className="block uppercase tracking-wide text-gray-700 text-xs font-bold mr-2"
                          htmlFor="due-date"
                        >
                          Due Date:
                        </label>
                        <DatePicker
                          className="flex-grow h-10 border border-gray-300 bg-white rounded-md"
                          selected={induction.dueDate || new Date()}
                          onChange={(date) =>
                            handleInductionChange(index, "dueDate", date)
                          }
                          placeholderText="Due Date"
                        />
                      </div>
                    </div>
                    {methods.formState.errors.newAssignedInductions?.[index]
                      ?.dueDate && (
                      <p className="text-red-500 text-xs italic mt-2">
                        {
                          methods.formState.errors.newAssignedInductions[index]
                            .dueDate.message
                        }
                      </p>
                    )}
                    {methods.formState.errors.newAssignedInductions?.[index]
                      ?.id && (
                      <p className="text-red-500 text-xs italic mt-2">
                        {
                          methods.formState.errors.newAssignedInductions[index]
                            .id.message
                        }
                      </p>
                    )}
                    {methods.formState.errors.newAssignedInductions?.[index]
                      ?.name && (
                      <p className="text-red-500 text-xs italic mt-2">
                        {
                          methods.formState.errors.newAssignedInductions[index]
                            .name.message
                        }
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-center">
                <button
                  className="text-white bg-gray-800 px-3 py-2 rounded-md"
                  type="submit"
                >
                  {userData.uid ? "Save Changes" : "Create User"}
                </button>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>

      {user.uid && <AssignedInductions uid={user.uid} />}
    </>
  );
};
