import React, { useState } from "react";
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
import Departments from "../../models/Departments";
import useAuth from "../../hooks/useAuth";
import {DefaultNewInduction} from "../../models/Inductions"
import { createNewInduction } from "../../api/InductionApi";
import PageHeader from "../../components/PageHeader";

const InductionEdit = () => {
  const { user } = useAuth();
  const [induction, setInduction] = useState(DefaultNewInduction);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInduction({
      ...induction,
      [name]: value,
    });
  };

  const handleDepartmentChange = (e) => {
    setInduction({
      ...induction,
      department: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user) {
      const result = await createNewInduction(user, induction);
      console.log(result);
    }
  };

  return (
    <>
      <Helmet><title>Edit/Create Induction | AUT Events Induction Portal</title></Helmet>
      <PageHeader 
        title="Edit/Create Induction" 
        subtext="Edit/Create a induction" 
      />
      <div className="p-6">
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={induction.name}
              onChange={handleChange}
              placeholder="Enter name"
            />
          </div>
  
          <div>
            <label htmlFor="department">Department:</label>
            <select
              id="department"
              name="department"
              value={induction.department}
              onChange={handleDepartmentChange}
            >
              {Object.keys(Departments).map((key) => (
                <option key={key} value={Departments[key]}>
                  {Departments[key]}
                </option>
              ))}
            </select>
          </div>
  
          <div>
            <label htmlFor="description">Description:</label>
            <textarea
              id="description"
              name="description"
              value={induction.description}
              onChange={handleChange}
              placeholder="Enter description"
            />
          </div>
  
          <button type="submit">Create Induction</button>
        </form>
      </div>
    </>
  );
};  
export default InductionEdit;
