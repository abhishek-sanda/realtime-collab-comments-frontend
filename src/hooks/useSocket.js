import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export default function useSocket(url, options) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(url, options);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
    // Reconnect if the url or query parameters change.
  }, [url, JSON.stringify(options?.query)]);

  return socket;
}