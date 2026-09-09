import React from 'react';
import { useSelector } from 'react-redux';

const Alert = () => {
  const alerts = useSelector((state) => state.alert);

  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="alert-wrapper">
      {alerts.map((alert) => (
        <div key={alert.id} className={`alert-banner alert-${alert.alertType}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className={`fa-solid ${alert.alertType === 'danger' ? 'fa-circle-exclamation' : 'fa-circle-check'}`}></i>
            <span>{alert.msg}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Alert;
