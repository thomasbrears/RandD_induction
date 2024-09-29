import React, { useEffect, useState } from "react";
import { getAllUsers } from "../api/UserApi";
import useAuth from '../hooks/useAuth';

const UsersTable = () => {
  const [users, setUsers] = useState([]);
  const {user, loading} = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!loading && user) {
        try {
          const data = await getAllUsers(user, loading);
          setUsers(data);
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      }
    };
  
    fetchUsers();
  }, [user, loading]);

  return (
    <>
    <table>
      <thead>
        <tr>
          <th>UID</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.uid}>
            <td>{user.uid}</td>
            <td>{user.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
    </>
  );
};

export default UsersTable;
