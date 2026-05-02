import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <main>
      <h1 id="webpack-title">Webpack Playground</h1>
      <button id="webpack-counter" onClick={() => setCount((value) => value + 1)}>
        Count: {count}
      </button>
      <p id="webpack-copy-target">Selection source test content for Webpack.</p>
    </main>
  );
}
