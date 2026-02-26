import { useState, useMemo, useEffect } from "react";
import { Calculator, DollarSign, Users, Monitor, Building2, Info, Globe, Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface Currency {
    code: string;
    symbol: string;
    label: string;
    rate: number; // relative to USD
}

const CURRENCIES: Currency[] = [
    { code: "USD", symbol: "$", label: "USD ($)", rate: 1 },
    { code: "GBP", symbol: "£", label: "GBP (£)", rate: 0.79 },
    { code: "INR", symbol: "₹", label: "INR (₹)", rate: 83.5 },
    { code: "EUR", symbol: "€", label: "EUR (€)", rate: 0.92 },
    { code: "AUD", symbol: "A$", label: "AUD (A$)", rate: 1.53 },
    { code: "CAD", symbol: "C$", label: "CAD (C$)", rate: 1.36 },
];

const PRICES_USD = {
    onlineSession: 1.8,
    offlineSession: 0.8,
    onlineSeat: 40,
    offlineSeat: 25,
    studentOnline: 5,
    studentOffline: 2,
};

function detectCurrency(): string {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
        const locale = navigator.language || "";
        if (tz.startsWith("Asia/Kolkata") || tz.startsWith("Asia/Calcutta") || locale.startsWith("hi") || locale === "en-IN") return "INR";
        if (tz.startsWith("Europe/London") || locale === "en-GB") return "GBP";
        if (tz.startsWith("Europe/") && !tz.startsWith("Europe/London")) return "EUR";
        if (tz.startsWith("Australia/") || locale === "en-AU") return "AUD";
        if (tz.startsWith("America/Toronto") || tz.startsWith("America/Vancouver") || locale === "en-CA") return "CAD";
    } catch { }
    return "USD";
}

interface InputRowProps {
    label: string;
    online: number;
    inPerson: number;
    onOnlineChange: (v: number) => void;
    onInPersonChange: (v: number) => void;
}

const InputRow = ({ label, online, inPerson, onOnlineChange, onInPersonChange }: InputRowProps) => {
    const handleChange = (setter: (v: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === "") { setter(0); return; }
        setter(Math.max(0, Number(raw)));
    };

    return (
        <div className="grid grid-cols-[1fr_110px_110px] sm:grid-cols-[1fr_120px_120px] gap-3 items-center py-3 border-b border-border/40 last:border-0">
            <Label className="text-sm text-foreground font-normal">{label}</Label>
            <Input
                type="number"
                min={0}
                value={online || ""}
                placeholder="0"
                onChange={handleChange(onOnlineChange)}
                className="text-center bg-muted border-border h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <Input
                type="number"
                min={0}
                value={inPerson || ""}
                placeholder="0"
                onChange={handleChange(onInPersonChange)}
                className="text-center bg-muted border-border h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
        </div>
    );
};

interface PlanCardProps {
    title: string;
    price: string;
    icon: React.ReactNode;
    description: string;
    highlighted?: boolean;
}

