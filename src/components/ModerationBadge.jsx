export default function ModerationBadge({ moderation, tags, priority }) {
  if (!moderation && (!tags || tags.length === 0)) return null;

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    normal: 'bg-blue-100 text-blue-800',
    high: 'bg-red-100 text-red-800'
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'allow':
        return 'bg-green-200';
      case 'flag':
        return 'bg-yellow-200';
      case 'escalate':
        return 'bg-red-200';
      default:
        return 'bg-gray-200';
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center mt-2">
      {priority && (
        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${priorityColors[priority] || priorityColors.normal}`}>
          {priority.toUpperCase()}
        </span>
      )}

      {tags && tags.map((tag, idx) => (
        <span key={idx} className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
          {tag}
        </span>
      ))}

      {moderation?.action && (
        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getActionColor(moderation.action)}`}>
          {moderation.action}
        </span>
      )}

      {moderation?.notes && (
        <span className="text-xs text-gray-600 italic">{moderation.notes}</span>
      )}
    </div>
  );
}
