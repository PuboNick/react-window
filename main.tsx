import React from 'react';
import ReactDOM from 'react-dom/client';

import { PanelRender, panelStore, register } from './src';

register([
  {
    name: 'test',
    title: '测试窗口',
    panel: React.lazy(() => import('./test')),
    minWidth: 370,
    minHeight: 340,
    single: true,
  },
]);

function App() {
  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative', background: '#333' }}>
      <button
        onClick={() => {
          console.log('add');
          panelStore.push({ panel: 'test' });
        }}
      >
        add
      </button>
      <PanelRender />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);
