import './styles/tokens.css';
import './styles/base.css';
import { mount } from 'svelte';
import App from './App.svelte';
import { setupPwa } from './lib/pwa';

mount(App, { target: document.getElementById('app')! });
setupPwa();
