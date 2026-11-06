<template>
  <figure class="terminal" aria-label="Terminal output of vite with a TypeScript error reported by vite-plugin-checker">
    <div class="bar" aria-hidden="true">
      <span class="dot" />
      <span class="dot" />
      <span class="dot" />
      <span class="name">vite</span>
    </div>
    <pre class="body"><span class="dim">$</span> vite

  <span class="vite">VITE</span> <span class="dim">ready in</span> 312 ms

  <span class="vite">➜</span>  Local:   <span class="link">http://localhost:5173/</span>

<span class="label error"> ERROR(TypeScript) </span> Cannot find name 'titel'. Did you mean 'title'?
<span class="label file"> FILE </span> <span class="link">src/App.tsx:7:15</span>

<span class="dim">    6 |</span>   const title = 'Hello'
<span class="mark">  &gt;</span><span class="dim"> 7 |</span>   return &lt;h1&gt;{titel}&lt;/h1&gt;
<span class="dim">      |</span>               <span class="mark">^</span>
<span class="dim">    8 |</span> }

<span class="red">[TypeScript] Found 1 error. Watching for file changes.</span>
<span class="yellow">[ESLint] Found 0 errors and 1 warning</span></pre>
  </figure>
</template>

<style scoped>
.terminal {
  position: relative;
  margin: 0;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background-color: #18181b;
  box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.35);
  color: #e4e4e7;
}

.bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background-color: #202024;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #3f3f46;
}

.name {
  margin-left: 8px;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: #a1a1aa;
}

.body {
  margin: 0;
  padding: 20px;
  overflow-x: auto;
  white-space: pre-wrap;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  line-height: 1.6;
}

@media (min-width: 640px) {
  .body {
    font-size: 13px;
  }
}

@media (min-width: 960px) {
  .body {
    font-size: 12.5px;
  }
}

@media (min-width: 1280px) {
  .body {
    font-size: 13px;
  }
}

.dim {
  color: #71717a;
}

.vite {
  font-weight: 700;
  color: #4ade80;
}

.link {
  color: #67e8f9;
}

.label {
  font-weight: 700;
  color: #000;
}

.label.error {
  background-color: #f87171;
}

.label.file {
  background-color: #67e8f9;
}

.mark,
.red {
  color: #f87171;
}

.yellow {
  color: #facc15;
}
</style>
