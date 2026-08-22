import React, { useState, useEffect } from 'react';
import { soundEngine } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Heart, MessageCircle, Share2, Sparkles, Send, User, Cloud } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, getDocs, doc, setDoc, onSnapshot, writeBatch } from 'firebase/firestore';

interface CommunityPost {
  id: string;
  author: string;
  avatarBg: string;
  timeAgo: string;
  title: string;
  imageUrl: string;
  likes: number;
  comments: number;
  userLiked?: boolean;
}

const INITIAL_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    author: 'Elena & Mochi',
    avatarBg: 'from-[#5843d1] to-[#8d79ff]',
    timeAgo: '2h ago',
    title: 'Sunny garden exploring with my little buddy! 🌸',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNfaTb9uR8iUBpPk6snOHV1PqOFK7YalFYEsbzATbi8NxnsGgqgnbpvx1GDNNrySP8YjJomA0Ats8_CQZVgZn58Se6golEgWrbPad6GpII40DLa4hddHApqBEwzdPIMTzhLrp819l5DJVMHJKRXiXt2QeOgpWUoZc4JjCDpEbGBIwiJ05JLkf4VaR35iw4NDr7lp9wp1JRQDiwzuUvvSZ6uSNVBXgpPhNCE45QoVh58Lmh6PaoxjIR',
    likes: 42,
    comments: 8,
    userLiked: true
  },
  {
    id: 'post-2',
    author: 'Sammy Crafts',
    avatarBg: 'from-[#2c6956] to-[#53dca8]',
    timeAgo: '5h ago',
    title: 'Morning coffee & cozy sketches.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR-lk21tKQe_xPz62_cA904KYJajmiKMGnv0uL3xzXc5L80s43nmxZY23-7L_g93lX3hcrMfgKB5D3sF8uUy6KPsMWlVGgywX5aKh2CRJxRFZDVDv_y6ju6h4B8h224kBoSEVM3tIS-A5U1f1rebbMD_ld9kLVal_olBV0fy1nETeuzckmMX8Rt-g7EyNWQQ0DOTSZubGxlpU9hWO8CJ8CSG8zYM3geKzh1AsR1PmGt4brKHeGaln7',
    likes: 29,
    comments: 3,
    userLiked: false
  },
  {
    id: 'post-3',
    author: 'Maya Skylight',
    avatarBg: 'from-[#ff8a93] to-[#ffd1dc]',
    timeAgo: '1d ago',
    title: 'Sunset over the quiet lake today. Nature heals everything.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlPUePfhgsx-SqAjDBVnA5NHHcUuu3QNcaD31kaw1467jDfxX8A15LldDhbVvHR9p3QSNEcQfzFAPV0-afj1zFHQnS_DLqbjBkGypYYlImuIpEJ7DHKiffe8IADQzAHks6eWhg6qNmRs3HckQ_C3z8cfA-gTY09oTuiJqD_RBpnjfpCZy2DeG2Pll-SRj0xhOhXvlriCGbemdOeopwWA3CD_3KSeMHqL9tQ3mNFv8lrxoK8Qh-Dpz7',
    likes: 85,
    comments: 14,
    userLiked: true
  }
];

export const CommunityScreen: React.FC = () => {
  const [posts, setPosts] = useState<CommunityPost[]>(INITIAL_POSTS);

  // Firestore sync for community posts
  useEffect(() => {
    async function initCommunity() {
      try {
        const postsRef = collection(db, 'community_posts');
        const snap = await getDocs(postsRef);
        if (snap.empty) {
          const batch = writeBatch(db);
          for (const post of INITIAL_POSTS) {
            batch.set(doc(db, 'community_posts', post.id), post);
          }
          await batch.commit();
        }
      } catch (err) {
        console.warn('Community Firestore init:', err);
      }
    }
    initCommunity();

    // Listen to real-time updates from cloud database
    const unsubscribe = onSnapshot(collection(db, 'community_posts'), (snapshot) => {
      const livePosts: CommunityPost[] = [];
      snapshot.forEach(docSnap => {
        livePosts.push(docSnap.data() as CommunityPost);
      });
      if (livePosts.length > 0) {
        setPosts(livePosts);
      }
    }, (error) => {
      console.warn('Community snapshot listener fallback:', error);
    });

    return () => unsubscribe();
  }, []);

  const handleLike = async (id: string) => {
    soundEngine.playPop();
    const updatedPosts = posts.map(p => {
      if (p.id === id) {
        const isLiked = !p.userLiked;
        if (isLiked) {
          confetti({
            particleCount: 20,
            spread: 40,
            origin: { y: 0.7 },
            colors: ['#ff8a93', '#5843d1']
          });
        }
        const updated = {
          ...p,
          likes: isLiked ? p.likes + 1 : p.likes - 1,
          userLiked: isLiked
        };
        // Persist to Cloud Database
        setDoc(doc(db, 'community_posts', id), updated, { merge: true }).catch(() => {});
        return updated;
      }
      return p;
    });
    setPosts(updatedPosts);
  };

  return (
    <div id="community-screen" className="w-full min-h-screen pt-24 pb-36 px-4 sm:px-8 max-w-4xl mx-auto relative">
      
      {/* Header */}
      <div className="pt-6 sm:pt-10 pb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5843d1] to-[#8d79ff] flex items-center justify-center text-white shadow-md">
            <span className="material-symbols-outlined text-[28px]">groups</span>
          </div>
          <div>
            <h1 className="font-heading font-bold text-3xl sm:text-4xl text-[#1a1c1d] tracking-tight">
              Buddy Community
            </h1>
            <p className="text-sm text-[#787586]">
              Share cozy moments, cheer on friends, and connect.
            </p>
          </div>
        </div>

        {/* Cloud Database Connected Badge */}
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 text-emerald-700 px-3.5 py-1.5 rounded-full text-xs font-bold w-fit shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Cloud className="w-3.5 h-3.5 text-emerald-600" />
          <span>Cloud Database Active</span>
        </div>
      </div>

      {/* Feed List */}
      <div className="space-y-6">
        {posts.map(post => (
          <div
            key={post.id}
            className="clay-card rounded-[2.5rem] p-6 sm:p-7 bg-white/90 shadow-[0_8px_24px_rgba(90,70,211,0.06)] flex flex-col gap-4 transition-all hover:scale-[1.01]"
          >
            {/* Author */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${post.avatarBg} text-white flex items-center justify-center font-bold text-sm shadow-md`}>
                  {post.author.charAt(0)}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-[#1a1c1d]">
                    {post.author}
                  </h3>
                  <span className="text-xs text-[#787586]">{post.timeAgo}</span>
                </div>
              </div>

              <div className="bg-[#e4deff]/40 text-[#5843d1] px-3 py-1 rounded-full text-xs font-bold font-heading">
                Buddy Moment
              </div>
            </div>

            {/* Post text */}
            <p className="text-sm sm:text-base text-[#1a1c1d] font-normal leading-relaxed">
              {post.title}
            </p>

            {/* Image */}
            <div className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden shadow-inner border border-zinc-200 bg-zinc-100">
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    post.userLiked
                      ? 'bg-red-50 text-red-500 shadow-xs scale-105'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.userLiked ? 'fill-red-500' : ''}`} />
                  <span>{post.likes}</span>
                </button>

                <button
                  onClick={() => soundEngine.playPop()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comments}</span>
                </button>
              </div>

              <button
                onClick={() => soundEngine.playPop()}
                className="p-2 rounded-full bg-zinc-100 text-zinc-600 hover:bg-[#5843d1] hover:text-white transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
