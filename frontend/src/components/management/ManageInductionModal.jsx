import React, { useState } from "react";
import { Modal, Button, Input, DatePicker, Select, Popconfirm } from "antd";
import dayjs from "dayjs";

const ManageInductionModal = ({ visible, onCancel, onSave, onDelete, inductionData }) => {
  const [availableFrom, setAvailableFrom] = useState(inductionData.availableFrom ? dayjs(inductionData.availableFrom) : null);
  const [dueDate, setDueDate] = useState(inductionData.dueDate ? dayjs(inductionData.dueDate) : null);
  const [status, setStatus] = useState(inductionData.status);
  const [completionDate, setCompletionDate] = useState(inductionData.completionDate ? dayjs(inductionData.completionDate) : null);
  //const [notes, setNotes] = useState(inductionData.notes || "");

  const handleStatusChange = (value) => {
    setStatus(value);
    if (value === "complete") {
      // If status is 'Complete', show the completion date
      if (!completionDate) {
        setCompletionDate(dayjs()); // Set current date as default
      }
    } else {
      setCompletionDate(null); // Reset completion date if status is not 'Complete'
    }
  };

  const handleDelete = () => {
    return new Promise((resolve) => {
        setTimeout(async () => {
          await onDelete(); // Call the delete function
          onCancel(); // Close modal after deletion
          resolve(null);
        }, 500); // Small delay to mimic async confirmation
      });
  };

  const handleSave = () => {
    const updatedInduction = {
      ...inductionData,
      availableFrom: availableFrom ? availableFrom.toISOString() : null,
      dueDate: dueDate ? dueDate.toISOString() : null,
      status,
      completionDate: completionDate ? completionDate.toISOString() : null,
      //notes,
    };
    onSave(updatedInduction); // Save changes
  };

  const handleCancel = () => {
    // Reset to original data if cancelled
    setAvailableFrom(inductionData.availableFrom ? dayjs(inductionData.availableFrom) : null);
    setDueDate(inductionData.dueDate ? dayjs(inductionData.dueDate) : null);
    setStatus(inductionData.status);
    setCompletionDate(inductionData.completionDate ? dayjs(inductionData.completionDate) : null);
    //setNotes(inductionData.notes || "");
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

  // Disable past dates for availableFrom and dueDate
  const disablePastDates = (current) => {
    return current && current.isBefore(dayjs(), "day"); // Disable past dates
  };

  // Disable dates before availableFrom for dueDate
  const disableBeforeAvailableFrom = (current) => {
    return availableFrom && current && current.isBefore(availableFrom, "day");
  };

  return (
    <Modal
      title="Manage Induction"
      visible={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" type="default" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button 
          key="save" 
          type="primary" 
          onClick={handleSave}
          disabled={!validateForm()}
        >
          Save Changes
        </Button>,
      ]}
    >
      <div>
        <p className="text-gray-500 text-xs mb-4">Fields marked with <span className="text-red-500">*</span> are required</p>
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
        >
          <Button danger>Remove Induction Assignment</Button>
        </Popconfirm>

        {/* <h4>Notes</h4>
        <Input.TextArea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add a reason for status change or any notes"
          rows={4}
        /> */}
      </div>
    </Modal>
  );
};

export default ManageInductionModal;
