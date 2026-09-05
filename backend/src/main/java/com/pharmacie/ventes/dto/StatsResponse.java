package com.pharmacie.ventes.dto;

public class StatsResponse {
    private double todayTotal;
    private long todayCount;
    private double monthTotal;
    private long totalCount;

    public StatsResponse(double todayTotal, long todayCount, double monthTotal, long totalCount) {
        this.todayTotal = todayTotal;
        this.todayCount = todayCount;
        this.monthTotal = monthTotal;
        this.totalCount = totalCount;
    }

    public double getTodayTotal() { return todayTotal; }
    public long getTodayCount() { return todayCount; }
    public double getMonthTotal() { return monthTotal; }
    public long getTotalCount() { return totalCount; }
}
