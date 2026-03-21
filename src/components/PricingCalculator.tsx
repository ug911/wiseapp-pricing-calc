import { useState, useMemo, useEffect } from "react";
import {
    Calculator, DollarSign, Monitor, Building2, Info,
    Globe, Sparkles, UserCog, GraduationCap, RotateCcw,
} from "lucide-react";
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
    rate: number;
}

const CURRENCIES: Currency[] = [
    { code: "USD", symbol: "$", label: "USD ($)", rate: 1 },
    { code: "GBP", symbol: "£", label: "GBP (£)", rate: 0.74 },
    { code: "INR", symbol: "₹", label: "INR (₹)", rate: 90 },
    { code: "EUR", symbol: "€", label: "EUR (€)", rate: 0.85 },
    { code: "AUD", symbol: "A$", label: "AUD (A$)", rate: 1.4 },
    { code: "CAD", symbol: "C$", label: "CAD (C$)", rate: 1.37 },
];

const PRICES_USD = {
    onlineSession: 1.8,
    offlineSession: 0.8,
    onlineSeat: 45,
    offlineSeat: 25,
    studentOnline: 5,
    studentOffline: 2,
};

type InputState = {
    sessions1on1Online: number;
    sessions1on1InPerson: number;
    groupSessionsOnline: number;
    groupSessionsInPerson: number;
    studentsPerGroupOnline: number;
    studentsPerGroupInPerson: number;
    tutoringStaffOnline: number;
    tutoringStaffInPerson: number;
    nonTutoringStaffOnline: number;
    nonTutoringStaffInPerson: number;
    activeStudentsOnline: number;
    activeStudentsInPerson: number;
};

const EMPTY_STATE: InputState = {
    sessions1on1Online: 0, sessions1on1InPerson: 0,
    groupSessionsOnline: 0, groupSessionsInPerson: 0,
    studentsPerGroupOnline: 0, studentsPerGroupInPerson: 0,
    tutoringStaffOnline: 0, tutoringStaffInPerson: 0,
    nonTutoringStaffOnline: 0, nonTutoringStaffInPerson: 0,
    activeStudentsOnline: 0, activeStudentsInPerson: 0,
};

const PRESETS: Array<{ key: string; label: string; description: string; values: InputState }> = [
    {
        key: "online-only",
        label: "Online Only",
        description: "Mid-size org, fully online delivery",
        values: {
            sessions1on1Online: 100, sessions1on1InPerson: 0,
            groupSessionsOnline: 30, groupSessionsInPerson: 0,
            studentsPerGroupOnline: 3, studentsPerGroupInPerson: 0,
            tutoringStaffOnline: 5, tutoringStaffInPerson: 0,
            nonTutoringStaffOnline: 1, nonTutoringStaffInPerson: 0,
            activeStudentsOnline: 75, activeStudentsInPerson: 0,
        },
    },
    {
        key: "hybrid",
        label: "Hybrid",
        description: "Mid-size org, online and in-person",
        values: {
            sessions1on1Online: 100, sessions1on1InPerson: 50,
            groupSessionsOnline: 30, groupSessionsInPerson: 20,
            studentsPerGroupOnline: 2, studentsPerGroupInPerson: 2,
            tutoringStaffOnline: 5, tutoringStaffInPerson: 3,
            nonTutoringStaffOnline: 1, nonTutoringStaffInPerson: 1,
            activeStudentsOnline: 75, activeStudentsInPerson: 25,
        },
    },
    {
        key: "inperson-only",
        label: "In-person Only",
        description: "Mid-size org, fully in-person delivery",
        values: {
            sessions1on1Online: 0, sessions1on1InPerson: 100,
            groupSessionsOnline: 0, groupSessionsInPerson: 30,
            studentsPerGroupOnline: 0, studentsPerGroupInPerson: 3,
            tutoringStaffOnline: 0, tutoringStaffInPerson: 5,
            nonTutoringStaffOnline: 0, nonTutoringStaffInPerson: 1,
            activeStudentsOnline: 0, activeStudentsInPerson: 90,
        },
    },
    {
        key: "online-1on1",
        label: "Online 1:1",
        description: "Mid-size org, online 1:1 sessions only",
        values: {
            sessions1on1Online: 100, sessions1on1InPerson: 0,
            groupSessionsOnline: 0, groupSessionsInPerson: 0,
            studentsPerGroupOnline: 0, studentsPerGroupInPerson: 0,
            tutoringStaffOnline: 4, tutoringStaffInPerson: 0,
            nonTutoringStaffOnline: 1, nonTutoringStaffInPerson: 0,
            activeStudentsOnline: 40, activeStudentsInPerson: 0,
        },
    },
    {
        key: "online-group",
        label: "Online Groups",
        description: "Mid-size org, online group sessions only",
        values: {
            sessions1on1Online: 0, sessions1on1InPerson: 0,
            groupSessionsOnline: 50, groupSessionsInPerson: 0,
            studentsPerGroupOnline: 3, studentsPerGroupInPerson: 0,
            tutoringStaffOnline: 3, tutoringStaffInPerson: 0,
            nonTutoringStaffOnline: 1, nonTutoringStaffInPerson: 0,
            activeStudentsOnline: 60, activeStudentsInPerson: 0,
        },
    },
];

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

