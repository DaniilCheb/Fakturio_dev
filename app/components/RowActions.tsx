'use client'

import React from 'react'
import Link from 'next/link'
import { EditIcon, DeleteIcon, DownloadIcon } from './Icons'

interface RowActionsProps {
  editHref?: string
  onEdit?: () => void
  onDelete?: () => void
  onDownload?: () => void
  downloadLabel?: string
  editLabel?: string
  deleteLabel?: string
  className?: string
}

/**
 * Hover-reveal action buttons for table rows
 * 
 * Usage:
 * <RowActions 
 *   editHref="/edit/123"
 *   onDelete={() => handleDelete(id)}
 *   onDownload={() => handleDownload(id)}  // optional
 * />
 */
export default function RowActions({ 
  editHref, 
  onEdit,
  onDelete, 
  onDownload,
  downloadLabel = 'Download',
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  className = ''
}: RowActionsProps) {
  return (
    <div className={`flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${className}`}>
      {onDownload && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDownload(); }}
          className="p-2 text-[#555555] dark:text-[#aaa] hover:text-[#141414] dark:hover:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#333] rounded-full transition-colors"
          title={downloadLabel}
        >
          <DownloadIcon size={16} />
        </button>
      )}
      
      {(editHref || onEdit) && (
        editHref ? (
          <Link
            href={editHref}
            onClick={(e) => e.stopPropagation()}
            className="p-2 text-[#555555] dark:text-[#aaa] hover:text-[#141414] dark:hover:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#333] rounded-full transition-colors"
            title={editLabel}
          >
            <EditIcon size={16} />
          </Link>
        ) : (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit!(); }}
            className="p-2 text-[#555555] dark:text-[#aaa] hover:text-[#141414] dark:hover:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#333] rounded-full transition-colors"
            title={editLabel}
          >
            <EditIcon size={16} />
          </button>
        )
      )}
      
      {onDelete && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
          className="p-2 text-[#555555] dark:text-[#aaa] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
          title={deleteLabel}
        >
          <DeleteIcon size={16} />
        </button>
      )}
    </div>
  )
}

