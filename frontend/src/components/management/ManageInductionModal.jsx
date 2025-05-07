import React, { useState, useEffect } from "react";
import { Modal, Button, DatePicker, Select, Popconfirm } from "antd";
import dayjs from "dayjs";
import { notifyPromise } from "../../utils/notificationService";

const ManageInductionModal = ({ visible, onCancel, onSave, onDelete, inductionData }) => {
  const getDateValue = (data, oldField, newField) => {
    
    if (data[newField]) return data[newField];
    if (data[oldField]) return data[oldField];
    return null;
  };

  const parseDate = (dateValue) => {
    if (!dateValue) {
      return null;
    }
   
    try {      
      // Handle Firestore Timestamp objects with _seconds and _nanoseconds
      if (typeof dateValue === 'object' && 
          (dateValue._seconds !== undefined || dateValue.seconds !== undefined)) {
        const seconds = dateValue._seconds !== undefined ? dateValue._seconds : dateValue.seconds;
        return dayjs(new Date(seconds * 1000));
      }
     
      // Handle objects with toDate method
      if (typeof dateValue === 'object' && typeof dateValue.toDate === 'function') {
        return dayjs(dateValue.toDate());
      }

      // Handle ISO strings
      if (typeof dateValue === 'string') {
        const parsedDate = dayjs(dateValue);
        return parsedDate.isValid() ? parsedDate : null;
      }
      
      // Handle regular Date objects
      if (dateValue instanceof Date) {
        return dayjs(dateValue);
      }
     
      // Generic fallback
      const parsedDate = dayjs(dateValue);
      if (parsedDate.isValid()) {
        return parsedDate;
      }
      
      return null;
    } catch (e) {
      console.error("Error parsing date:", e, dateValue);
      return null;
    }
  };

  // Initialise state with null values
  const [availableFrom, setAvailableFrom] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [status, setStatus] = useState("");
  const [completionDate, setCompletionDate] = useState(null);
  const [formInitialized, setFormInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Store original values for comparison
  const [originalValues, setOriginalValues] = useState({
    availableFrom: null,
    dueDate: null,
    status: "",
    completionDate: null
  });

  // Update state when inductionData changes
  useEffect(() => {
    if (inductionData && visible) {
      
      const availableFromValue = getDateValue(inductionData, 'availableFrom', 'availableFrom');
      const dueDateValue = getDateValue(inductionData, 'dueDate', 'dueDate');
      const completionDateValue = getDateValue(inductionData, 'completionDate', 'completedAt');
      
      const parsedAvailableFrom = parseDate(availableFromValue);
      const parsedDueDate = parseDate(dueDateValue);
      const parsedCompletionDate = parseDate(completionDateValue);
      
      setAvailableFrom(parsedAvailableFrom);
      setDueDate(parsedDueDate);
      setStatus(inductionData.status || "");
      setCompletionDate(parsedCompletionDate);
      
      // Store original values for comparison
      setOriginalValues({
        availableFrom: parsedAvailableFrom,
        dueDate: parsedDueDate,
        status: inductionData.status || "",
        completionDate: parsedCompletionDate
      });
      
      setFormInitialized(true);
    }
  }, [inductionData, visible]);

  const handleStatusChange = (value) => {
    setStatus(value);
    if (value === "complete") {
      // If status is Complete, show the completion date field
      if (!completionDate) {
        setCompletionDate(dayjs()); // Set current date as default
      }
    } else {
      setCompletionDate(null); // Reset completion date if status is not Complete
    }
  };

  const handleDelete = () => {
    setIsDeleting(true);
    
    const deletePromise = new Promise(async (resolve, reject) => {
      try {
        await onDelete(); // Call the delete function
        onCancel(); // Close modal after deletion
        resolve("Induction assignment removed successfully");
      } catch (error) {
        console.error("Error deleting induction:", error);
        reject(error);
      } finally {
        setIsDeleting(false);
      }
    });
    
    return notifyPromise(deletePromise, {
      pending: "Removing induction assignment...",
      success: "Induction assignment removed successfully",
      error: (err) => `Failed to remove induction: ${err?.message || "Unknown error"}`
    });
  };
  
  // Check if changes have been made
  const hasChanges = () => {
    // Helper function to compare dates safely
    const areDatesEqual = (date1, date2) => {
      if (!date1 && !date2) return true;
      if (!date1 || !date2) return false;
      return date1.isSame(date2, 'day');
    };
    
    // Compare current values with original values
    return (
      !areDatesEqual(availableFrom, originalValues.availableFrom) ||
      !areDatesEqual(dueDate, originalValues.dueDate) ||
      status !== originalValues.status ||
      !areDatesEqual(completionDate, originalValues.completionDate)
    );
  };

  const handleSave = () => {
    // Check if any changes have been made
    if (!hasChanges()) {
      // No changes made, just close the modal without saving
      onCancel();
      return;
    }
    
    // Map old field names to new field names if needed
    const updatedInduction = {
      ...inductionData,
      availableFrom: availableFrom ? availableFrom.toISOString() : null,
      dueDate: dueDate ? dueDate.toISOString() : null,
      status,
      // Backwards compatibility
      completionDate: completionDate ? completionDate.toISOString() : null,
      completedAt: completionDate ? completionDate.toISOString() : null,
    };
    
    setIsSaving(true);
    
    const savePromise = new Promise(async (resolve, reject) => {
      try {
        await onSave(updatedInduction); // Save changes
        resolve("Induction updated successfully");
      } catch (error) {
        console.error("Error saving induction:", error);
        reject(error);
      } finally {
        setIsSaving(false);
      }
    });
    
    notifyPromise(savePromise, {
      pending: "Updating induction...",
      success: "Induction updated successfully",
      error: (err) => `Failed to update induction: ${err?.message || "Unknown error"}`
    }).then(() => {
      // Only close the modal on success
      onCancel();
    }).catch((err) => {
      // Keep the modal open on error
      console.error("Save failed:", err);
    });
  };

  const handleCancel = () => {
    // Reset to original data if cancelled
    setAvailableFrom(originalValues.availableFrom);
    setDueDate(originalValues.dueDate);
    setStatus(originalValues.status);
    setCompletionDate(originalValues.completionDate);
    onCancel();
  };

  const handleAvailableFromChange = (date) => setAvailableFrom(date);
  const handleCompletionDateChange = (date) => setCompletionDate(date);
  const handleDueDateChange = (date) => setDueDate(date);

  // Validate form fields
  const validateForm = () => {
    // Check if required fields are filled
    if (!availableFrom || !dueDate || !status) {
      return false;
    }
   
    // Check if completion date is provided when status is complete
    if (status === "complete" && !completionDate) {
      return false;
    }
   
    // Check date relationship
    if (availableFrom && dueDate && availableFrom.isAfter(dueDate)) {
      return false; // Invalid: availableFrom is after dueDate
    }
   
    return true;
  };

  // Disable dates before availableFrom for dueDate
  const disableBeforeAvailableFrom = (current) => {
    return availableFrom && current && current.isBefore(availableFrom, "day");
  };

  // Get the induction name
  const getInductionName = () => {
    if (inductionData.name) {
      return inductionData.name;
    } else if (inductionData.inductionName) {
      return inductionData.inductionName;
    } else if (inductionData.induction?.name) {
      return inductionData.induction.name;
    }
    return "Manage Induction";
  };

  // Dont render the modal content until we've properly initialised the form
  if (!formInitialized && visible) {
    return (
      <Modal
        title="Loading induction details..."
        open={visible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" type="default" onClick={handleCancel}>
            Cancel
          </Button>
        ]}
      >
        <div className="text-center py-4">Loading induction details...</div>
      </Modal>
    );
  }

  return (
    <Modal
      title={`Manage Assignment (${getInductionName()})`}
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" type="default" onClick={handleCancel} disabled={isSaving || isDeleting}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          onClick={handleSave}
          disabled={!validateForm() || !hasChanges() || isSaving || isDeleting}
          loading={isSaving}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>,
      ]}
    >
      <div>
        <h4 className="mt-4">Available From Date <span className="text-red-500">*</span></h4>
        <DatePicker
          value={availableFrom}
          onChange={handleAvailableFromChange}
          style={{ width: "100%" }}
          format="DD-MM-YYYY"
          status={!availableFrom ? "error" : ""}
        />
        {!availableFrom && (
          <p className="text-red-500 text-xs mt-1">
            Available from date is required
          </p>
        )}
        <h4 className="mt-4">Due Date <span className="text-red-500">*</span></h4>
        <DatePicker
          value={dueDate}
          onChange={handleDueDateChange}
          style={{ width: "100%" }}
          format="DD-MM-YYYY"
          disabledDate={disableBeforeAvailableFrom} // Disable dates before availableFrom
          status={!dueDate || (availableFrom && dueDate && availableFrom.isAfter(dueDate)) ? "error" : ""}
        />
        {!dueDate && (
          <p className="text-red-500 text-xs mt-1">
            Due date is required
          </p>
        )}
        {availableFrom && dueDate && availableFrom.isAfter(dueDate) && (
          <p className="text-red-500 text-xs mt-1">
            Due date must be after the available from date
          </p>
        )}
        <h4 className="mt-4">Change Status <span className="text-red-500">*</span></h4>
        <Select
          value={status}
          onChange={handleStatusChange}
          style={{ width: "100%" }}
          status={!status ? "error" : ""}
        >
          <Select.Option value="overdue">Overdue</Select.Option>
          <Select.Option value="assigned">Assigned</Select.Option>
          <Select.Option value="in_progress">In Progress</Select.Option>
          <Select.Option value="complete">Complete</Select.Option>
        </Select>
        {!status && (
          <p className="text-red-500 text-xs mt-1">
            Status is required
          </p>
        )}
        {status === "complete" && (
          <>
            <h4 className="mt-4">Completion Date <span className="text-red-500">*</span></h4>
            <DatePicker
              value={completionDate}
              onChange={handleCompletionDateChange}
              style={{ width: "100%" }}
              format="DD-MM-YYYY"
              status={!completionDate ? "error" : ""}
            />
            {!completionDate && (
              <p className="text-red-500 text-xs mt-1">
                Completion date is required for completed inductions
              </p>
            )}
          </>
        )}
        <h4 className="mt-4">Would you like to remove this induction assignment?</h4>
        <Popconfirm
          key="delete"
          title="Are you sure you want to remove this induction assignment?"
          description="This is a permanent action and cannot be undone."
          onConfirm={handleDelete}
          okText="Yes, Remove"
          cancelText="No, Cancel"
          disabled={isSaving || isDeleting}
        >
          <Button danger loading={isDeleting} disabled={isSaving || isDeleting}>
            {isDeleting ? "Removing..." : "Remove Induction Assignment"}
          </Button>
        </Popconfirm>
      </div>
    </Modal>
  );
};

export default ManageInductionModal;