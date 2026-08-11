const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

export const API_BASE_URL = isProd
  ? 'https://souzas-finance-eudrdnh4c2hzgzgu.eastus2-01.azurewebsites.net/api/v1'
  : 'http://localhost:8080/api/v1';

