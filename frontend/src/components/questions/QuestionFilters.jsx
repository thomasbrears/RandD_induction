import React from 'react';
import { Input, Select, Radio, Button } from 'antd';
import { SearchOutlined, FilterOutlined, ClearOutlined } from '@ant-design/icons';
import QuestionTypes from '../../models/QuestionTypes';

/**
 * Component for filtering and searching questions in the induction form
 */
const QuestionFilters = ({
  onSearch,
  onFilterType,
  onFilterRequired,
  searchText,
  typeFilter,
  requiredFilter,
  onClearFilters,
  totalQuestions,
  filteredCount
}) => {
  const hasActiveFilters = searchText || typeFilter || requiredFilter !== null;
  const isFiltered = totalQuestions !== filteredCount;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4 transition-all duration-300">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <Input
            placeholder="Search questions title..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchText}
            onChange={(e) => onSearch(e.target.value)}
            allowClear
            className="w-full"
          />
        </div>

        {/* Filter by Type */}
        <div className="w-full md:w-48">
          <Select
            placeholder="Filter by question type"
            value={typeFilter}
            onChange={onFilterType}
            className="w-full"
            allowClear
            suffixIcon={<FilterOutlined />}
          >
            <Select.Option value={QuestionTypes.MULTICHOICE}>Multiple Choice</Select.Option>
            <Select.Option value={QuestionTypes.TRUE_FALSE}>True/False</Select.Option>
            <Select.Option value={QuestionTypes.DROPDOWN}>Dropdown</Select.Option>
            <Select.Option value={QuestionTypes.FILE_UPLOAD}>File Upload</Select.Option>
            <Select.Option value={QuestionTypes.YES_NO}>Yes/No</Select.Option>
            <Select.Option value={QuestionTypes.SHORT_ANSWER}>Short Answer</Select.Option>
            <Select.Option value={QuestionTypes.INFORMATION}>Information</Select.Option>
          </Select>
        </div>

        {/* Filter by Required */}
        <div className="w-full md:w-auto">
          <Radio.Group 
            value={requiredFilter} 
            onChange={(e) => onFilterRequired(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            className="text-xs"
          >
            <Radio.Button value={null}>All</Radio.Button>
            <Radio.Button value={true}>Required</Radio.Button>
            <Radio.Button value={false}>Not Required</Radio.Button>
          </Radio.Group>
        </div>

        {/* Clear Filters Button - Always visible but disabled when no filters active */}
        <div className="w-full md:w-auto flex items-center">
          <Button 
            onClick={onClearFilters}
            icon={<ClearOutlined />}
            type="default"
            className="hover:text-blue-600 hover:border-blue-600 transition-colors"
            disabled={!hasActiveFilters}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Filter summary/status */}
      {isFiltered && (
        <div className="mt-3 text-sm text-gray-500 flex items-center gap-1">
          <span>Showing</span>
          <span className="font-semibold text-gray-600">{filteredCount}</span>
          <span>of</span>
          <span className="font-semibold text-gray-600">{totalQuestions}</span>
          <span>questions</span>
        </div>
      )}
    </div>
  );
};

export default QuestionFilters;