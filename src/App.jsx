import { useState, useEffect } from 'react';
import Editor from './components/Editor';
import CommentSidebar from './components/CommentSidebar';
import Login from "./components/Login";
import Register from "./components/Register";

// import  "./app.css"

function App() {
  const [user, setUser] = useState(localStorage.getItem('username'));
  const [showRegister, setShowRegister] = useState(true);

  useEffect(() => {
    if (user) {
      localStorage.setItem('username', user);
    }
  }, [user]);

  const handleRegister = (userObject) => {
    setUser(userObject.name);
    setShowRegister(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    setUser(null);
    setShowRegister(true);
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {user && (
        <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center font-bold shrink-0">
              {user.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold truncate">{user}</p>
              <p className="text-xs text-blue-100 truncate">{localStorage.getItem('userEmail')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded text-sm font-semibold shrink-0 ml-2"
          >
            Logout
          </button>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* Main Editor Section */}
        <div className="flex-1 flex flex-col min-w-0 lg:border-r">
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
            {user ? (
              <Editor username={user} />
            ) : showRegister ? (
              <div>
                <Register onRegister={handleRegister} />
                <div className="text-center mt-4">
                  <button
                    onClick={() => setShowRegister(false)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Already have an account? Login
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <Login onLogin={setUser} />
                <div className="text-center mt-4">
                  <button
                    onClick={() => setShowRegister(true)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Don't have an account? Register
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Comments Sidebar - Stack on mobile, side on desktop */}
        <div className="w-full lg:w-80 xl:w-96 bg-gray-50 border-t lg:border-t-0 lg:border-l overflow-y-auto max-h-1/3 lg:max-h-full">
          <CommentSidebar />
        </div>
      </div>
    </div>
  );
}

export default App;
