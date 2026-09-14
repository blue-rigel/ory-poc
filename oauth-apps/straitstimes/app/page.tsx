import { auth, signIn, signOut } from "../auth";

const stories = [
  {
    section: "Singapore",
    title: "New digital services make everyday tasks simpler for residents",
    summary: "A refreshed national platform brings essential services together in one secure place.",
    image: "city",
  },
  {
    section: "Asia",
    title: "Regional leaders set out priorities for a more connected future",
    image: "harbour",
  },
  {
    section: "Business",
    title: "Singapore firms are finding fresh opportunities across the region",
    image: "office",
  },
];

const latest = [
  "Morning Briefing: Top stories to start your day",
  "Public transport network adds more peak-hour services",
  "Young Singaporeans turn neighbourhood ideas into new ventures",
  "Weekend guide: Exhibitions, walks and food worth discovering",
];

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export default async function Home() {
  const session = await auth();

  return (
    <>
      <div className="edition-bar">
        <div className="shell edition-inner">
          <span>Singapore</span>
          <div><a href="#">E-paper</a><a href="#">Newsletters</a><button type="button">Subscribe</button></div>
        </div>
      </div>

      <header>
        <div className="shell masthead">
          <button className="icon-button" type="button" aria-label="Open menu"><MenuIcon /></button>
          <a className="st-logo" href="#" aria-label="The Straits Times home">
            <span className="st-mark">ST</span>
            <span className="st-name">THE STRAITS TIMES</span>
          </a>
          <div className="header-actions">
            <button className="icon-button" type="button" aria-label="Search"><SearchIcon /></button>
            {session?.user ? (
              <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
                <span className="auth-user">{session.user.name ?? session.user.email}</span>
                <button className="login-button" type="submit">Log out</button>
              </form>
            ) : (
              <form action={async () => { "use server"; await signIn("ory", { redirectTo: "/" }); }}>
                <button className="login-button" type="submit">Log in</button>
              </form>
            )}
          </div>
        </div>
        <nav className="main-nav" aria-label="Main navigation">
          <div className="shell nav-scroll">
            {['Singapore', 'Asia', 'World', 'Opinion', 'Life', 'Business', 'Sport', 'Visual', 'Podcasts'].map((item) => <a href="#" key={item}>{item}</a>)}
          </div>
        </nav>
      </header>

      <main className="shell">
        <div className="ad-space">ADVERTISEMENT</div>
        <div className="topic-row"><strong>Trending</strong><span>Singapore</span><span>Technology</span><span>Climate change</span><span>Property</span></div>

        <section className="top-stories">
          <div className="section-heading"><h1>Top Stories</h1><span>Monday, September 14</span></div>
          <div className="lead-grid">
            <article className="lead-story">
              <div className="news-image city"><span>Singapore skyline</span></div>
              <p className="eyebrow">SINGAPORE</p>
              <h2>A city moving forward: New plans put people and communities first</h2>
              <p className="summary">Neighbourhoods will become greener and better connected as Singapore prepares for the decade ahead.</p>
            </article>
            <div className="secondary-stories">
              {stories.slice(1).map((story) => (
                <article key={story.title}>
                  <div className={`news-image ${story.image}`}><span>{story.section}</span></div>
                  <p className="eyebrow">{story.section.toUpperCase()}</p>
                  <h3>{story.title}</h3>
                </article>
              ))}
            </div>
            <aside className="latest">
              <h2>Latest</h2>
              {latest.map((item, index) => (
                <article key={item}><time>{index + 8}:0{index + 1} AM</time><h3>{item}</h3></article>
              ))}
              <a href="#">View all latest news <span>→</span></a>
            </aside>
          </div>
        </section>

        <section className="more-news">
          <div className="section-heading"><h2>Singapore</h2><a href="#">More stories →</a></div>
          <div className="card-grid">
            {stories.map((story) => (
              <article key={story.title}>
                <div className={`news-image ${story.image}`}><span>{story.section}</span></div>
                <p className="eyebrow">{story.section.toUpperCase()}</p>
                <h3>{story.title}</h3>
                {story.summary && <p>{story.summary}</p>}
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer><div className="shell"><span className="footer-logo">THE STRAITS TIMES</span><p>Local OAuth client demonstration. Sign-in will be connected later.</p></div></footer>
    </>
  );
}
