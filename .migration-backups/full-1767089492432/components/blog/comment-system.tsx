'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Send, User } from 'lucide-react';
import { toast } from 'sonner';

interface Comment {
  id: string;
  author: string;
  email: string;
  content: string;
  createdAt: string;
  isApproved: boolean;
}

interface CommentSystemProps {
  postId: string;
  locale: string;
  enabled?: boolean;
}

export function CommentSystem({ postId, locale, enabled = false }: CommentSystemProps) {
  const t = useTranslations('blog.comments');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    author: '',
    email: '',
    content: '',
  });

  // If comments are not enabled, don't render anything
  if (!enabled) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.author.trim() || !formData.email.trim() || !formData.content.trim()) {
      toast.error(t('validation.required'));
      return;
    }

    if (!formData.email.includes('@')) {
      toast.error(t('validation.invalidEmail'));
      return;
    }

    setIsSubmitting(true);

    try {
      // In a real implementation, this would submit to your API
      const response = await fetch('/api/blog/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          ...formData,
        }),
      });

      if (response.ok) {
        toast.success(t('submitSuccess'));
        setFormData({ author: '', email: '', content: '' });
        setShowForm(false);
        // In a real implementation, you might refresh the comments list
      } else {
        throw new Error('Failed to submit comment');
      }
    } catch (error) {
      toast.error(t('submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="mt-12">
      <Separator className="mb-8" />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-6 w-6" />
            {t('title')}
          </h3>
          
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              {t('addComment')}
            </Button>
          )}
        </div>

        {/* Comment Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <h4 className="text-lg font-semibold">{t('addComment')}</h4>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="author" className="block text-sm font-medium mb-2">
                      {t('form.name')} *
                    </label>
                    <Input
                      id="author"
                      type="text"
                      value={formData.author}
                      onChange={(e) => handleInputChange('author', e.target.value)}
                      placeholder={t('form.namePlaceholder')}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      {t('form.email')} *
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder={t('form.emailPlaceholder')}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="content" className="block text-sm font-medium mb-2">
                    {t('form.comment')} *
                  </label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder={t('form.commentPlaceholder')}
                    rows={4}
                    required
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {isSubmitting ? t('form.submitting') : t('form.submit')}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    {t('form.cancel')}
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {t('moderationNotice')}
                </p>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('noComments')}</p>
              <p className="text-sm">{t('beFirst')}</p>
            </div>
          ) : (
            comments.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{comment.author}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString(locale)}
                        </span>
                      </div>
                      
                      <p className="text-sm leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}