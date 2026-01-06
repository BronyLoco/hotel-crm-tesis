import axios from 'axios';

const API_URL = 'http://localhost:8080/api/auth';

// Iniciar sesión
export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { username, password });
    
    if (response.data.token) {
      // Guardar el token y el usuario en el navegador
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Cerrar sesión
export const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

// Obtener usuario actual
export const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user'));
};