const SectionHeader = ({ label, tag }: { label: string; tag: string }) => (
    <div className="flex items-center gap-3 pt-5 pb-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{label}</span>
        <div className="flex-1 border-t border-border/40" />
        <Badge className="text-[10px] px-2 py-0 h-5 bg-primary/10 text-primary border-0 font-medium whitespace-nowrap">
            {tag}
        </Badge>
    </div>
);

const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => (
    <div className="relative group inline-flex items-center">
        {children}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 bg-popover border border-border rounded-lg p-2.5 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg leading-relaxed">
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border" />
        </div>
    </div>
);

interface InputRowProps {
    label: string;
    online: number;
    inPerson: number;
    onOnlineChange: (v: number) => void;
    onInPersonChange: (v: number) => void;
    tooltip?: string;
    indented?: boolean;
}

const InputRow = ({ label, online, inPerson, onOnlineChange, onInPersonChange, tooltip, indented }: InputRowProps) => {
    const handleChange = (setter: (v: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === "") { setter(0); return; }
        setter(Math.max(0, Number(raw)));
    };

    return (
        <div className={`grid grid-cols-[1fr_110px_110px] sm:grid-cols-[1fr_120px_120px] gap-3 items-center py-2.5 border-b border-border/40 last:border-0 ${indented ? "pl-3" : ""}`}>
            <div className="flex items-center gap-1.5 min-w-0">
                {indented && <span className="text-muted-foreground/60 text-xs select-none shrink-0">↳</span>}
                <Label className="text-sm text-foreground font-normal truncate">{label}</Label>
                {tooltip && (
                    <Tooltip content={tooltip}>
                        <Info className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help shrink-0" />
                    </Tooltip>
                )}
            </div>
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
    rawPrice: number;
    icon: React.ReactNode;
    description: string;
    formula: string;
    highlighted: boolean;
    hasInputs: boolean;
}

const PlanCard = ({ title, price, rawPrice, icon, description, formula, highlighted, hasInputs }: PlanCardProps) => (
    <Card
        className={`relative transition-all duration-300 ${highlighted
            ? "bg-primary/10 border-2 border-primary purple-glow"
            : hasInputs && rawPrice === 0
                ? "bg-card border-border/40 opacity-50"
                : "bg-card border-border hover:border-primary/30"
            }`}
    >
        {highlighted && (
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3">
                Best Value
            </Badge>
        )}
        <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg text-primary ${highlighted ? "bg-primary/20" : "bg-primary/10"}`}>
                    {icon}
                </div>
                <h3 className="font-semibold text-foreground">{title}</h3>
            </div>
            <div className="mb-2">
                {hasInputs ? (
                    <span className="text-3xl font-bold text-foreground">{price}</span>
                ) : (
                    <span className="text-3xl font-bold text-muted-foreground/40">—</span>
                )}
                {hasInputs && <span className="text-muted-foreground text-sm ml-1">/ month</span>}
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
            {hasInputs && rawPrice > 0 && formula && (
                <div className="mt-3 pt-3 border-t border-border/40">
                    <p className="text-[11px] text-muted-foreground/60 font-mono leading-relaxed">{formula}</p>
                </div>
            )}
            {hasInputs && rawPrice === 0 && (
                <p className="mt-3 text-[11px] text-muted-foreground/50 italic">No relevant inputs entered</p>
            )}
        </CardContent>
    </Card>
);

const PricingCalculator = () => {
    const [currencyCode, setCurrencyCode] = useState("USD");
    const [inputs, setInputs] = useState<InputState>(EMPTY_STATE);

    useEffect(() => {
        setCurrencyCode(detectCurrency());
    }, []);

    const set = (key: keyof InputState) => (v: number) =>
        setInputs(prev => ({ ...prev, [key]: v }));

    const currency = CURRENCIES.find((c) => c.code === currencyCode) ?? CURRENCIES[0];

    const fmt = (usdAmount: number, decimals = 2) => {
        const converted = usdAmount * currency.rate;
        return `${currency.symbol}${converted.toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        })}`;
    };
    const formatPrice = (usdAmount: number) => fmt(usdAmount, 0);

    const hasAnyInput = Object.values(inputs).some(v => v > 0);

    const pricing = useMemo(() => {
        const totalOnlineParticipantSessions =
            inputs.sessions1on1Online + inputs.groupSessionsOnline * inputs.studentsPerGroupOnline;
        const totalInPersonParticipantSessions =
            inputs.sessions1on1InPerson + inputs.groupSessionsInPerson * inputs.studentsPerGroupInPerson;
        const perSession =
            totalOnlineParticipantSessions * PRICES_USD.onlineSession +
            totalInPersonParticipantSessions * PRICES_USD.offlineSession;

        const totalStaffOnline = inputs.tutoringStaffOnline + inputs.nonTutoringStaffOnline;
        const totalStaffInPerson = inputs.tutoringStaffInPerson + inputs.nonTutoringStaffInPerson;
        const perSeat =
            totalStaffOnline * PRICES_USD.onlineSeat +
            totalStaffInPerson * PRICES_USD.offlineSeat;

        const perStudent =
            inputs.activeStudentsOnline * PRICES_USD.studentOnline +
            inputs.activeStudentsInPerson * PRICES_USD.studentOffline;

        return {
            perSession, perSeat, perStudent,
            totalOnlineParticipantSessions, totalInPersonParticipantSessions,
            totalStaffOnline, totalStaffInPerson,
        };
    }, [inputs]);

    const plans = useMemo(() => {
        const fmtLocal = (usd: number) => {
            const cur = CURRENCIES.find(c => c.code === currencyCode) ?? CURRENCIES[0];
            const converted = usd * cur.rate;
            return `${cur.symbol}${converted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        };

        const buildFormula = (parts: Array<{ count: number; label: string; unitUsd: number }>) => {
            const nonZero = parts.filter(p => p.count > 0);
            if (!nonZero.length) return "";
            return nonZero.map(p => `${p.count.toLocaleString()} ${p.label} × ${fmtLocal(p.unitUsd)}`).join("  +  ");
        };

        const allPlans = [
            {
                key: "session",
                title: "Per Session",
                price: pricing.perSession,
                icon: <DollarSign className="w-5 h-5" />,
                description: "Pay per participant-session each month. Ideal when session volume drives your costs.",
                formula: buildFormula([
                    { count: pricing.totalOnlineParticipantSessions, label: "online", unitUsd: PRICES_USD.onlineSession },
                    { count: pricing.totalInPersonParticipantSessions, label: "in-person", unitUsd: PRICES_USD.offlineSession },
                ]),
            },
            {
                key: "seat",
                title: "Per Seat",
                price: pricing.perSeat,
                icon: <UserCog className="w-5 h-5" />,
                description: "Pay per staff seat each month. Best when team size is stable and predictable.",
                formula: buildFormula([
                    { count: pricing.totalStaffOnline, label: "online staff", unitUsd: PRICES_USD.onlineSeat },
                    { count: pricing.totalStaffInPerson, label: "in-person staff", unitUsd: PRICES_USD.offlineSeat },
                ]),
            },
            {
                key: "student",
                title: "Per Student",
                price: pricing.perStudent,
                icon: <GraduationCap className="w-5 h-5" />,
                description: "Pay per active enrolled student each month. Natural fit for student-centric operations.",
                formula: buildFormula([
                    { count: inputs.activeStudentsOnline, label: "online", unitUsd: PRICES_USD.studentOnline },
                    { count: inputs.activeStudentsInPerson, label: "in-person", unitUsd: PRICES_USD.studentOffline },
                ]),
            },
        ];

        const nonZeroPrices = allPlans.filter(p => p.price > 0).map(p => p.price);
        const minPrice = nonZeroPrices.length > 0 ? Math.min(...nonZeroPrices) : -1;
        return allPlans.map(p => ({ ...p, highlighted: p.price > 0 && p.price === minPrice }));
    }, [pricing, currencyCode, inputs.activeStudentsOnline, inputs.activeStudentsInPerson]);

    const nonZeroPlanPrices = plans.filter(p => p.price > 0).map(p => p.price);
    const bestPlanUSD = nonZeroPlanPrices.length > 0 ? Math.min(...nonZeroPlanPrices) : 0;

    const VOLUME_THRESHOLD = 500;
    const showVolumeHint = bestPlanUSD > 150 && bestPlanUSD <= VOLUME_THRESHOLD;
    const showVolumeDiscount = bestPlanUSD > VOLUME_THRESHOLD;
    const volumeProgress = Math.min((bestPlanUSD / VOLUME_THRESHOLD) * 100, 100);

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
                        Enter your tutoring business details below to compare estimated monthly costs across our three flexible billing models.
                    </p>
                </div>

                {/* Presets + Currency bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground shrink-0">Try a preset:</span>
                        {PRESETS.map(preset => (
                            <Button
                                key={preset.key}
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs border-border/60 hover:border-primary/50 hover:text-primary"
                                onClick={() => setInputs(preset.values)}
                                title={preset.description}
                            >
                                {preset.label}
                            </Button>
                        ))}
                        {hasAnyInput && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => setInputs(EMPTY_STATE)}
                            >
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Reset
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Prices in:</span>
                        <Select value={currencyCode} onValueChange={setCurrencyCode}>
                            <SelectTrigger className="w-[130px] h-8 bg-card border-border text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CURRENCIES.map((c) => (
                                    <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
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
                            <p className="text-xs text-muted-foreground mb-4">Adjust the numbers to match your typical monthly setup</p>

                            {/* Column Headers */}
                            <div className="grid grid-cols-[1fr_110px_110px] sm:grid-cols-[1fr_120px_120px] gap-3 mb-1">
                                <span />
                                <div className="flex items-center justify-center gap-1.5 text-sm font-semibold text-foreground">
                                    <Monitor className="w-4 h-4" /> Online
                                </div>
                                <div className="flex items-center justify-center gap-1.5 text-sm font-semibold text-foreground">
                                    <Building2 className="w-4 h-4" /> In-person
                                </div>
                            </div>

                            {/* Sessions */}
                            <SectionHeader label="Sessions" tag="Per Session pricing" />
                            <InputRow
                                label="1:1 sessions"
                                online={inputs.sessions1on1Online}
                                inPerson={inputs.sessions1on1InPerson}
                                onOnlineChange={set("sessions1on1Online")}
                                onInPersonChange={set("sessions1on1InPerson")}
                            />
                            <InputRow
                                label="Group sessions"
                                online={inputs.groupSessionsOnline}
                                inPerson={inputs.groupSessionsInPerson}
                                onOnlineChange={set("groupSessionsOnline")}
                                onInPersonChange={set("groupSessionsInPerson")}
                            />
                            <InputRow
                                label="Students per group"
                                online={inputs.studentsPerGroupOnline}
                                inPerson={inputs.studentsPerGroupInPerson}
                                onOnlineChange={set("studentsPerGroupOnline")}
                                onInPersonChange={set("studentsPerGroupInPerson")}
                                indented
                                tooltip="The number of students in each group session. Multiplied by group sessions to get total participant-sessions."
                            />

                            {/* Staff */}
                            <SectionHeader label="Staff" tag="Per Seat pricing" />
                            <InputRow
                                label="Tutoring staff"
                                online={inputs.tutoringStaffOnline}
                                inPerson={inputs.tutoringStaffInPerson}
                                onOnlineChange={set("tutoringStaffOnline")}
                                onInPersonChange={set("tutoringStaffInPerson")}
                            />
                            <InputRow
                                label="Non-tutoring staff"
                                online={inputs.nonTutoringStaffOnline}
                                inPerson={inputs.nonTutoringStaffInPerson}
                                onOnlineChange={set("nonTutoringStaffOnline")}
                                onInPersonChange={set("nonTutoringStaffInPerson")}
                                tooltip="e.g. admin staff, coordinators, front-desk. Counted as staff seats alongside tutoring staff."
                            />

                            {/* Students */}
                            <SectionHeader label="Students" tag="Per Student pricing" />
                            <InputRow
                                label="Active students"
                                online={inputs.activeStudentsOnline}
                                inPerson={inputs.activeStudentsInPerson}
                                onOnlineChange={set("activeStudentsOnline")}
                                onInPersonChange={set("activeStudentsInPerson")}
                                tooltip="Students currently enrolled and active this month — regardless of how many sessions they attend."
                            />
                        </CardContent>
                    </Card>

                    {/* Unit Prices */}
                    <Card className="bg-card border-border h-fit">
                        <CardContent className="p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-4">Unit Prices</h2>

                            {[
                                {
                                    section: "Per Session",
                                    items: [
                                        { label: "Online session", price: PRICES_USD.onlineSession },
                                        { label: "In-person session", price: PRICES_USD.offlineSession },
                                    ],
                                },
                                {
                                    section: "Per Seat",
                                    items: [
                                        { label: "Online seat", price: PRICES_USD.onlineSeat },
                                        { label: "In-person seat", price: PRICES_USD.offlineSeat },
                                    ],
                                },
                                {
                                    section: "Per Student",
                                    items: [
                                        { label: "Online student", price: PRICES_USD.studentOnline },
                                        { label: "In-person student", price: PRICES_USD.studentOffline },
                                    ],
                                },
                            ].map((group, gi, groups) => (
                                <div key={group.section}>
                                    <p className="text-[11px] text-muted-foreground/70 uppercase tracking-wider font-semibold mb-1 mt-4 first:mt-0">
                                        {group.section}
                                    </p>
                                    {group.items.map((item, i, arr) => (
                                        <div key={item.label}>
                                            <div className="flex justify-between items-center py-2">
                                                <span className="text-sm text-foreground">{item.label}</span>
                                                <span className="text-sm font-semibold text-foreground">{fmt(item.price)}</span>
                                            </div>
                                            {i < arr.length - 1 && <Separator className="bg-border/50" />}
                                        </div>
                                    ))}
                                    {gi < groups.length - 1 && <Separator className="bg-border/30 mt-2" />}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Results */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-foreground mb-2 text-center">Your Estimated Monthly Costs</h2>
                    {!hasAnyInput && (
                        <p className="text-sm text-muted-foreground text-center mb-6">
                            Fill in your business details above to see costs across all three plans.
                        </p>
                    )}
                    {hasAnyInput && (
                        <p className="text-xs text-muted-foreground text-center mb-6">
                            The <span className="text-primary font-medium">Best Value</span> plan is automatically highlighted based on your inputs.
                        </p>
                    )}

                    <div className="grid md:grid-cols-3 gap-5">
                        {plans.map(p => (
                            <PlanCard
                                key={p.key}
                                title={p.title}
                                price={formatPrice(p.price)}
                                rawPrice={p.price}
                                icon={p.icon}
                                description={p.description}
                                formula={p.formula}
                                highlighted={p.highlighted}
                                hasInputs={hasAnyInput}
                            />
                        ))}
                    </div>

                    {/* Volume Discount Progress Hint */}
                    {showVolumeHint && (
                        <div className="mt-6 p-4 rounded-lg border border-border/60 bg-muted/30">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-muted-foreground">
                                    Volume discount unlocks at {fmt(VOLUME_THRESHOLD, 0)}/mo
                                </span>
                                <span className="text-xs font-semibold text-foreground">{Math.round(volumeProgress)}%</span>
                            </div>
                            <div className="h-1.5 bg-border rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-500"
                                    style={{ width: `${volumeProgress}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                You're {fmt(VOLUME_THRESHOLD - bestPlanUSD, 0)} away from qualifying for custom volume pricing.
                            </p>
                        </div>
                    )}
                </div>

                {/* Disclaimer */}
                <Alert className="bg-muted/50 border-border/60">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <AlertDescription className="text-xs text-muted-foreground">
                        These prices are indicative and for estimation purposes only. Actual prices may vary based on your specific requirements, usage patterns, and negotiated terms. Please{" "}
                        <a href="https://www.wise.live/contact/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            contact us
                        </a>{" "}
                        for a detailed quote.
                    </AlertDescription>
                </Alert>

                {/* Volume Discount Banner */}
                {showVolumeDiscount && (
                    <Card className="mt-6 border-primary/30 bg-primary/5">
                        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
                            <div className="p-3 rounded-full bg-primary/10 shrink-0">
                                <Sparkles className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h3 className="font-semibold text-foreground mb-1">You're Eligible for Volume Discounts!</h3>
                                <p className="text-sm text-muted-foreground">
                                    Based on your usage, you qualify for special volume-based pricing. Talk to our team to get a customized quote.
                                </p>
                            </div>
                            <Button asChild className="px-8 shrink-0">
                                <a href="https://cal.com/bilal.abidi/wise-discounts" target="_blank" rel="noopener noreferrer">
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
