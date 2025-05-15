import React, { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import { SearchOutlined } from '@ant-design/icons';
import {
  List,
  FileText,
  BookType,
} from "lucide-react";
import "../style/Table.css";
import Loading from './Loading';
import { Link, useNavigate } from "react-router-dom";
import { FaUserEdit, FaUserPlus, FaChartBar } from "react-icons/fa";
import { getAllInductions } from "../api/InductionApi";
import "react-quill/dist/quill.snow.css";
import { Table, Badge, Tooltip, Select, Input, Button, Pagination } from 'antd';
import TruncatedDescription from './questions/TruncatedDescription';

const { Option } = Select;

// Mobile card view component
const MobileInductionCard = ({ induction, onEdit, onViewResults }) => (
  <div className="bg-white shadow-md rounded-lg p-4">
    <h3 className="text-lg font-semibold break-words whitespace-normal flex items-center">
      <Link to={`/inductions/${induction.id}`} className="text-black hover:underline">
        {induction.name}
      </Link>
      {induction.isDraft && (
        <Badge 
          count="DRAFT" 
          style={{ backgroundColor: '#faad14', marginLeft: '8px' }} 
        />
      )}
    </h3>

    <div className="text-sm text-gray-600 mt-2 break-words whitespace-normal">
      <div>
        <p><span className="font-semibold">Department: </span>{induction.department}</p>
      </div>
      <div>
        <p><span className="font-semibold">Description: </span></p>
        <TruncatedDescription 
          description={induction.description} 
          maxLength={150} 
          maxHeight={100}
          fullWidthButton={true}  
        />
      </div>
    </div>

    <div className="flex flex-wrap mt-3">
      <Button
        onClick={() => onEdit(induction.id)}
        type="primary"
        className="bg-gray-700 hover:bg-gray-900 mr-2 mt-2"
        icon={<FaUserEdit className="inline mr-2" />}
      >
        Edit
      </Button>
      {!induction.isDraft ? (
        <Button
          onClick={() => onViewResults(induction.id)}
          type="primary"
          className="bg-gray-700 hover:bg-gray-900 mt-2"
          icon={<FaChartBar className="inline mr-2" />}
        >
          View Results
        </Button>
      ) : (
        <Tooltip title="Draft inductions cannot be assigned to users">
          <Button
            disabled
            className="opacity-70 mt-2"
            icon={<FaChartBar className="inline mr-2" />}
          >
            View Results
          </Button>
        </Tooltip>
      )}
    </div>
  </div>
);

const InductionsTable = () => {
  const navigate = useNavigate();
  const [inductions, setInductions] = useState([]);
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [moduleTypeFilter, setModuleTypeFilter] = useState(['published', 'draft']); // Default show both
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState("");

  const handleEditInduction = (id) => {
    navigate("/management/inductions/edit", { state: { id } });
  };

  const handleViewInductionResults = (id) => {
    navigate(`/management/results/induction/${id}`);
  };

  // Define table columns
  const columns = [
    {
      title: () => (
        <span className="flex items-center">
          <BookType className="mr-2" size={16} /> Induction Title
        </span>
      ),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <div className="break-words text-base text-gray-500 flex items-center">
          <span>{text}</span>
          {record.isDraft && (
            <Tooltip title="This induction is a draft and cannot be assigned to users until published">
              <Badge 
                count="DRAFT" 
                style={{ backgroundColor: '#faad14', marginLeft: '8px' }} 
              />
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: () => (
        <span className="flex items-center">
          <List className="mr-2" size={16} /> Department
        </span>
      ),
      dataIndex: 'department',
      key: 'department',
      sorter: (a, b) => a.department.localeCompare(b.department),
      render: (text) => <p className="whitespace-nowrap text-base text-gray-500">{text}</p>,
    },
    {
      title: () => (
        <span className="flex items-center">
          <FileText className="mr-2" size={16} /> Description
        </span>
      ),
      dataIndex: 'description',
      key: 'description',
      render: (text) => (
        <div className="prose !max-w-xs break-words text-base text-gray-500">
          <TruncatedDescription 
            description={text} 
            maxLength={200} 
            maxHeight={100} 
          />
        </div>
      ),
    },
    {
      title: '',
      key: 'actions',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            onClick={() => handleEditInduction(record.id)}
            type="primary"
            className="bg-gray-700 hover:bg-gray-900"
            icon={<FaUserEdit className="inline mr-2" />}
          >
            Edit
          </Button>
          {!record.isDraft ? (
            <Button
              onClick={() => handleViewInductionResults(record.id)}
              type="primary"
              className="bg-gray-700 hover:bg-gray-900"
              icon={<FaChartBar className="inline mr-2" />}
            >
              View Results
            </Button>
          ) : (
            <Tooltip title="Draft inductions cannot be assigned to users">
              <Button
                disabled
                className="opacity-70"
                icon={<FaChartBar className="inline mr-2" />}
              >
                View Results
              </Button>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  useEffect(() => {
    const fetchInductions = async () => {
      if (!authLoading && user) {
        try {
          setLoading(true);
          setLoadingMessage(`Loading inductions...`);

          const data = await getAllInductions(user);
          setInductions(data);
          
          // Update pagination total
          setPagination(prev => ({
            ...prev,
            total: data.length,
          }));
        } catch (error) {
          console.error("Error fetching inductions:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchInductions();
  }, [user, authLoading]);
  
  // Filter inductions based on moduleTypeFilter state and search text
  const filteredInductions = inductions.filter(induction => {
    // Filter by module type
    const typeMatches = (moduleTypeFilter.includes('draft') && induction.isDraft) || 
                       (moduleTypeFilter.includes('published') && !induction.isDraft);
    
    // Filter by search text
    const searchLower = searchText.toLowerCase();
    const textMatches = searchText === '' || 
                       induction.name.toLowerCase().includes(searchLower) ||
                       induction.department.toLowerCase().includes(searchLower) ||
                       (induction.description && induction.description.toLowerCase().includes(searchLower));
    
    return typeMatches && textMatches;
  });
  
  // Handle table change (pagination, filters, sorter)
  const handleTableChange = (pagination, filters, sorter) => {
    setPagination(pagination);
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
    // Reset to first page when searching
    setPagination(prev => ({
      ...prev,
      current: 1,
    }));
  };

  return (
    <div className="tableContainer">
      {loading ? (
        <Loading message={loadingMessage} />
      ) : (
        <>
          {/* Header Controls */}
          <div className="mb-4 flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search Bar */}
            <div className="relative flex-grow">
              <Input
                placeholder="Search inductions..."
                value={searchText}
                onChange={handleSearchChange}
                prefix={<SearchOutlined />}
                className="w-full"
              />
            </div>

            {/* Module Type Filter */}
            <div className="flex items-center">
              <span className="mr-2 text-gray-700">Type:</span>
              <Select
                mode="multiple"
                style={{ minWidth: '180px' }}
                placeholder="Select module types"
                value={moduleTypeFilter}
                onChange={setModuleTypeFilter}
                defaultValue={['published', 'draft']}
              >
                <Option value="published">Published Modules</Option>
                <Option value="draft">Draft Modules</Option>
              </Select>
            </div>

            {/* Create New Button */}
            <div className="hidden lg:block">
              <Link to="/management/inductions/create">
                <Button 
                  type="primary" 
                  className="bg-blue-500 hover:bg-blue-600"
                  icon={<FaUserPlus className="inline mr-2" />}
                >
                  Create New Induction
                </Button>
              </Link>
            </div>

            {/* Mobile Create Button */}
            <div className="lg:hidden">
              <Link to="/management/inductions/create" className="w-full block">
                <Button 
                  type="primary" 
                  className="bg-blue-500 hover:bg-blue-600 w-full"
                  icon={<FaUserPlus className="inline mr-2" />}
                >
                  Create New Induction
                </Button>
              </Link>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block">
            <Table
              columns={columns}
              dataSource={filteredInductions.map(item => ({ ...item, key: item.id }))}
              pagination={pagination}
              onChange={handleTableChange}
              loading={loading}
              className="shadow-md rounded-lg"
              rowClassName="hover:bg-gray-50"
            />
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {filteredInductions
              .slice((pagination.current - 1) * pagination.pageSize, 
                     pagination.current * pagination.pageSize)
              .map(induction => (
                <MobileInductionCard 
                  key={induction.id} 
                  induction={induction}
                  onEdit={handleEditInduction}
                  onViewResults={handleViewInductionResults}
                />
              ))
            }
            
            {/* Mobile Pagination */}
            <div className="mt-4 flex justify-center">
              <Pagination 
                {...pagination}
                onChange={(page, pageSize) => {
                  setPagination({
                    ...pagination,
                    current: page,
                    pageSize: pageSize
                  });
                }}
                total={filteredInductions.length}
                showTotal={(total, range) => (
                  <p className="text-sm text-gray-500">
                    Showing {range[0]}-{range[1]} of {total} items
                  </p>
                )}
                showSizeChanger
                pageSizeOptions={['10', '20', '30', '40']}
              />
            </div>
          </div>
          
          {/* Empty State */}
          {filteredInductions.length === 0 && (
            <div className="text-center py-8 bg-white rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-600">No inductions found</h2>
              <p className="text-gray-500 mt-2">
                Try adjusting your search or filter criteria, or create a new induction.
              </p>
              <div className="mt-4">
                <Link to="/management/inductions/create">
                  <Button 
                    type="primary" 
                    className="bg-blue-500 hover:bg-blue-600"
                    icon={<FaUserPlus className="inline mr-2" />}
                  >
                    Create New Induction
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InductionsTable;