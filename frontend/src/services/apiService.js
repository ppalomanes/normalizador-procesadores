// services/apiService.js

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Clase para manejar la comunicación con la API
class ApiService {
  // Método auxiliar para obtener el token JWT
  static getToken() {
    return localStorage.getItem("token");
  }

  // Método para construir headers de petición
  static getHeaders(includeContentType = true) {
    const headers = {};
    const token = this.getToken();

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (includeContentType) {
      headers["Content-Type"] = "application/json";
    }

    return headers;
  }

  // Método general para realizar peticiones
  static async request(
    endpoint,
    method = "GET",
    data = null,
    isFormData = false
  ) {
    const url = `${API_URL}${endpoint}`;

    const options = {
      method,
      headers: this.getHeaders(!isFormData), // No incluir Content-Type para FormData
    };

    if (data) {
      if (isFormData) {
        options.body = data; // FormData object
      } else {
        options.body = JSON.stringify(data);
      }
    }

    try {
      console.log(`Realizando petición ${method} a ${url}`);

      const response = await fetch(url, options);
      console.log(`Respuesta recibida: Status ${response.status}`);

      // Si la respuesta no es JSON, lanzar error
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const json = await response.json();
        console.log("Respuesta JSON:", json);

        // Si la respuesta no es exitosa, lanzar error
        if (!response.ok) {
          const error = new Error(json.message || "Error desconocido");
          error.status = response.status;
          error.data = json;
          throw error;
        }

        return json;
      } else {
        const text = await response.text();
        console.log("Respuesta no-JSON:", text);
        throw new Error(text || "Respuesta no válida");
      }
    } catch (error) {
      console.error(`Error en petición ${method} a ${endpoint}:`, error);
      throw error;
    }
  }

  // Métodos específicos de autenticación
  static async register(userData) {
    return this.request("/auth/register", "POST", userData);
  }

  static async login(credentials) {
    return this.request("/auth/login", "POST", credentials);
  }

  static async getCurrentUser() {
    return this.request("/auth/me");
  }

  static async updateUser(userData) {
    return this.request("/auth/update", "PUT", userData);
  }

  // Métodos para análisis
  static async getAnalyses() {
    return this.request("/analyses");
  }

  static async getAnalysisById(id, includeData = false) {
    return this.request(`/analyses/${id}?includeData=${includeData}`);
  }

  static async createAnalysis(analysisData, file) {
    // Usar FormData para subir archivo
    const formData = new FormData();

    if (file) {
      formData.append("file", file);
    }

    formData.append("name", analysisData.name);

    if (analysisData.description) {
      formData.append("description", analysisData.description);
    }

    if (analysisData.stats) {
      formData.append("stats", JSON.stringify(analysisData.stats));
    }

    if (analysisData.data) {
      formData.append("data", JSON.stringify(analysisData.data));
    }

    return this.request("/analyses", "POST", formData, true);
  }

  static async updateAnalysis(id, analysisData) {
    return this.request(`/analyses/${id}`, "PUT", analysisData);
  }

  static async deleteAnalysis(id) {
    return this.request(`/analyses/${id}`, "DELETE");
  }

  static async shareAnalysis(id, userId, permissions = "read") {
    return this.request(`/analyses/${id}/share`, "POST", {
      sharedWith: userId,
      permissions,
    });
  }

  static async getSharedAnalyses() {
    return this.request("/analyses/shared");
  }

  static async searchAnalyses(term) {
    return this.request(`/analyses/search?term=${encodeURIComponent(term)}`);
  }

  // Métodos para reglas de validación
  static async getRules() {
    return this.request("/rules");
  }

  static async getRuleById(id) {
    return this.request(`/rules/${id}`);
  }

  static async getDefaultRule() {
    return this.request("/rules/default");
  }

  static async createRule(ruleData) {
    return this.request("/rules", "POST", ruleData);
  }

  static async updateRule(id, ruleData) {
    return this.request(`/rules/${id}`, "PUT", ruleData);
  }

  static async deleteRule(id) {
    return this.request(`/rules/${id}`, "DELETE");
  }
}

export default ApiService;
