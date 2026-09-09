import React from 'react';
import { useSelector } from 'react-redux';

const Alert = () => {
  const alerts = useSelector((state) => state.alert);

  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="alert-hud-container">
      {alerts.map((alert) => (
        <div key={alert.id} className={`alert-hud alert-${alert.alertType}`}>
          <div className="alert-hud-content">
            <i
              className={`fa-solid ${
                alert.alertType === 'danger'
                  ? 'fa-triangle-exclamation'
                  : alert.alertType === 'success'
                  ? 'fa-circle-check'
                  : 'fa-circle-info'
              }`}
            ></i>
            <span>{alert.msg}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Alert;
