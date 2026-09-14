import React from 'react';
import PropTypes from 'prop-types';

const MANEUVER_ARROWS = {
  left: '↰',
  'slight left': '↖',
  'sharp left': '⮢',
  right: '↱',
  'slight right': '↗',
  'sharp right': '⮣',
  straight: '⬆',
  uturn: '⮌',
  arrive: '🏁',
  depart: '🏎️'
};

const NavigationHUD = ({
  destinationName,
  nextStep,
  etaData,
  routeSummary,
  currentSpeedKph = 0,
  unitMph = false,
  onCancelNavigation
}) => {
  if (!destinationName) return null;

  const arrow =
    (nextStep?.modifier && MANEUVER_ARROWS[nextStep.modifier.toLowerCase()]) ||
    (nextStep?.instruction && MANEUVER_ARROWS[nextStep.instruction.toLowerCase()]) ||
    '⬆';

  const formatDistance = (meters) => {
    if (!meters || isNaN(meters)) return '';
    if (unitMph) {
      const miles = (meters * 0.000621371).toFixed(1);
      return `${miles} mi`;
    }
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const speedLimit = etaData?.speedLimit || 70;
  const displayedSpeed = unitMph ? Math.round(currentSpeedKph * 0.621371) : currentSpeedKph;
  const displayedLimit = unitMph ? Math.round(speedLimit * 0.621371) : speedLimit;
  const speedUnit = unitMph ? 'MPH' : 'KM/H';
  const isSpeeding = currentSpeedKph > speedLimit + 5;

  return (
    <div className="navigation-hud-card navigation-hud-bottom-popup animate-slide-up" id="navigation-hud-popup">
      {/* Ideal Route Header Ribbon */}
      <div className="nav-ideal-route-badge">
        <span className="ideal-tag">⚡ ACTIVE NAVIGATION</span>
        <span className="ideal-via">
          {routeSummary ? `via ${routeSummary}` : `Target: ${destinationName}`}
        </span>
      </div>

      {/* Main Driving Guidance Row: Next Turn + Speed Cockpit */}
      <div className="nav-maneuver-row">
        <div className="maneuver-arrow-bubble" title="Next Maneuver">
          {arrow}
        </div>
        <div className="maneuver-text-wrap">
          <span className="maneuver-dist">
            {nextStep?.distance ? `In ${formatDistance(nextStep.distance)}` : 'Continue along route'}
          </span>
          <h3 className="maneuver-instruction">
            {nextStep?.name && nextStep.name !== 'Road'
              ? `Onto ${nextStep.name}`
              : nextStep?.instruction
              ? nextStep.instruction.toUpperCase()
              : `Proceed to ${destinationName}`}
          </h3>
        </div>

        {/* Live Cockpit Speed Clusters: Current Speed & Overpass Speed Limit */}
        <div className="nav-speed-duo">
          <div className={`nav-current-speed-pill ${isSpeeding ? 'speed-alert' : ''}`}>
            <span className="nav-speed-val">{displayedSpeed}</span>
            <span className="nav-speed-unit">{speedUnit}</span>
          </div>

          <div
            className={`speed-limit-sign ${isSpeeding ? 'speed-warning' : ''}`}
            title="Overpass API Live Speed Limit"
          >
            <div className="speed-limit-inner">
              <span className="speed-limit-number">{displayedLimit}</span>
              <span className="speed-limit-sub">LIMIT</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Live Road & ETA Telemetry Ribbon */}
      <div className="nav-telemetry-strip">
        <div className="telemetry-cell">
          <span className="telemetry-lbl">DYNAMIC ETA</span>
          <span className="telemetry-val highlight-cyan">
            {etaData?.minutesRemaining || 1} <small>min</small>
          </span>
        </div>

        <div className="telemetry-cell">
          <span className="telemetry-lbl">DISTANCE</span>
          <span className="telemetry-val">
            {etaData?.remainingKm || '0.0'}{' '}
            <small>{unitMph ? 'mi' : 'km'}</small>
          </span>
        </div>

        <div className="telemetry-cell">
          <span className="telemetry-lbl">EST. ARRIVAL</span>
          <span className="telemetry-val highlight-emerald">
            {etaData?.arrivalTime || '--:--'}
          </span>
        </div>

        {/* Real-Time Traffic Signals Ahead from Overpass API */}
        <div className="telemetry-cell signals-cell" title="Traffic Signals Detected via Overpass API">
          <span className="telemetry-lbl">SIGNALS</span>
          <span className="telemetry-val text-amber">
            🚦 {etaData?.trafficSignalsAhead || 0}
          </span>
        </div>

        {/* Exit / Cancel Navigation - End driving */}
        <button
          className="btn-exit-nav btn-stop-nav"
          onClick={onCancelNavigation}
          title="End active navigation"
          id="btn-end-navigation"
        >
          🛑 End
        </button>
      </div>
    </div>
  );
};

NavigationHUD.propTypes = {
  destinationName: PropTypes.string,
  nextStep: PropTypes.object,
  etaData: PropTypes.object,
  routeSummary: PropTypes.string,
  currentSpeedKph: PropTypes.number,
  unitMph: PropTypes.bool,
  onCancelNavigation: PropTypes.func.isRequired
};

export default NavigationHUD;
