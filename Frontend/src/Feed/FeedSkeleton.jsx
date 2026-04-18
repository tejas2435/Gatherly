export default function FeedSkeleton() {
  return (
    <div className="w-full bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-md mb-6 border border-gray-100 dark:border-gray-700">

      {/* USER HEADER */}
      <div className="flex items-center gap-4 mb-5">
        
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full skeleton"></div>

        {/* Name + Username */}
        <div className="flex flex-col gap-2 flex-1">
          <div className="w-32 h-4 skeleton rounded"></div>
          <div className="w-20 h-3 skeleton rounded"></div>
        </div>
      </div>

      {/* TEXT LINES */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="w-full h-3 skeleton rounded"></div>
        <div className="w-4/5 h-3 skeleton rounded"></div>
      </div>

      {/* BIG IMAGE */}
      <div className="w-full h-64 skeleton rounded-xl mb-5"></div>

      {/* ACTION BUTTONS */}
      <div className="flex items-center gap-6">
        <div className="w-6 h-6 skeleton rounded-full"></div>
        <div className="w-6 h-6 skeleton rounded-full"></div>
        <div className="w-6 h-6 skeleton rounded-full"></div>
      </div>
    </div>
  );
}
