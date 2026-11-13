import { useCallback, useState } from 'react';
import { AmbientBackground } from '@/components/layout/AmbientBackground';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { Toast } from '@/components/common/Toast';
import { ConversationSidebar } from '@/components/layout/ConversationSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { BgmWidget } from '@/components/bgm/BgmWidget';
import { ControlCenter } from '@/components/control/ControlCenter';
import { useSettings } from '@/hooks/useSettings';
import { useConversations } from '@/hooks/useConversations';
import { useSpeech } from '@/hooks/useSpeech';
import { useBgm } from '@/hooks/useBgm';
import { useChat } from '@/hooks/useChat';
import { useKeyPool } from '@/hooks/useKeyPool';
import { useStickerLibrary } from '@/hooks/useStickerLibrary';
import { usePortrait } from '@/hooks/usePortrait';
import { isConfigured } from '@/lib/keyPool';
import { loadTtsEnabled, saveTtsEnabled } from '@/lib/storage';
import { DEFAULT_PORTRAIT_SRC } from '@/lib/persona';
import type { ImportedBackup } from '@/lib/backup';

export default function App() {
  const { settings, updateSettings } = useSettings();
  const chat = useConversations(settings.maxStoredMessages);
  const speech = useSpeech(settings);
  const keyPool = useKeyPool();
  const stickers = useStickerLibrary();
  const portrait = usePortrait();
  const [ttsEnabled, setTtsEnabled] = useState(loadTtsEnabled);
  const avatarSrc = portrait.portraitUrl ?? DEFAULT_PORTRAIT_SRC;
  const bgm = useBgm({
    url: settings.bgmUrl,
    volume: settings.bgmVolume,
    loop: settings.bgmLoop,
    duck: settings.smartDucking,
    isSpeaking: speech.status === 'speaking',
  });
  const { send, stop, streaming, error, notice } = useChat({ settings, chat, speech, keyPool, ttsEnabled, refreshStickers: stickers.refresh });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [booted, setBooted] = useState(false);

  const configured = isConfigured(settings);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const handleBooted = useCallback(() => setBooted(true), []);

  const handleToggleTts = () => {
    const next = !ttsEnabled;
    if (!next) speech.stop();
    setTtsEnabled(next);
    saveTtsEnabled(next);
  };

  const handleNew = () => {
    if (!chat.activeConversation || chat.activeConversation.messages.length > 0) chat.createNew();
    setSidebarOpen(false);
  };

  const handleSelect = (id: string) => {
    chat.select(id);
    setSidebarOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('确定删除这个对话吗？删除后无法恢复。')) return;
    if (streaming?.conversationId === id) stop();
    chat.remove(id);
  };

  const handleImportBackup = (data: ImportedBackup) => {
    updateSettings(data.settings);
    chat.replaceStore(data.chat);
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden text-slate-800">
      {!booted && <LoadingScreen onDone={handleBooted} />}
      <AmbientBackground />
      <div className="flex h-full gap-3 p-3 md:gap-4 md:p-4">
        <ConversationSidebar
          conversations={chat.conversations}
          activeId={chat.activeId}
          avatarSrc={avatarSrc}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNew={handleNew}
          onSelect={handleSelect}
          onRename={chat.rename}
          onDelete={handleDelete}
          onOpenSettings={() => setDrawerOpen(true)}
        />
        <ChatWindow
          conversation={chat.activeConversation}
          avatarSrc={avatarSrc}
          configured={configured}
          streaming={streaming}
          chatError={error}
          speech={speech}
          stickers={stickers.library}
          onCollectSticker={stickers.addSticker}
          ttsEnabled={ttsEnabled}
          onToggleTts={handleToggleTts}
          onSend={send}
          onStop={stop}
          onOpenSettings={() => setDrawerOpen(true)}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />
      </div>
      <Toast message={notice} />
      <BgmWidget
        bgm={bgm}
        volume={settings.bgmVolume}
        loop={settings.bgmLoop}
        onVolumeChange={(bgmVolume) => updateSettings({ bgmVolume })}
        onLoopChange={(bgmLoop) => updateSettings({ bgmLoop })}
      />
      <ControlCenter
        open={drawerOpen}
        onClose={closeDrawer}
        settings={settings}
        updateSettings={updateSettings}
        chat={chat.store}
        onImportBackup={handleImportBackup}
        speech={speech}
        bgm={bgm}
        keyPool={keyPool}
        stickers={stickers}
        portrait={portrait}
      />
    </div>
  );
}
