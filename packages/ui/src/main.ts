import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

const theme = new URLSearchParams(location.search).get('theme')
if (theme === 'dark' || theme === 'light') {
  document.documentElement.dataset.theme = theme
}

createApp(App).mount('#app')
