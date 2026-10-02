"use client";
export default function ErrorPage({reset}:{error:Error;reset:()=>void}){return <main className="auth-card"><h1>Something didn’t connect.</h1><p>We couldn’t load this page. Please try again in a moment.</p><button className="button button-primary" onClick={reset}>Try again</button></main>}
