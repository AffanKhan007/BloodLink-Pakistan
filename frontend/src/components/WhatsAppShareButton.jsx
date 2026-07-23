import { useTranslation } from 'react-i18next';
import { Share2 } from 'lucide-react';

export default function WhatsAppShareButton({ bloodGroup, city }) {
  const { t } = useTranslation();
  
  const message = t('share.whatsappMessage', { bloodGroup, city });
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-share-btn"
      title={t('share.shareOnWhatsApp')}
    >
      <Share2 size={14} />
      {t('share.shareOnWhatsApp')}
    </a>
  );
}
