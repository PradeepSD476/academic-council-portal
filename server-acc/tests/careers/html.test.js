import { describe, it, expect } from 'vitest';
import { htmlToText, decodeEntities } from '../../services/careers/text/html.js';

describe('htmlToText', () => {
    it('keeps block structure as line breaks and bullets list items', () => {
        const html = '<h2>About</h2><p>We build <b>robots</b>.</p><ul><li>Python</li><li>React</li></ul>';
        expect(htmlToText(html)).toBe('About\nWe build robots.\n- Python\n- React');
    });
    it('drops scripts, styles and navigation', () => {
        const html = '<nav>Home | Jobs</nav><script>alert(1)</script><style>p{}</style><p>Role details</p><footer>© 2026</footer>';
        expect(htmlToText(html)).toBe('Role details');
    });
    it('decodes entity-escaped HTML (Greenhouse style) when asked', () => {
        const escaped = '&lt;p&gt;Stipend: &amp;#8377;40,000&lt;/p&gt;&lt;p&gt;Hybrid&lt;/p&gt;';
        expect(htmlToText(escaped, { escaped: true })).toBe('Stipend: ₹40,000\nHybrid');
    });
    it('prefers <main> for full pages', () => {
        const page = '<body><div class="menu">Careers Blog Contact</div><main><h1>SDE Intern</h1><p>Bengaluru</p></main></body>';
        expect(htmlToText(page, { preferMain: true })).toBe('SDE Intern\nBengaluru');
    });
    it('collapses whitespace and non-breaking spaces', () => {
        expect(htmlToText('<p>Work&nbsp;&nbsp;mode:   remote\t</p>')).toBe('Work mode: remote');
    });
    it('returns empty string for empty input', () => {
        expect(htmlToText('')).toBe('');
        expect(htmlToText(null)).toBe('');
    });
});

describe('decodeEntities', () => {
    it('decodes named and numeric entities', () => {
        expect(decodeEntities('&lt;b&gt;R&amp;D&lt;/b&gt; &#8377;')).toBe('<b>R&D</b> ₹');
    });
});
