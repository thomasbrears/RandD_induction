import React, { useState, useEffect } from 'react';
import { getAssignedInductions } from '../api/InductionApi';
import useAuth from '../hooks/useAuth';

const AssignedInductions = () => {
  const [inductions, setInductions] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const fetchInductions = async () => {
        try {
          const inductionList = await getAssignedInductions(user, user.uid);
          setInductions(inductionList);
        }catch (error) {
          console.error("Error fetching assigned induction list:", error);
        }
      };

      fetchInductions();
    }
  }, [user]);

  const getStatus = (induction) => {
    const now = new Date();
    if (induction.completed) return 'Completed';
    if (new Date(induction.dueDate) < now) return 'Overdue';
    return 'To Do';
  };

  return (
    <div className="assigned-inductions">
      <h2>Assigned Inductions</h2>
      <table>
        <thead>
          <tr>
            <th>Induction Name</th>
            <th>Due Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {inductions.map(induction => (
            <tr key={induction.id}>
              <td>{induction.name}</td>
              <td>{new Date(induction.dueDate).toLocaleDateString()}</td>
              <td>{induction.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AssignedInductions;
