// Definimos la URL base desde las variables de entorno
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://proyecto-tiendamovil.onrender.com";

/**
 * Inicia sesión en el backend de Django
 * Cumple con los requisitos de seguridad (2.2) y conexión (2.3)
 */
export async function loginToBackend(): Promise<void> {
  try {
    // Datos de acceso (asegúrate de que existan en tu base de datos de Neon)
    const username = "admin";
    const password = "admin123";

    const response = await fetch(`${API_BASE_URL}/api/token/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Detalle del error:", errorData);
      throw new Error(`Error de autenticación: ${response.status}`);
    }

    const data = await response.json();

    // Manejo dinámico de Tokens (JWT o Token básico)
    const token = data.access || data.key;

    if (token) {
      localStorage.setItem("backendToken", token);
      localStorage.setItem("userType", "admin");

      // Si es JWT, guardamos el refresh token para mantener la sesión
      if (data.refresh) {
        localStorage.setItem("refreshToken", data.refresh);
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);
        localStorage.setItem("tokenExpiresAt", expiresAt.toISOString());
      }
      
      console.log("✅ Conexión exitosa con el backend local");
    } else {
      throw new Error("El backend no devolvió un token válido.");
    }
  } catch (error) {
    console.error("❌ Error en loginToBackend:", error);
    throw error;
  }
}

/**
 * Realiza solicitudes autenticadas a cualquier endpoint
 * Uso: fetchWithAuth('/api/productos/')
 */
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
  try {
    const token = localStorage.getItem("backendToken");

    if (!token) {
      throw new Error("No hay sesión activa. Por favor, inicia sesión.");
    }

    // Construcción automática de la URL para evitar errores de 404
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    const authOptions: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // Estándar JWT
      },
    };

    return await fetch(url, authOptions);
  } catch (error) {
    console.error(`❌ Error en petición a ${endpoint}:`, error);
    throw error;
  }
}

// Generador de nombres para pruebas (sin cambios)
export function generateRandomVendorName(): string {
  const firstNames = ["Carlos", "María", "Juan", "Ana", "Luis", "Laura", "Pedro", "Sofía"];
  const lastNames = ["García", "Rodríguez", "Martínez", "López", "González", "Pérez"];
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}