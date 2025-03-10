import { useState, useEffect } from 'react';
import { Modal, Input, Button, Skeleton } from 'antd';
import { TbArrowsExchange } from "react-icons/tb";
import { getAllUsers } from '../../api/UserApi';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const ChangeUser = ({ onUserSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isUserSearchModalVisible, setIsUserSearchModalVisible] = useState(false);
  const [loading, setLoading] = useState(false); // State to track loading status
  const { user: currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!authLoading && currentUser && searchQuery) { // Only fetch if there's a search query
        setLoading(true); // Start loading
        try {
          const data = await getAllUsers(currentUser);
          const filtered = data.filter(user =>
            user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.lastName.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setFilteredUsers(filtered); // Filter users based on the query
        } catch (error) {
          console.error('Error fetching users:', error);
        } finally {
          setLoading(false); // End loading
        }
      }
    };

    if (isUserSearchModalVisible) {
      fetchUsers(); // Fetch users when the modal is visible
    }
  }, [isUserSearchModalVisible, authLoading, currentUser, searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value); // Update search query
  };

  const handleSelectUser = (user) => {
    onUserSelect(user); // Send the selected user to the parent component
    setIsUserSearchModalVisible(false);
    navigate(location.pathname, { state: { uid: user.uid } });
  };

  return (
    <>
      <div className="flex justify-center mb-4">
        <Button
          onClick={() => setIsUserSearchModalVisible(true)}
          icon={<TbArrowsExchange />}
          className="bg-blue-500 text-white"
        >
          Change User
        </Button>
      </div>

      <Modal
        title="Search and Select a User"
        visible={isUserSearchModalVisible}
        onCancel={() => setIsUserSearchModalVisible(false)}
        footer={null}
        width={600}
      >
        <Input
          placeholder="Search by first or last name"
          value={searchQuery}
          onChange={handleSearchChange}
          className="mb-4"
        />
        <div className="space-y-2">
          {loading ? (
            <Skeleton active /> // Show loading skeleton while fetching
          ) : searchQuery && filteredUsers.length === 0 ? ( // Show "No users found" only if there's a search query and no users match
            <div>No users found</div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.uid} className="flex justify-between items-center py-2 border-b">
                <span>{user.firstName} {user.lastName}</span>
                <Button onClick={() => handleSelectUser(user)} type="primary">
                  Select
                </Button>
              </div>
            ))
          )}
        </div>
      </Modal>
    </>
  );
};

export default ChangeUser;
