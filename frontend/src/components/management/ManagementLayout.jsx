import React, { useState } from "react";
import { Layout, Menu, Drawer, Button } from "antd";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaUsers, FaCog, FaListAlt, FaUserPlus, FaChartBar } from "react-icons/fa";
import { IoCreate } from "react-icons/io5";
import useAuth from "../../hooks/useAuth";
import { FaBars } from "react-icons/fa";

const { Sider, Content } = Layout;

const ManagementLayout = ({ title, subtext, children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(true); // Start collapsed by default
  const [drawerVisible, setDrawerVisible] = useState(false); // Drawer visibility state

  if (!user) return null;

  const menuItems = [
    { key: "dashboard", label: <Link to="/management/dashboard">Dashboard</Link>, icon: <FaHome /> },
    { key: "view-users", label: <Link to="/management/users/view" className="sublink">View Users</Link>, icon: <FaUsers /> },
    { key: "create-user", label: <Link to="/management/users/create" className="sublink">Create User</Link>, icon: <FaUserPlus /> },
    { key: "view-inductions", label: <Link to="/management/inductions/view" className="sublink">View Inductions</Link>, icon: <FaListAlt /> },
    { key: "create-induction", label: <Link to="/management/inductions/create" className="sublink">Create Induction</Link>, icon: <IoCreate /> },
    { key: "view-results", label: <Link to="/management/inductions/results" className="sublink">View Results</Link>, icon: <FaChartBar /> },
    user.role === "admin" && { key: "settings", label: <Link to="/admin/settings">Settings</Link>, icon: <FaCog /> },
  ].filter(Boolean); // Remove null values

  const toggleDrawer = () => {
    setDrawerVisible(!drawerVisible);
  };

  return (
    <Layout style={{ minHeight: "100vh", display: "flex" }}>
      {/* Sidebar for desktop */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        onMouseEnter={() => setCollapsed(false)} // Expand on hover
        onMouseLeave={() => setCollapsed(true)}  // Collapse when not hovering
        style={{
          height: "100vh",
          position: "sticky", // Make the sidebar sticky
          top: 0,  // Keep it at the top when scrolling
          left: 0,
          overflow: "auto",
        }}
        className="hidden md:block" // Hide the sidebar on mobile
      >
        <Menu
          mode="inline"
          defaultSelectedKeys={[location.pathname]}
          theme="light"
          items={menuItems}
        />
      </Sider>

      {/* Drawer for mobile */}
      <Drawer
        title=""
        placement="left"
        closable={false}
        onClose={toggleDrawer}
        visible={drawerVisible}
        width={250}
      >
        <Menu
          mode="inline"
          defaultSelectedKeys={[location.pathname]}
          theme="light"
          items={menuItems}
        />
      </Drawer>

      <Layout style={{ flex: 1 }}>
        <Content style={{ padding: "24px", overflow: "auto" }}>
          <div className="flex items-center mb-4 border-b pb-2">
            {/* managementmenu button for mobile */}
            <Button
              type="primary"
              shape="circle"
              icon={<FaBars />}
              size="large"
              onClick={toggleDrawer}
              className="block md:hidden mr-2"  
            />

            <div className="ml-2">
              <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
              {subtext && <p className="text-gray-600">{subtext}</p>}
            </div>
          </div>

          {/* Render content passed as children */}
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default ManagementLayout;
