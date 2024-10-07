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

const userSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  permission: z.string().min(1, "Permission is required"),
  position: z.string().min(1, "Position is required"),
  locations: z.array(z.string()).min(1, "At least one location is required"),
});

export const UserForm = ({ userData = DefaultNewUser, onSubmit }) => {
  const [user, setUser] = useState(DefaultNewUser);
  const { user: currentUser } = useAuth();
  
  const methods = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: userData,
  });

  useEffect(() => {
    setUser(userData);
    methods.reset(userData);
  }, [userData, methods]);

  const handleSubmit = async (data) => {
    setUser(data);
    const userToSubmit = {
      ...userData, 
      email: data.email,
      permission: data.permission,
      firstName: data.firstName,
      lastName: data.lastName,
      position: data.position,
      locations: user.locations, 
    };
    await onSubmit(userToSubmit); 
    if (!userData.uid) {
      methods.reset();
      setUser(DefaultNewUser);
    }
  };

  const handleLocationsChange = (selectedOptions) => {
    const selectedValues = selectedOptions ? selectedOptions.map(option => option.value) : [];
    
    methods.setValue("locations", selectedValues, { shouldValidate: true }); 

    setUser((prevUser) => ({
      ...prevUser,
      locations: selectedValues,
    }));

    methods.setValue("locations", selectedValues);
    methods.trigger("locations");
};

const availablePermissions = currentUser?.role === Permissions.ADMIN
    ? Object.values(Permissions) 
    : [Permissions.USER];

  return (
    <>
      <div className="flex items-start justify-center pt-8"> 
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-4xl mx-4 md:mx-8">
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(handleSubmit)} className="w-full">
              <div className="flex flex-wrap -mx-3 mb-6">
                <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                  <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="grid-first-name">
                    First Name:
                  </label>
                  <input
                    className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                    type="text"
                    {...methods.register("firstName")}
                    placeholder="First Name"
                  />
                  {methods.formState.errors.firstName && <p className="text-red-500 text-xs italic">{methods.formState.errors.firstName.message}</p>}
                </div>
                <div className="w-full md:w-1/2 px-3">
                  <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="grid-last-name">
                    Last Name:
                  </label>
                  <input
                    className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                    type="text"
                    {...methods.register("lastName")}
                    placeholder="Last Name"
                  />
                  {methods.formState.errors.lastName && <p className="text-red-500 text-xs italic">{methods.formState.errors.lastName.message}</p>}
                </div>
              </div>
              <div className="flex flex-wrap -mx-3 mb-6">
                <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                  <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="grid-email">
                    Email:
                  </label>
                  <input
                    className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                    type="email"
                    {...methods.register("email")}
                    placeholder="Email"
                  />
                  {methods.formState.errors.email && <p className="text-red-500 text-xs italic">{methods.formState.errors.email.message}</p>}
                </div>
                <div className="w-full md:w-1/2 px-3">
                  <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="grid-permission">
                    Permission:
                  </label>
                  <select 
                    className="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                    {...methods.register("permission")}
                  >
                    {availablePermissions.map((perm) => (
                      <option className="text-gray-700" key={perm} value={perm}>
                        {perm.charAt(0).toUpperCase() + perm.slice(1)}
                      </option>
                    ))}
                  </select>
                  {methods.formState.errors.permission && <p className="text-red-500 text-xs italic">{methods.formState.errors.permission.message}</p>}
                </div>
              </div>
              <div className="flex flex-wrap -mx-3 mb-6">
                <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                  <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="grid-position">
                    Position:
                  </label>
                  <select
                    className="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                    {...methods.register("position")}
                  >
                    {Object.values(Positions).map((pos) => (
                      <option className="text-gray-700" key={pos} value={pos}>
                        {pos.charAt(0).toUpperCase() + pos.slice(1)}
                      </option>
                    ))}
                  </select>
                  {methods.formState.errors.position && <p className="text-red-500 text-xs italic">{methods.formState.errors.position.message}</p>}
                </div>
                <div className="w-full md:w-1/2 px-3">
                  <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="grid-location">
                    Location:
                  </label>
                  <Select
                      className="w-full"
                      isMulti
                      options={Object.values(Locations).map((loc) => ({
                          value: loc,
                          label: loc.charAt(0).toUpperCase() + loc.slice(1),
                      }))}
                      value={user.locations.map(loc => ({
                          value: loc,
                          label: loc.charAt(0).toUpperCase() + loc.slice(1),
                      }))}
                      onChange={handleLocationsChange}
                  />
                  {methods.formState.errors.locations && <p className="text-red-500 text-xs italic">{methods.formState.errors.locations.message}</p>}
                </div>
              </div>
              <div className="flex justify-center">
                <button 
                  className="inline-block px-5 py-2.5 bg-black text-white no-underline border-none rounded cursor-pointer text-base text-center transition-colors duration-300 transform hover:bg-[#0c027d] active:scale-95 my-2.5"
                  type="submit"
                >
                  {userData.uid ? "Save Changes" : "Create User"}
                </button>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </>
  );
};
