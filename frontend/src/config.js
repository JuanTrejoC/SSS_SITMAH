// Make API URL dynamic depending on where the frontend is accessed from
const envUrl = import.meta.env.VITE_API_URL;
// If the env variable is exactly localhost but we are accessing via IP, adapt automatically
export const API_BASE_URL = (envUrl && envUrl.includes('localhost') && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
  ? `http://${window.location.hostname}:3000`
  : envUrl || `http://${window.location.hostname}:3000`;
