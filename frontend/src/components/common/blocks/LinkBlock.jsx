/**
 * LinkBlock - بلوک لینک‌ها با آیکون‌های SVG
 */

import { useState } from 'react';
import { LinkIcon, CloseIcon, PlusIcon } from './BlockIcons';

function LinkBlock({ block, editable, onChange, onRemove }) {
    const [links, setLinks] = useState(block.value || []);
    const [inputUrl, setInputUrl] = useState('');
    const [inputTitle, setInputTitle] = useState('');

    const updateLinks = (newLinks) => {
        setLinks(newLinks);
        onChange({ value: newLinks });
    };

    const addLink = () => {
        if (!inputUrl.trim()) return;

        let url = inputUrl.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        const title = inputTitle.trim() || extractDomain(url);
        updateLinks([...links, { url, title }]);
        setInputUrl('');
        setInputTitle('');
    };

    const removeLink = (index) => {
        updateLinks(links.filter((_, i) => i !== index));
    };

    const extractDomain = (url) => {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return url;
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addLink();
        }
    };

    const getIconForUrl = (url) => {
        try {
            const domain = extractDomain(url);
            if (domain.includes('github')) return { icon: '💻', color: '#333' };
            if (domain.includes('linkedin')) return { icon: '💼', color: '#0077b5' };
            if (domain.includes('twitter') || domain.includes('x.com')) return { icon: '𝕏', color: '#1da1f2' };
            if (domain.includes('instagram')) return { icon: '📸', color: '#e4405f' };
            if (domain.includes('youtube')) return { icon: '▶️', color: '#ff0000' };
            if (domain.includes('figma')) return { icon: '🎨', color: '#f24e1e' };
            if (domain.includes('notion')) return { icon: '📝', color: '#000' };
            if (domain.includes('dribbble')) return { icon: '🏀', color: '#ea4c89' };
            return { icon: '🔗', color: '#6366f1' };
        } catch {
            return { icon: '🔗', color: '#6366f1' };
        }
    };

    return (
        <div className="block block--link-pro">
            <div className="block__header">
                <span className="block__icon block__icon--svg">
                    <LinkIcon />
                </span>
                <input
                    className="block__name"
                    value={block.name}
                    onChange={(e) => onChange({ name: e.target.value })}
                    disabled={!editable}
                />
                {links.length > 0 && (
                    <span className="link-pro__count">{links.length}</span>
                )}
                {editable && (
                    <button type="button" className="block__remove" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}>
                        <CloseIcon />
                    </button>
                )}
            </div>

            <div className="link-pro__list">
                {links.map((link, index) => {
                    const { icon } = getIconForUrl(link.url);
                    return (
                        <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link-pro__item"
                        >
                            <span className="link-pro__item-icon">{icon}</span>
                            <div className="link-pro__item-info">
                                <span className="link-pro__item-title">{link.title}</span>
                                <span className="link-pro__item-url">{extractDomain(link.url)}</span>
                            </div>
                            {editable && (
                                <button
                                    type="button"
                                    className="link-pro__item-remove"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeLink(index); }}
                                >
                                    <CloseIcon />
                                </button>
                            )}
                        </a>
                    );
                })}
            </div>

            {editable && (
                <div className="link-pro__add">
                    <input
                        type="text"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="آدرس لینک..."
                        className="link-pro__add-url"
                    />
                    <input
                        type="text"
                        value={inputTitle}
                        onChange={(e) => setInputTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="عنوان"
                        className="link-pro__add-title"
                    />
                    <button type="button" className="link-pro__add-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); addLink(); }}>
                        <PlusIcon />
                    </button>
                </div>
            )}
        </div>
    );
}

export default LinkBlock;
