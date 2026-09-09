"use client";

import { useState } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal, Send } from "lucide-react";

// MOCK DATA
const MOCK_POSTS = [
  {
    id: 1,
    user: {
      name: "João Silva",
      avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100&h=100",
      handle: "@joaosilva"
    },
    type: "video",
    mediaUrl: "https://videos.pexels.com/video-files/3129957/3129957-uhd_2560_1440_25fps.mp4", // generic short video
    caption: "Analisando o mercado de hoje... a volatilidade está incrível! 📈🔥",
    likes: 124,
    comments: 12,
    time: "2h",
    isLiked: false
  },
  {
    id: 2,
    user: {
      name: "Mariana Costa",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&h=100",
      handle: "@maricosta"
    },
    type: "image",
    mediaUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800", // trading setup
    caption: "Setup novo montado! Pronta para operar. 💻✨ #trading #setup",
    likes: 342,
    comments: 45,
    time: "4h",
    isLiked: true
  },
  {
    id: 3,
    user: {
      name: "Carlos Edu",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100",
      handle: "@carlosedu"
    },
    type: "image",
    mediaUrl: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&q=80&w=800",
    caption: "Fechando a semana no green! Obrigado família Acro. 💵🚀",
    likes: 89,
    comments: 5,
    time: "5h",
    isLiked: false
  }
];

export default function FeedPage() {
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [commentingOn, setCommentingOn] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");

  const handleLike = (postId: number) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
  };

  const submitComment = (postId: number) => {
    if (!commentText.trim()) return;
    
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments + 1
        };
      }
      return post;
    }));
    
    setCommentText("");
    setCommentingOn(null);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <main className="max-w-xl mx-auto px-4 sm:px-0 pt-6 space-y-8">
        {posts.map((post) => (
          <article key={post.id} className="glass-panel rounded-3xl overflow-hidden">
            {/* Post Header */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src={post.user.avatar} 
                  alt={post.user.name} 
                  className="w-10 h-10 rounded-full object-cover border border-white/10"
                />
                <div>
                  <h3 className="font-semibold text-sm leading-tight">{post.user.name}</h3>
                  <p className="text-xs text-acro-silver-dark">{post.user.handle} • {post.time}</p>
                </div>
              </div>
              <button className="p-2 text-acro-silver-dark hover:text-white transition-colors">
                <MoreHorizontal size={20} />
              </button>
            </div>

            {/* Media Content */}
            <div className="relative w-full bg-black/50 aspect-[4/5] sm:aspect-square flex items-center justify-center overflow-hidden">
              {post.type === 'video' ? (
                <video 
                  src={post.mediaUrl}
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img 
                  src={post.mediaUrl} 
                  alt="Post content" 
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Post Actions & Caption */}
            <div className="p-4">
              <div className="flex items-center gap-4 mb-3">
                <button 
                  onClick={() => handleLike(post.id)}
                  className={`transition-all duration-300 transform active:scale-75 ${post.isLiked ? 'text-red-500' : 'text-white hover:text-acro-silver'}`}
                >
                  <Heart size={24} className={post.isLiked ? "fill-current" : ""} />
                </button>
                <button 
                  onClick={() => setCommentingOn(commentingOn === post.id ? null : post.id)}
                  className="text-white hover:text-acro-silver transition-colors"
                >
                  <MessageCircle size={24} />
                </button>
                <button className="text-white hover:text-acro-silver transition-colors">
                  <Share2 size={24} />
                </button>
              </div>

              <div className="font-semibold text-sm mb-1">
                {post.likes} {post.likes === 1 ? 'curtida' : 'curtidas'}
              </div>

              <div className="text-sm">
                <span className="font-semibold mr-2">{post.user.handle}</span>
                <span className="text-acro-silver-dark">{post.caption}</span>
              </div>

              <div 
                className="text-xs text-acro-silver-dark mt-2 cursor-pointer hover:text-acro-silver transition-colors"
                onClick={() => setCommentingOn(commentingOn === post.id ? null : post.id)}
              >
                Ver todos os {post.comments} comentários
              </div>

              {/* Fake Comment Input */}
              {commentingOn === post.id && (
                <div className="mt-4 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <input 
                    type="text" 
                    placeholder="Adicione um comentário..." 
                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-acro-blue/50 focus:ring-1 focus:ring-acro-blue/50 transition-all"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitComment(post.id)}
                    autoFocus
                  />
                  <button 
                    onClick={() => submitComment(post.id)}
                    className="p-2 bg-acro-blue text-white rounded-full hover:bg-acro-blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!commentText.trim()}
                  >
                    <Send size={16} />
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </main>
    </div>
  );
}
