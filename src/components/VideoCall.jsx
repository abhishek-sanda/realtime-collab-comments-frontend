import { useRef, useEffect } from 'react';
import { useP2PCall } from '../hooks/useP2PCall';

export default function VideoCall({ username, userId, roomId = 'shared-doc' }) {
  const {
    peers,
    localVideoRef,
    localStream,
    isVideoOn,
    isAudioOn,
    error,
    toggleVideo,
    toggleAudio,
    stopAll
  } = useP2PCall(username, userId, roomId);

  return (
    <div className="bg-gray-900 text-white rounded-lg p-2 sm:p-3">
      <h3 className="text-sm sm:text-base font-bold mb-2">📹 Video Call</h3>

      {/* Error Message */}
      {error && (
        <div className="mb-2 p-2 bg-red-600 rounded text-xs sm:text-sm">
          {error}
        </div>
      )}

      {/* Local Video */}
      <div className="mb-3">
        <div className="bg-black rounded mb-2 h-24 sm:h-32 flex items-center justify-center">
          {localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              className="w-full rounded h-full object-cover"
            />
          ) : (
            <div className="text-gray-400 text-center">
              <div className="text-2xl sm:text-3xl mb-1">📹</div>
              <p className="text-xs">Start Video</p>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-300">You ({username})</p>
      </div>

      {/* Remote Videos Grid */}
      {Object.entries(peers).length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-3 max-h-32 overflow-y-auto">
          {Object.entries(peers).map(([socketId, { stream, user }]) => (
            <RemoteVideo key={socketId} stream={stream} user={user} />
          ))}
        </div>
      )}

      {peers && Object.keys(peers).length === 0 && (
        <p className="text-xs text-gray-400 mb-2">No other participants</p>
      )}

      {/* Controls */}
      <div className="flex gap-1 flex-wrap text-xs sm:text-sm">
        <button
          onClick={toggleVideo}
          className={`px-2 sm:px-3 py-1 rounded font-semibold transition ${
            isVideoOn
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isVideoOn ? '📹 Off' : '📹 On'}
        </button>

        <button
          onClick={toggleAudio}
          className={`px-2 sm:px-3 py-1 rounded font-semibold transition ${
            isAudioOn
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isAudioOn ? '🎤 M' : '🎤 U'}
        </button>

        {(isVideoOn || isAudioOn) && (
          <button
            onClick={stopAll}
            className="px-2 sm:px-3 py-1 rounded font-semibold bg-gray-600 hover:bg-gray-700 transition"
          >
            ⏹️ Stop
          </button>
        )}
      </div>
    </div>
  );
}

function RemoteVideo({ stream, user }) {
  const videoRef = useRef();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="bg-black rounded h-24 sm:h-28 flex items-center justify-center overflow-hidden relative">
      <video
        ref={videoRef}
        autoPlay
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black to-transparent p-1">
        <p className="text-xs text-gray-200 truncate">{user}</p>
      </div>
    </div>
  );
}
