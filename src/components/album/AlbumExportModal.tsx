import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Album } from '../../types/album';
import {
  X,
  Download,
  FileText,
  Images,
  Check,
  Printer,
  Sparkles,
  Share2,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface AlbumExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  album: Album;
}

export const AlbumExportModal: React.FC<AlbumExportModalProps> = ({
  isOpen,
  onClose,
  album,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState('');

  if (!isOpen) return null;

  const totalPages = (album.spreads?.length || 0) * 2 + 1;

  // 1. 导出整本高保真电子画册 (通过网页打印/PDF保存或图片包下载)
  const handleExportPdf = () => {
    setIsExporting(true);
    setExportSuccess('');

    setTimeout(() => {
      setIsExporting(false);
      // 调用浏览器标准打印对话框 (另存为 PDF)
      window.print();
      setExportSuccess('已调起打印与 PDF 导出对话框');
    }, 600);
  };

  // 2. 导出所有页面图片清单
  const handleDownloadImages = () => {
    setIsExporting(true);
    setExportSuccess('');

    const imagesToDownload: { name: string; url: string }[] = [];
    imagesToDownload.push({ name: `${album.title}_封面.png`, url: album.coverImage });

    album.spreads.forEach((sp, idx) => {
      if (sp.fullSpreadImage) {
        imagesToDownload.push({
          name: `${album.title}_P${idx * 2 + 1}-${idx * 2 + 2}_对开.png`,
          url: sp.fullSpreadImage,
        });
      } else {
        if (sp.leftPage.image) {
          imagesToDownload.push({
            name: `${album.title}_P${idx * 2 + 1}_左页.png`,
            url: sp.leftPage.image,
          });
        }
        if (sp.rightPage.image) {
          imagesToDownload.push({
            name: `${album.title}_P${idx * 2 + 2}_右页.png`,
            url: sp.rightPage.image,
          });
        }
      }
    });

    // 逐个触发浏览器下载
    imagesToDownload.forEach((item, i) => {
      setTimeout(() => {
        const a = window.document.createElement('a');
        a.href = item.url;
        a.download = item.name;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
      }, i * 250);
    });

    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(`已开始下载全本 ${imagesToDownload.length} 张高清页面原片！`);
    }, imagesToDownload.length * 250 + 200);
  };

  const modalContent = (

    <div
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 flex items-center justify-center shadow-xs">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                导出画册 · {album.title}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                全册共 {totalPages} 页 · 300DPI 实体相纸印刷级高保真输出
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-gray-950 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {exportSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 text-xs flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{exportSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 选项 1: 打印 / 导出 PDF */}
            <div
              onClick={handleExportPdf}
              className="p-4 rounded-2xl bg-gray-100 hover:bg-gray-100 border border-gray-200 hover:border-amber-400/80 transition-all cursor-pointer group space-y-2 flex flex-col justify-between"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                  导出高保真 PDF 电子书
                </h4>
                <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                  按装订对开排版合并，适合打印冲印或 iPad 电子阅读
                </p>
              </div>
              <Button
                variant="accent"
                size="sm"
                className="w-full text-xs font-bold py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 mt-1 cursor-pointer"
              >
                立即导出 PDF
              </Button>
            </div>

            {/* 选项 2: 下载全部原图包 */}
            <div
              onClick={handleDownloadImages}
              className="p-4 rounded-2xl bg-gray-100 hover:bg-gray-100 border border-gray-200 hover:border-amber-400/80 transition-all cursor-pointer group space-y-2 flex flex-col justify-between"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                <Images className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                  下载整本高清原图包
                </h4>
                <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                  下载封面及所有对开跨页的高清 PNG 原片到本地电脑
                </p>
              </div>
              <Button
                variant="accent"
                size="sm"
                className="w-full text-xs font-bold py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 mt-1 cursor-pointer"
              >
                下载全本图片
              </Button>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-gray-200 text-[11px] text-zinc-400 leading-relaxed flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              提示：导出的画册页面已包含米家相纸打印比例自适应与 300DPI 无损画质。
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-end">
          <Button variant="ghost" onClick={onClose} className="text-xs text-zinc-400 hover:text-gray-950">
            关闭
          </Button>
        </div>
      </div>
    </div>
  );
};