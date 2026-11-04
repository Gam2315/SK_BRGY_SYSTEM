import { Suspense } from "react";
import PublicLandingPage from "@/components/public-landing-page";
import LandingAuthLink, {
  LandingAuthLinkFallback,
} from "@/components/landing-auth-link";

export default function HomePage() {
  return (
    <PublicLandingPage
      headerAuthLink={
        <Suspense fallback={<LandingAuthLinkFallback placement="header" />}>
          <LandingAuthLink placement="header" />
        </Suspense>
      }
      aboutAuthLink={
        <Suspense fallback={<LandingAuthLinkFallback placement="about" />}>
          <LandingAuthLink placement="about" />
        </Suspense>
      }
    />
  );
}
