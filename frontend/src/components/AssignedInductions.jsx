import React, { useState, useEffect } from 'react';
import { getAssignedInductions } from '../api/InductionApi';
import useAuth from '../hooks/useAuth';
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

const columnHelper = createColumnHelper();

const AssignedInductions = ({ uid }) => {
  const [assignedInductions, setAssignedInductions] = useState([]);
  const { user } = useAuth();
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');

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

  const statusColors = {
    [Status.ASSIGNED]: 'border-blue-500 text-blue-500',
    [Status.IN_PROGRESS]: 'border-yellow-500 text-yellow-500',
    [Status.COMPLETED]: 'border-green-500 text-green-500',
    [Status.OVERDUE]: 'border-red-500 text-red-500',
  };
const statusOrder = {
  [Status.OVERDUE]: 1,
  [Status.ASSIGNED]: 2,
  [Status.IN_PROGRESS]: 3,
  [Status.COMPLETE]: 4,
};
  const isActionableStatus = (status) => {
    return [Status.ASSIGNED, Status.IN_PROGRESS, Status.OVERDUE].includes(status);
  };

  const columns = [
    columnHelper.accessor('name', {
      cell: (info) => {
        const inductionId = info.row.original.id;
        const status = info.row.original.status;

        return isActionableStatus(status) ? (
          <Link to={`/induction/${inductionId}`} className="text-black hover:underline">
            {info.getValue()}
          </Link>
        ) : (
          <span>{info.getValue()}</span>
        );
      },
      header: () => (
        <span className="flex items-center">
          Induction Name
        </span>
      ),
    }),
    columnHelper.accessor('availableFrom', {
      cell: (info) =>
        info.getValue()
          ? new Date(info.getValue()).toLocaleDateString()
          : 'N/A',
      header: () => (
        <span className="flex items-center">
          Available From
        </span>
      ),
    }),
    columnHelper.accessor('dueDate', {
      cell: (info) =>
        info.getValue()
          ? new Date(info.getValue()).toLocaleDateString()
          : 'N/A',
      header: () => (
        <span className="flex items-center">
          Due Date
        </span>
      ),
    }),
    columnHelper.accessor('completionDate', {
      cell: (info) =>
        info.getValue()
          ? new Date(info.getValue()).toLocaleDateString()
          : 'N/A',
      header: () => (
        <span className="flex items-center">
          Completion Date
        </span>
      ),
    }),
    columnHelper.accessor('status', {
      cell: (info) => {
        const status = info.getValue();
        const displayedStatus = status === Status.ASSIGNED ? 'To Complete' : status;
        const colorClasses = statusColors[status] || 'border-gray-500 text-gray-500';

        return (
          <span className={`px-2 py-1 border rounded ${colorClasses}`}>
            {displayedStatus}
          </span>
        );
      },
      header: () => (
        <span className="flex items-center">
          Status
        </span>
      ),
      sortingFn: (rowA, rowB, columnId) => {
        const statusA = rowA.getValue(columnId);
        const statusB = rowB.getValue(columnId);

        const orderA = statusOrder[statusA] || 999;
        const orderB = statusOrder[statusB] || 999;

        return orderA - orderB;
      },
    }),
    // Action column
    columnHelper.display({
      id: 'actions',
      cell: (info) => {
        const status = info.row.original.status;
        const inductionId = info.row.original.id;

        if (isActionableStatus(status)) {
          return (
            <Link to={`/induction/${inductionId}`}>
              <button className="text-white bg-gray-800 hover:bg-gray-900 px-3 py-1 rounded">
                {status === Status.IN_PROGRESS ? 'Continue' : 'Start'}
              </button>
            </Link>
          );
        } else if (status === Status.COMPLETED) {
          return (
            <Link to={`/induction-results/${inductionId}`}>
              <button className="text-white bg-gray-800 hover:bg-gray-900 px-3 py-1 rounded">
                View Results
              </button>
            </Link>
          );
        } else {
          return null;
        }
      },
      header: () => (
        <span className="flex items-center">
          Action
        </span>
      ),
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
      pagination: {
        pageSize: 10,
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <>
      <div className="tableContainer">
        {assignedInductions.length === 0 ? (
          <div className="p-4 text-center text-black text-2xl font-bold">
            No inductions assigned.
          </div>
        ) : (
          <>
            {/* Search Input */}
            <div className="mb-4 flex items-center gap-4">
              <div className="relative flex-grow">
                <input
                  value={globalFilter ?? ''}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Search..."
                  className="box-size-border w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
              </div>
            </div>
            {/* Table */}
            <div className="overflow-x-auto bg-white shadow-md rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          <div
                            {...{
                              className: header.column.getCanSort()
                                ? 'cursor-pointer select-none flex items-center'
                                : '',
                              onClick: header.column.getToggleSortingHandler(),
                            }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {header.column.getCanSort() && (
                              <ArrowUpDown className="ml-2" size={14} />
                            )}
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
                        <td
                          key={cell.id}
                          className="px-6 py-4 text-sm text-gray-500"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex sm:flex-row justify-between items-center mt-4 text-sm text-gray-700">
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
    </>
  );
};

export default AssignedInductions;
