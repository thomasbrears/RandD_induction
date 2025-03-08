import React, { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";
import {
  List,
  FileText,
  BookType,
  ArrowUpDown,
  Search,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import "../style/Table.css";
import Loading from './Loading';
import { Link, useNavigate } from "react-router-dom";
import { FaUserEdit, FaUserPlus, FaChartBar } from "react-icons/fa";
import { getAllInductions } from "../api/InductionApi";
import "react-quill/dist/quill.snow.css";

const columnHelper = createColumnHelper();

const InductionsTable = () => {
  const navigate = useNavigate();
  const [inductions, setInductions] = useState([]);
  const { user, loading: authLoading } = useAuth();
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleEditInduction = async (id) => {
    navigate("/management/inductions/edit", { state: { id } });
  };

  const handleViewInductionResults = async (id) => {
    navigate("/management/inductions/results/view", { state: { id } });
  };

  const handleInductionAssignment = async (id) => {
    navigate("/management/users/inductions", { state: { id } });
  };

  const columns = [
    columnHelper.accessor("name", {
      cell: (info) => (
        <div className="break-words text-sm ">{info.getValue()}</div>
      ),
      header: () => (
        <span className="flex items-center">
          <BookType className="mr-2" size={16} /> Induction Title
        </span>
      ),
    }),

    columnHelper.accessor("department", {
      cell: (info) => <span className="whitespace-nowrap">{info.getValue()}</span>,
      header: () => (
        <span className="flex items-center">
          <List className="mr-2" size={16} /> Department
        </span>
      ),
    }),

    columnHelper.accessor("description", {
      cell: (info) => (
        <div className="prose !max-w-xs break-words text-base text-sm font-heliaCoreBook text-gray-500">
          <div dangerouslySetInnerHTML={{ __html: info.getValue() }} />
        </div>
      ),
      header: () => (
        <span className="flex items-center">
          <FileText className="mr-2" size={16} /> Description
        </span>
      ),
    }),

    {
      id: "actions",
      header: () => <span></span>,
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEditInduction(row.original.id)}
            className="text-white bg-gray-700 hover:bg-gray-900 px-3 py-1 rounded"
          >
            <FaUserEdit className="inline mr-2" /> Edit
          </button>
          <button
            onClick={() => handleViewInductionResults(row.original.id)}
            className="text-white bg-gray-700 hover:bg-gray-900 px-3 py-1 rounded"
          >
            <FaChartBar className="inline mr-2" /> View Results
          </button>
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
        } catch (error) {
          console.error("Error fetching inductions:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchInductions();
  }, [user, authLoading]);

  const table = useReactTable({
    data: inductions,
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
    <div className="tableContainer">
      {loading ? (
        <Loading message={loadingMessage} />
      ) : (
        <>
          {/*Search Bar*/}
          <div className="mb-4 flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-grow">
              <input
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
            </div>

            {/*Desktop buttons*/}
            <div className="lg:flex gap-4 hidden mt-4 lg:mt-0">
              <Link to={"/management/inductions/create"}>
                <button className="text-white bg-blue-500 hover:bg-blue-600 px-3 py-2 rounded-md">
                  <FaUserPlus className="inline mr-2" /> Create New Induction
                </button>
              </Link>
            </div>

            {/* Mobile Buttons Below Search */}
            <div className="lg:hidden mt-4 space-y-2">
              <Link to={"/management/inductions/create"}>
                <button className="text-white bg-blue-500 hover:bg-blue-600 px-3 py-2 rounded-md">
                  <FaUserPlus className="inline mr-2" /> Create New Induction
                </button>
              </Link>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block mt-2">
            <div className="!w-full">
              <table className="w-full table-auto max-w-full min-w-full divide-y divide-gray-200 bg-white shadow-md rounded-lg">
                <thead className="bg-gray-50 max-w-[200px] md:max-w-[300px]">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className={`px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${header.id === "actions" ? "w-[250px]" : "max-w-[200px] md:max-w-[250px]"
                            }`}
                        >
                          <div
                            {...{
                              className: header.column.getCanSort()
                                ? "cursor-pointer select-none flex items-center"
                                : "",
                              onClick: header.column.getToggleSortingHandler(),
                            }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            <ArrowUpDown className="ml-2" size={14} />
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
                          className={`px-6 py-4 text-sm text-gray-500 ${cell.column.id === "actions" ? "w-[250px]" : "max-w-[200px] md:max-w-[250px]"
                            }`}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile List of Table */}
          <div className="lg:hidden space-y-4">
            {table.getRowModel().rows.map((row) => (
              <div key={row.id} className="bg-white shadow-md rounded-lg p-4">
                {/* Induction Title */}
                <h3 className="text-lg font-semibold break-words whitespace-normal">
                  <Link to={`/inductions/${row.original.id}`} className="text-black hover:underline">
                    {row.original.name}
                  </Link>
                </h3>

                <div className="text-sm text-gray-600 mt-2 break-words whitespace-normal">
                  <p>
                    <span className="font-semibold">Department: </span>
                    <a href={`mailto:${row.original.department}`} className="text-blue-500 hover:underline">
                      {row.original.department}
                    </a>
                  </p>
                  <p>
                    <span className="font-semibold">Description: </span>
                    <span className="prose !max-w-none text-base">
                      <div dangerouslySetInnerHTML={{ __html: row.original.description }} />
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap">
                  <button
                    onClick={() => handleEditInduction(row.original.id)}
                    className="text-white bg-gray-700 hover:bg-gray-900 px-3 py-1 rounded mt-2 mr-2"
                  >
                    <FaUserEdit className="inline ml-2" /> Edit
                  </button>
                  <button
                    onClick={() => handleViewInductionResults(row.original.id)}
                    className="text-white bg-gray-700 hover:bg-gray-900 px-3 py-1 rounded mt-2 mr-2"
                  >
                    <FaChartBar className="inline mr-2" /> View Results
                  </button>
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

export default InductionsTable;
