import React, { useState } from 'react';

const DebuggerComponent = () => {
  const [username, setUsername] = useState('');
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeEndpoint, setActiveEndpoint] = useState('profile');

  // API base URL
  const API_BASE_URL = 'https://node-proxy-server-1-o9k5.onrender.com';

  // Extract username from potential full URL
  const extractUsername = (input) => {
    if (input.includes('instagram.com')) {
      const cleaned = input.endsWith('/') ? input.slice(0, -1) : input;
      const match = cleaned.match(/instagram\.com\/([^/?]+)/);
      return match ? match[1] : input;
    }
    return input;
  };

  // Fetch data from selected endpoint
  const fetchData = async () => {
    if (!username.trim()) return;

    const cleanUsername = extractUsername(username);
    setLoading(true);
    setError(null);
    setApiResponse(null);

    try {
      let url;

      switch (activeEndpoint) {
        case 'profile':
          url = `${API_BASE_URL}/api/instagram-profile?username=${cleanUsername}`;
          break;
        case 'stories':
          // We need user_id from profile first
          const profileResponse = await fetch(`${API_BASE_URL}/api/instagram-profile?username=${cleanUsername}`);
          const profileData = await profileResponse.json();
          if (!profileData.user_id) {
            throw new Error("Couldn't get user_id from profile data");
          }
          url = `${API_BASE_URL}/api/instagram-stories?user_id=${profileData.user_id}`;
          break;
        case 'reels':
          // Also need user_id from profile
          const profileResp = await fetch(`${API_BASE_URL}/api/instagram-profile?username=${cleanUsername}`);
          const profData = await profileResp.json();
          if (!profData.user_id) {
            throw new Error("Couldn't get user_id from profile data");
          }
          url = `${API_BASE_URL}/api/instagram-reels?user_id=${profData.user_id}&page_size=12`;
          break;
        default:
          url = `${API_BASE_URL}/api/instagram-profile?username=${cleanUsername}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const data = await response.json();
      setApiResponse(data);
    } catch (err) {
      setError(`Failed to fetch data: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Instagram API Debugger</h1>

      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Instagram username or link"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border rounded p-2 flex-grow"
          />
          <button
            onClick={fetchData}
            disabled={loading || !username.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded disabled:bg-blue-300"
          >
            {loading ? 'Loading...' : 'Test API'}
          </button>
        </div>

        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setActiveEndpoint('profile')}
            className={`px-4 py-2 rounded ${activeEndpoint === 'profile' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Profile Endpoint
          </button>
          <button
            onClick={() => setActiveEndpoint('stories')}
            className={`px-4 py-2 rounded ${activeEndpoint === 'stories' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Stories Endpoint
          </button>
          <button
            onClick={() => setActiveEndpoint('reels')}
            className={`px-4 py-2 rounded ${activeEndpoint === 'reels' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Reels Endpoint
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {apiResponse && (
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-bold mb-2">API Response:</h2>

          {activeEndpoint === 'profile' && apiResponse.recent_posts && (
            <div className="mb-4">
              <h3 className="font-bold text-lg mb-2">Recent Posts:</h3>
              <div className="text-sm text-gray-600">Count: {apiResponse.recent_posts.length}</div>
              {apiResponse.recent_posts.length === 0 ? (
                <div className="text-red-500">No posts found in response</div>
              ) : (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {apiResponse.recent_posts.slice(0, 6).map((post, index) => (
                    <div key={index} className="aspect-square bg-gray-100 relative">
                      {post.thumbnail_src || post.display_url ? (
                        <img
                          src={post.thumbnail_src || post.display_url}
                          alt="Post thumbnail"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-red-500">
                          Missing image URL
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeEndpoint === 'stories' && (
            <div className="mb-4">
              <h3 className="font-bold text-lg mb-2">Stories:</h3>
              <div className="text-sm text-gray-600">Count: {apiResponse.stories?.length || 0}</div>
              {(!apiResponse.stories || apiResponse.stories.length === 0) ? (
                <div className="text-amber-500">No stories found in response</div>
              ) : (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                  {apiResponse.stories.map((story, index) => (
                    <div key={index} className="w-16 h-16 flex-shrink-0">
                      {story.image_url || story.video_url ? (
                        <img
                          src={story.image_url || story.video_url}
                          alt="Story thumbnail"
                          className="w-full h-full object-cover rounded-full border-2 border-pink-500"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-red-500 text-xs rounded-full border-2 border-pink-500">
                          Missing URL
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeEndpoint === 'reels' && (
            <div className="mb-4">
              <h3 className="font-bold text-lg mb-2">Reels:</h3>
              <div className="text-sm text-gray-600">Count: {apiResponse.reels?.length || 0}</div>
              {(!apiResponse.reels || apiResponse.reels.length === 0) ? (
                <div className="text-amber-500">No reels found in response</div>
              ) : (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {apiResponse.reels.slice(0, 6).map((reel, index) => (
                    <div key={index} className="aspect-[9/16] bg-gray-100 relative">
                      {reel.thumbnail_url ? (
                        <img
                          src={reel.thumbnail_url}
                          alt="Reel thumbnail"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-red-500">
                          Missing thumbnail URL
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <h3 className="font-bold text-lg mb-2">Full Response:</h3>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebuggerComponent;