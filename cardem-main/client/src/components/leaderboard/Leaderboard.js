import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { getConvoyLeaderboard, getGlobalLeaderboard, getMyStats, deleteConvoyHistory } from '../../actions/stats';

const Leaderboard = ({
  getConvoyLeaderboard,
  getGlobalLeaderboard,
  getMyStats,
  deleteConvoyHistory,
  stats: { convoyLeaderboard, globalLeaderboard, myStats, loading }
}) => {
  const [searchParams] = useSearchParams();
  const convoyParam = searchParams.get('convoy');
  const [activeTab, setActiveTab] = useState(convoyParam ? 'convoy' : 'global');

  useEffect(() => {
    if (convoyParam) {
      getConvoyLeaderboard(convoyParam);
    }
    getGlobalLeaderboard();
    getMyStats();
  }, [convoyParam, getConvoyLeaderboard, getGlobalLeaderboard, getMyStats]);

  const topSpeedLeaders = convoyLeaderboard?.top_speed_leaderboard || [];
  const safetyLeaders = convoyLeaderboard?.safety_leaderboard || [];

  const globalSpeed = globalLeaderboard?.top_speed_records || [];
  const globalSafety = globalLeaderboard?.safest_drivers || [];

  return (
    <div className="leaderboard-container animate-fade-in">
      <div className="leaderboard-header">
        <h1 className="page-title">
          <span className="text-gradient">Drive Telemetry & Leaderboard</span> 🏆
        </h1>
        <p className="subtitle">
          Group performance statistics, highest top speeds recorded, and safest driver honors.
        </p>

        {/* Tab Selector */}
        <div className="tab-pill-group">
          {convoyParam && (
            <button
              className={`tab-pill ${activeTab === 'convoy' ? 'active' : ''}`}
              onClick={() => setActiveTab('convoy')}
            >
              🏁 Convoy Session Results
            </button>
          )}
          <button
            className={`tab-pill ${activeTab === 'global' ? 'active' : ''}`}
            onClick={() => setActiveTab('global')}
          >
            🌍 Global Enthusiast Rankings
          </button>
          <button
            className={`tab-pill ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            👤 My Driving Metrics
          </button>
        </div>
      </div>

      {loading ? (
        <div className="hud-card loading-card">
          <div className="loading-spinner"></div>
          <p>Compiling telemetry logs...</p>
        </div>
      ) : (
        <>
          {/* Convoy Leaderboard Tab */}
          {activeTab === 'convoy' && (
            <div className="tab-content animate-fade-in space-y-6">
              <div className="leaderboard-grid">
                {/* Top Speed Card */}
                <div className="hud-card ranking-card">
                  <div className="ranking-header">
                    <h2>🚀 Top Speed Leaderboard</h2>
                    <span className="subtext">Measured via GPS telemetry</span>
                  </div>

                  {topSpeedLeaders.length === 0 ? (
                    <p className="empty-subtext">No drive sessions logged for this convoy yet.</p>
                  ) : (
                    <div className="rank-list">
                      {topSpeedLeaders.map((record, idx) => (
                        <div key={record._id || idx} className="rank-item">
                          <span className={`rank-position rank-${idx + 1}`}>
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                          </span>
                          <div className="rank-user">
                            <span className="user-name">{record.driver?.name || 'Driver'}</span>
                            <span className="user-sub">
                              {record.vehicle?.make ? `${record.vehicle.make} ${record.vehicle.model}` : 'Enthusiast'}
                            </span>
                          </div>
                          <div className="rank-score">
                            <span className="speed-stat">{Math.round(record.top_speed_kmh)}</span>
                            <span className="stat-unit">km/h</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Safest Driver Card */}
                <div className="hud-card ranking-card">
                  <div className="ranking-header">
                    <h2>🛡️ Safest Driver Rating</h2>
                    <span className="subtext">Smooth braking, pacing & throttle control</span>
                  </div>

                  {safetyLeaders.length === 0 ? (
                    <p className="empty-subtext">No safety ratings computed yet.</p>
                  ) : (
                    <div className="rank-list">
                      {safetyLeaders.map((record, idx) => (
                        <div key={record._id || idx} className="rank-item">
                          <span className={`rank-position rank-${idx + 1}`}>
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                          </span>
                          <div className="rank-user">
                            <span className="user-name">{record.driver?.name || 'Driver'}</span>
                            <span className="user-sub">
                              Harsh brakes: {record.harsh_braking_count || 0}
                            </span>
                          </div>
                          <div className="rank-score">
                            <span className="safety-stat text-success">{record.safety_score}%</span>
                            <span className="stat-unit">Safety Score</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Global Leaderboard Tab */}
          {activeTab === 'global' && (
            <div className="tab-content animate-fade-in space-y-6">
              <div className="leaderboard-grid">
                {/* Global Top Speed */}
                <div className="hud-card ranking-card">
                  <div className="ranking-header">
                    <h2>🏆 Global Top Speed Hall of Fame</h2>
                    <span className="subtext">All-time top speeds recorded in convoys</span>
                  </div>

                  {globalSpeed.length === 0 ? (
                    <p className="empty-subtext">No global records yet. Be the first to hit the asphalt!</p>
                  ) : (
                    <div className="rank-list">
                      {globalSpeed.map((item, idx) => (
                        <div key={item._id || idx} className="rank-item">
                          <span className={`rank-position rank-${idx + 1}`}>
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                          </span>
                          <div className="rank-user">
                            <span className="user-name">{item.driver?.name || 'Enthusiast'}</span>
                            <span className="user-sub">{item.convoy_name || 'Group Drive'}</span>
                          </div>
                          <div className="rank-score">
                            <span className="speed-stat">{Math.round(item.top_speed_kmh)}</span>
                            <span className="stat-unit">km/h</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Global Safest Drivers */}
                <div className="hud-card ranking-card">
                  <div className="ranking-header">
                    <h2>🌟 Safest Drivers Pack</h2>
                    <span className="subtext">Mastery in convoy safety & smooth navigation</span>
                  </div>

                  {globalSafety.length === 0 ? (
                    <p className="empty-subtext">No safety data recorded.</p>
                  ) : (
                    <div className="rank-list">
                      {globalSafety.map((item, idx) => (
                        <div key={item._id || idx} className="rank-item">
                          <span className={`rank-position rank-${idx + 1}`}>
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                          </span>
                          <div className="rank-user">
                            <span className="user-name">{item.driver?.name || 'Enthusiast'}</span>
                            <span className="user-sub">{item.convoy_name || 'Pack Drive'}</span>
                          </div>
                          <div className="rank-score">
                            <span className="safety-stat text-success">{item.safety_score}%</span>
                            <span className="stat-unit">Rating</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Personal Driving Metrics Tab */}
          {activeTab === 'personal' && (
            <div className="tab-content animate-fade-in space-y-6">
              <div className="personal-stats-grid">
                <div className="hud-card stat-metric-card">
                  <span className="metric-icon">🏎️</span>
                  <span className="metric-label">Max Top Speed</span>
                  <h3 className="metric-val">
                    {Math.round(myStats?.max_top_speed || myStats?.summary?.max_speed_kph || 0)} km/h
                  </h3>
                </div>

                <div className="hud-card stat-metric-card">
                  <span className="metric-icon">🛡️</span>
                  <span className="metric-label">Average Safety Rating</span>
                  <h3 className="metric-val text-success">
                    {Math.round(myStats?.avg_safety_rating || myStats?.summary?.average_safety_score || 100)}%
                  </h3>
                </div>

                <div className="hud-card stat-metric-card">
                  <span className="metric-icon">🏁</span>
                  <span className="metric-label">Total Convoys Driven</span>
                  <h3 className="metric-val">
                    {myStats?.total_convoys !== undefined ? myStats.total_convoys : (myStats?.summary?.total_drives || 0)}
                  </h3>
                </div>

                <div className="hud-card stat-metric-card">
                  <span className="metric-icon">🛣️</span>
                  <span className="metric-label">Total Distance Logged</span>
                  <h3 className="metric-val">
                    {((myStats?.total_distance_km !== undefined ? myStats.total_distance_km : myStats?.summary?.total_distance_km) || 0).toFixed(1)} km
                  </h3>
                </div>
              </div>

              {/* Personal Drive History List */}
              <div className="personal-history-section">
                <div className="ranking-header">
                  <h2>📜 Drive & Convoy History</h2>
                  <span className="subtext">
                    Delete individual sessions from your personal driving logs. Removing a convoy only deletes your personal stats and leaves other participants intact.
                  </span>
                </div>

                {(!myStats?.history || myStats.history.length === 0) ? (
                  <div className="hud-card empty-history-card">
                    <p className="empty-subtext">No personal convoy sessions recorded yet.</p>
                  </div>
                ) : (
                  <div className="history-list space-y-3">
                    {myStats.history.map((drive) => {
                      const convoyId = (drive.convoy?._id || drive.convoy)?.toString();
                      const convoyName = drive.convoy?.name || drive.convoy_name || 'Convoy Drive';
                      const driveDate = new Date(drive.completed_at || drive.createdAt || Date.now()).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <div key={drive._id} className="hud-card history-item-card">
                          <div className="history-header-row">
                            <div className="history-title-group">
                              <span className="history-icon">🏁</span>
                              <div>
                                <h3 className="history-convoy-name">{convoyName}</h3>
                                <span className="history-date">{driveDate}</span>
                              </div>
                            </div>

                            {convoyId && (
                              <button
                                className="btn btn-danger-ghost btn-xs btn-delete-history"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Remove "${convoyName}" from your personal driving history? Your individual telemetry will be deleted from this convoy record.`
                                    )
                                  ) {
                                    deleteConvoyHistory(convoyId);
                                  }
                                }}
                                title="Delete this session from your personal history"
                              >
                                🗑️ Delete from My History
                              </button>
                            )}
                          </div>

                          <div className="history-stats-chips">
                            <div className="stat-chip">
                              <span className="chip-label">Top Speed</span>
                              <span className="chip-val">{Math.round(drive.top_speed_kph || drive.top_speed_kmh || 0)} km/h</span>
                            </div>
                            <div className="stat-chip">
                              <span className="chip-label">Distance</span>
                              <span className="chip-val">{(drive.distance_km || 0).toFixed(1)} km</span>
                            </div>
                            <div className="stat-chip">
                              <span className="chip-label">Safety Rating</span>
                              <span className="chip-val text-success">{drive.safety_score || 100}%</span>
                            </div>
                            <div className="stat-chip">
                              <span className="chip-label">Duration</span>
                              <span className="chip-val">
                                {drive.duration_seconds ? `${Math.round(drive.duration_seconds / 60)} min` : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

Leaderboard.propTypes = {
  getConvoyLeaderboard: PropTypes.func.isRequired,
  getGlobalLeaderboard: PropTypes.func.isRequired,
  getMyStats: PropTypes.func.isRequired,
  deleteConvoyHistory: PropTypes.func.isRequired,
  stats: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  stats: state.stats
});

export default connect(mapStateToProps, {
  getConvoyLeaderboard,
  getGlobalLeaderboard,
  getMyStats,
  deleteConvoyHistory
})(Leaderboard);
