import React from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export function EmptyState({
  icon = '🧾',
  title = 'No items found',
  description = 'Get started by creating your first entry.',
  actionText,
  actionLink,
  onAction,
}) {
  return (
    <div className="bg-[#FFFDF0] border border-[#FFE494]/70 rounded-3xl p-8 sm:p-12 text-center shadow-warm-sm flex flex-col items-center justify-center max-w-md mx-auto my-6">
      <div className="w-16 h-16 rounded-3xl bg-[#FFF4D9] flex items-center justify-center text-3xl mb-4 shadow-sm border border-[#FFE494]">
        {icon}
      </div>

      <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#292929] mb-2">
        {title}
      </h3>

      <p className="text-sm text-[#6B7280] mb-6 leading-relaxed max-w-sm">
        {description}
      </p>

      {actionText && (
        actionLink ? (
          <Link
            to={actionLink}
            className="px-6 py-3 rounded-full bg-[#009F93] hover:bg-[#00847A] text-white font-semibold text-sm transition-all shadow-teal flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{actionText}</span>
          </Link>
        ) : (
          <button
            onClick={onAction}
            className="px-6 py-3 rounded-full bg-[#009F93] hover:bg-[#00847A] text-white font-semibold text-sm transition-all shadow-teal flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{actionText}</span>
          </button>
        )
      )}
    </div>
  );
}
