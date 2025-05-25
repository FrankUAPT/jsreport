import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../shared/Modal';
import UserForm from './UserForm';
import './UserManagement.css'; // For styling the user management page

const UserManagement = ({ users, onAddUser, onEditUser, onDeleteUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null for new user, user object for editing
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'

  const openModal = (mode = 'add', user = null) => {
    setModalMode(mode);
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleFormSubmit = (userData) => {
    if (modalMode === 'edit' && editingUser) {
      onEditUser({ ...editingUser, ...userData }); // Pass merged data including ID
    } else {
      onAddUser(userData);
    }
    closeModal();
  };

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <h2>User Management</h2>
        <button onClick={() => openModal('add')} className="add-user-btn">
          Add New User
        </button>
      </div>

      {users && users.length > 0 ? (
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email || 'N/A'}</td>
                <td className="user-actions">
                  <button onClick={() => openModal('edit', user)} className="edit-btn">Edit</button>
                  <button onClick={() => onDeleteUser(user.id)} className="delete-btn">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No users found. Add some users to get started!</p>
      )}

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={modalMode === 'edit' ? 'Edit User' : 'Add New User'}
        >
          <UserForm
            onSubmit={handleFormSubmit}
            onCancel={closeModal}
            initialUserData={editingUser}
            isEditing={modalMode === 'edit'}
          />
        </Modal>
      )}
    </div>
  );
};

UserManagement.propTypes = {
  users: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string,
  })).isRequired,
  onAddUser: PropTypes.func.isRequired,
  onEditUser: PropTypes.func.isRequired,
  onDeleteUser: PropTypes.func.isRequired,
};

export default UserManagement;
