'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Share2, Facebook, Twitter, Linkedin, Link2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface SocialShareProps {
  title: string;
  url: string;
  locale: string;
}

export function SocialShare({ title, url, locale }: SocialShareProps) {
  const t = useTranslations('blog');
  const [isSharing, setIsSharing] = useState(false);

  const shareData = {
    title,
    url,
    text: title,
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        setIsSharing(true);
        await navigator.share(shareData);
      } catch (error) {
        // User cancelled or error occurred
      } finally {
        setIsSharing(false);
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('share.linkCopied'));
    } catch (error) {
      toast.error(t('share.linkCopyError'));
    }
  };

  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  };

  const openShareWindow = (shareUrl: string) => {
    window.open(
      shareUrl,
      'share',
      'width=600,height=400,scrollbars=yes,resizable=yes'
    );
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-medium text-muted-foreground">
        {t('share.title')}:
      </span>
      
      {/* Native Share (mobile) */}
      {navigator.share && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleNativeShare}
          disabled={isSharing}
          className="flex items-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          {t('share.share')}
        </Button>
      )}

      {/* Social Media Buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => openShareWindow(shareUrls.facebook)}
          className="flex items-center gap-2"
        >
          <Facebook className="h-4 w-4" />
          <span className="sr-only">Facebook</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => openShareWindow(shareUrls.twitter)}
          className="flex items-center gap-2"
        >
          <Twitter className="h-4 w-4" />
          <span className="sr-only">Twitter</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => openShareWindow(shareUrls.linkedin)}
          className="flex items-center gap-2"
        >
          <Linkedin className="h-4 w-4" />
          <span className="sr-only">LinkedIn</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="flex items-center gap-2"
        >
          <Link2 className="h-4 w-4" />
          <span className="sr-only">{t('share.copyLink')}</span>
        </Button>
      </div>
    </div>
  );
}