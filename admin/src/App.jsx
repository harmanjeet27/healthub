import React from 'react'

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h1 className="text-3xl font-bold underline" style={{ color: 'red', textAlign: 'center' }}>Hello world!</h1>
      </div>
    </div>
  )
}

export default App
