import React, { useEffect, useRef, useState } from 'react';

const MermaidViewer = ({ chartCode, id = 'mermaid-chart' }) => {
  const containerRef = useRef(null);
  const [svgContent, setSvgContent] = useState('');
  const [renderError, setRenderError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const renderChart = async () => {
      try {
        setRenderError(null);
        if (window.mermaid) {
          window.mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            securityLevel: 'loose',
            themeVariables: {
              darkMode: true,
              background: '#0f172a',
              primaryColor: '#1e293b',
              primaryTextColor: '#f8fafc',
              primaryBorderColor: '#38bdf8',
              lineColor: '#818cf8',
              secondaryColor: '#334155',
              tertiaryColor: '#090d16'
            }
          });

          const uniqueId = `${id}_${Date.now()}`;
          const { svg } = await window.mermaid.render(uniqueId, chartCode.trim());
          if (isMounted) {
            setSvgContent(svg);
          }
        } else {
          // Fallback if mermaid CDN hasn't loaded yet
          setTimeout(renderChart, 500);
        }
      } catch (err) {
        console.warn('Mermaid rendering error:', err);
        if (isMounted) {
          setRenderError(err.message || 'Syntax error in Mermaid diagram');
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chartCode, id]);

  if (renderError) {
    return (
      <div className="card" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
        <p style={{ color: '#fca5a5', fontSize: '0.85rem' }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '6px' }}></i>
          Mermaid Render Warning: {renderError}
        </p>
        <pre style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>{chartCode}</pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="diagram-canvas"
      dangerouslySetInnerHTML={{ __html: svgContent || '<p style="color: #64748b;">Generating diagram...</p>' }}
    />
  );
};

export default MermaidViewer;
