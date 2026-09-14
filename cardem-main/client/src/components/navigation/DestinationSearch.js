import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { searchNominatimDestinations } from '../../utils/osmNavigationService';

const DestinationSearch = ({
  onSelectDestination,
  onAddWaypoint,
  isConvoyActive,
  isHost = true,
  hostName = '',
  isRouteFinalised = false
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceTimerRef = useRef(null);
  const wrapperRef = useRef(null);

  // Non-hosts in a convoy cannot set or edit the group route, and search is locked when route is finalised
  const isLockedForMember = (isConvoyActive && !isHost) || isRouteFinalised;

  // Close suggestions if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    if (isLockedForMember) return;
    const val = e.target.value;
    setQuery(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      const places = await searchNominatimDestinations(val);
      setResults(places);
      setIsLoading(false);
      setIsOpen(places.length > 0);
    }, 450);
  };

  const handleSelect = (place) => {
    if (isLockedForMember) return;
    setQuery(place.name);
    setIsOpen(false);
    if (onAddWaypoint) {
      onAddWaypoint(place);
    } else {
      onSelectDestination(place);
    }
  };

  const handleClear = () => {
    if (isLockedForMember) return;
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="dest-search-container">
      <div className={`dest-search-input-wrap ${isLockedForMember ? 'is-locked' : ''}`}>
        <span className="search-icon">{isLockedForMember ? '🔒' : '🔍'}</span>
        <input
          type="text"
          className="dest-search-input"
          placeholder={
            isRouteFinalised
              ? '✅ Route sequence finalised — Press GO below to drive!'
              : isLockedForMember
              ? `Convoy route controlled by host (@${hostName || 'Host'})`
              : isConvoyActive
              ? "Search location to add stop or route..."
              : "Search destination (OpenStreetMap)..."
          }
          value={query}
          onChange={handleInputChange}
          readOnly={isLockedForMember}
          onFocus={() => {
            if (!isLockedForMember && results.length > 0) setIsOpen(true);
          }}
        />
        {isLoading && <span className="search-spinner">⏳</span>}
        {query && !isLoading && !isLockedForMember && (
          <button className="search-clear-btn" onClick={handleClear} title="Clear search">
            ✕
          </button>
        )}
      </div>

      {isConvoyActive && (
        <div className={`convoy-sync-tag ${isRouteFinalised ? 'route-finalised-tag' : isLockedForMember ? 'host-locked-tag' : 'host-active-tag'}`}>
          <span>
            {isRouteFinalised
              ? '✅ Route Sequence Finalised'
              : isLockedForMember
              ? `🔒 Group Route Set by Host (@${hostName || 'Host'})`
              : '👑 Host Multi-Stop Sequence Planner'}
          </span>
        </div>
      )}

      {/* Nominatim Search Autocomplete Dropdown */}
      {isOpen && !isLockedForMember && (
        <div className="dest-results-dropdown animate-slide-up">
          <div className="dropdown-header">
            <span>OpenStreetMap Nominatim Places</span>
            {onAddWaypoint && <span className="dropdown-sub-tip">Click item to set or use + Add Stop</span>}
          </div>
          {results.map((place) => (
            <div
              key={place.place_id}
              className="dest-result-item"
              onClick={() => handleSelect(place)}
            >
              <span className="result-pin">📍</span>
              <div className="result-info">
                <strong className="result-name">{place.name}</strong>
                <span className="result-address">{place.display_name}</span>
              </div>
              {onAddWaypoint && isHost && (
                <button
                  className="btn-add-stop-inline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddWaypoint(place);
                    handleClear();
                  }}
                  title="Add to multi-stop route sequence"
                >
                  + Add Stop
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

DestinationSearch.propTypes = {
  onSelectDestination: PropTypes.func.isRequired,
  onAddWaypoint: PropTypes.func,
  isConvoyActive: PropTypes.bool,
  isHost: PropTypes.bool,
  hostName: PropTypes.string
};

export default DestinationSearch;
