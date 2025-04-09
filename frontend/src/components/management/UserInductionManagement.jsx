import { useState, useEffect } from "react";
import { DefaultNewUser } from "../../models/User";
import useAuth from "../../hooks/useAuth";
import { getAllInductions } from "../../api/InductionApi";
import { assignInductionToUser, getUserInductions, updateUserInduction, deleteUserInduction } from "../../api/UserInductionApi";
import { messageError } from "../../utils/notificationService";
import InductionAssignmentForm from './InductionAssignmentForm';
import AssignedInductionsList from './AssignedInductionsList';

const UserInductionManagement = ({ userData = DefaultNewUser, onSubmit }) => {
  const [user, setUser] = useState({ ...DefaultNewUser, position: '' });
  const [availableInductions, setAvailableInductions] = useState([]);
  const [userInductions, setUserInductions] = useState([]);
  const { user: currentUser } = useAuth();

  // Fetch available inductions
  useEffect(() => {
    const fetchInductions = async () => {
      if (currentUser) {
        try {
          const inductions = await getAllInductions(currentUser);
          setAvailableInductions(inductions);
        } catch (error) {
          console.error("Error fetching inductions:", error);
        }
      }
    };
    fetchInductions();
  }, [currentUser]);

  // Fetch users assigned inductions
  useEffect(() => {
    const fetchUserInductions = async () => {
      if (currentUser && userData.uid) {
        try {
          const inductions = await getUserInductions(currentUser, userData.uid);
          setUserInductions(inductions);
        } catch (error) {
          console.error("Error fetching user inductions:", error);
          // Fall back to the legacy method if the new API fails
          if (userData.assignedInductions && Array.isArray(userData.assignedInductions)) {
            setUserInductions(userData.assignedInductions);
          }
        }
      }
    };
    
    fetchUserInductions();
  }, [currentUser, userData.uid, userData.assignedInductions]);

  useEffect(() => {
    setUser(userData);
  }, [userData]);

  // Handler for assigning new inductions
  const handleAssignInductions = async (newAssignments) => {
    try {
      // Assign all new inductions
      for (const assignment of newAssignments) {
        await assignInductionToUser(currentUser, {
          userId: userData.uid,
          inductionId: assignment.inductionId || assignment.id,
          dueDate: assignment.dueDate,
          availableFrom: assignment.availableFrom
        });
      }

      // Refresh the users inductions
      if (userData.uid) {
        const updatedInductions = await getUserInductions(currentUser, userData.uid);
        setUserInductions(updatedInductions);
      }

      return true;
    } catch (error) {
      console.error("Error assigning induction:", error);
      throw error;
    }
  };

  // Handler for updating an induction
  const handleUpdateInduction = async (updatedInduction) => {
    try {
      if (updatedInduction.id) {
        const updateData = {
          status: updatedInduction.status,
          dueDate: updatedInduction.dueDate,
          availableFrom: updatedInduction.availableFrom,
          completedAt: updatedInduction.completedAt || updatedInduction.completionDate
        };
        
        await updateUserInduction(currentUser, updatedInduction.id, updateData);
      
        // Force a refresh after a short delay to ensure DB has updated
        setTimeout(async () => {
          try {
            const updatedInductions = await getUserInductions(currentUser, userData.uid);
            setUserInductions(updatedInductions);
          } catch (refreshError) {
            console.error("Error refreshing inductions:", refreshError);
            messageError("Update saved but error refreshing display");
          }
        }, 500);
        
      } else {
        // Legacy update
        const updatedAssignedInductions = userInductions.map((induction) =>
          induction.id === updatedInduction.id ? updatedInduction : induction
        );
        
        await onSubmit({
          ...user,
          assignedInductions: updatedAssignedInductions,
        });
        
        setUserInductions(updatedAssignedInductions);
      }
      
      return true;
    } catch (error) {
      console.error("Error updating induction:", error);
      throw error;
    }
  };

  // Handler for deleting an induction
  const handleDeleteInduction = async (inductionToDelete) => {
    try {
      if (inductionToDelete.id) {
        await deleteUserInduction(currentUser, inductionToDelete.id);
      
        // Refresh the users inductions
        const updatedInductions = await getUserInductions(currentUser, userData.uid);
        setUserInductions(updatedInductions);
      
      } else {
        // Legacy delete
        const updatedAssignedInductions = userInductions.filter(
          (induction) => induction.id !== inductionToDelete.id
        );
        
        await onSubmit({
          ...user,
          assignedInductions: updatedAssignedInductions,
        });
        
        setUserInductions(updatedAssignedInductions);
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting induction:", error);
      throw error;
    }
  };

  return (
    <div className="flex flex-col items-start justify-center pt-8 px-2 sm:px-4 md:px-6 lg:px-8">
      {/* Assignment Form */}
      <InductionAssignmentForm 
        userData={userData}
        availableInductions={availableInductions}
        existingInductions={userInductions}
        onAssignInductions={handleAssignInductions}
      />
      
      {/* Existing Inductions List */}
      {userData.uid && (
        <div className="w-full mt-8">
          <AssignedInductionsList 
            userInductions={userInductions}
            userId={userData.uid}
            currentUser={currentUser}
            onUpdateInduction={handleUpdateInduction}
            onDeleteInduction={handleDeleteInduction}
          />
        </div>
      )}
    </div>
  );
};

export default UserInductionManagement;