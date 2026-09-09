import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { extendProject, importProjectJSON } from '../../actions/projectActions';
import { setAlert } from '../../actions/alertActions';
import { executePromptSynthesis } from '../../utils/aiPromptService';

const AiPromptStudio = () => {
  const dispatch = useDispatch();
  const currentProject = useSelector((state) => state.project.currentProject);

  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('extend'); // 'extend' | 'incept'
  const [provider, setProvider] = useState('gemini'); // 'gemini' | 'openai' | 'offline'
  const [model, setModel] = useState('gemini-3.8-flash');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStage, setCurrentStage] = useState('');
  const [lastResult, setLastResult] = useState(null);

  // Load persisted API key from localStorage on mount
  useEffect(() => {
    const savedGeminiKey = localStorage.getItem('gemini_api_key');
    if (savedGeminiKey) {
      setApiKey(savedGeminiKey);
    }
  }, []);

  const handleKeyChange = (val) => {
    setApiKey(val);
    if (provider === 'gemini') {
      localStorage.setItem('gemini_api_key', val);
    }
  };

  // Contextual presets tailored to active project
  const getPresets = () => {
    const pId = (currentProject?.id || '').toLowerCase();
    if (pId.includes('dev') || pId.includes('connector')) {
      return [
        {
          label: '💬 Real-Time Chat & Socket.io Messaging',
          prompt: 'Add real-time 1-on-1 and channel direct messaging using Socket.io, Redis adapter, read receipts, and encrypted media attachments.'
        },
        {
          label: '💼 Tech Job Board & Recruiter ATS',
          prompt: 'Add an engineering job board where recruiters post roles, candidate skill match scoring runs automatically, and developers submit 1-click applications.'
        },
        {
          label: '🤖 AI Code Review & Portfolio Mentor',
          prompt: 'Add an automated AI code review service that scans public GitHub repositories and generates developer interview readiness scorecards.'
        },
        {
          label: '💳 Pro Developer Subscription & Stripe Invoicing',
          prompt: 'Integrate Stripe customer subscriptions for Pro developer features, featured profile placement, and monthly invoice generation.'
        }
      ];
    }

    if (pId.includes('nexus') || pId.includes('market') || pId.includes('ecom')) {
      return [
        {
          label: '📦 Subscriptions & Auto-Ship Replenishment',
          prompt: 'Add automated recurring replenishment orders, configurable delivery frequencies, and subscription discount policies.'
        },
        {
          label: '🛍️ Multi-Vendor Marketplace & Escrow Payouts',
          prompt: 'Add third-party merchant onboarding, commission calculation engine, and automated Stripe Connect escrow payouts.'
        },
        {
          label: '🎯 AI Personalized Recommendation Engine',
          prompt: 'Add collaborative filtering recommendation engine based on user browsing history and shopping cart co-occurrences.'
        }
      ];
    }

    // Default presets
    return [
      {
        label: '🛸 Drone Delivery Dispatch (SkyCart)',
        prompt: 'Build an on-demand suburban grocery drone delivery service called SkyCart with battery telemetry and autonomous airspace corridor allocation.'
      },
      {
        label: '🅿️ IoT Smart Parking Spot Reservation',
        prompt: 'Build a real-time IoT smart parking reservation platform with ultrasonic sensor telemetry and license plate barrier recognition.'
      },
      {
        label: '📷 Peer-to-Peer Camera Rental (LensShare)',
        prompt: 'Build a peer-to-peer cinema and photography camera gear rental marketplace with escrow insurance deposits and barcode check-in.'
      }
    ];
  };

  const handleSynthesize = async () => {
    if (!prompt.trim()) {
      dispatch(setAlert('Please enter a feature description or idea prompt.', 'danger'));
      return;
    }

    setIsGenerating(true);
    setLastResult(null);

    const stages = [
      'Stage 1: Semantic Discovery & Ontology Mapping...',
      'Stage 2: Layered Architecture & REST Contract Formulation...',
      'Stage 3: Data Dictionary & Crow’s Foot Relational Schema...',
      'Stage 4: Agile User Stories & Fibonacci Point Sizing...'
    ];

    try {
      // Simulate visual progress transitions while awaiting execution
      let stageIdx = 0;
      setCurrentStage(stages[0]);
      const stageInterval = setInterval(() => {
        stageIdx = (stageIdx + 1) % stages.length;
        setCurrentStage(stages[stageIdx]);
      }, 500);

      const result = await executePromptSynthesis({
        prompt,
        contextProject: currentProject,
        mode,
        provider,
        apiKey,
        model
      });

      clearInterval(stageInterval);
      setLastResult(result);
      dispatch(
        setAlert(
          `Synthesized successfully using ${result.usedModel || provider}! Review changes below.`,
          'success'
        )
      );
    } catch (err) {
      console.error('Synthesis Error:', err);
      dispatch(setAlert(`Generation Failed: ${err.message}`, 'danger'));
    } finally {
      setIsGenerating(false);
      setCurrentStage('');
    }
  };

  const handleApply = () => {
    if (!lastResult) return;

    if (lastResult.mode === 'incept' || mode === 'incept') {
      dispatch(importProjectJSON(lastResult));
      dispatch(setAlert(`Loaded new project "${lastResult.name}"!`, 'success'));
    } else {
      dispatch(extendProject(lastResult));
      dispatch(
        setAlert(
          `Successfully expanded ${currentProject.name} with "${lastResult.featureTitle || 'New Feature'}"!`,
          'success'
        )
      );
    }
    setLastResult(null);
    setPrompt('');
  };

  return (
    <div className="card prompt-studio-card" style={{ marginBottom: '2rem' }}>
      {/* Studio Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '1rem',
          marginBottom: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #c084fc, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              color: '#fff',
              boxShadow: '0 0 20px rgba(192, 132, 252, 0.35)'
            }}
          >
            <i className="fa-solid fa-wand-magic-sparkles"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>
                AI Inception & Evolution Studio
              </h3>
              <span className="badge badge-purple" style={{ textTransform: 'uppercase' }}>
                {mode === 'extend' ? `Enhance: ${currentProject.name}` : 'New System Inception'}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Prompt-driven architecture synthesis powered by Google Gemini & Autonomous SDLC Engine
            </div>
          </div>
        </div>

        {/* Engine Settings Toggle & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            className={`badge ${provider === 'offline' ? 'badge-emerald' : 'badge-cyan'}`}
            style={{ fontSize: '0.75rem' }}
          >
            <i className={`fa-solid ${provider === 'offline' ? 'fa-bolt' : 'fa-brain'}`} style={{ marginRight: '5px' }}></i>
            {provider === 'offline'
              ? 'Offline Engine ($0 Cost)'
              : `${provider.toUpperCase()} (${model})`}
          </span>

          <button
            className={`btn btn-sm ${showSettings ? 'btn-secondary' : 'btn-outline'}`}
            onClick={() => setShowSettings(!showSettings)}
            title="Configure AI Engine & API Keys"
          >
            <i className="fa-solid fa-gear"></i>
            <span>Engine Settings</span>
          </button>
        </div>
      </div>

      {/* Engine Settings Drawer */}
      {showSettings && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginBottom: '1.25rem'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--accent-cyan)' }}>
              <i className="fa-solid fa-key" style={{ marginRight: '6px' }}></i>
              AI Provider & Intelligence Configuration
            </div>
            <a
              href="https://aistudio.google.com/"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '0.75rem', color: 'var(--accent-indigo)' }}
            >
              Get Free Gemini Key (Google AI Studio) <i className="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem'
            }}
          >
            <div>
              <label className="form-label">Provider Service</label>
              <select
                className="form-select"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                <option value="gemini">Google Gemini API (Direct Key)</option>
                <option value="openai">OpenAI API (Direct Key)</option>
                <option value="offline">Offline Intelligent Synthesizer ($0 Cost, No Key)</option>
              </select>
            </div>

            {provider === 'gemini' && (
              <div>
                <label className="form-label">Gemini Model</label>
                <select
                  className="form-select"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  <option value="gemini-3.8-flash">Gemini 3.8 Flash (Cutting-Edge High Performance)</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (Next-Gen High-Speed)</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast Free Tier)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Architecture Reasoning)</option>
                </select>
              </div>
            )}

            {provider !== 'offline' && (
              <div style={{ position: 'relative' }}>
                <label className="form-label">
                  {provider === 'gemini' ? 'Gemini API Key' : 'OpenAI API Key'}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type={showKey ? 'text' : 'password'}
                    className="form-input"
                    placeholder={provider === 'gemini' ? 'AIzaSy...' : 'sk-proj-...'}
                    value={apiKey}
                    onChange={(e) => handleKeyChange(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setShowKey(!showKey)}
                    title={showKey ? 'Hide Key' : 'Show Key'}
                  >
                    <i className={`fa-solid ${showKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Stored securely in your local browser memory only.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preset Quick Chips */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: '600', textTransform: 'uppercase' }}>
            Quick Prompts for {currentProject.name}:
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {getPresets().map((preset, idx) => (
            <button
              key={idx}
              className="filter-btn"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              onClick={() => {
                setPrompt(preset.prompt);
                setMode('extend');
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Textarea Prompt Input */}
      <div style={{ marginBottom: '1rem' }}>
        <textarea
          className="form-textarea"
          style={{
            minHeight: '100px',
            fontSize: '0.95rem',
            background: 'rgba(10, 15, 29, 0.8)',
            borderColor: 'rgba(192, 132, 252, 0.3)'
          }}
          placeholder={
            mode === 'extend'
              ? `Describe the feature, module, or capability you want to build into ${currentProject.name} (e.g. Add real-time private messaging with Socket.io, read receipts, and file attachments)...`
              : 'Describe your software idea from scratch (e.g. Build an autonomous suburban drone grocery delivery dispatch platform called SkyCart)...'
          }
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      {/* Mode Switch & Execution Button Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.8)', padding: '3px', borderRadius: '8px' }}>
          <button
            type="button"
            className={`btn btn-sm ${mode === 'extend' ? 'btn-primary' : 'btn-outline'}`}
            style={{ border: 'none' }}
            onClick={() => setMode('extend')}
          >
            <i className="fa-solid fa-puzzle-piece"></i>
            <span>Further Develop {currentProject.name}</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm ${mode === 'incept' ? 'btn-primary' : 'btn-outline'}`}
            style={{ border: 'none' }}
            onClick={() => setMode('incept')}
          >
            <i className="fa-solid fa-sparkles"></i>
            <span>Incept New Project</span>
          </button>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSynthesize}
          disabled={isGenerating}
          style={{
            background: 'linear-gradient(135deg, #818cf8, #c084fc)',
            boxShadow: '0 0 15px rgba(192, 132, 252, 0.35)',
            border: 'none'
          }}
        >
          {isGenerating ? (
            <>
              <i className="fa-solid fa-circle-notch fa-spin"></i>
              <span>{currentStage || 'Synthesizing...'}</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-bolt"></i>
              <span>{mode === 'extend' ? `Develop Feature for ${currentProject.name}` : 'Synthesize Complete System'}</span>
            </>
          )}
        </button>
      </div>

      {/* Synthesis Result Review Card */}
      {lastResult && (
        <div
          style={{
            marginTop: '1.5rem',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(52, 211, 153, 0.4)',
            boxShadow: '0 0 20px rgba(52, 211, 153, 0.1)'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              marginBottom: '1rem',
              borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
              paddingBottom: '0.75rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-circle-check" style={{ color: 'var(--accent-emerald)', fontSize: '1.2rem' }}></i>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>
                  {lastResult.featureTitle || lastResult.name || 'Synthesis Complete'}
                </h4>
                <span className="badge badge-emerald">Ready to Apply</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                Synthesizer output generated using {lastResult.usedModel || provider}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setLastResult(null)}>
                <i className="fa-solid fa-xmark"></i> Dismiss
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleApply}
                style={{ background: 'var(--accent-emerald)', color: '#090d16', fontWeight: '700' }}
              >
                <i className="fa-solid fa-plus"></i> Apply to {currentProject.name}
              </button>
            </div>
          </div>

          {/* Generated Metric Summary */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}
          >
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--accent-indigo)' }}>
                +{lastResult.stories?.length || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Agile Stories</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                +{lastResult.functionalLayer?.length || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>REST Endpoints</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--accent-emerald)' }}>
                +{lastResult.erdEntities?.length || (lastResult.erd?.entities?.length) || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Data Entities</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--accent-purple)' }}>
                +{lastResult.businessRules?.length || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Business Policies</div>
            </div>
          </div>

          {/* Quick Preview of Generated Stories */}
          {lastResult.stories && lastResult.stories.length > 0 && (
            <div style={{ fontSize: '0.85rem' }}>
              <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Synthesized Stories Preview:
              </div>
              <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)' }}>
                {lastResult.stories.slice(0, 3).map((s, idx) => (
                  <li key={idx}>
                    <strong style={{ color: 'var(--text-main)' }}>{s.title}</strong> ({s.points} pts) &mdash; <em>{s.statement}</em>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiPromptStudio;
