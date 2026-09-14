import React, { useState, useEffect, useRef, useCallback } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import audioService from '../../utils/audioService';
import socketService from '../../utils/socketService';
import { setPTTActive } from '../../actions/convoy';

const WalkieTalkie = ({
  convoyId,
  user,
  convoy: { pttActive, activeSpeaker },
  setPTTActive,
  position = 'center'
}) => {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Initialize Web Audio Engine non-interfering mode on first touch
  useEffect(() => {
    const handleFirstGesture = () => {
      audioService.init();
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };

    window.addEventListener('click', handleFirstGesture);
    window.addEventListener('touchstart', handleFirstGesture);

    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startTalking = useCallback(async () => {
    if (isTransmitting) return;

    try {
      setAudioError(null);
      audioService.init();
      audioService.playSquelchOpen();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaStreamRef.current = stream;
      setIsTransmitting(true);
      setPTTActive(true);

      socketService.startVoiceTransmission(convoyId, {
        userId: user?._id,
        userName: user?.name || 'Driver'
      });

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = async (e) => {
        if (e.data && e.data.size > 0) {
          const buffer = await e.data.arrayBuffer();
          socketService.sendVoiceChunk(convoyId, buffer);
        }
      };

      // Stream in 200ms audio chunks
      recorder.start(200);
    } catch (err) {
      console.error('Walkie talkie microphone access error:', err);
      setAudioError('Microphone permission required for PTT');
      setIsTransmitting(false);
      setPTTActive(false);
    }
  }, [convoyId, isTransmitting, setPTTActive, user]);

  const stopTalking = useCallback(() => {
    if (!isTransmitting) return;

    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      audioService.playSquelchClose();
      socketService.stopVoiceTransmission(convoyId);
    } catch (err) {
      console.error('Error stopping transmission:', err);
    } finally {
      setIsTransmitting(false);
      setPTTActive(false);
    }
  }, [convoyId, isTransmitting, setPTTActive]);

  // Spacebar hotkey for desktop enthusiast drivers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        if (!e.repeat) {
          e.preventDefault();
          startTalking();
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        stopTalking();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startTalking, stopTalking]);

  return (
    <div className={`walkie-dock ${position === 'right' ? 'dock-right' : ''}`}>
      {/* Active speaker alert banner */}
      {activeSpeaker && activeSpeaker.userId !== user?._id && (
        <div className="active-speaker-banner animate-pulse">
          <span className="speaker-icon">📻</span>
          <span className="speaker-text">
            <strong>{activeSpeaker.userName || 'Driver'}</strong> is transmitting...
          </span>
          <div className="speaker-waves">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}

      {audioError && <div className="audio-error-toast">{audioError}</div>}

      {/* Main Push to Talk Control */}
      <div className="ptt-control-wrap">
        <button
          className={`ptt-button ${isTransmitting ? 'is-transmitting' : ''} ${
            activeSpeaker && activeSpeaker.userId !== user?._id ? 'channel-busy' : ''
          }`}
          onMouseDown={startTalking}
          onMouseUp={stopTalking}
          onTouchStart={(e) => {
            e.preventDefault();
            startTalking();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            stopTalking();
          }}
          title="Hold to talk (or hold Spacebar)"
        >
          <div className="ptt-inner">
            <span className="ptt-icon">{isTransmitting ? '🎙️' : '📻'}</span>
            <span className="ptt-label">
              {isTransmitting ? 'TRANSMITTING' : 'HOLD TO TALK'}
            </span>
            <span className="ptt-sublabel">WALKIE RADIO</span>
          </div>

          {isTransmitting && (
            <div className="radio-pulse-rings">
              <span className="ring ring-1"></span>
              <span className="ring ring-2"></span>
              <span className="ring ring-3"></span>
            </div>
          )}
        </button>

        <div className="ptt-footnote">
          <span>Non-interfering WebAudio (Music/Spotify will not stop)</span>
        </div>
      </div>
    </div>
  );
};

WalkieTalkie.propTypes = {
  convoyId: PropTypes.string.isRequired,
  user: PropTypes.object,
  convoy: PropTypes.object.isRequired,
  setPTTActive: PropTypes.func.isRequired,
  position: PropTypes.string
};

const mapStateToProps = (state) => ({
  convoy: state.convoy,
  auth: state.auth
});

export default connect(mapStateToProps, { setPTTActive })(WalkieTalkie);
