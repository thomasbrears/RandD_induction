import React, { useState } from "react";
import { Modal, Button, DatePicker, Select, Popconfirm } from "antd";
import moment from "moment";

const ManageInductionModal = ({ visible, onCancel, onSave, onDelete, inductionData }) => {
  const [dueDate, setDueDate] = useState(inductionData.dueDate ? moment(inductionData.dueDate) : null);
  const [status, setStatus] = useState(inductionData.status);
  const [completionDate, setCompletionDate] = useState(inductionData.completionDate ? moment(inductionData.completionDate) : null);
  //const [notes, setNotes] = useState(inductionData.notes || "");

  const handleStatusChange = (value) => {
    setStatus(value);
    if (value === "Complete") {
      // If status is 'Complete', show the completion date
      if (!completionDate) {
        setCompletionDate(moment()); // Set current date as default
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
      dueDate: dueDate ? dueDate.toISOString() : null,
      status,
      completionDate: completionDate ? completionDate.toISOString() : null,
      //notes,
    };
    onSave(updatedInduction); // Save changes
  };

  const handleCancel = () => {
    // Reset to original data if cancelled
    setDueDate(inductionData.dueDate ? moment(inductionData.dueDate) : null);
    setStatus(inductionData.status);
    setCompletionDate(inductionData.completionDate ? moment(inductionData.completionDate) : null);
    //setNotes(inductionData.notes || "");
    onCancel();
  };

  // Clear due date when clicked to allow a new selection
  const handleDueDateClick = () => {
    setDueDate(null);
  };

  const handleCompletionDateClick = () => {
    setCompletionDate(null);
  };

  const handleCompletionDateChange = (date) => setCompletionDate(date);
  const handleDueDateChange = (date) => setDueDate(date);

  return (
    <Modal
      title="Manage Induction"
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="dueDate" type="default" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          Save Changes
        </Button>,
      ]}
    >
      <div>
        <h4 className="mt-4">Change Due Date</h4>
        <DatePicker
          value={dueDate}
          onChange={handleDueDateChange}
          onClick={handleDueDateClick} // Clear the date when clicked
          style={{ width: "100%" }}
          format="DD-MM-YYYY"
        />

        <h4 className="mt-4">Change Status</h4>
        <Select value={status} onChange={handleStatusChange} style={{ width: "100%" }}>
          <Select.Option value="overdue">Overdue</Select.Option>
          <Select.Option value="assigned">Assigned</Select.Option>
          <Select.Option value="in_progress">In Progress</Select.Option>
          <Select.Option value="complete">Complete</Select.Option>
        </Select>

        {status === "complete" && (
          <>
            <h4 className="mt-4">Completion Date</h4>
            <DatePicker
              value={completionDate}
              onChange={handleCompletionDateChange}
              onClick={handleCompletionDateClick}
              style={{ width: "100%" }}
              format="DD-MM-YYYY"
            />
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
