import { useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { compressImageToDataUrl } from '@/lib/imageFile';
import { clearReferenceImage, loadReferenceImage, saveReferenceImage } from '@/lib/storage';
import { REFERENCE_IMAGE_MODEL } from '@/lib/imageGeneration';
import { errorMessage } from '@/lib/errors';
import { buttonClass } from '@/components/control/ui';

export function ReferenceImageField() {
  const [dataUrl, setDataUrl] = useState<string | null>(loadReferenceImage);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }
    try {
      const next = await compressImageToDataUrl(file);
      if (!saveReferenceImage(next)) {
        setError('浏览器存储空间不足，请换一张更小的图片');
        return;
      }
      setDataUrl(next);
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const handleRemove = () => {
    clearReferenceImage();
    setDataUrl(null);
    setError(null);
  };

  return (
    <div className="space-y-2 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white">
          {dataUrl ? (
            <img src={dataUrl} alt="GREAK 角色参考图" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[11px] text-slate-400">未上传</span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-xs font-medium text-slate-700">角色形象参考图</p>
          <div className="flex gap-2">
            <label className={`${buttonClass} flex-1 cursor-pointer px-2 py-2 text-xs`}>
              <ImagePlus className="h-3.5 w-3.5" />
              {dataUrl ? '更换' : '上传'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) void handleUpload(file);
                }}
              />
            </label>
            {dataUrl && (
              <button type="button" onClick={handleRemove} aria-label="移除角色参考图" className={`${buttonClass} px-2 py-2`}>
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
              </button>
            )}
          </div>
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-slate-500">
        上传 GREAK 的参考图，AI 生图时将通过图生图锁定她的样貌。设置参考图后，生图会自动改用 {REFERENCE_IMAGE_MODEL} 模型。
      </p>
      {error && (
        <p role="alert" className="text-xs text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
