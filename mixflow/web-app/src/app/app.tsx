import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Upload, Music, Users, TrendingUp, Settings, Search, Home, Library, User, Headphones, LogOut, Plus, Mic, X, Check, Trash2 } from 'lucide-react';
import { API_ENDPOINT, getAssetUrl, getStreamUrl } from '../config/api.config';

// API Configuration (use imported constant)
const API_BASE_URL = API_ENDPOINT;

// Types
interface User {
  id: string;
  email: string;
  username: string;
  userType: string;
  subscriptionStatus?: 'free' | 'premium' | 'pro';
  subscriptionExpiry?: string;
  artist?: Artist;
}

interface Artist {
  id: string;
  stageName: string;
  bio?: string;
  genres: string[];
  totalStreams: number;
  totalEarnings: number;
  payoutAccount?: string;
  isVerified: boolean;
  monthlyListeners?: number;
}

interface Track {
  id: string;
  title: string;
  artist: {
    stageName: string;
    id?: string;
  };
  duration: number;
  fileUrl: string;
  artworkUrl?: string;
  genre: string;
  streamCount: number;
  revenue?: number;
  isPremium?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

// DJ Types
interface DJTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  bpm: number;
  key: string;
}

interface DeckState {
  track: DJTrack | null;
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

const MixFlowApp = () => {
  // State Management
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    token: typeof window !== 'undefined' ? localStorage.getItem('mixflow_token') : null,
    isLoading: true
  });
  const [currentView, setCurrentView] = useState('home');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [userUploads, setUserUploads] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [contentFilter, setContentFilter] = useState<'all' | 'music' | 'podcast'>('all');
  
  // Login/Register Forms
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  
  // Debug modal state changes
  const setShowAuthModalWithLogging = (value: boolean) => {
    console.log('Modal state changing:', { from: showAuthModal, to: value });
    console.trace('Modal state change stack trace');
    setShowAuthModal(value);
  };
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot-password'>('login');
  const [authForm, setAuthForm] = useState({
    email: '',
    username: '',
    password: ''
  });
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const hasInitialFocusRef = useRef(false);

  // ESC key handling to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAuthModal) {
        setShowAuthModal(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showAuthModal]);

  // Removed complex autofill detection to prevent interference



  // Monetization States
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showArtistModal, setShowArtistModal] = useState(false);
  const [artistForm, setArtistForm] = useState({
    stageName: '',
    bio: '',
    genres: [] as string[]
  });
  const [subscriptionPlans] = useState([
    {
      id: 'premium_monthly',
      name: 'Premium',
      price: '$9.99',
      period: 'month',
      features: [
        'Ad-free listening',
        'High-quality audio',
        'Offline downloads',
        'DJ Mode access',
        'Unlimited uploads'
      ]
    },
    {
      id: 'pro_monthly',
      name: 'Pro',
      price: '$19.99',
      period: 'month',
      features: [
        'All Premium features',
        'Advanced DJ tools',
        'Live streaming',
        'Artist analytics',
        'Revenue sharing',
        'Priority support'
      ]
    }
  ]);

  // Search Functions
  const performSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    // Simulate search delay
    setTimeout(() => {
      const results = tracks.filter(track => {
        const searchTerm = query.toLowerCase();
        return (
          track.title.toLowerCase().includes(searchTerm) ||
          track.artist.stageName.toLowerCase().includes(searchTerm) ||
          track.genre.toLowerCase().includes(searchTerm)
        );
      });
      
      setSearchResults(results);
      setIsSearching(false);
    }, 300);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };
  const handleSubscribe = async (planId: string) => {
    try {
      console.log('Subscribing to plan:', planId);
      
      // Simulate successful subscription
      const subscriptionStatus = planId.includes('pro') ? 'pro' : 'premium';
      
      // Update user subscription status immediately
      setAuth(prev => ({
        ...prev,
        user: prev.user ? {
          ...prev.user,
          subscriptionStatus: subscriptionStatus,
          subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        } : null
      }));
      
      setShowSubscriptionModal(false);
      alert(`${subscriptionStatus.toUpperCase()} subscription activated successfully! You now have access to all premium features.`);
      
      // If they subscribed to access DJ Mode, automatically navigate there
      if (!checkSubscriptionAccess('dj_mode')) {
        setTimeout(() => {
          setCurrentView('dj');
        }, 1000);
      }
      
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Subscription failed. Please try again.');
    }
  };

  const trackStream = async (trackId: string, artistId: string) => {
    try {
      // Track stream using the correct API endpoint
      await apiCall(`/tracks/${trackId}/stream`, {
        method: 'GET',
        headers: auth.token ? { 'Authorization': `Bearer ${auth.token}` } : {}
      });
      
      // Update local stream count
      setTracks(prev => prev.map(track => 
        track.id === trackId 
          ? { ...track, streamCount: track.streamCount + 1 }
          : track
      ));
    } catch (error) {
      console.error('Stream tracking error:', error);
    }
  };

  const checkSubscriptionAccess = (feature: string) => {
    const userSub = auth.user?.subscriptionStatus || 'free';
    
    const accessRules = {
      'dj_mode': ['premium', 'pro'],
      'unlimited_uploads': ['premium', 'pro'],
      'high_quality': ['premium', 'pro'],
      'artist_analytics': ['pro'],
      'live_streaming': ['pro']
    };
    
    return accessRules[feature]?.includes(userSub) || false;
  };

  // API Helper Functions
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(auth.token && { Authorization: `Bearer ${auth.token}` }),
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API Error');
    }
    
    return response.json();
  };

  // Authentication Functions
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const data = await apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify(authForm),
      });

      setAuth({
        user: data.user,
        token: data.token,
        isLoading: false
      });
      
      localStorage.setItem('mixflow_token', data.token);
      setShowAuthModalWithLogging(false);
      setAuthForm({ email: '', username: '', password: '' });
      setShowPassword(false);
      hasInitialFocusRef.current = false;
    } catch (error: any) {
      alert(`${authMode} failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await apiCall('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      alert('Password reset email sent! Please check your inbox.');
      setAuthMode('login');
      setForgotPasswordEmail('');
    } catch (error: any) {
      alert(`Password reset failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAuth({ user: null, token: null, isLoading: false });
    localStorage.removeItem('mixflow_token');
    setCurrentView('home');
  };

  // Load user profile on token change
  useEffect(() => {
    const loadUserProfile = async () => {
      if (auth.token && !auth.user) {
        try {
          const userData = await apiCall('/user/profile');
          setAuth(prev => ({ ...prev, user: userData, isLoading: false }));
        } catch (error) {
          console.error('Failed to load profile:', error);
          logout();
        }
      } else if (!auth.token) {
        setAuth(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadUserProfile();
  }, [auth.token]);

  // Load tracks function
  const loadTracks = async () => {
    try {
      const data = await apiCall('/tracks');
      console.log('Loaded tracks:', data.tracks?.length || 0, data.tracks);
      setTracks(data.tracks);
    } catch (error) {
      console.error('Failed to load tracks:', error);
    }
  };

  const deleteTrack = async (trackId: string, trackTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${trackTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiCall(`/tracks/${trackId}`, {
        method: 'DELETE',
      });

      // Remove track from current tracks list
      setTracks(prevTracks => prevTracks.filter(track => track.id !== trackId));

      // If deleted track was currently playing, stop playback
      if (currentTrack?.id === trackId) {
        setCurrentTrack(null);
        setIsPlaying(false);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
      }

      console.log(`✅ Track "${trackTitle}" deleted successfully`);
    } catch (error: any) {
      console.error('Failed to delete track:', error);
      alert(`Failed to delete track: ${error.message || 'Unknown error'}`);
    }
  };

  // Load tracks on component mount
  useEffect(() => {
    loadTracks();
  }, []);

  // Artist Creation
  const handleCreateArtist = async () => {
    try {
      const data = await apiCall('/artist/create', {
        method: 'POST',
        body: JSON.stringify(artistForm),
      });

      // Reload user profile to show artist info
      const userData = await apiCall('/user/profile');
      setAuth(prev => ({ ...prev, user: userData }));
      
      setShowArtistModal(false);
      setArtistForm({ stageName: '', bio: '', genres: [] });
      alert('Artist profile created successfully!');
    } catch (error: any) {
      alert(`Failed to create artist profile: ${error.message}`);
    }
  };

  // Music Player Functions
  const playTrack = (track: Track) => {
    console.log('playTrack called with:', track.title, track.id);
    setCurrentTrack(track);
    setIsPlaying(true);

    // Create or update audio element
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    // Use the backend URL for audio file - prepend if relative path
    const audioUrl = getAssetUrl(track.fileUrl);

    console.log('Loading audio from:', audioUrl);
    audioRef.current.src = audioUrl;
    audioRef.current.play().catch(error => {
      console.error('Error playing audio:', error);
      alert('Unable to play this audio file. Please check the file format.');
    });
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
        alert('Unable to play this audio file.');
      });
      setIsPlaying(true);
    }
  };

  const skipToNext = () => {
    console.log('skipToNext called', { currentTrack, tracksLength: tracks.length });
    
    if (!currentTrack || tracks.length === 0) {
      console.log('Cannot skip: no current track or no tracks available');
      return;
    }
    
    const currentIndex = tracks.findIndex(track => track.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    const nextTrack = tracks[nextIndex];
    
    console.log('Skip next:', { currentIndex, nextIndex, nextTrack: nextTrack?.title });
    
    if (nextTrack) {
      console.log(`Skipping to next: ${nextTrack.title}`);
      playTrack(nextTrack);
      trackStream(nextTrack.id, nextTrack.artist.id || 'unknown');
    }
  };

  const skipToPrevious = () => {
    console.log('skipToPrevious called', { currentTrack, tracksLength: tracks.length });
    
    if (!currentTrack || tracks.length === 0) {
      console.log('Cannot skip: no current track or no tracks available');
      return;
    }
    
    const currentIndex = tracks.findIndex(track => track.id === currentTrack.id);
    const previousIndex = currentIndex <= 0 ? tracks.length - 1 : currentIndex - 1;
    const previousTrack = tracks[previousIndex];
    
    console.log('Skip previous:', { currentIndex, previousIndex, previousTrack: previousTrack?.title });
    
    if (previousTrack) {
      console.log(`Skipping to previous: ${previousTrack.title}`);
      playTrack(previousTrack);
      trackStream(previousTrack.id, previousTrack.artist.id || 'unknown');
    }
  };

  // Handle audio events
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const handleEnded = () => {
        setIsPlaying(false);
        // Auto-play next track when current track ends
        skipToNext();
      };
      const handlePause = () => setIsPlaying(false);
      const handlePlay = () => setIsPlaying(true);
      
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('play', handlePlay);
      
      return () => {
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('play', handlePlay);
      };
    }
  }, [currentTrack, tracks]); // Added tracks dependency

  // Navigation Component
  const NavBar = () => (
    <div className="bg-gray-900 text-white p-4 flex justify-between items-center shadow-lg">
      <div className="flex items-center space-x-2">
        <Music className="w-8 h-8 text-purple-500" />
        <span className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
          MixFlow
        </span>
      </div>
      
      <div className="flex space-x-6">
        <button 
          onClick={() => setCurrentView('home')}
          className={`flex items-center space-x-1 px-3 py-2 rounded ${currentView === 'home' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>
        <button 
          onClick={() => setCurrentView('search')}
          className={`flex items-center space-x-1 px-3 py-2 rounded ${currentView === 'search' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}
        >
          <Search className="w-4 h-4" />
          <span>Search</span>
        </button>
        {auth.user && (
          <>
            <button 
              onClick={(e) => {
                e.preventDefault();
                console.log('=== DJ MODE BUTTON CLICKED ===');
                console.log('Event:', e);
                console.log('Auth user:', auth.user);
                console.log('Current subscription:', auth.user?.subscriptionStatus);
                console.log('Checking DJ access...');
                
                const hasAccess = checkSubscriptionAccess('dj_mode');
                console.log('Has DJ access:', hasAccess);
                
                if (hasAccess) {
                  console.log('User has access, going to DJ mode');
                  setCurrentView('dj');
                } else {
                  console.log('User needs subscription, opening modal');
                  console.log('Current showSubscriptionModal state:', showSubscriptionModal);
                  setShowSubscriptionModal(true);
                  console.log('Set showSubscriptionModal to true');
                }
              }}
              className={`flex items-center space-x-1 px-3 py-2 rounded transition-colors cursor-pointer ${
                currentView === 'dj' ? 'bg-purple-600' : 'hover:bg-gray-700'
              }`}
            >
              <Headphones className="w-4 h-4" />
              <span>DJ Mode</span>
              {!checkSubscriptionAccess('dj_mode') && (
                <span className="text-xs bg-yellow-500 text-black px-1 rounded ml-1">PRO</span>
              )}
            </button>
            <button 
              onClick={() => setCurrentView('upload')}
              className={`flex items-center space-x-1 px-3 py-2 rounded ${currentView === 'upload' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </button>
            <button 
              onClick={() => setCurrentView('library')}
              className={`flex items-center space-x-1 px-3 py-2 rounded ${currentView === 'library' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}
            >
              <Library className="w-4 h-4" />
              <span>Library</span>
            </button>
            {auth.user.artist && (
              <button 
                onClick={() => setCurrentView('earnings')}
                className={`flex items-center space-x-1 px-3 py-2 rounded ${currentView === 'earnings' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Earnings</span>
              </button>
            )}
          </>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {auth.user ? (
          <>
            <div className="flex items-center space-x-2">
              <span className="text-sm">Hello, {auth.user.username}</span>
              {auth.user.subscriptionStatus && auth.user.subscriptionStatus !== 'free' && (
                <span className={`text-xs px-2 py-1 rounded ${
                  auth.user.subscriptionStatus === 'pro' 
                    ? 'bg-yellow-500 text-black' 
                    : 'bg-purple-500 text-white'
                }`}>
                  {auth.user.subscriptionStatus.toUpperCase()}
                </span>
              )}
            </div>
            
            {!auth.user.subscriptionStatus || auth.user.subscriptionStatus === 'free' ? (
              <button
                onClick={() => setShowSubscriptionModal(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Upgrade to Premium
              </button>
            ) : null}
            
            {!auth.user.artist && (
              <button
                onClick={() => setShowArtistModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Become Artist</span>
              </button>
            )}
            <button
              onClick={logout}
              className="text-gray-400 hover:text-white"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowAuthModalWithLogging(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
          >
            Login / Register
          </button>
        )}
      </div>
    </div>
  );

  // Upload View Component (Full functionality)
  const UploadView = () => {
    const [uploads, setUploads] = useState<any[]>([]);
    const [uploadType, setUploadType] = useState<'music' | 'podcast'>('music');
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const supportedFormats = {
      music: ['.mp3', '.wav', '.flac', '.aac', '.m4a', '.ogg', '.webm'],
      podcast: ['.mp3', '.wav', '.m4a', '.aac', '.webm']
    };

    const handleFileSelect = (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const newUploads: any[] = [];
      const rejectedFiles: string[] = [];

      fileArray.forEach((file) => {
        if (isValidAudioFile(file)) {
          // Check if this is a recorded track from MixFlow
          const isRecordedTrack = file.name.includes('mixflow-recording');
          const isWebM = file.name.toLowerCase().endsWith('.webm');
          
          const upload = {
            file,
            id: Date.now() + Math.random().toString(),
            progress: 0,
            status: 'pending',
            type: uploadType,
            isRecordedTrack: isRecordedTrack && isWebM,
            metadata: {
              title: isRecordedTrack ? 
                file.name.replace('mixflow-recording-', '').replace(/\.webm$/i, '').replace(/-(HQ|MQ|LQ)/, '') :
                file.name.replace(/\.[^/.]+$/, ''),
              artist: isRecordedTrack ? 'Your Mix' : '',
              genre: isRecordedTrack ? 'DJ Mix' : uploadType === 'music' ? 'User Upload' : 'Podcast',
              isRecorded: isRecordedTrack
            }
          };
          newUploads.push(upload);
        } else {
          rejectedFiles.push(file.name);
        }
      });

      setUploads(prev => [...prev, ...newUploads]);

      // Show feedback for accepted/rejected files
      if (newUploads.length > 0) {
        const recordedCount = newUploads.filter(u => u.isRecordedTrack).length;
        const regularCount = newUploads.length - recordedCount;
        
        let message = `Added ${newUploads.length} file(s) to upload queue`;
        if (recordedCount > 0) {
          message += ` (${recordedCount} recorded mix${recordedCount > 1 ? 'es' : ''})`;
        }
        
        // Show success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 3000);
      }

      if (rejectedFiles.length > 0) {
        const message = `Could not upload: ${rejectedFiles.join(', ')}. Please check file format.`;
        
        // Show error notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 5000);
      }
    };

    const isValidAudioFile = (file: File) => {
      const formats = supportedFormats[uploadType];
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      // Check if it's a recorded MixFlow file
      const isRecordedTrack = file.name.includes('mixflow-recording');
      
      // For recorded tracks, be more lenient with file type checking
      if (isRecordedTrack) {
        return formats.includes(extension);
      }
      
      return formats.includes(extension) && file.type.startsWith('audio/');
    };

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files);
      }
    };

    const updateMetadata = (id: string, field: string, value: string | number) => {
      setUploads(prev => prev.map(upload => 
        upload.id === id 
          ? { ...upload, metadata: { ...upload.metadata, [field]: value } }
          : upload
      ));
    };

    const removeUpload = (id: string) => {
      setUploads(prev => prev.filter(upload => upload.id !== id));
    };

    const startUpload = async (id: string) => {
      const upload = uploads.find(u => u.id === id);
      if (!upload) return;

      setUploads(prev => prev.map(u => 
        u.id === id ? { ...u, status: 'uploading' } : u
      ));

      try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('audio', upload.file);
        if (upload.artwork) {
          formData.append('artwork', upload.artwork);
        }
        
        // Add metadata
        formData.append('title', upload.metadata.title);
        formData.append('description', upload.metadata.description || '');
        formData.append('genre', upload.type === 'music' ? (upload.metadata.genre || 'User Upload') : 'Podcast');
        if (upload.metadata.artist) {
          formData.append('artist', upload.metadata.artist);
        }
        
        // Upload to backend API
        const response = await fetch(`${API_BASE_URL}/tracks/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${auth.token}`
          },
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const result = await response.json();
        
        // Mark upload as completed
        setUploads(prev => prev.map(u => 
          u.id === id ? { ...u, status: 'completed', progress: 100 } : u
        ));

        // Add to userUploads for library display
        setUserUploads(prev => [...prev, {
          ...upload,
          uploadedAt: new Date().toISOString(),
          status: 'completed'
        }]);

        // Refresh tracks list to show new upload
        await loadTracks();

        // Show success message
        alert(`${upload.type === 'music' ? 'Track' : 'Podcast'} "${upload.metadata.title}" uploaded successfully!`);
        
      } catch (error: any) {
        // Mark upload as failed
        setUploads(prev => prev.map(u => 
          u.id === id ? { ...u, status: 'failed', progress: 0 } : u
        ));
        
        alert(`Upload failed: ${error.message}`);
        console.error('Upload error:', error);
      }
    };

    const uploadAll = () => {
      uploads.filter(u => u.status === 'pending').forEach(upload => {
        startUpload(upload.id);
      });
    };

    return (
      <div className="p-6 space-y-8 bg-gray-900 min-h-screen">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Upload Content</h1>
            <p className="text-gray-400">Share your music and podcasts with the world</p>
          </div>
        </div>

        {/* Upload Type Selection */}
        <div className="flex space-x-4">
          <button
            onClick={() => setUploadType('music')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              uploadType === 'music' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <Music className="w-5 h-5" />
            <span>Music</span>
          </button>
          <button
            onClick={() => setUploadType('podcast')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              uploadType === 'podcast' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <Mic className="w-5 h-5" />
            <span>Podcast</span>
          </button>
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-purple-500 bg-purple-500 bg-opacity-10'
              : 'border-gray-600 hover:border-gray-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center space-y-4">
            {uploadType === 'music' ? (
              <Music className="w-16 h-16 text-gray-400" />
            ) : (
              <Mic className="w-16 h-16 text-gray-400" />
            )}
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Drop your {uploadType} files here
              </h3>
              <p className="text-gray-400 mb-4">
                Supported formats: {supportedFormats[uploadType].join(', ')}
              </p>
              <p className="text-sm text-purple-400 mb-4">
                💡 Tip: You can also upload your recorded DJ mixes from the Downloads folder!
              </p>
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Choose Files
                </button>
                <button
                  onClick={() => {
                    // Create a temporary input to select files from Downloads
                    const tempInput = document.createElement('input');
                    tempInput.type = 'file';
                    tempInput.accept = 'audio/*';
                    tempInput.multiple = true;
                    tempInput.onchange = (e) => {
                      if (e.target.files) {
                        handleFileSelect(e.target.files);
                      }
                    };
                    tempInput.click();
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Upload from Downloads
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFileSelect(e.target.files);
            }
          }}
        />

        {/* Help Section for Recorded Tracks */}
        <div className="bg-gradient-to-r from-purple-900 to-pink-900 border border-purple-500 rounded-lg p-4 mb-6">
          <h4 className="text-white font-semibold mb-2 flex items-center">
            <Headphones className="w-5 h-5 mr-2" />
            Upload Your Recorded DJ Mixes
          </h4>
          <div className="text-gray-300 text-sm space-y-2">
            <p>• Click "Upload from Downloads" to select your recorded files</p>
            <p>• Or drag and drop your recorded files directly into the upload area</p>
            <p>• Recorded files will be automatically detected and styled differently</p>
            <p>• You can then load them back into the DJ decks for further mixing</p>
          </div>
        </div>

        {/* Upload Queue */}
        {uploads.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Upload Queue</h2>
              <div className="flex space-x-2">
                <button
                  onClick={uploadAll}
                  disabled={uploads.every(u => u.status !== 'pending')}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium"
                >
                  Upload All
                </button>
                <button
                  onClick={() => setUploads([])}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {uploads.map((upload) => (
                <div key={upload.id} className={`rounded-lg p-4 ${
                  upload.isRecordedTrack 
                    ? 'bg-gradient-to-r from-purple-900 to-pink-900 border border-purple-500' 
                    : 'bg-gray-800'
                }`}>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                        upload.isRecordedTrack
                          ? 'bg-gradient-to-br from-purple-600 to-pink-600'
                          : 'bg-gradient-to-br from-purple-500 to-pink-500'
                      }`}>
                        {upload.isRecordedTrack ? (
                          <Headphones className="w-8 h-8 text-white" />
                        ) : upload.type === 'music' ? (
                          <Music className="w-8 h-8 text-white" />
                        ) : (
                          <Mic className="w-8 h-8 text-white" />
                        )}
                      </div>
                    </div>

                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <label className="block text-sm font-medium text-gray-300">Title</label>
                          {upload.isRecordedTrack && (
                            <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                              RECORDED MIX
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={upload.metadata?.title || ''}
                          onChange={(e) => updateMetadata(upload.id, 'title', e.target.value)}
                          className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                          placeholder="Enter title"
                        />
                      </div>

                      {upload.type === 'music' ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Artist</label>
                          <input
                            type="text"
                            value={upload.metadata?.artist || ''}
                            onChange={(e) => updateMetadata(upload.id, 'artist', e.target.value)}
                            className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                            placeholder="Enter artist name"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Episode</label>
                          <input
                            type="number"
                            value={upload.metadata?.episode || ''}
                            onChange={(e) => updateMetadata(upload.id, 'episode', parseInt(e.target.value))}
                            className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                            placeholder="Episode number"
                          />
                        </div>
                      )}

                      {upload.type === 'music' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Album</label>
                            <input
                              type="text"
                              value={upload.metadata?.album || ''}
                              onChange={(e) => updateMetadata(upload.id, 'album', e.target.value)}
                              className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                              placeholder="Album name"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Genre</label>
                            <select
                              value={upload.metadata?.genre || ''}
                              onChange={(e) => updateMetadata(upload.id, 'genre', e.target.value)}
                              className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                            >
                              <option value="">Select genre</option>
                              {upload.isRecordedTrack && (
                                <option value="DJ Mix" selected>DJ Mix</option>
                              )}
                              <option value="Electronic">Electronic</option>
                              <option value="Hip Hop">Hip Hop</option>
                              <option value="Rock">Rock</option>
                              <option value="Pop">Pop</option>
                              <option value="Jazz">Jazz</option>
                              <option value="Classical">Classical</option>
                              <option value="Country">Country</option>
                              <option value="R&B">R&B</option>
                              <option value="Reggae">Reggae</option>
                              <option value="Alternative">Alternative</option>
                            </select>
                          </div>
                        </>
                      )}

                      {upload.type === 'podcast' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Season</label>
                            <input
                              type="number"
                              value={upload.metadata?.season || ''}
                              onChange={(e) => updateMetadata(upload.id, 'season', parseInt(e.target.value))}
                              className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                              placeholder="Season number"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                            <textarea
                              value={upload.metadata?.description || ''}
                              onChange={(e) => updateMetadata(upload.id, 'description', e.target.value)}
                              className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm h-20"
                              placeholder="Episode description"
                            />
                          </div>
                        </>
                      )}

                      {/* Album Cover / Artist Picture Upload */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          {upload.type === 'music' ? 'Album Cover' : 'Podcast Cover'}
                        </label>
                        
                        <div className="flex items-start space-x-4">
                          {/* Preview */}
                          <div className="flex-shrink-0">
                            {upload.artwork ? (
                              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-600">
                                <img 
                                  src={URL.createObjectURL(upload.artwork)}
                                  alt="Cover preview"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className={`w-20 h-20 rounded-lg flex items-center justify-center ${
                                upload.type === 'music' 
                                  ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                                  : 'bg-gradient-to-br from-green-500 to-blue-500'
                              }`}>
                                {upload.type === 'music' ? (
                                  <Music className="w-8 h-8 text-white opacity-70" />
                                ) : (
                                  <Mic className="w-8 h-8 text-white opacity-70" />
                                )}
                              </div>
                            )}
                          </div>

                          {/* Upload Button */}
                          <div className="flex-grow">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setUploads(prev => prev.map(u => 
                                    u.id === upload.id 
                                      ? { ...u, artwork: e.target.files![0] }
                                      : u
                                  ));
                                }
                              }}
                              className="hidden"
                              id={`artwork-${upload.id}`}
                            />
                            <label
                              htmlFor={`artwork-${upload.id}`}
                              className="cursor-pointer flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-600 hover:border-purple-500 rounded-lg transition-colors"
                            >
                              <Upload className="w-6 h-6 text-gray-400 mb-1" />
                              <span className="text-xs text-gray-400">
                                {upload.artwork ? 'Change Image' : 'Upload Image'}
                              </span>
                              <span className="text-xs text-gray-500">
                                JPG, PNG, GIF (Max 5MB)
                              </span>
                            </label>
                            
                            {upload.artwork && (
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-green-400">
                                  ✓ {upload.artwork.name}
                                </span>
                                <button
                                  onClick={() => {
                                    setUploads(prev => prev.map(u => 
                                      u.id === upload.id 
                                        ? { ...u, artwork: undefined }
                                        : u
                                    ));
                                  }}
                                  className="text-xs text-red-400 hover:text-red-300"
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex flex-col space-y-2">
                      {upload.status === 'pending' && (
                        <button
                          onClick={() => startUpload(upload.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Upload
                        </button>
                      )}
                      
                      {upload.status === 'completed' && (
                        <div className="flex items-center text-green-400 text-sm">
                          <Check className="w-4 h-4 mr-1" />
                          Done
                        </div>
                      )}

                      {upload.status === 'failed' && (
                        <button
                          onClick={() => {
                            setUploads(prev => prev.map(u => 
                              u.id === upload.id ? { ...u, status: 'pending', progress: 0 } : u
                            ));
                          }}
                          className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Retry
                        </button>
                      )}

                      <button
                        onClick={() => removeUpload(upload.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {upload.status === 'uploading' && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm text-gray-400 mb-1">
                        <span>Uploading...</span>
                        <span>{upload.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Home View Component
  const HomeView = () => {
    // Filter tracks based on selected content type
    const filteredTracks = contentFilter === 'all'
      ? tracks
      : contentFilter === 'podcast'
        ? tracks.filter(t => t.genre === 'Podcast')
        : tracks.filter(t => t.genre !== 'Podcast');

    return (
      <div className="p-6 space-y-8">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 rounded-lg text-white">
          <h1 className="text-4xl font-bold mb-2">Welcome to MixFlow</h1>
          <p className="text-xl opacity-90">Discover, stream, and mix your favorite tracks</p>
          {!auth.user && (
            <button
              onClick={() => setShowAuthModalWithLogging(true)}
              className="mt-4 bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100"
            >
              Get Started
            </button>
          )}
        </div>

        <div>
          {/* Content Filter Tabs */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setContentFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                contentFilter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              All ({tracks.length})
            </button>
            <button
              onClick={() => setContentFilter('music')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                contentFilter === 'music'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Music className="w-4 h-4 inline mr-2" />
              Music ({tracks.filter(t => t.genre !== 'Podcast').length})
            </button>
            <button
              onClick={() => setContentFilter('podcast')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                contentFilter === 'podcast'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Mic className="w-4 h-4 inline mr-2" />
              Podcasts ({tracks.filter(t => t.genre === 'Podcast').length})
            </button>
          </div>

          <h2 className="text-2xl font-bold mb-4 text-white">
            {contentFilter === 'all' ? 'All Content' : contentFilter === 'music' ? 'Music' : 'Podcasts'}
          </h2>

          {filteredTracks.length === 0 ? (
          <div className="bg-gray-800 p-8 rounded-lg text-center">
            {contentFilter === 'podcast' ? (
              <Mic className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            ) : (
              <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            )}
            <h3 className="text-white text-lg mb-2">
              {contentFilter === 'all'
                ? 'No tracks available yet'
                : contentFilter === 'music'
                  ? 'No music tracks available yet'
                  : 'No podcasts available yet'}
            </h3>
            <p className="text-gray-400 mb-4">
              {contentFilter === 'all'
                ? 'Be the first to upload some music or podcasts!'
                : contentFilter === 'music'
                  ? 'Be the first to upload some music!'
                  : 'Be the first to upload a podcast!'}
            </p>
            {auth.user ? (
              <button
                onClick={() => setCurrentView('upload')}
                className={`${
                  contentFilter === 'podcast'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-purple-600 hover:bg-purple-700'
                } text-white px-4 py-2 rounded`}
              >
                Upload Content
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModalWithLogging(true)}
                className={`${
                  contentFilter === 'podcast'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-purple-600 hover:bg-purple-700'
                } text-white px-4 py-2 rounded`}
              >
                Login to Upload
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTracks.map(track => (
              <div key={track.id} className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors">
                <div className={`w-full h-32 rounded mb-3 flex items-center justify-center overflow-hidden ${
                  track.artworkUrl ? 'bg-gray-600' : (
                    track.genre === 'Podcast' 
                      ? 'bg-gradient-to-br from-green-500 to-blue-500' 
                      : 'bg-gradient-to-br from-purple-500 to-pink-500'
                  )
                }`}>
                  {track.artworkUrl ? (
                    <img 
                      src={track.artworkUrl}
                      alt={`${track.title} cover`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    track.genre === 'Podcast' ? (
                      <Mic className="w-12 h-12 text-white opacity-50" />
                    ) : (
                      <Music className="w-12 h-12 text-white opacity-50" />
                    )
                  )}
                </div>
                <h3 className="text-white font-semibold">{track.title}</h3>
                <p className="text-gray-400">{track.artist.stageName}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">{track.streamCount} streams</span>
                    {track.genre === 'Podcast' && (
                      <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">PODCAST</span>
                    )}
                    {track.genre && track.genre !== 'Podcast' && (
                      <span className="text-xs bg-gray-600 text-white px-2 py-1 rounded">{track.genre}</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        playTrack(track);
                        trackStream(track.id, track.artist.id || 'unknown');
                      }}
                      className={`p-2 rounded-full text-white ${
                        track.genre === 'Podcast'
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-purple-600 hover:bg-purple-700'
                      }`}
                      title="Play track"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    {auth.user && auth.user.userId === track.artist.userId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTrack(track.id, track.title);
                        }}
                        className="p-1.5 rounded-full text-white bg-red-600 hover:bg-red-700 opacity-80 hover:opacity-100 transition-opacity"
                        title="Delete your track"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    );
  };

  // DJ Mode Interface Component
  const DJModeInterface = () => {
    // Sample tracks for DJ
    const sampleTracks: DJTrack[] = [
      { id: '1', title: 'Electronic Dreams', artist: 'SynthWave', duration: 225, bpm: 128, key: 'Am' },
      { id: '2', title: 'Urban Nights', artist: 'BeatMaster', duration: 252, bpm: 115, key: 'Gm' },
      { id: '3', title: 'Sunset Vibes', artist: 'ChillOut', duration: 320, bpm: 95, key: 'C' },
      { id: '4', title: 'Party Anthem', artist: 'DanceCrew', duration: 208, bpm: 132, key: 'Em' },
      { id: '5', title: 'Deep House Mix', artist: 'NightOwl', duration: 375, bpm: 124, key: 'Dm' },
      { id: '6', title: 'Techno Storm', artist: 'BassLine', duration: 298, bpm: 135, key: 'F#m' }
    ];

    // DJ Audio System
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
    const [deck1Audio, setDeck1Audio] = useState<{
      source: AudioBufferSourceNode | null;
      gainNode: GainNode | null;
      highFilter: BiquadFilterNode | null;
      midFilter: BiquadFilterNode | null;
      lowFilter: BiquadFilterNode | null;
      buffer: AudioBuffer | null;
      mediaElement: HTMLAudioElement | null;
      mediaSource: MediaElementAudioSourceNode | null;
    }>({
      source: null,
      gainNode: null,
      highFilter: null,
      midFilter: null,
      lowFilter: null,
      buffer: null,
      mediaElement: null,
      mediaSource: null
    });
    
    const [deck2Audio, setDeck2Audio] = useState<{
      source: AudioBufferSourceNode | null;
      gainNode: GainNode | null;
      highFilter: BiquadFilterNode | null;
      midFilter: BiquadFilterNode | null;
      lowFilter: BiquadFilterNode | null;
      buffer: AudioBuffer | null;
      mediaElement: HTMLAudioElement | null;
      mediaSource: MediaElementAudioSourceNode | null;
    }>({
      source: null,
      gainNode: null,
      highFilter: null,
      midFilter: null,
      lowFilter: null,
      buffer: null,
      mediaElement: null,
      mediaSource: null
    });

    const [masterGainNode, setMasterGainNode] = useState<GainNode | null>(null);
    const [crossfaderGainA, setCrossfaderGainA] = useState<GainNode | null>(null);
    const [crossfaderGainB, setCrossfaderGainB] = useState<GainNode | null>(null);

    // DJ State
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

    const [crossfader, setCrossfader] = useState(50);
    const [masterVolume, setMasterVolume] = useState(80);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
    const [recordingDuration, setRecordingDuration] = useState<number>(0);
    const [recordingQuality, setRecordingQuality] = useState<'high' | 'medium' | 'low'>('high');
    const [isSynced, setIsSynced] = useState(false);
    const [selectedDeck, setSelectedDeck] = useState<1 | 2>(1);
    
    // Recording refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordingChunksRef = useRef<Blob[]>([]);
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize Audio Context and Nodes
    useEffect(() => {
      const initAudio = () => {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx);

        // Create master gain node
        const masterGain = ctx.createGain();
        masterGain.connect(ctx.destination);
        setMasterGainNode(masterGain);

        // Create crossfader gain nodes
        const crossGainA = ctx.createGain();
        const crossGainB = ctx.createGain();
        
        crossGainA.connect(masterGain);
        crossGainB.connect(masterGain);
        
        setCrossfaderGainA(crossGainA);
        setCrossfaderGainB(crossGainB);

        // Initialize deck audio chains
        const initDeckAudio = () => {
          // Deck 1 audio chain
          const deck1Gain = ctx.createGain();
          const deck1High = ctx.createBiquadFilter();
          const deck1Mid = ctx.createBiquadFilter();
          const deck1Low = ctx.createBiquadFilter();

          deck1High.type = 'highshelf';
          deck1High.frequency.value = 10000;
          deck1Mid.type = 'peaking';
          deck1Mid.frequency.value = 1000;
          deck1Mid.Q.value = 1;
          deck1Low.type = 'lowshelf';
          deck1Low.frequency.value = 100;

          deck1Gain.connect(deck1High);
          deck1High.connect(deck1Mid);
          deck1Mid.connect(deck1Low);
          deck1Low.connect(crossGainA);

          setDeck1Audio(prev => ({
            ...prev,
            gainNode: deck1Gain,
            highFilter: deck1High,
            midFilter: deck1Mid,
            lowFilter: deck1Low
          }));

          // Deck 2 audio chain
          const deck2Gain = ctx.createGain();
          const deck2High = ctx.createBiquadFilter();
          const deck2Mid = ctx.createBiquadFilter();
          const deck2Low = ctx.createBiquadFilter();

          deck2High.type = 'highshelf';
          deck2High.frequency.value = 10000;
          deck2Mid.type = 'peaking';
          deck2Mid.frequency.value = 1000;
          deck2Mid.Q.value = 1;
          deck2Low.type = 'lowshelf';
          deck2Low.frequency.value = 100;

          deck2Gain.connect(deck2High);
          deck2High.connect(deck2Mid);
          deck2Mid.connect(deck2Low);
          deck2Low.connect(crossGainB);

          setDeck2Audio(prev => ({
            ...prev,
            gainNode: deck2Gain,
            highFilter: deck2High,
            midFilter: deck2Mid,
            lowFilter: deck2Low
          }));
        };

        initDeckAudio();
        updateCrossfader(50); // Initialize crossfader
        updateMasterVolume(80); // Initialize master volume
      };

      initAudio();

      return () => {
        if (audioContext) {
          audioContext.close();
        }
        // Clean up recording
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }
        if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
        }
      };
    }, []);

    // Load audio file into deck
    const loadAudioFile = async (file: File, deckNumber: 1 | 2) => {
      if (!audioContext) {
        console.error('Audio context not initialized');
        return;
      }

      try {
        console.log(`Loading audio file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
        
        // For WebM files, we need to handle them differently
        const isWebM = file.name.toLowerCase().endsWith('.webm') || file.type === 'audio/webm';
        console.log(`Is WebM file: ${isWebM}`);
        
        if (isWebM) {
          console.log('Processing WebM file...');
          
          // Create a blob URL for WebM files
          const blobUrl = URL.createObjectURL(file);
          console.log('Created blob URL:', blobUrl);
          
          // Create an audio element to decode WebM
          const audioElement = new Audio();
          audioElement.src = blobUrl;
          
          // Add more detailed event listeners for debugging
          audioElement.addEventListener('loadstart', () => console.log('Audio loadstart'));
          audioElement.addEventListener('durationchange', () => console.log('Audio duration:', audioElement.duration));
          audioElement.addEventListener('loadedmetadata', () => console.log('Audio metadata loaded'));
          audioElement.addEventListener('canplay', () => console.log('Audio can play'));
          audioElement.addEventListener('canplaythrough', () => console.log('Audio can play through'));
          audioElement.addEventListener('error', (e) => console.error('Audio error:', e));
          
          // Wait for the audio to be loaded
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Audio loading timeout'));
            }, 10000); // 10 second timeout
            
            audioElement.addEventListener('canplaythrough', () => {
              clearTimeout(timeout);
              resolve();
            });
            audioElement.addEventListener('error', (e) => {
              clearTimeout(timeout);
              reject(new Error(`Audio loading failed: ${e}`));
            });
            audioElement.load();
          });
          
          console.log('Audio element loaded successfully, duration:', audioElement.duration);
          
          // Create a MediaElementSource from the audio element
          const mediaSource = audioContext.createMediaElementSource(audioElement);
          console.log('Created MediaElementSource');
          
          // Create a gain node for the media source
          const gainNode = audioContext.createGain();
          mediaSource.connect(gainNode);
          console.log('Connected media source to gain node');
          
          // Store the audio element and media source for playback
          if (deckNumber === 1) {
            setDeck1Audio(prev => ({ 
              ...prev, 
              buffer: null,
              mediaElement: audioElement,
              mediaSource: mediaSource,
              gainNode: gainNode
            }));
          } else {
            setDeck2Audio(prev => ({ 
              ...prev, 
              buffer: null,
              mediaElement: audioElement,
              mediaSource: mediaSource,
              gainNode: gainNode
            }));
          }
          
          console.log(`WebM audio loaded for deck ${deckNumber}:`, audioElement.duration);
          
        } else {
          console.log('Processing regular audio file...');
          // Handle other audio formats normally
          const arrayBuffer = await file.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          if (deckNumber === 1) {
            setDeck1Audio(prev => ({ ...prev, buffer: audioBuffer }));
          } else {
            setDeck2Audio(prev => ({ ...prev, buffer: audioBuffer }));
          }
          
          console.log(`Audio loaded for deck ${deckNumber}:`, audioBuffer.duration);
        }
        
      } catch (error) {
        console.error('Error loading audio:', error);
        alert(`Error loading audio file: ${error.message}. Please try a different file.`);
      }
    };

    // Load track from uploaded content
    const loadTrackFromUpload = (upload: any, deckNumber: 1 | 2) => {
      const trackData: DJTrack = {
        id: upload.id,
        title: upload.metadata.title,
        artist: upload.metadata.artist || 'You',
        duration: upload.type === 'music' ? 180 : 1800, // Estimate
        bpm: upload.metadata.bpm || (upload.type === 'music' ? 120 : 100),
        key: upload.metadata.key || 'C'
      };

      const newDeckState = {
        track: trackData,
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

      // Load the actual audio file
      loadAudioFile(upload.file, deckNumber);
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = `Loaded "${trackData.title}" to Deck ${deckNumber === 1 ? 'A' : 'B'}`;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 3000);
      
      console.log(`Loaded "${trackData.title}" to Deck ${deckNumber === 1 ? 'A' : 'B'}`);
    };

    // File upload for DJ decks
    const handleDeckFileUpload = (file: File, deckNumber: 1 | 2) => {
      if (!file.type.startsWith('audio/')) {
        alert('Please select an audio file');
        return;
      }

      const trackData: DJTrack = {
        id: Date.now().toString(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Local File',
        duration: 180, // Will be updated when audio loads
        bpm: 120, // Default BPM
        key: 'C'
      };

      const newDeckState = {
        track: trackData,
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

      // Load the audio file
      loadAudioFile(file, deckNumber);
    };

    // Real audio mixing functions
    const updateCrossfader = (value: number) => {
      setCrossfader(value);
      if (crossfaderGainA && crossfaderGainB) {
        // Calculate crossfader curves
        const position = value / 100; // 0 to 1
        
        // Power curve for smooth mixing
        const gainA = Math.cos(position * Math.PI / 2);
        const gainB = Math.sin(position * Math.PI / 2);
        
        crossfaderGainA.gain.setValueAtTime(gainA, audioContext?.currentTime || 0);
        crossfaderGainB.gain.setValueAtTime(gainB, audioContext?.currentTime || 0);
        
        console.log(`Crossfader: ${value}% - Deck A: ${(gainA * 100).toFixed(1)}%, Deck B: ${(gainB * 100).toFixed(1)}%`);
      }
    };

    const updateMasterVolume = (value: number) => {
      setMasterVolume(value);
      if (masterGainNode) {
        const gain = value / 100;
        masterGainNode.gain.setValueAtTime(gain, audioContext?.currentTime || 0);
      }
    };

    const updateDeckVolume = (deckNumber: 1 | 2, value: number) => {
      const gain = value / 100;
      const deckAudio = deckNumber === 1 ? deck1Audio : deck2Audio;
      
      if (deckAudio.gainNode) {
        deckAudio.gainNode.gain.setValueAtTime(gain, audioContext?.currentTime || 0);
      }
      
      // Also update media element volume if it exists
      if (deckAudio.mediaElement) {
        deckAudio.mediaElement.volume = gain;
      }
      
      if (deckNumber === 1) {
        setDeck1(prev => ({ ...prev, volume: value }));
      } else {
        setDeck2(prev => ({ ...prev, volume: value }));
      }
    };

    const updateEQ = (deckNumber: 1 | 2, band: keyof DeckState['eq'], value: number) => {
      const deckAudio = deckNumber === 1 ? deck1Audio : deck2Audio;
      const gainValue = (value - 50) / 50 * 12; // -12dB to +12dB range
      
      if (band === 'high' && deckAudio.highFilter) {
        deckAudio.highFilter.gain.setValueAtTime(gainValue, audioContext?.currentTime || 0);
      } else if (band === 'mid' && deckAudio.midFilter) {
        deckAudio.midFilter.gain.setValueAtTime(gainValue, audioContext?.currentTime || 0);
      } else if (band === 'low' && deckAudio.lowFilter) {
        deckAudio.lowFilter.gain.setValueAtTime(gainValue, audioContext?.currentTime || 0);
      }
      
      if (deckNumber === 1) {
        setDeck1(prev => ({ ...prev, eq: { ...prev.eq, [band]: value } }));
      } else {
        setDeck2(prev => ({ ...prev, eq: { ...prev.eq, [band]: value } }));
      }
      
      console.log(`Deck ${deckNumber} ${band} EQ: ${value} (${gainValue.toFixed(1)}dB)`);
    };

    const playDeck = (deckNumber: 1 | 2) => {
      console.log(`Attempting to play deck ${deckNumber}`);
      
      if (!audioContext) {
        console.error('Audio context not initialized');
        alert('Audio system not initialized. Please refresh the page.');
        return;
      }
      
      const deckAudio = deckNumber === 1 ? deck1Audio : deck2Audio;
      const deck = deckNumber === 1 ? deck1 : deck2;
      
      console.log('Deck audio state:', {
        hasBuffer: !!deckAudio.buffer,
        hasMediaElement: !!deckAudio.mediaElement,
        hasGainNode: !!deckAudio.gainNode,
        hasMediaSource: !!deckAudio.mediaSource
      });
      
      // Check if we have either a buffer (for regular files) or media element (for WebM)
      const hasAudio = deckAudio.buffer || deckAudio.mediaElement;
      
      if (!hasAudio || !deckAudio.gainNode) {
        console.error('No audio loaded or gain node missing');
        alert(`Please load a track into Deck ${deckNumber === 1 ? 'A' : 'B'} first`);
        return;
      }
      
      // Handle WebM files (media element)
      if (deckAudio.mediaElement && deckAudio.mediaSource) {
        console.log('Playing WebM file...');
        const mediaElement = deckAudio.mediaElement;
        
        console.log('Media element state:', {
          paused: mediaElement.paused,
          currentTime: mediaElement.currentTime,
          duration: mediaElement.duration,
          volume: mediaElement.volume,
          playbackRate: mediaElement.playbackRate
        });
        
        // Stop if already playing
        if (!mediaElement.paused) {
          console.log('Pausing existing playback');
          mediaElement.pause();
        }
        
        // Set playback rate (tempo)
        mediaElement.playbackRate = deck.tempo;
        console.log('Set playback rate to:', deck.tempo);
        
        // Set current time (position)
        mediaElement.currentTime = deck.position;
        console.log('Set current time to:', deck.position);
        
        // Connect to the audio chain
        deckAudio.mediaSource.connect(deckAudio.gainNode);
        console.log('Connected media source to gain node');
        
        // Play the media element
        console.log('Attempting to play media element...');
        mediaElement.play().then(() => {
          console.log('Media element play() succeeded');
          if (deckNumber === 1) {
            setDeck1(prev => ({ ...prev, isPlaying: true }));
          } else {
            setDeck2(prev => ({ ...prev, isPlaying: true }));
          }
          console.log(`Playing WebM deck ${deckNumber} at tempo ${deck.tempo}x from position ${deck.position}s`);
        }).catch(error => {
          console.error('Error playing WebM:', error);
          alert(`Error playing audio file: ${error.message}. Please try again.`);
        });
        
        // Handle end of playback
        mediaElement.onended = () => {
          console.log('Media element ended');
          if (deckNumber === 1) {
            setDeck1(prev => ({ ...prev, isPlaying: false }));
          } else {
            setDeck2(prev => ({ ...prev, isPlaying: false }));
          }
        };
        
        return;
      }
      
      // Handle regular audio files (buffer)
      if (deckAudio.buffer) {
        // Stop existing source if playing
        if (deckAudio.source) {
          try {
            deckAudio.source.stop();
          } catch (e) {
            // Source might already be stopped
          }
        }
        
        // Create new source
        const source = audioContext.createBufferSource();
        source.buffer = deckAudio.buffer;
        source.playbackRate.value = deck.tempo;
        source.connect(deckAudio.gainNode);
        
        // Handle source end
        source.onended = () => {
          if (deckNumber === 1) {
            setDeck1(prev => ({ ...prev, isPlaying: false }));
            setDeck1Audio(prev => ({ ...prev, source: null }));
          } else {
            setDeck2(prev => ({ ...prev, isPlaying: false }));
            setDeck2Audio(prev => ({ ...prev, source: null }));
          }
        };
        
        // Update deck audio
        const newDeckAudio = { ...deckAudio, source };
        if (deckNumber === 1) {
          setDeck1Audio(newDeckAudio);
          setDeck1(prev => ({ ...prev, isPlaying: true }));
        } else {
          setDeck2Audio(newDeckAudio);
          setDeck2(prev => ({ ...prev, isPlaying: true }));
        }
        
        source.start(0, deck.position);
        console.log(`Playing buffer deck ${deckNumber} at tempo ${deck.tempo}x from position ${deck.position}s`);
      }
    };

    const stopDeck = (deckNumber: 1 | 2) => {
      const deckAudio = deckNumber === 1 ? deck1Audio : deck2Audio;
      
      // Handle WebM files (media element)
      if (deckAudio.mediaElement) {
        deckAudio.mediaElement.pause();
        
        if (deckNumber === 1) {
          setDeck1(prev => ({ ...prev, isPlaying: false }));
        } else {
          setDeck2(prev => ({ ...prev, isPlaying: false }));
        }
      }
      
      // Handle regular audio files (buffer)
      if (deckAudio.source) {
        try {
          deckAudio.source.stop();
        } catch (e) {
          // Source might already be stopped
        }
        
        if (deckNumber === 1) {
          setDeck1Audio(prev => ({ ...prev, source: null }));
          setDeck1(prev => ({ ...prev, isPlaying: false }));
        } else {
          setDeck2Audio(prev => ({ ...prev, source: null }));
          setDeck2(prev => ({ ...prev, isPlaying: false }));
        }
      }
    };

    // Cue functionality
    const setCuePoint = (deckNumber: 1 | 2, cueIndex: number) => {
      const deck = deckNumber === 1 ? deck1 : deck2;
      
      if (!deck.track) {
        alert('Load a track first');
        return;
      }
      
      const newCuePoints = [...deck.cuePoints];
      newCuePoints[cueIndex] = deck.position;
      
      if (deckNumber === 1) {
        setDeck1(prev => ({ ...prev, cuePoints: newCuePoints }));
      } else {
        setDeck2(prev => ({ ...prev, cuePoints: newCuePoints }));
      }
      
      console.log(`Set cue ${cueIndex + 1} for deck ${deckNumber} at ${deck.position}s`);
    };

    const jumpToCue = (deckNumber: 1 | 2, cueIndex: number) => {
      const deck = deckNumber === 1 ? deck1 : deck2;
      const cuePosition = deck.cuePoints[cueIndex];
      
      if (cuePosition === undefined) {
        alert(`Cue ${cueIndex + 1} not set`);
        return;
      }
      
      // Update position
      if (deckNumber === 1) {
        setDeck1(prev => ({ ...prev, position: cuePosition }));
      } else {
        setDeck2(prev => ({ ...prev, position: cuePosition }));
      }
      
      // If playing, restart from cue point
      if (deck.isPlaying) {
        stopDeck(deckNumber);
        setTimeout(() => playDeck(deckNumber), 50);
      }
      
      console.log(`Jumped to cue ${cueIndex + 1} at ${cuePosition}s on deck ${deckNumber}`);
    };

    // Recording functionality
    const startRecording = async () => {
      try {
        // Check if MediaRecorder is supported
        if (!window.MediaRecorder) {
          alert('Recording is not supported in this browser. Please use Chrome, Firefox, or Edge.');
          return;
        }
        
        // Request audio stream from the audio context
        const stream = audioContext!.createMediaStreamDestination();
        
        // Connect the master output to the recording stream
        if (masterGainNode) {
          masterGainNode.connect(stream);
        }
        
        // Get supported MIME types
        const getSupportedMimeType = () => {
          const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/ogg;codecs=opus'
          ];
          
          for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
              return type;
            }
          }
          return 'audio/webm;codecs=opus'; // fallback
        };
        
        // Create MediaRecorder with quality settings
        const mimeType = getSupportedMimeType();
        const mediaRecorder = new MediaRecorder(stream.stream, {
          mimeType,
          audioBitsPerSecond: recordingQuality === 'high' ? 128000 : recordingQuality === 'medium' ? 64000 : 32000
        });
        
        mediaRecorderRef.current = mediaRecorder;
        recordingChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordingChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(recordingChunksRef.current, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // Create download link
          const downloadLink = document.createElement('a');
          downloadLink.href = audioUrl;
          const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
          const qualityLabel = recordingQuality === 'high' ? 'HQ' : recordingQuality === 'medium' ? 'MQ' : 'LQ';
          downloadLink.download = `mixflow-recording-${qualityLabel}-${timestamp}.webm`;
          downloadLink.click();
          
          // Clean up
          URL.revokeObjectURL(audioUrl);
          recordingChunksRef.current = [];
          
          console.log('Recording saved successfully');
        };
        
        // Start recording
        mediaRecorder.start(1000); // Collect data every second
        setIsRecording(true);
        setRecordingStartTime(Date.now());
        setRecordingDuration(0);
        
        // Start duration timer
        recordingIntervalRef.current = setInterval(() => {
          setRecordingDuration(Date.now() - recordingStartTime);
        }, 1000);
        
        console.log('Recording started...');
        
        // Show success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.textContent = `Recording started (${recordingQuality.toUpperCase()} quality)`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 3000);
        
      } catch (error) {
        console.error('Failed to start recording:', error);
        alert('Failed to start recording. Please check your browser permissions.');
      }
    };
    
    const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        
        // Clear duration timer
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
        
        setRecordingDuration(0);
        console.log('Recording stopped');
        
        // Show completion notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.textContent = 'Recording saved to downloads!';
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 3000);
      }
    };
    
    const toggleRecording = () => {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    };
    
    const formatRecordingTime = (milliseconds: number) => {
      const seconds = Math.floor(milliseconds / 1000);
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Debug function to test audio context
    const testAudioContext = () => {
      console.log('=== Audio Context Debug ===');
      console.log('Audio Context State:', audioContext?.state);
      console.log('Audio Context Sample Rate:', audioContext?.sampleRate);
      console.log('Audio Context Current Time:', audioContext?.currentTime);
      
      if (audioContext) {
        // Test creating a simple oscillator
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
        console.log('Test oscillator created and played');
      }
    };

    // Effects functionality
    const applyEffect = (effect: string) => {
      console.log(`Applying ${effect} effect...`);
      alert(`${effect} effect applied! (Note: This is a demo feature)`);
    };

    // Hot cue functionality  
    const handleHotCue = (deckNumber: 1 | 2, cueNumber: number, action: 'set' | 'jump') => {
      if (action === 'set') {
        setCuePoint(deckNumber, cueNumber - 1);
      } else {
        jumpToCue(deckNumber, cueNumber - 1);
      }
    };

    const toggleDJPlay = (deckNumber: 1 | 2) => {
      const deck = deckNumber === 1 ? deck1 : deck2;
      
      if (deck.isPlaying) {
        stopDeck(deckNumber);
      } else {
        playDeck(deckNumber);
      }
    };

    const syncBPM = () => {
      if (deck1.track && deck2.track && audioContext) {
        const bpmRatio = deck1.track.bpm / deck2.track.bpm;
        
        // Update deck 2 tempo to match deck 1
        setDeck2(prev => ({ ...prev, tempo: bpmRatio }));
        
        // Apply tempo change to audio if playing
        if (deck2Audio.source) {
          deck2Audio.source.playbackRate.setValueAtTime(bpmRatio, audioContext.currentTime);
        }
        
        setIsSynced(true);
        setTimeout(() => setIsSynced(false), 2000);
        
        console.log(`Synced Deck B tempo: ${bpmRatio.toFixed(3)}x (${deck2.track?.bpm} BPM → ${deck1.track?.bpm} BPM)`);
      }
    };

    const updateTempo = (deckNumber: 1 | 2, tempo: number) => {
      if (deckNumber === 1) {
        setDeck1(prev => ({ ...prev, tempo }));
        if (deck1Audio.source && audioContext) {
          deck1Audio.source.playbackRate.setValueAtTime(tempo, audioContext.currentTime);
        }
        if (deck1Audio.mediaElement) {
          deck1Audio.mediaElement.playbackRate = tempo;
        }
      } else {
        setDeck2(prev => ({ ...prev, tempo }));
        if (deck2Audio.source && audioContext) {
          deck2Audio.source.playbackRate.setValueAtTime(tempo, audioContext.currentTime);
        }
        if (deck2Audio.mediaElement) {
          deck2Audio.mediaElement.playbackRate = tempo;
        }
      }
    };

    // Load track (now supports real audio files)
    const loadTrack = (track: DJTrack, deckNumber: 1 | 2) => {
      // This is for the sample tracks - create a mock file for demo
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
      
      console.log(`Loaded sample track "${track.title}" to Deck ${deckNumber === 1 ? 'A' : 'B'}`);
      alert(`Sample track loaded. For real audio mixing, use "Load Your Music" or drag files from your uploads.`);
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
          
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg transition-all duration-1000"
            style={{ left: `${progress}%` }}
          />
          
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
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xl font-bold text-${deckColor}-400`}>
              DECK {deckNumber === 1 ? 'A' : 'B'}
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => toggleDJPlay(deckNumber)}
                className={`p-2 rounded-full ${deck.isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
              >
                {deck.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {deck.track && (
            <div className="bg-gray-800 p-3 rounded-lg mb-4">
              <h4 className="text-white font-semibold">{deck.track.title}</h4>
              <p className="text-gray-400 text-sm">{deck.track.artist}</p>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{deck.track.bpm} BPM</span>
                <span>Key: {deck.track.key}</span>
                <span>{formatTime(deck.position)} / {formatTime(deck.track.duration)}</span>
              </div>
            </div>
          )}

          <Waveform deck={deck} deckNumber={deckNumber} />

          <div className="flex justify-center space-x-2 my-4">
            <button 
              onClick={() => toggleDJPlay(deckNumber)}
              className={`p-3 rounded-full ${deck.isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
            >
              {deck.isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-white text-sm mb-2">Tempo: {deck.tempo.toFixed(2)}x</label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.01"
              value={deck.tempo}
              onChange={(e) => updateTempo(deckNumber, parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

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

          <div className="grid grid-cols-3 gap-2 mb-4">
            {(['high', 'mid', 'low'] as const).map((band) => (
              <div key={band}>
                <label className="block text-white text-xs mb-1 text-center uppercase">{band}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={deck.eq[band]}
                  onChange={(e) => updateEQ(deckNumber, band, parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-xs text-gray-400 text-center mt-1">
                  {((deck.eq[band] - 50) / 50 * 12).toFixed(1)}dB
                </div>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-white text-sm mb-2">Volume: {deck.volume}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={deck.volume}
              onChange={(e) => updateDeckVolume(deckNumber, parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="flex space-x-1">
            {[1, 2, 3, 4].map((cue) => {
              const cueIndex = cue - 1;
              const hasCuePoint = deck.cuePoints[cueIndex] !== undefined;
              
              return (
                <div key={cue} className="flex-1">
                  <button
                    onMouseDown={() => handleHotCue(deckNumber, cue, 'set')}
                    onClick={() => handleHotCue(deckNumber, cue, 'jump')}
                    className={`w-full py-2 text-xs rounded font-bold transition-colors ${
                      hasCuePoint 
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                        : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                    }`}
                    title={hasCuePoint ? `Jump to cue ${cue}` : `Set cue ${cue}`}
                  >
                    CUE {cue}
                    {hasCuePoint && (
                      <div className="text-xs opacity-75">
                        {formatTime(deck.cuePoints[cueIndex])}
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Professional DJ Mixer</h1>
          <p className="text-gray-400">Mix tracks like a pro with advanced controls</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          <Deck deck={deck1} deckNumber={1} />

          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold text-purple-400 text-center mb-6">MIXER</h3>
            
            <div className="text-center mb-6">
              <h4 className="text-white font-semibold mb-2">Master Volume</h4>
              <input
                type="range"
                min="0"
                max="100"
                value={masterVolume}
                onChange={(e) => updateMasterVolume(parseInt(e.target.value))}
                className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-sm text-gray-400 mt-1">{masterVolume}%</div>
            </div>

            <div className="mb-6">
              <h4 className="text-white font-semibold mb-2 text-center">Crossfader</h4>
              <input
                type="range"
                min="0"
                max="100"
                value={crossfader}
                onChange={(e) => updateCrossfader(parseInt(e.target.value))}
                className="w-full h-4 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>A ({Math.round((1 - crossfader/100) * 100)}%)</span>
                <span>MIX</span>
                <span>B ({Math.round(crossfader)}%)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={syncBPM}
                className={`p-3 rounded font-bold transition-all ${
                  isSynced ? 'bg-green-600 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
                title="Sync Deck B tempo to match Deck A"
              >
                {isSynced ? '✓ SYNCED' : 'SYNC BPM'}
              </button>
              
              <button
                onClick={toggleRecording}
                className={`p-3 rounded font-bold transition-all ${
                  isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
                title={isRecording ? 'Stop recording' : 'Start recording mix'}
              >
                <div className="flex flex-col items-center">
                  <span>{isRecording ? '● REC' : 'RECORD'}</span>
                  {isRecording && (
                    <span className="text-xs mt-1">
                      {formatRecordingTime(recordingDuration)}
                    </span>
                  )}
                </div>
              </button>
            </div>

            {/* Debug Button */}
            <div className="mb-4">
              <button
                onClick={testAudioContext}
                className="w-full p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm"
                title="Test audio context and permissions"
              >
                🔧 Test Audio System
              </button>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg text-center mb-4">
              <div className="text-xs text-gray-400 mb-1">MASTER BPM</div>
              <div className="text-2xl font-bold text-white">
                {deck1.track && deck2.track 
                  ? Math.round((deck1.track.bpm + deck2.track.bpm) / 2)
                  : deck1.track?.bpm || deck2.track?.bpm || '--'
                }
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {deck1.track && deck2.track && (
                  <span>A: {Math.round(deck1.track.bpm * deck1.tempo)} | B: {Math.round(deck2.track.bpm * deck2.tempo)}</span>
                )}
              </div>
              
              {/* Recording Status */}
              {isRecording && (
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-red-400 font-medium">
                      Recording: {formatRecordingTime(recordingDuration)}
                    </span>
                  </div>
                  
                  {/* Recording Level Meter */}
                  <div className="mt-2">
                    <div className="flex items-center space-x-1">
                      <div className="text-xs text-gray-400">Level:</div>
                      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-yellow-500 to-red-500 transition-all duration-100"
                          style={{ 
                            width: `${Math.min(100, Math.max(10, (deck1.volume + deck2.volume) / 2))}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recording Settings */}
            <div className="mb-4 p-3 bg-gray-800 rounded-lg">
              <h5 className="text-white text-sm font-semibold mb-2">Recording Quality</h5>
              <div className="flex space-x-2">
                {(['low', 'medium', 'high'] as const).map((quality) => (
                  <button
                    key={quality}
                    onClick={() => setRecordingQuality(quality)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      recordingQuality === quality
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                    disabled={isRecording}
                    title={`${quality.toUpperCase()} quality recording`}
                  >
                    {quality.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {recordingQuality === 'high' ? '128kbps - Best quality' : 
                 recordingQuality === 'medium' ? '64kbps - Balanced' : 
                 '32kbps - Small file size'}
              </div>
            </div>

            {/* Loop Controls */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => {
                  const newLooping = !deck1.isLooping;
                  setDeck1(prev => ({ ...prev, isLooping: newLooping }));
                  console.log(`Deck A loop: ${newLooping ? 'ON' : 'OFF'}`);
                }}
                className={`p-2 rounded text-sm font-bold transition-colors ${
                  deck1.isLooping 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-gray-700 hover:bg-orange-600 text-gray-300'
                }`}
                title="Toggle loop for Deck A"
              >
                LOOP A
              </button>
              <button
                onClick={() => {
                  const newLooping = !deck2.isLooping;
                  setDeck2(prev => ({ ...prev, isLooping: newLooping }));
                  console.log(`Deck B loop: ${newLooping ? 'ON' : 'OFF'}`);
                }}
                className={`p-2 rounded text-sm font-bold transition-colors ${
                  deck2.isLooping 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-gray-700 hover:bg-orange-600 text-gray-300'
                }`}
                title="Toggle loop for Deck B"
              >
                LOOP B
              </button>
            </div>

            <div className="mt-6">
              <h4 className="text-white font-semibold mb-3 text-center">Effects</h4>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => applyEffect('REVERB')}
                  className="p-2 bg-gray-700 hover:bg-purple-600 text-white rounded text-sm transition-colors"
                  title="Apply reverb effect"
                >
                  REVERB
                </button>
                <button 
                  onClick={() => applyEffect('DELAY')}
                  className="p-2 bg-gray-700 hover:bg-purple-600 text-white rounded text-sm transition-colors"
                  title="Apply delay effect"
                >
                  DELAY
                </button>
                <button 
                  onClick={() => applyEffect('FILTER')}
                  className="p-2 bg-gray-700 hover:bg-purple-600 text-white rounded text-sm transition-colors"
                  title="Apply low-pass filter"
                >
                  FILTER
                </button>
                <button 
                  onClick={() => applyEffect('FLANGER')}
                  className="p-2 bg-gray-700 hover:bg-purple-600 text-white rounded text-sm transition-colors"
                  title="Apply flanger effect"
                >
                  FLANGER
                </button>
              </div>
              
              {/* Additional Effects Row */}
              <div className="grid grid-cols-3 gap-2 mt-2">
                <button 
                  onClick={() => applyEffect('ECHO')}
                  className="p-2 bg-gray-700 hover:bg-blue-600 text-white rounded text-xs transition-colors"
                >
                  ECHO
                </button>
                <button 
                  onClick={() => applyEffect('PHASER')}
                  className="p-2 bg-gray-700 hover:bg-blue-600 text-white rounded text-xs transition-colors"
                >
                  PHASER
                </button>
                <button 
                  onClick={() => applyEffect('DISTORTION')}
                  className="p-2 bg-gray-700 hover:bg-red-600 text-white rounded text-xs transition-colors"
                >
                  DIST
                </button>
              </div>
            </div>
          </div>

          <Deck deck={deck2} deckNumber={2} />
        </div>

        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Load Your Music</h3>
          
          {/* Your Uploaded Content */}
          {userUploads.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-3">Your Uploads</h4>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                {userUploads.map((upload) => (
                  <div
                    key={upload.id}
                    className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-700 transition-colors ${
                      upload.metadata?.isRecorded 
                        ? 'bg-gradient-to-r from-purple-900 to-pink-900 border border-purple-500' 
                        : 'bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {upload.metadata?.isRecorded ? (
                        <Headphones className="w-5 h-5 text-purple-400" />
                      ) : upload.type === 'music' ? (
                        <Music className="w-5 h-5 text-purple-400" />
                      ) : (
                        <Mic className="w-5 h-5 text-green-400" />
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-white font-medium text-sm">{upload.metadata.title}</p>
                          {upload.metadata?.isRecorded && (
                            <span className="text-xs bg-purple-600 text-white px-1 py-0.5 rounded">
                              MIX
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-xs">
                          {upload.metadata.artist || 'You'} • {upload.metadata?.isRecorded ? 'DJ Mix' : upload.type}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => loadTrackFromUpload(upload, 1)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                        title="Load to Deck A"
                      >
                        → A
                      </button>
                      <button
                        onClick={() => loadTrackFromUpload(upload, 2)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                        title="Load to Deck B"
                      >
                        → B
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File Upload for Decks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h4 className="text-lg font-semibold text-blue-400 mb-2">Load to Deck A</h4>
              <div className="border-2 border-dashed border-blue-500 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleDeckFileUpload(e.target.files[0], 1);
                    }
                  }}
                  className="hidden"
                  id="deck-a-upload"
                />
                <label
                  htmlFor="deck-a-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="w-8 h-8 text-blue-400" />
                  <span className="text-blue-400 text-sm">Click to load music</span>
                  <span className="text-gray-500 text-xs">MP3, WAV, M4A, etc.</span>
                </label>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-green-400 mb-2">Load to Deck B</h4>
              <div className="border-2 border-dashed border-green-500 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleDeckFileUpload(e.target.files[0], 2);
                    }
                  }}
                  className="hidden"
                  id="deck-b-upload"
                />
                <label
                  htmlFor="deck-b-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="w-8 h-8 text-green-400" />
                  <span className="text-green-400 text-sm">Click to load music</span>
                  <span className="text-gray-500 text-xs">MP3, WAV, M4A, etc.</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sample Tracks (for demo) */}
          <div>
            <h4 className="text-lg font-semibold text-gray-400 mb-3">Demo Tracks</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sampleTracks.map((track) => (
                <div
                  key={track.id}
                  className="p-3 rounded-lg cursor-pointer transition-all bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600"
                >
                  <h4 className="font-semibold text-sm">{track.title}</h4>
                  <p className="text-xs opacity-80">{track.artist}</p>
                  <div className="flex justify-between text-xs mt-1 opacity-60">
                    <span>{track.bpm} BPM</span>
                    <span>{track.key}</span>
                    <span>{formatTime(track.duration)}</span>
                  </div>
                  
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() => loadTrack(track, 1)}
                      className="flex-1 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                    >
                      → Deck A
                    </button>
                    <button
                      onClick={() => loadTrack(track, 2)}
                      className="flex-1 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                    >
                      → Deck B
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Mini Player Component
  const MiniPlayer = () => {
    if (!currentTrack) return null;

    const handleTogglePlay = () => {
      if (!audioRef.current || !currentTrack) return;

      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
          alert('Unable to play this audio file.');
        });
        setIsPlaying(true);
      }
    };

    return (
      <div className="bg-gray-800 border-t border-gray-700">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-white font-medium">{currentTrack.title}</h4>
              <p className="text-gray-400 text-sm">{currentTrack.artist.stageName}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                console.log('Skip Previous button clicked');
                skipToPrevious();
              }}
              className="text-gray-400 hover:text-white transition-colors"
              title="Previous track"
              disabled={tracks.length === 0}
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={handleTogglePlay}
              className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full transition-colors"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button
              onClick={() => {
                console.log('Skip Next button clicked');
                skipToNext();
              }}
              className="text-gray-400 hover:text-white transition-colors"
              title="Next track"
              disabled={tracks.length === 0}
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <Volume2 className="w-5 h-5 text-gray-400" />
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="80"
              className="w-20"
              onChange={(e) => {
                if (audioRef.current) {
                  const volume = parseInt(e.target.value) / 100;
                  audioRef.current.volume = volume;
                  console.log('Volume changed to:', volume);
                }
              }}
            />
            <span className="text-gray-400 text-sm">
              {audioRef.current ? Math.round(audioRef.current.volume * 100) : 80}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Auth Modal Component
  const AuthModal = () => {

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (authMode === 'forgot-password') {
        handleForgotPassword(e);
      } else {
        handleAuth(e);
      }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSubmit(e);
      }
    };

    return (
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
          showAuthModal ? "block" : "hidden"
        }`}
        onClick={(e) => {
          // Only close if clicking the backdrop, not the modal content
          if (e.target === e.currentTarget) {
            console.log('Backdrop clicked - closing modal');
            setShowAuthModalWithLogging(false);
          }
        }}
      >
        <div
          className="bg-gray-800 p-6 rounded-lg w-96 max-w-sm"
          onMouseDown={(e) => {
            // Prevent any interference with input focus
            e.stopPropagation();
          }}
          onClick={(e) => {
            // Prevent modal from closing when clicking inside
            e.stopPropagation();
          }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {authMode === 'login' ? 'Welcome Back' : 
               authMode === 'register' ? 'Create Account' : 
               'Reset Password'}
            </h2>
            <p className="text-gray-400 text-sm">
              {authMode === 'login' ? 'Sign in to your MixFlow account' :
               authMode === 'register' ? 'Join the MixFlow community' :
               'Enter your email to reset your password'}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on" noValidate>
            {/* Email Field */}
            <div>
              <label htmlFor="email-input" className="block text-sm font-medium text-gray-300 mb-1">
                Email Address
              </label>
                              <input
                  ref={emailInputRef}
                  type="email"
                  placeholder="Enter your email"
                  value={authMode === 'forgot-password' ? forgotPasswordEmail : authForm.email}
                  onChange={(e) => {
                    if (authMode === 'forgot-password') {
                      setForgotPasswordEmail(e.target.value);
                    } else {
                      setAuthForm(prev => ({ ...prev, email: e.target.value }));
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onKeyPress={handleKeyPress}
                  autoComplete="email"
                  name="email"
                  id="email-input"
                  className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-purple-500 focus:outline-none transition-colors"
                  required
                />
            </div>
            
            {/* Username Field (Register only) */}
            {authMode === 'register' && (
              <div>
                <label htmlFor="username-input" className="block text-sm font-medium text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="Choose a username"
                  value={authForm.username}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, username: e.target.value }))}
                  onKeyPress={handleKeyPress}
                  autoComplete="username"
                  name="username"
                  id="username-input"
                  className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-purple-500 focus:outline-none transition-colors"
                  required
                />
              </div>
            )}
            
            {/* Password Field (Login/Register only) */}
            {(authMode === 'login' || authMode === 'register') && (
              <div>
                <label htmlFor="password-input" className="block text-sm font-medium text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={authForm.password}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                    onClick={(e) => e.stopPropagation()}
                    onKeyPress={handleKeyPress}
                    autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                    name="password"
                    id="password-input"
                    className="w-full p-3 pr-12 bg-gray-700 text-white rounded border border-gray-600 focus:border-purple-500 focus:outline-none transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowPassword(!showPassword);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer select-none focus:outline-none focus:text-purple-400"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            )}
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-3 rounded font-semibold transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {authMode === 'login' ? 'Signing In...' : 
                   authMode === 'register' ? 'Creating Account...' : 
                   'Sending Reset...'}
                </div>
              ) : (
                authMode === 'login' ? 'Sign In' : 
                authMode === 'register' ? 'Create Account' : 
                'Send Reset Email'
              )}
            </button>
          </form>
          
          {/* Action Links */}
          <div className="mt-6 space-y-3 text-center">
            {authMode === 'login' && (
              <>
                <button
                  onClick={() => setAuthMode('forgot-password')}
                  className="text-purple-400 hover:text-purple-300 text-sm"
                >
                  Forgot your password?
                </button>
                <div className="text-gray-400 text-sm">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setAuthMode('register')}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    Sign up
                  </button>
                </div>
              </>
            )}
            
            {authMode === 'register' && (
              <div className="text-gray-400 text-sm">
                Already have an account?{' '}
                <button
                  onClick={() => setAuthMode('login')}
                  className="text-purple-400 hover:text-purple-300"
                >
                  Sign in
                </button>
              </div>
            )}
            
            {authMode === 'forgot-password' && (
              <div className="text-gray-400 text-sm">
                Remember your password?{' '}
                <button
                  onClick={() => setAuthMode('login')}
                  className="text-purple-400 hover:text-purple-300"
                >
                  Sign in
                </button>
              </div>
            )}
          </div>
          
          {/* Close Button */}
          <button
            onClick={() => {
              setShowAuthModalWithLogging(false);
              setAuthMode('login');
              setAuthForm({ email: '', username: '', password: '' });
              setForgotPasswordEmail('');
              setShowPassword(false);
              hasInitialFocusRef.current = false;
            }}
            className="mt-4 w-full text-gray-400 hover:text-white text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // Artist Creation Modal
  const ArtistModal = () => {
    if (!showArtistModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-6 rounded-lg w-96">
          <h2 className="text-2xl font-bold text-white mb-4">Become an Artist</h2>
          
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Stage Name"
              value={artistForm.stageName}
              onChange={(e) => setArtistForm(prev => ({ ...prev, stageName: e.target.value }))}
              className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
            />
            
            <textarea
              placeholder="Bio (optional)"
              value={artistForm.bio}
              onChange={(e) => setArtistForm(prev => ({ ...prev, bio: e.target.value }))}
              className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-purple-500 focus:outline-none h-24"
            />
            
            <input
              type="text"
              placeholder="Genres (comma separated)"
              onChange={(e) => setArtistForm(prev => ({ 
                ...prev, 
                genres: e.target.value.split(',').map(g => g.trim()).filter(g => g) 
              }))}
              className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
            />
            
            <button
              onClick={handleCreateArtist}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white p-3 rounded font-semibold"
            >
              Create Artist Profile
            </button>
          </div>
          
          <button
            onClick={() => setShowArtistModal(false)}
            className="mt-4 w-full text-gray-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  if (auth.isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading MixFlow...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <NavBar />
      
      <div className="pb-20">
        {currentView === 'home' && <HomeView />}
        {currentView === 'search' && (
          <div className="p-6">
            <h1 className="text-3xl font-bold text-white mb-6">Search</h1>
            
            {/* Search Input */}
            <div className="bg-gray-800 p-4 rounded-lg mb-6">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search for tracks, artists, or genres..."
                  value={searchQuery}
                  onChange={(e) => performSearch(e.target.value)}
                  className="w-full bg-gray-700 text-white p-3 pl-10 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                />
                <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-3 text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Search Results */}
            {isSearching ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                <p className="text-gray-400 mt-2">Searching...</p>
              </div>
            ) : searchQuery ? (
              <div>
                <h2 className="text-xl font-bold text-white mb-4">
                  Search Results for "{searchQuery}" ({searchResults.length} found)
                </h2>
                
                {searchResults.length === 0 ? (
                  <div className="bg-gray-800 p-8 rounded-lg text-center">
                    <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-white text-lg mb-2">No results found</h3>
                    <p className="text-gray-400">Try searching for something else or check your spelling</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults.map(track => (
                      <div key={track.id} className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors">
                        <div className={`w-full h-32 rounded mb-3 flex items-center justify-center ${
                          track.genre === 'Podcast' 
                            ? 'bg-gradient-to-br from-green-500 to-blue-500' 
                            : 'bg-gradient-to-br from-purple-500 to-pink-500'
                        }`}>
                          {track.genre === 'Podcast' ? (
                            <Mic className="w-12 h-12 text-white opacity-50" />
                          ) : (
                            <Music className="w-12 h-12 text-white opacity-50" />
                          )}
                        </div>
                        <h3 className="text-white font-semibold">{track.title}</h3>
                        <p className="text-gray-400">{track.artist.stageName}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">{track.streamCount} streams</span>
                            {track.genre === 'Podcast' && (
                              <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">PODCAST</span>
                            )}
                            <span className="text-xs bg-gray-600 text-white px-2 py-1 rounded">{track.genre}</span>
                          </div>
                          <button 
                            onClick={() => {
                              playTrack(track);
                              trackStream(track.id, track.artist.id || 'unknown');
                            }}
                            className={`p-2 rounded-full text-white ${
                              track.genre === 'Podcast' 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : 'bg-purple-600 hover:bg-purple-700'
                            }`}
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Search Suggestions */}
                <div>
                  <h2 className="text-xl font-bold text-white mb-4">Popular Searches</h2>
                  <div className="flex flex-wrap gap-2">
                    {['Electronic', 'Hip Hop', 'Rock', 'Podcast', 'Jazz', 'Pop'].map((genre) => (
                      <button
                        key={genre}
                        onClick={() => performSearch(genre)}
                        className="bg-gray-800 hover:bg-purple-600 text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent Tracks */}
                {tracks.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4">Browse All Content</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tracks.slice(0, 6).map(track => (
                        <div key={track.id} className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors">
                          <div className={`w-full h-32 rounded mb-3 flex items-center justify-center ${
                            track.genre === 'Podcast' 
                              ? 'bg-gradient-to-br from-green-500 to-blue-500' 
                              : 'bg-gradient-to-br from-purple-500 to-pink-500'
                          }`}>
                            {track.genre === 'Podcast' ? (
                              <Mic className="w-12 h-12 text-white opacity-50" />
                            ) : (
                              <Music className="w-12 h-12 text-white opacity-50" />
                            )}
                          </div>
                          <h3 className="text-white font-semibold">{track.title}</h3>
                          <p className="text-gray-400">{track.artist.stageName}</p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">{track.streamCount} streams</span>
                              {track.genre === 'Podcast' && (
                                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">PODCAST</span>
                              )}
                            </div>
                            <button 
                              onClick={() => {
                                playTrack(track);
                                trackStream(track.id, track.artist.id || 'unknown');
                              }}
                              className={`p-2 rounded-full text-white ${
                                track.genre === 'Podcast' 
                                  ? 'bg-green-600 hover:bg-green-700' 
                                  : 'bg-purple-600 hover:bg-purple-700'
                              }`}
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search Tips */}
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-white font-semibold mb-3">Search Tips</h3>
                  <ul className="text-gray-400 space-y-1">
                    <li>• Search by track title, artist name, or genre</li>
                    <li>• Use keywords like "podcast", "electronic", "hip hop"</li>
                    <li>• Try partial matches - "elec" will find "Electronic"</li>
                    <li>• Search is case-insensitive</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
        {currentView === 'dj' && <DJModeInterface />}
        {currentView === 'upload' && (
          <div>
            <div className="text-white p-2">Debug: Rendering Upload View</div>
            <UploadView />
          </div>
        )}
        {currentView === 'earnings' && auth.user?.artist && (
          <div className="p-6">
            <h1 className="text-3xl font-bold text-white mb-6">Artist Earnings</h1>
            
            {/* Earnings Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Total Earnings</p>
                    <p className="text-3xl font-bold">${auth.user.artist.totalEarnings?.toFixed(2) || '0.00'}</p>
                  </div>
                  <TrendingUp className="w-8 h-8" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Total Streams</p>
                    <p className="text-3xl font-bold">{auth.user.artist.totalStreams?.toLocaleString() || '0'}</p>
                  </div>
                  <Play className="w-8 h-8" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Monthly Listeners</p>
                    <p className="text-3xl font-bold">{auth.user.artist.monthlyListeners?.toLocaleString() || '0'}</p>
                  </div>
                  <Users className="w-8 h-8" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 p-6 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100">Revenue/Stream</p>
                    <p className="text-3xl font-bold">$0.003</p>
                  </div>
                  <Music className="w-8 h-8" />
                </div>
              </div>
            </div>

            {/* Payout Settings */}
            <div className="bg-gray-800 p-6 rounded-lg mb-6">
              <h2 className="text-xl font-bold text-white mb-4">Payout Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    PayPal Email / Bank Account
                  </label>
                  <input
                    type="email"
                    value={auth.user.artist.payoutAccount || ''}
                    onChange={(e) => {
                      setAuth(prev => ({
                        ...prev,
                        user: prev.user ? {
                          ...prev.user,
                          artist: prev.user.artist ? {
                            ...prev.user.artist,
                            payoutAccount: e.target.value
                          } : undefined
                        } : null
                      }));
                    }}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2"
                    placeholder="your-email@example.com"
                  />
                </div>
                <div className="flex items-end">
                  <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                    Request Payout
                  </button>
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Minimum payout: $50. Payouts are processed monthly.
              </p>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {[
                  { track: 'Electronic Dreams', streams: 1250, revenue: 3.75, date: '2025-07-13' },
                  { track: 'Urban Nights', streams: 890, revenue: 2.67, date: '2025-07-12' },
                  { track: 'Sunset Vibes', streams: 2100, revenue: 6.30, date: '2025-07-11' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                    <div className="flex items-center space-x-3">
                      <Music className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-white font-medium">{activity.track}</p>
                        <p className="text-gray-400 text-sm">{activity.streams} streams</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-semibold">+${activity.revenue.toFixed(2)}</p>
                      <p className="text-gray-400 text-sm">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {currentView === 'library' && (
          <div className="p-6">
            <h1 className="text-3xl font-bold text-white mb-6">Your Library</h1>
            
            {userUploads.length === 0 ? (
              <div className="bg-gray-800 p-8 rounded-lg text-center">
                <Library className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-white text-lg mb-2">No uploads yet</h3>
                <p className="text-gray-400 mb-4">Your uploaded music and podcasts will appear here</p>
                <button
                  onClick={() => setCurrentView('upload')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                >
                  Upload Content
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Music Section */}
                {userUploads.some(upload => upload.type === 'music') && (
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                      <Music className="w-6 h-6 mr-2" />
                      Music Tracks
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userUploads
                        .filter(upload => upload.type === 'music')
                        .map(upload => (
                          <div key={upload.id} className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors">
                            <div className="w-full h-32 rounded mb-3 flex items-center justify-center overflow-hidden bg-gray-600">
                              {upload.artwork ? (
                                <img 
                                  src={URL.createObjectURL(upload.artwork)}
                                  alt={`${upload.metadata.title} cover`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                  <Music className="w-12 h-12 text-white opacity-50" />
                                </div>
                              )}
                            </div>
                            <h3 className="text-white font-semibold">{upload.metadata.title}</h3>
                            <p className="text-gray-400">{upload.metadata.artist || 'Unknown Artist'}</p>
                            {upload.metadata.album && (
                              <p className="text-gray-500 text-sm">{upload.metadata.album}</p>
                            )}
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-sm text-gray-500">
                                {new Date(upload.uploadedAt).toLocaleDateString()}
                              </span>
                              <button 
                                onClick={() => {
                                  console.log('Play button clicked for:', upload.metadata.title);
                                  console.log('File:', upload.file);
                                  
                                  // Create a mock track object for the player
                                  const mockTrack = {
                                    id: upload.id,
                                    title: upload.metadata.title,
                                    artist: { stageName: upload.metadata.artist || 'You' },
                                    duration: 180, // Mock duration
                                    fileUrl: URL.createObjectURL(upload.file),
                                    genre: 'User Upload',
                                    streamCount: 0
                                  };
                                  
                                  console.log('Created track with fileUrl:', mockTrack.fileUrl);
                                  
                                  setCurrentTrack(mockTrack);
                                  setIsPlaying(true);
                                  
                                  // Try to play audio directly
                                  if (!audioRef.current) {
                                    audioRef.current = new Audio();
                                  }
                                  
                                  audioRef.current.src = mockTrack.fileUrl;
                                  audioRef.current.volume = 0.8; // Set volume to 80%
                                  
                                  audioRef.current.play()
                                    .then(() => {
                                      console.log('Audio started playing successfully');
                                      console.log('Audio volume:', audioRef.current?.volume);
                                      console.log('Audio duration:', audioRef.current?.duration);
                                      console.log('Audio current time:', audioRef.current?.currentTime);
                                    })
                                    .catch(error => {
                                      console.error('Error playing audio:', error);
                                      alert(`Unable to play audio: ${error.message}`);
                                    });
                                }}
                                className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Podcast Section */}
                {userUploads.some(upload => upload.type === 'podcast') && (
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                      <Mic className="w-6 h-6 mr-2" />
                      Podcasts
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userUploads
                        .filter(upload => upload.type === 'podcast')
                        .map(upload => (
                          <div key={upload.id} className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors">
                            <div className="w-full h-32 rounded mb-3 flex items-center justify-center overflow-hidden bg-gray-600">
                              {upload.artwork ? (
                                <img 
                                  src={URL.createObjectURL(upload.artwork)}
                                  alt={`${upload.metadata.title} cover`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                                  <Mic className="w-12 h-12 text-white opacity-50" />
                                </div>
                              )}
                            </div>
                            <h3 className="text-white font-semibold">{upload.metadata.title}</h3>
                            <p className="text-gray-400">
                              {upload.metadata.episode ? `Episode ${upload.metadata.episode}` : 'Podcast'}
                              {upload.metadata.season && ` • Season ${upload.metadata.season}`}
                            </p>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-sm text-gray-500">
                                {new Date(upload.uploadedAt).toLocaleDateString()}
                              </span>
                              <button 
                                onClick={() => {
                                  console.log('Play button clicked for podcast:', upload.metadata.title);
                                  console.log('File:', upload.file);
                                  
                                  // Create a mock track object for the player
                                  const mockTrack = {
                                    id: upload.id,
                                    title: upload.metadata.title,
                                    artist: { stageName: 'You' },
                                    duration: 1800, // Mock duration for podcast
                                    fileUrl: URL.createObjectURL(upload.file),
                                    genre: 'Podcast',
                                    streamCount: 0
                                  };
                                  
                                  console.log('Created podcast track with fileUrl:', mockTrack.fileUrl);
                                  
                                  setCurrentTrack(mockTrack);
                                  setIsPlaying(true);
                                  
                                  // Try to play audio directly
                                  if (!audioRef.current) {
                                    audioRef.current = new Audio();
                                  }
                                  
                                  audioRef.current.src = mockTrack.fileUrl;
                                  audioRef.current.volume = 0.8; // Set volume to 80%
                                  
                                  audioRef.current.play()
                                    .then(() => {
                                      console.log('Podcast audio started playing successfully');
                                    })
                                    .catch(error => {
                                      console.error('Error playing podcast audio:', error);
                                      alert(`Unable to play podcast: ${error.message}`);
                                    });
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Upload Stats */}
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-white font-semibold mb-2">Upload Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-purple-400">
                        {userUploads.filter(u => u.type === 'music').length}
                      </div>
                      <div className="text-gray-400 text-sm">Music Tracks</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-400">
                        {userUploads.filter(u => u.type === 'podcast').length}
                      </div>
                      <div className="text-gray-400 text-sm">Podcasts</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-400">
                        {userUploads.length}
                      </div>
                      <div className="text-gray-400 text-sm">Total Uploads</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-400">
                        {Math.round(userUploads.reduce((acc, upload) => acc + upload.file.size, 0) / (1024 * 1024))}MB
                      </div>
                      <div className="text-gray-400 text-sm">Storage Used</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="fixed bottom-0 left-0 right-0">
        <MiniPlayer />
      </div>

      <AuthModal />
      <ArtistModal />

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-4xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Choose Your Plan</h2>
              <button
                onClick={() => {
                  console.log('Closing subscription modal');
                  setShowSubscriptionModal(false);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-purple-600 rounded-lg">
              <h3 className="text-white font-bold">🎧 Unlock DJ Mode</h3>
              <p className="text-purple-100">Get access to professional DJ tools, mixing capabilities, and more!</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {subscriptionPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`border-2 rounded-lg p-6 ${
                    plan.name === 'Pro' 
                      ? 'border-yellow-500 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10' 
                      : 'border-purple-500 bg-gradient-to-br from-purple-500/10 to-purple-600/10'
                  }`}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                    <div className="text-4xl font-bold text-white my-2">
                      {plan.price}
                      <span className="text-lg text-gray-400">/{plan.period}</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-gray-300">
                        <Check className="w-5 h-5 text-green-400 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <button
                    onClick={() => {
                      console.log('Subscribe button clicked for plan:', plan.id);
                      handleSubscribe(plan.id);
                    }}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                      plan.name === 'Pro'
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    Subscribe to {plan.name}
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                All plans include 7-day free trial. Cancel anytime. Powered by RevenueCat.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MixFlowApp;