const PlanCard = ({ title, price, icon, description, highlighted }: PlanCardProps) => (
    <Card
        className={`relative transition-all duration-300 ${highlighted
            ? "bg-primary/10 border-2 border-primary shadow-[var(--shadow-glow)]"
            : "bg-card border-border hover:border-primary/30"
            }`}
    >
        {highlighted && (
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs">
                Popular
            </Badge>
        )}
        <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
                <h3 className="font-semibold text-foreground">{title}</h3>
            </div>
            <div className="mb-2">
                <span className="text-3xl font-bold text-foreground">{price}</span>
                <span className="text-muted-foreground text-sm ml-1">/ month</span>
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const PricingCalculator = () => {
    const [currencyCode, setCurrencyCode] = useState("USD");
    const [sessions1on1Online, setSessions1on1Online] = useState(0);
    const [sessions1on1InPerson, setSessions1on1InPerson] = useState(0);
    const [groupSessionsOnline, setGroupSessionsOnline] = useState(0);
    const [groupSessionsInPerson, setGroupSessionsInPerson] = useState(0);
    const [studentsPerGroupOnline, setStudentsPerGroupOnline] = useState(0);
    const [studentsPerGroupInPerson, setStudentsPerGroupInPerson] = useState(0);
    const [tutoringStaffOnline, setTutoringStaffOnline] = useState(0);
    const [tutoringStaffInPerson, setTutoringStaffInPerson] = useState(0);
    const [nonTutoringStaffOnline, setNonTutoringStaffOnline] = useState(0);
    const [nonTutoringStaffInPerson, setNonTutoringStaffInPerson] = useState(0);
    const [activeStudentsOnline, setActiveStudentsOnline] = useState(0);
    const [activeStudentsInPerson, setActiveStudentsInPerson] = useState(0);


    useEffect(() => {
        setCurrencyCode(detectCurrency());
    }, []);

    const currency = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];

    const formatPrice = (usdAmount: number) => {
        const converted = usdAmount * currency.rate;
        return `${currency.symbol}${converted.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
    };

    const formatUnitPrice = (usdAmount: number) => {
        const converted = usdAmount * currency.rate;
        return `${currency.symbol}${converted.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
    };

    const pricing = useMemo(() => {
        const totalOnlineSessions = sessions1on1Online + groupSessionsOnline;
        const totalInPersonSessions = sessions1on1InPerson + groupSessionsInPerson;
        const perSession =
            totalOnlineSessions * PRICES_USD.onlineSession +
            totalInPersonSessions * PRICES_USD.offlineSession;
        const perSeat =
            (tutoringStaffOnline + nonTutoringStaffOnline) * PRICES_USD.onlineSeat +
            (tutoringStaffInPerson + nonTutoringStaffInPerson) * PRICES_USD.offlineSeat;
        const perStudent =
            activeStudentsOnline * PRICES_USD.studentOnline +
            activeStudentsInPerson * PRICES_USD.studentOffline;
        return { perSession, perSeat, perStudent };
    }, [
        sessions1on1Online, sessions1on1InPerson,
        groupSessionsOnline, groupSessionsInPerson,
        tutoringStaffOnline, tutoringStaffInPerson,
        nonTutoringStaffOnline, nonTutoringStaffInPerson,
        activeStudentsOnline, activeStudentsInPerson,
    ]);

    const plans = useMemo(() => {
        const all = [
            { key: "session", title: "Per Session", price: pricing.perSession, icon: <DollarSign className="w-5 h-5" />, description: "Pay based on the total number of sessions conducted each month." },
            { key: "seat", title: "Per Seat", price: pricing.perSeat, icon: <Users className="w-5 h-5" />, description: "Pay based on the number of staff seats (tutoring + non-tutoring)." },
            { key: "student", title: "Per Student", price: pricing.perStudent, icon: <Users className="w-5 h-5" />, description: "Pay based on the total number of active students enrolled." },
        ].filter(p => p.price > 0);
        const minPrice = Math.min(...all.map(p => p.price));
        return all.map(p => ({ ...p, highlighted: p.price === minPrice }));
    }, [pricing]);

    const bestPlanUSD = plans.length > 0 ? Math.min(...plans.map(p => p.price)) : 0;

    return (
        <div className="min-h-screen bg-background py-12 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-0 gap-1.5 px-3 py-1">
                        <Calculator className="w-3.5 h-3.5" />
                        Pricing Calculator
                    </Badge>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                        Find the Right Plan for Your Business
                    </h1>
                    <p className="text-muted-foreground max-w-xl mx-auto text-sm">
                        Enter your tutoring business details below to see estimated costs across our flexible billing options.
                    </p>
                </div>

                {/* Currency Selector */}
                <div className="flex justify-end mb-6">
                    <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <Select value={currencyCode} onValueChange={setCurrencyCode}>
                            <SelectTrigger className="w-[140px] h-9 bg-card border-border text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CURRENCIES.map((c) => (
                                    <SelectItem key={c.code} value={c.code}>
                                        {c.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid lg:grid-cols-[1fr_260px] gap-6 mb-10">
                    {/* Calculator Inputs */}
                    <Card className="bg-card border-border">
                        <CardContent className="p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-1">Your Business Details</h2>
                            <p className="text-xs text-muted-foreground mb-5">Adjust the numbers to match your setup</p>

                            {/* Column Headers */}
                            <div className="grid grid-cols-[1fr_110px_110px] sm:grid-cols-[1fr_120px_120px] gap-3 mb-1">
                                <span />
                                <div className="flex items-center justify-center gap-1.5 text-sm font-semibold text-primary">
                                    <Monitor className="w-4 h-4" /> Online
                                </div>
                                <div className="flex items-center justify-center gap-1.5 text-sm font-semibold text-foreground">
                                    <Building2 className="w-4 h-4" /> In-person
                                </div>
                            </div>

                            <InputRow label="Number of 1:1 sessions" online={sessions1on1Online} inPerson={sessions1on1InPerson} onOnlineChange={setSessions1on1Online} onInPersonChange={setSessions1on1InPerson} />
                            <InputRow label="Number of group sessions" online={groupSessionsOnline} inPerson={groupSessionsInPerson} onOnlineChange={setGroupSessionsOnline} onInPersonChange={setGroupSessionsInPerson} />
                            <InputRow label="Students per group session" online={studentsPerGroupOnline} inPerson={studentsPerGroupInPerson} onOnlineChange={setStudentsPerGroupOnline} onInPersonChange={setStudentsPerGroupInPerson} />
                            <InputRow label="Total tutoring staff" online={tutoringStaffOnline} inPerson={tutoringStaffInPerson} onOnlineChange={setTutoringStaffOnline} onInPersonChange={setTutoringStaffInPerson} />
                            <InputRow label="Total non-tutoring staff" online={nonTutoringStaffOnline} inPerson={nonTutoringStaffInPerson} onOnlineChange={setNonTutoringStaffOnline} onInPersonChange={setNonTutoringStaffInPerson} />
                            <InputRow label="Total active students" online={activeStudentsOnline} inPerson={activeStudentsInPerson} onOnlineChange={setActiveStudentsOnline} onInPersonChange={setActiveStudentsInPerson} />
                        </CardContent>
                    </Card>

                    {/* Unit Prices */}
                    <Card className="bg-card border-border h-fit">
                        <CardContent className="p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-4">Unit Prices</h2>
                            <div className="space-y-0">
                                {[
                                    { label: "Online session", price: PRICES_USD.onlineSession },
                                    { label: "Offline session", price: PRICES_USD.offlineSession },
                                    { label: "Online seat", price: PRICES_USD.onlineSeat },
                                    { label: "Offline seat", price: PRICES_USD.offlineSeat },
                                    { label: "Student online", price: PRICES_USD.studentOnline },
                                    { label: "Student offline", price: PRICES_USD.studentOffline },
                                ].map((item, i, arr) => (
                                    <div key={item.label}>
                                        <div className="flex justify-between items-center py-2.5">
                                            <span className="text-sm text-foreground">{item.label}</span>
                                            <span className="text-sm font-semibold text-foreground">{formatUnitPrice(item.price)}</span>
                                        </div>
                                        {i < arr.length - 1 && <Separator className="bg-border/50" />}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Results */}
                {plans.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-foreground mb-6 text-center">Your Estimated Monthly Costs</h2>
                        <div className={`grid gap-5 ${plans.length === 1 ? 'max-w-sm mx-auto' : plans.length === 2 ? 'md:grid-cols-2 max-w-2xl mx-auto' : 'md:grid-cols-3'}`}>
                            {plans.map(p => (
                                <PlanCard
                                    key={p.key}
                                    title={p.title}
                                    price={formatPrice(p.price)}
                                    icon={p.icon}
                                    description={p.description}
                                    highlighted={p.highlighted}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Disclaimer */}
                <Alert className="bg-muted/50 border-border/60">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <AlertDescription className="text-xs text-muted-foreground">
                        These prices are indicative and for estimation purposes only. Actual prices may vary based on your specific requirements, usage patterns, and negotiated terms. Please <a href="https://www.wise.live" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">contact us</a> for a detailed quote.
                    </AlertDescription>
                </Alert>
                {/* Volume Discount Banner */}
                {bestPlanUSD > 500 && (
                    <Card className="mt-6 border-primary/30 bg-primary/5">
                        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
                            <div className="p-3 rounded-full bg-primary/10 shrink-0">
                                <Sparkles className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h3 className="font-semibold text-foreground mb-1">You're Eligible for Volume Discounts!</h3>
                                <p className="text-sm text-muted-foreground">Based on your usage, you qualify for special volume-based pricing. Talk to our team to get a customized quote.</p>
                            </div>
                            <Button asChild className="px-8 shrink-0">
                                <a href="https://www.wise.live/contact/" target="_blank" rel="noopener noreferrer">
                                    Talk to us
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default PricingCalculator;
