import React, { useState, useEffect } from 'react';
import { getAssignedInductions } from '../api/InductionApi';
import useAuth from '../hooks/useAuth';

const AssignedInductions = ({ uid }) => {
  const [assignedInductions, setAssignedInductions] = useState([]);
  const { user } = useAuth();

  // Use uid prop if provided, else default to user.uid
  const userId = uid || user?.uid;

  useEffect(() => {
    if (user && userId) {
      const fetchInductions = async () => {
        try {
          const response = await getAssignedInductions(user, userId);
          setAssignedInductions(response.assignedInductions || []);
        } catch (error) {
          console.error('Error fetching assigned induction list:', error);
        }
      };

      fetchInductions();
    }
  }, [user, userId]);

  return (
    <>
      <div className="flex items-start justify-center pt-8">
        <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-4xl mx-4 md:mx-8">
          {assignedInductions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-200 w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Induction Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Available From</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Due Date</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Completion Date</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedInductions.map((induction, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-4 py-2">{induction.name}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        {induction.availableFrom ? new Date(induction.availableFrom).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {induction.dueDate ? new Date(induction.dueDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {induction.completionDate ? new Date(induction.completionDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">{induction.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No assigned inductions for this user.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default AssignedInductions;
