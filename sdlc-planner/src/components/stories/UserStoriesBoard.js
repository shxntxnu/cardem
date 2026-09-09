import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addStory, deleteStory, updateStory } from '../../actions/projectActions';
import { setAlert } from '../../actions/alertActions';

const UserStoriesBoard = () => {
  const dispatch = useDispatch();
  const stories = useSelector(
    (state) => state.project.currentProject.stories || []
  );

  const [filterEpic, setFilterEpic] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // New story modal state
  const [newStory, setNewStory] = useState({
    id: `US-${Date.now().toString().slice(-4)}`,
    title: '',
    epic: 'CORE',
    points: 3,
    priority: 'Must',
    status: 'To Do',
    statement: ''
  });

  // Calculate story points metrics
  const totalPoints = stories.reduce((acc, s) => acc + (parseInt(s.points) || 0), 0);
  const epicsList = ['ALL', ...new Set(stories.map((s) => s.epic))];

  const filteredStories = stories.filter((s) => {
    const matchEpic = filterEpic === 'ALL' || s.epic === filterEpic;
    const matchPriority = filterPriority === 'ALL' || s.priority === filterPriority;
    return matchEpic && matchPriority;
  });

  const handleSaveStory = (e) => {
    e.preventDefault();
    if (!newStory.title || !newStory.statement) return;

    dispatch(addStory({ ...newStory }));
    setNewStory({
      id: `US-${Date.now().toString().slice(-4)}`,
      title: '',
      epic: 'CORE',
      points: 3,
      priority: 'Must',
      status: 'To Do',
      statement: ''
    });
    setShowAddModal(false);
    dispatch(setAlert('User story created and added to backlog', 'success'));
  };

  const handleStatusChange = (story, newStatus) => {
    dispatch(updateStory({ ...story, status: newStatus }));
    dispatch(setAlert(`Story status changed to "${newStatus}"`, 'info'));
  };

  return (
    <div className="tab-content">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <i className="fa-solid fa-list-check" style={{ color: 'var(--accent-emerald)' }}></i>
            Agile User Stories & Story Points Matrix
          </h2>
          <p className="section-desc">
            Granular functional backlog with Fibonacci story points estimation, MoSCoW prioritization, and sprint allocation.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
          <i className="fa-solid fa-plus"></i>
          Add User Story
        </button>
      </div>

      {/* Story Points Analytics Banner */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.85)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Estimated Velocity & Complexity
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>
              {totalPoints} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Story Points</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginLeft: '12px' }}>
                ({stories.length} User Stories in Backlog)
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ padding: '0.5rem 0.85rem', background: 'rgba(30, 41, 59, 0.6)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Avg Points / Story</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-indigo)' }}>
                {stories.length ? (totalPoints / stories.length).toFixed(1) : 0} pts
              </div>
            </div>
            <div style={{ padding: '0.5rem 0.85rem', background: 'rgba(30, 41, 59, 0.6)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Sprint Allocation</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-emerald)' }}>
                {Math.ceil(totalPoints / 20)} Sprints (~20 pts/ea)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="story-filters">
        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: '600' }}>Filter by Epic:</span>
        {epicsList.map((ep) => (
          <button
            key={ep}
            className={`filter-btn ${filterEpic === ep ? 'active' : ''}`}
            onClick={() => setFilterEpic(ep)}
          >
            {ep}
          </button>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: '600' }}>Priority:</span>
          {['ALL', 'Must', 'Should', 'Could'].map((p) => (
            <button
              key={p}
              className={`filter-btn ${filterPriority === p ? 'active' : ''}`}
              onClick={() => setFilterPriority(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stories Grid */}
      <div className="stories-grid">
        {filteredStories.map((story) => (
          <div key={story.id} className="story-card">
            <div>
              <div className="story-card-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="story-id">{story.id}</span>
                  <span className="badge badge-purple">{story.epic}</span>
                  <span className={`badge ${story.priority === 'Must' ? 'badge-rose' : 'badge-amber'}`}>
                    {story.priority}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="point-badge">{story.points} pts</span>
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ padding: '0.2rem 0.4rem' }}
                    onClick={() => dispatch(deleteStory(story.id))}
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>

              <h4 className="story-title">{story.title}</h4>
              <p className="story-statement">{story.statement}</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Status:</span>
              <select
                className="form-select"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', height: 'auto' }}
                value={story.status || 'To Do'}
                onChange={(e) => handleStatusChange(story, e.target.value)}
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Add Story Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Agile User Story</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleSaveStory}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Story ID</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newStory.id}
                      onChange={(e) => setNewStory({ ...newStory, id: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Story Title</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Idempotent Reaction Endpoint"
                      value={newStory.title}
                      onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Epic Code</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. AUTH, PROF, POST"
                      value={newStory.epic}
                      onChange={(e) => setNewStory({ ...newStory, epic: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fibonacci Points</label>
                    <select
                      className="form-select"
                      value={newStory.points}
                      onChange={(e) => setNewStory({ ...newStory, points: parseInt(e.target.value) })}
                    >
                      <option value="1">1 pt (Trivial)</option>
                      <option value="2">2 pts (Simple CRUD)</option>
                      <option value="3">3 pts (Standard Feature)</option>
                      <option value="5">5 pts (Complex / External)</option>
                      <option value="8">8 pts (Major Cascade)</option>
                      <option value="13">13 pts (Epic Spike)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">MoSCoW Priority</label>
                    <select
                      className="form-select"
                      value={newStory.priority}
                      onChange={(e) => setNewStory({ ...newStory, priority: e.target.value })}
                    >
                      <option value="Must">Must Have</option>
                      <option value="Should">Should Have</option>
                      <option value="Could">Could Have</option>
                      <option value="Won't">Won't Have</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">User Story Statement (Role / Action / Benefit)</label>
                  <textarea
                    className="form-textarea"
                    placeholder="As a <Role>, I want <Action>, So that <Benefit>..."
                    value={newStory.statement}
                    onChange={(e) => setNewStory({ ...newStory, statement: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add to Backlog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserStoriesBoard;
