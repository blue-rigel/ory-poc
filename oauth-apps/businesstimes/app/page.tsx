import { auth } from "../auth";
import { LoginControl } from "./components/login-control";

const markets = [
  { name: "STI", value: "3,928.41", change: "+0.42%" },
  { name: "NIKKEI", value: "42,568.20", change: "+0.68%" },
  { name: "HANG SENG", value: "25,388.10", change: "-0.21%" },
  { name: "S&P 500", value: "6,584.29", change: "+0.31%" },
];

const sideStories = [
  { label: "COMPANIES & MARKETS", title: "Local firms chart new paths as investment activity picks up", art: "towers" },
  { label: "PROPERTY", title: "Prime office demand stays resilient amid changing work patterns", art: "facade" },
  { label: "STARTUPS & TECH", title: "Southeast Asia's founders focus on sustainable growth", art: "meeting" },
];

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></svg>;
}

function MenuIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h18M3 12h18M3 17h18"/></svg>;
}

export default async function Home() {
  const session = await auth();

  return (
    <>
      <header>
        <div className="utility"><div className="shell utility-inner"><span>Singapore</span><div><a href="#">Newsletters</a><a href="#">E-paper</a><button type="button">Subscribe</button></div></div></div>
        <div className="shell masthead">
          <button className="icon-button" type="button" aria-label="Open menu"><MenuIcon /></button>
          <a className="bt-logo" href="#" aria-label="The Business Times home"><span>THE BUSINESS TIMES</span><small>BUSINESS INTELLIGENCE FOR DECISION MAKERS</small></a>
          <div className="header-actions">
            <button className="icon-button" type="button" aria-label="Search"><SearchIcon /></button>
            {session?.user ? (
              <form action="/auth/logout" method="post">
                <span className="auth-user">{session.user.email ?? session.user.loginId ?? session.user.name}</span>
                <button className="login-button" name="mode" value="local" type="submit">Log out</button>
                <button className="login-button" name="mode" value="slo" type="submit">Single logout</button>
              </form>
            ) : (
              <LoginControl />
            )}
          </div>
        </div>
        <nav className="primary-nav"><div className="shell nav-scroll">{['Breaking', 'Singapore', 'International', 'Companies & Markets', 'Property', 'Startups & Tech', 'Opinion', 'Lifestyle', 'BT Luxe'].map((item) => <a href="#" key={item}>{item}</a>)}</div></nav>
      </header>

      <div className="ticker"><div className="shell ticker-inner"><strong>MARKETS</strong>{markets.map((market) => <div key={market.name}><span>{market.name}</span><b>{market.value}</b><em className={market.change.startsWith('-') ? 'down' : ''}>{market.change}</em></div>)}</div></div>

      <main className="shell">
        <div className="ad-space">ADVERTISEMENT</div>
        <div className="page-title"><h1>Top Stories</h1><p>Monday, September 14, 2026</p></div>
        <section className="hero-grid">
          <article className="hero-story">
            <div className="news-art harbour"><span>Markets</span></div>
            <p className="kicker">MARK TO MARKET</p>
            <h2>Singapore businesses enter the final quarter with renewed confidence</h2>
            <p className="dek">Stronger regional demand and steady investment are helping companies look beyond near-term uncertainty.</p>
            <p className="byline">By BT Newsroom</p>
          </article>
          <div className="side-stories">
            {sideStories.map((story) => <article key={story.title}><div className={`news-art ${story.art}`}><span>{story.label}</span></div><p className="kicker">{story.label}</p><h3>{story.title}</h3></article>)}
          </div>
          <aside className="breaking">
            <div className="aside-title"><h2>Breaking News</h2><span>LIVE</span></div>
            {['Asian shares rise as investors weigh latest economic data', 'Singapore dollar holds firm in early trade', 'Technology companies lead gains on the local bourse', 'Oil prices steady after a volatile week'].map((title, index) => <article key={title}><time>{String(8 + index).padStart(2, '0')}:{index % 2 ? '35' : '12'}</time><p>{title}</p></article>)}
            <a href="#">See all breaking news →</a>
          </aside>
        </section>

        <section className="latest-section">
          <div className="section-title"><h2>Companies & Markets</h2><a href="#">View more →</a></div>
          <div className="story-grid">
            {sideStories.map((story, index) => <article key={story.title}><div className={`news-art ${story.art}`}><span>{story.label}</span></div><p className="kicker">{story.label}</p><h3>{story.title}</h3><p>{['Investors are watching corporate earnings and regional expansion plans closely.', 'Premium developments continue to draw interest from occupiers and investors.', 'A more disciplined funding climate is creating stronger companies.'][index]}</p></article>)}
          </div>
        </section>
      </main>
      <footer><div className="shell footer-inner"><div className="bt-logo footer-logo"><span>THE BUSINESS TIMES</span><small>BUSINESS INTELLIGENCE FOR DECISION MAKERS</small></div><p>Local OAuth client demonstration. Authentication will be connected later.</p></div></footer>
    </>
  );
}
