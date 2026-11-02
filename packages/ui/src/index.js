"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cn = cn;
exports.formatCurrency = formatCurrency;
exports.formatNumberArabic = formatNumberArabic;
exports.formatCompactNumber = formatCompactNumber;
const clsx_1 = require("clsx");
const tailwind_merge_1 = require("tailwind-merge");
function cn(...inputs) {
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
function formatCurrency(amount, currency = "EGP") {
    return new Intl.NumberFormat("ar-EG", {
        style: "currency",
        currency: currency,
        maximumFractionDigits: 2
    }).format(amount);
}
function formatNumberArabic(value, decimals = 2) {
    return new Intl.NumberFormat("ar-EG", {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals
    }).format(value);
}
function formatCompactNumber(value) {
    if (value >= 1_000_000_000_000) {
        return `${(value / 1_000_000_000_000).toFixed(1)} تريليون`;
    }
    if (value >= 1_000_000_000) {
        return `${(value / 1_000_000_000).toFixed(1)} مليار`;
    }
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)} مليون`;
    }
    if (value >= 1_000) {
        return `${(value / 1_000).toFixed(1)} ألف`;
    }
    return value.toString();
}
