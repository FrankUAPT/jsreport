import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const UserForm = ({ onSubmit, onCancel, initialUserData, isEditing = false }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (initialUserData) {
      setName(initialUserData.name || '');
      setEmail(initialUserData.email || '');
    } else {
      setName('');
      setEmail('');
    }
  }, [initialUserData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) {
      alert('User Name is required.');
      return;
    }
    // Basic email validation (optional)
    if (email && !/\S+@\S+\.\S+/.test(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    onSubmit({ name, email });
  };

  return (
    <form onSubmit={handleSubmit} className="modal-form">
      <div>
        <label htmlFor="user-name">Name:</label>
        <input
          id="user-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="user-email">Email (optional):</label>
        <input
          id="user-email"
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="form-actions">
        <button type="submit" className="primary">{isEditing ? 'Save Changes' : 'Create User'}</button>
        <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

UserForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  initialUserData: PropTypes.shape({
    id: PropTypes.string, // Not used in form directly but part of user data
    name: PropTypes.string,
    email: PropTypes.string,
  }),
  isEditing: PropTypes.bool,
};

export default UserForm;
