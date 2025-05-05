// ErrorBoundary.js
import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el estado para mostrar la UI alternativa en caso de error
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Puedes registrar el error en un servicio externo aquí
    console.error("Error capturado por ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // UI de reserva
      return (
        <div className="p-6 bg-red-100 text-red-800 rounded">
          <h2 className="text-xl font-bold mb-2">Algo salió mal.</h2>
          <p>Intenta recargar la página o contactar al soporte técnico.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
