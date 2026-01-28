import { useEffect } from 'react';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
}

const SEO = ({ title, description, keywords }: SEOProps) => {
    useEffect(() => {
        // Actualizar Título
        const baseTitle = 'ThePlayer.gg - Ranking Oficial de TCG en Chile';
        document.title = title ? `${title} | ThePlayer.gg` : baseTitle;

        // Actualizar Meta Description
        if (description) {
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                metaDescription.setAttribute('content', description);
            }
        }

        // Actualizar Meta Keywords
        if (keywords) {
            const metaKeywords = document.querySelector('meta[name="keywords"]');
            if (metaKeywords) {
                metaKeywords.setAttribute('content', keywords);
            }
        }

        // Actualizar OG Title
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) {
            ogTitle.setAttribute('content', title ? `${title} | ThePlayer.gg` : 'ThePlayer.gg');
        }
    }, [title, description, keywords]);

    return null;
};

export default SEO;
