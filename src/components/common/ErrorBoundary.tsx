import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  context?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: any;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // Estructura de trazabilidad simple y útil
    console.groupCollapsed(`UI ErrorBoundary${this.props.context ? ` [${this.props.context}]` : ''}`);
    console.error('Error:', error);
    console.error('Error info:', errorInfo);
    console.groupEnd();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border rounded-md bg-destructive/5 text-destructive">
          <p className="font-semibold">Se produjo un error al mostrar esta sección.</p>
          <p className="text-sm opacity-80">Intenta recargar o volver a generar la estrategia.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
