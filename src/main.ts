import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// Cleanup Facebook/Social tracking parameters from URL
const url = new URL(window.location.href);
if (url.searchParams.has('fbclid') || url.searchParams.has('fid')) {
  url.searchParams.delete('fbclid');
  url.searchParams.delete('fid');
  window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
}

createApp(App).mount('#app')
