import { useEffect, useState } from 'react';

// Diferentes ofertas simuladas para generar contraste (gangas vs premium)
const BUNDLE_POOL = [
    {
        id: "bundle_1_starter",
        title: "Pack de Arranque",
        priceText: "$ 19.900",
        rewards: [
            { id: "coins", icon: "🪙", qty: 2500 },
            { id: "diamonds", icon: "💎", qty: 25 },
            { id: "truco_hint", icon: "💡", qty: 10 },
        ]
    },
    {
        id: "bundle_2_locura",
        title: "¡Locura de Fin de Semana!",
        priceText: "$ 49.900",
        rewards: [
            { id: "coins", icon: "🪙", qty: 8000 },
            { id: "diamonds", icon: "💎", qty: 150 },
            { id: "truco_reveal", icon: "🔓", qty: 25 },
        ]
    },
    {
        id: "bundle_3_master",
        title: "Cofre del Maestro",
        priceText: "$ 99.900",
        rewards: [
            { id: "coins", icon: "🪙", qty: 25000 },
            { id: "diamonds", icon: "💎", qty: 500 },
            { id: "truco_complete", icon: "⭐", qty: 15 },
        ]
    },
    {
        id: "bundle_4_ganga",
        title: "Ganga Express",
        priceText: "$ 9.900",
        rewards: [
            { id: "coins", icon: "🪙", qty: 1500 },
            { id: "truco_hint", icon: "💡", qty: 5 },
        ]
    }
];

// Tiempo de rotación: 2 días (en ms)
const ROTATION_PERIOD_MS = 2 * 24 * 60 * 60 * 1000;
// Año base para calcular la época
const EPOCH_START = new Date("2024-01-01T00:00:00Z").getTime();

function formatTimeLeft(ms) {
    if (ms <= 0) return "0s";
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);

    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
}

export default function useDynamicBundle() {
    const [timeLeftStr, setTimeLeftStr] = useState("");
    const [currentBundle, setCurrentBundle] = useState(BUNDLE_POOL[0]);

    useEffect(() => {
        function update() {
            const now = Date.now();
            // Cuántos periodos han pasado desde la época
            const periodsElapsed = Math.floor((now - EPOCH_START) / ROTATION_PERIOD_MS);

            // Cuándo termina este periodo
            const nextRotation = EPOCH_START + (periodsElapsed + 1) * ROTATION_PERIOD_MS;
            const msLeft = nextRotation - now;

            // Qué bundle le toca a este periodo (pseudo-random pero determinista para todos)
            // Usamos el modulo de la cantidad de bundles
            const bundleIndex = periodsElapsed % BUNDLE_POOL.length;

            setCurrentBundle(BUNDLE_POOL[bundleIndex]);
            setTimeLeftStr(formatTimeLeft(msLeft));
        }

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, []);

    return { bundle: currentBundle, timeLeftStr };
}
