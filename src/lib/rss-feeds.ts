// The news page's RSS feeds, grouped by topic. The news page reads every
// feed; the scheduled news roundups (functions/src/news-post.ts) each read
// their topic's feeds. The functions keep a copy of this file, made by
// functions/scripts/copy-shared.mjs when they build, so it must not import
// anything.

/**
 * Feeds whose posts are pinned to the top of the news page, above the rest
 * (the brief still takes the newest posts from every feed)
 */
export const featuredFeeds = [
    'https://www.freecodecamp.org/news/rss/',
    'https://pluralistic.net/feed/',
    'https://craphound.com/feed/',
];

/** Feeds for each scheduled roundup topic (see src/lib/post-topics.ts) */
export const feedsByTopic = {
    hardware: [
        'https://spectrum.ieee.org/feeds/feed.rss',
        'https://spectrum.ieee.org/feeds/topic/robotics.rss',
        'https://www.therobotreport.com/feed/',
        'https://hackaday.com/blog/feed/',
        'https://www.raspberrypi.com/news/feed/',
        'https://www.servethehome.com/feed/',
        'https://www.tomshardware.com/feeds.xml',
    ],
    software: [
        'https://www.infoworld.com/feed/',
        'https://www.infoworld.com/security/feed/',
        'https://www.wired.com/feed/category/security/latest/rss',
        'https://www.securityweek.com/feed/',
        'https://krebsonsecurity.com/feed/',
        'https://www.bleepingcomputer.com/feed/',
        // Hacker magazines (Phrack and Hakin9 have no feed)
        'https://feeds.feedburner.com/TheHackersNews',
        'https://www.hackercoolmagazine.com/feed/',
        'https://cybersecurityventures.com/feed/',
        'https://www.2600.com/rss.xml',
        'https://www.hackthissite.org/pages/hts.rss.php',
        'https://www.wiz.io/feed/rss.xml',
        'https://cprss.s3.amazonaws.com/javascriptweekly.com.xml',
        'https://react.dev/rss.xml',
        'https://peps.python.org/peps.rss',
        'https://blog.python.org/feeds/posts/default?alt=rss',
        'https://nodejs.org/en/feed/blog.xml',
        'https://gamemaker.io/en/blog/rss',
        'https://isocpp.org/blog/rss',
        'https://www.lua.org/news.rss',
        'https://www.theregister.com/headlines.atom',
        'https://feeds.arstechnica.com/arstechnica/technology-lab',
    ],
    crypto: [
        'https://www.theblock.co/rss.xml?feed=news.xml',
        'https://www.coindesk.com/arc/outboundfeeds/rss',
        'https://www.web3isgoinggreat.com/feed.xml',
        'https://decrypt.co/feed',
        'https://bitcoinist.com/feed/',
        'https://coincentral.com/feed/',
        'https://blockworks.co/feed',
        'https://nypost.com/cryptocurrency/feed/',
        'https://cryptonews.com/feed/',
        'https://s3.coinmarketcap.com/generated/rss/alexandria/articles.xml',
        'https://cryptoslate.com/feed/',
        'https://coinjournal.net/feed/',
        'https://coinpedia.org/feed/',
    ],
    business: [
        'https://www.wired.com/feed/category/business/latest/rss',
        'https://www.forbes.com/innovation/feed2/',
        'https://feeds.content.dowjones.io/public/rss/RSSWSJD',
        'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=19854910',
        'https://techcrunch.com/feed/',
        'https://www.fastcompany.com/technology/rss',
    ],
    marketing: [
        'https://moz.com/feeds/blog.rss',
        'https://neilpatel.com/feed/',
        'https://ahrefs.com/blog/feed/',
        'https://www.marketingweek.com/feed/',
        'https://blog.hubspot.com/marketing/rss.xml',
        'https://martech.org/feed/',
        'https://www.socialmediaexaminer.com/feed/',
    ],
    sales: [
        'https://www.tomferry.com/feed/',
        'https://blog.hubspot.com/sales/rss.xml',
        'https://www.salesforce.com/blog/feed/',
        'https://salesgravy.com/feed/',
    ],
    opensource: [
        'https://www.eff.org/rss/updates.xml',
        'https://itsfoss.com/rss/',
        'https://pyfound.blogspot.com/feeds/posts/default?alt=rss',
        'https://github.blog/open-source/feed/',
        'https://lwn.net/headlines/rss',
        'https://opensource.org/feed/',
        'https://www.linuxfoundation.org/blog/rss.xml',
        'https://www.cncf.io/feed/',
        'https://opensource.googleblog.com/feeds/posts/default',
        'https://blog.mozilla.org/en/feed/',
        'https://static.fsf.org/fsforg/rss/news.xml',
        'https://nonprofitquarterly.org/feed/',
        'https://www.nten.org/feed',
    ],
};

/** Feeds the news page shows that no roundup topic uses */
const otherFeeds = [
    ...featuredFeeds,

    // Official w3Develops Feeds - The "Easy" ones with public RSS
    'https://mastodon.social/@w3develops.rss',
    'https://medium.com/feed/w3develops',
    'https://www.reddit.com/r/w3Develops/.rss',
    'https://bsky.app/profile/w3develops.bsky.social/rss',

    // General tech
    'https://www.wired.com/feed/tag/ai/latest/rss',
    'https://www.techradar.com/rss',
    'https://www.theverge.com/rss/index.xml',
    'https://feeds.npr.org/1019/rss.xml',
    'https://moxie.foxnews.com/google-publisher/tech.xml',
    'https://www.sify.com/category/technology/feed/',
    'https://www.python.org/jobs/feed/rss/',
    'https://news.mit.edu/rss/feed',
    'https://rss.slashdot.org/Slashdot/slashdot',
    'https://gizmodo.com/latest/feed',
    'https://news.ycombinator.com/rss',
    'https://hackernoon.com/feed',
    'https://future.forem.com/feed',
];

/** Publisher names for feeds whose own title doesn't say who they are */
export const feedNames: Record<string, string> = {
    'https://hackaday.com/blog/feed/': 'Hackaday',
    'https://www.techradar.com/rss': 'TechRadar',
    'https://www.tomshardware.com/feeds.xml': "Tom's Hardware",
    'https://www.wired.com/feed/category/security/latest/rss': 'Wired',
    'https://www.wired.com/feed/category/business/latest/rss': 'Wired',
    'https://www.wired.com/feed/tag/ai/latest/rss': 'Wired',
    'https://www.theregister.com/headlines.atom': 'The Register',
    'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=19854910': 'CNBC',
    'https://blog.hubspot.com/marketing/rss.xml': 'HubSpot',
    'https://blog.hubspot.com/sales/rss.xml': 'HubSpot',
    'https://www.eff.org/rss/updates.xml': 'EFF',
};

/** Every feed the news page reads */
export const rssFeeds = [...new Set([...otherFeeds, ...Object.values(feedsByTopic).flat()])];
