import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, Headphones, Radio, Square, Circle, SkipForward, SkipBack, Repeat, Shuffle } from 'lucide-react';
import { API_ENDPOINT, getAssetUrl, getStreamUrl } from '../../config/api.config';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  bpm: number;
  key: string;
  url?: string;
  fileUrl?: string;
  artworkUrl?: string;
  genre?: string;
  streamCount?: number;
}

interface DeckState {
  track: Track | null;
  isPlaying: boolean;
  position: number;
  volume: number;
  pitch: number;
  tempo: number;
  eq: {
    high: number;
    mid: number;
    low: number;
  };
  cuePoints: number[];
  isLooping: boolean;
  loopStart: number;
  loopEnd: number;
}

const DJMixerInterface = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Audio refs for actual playback
  const deck1AudioRef = useRef<HTMLAudioElement>(null);
  const deck2AudioRef = useRef<HTMLAudioElement>(null);

  // Fetch uploaded tracks from the backend
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_ENDPOINT}/tracks`);
        if (!response.ok) {
          throw new Error('Failed to fetch tracks');
        }
        const data = await response.json();
        
        // Transform the API response to match our Track interface
        const transformedTracks: Track[] = data.tracks.map((track: any) => ({
          id: track.id,
          title: track.title,
          artist: track.artist?.stageName || 'Unknown Artist',
          duration: track.duration || 180,
          bpm: track.bpm || 128,
          key: track.keySignature || 'C',
          fileUrl: track.fileUrl,
          artworkUrl: track.artworkUrl,
          genre: track.genre,
          streamCount: track.streamCount
        }));
        
        setTracks(transformedTracks);
      } catch (err) {
        console.error('Error fetching tracks:', err);
        setError(err instanceof Error ? err.message : 'Failed to load tracks');
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, []);

  // DJ State - initialize with first two tracks if available
  const [deck1, setDeck1] = useState<DeckState>({
    track: null,
    isPlaying: false,
    position: 0,
    volume: 75,
    pitch: 0,
    tempo: 1.0,
    eq: { high: 50, mid: 50, low: 50 },
    cuePoints: [],
    isLooping: false,
    loopStart: 0,
    loopEnd: 0
  });

  const [deck2, setDeck2] = useState<DeckState>({
    track: null,
    isPlaying: false,
    position: 0,
    volume: 75,
    pitch: 0,
    tempo: 1.0,
    eq: { high: 50, mid: 50, low: 50 },
    cuePoints: [],
    isLooping: false,
    loopStart: 0,
    loopEnd: 0
  });

  // Load first two tracks into decks when tracks are loaded
  useEffect(() => {
    if (tracks.length > 0) {
      if (tracks[0] && !deck1.track) {
        setDeck1(prev => ({
          ...prev,
          track: tracks[0]
        }));
      }
      if (tracks[1] && !deck2.track) {
        setDeck2(prev => ({
          ...prev,
          track: tracks[1]
        }));
      }
    }
  }, [tracks]);

  const [crossfader, setCrossfader] = useState(50);
  const [masterVolume, setMasterVolume] = useState(80);
  const [isRecording, setIsRecording] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

  // Refs for audio simulation
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Handle audio events and sync progress
  useEffect(() => {
    const audio1 = deck1AudioRef.current;
    const audio2 = deck2AudioRef.current;

    const updateProgress1 = () => {
      if (audio1) {
        setDeck1(prev => ({
          ...prev,
          position: Math.floor(audio1.currentTime)
        }));
      }
    };

    const updateProgress2 = () => {
      if (audio2) {
        setDeck2(prev => ({
          ...prev,
          position: Math.floor(audio2.currentTime)
        }));
      }
    };

    const handleEnded1 = () => {
      setDeck1(prev => ({ ...prev, isPlaying: false, position: 0 }));
    };

    const handleEnded2 = () => {
      setDeck2(prev => ({ ...prev, isPlaying: false, position: 0 }));
    };

    if (audio1) {
      audio1.addEventListener('timeupdate', updateProgress1);
      audio1.addEventListener('ended', handleEnded1);
    }

    if (audio2) {
      audio2.addEventListener('timeupdate', updateProgress2);
      audio2.addEventListener('ended', handleEnded2);
    }

    return () => {
      if (audio1) {
        audio1.removeEventListener('timeupdate', updateProgress1);
        audio1.removeEventListener('ended', handleEnded1);
      }
      if (audio2) {
        audio2.removeEventListener('timeupdate', updateProgress2);
        audio2.removeEventListener('ended', handleEnded2);
      }
    };
  }, []);

  // Deck control functions
  const togglePlay = (deckNumber: 1 | 2) => {
    const audioRef = deckNumber === 1 ? deck1AudioRef : deck2AudioRef;
    const deck = deckNumber === 1 ? deck1 : deck2;

    if (audioRef.current && deck.track) {
      if (deck.isPlaying) {
        audioRef.current.pause();
      } else {
        // Set the audio source if not set
        if (!audioRef.current.src || audioRef.current.src === window.location.href) {
          audioRef.current.src = getStreamUrl(deck.track.id);
        }
        audioRef.current.play().catch(error => {
          console.error('Audio playback failed:', error);
          setError('Audio playback failed. Please try again.');
        });
      }
    }

    if (deckNumber === 1) {
      setDeck1(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    } else {
      setDeck2(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    }
  };

  const loadTrack = (track: Track, deckNumber: 1 | 2) => {
    const audioRef = deckNumber === 1 ? deck1AudioRef : deck2AudioRef;

    // Stop current playback if any
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = getStreamUrl(track.id);
    }

    const newDeckState = {
      track,
      isPlaying: false,
      position: 0,
      volume: 75,
      pitch: 0,
      tempo: 1.0,
      eq: { high: 50, mid: 50, low: 50 },
      cuePoints: [],
      isLooping: false,
      loopStart: 0,
      loopEnd: 0
    };

    if (deckNumber === 1) {
      setDeck1(newDeckState);
    } else {
      setDeck2(newDeckState);
    }
  };

  const updateEQ = (deckNumber: 1 | 2, band: keyof DeckState['eq'], value: number) => {
    if (deckNumber === 1) {
      setDeck1(prev => ({
        ...prev,
        eq: { ...prev.eq, [band]: value }
      }));
    } else {
      setDeck2(prev => ({
        ...prev,
        eq: { ...prev.eq, [band]: value }
      }));
    }
  };

  const syncBPM = () => {
    if (deck1.track && deck2.track) {
      const bpmDiff = deck1.track.bpm / deck2.track.bpm;
      setDeck2(prev => ({ ...prev, tempo: bpmDiff }));
      setIsSynced(true);
      setTimeout(() => setIsSynced(false), 2000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Waveform Component
  const Waveform = ({ deck, deckNumber }: { deck: DeckState; deckNumber: 1 | 2 }) => {
    const waveformBars = 50;
    const progress = deck.track ? (deck.position / deck.track.duration) * 100 : 0;
    
    return (
      <div className="h-20 bg-gray-800 rounded-lg p-2 overflow-hidden relative">
        <div className="flex items-center justify-center h-full space-x-0.5">
          {Array.from({ length: waveformBars }).map((_, i) => {
            const height = Math.random() * 60 + 20;
            const isPlayed = (i / waveformBars) * 100 < progress;
            const color = deckNumber === 1 ? 'bg-blue-500' : 'bg-green-500';
            const playedColor = deckNumber === 1 ? 'bg-blue-300' : 'bg-green-300';
            
            return (
              <div
                key={i}
                className={`w-1 ${isPlayed ? playedColor : color} transition-all duration-300`}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
        
        {/* Playhead */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg transition-all duration-1000"
          style={{ left: `${progress}%` }}
        />
        
        {/* Cue points */}
        {deck.cuePoints.map((cuePoint, index) => (
          <div
            key={index}
            className="absolute top-0 bottom-0 w-0.5 bg-yellow-400"
            style={{ left: `${(cuePoint / (deck.track?.duration || 1)) * 100}%` }}
          />
        ))}
      </div>
    );
  };

  // Deck Component
  const Deck = ({ deck, deckNumber }: { deck: DeckState; deckNumber: 1 | 2 }) => {
    const deckColor = deckNumber === 1 ? 'blue' : 'green';
    
    return (
      <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
        {/* Deck Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-bold text-${deckColor}-400`}>
            DECK {deckNumber === 1 ? 'A' : 'B'}
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => togglePlay(deckNumber)}
              className={`p-2 rounded-full ${deck.isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
            >
              {deck.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button className="p-2 rounded-full bg-gray-600 hover:bg-gray-700 text-white">
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Track Info */}
        {deck.track && (
          <div className="bg-gray-800 p-3 rounded-lg mb-4">
            <div className="flex items-start space-x-3">
              {deck.track.artworkUrl && (
                <img 
                  src={getAssetUrl(deck.track.artworkUrl)} 
                  alt={deck.track.title}
                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-semibold truncate">{deck.track.title}</h4>
                <p className="text-gray-400 text-sm truncate">{deck.track.artist}</p>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{deck.track.bpm} BPM</span>
                  <span>Key: {deck.track.key}</span>
                  <span>{formatTime(deck.position)} / {formatTime(deck.track.duration)}</span>
                </div>
                {deck.track.genre && (
                  <div className="text-xs text-purple-400 mt-1">
                    {deck.track.genre}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Waveform */}
        <Waveform deck={deck} deckNumber={deckNumber} />

        {/* Transport Controls */}
        <div className="flex justify-center space-x-2 my-4">
          <button className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white">
            <SkipBack className="w-4 h-4" />
          </button>
          <button 
            onClick={() => togglePlay(deckNumber)}
            className={`p-3 rounded-full ${deck.isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
          >
            {deck.isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          <button className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white">
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Tempo Control */}
        <div className="mb-4">
          <label className="block text-white text-sm mb-2">Tempo: {deck.tempo.toFixed(2)}x</label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.01"
            value={deck.tempo}
            onChange={(e) => {
              const tempo = parseFloat(e.target.value);
              const audioRef = deckNumber === 1 ? deck1AudioRef : deck2AudioRef;

              if (audioRef.current) {
                audioRef.current.playbackRate = tempo;
              }

              if (deckNumber === 1) {
                setDeck1(prev => ({ ...prev, tempo }));
              } else {
                setDeck2(prev => ({ ...prev, tempo }));
              }
            }}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Pitch Control */}
        <div className="mb-4">
          <label className="block text-white text-sm mb-2">Pitch: {deck.pitch > 0 ? '+' : ''}{deck.pitch}%</label>
          <input
            type="range"
            min="-50"
            max="50"
            value={deck.pitch}
            onChange={(e) => {
              const pitch = parseInt(e.target.value);
              if (deckNumber === 1) {
                setDeck1(prev => ({ ...prev, pitch }));
              } else {
                setDeck2(prev => ({ ...prev, pitch }));
              }
            }}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* EQ Controls */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {['high', 'mid', 'low'].map((band) => (
            <div key={band}>
              <label className="block text-white text-xs mb-1 text-center uppercase">{band}</label>
              <input
                type="range"
                min="0"
                max="100"
                value={deck.eq[band as keyof typeof deck.eq]}
                onChange={(e) => updateEQ(deckNumber, band as keyof DeckState['eq'], parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer vertical-slider"
                style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' }}
              />
              <div className="text-xs text-gray-400 text-center mt-1">
                {deck.eq[band as keyof typeof deck.eq]}
              </div>
            </div>
          ))}
        </div>

        {/* Volume Control */}
        <div className="mb-4">
          <label className="block text-white text-sm mb-2">Volume: {deck.volume}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={deck.volume}
            onChange={(e) => {
              const volume = parseInt(e.target.value);
              const audioRef = deckNumber === 1 ? deck1AudioRef : deck2AudioRef;

              if (audioRef.current) {
                audioRef.current.volume = volume / 100;
              }

              if (deckNumber === 1) {
                setDeck1(prev => ({ ...prev, volume }));
              } else {
                setDeck2(prev => ({ ...prev, volume }));
              }
            }}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Cue Points */}
        <div className="flex space-x-1">
          {[1, 2, 3, 4].map((cue) => (
            <button
              key={cue}
              className="flex-1 py-2 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded font-bold"
            >
              CUE {cue}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Hidden Audio Elements */}
      <audio
        ref={deck1AudioRef}
        preload="metadata"
        onLoadedMetadata={() => {
          if (deck1AudioRef.current && deck1.track) {
            deck1AudioRef.current.volume = deck1.volume / 100;
            deck1AudioRef.current.playbackRate = deck1.tempo;
          }
        }}
      />
      <audio
        ref={deck2AudioRef}
        preload="metadata"
        onLoadedMetadata={() => {
          if (deck2AudioRef.current && deck2.track) {
            deck2AudioRef.current.volume = deck2.volume / 100;
            deck2AudioRef.current.playbackRate = deck2.tempo;
          }
        }}
      />

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Professional DJ Mixer</h1>
        <p className="text-gray-400">Mix tracks like a pro with advanced controls</p>
      </div>

      {/* Main Mixer Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Deck 1 */}
        <Deck deck={deck1} deckNumber={1} />

        {/* Center Mixer Controls */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          <h3 className="text-xl font-bold text-purple-400 text-center mb-6">MIXER</h3>
          
          {/* Master Controls */}
          <div className="text-center mb-6">
            <h4 className="text-white font-semibold mb-2">Master Volume</h4>
            <input
              type="range"
              min="0"
              max="100"
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseInt(e.target.value))}
              className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-sm text-gray-400 mt-1">{masterVolume}%</div>
          </div>

          {/* Crossfader */}
          <div className="mb-6">
            <h4 className="text-white font-semibold mb-2 text-center">Crossfader</h4>
            <input
              type="range"
              min="0"
              max="100"
              value={crossfader}
              onChange={(e) => setCrossfader(parseInt(e.target.value))}
              className="w-full h-4 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>A</span>
              <span>{crossfader}%</span>
              <span>B</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={syncBPM}
              className={`p-3 rounded font-bold transition-all ${
                isSynced ? 'bg-green-600 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isSynced ? '✓ SYNCED' : 'SYNC BPM'}
            </button>
            
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`p-3 rounded font-bold transition-all ${
                isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              {isRecording ? '● REC' : 'RECORD'}
            </button>
          </div>

          {/* BPM Display */}
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-xs text-gray-400 mb-1">MASTER BPM</div>
            <div className="text-2xl font-bold text-white">
              {deck1.track && deck2.track 
                ? Math.round((deck1.track.bpm + deck2.track.bpm) / 2)
                : deck1.track?.bpm || deck2.track?.bpm || '--'
              }
            </div>
          </div>

          {/* Effects Section */}
          <div className="mt-6">
            <h4 className="text-white font-semibold mb-3 text-center">Effects</h4>
            <div className="grid grid-cols-2 gap-2">
              <button className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm">
                REVERB
              </button>
              <button className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm">
                DELAY
              </button>
              <button className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm">
                FILTER
              </button>
              <button className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm">
                FLANGER
              </button>
            </div>
          </div>
        </div>

        {/* Deck 2 */}
        <Deck deck={deck2} deckNumber={2} />
      </div>

      {/* Track Browser */}
      <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Track Browser</h3>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              fetch(`${API_ENDPOINT}/tracks`)
                .then(response => response.json())
                .then(data => {
                  const transformedTracks: Track[] = data.tracks.map((track: any) => ({
                    id: track.id,
                    title: track.title,
                    artist: track.artist?.stageName || 'Unknown Artist',
                    duration: track.duration || 180,
                    bpm: track.bpm || 128,
                    key: track.keySignature || 'C',
                    fileUrl: track.fileUrl,
                    artworkUrl: track.artworkUrl,
                    genre: track.genre,
                    streamCount: track.streamCount
                  }));
                  setTracks(transformedTracks);
                })
                .catch(err => {
                  console.error('Error refreshing tracks:', err);
                  setError(err instanceof Error ? err.message : 'Failed to refresh tracks');
                })
                .finally(() => setLoading(false));
            }}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading uploaded tracks...</p>
          </div>
        )}
        
        {error && (
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
            >
              Retry
            </button>
          </div>
        )}
        
        {!loading && !error && tracks.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">No tracks uploaded yet.</p>
            <p className="text-gray-500 text-sm">Upload some tracks to start mixing!</p>
          </div>
        )}
        
        {!loading && !error && tracks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tracks.map((track) => (
              <div
                key={track.id}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  selectedTrack === track.id 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
                onClick={() => setSelectedTrack(selectedTrack === track.id ? null : track.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{track.title}</h4>
                    <p className="text-xs opacity-80">{track.artist}</p>
                  </div>
                  {track.artworkUrl && (
                    <img
                      src={getAssetUrl(track.artworkUrl)} 
                      alt={track.title}
                      className="w-8 h-8 rounded object-cover ml-2"
                    />
                  )}
                </div>
                
                <div className="flex justify-between text-xs mt-1 opacity-60">
                  <span>{track.bpm} BPM</span>
                  <span>{track.key}</span>
                  <span>{formatTime(track.duration)}</span>
                </div>
                
                {track.genre && (
                  <div className="text-xs text-purple-400 mt-1">
                    {track.genre}
                  </div>
                )}
                
                {track.streamCount !== undefined && (
                  <div className="text-xs text-gray-500 mt-1">
                    {track.streamCount} plays
                  </div>
                )}
                
                {selectedTrack === track.id && (
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        loadTrack(track, 1);
                      }}
                      className="flex-1 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                    >
                      → Deck A
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        loadTrack(track, 2);
                      }}
                      className="flex-1 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                    >
                      → Deck B
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DJMixerInterface;