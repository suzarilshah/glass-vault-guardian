
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="glass-card p-8 border-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg">
          <div className="flex justify-center mb-6">
            <Search className="w-16 h-16 text-blue-400" />
          </div>
          
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          
          <h2 className="text-2xl font-semibold text-white mb-4">Page Not Found</h2>
          
          <p className="text-gray-400 mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <div className="bg-gray-800/50 border border-white/10 rounded-lg p-4 mb-6">
            <p className="text-gray-300 text-sm">
              <span className="text-gray-500">Requested path:</span>
              <br />
              <code className="text-blue-400 font-mono">{location.pathname}</code>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleGoHome}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
            
            <Button
              onClick={handleGoBack}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
