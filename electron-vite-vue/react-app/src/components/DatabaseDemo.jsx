import React, { useState, useEffect } from 'react';
import dbClient from '../../../src/shared/database-client';
import './DatabaseDemo.css';

function DatabaseDemo() {
  // State
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [components, setComponents] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '' });
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [newComponent, setNewComponent] = useState({ 
    type: 'motor', 
    properties: '{"speed":50,"isRunning":false}', 
    position_x: 150, 
    position_y: 150 
  });
  
  const componentTypes = ['led', 'motor', 'battery', 'resistor', 'capacitor', 'switch'];

  // Connect to the database when the component mounts
  useEffect(() => {
    const connectToDb = async () => {
      try {
        setLoading(true);
        await dbClient.connect();
        
        // Register change listener
        dbClient.addChangeListener('react-app', handleDatabaseChange);
        
        // Load initial data
        await loadUsers();
        setLoading(false);
      } catch (err) {
        console.error('Failed to connect to database:', err);
        setError(err.message || String(err));
        setLoading(false);
      }
    };
    
    connectToDb();
    
    // Cleanup when the component unmounts
    return () => {
      dbClient.removeChangeListener('react-app');
      dbClient.disconnect();
    };
  }, []);

  // Handle database change events
  const handleDatabaseChange = (event) => {
    console.log('Database changed:', event);
    
    // Reload data based on the operation
    if (event.operation.sql?.toLowerCase().includes('users')) {
      loadUsers();
    } else if (event.operation.sql?.toLowerCase().includes('projects')) {
      if (selectedUserId) loadProjects(selectedUserId);
    } else if (event.operation.sql?.toLowerCase().includes('components')) {
      if (selectedProjectId) loadComponents(selectedProjectId);
    }
  };

  // Load users from the database
  const loadUsers = async () => {
    try {
      const loadedUsers = await dbClient.all('SELECT * FROM users ORDER BY name');
      setUsers(loadedUsers);
      
      // If there's at least one user, select the first one
      if (loadedUsers.length > 0 && !selectedUserId) {
        selectUser(loadedUsers[0].id);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(err.message || String(err));
    }
  };

  // Load projects for a user
  const loadProjects = async (userId) => {
    try {
      const loadedProjects = await dbClient.all(
        'SELECT * FROM projects WHERE user_id = ? ORDER BY name',
        [userId]
      );
      setProjects(loadedProjects);
      
      // If there's at least one project, select the first one
      if (loadedProjects.length > 0 && !selectedProjectId) {
        selectProject(loadedProjects[0].id);
      } else if (loadedProjects.length === 0) {
        setComponents([]);
        setSelectedProjectId(null);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError(err.message || String(err));
    }
  };

  // Load components for a project
  const loadComponents = async (projectId) => {
    try {
      const loadedComponents = await dbClient.all(
        'SELECT * FROM components WHERE project_id = ? ORDER BY type',
        [projectId]
      );
      setComponents(loadedComponents);
    } catch (err) {
      console.error('Failed to load components:', err);
      setError(err.message || String(err));
    }
  };

  // Select a user
  const selectUser = async (userId) => {
    setSelectedUserId(userId);
    setSelectedProjectId(null);
    setComponents([]);
    await loadProjects(userId);
  };

  // Select a project
  const selectProject = async (projectId) => {
    setSelectedProjectId(projectId);
    await loadComponents(projectId);
  };

  // Add a new user
  const addUser = async () => {
    if (!newUser.name || !newUser.email) {
      setError('Name and email are required');
      return;
    }
    
    try {
      await dbClient.query(
        'INSERT INTO users (name, email) VALUES (?, ?)',
        [newUser.name, newUser.email]
      );
      
      // Clear the form
      setNewUser({ name: '', email: '' });
      
      // Reload users
      await loadUsers();
    } catch (err) {
      console.error('Failed to add user:', err);
      setError(err.message || String(err));
    }
  };

  // Add a new project
  const addProject = async () => {
    if (!newProject.name || !selectedUserId) {
      setError('Name and user are required');
      return;
    }
    
    try {
      await dbClient.query(
        'INSERT INTO projects (name, description, user_id) VALUES (?, ?, ?)',
        [newProject.name, newProject.description, selectedUserId]
      );
      
      // Clear the form
      setNewProject({ name: '', description: '' });
      
      // Reload projects
      await loadProjects(selectedUserId);
    } catch (err) {
      console.error('Failed to add project:', err);
      setError(err.message || String(err));
    }
  };

  // Add a new component
  const addComponent = async () => {
    if (!selectedProjectId) {
      setError('Project is required');
      return;
    }
    
    try {
      // Validate JSON properties
      try {
        JSON.parse(newComponent.properties);
      } catch (err) {
        setError('Invalid JSON properties');
        return;
      }
      
      await dbClient.query(
        'INSERT INTO components (project_id, type, properties, position_x, position_y) VALUES (?, ?, ?, ?, ?)',
        [
          selectedProjectId,
          newComponent.type,
          newComponent.properties,
          newComponent.position_x,
          newComponent.position_y
        ]
      );
      
      // Reset form
      setNewComponent({ 
        type: 'motor', 
        properties: '{"speed":50,"isRunning":false}', 
        position_x: 150, 
        position_y: 150 
      });
      
      // Reload components
      await loadComponents(selectedProjectId);
    } catch (err) {
      console.error('Failed to add component:', err);
      setError(err.message || String(err));
    }
  };

  // Update a component property
  const updateComponentProperty = async (component, isRunning) => {
    try {
      // Parse the properties
      const properties = JSON.parse(component.properties);
      
      // Update the property
      if ('isRunning' in properties) {
        properties.isRunning = isRunning;
      } else if ('isOn' in properties) {
        properties.isOn = isRunning;
      }
      
      // Update the component in the database
      await dbClient.query(
        'UPDATE components SET properties = ? WHERE id = ?',
        [JSON.stringify(properties), component.id]
      );
      
      // Reload components
      await loadComponents(selectedProjectId);
    } catch (err) {
      console.error('Failed to update component:', err);
      setError(err.message || String(err));
    }
  };

  // Delete a component
  const deleteComponent = async (componentId) => {
    try {
      await dbClient.query('DELETE FROM components WHERE id = ?', [componentId]);
      
      // Reload components
      await loadComponents(selectedProjectId);
    } catch (err) {
      console.error('Failed to delete component:', err);
      setError(err.message || String(err));
    }
  };

  return (
    <div className="database-demo">
      <h2>React SQLite Database Demo</h2>
      
      {loading && (
        <div className="loading">
          Loading...
        </div>
      )}
      
      {error && (
        <div className="error">
          Error: {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      <div className="database-layout">
        {/* Users Section */}
        <div className="section users-section">
          <h3>Users</h3>
          <ul className="list">
            {users.map(user => (
              <li
                key={user.id}
                className={selectedUserId === user.id ? 'selected' : ''}
                onClick={() => selectUser(user.id)}
              >
                <div className="item-name">{user.name}</div>
                <div className="item-detail">{user.email}</div>
              </li>
            ))}
          </ul>
          
          <div className="form">
            <h4>Add User</h4>
            <div className="form-field">
              <label>Name:</label>
              <input
                type="text"
                placeholder="Name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Email:</label>
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>
            <button onClick={addUser}>Add User</button>
          </div>
        </div>
        
        {/* Projects Section */}
        <div className="section projects-section">
          <h3>Projects</h3>
          {selectedUserId ? (
            <ul className="list">
              {projects.length > 0 ? (
                projects.map(project => (
                  <li
                    key={project.id}
                    className={selectedProjectId === project.id ? 'selected' : ''}
                    onClick={() => selectProject(project.id)}
                  >
                    <div className="item-name">{project.name}</div>
                    <div className="item-detail">{project.description}</div>
                  </li>
                ))
              ) : (
                <li className="empty">No projects found</li>
              )}
            </ul>
          ) : (
            <div className="empty">Select a user to view projects</div>
          )}
          
          {selectedUserId && (
            <div className="form">
              <h4>Add Project</h4>
              <div className="form-field">
                <label>Name:</label>
                <input
                  type="text"
                  placeholder="Name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Description:</label>
                <textarea
                  placeholder="Description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                />
              </div>
              <button onClick={addProject}>Add Project</button>
            </div>
          )}
        </div>
        
        {/* Components Section */}
        <div className="section components-section">
          <h3>Components</h3>
          {selectedProjectId ? (
            <ul className="list">
              {components.length > 0 ? (
                components.map(component => {
                  const props = JSON.parse(component.properties);
                  const hasToggle = 'isRunning' in props || 'isOn' in props;
                  const isActive = props.isRunning || props.isOn;
                  
                  return (
                    <li key={component.id} className="component-item">
                      <div className="component-header">
                        <div className="item-name">{component.type}</div>
                        <button className="delete-btn" onClick={() => deleteComponent(component.id)}>
                          Delete
                        </button>
                      </div>
                      <div className="component-properties">
                        <pre>{JSON.stringify(props, null, 2)}</pre>
                        {hasToggle && (
                          <div className="toggle">
                            <label>
                              <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => updateComponentProperty(component, e.target.checked)}
                              />
                              Toggle State
                            </label>
                          </div>
                        )}
                      </div>
                      <div className="component-position">
                        Position: ({component.position_x}, {component.position_y})
                      </div>
                    </li>
                  );
                })
              ) : (
                <li className="empty">No components found</li>
              )}
            </ul>
          ) : (
            <div className="empty">Select a project to view components</div>
          )}
          
          {selectedProjectId && (
            <div className="form">
              <h4>Add Component</h4>
              <div className="form-field">
                <label>Type:</label>
                <select
                  value={newComponent.type}
                  onChange={(e) => setNewComponent({ ...newComponent, type: e.target.value })}
                >
                  {componentTypes.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Properties (JSON):</label>
                <textarea
                  placeholder="JSON Properties"
                  value={newComponent.properties}
                  onChange={(e) => setNewComponent({ ...newComponent, properties: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Position X:</label>
                <input
                  type="number"
                  value={newComponent.position_x}
                  onChange={(e) => setNewComponent({ ...newComponent, position_x: Number(e.target.value) })}
                />
              </div>
              <div className="form-field">
                <label>Position Y:</label>
                <input
                  type="number"
                  value={newComponent.position_y}
                  onChange={(e) => setNewComponent({ ...newComponent, position_y: Number(e.target.value) })}
                />
              </div>
              <button onClick={addComponent}>Add Component</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DatabaseDemo;
