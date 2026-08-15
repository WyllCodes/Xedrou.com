import React, { useState } from "react";
import { Sparkles, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import PaymentModal from "@/components/app/PaymentModal";

const PLANS = [
  {
    id: "free",
    label: "Free",
    price: 0,
    usd: 0,
    uses: 1,
    icon: <Sparkles className="w-5 h-5 text-muted-foreground" />,
    color: "border-border",
    description: "1 AI generation total",
  },
  {
    id: "starter",
    label: "Starter",
    price: 24750,
    usd: 15,
    uses: 5,
    icon: <Zap className="w-5 h-5 text-blue-400" />,
    color: "border-blue-500",
    description: "5 song generations / month",
    popular: true,
  },
  {
    id: "pro",
    label: "Pro",
    price: 165000,
    usd: 100,
    uses: Infinity,
    icon: <Crown className="w-5 h-5 text-yellow-400" />,
    color: "border-yellow-500",
    description: "Unlimited songs / year",
  },
];

export default function AIPlanGate({ children }) {
  const [plan, setPlan] = useState(() => localStorage.getItem("xedruo_ai_plan") || "free");
  const [usesLeft, setUsesLeft] = useState(() => {
    const stored = localStorage.getItem("xedruo_ai_uses");
    return stored !== null ? Number(stored) : PLANS.find(p => p.id === "free").uses;
  });
  const [showPlans, setShowPlans] = useState(false);
  const [payTarget, setPayTarget] = useState(null);

  const currentPlan = PLANS.find(p => p.id === plan);
  const isLimited = currentPlan.uses !== Infinity;

  const consume = () => {
    if (isLimited) {
      const next = usesLeft - 1;
      setUsesLeft(next);
      localStorage.setItem("xedruo_ai_uses", next);
    }
  };

  const canUse = !isLimited || usesLeft > 0;

  const handleUpgrade = (p) => {
    setPayTarget(p);
  };

  const handlePaySuccess = () => {
    setPlan(payTarget.id);
    const uses = payTarget.uses === Infinity ? Infinity : payTarget.uses;
    setUsesLeft(uses);
    localStorage.setItem("xedruo_ai_plan", payTarget.id);
    localStorage.setItem("xedruo_ai_uses", uses === Infinity ? "inf" : uses);
    setPayTarget(null);
    setShowPlans(false);
  };

  if (showPlans) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8">
        <h2 className="text-xl font-bold mb-1">Choose your AI Plan</h2>
        <p className="text-muted-foreground text-sm mb-6">Unlock more AI generations for your creative workflow.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {PLANS.map(p => (
            <div key={p.id} className={`rounded-xl border-2 ${p.color} bg-background p-5 flex flex-col gap-3 relative`}>
              {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] bg-blue-500 text-white px-3 py-0.5 rounded-full font-semibold">Most Popular</span>}
              <div className="flex items-center gap-2">{p.icon}<span className="font-bold">{p.label}</span></div>
              <div className="text-2xl font-bold">{p.usd === 0 ? "Free" : `$${p.usd}`}<span className="text-sm font-normal text-muted-foreground">{p.usd === 100 ? "/yr" : p.usd === 30 ? "/mo" : ""}</span></div>
              <p className="text-sm text-muted-foreground">{p.description}</p>
              {plan === p.id ? (
                <Button variant="outline" disabled className="mt-auto">Current Plan</Button>
              ) : (
                <Button className="mt-auto" onClick={() => p.usd === 0 ? null : handleUpgrade(p)} disabled={p.usd === 0}>
                  {p.usd === 0 ? "Free" : `Upgrade — $${p.usd}`}
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button variant="ghost" className="mt-4" onClick={() => setShowPlans(false)}>← Back</Button>

        {payTarget && (
          <PaymentModal
            open={!!payTarget}
            onOpenChange={(v) => { if (!v) setPayTarget(null); }}
            planName={`AI ${payTarget.label}`}
            priceNGN={payTarget.price}
            priceUSD={payTarget.usd}
            onSuccess={handlePaySuccess}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Usage bar */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2 text-sm">
          {currentPlan.icon}
          <span className="font-medium">{currentPlan.label} Plan</span>
          {isLimited && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${usesLeft === 0 ? "bg-red-500/20 text-red-400" : "bg-muted text-muted-foreground"}`}>
              {usesLeft} use{usesLeft !== 1 ? "s" : ""} left
            </span>
          )}
          {!isLimited && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">Unlimited</span>}
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowPlans(true)}>Upgrade Plan</Button>
      </div>

      {!canUse ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center">
          <p className="font-semibold text-lg mb-2">You've used all your AI generations</p>
          <p className="text-muted-foreground text-sm mb-4">Upgrade to Starter ($15/mo) for 5 songs or Pro ($100/yr) for unlimited creations.</p>
          <Button onClick={() => setShowPlans(true)}><Zap className="w-4 h-4 mr-2" />Upgrade Now</Button>
        </div>
      ) : (
        React.cloneElement(children, { onConsume: consume })
      )}
    </div>
  );
}