import React from 'react';

/**
 * Spectacular animated gradient background.
 *
 * Renders a fixed, full-screen animated gradient with three floating "blob"
 * glows behind all content. Colors are driven by CSS variables in index.css
 * (`--grad-*` and `--blob-*`), so the background adapts to both dark and light
 * themes — fixing the previous light-mode issue where the page stayed dark.
 */
const AnimatedBackground: React.FC = () => (
    <div className="animated-bg" aria-hidden="true">
        <div className="animated-bg__blob animated-bg__blob--1" />
        <div className="animated-bg__blob animated-bg__blob--2" />
        <div className="animated-bg__blob animated-bg__blob--3" />
    </div>
);

export default AnimatedBackground;
