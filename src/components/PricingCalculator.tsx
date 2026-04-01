import { useState, useMemo, useEffect, useRef, type ChangeEvent, type ReactNode } from "react";
import {
    Calculator, DollarSign, Monitor, Building2, Info,
    Sparkles, UserCog, GraduationCap, RotateCcw,
    ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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

const PRESETS: Array<{
    key: string;
    label: string;
    blurb: string;
    values: InputState;
}> = [
    {
        key: "online-only",
        label: "Online Only",
        blurb: "All sessions and staff are online — no in-person fields.",
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
        blurb: "Both online and in-person delivery.",
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
        blurb: "Centre- or site-based only — online fields hidden.",
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
        blurb: "Private online lessons only — no group rows.",
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
        blurb: "Group classes online — no 1:1 line item.",
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

function maskFromPreset(values: InputState): Record<keyof InputState, boolean> {
    return {
        sessions1on1Online: values.sessions1on1Online > 0,
        sessions1on1InPerson: values.sessions1on1InPerson > 0,
        groupSessionsOnline: values.groupSessionsOnline > 0,
        groupSessionsInPerson: values.groupSessionsInPerson > 0,
        studentsPerGroupOnline: values.studentsPerGroupOnline > 0,
        studentsPerGroupInPerson: values.studentsPerGroupInPerson > 0,
        tutoringStaffOnline: values.tutoringStaffOnline > 0,
        tutoringStaffInPerson: values.tutoringStaffInPerson > 0,
        nonTutoringStaffOnline: values.nonTutoringStaffOnline > 0,
        nonTutoringStaffInPerson: values.nonTutoringStaffInPerson > 0,
        activeStudentsOnline: values.activeStudentsOnline > 0,
        activeStudentsInPerson: values.activeStudentsInPerson > 0,
    };
}

function detectCurrency(): string {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
        const locale = navigator.language || "";
        if (tz.startsWith("Asia/Kolkata") || tz.startsWith("Asia/Calcutta") || locale.startsWith("hi") || locale === "en-IN") return "INR";
        if (tz.startsWith("Europe/London") || locale === "en-GB") return "GBP";
        if (tz.startsWith("Europe/") && !tz.startsWith("Europe/London")) return "EUR";
        if (tz.startsWith("Australia/") || locale === "en-AU") return "AUD";
        if (tz.startsWith("America/Toronto") || tz.startsWith("America/Vancouver") || locale === "en-CA") return "CAD";
    } catch {
        /* ignore: fall back to USD */
    }
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

const Tooltip = ({ children, content }: { children: ReactNode; content: string }) => (
    <div className="relative group inline-flex items-center">
        {children}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 bg-popover border border-border rounded-lg p-2.5 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg leading-relaxed max-md:hidden">
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
    const handleChange = (setter: (v: number) => void) => (e: ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === "") { setter(0); return; }
        setter(Math.max(0, Number(raw)));
    };

    return (
        <div className={`hidden md:grid grid-cols-[1fr_110px_110px] sm:grid-cols-[1fr_120px_120px] gap-3 items-center py-2.5 border-b border-border/40 last:border-0 ${indented ? "pl-3" : ""}`}>
            <div className="flex items-center gap-1.5 min-w-0">
                {indented && <span className="text-muted-foreground/60 text-xs select-none shrink-0">↳</span>}
                <Label className="text-sm text-foreground font-normal truncate">{label}</Label>
                {tooltip && (
                    <Tooltip content={tooltip}>
                        <span className="inline-flex" title={tooltip}>
                            <Info className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help shrink-0" />
                        </span>
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

type MobilePresetKind = "sessions" | "seats" | "students";

const MOBILE_PRESET_OPTIONS: Record<MobilePresetKind, number[]> = {
    sessions: [50, 100, 200, 500, 1000],
    seats: [1, 3, 5, 10, 20],
    students: [50, 100, 200, 500, 1000],
};

interface MobileFieldRowProps {
    label: string;
    value: number;
    onChange: (v: number) => void;
    tooltip?: string;
    indented?: boolean;
    presetKind: MobilePresetKind;
}

const MobileFieldRow = ({ label, value, onChange, tooltip, indented, presetKind }: MobileFieldRowProps) => {
    const [open, setOpen] = useState(false);
    const [customDraft, setCustomDraft] = useState("");
    const presets = MOBILE_PRESET_OPTIONS[presetKind];

    const handleOpenChange = (next: boolean) => {
        setOpen(next);
        if (next) setCustomDraft(value === 0 ? "" : String(value));
    };

    const pickPreset = (n: number) => {
        onChange(n);
        setOpen(false);
    };

    const applyCustom = () => {
        const raw = customDraft.trim();
        if (raw === "") {
            onChange(0);
            setOpen(false);
            return;
        }
        const n = Math.floor(Number(raw));
        if (Number.isNaN(n) || n < 0) return;
        onChange(n);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "flex w-full items-center justify-between gap-3 py-2.5 border-b border-border/40 last:border-0 text-left min-h-10 touch-manipulation rounded-sm",
                        "hover:bg-muted/35 active:bg-muted/50 transition-colors",
                        indented && "pl-3",
                    )}
                >
                    <div className="flex items-start gap-1.5 min-w-0 flex-1">
                        {indented && <span className="text-muted-foreground/60 text-xs select-none shrink-0 mt-0.5">↳</span>}
                        <span className="text-sm text-foreground font-normal leading-snug break-words text-left">{label}</span>
                        {tooltip && (
                            <Tooltip content={tooltip}>
                                <span className="inline-flex mt-0.5 shrink-0" title={tooltip}>
                                    <Info className="w-4 h-4 text-muted-foreground/60 cursor-help" />
                                </span>
                            </Tooltip>
                        )}
                    </div>
                    <span className="flex items-center gap-1 shrink-0 text-sm font-semibold tabular-nums text-foreground">
                        {value}
                        <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
                    </span>
                </button>
            </PopoverTrigger>
            <PopoverContent align="end" side="bottom" className="p-0">
                <div className="max-h-[min(50vh,260px)] overflow-y-auto py-1">
                    {presets.map((n) => (
                        <button
                            key={n}
                            type="button"
                            className="w-full px-3 py-2.5 text-left text-sm text-foreground hover:bg-muted"
                            onClick={() => pickPreset(n)}
                        >
                            {n}
                        </button>
                    ))}
                </div>
                <Separator />
                <div className="p-3 space-y-2">
                    <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Custom</p>
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            min={0}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={customDraft}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomDraft(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && applyCustom()}
                            placeholder="Enter value"
                            className="h-9 flex-1 bg-muted border-border [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <Button type="button" size="sm" className="shrink-0 px-3" onClick={applyCustom}>
                            Apply
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};

const MobileChannelHeading = ({ icon, title }: { icon: ReactNode; title: string }) => (
    <div className="flex items-center gap-2 text-sm font-semibold text-foreground mt-5 first:mt-0 mb-1.5">
        {icon}
        {title}
    </div>
);

const MobileSectionHeader = ({ title, tag, suppressTopRule }: { title: string; tag: string; suppressTopRule?: boolean }) => (
    <div
        className={cn(
            "mt-8 border-t border-border/50 pt-6",
            suppressTopRule && "mt-4 border-t-0 pt-0",
        )}
    >
        <div className="flex flex-row items-start justify-between gap-3">
            <h3 className="text-base font-semibold text-foreground tracking-tight min-w-0 flex-1">{title}</h3>
            <Badge className="text-[10px] px-2 py-0.5 h-6 bg-primary/15 text-primary border border-primary/25 font-medium shrink-0 text-right max-w-[58%] sm:max-w-[50%] leading-tight">
                {tag}
            </Badge>
        </div>
    </div>
);

const UNIT_PRICE_GROUPS = [
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
] as const;

function UnitPricesPanel({ fmt }: { fmt: (usdAmount: number, decimals?: number) => string }) {
    return (
        <>
            <h2 className="text-lg font-semibold text-foreground mb-4">Unit Prices</h2>
            {UNIT_PRICE_GROUPS.map((group, gi, groups) => (
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
        </>
    );
}

interface PlanCardProps {
    title: string;
    price: string;
    rawPrice: number;
    icon: ReactNode;
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

type MobileStep = "business-type" | "details" | "monthly-pricing";

const TALK_TO_US_CAL_URL =
    "https://cal.com/bilal.abidi/wise-discounts?overlayCalendar=true";

function CompactCurrencyPicker({
    currencyCode,
    setCurrencyCode,
    size = "default",
}: {
    currencyCode: string;
    setCurrencyCode: (code: string) => void;
    size?: "default" | "footer";
}) {
    const cur = CURRENCIES.find((c) => c.code === currencyCode) ?? CURRENCIES[0];
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "inline-flex items-center gap-0.5 rounded-sm text-primary hover:text-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background touch-manipulation",
                        size === "footer" ? "text-xs" : "text-sm",
                    )}
                    aria-label={`Prices in ${cur.code}, change currency`}
                >
                    <span className="font-semibold tabular-nums">{cur.code}</span>
                    <ChevronDown className="h-3 w-3 opacity-60 shrink-0" aria-hidden />
                </button>
            </PopoverTrigger>
            <PopoverContent align="end" side="top" className="z-[60] w-[min(100vw-2rem,220px)] p-1">
                {CURRENCIES.map((c) => (
                    <button
                        key={c.code}
                        type="button"
                        className={cn(
                            "w-full rounded-sm px-2.5 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors",
                            c.code === currencyCode && "bg-muted font-medium",
                        )}
                        onClick={() => setCurrencyCode(c.code)}
                    >
                        {c.label}
                    </button>
                ))}
            </PopoverContent>
        </Popover>
    );
}

const PricingCalculator = () => {
    const [currencyCode, setCurrencyCode] = useState(() => detectCurrency());
    const [inputs, setInputs] = useState<InputState>(EMPTY_STATE);
    const [mobileStep, setMobileStep] = useState<MobileStep>("business-type");
    const [fieldMask, setFieldMask] = useState<Record<keyof InputState, boolean> | null>(null);
    const [selectedPresetKey, setSelectedPresetKey] = useState<string>(PRESETS[0].key);
    const [estimatesInView, setEstimatesInView] = useState(false);
    const estimatesSectionRef = useRef<HTMLDivElement>(null);

    const scrollToMonthlyEstimates = () => {
        estimatesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    useEffect(() => {
        if (typeof window === "undefined") return;
        const el = estimatesSectionRef.current;
        if (!el || mobileStep !== "monthly-pricing") return;
        queueMicrotask(() => setEstimatesInView(false));
        const obs = new IntersectionObserver(
            ([entry]) => {
                setEstimatesInView(entry.isIntersecting && entry.intersectionRatio > 0.08);
            },
            { root: null, threshold: [0, 0.08, 0.15, 0.25], rootMargin: "0px 0px -8% 0px" },
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [mobileStep]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!window.matchMedia("(max-width: 767px)").matches) return;
        const v = PRESETS[0].values;
        const m = maskFromPreset(v);
        queueMicrotask(() => {
            setInputs(v);
            setFieldMask(m);
            setSelectedPresetKey(PRESETS[0].key);
        });
    }, []);

    const set = (key: keyof InputState) => (v: number) =>
        setInputs(prev => ({ ...prev, [key]: v }));

    const selectedPreset = PRESETS.find((p) => p.key === selectedPresetKey) ?? PRESETS[0];

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

    const bestPlan = plans.find(p => p.highlighted && p.price > 0);

    const nonZeroPlanPrices = plans.filter(p => p.price > 0).map(p => p.price);
    const bestPlanUSD = nonZeroPlanPrices.length > 0 ? Math.min(...nonZeroPlanPrices) : 0;

    const VOLUME_THRESHOLD = 500;
    const showVolumeHint = bestPlanUSD > 150 && bestPlanUSD <= VOLUME_THRESHOLD;
    const showVolumeDiscount = bestPlanUSD > VOLUME_THRESHOLD;
    const volumeProgress = Math.min((bestPlanUSD / VOLUME_THRESHOLD) * 100, 100);

    return (
        <div className="min-h-screen bg-background py-12 px-4 pb-28 md:pb-12">
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

                {/* Presets + Currency bar (tablet/desktop) */}
                <div className="hidden md:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                    <div className="w-full min-w-0 overflow-x-auto pb-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-muted-foreground shrink-0">Try a preset:</span>
                            {PRESETS.map(preset => (
                                <Button
                                    key={preset.key}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs shrink-0 border-border/60 hover:border-primary/50 hover:text-primary"
                                    onClick={() => setInputs(preset.values)}
                                    title={preset.blurb}
                                >
                                    {preset.label}
                                </Button>
                            ))}
                            {hasAnyInput && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs shrink-0 text-muted-foreground hover:text-foreground"
                                    onClick={() => {
                                        setMobileStep("business-type");
                                        setSelectedPresetKey(PRESETS[0].key);
                                        if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
                                            setInputs(PRESETS[0].values);
                                            setFieldMask(maskFromPreset(PRESETS[0].values));
                                        } else {
                                            setInputs(EMPTY_STATE);
                                            setFieldMask(null);
                                        }
                                    }}
                                >
                                    <RotateCcw className="w-3 h-3 mr-1" />
                                    Reset
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">Prices in</span>
                        <CompactCurrencyPicker currencyCode={currencyCode} setCurrencyCode={setCurrencyCode} />
                    </div>
                </div>

                {/* Mobile — steps 1 & 2 (step 3 = monthly pricing below) */}
                <div className="md:hidden mb-10 space-y-6">
                    {mobileStep === "business-type" && (
                        <Card className="bg-card border-border">
                            <CardContent className="p-6 space-y-5">
                                <p className="text-xs font-medium text-primary uppercase tracking-wider">Step 1 · Business type</p>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground mb-1">What type of business do you run?</h2>
                                    <p className="text-sm text-muted-foreground">Pick the profile that fits you best.</p>
                                </div>
                                <fieldset className="space-y-2">
                                    <legend className="sr-only">Business type</legend>
                                    {PRESETS.map((preset) => (
                                        <label
                                            key={preset.key}
                                            className={cn(
                                                "flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors touch-manipulation",
                                                selectedPresetKey === preset.key
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border/60 bg-card/50 hover:bg-muted/20",
                                            )}
                                        >
                                            <input
                                                type="radio"
                                                name="business-type"
                                                className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                                                checked={selectedPresetKey === preset.key}
                                                onChange={() => {
                                                    setSelectedPresetKey(preset.key);
                                                    setInputs(preset.values);
                                                    setFieldMask(maskFromPreset(preset.values));
                                                }}
                                            />
                                            <span className="font-medium text-foreground text-sm leading-snug">{preset.label}</span>
                                        </label>
                                    ))}
                                </fieldset>
                                <div className="rounded-lg border border-border/50 bg-muted/25 px-3 py-2.5 text-sm text-muted-foreground leading-snug">
                                    {selectedPreset.blurb}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {(mobileStep === "details" || mobileStep === "monthly-pricing") && (
                        <Card className="bg-card border-border/60">
                            <CardContent className="p-4 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Step 1 · Profile</p>
                                    <p className="text-sm font-semibold text-foreground truncate">{selectedPreset.label}</p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0"
                                    onClick={() => setMobileStep("business-type")}
                                >
                                    Change
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {(mobileStep === "details" || mobileStep === "monthly-pricing") && fieldMask && (
                        <Card className="bg-card border-border">
                            <CardContent className="p-6 space-y-1">
                                <p className="text-xs font-medium text-primary uppercase tracking-wider mb-3">Step 2 · Business details</p>
                                <div className="mb-5">
                                    <h2 className="text-lg font-semibold text-foreground mb-1">Your Business Details</h2>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Only fields that match your profile are shown. Tap a value to change it.
                                    </p>
                                </div>

                                {(() => {
                                    const m = fieldMask;
                                    const showSessions =
                                        m.sessions1on1Online || m.sessions1on1InPerson ||
                                        m.groupSessionsOnline || m.groupSessionsInPerson ||
                                        m.studentsPerGroupOnline || m.studentsPerGroupInPerson;
                                    const showStaff =
                                        m.tutoringStaffOnline || m.tutoringStaffInPerson ||
                                        m.nonTutoringStaffOnline || m.nonTutoringStaffInPerson;
                                    const showStudents = m.activeStudentsOnline || m.activeStudentsInPerson;

                                    return (
                                        <>
                                            {showSessions && (
                                                <>
                                                    <MobileSectionHeader title="Sessions" tag="Per Session pricing" suppressTopRule />
                                                    {(m.sessions1on1Online || m.groupSessionsOnline || m.studentsPerGroupOnline) && (
                                                        <MobileChannelHeading icon={<Monitor className="w-4 h-4" />} title="Online" />
                                                    )}
                                                    {m.sessions1on1Online && (
                                                        <MobileFieldRow
                                                            label="1:1 sessions"
                                                            value={inputs.sessions1on1Online}
                                                            onChange={set("sessions1on1Online")}
                                                            presetKind="sessions"
                                                        />
                                                    )}
                                                    {m.groupSessionsOnline && (
                                                        <MobileFieldRow
                                                            label="Group sessions"
                                                            value={inputs.groupSessionsOnline}
                                                            onChange={set("groupSessionsOnline")}
                                                            presetKind="sessions"
                                                        />
                                                    )}
                                                    {m.studentsPerGroupOnline && (
                                                        <MobileFieldRow
                                                            label="Students per group"
                                                            value={inputs.studentsPerGroupOnline}
                                                            onChange={set("studentsPerGroupOnline")}
                                                            indented
                                                            tooltip="The number of students in each group session. Multiplied by group sessions to get total participant-sessions."
                                                            presetKind="sessions"
                                                        />
                                                    )}
                                                    {(m.sessions1on1InPerson || m.groupSessionsInPerson || m.studentsPerGroupInPerson) && (
                                                        <MobileChannelHeading icon={<Building2 className="w-4 h-4" />} title="In-person" />
                                                    )}
                                                    {m.sessions1on1InPerson && (
                                                        <MobileFieldRow
                                                            label="1:1 sessions"
                                                            value={inputs.sessions1on1InPerson}
                                                            onChange={set("sessions1on1InPerson")}
                                                            presetKind="sessions"
                                                        />
                                                    )}
                                                    {m.groupSessionsInPerson && (
                                                        <MobileFieldRow
                                                            label="Group sessions"
                                                            value={inputs.groupSessionsInPerson}
                                                            onChange={set("groupSessionsInPerson")}
                                                            presetKind="sessions"
                                                        />
                                                    )}
                                                    {m.studentsPerGroupInPerson && (
                                                        <MobileFieldRow
                                                            label="Students per group"
                                                            value={inputs.studentsPerGroupInPerson}
                                                            onChange={set("studentsPerGroupInPerson")}
                                                            indented
                                                            tooltip="The number of students in each group session. Multiplied by group sessions to get total participant-sessions."
                                                            presetKind="sessions"
                                                        />
                                                    )}
                                                </>
                                            )}

                                            {showStaff && (
                                                <>
                                                    <MobileSectionHeader
                                                        title="Staff"
                                                        tag="Per Seat pricing"
                                                        suppressTopRule={!showSessions}
                                                    />
                                                    {(m.tutoringStaffOnline || m.nonTutoringStaffOnline) && (
                                                        <MobileChannelHeading icon={<Monitor className="w-4 h-4" />} title="Online" />
                                                    )}
                                                    {m.tutoringStaffOnline && (
                                                        <MobileFieldRow
                                                            label="Tutoring staff"
                                                            value={inputs.tutoringStaffOnline}
                                                            onChange={set("tutoringStaffOnline")}
                                                            presetKind="seats"
                                                        />
                                                    )}
                                                    {m.nonTutoringStaffOnline && (
                                                        <MobileFieldRow
                                                            label="Non-tutoring staff"
                                                            value={inputs.nonTutoringStaffOnline}
                                                            onChange={set("nonTutoringStaffOnline")}
                                                            tooltip="e.g. admin staff, coordinators, front-desk. Counted as staff seats alongside tutoring staff."
                                                            presetKind="seats"
                                                        />
                                                    )}
                                                    {(m.tutoringStaffInPerson || m.nonTutoringStaffInPerson) && (
                                                        <MobileChannelHeading icon={<Building2 className="w-4 h-4" />} title="In-person" />
                                                    )}
                                                    {m.tutoringStaffInPerson && (
                                                        <MobileFieldRow
                                                            label="Tutoring staff"
                                                            value={inputs.tutoringStaffInPerson}
                                                            onChange={set("tutoringStaffInPerson")}
                                                            presetKind="seats"
                                                        />
                                                    )}
                                                    {m.nonTutoringStaffInPerson && (
                                                        <MobileFieldRow
                                                            label="Non-tutoring staff"
                                                            value={inputs.nonTutoringStaffInPerson}
                                                            onChange={set("nonTutoringStaffInPerson")}
                                                            tooltip="e.g. admin staff, coordinators, front-desk. Counted as staff seats alongside tutoring staff."
                                                            presetKind="seats"
                                                        />
                                                    )}
                                                </>
                                            )}

                                            {showStudents && (
                                                <>
                                                    <MobileSectionHeader
                                                        title="Students"
                                                        tag="Per Student pricing"
                                                        suppressTopRule={!showSessions && !showStaff}
                                                    />
                                                    {m.activeStudentsOnline && (
                                                        <>
                                                            <MobileChannelHeading icon={<Monitor className="w-4 h-4" />} title="Online" />
                                                            <MobileFieldRow
                                                                label="Active students"
                                                                value={inputs.activeStudentsOnline}
                                                                onChange={set("activeStudentsOnline")}
                                                                tooltip="Students currently enrolled and active this month — regardless of how many sessions they attend."
                                                                presetKind="students"
                                                            />
                                                        </>
                                                    )}
                                                    {m.activeStudentsInPerson && (
                                                        <>
                                                            <MobileChannelHeading icon={<Building2 className="w-4 h-4" />} title="In-person" />
                                                            <MobileFieldRow
                                                                label="Active students"
                                                                value={inputs.activeStudentsInPerson}
                                                                onChange={set("activeStudentsInPerson")}
                                                                tooltip="Students currently enrolled and active this month — regardless of how many sessions they attend."
                                                                presetKind="students"
                                                            />
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </>
                                    );
                                })()}
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="hidden md:grid lg:grid-cols-[1fr_260px] gap-6 mb-10">
                    {/* Calculator Inputs */}
                    <Card className="bg-card border-border">
                        <CardContent className="p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-1">Your Business Details</h2>
                            <p className="text-xs text-muted-foreground mb-4">Adjust the numbers to match your typical monthly setup</p>

                            <div className="hidden md:block">
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
                            </div>
                        </CardContent>
                    </Card>

                    {/* Unit Prices */}
                    <Card className="bg-card border-border h-fit">
                        <CardContent className="p-6">
                            <UnitPricesPanel fmt={fmt} />
                        </CardContent>
                    </Card>
                </div>

                {/* Results (mobile: step 3 — shown after "See monthly pricing") */}
                <div
                    ref={estimatesSectionRef}
                    className={cn(
                        "mb-8 scroll-mt-24",
                        mobileStep !== "monthly-pricing" && "max-md:hidden",
                    )}
                    id="estimated-monthly-costs"
                >
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

                    {/* Desktop — summary + currency + Talk to us (replaces fixed bottom bar) */}
                    <Card className="mt-6 hidden md:block border-border/60 bg-card shadow-sm">
                        <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Summary</p>
                                {hasAnyInput && bestPlan ? (
                                    <>
                                        <p className="text-xs text-muted-foreground mb-0.5">Best estimate</p>
                                        <p className="text-lg font-semibold text-foreground">
                                            {bestPlan.title} · {formatPrice(bestPlan.price)}
                                            <span className="text-muted-foreground font-normal text-base"> / mo</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-2 max-w-xl">
                                            Want a tailored quote or volume pricing? Our team can walk you through options.
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Enter your business details above to see your best-fit plan and estimated monthly cost.
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 sm:pl-4 sm:border-l sm:border-border/50">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">Prices in</span>
                                    <CompactCurrencyPicker currencyCode={currencyCode} setCurrencyCode={setCurrencyCode} />
                                </div>
                                <Button className="w-full sm:w-auto px-6 shadow-md shadow-primary/15" asChild>
                                    <a href={TALK_TO_US_CAL_URL} target="_blank" rel="noopener noreferrer">
                                        Talk to us
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

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

                {/* Mobile — unit price reference below estimates (step 3) */}
                <div className="md:hidden mb-10">
                    {mobileStep === "monthly-pricing" && fieldMask && (
                        <Card className="bg-card border-border">
                            <CardContent className="p-6">
                                <UnitPricesPanel fmt={fmt} />
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Disclaimer (mobile: only on monthly pricing step) */}
                <Alert
                    className={cn(
                        "bg-muted/50 border-border/60",
                        mobileStep !== "monthly-pricing" && "max-md:hidden",
                    )}
                >
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
                                <a href={TALK_TO_US_CAL_URL} target="_blank" rel="noopener noreferrer">
                                    Talk to us
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                )}

            </div>

            <div
                className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/85 shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.45)]"
                style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
            >
                <div className="max-w-5xl mx-auto px-4 pt-3 pb-3">
                    {mobileStep === "business-type" && (
                        <Button
                            type="button"
                            className="w-full touch-manipulation"
                            onClick={() => {
                                setFieldMask(maskFromPreset(selectedPreset.values));
                                setMobileStep("details");
                            }}
                        >
                            Continue to business details
                        </Button>
                    )}
                    {mobileStep === "details" && (
                        <Button
                            type="button"
                            className="w-full touch-manipulation"
                            onClick={() => {
                                setMobileStep("monthly-pricing");
                                requestAnimationFrame(() => {
                                    scrollToMonthlyEstimates();
                                });
                            }}
                        >
                            See monthly pricing
                        </Button>
                    )}
                    {mobileStep === "monthly-pricing" && !estimatesInView && (
                        <Button
                            type="button"
                            className="w-full touch-manipulation"
                            onClick={() => {
                                scrollToMonthlyEstimates();
                            }}
                        >
                            See monthly pricing
                        </Button>
                    )}
                    {mobileStep === "monthly-pricing" && estimatesInView && (
                        <div className="flex flex-col gap-2.5 w-full">
                            <div className="flex flex-wrap items-end justify-between gap-x-2 gap-y-2">
                                <div className="min-w-0 flex-1 basis-[min(100%,12rem)]">
                                    {hasAnyInput && bestPlan ? (
                                        <>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Best estimate</p>
                                            <p className="text-sm font-semibold text-foreground truncate">
                                                {bestPlan.title} · {formatPrice(bestPlan.price)}
                                                <span className="text-muted-foreground font-normal"> / mo</span>
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Add numbers in business details for estimates</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-auto">
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">Prices in</span>
                                    <CompactCurrencyPicker
                                        currencyCode={currencyCode}
                                        setCurrencyCode={setCurrencyCode}
                                        size="footer"
                                    />
                                </div>
                            </div>
                            <Button
                                className="w-full h-11 text-sm font-semibold shadow-md shadow-primary/25 touch-manipulation"
                                asChild
                            >
                                <a href={TALK_TO_US_CAL_URL} target="_blank" rel="noopener noreferrer">
                                    Talk to us
                                </a>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PricingCalculator;
