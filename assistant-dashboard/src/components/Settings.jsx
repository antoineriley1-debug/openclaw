import { useState, useEffect } from 'react'

export default function Settings({ onSave }) {
  const [providers, setProviders] = useState({})
  const [keys, setKeys] = useState({})
  const [saving, setSaving] = useState({})

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/settings/providers/available')
      const data = await res.json()
      setProviders(data)
      // Initialize key inputs
      setKeys({
        anthropic: '',
        ollama: '',
        mistral: '',
        groq: '',
      })
    } catch (err) {
      console.error('Failed to fetch providers:', err)
    }
  }

  const handleSaveKey = async (provider) => {
    if (!keys[provider]) return

    setSaving({ ...saving, [provider]: true })
    try {
      await fetch(`/api/settings/keys/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keys[provider] }),
      })
      setKeys({ ...keys, [provider]: '' })
      onSave()
    } catch (err) {
      console.error('Failed to save key:', err)
    } finally {
      setSaving({ ...saving, [provider]: false })
    }
  }

  return (
    <div className="card settings">
      <h2>⚙️ API Configuration</h2>
      
      <div className="providers-grid">
        <ProviderCard
          name="Claude (Anthropic)"
          icon="🧠"
          configured={providers.claude}
          onSave={() => handleSaveKey('anthropic')}
          value={keys.anthropic}
          onChange={(e) => setKeys({ ...keys, anthropic: e.target.value })}
          saving={saving.anthropic}
          docs="https://console.anthropic.com"
        />

        <ProviderCard
          name="Ollama (Local)"
          icon="🦙"
          configured={providers.ollama}
          onSave={() => handleSaveKey('ollama')}
          value={keys.ollama}
          onChange={(e) => setKeys({ ...keys, ollama: e.target.value })}
          saving={saving.ollama}
          docs="https://ollama.ai"
        />

        <ProviderCard
          name="Mistral AI"
          icon="🌪️"
          configured={providers.mistral}
          onSave={() => handleSaveKey('mistral')}
          value={keys.mistral}
          onChange={(e) => setKeys({ ...keys, mistral: e.target.value })}
          saving={saving.mistral}
          docs="https://console.mistral.ai"
        />

        <ProviderCard
          name="Groq"
          icon="⚡"
          configured={providers.groq}
          onSave={() => handleSaveKey('groq')}
          value={keys.groq}
          onChange={(e) => setKeys({ ...keys, groq: e.target.value })}
          saving={saving.groq}
          docs="https://console.groq.com"
        />
      </div>

      <div className="info-box">
        <p>💡 Tip: Use the smart router to automatically choose the cheapest suitable model for each task</p>
      </div>
    </div>
  )
}

function ProviderCard({ name, icon, configured, onSave, value, onChange, saving, docs }) {
  return (
    <div className={`provider-card ${configured ? 'configured' : ''}`}>
      <div className="provider-header">
        <span className="provider-icon">{icon}</span>
        <span className="provider-name">{name}</span>
        {configured && <span className="badge">✓ Active</span>}
      </div>

      <input
        type="password"
        placeholder="API Key"
        value={value}
        onChange={onChange}
        className="api-input"
      />

      <div className="provider-actions">
        <button onClick={onSave} disabled={saving || !value} className="save-btn">
          {saving ? '⏳ Saving...' : '💾 Save'}
        </button>
        <a href={docs} target="_blank" rel="noopener noreferrer" className="docs-link">
          Docs ↗
        </a>
      </div>
    </div>
  )
}
