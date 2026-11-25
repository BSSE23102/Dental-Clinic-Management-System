const params = new URLSearchParams(window.location.search);
if (import.meta.env.DEV) {
  if (params.get('preview') === '1') sessionStorage.setItem('dentra.preview', '1');
  if (params.get('live') === '1') sessionStorage.removeItem('dentra.preview');
}
export const previewMode = import.meta.env.DEV && sessionStorage.getItem('dentra.preview') === '1';
export const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
