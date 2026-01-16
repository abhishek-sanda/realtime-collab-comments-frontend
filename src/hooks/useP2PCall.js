import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export function useP2PCall(username, userId, roomId = 'shared-doc') {
  const [peers, setPeers] = useState({});
  const [socket, setSocket] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [error, setError] = useState(null);
  const peerConnectionsRef = useRef({});
  const localVideoRef = useRef();

  // Initialize signaling connection
  useEffect(() => {
    const newSocket = io('http://localhost:3002/ws/call', {
      query: { username, userId }
    });

    setSocket(newSocket);

    newSocket.on('peers', (existingPeers) => {
      console.log('Existing peers:', existingPeers);
      existingPeers.forEach(peer => {
        createPeerConnection(peer.socketId, peer.user, true, newSocket);
      });
    });

    newSocket.on('peer-joined', ({ socketId, user }) => {
      console.log('Peer joined:', user);
      createPeerConnection(socketId, user, false, newSocket);
    });

    newSocket.on('signal', async ({ from, signal }) => {
      let peerConnection = peerConnectionsRef.current[from];
      
      // If we don't have a connection yet but receive an offer, create one
      if (!peerConnection && signal.type === 'offer') {
        console.log('Creating peer connection for incoming offer from:', from);
        await createPeerConnection(from, 'Remote User', false, newSocket);
        peerConnection = peerConnectionsRef.current[from];
      }
      
      if (!peerConnection) {
        console.warn('No peer connection for signal from:', from);
        return;
      }

      try {
        if (signal.type === 'offer') {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          newSocket.emit('signal', { roomId, to: from, signal: answer });
        } else if (signal.type === 'answer') {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
        } else if (signal.candidate) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(signal));
          } catch (err) {
            console.error('ICE candidate error:', err);
          }
        }
      } catch (err) {
        console.error('Signal handling error:', err);
      }
    });

    newSocket.on('peer-left', ({ socketId }) => {
      if (peerConnectionsRef.current[socketId]) {
        peerConnectionsRef.current[socketId].close();
        delete peerConnectionsRef.current[socketId];
      }
      setPeers(p => {
        const updated = { ...p };
        delete updated[socketId];
        return updated;
      });
    });

    newSocket.emit('join', { roomId });

    return () => {
      newSocket.emit('leave', { roomId });
      newSocket.disconnect();
    };
  }, [username, userId, roomId]);

  const createPeerConnection = async (socketId, peerUser, initiator, currentSocket) => {
    const peerConnection = new RTCPeerConnection(ICE_SERVERS);

    if (localStream) {
      console.log('Adding local tracks to peer:', peerUser, 'Tracks:', localStream.getTracks().length);
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    } else {
      console.log('No local stream yet for peer:', peerUser);
    }

    peerConnection.ontrack = (event) => {
      console.log('Track received from', peerUser, 'Track kind:', event.track.kind);
      setPeers(p => ({
        ...p,
        [socketId]: {
          stream: event.streams[0],
          user: peerUser
        }
      }));
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && currentSocket) {
        currentSocket.emit('signal', {
          roomId,
          to: socketId,
          signal: event.candidate
        });
      }
    };

    peerConnectionsRef.current[socketId] = peerConnection;

    if (initiator) {
      console.log('Creating offer as initiator for:', peerUser, 'LocalStream:', localStream ? 'yes' : 'no');
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      currentSocket.emit('signal', { roomId, to: socketId, signal: offer });
    }
  };

  const handleMediaError = (err, deviceType) => {
    console.error(`${deviceType} error:`, err);

    let errorMsg = `Unable to access ${deviceType}. `;
    if (err.name === 'NotAllowedError') {
      errorMsg += 'Permission denied. Check browser permissions.';
    } else if (err.name === 'NotFoundError') {
      errorMsg += `No ${deviceType} found. Check if ${deviceType} is connected.`;
    } else if (err.name === 'NotReadableError') {
      errorMsg += `${deviceType} is in use by another application.`;
    } else if (err.name === 'OverconstrainedError') {
      errorMsg += `${deviceType} does not support requested resolution.`;
    } else {
      errorMsg += err.message || 'Unknown error.';
    }

    setError(errorMsg);
    console.error('Full error:', err);
  };

  const toggleVideo = async () => {
    try {
      setError(null);

      if (!isVideoOn) {
        // If audio is already on, get just video tracks
        if (isAudioOn && localStream) {
          const videoConstraints = {
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 }
            }
          };
          
          try {
            const videoStream = await navigator.mediaDevices.getUserMedia(videoConstraints);
            const videoTrack = videoStream.getVideoTracks()[0];
            
            // Add video track to local stream
            localStream.addTrack(videoTrack);
            
            // Add to all peer connections
            Object.values(peerConnectionsRef.current).forEach(pc => {
              pc.addTrack(videoTrack, localStream);
            });
            
            // Stop the temporary stream
            videoStream.getTracks().forEach(track => {
              if (track.kind === 'audio') track.stop();
            });
            
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = localStream;
            }
            setIsVideoOn(true);
          } catch (err) {
            handleMediaError(err, 'camera');
          }
        } else {
          // Get both video and audio (or just video if audio is off)
          const constraints = {
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 }
            },
            audio: isAudioOn ? true : false
          };

          try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // If we already have a stream, add new tracks instead of replacing
            if (localStream) {
              stream.getTracks().forEach(track => {
                localStream.addTrack(track);
              });
              stream.getTracks().forEach(track => track.stop());
            } else {
              setLocalStream(stream);
            }
            
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = localStream || stream;
            }
            setIsVideoOn(true);

            // Add video tracks to existing connections
            (localStream || stream).getVideoTracks().forEach(track => {
              Object.values(peerConnectionsRef.current).forEach(pc => {
                pc.addTrack(track, localStream || stream);
              });
            });
          } catch (err) {
            handleMediaError(err, 'camera');
          }
        }
      } else {
        // Stop only video tracks
        if (localStream) {
          localStream.getVideoTracks().forEach(track => track.stop());
          localStream.getVideoTracks().forEach(track => {
            localStream.removeTrack(track);
          });
        }
        
        // If audio is still on, keep stream; otherwise clear it
        if (!isAudioOn) {
          setLocalStream(null);
        }
        setIsVideoOn(false);
      }
    } catch (err) {
      setError('Unexpected error: ' + err.message);
      console.error('Error in toggleVideo:', err);
    }
  };

  const toggleAudio = async () => {
    try {
      setError(null);

      if (!isAudioOn) {
        // If video is already on, get just audio tracks
        if (isVideoOn && localStream) {
          const audioConstraints = {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          };
          
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia(audioConstraints);
            const audioTrack = audioStream.getAudioTracks()[0];
            
            // Add audio track to local stream
            localStream.addTrack(audioTrack);
            
            // Add to all peer connections
            Object.values(peerConnectionsRef.current).forEach(pc => {
              pc.addTrack(audioTrack, localStream);
            });
            
            // Stop the temporary stream
            audioStream.getTracks().forEach(track => {
              if (track.kind === 'video') track.stop();
            });
            
            setIsAudioOn(true);
          } catch (err) {
            handleMediaError(err, 'microphone');
          }
        } else {
          // Get both audio and video (or just audio if video is off)
          const constraints = {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            },
            video: isVideoOn
              ? {
                  width: { ideal: 640 },
                  height: { ideal: 480 }
                }
              : false
          };

          try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // If we already have a stream, add new tracks instead of replacing
            if (localStream) {
              stream.getTracks().forEach(track => {
                localStream.addTrack(track);
              });
              stream.getTracks().forEach(track => track.stop());
            } else {
              setLocalStream(stream);
            }
            
            if (localVideoRef.current && isVideoOn) {
              localVideoRef.current.srcObject = localStream || stream;
            }
            setIsAudioOn(true);

            // Add audio tracks to existing connections
            (localStream || stream).getAudioTracks().forEach(track => {
              Object.values(peerConnectionsRef.current).forEach(pc => {
                pc.addTrack(track, localStream || stream);
              });
            });
          } catch (err) {
            handleMediaError(err, 'microphone');
          }
        }
      } else {
        // Stop only audio tracks
        if (localStream) {
          localStream.getAudioTracks().forEach(track => track.stop());
          localStream.getAudioTracks().forEach(track => {
            localStream.removeTrack(track);
          });
        }
        
        // If video is still on, keep stream; otherwise clear it
        if (!isVideoOn) {
          setLocalStream(null);
        }
        setIsAudioOn(false);
      }
    } catch (err) {
      setError('Unexpected error: ' + err.message);
      console.error('Error in toggleAudio:', err);
    }
  };

  const stopAll = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setIsVideoOn(false);
    setIsAudioOn(false);
  };

  return {
    peers,
    localVideoRef,
    localStream,
    isVideoOn,
    isAudioOn,
    error,
    toggleVideo,
    toggleAudio,
    stopAll
  };
}
