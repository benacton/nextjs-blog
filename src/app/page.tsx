import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Next.js Blog</title>
        <meta name="description" content="A beautiful blog with a gradient background" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="gradientBackground">
        <main className="container">
          <h1 className="title">Welcome to My Blog</h1>
          <p className="description">
            This is NextJS Blog website.
          </p>
        </main>
      </div>
    </>
  );
}
