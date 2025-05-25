import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../shared/Modal';
import { createCustomFieldDefinition } from '../../data_models/CustomFieldDefinition'; // For default values or new instances
import './CustomFieldsSettings.css'; // Styles for this component

// Form for creating/editing custom field definitions
const CustomFieldDefinitionForm = ({ onSubmit, onCancel, initialDefinitionData, isEditing = false }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('text'); // Default type
  const [options, setOptions] = useState(''); // Comma-separated string for dropdown options

  useEffect(() => {
    if (initialDefinitionData) {
      setName(initialDefinitionData.name || '');
      setType(initialDefinitionData.type || 'text');
      setOptions(initialDefinitionData.options ? initialDefinitionData.options.join(', ') : '');
    } else {
      setName('');
      setType('text');
      setOptions('');
    }
  }, [initialDefinitionData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !type) {
      alert('Field Name and Type are required.');
      return;
    }
    const definitionData = {
      name,
      type,
      options: type === 'dropdown' ? options.split(',').map(opt => opt.trim()).filter(opt => opt) : [],
    };
    if (type === 'dropdown' && definitionData.options.length === 0) {
      alert('Dropdown type must have at least one option.');
      return;
    }
    onSubmit(definitionData);
  };

  return (
    <form onSubmit={handleSubmit} className="modal-form">
      <div>
        <label htmlFor="cf-def-name">Field Name:</label>
        <input id="cf-def-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="cf-def-type">Field Type:</label>
        <select id="cf-def-type" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="text">Text</option>
          <option value="textarea">Textarea</option>
          <option value="number">Number</option>
          <option value="date">Date</option>
          <option value="dropdown">Dropdown</option>
          <option value="checkbox">Checkbox</option>
        </select>
      </div>
      {type === 'dropdown' && (
        <div>
          <label htmlFor="cf-def-options">Options (comma-separated):</label>
          <input id="cf-def-options" type="text" value={options} onChange={(e) => setOptions(e.target.value)} placeholder="e.g., High, Medium, Low" />
        </div>
      )}
      <div className="form-actions">
        <button type="submit" className="primary">{isEditing ? 'Save Changes' : 'Create Field'}</button>
        <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

CustomFieldDefinitionForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  initialDefinitionData: PropTypes.object,
  isEditing: PropTypes.bool,
};


// Main component for managing custom field definitions
const CustomFieldsSettings = ({ definitions, onAddDefinition, onEditDefinition, onDeleteDefinition }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDefinition, setEditingDefinition] = useState(null);
  const [modalMode, setModalMode] = useState('add');

  const openModal = (mode = 'add', definition = null) => {
    setModalMode(mode);
    setEditingDefinition(definition);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDefinition(null);
  };

  const handleFormSubmit = (definitionData) => {
    if (modalMode === 'edit' && editingDefinition) {
      onEditDefinition({ ...editingDefinition, ...definitionData });
    } else {
      onAddDefinition(definitionData);
    }
    closeModal();
  };

  return (
    <div className="custom-fields-settings-container">
      <div className="custom-fields-header">
        <h3>Custom Field Definitions</h3>
        <button onClick={() => openModal('add')} className="add-cf-btn">
          + Add Custom Field
        </button>
      </div>

      {definitions && definitions.length > 0 ? (
        <table className="cf-definitions-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Options (for Dropdown)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {definitions.map(def => (
              <tr key={def.id}>
                <td>{def.name}</td>
                <td>{def.type}</td>
                <td>{def.type === 'dropdown' ? def.options.join(', ') : 'N/A'}</td>
                <td className="cf-actions">
                  <button onClick={() => openModal('edit', def)} className="edit-btn">Edit</button>
                  <button onClick={() => onDeleteDefinition(def.id)} className="delete-btn">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No custom field definitions yet. Add some to start customizing your tasks!</p>
      )}

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={modalMode === 'edit' ? 'Edit Custom Field' : 'Add New Custom Field'}
        >
          <CustomFieldDefinitionForm
            onSubmit={handleFormSubmit}
            onCancel={closeModal}
            initialDefinitionData={editingDefinition}
            isEditing={modalMode === 'edit'}
          />
        </Modal>
      )}
    </div>
  );
};

CustomFieldsSettings.propTypes = {
  definitions: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(PropTypes.string),
    projectId: PropTypes.string,
  })).isRequired,
  onAddDefinition: PropTypes.func.isRequired,
  onEditDefinition: PropTypes.func.isRequired,
  onDeleteDefinition: PropTypes.func.isRequired,
};

export default CustomFieldsSettings;
