
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-ocean-light to-ocean-deep">
      <div className="text-center p-8 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-xl">
        <h1 className="text-5xl font-bold mb-4 text-white">404</h1>
        <p className="text-xl text-white/80 mb-6">Oops! This fish got away.</p>
        <Button 
          onClick={() => navigate('/')} 
          className="bg-ocean-deep hover:bg-ocean text-white border-none px-6 py-2 rounded-full transition-all duration-300 hover:scale-105"
        >
          Return to the Ocean
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
