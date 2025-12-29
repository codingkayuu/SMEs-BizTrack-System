/**
 * AI Service Client
 * Bridges the React frontend with the Python FastAPI microservice
 */

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';

export interface AICategoryPrediction {
    description: string;
    suggested_category: string;
    confidence: number;
}

export const aiService = {
    /**
     * Predict category for a transaction description
     */
    async predictCategory(description: string): Promise<AICategoryPrediction | null> {
        if (!description || description.length < 3) return null;

        try {
            const response = await fetch(`${AI_SERVICE_URL}/predict/category`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    transactions: [{ description }]
                }),
            });

            if (!response.ok) throw new Error('AI Service request failed');

            const data = await response.json();
            return data.predictions[0] || null;
        } catch (error) {
            console.warn('[AI Service] Prediction unavailable:', error);
            return null;
        }
    },

    /**
     * Get cash flow forecast for a business
     */
    async getForecast(businessId: string, days: number = 30) {
        try {
            const response = await fetch(`${AI_SERVICE_URL}/predict/forecast`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    business_id: businessId,
                    days
                }),
            });

            if (!response.ok) throw new Error('AI Service forecast failed');

            return await response.json();
        } catch (error) {
            console.warn('[AI Service] Forecast unavailable:', error);
            return null;
        }
    },

    /**
     * Get anomaly detection insights
     */
    async getInsights(businessId: string, expenseHistory: any[]) {
        try {
            const response = await fetch(`${AI_SERVICE_URL}/predict/insights`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    business_id: businessId,
                    expense_history: expenseHistory
                }),
            });

            if (!response.ok) throw new Error('AI Service insights failed');

            return await response.json();
        } catch (error) {
            console.warn('[AI Service] Insights unavailable:', error);
            return null;
        }
    },

    /**
     * Map AI model string to frontend-compatible category
     */
    mapToFrontendCategory(aiCategory: string, availableCategories: string[]): string | null {
        const normalized = aiCategory.toLowerCase().replace('_', '');
        return availableCategories.find(cat =>
            cat.toLowerCase().replace('_', '').replace(' ', '') === normalized
        ) || null;
    }
};
