import React, { useState, useEffect } from 'react';
import { getAssignedInductions } from '../api/InductionApi';
import useAuth from '../hooks/useAuth';
import { Skeleton } from 'antd';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  getPaginationRowModel,
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  Search,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from 'lucide-react';
import '../style/Table.css';
import { Link } from 'react-router-dom';
import Status from '../models/Status';
import Loading from '../components/Loading';
import { notifyError } from '../utils/notificationService';

const columnHelper = createColumnHelper();

// Reusable StatusBadge Component
const StatusBadge = ({ status }) => {
  const statusMapping = {
    [Status.ASSIGNED]: { label: 'To Complete', color: 'border-blue-500 text-blue-500' },
    [Status.IN_PROGRESS]: { label: 'In Progress', color: 'border-yellow-500 text-yellow-500' },
    [Status.COMPLETE]: { label: 'Completed', color: 'border-green-500 text-green-500' },
    [Status.OVERDUE]: { label: 'OVERDUE', color: 'border-red-500 text-white bg-red-500' },
  };

  const { label, color } = statusMapping[status] || { label: 'Status Unknown', color: 'border-gray-500 text-gray-500' };

  return (
    <span className={`px-2 py-1 border rounded ${color}`}>
      {label}
    </span>
  );
};


// Reusable DateCell Component
const DateCell = ({ date }) => (
  <span>{date ? new Date(date).toLocaleDateString() : 'Not Available'}</span>
);

// Reusable ActionButton Component
const ActionButton = ({ status, assignmentID }) => {
  if ([Status.ASSIGNED, Status.IN_PROGRESS, Status.OVERDUE].includes(status)) {
    return (
      <Link to={`/induction/take?assignmentID=${assignmentID}`}>
        <button className="text-white bg-gray-800 hover:bg-gray-900 px-3 py-1 rounded">
          {status === Status.IN_PROGRESS ? 'Continue' : 'Start'}
        </button>
      </Link>
    );
  } else if (status === Status.COMPLETE) {
    return (
      <Link to={`/induction/results/${assignmentID}`}>
        <button className="text-white bg-gray-800 hover:bg-gray-900 px-3 py-1 rounded">
          View Results
        </button>
      </Link>
    );
  }
  return null;
};

// Main AssignedInductions Component
const AssignedInductions = ({ uid }) => {
  const [assignedInductions, setAssignedInductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('');
  const { user } = useAuth();
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const userId = uid || user?.uid;

  useEffect(() => {
    if (user && userId) {
      const fetchInductions = async () => {
        setLoading(true);
        setLoadingMessage(`Loading inductions for ${user.displayName || user.email}...`);
        try {
          const response = await getAssignedInductions(user, userId);
          setAssignedInductions(response.assignedInductions || []);
        } catch (error) {
          notifyError('Unable to load assigned inductions', 'Please try again later.');          
          console.error('Error fetching assigned induction list:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchInductions();
    }
  }, [user, userId]);

  const columns = [
    columnHelper.accessor('name', {
      cell: (info) => (
        <Link to={`/induction/take?assignmentID=${info.row.original.assignmentID}`} className="text-black hover:underline">
          {info.getValue()}
        </Link>
      ),
      header: 'Induction Name',
    }),
    columnHelper.accessor('availableFrom', {
      cell: (info) => <DateCell date={info.getValue()} />,
      header: 'Available From',
    }),
    columnHelper.accessor('dueDate', {
      cell: (info) => <DateCell date={info.getValue()} />,
      header: 'Due Date',
    }),
    columnHelper.accessor('completionDate', {
      cell: (info) => <DateCell date={info.getValue()} />,
      header: 'Completion Date',
    }),
    columnHelper.accessor('status', {
      cell: (info) => <StatusBadge status={info.getValue()} />,
      header: 'Status',
    }),
    columnHelper.display({
      id: 'actions',
      cell: (info) => (
        <ActionButton 
          status={info.row.original.status} 
          assignmentID={info.row.original.assignmentID}
        />
      ),
      header: 'Action',
    }),    
  ];

  const table = useReactTable({
    data: assignedInductions,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    initialState: {
      pagination: { pageSize: 10 },
      sorting: [
        { id: 'status', desc: false },
        { id: 'dueDate', desc: false },
      ],
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="tableContainer">
      {loading ? (
        <div className="lg:hidden space-y-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="bg-white shadow-md rounded-lg p-4">
            <Skeleton active paragraph={{ rows: 1 }} title={false} />
            <Skeleton active paragraph={{ rows: 3 }} />
          </div>
        ))}
      </div>
      ) : assignedInductions.length === 0 ? (
        <div className="p-4 text-center text-black text-2xl font-bold">No inductions assigned.</div>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-4">
            <div className="relative flex-grow">
              <input
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block">
            <table className="min-w-full divide-y divide-gray-200 bg-white shadow-md rounded-lg">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <div
                          {...{
                            className: header.column.getCanSort() ? 'cursor-pointer select-none' : '',
                            onClick: header.column.getToggleSortingHandler(),
                          }}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && <ArrowUpDown className="ml-2" size={14} />}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 text-sm text-gray-500">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Induction Cards */}
          <div className="lg:hidden space-y-4">
            {table.getRowModel().rows.map((row) => (
              <div key={row.id} className="bg-white shadow-md rounded-lg p-4">
                <h3 className="text-lg font-semibold">
                  <Link to={`/induction/take?assignmentID=${row.original.assignmentID}`} className="text-black hover:underline">
                    {row.original.name}
                  </Link>
                </h3>
                <div className="text-sm text-gray-600 mt-2">
                  <p>
                    <span className="font-semibold">Available From:</span> <DateCell date={row.original.availableFrom} />
                  </p>
                  <p>
                    <span className="font-semibold">Due Date:</span> <DateCell date={row.original.dueDate} />
                  </p>
                  <p>
                    <span className="font-semibold">Completion Date:</span> <DateCell date={row.original.completionDate} />
                  </p>
                  <p>
                    <span className="font-semibold">Status:</span> <StatusBadge status={row.original.status} />
                  </p>
                </div>
                <div className="mt-4">
                  <ActionButton status={row.original.status} assignmentID={row.original.assignmentID} />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-700">
              {/* Items per page */}
              <div className="flex items-center mb-4 sm:mb-0">
                <span className="mr-2">Items per page</span>
                <select
                  className="border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2"
                  value={table.getState().pagination.pageSize}
                  onChange={(e) => {
                    table.setPageSize(Number(e.target.value));
                  }}
                >
                  {[10, 20, 30, 40].map((pageSize) => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize}
                    </option>
                  ))}
                </select>
              </div>
              {/* Pagination Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronsLeft size={20} />
                </button>
                <button
                  className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="flex items-center">
                  <input
                    min={1}
                    max={table.getPageCount()}
                    type="number"
                    value={table.getState().pagination.pageIndex + 1}
                    onChange={(e) => {
                      const page = e.target.value ? Number(e.target.value) - 1 : 0;
                      table.setPageIndex(page);
                    }}
                    className="w-16 p-2 rounded-md border border-gray-300 text-center"
                  />
                  <span className="ml-1">of {table.getPageCount()}</span>
                </span>
                <button
                  className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRight size={20} />
                </button>
                <button
                  className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronsRight size={20} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
  );
};

export default AssignedInductions;
