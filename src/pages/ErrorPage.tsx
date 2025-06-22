
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

const ErrorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Try to get error from location state
    const locationError = location.state?.error;
    if (locationError) {
      const errorObj = locationError instanceof Error ? locationError : new Error(locationError.toString());
      setError(errorObj);
      console.error("Application Error:", errorObj);
    } else {
      // If no error in state, create a generic error
      const genericError = new Error("An unexpected error occurred");
      setError(genericError);
      console.error("Application Error: No specific error provided");
    }
  }, [location.state]);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="glass-card p-8 border-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg">
          <div className="flex justify-center mb-6">
            <AlertTriangle className="w-16 h-16 text-red-400" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">Something went wrong</h1>
          
          <p className="text-gray-400 mb-6">
            An unexpected error occurred. This might be a temporary issue.
          </p>
          
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-300 text-sm font-mono break-words">
                {error.message || "Unknown error occurred"}
              </p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleRefresh}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
