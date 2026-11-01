import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Pencil, Plus, Sparkles, Trash2, X } from 'lucide-react';
import type { Conversation } from '@/types';
import { AvatarSlot } from '@/components/layout/AvatarSlot';

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  avatarSrc: string;
  open: boolean;
  onClose: () => void;
  onNew: () => void;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onOpenSettings: () => void;
}

interface ConversationRowProps {
  conversation: Conversation;
  active: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}

function ConversationRow({ conversation, active, onSelect, onRename, onDelete }: ConversationRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(conversation.title);
  const cancelledRef = useRef(false);

  const startEditing = () => {
    cancelledRef.current = false;
    setDraft(conversation.title);
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    if (!cancelledRef.current && draft.trim() && draft.trim() !== conversation.title) onRename(draft);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') {
      cancelledRef.current = true;
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        maxLength={60}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        aria-label="重命名对话"
        className="w-full rounded-3xl border border-emerald-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none ring-4 ring-emerald-100"
      />
    );
  }

  return (
    <div
      className={`group relative flex items-center rounded-3xl transition ${
        active ? 'bg-emerald-100/80' : 'hover:bg-white'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 px-4 py-2.5 text-left"
        aria-current={active ? 'true' : undefined}
      >
        <span className={`block truncate text-sm ${active ? 'font-medium text-emerald-900' : 'text-slate-700'}`}>
          {conversation.title}
        </span>
        <span className="block text-xs text-slate-500">{conversation.messages.length} 条消息</span>
      </button>
      <div className="flex shrink-0 items-center gap-0.5 pr-2 opacity-100 transition md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
        <button
          type="button"
          onClick={startEditing}
          aria-label="重命名"
          className="rounded-2xl p-1.5 text-slate-500 transition hover:bg-emerald-100 hover:text-emerald-800"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="删除对话"
          className="rounded-2xl p-1.5 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function ConversationSidebar({
  conversations,
  activeId,
  avatarSrc,
  open,
  onClose,
  onNew,
  onSelect,
  onRename,
  onDelete,
  onOpenSettings,
}: ConversationSidebarProps) {
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-emerald-900/10 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden="true"
      />
      <aside
        aria-label="我们的回忆"
        aria-hidden={!open}
        className={`glass-strong fixed inset-y-3 left-3 z-40 flex w-[300px] max-w-[calc(100%-1.5rem)] flex-col rounded-3xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-[110%]'
        }`}
      >
        <div className="flex items-center justify-between gap-2 px-5 pb-3 pt-5">
          <div className="flex items-center gap-3">
            <AvatarSlot src={avatarSrc} />
            <div>
              <p className="text-sm font-semibold tracking-wide text-slate-800">我们的回忆</p>
              <p className="text-[11px] text-slate-500">GREAK · 私人伴侣</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="收起我们的回忆"
            className="rounded-3xl p-2 text-slate-500 hover:bg-emerald-50 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 pb-3">
          <button
            type="button"
            onClick={onNew}
            className="flex w-full items-center justify-center gap-2 rounded-3xl bg-emerald-400 px-4 py-2.5 text-sm font-medium text-emerald-950 shadow-lg shadow-emerald-300/40 transition hover:bg-emerald-300 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            新建对话
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-3" aria-label="历史会话">
          {sorted.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-slate-500">还没有对话，开始第一条消息吧</p>
          ) : (
            sorted.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                conversation={conversation}
                active={conversation.id === activeId}
                onSelect={() => onSelect(conversation.id)}
                onRename={(title) => onRename(conversation.id, title)}
                onDelete={() => onDelete(conversation.id)}
              />
            ))
          )}
        </nav>

        <div className="border-t border-emerald-100/80 p-3">
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex w-full items-center gap-2.5 rounded-3xl px-4 py-2.5 text-sm text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800"
          >
            <Sparkles className="h-4 w-4" />
            我的灵魂
          </button>
          <p className="px-4 pt-2 text-[11px] leading-relaxed text-slate-500">我们的记忆只属于你</p>
        </div>
      </aside>
    </>
  );
}
