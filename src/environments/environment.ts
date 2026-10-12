export const environment = {
  production: true,
  apiUrl:
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
      ? `${window.location.origin}/api/v1`
      : 'http://localhost:5000/api/v1',
};
