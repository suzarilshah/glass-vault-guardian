
import { useRouteError, Link } from "react-router-dom";
import { AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const ErrorPage = () => {
  const error = useRouteError() as any;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-white mb-4">Oops! Something went wrong</h1>
        <p className="text-gray-400 mb-6">
          {error?.statusText || error?.message || "An unexpected error occurred"}
        </p>
        <div className="space-y-3">
          <Button asChild className="w-full bg-green-600 hover:bg-green-700">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Return to Home
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="w-full border-white/20 text-white hover:bg-white/10"
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
