import { useState, useMemo } from 'react';

export interface PricingState {
    online1to1: number;
    onlineGroup: number;
    onlineStaffTutor: number;
    onlineStaffAdmin: number;
    onlineStudents: number;
    offline1to1: number;
    offlineGroup: number;
    offlineStaffTutor: number;
    offlineStaffAdmin: number;
    offlineStudents: number;
}

export const usePricingLogic = () => {
    const [state, setState] = useState<PricingState>({
        online1to1: 100,
        onlineGroup: 50,
        onlineStaffTutor: 5,
        onlineStaffAdmin: 2,
        onlineStudents: 150,
        offline1to1: 50,
        offlineGroup: 20,
        offlineStaffTutor: 3,
        offlineStaffAdmin: 1,
        offlineStudents: 80,
    });

    const updateField = (field: keyof PricingState, value: number) => {
        setState((prev) => ({ ...prev, [field]: value }));
    };

    const calculations = useMemo(() => {
        // Unit Prices from the reference tool
        const rates = {
            session: { online: 1.8, offline: 0.8 },
            seat: { online: 40, offline: 25 },
            student: { online: 5, offline: 2 },
        };

        const sessionCost =
            (state.online1to1 + state.onlineGroup) * rates.session.online +
            (state.offline1to1 + state.offlineGroup) * rates.session.offline;

        const seatCost =
            (state.onlineStaffTutor + state.onlineStaffAdmin) * rates.seat.online +
            (state.offlineStaffTutor + state.offlineStaffAdmin) * rates.seat.offline;

        const studentCost =
            state.onlineStudents * rates.student.online +
            state.offlineStudents * rates.student.offline;

        const costs = [
            { id: 'session', label: 'Per Session', cost: Math.round(sessionCost) },
            { id: 'seat', label: 'Per Seat', cost: Math.round(seatCost) },
            { id: 'student', label: 'Per Student', cost: Math.round(studentCost) },
        ];

        const bestValueId = [...costs].sort((a, b) => a.cost - b.cost)[0].id;

        return {
            costs,
            bestValueId,
        };
    }, [state]);

    return {
        state,
        updateField,
        calculations,
    };
};
