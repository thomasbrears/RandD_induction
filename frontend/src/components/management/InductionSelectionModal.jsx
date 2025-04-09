import React, { useState, useEffect } from 'react';
import { Modal, Input, Tooltip } from 'antd';
import { SearchOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import Status from "../../models/Status";

const InductionSelectionModal = ({ 
  visible, 
  onCancel, 
  onSelect, 
  availableInductions, 
  currentSelection,
  alreadyAssignedInductions = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInductions, setFilteredInductions] = useState([]);
  const [sortedInductions, setSortedInductions] = useState([]);
  
  useEffect(() => {
    if (visible) {
      setSearchTerm('');
      const sorted = sortInductionsByAvailability(availableInductions);
      setFilteredInductions(sorted);
      setSortedInductions(sorted);
    }
  }, [visible, availableInductions]);
  
  // Sort inductions by availability (available ones first)
  const sortInductionsByAvailability = (inductions) => {
    return [...inductions].sort((a, b) => {
      const aAssigned = isInductionAssigned(a.id);
      const bAssigned = isInductionAssigned(b.id);
      const aDraft = a.isDraft;
      const bDraft = b.isDraft;
      
      // Sort order: available > assigned > draft
      if (aDraft && !bDraft) return 1;
      if (!aDraft && bDraft) return -1;
      if (aAssigned && !bAssigned) return 1;
      if (!aAssigned && bAssigned) return -1;
      
      // If same availability status - sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
  };
  
  // Filter inductions based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSortedInductions(sortInductionsByAvailability(availableInductions));
      return;
    }
    
    const lowercasedSearch = searchTerm.toLowerCase();
    const filtered = availableInductions.filter(induction => 
      induction.name.toLowerCase().includes(lowercasedSearch) ||
      (induction.description && induction.description.toLowerCase().includes(lowercasedSearch)) ||
      (induction.department && induction.department.toLowerCase().includes(lowercasedSearch))
    );
    
    setSortedInductions(sortInductionsByAvailability(filtered));
  }, [searchTerm, availableInductions]);
  
  const handleSearch = e => {
    setSearchTerm(e.target.value);
  };
  
  const handleSelect = induction => {
    // Dont allow draft or already assigned inductions
    if (induction.isDraft || isInductionAssigned(induction.id)) {
      return;
    }
    onSelect(induction);
    onCancel();
  };
  
  // Function to check if induction is already assigned and incomplete
  const isInductionAssigned = (inductionId) => {
    return alreadyAssignedInductions.some(assigned => 
      (assigned.inductionId === inductionId || assigned.id === inductionId) && 
      assigned.status !== Status.COMPLETE
    );
  };

  // Function to render description with formatting
  const renderFormattedDescription = (description) => {
    return { __html: description };
  };

  return (
    <Modal
      title="Browse Inductions"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
    >
      <div className="mb-4">
        <Input
          placeholder="Search by name, description, or department..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={handleSearch}
          size="large"
          className="mb-4"
          allowClear
        />
        
        {sortedInductions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No inductions found matching your search.
          </div>
        ) : (
          <div className="space-y-2">
            {sortedInductions.map(induction => {
              const isSelected = currentSelection === induction.id;
              const isAssigned = isInductionAssigned(induction.id);
              const isDraft = induction.isDraft;
              
              // Different styles for different statuses
              let statusClass = "";
              let tooltipText = "";
              
              if (isDraft) {
                statusClass = "opacity-50 cursor-not-allowed";
                tooltipText = "This induction is in draft mode and cannot be assigned";
              } else if (isAssigned) {
                statusClass = "opacity-50 cursor-not-allowed";
                tooltipText = "This induction is already assigned and has not been completed";
              }
              
              return (
                <Tooltip 
                  key={induction.id}
                  title={tooltipText} 
                  placement="top"
                  open={(isAssigned || isDraft) ? undefined : false}
                >
                  <div 
                    className={`
                      p-4 border rounded-md transition-all
                      ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'}
                      ${statusClass}
                    `}
                    onClick={() => handleSelect(induction)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        <h3 className="font-medium text-gray-900">{induction.name}</h3>
                        
                        {induction.description && (
                          <div 
                            className="text-sm text-gray-600 mt-1 description-content" 
                            dangerouslySetInnerHTML={renderFormattedDescription(induction.description)}
                          />
                        )}
                        
                        <div className="mt-2 flex flex-wrap gap-2">
                          {induction.department && (
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                              {induction.department}
                            </span>
                          )}
                          
                          {isDraft && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              <WarningOutlined className="mr-1" /> Draft
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4 flex-shrink-0">
                        {isSelected && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Selected
                          </span>
                        )}
                        
                        {isAssigned && !isSelected && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <InfoCircleOutlined className="mr-1" />
                            Already Assigned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default InductionSelectionModal;