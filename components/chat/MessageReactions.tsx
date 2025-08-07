"use client";

interface Reaction {
  emoji: string;
  users: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
}

interface MessageReactionsProps {
  reactions: Reaction[];
  onReaction: (emoji: string) => void;
  currentUserId?: string;
}

export default function MessageReactions({ reactions, onReaction, currentUserId }: MessageReactionsProps) {
  if (reactions.length === 0) return null;

  const hasUserReacted = (reaction: Reaction) => {
    return reaction.users.some(user => user.email === currentUserId);
  };

  const getTotalReactionCount = (reaction: Reaction) => {
    return reaction.users.length;
  };

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {reactions.map((reaction, index) => {
        const userReacted = hasUserReacted(reaction);
        const count = getTotalReactionCount(reaction);
        
        return (
          <button
            key={index}
            onClick={() => onReaction(reaction.emoji)}
            className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors ${
              userReacted
                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
            title={reaction.users.map(user => user.name).join(", ")}
          >
            <span>{reaction.emoji}</span>
            <span className="font-medium">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
