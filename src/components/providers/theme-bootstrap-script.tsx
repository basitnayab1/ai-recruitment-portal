/**
 * Forces the dark premium theme before hydration (ReactBits-inspired UI is dark-first).
 */
export function ThemeBootstrapScript() {
  const script = `(function(){try{var r=document.documentElement;r.classList.add('dark');r.classList.remove('light');}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
