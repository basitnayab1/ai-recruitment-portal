import { getFeaturedJobs, getLandingStats } from "@/lib/public/landing-data";
import { getLandingAuthState } from "@/lib/public/landing-auth";
import { SiteHeader } from "@/components/landing/site-header";
import { Hero } from "@/components/landing/hero";
import { StatsSection } from "@/components/landing/stats-section";
import { FeaturedJobs } from "@/components/landing/featured-jobs";
import { WhyChooseUs } from "@/components/landing/why-choose-us";
import { HowItWorks } from "@/components/landing/how-it-works";
import { TopCompanies } from "@/components/landing/top-companies";
import { Testimonials } from "@/components/landing/testimonials";
import { FAQ } from "@/components/landing/faq";
import { FinalCTA } from "@/components/landing/final-cta";
import { SiteFooter } from "@/components/landing/site-footer";

export default async function Home() {
  const [jobs, stats, auth] = await Promise.all([
    getFeaturedJobs(),
    getLandingStats(),
    getLandingAuthState(),
  ]);

  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-black">
      <SiteHeader />
      <main className="flex-1">
        <Hero auth={auth} />
        <StatsSection stats={stats} />
        <FeaturedJobs jobs={jobs} />
        <WhyChooseUs />
        <HowItWorks />
        <TopCompanies />
        <Testimonials />
        <FAQ />
        <FinalCTA auth={auth} />
      </main>
      <SiteFooter />
    </div>
  );
}
