import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center px-6">
      <div className="text-center max-w-xl">
        <h1 className="text-[6rem] font-extrabold mb-2 text-[#F7C992] leading-none">
          404
        </h1>
        <p className="text-2xl font-medium mb-4 text-[#FEFEFE]">
          You've taken a wrong turn.
        </p>
        <p className="text-lg text-[#9DC0B3] mb-8">
          This page isn’t cooked yet. Let’s get you back to the menu.
        </p>
        <a
          href="/"
          className="inline-block bg-[#9DC0B3] hover:bg-[#9DC0B3]/80 text-[#121212] font-semibold px-6 py-3 rounded-lg transition-all duration-300"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
