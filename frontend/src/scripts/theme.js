// 防止页面闪烁的主题切换脚本
(function() {
  const storageKey = 'webspark-theme';
  
  function getTheme() {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return stored;
      }
    } catch (e) {
      // localStorage might not be available
    }
    
    // Default to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  function applyTheme(theme) {
    const root = document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const resolvedTheme = theme === 'system' ? systemTheme : theme;
    
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    
    // Set meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#0f172a' : '#ffffff');
    }
  }
  
  // Apply theme immediately to prevent flash
  const theme = getTheme();
  applyTheme(theme);
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
    const currentTheme = localStorage.getItem(storageKey) || 'system';
    if (currentTheme === 'system') {
      applyTheme('system');
    }
  });
})();