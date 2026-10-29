import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const initial = {
  Administrative: 2,
  Administrative_Duration: 45,
  Informational: 1,
  Informational_Duration: 20,
  ProductRelated: 20,
  ProductRelated_Duration: 1200,
  BounceRates: 0.02,
  ExitRates: 0.04,
  PageValues: 5,
  SpecialDay: 0,
  Month: 'Nov',
  OperatingSystems: 2,
  Browser: 2,
  Region: 1,
  TrafficType: 2,
  VisitorType: 'Returning_Visitor',
  Weekend: false,
};

const fields = [
  { key: 'Administrative', label: 'Administrative pages', type: 'number', min: 0, step: 1, help: 'Pages visited in this category' },
  { key: 'Administrative_Duration', label: 'Administrative duration', type: 'number', min: 0, step: 'any', suffix: 'sec' },
  { key: 'Informational', label: 'Informational pages', type: 'number', min: 0, step: 1 },
  { key: 'Informational_Duration', label: 'Informational duration', type: 'number', min: 0, step: 'any', suffix: 'sec' },
  { key: 'ProductRelated', label: 'Product-related pages', type: 'number', min: 0, step: 1 },
  { key: 'ProductRelated_Duration', label: 'Product-related duration', type: 'number', min: 0, step: 'any', suffix: 'sec' },
  { key: 'BounceRates', label: 'Bounce rate', type: 'number', min: 0, max: 1, step: 'any', help: 'Enter a value from 0 to 1' },
  { key: 'ExitRates', label: 'Exit rate', type: 'number', min: 0, max: 1, step: 'any', help: 'Enter a value from 0 to 1' },
  { key: 'PageValues', label: 'Page value', type: 'number', min: 0, step: 'any' },
  { key: 'SpecialDay', label: 'Special day proximity', type: 'number', min: 0, max: 1, step: 'any', help: 'Enter a value from 0 to 1' },
];

const categorical = [
  { key: 'Month', label: 'Month', options: MONTHS, help: 'Select the session month' },
  { key: 'OperatingSystems', label: 'Operating system', options: Array.from({ length: 8 }, (_, i) => String(i + 1)) },
  { key: 'Browser', label: 'Browser code', options: Array.from({ length: 13 }, (_, i) => String(i + 1)) },
  { key: 'Region', label: 'Region code', options: Array.from({ length: 9 }, (_, i) => String(i + 1)) },
  { key: 'TrafficType', label: 'Traffic type', options: Array.from({ length: 20 }, (_, i) => String(i + 1)) },
  { key: 'VisitorType', label: 'Visitor type', options: ['Returning_Visitor', 'New_Visitor', 'Other'] },
];

const numberKeys = [
  'Administrative',
  'Administrative_Duration',
  'Informational',
  'Informational_Duration',
  'ProductRelated',
  'ProductRelated_Duration',
  'BounceRates',
  'ExitRates',
  'PageValues',
  'SpecialDay',
  'OperatingSystems',
  'Browser',
  'Region',
  'TrafficType',
];

function Icon({ children }) {
  return <span className="icon" aria-hidden="true">{children}</span>;
}

