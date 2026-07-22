import { Outlet } from "react-router-dom";
import { SiteFooter } from "@/landing/components/SiteFooter";
import { DemoDrawer } from "@/landing/components/DemoDrawer";
import { SalesDrawer } from "@/landing/components/SalesDrawer";
import "@/landing/styles/landing-marketing.css";

type MarketingShellProps = {
  noFooter?: boolean;
};

export function MarketingShell({ noFooter = false }: MarketingShellProps) {
  return (
    <div className="landing-marketing">
      <Outlet />
      {!noFooter && <SiteFooter />}
      <DemoDrawer />
      <SalesDrawer />
    </div>
  );
}