function App() {
  const [form, setForm] = useState(initial);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('predict');
  const [showAdvanced, setShowAdvanced] = useState(true);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const sessionScore = useMemo(
    () =>
      Math.min(
        100,
        Math.round(
          Number(form.ProductRelated) * 1.1 +
            Number(form.ProductRelated_Duration) / 90 +
            Number(form.PageValues) * 0.7,
        ),
      ),
    [form],
  );

  const buildPayload = () => {
    const payload = { ...form };

    numberKeys.forEach((key) => {
      const numericValue = Number(payload[key]);
      payload[key] = Number.isFinite(numericValue) ? numericValue : 0;
    });

    payload.Weekend = Boolean(payload.Weekend);

    if (!MONTHS.includes(payload.Month)) {
      payload.Month = 'Nov';
    }

    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    const payload = buildPayload();

    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || `Request failed (${response.status})`);
      }

      setResult(data);
    } catch (err) {
      setError(`${err.message}. Check that the FastAPI server is running and that the frontend is allowed to access ${API_URL}.`);
    } finally {
      setLoading(false);
    }
  };

  const loadSample = (kind) => {
    const sample =
      kind === 'engaged'
        ? {
            ...initial,
            Administrative: 5,
            Administrative_Duration: 150,
            Informational: 2,
            Informational_Duration: 80,
            ProductRelated: 45,
            ProductRelated_Duration: 2500,
            BounceRates: 0.002,
            ExitRates: 0.015,
            PageValues: 50,
            Month: 'Nov',
            VisitorType: 'Returning_Visitor',
            Weekend: true,
          }
        : {
            ...initial,
            Administrative: 0,
            Administrative_Duration: 0,
            Informational: 0,
            Informational_Duration: 0,
            ProductRelated: 2,
            ProductRelated_Duration: 35,
            BounceRates: 0.2,
            ExitRates: 0.3,
            PageValues: 0,
            Month: 'Feb',
            VisitorType: 'New_Visitor',
            Weekend: false,
          };

    setForm(sample);
    setResult(null);
    setError('');
  };

  const probability = result ? Math.round(Number(result.purchase_probability ?? 0) * 100) : 0;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <span>✦</span>
          </div>
          <div>
            <b>ShopSense</b>
            <small>PURCHASE INTELLIGENCE</small>
          </div>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <button className={`nav-item ${activeTab === 'predict' ? 'active' : ''}`} onClick={() => setActiveTab('predict')}>
          <Icon>⌘</Icon>
          Purchase prediction
          <span className="nav-dot" />
        </button>
        <button className={`nav-item ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>
          <Icon>▥</Icon>
          Model overview
        </button>

        <div className="sidebar-bottom">
          <div className="api-status">
            <span className="status-dot" />
            <div>
              <b>Prediction API</b>
              <small>Configured endpoint</small>
            </div>
          </div>
          <div className="api-url">{API_URL}</div>
          <div className="sidebar-foot">
            MACHINE LEARNING PROJECT <span>v1.0.0</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <b>{activeTab === 'predict' ? 'Purchase prediction' : 'Model overview'}</b>
          </div>
          <div className="top-right">
            <span className="live-pill">
              <i /> MODEL CONNECTED
            </span>
            <div className="avatar">SS</div>
          </div>
        </header>

        {activeTab === 'predict' ? (
          <>
            <section className="page-heading">
              <div>
                <div className="eyebrow">
                  <span className="eyebrow-line" /> MACHINE LEARNING · CLASSIFICATION
                </div>
                <h1>
                  Purchase <span>intelligence.</span>
                </h1>
                <p>Understand shopping-session behavior and estimate the likelihood of a customer completing a purchase.</p>
              </div>
              <div className="heading-art">
                <div className="art-orbit orbit-one" />
                <div className="art-orbit orbit-two" />
                <div className="art-core">✦</div>
                <span className="art-spark spark-a">✳</span>
                <span className="art-spark spark-b">✧</span>
              </div>
            </section>

            <section className="metrics-grid">
              <div className="metric-card">
                <div className="metric-top">
                  <span>MODEL TYPE</span>
                  <span className="metric-icon purple">⌘</span>
                </div>
                <div className="metric-value">Decision Tree</div>
                <div className="metric-foot">
                  <span className="tiny-dot purple-dot" /> Supervised classification
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-top">
                  <span>INPUT FEATURES</span>
                  <span className="metric-icon blue">▦</span>
                </div>
                <div className="metric-value">
                  17 <small>features</small>
                </div>
                <div className="metric-foot">Behavioral + session attributes</div>
              </div>

              <div className="metric-card">
                <div className="metric-top">
                  <span>SESSION SIGNAL</span>
                  <span className="metric-icon green">↗</span>
                </div>
                <div className="metric-value">
                  {sessionScore}
                  <small>/ 100</small>
                </div>
                <div className="signal-track">
                  <span style={{ width: `${sessionScore}%` }} />
                </div>
                <div className="metric-foot">Engagement indicator · not a model score</div>
              </div>

              <div className="metric-card">
                <div className="metric-top">
                  <span>API STATUS</span>
                  <span className="metric-icon amber">⌁</span>
                </div>
                <div className="metric-value status-value">
                  <span className="status-dot" /> Ready to test
                </div>
                <div className="metric-foot">Results returned by FastAPI</div>
              </div>
            </section>

            <div className="content-grid">
              <section className="panel form-panel">
                <div className="panel-heading">
                  <div>
                    <div className="section-kicker">PREDICTION WORKBENCH</div>
                    <h2>Session attributes</h2>
                    <p>Enter the browsing behavior for one shopping session.</p>
                  </div>
                  <div className="step-badge">
                    01 <span>/ 02</span>
                  </div>
                </div>

                <div className="sample-row">
                  <span>TRY A SAMPLE</span>
                  <button type="button" onClick={() => loadSample('engaged')} className="sample-btn">
                    <span className="sample-icon green-text">↗</span> High engagement
                  </button>
                  <button type="button" onClick={() => loadSample('low')} className="sample-btn">
                    <span className="sample-icon orange-text">↘</span> Low engagement
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="form-section-title">
                    <span className="section-number">A</span>
                    <div>
                      <b>Browsing activity</b>
                      <small>Page visits and time spent</small>
                    </div>
                  </div>

                  <div className="field-grid">
                    {fields.slice(0, 6).map((field) => (
                      <label className="field" key={field.key}>
                        <span>{field.label}</span>
                        <div className="input-wrap">
                          <input
                            type="number"
                            required
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={form[field.key]}
                            onChange={(event) => update(field.key, event.target.value)}
                          />
                          {field.suffix && <em>{field.suffix}</em>}
                        </div>
                        {field.help && <small className="field-help">{field.help}</small>}
                      </label>
                    ))}
                  </div>

                  <div className="form-section-title section-spaced">
                    <span className="section-number">B</span>
                    <div>
                      <b>Session quality</b>
                      <small>Exit behavior and page value</small>
                    </div>
                  </div>

                  <div className="field-grid">
                    {fields.slice(6).map((field) => (
                      <label className="field" key={field.key}>
                        <span>{field.label}</span>
                        <div className="input-wrap">
                          <input
                            type="number"
                            required
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={form[field.key]}
                            onChange={(event) => update(field.key, event.target.value)}
                          />
                        </div>
                        {field.help && <small className="field-help">{field.help}</small>}
                      </label>
                    ))}
                  </div>

                  <button type="button" className="advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
                    <span className="chevron">{showAdvanced ? '⌄' : '›'}</span>
                    Device & visitor details
                    <span className="optional-label">7 FEATURES</span>
                  </button>

                  {showAdvanced && (
                    <div className="field-grid categorical-grid">
                      {categorical.map((field) => (
                        <label className="field" key={field.key}>
                          <span>{field.label}</span>
                          <select value={form[field.key]} onChange={(event) => update(field.key, event.target.value)}>
                            {field.options.map((option) => (
                              <option key={option} value={option}>
                                {option.replaceAll('_', ' ')}
                              </option>
                            ))}
                          </select>
                          {field.help && <small className="field-help">{field.help}</small>}
                        </label>
                      ))}

                      <label className="field weekend-field">
                        <span>Weekend session</span>
                        <button
                          type="button"
                          className={`switch-row ${form.Weekend ? 'is-on' : ''}`}
                          onClick={() => update('Weekend', !form.Weekend)}
                        >
                          <span className="switch">
                            <i />
                          </span>
                          <span>{form.Weekend ? 'Yes, weekend' : 'No, weekday'}</span>
                        </button>
                      </label>
                    </div>
                  )}

                  {error && (
                    <div className="error-box">
                      <b>Could not get a prediction</b>
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="form-actions">
                    <div className="privacy-note">
                      <span>⌁</span> Session data is sent to your configured API.
                    </div>
                    <button className="predict-btn" type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <span className="spinner" /> Predicting…
                        </>
                      ) : (
                        <>
                          Run prediction <span>↗</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </section>

              <aside className="result-column">
                <section className={`result-panel ${result ? (result.prediction ? 'positive' : 'negative') : ''}`}>
                  <div className="result-header">
                    <div>
                      <div className="section-kicker">MODEL OUTPUT</div>
                      <h2>Prediction result</h2>
                    </div>
                    <span className="result-live">
                      <i /> LIVE
                    </span>
                  </div>

                  {!result ? (
                    <div className="empty-result">
                      <div className="empty-illustration">
                        <div className="empty-ring ring-a" />
                        <div className="empty-ring ring-b" />
                        <div className="empty-center">✦</div>
                        <span className="empty-star">✧</span>
                      </div>
                      <h3>Your result appears here</h3>
                      <p>Complete the session details and run a prediction to see the model's output.</p>
                      <div className="empty-checks">
                        <span>
                          <i /> API-connected workflow
                        </span>
                        <span>
                          <i /> Purchase probability
                        </span>
                        <span>
                          <i /> Class-level breakdown
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="result-body">
                      <div className={`outcome-icon ${result.prediction ? 'success' : 'muted'}`}>
                        {result.prediction ? '↗' : '↘'}
                      </div>
                      <div className="outcome-label">PREDICTED OUTCOME</div>
                      <h3>{result.result || (result.prediction ? 'Purchase likely' : 'No purchase predicted')}</h3>
                      <p>
                        {result.prediction
                          ? 'The model classifies this session as a likely purchase.'
                          : 'The model classifies this session as unlikely to result in a purchase.'}
                      </p>

                      <div className="probability-card">
                        <div className="probability-head">
                          <span>Purchase probability</span>
                          <b>{probability}%</b>
                        </div>
                        <div className="probability-track">
                          <span style={{ width: `${probability}%` }} />
                        </div>
                        <small>Model-estimated class probability, not a guarantee.</small>
                      </div>

                      <div className="class-breakdown">
                        <b>Class probabilities</b>
                        {Object.entries(result.class_probabilities || {}).map(([key, value]) => (
                          <div className="class-row" key={key}>
                            <span>
                              <i className={String(key).toLowerCase() === 'true' ? 'class-green' : 'class-gray'} />
                              {String(key).toLowerCase() === 'true' ? 'Purchase' : 'No purchase'}
                            </span>
                            <b>{(Number(value) * 100).toFixed(1)}%</b>
                          </div>
                        ))}
                      </div>

                      <button
                        className="reset-btn"
                        type="button"
                        onClick={() => {
                          setResult(null);
                          setError('');
                        }}
                      >
                        ↺ Clear result
                      </button>
                    </div>
                  )}
                </section>

                <section className="insight-card">
                  <div className="insight-symbol">✧</div>
                  <div>
                    <b>Prediction, not certainty</b>
                    <p>
                      A Decision Tree can return 0% or 100% at a leaf. Treat this as a model estimate, and validate performance on unseen data.
                    </p>
                  </div>
                </section>

                <section className="api-card">
                  <div className="api-card-top">
                    <span className="api-icon">{'{ }'}</span>
                    <div>
                      <b>FastAPI endpoint</b>
                      <small>POST /predict</small>
                    </div>
                    <span className="http-tag">JSON</span>
                  </div>
                  <div className="api-card-bottom">
                    <span>Base URL</span>
                    <code>{API_URL}</code>
                  </div>
                </section>
              </aside>
            </div>
          </>
        ) : (
          <section className="overview-page">
            <div className="eyebrow">
              <span className="eyebrow-line" /> MODEL DOCUMENTATION
            </div>
            <h1>
              Model <span>overview.</span>
            </h1>
            <p className="overview-intro">
              A machine-learning classification workflow that estimates whether an online shopping session will lead to a purchase.
            </p>

            <div className="overview-cards">
              <div className="overview-card">
                <span className="metric-icon purple">⌘</span>
                <h3>Decision Tree Classifier</h3>
                <p>A supervised learning model trained on online shopping session attributes.</p>
              </div>
              <div className="overview-card">
                <span className="metric-icon blue">▦</span>
                <h3>17 input features</h3>
                <p>Browsing activity, duration, bounce and exit rates, page values, device, traffic, visitor type and weekend.</p>
              </div>
              <div className="overview-card">
                <span className="metric-icon green">↗</span>
                <h3>FastAPI inference</h3>
                <p>The React interface submits JSON to your existing backend and renders its prediction response.</p>
              </div>
            </div>

            <div className="note-panel">
              <b>Before production deployment</b>
              <ul>
                <li>Validate the model on held-out data and monitor precision and recall.</li>
                <li>Review whether PageValues is available at the moment a prediction is made.</li>
                <li>Configure production CORS and set VITE_API_URL to your deployed backend URL.</li>
                <li>Never interpret a 100% tree-leaf probability as a guarantee of a real purchase.</li>
              </ul>
            </div>

            <button className="predict-btn overview-cta" type="button" onClick={() => setActiveTab('predict')}>
              Open prediction workbench <span>↗</span>
            </button>
          </section>
        )}

        <footer className="footer">
          <span>
            ShopSense <i>·</i> Online Shopping Purchase Prediction
          </span>
          <span>Built with React + FastAPI + Machine Learning</span>
        </footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

